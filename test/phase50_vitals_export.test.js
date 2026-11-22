/**
 * Phase 50: self-entered vitals export (selection, exclusion, provenance)
 * Synthetic readings only. Schema check is local JSON-Schema (structural).
 */
import { declareVitalSubject, loadVitalSubjects, subjectStorageKey } from '../src/utils/vitalSubjects.js';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { buildManualVital, formatManualVital } from '../src/utils/vitalsEntry.js';
import { classifyVitalsForExport, buildVitalsBundle, METHOD_TEXT, EXCLUDE } from '../src/utils/vitalsExport.js';

let passed = 0, failed = 0;
const check = (name, cond) => { if (cond) { passed++; console.log(`PASS ${name}`); } else { failed++; console.log(`FAIL ${name}`); } };

const subjects = [{id:'LOCAL-SELF-SECRET', kind:'self', label:'LOCAL-LABEL-SELF'}];
const classify = history => classifyVitalsForExport(history, subjects);
const build = (history, ids) => buildVitalsBundle(history, ids, subjects);
const typed = (over = {}) => {
  const r = buildManualVital({ date: '2026-11-20', time: '09:30 AM', systolic: '121', diastolic: '79', pulse: '71', spo2: '97', weight: '64.5', bloodSugar: '110', sourceNote: 'Self-measured at home', ...over });
  return r.valid ? {...formatManualVital(r.values, 'vit_manual_1'), subjectId: subjects[0].id} : null;
};
// Shapes copied from the bundled demo seeds in PatientPortal.jsx (they say sourceType 'manual').
const seedManual = { id: 'vit_001', date: '1 Nov 2026', bp: '132/84 mmHg', systolic: 132, diastolic: 84, pulse: '76 bpm', spo2: '98%', weight: '63 kg', source: 'Community Health Worker Visit', sourceType: 'manual', status: 'Self-reported' };
const seedReport = { id: 'vit_rep_pft', date: '1 Nov 2026', bp: '130/84 mmHg', systolic: 130, diastolic: 84, sourceType: 'report', status: 'Normal' };

const real = typed();
const history = [seedManual, seedReport, real];

// 1. only the typed row is eligible; seeds excluded with reason
{
  const { eligible, excluded } = classify(history);
  check('typed row eligible, both seeds excluded', eligible.length === 1 && eligible[0].id === 'vit_manual_1' && excluded.length === 2);
  check('manual-typed demo seed excluded with the not-new-entry reason', excluded.find(x => x.id === 'vit_001')?.reason === EXCLUDE.notNewEntry);
}
// 2. nothing ticked => nothing exported; seeds cannot be exported even if ticked
check('no selection exports nothing', build(history, []) === null);
check('ticking only seeds exports nothing', build(history, ['vit_001', 'vit_rep_pft']) === null);
// 3. output content
const bundle = build(history, ['vit_001', 'vit_manual_1']);
const obs = bundle.entry.filter(e => e.resource.resourceType === 'Observation').map(e => e.resource);
check('3 observations: BP panel, heart rate, weight', obs.length === 3 && obs.map(o => o.code.coding[0].code).join() === '85354-9,8867-4,29463-7');
check('values and units are the typed numbers with fixed UCUM units',
  obs[0].component[0].valueQuantity.value === 121 && obs[0].component[0].valueQuantity.code === 'mm[Hg]' &&
  obs[0].component[1].valueQuantity.value === 79 && obs[1].valueQuantity.value === 71 && obs[1].valueQuantity.code === '/min' &&
  obs[2].valueQuantity.value === 64.5 && obs[2].valueQuantity.code === 'kg');
check('date is exactly the typed date, no time component', obs.every(o => o.effectiveDateTime === '2026-11-20'));
const text = JSON.stringify(bundle);
check('SpO2 and glucose are never exported (no coded value, no note backdoor)', !/2708-6|59408-5|2339-0|2345-7|oxygen|glucose|97|110/i.test(text.replace(/2026-11-20|urn:uuid:[0-9a-f-]+|\d{4}-\d\d-\d\dT[\d:.]+Z/g, '')));
check('time and source-note defaults are not exported', !/09:30|Self-measured|Community Health/.test(text));
check('anonymous Patient with resolvable references, no performer/profile/tag', bundle.entry[0].resource.resourceType === 'Patient' && obs.every(o => o.subject.reference === bundle.entry[0].fullUrl) && !/"performer"|"profile"|synthetic/i.test(text) && bundle.meta === undefined);
check('status preliminary, provenance only states what the app proves, status separate', obs.every(o => o.status === 'preliminary' && o.method.text === METHOD_TEXT) && !/clinician-measured|verified by/i.test(METHOD_TEXT.replace('whether anyone verified it', '')));
// 4. exclusion rules
check('marker present but no ISO date => excluded, not guessed', classify([{ ...real, recordedDateIso: '23 Oct 2026' }]).excluded[0]?.reason === EXCLUDE.noDate);
check('marker present but nothing structured => excluded', classify([{ ...real, systolic: undefined, diastolic: undefined, pulseValue: undefined, weightValue: undefined }]).excluded[0]?.reason === EXCLUDE.noValues);
check('seed with a forged-looking numeric shape but no marker is excluded', classify([{ ...seedManual, recordedDateIso: '2026-11-01', pulseValue: 76 }]).eligible.length === 0);
check('wrong marker version excluded', classify([{ ...real, capture: { origin: 'app-user-entry', version: 2 } }]).eligible.length === 0);
// 5. entry form rules
check('free-text or missing date rejected at entry', !typed({ date: '23 Oct 2026' }) && !typed({ date: '' }) && !typed({ date: '2026-02-30' }));
check('old rows untouched: classify does not mutate input', JSON.stringify(history[0]) === JSON.stringify(seedManual));
// 6. partial entry: no weight => no weight observation
{
  const row = typed({ weight: '', bloodSugar: '' });
  const b = build([row], [row.id]);
  check('blank optional weight yields no weight observation', b.entry.filter(e => e.resource.resourceType === 'Observation').length === 2);
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
// Identity delta: labels never identify/group; profiles never share registries.
{
  const a = declareVitalSubject([], '__new__', 'Mother');
  const b = declareVitalSubject(a.records, '__new__', 'Mother');
  check('same labels create distinct stable IDs', a.subjectId !== b.subjectId && b.records[0].label === b.records[1].label);
  const c = declareVitalSubject(b.records, b.subjectId);
  check('existing person selected without new identity', c.subjectId === b.subjectId && c.records.length === 2);
  const d = declareVitalSubject(c.records, '__self__');
  const e = declareVitalSubject(d.records, '__self__');
  check('self is stable and separate from cared-for people', d.subjectId === e.subjectId && !b.records.some(r => r.id === d.subjectId));
  const blank = declareVitalSubject([], '__new__', '');
  check('blank label gets a display label with distinct ID', !!blank.records[0].label && blank.subjectId !== a.subjectId);
  check('missing choice refused', declareVitalSubject([], '') === null);
  const r1 = {...real, id:'one', subjectId:a.subjectId};
  const r2 = {...real, id:'two', subjectId:b.subjectId};
  let refused = false; try { buildVitalsBundle([r1,r2], ['one','two'], b.records); } catch { refused = true; }
  check('cross-person selection refused even with same labels', refused);
  const renamed = b.records.map(r => ({...r,label:'Completely different label'}));
  check('label changes never regroup entries', classifyVitalsForExport([r1,r2],renamed).eligible.map(e => e.subjectId).join() === [a.subjectId,b.subjectId].join());
  const anonymized = JSON.stringify(buildVitalsBundle([r1],['one'], b.records));
  check('local IDs and labels never appear in file', ![a.subjectId,b.subjectId,'Mother','LOCAL-SELF-SECRET','LOCAL-LABEL-SELF'].some(v => anonymized.includes(v)));
  check('pre-subject row excluded without migration', classify([{...real,subjectId:undefined}]).excluded[0].reason === EXCLUDE.noSubject);
  const data = new Map(); const storage = {getItem:k => data.get(k) || null, setItem:(k,v)=>data.set(k,v)};
  storage.setItem(subjectStorageKey('profile-A'), JSON.stringify(b.records));
  check('subject registry is isolated by profile', loadVitalSubjects(storage,'profile-A').length === 2 && loadVitalSubjects(storage,'profile-B').length === 0);
  check('foreign-profile row cannot export with a different registry', buildVitalsBundle([r1],['one'], subjects) === null);
  check('fixed self local ID absent from original output', !text.includes(subjects[0].id) && !text.includes(subjects[0].label));
}
console.log(`phase50_vitals_export: ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
