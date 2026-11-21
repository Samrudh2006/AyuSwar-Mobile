import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const tag = process.argv[2], rm = process.argv[3] === 'rm';
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: `/tmp/anim3/${tag}`, size: { width: 390, height: 844 } }, ...(rm ? { reducedMotion: 'reduce' } : {}) });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4173/acoustic-lab', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  await p.locator('input[type="file"][accept*="audio"]').first().setInputFiles('/tmp/test-tone.wav');
  // wait for the YAMNet tags panel (lab pipeline reaches success)
  await p.locator('text=/Explore sound-event hints/').waitFor({ timeout: 60000 });
  await p.locator('.m-record-language select').selectOption('cough');
  await p.locator('button:has-text("Analyze sound-event hints")').click();
  await p.waitForTimeout(500);
  const stateVisible = await p.locator('text=/Analysing audio/').count();
  const hintVisible = await p.locator('text=/Real DSP stages, no inference/').count();
  console.log(`${tag}: stateAnalyzing=${stateVisible} hint=${hintVisible}`);
  await p.screenshot({ path: `/tmp/anim3-${tag}-busy.png` });
  await p.waitForTimeout(6000); // record pending frames
  await p.locator('text=/Uncertain event hints|could not run|exceeded/').first().waitFor({ timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `/tmp/anim3-${tag}-done.png` });
  console.log(tag, 'done');
  await ctx.close();
  await b.close();
})();
