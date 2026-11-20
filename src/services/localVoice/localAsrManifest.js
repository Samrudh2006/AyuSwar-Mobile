/**
 * AyuSwar AI — Offline ASR (speech-to-text) pack manifest.
 *
 * Model: AI4Bharat Telugu IndicConformer (CTC), community ONNX conversion by
 * OpenVoiceOS (repo pinned below). The SHIPPING weights are the pilot-qualified
 * local MatMul/Gemm-only dynamic-INT8 derivative of the pinned FP32 original:
 * the repo's own int8 file fails ConvInteger on the tested CPU/WASM runtimes,
 * so the pilot generated this derivative with onnxruntime 1.23.2
 * quantize_dynamic(MatMul,Gemm). It is NOT an AI4Bharat or OpenVoiceOS
 * official artifact - retain this disclosure with the pack.
 *
 * Preprocessor: nemo80_conv.onnx from the onnx-asr==0.12.0 package (MIT),
 * convolutional spectral preprocessing (no browser-unsupported STFT ops).
 *
 * Licenses: model conversion card MIT; original AI4Bharat model family MIT;
 * onnx-asr MIT. Retain all notices.
 *
 * Accuracy boundary: pilot qualification showed omissions and substitutions on
 * synthetic fixtures. Output is a DRAFT transcript for human review only -
 * never auto-applied to clinical records.
 *
 * Download hosting: the derivative is distributed as a GitHub Release asset of
 * this repository (no third-party account, no CDN); tiny files are pinned from
 * the original repos. Release tag must match the shipped app version.
 */

export const ASR_RELEASE_TAG = 'v0.1.0';
export const ASR_RELEASE_BASE = `https://github.com/Samrudh2006/AyuSwar-Mobile/releases/download/${ASR_RELEASE_TAG}`;
const OVOS = 'https://huggingface.co/OpenVoiceOS/ai4bharat-indicconformer-te-onnx/resolve/d952dec2a1d256a1569cdfc9a9615cba05a1a2e3';

export const ASR_MODELS = Object.freeze({
  te: Object.freeze({
    label: 'Telugu offline transcription (IndicConformer CTC, INT8)',
    files: Object.freeze([
      Object.freeze({
        key: 'asr',
        file: 'asr.onnx',
        url: `${ASR_RELEASE_BASE}/asr-te-matmul-int8.onnx`,
        bytes: 185990043,
        sha256: 'a67b8aa4840fd78934f6246e626c183f9a07773fa910e3012349a6081fbeb1aa'
      }),
      Object.freeze({
        key: 'preprocessor',
        file: 'preprocessor.onnx',
        url: `${ASR_RELEASE_BASE}/asr-te-preprocessor-nemo80-conv.onnx`,
        bytes: 1140933,
        sha256: '1566e840c72d032dfb31166b924d96fe2a6c8a6c29393da8e83c19d99de0eb76'
      }),
      Object.freeze({
        key: 'vocab',
        file: 'vocab.txt',
        url: `${OVOS}/vocab.txt`,
        bytes: 2706,
        sha256: 'dc0b7bbb9eca8d3c8aebf1eb86e3144c90d692b4008cf5a32d46437b942b23ac'
      })
    ]),
    provenance: {
      originalRepo: 'OpenVoiceOS/ai4bharat-indicconformer-te-onnx',
      originalRevision: 'd952dec2a1d256a1569cdfc9a9615cba05a1a2e3',
      originalFp32Sha256: '3ed6bfab7afc58a7b6924c6f45c060c75e7d45172dd624e51c38482f882514cc',
      derivative: 'local MatMul/Gemm dynamic INT8 quantization (onnxruntime 1.23.2); not an official AI4Bharat/OpenVoiceOS artifact',
      baseModel: 'ai4bharat/indicconformer_stt_te_hybrid_ctc_rnnt_large',
      license: 'MIT (conversion card and original model family); onnx-asr preprocessor MIT'
    },
    // Pilot-qualified operating envelope; the worker refuses anything outside it.
    sampleRate: 16000,
    minSeconds: 0.1,
    maxSeconds: 15,
    vocabSize: 257,
    blankId: 256
  })
});

export function asrTotalBytes(language) {
  const m = ASR_MODELS[language];
  return m ? m.files.reduce((sum, f) => sum + f.bytes, 0) : 0;
}
