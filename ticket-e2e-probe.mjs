import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => localStorage.setItem('ayuswar_demo_mode', 'true'));
  await p.goto('http://localhost:4173/appointment-ticket', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  const sample = await p.evaluate(() => ({
    demoBanner: !!document.body.innerText.match(/DEMO|Synthetic|Simulated/i),
    patient: (document.body.innerText.match(/Lakshmi Amma/) || [])[0] || null,
    token: (document.body.innerText.match(/PUL-066/) || [])[0] || null,
    qr: !!document.querySelector('img[src^="data:image"]'),
  }));
  console.log('sample ticket:', JSON.stringify(sample));
  await p.screenshot({ path: '/tmp/ticket-now-sample.png', fullPage: true });
  // Book demo slot (synthetic, local-only)
  const bookBtn = p.locator('button:has-text("Book demo slot")').first();
  if (await bookBtn.count()) {
    await bookBtn.click();
    await p.waitForTimeout(1500);
    const booked = await p.evaluate(() => ({
      demoRef: (document.body.innerText.match(/DEMO-\d+/) || [])[0] || null,
      syntheticLabel: !!document.body.innerText.match(/synthetic|Simulated|no request was sent/i),
    }));
    console.log('after demo booking:', JSON.stringify(booked));
    await p.screenshot({ path: '/tmp/ticket-now-booked.png', fullPage: true });
  } else {
    console.log('no demo booking button found');
  }
  // Print emulation
  await p.emulateMedia({ media: 'print' });
  await p.waitForTimeout(600);
  await p.screenshot({ path: '/tmp/ticket-now-print.png', fullPage: true });
  await ctx.close();
  await b.close();
})();
