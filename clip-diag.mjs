import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:4173/clinical-console/full', { waitUntil: 'networkidle', timeout: 60000 });
const res = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.right <= vw + 1 || r.width <= 40) continue;
    // find nearest ancestor with overflow-x hidden/clip or auto/scroll
    let a = el.parentElement, mode = 'none';
    while (a) {
      const ox = getComputedStyle(a).overflowX;
      if (ox === 'auto' || ox === 'scroll') { mode = 'scrollable'; break; }
      if (ox === 'hidden' || ox === 'clip') { mode = 'CLIPPED'; break; }
      a = a.parentElement;
    }
    if (mode !== 'scrollable') {
      const kidsEscape = [...el.children].some(c => c.getBoundingClientRect().right > vw + 1);
      if (!kidsEscape) out.push({ mode, tag: el.tagName, right: Math.round(r.right), text: (el.textContent || '').trim().slice(0, 45) });
    }
  }
  return out.slice(0, 10);
});
console.log('CLIPPED(non-scrollable) offenders:', JSON.stringify(res, null, 1));
// OCR text region capture
await page.goto('http://localhost:4173/scanner', { waitUntil: 'networkidle', timeout: 60000 });
const input = await page.$('input[type="file"]');
await input.setInputFiles('/downloads/image-a1fea364.jpg');
await page.waitForFunction(() => document.body.innerText.includes('LIVE WASM EXTRACTION'), undefined, { timeout: 120000 });
const region = await page.evaluate(() => {
  const els = [...document.querySelectorAll('*')].filter(e => e.children.length < 3 && e.textContent.includes('LIVE WASM EXTRACTION'));
  if (!els.length) return null;
  const box = els[els.length - 1].getBoundingClientRect();
  window.scrollTo(0, box.top + window.scrollY - 40);
  return true;
});
await page.waitForTimeout(600);
await page.screenshot({ path: '/downloads/scanner-2-octext-top.png' });
await page.evaluate(() => window.scrollBy(0, 500));
await page.waitForTimeout(300);
await page.screenshot({ path: '/downloads/scanner-3-octext-mid.png' });
console.log('ocr region captured:', region);
await b.close();
