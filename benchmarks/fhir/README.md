# FHIR R4 Draft-Bundle Validation

Evidence for external, schema-level validation of the **live** bundle emitted by
`src/mobile/scribeDraft.js` `buildDraftBundle()` — the object the mobile clinical
review flow actually produces. (Phase 16 covers static synthetic fixture bundles;
this covers the live emitter.)

## What was run

| Item | Value |
|---|---|
| Date | 2026-11-22 (IST) |
| Input | Bundle emitted by `buildDraftBundle()` with synthetic sample turns |
| Schema | Official HL7 FHIR R4 JSON Schema, `fhir.schema.json` from `https://hl7.org/fhir/R4/fhir.schema.json.zip` (schema id `http://hl7.org/fhir/json-schema/4.0`, JSON Schema draft-06) |
| Schema SHA-256 (vendored copy) | `2230406893b4cf002a4ee1e5e2bbeca22ac5d2d4931b3e9ef7b9594bbc376a01` |
| Validator | ajv 6.12.6 (draft-06 compatible), options `{ allErrors: true, validateSchema: false, schemaId: 'auto', logger: false }` |
| Result | **valid: true** — zero schema errors |

## Replay

```bash
npm install                              # installs ajv (devDependency)
node scripts/validate_fhir_draft_bundle.cjs
```

Expected output:

```
  ✓ buildDraftBundle output validates against FHIR R4 JSON schema (structural)
```

The same check runs in the suite as Phase 46 (`test/phase46_fhir_draft_bundle.test.js`).
It conditionally skips only if the vendored schema or ajv is missing (a fresh clone
before `npm install`).

## Scope of this evidence — what it is and is not

**Is:** JSON-schema structural conformance of the emitted Bundle and its
QuestionnaireResponse entry against the HL7-published FHIR R4 JSON schema
(required fields, cardinalities, primitive formats, enum value sets).

**Is NOT:**

- The official HL7 Java validator (`validator_cli.jar`) — not run here.
- Terminology/binding validation (no ValueSet expansion, no code-system checks).
- ABDM / NRCeS (India) profile conformance — explicitly not claimed; the bundle
  is a generic R4 collection Bundle, tagged `synthetic-research-draft`.
- Clinical/semantic validation of content — the SOAP text in the draft is
  synthetic sample data.
