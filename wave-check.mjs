import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  for (const rm of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, ...(rm ? { reducedMotion: 'reduce' } : {}) });
    const p = await ctx.newPage();
    await p.goto('http://localhost:4173/scanner', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1500);
    await p.locator('text=/Preprocessing on/').first().click();
    await p.locator('input[type="file"]').first().setInputFiles('/tmp/yellow_pantoprazole.jpg');
    await p.waitForTimeout(1200); // into pending
    const info = await p.evaluate(() => {
      const el = document.querySelector('.ayuswar-liquid-wave-svg');
      if (!el) return { found: false };
      const cs = getComputedStyle(el);
      // sample the wave's actual rendered transform twice, 600ms apart handled outside
      return { found: true, animationName: cs.animationName, animationDuration: cs.animationDuration, animationPlayState: cs.animationPlayState };
    });
    // live pixel sample of the wave band only (exclude the number): two screenshots 600ms apart
    const clip = { x: 118, y: 165, width: 154, height: 32 }; // lower wave band inside capsule, below the number
    const s1 = await p.screenshot({ clip });
    await p.waitForTimeout(600);
    const s2 = await p.screenshot({ clip });
    let diff = 0; for (let i = 0; i < Math.min(s1.length, s2.length); i++) diff += Math.abs(s1[i] - s2[i]);
    console.log(`reducedMotion=${rm}: waveFound=${info.found} animName=${info.animationName} dur=${info.animationDuration} playState=${info.animationPlayState} waveBandByteDiff=${diff}`);
    await ctx.close();
  }
  await b.close();
})();
