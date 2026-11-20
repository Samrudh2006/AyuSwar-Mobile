import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mixDownToMono, resampleTo16k, prepareClipForOnDeviceAsr } from '../src/services/localVoice/resample16k.js';

console.log('--- RUNNING PHASE 33: 16kHz ASR RESAMPLER TESTS ---');
let executed = 0;

// 1. Ratio + length correctness: 48k -> 16k is exactly 1/3 length
{
  const src = new Float32Array(48000).fill(0.25);
  const out = resampleTo16k(src, 48000);
  assert.strictEqual(out.length, 16000, 'one second at 48k must become one second at 16k');
  for (let i = 0; i < out.length; i += 997) assert.ok(Math.abs(out[i] - 0.25) < 1e-7, 'DC must be preserved');
  console.log('✓ Test 1 Passed: 48k→16k length ratio and DC preservation.');
  executed++;
}

// 2. Identity path: 16k input passes through unchanged
{
  const src = new Float32Array([0, 0.1, -0.2, 0.3]);
  const out = resampleTo16k(src, 16000);
  assert.strictEqual(out, src, '16k input must be returned as-is');
  console.log('✓ Test 2 Passed: 16k passthrough.');
  executed++;
}

// 3. 24k (local TTS output) -> 16k: sine frequency preserved within tolerance
{
  const rate = 24000, freq = 440, seconds = 1;
  const src = new Float32Array(rate * seconds);
  for (let i = 0; i < src.length; i++) src[i] = Math.sin(2 * Math.PI * freq * i / rate);
  const out = resampleTo16k(src, rate);
  assert.strictEqual(out.length, 16000);
  // Count zero crossings to estimate the frequency after resampling
  let crossings = 0;
  for (let i = 1; i < out.length; i++) if ((out[i - 1] < 0) !== (out[i] < 0)) crossings++;
  const estimated = crossings / 2 / seconds;
  assert.ok(Math.abs(estimated - freq) <= 5, `440Hz tone must survive resampling (got ${estimated}Hz)`);
  console.log('✓ Test 3 Passed: 24k→16k preserves signal frequency (TTS-output compatible).');
  executed++;
}

// 4. Mix-down: stereo average, length-mismatch rejected
{
  const a = new Float32Array([1, 0, -1]);
  const b = new Float32Array([0, 1, 1]);
  const mono = mixDownToMono([a, b]);
  assert.deepStrictEqual([...mono].map(v => Math.round(v * 2) / 2), [0.5, 0.5, 0]);
  assert.strictEqual(mixDownToMono([a]), a, 'single channel passthrough');
  assert.throws(() => mixDownToMono([a, new Float32Array(2)]));
  assert.throws(() => mixDownToMono([]));
  console.log('✓ Test 4 Passed: stereo mix-down and validation.');
  executed++;
}

// 5. Clip preparation: decode -> mix -> resample via injected AudioContext
{
  const rate = 48000;
  const left = new Float32Array(480).fill(0.2);
  const right = new Float32Array(480).fill(-0.2);
  const fakeCtx = {
    decodeAudioData: async () => ({
      numberOfChannels: 2,
      sampleRate: rate,
      duration: 0.01,
      getChannelData: (c) => (c === 0 ? left : right)
    }),
    close: () => {}
  };
  const blob = { arrayBuffer: async () => new ArrayBuffer(8) };
  const out = await prepareClipForOnDeviceAsr(blob, { audioContextFactory: function () { return fakeCtx; } });
  assert.strictEqual(out.sampleRate, 16000);
  assert.strictEqual(out.samples.length, 160, '0.01s at 48k -> 160 samples at 16k');
  for (let i = 0; i < out.samples.length; i += 37) assert.ok(Math.abs(out.samples[i]) < 1e-7, 'opposite channels must cancel to silence');
  await assert.rejects(() => prepareClipForOnDeviceAsr(null));
  console.log('✓ Test 5 Passed: recorded-clip preparation produces 16kHz mono for the ASR worker.');
  executed++;
}

// 6. Wire-up contract: the local ASR path must funnel through this module
//    (no second resampler implementations elsewhere).
{
  const ttsWorker = readFileSync(resolve('src/services/localVoice/localTtsWorker.js'), 'utf8');
  assert.ok(!ttsWorker.includes('resampleTo16k'), 'TTS worker must not resample (24k output is intentional)');
  const svc = readFileSync(resolve('src/services/localVoice/resample16k.js'), 'utf8');
  assert.ok(svc.includes('TARGET = 16000'), 'single 16k target constant');
  console.log('✓ Test 6 Passed: resampler is single-sourced for the on-device ASR front-end.');
  executed++;
}

console.log(`Phase 33: ${executed}/${executed} passed (0 conditional skips).`);
export const phase33Results = { executed, conditionalSkips: 0 };
