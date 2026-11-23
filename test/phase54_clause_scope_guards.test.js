// Synthetic clause-scope guard policy tests, not new clinical gold labels.
// Exercises the clause-aware negation/question scope rules through the real
// deterministic fallback extraction, verification, demo APPROVE-all and the
// real export gate. Every release must keep a genuine semantic reason; a
// release exists only where a marker/question mark demonstrably belongs to a
// different sentence or clause than the span. No provider, no audio.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createEvidenceSession, registerUtterance, extractWithFallback } from '../src/services/clinicalEvidenceEngine.js';
import { verifyEvidence } from '../src/services/clinicalEvidenceVerifier.js';
import { applyReviewAction, selectApprovedForExport } from '../src/services/clinicalEvidencePersistence.js';

let passed = 0, failed = 0, sequence = 0;
const observations = [];
const record = async (name, fn) => {
  try { await fn(); passed++; console.log(`PASS ${name}`); }
  catch (error) { failed++; console.log(`FAIL ${name}: ${error.stack}`); }
};
const reviewer = { identity: 'synthetic-clause-scope-test', isDemo: true };

function runFallback(text, language = 'English') {
  const session = createEvidenceSession(`clause_scope_${++sequence}`);
  registerUtterance(session, { speaker: 'PATIENT', language, sourceType: 'SCRIPTED_DEMO', text });
  const extracted = extractWithFallback(session);
  assert(extracted.candidates.length > 0, `expected fallback candidates for: ${text}`);
  const { verified } = verifyEvidence(session, extracted.candidates);
  assert.equal(selectApprovedForExport(verified).length, 0, 'unreviewed records never export');
  const approved = verified.map(v => applyReviewAction(v, { type: 'APPROVE' }, reviewer, 'synthetic approve-all stress check'));
  const approvedExport = selectApprovedForExport(approved);
  observations.push({ text, candidates: verified.map(v => ({ quote: v.sourceQuote, status: v.verificationStatus,
    negated: !!v.isNegatedContext, temporalStatus: v.temporalStatus, notes: v.verificationNotes })),
    exported: approvedExport.map(e => e.sourceQuote) });
  return { verified, approvedExport };
}
const cand = (r, pattern) => r.verified.find(v => pattern.test(v.sourceQuote));
const heldFrom = (r, pattern) => {
  const v = cand(r, pattern);
  assert(v, `expected candidate matching ${pattern}`);
  assert(!r.approvedExport.some(e => pattern.test(e.sourceQuote)), `${pattern} must not export`);
  return v;
};
const exportsQuote = (r, pattern) => {
  const v = cand(r, pattern);
  assert(v, `expected candidate matching ${pattern}`);
  assert.equal(v.verificationStatus, 'SUPPORTED', `${pattern} must be source-supported`);
  assert.equal(v.isNegatedContext, undefined, `${pattern} must not carry negated context`);
  assert(r.approvedExport.some(e => pattern.test(e.sourceQuote)), `${pattern} must export after approval`);
  return v;
};

await record('cross-sentence negation holds only its own sentence', async () => {
  const r = runFallback('I have a cough. No fever.');
  const fever = heldFrom(r, /^fever$/i);
  assert.equal(fever.isNegatedContext, true);
  const cough = exportsQuote(r, /^cough$/i);
  assert(cough.verificationNotes.some(n => /outside span scope/.test(n)), 'cough records the out-of-scope marker note');
});
await record('contrastive "but" bounds backward negation scope', async () => {
  const r = runFallback('I came with a headache but without fever.');
  heldFrom(r, /^fever$/i);
  exportsQuote(r, /^headache$/i);
});
await record('Tenglish code-switch: "but" bounds post-noun denial', async () => {
  const r = runFallback('నాకు fever ఉంది but cough లేదు', 'Tenglish');
  const cough = heldFrom(r, /^cough$/i);
  assert.equal(cough.isNegatedContext, true);
  exportsQuote(r, /^fever$/i);
});
await record('affirmed clause before a separate later question exports', async () => {
  const r = runFallback('I have a fever, do you know why?');
  const fever = exportsQuote(r, /^fever$/i);
  assert(fever.verificationNotes.some(n => /later separate interrogative clause/.test(n)), 'fever records the clause-scope question note');
});
await record('whole-sentence question stays held', async () => {
  const r = runFallback('Do you have a fever, or chills?');
  const fever = heldFrom(r, /^fever$/i);
  assert.equal(fever.verificationStatus, 'AMBIGUOUS');
  assert.equal(r.approvedExport.length, 0);
});
await record('tag question stays held (fail closed)', async () => {
  const r = runFallback('You have a fever, right?');
  const fever = heldFrom(r, /^fever$/i);
  assert.equal(fever.verificationStatus, 'AMBIGUOUS');
});
await record('forward list scope across commas preserved', async () => {
  const r = runFallback('No fever, cough or cold.');
  for (const q of [/^fever$/i, /^cough$/i, /^cold$/i]) assert.equal(heldFrom(r, q).isNegatedContext, true);
  assert.equal(r.approvedExport.length, 0);
});
await record('cross-sentence medication mention exports HISTORICAL, denial held', async () => {
  const r = runFallback('No fever. I took paracetamol yesterday.');
  heldFrom(r, /^fever$/i);
  const para = exportsQuote(r, /^paracetamol$/i);
  assert.equal(para.temporalStatus, 'HISTORICAL');
  assert.equal(r.approvedExport.find(e => /paracetamol/i.test(e.sourceQuote)).temporalStatus, 'HISTORICAL');
});
for (const [text, q] of [
  ['I do not have fever.', /^fever$/i],
  ["I haven't had a cough at all.", /^cough$/i],
  ['నాకు జ్వరం లేదు.', /^జ్వరం$/]
]) await record(`denial control unchanged: ${text}`, async () => {
  const r = runFallback(text, /[జ]/.test(text) ? 'Telugu' : 'English');
  assert.equal(heldFrom(r, q).isNegatedContext, true);
});
await record('Indic post-noun denial in same clause unchanged', async () => {
  const r = runFallback('నాకు పెన్సిలిన్ అలర్జీ లేదు.', 'Telugu');
  assert.equal(r.approvedExport.filter(e => e.entityType === 'ALLERGY').length, 0);
});
await record('plain affirmation still exports', async () => {
  const r = runFallback('I have a fever.');
  exportsQuote(r, /^fever$/i);
});
await record('Indic question reaching the span stays held', async () => {
  const r = runFallback('మీకు జ్వరం ఉందా?', 'Telugu');
  const fever = heldFrom(r, /^జ్వరం$/);
  assert.equal(fever.verificationStatus, 'AMBIGUOUS');
});

if (process.env.AYUSWAR_CLAUSE_SCOPE_EVIDENCE_PATH) writeFileSync(process.env.AYUSWAR_CLAUSE_SCOPE_EVIDENCE_PATH, JSON.stringify({
  scope: 'Synthetic clause-scope policy checks through deterministic fallback extraction, actual verification, demo APPROVE-all and the real export gate. No provider, new clinical gold labels or clinical validation.',
  passed, failed, observations
}, null, 2) + '\n');
console.log(`phase54_clause_scope_guards: ${passed}/${passed + failed} passed`);
if (failed) process.exit(1);
