import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
page.on('console', m => { if (/error/i.test(m.type())) console.log('CONSOLE-ERR', m.text().slice(0, 140)); });
await page.goto('http://localhost:4173/scanner', { waitUntil: 'networkidle', timeout: 60000 });
await page.screenshot({ path: '/downloads/scanner-0-landing.png' });
const input = await page.$('input[type="file"]');
if (!input) { console.log('NO FILE INPUT'); await b.close(); process.exit(1); }
await input.setInputFiles('/downloads/image-a1fea364.jpg');
console.log('image uploaded; waiting for on-device OCR (WASM, may take a while on first load)');
const t0 = Date.now();
// poll status text until success/failure/empty state, cap 150s
let final = null;
for (let i = 0; i < 75; i++) {
  await page.waitForTimeout(2000);
  const state = await page.evaluate(() => {
    const txt = document.body.innerText;
    return {
      hasResult: /Extracted|Recognized|Candidate|No medicine|No.*found|failed|Failed|empty/i.test(txt),
      snippet: txt.slice(0, 600)
    };
  });
  if (state.hasResult) { final = state; break; }
}
console.log('elapsed=' + Math.round((Date.now() - t0) / 1000) + 's');
const full = await page.evaluate(() => document.body.innerText);
console.log('===PAGE TEXT===');
console.log(full.slice(0, 2200));
await page.screenshot({ path: '/downloads/scanner-1-result.png', fullPage: false });
await b.close();
console.log('done');
