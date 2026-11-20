/**
 * Resample mono/multi-channel PCM to 16 kHz mono Float32 for on-device ASR.
 * The qualified OSS ASR models (OVOS IndicConformer te/hi) expect 16 kHz
 * mono; microphones deliver 44.1/48 kHz and the local TTS tier emits 24 kHz,
 * so every on-device ASR path funnels through here first.
 *
 * Method: per-channel mix-down to mono, then band-limited-ish linear
 * interpolation on the ratio grid. Linear interpolation is acceptable for
 * speech ASR front-ends at these ratios and keeps the implementation
 * dependency-free and auditable; the ASR qualification runs validated the
 * model against this exact preprocessing.
 */

export function mixDownToMono(channels) {
  if (!Array.isArray(channels) || channels.length === 0) {
    throw new Error('mixDownToMono: expected a non-empty array of Float32Array channels');
  }
  if (channels.length === 1) return channels[0];
  const len = channels[0].length;
  const out = new Float32Array(len);
  for (const ch of channels) {
    if (ch.length !== len) throw new Error('mixDownToMono: channel length mismatch');
    for (let i = 0; i < len; i++) out[i] += ch[i];
  }
  const inv = 1 / channels.length;
  for (let i = 0; i < len; i++) out[i] *= inv;
  return out;
}

export function resampleTo16k(mono, inputRate) {
  if (!(mono instanceof Float32Array) || mono.length === 0) {
    throw new Error('resampleTo16k: samples must be a non-empty Float32Array');
  }
  const rate = Number(inputRate);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('resampleTo16k: invalid input sample rate');
  }
  const TARGET = 16000;
  if (rate === TARGET) return mono;
  const ratio = rate / TARGET;
  const outLen = Math.max(1, Math.round(mono.length / ratio));
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const idx = Math.floor(pos);
    const frac = pos - idx;
    const a = mono[Math.min(idx, mono.length - 1)];
    const b = mono[Math.min(idx + 1, mono.length - 1)];
    out[i] = a + (b - a) * frac;
  }
  return out;
}

/**
 * Decode an audio Blob (wav/mp3/m4a/ogg from the recorder) and return
 * 16 kHz mono Float32 samples ready for the on-device ASR worker.
 * Browser-only (needs AudioContext.decodeAudioData).
 */
export async function prepareClipForOnDeviceAsr(blob, { audioContextFactory } = {}) {
  if (!blob || typeof blob.arrayBuffer !== 'function') {
    throw new Error('prepareClipForOnDeviceAsr: expected an audio Blob');
  }
  const Ctx = audioContextFactory || (typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null);
  if (!Ctx) throw new Error('prepareClipForOnDeviceAsr: no AudioContext available');
  const ctx = new Ctx();
  try {
    const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    const channels = [];
    for (let c = 0; c < decoded.numberOfChannels; c++) channels.push(decoded.getChannelData(c));
    const mono = mixDownToMono(channels);
    return { samples: resampleTo16k(mono, decoded.sampleRate), sampleRate: 16000, durationSeconds: decoded.duration };
  } finally {
    try { ctx.close && ctx.close(); } catch { /* already closed */ }
  }
}
