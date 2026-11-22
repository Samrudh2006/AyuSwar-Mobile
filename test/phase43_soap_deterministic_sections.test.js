/**
 * Phase 43: Deterministic SOAP sections (adversarial behavior tests)
 * services/soapDraftSafeguards.js
 */
import {
  deterministicObjective, conservativeAssessmentPlan, spokenVitalPairs,
  SAFE_ASSESSMENT, SAFE_PLAN
} from '../src/services/soapDraftSafeguards.js';

let passed = 0, failed = 0;
const check = (name, cond) => {
  if (cond) { passed++; console.log(`PASS ${name}`); }
  else { failed++; console.log(`FAIL ${name}`); }
};
const FALLBACK = 'No vitals or examination findings were captured in this session.';

// 1. Transcript BP pair is carried, labelled spoken-not-measured
{
  const obj = deterministicObjective('నేను BP చెప్పాను 120/80 అని', FALLBACK);
  check('transcript vital pair appears in objective, labelled not measured',
    obj.includes('BP 120/80') && /NOT measured/.test(obj));
}

// 2. Keyword + unrelated shaped number must NOT substantiate a vital
{
  const transcript = 'patient mentioned BP once, and is 95% sure it was last week';
  check('keyword co-occurrence with unrelated % number yields no SpO2',
    spokenVitalPairs(transcript).every(v => v.type !== 'SpO2'));
  const obj = deterministicObjective(transcript, FALLBACK);
  check('no invented SpO2 from unrelated percent', !obj.includes('SpO2'));
}

// 3. Model-written objective text is never consulted
{
  const obj = deterministicObjective('', FALLBACK);
  check('empty transcript yields exactly the fallback', obj === FALLBACK);
  const obj2 = deterministicObjective('fever for 3 days', FALLBACK);
  check('duration numbers never become vitals', obj2 === FALLBACK);
}

// 4. Assessment/plan are always the fixed safe strings, regardless of any
//    adversarial model content (disclaimer + appended directive)
{
  const { assessment, plan } = conservativeAssessmentPlan();
  check('assessment fixed', assessment === SAFE_ASSESSMENT);
  check('plan fixed', plan === SAFE_PLAN);
  check('assessment contains no drug directive', !/mg|tablet|prescribe|take /i.test(assessment));
  check('plan contains no drug directive', !/mg|tablet|prescribe|take /i.test(plan));
}

// 5. SpO2 and HR pairs from real phrasing
{
  const pairs = spokenVitalPairs('SpO2 98% and heart rate 72 bpm today');
  check('SpO2 and HR pairs extracted', pairs.some(v => v.label === 'SpO2 98%') && pairs.some(v => v.label === 'HR 72 bpm'));
}

console.log(`\nphase43_soap_deterministic_sections: ${passed}/${passed + failed} passed`);
process.exit(failed === 0 ? 0 : 1);
