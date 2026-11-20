# Evaluation data plan (ASR)

Scope: evaluation data for the speech pipeline requested in the user's
research brief (WhatsApp, 2026-11-20): WER/CER measurement per dialect,
Telugu + Hindi + code-mixed speech. This document fixes provenance,
licenses, split discipline and contamination rules BEFORE any integration.
No dataset is committed to this repository; audio is fetched locally by
`scripts/fetch-fleurs.sh` into the git-ignored `eval-data/` directory.

## Selected source (verified 2026-11-20)

### Google FLEURS (te_in, hi_in)

- Source: https://huggingface.co/datasets/google/fleurs
- Access: public, `gated=false` (verified via the Hugging Face API on
  2026-11-20). No account, login or terms acceptance required.
- License: CC-BY-4.0. Obligation: attribution with the citation below,
  plus a change notice if the data is modified. Applies to any
  distributed artifact that includes or derives from the data.
- Citation (required):

  @article{fleurs2022arxiv,
    title = {FLEURS: Few-shot Learning Evaluation of Universal
             Representations of Speech},
    author = {Conneau, Alexis and Ma, Min and Khanuja, Simran and
              Zhang, Yu and Axelrod, Vera and Dalmia, Siddharth and
              Riesa, Jason and Rivera, Clara and Bapna, Ankur},
    journal = {arXiv preprint arXiv:2205.12446},
    year = {2022}}

- Artifacts per language: `data/<lang>/train.tsv`, `dev.tsv`, `test.tsv`
  and `data/<lang>/audio/{train,dev,test}.tar.gz` (16 kHz WAV).
- Raw TSV schema (observed by direct inspection of `te_in/test.tsv`,
  472 rows, 7 tab-separated fields, 2026-11-20): col1 = utterance-group
  id (302 distinct values; rows sharing an id carry identical
  transcriptions, so it is a sentence/group key, NOT a speaker id),
  col2 = WAV filename, col3 = raw transcription (punctuated),
  col4 = normalized transcription, col5 = character-tokenized
  transcription, col6 = audio sample count, col7 = gender label
  (MALE/FEMALE). The Hugging Face processed view exposes these as named
  features (id, num_samples, path, audio, transcription,
  raw_transcription, gender, lang_id, language, lang_group_id).
- Speaker independence of the official train/dev/test splits is a
  property to confirm from the FLEURS paper (arXiv:2205.12446) before
  relying on it; the raw TSVs alone cannot demonstrate it.
- Verified SHA-256 (HF LFS object ids, 2026-11-20):
  - te_in dev.tar.gz   2ac52fa35be22b05ad041e2a2a443d10f4ef59449db07fe42cd644eb81ed7123
  - te_in test.tar.gz  65d764ab4c3e9531eb61ffea4d0a78832d520f238ef0f339a7871f19c1653fd8
  - hi_in dev.tar.gz   9adbca6d6fc70e40c121910941bcd7c8906eee60b402b6d21b4bd160e20030c7
  - hi_in test.tar.gz  47c238b9cf7016ba596639bb3038b0c89dc6e85759f16d09c4f58c6dfa25c65f

## Split discipline

- `test` splits are ONLY for final reported metrics. They are never used
  for fine-tuning, prompt tuning, threshold selection or model selection.
- `dev` splits are for iteration during development.
- `train` splits are only fetched if and when a fine-tuning task is
  explicitly decided. Training and evaluation splits stay disjoint.
- The fetch script downloads dev+test only by default; train requires an
  explicit flag.

## Contamination and benchmark-honesty rules

- Before reporting WER for any model, record what is known or unknown
  about that model's training data. If a public test split may overlap
  the model's training data (true by construction for the publishing
  lab's own models), that exposure can make the measured WER
  optimistically low, and no defensible bound on performance on unseen
  data follows from it. Report the exposure status (known / suspected /
  unknown) next to the number; do not present an exposed result as a
  bound in either direction.
- Own-recorded or synthetic OPD samples are development and domain-fit
  checks: they probe doctor-patient vocabulary, code-mixing and noise.
  They are not a headline benchmark unless provenance, speaker
  independence (no speaker in both dev and reported sets; note the
  FLEURS raw TSVs carry no speaker-id field, so speaker-disjointness
  cannot be checked from those files alone), sample size and
  representativeness are documented, and they are never described as
  clinical validation.
- No performance number is stated anywhere (UI, docs, README, posts)
  without the measured set, model, date and command that produced it.

## Deferred / gated sources (not usable yet)

- AI4Bharat Kathbath, IndicVoices and Shrutilipi are each individually
  gated (`gated=auto`, verified 2026-11-20): each needs a Hugging Face
  account and its own terms acceptance. Accepting one does not unlock
  the others. No acceptance has been performed; they are out of scope
  until the user accepts terms himself.
- Mozilla Common Voice 27.0 (Telugu, CC0-1.0) is license-free but the
  Mozilla Data Collective download requires a free account and a usage
  declaration; no account has been created.
- "Vistaar" is AI4Bharat's benchmark harness (code), not a dataset.

## Status (2026-11-20)

Planning + fetch tooling only. `scripts/fetch-fleurs.sh` is
syntax-checked and its TSV download path was smoke-tested against
`te_in/test.tsv`; the audio tarball download and checksum path has not
been exercised end-to-end, no audio has been downloaded or decoded, and
no dataset or model is integrated into the app or its test suite.

## Non-goals

No clinical validation is claimed or implied by any evaluation here.
AyuSwar remains a synthetic demo prototype, not a medical device.
