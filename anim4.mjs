import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const which = process.argv[2], rm = process.argv[3] === 'rm';
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: `/tmp/anim4/${which}`, size: { width: 390, height: 844 } }, ...(rm ? { reducedMotion: 'reduce' } : {}) });
  const p = await ctx.newPage();
  if (which.startsWith('yam')) {
    await p.goto('http://localhost:4173/acoustic-lab', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2500);
    await p.locator('input[type="file"][accept*="audio"]').first().setInputFiles('/tmp/test-tone.wav');
    await p.locator('text=/Explore sound-event hints/').waitFor({ timeout: 60000 });
    await p.locator('.m-record-language select').selectOption('cough');
    await p.locator('button:has-text("Analyze sound-event hints")').click();
    await p.locator('text=/Analysing audio/').waitFor({ timeout: 10000 });
    await p.locator('text=/Analysing audio/').scrollIntoViewIfNeeded();
    await p.waitForTimeout(600);
    await p.screenshot({ path: `/tmp/anim4-${which}-busy.png` });
    await p.waitForTimeout(5000);
    await p.locator('text=/Uncertain event hints|could not run|exceeded/').first().waitFor({ timeout: 60000 }).catch(() => {});
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `/tmp/anim4-${which}-done.png` });
  } else {
    await p.addInitScript(() => localStorage.setItem('ayuswar_demo_mode', 'true'));
    await p.goto('http://localhost:4173/patient-portal', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2500);
    await p.locator('.floating-assistant-pill').click();
    await p.waitForTimeout(1200);
    const input = p.locator('input[placeholder*="Describe health query"], textarea[placeholder*="Describe health query"]').first();
    if (!(await input.isVisible().catch(() => false))) {
      await p.locator('button:has-text("Type"), [aria-label*="Type"], button:has-text("type")').first().click().catch(() => {});
      await p.waitForTimeout(600);
    }
    await input.fill('What is AyuSwar?');
    await input.press('Enter');
    const thinking = p.locator('text=/AyuSwar is thinking/');
    let sightings = 0, firstShot = false;
    for (let i = 0; i < 80; i++) {
      if (await thinking.count() > 0) {
        sightings++;
        if (!firstShot) { await p.screenshot({ path: `/tmp/anim4-${which}-pending.png` }); firstShot = true; }
      } else if (sightings > 0) break;
      await p.waitForTimeout(50);
    }
    console.log(which, 'thinking sightings (x50ms):', sightings, 'captured:', firstShot);
    await p.waitForTimeout(2000);
    await p.screenshot({ path: `/tmp/anim4-${which}-after.png` });
  }
  await ctx.close();
  await b.close();
  console.log(which, 'done');
})();
