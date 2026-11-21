import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.goto('http://localhost:4173/scanner', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  await p.locator('text=/Preprocessing on/').first().click(); // CV off, time-boxed probe
  await p.locator('input[type="file"]').first().setInputFiles('/tmp/pantoprazole_512.jpg');
  const t0 = Date.now();
  let outcome = 'timeout';
  while (Date.now() - t0 < 60000) {
    if (await p.locator('text=/No readable result/').count()) { outcome = 'terminal-heading'; break; }
    await p.waitForTimeout(600);
  }
  console.log('empty path terminal:', outcome, Math.round((Date.now() - t0) / 1000) + 's');
  await p.waitForTimeout(800);
  const checks = {
    processingLabel: await p.locator('text=/Processing In-Browser OCR/').count(),
    rerunLabel: await p.locator('text=/Re-run OCR Extraction on Upload/').count(),
    readingHeading: await p.locator('text=/^Reading image on your device$/').count(),
    retryBtn: await p.locator('text=/Retry with Clearer Image/').count(),
  };
  console.log(JSON.stringify(checks));
  await p.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /No readable result/.test(e.textContent)); if (el) el.scrollIntoView({ block: 'center' }); });
  await p.waitForTimeout(900);
  await p.screenshot({ path: '/tmp/ocr-terminal-fixed.png' });
  await b.close();
})();
