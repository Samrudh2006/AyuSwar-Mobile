import { chromium } from 'playwright';
import fs from 'node:fs';
const axeSrc = fs.readFileSync('./node_modules/axe-core/axe.min.js', 'utf8');
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const route of ['/scanner', '/clinical-console/full', '/patient-portal']) {
  const p = await (await b.newContext({ viewport:{width:390,height:844} })).newPage();
  await p.goto('http://localhost:4173' + route, { waitUntil:'domcontentloaded' });
  await p.waitForTimeout(3500);
  const res = await p.evaluate(async (src) => { eval(src); return await axe.run(document, { resultTypes:['violations'] }); }, axeSrc);
  for (const v of res.violations.filter(v => v.id === 'color-contrast')) {
    for (const n of v.nodes) {
      const d = n.any?.[0]?.data || {};
      console.log(`[${route}] ${n.target.join(' ')}`);
      console.log(`   text="${(n.html||'').replace(/<[^>]+>/g,'').slice(0,40)}" fg=${d.fgColor} bg=${d.bgColor} ratio=${d.contrastRatio} need=${d.expectedContrastRatio} font=${d.fontSize}`);
    }
  }
  await p.close();
}
await b.close();
