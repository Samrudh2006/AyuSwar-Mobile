import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => localStorage.setItem('ayuswar_demo_mode', 'true'));
  await p.goto('http://localhost:4173/appointment-ticket', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  // book a second slot so two refs exist
  await p.locator('button:has-text("Book demo slot")').first().click();
  await p.waitForTimeout(1200);
  const before = (await p.locator('body').innerText()).match(/demo_appt_\d+/)[0];
  // 1. miss path
  await p.locator('input[aria-label*="reference" i], input[placeholder*="reference" i]').first().fill('demo_appt_999');
  await p.locator('button:has-text("Find ticket")').click();
  await p.waitForTimeout(400);
  console.log('miss:', (await p.locator('[role="status"]').last().innerText().catch(() => 'none')));
  // 2. hit path with full scanned payload format
  await p.locator('input[aria-label*="reference" i], input[placeholder*="reference" i]').first().fill('AYUSWAR-TICKET:demo_appt_101');
  await p.locator('button:has-text("Find ticket")').click();
  await p.waitForTimeout(600);
  console.log('hit:', (await p.locator('[role="status"]').last().innerText().catch(() => 'none')));
  const after = (await p.locator('body').innerText()).match(/demo_appt_\d+/)[0];
  console.log('ticket ref before lookup:', before, '| after lookup:', after);
  await p.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /Scan or enter it below/.test(e.textContent)); if (el) el.scrollIntoView({ block: 'center' }); });
  await p.waitForTimeout(700);
  await p.screenshot({ path: '/tmp/ticket-lookup.png' });
  await ctx.close();
  await b.close();
})();
