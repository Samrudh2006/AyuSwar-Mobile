// Export of the user's own typed vital readings as a FHIR R4 collection Bundle.
// Pure functions, no DOM, no network, no storage.
//
// Boundaries (deliberate):
// - Only rows carrying the capture marker stamped by formatManualVital (typed
//   into the entry form in this version) with valid structured fields are
//   eligible. sourceType alone is NOT enough: bundled demo seeds also say
//   'manual'. Everything else is excluded with a visible reason.
// - Date only. The form's time and "source note" are pre-filled defaults, so
//   they are never exported as captured facts.
// - One anonymous Patient per export, based on a per-entry declaration.
//   No local subject IDs, labels, performer, or profile claims leave the app.
// - SpO2 and blood glucose are not exported yet: their coding needs
//   measurement semantics (SpO2: arterial vs pulse-oximetry coding) or
//   context (glucose: fasting/random) the app does not capture.
// - Status 'preliminary' is the R4-defined code for data that may be
//   incomplete or unverified. Consumers may interpret it as they like; what the
//   app can actually prove is stated in Observation.method.text.

import { CAPTURE_ORIGIN, CAPTURE_VERSION, parseIsoDate } from './vitalsEntry.js';

export const EXCLUDE = {
  notNewEntry: 'Not typed in this version of the app (demo sample or older entry), so it is not exported.',
  noSubject: 'Whose reading this is was not recorded, or the local person record is unavailable.',
  noDate: 'No structured measurement date was captured, so none is guessed.',
  noValues: 'No exportable reading (blood pressure, pulse or weight) with a structured value.'
};
export const NOT_EXPORTED_METRICS = {
  spo2: 'SpO2 is not exported yet: the app does not capture how it was measured.',
  bloodSugar: 'Blood glucose is not exported yet: the app does not capture fasting/random context.'
};

export const METHOD_TEXT = 'Value typed into the AyuSwar app by its user. The app does not record who took the measurement, with what, or whether anyone verified it.';

const LOINC = 'http://loinc.org';
const UCUM = 'http://unitsofmeasure.org';
const VITAL_CATEGORY = [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }];

const isPos = (n) => typeof n === 'number' && Number.isFinite(n) && n > 0;

// Which readings of a row can be exported, from structured fields only.
export function exportableReadings(row) {
  const out = [];
  if (isPos(row.systolic) && isPos(row.diastolic) && row.systolic >= row.diastolic) {
    out.push({ kind: 'bp', label: `${row.systolic}/${row.diastolic} mmHg` });
  }
  if (isPos(row.pulseValue)) out.push({ kind: 'pulse', label: `${row.pulseValue} /min` });
  if (isPos(row.weightValue)) out.push({ kind: 'weight', label: `${row.weightValue} kg` });
  return out;
}

export function classifyVitalsForExport(history, subjects = []) {
  const eligible = [];
  const excluded = [];
  for (const row of Array.isArray(history) ? history : []) {
    const id = row?.id;
    const cap = row?.capture;
    if (!row || row.sourceType !== 'manual' || !cap || cap.origin !== CAPTURE_ORIGIN || cap.version !== CAPTURE_VERSION) {
      excluded.push({ id, reason: EXCLUDE.notNewEntry });
      continue;
    }
    if (!row.subjectId || !subjects.some(s => s.id === row.subjectId)) { excluded.push({ id, reason: EXCLUDE.noSubject }); continue; }
    const dateIso = parseIsoDate(row.recordedDateIso);
    if (!dateIso) { excluded.push({ id, reason: EXCLUDE.noDate }); continue; }
    const readings = exportableReadings(row);
    if (readings.length === 0) { excluded.push({ id, reason: EXCLUDE.noValues }); continue; }
    const notExported = [];
    if (row.spo2Value != null || row.spo2) notExported.push(NOT_EXPORTED_METRICS.spo2);
    if (row.bloodSugar) notExported.push(NOT_EXPORTED_METRICS.bloodSugar);
    eligible.push({ id, subjectId: row.subjectId, dateIso, readings, notExported });
  }
  return { eligible, excluded };
}

function narrative(text) {
  return { status: 'generated', div: `<div xmlns="http://www.w3.org/1999/xhtml">${text}</div>` };
}

function observation({ code, display, dateIso, extra, summary }) {
  return {
    fullUrl: `urn:uuid:${globalThis.crypto.randomUUID()}`,
    resource: {
      resourceType: 'Observation',
      text: narrative(summary),
      status: 'preliminary',
      category: VITAL_CATEGORY,
      code: { coding: [{ system: LOINC, code, display }], text: display },
      effectiveDateTime: dateIso,
      method: { text: METHOD_TEXT },
      ...extra
    }
  };
}

const qty = (value, unit, code) => ({ value, unit, system: UCUM, code });

// selectedIds: ids the user explicitly ticked. Nothing is exported by default.
export function buildVitalsBundle(history, selectedIds, subjects = []) {
  const wanted = new Set(selectedIds || []);
  const { eligible } = classifyVitalsForExport(history, subjects);
  const rowsById = new Map((history || []).map(r => [r.id, r]));
  const selected = eligible.filter(e => wanted.has(e.id));
  if (new Set(selected.map(e => e.subjectId)).size > 1) throw new Error('Select readings for only one person per file.');
  const patientUrl = `urn:uuid:${globalThis.crypto.randomUUID()}`;
  const entry = [];
  for (const e of eligible) {
    if (!wanted.has(e.id)) continue;
    const row = rowsById.get(e.id);
    for (const r of e.readings) {
      if (r.kind === 'bp') {
        entry.push(observation({
          code: '85354-9', display: 'Blood pressure panel with all children optional', dateIso: e.dateIso,
          summary: `Blood pressure ${row.systolic}/${row.diastolic} mmHg, entered for ${e.dateIso}.`,
          extra: {
            component: [
              { code: { coding: [{ system: LOINC, code: '8480-6', display: 'Systolic blood pressure' }] }, valueQuantity: qty(row.systolic, 'mmHg', 'mm[Hg]') },
              { code: { coding: [{ system: LOINC, code: '8462-4', display: 'Diastolic blood pressure' }] }, valueQuantity: qty(row.diastolic, 'mmHg', 'mm[Hg]') }
            ]
          }
        }));
      } else if (r.kind === 'pulse') {
        entry.push(observation({
          code: '8867-4', display: 'Heart rate', dateIso: e.dateIso,
          summary: `Heart rate ${row.pulseValue} per minute, entered for ${e.dateIso}.`,
          extra: { valueQuantity: qty(row.pulseValue, 'beats/minute', '/min') }
        }));
      } else if (r.kind === 'weight') {
        entry.push(observation({
          code: '29463-7', display: 'Body weight', dateIso: e.dateIso,
          summary: `Body weight ${row.weightValue} kg, entered for ${e.dateIso}.`,
          extra: { valueQuantity: qty(row.weightValue, 'kg', 'kg') }
        }));
      }
    }
  }
  if (entry.length === 0) return null; // nothing selected, nothing exported
  for (const e of entry) e.resource.subject = { reference: patientUrl };
  entry.unshift({ fullUrl: patientUrl, resource: { resourceType: 'Patient', text: narrative('The app user declared that these readings are about one person. This file omits their name, local label, relationship and identifiers. It does not record who measured, with what device, or whether anyone verified the readings.') } });
  return {
    resourceType: 'Bundle', type: 'collection', timestamp: new Date().toISOString(),
    entry
  };
}
