/**
 * AyuSwar AI — Local TTS inference worker (onnxruntime-web/WASM, bundled, no CDN).
 *
 * Ported from the independent pilot core. Voice identity is PINNED: the app
 * manifest names the pilot-qualified speaker (te_M, id 13, length_scale
 * 1.0022) and this worker refuses any model config that disagrees, so the
 * shipping voice is exactly the qualified one, never a config-default drift.
 * The fixed prompt gate is single-sourced from localVoiceManifest.js and
 * re-checked here as defense-in-depth.
 *
 * Determinism: fixed-seed noise (same as pilot) so output is reproducible.
 */
import * as ort from 'onnxruntime-web';
import FFT from 'fft.js';
import { QUALIFIED_INTERFACE_PROMPTS, TTS_MODELS } from './localVoiceManifest.js';

// WASM must be served from the app's own origin, never a CDN. Builds (or test
// harnesses) set the base path before this module loads.
// WASM assets are served same-origin from <base>/ort-wasm/ (copied from
// node_modules at build time by the vite 'copy-ort-wasm' hook). An external
// bootstrap may override via self.ORT_WASM_PATH (test harnesses); the app
// default below is what production uses. The worker must NEVER resolve wasm
// from a CDN.
if (typeof self !== 'undefined') {
  if (self.ORT_WASM_PATH) {
    ort.env.wasm.wasmPaths = self.ORT_WASM_PATH;
  } else {
    const base = (import.meta.env && import.meta.env.BASE_URL) || '/';
    ort.env.wasm.wasmPaths = new URL(base + 'ort-wasm/', self.location.origin).href;
  }
}

const PROMPTS = new Set(QUALIFIED_INTERFACE_PROMPTS);

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

export async function synthesize({ text, language = 'te', encoder, decoder, vocoder, configText, manifestText }) {
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

  // Voice identity pinned to the pilot-qualified speaker. The APP manifest
  // (localVoiceManifest.js) names the qualified speaker; the MODEL config
  // must agree (id + length_scale) or the pack is rejected as substituted.
  // Never fall back to "first declared speaker" — that is how the unqualified
  // te_F default drifted in.
  const pinned = (TTS_MODELS[language] && TTS_MODELS[language].qualifiedVoice) || null;
  if (!pinned) throw new WorkerVoiceError('BAD_CONFIG', `No qualified voice pin for language '${language}'`);
  const speakerId = cfg.ids && cfg.ids.speakers ? cfg.ids.speakers[pinned.speaker] : undefined;
  if (speakerId === undefined || speakerId !== pinned.speakerId) {
    throw new WorkerVoiceError('BAD_CONFIG', `Model config speaker '${pinned.speaker}' id ${speakerId} does not match the qualified pin (${pinned.speakerId}); refusing substituted voice.`);
  }
  const scale = cfg.synthesis.length_scale[pinned.speaker];
  if (typeof scale !== 'number' || Math.abs(scale - pinned.lengthScale) > 1e-9) {
    throw new WorkerVoiceError('BAD_CONFIG', `length_scale for '${pinned.speaker}' is ${scale}, qualified pin is ${pinned.lengthScale}; refusing drifted voice.`);
  }

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

if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  self.onmessage = async (ev) => {
    const msg = ev.data || {};
    try {
      const out = await synthesize(msg);
      self.postMessage({ jobId: msg.jobId, ok: true, samples: out.samples.buffer, sampleRate: out.sampleRate }, [out.samples.buffer]);
    } catch (err) {
      self.postMessage({ jobId: msg.jobId, ok: false, code: err.code || 'INFERENCE_FAILED', error: String(err.message || err) });
    }
  };
}
