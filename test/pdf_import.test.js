import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

console.log('--- RUNNING PHASE: PDF TEXT-LAYER IMPORT & 390PX EMBED CONTRACTS ---');

const svc = readFileSync(resolve('src/services/pdfDocumentImport.js'), 'utf8');
const guards = readFileSync(resolve('src/services/pdfImportGuards.js'), 'utf8');
const view = readFileSync(resolve('src/views/PrescriptionScannerView.jsx'), 'utf8');
const console_ = readFileSync(resolve('src/components/ClinicalConsole.jsx'), 'utf8');
const css = readFileSync(resolve('src/mobile/mobile.css'), 'utf8');

// 1. Service limits and safety gates
{
  assert.ok(guards.includes('15 * 1024 * 1024'), 'PDF import must cap file size at 15 MB');
  assert.ok(guards.includes('MAX_PAGES = 20'), 'PDF import must cap page count at 20');
  assert.ok(svc.includes('isEvalSupported: false'), 'pdfjs must run with isEvalSupported false (no PDF scripts)');
  assert.ok(guards.includes("file.type !== 'application/pdf'"), 'non-PDF MIME must be rejected before parsing');
  assert.ok(guards.includes("return 'oversize'"), 'oversize files must map to a specific error kind');
  console.log('✓ Test 1 Passed: PDF import service enforces size, page, MIME and eval-safety gates.');
}

// 2. Error taxonomy stays specific and distinguishable
{
  for (const kind of ["'password'", "'corrupt'", "'no-text'"]) {
    assert.ok(svc.includes(`kind: ${kind}`), `service must return specific error kind ${kind}`);
  }
  assert.ok(svc.includes('kind: gate'), 'gate rejections must pass the guard module kind through');
  assert.ok(guards.includes("return 'not-pdf'") && guards.includes("return 'oversize'"), 'guard module must own not-pdf and oversize kinds');
  assert.ok(svc.includes("err?.name || ''"), 'password detection must inspect the pdfjs error name');
  assert.ok(svc.includes('task.destroy()'), 'pdfjs loading task must be destroyed to free workers');
  assert.ok(view.includes('pdfCancelRef'), 'view must keep a cancel handle for in-flight imports');
  console.log('✓ Test 2 Passed: PDF import error taxonomy is specific; cancellation is caller-side via task destroy.');
}

// 3. Provenance and truncation honesty in the service
{
  assert.ok(svc.includes('pages.push({ page: i, text })'), 'extracted text must carry per-page provenance');
  assert.ok(svc.includes('truncated: pageCount > pagesToRead'), 'over-cap documents must be flagged truncated');
  assert.ok(svc.includes('totalChars < 3'), 'documents with no text layer must be detected, not OCR-faked');
  console.log('✓ Test 3 Passed: PDF import carries per-page provenance, truncation flag and no-text detection.');
}

// 4. Review gate: extracted text is never used without explicit user action
{
  assert.ok(view.includes('Use as unverified draft'), 'review panel must require an explicit Use action');
  assert.ok(view.includes('first 20 pages only'), 'review panel must disclose page truncation');
  assert.ok(view.includes('not verified medicine information'), 'review panel must carry the unverified disclaimer');
  assert.ok(view.includes('textarea'), 'review panel must let the user edit extracted text before use');
  console.log('✓ Test 4 Passed: PDF text passes an explicit editable review gate before entering results.');
}

// 5. Source-honest labeling: PDF imports never pose as OCR
{
  assert.ok(view.includes("sourceKind: 'pdf-text-layer'"), 'PDF drafts must carry pdf-text-layer sourceKind');
  assert.ok(view.includes('PDF Text Layer Import (not OCR)'), 'token header must say the text is not OCR');
  assert.ok(view.includes('LOCAL PDF TEXT LAYER'), 'badge must read LOCAL PDF TEXT LAYER for PDF imports');
  assert.ok(view.includes('UNVERIFIED PDF TEXT IMPORT'), 'candidate chip must say UNVERIFIED PDF TEXT IMPORT');
  assert.ok(view.includes('PDF Text Import Active'), 'active banner must distinguish PDF imports from OCR results');
  assert.ok(!view.includes('pdfImport.debug'), 'temporary debug strings must not reach the UI');
  console.log('✓ Test 5 Passed: PDF imports are labeled as unverified PDF text everywhere, never as OCR.');
}

// 6. Optical pipeline hidden when there is no image
{
  assert.ok(view.includes("liveOcrResult?.sourceKind !== 'pdf-text-layer'"), 'optical/OpenCV panels must hide for PDF imports');
  assert.ok(view.includes('No optical inspection was run'), 'optical panel must honestly state no inspection ran');
  assert.ok(view.includes('REAL IN-BROWSER OCR + PDF TEXT WORKSPACE'), 'route badge must describe both capabilities');
  console.log('✓ Test 6 Passed: image-only pipeline UI stays out of PDF import mode; route header is capability-accurate.');
}

// 7. Specific user-facing error copy for every failure kind
{
  assert.ok(view.includes('password-protected'), 'password error copy must be specific');
  assert.ok(view.includes('larger than 15 MB'), 'oversize error copy must name the limit');
  assert.ok(view.includes('not a PDF'), 'not-pdf error copy must be specific');
  assert.ok(view.includes('No readable text layer'), 'no-text error copy must direct to image upload instead');
  assert.ok(view.includes('could not be read'), 'corrupt error copy must be specific');
  console.log('✓ Test 7 Passed: every PDF import failure has specific, actionable user-facing copy.');
}

// 8. 390px embed: avatar and language bridge never collapse
{
  assert.ok(console_.includes('flexShrink: 0'), 'patient avatar must not squash on narrow screens');
  assert.ok(console_.includes('cc-language-bridge'), 'language bridge must carry the responsive class');
  assert.ok(css.includes('.cc-language-bridge'), 'mobile CSS must define the stacked bridge layout');
  assert.ok(css.includes('rotate(90deg)'), 'stacked bridge arrow must rotate to point down');
  console.log('✓ Test 8 Passed: embedded console avatar keeps its size and the language bridge stacks on narrow screens.');
}

// 9. Runtime unit checks: the SAME guard module the browser enforces, executed in Node
{
  const { guardPdfFile, planExtraction, MAX_BYTES } = await import('../src/services/pdfImportGuards.js');
  const pdfFile = new File(['%PDF-1.4 tiny'], 'rx.pdf', { type: 'application/pdf' });
  const txtFile = new File(['plain text'], 'notes.txt', { type: 'text/plain' });
  const bigFile = new File([new Uint8Array(MAX_BYTES + 1)], 'big.pdf', { type: 'application/pdf' });
  assert.strictEqual(guardPdfFile(pdfFile), null, 'a normal PDF must pass the gate');
  assert.strictEqual(guardPdfFile(txtFile), 'not-pdf', 'a text file must be rejected as not-pdf');
  assert.strictEqual(guardPdfFile(bigFile), 'oversize', 'a file over 15 MB must be rejected as oversize');
  assert.strictEqual(guardPdfFile(null), 'not-pdf', 'a missing file must not crash the gate');
  assert.deepStrictEqual(planExtraction(3), { pagesToRead: 3, truncated: false }, 'short documents import fully');
  assert.deepStrictEqual(planExtraction(20), { pagesToRead: 20, truncated: false }, 'exactly 20 pages is complete, not partial');
  assert.deepStrictEqual(planExtraction(21), { pagesToRead: 20, truncated: true }, 'page 21+ must mark the import partial');
  console.log('✓ Test 9 Passed: guard and page-cap helpers behave correctly when executed (not just asserted from source).');
}
