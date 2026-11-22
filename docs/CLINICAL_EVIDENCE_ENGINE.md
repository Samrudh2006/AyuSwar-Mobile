# Clinical Evidence Engine

**Scope:** engineering description of the implemented prototype. Synthetic
demo data only; no clinical validation, no live ABDM/registry access.

## Purpose

Turn a consultation transcript into a clinician-reviewable SOAP draft where
every clinical value is traceable to its source utterance, model output is
never trusted blindly, and absent AI is reported honestly instead of being
papered over with fabricated content.

## Modules

| File | Role |
|---|---|
| `src/services/clinicalEvidenceTypes.js` | Shared enums (SPEAKER, SOURCE_TYPE, ENTITY_TYPE, VERIFICATION_STATUS, CLINICIAN_STATUS, EXTRACTION_METHOD) and factories. Provenance rules are enforced here: timestamps/provider identities/model versions are set only when the caller actually has them, utterance ids are deterministic (`utt_<sessionId>_<seq>`), and `isSynthetic` defaults to true so demo data cannot silently pass as real capture. |
| `src/services/clinicalEvidenceEngine.js` | Session lifecycle (`createEvidenceSession`, `registerUtterance`), extraction entry points (`extractWithModel`, `extractWithFallback`, `extractEvidence`). Fallback is explicitly labeled via EXTRACTION_METHOD; it is never presented as live model output. |
| `src/services/clinicalEvidenceVerifier.js` | `verifyCandidate` / `verifyEvidence`: checks each candidate against the session's source utterances. Only candidates that survive verification may reach export as SUPPORTED. |
| `src/services/clinicalEvidencePersistence.js` | Local persistence of sessions, clinician review actions (`applyReviewAction`), and export selection (`selectApprovedForExport`; a negated finding such as "no penicillin allergy" is never exported as a positive finding). |
| `src/mobile/scribeDraft.js` | `buildDraftBundle(soap, turns, sourceMode)`: assembles the FHIR-shaped collection Bundle (one QuestionnaireResponse, fixed linkIds) tagged `synthetic-research-draft`. |
| `src/mobile/MScribeFlow.jsx` | Mobile review flow: keyless/failure states show the exact cause ("AI is unavailable…"), retain the source transcript, and never substitute a sample draft. |
| `src/components/ClinicalEvidencePanel.jsx` | Review UI: evidence candidates with verification status and clinician actions. |
| `src/services/offlineSyncService.js` | Offline queue with consent-gated encrypted storage, bounded failure diagnostics and user-confirmed recovery (see SECURITY doc). |

## Flow

1. Transcript turns (scripted demo, recorded practice, or provider
   transcription) register as source utterances on a session.
2. Extraction runs with a real model caller when one is configured;
   otherwise the explicitly-labeled fallback runs, or the flow reports AI
   unavailable. A null model response is always "AI unavailable", never an
   "incomplete draft".
3. Candidates are verified against source spans; the objective,
   assessment and plan sections are **deterministic**: objective is
   generated only from verified spoken vital values, and assessment/plan
   are always fixed safe strings with model text discarded unconditionally.
   The subjective section remains model-written draft text that is NOT
   evidence-verified; the review UI labels it as such next to the section
   and it is always presented as an editable draft in the clinician review
   step. The label is source-aware: it claims "model-written" only when
   the model actually produced the draft (manual/fallback drafts start as a
   clinician-entered copy of the source transcript and get a neutral
   unverified-draft label), and it points at the recording only when a
   recording exists, otherwise the source transcript.
4. The clinician reviews, edits, accepts or rejects with reasons; only
   approved, supported records are eligible for export.
5. Export produces the FHIR-shaped draft bundle (local research draft, not
   an ABDM submission).

### Fallback extractor contract (medications)

The deterministic fallback is deliberately conservative about medications:

- It emits **MEDICATION_MENTIONED only**. It never emits
  MEDICATION_INSTRUCTION: a matched drug name is a mention for human
  review, not a prescription, even when the speaker is the doctor.
  Instruction classification, if it ever exists, belongs to the
  evidence-grounded model path plus clinician review.
- It does **not** classify temporal status. Current, past, stopped and
  historical uses ("I already took paracetamol twice yesterday") all
  surface as plain mentions; the engine makes no current-use claim and the
  reviewer supplies that context.
- Negation stays fail-closed: a negation marker near the span (Telugu:
  "అలర్జీ లేదు"; English: word-boundary `no/not/never/without/cannot/
  denies/...` and straight- or curly-apostrophe contractions like
  `don't` / `don’t`) flags the candidate `isNegatedContext`, and the
  export gate excludes negated records even when a reviewer approved the
  extraction. This is marker coverage, NOT full negation semantics:
  double negation, hedging, sarcasm and cross-sentence scope are not
  handled and remain open limits; the flag forces review rather than
  claiming understanding.
- Temporal status is explicit and conservative: every exported record
  carries `temporalStatus` = `UNKNOWN` unless an English cessation/past
  cue (stopped, quit, used to, previously, yesterday, took, last
  week/month/year) marks it `HISTORICAL`, plus `sourceContext` with the
  full original utterance. The engine NEVER assigns current use; a
  stopped medication exports only as HISTORICAL with its context, and
  the reviewer supplies clinical temporality. Cue matching is heuristic,
  not tense parsing. Two bounded gaps: cues are English-only (Telugu/
  Hindi cessation keeps UNKNOWN with source context preserved), and
  "no longer" matches negation first, so those mentions are HELD from
  export rather than exported as HISTORICAL.
- Attribution ambiguity stays fail-closed: the same drug quoted by both
  patient and doctor verifies AMBIGUOUS, never SUPPORTED, and never
  exports.
- The Telugu-to-English medication normalization map is a hand-built
  lookup aid for terminology resolution (e.g. RxNorm), not validated
  translation accuracy; unmapped forms fail closed.

## Spoken-vital context guards

Vital-sign extraction rejects values spoken in non-asserted contexts:
negation, question, hypothetical/conditional (including post-value Indic
conditionals where the qualifier follows the number), historical narration,
and pulse-ox adjacency ambiguity. These guards are rule classes verified by
adversarial tests (Phases 42–44), not string patches.

## Honest-status contract

- Sample/scripted content is tagged at the type level (`isSynthetic`,
  SOURCE_TYPE.SCRIPTED_DEMO, `synthetic-research-draft` FHIR meta tag).
- No fabricated timestamps, provider identities, model versions or
  liveness claims anywhere in the pipeline.
- Known prototype limitations (disclosed, accepted): zero-match sample
  utterances, unknown-language input behavior, localStorage-only synthetic
  history.
