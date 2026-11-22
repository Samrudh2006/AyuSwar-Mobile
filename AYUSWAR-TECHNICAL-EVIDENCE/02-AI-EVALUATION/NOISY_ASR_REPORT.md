# Controlled-noise ASR degradation (offline fallback model)

First measured clean-vs-noisy delta for the local offline ASR. This is
**synthetic corruption of real read speech**, not recorded clinical noise
and not the in-app capture path. All inputs, hypotheses, scores and the
mixing manifest: `benchmarks/results/2026-11-22-noisy-te_in-test-sub120/`.

## Setup (fully recorded)

- Speech: FLEURS `te_in` test, seeded subset n=120 of 472 (seed 20261122,
  `refs-sub120.tsv` lists the exact clips). Same subset reused for every
  level, so deltas are paired, not sampling noise between sets.
- Noise: Microsoft MS-SNSD `noise_test/Babble_*.wav` (crowd babble),
  MIT license, 16 kHz mono. DEMAND (CC BY-SA 4.0) was preferred but
  Zenodo is unreachable from the build sandbox (HTTP 403); recorded here
  as the provenance note.
- Mixing: `benchmarks/mix_controlled_noise.py`, master seed 20261122.
  Per clip: seeded choice of noise file and offset; noise scaled so that
  whole-clip speech RMS vs noise-segment RMS hits the target SNR (no VAD;
  FLEURS clips are short and speech-dominant); int16 clamp. Exact
  per-clip noise file, offset and gain in `mix_manifest.json`.
- ASR: the same uncapped offline benchmark runner and int8 Telugu model
  as the clean benchmark (`benchmarks/fleurs_local_asr.mjs`, CPU,
  onnxruntime-node, greedy CTC). 0 transcription failures in all runs.
- Scoring: `benchmarks/fleurs_eval.py --ref-column normalized`
  (`score-*.json`), 120/120 references matched in every level.

## Results (corpus, n=120)

| Condition | Corpus WER | Corpus CER | ΔWER vs clean |
| :--- | :--- | :--- | :--- |
| clean (same subset) | 25.86% | 10.43% | - |
| babble SNR 20 dB | 26.40% | 10.72% | +0.54 pp |
| babble SNR 10 dB | 28.60% | 11.47% | +2.74 pp |
| babble SNR 5 dB | 33.99% | 14.35% | +8.13 pp |

These are measured deltas only. No acceptability threshold for noisy
speech is predefined for this project, so no hold/acceptable judgment is
made; the table simply records how the measured WER/CER of the local
fallback model changed as crowd-babble SNR dropped. Benchmark numbers for
the local fallback model only.

## Limits (unchanged scope discipline)

- NOT the shipping capture path: the benchmark runner is uncapped while
  the in-app offline worker caps input at 15 s; no on-device or
  microphone-pipeline claim.
- NOT clinical or Tenglish/code-switched speech; FLEURS is read news/web
  text.
- One noise type (crowd babble), whole-clip RMS scaling without VAD;
  real consultations have non-stationary, overlapping speakers.
- n=120 subset for runtime reasons; the clean full-test figure (n=472)
  stays the primary clean reference in `benchmarks/RESULTS.md`.

## Next usable work

- Second noise type (stationary, e.g. air-conditioner) for a
  stationary-vs-babble comparison; DEMAND when a reachable mirror exists.
- Full 472-clip noisy runs when benchmark compute time is budgeted.
