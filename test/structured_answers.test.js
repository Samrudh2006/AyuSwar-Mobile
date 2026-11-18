/**
 * Structured assistant answers: deterministic intent mapper contract.
 * Verifies allowlisted block types, grounded data, route allowlist, safe fallbacks.
 */
import assert from 'node:assert';
import { mapQueryToStructuredAnswer } from '../src/services/structuredAnswerService.js';

const ALLOWED_TYPES = new Set(['card', 'steps', 'tabs', 'note', 'action']);
const ALLOWED_ROUTES = new Set([
  '/sanjivani', '/emergency', '/emergency/handover', '/scanner', '/audio-rx',
  '/acoustic-lab', '/clinical-console', '/doctor-portal', '/patient-portal', '/solutions'
]);

function assertBlocksValid(result, label) {
  assert.ok(result && Array.isArray(result.blocks) && result.blocks.length > 0, `${label}: expected blocks`);
  assert.ok(typeof result.summary === 'string' && result.summary.length > 0, `${label}: summary text required`);
  for (const b of result.blocks) {
    assert.ok(ALLOWED_TYPES.has(b.type), `${label}: block type ${b.type} not allowlisted`);
    if (b.type === 'action') assert.ok(ALLOWED_ROUTES.has(b.route), `${label}: route ${b.route} not allowlisted`);
  }
}

// Emergency intent -> steps + Sanjivani action + simulation note
const em = mapQueryToStructuredAnswer('my father had a heart attack what do I do');
assertBlocksValid(em, 'emergency');
assert.ok(em.blocks.some(b => b.type === 'action' && b.route === '/sanjivani'), 'emergency must link Sanjivani');
assert.ok(em.blocks.some(b => b.type === 'note' && /simulation/i.test(b.body)), 'emergency must carry simulation note');

// Medicine intent -> formulary card with real PMBJP data + nonclinical note
const med = mapQueryToStructuredAnswer('price of telmisartan tablet');
assertBlocksValid(med, 'medicine');
const medCard = med.blocks.find(b => b.type === 'card');
assert.ok(/telmisartan/i.test(medCard.title), 'medicine card should name matched generic');
assert.ok(med.blocks.some(b => b.type === 'note' && /not medical advice/i.test(b.body)), 'medicine must carry nonclinical note');

// Vernacular symptom -> concept card + consult-doctor note
const vern = mapQueryToStructuredAnswer('నాకు ఆయాసం గా ఉంది');
assertBlocksValid(vern, 'vernacular');
assert.ok(vern.blocks.some(b => b.type === 'note' && /not a diagnosis/i.test(b.body)), 'vernacular must carry not-a-diagnosis note');

// Portal intent -> tabs + portal action
const portal = mapQueryToStructuredAnswer('where is my appointment');
assertBlocksValid(portal, 'portal');

// Out-of-scope query -> null (plain text answer path preserved)
assert.strictEqual(mapQueryToStructuredAnswer('what is the weather today'), null, 'unmatched query must fall back to text');
assert.strictEqual(mapQueryToStructuredAnswer(''), null, 'empty query must return null');

console.log('structured_answers: 5 contract groups OK');
