import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });

  // A. OPD save transition, normal motion
  let ctx = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: '/tmp/anim-evidence/save', size: { width: 390, height: 844 } } });
  let p = await ctx.newPage();
  await p.goto('http://localhost:4173/opd-note', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  await (await p.locator('.m-opd-form input').nth(0)).fill('DEMO-024');
  await p.evaluate(() => { document.querySelector('.m-opd-sheet')?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -260); });
  await p.waitForTimeout(400);
  await p.locator('button:has-text("Save note")').click();
  await p.locator('text=/Note saved/').waitFor({ timeout: 5000 });
  await p.waitForTimeout(2500);
  await ctx.close();

  // B. Scanner pending wave, normal motion (CV off for a time-boxed real pending window)
  ctx = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: '/tmp/anim-evidence/scan', size: { width: 390, height: 844 } } });
  p = await ctx.newPage();
  await p.goto('http://localhost:4173/scanner', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);
  await p.locator('text=/Preprocessing on/').first().click();
  await p.locator('input[type="file"]').first().setInputFiles('/tmp/pantoprazole_512.jpg');
  await p.waitForTimeout(6000); // record pending frames
  await p.locator('text=/No readable result|No legible text|Could not read/').first().waitFor({ timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await ctx.close();

  // C. Scanner pending under reduced motion
  ctx = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: '/tmp/anim-evidence/scan-rm', size: { width: 390, height: 844 } }, reducedMotion: 'reduce' });
  p = await ctx.newPage();
  await p.goto('http://localhost:4173/scanner', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);
  await p.locator('text=/Preprocessing on/').first().click();
  await p.locator('input[type="file"]').first().setInputFiles('/tmp/pantoprazole_512.jpg');
  await p.waitForTimeout(6000);
  await p.locator('text=/No readable result|No legible text|Could not read/').first().waitFor({ timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await ctx.close();
  await b.close();
  console.log('recorded');
})();
