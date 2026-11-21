import { chromium } from 'playwright';
import fs from 'fs';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  let n = 0;
  cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
    fs.writeFileSync(`/tmp/thinkcast/f${String(n++).padStart(4, '0')}.jpg`, Buffer.from(data, 'base64'));
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await p.addInitScript(() => localStorage.setItem('ayuswar_demo_mode', 'true'));
  await p.goto('http://localhost:4173/patient-portal', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  await p.locator('.floating-assistant-pill').click();
  await p.waitForTimeout(1200);
  const input = p.locator('input[placeholder*="Describe health query"], textarea[placeholder*="Describe health query"]').first();
  if (!(await input.isVisible().catch(() => false))) {
    await p.locator('button:has-text("Type"), [aria-label*="Type"]').first().click().catch(() => {});
    await p.waitForTimeout(600);
  }
  await input.fill('What is AyuSwar?');
  fs.mkdirSync('/tmp/thinkcast', { recursive: true });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, everyNthFrame: 1 });
  await input.press('Enter');
  await p.waitForTimeout(2500);
  await cdp.send('Page.stopScreencast');
  console.log('frames captured:', n);
  await ctx.close(); await b.close();
})();
