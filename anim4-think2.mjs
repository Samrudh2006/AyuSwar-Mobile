import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: '/tmp/anim4/think', size: { width: 390, height: 844 } } });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
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
  await input.press('Enter');
  const thinking = p.locator('text=/AyuSwar is thinking/');
  let sightings = 0, shots = 0;
  for (let i = 0; i < 200; i++) {
    if (await thinking.count() > 0) {
      sightings++;
      if (sightings === 2 || sightings === 8) { await p.screenshot({ path: `/tmp/anim4-think-pending${shots}.png` }); shots++; }
    } else if (sightings > 0) break;
    await p.waitForTimeout(40);
  }
  console.log('throttled sightings(x40ms):', sightings, 'shots:', shots);
  await p.waitForTimeout(1500);
  await ctx.close();
  await b.close();
})();
