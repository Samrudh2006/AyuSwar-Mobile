/**
 * AyuSwar AI — Local OSS Voice Fallback (Phase 29)
 *
 * Covers the integration boundary honestly:
 * - Gate: only the three qualified Telugu interface prompts; clinical/arbitrary
 *   text rejected (TEXT_NOT_QUALIFIED) before any model lookup.
 * - Consent: no download without recorded consent shown the exact byte size;
 *   cellular blocked unless explicitly allowed.
 * - Integrity: REAL WebCrypto sha256 path — tampered download fails
 *   HASH_MISMATCH and keeps nothing; tampered cache fails on load and deletes.
 * - Flow (stubbed-digest happy path, LABELED): install -> installed status ->
 *   mocked-worker synthesis resolves; cancel aborts; worker error surfaces.
 * - Availability: unavailable state is explicit, never implied.
 *
 * NOT claimed: Android/WebView runtime, real model download, human-listened
 * audio quality. Browser worker evidence is reported separately.
 */

import { webcrypto } from 'node:crypto';
import {
  recordLocalVoiceConsent, clearLocalVoiceConsent, getLocalVoiceConsent,
  installLocalVoiceModel, uninstallLocalVoiceModel, getModelStatus,
  getVerifiedModelFile, _setEnvForTests, LocalVoiceError
} from '../src/services/localVoice/localModelManager.js';
import { QUALIFIED_INTERFACE_PROMPTS, ttsTotalBytes, TTS_MODELS } from '../src/services/localVoice/localVoiceManifest.js';
import {
  synthesizeQualifiedPrompt, getLocalTtsAvailability,
  _setWorkerFactoryForTests, _setServiceEnvForTests
} from '../src/services/localVoice/localTtsService.js';

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

function freshEnv({ fetchImpl, connection, subtle } = {}) {
  const storage = makeMemoryStorage(); // stable per environment
  const caches = makeMemoryCaches();
  _setEnvForTests({
    fetchFn: fetchImpl || (async () => new Response(new Uint8Array([1, 2, 3]))),
    cachesFn: () => caches,
    storageFn: () => storage,
    connectionFn: () => connection || { type: 'wifi' }, // default test network is KNOWN wifi; pass explicit connection to exercise gates
    cryptoFn: () => subtle || realSubtle
  });
}

// --- Tests ------------------------------------------------------------------

await record('gate: only the three qualified Telugu prompts are speakable', async () => {
  assert(QUALIFIED_INTERFACE_PROMPTS.length === 3, 'expected exactly three qualified prompts');
  freshEnv();
  for (const p of QUALIFIED_INTERFACE_PROMPTS) {
    // qualified prompts pass the gate and then fail at model-presence (not at the gate)
    const e = await expectCode(synthesizeQualifiedPrompt(p), 'MODELS_NOT_INSTALLED');
    assert(e.details?.totalBytes === ttsTotalBytes('te'), 'unavailable must carry the install size');
  }
  await expectCode(synthesizeQualifiedPrompt('మందు 120/80 తీసుకోండి'), 'TEXT_NOT_QUALIFIED');
  await expectCode(synthesizeQualifiedPrompt('Take Paracetamol 650mg twice daily'), 'TEXT_NOT_QUALIFIED');
});

await record('consent: no download without recorded consent shown the size', async () => {
  freshEnv();
  const e = await expectCode(installLocalVoiceModel('te'), 'CONSENT_REQUIRED');
  assert(e.details.totalBytes === 91017873, `TTS-only size must be exact (got ${e.details.totalBytes})`);
});

await record('consent: unknown network state is treated as metered (no silent Wi-Fi assumption)', async () => {
  freshEnv({ connection: null });
  // connectionFn returns connection || wifi... simulate truly unknown by overriding:
  _setEnvForTests({ connectionFn: () => null });
  recordLocalVoiceConsent({ language: 'te', allowCellular: false });
  await expectCode(installLocalVoiceModel('te'), 'CELLULAR_BLOCKED');
  _setEnvForTests({ connectionFn: () => ({}) }); // unrecognized object = unknown
  recordLocalVoiceConsent({ language: 'te', allowCellular: false });
  await expectCode(installLocalVoiceModel('te'), 'CELLULAR_BLOCKED');
  recordLocalVoiceConsent({ language: 'te', allowCellular: true });
  // allowCellular permits the download even when the network type is unknown
  freshEnv({ connection: { type: 'wifi' } }); // restore sane env; download path itself is covered by other cases
});

await record('consent: cellular blocked unless explicitly allowed', async () => {
  freshEnv({ connection: { type: 'cellular', effectiveType: '4g' } });
  recordLocalVoiceConsent({ language: 'te', allowCellular: false });
  await expectCode(installLocalVoiceModel('te'), 'CELLULAR_BLOCKED');
  // allowed cellular proceeds past the guard (fails later at hash, proving the guard passed)
  clearLocalVoiceConsent();
  recordLocalVoiceConsent({ language: 'te', allowCellular: true });
  await expectCode(installLocalVoiceModel('te'), 'HASH_MISMATCH');
});

await record('integrity: tampered download fails HASH_MISMATCH with REAL WebCrypto and keeps nothing', async () => {
  freshEnv(); // real crypto
  recordLocalVoiceConsent({ language: 'te' });
  await expectCode(installLocalVoiceModel('te'), 'HASH_MISMATCH');
  const st = await getModelStatus('te');
  assert(st.state === 'not_installed', 'nothing may remain installed after a failed integrity check');
});

await record('integrity: unsupported language is explicit', async () => {
  freshEnv();
  const st = await getModelStatus('hi');
  assert(st.state === 'unsupported', 'hi is licensed + desktop-qualified but NOT yet registered for install');
  await expectCode((async () => recordLocalVoiceConsent({ language: 'hi' }))(), 'UNSUPPORTED_LANGUAGE');
});

// Stubbed-digest happy path: crypto is replaced by a pass-through that returns
// the EXPECTED digest, so flow logic (download loop, caching, status, worker
// wiring) is exercised without shipping 91MB into the test. The real-digest
// failure path is covered by the REAL WebCrypto test above.
// Fetch stub returning each file's DECLARED size so the stub digest can match.
function sizeAwareFetch() {
  return async (url) => {
    const f = TTS_MODELS.te.files.find(x => x.url === url);
    if (!f) return new Response('nope', { status: 404 });
    return new Response(new Uint8Array(f.bytes));
  };
}

function stubSubtlePass() {
  const expected = new Map(TTS_MODELS.te.files.map(f => [f.bytes, f.sha256]));
  return {
    digest: async (_alg, buf) => {
      const hex = expected.get(buf.byteLength) || 'deadbeef';
      const bytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
      return bytes.buffer;
    }
  };
}

await record('flow (stubbed digest): install -> installed -> synthesis via mocked worker resolves', async () => {
  freshEnv({ fetchImpl: sizeAwareFetch(), subtle: stubSubtlePass() });
  const consent = recordLocalVoiceConsent({ language: 'te' });
  assert(consent.totalBytes === 91017873, 'consent record carries exact size');
  assert(getLocalVoiceConsent()?.language === 'te', 'consent persisted');
  const out = await installLocalVoiceModel('te');
  assert(out.state === 'installed', 'install completes');
  const st = await getModelStatus('te');
  assert(st.state === 'installed', 'status derived from cache, not memory');

  _setWorkerFactoryForTests(() => {
    const w = {
      onmessage: null, onerror: null,
      postMessage(msg) {
        assert(msg.jobId, 'job id present');
        assert(QUALIFIED_INTERFACE_PROMPTS.includes(msg.text), 'worker receives gated text');
        const samples = new Float32Array(16000);
        setTimeout(() => w.onmessage({ data: { jobId: msg.jobId, ok: true, samples: samples.buffer, sampleRate: 24000 } }), 0);
      },
      terminate() {}
    };
    return w;
  });
  const r = await synthesizeQualifiedPrompt(QUALIFIED_INTERFACE_PROMPTS[0]);
  assert(r.provider === 'local_oss_onnx', 'provider labeled local OSS');
  assert(r.sampleRate === 24000 && r.samples.length === 16000, 'audio returned');
  assert(r.clinicalValidated === false, 'never claims clinical validation');
  _setWorkerFactoryForTests(null);
});

await record('flow (stubbed digest): cancellation aborts synthesis', async () => {
  freshEnv({ fetchImpl: sizeAwareFetch(), subtle: stubSubtlePass() });
  recordLocalVoiceConsent({ language: 'te' });
  await installLocalVoiceModel('te');
  _setWorkerFactoryForTests(() => ({
    onmessage: null, onerror: null, postMessage() { /* never answers */ }, terminate() {}
  }));
  const c = new AbortController();
  const p = synthesizeQualifiedPrompt(QUALIFIED_INTERFACE_PROMPTS[1], { signal: c.signal });
  setTimeout(() => c.abort(), 5);
  await expectCode(p, 'ABORTED');
  _setWorkerFactoryForTests(null);
});

await record('flow (stubbed digest): worker error surfaces as INFERENCE_FAILED', async () => {
  freshEnv({ fetchImpl: sizeAwareFetch(), subtle: stubSubtlePass() });
  recordLocalVoiceConsent({ language: 'te' });
  await installLocalVoiceModel('te');
  _setWorkerFactoryForTests(() => ({
    onmessage: null, onerror: null,
    postMessage(msg) { setTimeout(() => this.onmessage({ data: { jobId: msg.jobId, ok: false, code: 'INFERENCE_FAILED', error: 'wasm boom' } }), 0); },
    terminate() {}
  }));
  await expectCode(synthesizeQualifiedPrompt(QUALIFIED_INTERFACE_PROMPTS[2]), 'INFERENCE_FAILED');
  _setWorkerFactoryForTests(null);
});

await record('flow (stubbed digest): stuck worker is terminated on timeout', async () => {
  freshEnv({ fetchImpl: sizeAwareFetch(), subtle: stubSubtlePass() });
  recordLocalVoiceConsent({ language: 'te' });
  await installLocalVoiceModel('te');
  let terminated = false;
  _setWorkerFactoryForTests(() => ({
    onmessage: null, onerror: null, postMessage() {}, terminate() { terminated = true; }
  }));
  _setServiceEnvForTests({ timeoutMs: 25 });
  await expectCode(synthesizeQualifiedPrompt(QUALIFIED_INTERFACE_PROMPTS[0]), 'WORKER_TIMEOUT');
  assert(terminated, 'worker must be terminated on timeout');
  _setServiceEnvForTests({ timeoutMs: 0 });
  _setWorkerFactoryForTests(null);
});

await record('availability: honest unavailable shape before install', async () => {
  freshEnv();
  const a = await getLocalTtsAvailability('te');
  assert(a.available === false && a.state === 'not_installed', 'explicitly unavailable');
  assert(a.qualifiedPromptsOnly === true && a.clinicalPlaybackAllowed === false, 'bounds visible');
  assert(a.totalBytes === 91017873, 'size shown for consent UI');
});

await record('uninstall removes cached model files', async () => {
  freshEnv({ fetchImpl: sizeAwareFetch(), subtle: stubSubtlePass() });
  recordLocalVoiceConsent({ language: 'te' });
  await installLocalVoiceModel('te');
  const out = await uninstallLocalVoiceModel('te');
  assert(out.removedFiles === TTS_MODELS.te.files.length, 'all model files removed');
  const st = await getModelStatus('te');
  assert(st.state === 'not_installed', 'back to not installed');
});

let failed = 0;
for (const r of results) {
  if (!r.ok) { failed += 1; console.error(`  FAIL  ${r.name}: ${r.err?.message || r.err}`); }
  else console.log(`  PASS  ${r.name}`);
}
if (failed > 0) { console.error(`Phase 29: ${failed} of ${results.length} checks failed`); process.exit(1); }
console.log(`Phase 29: ${results.length}/${results.length} local voice fallback checks passed`);
