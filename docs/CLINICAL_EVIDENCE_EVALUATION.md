# Clinical Evidence Engine — Evaluation

**Status:** engineering verification only. Nothing on this page is clinical
validation, user feedback, or a live-provider result.
**As of:** 2026-11-22, branch `feat/clinical-evidence-engine`, commit `0174027`
(last code-affecting commit; `4a91026` adds documentation only).
Suite at that commit: **368 executed and passed, 3 conditional skips, 0 failed**
(`node test/run_all.js`).

## What "evaluation" means here

Every claim below is a reproducible engineering check over synthetic fixtures
or the built app in a desktop browser. There is no clinician review, no real
patient data, and no deployment measurement. Where a check cannot run in this
environment it is a labeled conditional skip, never a pass.

## 1. Extraction safeguards (rules layer)

The SOAP draft pipeline never trusts model text into clinical sections;
sections are assembled deterministically and vital signs pass context guards.

| Guard class | Covered by | Cases |
|---|---|---|
| Engine core (20 brief cases incl. Telugu/English/code-mixed offsets, prompt-injection-in-transcript fixture) | Phase 40 `test/clinical_evidence_engine.test.js` | 22 |
| Review UI behavior | Phase 41 `test/clinical_evidence_ui.test.js` | 6 |
| Deterministic safeguards (adversarial batch order, semantic collisions, appended directives) | Phase 42 | 8 |
| Deterministic section assembly | Phase 43 | 10 |
| Spoken-vital context: negation, question, hypothetical/conditional (including post-value Indic conditionals), historical, pulse-ox adjacency | Phase 44 | 21 |

Disposition of known limits (accepted as disclosed prototype limitations, not
blockers): zero-match sample utterances, unknown-language input, and
localStorage-only synthetic history.

## 2. Built-app browser e2e (Phase 45, 6 checks)

Mobile keyless flows only, executed against the production build in desktop
Chrome at 390x844. Scope is explicit: no authenticated flows, no
model-present path, not all routes, no Telugu e2e.

## 3. FHIR R4 conformance (Phase 46, 2 checks)

The **live** `buildDraftBundle()` output is validated two ways; neither alone
is sufficient:

- Official HL7 FHIR R4 JSON Schema (vendored `benchmarks/fhir/fhir.schema.json`,
  sha256 `2230406893b4cf002a4ee1e5e2bbeca22ac5d2d4931b3e9ef7b9594bbc376a01`,
  ajv 6.12.6): primitive formats, inline enums, resource shape.
- Project invariants: required-field presence, entry count, status enum,
  linkId uniqueness/coverage, valueString-only answers.

Not claimed: HL7 Java validator, terminology/ValueSet checks, ABDM/NRCeS
profile conformance, clinical/semantic validation. Replay:
`node scripts/validate_fhir_draft_bundle.cjs` (see `benchmarks/fhir/README.md`).

## 4. Offline queue integrity and recovery (Phases 37 + 47, 6 + 11 checks)

Queue integrity: failed uploads are never counted or discarded, concurrent
syncs cannot duplicate uploads, records enqueued mid-sync survive unattempted
(localStorage and IndexedDB-shim paths).

Failure visibility and recovery: the queue is append-only inserts with no
server versioning, so no write-write conflict class exists. The real failure
classes are covered: attempts are stamped on the stored row with **bounded
error categories only** (raw upstream text can embed identifiers and is never
persisted; legacy raw strings are scrubbed on the next sync cycle),
undecryptable records are never uploaded, nothing is auto-deleted, and
`discardOfflineRecord` runs only from the mobile UI's inline, user-confirmed
step that states the data loss. All record types fail closed: unsupported
types are never counted synced and never deleted.

Not claimed: exactly-once delivery or server-side dedup (a lost
acknowledgement after a server write can still duplicate on retry; backend
dedup behavior is unverified).

## 5. Speech recognition quality (FLEURS)

Offline ONNX Conformer CTC models, measured 2026-11-22, full methodology and
per-split scorer output in `benchmarks/RESULTS.md`:

| Model | Split | n | Corpus WER | Corpus CER |
|---|---|---:|---:|---:|
| Telugu int8 | te_in test | 472 | 23.46% | 7.93% |
| Hindi pilot | hi_in test | 418 | 11.19% | 4.68% |

Scope limits: local fallback models only; FLEURS is read-speech news/web text,
not code-mixed clinical consultation audio; these numbers do not transfer to
consultation speech and are not the in-app browser runner's state.

## 6. Localization

Six locale dictionaries (en/te/hi/ta/kn/mr-IN) with English fallback; rendered
-DOM coverage is Phase 13. Telugu interface exists; Telugu privacy/terms pages
are English-only (disclosed coverage limit).

## Reproduction

```bash
npm install
node test/run_all.js                        # full suite
node scripts/validate_fhir_draft_bundle.cjs # FHIR schema replay
node benchmarks/fleurs_local_asr.mjs        # ASR rerun (models required)
python3 benchmarks/fleurs_eval.py --help    # scorer
```

## Explicit non-claims

No clinical validation. No real-user feedback. No live provider, native
Android runtime, or production deployment claim. No DPDP/ABDM/HIPAA
compliance claim. Fallback output is never presented as live model output.
No fabricated timestamps, providers, or benchmark numbers.
