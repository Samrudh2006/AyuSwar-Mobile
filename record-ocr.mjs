import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: '/tmp/scan-video2', size: { width: 390, height: 844 } } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4173/scanner', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);
  const fileInput = p.locator('input[type="file"]').first();
  await fileInput.setInputFiles('/tmp/ayuswar-mobile-review/public/images/medicines/yellow_pantoprazole.jpg');
  const prog = p.locator('text=/Extracting text/').first();
  await prog.waitFor({ timeout: 20000 });
  await prog.scrollIntoViewIfNeeded();
  console.log('progress in view');
  // poll the % value while pending
  const t0 = Date.now();
  let lastPct = '';
  while (Date.now() - t0 < 95000) {
    const scanning = await p.locator('text=/Processing In-Browser OCR|Extracting text/').count();
    if (scanning === 0) break;
    const m = await p.locator('text=/Extracting text/').first().innerText().catch(() => '');
    if (m !== lastPct) { console.log('progress:', m.replace(/\n/g, ' ')); lastPct = m; }
    await p.waitForTimeout(800);
  }
  console.log('pending ended after', Math.round((Date.now() - t0) / 1000) + 's');
  await p.waitForTimeout(1200);
  const tokens = await p.locator('text=/Tesseract.js Extracted Text Tokens/').count();
  const tokenBox = await p.locator('text=/Live OCR Extracted|Extracted Text:/').count();
  console.log('result tokens section:', tokens, '| extracted brand/text:', tokenBox);
  await p.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /Tesseract.js Extracted Text Tokens/.test(e.textContent)); if (el) el.scrollIntoView({ block: 'center' }); });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: '/tmp/ocr-result2.png' });
  await ctx.close();
  await b.close();
})();
