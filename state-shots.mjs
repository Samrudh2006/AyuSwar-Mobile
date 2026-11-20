import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await (await b.newContext({ viewport:{width:390,height:844} })).newPage();
await p.goto('http://localhost:4174/opd-note', { waitUntil:'networkidle' });
await p.getByText('Save note').click();
await p.waitForTimeout(600);
await p.screenshot({ path:'/downloads/state-opd-save-success.png' });
await p.goto('http://localhost:4174/clinical-console', { waitUntil:'networkidle' });
const sample = p.getByText('Use sample consultation');
if (await sample.count()) { await sample.first().click(); await p.waitForTimeout(400); }
const cont = p.getByText('Continue');
if (await cont.count()) { await cont.first().click().catch(()=>{}); }
await p.waitForTimeout(1500);
await p.screenshot({ path:'/downloads/state-flow-mid.png' });
await p.waitForTimeout(8000);
await p.screenshot({ path:'/downloads/state-flow-final.png' });
await b.close();
console.log('done');
