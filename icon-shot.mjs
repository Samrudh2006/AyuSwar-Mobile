import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await (await b.newContext({ viewport:{width:390,height:844} })).newPage();
await p.goto('http://localhost:4174/home', { waitUntil:'networkidle' });
await p.waitForTimeout(800);
await p.screenshot({ path:'/tmp/icons-home.png' });
await b.close();
console.log('done');
