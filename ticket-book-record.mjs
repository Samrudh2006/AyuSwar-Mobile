import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport:{width:390,height:844}, recordVideo:{ dir:'/tmp/vid2', size:{width:390,height:844} } });
const p = await ctx.newPage();
await p.goto('http://localhost:4174/', { waitUntil:'networkidle' });
await p.evaluate(() => localStorage.setItem('ayuswar_demo_mode','true'));
await p.goto('http://localhost:4174/home', { waitUntil:'networkidle' });
await p.waitForTimeout(700);
await p.getByText('OPD appointment ticket').first().click();
await p.waitForTimeout(1200);
await p.screenshot({ path:'/tmp/book-1-first-entry.png' });
await p.getByText('+ Book demo slot').first().click();
await p.waitForTimeout(1200);
await p.screenshot({ path:'/tmp/book-2-new-entry.png' });
for (let i=0;i<4;i++){ await p.mouse.wheel(0,320); await p.waitForTimeout(350); }
await p.screenshot({ path:'/tmp/book-3-scrolled.png' });
// switch back to first entry to prove chooser
await p.mouse.wheel(0,-2000); await p.waitForTimeout(400);
await p.getByText('DEMO-101').first().click();
await p.waitForTimeout(800);
await p.screenshot({ path:'/tmp/book-4-switched.png' });
await ctx.close();
await b.close();
console.log('recorded');
