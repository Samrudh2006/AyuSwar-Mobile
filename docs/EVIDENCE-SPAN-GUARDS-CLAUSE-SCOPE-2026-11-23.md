# Evidence Span Guards — Clause-Scope Repair (2026-11-23)

Source change on `feat/clinical-evidence-engine`, recorded the same day. This
repairs the two retained fail-closed limitation classes documented in
`PROPOSAL-COMPLETION-MATRIX-2026-11-22.md` and the 2026-11-22 adversarial
ledger. It is a guard-precision repair: no new entity types, no new positive
labels, no provider calls, no audio, no clinical claims. Historical dated
artifacts (the 2026-11-22 adversarial ledger, the PRE-FIX runs, the accepted
evaluator handoff) are preserved byte-identical; new runs write new dated
files.

## What was wrong

`src/services/clinicalEvidenceVerifier.js` used a flat 40-character window on
both sides of a candidate quote for negation detection, and treated a span as
"inside a question" whenever its sentence (bounded only by `. ! ? ।`) ended
in `?`. Four purpose-authored adversarial scenarios stayed FAIL:

- ADV-03 `I have a cough. No fever.` — the cross-sentence `No` also held the
  affirmed cough.
- ADV-25 `I came with a headache but without fever.` — `without` after the
  contrastive `but` also held the affirmed headache.
- ADV-27 `నాకు fever ఉంది but cough లేదు` — the post-noun Telugu denial of
  cough also held the affirmed fever across `but`.
- ADV-39 `I have a fever, do you know why?` — the trailing separate question
  held the affirmed fever as AMBIGUOUS.

A fifth case passed vacuously: ADV-19 `No fever. I took paracetamol yesterday.`
recorded paracetamol `negatedContext: true` and exported nothing; its check
only asserted that exported paracetamol is HISTORICAL, which an empty export
satisfies. The affirmed HISTORICAL mention was silently over-held.

## What the repair does

Negation scope is now grammatical, asymmetric and documented in code comments:

- A marker BEFORE the span applies within the same sentence (up to 40 chars).
  Commas do not break forward scope, so `No fever, cough or cold.` still holds
  the whole list. A sentence break does, so `No` in `No fever.` no longer
  reaches an earlier sentence.
- A marker AFTER the span applies only within the same clause, bounded by
  `, ; :`, a sentence break, or the word `but`. Telugu/Hindi post-noun denial
  (`అలర్జీ లేదు`) sits in the same clause and is unaffected.

The question check is clause-aware: a span whose sentence ends in `?` is still
held when the sentence opens interrogatively (wh-word, auxiliary inversion or
`any`, English word-boundary list), when the span's own clause reaches the
`?`, or when the trailing clause holding the `?` is not itself interrogative
(tag questions like `You have a fever, right?` stay held). It is released only
when the `?` demonstrably belongs to a later, separate interrogative clause
(`I have a fever, do you know why?`). The Indic question holds are unchanged:
interrogative detection is English-only, so nothing Indic is released by this
rule.

Transparency: when a marker is present in the legacy 40-char context but falls
outside the new scope, the record carries the note `negation marker present
outside span scope (different sentence/clause); not treated as negated
context`, and released affirmed-before-question spans carry `question mark
belongs to a later separate interrogative clause; affirmed clause treated as a
finding`. Holds keep their existing notes unchanged.

The temporal cue scan intentionally keeps the legacy both-sides window: it only
ever labels a mention HISTORICAL and never gates export.

## Documented remaining limits (fail closed)

- Double negation, sarcasm and hedging remain out of scope (ADV-23 stays held).
- A contrastive `but` does NOT reset forward scope: `no cough but fever` still
  holds fever. Over-hold direction retained.
- Indic clause detection uses the same punctuation set; Indic contrastive
  conjunctions (e.g. కానీ) are not clause boundaries.
- The temporal window remains a cue heuristic, not tense parsing.

## Evidence

- `AYUSWAR-TECHNICAL-EVIDENCE/03-CLINICAL-SAFETY/ADVERSARIAL_SCENARIOS_2026-11-23.json`:
  rerun of the unchanged 39 purpose-authored scenarios against the repaired
  engine: 39 PASS / 0 FAIL. ADV-19 now passes non-vacuously (paracetamol
  exports as a HISTORICAL mention; the negated fever stays held). The
  2026-11-22 ledger (35/4) and all PRE-FIX runs are retained beside it.
- `test/phase54_clause_scope_guards.test.js`: 14 new regression checks pinning
  both directions — every repaired release AND every preserved hold (denial
  controls, forward list scope, tag questions, whole-sentence questions, Indic
  post-noun denial, Indic questions). Registered as Phase 54 in
  `test/run_all.js`.
- `test/phase53_evidence_span_guards.test.js`: unchanged, still 42/42.
- Full suite rerun recorded beside this file's commit; count changes only by
  the added Phase 54 suite.
- `scripts/export_adversarial_scenarios.mjs` now date-stamps its output from
  the run timestamp so reruns never overwrite an earlier accepted baseline.

## What this is NOT

Not clinical validation, not audio-level evidence, not a real-model run
(model-path scenarios use simulated replies), not a native-runtime result, and
not yet independently audited. Verdicts here are provisional until the
independent auditor qualifies them.
