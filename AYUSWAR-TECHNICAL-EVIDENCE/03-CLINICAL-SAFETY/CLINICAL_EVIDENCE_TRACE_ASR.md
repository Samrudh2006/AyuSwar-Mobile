# Recorded ASR trace: input-length scope

The historical measurements in [CLINICAL_EVIDENCE_TRACE_ASR.json](CLINICAL_EVIDENCE_TRACE_ASR.json) are unchanged.

The respiratory input, `public/audio/gnani_telugu_rx_respiratory.wav`, has a recorded decoded duration of **17.92 seconds at 16 kHz** (`inputs[0].durationSecAt16k`). The trace generator, [`scripts/export_clinical_evidence_trace_asr.mjs`](../../scripts/export_clinical_evidence_trace_asr.mjs), passes the full decoded clip to local Node ONNX inference. It does not run the shipping ASR service/worker input gate.

The shipping worker in [`src/services/localVoice/localAsrWorker.js`](../../src/services/localVoice/localAsrWorker.js) limits input to **15 seconds** at 16 kHz and rejects longer PCM arrays before inference; the same envelope is declared in [`localAsrManifest.js`](../../src/services/localVoice/localAsrManifest.js).

Therefore the 17.92-second respiratory trace exceeds the shipping input cap. It is full-clip local-inference and downstream fallback-extraction evidence, **not shipping-path evidence**. The recorded transcript must not be presented as an output obtainable by submitting this complete clip to the shipping worker. This clarification does not claim equivalent results for truncation, segmentation, browser WASM, or a native device.

The two shorter clips in the trace do not, by length alone, establish shipping-path performance either. All three inputs are synthetic TTS, not real consultations. Extraction remains the labelled deterministic fallback, with a demo reviewer. No inference was rerun and no historical transcript, measurement, provenance field or approval status was changed for this documentation clarification.
