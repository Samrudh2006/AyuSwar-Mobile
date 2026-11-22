// App-local integrity checks for the TWO emitted collection shapes only.
// Not a FHIR/profile/terminology/clinical validator. No network or persistence.
// Errors are fixed categories: never copy values, identifiers or source text.
import { parseIsoDate } from './vitalsEntry.js';

export const INTEGRITY_MESSAGES = Object.freeze({
  COLLECTION: 'The export file structure is incomplete. Return to review and try again.',
  ENTRY_ID: 'An export entry has a missing or invalid file identity. Try the export again.',
  DUPLICATE_ID: 'Export entries share a file identity. Try the export again.',
  RESOURCE: 'An export resource is incomplete or unsupported. Return to review.',
  REFERENCE: 'An export resource link is missing or invalid. Return to review and try again.',
  SCRIBE_FIELDS: 'The draft is missing valid review sections. Return to review before exporting.',
  VITAL_FIELDS: 'A reading has an invalid date, value or unit. Review the readings before exporting.'
});
const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
const uuid = x => typeof x === 'string' && /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const narrative = r => r?.text?.status === 'generated' && typeof r.text.div === 'string' && r.text.div.startsWith('<div xmlns="http://www.w3.org/1999/xhtml">') && r.text.div.endsWith('</div>');
const pos = x => typeof x === 'number' && Number.isFinite(x) && x > 0;
const qty = (q,code) => object(q) && pos(q.value) && q.system === 'http://unitsofmeasure.org' && q.code === code && typeof q.unit === 'string' && q.unit.length > 0;
const loinc = (c,code) => Array.isArray(c?.coding) && c.coding.length === 1 && c.coding[0]?.system === 'http://loinc.org' && c.coding[0]?.code === code;
const fields = ['source-mode','source-transcript','subjective','objective','assessment','plan','bestMatterVernacular'];

// Only in-file subject links are supported by the current emitters. A recursive
// scan also rejects an unexpected hidden reference instead of resolving it via
// network or accepting a valid-looking external URL. Cycles are rejected.
function references(value, found = [], active = new WeakSet(), depth = 0) {
  if (!value || typeof value !== 'object') return found;
  if (depth > 64) { found.push(null); return found; }
  if (active.has(value)) { found.push(null); return found; }
  active.add(value);
  for (const [k,v] of Object.entries(value)) {
    if (k === 'reference') found.push(v);
    else references(v,found,active,depth + 1);
  }
  active.delete(value);
  return found;
}

export function checkExportIntegrity(bundle, kind) {
  const codes = new Set();
  const add = code => codes.add(code);
  const done = () => ({ ok: codes.size === 0, errors: [...codes].map(code => ({ code, message: INTEGRITY_MESSAGES[code] })) });
  if (!['scribe','vitals'].includes(kind) || !object(bundle) || bundle.resourceType !== 'Bundle' || bundle.type !== 'collection' ||
      typeof bundle.timestamp !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(bundle.timestamp) ||
      !Number.isFinite(Date.parse(bundle.timestamp)) || !parseIsoDate(bundle.timestamp.slice(0,10)) || Number(bundle.timestamp.slice(11,13)) > 23 || Number(bundle.timestamp.slice(14,16)) > 59 || Number(bundle.timestamp.slice(17,19)) > 59 || !Array.isArray(bundle.entry) || bundle.entry.length === 0) {
    add('COLLECTION'); return done();
  }
  const identities = new Set();
  for (const e of bundle.entry) {
    if (!object(e) || !uuid(e.fullUrl)) add('ENTRY_ID');
    else {
      const key = e.fullUrl.toLowerCase();
      if (identities.has(key)) add('DUPLICATE_ID');
      identities.add(key);
    }
    if (!object(e?.resource) || !narrative(e.resource)) add('RESOURCE');
  }
  if (kind === 'scribe') {
    const r = bundle.entry[0]?.resource;
    if (bundle.entry.length !== 1 || r?.resourceType !== 'QuestionnaireResponse') add('RESOURCE');
    const tags = bundle.meta?.tag;
    if (!Array.isArray(tags) || !tags.some(t => t?.system === 'urn:ayuswar:prototype' && t.code === 'synthetic-research-draft')) add('SCRIBE_FIELDS');
    if (r?.status !== 'completed' || !Array.isArray(r?.item) || r.item.length !== fields.length ||
        new Set(r?.item?.map(i => i?.linkId)).size !== fields.length ||
        !fields.every(key => r?.item?.some(i => i?.linkId === key))) add('SCRIBE_FIELDS');
    if (Array.isArray(r?.item) && r.item.some(i => !object(i) || !Array.isArray(i.answer) || i.answer.length !== 1 ||
        !object(i.answer[0]) || Object.keys(i.answer[0]).length !== 1 || typeof i.answer[0].valueString !== 'string')) add('SCRIBE_FIELDS');
    if (references(bundle).length) add('REFERENCE');
    return done();
  }
  const patients = bundle.entry.filter(e => e?.resource?.resourceType === 'Patient');
  const observations = bundle.entry.filter(e => e?.resource?.resourceType === 'Observation');
  if (patients.length !== 1 || observations.length < 1 || patients.length + observations.length !== bundle.entry.length) add('RESOURCE');
  const patientUrl = patients.length === 1 && uuid(patients[0].fullUrl) ? patients[0].fullUrl.toLowerCase() : null;
  // Current Patient is deliberately anonymous: do not accept an expansion of
  // that shape through this route without a separately reviewed contract.
  if (patients.some(e => Object.keys(e.resource).some(k => !['resourceType','text'].includes(k)))) add('RESOURCE');
  const refs = references(bundle);
  if (!patientUrl || refs.length !== observations.length || refs.some(r => !uuid(r) || r.toLowerCase() !== patientUrl || !identities.has(r.toLowerCase()))) add('REFERENCE');
  for (const e of observations) {
    const r = e.resource;
    if (!uuid(r.subject?.reference) || r.subject.reference.toLowerCase() !== patientUrl) add('REFERENCE');
    if (Object.keys(r).some(k => !['resourceType','text','status','category','code','effectiveDateTime','method','subject','component','valueQuantity'].includes(k))) add('RESOURCE');
    if (r.status !== 'preliminary' || !parseIsoDate(r.effectiveDateTime) || typeof r.method?.text !== 'string' || !r.method.text ||
        (!Array.isArray(r.category) || !r.category.some(c => Array.isArray(c?.coding) && c.coding.some(v => v?.system === 'http://terminology.hl7.org/CodeSystem/observation-category' && v.code === 'vital-signs')))) add('VITAL_FIELDS');
    if (loinc(r.code,'85354-9')) {
      const c = r.component;
      if (r.valueQuantity !== undefined || !Array.isArray(c) || c.length !== 2 || !loinc(c[0]?.code,'8480-6') || !loinc(c[1]?.code,'8462-4') ||
          !qty(c[0]?.valueQuantity,'mm[Hg]') || !qty(c[1]?.valueQuantity,'mm[Hg]') || c[0].valueQuantity.value < c[1].valueQuantity.value) add('VITAL_FIELDS');
    } else if (loinc(r.code,'8867-4')) {
      if (r.component !== undefined || !qty(r.valueQuantity,'/min')) add('VITAL_FIELDS');
    } else if (loinc(r.code,'29463-7')) {
      if (r.component !== undefined || !qty(r.valueQuantity,'kg')) add('VITAL_FIELDS');
    } else add('VITAL_FIELDS');
  }
  return done();
}

export function integrityFailureMessage(result) {
  return `Export blocked by app integrity checks. ${result.errors[0]?.message || INTEGRITY_MESSAGES.COLLECTION} No file was created or shared.`;
}
