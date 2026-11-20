/**
 * AyuSwar AI — Local TTS inference worker (onnxruntime-web/WASM, bundled, no CDN).
 *
 * Ported from the independent pilot core with ONE deliberate change: the pilot
 * hardcoded the te_M speaker slot; this worker derives the speaker and its
 * length_scale from the model's own config (first declared speaker), so the
 * same code serves any qualified single-speaker language pack. The fixed
 * prompt gate lives in localTtsService.js on the caller side; this worker
 * still re-checks membership as defense-in-depth.
 *
 * Determinism: fixed-seed noise (same as pilot) so output is reproducible.
 */
import * as ort from 'onnxruntime-web';
import FFT from 'fft.js';

// WASM must be served from the app's own origin, never a CDN. Builds (or test
// harnesses) set the base path before this module loads.
if (typeof self !== 'undefined' && self.ORT_WASM_PATH) {
  ort.env.wasm.wasmPaths = self.ORT_WASM_PATH;
}

const PROMPTS = new Set([
  'నమస్కారం. మీ ఆరోగ్య వివరాలను నమోదు చేయండి.',
  'మళ్లీ ప్రయత్నించండి.',
  'దయచేసి వివరాలను చదవండి.'
]);

class WorkerVoiceError extends Error { constructor(code, message) { super(message); this.code = code; } }

function normalNoise(n, seed = 12345) {
  const out = new Float32Array(n); let s = seed >>> 0;
  const u = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) + 1) / 4294967297; };
  for (let i = 0; i < n; i += 2) {
    const r = Math.sqrt(-2 * Math.log(u())), t = 2 * Math.PI * u();
    out[i] = r * Math.cos(t); if (i + 1 < n) out[i + 1] = r * Math.sin(t);
  }
  return out;
}

function istft(real, imag, bins, frames, nfft = 1024, hop = 256) {
  const fft = new FFT(nfft), spec = fft.createComplexArray(), time = fft.createComplexArray();
  const total = nfft + hop * (frames - 1), y = new Float64Array(total), env = new Float64Array(total);
  const win = Float64Array.from({ length: nfft }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / nfft));
  for (let t = 0; t < frames; t++) {
    for (let f = 0; f < bins; f++) { spec[2 * f] = real[f * frames + t]; spec[2 * f + 1] = imag[f * frames + t]; }
    for (let f = bins; f < nfft; f++) { spec[2 * f] = spec[2 * (nfft - f)]; spec[2 * f + 1] = -spec[2 * (nfft - f) + 1]; }
    fft.inverseTransform(time, spec);
    for (let i = 0; i < nfft; i++) { const j = t * hop + i; y[j] += time[2 * i] * win[i]; env[j] += win[i] * win[i]; }
  }
  const pad = nfft / 2, out = new Float32Array(total - 2 * pad);
  for (let i = 0; i < out.length; i++) {
    const j = i + pad;
    if (env[j] < 1e-11) throw new WorkerVoiceError('ISTFT', 'Invalid overlap');
    out[i] = Math.max(-1, Math.min(1, y[j] / env[j]));
  }
  return out;
}

async function synthesize({ text, encoder, decoder, vocoder, configText, manifestText }) {
  if (!PROMPTS.has(text)) throw new WorkerVoiceError('TEXT_NOT_QUALIFIED', 'Blocked: not a qualified interface prompt.');
  const cfg = JSON.parse(configText);
  const manifest = JSON.parse(manifestText);
  const T = (type, data, dims) => new ort.Tensor(type, data, dims);
  const I = (x) => T('int64', BigInt64Array.of(BigInt(x)), [1]);
  const opts = { executionProviders: ['wasm'], intraOpNumThreads: 2, interOpNumThreads: 1 };
  const [encS, decS, vocS] = await Promise.all([
    ort.InferenceSession.create(new Uint8Array(encoder), opts),
    ort.InferenceSession.create(new Uint8Array(decoder), opts),
    ort.InferenceSession.create(new Uint8Array(vocoder), opts)
  ]);
  const vocab = new Map(cfg.vocab.symbols.map((s, i) => [s, i]));
  const chars = Array.from(text.normalize('NFC'));
  for (const ch of chars) if (!vocab.has('c:' + ch)) throw new WorkerVoiceError('UNSUPPORTED_TEXT', 'Character is not supported');
  const ids = new BigInt64Array(chars.length * 2 + 1);
  chars.forEach((ch, i) => ids[2 * i + 1] = BigInt(vocab.get('c:' + ch)));
  if (ids.length > manifest.max_tokens) throw new WorkerVoiceError('TEXT_TOO_LONG', 'Text exceeds tested bound');

  // Config-driven speaker selection (replaces the pilot's hardcoded te_M):
  // use the first declared speaker id and its matching length_scale entry.
  const speakerKeys = Object.keys(cfg.ids.speakers);
  if (speakerKeys.length === 0) throw new WorkerVoiceError('BAD_CONFIG', 'Model config declares no speakers');
  const speakerKey = speakerKeys[0];
  const speakerId = cfg.ids.speakers[speakerKey];
  const scale = cfg.synthesis.length_scale[speakerKey];
  if (typeof scale !== 'number') throw new WorkerVoiceError('BAD_CONFIG', `No length_scale for speaker '${speakerKey}'`);

  const enc = await encS.run({
    tokens: T('int64', ids, [1, ids.length]),
    token_lengths: I(ids.length),
    language: I(cfg.ids.language),
    speaker: I(speakerId),
    style: I(cfg.ids.styles.read)
  });
  const tx = ids.length, C = 100;
  let sum = 0;
  const cum = new Float32Array(tx);
  for (let i = 0; i < tx; i++) { sum += Math.fround(Math.ceil(Math.exp(enc.logw.data[i])) * scale); cum[i] = Math.fround(sum); }
  const len = Math.max(1, Math.trunc(Math.fround(sum)));
  const pad = Math.ceil(len / manifest.frame_multiple) * manifest.frame_multiple;
  if (len > 2500) throw new WorkerVoiceError('AUDIO_TOO_LONG', 'Duration exceeds bound');
  const mu = new Float32Array(C * pad), mask = new Float32Array(pad);
  let k = 0;
  for (let j = 0; j < pad; j++) { while (k < tx && cum[k] <= j) k++; if (j < len && k < tx) { mask[j] = 1; for (let c = 0; c < C; c++) mu[c * pad + j] = enc.mu_x.data[c * tx + k]; } }
  let x = normalNoise(C * pad);
  for (let i = 0; i < x.length; i++) x[i] *= cfg.synthesis.temperature;
  const steps = cfg.synthesis.n_timesteps;
  for (let s = 0; s < steps; s++) {
    const r = await decS.run({ x: T('float32', x, [1, C, pad]), mask: T('float32', mask, [1, 1, pad]), mu: T('float32', mu, [1, C, pad]), t: T('float32', Float32Array.of(s / steps), [1]), cond: enc.cond });
    const out = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) out[i] = x[i] + r.v.data[i] / steps;
    x = out;
  }
  const mel = new Float32Array(C * len);
  for (let c = 0; c < C; c++) for (let j = 0; j < len; j++) mel[c * len + j] = x[c * pad + j] * cfg.mel_stats[1] + cfg.mel_stats[0];
  const r = await vocS.run({ mel: T('float32', mel, [1, C, len]) });
  const samples = istft(r.real.data, r.imag.data, 513, len);
  return { samples, sampleRate: cfg.sample_rate };
}

self.onmessage = async (ev) => {
  const msg = ev.data || {};
  try {
    const out = await synthesize(msg);
    self.postMessage({ jobId: msg.jobId, ok: true, samples: out.samples.buffer, sampleRate: out.sampleRate }, [out.samples.buffer]);
  } catch (err) {
    self.postMessage({ jobId: msg.jobId, ok: false, code: err.code || 'INFERENCE_FAILED', error: String(err.message || err) });
  }
};
