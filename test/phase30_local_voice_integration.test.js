import assert from 'node:assert';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { float32ToWavArrayBuffer } from '../src/services/localVoice/pcm16Wav.js';
import { QUALIFIED_INTERFACE_PROMPTS, TTS_MODELS } from '../src/services/localVoice/localVoiceManifest.js';

console.log('--- RUNNING PHASE 30: LOCAL VOICE INTEGRATION & PRODUCTION PACKAGING TESTS ---');
let executed = 0;
let conditionalSkips = 0;

// 1. pcm16Wav behavioral: valid RIFF/WAVE PCM16 header + sample round-trip
{
  const samples = new Float32Array([0, 0.5, -0.5, 1, -1]);
  const buf = float32ToWavArrayBuffer(samples, 24000);
  const v = new DataView(buf);
  const str = (o, n) => Array.from({ length: n }, (_, i) => String.fromCharCode(v.getUint8(o + i))).join('');
  assert.strictEqual(str(0, 4), 'RIFF');
  assert.strictEqual(v.getUint32(4, true), 36 + samples.length * 2);
  assert.strictEqual(str(8, 4), 'WAVE');
  assert.strictEqual(str(12, 4), 'fmt ');
  assert.strictEqual(v.getUint16(20, true), 1, 'PCM format');
  assert.strictEqual(v.getUint16(22, true), 1, 'mono');
  assert.strictEqual(v.getUint32(24, true), 24000, 'sample rate preserved');
  assert.strictEqual(v.getUint16(34, true), 16, '16-bit');
  assert.strictEqual(str(36, 4), 'data');
  assert.strictEqual(v.getUint32(40, true), samples.length * 2);
  assert.strictEqual(v.getInt16(44, true), 0);
  assert.strictEqual(v.getInt16(46, true), 16383, '0.5 -> 16383 (truncating PCM16 scale)');
  assert.strictEqual(v.getInt16(48, true), -0x4000);
  assert.strictEqual(v.getInt16(50, true), 0x7FFF, 'clamped max');
  assert.strictEqual(v.getInt16(52, true), -0x8000, 'clamped min');
  assert.throws(() => float32ToWavArrayBuffer(new Float32Array(0), 24000));
  assert.throws(() => float32ToWavArrayBuffer(samples, 0));
  console.log('✓ Test 1 Passed: pcm16Wav encoder produces a valid WAV with exact round-trip and clamping.');
  executed++;
}

// 2. Voice identity pin: manifest pins the pilot-qualified te_M voice; the
//    worker must refuse config drift (static contract on both files).
{
  assert.ok(TTS_MODELS.te.qualifiedVoice, 'manifest must pin qualifiedVoice');
  assert.deepStrictEqual(
    { speaker: TTS_MODELS.te.qualifiedVoice.speaker, id: TTS_MODELS.te.qualifiedVoice.speakerId, scale: TTS_MODELS.te.qualifiedVoice.lengthScale },
    { speaker: 'te_M', id: 13, scale: 1.0022 },
    'qualified voice must be exactly the pilot-qualified te_M (id 13, length_scale 1.0022)'
  );
  const workerSrc = readFileSync(resolve('src/services/localVoice/localTtsWorker.js'), 'utf8');
  assert.ok(workerSrc.includes('qualifiedVoice'), 'worker must read the manifest voice pin');
  assert.ok(!workerSrc.includes('speakerKeys[0]'), 'worker must not select the first declared speaker');
  assert.ok(workerSrc.includes('pinned.lengthScale'), 'worker must reject length_scale drift');
  console.log('✓ Test 2 Passed: shipping voice identity is pinned to the qualified te_M and drift is refused.');
  executed++;
}

// 3. Single-sourced prompt gate: worker imports the manifest list (no
//    duplicated copy that can drift).
{
  const workerSrc = readFileSync(resolve('src/services/localVoice/localTtsWorker.js'), 'utf8');
  assert.ok(workerSrc.includes("from './localVoiceManifest.js'"), 'worker must import the manifest');
  assert.ok(workerSrc.includes('new Set(QUALIFIED_INTERFACE_PROMPTS)'), 'worker gate must be built from the shared manifest list');
  const manifestSrc = readFileSync(resolve('src/services/localVoice/localVoiceManifest.js'), 'utf8');
  const promptCount = (manifestSrc.match(/'/g) || []).length; // sanity only
  assert.ok(QUALIFIED_INTERFACE_PROMPTS.length === 3 && promptCount > 0);
  console.log('✓ Test 3 Passed: qualified prompt gate is single-sourced from localVoiceManifest.js.');
  executed++;
}

// 4. Fallback chain order (static contract on indicSpeechService source):
//    gnani → sample (demo only) → strict-Gnani early-return → local OSS tier
//    → browser fallback. TEXT_NOT_QUALIFIED / MODELS_NOT_INSTALLED must be
//    silent fall-throughs; strict mode must error BEFORE the local tier.
{
  const src = readFileSync(resolve('src/services/indicSpeechService.js'), 'utf8');
  const iGnani = src.indexOf("stage: 'gnani_tts'");
  const iSample = src.indexOf("stage: 'sample_wav'");
  const iStrict = src.indexOf('options.strictGnani && options.suppressBrowserFallback');
  const iLocal = src.indexOf("stage: 'local_oss_tts'");
  const iBrowser = src.indexOf("this.activeProvider = 'browser_fallback';", iLocal);
  assert.ok(iGnani > -1 && iSample > iGnani, 'sample tier after gnani');
  assert.ok(iStrict > iSample, 'strict-Gnani early-return after sample tier');
  assert.ok(iLocal > iStrict, 'local OSS tier AFTER strict-Gnani early-return (strict semantics preserved)');
  assert.ok(iBrowser > iLocal, 'browser fallback last');
  assert.ok(src.includes("synthesizeQualifiedPrompt"), 'local tier must call synthesizeQualifiedPrompt');
  assert.ok(src.includes("localErr.code === 'TEXT_NOT_QUALIFIED' || localErr.code === 'MODELS_NOT_INSTALLED'"), 'expected gates must be silent fall-throughs');
  assert.ok(src.includes("activeProvider = 'local_oss_onnx'"), 'provider must be recorded as local_oss_onnx');
  assert.ok(src.includes('clinicalPlayback: false'), 'local tier playback must be labelled non-clinical');
  assert.ok(src.includes("import { float32ToWavArrayBuffer } from './localVoice/pcm16Wav.js'"), 'WAV encoder wired');
  console.log('✓ Test 4 Passed: fallback chain order and honest fall-through contracts hold in source.');
  executed++;
}

// 5. Production packaging: vite config must copy the grounded ort-wasm set
//    (jsep pair + plain pair) and the worker must pin wasmPaths same-origin.
{
  const viteSrc = readFileSync(resolve('vite.config.js'), 'utf8');
  assert.ok(viteSrc.includes("name: 'copy-ort-wasm'"), 'vite build hook must exist');
  assert.ok(viteSrc.includes('ort-wasm-simd-threaded.jsep.mjs') && viteSrc.includes('ort-wasm-simd-threaded.jsep.wasm'), 'jsep pair copied');
  assert.ok(viteSrc.includes('ort-wasm-simd-threaded.mjs') && viteSrc.includes('ort-wasm-simd-threaded.wasm'), 'plain fallback pair copied');
  assert.ok(!viteSrc.includes('asyncify.wasm') && !viteSrc.includes('jspi.wasm'), 'heavy legacy/flag variants must not ship');
  const workerSrc = readFileSync(resolve('src/services/localVoice/localTtsWorker.js'), 'utf8');
  assert.ok(workerSrc.includes("ort.env.wasm.wasmPaths"), 'worker must pin wasmPaths');
  assert.ok(workerSrc.includes("base + 'ort-wasm/'"), 'default wasm path must be same-origin <base>/ort-wasm/');
  console.log('✓ Test 5 Passed: production WASM packaging is grounded, same-origin, and CDN-proof.');
  executed++;
}

// 6. Consent/network hardening contracts in the manager source.
{
  const mgrSrc = readFileSync(resolve('src/services/localVoice/localModelManager.js'), 'utf8');
  assert.ok(mgrSrc.includes('c.totalBytes !== currentBytes'), 'stale pack-size consent must be rejected');
  assert.ok(mgrSrc.includes('knownUnmetered'), 'network gate must only pass on KNOWN unmetered types');
  assert.ok(mgrSrc.includes("conn.type === 'wifi' || conn.type === 'ethernet'"), 'wifi/ethernet explicit');
  assert.ok(!/conn\.effectiveType === '4g'/.test(mgrSrc), 'effectiveType 4g must not be assumed unmetered');
  const svcSrc = readFileSync(resolve('src/services/localVoice/localTtsService.js'), 'utf8');
  assert.ok((svcSrc.match(/'ABORTED'/g) || []).length >= 3, 'abort must be normalized across load and inference stages');
  console.log('✓ Test 6 Passed: consent pins pack size, unknown network is metered, aborts normalize to ABORTED.');
  executed++;
}

// 7. ENV-GATED REAL INFERENCE SMOKE (conditional skip without models).
//    Set AYUSWAR_VOICE_SMOKE_DIR to a directory containing the 5 pinned files
//    (named by their manifest keys: text_encoder, flow_decoder, vocoder,
//    tts_config, onnx_manifest with .onnx/.json extensions) to run the REAL
//    worker synthesize() against the REAL pinned model in node.
{
  const dir = process.env.AYUSWAR_VOICE_SMOKE_DIR;
  if (!dir) {
    console.log('↷ Test 7 Skipped: real-inference smoke needs AYUSWAR_VOICE_SMOKE_DIR (conditional skip this run).');
    conditionalSkips++;
  } else {
    const m = TTS_MODELS.te;
    const nameFor = (f) => f.key === 'tts_config' ? 'tts-config.json' : f.key === 'onnx_manifest' ? 'tts-manifest.json' : `${f.key}.onnx`;
    const files = {};
    for (const f of m.files) {
      const p = join(dir, nameFor(f));
      assert.ok(existsSync(p), `smoke model file missing: ${p}`);
      const buf = readFileSync(p);
      const hex = createHash('sha256').update(buf).digest('hex');
      assert.strictEqual(hex, f.sha256, `smoke file ${f.key} hash must match the pinned manifest`);
      files[f.key] = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    }
    const { synthesize } = await import('../src/services/localVoice/localTtsWorker.js');
    const out = await synthesize({
      text: QUALIFIED_INTERFACE_PROMPTS[0],
      language: 'te',
      encoder: files.text_encoder,
      decoder: files.flow_decoder,
      vocoder: files.vocoder,
      configText: new TextDecoder().decode(files.tts_config),
      manifestText: new TextDecoder().decode(files.onnx_manifest)
    });
    assert.ok(out.samples instanceof Float32Array && out.samples.length > 0, 'smoke must produce audio samples');
    assert.strictEqual(out.sampleRate, 24000, 'smoke sample rate');
    console.log(`✓ Test 7 Passed: REAL worker inference on the pinned model (${out.samples.length} samples @ ${out.sampleRate}Hz, qualified te_M voice).`);
    executed++;
  }
}

console.log(`Phase 30: ${executed}/${executed + conditionalSkips} passed (${conditionalSkips} conditional skips).`);
export const phase30Results = { executed, conditionalSkips };
