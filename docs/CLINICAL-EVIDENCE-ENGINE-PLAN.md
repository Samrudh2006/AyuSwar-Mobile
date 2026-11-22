# Clinical Evidence Engine — Implementation Plan (AyuSwar-Mobile)

Branch: `feat/clinical-evidence-engine` · Base: main @ 4cbbf26 · Date: 2026-11-22
Scope: user brief of 2026-11-22 12:24 IST adapted to this Mobile repo (web repo untouched).

## 1. What the audit actually found (not assumed from filenames)

Transcript lifecycle today:
- `LiveScribeSessionModal.jsx` holds `dialogueList` turns shaped
  `{ speaker, lang, text }`. No utterance id, no timestamps, no structured
  provenance. Provenance today lives only inside decorated speaker label
  strings (`Doctor (Gnani STT - Live)`, `Doctor (Local on-device DRAFT -
  review required)`, `Doctor (Browser WebSpeech Fallback)`).
- Sources: live mic via Gnani STT route, local on-device ASR draft, browser
  WebSpeech fallback, and scripted demo encounters (Telugu/Hindi sample
  scripts hardcoded in the modal).
- Captured-audio path transcribes through Groq `whisper-large-v3-turbo`
  (`transcribeAudioWithGroqWhisper` in `aiBrainService.js`).
- SOAP/note generation: modal calls `reasonClinicalNoteWithEvon`
  (`gnaniEvonService.js`, `/api/evon/*` proxy); `ClinicalConsole.jsx` calls
  `queryGroqApi(..., "llama-3.3-70b-versatile")`. Medications field is
  currently emitted empty; no autonomous diagnosis.
- `auditLedgerService.js`: SHA-256 hash-chained localStorage ledger. Today
  only a demo button writes blocks. Reusable hook for review history — but
  no raw PHI/transcripts may enter ledger details (hashes + ids only).
- `diagnosticLogger.js`: diagnostics must stay free of transcripts, names,
  keys.
- `clinicalSafetySentinel.js`: existing local rule checks; reused, not
  replaced.
- `test/run_all.js` exists; there is NO `test:e2e` script, so that
  acceptance line is mapped to targeted Node tests + browser-verified
  screenshots; the nonexistent command will not be claimed.

Consequences for provenance honesty:
- utteranceId: new deterministic ids (`utt_<sessionId>_<seq>`), assigned at
  capture time going forward.
- timestamps: only recorded when genuinely available (live capture wall
  clock); scripted/demo turns get none. Never back-filled.
- provider: recorded from the actual code path that produced the turn
  (gnani_stt / local_onnx_draft / webspeech / groq_whisper / scripted_demo /
  manual_entry), not from desired architecture.

## 2. Layers mapped to real files

A. Source Registry — `src/services/clinicalEvidenceTypes.js` (schemas,
   sourceType enum, speaker enum) + `clinicalSourceRegistry.js` logic inside
   `clinicalEvidenceEngine.js`. Modal + console extended to stamp turns with
   id/sourceType/provider/timestamps at capture. Scripted demo turns marked
   `SCRIPTED_DEMO`, `isSynthetic: true`.
B. Extraction — `clinicalEvidenceEngine.js`: structured adapter over the
   existing Evon proxy (`reasonClinicalNoteWithEvon`-style call, server-side
   key). Model asked for candidates with exact quotes + utterance ids.
   Offsets computed deterministically in JS against the unchanged original
   string; model offsets ignored. Model unavailable → explicitly labelled
   deterministic fallback or EXTRACTION_UNAVAILABLE; fallback never labeled
   as live model.
C. Verification — `clinicalEvidenceVerifier.js`: deterministic statuses
   SUPPORTED / AMBIGUOUS / UNSUPPORTED / CONFLICTING / INVALID_SOURCE.
   Exact substring + offset equality, utterance existence, speaker
   attribution, negation/contradiction rules, medication-mentioned vs
   medication-prescribed separation. Fail closed.
D. Clinician Review — `clinicalEvidencePersistence.js` (localStorage,
   opt-in; no real patient data by default) + review actions
   approve/edit/reject/request-clarification with correction history,
   reviewer identity, reason, real review timestamp. Demo reviewer is
   labelled demo; no real sign-off claim. Ledger blocks record hashes/ids
   only.
E. Export — only approved eligible evidence enters verified output;
   unapproved claims blocked at the export gate.

UI: `ClinicalEvidencePanel.jsx` (+ Card/Timeline) mounted in
`ClinicalConsole.jsx` as a labelled beta/opt-in layer; existing 4-step
workflow, routes, SOAP, Audio-Rx, WhatsApp compose, FHIR, portals and
Sanjivani-108 untouched.

## 3. Test mapping (20 required cases)

All 20 brief cases implemented in `test/clinical_evidence_engine.test.js`
(Telugu, English, code-mixed offsets recomputed on unchanged originals) and
`test/clinical_evidence_ui.test.js`. Prompt-injection-inside-transcript is a
synthetic fixture test. Suite stays green; lint/build must pass.

## 4. Docs at completion

docs/CLINICAL_EVIDENCE_ENGINE.md, CLINICAL_EVIDENCE_DATA_MODEL.md,
CLINICAL_EVIDENCE_SECURITY.md, CLINICAL_EVIDENCE_EVALUATION.md + final
report (files created/modified, actual test results, limitations).

## 5. Explicit non-claims

No DPDP/ABDM/HIPAA compliance claim. No clinical validation. Fallback
output never presented as live model. No fabricated timestamps/providers.
Real-patient upload requires a consent basis that does not exist yet —
feature stays synthetic/demo until it does.
