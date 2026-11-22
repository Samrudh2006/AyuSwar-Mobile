# Medical entity evaluation

No precision/recall metric exists. There is no labelled medical-term list, no
gold-standard annotation, and no error-analysis denominator, so a per-entity
accuracy number cannot be computed and is not claimed.

What does exist today:

- Deterministic source-span verification of extracted candidates
  (phase 40-44 tests) and measured plain WER/CER on FLEURS
  ([WER_CER_REPORT.md](WER_CER_REPORT.md)). Neither is a medical-entity
  metric.
- Fallback-path medication mention extraction: citation-form English drug
  names plus Telugu transliterations mapped to English canonicals
  (`src/services/clinicalEvidenceEngine.js`, `MEDICATION_MENTIONED` rule).
  Same documented limits as the rest of the fallback lexicon - citation
  forms only, fail-closed, no inflected Indic forms, no mention-vs-
  instruction distinction on the fallback path.
- Terminology MATCH COVERAGE against RxNorm
  ([TERMINOLOGY_COVERAGE.md](TERMINOLOGY_COVERAGE.md)): of the 2 medication
  terms emitted over the synthetic fixtures, 1 exact-resolves in RxNorm
  (coverage 0.5). Match coverage is not precision/recall; it answers only
  whether emitted strings exist in the terminology.

Next usable work: labelled medical-term list per language, precision/recall
computation in the benchmark harness, Tenglish/code-switch corpus,
clean-vs-noisy delta.
