# Controlled-noise ASR degradation (offline fallback model)

Measured clean-vs-noisy delta for the local offline ASR. This is
**synthetic corruption of real read speech**, not recorded clinical noise
and not the in-app capture path. Two runs are recorded below, kept
separate: the cleared current measurement (public-domain crowd recording)
and the superseded provisional run (license-unresolved noise), which is
retained for audit history only and is withheld from final PDF/APK
checkpoint materials.

## Current measurement: public-domain crowd walla (cleared provenance)

Artifacts: `benchmarks/results/2026-11-22-noisy-wallapd-te_in-test-sub120/`.

- Speech: FLEURS `te_in` test, seeded subset n=120 of 472 (seed 20261122,
  `refs-sub120.tsv` lists the exact clips). Same subset at every level, so
  deltas are paired. The clean row re-uses the same subset hypotheses.
- Noise: real crowd recording "Restaurant ambience.ogg" (restaurant
  walla, 76.3 s after conversion to 16 kHz mono int16), recorded 2007 by
  stephan (pdsounds.org), distributed via Wikimedia Commons.
  Owning-source file page
  <https://commons.wikimedia.org/wiki/File:Restaurant_ambience.ogg>
  verified 2026-11-22: **public domain, no attribution required**.
  Source ogg sha256
  `0aeb1fa7a3d9647d3284e97d9880b6375b54db2eda6a517c64e3bb02ac8a51cc`;
  converted wav sha256 recorded in the mix manifest.
- Mixing: `benchmarks/mix_controlled_noise.py`, master seed 20261122
  (same seed/subset/SNR recipe as the provisional run; the noise source
  differs, so it is a separate corruption condition, not an overwrite).
  Per clip: seeded offset into the recording; noise scaled so whole-clip
  speech RMS vs noise-segment RMS hits target SNR (no VAD); int16 clamp.
  Per-clip offset and gain in `mix_manifest.json`.
- ASR: same uncapped offline benchmark runner and int8 Telugu model as
  the clean benchmark; 0 transcription failures at every level.
- Scoring: `benchmarks/fleurs_eval.py --ref-column normalized`
  (`score-*.json`), 120/120 references matched at every level.

| Condition | Corpus WER | Corpus CER | ΔWER vs clean |
| :--- | :--- | :--- | :--- |
| clean (same subset) | 25.86% | 10.43% | - |
| crowd walla, SNR 20 dB | 25.91% | 10.64% | +0.05 pp |
| crowd walla, SNR 10 dB | 27.08% | 10.97% | +1.22 pp |
| crowd walla, SNR 5 dB | 30.66% | 12.00% | +4.80 pp |

These are measured deltas only. No acceptability threshold for noisy
speech is predefined for this project, so no hold/acceptable judgment is
made. Benchmark numbers for the local fallback model only.

### Limits

- NOT the shipping capture path (runner uncapped; in-app worker caps at
  15 s). No device or microphone-pipeline claim.
- NOT clinical, Tenglish/code-switched, or dialect speech; FLEURS is read
  news/web text.
- One crowd recording, whole-clip RMS scaling without VAD; real
  consultations have non-stationary, overlapping speakers.
- n=120 subset for runtime; the clean full-test figure (n=472) stays the
  primary clean reference in `benchmarks/RESULTS.md`.
- No train-leakage claim: whether this recording appeared in the ASR
  model's training data was not audited and is not asserted.

## Superseded provisional run (audit history, withheld from final materials)

An earlier run used MS-SNSD `noise_test/Babble_*.wav` (same recipe and
subset): clean 25.86% -> 33.99% WER at 5 dB. Its noise-source license is
UNRESOLVED: the MS-SNSD README licenses the code as MIT but the noise
data under upstream terms (Freesound CC0 selections or DEMAND CC BY-SA
3.0) with no per-file mapping, and Babble_1/Babble_4 could not be traced
to either source. Those numbers stay in
`benchmarks/results/2026-11-22-noisy-te_in-test-sub120/` as a provisional
methodology record only (numerical methodology independently audited:
1416 mixes, 0 clipped samples, achieved SNR within 0.002 dB of target;
inputs pinned to MS-SNSD master `fe61c4ba` with file sha256s). They are
superseded by the cleared measurement above and must not appear in final
PDF/APK checkpoint materials.

## Next usable work

- A second, stationary noise type (e.g. an air-conditioner recording with
  the same owning-source verification) for a stationary-vs-crowd contrast.
- Full 472-clip noisy runs when benchmark compute time is budgeted.
