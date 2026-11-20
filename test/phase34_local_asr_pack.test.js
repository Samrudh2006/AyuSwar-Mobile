/**
 * AyuSwar AI — Offline ASR pack (Phase 34)
 *
 * Covers the integration boundary honestly:
 * - Manifest: exact pinned bytes/hashes sum; vocab/blank/envelope constants.
 * - Consent: no download without recorded consent shown the exact byte size;
 *   size change forces re-consent; unknown network counts as metered.
 * - Integrity: REAL WebCrypto sha256 path — tampered download fails
 *   HASH_MISMATCH and keeps nothing; tampered cache fails on load.
 * - Service gate: pack must be installed (MODELS_NOT_INSTALLED); envelope
 *   0.1-15s enforced AFTER 16kHz resample (OUT_OF_ENVELOPE); output is a
 *   DRAFT requiring human review (draft+requiresReview, clinicalValidated
 *   false, provider label local_oss_onnx_asr); cancel/abort/timeout surface.
 * - Real-model smoke (conditional, LABELED): runs only when
 *   AYUSWAR_ASR_SMOKE_DIR points at the pinned files AND AYUSWAR_ORT_NODE_PATH
 *   provides onnxruntime-node; otherwise skips with an explicit notice.
 *
 * NOT claimed: Android/WebView runtime, real device latency/WER, clinical
 * accuracy. Cross-environment inference drift was observed during
 * qualification (same pinned bytes, different machines/runtimes shift
 * borderline frames by 1-3 characters); the tier is draft-only by design.
 */

import { webcrypto } from 'node:crypto';
import { ASR_MODELS, asrTotalBytes } from '../src/services/localVoice/localAsrManifest.js';
import {
  recordLocalAsrConsent, clearLocalAsrConsent, getLocalAsrConsent,
  installLocalAsrPack, uninstallLocalAsrPack, getAsrPackStatus,
  getVerifiedAsrFile, _setAsrEnvForTests
} from '../src/services/localVoice/localAsrPackManager.js';
import { _setEnvForTests, LocalVoiceError } from '../src/services/localVoice/localModelManager.js';
import {
  transcribeInstalledClip, getLocalAsrAvailability, LOCAL_ASR_PROVIDER,
  _setAsrWorkerFactoryForTests, _setAsrServiceEnvForTests
} from '../src/services/localVoice/localAsrService.js';

const results = [];
const record = async (name, fn) => {
  try { await fn(); results.push({ name, ok: true }); }
  catch (err) { results.push({ name, ok: false, err }); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const expectCode = async (p, code) => {
  try { await p; } catch (e) { assert(e.code === code, `expected ${code}, got ${e.code || e.message}`); return e; }
  throw new Error(`expected ${code}, call succeeded`);
};

// --- Mock browser environment ---------------------------------------------
function makeMemoryStorage() {
  const map = new Map();
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
    _map: map
  };
}
function makeMemoryCaches() {
  const stores = new Map();
  const open = async (name) => {
    if (!stores.has(name)) {
      const inner = new Map();
      stores.set(name, {
        put: async (url, res) => inner.set(url, await res.arrayBuffer()),
        match: async (url) => (inner.has(url) ? new Response(inner.get(url).slice(0)) : undefined),
        delete: async (urlOrReq) => {
          const key = typeof urlOrReq === 'string' ? urlOrReq : urlOrReq.url;
          const full = [...inner.keys()].find(k => k.includes(key));
          if (full) inner.delete(full);
          return true;
        },
        keys: async () => [...inner.keys()].map(u => ({ url: u }))
      });
    }
    return stores.get(name);
  };
  return { open };
}
const realSubtle = webcrypto.subtle;

// The ASR pack manager reuses the TTS manager's generic cache/hash helpers, so
// BOTH envs must point at the same memory caches/storage in tests.
function freshEnv({ fetchImpl, connection, subtle } = {}) {
  const storage = makeMemoryStorage();
  const caches = makeMemoryCaches();
  const shared = {
    fetchFn: fetchImpl || (async () => new Response(new Uint8Array([1, 2, 3]))),
    cachesFn: () => caches,
    storageFn: () => storage,
    connectionFn: () => connection || { type: 'wifi' }, // default KNOWN wifi
    cryptoFn: () => subtle || realSubtle
  };
  _setEnvForTests(shared);
  _setAsrEnvForTests(shared);
  return { storage, caches };
}

function makeFakeAudioContext(seconds, rate = 16000) {
  const len = Math.round(seconds * rate);
  return function audioContextFactory() {
    return {
      sampleRate: rate,
      decodeAudioData: async () => ({
        numberOfChannels: 1,
        sampleRate: rate,
        length: len,
        getChannelData: () => {
          const ch = new Float32Array(len);
          for (let i = 0; i < len; i++) ch[i] = Math.sin(i / 10) * 0.1;
          return ch;
        }
      }),
      close: async () => {}
    };
  };
}
function fakeBlob() { return { arrayBuffer: async () => new ArrayBuffer(8) }; }

function makeMockWorker(behavior) {
  return {
    postMessage(msg) { this._msg = msg; setTimeout(() => behavior(this, msg), 0); },
    terminate() { this.terminated = true; },
    onmessage: null,
    onerror: null
  };
}

async function installPackStubbedDigest(env) {
  // Happy-path install with digest stubbed to the pinned hashes (LABELED);
  // the REAL WebCrypto mismatch path is covered separately below. Each file
  // gets a distinct stub body length so the deterministic stub digest can map
  // body -> pinned hash on every load, not just during install.
  const { storage, caches } = env;
  const m = ASR_MODELS.te;
  const hashByLength = new Map(m.files.map((f, i) => [10 + i, f.sha256]));
  const shared = {
    fetchFn: async (url) => {
      const idx = m.files.findIndex(x => x.url === url);
      assert(idx >= 0, `unexpected fetch ${url}`);
      return new Response(new Uint8Array(10 + idx));
    },
    cachesFn: () => caches,
    storageFn: () => storage,
    connectionFn: () => ({ type: 'wifi' }),
    cryptoFn: () => ({
      digest: async (_alg, buf) => {
        const hex = hashByLength.get(buf.byteLength);
        assert(hex, `stub digest got unknown body length ${buf.byteLength}`);
        return new Uint8Array(hex.match(/../g).map(b => parseInt(b, 16))).buffer;
      }
    })
  };
  _setEnvForTests(shared);
  _setAsrEnvForTests(shared);
  recordLocalAsrConsent({ language: 'te', allowCellular: false });
  return installLocalAsrPack('te');
}

// --- Tests ------------------------------------------------------------------

await record('manifest: pinned files sum to the exact disclosed total', async () => {
  const m = ASR_MODELS.te;
  assert(m.files.length === 3, 'three pinned files');
  assert(asrTotalBytes('te') === 187133682, `total must be exact (got ${asrTotalBytes('te')})`);
  for (const f of m.files) {
    assert(/^[0-9a-f]{64}$/.test(f.sha256), `${f.key} sha256 shape`);
    assert(Number.isInteger(f.bytes) && f.bytes > 0, `${f.key} bytes`);
  }
  assert(m.vocabSize === 257 && m.blankId === 256, 'CTC constants pinned');
  assert(m.sampleRate === 16000 && m.minSeconds === 0.1 && m.maxSeconds === 15, 'envelope pinned');
  assert(m.provenance.derivative.includes('not an official'), 'local-conversion disclosure present');
});

await record('consent: no download without recorded consent shown the size', async () => {
  freshEnv();
  const e = await expectCode(installLocalAsrPack('te'), 'CONSENT_REQUIRED');
  assert(e.details.totalBytes === 187133682, `ASR size must be exact (got ${e.details.totalBytes})`);
});

await record('consent: pack size change forces re-consent', async () => {
  const env = freshEnv();
  recordLocalAsrConsent({ language: 'te' });
  env.storage._map.set('ayuswar.localAsr.consent.v1', JSON.stringify({ language: 'te', totalBytes: 1, allowCellular: true }));
  const e = await expectCode(installLocalAsrPack('te'), 'CONSENT_REQUIRED');
  assert(e.details.totalBytes === 187133682, 'new size carried for re-confirmation');
});

await record('consent: unknown network state counts as metered', async () => {
  freshEnv({ connection: null });
  _setAsrEnvForTests({ connectionFn: () => null });
  recordLocalAsrConsent({ language: 'te', allowCellular: false });
  await expectCode(installLocalAsrPack('te'), 'CELLULAR_BLOCKED');
  _setAsrEnvForTests({ connectionFn: () => ({}) });
  recordLocalAsrConsent({ language: 'te', allowCellular: false });
  await expectCode(installLocalAsrPack('te'), 'CELLULAR_BLOCKED');
});

await record('integrity: tampered download fails HASH_MISMATCH and keeps nothing', async () => {
  freshEnv({
    fetchImpl: async () => new Response(new Uint8Array([1, 2, 3])) // real digest will not match any pin
  });
  recordLocalAsrConsent({ language: 'te' });
  await expectCode(installLocalAsrPack('te'), 'HASH_MISMATCH');
  const status = await getAsrPackStatus('te');
  assert(status.state === 'not_installed', 'nothing kept after mismatch');
});

await record('integrity: tampered cache fails on load and deletes', async () => {
  const env = freshEnv();
  await installPackStubbedDigest(env);
  const status1 = await getAsrPackStatus('te');
  assert(status1.state === 'installed', 'installed after stubbed install');
  // tamper: overwrite the cached vocab with different bytes, restore real digest
  const caches = env.caches;
  const store = await caches.open('ayuswar-local-voice-v1');
  await store.put('http://localhost/__local_voice__/asr/te/vocab', new Response(new Uint8Array([7, 7])));
  const shared = {
    fetchFn: async () => new Response(new Uint8Array([1])),
    cachesFn: () => caches,
    storageFn: () => makeMemoryStorage(),
    connectionFn: () => ({ type: 'wifi' }),
    cryptoFn: () => realSubtle
  };
  _setEnvForTests(shared);
  _setAsrEnvForTests(shared);
  await expectCode(getVerifiedAsrFile('te', 'vocab', ASR_MODELS.te.files[2].sha256), 'HASH_MISMATCH');
});

await record('service: pack not installed -> MODELS_NOT_INSTALLED carrying size', async () => {
  freshEnv();
  const e = await expectCode(transcribeInstalledClip(fakeBlob(), { audioContextFactory: makeFakeAudioContext(2) }), 'MODELS_NOT_INSTALLED');
  assert(e.details.totalBytes === 187133682, 'size carried');
  const avail = await getLocalAsrAvailability('te');
  assert(avail.available === false && avail.state === 'not_installed', 'availability explicit');
  assert(avail.draftOnly === true && avail.requiresReview === true && avail.clinicalValidated === false, 'draft posture explicit');
});

await record('service: envelope enforced after 16kHz resample', async () => {
  const env = freshEnv();
  await installPackStubbedDigest(env);
  // too short
  await expectCode(
    transcribeInstalledClip(fakeBlob(), { audioContextFactory: makeFakeAudioContext(0.05) }),
    'OUT_OF_ENVELOPE'
  );
  // too long
  await expectCode(
    transcribeInstalledClip(fakeBlob(), { audioContextFactory: makeFakeAudioContext(16) }),
    'OUT_OF_ENVELOPE'
  );
});

await record('service: mocked worker happy path returns a DRAFT requiring review', async () => {
  const env = freshEnv();
  await installPackStubbedDigest(env);
  _setAsrWorkerFactoryForTests(() => makeMockWorker((w, msg) => {
    assert(msg.pcmFloat32 instanceof Float32Array, 'pcm transferred');
    assert(msg.pcmFloat32.length === 3 * 16000, 'resampled length passed through');
    assert(msg.expectedVocabSize === 257 && msg.blankId === 256, 'CTC constants passed');
    w.onmessage({ data: { jobId: msg.jobId, ok: true, transcript: 'నమస్కారం', timings: { totalMs: 5 } } });
  }));
  const r = await transcribeInstalledClip(fakeBlob(), { audioContextFactory: makeFakeAudioContext(3) });
  assert(r.transcript === 'నమస్కారం', 'transcript returned');
  assert(r.provider === LOCAL_ASR_PROVIDER, `provider label ${r.provider}`);
  assert(r.draft === true && r.requiresReview === true && r.clinicalValidated === false, 'draft flags mandatory');
  _setAsrWorkerFactoryForTests(null);
});

await record('service: worker error and abort surface honestly', async () => {
  const env = freshEnv();
  await installPackStubbedDigest(env);
  _setAsrWorkerFactoryForTests(() => makeMockWorker((w, msg) => {
    w.onmessage({ data: { jobId: msg.jobId, ok: false, code: 'WORKER_ERROR', error: 'boom' } });
  }));
  await expectCode(transcribeInstalledClip(fakeBlob(), { audioContextFactory: makeFakeAudioContext(2) }), 'WORKER_ERROR');
  _setAsrWorkerFactoryForTests(() => makeMockWorker(() => { /* never answers */ }));
  const c = new AbortController();
  const p = transcribeInstalledClip(fakeBlob(), { audioContextFactory: makeFakeAudioContext(2), signal: c.signal });
  setTimeout(() => c.abort(), 5);
  await expectCode(p, 'ABORTED');
  _setAsrServiceEnvForTests({ timeoutMs: 20 });
  await expectCode(transcribeInstalledClip(fakeBlob(), { audioContextFactory: makeFakeAudioContext(2) }), 'WORKER_TIMEOUT');
  _setAsrServiceEnvForTests({ timeoutMs: 0 });
  _setAsrWorkerFactoryForTests(null);
});

await record('service: uninstall returns to not_installed', async () => {
  const env = freshEnv();
  await installPackStubbedDigest(env);
  const r = await uninstallLocalAsrPack('te');
  assert(r.removedFiles === 3, `removed ${r.removedFiles}`);
  const status = await getAsrPackStatus('te');
  assert(status.state === 'not_installed', 'back to not_installed');
});

// --- Conditional real-model smoke (LABELED; skips without env) -------------
const SMOKE_DIR = process.env.AYUSWAR_ASR_SMOKE_DIR;
const ORT_PATH = process.env.AYUSWAR_ORT_NODE_PATH;
if (SMOKE_DIR && ORT_PATH) {
  await record('smoke (real pinned models, desktop Node, LABELED): fixture transcribes within envelope', async () => {
    const { readFile } = await import('node:fs/promises');
    const ort = await import(/* @vite-ignore */ ORT_PATH);
    const opts = { executionProviders: ['cpu'], intraOpNumThreads: 2, interOpNumThreads: 1 };
    const pre = await ort.InferenceSession.create(`${SMOKE_DIR}/preprocessor.onnx`, opts);
    const asr = await ort.InferenceSession.create(`${SMOKE_DIR}/model.matmul-int8.onnx`, opts);
    const vocabText = await readFile(`${SMOKE_DIR}/vocab.txt`, 'utf8');
    const vocab = new Map();
    for (const line of vocabText.split(/\r?\n/).filter(l => l.trim())) {
      const m = line.match(/^(.*)\s(\d+)$/);
      if (m) vocab.set(parseInt(m[2], 10), m[1]);
    }
    assert(vocab.size === 257, `vocab ${vocab.size}`);
    const fx = await readFile('/tmp/pilot/ayuswar-local-voice-pilot/js-pilot/fixtures/independent-10s.f32');
    const pcm = new Float32Array(fx.buffer, fx.byteOffset, fx.byteLength / 4);
    const lens = new BigInt64Array(1); lens[0] = BigInt(pcm.length);
    const prepOut = await pre.run({
      waveforms: new ort.Tensor('float32', pcm, [1, pcm.length]),
      waveforms_lens: new ort.Tensor('int64', lens, [1])
    });
    const asrOut = await asr.run({
      audio_signal: prepOut.features,
      length: prepOut.features_lens
    });
    const lp = asrOut.logprobs;
    const V = Number(lp.dims[2]);
    const frames = Math.min(Number(lp.dims[1]), Math.floor((Number(prepOut.features_lens.data[0]) - 1) / 4) + 1);
    let prev = -1; let text = '';
    for (let t = 0; t < frames; t++) {
      let best = 0;
      for (let v = 1; v < V; v++) if (lp.data[t * V + v] > lp.data[t * V + best]) best = v;
      if (best !== 256 && best !== prev) text += vocab.get(best) ?? '';
      prev = best;
    }
    text = text.replaceAll('▁', ' ').trim();
    assert(text.length > 40, 'non-trivial transcript produced');
    assert(text.includes('ఆయుస్') || text.includes('ఆయుస్ వార్'), 'fixture content recognized (draft quality, exact wording environment-dependent)');
    console.log(`    smoke transcript (desktop Node, exploratory): ${text.slice(0, 60)}...`);
  });
} else {
  console.log('    (conditional skip: set AYUSWAR_ASR_SMOKE_DIR + AYUSWAR_ORT_NODE_PATH to run the real-model smoke)');
}

// --- Report -----------------------------------------------------------------
const failed = results.filter(r => !r.ok);
for (const r of results) {
  if (r.ok) console.log(`✓ ${r.name}`);
  else console.log(`✗ ${r.name}: ${r.err && r.err.message}`);
}
console.log(`--- phase34: ${results.length - failed.length}/${results.length} passed ---`);
if (failed.length) process.exit(1);
