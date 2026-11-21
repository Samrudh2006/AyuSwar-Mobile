import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
p.on('dialog', d => d.accept());
await p.addInitScript(() => localStorage.setItem('ayuswar_selected_language', 'te-IN'));
for (const tab of ['appointments', 'settings']) {
  await p.goto(`http://localhost:4173/patient-portal?tab=${tab}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.screenshot({ path: `/tmp/te-${tab}-1.png` });
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await p.waitForTimeout(400);
  await p.screenshot({ path: `/tmp/te-${tab}-2.png` });
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(400);
  await p.screenshot({ path: `/tmp/te-${tab}-3.png` });
}
await ctx.close(); await b.close();
console.log('done');
