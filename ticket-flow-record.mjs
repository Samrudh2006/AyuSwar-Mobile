import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport:{width:390,height:844}, recordVideo:{ dir:'/tmp/vid', size:{width:390,height:844} } });
const p = await ctx.newPage();
await p.goto('http://localhost:4174/', { waitUntil:'networkidle' });
await p.evaluate(() => localStorage.setItem('ayuswar_demo_mode','true'));
// navigate to home (skip splash if any)
await p.goto('http://localhost:4174/home', { waitUntil:'networkidle' }).catch(()=>{});
await p.waitForTimeout(800);
const tile = p.getByText('OPD appointment ticket');
if (await tile.count()) { await tile.first().click(); } else { await p.goto('http://localhost:4174/appointment-ticket'); }
await p.waitForTimeout(1500);
await p.mouse.move(200,400);
for (let i=0;i<5;i++){ await p.mouse.wheel(0,300); await p.waitForTimeout(400); }
await ctx.close();
await b.close();
console.log('recorded');
