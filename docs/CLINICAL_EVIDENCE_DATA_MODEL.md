# Clinical Evidence Engine — Data Model

All structures below are implemented in `src/services/clinicalEvidenceTypes.js`
and the modules listed in `CLINICAL_EVIDENCE_ENGINE.md`. Synthetic demo data
only.

## Enumerations

- **SPEAKER**: `DOCTOR`, `PATIENT`, `OTHER`
- **SOURCE_TYPE**: `LIVE_RECORDING`, `PROVIDER_TRANSCRIPTION`,
  `SCRIPTED_DEMO`, `MANUAL_ENTRY`
- **ENTITY_TYPE**: `SYMPTOM`, `DURATION`, `VITAL`, and further clinical
  entity kinds (see `ENTITY_TYPE` in the source, including
  `MEDICATION_INSTRUCTION`)
- **VERIFICATION_STATUS**: result of rule verification of a candidate
  against its source utterance; only surviving records may be exported as
  SUPPORTED
- **CLINICIAN_STATUS**: review state set by `applyReviewAction`
- **EXTRACTION_METHOD**: records how a candidate was produced (model vs
  fallback) so fallback output is never mislabeled

## Source utterance

Created by `createSourceUtterance`. Deterministic id `utt_<sessionId>_<seq>`.
Carries speaker, text, source type, and `isSynthetic` (defaults true).
Timestamps exist only when the caller supplies them.

## Evidence candidate

Created by `createEvidenceCandidate`: entity type, value/unit, the source
utterance reference and character-span offsets into the original transcript
(Telugu, English and code-mixed offsets are covered by Phase 40 cases),
verification status, extraction method, and provenance fields that stay
undefined unless actually known.

## Clinician review record

`applyReviewAction(record, action, reviewer, reason)` records each decision
with reviewer and reason. `selectApprovedForExport` filters to approved +
supported records; negated findings are excluded from positive export.

## SOAP draft object

`{ subjective, objective, assessment, plan, bestMatterVernacular }`, assembled
deterministically. Sections that carry no verified value show an explicit
"Not documented" state rather than invented content.

## FHIR-shaped export bundle

`buildDraftBundle(soap, turns, sourceMode)` → FHIR R4 collection Bundle with
one QuestionnaireResponse entry:

- `meta.tag`: `synthetic-research-draft`
- `timestamp`: emission time, ISO-8601
- item linkIds: `source-mode`, `source-transcript`, `subjective`,
  `objective`, `assessment`, `plan`, `bestMatterVernacular` (unique, answers
  are single `valueString`)
- Conformance evidence: `benchmarks/fhir/README.md` (schema + project
  invariants; not ABDM/NRCeS profile conformance)

## Offline queue record

`offlineSyncService.saveOfflineRecord(type, payload)`:

- Cleartext queue-management metadata only: `id` (`off_<ts>_<rand>`), `type`
  (`vital` | `encounter` | other), `createdAt`, `status` (`pending_sync`),
  `syncAttempts`, `lastSyncErrorCategory` (bounded enum: `http-4xx`,
  `http-5xx`, `http-other`, `network`, `timeout`, `no-sync-route`,
  `unknown`), `lastSyncAttemptAt`. Raw upstream error text is never stored.
- `payload`: AES-256-GCM encrypted envelope (`payloadEncrypted: true`);
  legacy plaintext rows pass through reads but are never written.
- Stores: IndexedDB `pending_sync_queue` (primary) or the localStorage
  fallback key `ayuswar_offline_sync_queue_v2`.
- Lifecycle: retained across failed cycles (no auto-delete); removed on
  acknowledged sync success or by explicit user-confirmed discard only.
