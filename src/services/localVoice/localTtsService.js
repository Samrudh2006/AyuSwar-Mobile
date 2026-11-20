/**
 * AyuSwar AI — Local TTS qualified tier (on-device ONNX, no network).
 *
 * Boundary (do not widen without a new qualification round):
 * - Speaks ONLY the fixed QUALIFIED_INTERFACE_PROMPTS. Anything else throws
 *   TEXT_NOT_QUALIFIED and the caller must fall through to the normal chain.
 * - Requires the model installed + integrity-verified (localModelManager).
 * - Runs inference in a dedicated Web Worker; timeout/cancel terminates and
 *   recreates the worker so a stuck kernel cannot wedge the UI thread.
 * - onStart must be wired by the CALLER to actual audio playback start,
 *   never to model completion.
 */

import { QUALIFIED_INTERFACE_PROMPTS, TTS_MODELS, LOCAL_VOICE_PROVIDERS } from './localVoiceManifest.js';
import { getModelStatus, getVerifiedModelFile, LocalVoiceError } from './localModelManager.js';

const WORKER_TIMEOUT_MS = 20000;

// Injectable for tests.
const env = {
  workerFactory: null, // () => Worker-like {postMessage, terminate, onmessage/onerror}
  timeoutMs: 0 // 0 = use WORKER_TIMEOUT_MS
};
export function _setWorkerFactoryForTests(factory) { env.workerFactory = factory; }
export function _setServiceEnvForTests(overrides) { Object.assign(env, overrides); }

function createWorker() {
  if (env.workerFactory) return env.workerFactory();
  return new Worker(new URL('./localTtsWorker.js', import.meta.url), { type: 'module' });
}

export function isQualifiedInterfacePrompt(text) {
  return QUALIFIED_INTERFACE_PROMPTS.includes(text);
}

/** Truthful availability for UI: installed + consented + supported language. */
export async function getLocalTtsAvailability(language = 'te') {
  const status = await getModelStatus(language);
  return {
    provider: LOCAL_VOICE_PROVIDERS.LOCAL_OSS,
    language,
    qualifiedPromptsOnly: true,
    available: status.state === 'installed',
    state: status.state,
    totalBytes: status.totalBytes || 0,
    clinicalPlaybackAllowed: false
  };
}

/**
 * Synthesize one qualified interface prompt entirely on-device.
 * Returns { samples: Float32Array, sampleRate, provider, originalText }.
 * Throws LocalVoiceError codes: TEXT_NOT_QUALIFIED, MODELS_NOT_INSTALLED,
 * HASH_MISMATCH, ABORTED, WORKER_TIMEOUT, INFERENCE_FAILED.
 */
export async function synthesizeQualifiedPrompt(text, { signal, language = 'te' } = {}) {
  if (!isQualifiedInterfacePrompt(text)) {
    throw new LocalVoiceError('TEXT_NOT_QUALIFIED', 'Local voice speaks only the fixed qualified interface prompts. Clinical or arbitrary text is blocked.');
  }
  const status = await getModelStatus(language);
  if (status.state !== 'installed') {
    throw new LocalVoiceError('MODELS_NOT_INSTALLED', `Local voice model for '${language}' is not installed (state: ${status.state}).`, { totalBytes: status.totalBytes });
  }
  const m = TTS_MODELS[language];
  const files = {};
  for (const f of m.files) {
    files[f.key] = await getVerifiedModelFile(`${language}/${f.key}`, f.sha256); // re-verified on every load
  }

  const worker = createWorker();
  const jobId = `tts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    return await new Promise((resolve, reject) => {
      let settled = false;
      const bound = env.timeoutMs > 0 ? env.timeoutMs : WORKER_TIMEOUT_MS;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        worker.terminate();
        reject(new LocalVoiceError('WORKER_TIMEOUT', 'Local voice inference exceeded the time bound; worker was terminated.'));
      }, bound);

      const cleanup = () => { clearTimeout(timer); if (signal) signal.removeEventListener('abort', onAbort); };
      const onAbort = () => {
        if (settled) return;
        settled = true;
        cleanup();
        worker.terminate();
        reject(new LocalVoiceError('ABORTED', 'Local voice synthesis cancelled.'));
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
            samples: new Float32Array(msg.samples),
            sampleRate: msg.sampleRate,
            provider: LOCAL_VOICE_PROVIDERS.LOCAL_OSS,
            originalText: text,
            clinicalValidated: false
          });
        } else {
          reject(new LocalVoiceError(msg.code || 'INFERENCE_FAILED', msg.error || 'Local voice inference failed.'));
        }
      };
      worker.onerror = (err) => {
        if (settled) return;
        settled = true;
        cleanup();
        worker.terminate();
        reject(new LocalVoiceError('INFERENCE_FAILED', `Worker error: ${err.message || err}`));
      };

      // Transfer the big buffers; config/manifest are small JSON text.
      const transfers = ['text_encoder', 'flow_decoder', 'vocoder'].map(k => files[k]);
      worker.postMessage({
        jobId,
        text,
        language,
        encoder: files.text_encoder,
        decoder: files.flow_decoder,
        vocoder: files.vocoder,
        configText: new TextDecoder().decode(files.tts_config),
        manifestText: new TextDecoder().decode(files.onnx_manifest)
      }, transfers);
    });
  } finally {
    try { worker.terminate(); } catch { /* already terminated */ }
  }
}
