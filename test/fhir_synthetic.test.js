/**
 * AyuSwar AI — Synthetic FHIR R4 Bundle Verification
 * test/fhir_synthetic.test.js
 *
 * 1. Generated synthetic bundles carry the required resource types, internal
 *    references, and the synthetic-demo marker (no real patient data shape).
 * 2. CONDITIONAL: base FHIR R4 (R4B model) validation via
 *    scripts/validate_fhir_bundles.py passes when fhir.resources is
 *    installed locally. NRCeS/ABDM profile conformance is NOT claimed.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

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

const DIR = path.join('benchmarks', 'data', 'synthetic_fhir');
const IDS = ['syn-patient-001', 'syn-patient-002', 'syn-patient-003'];

check('synthetic bundles exist with required resources and synthetic marker', () => {
  execSync('python3 scripts/generate_synthetic_fhir.py', { stdio: 'pipe' });
  for (const id of IDS) {
    const file = path.join(DIR, `${id}.json`);
    assert(existsSync(file), `${file} missing`);
    const bundle = JSON.parse(readFileSync(file, 'utf-8'));
    assert(bundle.resourceType === 'Bundle' && bundle.type === 'collection', `${id}: not a collection Bundle`);
    const types = bundle.entry.map((e) => e.resource.resourceType).sort();
    const need = ['Condition', 'Encounter', 'MedicationRequest', 'Observation', 'Patient'];
    assert(JSON.stringify(types) === JSON.stringify(need), `${id}: resources ${types}`);
    const tag = bundle.meta?.tag?.[0]?.code;
    assert(tag === 'synthetic-demo-fixture', `${id}: synthetic marker missing`);
    for (const e of bundle.entry) {
      assert(e.fullUrl && e.fullUrl.startsWith('urn:uuid:'), `${id}: entry missing uuid fullUrl`);
    }
  }
});

let skipped = 0;
check('base FHIR R4 validation passes (conditional: needs fhir.resources)', () => {
  try {
    execSync('python3 -c "import fhir.resources.R4B.bundle"', { stdio: 'pipe' });
  } catch {
    skipped = 1;
    console.log('  - skipped: fhir.resources not installed locally (pip install fhir.resources)');
    return;
  }
  const out = execSync('python3 scripts/validate_fhir_bundles.py', { encoding: 'utf-8' });
  assert(out.includes('3/3 bundles valid'), 'validator did not pass all bundles');
  assert(out.includes('NOT covered'), 'ABDM non-coverage note missing');
});

let failed = 0;
for (const r of results) {
  if (r.ok) console.log(`  ✓ ${r.name}`);
  else {
    failed += 1;
    console.error(`  ✗ ${r.name}: ${r.err.message}`);
  }
}
console.log(`fhir_synthetic: ${results.length - failed}/${results.length} passed (${skipped} conditional skip)`);
process.exit(failed ? 1 : 0);
