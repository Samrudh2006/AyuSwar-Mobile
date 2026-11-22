// Local-only person records for declared vital subjects. Labels are display
// text, never identity/group keys. No edit/reassignment/migration API.
export function subjectStorageKey(profileKey) {
  return `ayuswar_vitals_${profileKey}_subjects`;
}
export function loadVitalSubjects(storage, profileKey) {
  try {
    const records = JSON.parse(storage.getItem(subjectStorageKey(profileKey)) || '[]');
    return Array.isArray(records) ? records.filter(r => r && typeof r.id === 'string' && r.id && ['self', 'cared-for'].includes(r.kind) && typeof r.label === 'string') : [];
  } catch { return []; }
}
export function declareVitalSubject(records, choice, label = '') {
  if (choice === '__self__') {
    const existing = records.find(s => s.kind === 'self');
    if (existing) return { records, subjectId: existing.id };
    const person = { id: crypto.randomUUID(), kind: 'self', label: 'My own readings' };
    return { records: [...records, person], subjectId: person.id };
  }
  if (choice === '__new__') {
    const person = { id: crypto.randomUUID(), kind: 'cared-for', label: label.trim() || `Person ${records.length + 1}` };
    return { records: [...records, person], subjectId: person.id };
  }
  const person = records.find(s => s.id === choice && s.kind === 'cared-for');
  if (!person) return null;
  return { records, subjectId: person.id };
}
