/**
 * Phase 44: Spoken-vital context safety (adversarial behavior tests)
 * services/soapDraftSafeguards.js — negated, hypothetical, questioned and
 * historical mentions must never surface as current objective-row vitals;
 * device-keyword ambiguity fails closed.
 */
import { readFileSync } from 'node:fs';
import {
  deterministicObjective, spokenVitalPairs, SUBJECTIVE_NOT_VERIFIED_LABEL
} from '../src/services/soapDraftSafeguards.js';

let passed = 0, failed = 0;
const check = (name, cond) => {
  if (cond) { passed++; console.log(`PASS ${name}`); }
  else { failed++; console.log(`FAIL ${name}`); }
};
const FALLBACK = 'No vitals or examination findings were captured in this session.';

// 1. Negated / denied mentions are excluded (English)
check('negated BP excluded', spokenVitalPairs('it is definitely not BP 180/110').length === 0);
check('denied BP excluded', spokenVitalPairs('patient denies BP 160/100 readings').length === 0);

// 2. Indic negation follows the value and is still excluded
check('Telugu trailing negation excluded', spokenVitalPairs('బీపీ 120/80 లేదు').length === 0);
check('Hindi trailing negation excluded', spokenVitalPairs('बीपी 140/90 नहीं है').length === 0);

// 3. Questions and hypotheticals are excluded
check('question excluded', spokenVitalPairs('was your BP 140/90 yesterday?').length === 0);
check('hypothetical excluded', spokenVitalPairs('if your BP goes above 160/100, call me').length === 0);
check('Hindi hypothetical excluded', spokenVitalPairs('अगर बीपी 150/95 हो जाए तो बताना').length === 0);

// 4. Historical mentions keep historical scope, never imply a current vital
{
  const pairs = spokenVitalPairs('my BP was 130/85 last month');
  check('historical mention retained with historical label',
    pairs.length === 1 && pairs[0].label === 'BP 130/85 (spoken as past history)' && pairs[0].scope === 'historical');
  const obj = deterministicObjective('my BP was 130/85 last month', FALLBACK);
  check('historical label carried into objective', obj.includes('(spoken as past history)'));
  check('historical mention not implied current', !/BP 130\/85(?!\s*\(spoken as past history\))/.test(obj));
}
check('time-ago historical labelled', spokenVitalPairs('BP 150/90 two years ago')[0]?.scope === 'historical');

// 5. Device-keyword ambiguity fails closed
check('pulse oximeter number is not HR', spokenVitalPairs('pulse oximeter 98').every(v => v.type !== 'HR'));
check('plain pulse still HR', spokenVitalPairs('pulse 72').some(v => v.label === 'HR 72 bpm'));

// 6. Genuine current mentions still extracted (guards must not over-exclude)
{
  const pairs = spokenVitalPairs('patient denies chest pain. BP 118/76 noted just now');
  check('negation in another clause does not over-exclude', pairs.some(v => v.label === 'BP 118/76' && v.scope === 'current'));
  const q = spokenVitalPairs('BP 120/80 noted. Any allergies?');
  check('question mark in another sentence does not exclude', q.some(v => v.label === 'BP 120/80'));
  const multi = spokenVitalPairs('SpO2 98% and heart rate 72 bpm today');
  check('current SpO2 and HR kept', multi.some(v => v.label === 'SpO2 98%') && multi.some(v => v.label === 'HR 72 bpm'));
}

// 7. Subjective boundary: explicit label exists and the console renders it
check('subjective-not-verified label exported',
  typeof SUBJECTIVE_NOT_VERIFIED_LABEL === 'string' && /NOT verified against source evidence/.test(SUBJECTIVE_NOT_VERIFIED_LABEL));
{
  const consoleSource = readFileSync(new URL('../src/components/ClinicalConsole.jsx', import.meta.url), 'utf8');
  check('console renders subjective-not-verified boundary', consoleSource.includes('SUBJECTIVE_NOT_VERIFIED_LABEL'));
}

console.log(`\nphase44_soap_objective_contexts: ${passed}/${passed + failed} passed`);
process.exit(failed === 0 ? 0 : 1);
