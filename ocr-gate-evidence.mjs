import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.goto('http://localhost:4173/scanner', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  await p.locator('text=/Preprocessing on/').first().click(); // CV off for time-boxed probe passes
  // Probe A: foil fixture (512px) -> must terminate in the honest rejection state
  await p.locator('input[type="file"]').first().setInputFiles('/tmp/pantoprazole_512.jpg');
  const t0 = Date.now();
  let a = 'timeout';
  while (Date.now() - t0 < 60000) {
    if (await p.locator('text=/Could not read this image reliably/').count()) { a = 'gate-rejection'; break; }
    if (await p.locator('text=/No legible text found/').count()) { a = 'empty-rejection'; break; }
    if (await p.locator('text=/Live OCR Extracted|Extracted Text:/').count()) { a = 'FAIL:candidate-card'; break; }
    await p.waitForTimeout(800);
  }
  console.log('A foil:', a, Math.round((Date.now() - t0) / 1000) + 's');
  await p.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /Could not read this image reliably|No legible text found/.test(e.textContent)); if (el) el.scrollIntoView({ block: 'center' }); });
  await p.waitForTimeout(900);
  await p.screenshot({ path: '/tmp/ocr-gate-rejection.png' });
  // Probe B: readable control label -> must reach the extraction card
  await p.locator('input[type="file"]').first().setInputFiles('/tmp/control_label.png');
  const t1 = Date.now();
  let c = 'timeout';
  while (Date.now() - t1 < 60000) {
    if (await p.locator('text=/Live OCR Extracted|Extracted Text:/').count()) { c = 'candidate-card'; break; }
    if (await p.locator('text=/Could not read this image reliably|No legible text found/').count()) { c = 'FAIL:rejected'; break; }
    await p.waitForTimeout(800);
  }
  console.log('B control:', c, Math.round((Date.now() - t1) / 1000) + 's');
  await p.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /Live OCR Extracted|Extracted Text:/.test(e.textContent)); if (el) el.scrollIntoView({ block: 'center' }); });
  await p.waitForTimeout(900);
  await p.screenshot({ path: '/tmp/ocr-control-pass.png' });
  await b.close();
})();
