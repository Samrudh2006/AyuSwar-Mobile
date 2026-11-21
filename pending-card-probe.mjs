import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  // Scanner: card state during pending vs after terminal
  await p.goto('http://localhost:4173/scanner', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);
  await p.locator('text=/Preprocessing on/').first().click();
  await p.locator('input[type="file"]').first().setInputFiles('/tmp/pantoprazole_512.jpg');
  await p.waitForTimeout(3500); // mid-pending
  const pendingBadge = await p.locator('text=/BUNDLED SAMPLE|NO RESULT/').first().textContent().catch(() => 'none');
  const pendingClaim = await p.locator('text=/No text recognized/').count();
  console.log('PENDING badge:', pendingBadge, '| false-terminal claim visible:', pendingClaim > 0);
  await p.screenshot({ path: '/tmp/scan-pending-card.png' });
  await p.locator('text=/No readable result|No legible text/').first().waitFor({ timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(800);
  const termBadge = await p.locator('text=/BUNDLED SAMPLE|NO RESULT/').first().textContent().catch(() => 'none');
  const termClaim = await p.locator('text=/No text recognized/').count();
  console.log('TERMINAL badge:', termBadge, '| no-result claim visible:', termClaim > 0);
  await p.screenshot({ path: '/tmp/scan-terminal-card.png' });
  // Ticket layout: input width + scan row position
  await p.goto('http://localhost:4173/appointment-ticket', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2000);
  const input = p.locator('input[aria-label="Booking reference"]');
  const scanBtn = p.locator('label:has-text("Scan ticket image")');
  const ib = await input.boundingBox(); const sb = await scanBtn.boundingBox();
  console.log('TICKET input width:', Math.round(ib.width), 'px | scan row y:', Math.round(sb.y), 'vs input y:', Math.round(ib.y), '| own row:', sb.y > ib.y + ib.height - 4);
  await p.screenshot({ path: '/tmp/ticket-row-wrap.png' });
  await b.close();
})();
