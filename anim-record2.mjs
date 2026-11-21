import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  // A. OPD save transition
  let ctx = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: '/tmp/anim-evidence2/save', size: { width: 390, height: 844 } } });
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
  // B. Scanner pending, normal motion, bigger fixture
  ctx = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: '/tmp/anim-evidence2/scan', size: { width: 390, height: 844 } } });
  p = await ctx.newPage();
  await p.goto('http://localhost:4173/scanner', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);
  await p.locator('text=/Preprocessing on/').first().click();
  await p.locator('input[type="file"]').first().setInputFiles('/tmp/yellow_pantoprazole.jpg');
  await p.locator('text=/No readable result|No legible text|Reading complete/').first().waitFor({ timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await ctx.close();
  // C. Scanner pending, reduced motion
  ctx = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: '/tmp/anim-evidence2/scan-rm', size: { width: 390, height: 844 } }, reducedMotion: 'reduce' });
  p = await ctx.newPage();
  await p.goto('http://localhost:4173/scanner', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);
  await p.locator('text=/Preprocessing on/').first().click();
  await p.locator('input[type="file"]').first().setInputFiles('/tmp/yellow_pantoprazole.jpg');
  await p.locator('text=/No readable result|No legible text|Reading complete/').first().waitFor({ timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1500);
  await ctx.close();
  // D. Ticket controls into view (post-wrap)
  ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  p = await ctx.newPage();
  await p.goto('http://localhost:4173/appointment-ticket', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2000);
  await p.locator('input[aria-label="Booking reference"]').scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await p.screenshot({ path: '/tmp/ticket-controls-v329.png' });
  await b.close();
  console.log('done');
})();
