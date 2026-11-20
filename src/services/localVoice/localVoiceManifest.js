/**
 * AyuSwar AI — Local OSS voice fallback: model registry & qualification boundary.
 *
 * SCOPE (honest):
 * - Only Telugu TTS is qualified today, and only for the THREE fixed interface
 *   prompts below (desktop-verified 2026-11-20 by the independent pilot; not
 *   Android-verified, not clinically validated).
 * - Arbitrary/clinical text is REJECTED by design (TEXT_NOT_QUALIFIED). Do not
 *   widen this set without a new qualification round per language/prompt.
 * - Models are NOT bundled with the app. They install only after explicit user
 *   consent that displays the byte size, and every byte is hash-verified
 *   against the pinned values below before first use.
 *
 * LICENSES (retain notices in distribution):
 * - Acoustic TTS weights: CC-BY-4.0 (attribution: sulabhkatiyar/indic-tiny-tts-telugu)
 * - TTS code: MIT; Vocos vocoder weights: MIT; ONNX Runtime: MIT; FFT.js: MIT.
 * - Full bundled notices ship with the model download (LICENSE.md from the repo).
 */

export const LOCAL_VOICE_PROVIDERS = Object.freeze({
  LOCAL_OSS: 'local_oss_onnx',
  GNANI: 'gnani_tts_live',
  BROWSER_OS: 'browser_or_os'
});

// The ONLY text the local tier may speak. Exact strings, Telugu interface
// prompts qualified by the pilot (clinicalPlaybackAllowed stays false).
export const QUALIFIED_INTERFACE_PROMPTS = Object.freeze([
  'నమస్కారం. మీ ఆరోగ్య వివరాలను నమోదు చేయండి.',
  'మళ్లీ ప్రయత్నించండి.',
  'దయచేసి వివరాలను చదవండి.'
]);

const HF = 'https://huggingface.co';
const TTS_REPO = 'sulabhkatiyar/indic-tiny-tts-telugu';
const TTS_REV = 'fb552545f06d76d7b5d6365827b69c0bda465767';

export const TTS_MODELS = Object.freeze({
  te: Object.freeze({
    language: 'te',
    displayName: 'Telugu interface voice',
    qualifiedPromptsOnly: true,
    license: Object.freeze({
      weights: 'CC-BY-4.0',
      code: 'MIT',
      vocoderWeights: 'MIT',
      attribution: 'sulabhkatiyar/indic-tiny-tts-telugu (Rasa / AI4Bharat lineage notices retained)',
      noticesUrl: `${HF}/${TTS_REPO}/blob/${TTS_REV}/LICENSE.md`
    }),
    // Small JSON sidecars are pinned too: config drives speaker/language ids,
    // manifest drives runtime bounds. Substituting them changes behavior.
    files: Object.freeze([
      Object.freeze({ key: 'text_encoder', url: `${HF}/${TTS_REPO}/resolve/${TTS_REV}/onnx/text_encoder.onnx`, bytes: 17692254, sha256: '728d9c2529e00d30de480c598369fad24919f83cd0ac44994a64724bbd3e3839' }),
      Object.freeze({ key: 'flow_decoder', url: `${HF}/${TTS_REPO}/resolve/${TTS_REV}/onnx/flow_decoder.onnx`, bytes: 19169253, sha256: 'a523c39fe6b5df3a8cc76953fce9572ea6b7d3b8677d9232a4d5968fec75c40d' }),
      Object.freeze({ key: 'vocoder', url: `${HF}/${TTS_REPO}/resolve/${TTS_REV}/onnx/vocoder.onnx`, bytes: 54150036, sha256: '44d36238a761750447038895ab194e2378f6f4ba2c2d089a4766fa52810ef353' }),
      Object.freeze({ key: 'tts_config', url: `${HF}/${TTS_REPO}/resolve/${TTS_REV}/config.json`, bytes: 3216, sha256: 'dbca980b6589573c4e7d443e3443e779b18407df5e5d33c0273142be935691d4' }),
      Object.freeze({ key: 'onnx_manifest', url: `${HF}/${TTS_REPO}/resolve/${TTS_REV}/onnx/onnx_manifest.json`, bytes: 3114, sha256: '9279ccdf26a12edbd138388b2ccf5f61237dee1063ed9eff885c76053efd61a6' })
    ])
  })
});

export function ttsTotalBytes(lang) {
  const m = TTS_MODELS[lang];
  if (!m) return 0;
  return m.files.reduce((s, f) => s + f.bytes, 0);
}
