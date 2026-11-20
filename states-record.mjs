import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport:{width:390,height:844}, recordVideo:{ dir:'/tmp/vid3', size:{width:390,height:844} } });
const p = await ctx.newPage();
await p.route(/groq|api\./, async r => { await new Promise(res => setTimeout(res, 7000)); await r.abort(); });
await p.goto('http://localhost:4174/clinical-console', { waitUntil:'networkidle' });
await p.getByText('Sample demo').first().click();
await p.waitForTimeout(500);
await p.getByText('Use sample transcript').first().click();
await p.waitForTimeout(400);
await p.getByText('Generate draft from this transcript').first().click();
await p.waitForTimeout(2500);   // processing spinner visible, motion recorded
await p.waitForTimeout(8000);   // error state
await p.getByText('Enter manual draft from source transcript').first().click();
await p.waitForTimeout(1000);
// OPD save success
await p.goto('http://localhost:4174/opd-note', { waitUntil:'networkidle' });
await p.waitForTimeout(600);
await p.getByText('Save note').click();
await p.waitForTimeout(1500);
await p.getByText('Standard text style').first().click().catch(()=>{});
await p.waitForTimeout(1200);
await ctx.close();
await b.close();
console.log('recorded');
