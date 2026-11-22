/**
 * Phase 44: Spoken-vital context safety (adversarial behavior tests)
 * services/soapDraftSafeguards.js — negated, hypothetical, questioned and
 * historical mentions must never surface as current objective-row vitals;
 * device-keyword ambiguity fails closed.
 */
import { readFileSync } from 'node:fs';
import {
  deterministicObjective, spokenVitalPairs, SUBJECTIVE_NOT_VERIFIED_LABEL,
  subjectiveBoundaryLabel, turnsHaveRecordedAudio
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
check('Telugu post-value conditional excluded', spokenVitalPairs('బీపీ 120/80 అయితే డాక్టర్‌కు చెప్పండి').length === 0);
check('Telugu post-value ఉంటే conditional excluded', spokenVitalPairs('బీపీ 160/100 ఉంటే వెంటనే రండి').length === 0);

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
  const current = spokenVitalPairs('బీపీ 120/80 ఉంది, డాక్టర్ చూశారు');
  check('Telugu current mention without conditional still kept', current.some(v => v.label === 'BP 120/80' && v.scope === 'current'));
}

// 7. Subjective boundary: explicit label exists and the console renders it
check('subjective-not-verified label exported',
  typeof SUBJECTIVE_NOT_VERIFIED_LABEL === 'string' && /NOT verified against source evidence/.test(SUBJECTIVE_NOT_VERIFIED_LABEL));
{
  const consoleSource = readFileSync(new URL('../src/components/ClinicalConsole.jsx', import.meta.url), 'utf8');
  check('console renders subjective-not-verified boundary', consoleSource.includes('subjectiveBoundaryLabel'));
  const mobileSource = readFileSync(new URL('../src/mobile/MScribeFlow.jsx', import.meta.url), 'utf8');
  check('mobile review renders subjective-not-verified boundary', mobileSource.includes('subjectiveBoundaryLabel'));
}

// 8. Source-aware label: no false provenance claims
{
  const modelRec = subjectiveBoundaryLabel({ modelWritten: true, hasRecording: true });
  check('model+recording label says model-written and recording',
    /Model-written draft/.test(modelRec) && /against the recording/.test(modelRec));
  const modelText = subjectiveBoundaryLabel({ modelWritten: true, hasRecording: false });
  check('model+no-recording label says model-written and source transcript',
    /Model-written draft/.test(modelText) && /against the source transcript/.test(modelText));
  const manualRec = subjectiveBoundaryLabel({ modelWritten: false, hasRecording: true });
  check('manual+recording label drops model-written claim',
    !/Model-written/.test(manualRec) && /NOT verified against source evidence/.test(manualRec) && /against the recording/.test(manualRec));
  const manualText = subjectiveBoundaryLabel({ modelWritten: false, hasRecording: false });
  check('manual+no-recording label is neutral and transcript-scoped',
    !/Model-written/.test(manualText) && !/against the recording/.test(manualText) && /against the source transcript/.test(manualText));
}

// 9. Audio provenance predicate: only real mic pipelines count (fail-closed)
{
  check('typed-only turns do not count as a recording',
    turnsHaveRecordedAudio([{ speaker: 'Doctor', text: 'typed note', isTyped: true }]) === false);
  check('unflagged turns do not count as a recording',
    turnsHaveRecordedAudio([{ speaker: 'Doctor', text: 'custom' }]) === false);
  check('scripted sample turns do not count as a recording',
    turnsHaveRecordedAudio([{ speaker: 'Doctor', text: 'sample', isScripted: true }]) === false);
  check('WebSpeech mic turns count as a recording',
    turnsHaveRecordedAudio([{ speaker: 'Doctor (Live Mic)', text: 'mic', isWebSpeech: true }]) === true);
  check('Groq Whisper mic turns count as a recording',
    turnsHaveRecordedAudio([{ speaker: 'Patient (Live Mic)', text: 'mic', isGroqWhisper: true }]) === true);
  check('mixed typed+mic turns count as a recording',
    turnsHaveRecordedAudio([{ isTyped: true }, { isWebSpeech: true }]) === true);
  check('empty/invalid input fails closed',
    turnsHaveRecordedAudio([]) === false && turnsHaveRecordedAudio(null) === false);
}

// 10. Call-site wiring: each surface passes its real provenance signals
{
  const mobileSource = readFileSync(new URL('../src/mobile/MScribeFlow.jsx', import.meta.url), 'utf8');
  check('mobile wires aiLive as modelWritten and mic-recording as hasRecording',
    mobileSource.includes('modelWritten: aiLive') && mobileSource.includes("state.sourceMode === 'mic'"));
  const consoleSource = readFileSync(new URL('../src/components/ClinicalConsole.jsx', import.meta.url), 'utf8');
  check('console wires subjectiveFromModel and non-scripted turns as provenance',
    consoleSource.includes('modelWritten: subjectiveFromModel') && consoleSource.includes('setSubjectiveFromModel(true)'));
  check('console uses the audio-provenance predicate, not !isScripted',
    consoleSource.includes('hasRecording: turnsHaveRecordedAudio(dialogueTurns)') && !/some\(t => !t\.isScripted\)/.test(consoleSource));
}

console.log(`\nphase44_soap_objective_contexts: ${passed}/${passed + failed} passed`);
process.exit(failed === 0 ? 0 : 1);
