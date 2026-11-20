import { chromium } from 'playwright';

const run = async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: '/downloads/opd-video2', size: { width: 390, height: 844 } }
  });
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE-ERR', m.text().slice(0, 160)); });

  await page.goto('http://localhost:4173/opd-note', { waitUntil: 'networkidle' });
  // Wait out the splash and any settling, sheet in view
  await page.waitForSelector('.m-opd-sheet', { timeout: 20000 });
  await page.waitForTimeout(4000);
  await page.locator('.m-opd-sheet').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);

  // Visible typing, field by field
  const type = async (sel, text) => {
    await page.locator(sel).click();
    await page.locator(sel).pressSequentially(text, { delay: 90 });
    await page.waitForTimeout(500);
  };
  await type('label:has-text("Patient name") input', 'Kavya Example');
  await type('label:has-text("Age / Gender") input', '28y / F');
  await type('label:has-text("OPD No") input', 'DEMO-024');
  await type('label:has-text("Chief complaints") textarea', 'Fever and sore throat since 2 days');
  await page.locator('label:has-text("Advice / Plan") textarea').scrollIntoViewIfNeeded();
  await type('label:has-text("Advice / Plan") textarea', 'Rest, fluids, review if fever persists');
  await page.waitForTimeout(1200);

  // Handwritten toggle, pause so the change is readable
  await page.locator('button:has-text("Handwritten style")').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.locator('button:has-text("Handwritten style")').click();
  await page.waitForTimeout(2500);

  // Save, banner must appear and stay visible
  await page.locator('button:has-text("Save note")').click();
  await page.waitForSelector('text=Saved on this device.', { timeout: 5000 });
  await page.waitForTimeout(2500);

  // Export, status line confirms the download
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 8000 }),
    page.locator('button:has-text("Export text")').click()
  ]);
  await download.saveAs('/downloads/opd-note-export.txt');
  await page.waitForSelector('text=Downloaded as a text file.', { timeout: 5000 });
  await page.waitForTimeout(2500);

  // Reload: prove the save persisted (splash again, then repopulated fields)
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.m-opd-sheet', { timeout: 20000 });
  await page.waitForTimeout(4000);
  await page.locator('.m-opd-sheet').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  const name = await page.locator('label:has-text("Patient name") input').inputValue();
  const med = await page.locator('label:has-text("Medication") textarea').inputValue();
  console.log('after-reload patientName=', JSON.stringify(name), ' medication=', JSON.stringify(med));
  await page.screenshot({ path: '/downloads/opd-final-reloaded.png' });

  // Real PDF through print emulation (same print stylesheet the button uses)
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: '/downloads/opd-note-print.pdf', format: 'A4' });
  console.log('pdf written');

  await context.close();
  await browser.close();
  console.log('record done');
};
run().catch(e => { console.error('FAIL', e.message); process.exit(1); });
