import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:4173/clinical-console/full', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);
const res = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const wide = [];
  for (const el of document.querySelectorAll('div,section,main,header')) {
    const r = el.getBoundingClientRect();
    if (r.width > vw + 1) {
      const cs = getComputedStyle(el);
      wide.push({ w: Math.round(r.width), cls: (el.className||'').toString().slice(0,50), disp: cs.display, minW: cs.minWidth, wStyle: el.style.width || '', minWStyle: el.style.minWidth || '', text: (el.textContent||'').trim().slice(0,30) });
    }
  }
  wide.sort((a,b)=>b.w-a.w);
  return wide.slice(0,8);
});
console.log(JSON.stringify(res, null, 1));
await b.close();
