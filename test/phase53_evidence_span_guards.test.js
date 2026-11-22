// Synthetic source-span guard policy tests, not new clinical gold labels.
// Model replies are local stubs. Every disposition is exercised through actual
// materialization, verification, demo APPROVE/EDIT and the real export gate.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createEvidenceSession, registerUtterance, extractWithModel, extractWithFallback } from '../src/services/clinicalEvidenceEngine.js';
import { verifyEvidence } from '../src/services/clinicalEvidenceVerifier.js';
import { applyReviewAction, selectApprovedForExport } from '../src/services/clinicalEvidencePersistence.js';

let passed = 0, failed = 0, sequence = 0;
const observations = [];
const record = async (name, fn) => {
  try { await fn(); passed++; console.log(`PASS ${name}`); }
  catch (error) { failed++; console.log(`FAIL ${name}: ${error.stack}`); }
};
const reviewer = { identity: 'synthetic-span-guard-test', isDemo: true };
function reviewAndExport(verified) {
  const approved = verified.map(v => applyReviewAction(v, { type: 'APPROVE' }, reviewer, 'synthetic approve-all stress check'));
  const edited = verified.map(v => applyReviewAction(v, { type: 'EDIT', editedText: 'display-only edit' }, reviewer, 'synthetic edit stress check'));
  for (const record of [...approved, ...edited]) assert.equal(record.isRealSignOff, false);
  return { approved, edited, approvedExport: selectApprovedForExport(approved), editedExport: selectApprovedForExport(edited) };
}
async function pipeline(text, quote, { fallback = false, entityType = 'SYMPTOM', normalizedConcept = 'fever', language = 'English' } = {}) {
  const session = createEvidenceSession(`span_guard_${++sequence}`);
  const utterance = registerUtterance(session, { speaker: 'PATIENT', language, sourceType: 'SCRIPTED_DEMO', text });
  let stubCalls = 0;
  const extracted = fallback ? extractWithFallback(session) : await extractWithModel(session, async () => {
    stubCalls++;
    return JSON.stringify([{ utteranceId: utterance.utteranceId, entityType, sourceQuote: quote, normalizedConcept }]);
  }, { modelVersion: 'SIMULATED-SPAN-GUARD' });
  assert.equal(stubCalls, fallback ? 0 : 1);
  assert.equal(extracted.rejected.length, 0);
  assert(extracted.candidates.length > 0);
  for (const candidate of extracted.candidates) {
    assert(Object.isFrozen(candidate));
    assert.equal(text.slice(candidate.startOffset, candidate.endOffset), candidate.sourceQuote);
    assert.equal(candidate.extractionMethod, fallback ? 'DETERMINISTIC_FALLBACK' : 'MODEL_LIVE');
    assert.equal(candidate.isSynthetic, true);
  }
  const { verified } = verifyEvidence(session, extracted.candidates);
  assert.equal(selectApprovedForExport(verified).length, 0, 'unreviewed records never export');
  const reviewed = reviewAndExport(verified);
  observations.push({ text, requestedQuote: quote, path: fallback ? 'DETERMINISTIC_FALLBACK' : 'LOCAL_STUB_MODEL_PARSER',
    candidates: verified.map(v => ({ quote: v.sourceQuote, start: v.startOffset, end: v.endOffset, status: v.verificationStatus,
      negated: !!v.isNegatedContext, temporalStatus: v.temporalStatus, notes: v.verificationNotes })),
    approvedStatuses: reviewed.approved.map(v => v.clinicianStatus), editedStatuses: reviewed.edited.map(v => v.clinicianStatus),
    approvedExportCount: reviewed.approvedExport.length, editedExportCount: reviewed.editedExport.length });
  return { session, extracted, verified, ...reviewed };
}
const held = result => {
  assert.equal(result.approvedExport.length, 0, 'approve-all cannot bypass guard');
  assert.equal(result.editedExport.length, 0, 'display edit cannot bypass guard');
};
const ambiguous = result => {
  held(result);
  assert(result.verified.every(v => v.verificationStatus === 'AMBIGUOUS'));
};
const interiorNegated = result => {
  held(result);
  assert(result.verified.every(v => v.verificationStatus === 'SUPPORTED' && v.isNegatedContext === true));
  assert(result.verified.every(v => v.verificationNotes.some(n => /source quote/.test(n))));
};

// Reuse the independently inspected synthetic probes, without provider calls.
const deniedText = 'నాకు జ్వరం లేదు అని స్పష్టంగా చెప్పాను.';
await record('auditor interior Telugu denial stays held after APPROVE and EDIT', async () => {
  interiorNegated(await pipeline(deniedText, 'జ్వరం లేదు', { language: 'Telugu' }));
});
await record('auditor single-term Telugu denial control stays held', async () => {
  const result = await pipeline(deniedText, 'జ్వరం', { language: 'Telugu' });
  held(result); assert.equal(result.verified[0].isNegatedContext, true);
});
const questionText = 'మీకు జ్వరం ఉందా? అని డాక్టర్ అడిగారు.';
for (const quote of ['జ్వరం ఉందా?', 'జ్వరం ఉందా? అని', 'జ్వరం ఉందా']) await record(`auditor question span held: ${quote}`, async () => {
  ambiguous(await pipeline(questionText, quote, { language: 'Telugu' }));
});
const repeatedTexts = [
  'జ్వరం ఉంది అని మొదట అన్నారు, కాని తర్వాత మళ్లీ పరీక్షించినప్పుడు అసలు జ్వరం లేదు అని తేలింది.',
  'జ్వరం లేదు అని మొదట అన్నారు, కాని తర్వాత మళ్లీ పరీక్షించినప్పుడు నిజంగానే జ్వరం ఉంది అని తేలింది.'
];
for (const [i, text] of repeatedTexts.entries()) await record(`auditor repeated quote direction ${i}: no occurrence is auto-selected as settled`, async () => {
  const result = await pipeline(text, 'జ్వరం', { language: 'Telugu' });
  assert.equal(result.extracted.candidates[0].startOffset, text.indexOf('జ్వరం'), 'materializer behavior itself is unchanged');
  ambiguous(result);
  assert.match(result.verified[0].verificationNotes.join(' '), /multiple occurrences/);
});

// Marker-policy coverage, not interpretation of new clinical examples.
for (const marker of ['no', 'not', 'never', 'without', 'cannot', 'denies', "don't", 'don’t', "haven't", 'haven’t']) await record(`interior English marker policy ${marker}`, async () => {
  const quote = `${marker} fever`;
  interiorNegated(await pipeline(quote, quote));
});
for (const marker of ['లేదు', 'కాదు', 'వద్దు', 'లేదండి', 'కాదండి', 'नहीं', 'ना']) await record(`interior Indic marker policy ${marker}`, async () => {
  const quote = `fever ${marker}`;
  interiorNegated(await pipeline(quote, quote));
});
for (const word of ['another', 'notable', 'whenever']) await record(`interior English non-marker boundary ${word} unchanged`, async () => {
  const quote = `fever ${word}`;
  const result = await pipeline(quote, quote);
  assert.equal(result.verified[0].isNegatedContext, undefined);
  assert.equal(result.approvedExport.length, 1);
});
await record('interior Hindi marker substring in existing food-word fixture stays non-negated', async () => {
  const text = 'खाना खाने के बाद मुझे बुखार है';
  const result = await pipeline(text, text, { language: 'Hindi' });
  assert.equal(result.verified[0].isNegatedContext, undefined);
  assert.equal(result.approvedExport.length, 1);
});
await record('interior question mark followed by affirmative material still holds whole quote', async () => {
  const text = 'Do you have a fever? I have a cough.';
  ambiguous(await pipeline(text, text));
});
await record('overlapping identical occurrences also fail closed', async () => {
  const result = await pipeline('testest', 'test', { entityType: 'OBSERVATION', normalizedConcept: 'source-span-test' });
  ambiguous(result);
});
await record('manually supplied second exact occurrence is still ambiguous', async () => {
  const text = repeatedTexts[0];
  const result = await pipeline(text, 'జ్వరం', { language: 'Telugu' });
  const start = text.lastIndexOf('జ్వరం');
  const candidate = { ...result.extracted.candidates[0], startOffset: start, endOffset: start + 'జ్వరం'.length };
  const { verified } = verifyEvidence(result.session, [candidate]);
  assert.equal(verified[0].verificationStatus, 'AMBIGUOUS');
  held(reviewAndExport(verified));
});
await record('fallback repeated quote candidates also cannot export', async () => {
  const result = await pipeline(repeatedTexts[0], 'జ్వరం', { language: 'Telugu', fallback: true });
  assert.equal(result.verified.length, 2);
  ambiguous(result);
});
for (const fallback of [false, true]) await record(`raw non-unique substring inside another word is held: ${fallback ? 'fallback' : 'stub model'}`, async () => {
  const text = 'The feverish cold weather and coldness bother me.';
  const result = await pipeline(text, 'cold', { fallback, normalizedConcept: 'cold' });
  ambiguous(result);
});
for (const fallback of [false, true]) await record(`unique positive source and actual approval export preserved: ${fallback ? 'fallback' : 'stub model'}`, async () => {
  const text = 'I have a fever.';
  const result = await pipeline(text, 'fever', { fallback });
  const v = result.verified[0];
  assert.equal(v.verificationStatus, 'SUPPORTED');
  assert.equal(v.isNegatedContext, undefined);
  assert.equal(v.temporalStatus, 'UNKNOWN');
  assert.equal(result.approvedExport.length, 1);
  assert.equal(result.editedExport.length, 1);
  assert.equal(result.approvedExport[0].sourceContext, text);
  assert.equal(result.approvedExport[0].sourceQuote, 'fever');
  assert.equal(result.editedExport[0].sourceQuote, 'fever');
  assert.equal(result.editedExport[0].originalExtraction.sourceQuote, 'fever');
});
for (const [text, quote] of [
  ['I took ibuprofen last week.', 'ibuprofen'],
  ['I stopped taking metformin last month.', 'metformin'],
  ['I used to take cetirizine every morning.', 'cetirizine']
]) await record(`legacy outer-context historical cue retained: ${quote}`, async () => {
  const result = await pipeline(text, quote, { entityType: 'MEDICATION_MENTIONED', normalizedConcept: quote });
  assert.equal(result.verified[0].temporalStatus, 'HISTORICAL');
  assert.equal(result.approvedExport[0].temporalStatus, 'HISTORICAL');
});
await record('new interior scan does not extend legacy temporal window into quote', async () => {
  const text = 'I used to take cetirizine every morning.';
  const result = await pipeline(text, text, { entityType: 'MEDICATION_MENTIONED', normalizedConcept: 'cetirizine' });
  assert.equal(result.verified[0].temporalStatus, 'UNKNOWN');
  assert.equal(result.approvedExport[0].temporalStatus, 'UNKNOWN');
});
await record('interior denial hold does not classify interior temporal cues', async () => {
  const text = 'I never took metformin yesterday.';
  const result = await pipeline(text, text, { entityType: 'MEDICATION_MENTIONED', normalizedConcept: 'metformin' });
  interiorNegated(result);
  assert.equal(result.verified[0].temporalStatus, 'UNKNOWN');
});
await record('invalid offsets still fail before newly added holds', async () => {
  const result = await pipeline(repeatedTexts[0], 'జ్వరం', { language: 'Telugu' });
  const candidate = { ...result.extracted.candidates[0], startOffset: 1, endOffset: 2 };
  const { verified } = verifyEvidence(result.session, [candidate]);
  assert.equal(verified[0].verificationStatus, 'INVALID_SOURCE');
  held(reviewAndExport(verified));
});

if (process.env.AYUSWAR_SPAN_GUARD_EVIDENCE_PATH) writeFileSync(process.env.AYUSWAR_SPAN_GUARD_EVIDENCE_PATH, JSON.stringify({
  scope: 'Synthetic software marker/source-span policy checks through local model stub or deterministic fallback, actual verification, demo APPROVE/EDIT and export. No provider, new clinical gold labels or clinical validation.',
  passed, failed, observations
}, null, 2) + '\n');
console.log(`phase53_evidence_span_guards: ${passed}/${passed + failed} passed`);
if (failed) process.exit(1);
