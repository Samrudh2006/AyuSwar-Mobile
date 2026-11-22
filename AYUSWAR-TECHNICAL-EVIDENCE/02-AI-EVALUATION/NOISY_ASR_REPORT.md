# Controlled-noise ASR degradation (offline fallback model)

First measured clean-vs-noisy delta for the local offline ASR. This is
**synthetic corruption of real read speech**, not recorded clinical noise
and not the in-app capture path. **PROVISIONAL: noise-source licensing is
unresolved (see Setup); not for publication until re-run with a clearly
licensed source.** All inputs, hypotheses, scores and the
mixing manifest: `benchmarks/results/2026-11-22-noisy-te_in-test-sub120/`.

## Setup (fully recorded)

- Speech: FLEURS `te_in` test, seeded subset n=120 of 472 (seed 20261122,
  `refs-sub120.tsv` lists the exact clips). Same subset reused for every
  level, so deltas are paired, not sampling noise between sets.
- Noise: Microsoft MS-SNSD `noise_test/Babble_*.wav` (crowd babble),
  16 kHz mono. **LICENSE UNRESOLVED - measurement provisional, not for
  publication.** The MS-SNSD README licenses the CODE as MIT but the
  noise DATA under the original upstream terms: Freesound selections
  (CC0) or DEMAND (CC BY-SA 3.0). The repo does not map individual files
  to sources, the Babble wavs carry no metadata, and the upload commit
  names no origin, so Babble_1/Babble_4 could not be traced. If they are
  DEMAND-derived, CC BY-SA 3.0 attribution/share-alike applies. The
  numbers below are retained as a provisional methodology record only;
  re-running with a clearly licensed noise source is tracked as required
  follow-up before this measurement is published. DEMAND direct
  (CC BY-SA) was preferred but Zenodo is unreachable from the build
  sandbox (HTTP 403).
- Mixing: `benchmarks/mix_controlled_noise.py`, master seed 20261122.
  Pinned inputs: MS-SNSD master `fe61c4ba0d9ac8dd7e23d719cc79f8947e1dc742`
  (files uploaded in `2bb469c2765658dd0d7e527959876c909e14e21b`);
  Babble_1.wav sha256 `d7a64dd995a92f4790308dbff196332585eec502734ac737bfc9e2ac317dacd6`,
  Babble_4.wav sha256 `efe74a9f9a011c13de39e16bef362f0d60f574ce416d11b6058662bef312a80d`
  (also recorded in the mix manifest). Independent numerical audit
  re-derived all 1416 mixes with 0 clipped samples and achieved SNR within
  0.002 dB of target.
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
- No train-leakage claim: whether MS-SNSD noise appeared in the ASR
  model's own training data was not audited and is not asserted.
- n=120 subset for runtime reasons; the clean full-test figure (n=472)
  stays the primary clean reference in `benchmarks/RESULTS.md`.

## Next usable work

- Second noise type (stationary, e.g. air-conditioner) for a
  stationary-vs-babble comparison; DEMAND when a reachable mirror exists.
- Full 472-clip noisy runs when benchmark compute time is budgeted.
