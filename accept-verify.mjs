import { chromium } from 'playwright';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  // 1. splash timing
  const t0 = Date.now();
  await p.goto('http://localhost:4173/patient-portal?tab=my_health', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.m-splash.hide, .m-splash[aria-hidden="true"]', { timeout: 5000 }).catch(() => {});
  const splashGone = Date.now() - t0;
  // 2. per-field errors + focus
  await p.waitForTimeout(1200);
  await p.locator('button:has-text("Add Vitals Manually")').first().click();
  await p.waitForTimeout(600);
  await p.locator('input[placeholder="e.g. 98"]').fill('104');
  const saveBtn = p.locator('button:has-text("Save Vitals Entry")');
  await saveBtn.scrollIntoViewIfNeeded(); await saveBtn.click();
  await p.waitForTimeout(600);
  const state = await p.evaluate(() => {
    const sys = document.querySelector('input[placeholder="e.g. 120"]');
    const spo2 = document.querySelector('input[placeholder="e.g. 98"]');
    const inline = document.querySelector('#vitals-err-spo2');
    const active = document.activeElement;
    return {
      sysAriaInvalid: sys?.getAttribute('aria-invalid'),
      sysDescribedBy: sys?.getAttribute('aria-describedby'),
      spo2InlineText: inline ? inline.textContent : null,
      focusedPlaceholder: active?.placeholder || active?.tagName,
    };
  });
  console.log('EN per-field:', JSON.stringify(state));
  await p.screenshot({ path: '/tmp/rhf-perfield-en.png' });
  // 3. Telugu error
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  await p.evaluate(() => localStorage.setItem('ayuswar_selected_language', 'te-IN'));
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500);
  await p.locator('button:has-text("Add Vitals Manually")').first().click().catch(async () => {
    await p.locator('button').filter({ hasText: /వైటల్స్|Vitals/ }).first().click();
  });
  await p.waitForTimeout(600);
  const saveBtn2 = p.locator('button', { hasText: /Save Vitals Entry|సేవ్/ }).first();
  await saveBtn2.scrollIntoViewIfNeeded(); await saveBtn2.click();
  await p.waitForTimeout(600);
  const alertTe = await p.locator('[role="alert"]').innerText().catch(() => 'NO ALERT');
  console.log('splash dismissed in ms:', splashGone);
  console.log('TE alert starts:', alertTe.slice(0, 80).replace(/\n/g, ' | '));
  await p.screenshot({ path: '/tmp/rhf-perfield-te.png' });
  await b.close();
})();
