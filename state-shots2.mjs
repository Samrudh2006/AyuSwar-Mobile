import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await (await b.newContext({ viewport:{width:390,height:844} })).newPage();
await p.goto('http://localhost:4174/clinical-console', { waitUntil:'networkidle' });
await p.getByText('Sample demo').first().click();
await p.waitForTimeout(3000);
// now on scribe flow; processing should be running (or done)
await p.screenshot({ path:'/downloads/state-flow-mid.png' });
await p.waitForTimeout(9000);
await p.screenshot({ path:'/downloads/state-flow-final.png' });
await b.close();
console.log('done');
