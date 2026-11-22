# Official HL7 Validator Run

Scope: **FHIR R4 (4.0.1) BASE validation** of the app's emitted draft bundle
using the official HL7 FHIR Validator. This is NOT profile conformance, NOT
terminology-service validation and NOT ABDM validation - no target
Implementation Guide profile was loaded.

## Tool

| Field | Value |
|---|---|
| Validator | official HL7 FHIR Validator, `validator_cli.jar` release 7.0.6 |
| Source | https://github.com/hapifhir/org.hl7.fhir.core/releases/download/7.0.6/validator_cli.jar (free, no account) |
| JAR SHA-256 | `2686590539f0b3ba7683149b25d78249f6886c04e2c326e884c5049d8947df89` (204,899,397 bytes) |
| Runtime | OpenJDK 21.0.13.1, hl7.fhir.r4.core#4.0.1 package (public package cache) |
| Date | 2026-11-22 |

## What it found (before the fix)

First run against the then-current emitted positive fixture: **FAILURE, 1
error, 1 warning, 2 notes**. The error was a real spec violation our
vendored-schema + invariant checks had missed: a collection-bundle entry
lacked the required `fullUrl` identity. The warning was the dom-6
best-practice narrative recommendation.

Verbatim record: `OFFICIAL_VALIDATOR_RUN.before-fix.log` (copied unedited).

## The fix

`src/mobile/scribeDraft.js` `buildDraftBundle`: each collection entry now
carries a `urn:uuid` `fullUrl`, and the QuestionnaireResponse carries a
generated narrative. phase46 gained assertions locking both. Fixtures were
regenerated from the live emitter by `scripts/export_fhir_evidence.mjs`.

## Result after the fix

- Emitted positive fixture: **Success: 0 errors, 0 warnings, 2 notes**.
- Deliberately-invalid negative fixture: still fails (5 errors) for its
  intended corruptions (invalid bundle type, non-string status), confirming
  the validator exercises the negative path.

Verbatim record: `OFFICIAL_VALIDATOR_RUN.after-fix.log` (copied unedited).

The 2 remaining notes are inherent to the prototype scope and are not
defects: the `urn:ayuswar:prototype` CodeSystem is not a published
CodeSystem (it marks the bundle as a synthetic research draft), and no base
Questionnaire is identified, so questionnaire-content validation cannot be
performed.

## Reproduce

```bash
curl -LO https://github.com/hapifhir/org.hl7.fhir.core/releases/download/7.0.6/validator_cli.jar
node scripts/export_fhir_evidence.mjs   # regenerate fixtures from the live emitter
java -jar validator_cli.jar \
  AYUSWAR-TECHNICAL-EVIDENCE/04-INTEROPERABILITY/sample-valid-bundle.json \
  AYUSWAR-TECHNICAL-EVIDENCE/04-INTEROPERABILITY/sample-invalid-bundle.json \
  -version 4.0.1
```

First run downloads the public hl7.fhir.r4.core package (no account).
