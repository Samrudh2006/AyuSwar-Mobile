# Proposal Completion Matrix — 2026-11-22

Status of the Nov 22 "AyuSwar Clinical Intelligence 2.0" proposal against what
is actually implemented in this repository (`Samrudh2006/AyuSwar-Mobile`,
branch `feat/clinical-evidence-engine`). Original matrix written at `338e92a`.
Reconciled after the published v0.3.39-debug checkpoint (source `6718515`),
including the accepted declared-person vital-export delta. The local export
integrity gate at `5371787` is independently reviewed and included in the
v0.3.40-debug build checkpoint; it is NOT in v0.3.39. Earlier dated baselines remain unchanged.
Audio-Rx software consistency at `c14bf44` is independently accepted for the
v0.3.41-debug checkpoint: unknown-default WAV download is blocked, not replaced
by newly verified audio, and quiz completion follows current existing choices.
This does not close the DEFERRED patient-comprehension deliverable.

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
| Normalized medical terminology per entity | **PARTIAL** | Actual new-entry BP/pulse/weight Observation export is implemented in src/utils/vitalsExport.js and reached through the mobile Patient Portal. LOINC: BP panel 85354-9 with 8480-6/8462-4 in UCUM mm[Hg], heart rate 8867-4 in /min, weight 29463-7 in kg. Per-entry person declaration and profile-local stable IDs gate eligibility; one anonymous Patient per selected-person file, no local labels/IDs exported, recipient-identification caveat visible. Seeds, legacy/pre-subject rows, SpO2 and glucose remain excluded; no migration or inferred values. Evidence: 04-INTEROPERABILITY/VITALS_IDENTITY_DELTA_2026-11-22.md, actual synthetic emitted fixture and validator log, mobile-width flow screenshots/log. Official HL7 validator on synthetic output: 0 errors / 10 warnings / 11 notes with terminology disabled, so LOINC/UCUM remain machine-unverified. Suite 441 passed / 3 skips at independently reviewed 9eb9fbf. No native/clinical/ABDM claim. The scribe export remains QuestionnaireResponse only. Medication RxNorm report remains match coverage (1/2 exact), not precision/recall; wider terminology and clinical mapping remain incomplete |
| Deliverable CLINICAL_EVIDENCE_TRACE.json | **DONE** | Export now exists: AYUSWAR-TECHNICAL-EVIDENCE/03-CLINICAL-SAFETY/CLINICAL_EVIDENCE_TRACE.json via scripts/export_clinical_evidence_trace.mjs (6 evidence records over 6 scripted fixture utterances - verificationCounts SUPPORTED:4, AMBIGUOUS:2, 2 approved-for-export - deterministic fallback extractor, demo reviewer, no audio timestamps; generated at revision 9248d7c). Additionally: `AYUSWAR-TECHNICAL-EVIDENCE/03-CLINICAL-SAFETY/CLINICAL_EVIDENCE_TRACE_ASR.json` via scripts/export_clinical_evidence_trace_asr.mjs - utterance text is genuine output of the sha256-pinned local ONNX Telugu ASR over in-repo synthetic gnani TTS prescription clips (3 clips, per-clip source/derived sha256 + decode command recorded; 3 SUPPORTED symptom records plus one clip with documented fail-closed zero-candidate silence). Input-length scope: the recorded 17.92-second respiratory clip exceeds the shipping 15-second cap; its full-clip local inference is not shipping-path evidence. See [trace scope note](../AYUSWAR-TECHNICAL-EVIDENCE/03-CLINICAL-SAFETY/CLINICAL_EVIDENCE_TRACE_ASR.md). Acceptance boundary (independent audit, 2026-11-22): ASR inference is owner-run - the 186 MB int8 model bytes were not transferable; the auditor independently reproduced audio decode (bit-exact) and the full downstream extraction/verification/review flow from the committed transcripts, and verified all model/vocab pins against the repo manifest. MODEL_LIVE extraction remains separately gated by the frozen web proxy (no authorized route); this row closes on the real-ASR + labelled-fallback trace. |

## 3. FHIR R4 Validation Engine

| Proposal item | Status | Evidence / notes |
|---|---|---|
| FHIR Bundle structure validation | **PARTIAL** | Current emitted shapes are a scribe collection with one QuestionnaireResponse and a selected-person vital collection with one anonymous Patient plus BP/pulse/weight Observations. Phase46/50 schema/invariant checks exist. Official validator7.0.6: scribe emitted fixture0 errors/0 warnings/2 notes; actual synthetic vital fixture0 errors/10 warnings/11 notes with -tx n/a. Prior fullUrl and missing-subject failures retained. No full terminology, semantic, clinical or ABDM conformance claim |
| Patient/Encounter/Condition/Observation/MedicationRequest resource validation | **PARTIAL** | Actual app output now includes Patient and Observation in the bounded vital export; scribe output remains QuestionnaireResponse. Separate synthetic profile-FORMAT fixtures cover the five named resources with official validator7.0.6 + ABDM IG6.5.0 (0 errors/6 warnings/7 notes; default public terminology server used, not fully offline). These are format tests, not actual app Encounter/Condition/MedicationRequest emission, clinical semantics or ABDM conformance. Evidence: 04-INTEROPERABILITY/profile-format-synthetic/ and VITALS_IDENTITY_DELTA_2026-11-22.md |
| Required-field + referential-integrity checks | **PARTIAL** | Existing emitted-output tests are now supplemented by a bounded app integrity gate on the two FHIR file actions: src/utils/exportIntegrity.js + src/services/checkedCollectionExport.js. Required subset fields, unique UUID fullUrls and in-file Patient subject resolution are checked before transport; missing/dangling/external/wrong-target links are refused with value-free explanations. Phase51 corrupts actual emitted clones and proves no writer call on rejection; mobile-width success/fault/retry flows exercise both actions. Independently reviewed at5371787, packaged in the v0.3.40-debug checkpoint; not in v0.3.39. Deliberately limited to the two current shapes, not complete FHIR validation |
| Invalid bundle rejection with error explanations | **PARTIAL** | Schema/invariant negative fixtures reject malformed bundles with explanations. The bounded pre-export app gate blocks its supported integrity failures before any file/cache/share action and shows fixed actionable messages, with no raw values in diagnostics. Actual supported outputs still pass unchanged. This is an app boundary, not rejection of every possible invalid FHIR/profile/clinical instance; source and actual mobile-width failure/retry flows independently reviewed at5371787; included in the v0.3.40-debug checkpoint |
| Official FHIR R4 profiles / ABDM implementation specs | **PARTIAL** | Official HL7 R4 base runs, automatically applied vital-sign profiles and synthetic five-resource profile-format runs have been executed and retained. The latter loads public ABDM IG6.5.0; no live ABDM exchange or verified real-care document semantics. Terminology-service use/limits differ by recorded run and are stated per artifact. App-specific ABDM-profiled document emission/integration remains unimplemented; do not repeat the completed scoped runs just to increase evidence |
| Deliverables FHIR_VALIDATION_REPORT.json, sample-valid/invalid-bundle.json, FHIR_INTEROPERABILITY_TESTS.md | **PARTIAL** | Named scribe schema artifacts remain dated baselines under 04-INTEROPERABILITY, generated by scripts/export_fhir_evidence.mjs. Later official-validator logs, synthetic profile-format fixtures and actual synthetic vital output/flow evidence supplement them. Their existence does not imply all-resource, terminology, semantic or ABDM conformance; see the individual scope notes |

## 4. Clinical Safety Red-Team Lab

| Proposal item | Status | Evidence / notes |
|---|---|---|
| Adversarial scenarios: dosage directives, batch order, semantic collisions, negation/hypothetical/historical speech, appended directives | **DONE** | Phases 42-44, fail-closed behavior tests, deterministic sections |
| 30-50 synthetic adversarial scenarios with expected/actual/pass-fail/evidence per scenario | **PARTIAL** | Current per-scenario ledger exported from a fresh full-suite run: `AYUSWAR-TECHNICAL-EVIDENCE/03-CLINICAL-SAFETY/RED_TEAM_TESTS_2026-11-22_current.json` (91 scenarios across phases 40-44, each with expected/actual/pass-fail/evidence, 0 failures, run at 2164f36; log preserved as `05-ENGINEERING-QUALITY/TEST_OUTPUT_2026-11-22_current.log`). Generator: scripts/export_red_team_ledger.mjs (refuses to export a red run, retaining the raw log as a FAILED-RUN artifact). Baseline `RED_TEAM_TESTS.json` (82 scenarios at 1447957) kept unchanged as the dated baseline; dated current machine-readable summaries committed as `05-ENGINEERING-QUALITY/TEST_RESULTS_2026-11-22_current.{json,xml}` (undated TEST_RESULTS files remain the baseline). Purpose-authored increment: `03-CLINICAL-SAFETY/ADVERSARIAL_SCENARIOS_2026-11-22.json` (39 text-level scenarios from scripts/export_adversarial_scenarios.mjs; each has authored expected behaviour written before the run, the actual per-candidate engine decisions, and PASS/FAIL; model-path cases use a SIMULATED adversarial reply through the real parser, not a provider; no audio). Final run (clean tracked tree at the revision recorded in the file): 35 PASS / 4 FAIL retained. Two limitation classes remain open and are NOT repaired: (a) marker-window over-negation (ADV-03 'I have a cough. No fever.', ADV-25 'headache but without fever', ADV-27 Telugu+English 'fever ఉంది but cough లేదు'): an affirmed symptom near a negation word is also flagged negated and held from export; (b) affirmed clause ending in a question (ADV-39 'I have a fever, do you know why?'): the question guard holds the affirmed fever AMBIGUOUS. Both fail closed (drop a true symptom, never export a denied one); a sentence-boundary or clause fix risks un-negating real denials such as 'Fever? No.' and needs clause-level parsing. Earlier runs with their failures are retained: `...PRE-FIX-RUN.json` (22 cases, 20/2), `...PRE-FIX-RUN-2-36cases.json` (31/5), `...PRE-FIX-RUN-3-39cases.json` (33/6, clean tree). Real guard gaps exposed and repaired, tightening only, each with a regression test (suite 410 passed / 3 conditional skips / 0 failed): fallback lexicon matched a prefix inside a vowel-sign-suffixed Hindi word (ADV-21); a doctor QUESTION exported fever as a positive symptom (ADV-32, now AMBIGUOUS); Hindi marker 'na' matched inside unrelated words (ADV-36, now whole-token); Telugu polite denials 'ledandi' and 'kaadandi' exported the denied symptom as positive because substring matching of the bare markers does not cover them (ADV-37/38, polite forms now listed explicitly; an earlier code comment wrongly claimed substring coverage and was corrected). These guard fixes are in the published v0.3.38-debug APK (https://github.com/Samrudh2006/AyuSwar-Mobile/releases/tag/v0.3.38-debug, commit 1dd3ad9); the earlier published 0.3.37-debug APK does NOT contain them. ADV-07 and ADV-29 document non-capabilities (no dose-safety check, no allergy-drug interaction check). Still PARTIAL: text-level only, simulated model replies, no real-provider or audio evidence (audio lab is row 58), and a hand-authored set is not coverage of real consultations. Stays PARTIAL: the dated current regression ledger is accepted evidence freshness, but expected/actual columns are uniform boilerplate, not meaningful per-scenario expected-vs-actual narratives, and raw scenario count alone does not close this deliverable. (The dated regression-ledger delta itself added no guard behavior; the purpose-authored scenario work above did lead to the guard repairs listed there.) Scope stays text-level guard checks - the proposed 30-50 AUDIO-level lab with per-scenario clinical narratives remains row 58, DEFERRED |
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
| B. Prescription comprehension testing | **DEFERRED** | No patient comprehension results. Bounded [Audio-Rx software consistency](AUDIO-RX-SOFTWARE-CONSISTENCY-2026-11-22.md) checks cover source/file binding and existing quiz-state integrity only; they do not close comprehension, intelligibility or clinician-approved-prescription matching. Next usable work: appropriately grounded comprehension evidence, not invented labels |

## Technical corrections called out in the proposal

| Item | Status | Notes |
|---|---|---|
| Acoustic biomarker stage labelled experimental | **DONE (mobile)** | Acoustic lab is labelled experimental/prototype in the mobile app; web labelling is out of scope here |
| Separate simulated vs measured vs validated metrics | **DONE** | Sample data tagged; benchmark numbers scoped to their splits; no externally-validated claims |
| Publish test logs, names, environment, reproducible commands | **DONE** | `test/run_all.js` prints per-phase counts (369 executed, 3 conditional skips at `338e92a`); `benchmarks/RESULTS.md` carries commands and environment |
| Demonstrate actual offline operation and recovery | **DONE** | Phase 47 + browser-verified IDB proofs |
| DPDP data flows / consent / retention / deletion documented | **DONE (mobile)** | `docs/CLINICAL_EVIDENCE_DATA_MODEL.md` and `docs/CLINICAL_EVIDENCE_SECURITY.md`: storage classes, encryption, retention, scrub behavior, delivery semantics |
| Repo visibility check (web repo appears private) | **OUT OF SCOPE (mobile task)** | Flagged for the owner; no change made from this repository |
| FHIR interoperability validated against applicable profiles | **PARTIAL** | Completed scoped official-validator/format runs are listed in section3. Real-care semantics, full terminology validation, ABDM-profiled emission and authorized service exchange are not established |

## AYUSWAR-TECHNICAL-EVIDENCE folder

**PARTIAL, improved.** The named folder now exists with 01-ARCHITECTURE, 02-AI-EVALUATION (measured FLEURS CSV), 03-CLINICAL-SAFETY (82 executed scenario records from the recorded suite run, not the proposed 30-50 audio-level lab), 04-INTEROPERABILITY (FHIR structural fixtures) and 05-ENGINEERING-QUALITY (per-suite stdout, JSON, JUnit XML). Pointer files reference the authoritative `docs/` documents; original coverage in `docs/`:
`CLINICAL_EVIDENCE_ENGINE.md` (architecture), `CLINICAL_EVIDENCE_DATA_MODEL.md`
(data flow/storage), `CLINICAL_EVIDENCE_SECURITY.md` (security audit),
`CLINICAL_EVIDENCE_EVALUATION.md` (evaluation summary), `benchmarks/RESULTS.md`
(ASR benchmarks), `docs/APK-PROVENANCE-2026-11-22.md` (build provenance).
Remaining gaps inside the folder: the red-team ledger is text-level only. DEPLOYMENT_GUIDE now exists at docs/DEPLOYMENT_GUIDE.md, scoped to the verified mobile debug-APK build/release path (release signing/AAB/Play listed as not done). PERFORMANCE_REPORT now exists under 06-PERFORMANCE/ with genuinely measured build-step durations, bundle composition and suite wall time (scripts/measure_performance.mjs, reproducible); it explicitly does NOT measure app startup/render/ASR/native runtime performance - those metrics and what they would need are listed in the report.

## What is NOT claimed

- No per-utterance audio timestamps, no terminology-service normalization.
- No live ABDM exchange, full terminology validation or clinical/semantic conformance. Scoped official-validator and synthetic profile-format runs DO exist; their limits are recorded per run.
- No 30-50 AUDIO-scenario red-team lab. There ARE 39 purpose-authored TEXT scenarios (35 PASS / 4 retained fail-closed FAILs) and delivered red-team/evaluation PDFs. Text fixtures are not audio/clinical coverage.
- Exactly-once delivery is not claimed: exponential backoff exists, and client idempotency keys are generated and surfaced when the backend advertises the column; server-side dedupe (UNIQUE + upsert) is documented but not applied or verified.
- No native install, device runtime, or production deployment claims.
