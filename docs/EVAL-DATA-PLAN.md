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
- Pinned dataset revision: HF commit
  `70bb2e84b976b7e960aa89f1c648e09c59f894dd` (2026-11-20). The fetch
  script resolves artifacts against this revision, not `main`.
- Verified SHA-256 audio tarballs (HF LFS object ids, 2026-11-20):
  - te_in dev.tar.gz   2ac52fa35be22b05ad041e2a2a443d10f4ef59449db07fe42cd644eb81ed7123
  - te_in test.tar.gz  65d764ab4c3e9531eb61ffea4d0a78832d520f238ef0f339a7871f19c1653fd8
  - te_in train.tar.gz 6098b3d50ae7b49f9ddaac9b3f84aa7a36701ef196859a34b9b85cc9111a09f1
  - hi_in dev.tar.gz   9adbca6d6fc70e40c121910941bcd7c8906eee60b402b6d21b4bd160e20030c7
  - hi_in test.tar.gz  47c238b9cf7016ba596639bb3038b0c89dc6e85759f16d09c4f58c6dfa25c65f
  - hi_in train.tar.gz bb6f52bfb27ca91c54539480111163eb9245305008cfe0526c6f4af3bfdd04e9
- Verified SHA-256 reference TSVs (content hashes computed 2026-11-20
  at the pinned revision):
  - te_in dev.tsv   fbedc2a5b7e394ff5a6e8c269f616017d2ac9a247ffa707c10efaa08132a0630
  - te_in test.tsv  81313da935e3e1d45b69080ec29e5cb1b1b872a06d52ed05ebfc9d218565417e
  - te_in train.tsv c86def3365609f93e3a660cbe76aa2adefda346fbb399e6a4eec633fbc1528d3
  - hi_in dev.tsv   cea87c57a37a0d38ed0afce30e68a35ad7b3945414648430fee09a54ca7b72ba
  - hi_in test.tsv  889e82e2875490f9533ff59ab67326fcfa01cf828fc4412758aaaa1f442a729f
  - hi_in train.tsv fa15b11ca73fd4e8ccb6403f58cde3ac5bbdf27d9654799b3c85c26375489c78
- Existing local files are re-verified against these pins on every
  fetch run; corrupt or stale files are re-downloaded, never silently
  skipped. The script refuses to fetch any artifact without a pin.

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
syntax-checked; its download, checksum, existing-file re-verification,
corrupt-file re-download and missing-pin refusal paths were exercised
against `te_in/test.tsv` (552 KB). The full run including the large
audio tarballs has not been executed, no audio has been downloaded or
decoded, and no dataset or model is integrated into the app or its
test suite.

## Non-goals

No clinical validation is claimed or implied by any evaluation here.
AyuSwar remains a synthetic demo prototype, not a medical device.
