// Memory-only PCM recorder. No upload until the user taps Transcribe.
// Recording requires explicit on-device recording consent (rural-PHC must-have).
import { assertRecordingConsent } from './recordingConsent.js';

// Rural-PHC must-have (noise gate), implemented conservatively after audit:
// the gate is OFF BY DEFAULT and user-controllable from the recording UI.
// Capture always stores RAW frames; gating is applied at export time on a copy
// (applyNoiseGate), so a quiet voice is never irreversibly lost during capture
// and the raw source survives until review. Honest scope: this is a simple
// fixed-threshold energy gate, NOT a validated speech denoiser or adaptive
// noise cancellation; when enabled it can soften quiet speech below the
// threshold, which the recording UI states next to the toggle.
export const GATE_THRESHOLD = 0.012; // RMS (~ -38 dBFS): steady room hum/fan noise between speech
export const GATE_HOLD_FRAMES = 6;   // ~250 ms at 4096-sample frames: keeps word tails

export function applyNoiseGate(frames) {
  let gateHold = 0;
  return frames.map((frame) => {
    let sum = 0;
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
    const rms = Math.sqrt(sum / frame.length);
    if (rms >= GATE_THRESHOLD) { gateHold = GATE_HOLD_FRAMES; return frame; }
    if (gateHold > 0) { gateHold -= 1; return frame; }
    return new Float32Array(frame.length); // silence
  });
}

export async function openConsultationRecorder(onLevel, options = {}) {
  assertRecordingConsent();
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone recording is unavailable in this browser.');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
  const noiseGate = options.noiseGate === true;
  let ctx;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
    await ctx.resume();
    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    const mute = ctx.createGain();
    mute.gain.value = 0;
    const frames = [];
    let samples = 0;
    processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const frame = new Float32Array(input); // RAW frame, always retained
      frames.push(frame);
      samples += frame.length;
      let sum = 0;
      for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
      onLevel(Math.sqrt(sum / frame.length), samples / ctx.sampleRate);
    };
    source.connect(processor);
    processor.connect(mute);
    mute.connect(ctx.destination);
    let closed = false;
    return {
      stop() {
        if (closed) return null;
        closed = true;
        processor.onaudioprocess = null;
        source.disconnect(); processor.disconnect(); mute.disconnect();
        stream.getTracks().forEach(t => t.stop());
        const rate = ctx.sampleRate;
        ctx.close();
        const count = Math.floor(samples * 16000 / rate);
        const buffer = new ArrayBuffer(44 + count * 2);
        const view = new DataView(buffer);
        const text = (offset, value) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
        text(0, 'RIFF'); view.setUint32(4, 36 + count * 2, true); text(8, 'WAVE'); text(12, 'fmt ');
        view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
        view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
        text(36, 'data'); view.setUint32(40, count * 2, true);
        const pcm = new Float32Array(samples);
        let offset = 0;
        // Gate (when the user enabled it) is applied here, at export, on a
        // derived copy - the raw frames above are never modified.
        const exportFrames = noiseGate ? applyNoiseGate(frames) : frames;
        for (const frame of exportFrames) { pcm.set(frame, offset); offset += frame.length; }
        for (let i = 0; i < count; i++) {
          const position = i * rate / 16000;
          const index = Math.floor(position);
          const frac = position - index;
          const value = Math.max(-1, Math.min(1, pcm[index] * (1 - frac) + (pcm[Math.min(index + 1, samples - 1)] || 0) * frac));
          view.setInt16(44 + i * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true);
        }
        return { blob: new Blob([buffer], { type: 'audio/wav' }), duration: samples / rate, noiseGate };
      }
    };
  } catch (error) {
    stream.getTracks().forEach(t => t.stop());
    if (ctx) ctx.close();
    throw error;
  }
}
