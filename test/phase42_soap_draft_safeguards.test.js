/**
 * Phase 42: SOAP Draft Deterministic Safeguards (static contract)
 *
 * Verifies the ClinicalConsole Step 2 draft path enforces its conservative
 * guarantees in code, not only via prompt wording:
 *  1. Model-supplied medications are never accepted into the draft.
 *  2. Scripted sample vitals are gated on an all-scripted session and labeled.
 *  3. Live/mixed sessions purge scripted sample medications at draft time.
 */
import { readFileSync } from 'node:fs';

const src = readFileSync('src/components/ClinicalConsole.jsx', 'utf8');

let passed = 0, failed = 0;
const check = (name, cond) => {
  if (cond) { passed++; console.log(`PASS ${name}`); }
  else { failed++; console.log(`FAIL ${name}`); }
};

check(
  'no direct setMedications(parsed.medications) acceptance remains',
  !/setMedications\(\s*parsed\.medications\s*\)/.test(src)
);

check(
  'model-supplied medications are discarded with a logged reason',
  /discarded model-supplied medications/.test(src)
);

check(
  'scripted vitals fallback is gated on an all-scripted session',
  /dialogueTurns\.every\(t => t\.isScripted\)/.test(src) &&
  /scripted sample data, not measured/.test(src)
);

check(
  'live/mixed sessions purge scripted sample medications at draft time',
  /if \(!allTurnsScripted\) \{\s*\n\s*\/\/ Live or mixed session/.test(src) ||
  /!allTurnsScripted[\s\S]{0,200}setMedications\(\[\]\)/.test(src)
);

check(
  'live-session objective fallback states no vitals were captured',
  /No vitals or examination findings were captured in this session/.test(src)
);

console.log(`\nphase42_soap_draft_safeguards: ${passed}/${passed + failed} passed`);
process.exit(failed === 0 ? 0 : 1);
