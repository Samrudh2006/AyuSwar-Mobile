import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const [w,h,tag] of [[390,844,'390'],[320,720,'320'],[430,860,'430']]) {
  const p = await (await b.newContext({ viewport:{width:w,height:h} })).newPage();
  await p.goto('http://localhost:4173/clinical-console/full', { waitUntil:'domcontentloaded' });
  await p.waitForTimeout(3000);
  await p.screenshot({ path:`/tmp/bridge-${tag}.png` });
  await p.close();
}
await b.close();
console.log('done');
