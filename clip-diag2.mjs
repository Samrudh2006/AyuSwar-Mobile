import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:4173/clinical-console/full', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
const res = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.right <= vw + 1 || r.width <= 40) continue;
    let a = el.parentElement, mode = 'none';
    while (a) {
      const ox = getComputedStyle(a).overflowX;
      if (ox === 'auto' || ox === 'scroll') { mode = 'scrollable'; break; }
      if (ox === 'hidden' || ox === 'clip') { mode = 'CLIPPED'; break; }
      a = a.parentElement;
    }
    if (mode !== 'scrollable') {
      const kidsEscape = [...el.children].some(c => c.getBoundingClientRect().right > vw + 1);
      if (!kidsEscape) out.push({ mode, tag: el.tagName, cls: (el.className||'').toString().slice(0,40), right: Math.round(r.right), text: (el.textContent || '').trim().slice(0, 45) });
    }
  }
  return out.slice(0, 10);
});
console.log(JSON.stringify(res, null, 1));
await b.close();
