import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('http://localhost:4173/clinical-console/full', { waitUntil: 'networkidle', timeout: 60000 });
const res = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  const offenders = [];
  if (sw > vw) {
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && r.width > 40) {
        const kidsOverflow = [...el.children].some(c => c.getBoundingClientRect().right > vw + 1);
        if (!kidsOverflow) offenders.push({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 40), right: Math.round(r.right), text: (el.textContent || '').trim().slice(0, 50) });
      }
    }
  }
  return { vw, sw, offenders: offenders.slice(0, 12) };
});
console.log(JSON.stringify(res, null, 1));
await b.close();
