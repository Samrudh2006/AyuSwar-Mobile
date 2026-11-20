import { chromium } from 'playwright';
import fs from 'node:fs';
const axeSrc = fs.readFileSync('./node_modules/axe-core/axe.min.js', 'utf8');
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const route of ['/clinical-console/full', '/scanner']) {
  const p = await (await b.newContext({ viewport:{width:390,height:844} })).newPage();
  await p.goto('http://localhost:4173' + route, { waitUntil:'domcontentloaded' });
  await p.waitForTimeout(3500);
  const res = await p.evaluate(async (src) => { eval(src); return await axe.run(document, { resultTypes:['violations'] }); }, axeSrc);
  for (const v of res.violations) {
    console.log(`[${route}] ${v.impact} ${v.id}: ${v.help}`);
    for (const n of v.nodes.slice(0,3)) console.log('   ', n.target.join(' '), '|', (n.failureSummary||'').split('\n')[0]);
  }
  await p.close();
}
await b.close();
