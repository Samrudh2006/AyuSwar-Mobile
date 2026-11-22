# Proposal Completion Matrix — 2026-11-22

Status of the Nov 22 "AyuSwar Clinical Intelligence 2.0" proposal against what
is actually implemented in this repository (`Samrudh2006/AyuSwar-Mobile`,
branch `feat/clinical-evidence-engine`. First written at `338e92a`; refreshed after the
`v0.3.34-debug` pre-release (application source `faea07f`, evidence additions
through `35fb90f`).

Scope note: the proposal was written against the web project and website
(`Ayuswar-Ai`). The mobile repository is the active engineering surface; web
items are marked out-of-scope here and are not silently dropped.

Labels: **DONE** = implemented and tested today; **PARTIAL** = real
implementation exists but the original deliverable or full scope is not met;
**DEFERRED** = not implemented, with reason and next usable work.

## 1. Indic Clinical Accuracy Lab

| Proposal item | Status | Evidence / notes |
|---|---|---|
| Compare reference transcripts vs ASR output; WER | **DONE** | `benchmarks/RESULTS.md`: Telugu FLEURS test WER 23.46, Hindi FLEURS test WER 11.19 |
| CER | **DONE** | Same source: te CER 7.93, hi CER 4.68 |
| Upload/select synthetic audio samples | **DONE** | Benchmark harness runs against labelled FLEURS splits; reproducible commands in `benchmarks/` |
| Medical-term accuracy measured separately | **DEFERRED** | No medical-entity recall metric exists. Next usable work: a labelled medical-term list per language + recall computation in the benchmark harness |
| Code-switching (Tenglish) and dialect evaluation | **DEFERRED** | No Tenglish corpus. Next usable work: small consented synthetic Tenglish set, same WER/CER pipeline |
| Clean vs noisy audio comparison | **DONE (synthetic)** | Noise-augmented copies of the same seeded n=120 te_in test subset measured: public-domain crowd walla (Wikimedia Commons "Restaurant ambience.ogg", owning-source license verified), seeded mixing (seed 20261122), SNR 20/10/5 dB; clean 25.86% -> 30.66% WER at 5 dB. `AYUSWAR-TECHNICAL-EVIDENCE/02-AI-EVALUATION/NOISY_ASR_REPORT.md` + `benchmarks/results/2026-11-22-noisy-wallapd-te_in-test-sub120/`. Synthetic corruption of read speech, one noise recording, no VAD - not recorded clinical noise, not the capture path. An earlier MS-SNSD-babble run is retained as provisional (license unresolved) and superseded |
| Deliverable INDIC_ASR_EVALUATION_REPORT.pdf | **DONE** | Rendered report committed: `AYUSWAR-TECHNICAL-EVIDENCE/02-AI-EVALUATION/INDIC_ASR_EVALUATION_REPORT.pdf` (2 pages, measured FLEURS + license-cleared controlled-noise delta, honest scope/limits; delivered 2026-11-22) |

## 2. Clinical Evidence & Hallucination Firewall

| Proposal item | Status | Evidence / notes |
|---|---|---|
| Original transcript evidence per clinical entity | **DONE** | Evidence-verification phases (40-42); candidates verified against source spans, unsupported claims rejected |
| Extracted entity + doctor verification status | **DONE** | Clinician review/edit flow; deterministic objective/assessment/plan (Phases 43-44) |
| Unsupported-claim rejection | **DONE** | Model text for objective/assessment/plan is discarded; assessment/plan are fixed safe strings |
| Subjective draft honesty | **DONE** | Per-section NOT-verified label on desktop and mobile, source-aware (model-written wording only on model-produced drafts; recording referenced only when mic-captured turns exist; typed-only and sample paths get the neutral transcript-scoped label). Mode-combination and provenance-predicate tests in Phase 44; independently verified 2026-11-22 |
| Audio timestamp per entity | **PARTIAL** | Transcript-span evidence exists; the ASR pipeline does not emit per-utterance audio timestamps, so none are shown. Next usable work: timestamped ASR segments, then wire spans to times |
| Normalized medical terminology per entity | **PARTIAL** | Vitals normalized to fixed labels (BP/SpO2/HR/Temp); no SNOMED/LOINC mapping. Fallback extractor now emits medication mentions normalized to English canonicals via lexicon map (citation forms only), and a measured RxNorm terminology match coverage report exists (`AYUSWAR-TECHNICAL-EVIDENCE/02-AI-EVALUATION/TERMINOLOGY_COVERAGE.md`): 1/2 terms exact-resolve (0.5) - match coverage only, NOT precision/recall (no gold labels). Next usable work: map the fixed vital labels to standard codes in the FHIR export |
| Deliverable CLINICAL_EVIDENCE_TRACE.json | **DONE** | Export now exists: AYUSWAR-TECHNICAL-EVIDENCE/03-CLINICAL-SAFETY/CLINICAL_EVIDENCE_TRACE.json via scripts/export_clinical_evidence_trace.mjs (6 evidence records over 6 scripted fixture utterances - verificationCounts SUPPORTED:4, AMBIGUOUS:2, 2 approved-for-export - deterministic fallback extractor, demo reviewer, no audio timestamps; generated at revision 9248d7c). Additionally: `AYUSWAR-TECHNICAL-EVIDENCE/03-CLINICAL-SAFETY/CLINICAL_EVIDENCE_TRACE_ASR.json` via scripts/export_clinical_evidence_trace_asr.mjs - utterance text is genuine output of the sha256-pinned local ONNX Telugu ASR over in-repo synthetic gnani TTS prescription clips (3 clips, per-clip source/derived sha256 + decode command recorded; 3 SUPPORTED symptom records plus one clip with documented fail-closed zero-candidate silence). Acceptance boundary (independent audit, 2026-11-22): ASR inference is owner-run - the 186 MB int8 model bytes were not transferable; the auditor independently reproduced audio decode (bit-exact) and the full downstream extraction/verification/review flow from the committed transcripts, and verified all model/vocab pins against the repo manifest. MODEL_LIVE extraction remains separately gated by the frozen web proxy (no authorized route); this row closes on the real-ASR + labelled-fallback trace. |

## 3. FHIR R4 Validation Engine

| Proposal item | Status | Evidence / notes |
|---|---|---|
| FHIR Bundle structure validation | **PARTIAL** | Phase 46: live-bundle validation against a vendored JSON Schema (`benchmarks/fhir/fhir.schema.json`, sha256 recorded) plus structural invariants. Additionally: official HL7 FHIR Validator 7.0.6 R4 base validation of the emitted fixture passes (0 errors / 0 warnings / 2 inherent notes) after a real fullUrl defect it caught was fixed - see `AYUSWAR-TECHNICAL-EVIDENCE/04-INTEROPERABILITY/OFFICIAL_VALIDATOR_RUN.md`. The public ABDM IG (ndhm.in 6.5.0) also loads offline and the fixture passes base validation in that context - but no ABDM profile is asserted, so this is not profile conformance; emitting ABDM-profiled documents is unimplemented scope; no terminology-service validation |
| Patient/Encounter/Condition/Observation/MedicationRequest resource validation | **PARTIAL** | Structural checks cover what the app actually emits. Per-resource profile-FORMAT validation for all five named resources now exists as a synthetic-fixture run against the locally vendored IG (core terminology via the validator's default public tx server, so not fully offline): `AYUSWAR-TECHNICAL-EVIDENCE/04-INTEROPERABILITY/profile-format-synthetic/` (official validator 7.0.6 + ABDM IG 6.5.0 offline; 0 errors / 6 warnings / 7 notes; explicitly synthetic instances, format testing only - NOT ABDM conformance or any clinical claim; app emission scope unchanged) |
| Required-field + referential-integrity checks | **PARTIAL** | Invariant checks exist; full referential-integrity coverage not claimed |
| Invalid bundle rejection with error explanations | **DONE** | Phase 46 negative fixtures reject invalid bundles with explanations |
| Official FHIR R4 profiles / ABDM implementation specs | **DEFERRED** | JSON Schema + invariants only; no official-profile or ABDM validation run, and none is claimed. Next usable work: run the emitted bundles through an official validator (e.g. HL7/OHN tooling) and record results |
| Deliverables FHIR_VALIDATION_REPORT.json, sample-valid/invalid-bundle.json, FHIR_INTEROPERABILITY_TESTS.md | **PARTIAL** | Named files now exist under `AYUSWAR-TECHNICAL-EVIDENCE/04-INTEROPERABILITY/`, generated by `scripts/export_fhir_evidence.mjs` from the live emitter: positive fixture passes schema + invariants, deliberately-invalid clone fails both, report records revision/schema hash/validator. Scope is still structural only - no profile, terminology or ABDM validation |

## 4. Clinical Safety Red-Team Lab

| Proposal item | Status | Evidence / notes |
|---|---|---|
| Adversarial scenarios: dosage directives, batch order, semantic collisions, negation/hypothetical/historical speech, appended directives | **DONE** | Phases 42-44, fail-closed behavior tests, deterministic sections |
| 30-50 synthetic adversarial scenarios with expected/actual/pass-fail/evidence per scenario | **PARTIAL** | Current per-scenario ledger exported from a fresh full-suite run: `AYUSWAR-TECHNICAL-EVIDENCE/03-CLINICAL-SAFETY/RED_TEAM_TESTS_2026-11-22_current.json` (91 scenarios across phases 40-44, each with expected/actual/pass-fail/evidence, 0 failures, run at 2164f36; log preserved as `05-ENGINEERING-QUALITY/TEST_OUTPUT_2026-11-22_current.log`). Generator: scripts/export_red_team_ledger.mjs (refuses to export a red run, retaining the raw log as a FAILED-RUN artifact). Baseline `RED_TEAM_TESTS.json` (82 scenarios at 1447957) kept unchanged as the dated baseline; dated current machine-readable summaries committed as `05-ENGINEERING-QUALITY/TEST_RESULTS_2026-11-22_current.{json,xml}` (undated TEST_RESULTS files remain the baseline). Stays PARTIAL: the dated current regression ledger is accepted evidence freshness, but expected/actual columns are uniform boilerplate, not meaningful per-scenario expected-vs-actual narratives, and raw scenario count alone does not close this deliverable; no new guard behavior was added. Scope stays text-level guard checks - the proposed 30-50 AUDIO-level lab with per-scenario clinical narratives remains row 58, DEFERRED |
| Doctor-patient conflict, overlapping speakers, unknown dialect, noise-changed medical word | **DEFERRED** | These scenario classes need audio-level simulation the current text-level harness does not cover |
| Deliverable CLINICAL_SAFETY_RED_TEAM_REPORT.pdf | **DONE** | Rendered report committed: `AYUSWAR-TECHNICAL-EVIDENCE/03-CLINICAL-SAFETY/CLINICAL_SAFETY_RED_TEAM_REPORT.pdf` (10 pages, verbatim 82-scenario ledger dated at baseline commit 1447957 + appendix with dated current suite state 407/3/0 recorded at 2164f36 (machine-readable summary: 05-ENGINEERING-QUALITY/TEST_RESULTS_2026-11-22_current.{json,xml}); text-level scope stated, not the audio-level lab; delivered 2026-11-22) |

## 5. Real Offline-First PHC Simulation

| Proposal item | Status | Evidence / notes |
|---|---|---|
| IndexedDB encounter queue | **DONE** | Offline queue with encrypted payloads; IDB retention verified in a real browser build (seeded IndexedDB rows) |
| Offline draft creation | **DONE** | Offline extraction path; failure visibility and recovery UI (Phase 47) |
| Connection recovery detection | **DONE** | Offline sync card, retry and recovery states on the clinical console |
| Pending/synced/failed states | **DONE** | Explicit states; "no confirmed successful sync on this device" wording (no exactly-once claims) |
| Retry with exponential backoff | **DONE** | Exponential schedule in the sync worker: 30s base doubling per failed attempt, base capped at 30min BEFORE +/-25% jitter (effective top-end window 22.5-37.5min, not a hard 30min ceiling), stable per-record id-hash jitter (no flapping between cycles); due-gate in the sync loop reports deferredCount. Tested in phase48 (doubling, cap, jitter envelope/stability, due-gate, defer-then-retry integration). Retries stay uncapped by design: failed records are never auto-deleted; recovery is a user-confirmed discard |
| Duplicate prevention using idempotency keys | **PARTIAL** | Client-generated stable idempotency key per queued record (idempotencyKey stamped at enqueue; legacy records fall back to queue id), surfaced in the sync payload as idempotency_key only when the table advertises the column (per-session probe; omitted on probe failure so un-migrated backends keep syncing). Server-side dedupe (UNIQUE index + upsert) is documented with migration SQL in docs/OFFLINE-SYNC-IDEMPOTENCY.md but NOT applied or verified against the live backend; exactly-once is not claimed |
| Sync conflict detection | **N/A — documented** | Inserts are append-only with no server versioning, so no write-write conflict class exists; this is stated in `docs/CLINICAL_EVIDENCE_DATA_MODEL.md` rather than claimed as handled |
| Reproducible offline-to-online sync test | **DONE** | Phase 47 plus browser-verified IDB scrub/retention proofs |

## Optional features

| Proposal item | Status | Notes |
|---|---|---|
| A. Doctor correction learning loop | **DEFERRED** | Corrections are captured in the review flow but not stored as labelled evaluation examples. Requires consent/de-identification controls per the proposal; not started |
| B. Prescription comprehension testing | **DEFERRED** | Not started. Next usable work: synthetic comprehension scenarios against the Audio-Rx path |

## Technical corrections called out in the proposal

| Item | Status | Notes |
|---|---|---|
| Acoustic biomarker stage labelled experimental | **DONE (mobile)** | Acoustic lab is labelled experimental/prototype in the mobile app; web labelling is out of scope here |
| Separate simulated vs measured vs validated metrics | **DONE** | Sample data tagged; benchmark numbers scoped to their splits; no externally-validated claims |
| Publish test logs, names, environment, reproducible commands | **DONE** | `test/run_all.js` prints per-phase counts (369 executed, 3 conditional skips at `338e92a`); `benchmarks/RESULTS.md` carries commands and environment |
| Demonstrate actual offline operation and recovery | **DONE** | Phase 47 + browser-verified IDB proofs |
| DPDP data flows / consent / retention / deletion documented | **DONE (mobile)** | `docs/CLINICAL_EVIDENCE_DATA_MODEL.md` and `docs/CLINICAL_EVIDENCE_SECURITY.md`: storage classes, encryption, retention, scrub behavior, delivery semantics |
| Repo visibility check (web repo appears private) | **OUT OF SCOPE (mobile task)** | Flagged for the owner; no change made from this repository |
| FHIR interoperability validated against applicable profiles | **DEFERRED** | See section 3 |

## AYUSWAR-TECHNICAL-EVIDENCE folder

**PARTIAL, improved.** The named folder now exists with 01-ARCHITECTURE, 02-AI-EVALUATION (measured FLEURS CSV), 03-CLINICAL-SAFETY (82 executed scenario records from the recorded suite run, not the proposed 30-50 audio-level lab), 04-INTEROPERABILITY (FHIR structural fixtures) and 05-ENGINEERING-QUALITY (per-suite stdout, JSON, JUnit XML). Pointer files reference the authoritative `docs/` documents; original coverage in `docs/`:
`CLINICAL_EVIDENCE_ENGINE.md` (architecture), `CLINICAL_EVIDENCE_DATA_MODEL.md`
(data flow/storage), `CLINICAL_EVIDENCE_SECURITY.md` (security audit),
`CLINICAL_EVIDENCE_EVALUATION.md` (evaluation summary), `benchmarks/RESULTS.md`
(ASR benchmarks), `docs/APK-PROVENANCE-2026-11-22.md` (build provenance).
Remaining gaps inside the folder: the red-team ledger is text-level only. DEPLOYMENT_GUIDE now exists at docs/DEPLOYMENT_GUIDE.md, scoped to the verified mobile debug-APK build/release path (release signing/AAB/Play listed as not done). PERFORMANCE_REPORT now exists under 06-PERFORMANCE/ with genuinely measured build-step durations, bundle composition and suite wall time (scripts/measure_performance.mjs, reproducible); it explicitly does NOT measure app startup/render/ASR/native runtime performance - those metrics and what they would need are listed in the report.

## What is NOT claimed

- No per-utterance audio timestamps, no terminology-service normalization.
- No ABDM or official FHIR profile validation; JSON Schema + invariants only.
- No 30-50 scenario red-team lab or rendered red-team/evaluation PDFs.
- Exactly-once delivery is not claimed: exponential backoff exists, and client idempotency keys are generated and surfaced when the backend advertises the column; server-side dedupe (UNIQUE + upsert) is documented but not applied or verified.
- No native install, device runtime, or production deployment claims.
