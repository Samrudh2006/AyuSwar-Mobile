// Memory-only PCM recorder. No upload until the user taps Transcribe.
export async function openConsultationRecorder(onLevel) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone recording is unavailable in this browser.');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
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
      const frame = new Float32Array(input);
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
        for (const frame of frames) { pcm.set(frame, offset); offset += frame.length; }
        for (let i = 0; i < count; i++) {
          const position = i * rate / 16000;
          const index = Math.floor(position);
          const frac = position - index;
          const value = Math.max(-1, Math.min(1, pcm[index] * (1 - frac) + (pcm[Math.min(index + 1, samples - 1)] || 0) * frac));
          view.setInt16(44 + i * 2, Math.round(value * (value < 0 ? 32768 : 32767)), true);
        }
        return { blob: new Blob([buffer], { type: 'audio/wav' }), duration: samples / rate };
      }
    };
  } catch (error) {
    stream.getTracks().forEach(t => t.stop());
    if (ctx) ctx.close();
    throw error;
  }
}
