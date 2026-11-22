# FHIR draft-emitter structural checks

Replay:

```sh
npm ci
node scripts/export_fhir_evidence.mjs
```

The command calls the current `buildDraftBundle()` function with clearly
synthetic turns. It writes the emitted object as `sample-valid-bundle.json`,
then clones it and sets an invalid Bundle type and numeric
QuestionnaireResponse status for `sample-invalid-bundle.json`.

`FHIR_VALIDATION_REPORT.json` records actual generation time, source revision,
tracked-file dirty state, schema SHA-256, AJV version and errors per fixture.
The positive fixture must pass both the vendored HL7 R4 JSON Schema and the
project invariants. The negative fixture must fail both. Otherwise the command
fails and does not write a new success report. Dependencies missing is an error,
not a passing or silently skipped export. The earlier output files, if any,
retain their old timestamp and must not be described as a new successful run.

Project invariants mirror phase46: collection type, timestamp, synthetic tag,
one QuestionnaireResponse, permitted status, unique and required linkIds,
string-only answers. They are checks for this draft emitter, not a replacement
for official profile validation.

## Not established

- No HL7 Java validator or ABDM/NRCeS implementation-profile run.
- No terminology bindings, ValueSet expansion or coding validation.
- No Patient, Encounter, Condition, Observation or MedicationRequest profile
  validation, because this emitter creates a QuestionnaireResponse research
  draft rather than those resource types.
- No clinical validity, completeness of a clinical record or exchange with a
  hospital/registry. These are not real patient records.

The named report files now exist, but the broader FHIR proposal stays PARTIAL.
