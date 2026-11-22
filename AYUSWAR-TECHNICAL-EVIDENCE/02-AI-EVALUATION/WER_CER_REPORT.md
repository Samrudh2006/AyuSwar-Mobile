# WER/CER report

Measured rows and full methodology: [benchmarks/RESULTS.md](../../benchmarks/RESULTS.md).
Machine-readable rows: [ASR_BENCHMARKS.csv](ASR_BENCHMARKS.csv), generated from
the committed scorer JSON files (`benchmarks/results/2026-11-22-fleurs-*.json`).

Scope recap: offline fallback ONNX Conformer CTC models on FLEURS read-speech
splits, uncapped benchmark runner, CPU greedy decode. Not the shipping 15s
capture path, not clinical consultation speech, not a cloud provider's quality,
not clinical validation. Telugu test WER 23.46 / CER 7.93; Hindi pilot test
WER 11.19 / CER 4.68.
