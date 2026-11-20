import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await (await b.newContext({ viewport:{width:760,height:900} })).newPage();
await p.goto('file:///tmp/portal-print.html', { waitUntil:'load' });
await p.waitForTimeout(1200);
await p.screenshot({ path:'/tmp/portal-print-pixels.png', fullPage: true });
await b.close();
console.log('rendered');
