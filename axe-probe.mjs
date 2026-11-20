import { chromium } from 'playwright';
import fs from 'node:fs';
const axeSrc = fs.readFileSync('./node_modules/axe-core/axe.min.js', 'utf8');
const routes = ['/', '/scanner', '/patient-portal', '/clinical-console/full', '/appointment-ticket'];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const route of routes) {
  const p = await (await b.newContext({ viewport:{width:390,height:844} })).newPage();
  await p.goto('http://localhost:4173' + route, { waitUntil:'domcontentloaded' });
  await p.waitForTimeout(3500);
  const res = await p.evaluate(async (src) => {
    eval(src);
    return await axe.run(document, { resultTypes: ['violations'] });
  }, axeSrc);
  const counts = {};
  for (const v of res.violations) counts[v.impact] = (counts[v.impact]||0)+1;
  console.log(route, JSON.stringify(counts), res.violations.slice(0,3).map(v=>v.id).join(','));
  await p.close();
}
await b.close();
