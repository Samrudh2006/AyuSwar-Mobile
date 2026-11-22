#!/usr/bin/env node
/**
 * AyuSwar AI — Live Draft-Bundle FHIR R4 JSON-Schema Validation
 * scripts/validate_fhir_draft_bundle.cjs
 *
 * Validates the ACTUAL output of src/mobile/scribeDraft.js buildDraftBundle()
 * (the same bundle the mobile review flow emits) against the official HL7
 * FHIR R4 JSON Schema (fhir.schema.json, downloaded from
 * https://hl7.org/fhir/R4/fhir.schema.json.zip and vendored at
 * benchmarks/fhir/fhir.schema.json).
 *
 * SCOPE: JSON-schema structural conformance only. This does NOT run the HL7
 * Java validator, does NOT check terminology bindings, and does NOT claim
 * ABDM/NRCeS profile conformance. See benchmarks/fhir/README.md.
 *
 * Exit codes: 0 = valid (or conditional skip), 1 = invalid bundle.
 */

const { createRequire } = require('node:module');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SCHEMA_PATH =
  process.env.FHIR_R4_SCHEMA || path.join(ROOT, 'benchmarks', 'fhir', 'fhir.schema.json');

(async () => {
  let Ajv;
  try {
    const req = createRequire(path.join(ROOT, 'package.json'));
    Ajv = req('ajv');
  } catch {
    console.log('  ↷ skipped: ajv not installed (npm install) — see benchmarks/fhir/README.md');
    process.exit(0);
  }
  if (!existsSync(SCHEMA_PATH)) {
    console.log(`  ↷ skipped: FHIR R4 schema not found at ${SCHEMA_PATH} — see benchmarks/fhir/README.md`);
    process.exit(0);
  }

  const { buildDraftBundle } = await import(path.join(ROOT, 'src', 'mobile', 'scribeDraft.js'));
  const soap = {
    subjective: 'Demo subjective text (synthetic)',
    objective: 'Not documented',
    assessment: 'Clinician review required',
    plan: 'Not documented',
    bestMatterVernacular: ''
  };
  const turns = [
    { speaker: 'DOCTOR', text: 'Demo line one (synthetic)' },
    { speaker: 'PATIENT', text: 'Demo line two (synthetic)' }
  ];
  const bundle = buildDraftBundle(soap, turns, 'sample');

  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
  const ajv = new Ajv({ allErrors: true, validateSchema: false, schemaId: 'auto', logger: false });
  const validate = ajv.compile(schema);
  const ok = validate(bundle);
  if (!ok) {
    console.error('  ✗ buildDraftBundle output FAILED FHIR R4 JSON schema:');
    for (const e of validate.errors.slice(0, 30)) {
      console.error(`    ${e.dataPath || '(root)'} - ${e.message}`);
    }
    process.exit(1);
  }
  console.log('  ✓ buildDraftBundle output validates against FHIR R4 JSON schema (structural)');
})();
