# AyuSwar technical evidence

Mobile repository only. This index maps the original proposal to evidence that
exists. An index is not proof that every proposal item is complete.

## Current released checkpoint

- Application source: `faea07f`; release/provenance commit: `b121734`.
- Version: `v0.3.34-debug`, an Android debug research prototype pre-release.
- Build record: [APK provenance](../docs/APK-PROVENANCE-2026-11-22.md).
- Later test/report and documentation commits do not change that APK.

## Find the evidence

| Proposal area | Current source of truth | Limits |
|---|---|---|
| Architecture, pipeline and integration | [Engine](../docs/CLINICAL_EVIDENCE_ENGINE.md), [data flow](../docs/CLINICAL_EVIDENCE_DATA_MODEL.md) | Synthetic prototype, model/provider boundaries described, no service availability guarantee |
| ASR evaluation | [Measured FLEURS rows and replay](../benchmarks/RESULTS.md), `benchmarks/results/2026-11-22-fleurs-*.json` | Offline fallback model benchmark, not shipping capture-path, clinical, Tenglish or noisy-speech evaluation |
| Clinical safety and human review | [Evaluation](../docs/CLINICAL_EVIDENCE_EVALUATION.md), `test/clinical_evidence_engine.test.js`, phases42-44 | Text fixtures and source-span guards, not clinical validation or audio-level red-team lab |
| FHIR structure | [FHIR replay and scope](../benchmarks/fhir/README.md), phase46 | JSON Schema plus project invariants, not official-profile, terminology or ABDM validation |
| Offline recovery | Phase37/47/48/49, [storage/security scope](../docs/CLINICAL_EVIDENCE_SECURITY.md), [idempotency scope](../docs/OFFLINE-SYNC-IDEMPOTENCY.md) | Client idempotency keys with probed payload surfacing and exponential backoff exist; server-side dedupe not applied or verified; no exactly-once claim |
| Engineering test executions | `05-ENGINEERING-QUALITY/TEST_RESULTS.json`, `TEST_RESULTS.xml`, `TEST_OUTPUT.log` after replay | JUnit records represent suite processes. Assertion counts and conditional skips are separate properties |
| Performance | `06-PERFORMANCE/PERFORMANCE_REPORT.md`, `PERFORMANCE_METRICS.json` via `scripts/measure_performance.mjs` | Build-step, bundle-size and suite-duration measurements on one sandbox; NOT app startup, render, ASR/native runtime or network performance |
| Mobile build and release | [Deployment guide](../docs/DEPLOYMENT_GUIDE.md), [APK provenance](../docs/APK-PROVENANCE-2026-11-22.md) | Debug-APK path verified end-to-end; release signing, AAB and Play submission not done |
| Unfinished original requirements | [Proposal completion matrix](../docs/PROPOSAL-COMPLETION-MATRIX-2026-11-22.md) | Partial/deferred rows remain open; named PDFs and broader scenario/metric work are not implied by this folder |

## Replay engineering reports

```sh
npm ci
npm run build
AYUSWAR_REPORT_DIR=AYUSWAR-TECHNICAL-EVIDENCE/05-ENGINEERING-QUALITY node test/run_all.js
```

Reports capture the actual run, source revision, tracked-file dirty state,
Node/OS/architecture, duration, per-suite output, executed passing assertions,
conditional skipped assertions and nonzero process exits. Missing conditional
checks are not converted into passes. A failed suite writes a partial report
and exits nonzero.

No real patient data, clinician feedback, native-device result or externally
validated performance is included. Existing assertion-count parsing is the
runner's accounting, not an independently instrumented per-assertion framework.
