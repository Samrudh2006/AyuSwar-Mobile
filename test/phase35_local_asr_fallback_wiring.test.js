/**
 * AyuSwar AI — Phase 35: local ASR fallback wiring in transcribeAudioWithGnani
 *
 * Behavioral: when Gnani STT is unavailable/fails, the recorded-clip path
 * attempts the on-device ASR tier ONLY if the pack is installed+consented,
 * returns a DRAFT-labeled result (never live flags), and never touches the
 * network for the local tier. When the pack is absent the original
 * fallbackRequired contract is unchanged.
 */

import assert from 'node:assert';
import { webcrypto } from 'node:crypto';
import { IndicSpeechService } from '../src/services/indicSpeechService.js';
import { ASR_MODELS } from '../src/services/localVoice/localAsrManifest.js';
import { recordLocalAsrConsent, _setAsrEnvForTests } from '../src/services/localVoice/localAsrPackManager.js';
import { _setEnvForTests } from '../src/services/localVoice/localModelManager.js';
import { _setAsrWorkerFactoryForTests } from '../src/services/localVoice/localAsrService.js';

let executed = 0;
const realSubtle = webcrypto.subtle;

function makeMemoryStorage() {
  const map = new Map();
  return { getItem: k => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: k => map.delete(k) };
}
function makeMemoryCaches() {
  const stores = new Map();
  const open = async (name) => {
    if (!stores.has(name)) {
      const inner = new Map();
      stores.set(name, {
        put: async (url, res) => inner.set(url, await res.arrayBuffer()),
        match: async (url) => (inner.has(url) ? new Response(inner.get(url).slice(0)) : undefined),
        delete: async (u) => { const k = [...inner.keys()].find(x => x.includes(typeof u === 'string' ? u : u.url)); if (k) inner.delete(k); return true; },
        keys: async () => [...inner.keys()].map(url => ({ url }))
      });
    }
    return stores.get(name);
  };
  return { open };
}

function wireAsrEnv({ withPack }) {
  const storage = makeMemoryStorage();
  const caches = makeMemoryCaches();
  const m = ASR_MODELS.te;
  const hashByLength = new Map(m.files.map((f, i) => [10 + i, f.sha256]));
  const shared = {
    fetchFn: async (url) => new Response(new Uint8Array(10 + m.files.findIndex(x => x.url === url))),
    cachesFn: () => caches,
    storageFn: () => storage,
    connectionFn: () => ({ type: 'wifi' }),
    cryptoFn: () => ({
      digest: async (_a, buf) => {
        const hex = hashByLength.get(buf.byteLength);
        if (!hex) throw new Error('unexpected digest body');
        return new Uint8Array(hex.match(/../g).map(b => parseInt(b, 16))).buffer;
      }
    })
  };
  _setEnvForTests(shared);
  _setAsrEnvForTests(shared);
  return { storage, caches, withPack };
}

async function installPack() {
  const { installLocalAsrPack } = await import('../src/services/localVoice/localAsrPackManager.js');
  recordLocalAsrConsent({ language: 'te' });
  await installLocalAsrPack('te');
}

function fakeAudioContextFactory() {
  return function () {
    const len = 3 * 16000;
    return {
      sampleRate: 16000,
      decodeAudioData: async () => ({
        numberOfChannels: 1, sampleRate: 16000, length: len,
        getChannelData: () => new Float32Array(len).fill(0.01)
      }),
      close: async () => {}
    };
  };
}
// service does not take audioContextFactory; the service's prepareClip call
// uses window.AudioContext - provide it globally for the test
globalThis.window = globalThis.window || {};
window.AudioContext = fakeAudioContextFactory();
globalThis.FileReader = class {
  readAsDataURL() { setTimeout(() => this.onloadend(), 0); }
  get result() { return 'data:audio/wav;base64,AAAA'; }
};

// 1. pack NOT installed -> original fallback contract, no throw
{
  wireAsrEnv({ withPack: false });
  const svc = new IndicSpeechService();
  svc.gnaniAvailable = false;
  const res = await svc.transcribeAudioWithGnani({ arrayBuffer: async () => new ArrayBuffer(8), size: 1000 }, 'te-IN');
  assert.strictEqual(res.transcript, null);
  assert.strictEqual(res.fallbackRequired, true);
  assert.ok(!res.draft, 'no draft flags without the pack');
  console.log('✓ Test 1 Passed: no pack -> unchanged fallbackRequired contract.');
  executed++;
}

// 2. pack installed -> Gnani-unavailable path returns DRAFT local transcript, no network
{
  wireAsrEnv({ withPack: true });
  await installPack();
  const calls = [];
  const origFetch = globalThis.fetch;
  globalThis.fetch = (...a) => { calls.push(a[0]); return Promise.reject(new Error('network must not be used by local tier')); };
  _setAsrWorkerFactoryForTests(() => ({
    onmessage: null, onerror: null,
    postMessage(msg) { setTimeout(() => this.onmessage({ data: { jobId: msg.jobId, ok: true, transcript: 'స్థానిక డ్రాఫ్ట్', timings: { totalMs: 3 } } }), 0); },
    terminate() {}
  }));
  try {
    const svc = new IndicSpeechService();
    svc.gnaniAvailable = false;
    const res = await svc.transcribeAudioWithGnani({ arrayBuffer: async () => new ArrayBuffer(8), size: 1000 }, 'te-IN');
    assert.strictEqual(res.transcript, 'స్థానిక డ్రాఫ్ట్');
    assert.strictEqual(res.provider, 'local_oss_onnx_asr');
    assert.strictEqual(res.draft, true);
    assert.strictEqual(res.requiresReview, true);
    assert.strictEqual(res.clinicalValidated, false);
    assert.strictEqual(res.localOnDevice, true);
    assert.strictEqual(calls.length, 0, `local tier must not fetch (saw ${calls})`);
  } finally {
    globalThis.fetch = origFetch;
    _setAsrWorkerFactoryForTests(null);
  }
  console.log('✓ Test 2 Passed: installed pack -> DRAFT-labeled local transcript with zero network use.');
  executed++;
}

// 3. local worker failure -> original fallback contract preserved
{
  wireAsrEnv({ withPack: true });
  await installPack();
  _setAsrWorkerFactoryForTests(() => ({
    onmessage: null, onerror: null,
    postMessage(msg) { setTimeout(() => this.onmessage({ data: { jobId: msg.jobId, ok: false, code: 'WORKER_ERROR', error: 'boom' } }), 0); },
    terminate() {}
  }));
  try {
    const svc = new IndicSpeechService();
    svc.gnaniAvailable = false;
    const res = await svc.transcribeAudioWithGnani({ arrayBuffer: async () => new ArrayBuffer(8), size: 1000 }, 'te-IN');
    assert.strictEqual(res.transcript, null);
    assert.strictEqual(res.fallbackRequired, true);
  } finally {
    _setAsrWorkerFactoryForTests(null);
  }
  console.log('✓ Test 3 Passed: local tier failure degrades to the unchanged fallback contract.');
  executed++;
}

console.log(`Phase 35: ${executed}/3 local-ASR fallback wiring checks passed`);
