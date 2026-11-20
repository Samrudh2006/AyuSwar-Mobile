// Manual vitals entry: parse, validate, build. Pure functions, no DOM.
// Honesty rules (standing): an empty or invalid entry must stay absent or
// produce an error, never a normal-looking default value; a blank optional
// metric stays missing from the saved record; guards here are definitional
// only (finite, positive, SpO2 <= 100 by definition, systolic >= diastolic
// by definition) — they are NOT clinical interpretation, and extreme real
// values are accepted rather than silently rejected or diagnosed.

export function parseVitalNumber(raw) {
  if (raw == null) return { ok: false, reason: 'empty' };
  const text = String(raw).trim();
  if (text === '') return { ok: false, reason: 'empty' };
  const value = Number(text);
  if (!Number.isFinite(value)) return { ok: false, reason: 'not-a-number' };
  if (value <= 0) return { ok: false, reason: 'not-positive' };
  return { ok: true, value };
}

// Errors are i18n keys (translated at render via t()); see src/i18n/translations.js.
export const VITALS_ERR = {
  dateRequired: 'vitals.err.dateRequired',
  required: 'vitals.err.required',
  positive: 'vitals.err.positive',
  spo2Max: 'vitals.err.spo2Max',
  diaGtSys: 'vitals.err.diaGtSys'
};

export function buildManualVital(form) {
  const errors = {};
  const values = {};

  const date = (form.date ?? '').trim();
  if (!date) errors.date = VITALS_ERR.dateRequired;
  else values.date = date;

  for (const field of ['systolic', 'diastolic', 'pulse', 'spo2']) {
    const r = parseVitalNumber(form[field]);
    if (!r.ok) errors[field] = r.reason === 'empty' ? VITALS_ERR.required : VITALS_ERR.positive;
    else values[field] = r.value;
  }

  // SpO2 is a percentage of saturation: above 100 is impossible by definition.
  if (values.spo2 != null && values.spo2 > 100) {
    errors.spo2 = VITALS_ERR.spo2Max;
    delete values.spo2;
  }

  // Systolic is by definition the higher of the two pressures.
  if (values.systolic != null && values.diastolic != null && values.systolic < values.diastolic) {
    errors.diastolic = VITALS_ERR.diaGtSys;
  }

  // Optional metrics: blank stays absent; if present, must be a valid positive number.
  for (const field of ['weight', 'bloodSugar']) {
    const text = (form[field] ?? '').trim();
    if (text === '') continue;
    const r = parseVitalNumber(form[field]);
    if (!r.ok) errors[field] = VITALS_ERR.positive;
    else values[field] = r.value;
  }

  values.time = (form.time ?? '').trim();
  values.sourceNote = (form.sourceNote ?? '').trim();

  return { valid: Object.keys(errors).length === 0, errors, values };
}

// Display strings assembled only from validated values; nothing invented.
export function formatManualVital(values, id) {
  return {
    id,
    date: values.date,
    relativeLabel: 'Just now',
    offsetDays: 0,
    bp: `${values.systolic}/${values.diastolic} mmHg`,
    systolic: values.systolic,
    diastolic: values.diastolic,
    pulse: `${values.pulse} bpm`,
    spo2: `${values.spo2}%`,
    weight: values.weight != null ? `${values.weight} kg` : undefined,
    bloodSugar: values.bloodSugar != null ? `${values.bloodSugar} mg/dL` : undefined,
    source: values.sourceNote || 'Self-entered manual entry',
    sourceType: 'manual',
    // Manually typed numbers are not clinically staged or diagnosed here.
    status: 'Self-reported'
  };
}
