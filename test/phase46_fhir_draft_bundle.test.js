/**
 * AyuSwar AI — Phase 46: Live Draft-Bundle FHIR R4 Conformance
 * test/phase46_fhir_draft_bundle.test.js
 *
 * Phase 16 validates static synthetic FIXTURE bundles. This phase closes the
 * remaining gap: the LIVE bundle emitted by src/mobile/scribeDraft.js
 * buildDraftBundle() (the object the mobile review flow actually produces).
 *
 * 1. UNCONDITIONAL: structural invariants of the emitted bundle (R4-required
 *    fields, ISO-8601 timestamp, synthetic meta.tag, unique linkIds,
 *    QuestionnaireResponse shape).
 * 2. CONDITIONAL: full HL7 FHIR R4 JSON-Schema validation of the emitted
 *    bundle via scripts/validate_fhir_draft_bundle.cjs (runs when the
 *    vendored schema at benchmarks/fhir/fhir.schema.json and ajv@6 are
 *    present; skips with instructions otherwise). This is JSON-schema
 *    structural conformance only — NOT the HL7 Java validator, NOT
 *    terminology validation, NOT ABDM/NRCeS profile conformance.
 */

import { execSync } from 'node:child_process';

const results = [];
const check = (name, fn) => {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, err });
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const { buildDraftBundle } = await import('../src/mobile/scribeDraft.js');
const bundle = buildDraftBundle(
  {
    subjective: 'Demo subjective text (synthetic)',
    objective: 'Not documented',
    assessment: 'Clinician review required',
    plan: 'Not documented',
    bestMatterVernacular: ''
  },
  [
    { speaker: 'DOCTOR', text: 'Demo line one (synthetic)' },
    { speaker: 'PATIENT', text: 'Demo line two (synthetic)' }
  ],
  'sample'
);

check('emitted bundle satisfies FHIR R4 structural invariants', () => {
  assert(bundle.resourceType === 'Bundle', 'resourceType must be Bundle');
  assert(bundle.type === 'collection', 'type must be collection');
  assert(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(bundle.timestamp || ''),
    'timestamp must be ISO-8601 instant'
  );
  const tags = (bundle.meta?.tag || []).map((t) => t.code);
  assert(tags.includes('synthetic-research-draft'), `synthetic meta.tag missing: ${tags}`);
  assert(Array.isArray(bundle.entry) && bundle.entry.length === 1, 'expected exactly one entry');
  // Official HL7 validator (7.0.6) finding: collection entries need fullUrl.
  assert(/^urn:uuid:[0-9a-f-]{36}$/.test(bundle.entry[0].fullUrl || ''),
    'collection entry must carry a urn:uuid fullUrl');
  const qr = bundle.entry[0].resource;
  assert(qr.text && qr.text.status === 'generated' && qr.text.div && qr.text.div.startsWith('<div xmlns="http://www.w3.org/1999/xhtml">'),
    'generated narrative missing (dom-6 best practice)');
  assert(qr.resourceType === 'QuestionnaireResponse', 'entry must be QuestionnaireResponse');
  assert(['in-progress', 'completed', 'amended', 'entered-in-error', 'stopped'].includes(qr.status),
    `status not in R4 enum: ${qr.status}`);
  const linkIds = (qr.item || []).map((i) => i.linkId);
  assert(new Set(linkIds).size === linkIds.length, 'item linkIds must be unique');
  for (const need of ['source-mode', 'source-transcript', 'subjective', 'objective', 'assessment', 'plan']) {
    assert(linkIds.includes(need), `required linkId missing: ${need}`);
  }
  for (const item of qr.item) {
    for (const ans of item.answer || []) {
      const keys = Object.keys(ans);
      assert(keys.length === 1 && keys[0] === 'valueString',
        `answer must carry exactly one value[x] of type string, got: ${keys}`);
    }
  }
});

let skipped = 0;
check('emitted bundle passes HL7 FHIR R4 JSON schema (conditional: schema + ajv)', () => {
  let out;
  try {
    out = execSync('node scripts/validate_fhir_draft_bundle.cjs', { encoding: 'utf-8' });
  } catch (err) {
    throw new Error(`validator script failed: ${(err.stdout || '').trim()} ${err.message}`);
  }
  if (out.includes('skipped:')) {
    skipped = 1;
    console.log(`  ↷ ${out.trim()}`);
    return;
  }
  assert(out.includes('validates against FHIR R4 JSON schema'), 'schema validation did not pass');
});

let failed = 0;
for (const r of results) {
  if (r.ok) console.log(`  ✓ ${r.name}`);
  else {
    failed += 1;
    console.error(`  ✗ ${r.name}: ${r.err.message}`);
  }
}
console.log(`fhir_draft_bundle: ${results.length - failed}/${results.length} passed (${skipped} conditional skip)`);
process.exit(failed ? 1 : 0);
