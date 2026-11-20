/**
 * AyuSwar AI — Offline ASR worker: Telugu IndicConformer CTC transcription
 * in a dedicated Web Worker, WASM-only (CSP blocks WASM threads/SIMD), ort
 * assets same-origin. Model bytes arrive per job from the service, which
 * re-verifies sha256 against the pinned manifest before transfer.
 *
 * Protocol (mirrors localTtsWorker):
 *   IN  { jobId, pcmFloat32, preprocessor, asr, vocabText, expectedVocabSize, blankId }
 *   OUT { jobId, ok: true, transcript, timings } | { jobId, ok: false, code, error }
 *
 * Model: see localAsrManifest.js - local INT8 derivative, DRAFT output only.
 * Envelope re-enforced here (0.1-15 s, exactly 16000 samples/s mono) so no
 * caller can bypass the service gate. Decode is the pilot-qualified path:
 * preprocessor (waveforms/waveforms_lens -> features/features_lens) ->
 * model (audio_signal/length -> logprobs) -> frame-capped greedy CTC with
 * SentencePiece word-marker normalization.
 */

/* global self */

const SAMPLE_RATE = 16000;
const MAX_SECONDS = 15;
const MIN_SECONDS = 0.1;

let ort = null;

function post(message) { self.postMessage(message); }

const wasmEnv = () => {
  const base = (self.location?.origin ? `${self.location.origin}/` : '/');
  const o = {
    wasmPaths: { mjs: `${base}ort-wasm-simd-threaded.jsep.mjs`, wasm: `${base}ort-wasm-simd-threaded.jsep.wasm` },
    proxy: false
  };
  try { o.numThreads = 1; } catch { /* ignore */ }
  return o;
};

function parseVocab(text) {
  const lines = String(text).split(/\r?\n/).filter(l => l.trim().length > 0);
  const v = new Map();
  for (const line of lines) {
    const m = line.match(/^(.*)\s(\d+)$/);
    if (m) v.set(parseInt(m[2], 10), m[1]);
  }
  return v;
}

self.onmessage = async (event) => {
  const { jobId, pcmFloat32, preprocessor, asr, vocabText, expectedVocabSize, blankId } = event.data || {};
  try {
    if (!(pcmFloat32 instanceof Float32Array)) throw new Error('pcmFloat32 must be Float32Array');
    if (pcmFloat32.length < Math.round(MIN_SECONDS * SAMPLE_RATE)) throw new Error('clip below minimum supported length');
    if (pcmFloat32.length > Math.round(MAX_SECONDS * SAMPLE_RATE)) throw new Error('clip exceeds maximum supported length');

    if (!ort) {
      const mod = await import('./ortBundle.js');
      ort = mod.default;
      ort.env.wasm = wasmEnv();
    }
    const vocab = parseVocab(vocabText);
    if (typeof expectedVocabSize === 'number' && vocab.size !== expectedVocabSize) {
      throw new Error(`vocab size ${vocab.size} != pinned ${expectedVocabSize}`);
    }
    const opts = { executionProviders: ['wasm'], graphOptimizationLevel: 'all' };
    const prepSession = await ort.InferenceSession.create(preprocessor, opts);
    const asrSession = await ort.InferenceSession.create(asr, opts);

    const t0 = performance.now();
    const lens = new BigInt64Array(1);
    lens[0] = BigInt(pcmFloat32.length);
    const prepOut = await prepSession.run({
      waveforms: new ort.Tensor('float32', pcmFloat32, [1, pcmFloat32.length]),
      waveforms_lens: new ort.Tensor('int64', lens, [1])
    });
    const processed = prepOut.features;
    const processedLen = prepOut.features_lens;
    const t1 = performance.now();

    const asrOut = await asrSession.run({
      audio_signal: new ort.Tensor('float32', processed.data, processed.dims),
      length: new ort.Tensor('int64', processedLen.data, processedLen.dims)
    });
    const logProbs = asrOut.logprobs;
    const V = Number(logProbs.dims[2]);
    const frames = Math.min(
      Number(logProbs.dims[1]),
      Math.floor((Number(processedLen.data[0]) - 1) / 4) + 1
    );
    const t2 = performance.now();

    const blank = typeof blankId === 'number' ? blankId : (V - 1);
    let prev = -1;
    let transcript = '';
    for (let t = 0; t < frames; t++) {
      let best = 0;
      let bestV = -Infinity;
      const row = logProbs.data.subarray(t * V, (t + 1) * V);
      for (let i = 0; i < V; i++) if (row[i] > bestV) { bestV = row[i]; best = i; }
      if (best !== blank && best !== prev) transcript += vocab.get(best) ?? '';
      prev = best;
    }
    transcript = transcript.replaceAll('▁', ' ').trim();
    const t3 = performance.now();

    post({
      jobId,
      ok: true,
      transcript,
      timings: {
        preprocessMs: Math.round(t1 - t0),
        asrMs: Math.round(t2 - t1),
        decodeMs: Math.round(t3 - t2),
        totalMs: Math.round(t3 - t0)
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const code = /integrity|hash/i.test(msg) ? 'HASH_MISMATCH'
      : /network|fetch|HTTP/i.test(msg) ? 'NETWORK'
      : /length/i.test(msg) ? 'OUT_OF_ENVELOPE'
      : 'WORKER_ERROR';
    post({ jobId, ok: false, code, error: msg });
  }
};
