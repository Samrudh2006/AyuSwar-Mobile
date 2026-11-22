# AyuSwar technical evidence

Mobile repository only. This is an evidence index, not proof that every proposal item is complete. No app logic or APK is changed by this handoff.

## Current evaluator handoff

**v0.3.42-debug, 22 November 2026.**

- [Start here: current evidence, provenance and limits](07-EVALUATOR-HANDOFF/2026-11-22-v0.3.42/START-HERE.md)
- [Download the evaluator evidence ZIP](07-EVALUATOR-HANDOFF/2026-11-22-v0.3.42/AyuSwar-Mobile-Evaluator-Evidence-2026-11-22-v0.3.42.zip)
- [ZIP payload manifest and checksums](07-EVALUATOR-HANDOFF/2026-11-22-v0.3.42/MANIFEST.json)
- [Application release and APK identity](07-EVALUATOR-HANDOFF/2026-11-22-v0.3.42/RELEASE-IDENTITY.json)
- [Build provenance](../docs/APK-PROVENANCE-2026-11-22-v0.3.42-debug.md)

Released source is `843ea7b`; the independently accepted whole-suite evidence was recorded at clean `651cf79`: **550 passed / 3 actual conditional skips / 0 failed**, across 57 suite processes. The release adds only version/docs/provenance to that accepted source. Do not relabel the recorded test revision as the later release or packaging commit.

The 42 new guard checks are synthetic local-stub/fallback extraction, verification, demo review and export checks. The separate original 39 authored scenarios remain **35 PASS / 4 FAIL**. ADV-14 additionally loses its optional cold export to a conservative raw-substring ambiguity hold; the other 38 actual behaviors remain unchanged. No positive-eligibility recovery or clinical-readiness claim.

## Find the evidence

| Area | Source of truth | Boundary |
|---|---|---|
| Current test and guard results | [Dated accepted run and failure evidence](07-EVALUATOR-HANDOFF/2026-11-22-v0.3.42/START-HERE.md) | Actual recorded revision, skips, pre-fix failures and ADV-14 tradeoff retained; not provider or clinical validation |
| Architecture and data flow | [Engine](../docs/CLINICAL_EVIDENCE_ENGINE.md), [data model](../docs/CLINICAL_EVIDENCE_DATA_MODEL.md) | Synthetic prototype; no production service guarantee |
| ASR evaluation | [Measured results](../benchmarks/RESULTS.md), [ASR PDF](02-AI-EVALUATION/INDIC_ASR_EVALUATION_REPORT.pdf), [controlled-noise scope](02-AI-EVALUATION/NOISY_ASR_REPORT.md) | Public-corpus/full-clip desktop inference, not clinical, Tenglish/dialect, shipping-capture or device accuracy |
| Evidence traces | [Scripted trace](03-CLINICAL-SAFETY/CLINICAL_EVIDENCE_TRACE.json), [ASR trace scope](03-CLINICAL-SAFETY/CLINICAL_EVIDENCE_TRACE_ASR.md) | Fallback extraction; no invented audio timing; recorded long-clip trace is outside the shipping cap |
| Safety and human review | [Historical safety PDF](03-CLINICAL-SAFETY/CLINICAL_SAFETY_RED_TEAM_REPORT.pdf), [guard scope](../docs/EVIDENCE-SPAN-GUARDS-2026-11-22.md) | PDF remains its dated 82-check baseline/407 appendix, not a new 550-check or audio-clinical report |
| FHIR and vital exports | [Recorded official run](04-INTEROPERABILITY/OFFICIAL_VALIDATOR_RUN.md), [declared-person vital scope](04-INTEROPERABILITY/VITALS_IDENTITY_DELTA_2026-11-22.md), [integrity gate](04-INTEROPERABILITY/EXPORT_INTEGRITY_GATE_2026-11-22.md) | Per-run emitted/profile/terminology limits; not full FHIR/ABDM or clinical conformance |
| Offline recovery | [Security/storage](../docs/CLINICAL_EVIDENCE_SECURITY.md), [idempotency scope](../docs/OFFLINE-SYNC-IDEMPOTENCY.md) | Client recovery/backoff/idempotency only; server-side dedupe and exactly-once delivery not established |
| Performance and build | [Recorded performance](06-PERFORMANCE/PERFORMANCE_REPORT.md), [deployment guide](../docs/DEPLOYMENT_GUIDE.md) | Build/bundle/suite measurements, not app startup, ASR/device performance or production signing |
| Unfinished original requirements | [Completion matrix](../docs/PROPOSAL-COMPLETION-MATRIX-2026-11-22.md) | Partial/deferred rows remain open; this index is not a dedicated in-app evaluator portal |

## Historical evaluation records remain unchanged

The undated engineering-quality files remain their recorded 383-assertion baseline. `TEST_RESULTS_2026-11-22_current.*` and its output log remain the 407-assertion run at `2164f36`; current in that historical filename is not a latest-result guarantee. Earlier APK provenance, both PDFs, old adversarial results and all failed runs keep their original dates/revisions.

Previously review-only 651cf79 run artifacts and pre-fix span-guard failures are now published in the new dated handoff directory. Earlier documents describing those artifacts as local/attached describe their state at that time. Evaluation records are preserved. A privacy-only correction removes private conversation locators, precise message times and operational references from current notes; it does not erase earlier Git history or previously downloaded copies.

For a fresh whole-app run, use the repository's documented commands and send report output to a new path, not over historical evidence. Local automated testing is not CI; this branch has no `.github/workflows` pipeline. No real patient data, clinician feedback, native-device result or externally validated clinical performance is included.
