/**
 * Encode mono Float32 PCM samples ([-1, 1]) into a 16-bit PCM WAV
 * ArrayBuffer so on-device synthesis output can reuse the existing
 * playAudioBuffer playback path. No resampling is done here; the caller
 * must keep the model's native sampleRate in the header.
 */
export function float32ToWavArrayBuffer(samples, sampleRate) {
  if (!(samples instanceof Float32Array) || samples.length === 0) {
    throw new Error('float32ToWavArrayBuffer: samples must be a non-empty Float32Array');
  }
  const rate = Number(sampleRate);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('float32ToWavArrayBuffer: invalid sampleRate');
  }
  const dataBytes = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);
  const writeStr = (offset, s) => { for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);          // PCM chunk size
  view.setUint16(20, 1, true);           // PCM format
  view.setUint16(22, 1, true);           // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);    // byte rate
  view.setUint16(32, 2, true);           // block align
  view.setUint16(34, 16, true);          // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }
  return buffer;
}
