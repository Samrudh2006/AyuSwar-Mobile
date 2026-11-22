# Self-entered vital export: declared-person delta, 2026-11-22

Scope: Mobile repository branch only. No APK/release yet. No clinical validation,
ABDM conformance, device install or native-runtime claim. Independent review is
required before a release checkpoint.

## Entry and local identity

Every new entry requires a person declaration, with no default. Choosing self
reuses one random local subject ID for the current profile. Choosing an existing
cared-for person reuses that person's ID. Adding another person explicitly
creates a new random ID, even when the label is identical or blank. Blank labels
receive a display label. Labels are not identity/group keys. There is no label
edit, subject edit, reassignment or history migration feature.

Subject records `{id,kind,label}` live only under the profile-scoped sibling key
`ayuswar_vitals_<abhaId>_subjects`. Rows store a subjectId. The portal remounts its
profile-local state when the profile key changes, so a prior profile's state is
not written into a new profile's key. Classification and export require the
row's subject ID to exist in the current profile's registry.

Existing readings are untouched. A seeded or older entry cannot become eligible
by acquiring a display shape. The capture marker, structured date/value checks
and declared subject are all required. Pre-subject entries remain excluded, with
a visible reason; there is no bulk relabel operation.

## Export

One file contains readings for exactly one local subject ID. Both the UI and the
pure builder refuse cross-subject selection. Each output has one anonymous
Patient entry with a fresh export-only UUID, referenced by every Observation.
No local IDs, labels, relationship, ABHA, personal identifiers or source-note
text are exported. A Patient reference asserts only the entry-time declaration
that the selected readings concern one person; it does not establish their
identity or who took the measurements. The narrative describes what the FILE
omits, not what the APP stores locally.

Filename: `ayuswar-readings-YYYY-MM-DD.json`, with no person label. The preview
warns that the recipient cannot identify the person from the file, asks the user
to identify them separately, and says to keep different people's files separate.
Handing over a file is not identity evidence.

BP, pulse and weight remain the only coded exports. SpO2 and glucose stay
excluded, with reasons shown and no note backdoor. No performer is invented.
Workflow status remains preliminary, separate from the capture-proven method
text. No claim is made about how consumers interpret that status.

## Evidence

- Phase 50: 31 passing checks (19 earlier checks adapted for subject references,
  plus 12 identity checks). Full suite: 441 passed, 3 conditional skips, 0 failed.
- `scripts/test_vitals_identity_flow.mjs` serves the built dist locally, blocks
  non-local requests and drives the actual mobile-width flow (390 x 844):
  Home -> patient demo sign-in -> My Health -> export panel -> required person
  declaration -> two same-label cared-for people plus self -> all unchecked ->
  refused cross-subject tick -> actual file export.
- Flow log: `VITALS_IDENTITY_FLOW_2026-11-22.log`.
- Screenshots: `vitals-identity-ui-2026-11-22/01..05*.png`. Declaration error,
  unchecked selection and same-label separation were visually inspected.
  These are browser screenshots, not Android device evidence.
- The actual intercepted file contains synthetic typed readings only:
  `SELF_ENTERED_VITALS_IDENTITY_SYNTHETIC_FIXTURE_2026-11-22.json`.
- Official HL7 validator 7.0.6 with `-version 4.0.1 -tx n/a`: 0 errors,
  10 warnings, 11 notes. Log:
  `OFFICIAL_VALIDATOR_RUN.vitals-identity-2026-11-22.log`.
  `-tx n/a` disables terminology services; it does not prove the whole validator
  run is fully offline. Warnings remain for no performer and unvalidated
  terminology/UCUM. No real readings were used. Structural validation is not
  semantic or clinical proof.
- The earlier subject-less fixture and failed validator log (3 errors,
  13 warnings, 11 notes) are preserved unchanged. Its JSON-schema pass alone
  was insufficient; the declared-person delta addresses the missing-subject
  errors rather than suppressing them.

## Source references checked during design

- https://hl7.org/fhir/R4/observation.html
- https://hl7.org/fhir/R4/patient.html
- https://hl7.org/fhir/R4/valueset-observation-status.html
- https://hl7.org/fhir/R4/bp.html
- https://hl7.org/fhir/R4/heartrate.html
- https://hl7.org/fhir/R4/bodyweight.html
- https://loinc.org/85354-9
- https://loinc.org/8480-6
- https://loinc.org/8462-4
- https://loinc.org/8867-4
- https://loinc.org/29463-7
