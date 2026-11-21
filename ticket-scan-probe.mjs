import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => localStorage.setItem('ayuswar_demo_mode', 'true'));
  await p.goto('http://localhost:4173/appointment-ticket', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  console.log('BarcodeDetector present:', await p.evaluate(() => 'BarcodeDetector' in window));
  await p.locator('button:has-text("Book demo slot")').first().click();
  await p.waitForTimeout(1200);
  const before = (await p.locator('body').innerText()).match(/demo_appt_\d+/)[0];
  // 1. QR-less image
  await p.locator('input[type="file"][accept="image/*"]').setInputFiles('/tmp/pantoprazole_512.jpg');
  await p.waitForTimeout(1500);
  console.log('no-QR image:', await p.locator('[role="status"]').last().innerText().catch(() => 'none'));
  // 2. real QR image
  await p.locator('input[type="file"][accept="image/*"]').setInputFiles('/tmp/scan-test-qr.png');
  await p.waitForTimeout(1500);
  console.log('qr image:', await p.locator('[role="status"]').last().innerText().catch(() => 'none'));
  const after = (await p.locator('body').innerText()).match(/demo_appt_\d+/)[0];
  console.log('ticket before:', before, '| after scan:', after);
  await p.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /Scan or enter it below/.test(e.textContent)); if (el) el.scrollIntoView({ block: 'center' }); });
  await p.waitForTimeout(700);
  await p.screenshot({ path: '/tmp/ticket-scan-route.png' });
  await ctx.close();
  await b.close();
})();
