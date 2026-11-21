import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assessOcrLegibility } from '../src/services/prescriptionOcrParsing.js';

console.log('--- RUNNING PHASE: OCR LEGIBILITY GATE ---');

const view = readFileSync(resolve('src/views/PrescriptionScannerView.jsx'), 'utf8');

// Measured fixture outputs from the bundled engine (tessdata_fast, eng):
// - foil blister photos produced these token strings at mean confidence 23-29
// - a clean rendered label read at confidence 94
const GARBAGE_PANTOPRAZOLE = 'a oo re ohid if 4 _—_— <a Be ~~ _ i > ~ me ES ® a” . t i sok. —6€ Sada <—— ah! nF WS = : Re Sa Gy p , ~~ ae ae';
const GARBAGE_SPARSE = '7: _— ae a aj H pe ~<a . ies 20s';
const CLEAN_LABEL = 'PANTOPRAZOLE 40 mg Gastro-resistant Tablets';

// 1. Measured garbage outputs are rejected
{
  const g1 = assessOcrLegibility(GARBAGE_PANTOPRAZOLE, 23);
  assert.strictEqual(g1.legible, false, 'measured foil-strip garbage must be rejected');
  assert.ok(g1.reasons.includes('low-confidence'), 'garbage sample must report low-confidence');
  const g2 = assessOcrLegibility(GARBAGE_SPARSE, 24);
  assert.strictEqual(g2.legible, false, 'measured sparse garbage must be rejected');
  assert.strictEqual(assessOcrLegibility('~~ <—— ~', 88).legible, false, 'symbol-soup must be rejected even at high confidence');
  assert.strictEqual(assessOcrLegibility('ab', 90).legible, false, 'two characters must be rejected as too short');
  assert.strictEqual(assessOcrLegibility('', 10).legible, false, 'empty text must be rejected');
  console.log('✓ Test 1 Passed: measured garbage OCR outputs are rejected by the legibility gate.');
}

// 2. Real readable text still passes
{
  const clean = assessOcrLegibility(CLEAN_LABEL, 94);
  assert.strictEqual(clean.legible, true, 'clean label text at high confidence must pass');
  const midConf = assessOcrLegibility('Pantocid 40mg Enteric-Coated Tablets', 58);
  assert.strictEqual(midConf.legible, true, 'partially noisy but readable text above the bars must pass');
  console.log('✓ Test 2 Passed: readable OCR output passes the gate.');
}

// 3. View wiring: gate runs before the formulary matcher and result card
{
  assert.ok(view.includes('assessOcrLegibility(rawText, ocrConfidence)'), 'view must run the legibility gate on raw OCR text');
  const gateIdx = view.indexOf('assessOcrLegibility(rawText, ocrConfidence)');
  const matchIdx = view.indexOf('matchDrugFromOcrText(rawText)');
  assert.ok(gateIdx > -1 && matchIdx > -1 && gateIdx < matchIdx, 'legibility gate must run before formulary matching');
  assert.ok(view.includes('No medicine details were inferred'), 'rejected scans must state that nothing was inferred');
  assert.ok(view.includes("setOcrPhase('empty-error')"), 'rejected scans must reuse the honest retry state, not the success state');
  console.log('✓ Test 3 Passed: gate is wired before matching and routes to the honest retry state.');
}

// 4. No unrelated medicine photo may backfill an unmatched scan
{
  const fallbackBranch = view.slice(view.indexOf('// Fallback with raw extracted text'));
  assert.ok(!fallbackBranch.includes("silver_amoxicillin_blister.jpg"), 'unmatched scans must not fall back to an unrelated medicine image');
  assert.ok(view.includes('never substitute an unrelated medicine photo'), 'fallback must carry the explicit no-substitution note');
  console.log('✓ Test 4 Passed: unmatched scans no longer display an unrelated medicine photo.');
}
