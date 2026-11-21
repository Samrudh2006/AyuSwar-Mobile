import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const tag = process.argv[2], rm = process.argv[3] === 'rm', lang = process.argv[4] || 'en-IN';
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: `/tmp/anim5/${tag}`, size: { width: 390, height: 844 } }, ...(rm ? { reducedMotion: 'reduce' } : {}) });
  const p = await ctx.newPage();
  await p.addInitScript((l) => { localStorage.setItem('ayuswar_selected_language', l); }, lang);
  await p.goto('http://localhost:4173/acoustic-lab', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  await p.locator('input[type="file"][accept*="audio"]').first().setInputFiles('/tmp/test-tone.wav');
  await p.locator('text=/Explore sound-event hints|శబ్ద ఈవెంట్/').first().waitFor({ timeout: 60000 });
  await p.locator('.m-record-language select').selectOption('cough');
  await p.locator('button:has-text("Analyze sound-event hints"), button:has-text("శబ్ద ఈవెంట్")').first().click();
  await p.waitForTimeout(500);
  // scroll the busy state card into view (parent correction: busy card below viewport)
  const busy = p.locator('text=/Analysing audio|\u0c06\u0c21\u0c3f\u0c2f\u0c4b \u0c35\u0c3f\u0c36\u0c4d\u0c32\u0c47\u0c37\u0c3f\u0c38\u0c4d\u0c24\u0c4b\u0c02\u0c26\u0c3f/').first();
  await busy.scrollIntoViewIfNeeded().catch(() => {});
  const hintCount = await p.locator('text=/no diagnostic inference|డయగ్నోస్టిక్ అనుమానం/').count();
  console.log(`${tag}: corrected-hint=${hintCount}`);
  await p.screenshot({ path: `/tmp/anim5-${tag}-busy.png` });
  await p.waitForTimeout(6000);
  await p.locator('text=/Uncertain event hints|could not run|exceeded|అనిశ్చిత/').first().waitFor({ timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `/tmp/anim5-${tag}-done.png` });
  console.log(tag, 'done');
  await ctx.close();
  await b.close();
})();
