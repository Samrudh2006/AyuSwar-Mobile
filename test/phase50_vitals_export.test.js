/**
 * Phase 50: self-entered vitals export (selection, exclusion, provenance)
 * Synthetic readings only. Schema check is local JSON-Schema (structural).
 */
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { buildManualVital, formatManualVital } from '../src/utils/vitalsEntry.js';
import { classifyVitalsForExport, buildVitalsBundle, METHOD_TEXT, EXCLUDE } from '../src/utils/vitalsExport.js';

let passed = 0, failed = 0;
const check = (name, cond) => { if (cond) { passed++; console.log(`PASS ${name}`); } else { failed++; console.log(`FAIL ${name}`); } };

const typed = (over = {}) => {
  const r = buildManualVital({ date: '2026-11-20', time: '09:30 AM', systolic: '121', diastolic: '79', pulse: '71', spo2: '97', weight: '64.5', bloodSugar: '110', sourceNote: 'Self-measured at home', ...over });
  return r.valid ? formatManualVital(r.values, 'vit_manual_1') : null;
};
// Shapes copied from the bundled demo seeds in PatientPortal.jsx (they say sourceType 'manual').
const seedManual = { id: 'vit_001', date: '1 Nov 2026', bp: '132/84 mmHg', systolic: 132, diastolic: 84, pulse: '76 bpm', spo2: '98%', weight: '63 kg', source: 'Community Health Worker Visit', sourceType: 'manual', status: 'Self-reported' };
const seedReport = { id: 'vit_rep_pft', date: '1 Nov 2026', bp: '130/84 mmHg', systolic: 130, diastolic: 84, sourceType: 'report', status: 'Normal' };

const real = typed();
const history = [seedManual, seedReport, real];

// 1. only the typed row is eligible; seeds excluded with reason
{
  const { eligible, excluded } = classifyVitalsForExport(history);
  check('typed row eligible, both seeds excluded', eligible.length === 1 && eligible[0].id === 'vit_manual_1' && excluded.length === 2);
  check('manual-typed demo seed excluded with the not-new-entry reason', excluded.find(x => x.id === 'vit_001')?.reason === EXCLUDE.notNewEntry);
}
// 2. nothing ticked => nothing exported; seeds cannot be exported even if ticked
check('no selection exports nothing', buildVitalsBundle(history, []) === null);
check('ticking only seeds exports nothing', buildVitalsBundle(history, ['vit_001', 'vit_rep_pft']) === null);
// 3. output content
const bundle = buildVitalsBundle(history, ['vit_001', 'vit_manual_1']);
const obs = bundle.entry.map(e => e.resource);
check('3 observations: BP panel, heart rate, weight', obs.length === 3 && obs.map(o => o.code.coding[0].code).join() === '85354-9,8867-4,29463-7');
check('values and units are the typed numbers with fixed UCUM units',
  obs[0].component[0].valueQuantity.value === 121 && obs[0].component[0].valueQuantity.code === 'mm[Hg]' &&
  obs[0].component[1].valueQuantity.value === 79 && obs[1].valueQuantity.value === 71 && obs[1].valueQuantity.code === '/min' &&
  obs[2].valueQuantity.value === 64.5 && obs[2].valueQuantity.code === 'kg');
check('date is exactly the typed date, no time component', obs.every(o => o.effectiveDateTime === '2026-11-20'));
const text = JSON.stringify(bundle);
check('SpO2 and glucose are never exported (no coded value, no note backdoor)', !/2708-6|59408-5|2339-0|2345-7|oxygen|glucose|97|110/i.test(text.replace(/2026-11-20|urn:uuid:[0-9a-f-]+|\d{4}-\d\d-\d\dT[\d:.]+Z/g, '')));
check('time and source-note defaults are not exported', !/09:30|Self-measured|Community Health/.test(text));
check('no Patient, subject, performer, profile or synthetic tag', !/"subject"|"performer"|"profile"|"Patient"|synthetic/i.test(text) && bundle.meta === undefined);
check('status preliminary, provenance only states what the app proves, status separate', obs.every(o => o.status === 'preliminary' && o.method.text === METHOD_TEXT) && !/clinician-measured|verified by/i.test(METHOD_TEXT.replace('whether anyone verified it', '')));
// 4. exclusion rules
check('marker present but no ISO date => excluded, not guessed', classifyVitalsForExport([{ ...real, recordedDateIso: '23 Oct 2026' }]).excluded[0]?.reason === EXCLUDE.noDate);
check('marker present but nothing structured => excluded', classifyVitalsForExport([{ ...real, systolic: undefined, diastolic: undefined, pulseValue: undefined, weightValue: undefined }]).excluded[0]?.reason === EXCLUDE.noValues);
check('seed with a forged-looking numeric shape but no marker is excluded', classifyVitalsForExport([{ ...seedManual, recordedDateIso: '2026-11-01', pulseValue: 76 }]).eligible.length === 0);
check('wrong marker version excluded', classifyVitalsForExport([{ ...real, capture: { origin: 'app-user-entry', version: 2 } }]).eligible.length === 0);
// 5. entry form rules
check('free-text or missing date rejected at entry', !typed({ date: '23 Oct 2026' }) && !typed({ date: '' }) && !typed({ date: '2026-02-30' }));
check('old rows untouched: classify does not mutate input', JSON.stringify(history[0]) === JSON.stringify(seedManual));
// 6. partial entry: no weight => no weight observation
{
  const row = typed({ weight: '', bloodSugar: '' });
  const b = buildVitalsBundle([row], [row.id]);
  check('blank optional weight yields no weight observation', b.entry.length === 2);
}
// 7. structural schema (local ajv, synthetic)
{
  const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const schemaPath = path.join(ROOT, 'benchmarks', 'fhir', 'fhir.schema.json');
  let Ajv; try { Ajv = createRequire(path.join(ROOT, 'package.json'))('ajv'); } catch {}
  if (Ajv && existsSync(schemaPath)) {
    const ajv = new Ajv({ allErrors: true, validateSchema: false, schemaId: 'auto', logger: false });
    const v = ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf-8')));
    check('bundle validates against the FHIR R4 JSON schema (structural only)', v(bundle) === true);
  } else console.log('SKIP schema check (ajv or schema not present)');
}
console.log(`phase50_vitals_export: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
