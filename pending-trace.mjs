import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.goto('http://localhost:4173/scanner', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1800);
  await p.locator('text=/Preprocessing on/').first().click();
  await p.locator('input[type="file"]').first().setInputFiles('/tmp/pantoprazole_512.jpg');
  for (let i = 0; i < 24; i++) {
    const badge = await p.locator('text=/BUNDLED SAMPLE|NO RESULT/').first().textContent().catch(() => 'none');
    const phase = await p.locator('text=/Reading image on your device|No readable result|Reading complete|Reading failed/').first().textContent().catch(() => 'none');
    console.log(`t=${(i*0.5).toFixed(1)}s badge="${badge}" phase="${phase}"`);
    await p.waitForTimeout(500);
  }
  await p.screenshot({ path: '/tmp/scan-pending-trace.png' });
  await b.close();
})();
