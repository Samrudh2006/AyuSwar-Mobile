/**
 * AyuSwar AI — Offline ASR (recorded-clip transcription) qualified tier.
 *
 * Boundary (do not widen without a new qualification round):
 * - Transcribes ONLY recorded clips already prepared by the caller (any
 *   recorder source); output is a DRAFT transcript that REQUIRES human
 *   review - it is never auto-applied to a clinical record
 *   (clinicalValidated stays false, draft: true).
 * - Requires the pack installed + integrity-verified (localAsrPackManager).
 * - Runs inference in a dedicated Web Worker; timeout/cancel terminates the
 *   worker so a stuck kernel cannot wedge the UI thread.
 * - Envelope: 0.1-15 s after resampling to 16 kHz mono
 *   (prepareClipForOnDeviceAsr); outside it throws OUT_OF_ENVELOPE.
 */

import { ASR_MODELS } from './localAsrManifest.js';
import { getAsrPackStatus, getVerifiedAsrFile } from './localAsrPackManager.js';
import { LocalVoiceError } from './localModelManager.js';
import { prepareClipForOnDeviceAsr } from './resample16k.js';

export const LOCAL_ASR_PROVIDER = 'local_oss_onnx_asr';

const WORKER_TIMEOUT_MS = 30000;

const env = {
  workerFactory: null, // () => Worker-like {postMessage, terminate, onmessage/onerror}
  timeoutMs: 0 // 0 = use WORKER_TIMEOUT_MS
};
export function _setAsrWorkerFactoryForTests(factory) { env.workerFactory = factory; }
export function _setAsrServiceEnvForTests(overrides) { Object.assign(env, overrides); }

function createWorker() {
  if (env.workerFactory) return env.workerFactory();
  return new Worker(new URL('./localAsrWorker.js', import.meta.url), { type: 'module' });
}

/** Truthful availability for UI: installed + supported language. */
export async function getLocalAsrAvailability(language = 'te') {
  const status = await getAsrPackStatus(language);
  return {
    provider: LOCAL_ASR_PROVIDER,
    language,
    available: status.state === 'installed',
    state: status.state,
    totalBytes: status.totalBytes || 0,
    draftOnly: true,
    requiresReview: true,
    clinicalValidated: false
  };
}

/**
 * Transcribe one recorded clip entirely on-device.
 * Returns { transcript, provider, draft, requiresReview, clinicalValidated,
 *           language, timings }.
 * Throws LocalVoiceError codes: MODELS_NOT_INSTALLED, OUT_OF_ENVELOPE,
 * HASH_MISMATCH, ABORTED, WORKER_TIMEOUT, INFERENCE_FAILED.
 */
export async function transcribeInstalledClip(audioBlob, { signal, language = 'te', audioContextFactory } = {}) {
  const m = ASR_MODELS[language];
  if (!m) throw new LocalVoiceError('UNSUPPORTED_LANGUAGE', `No local ASR model registered for '${language}'.`);
  const status = await getAsrPackStatus(language);
  if (status.state !== 'installed') {
    throw new LocalVoiceError('MODELS_NOT_INSTALLED', `Local ASR pack for '${language}' is not installed (state: ${status.state}).`, { totalBytes: status.totalBytes });
  }

  const prepared = await prepareClipForOnDeviceAsr(audioBlob, { audioContextFactory });
  const pcm = prepared.samples;
  if (pcm.length < Math.round(m.minSeconds * m.sampleRate) || pcm.length > Math.round(m.maxSeconds * m.sampleRate)) {
    throw new LocalVoiceError('OUT_OF_ENVELOPE', `Clip is ${(pcm.length / m.sampleRate).toFixed(2)}s at 16kHz; the qualified envelope is ${m.minSeconds}-${m.maxSeconds}s.`);
  }
  if (signal?.aborted) throw new LocalVoiceError('ABORTED', 'Local transcription cancelled.');

  const files = {};
  for (const f of m.files) {
    files[f.key] = await getVerifiedAsrFile(language, f.key, f.sha256); // re-verified on every load
  }
  if (signal?.aborted) throw new LocalVoiceError('ABORTED', 'Local transcription cancelled.');

  const worker = createWorker();
  const jobId = `asr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    return await new Promise((resolve, reject) => {
      let settled = false;
      const bound = env.timeoutMs > 0 ? env.timeoutMs : WORKER_TIMEOUT_MS;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        worker.terminate();
        reject(new LocalVoiceError('WORKER_TIMEOUT', 'Local ASR inference exceeded the time bound; worker was terminated.'));
      }, bound);

      const cleanup = () => { clearTimeout(timer); if (signal) signal.removeEventListener('abort', onAbort); };
      const onAbort = () => {
        if (settled) return;
        settled = true;
        cleanup();
        worker.terminate();
        reject(new LocalVoiceError('ABORTED', 'Local transcription cancelled.'));
      };
      if (signal) {
        if (signal.aborted) return onAbort();
        signal.addEventListener('abort', onAbort);
      }

      worker.onmessage = (ev) => {
        const msg = ev.data || {};
        if (msg.jobId !== jobId || settled) return;
        settled = true;
        cleanup();
        worker.terminate();
        if (msg.ok) {
          resolve({
            transcript: msg.transcript,
            provider: LOCAL_ASR_PROVIDER,
            draft: true,
            requiresReview: true,
            clinicalValidated: false,
            language,
            timings: msg.timings
          });
        } else {
          reject(new LocalVoiceError(msg.code || 'INFERENCE_FAILED', msg.error || 'Local ASR inference failed.'));
        }
      };
      worker.onerror = (err) => {
        if (settled) return;
        settled = true;
        cleanup();
        worker.terminate();
        reject(new LocalVoiceError('INFERENCE_FAILED', `Worker error: ${err.message || err}`));
      };

      worker.postMessage({
        jobId,
        pcmFloat32: pcm,
        preprocessor: files.preprocessor,
        asr: files.asr,
        vocabText: new TextDecoder().decode(files.vocab),
        expectedVocabSize: m.vocabSize,
        blankId: m.blankId
      }, [pcm.buffer, files.preprocessor, files.asr]);
    });
  } finally {
    try { worker.terminate(); } catch { /* already terminated */ }
  }
}
