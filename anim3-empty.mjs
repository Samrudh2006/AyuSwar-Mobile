import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  for (const [tag, rm] of [['empty', false], ['empty-rm', true]]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: `/tmp/anim3/${tag}`, size: { width: 390, height: 844 } }, ...(rm ? { reducedMotion: 'reduce' } : {}) });
    const p = await ctx.newPage();
    await p.addInitScript(() => localStorage.setItem('ayuswar_demo_mode', 'true'));
    await p.goto('http://localhost:4173/patient-portal', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2500);
    await p.locator('.patient-header-notifications-btn').first().click();
    await p.waitForTimeout(1000);
    // dismiss every seeded synthetic notification -> genuinely empty list
    while (await p.locator('[title="Dismiss notification"]').count() > 0) {
      await p.locator('[title="Dismiss notification"]').first().click();
      await p.waitForTimeout(300);
    }
    await p.waitForTimeout(800);
    const visible = await p.locator('text=/No notifications to display/').count();
    const hint = await p.locator('text=/No stored demo alerts on this device/').count();
    console.log(`${tag}: emptyState=${visible} hint=${hint}`);
    await p.screenshot({ path: `/tmp/anim3-${tag}.png` });
    await p.waitForTimeout(2000);
    await ctx.close();
  }
  await b.close();
})();
