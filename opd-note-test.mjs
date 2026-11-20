import { chromium } from 'playwright';

const run = async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: '/downloads/opd-video', size: { width: 390, height: 844 } }
  });
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE-ERR', m.text().slice(0, 160)); });

  await page.goto('http://localhost:4173/opd-note', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/downloads/opd-0-blank.png' });

  // Fill fields with a synthetic example (typed by the tester, not auto-filled)
  await page.locator('label:has-text("Patient name") input').fill('Kavya Example');
  await page.locator('label:has-text("Age / Gender") input').fill('28y / F');
  await page.locator('label:has-text("OPD No") input').fill('DEMO-024');
  await page.locator('label:has-text("Chief complaints") textarea').fill('Fever and sore throat since 2 days');
  await page.locator('label:has-text("Advice / Plan") textarea').fill('Rest, fluids, review if fever persists');
  await page.screenshot({ path: '/downloads/opd-1-typed.png' });

  // Handwritten style toggle
  await page.locator('button:has-text("Handwritten style")').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/downloads/opd-2-handwritten.png' });

  // Save: success banner must appear only after the write
  await page.locator('button:has-text("Save note")').click();
  await page.waitForSelector('text=Saved on this device.', { timeout: 5000 });
  await page.screenshot({ path: '/downloads/opd-3-saved.png' });

  // Export text download
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 8000 }),
    page.locator('button:has-text("Export text")').click()
  ]);
  const dlPath = '/downloads/opd-note-export.txt';
  await download.saveAs(dlPath);
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/downloads/opd-4-exported.png' });

  // Reload: fields must repopulate from the real saved draft
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const name = await page.locator('label:has-text("Patient name") input').inputValue();
  const med = await page.locator('label:has-text("Medication") textarea').inputValue();
  console.log('after-reload patientName=', JSON.stringify(name), ' medication=', JSON.stringify(med));
  await page.screenshot({ path: '/downloads/opd-5-reloaded.png' });

  await context.close();
  await browser.close();
  console.log('opd-note flow done');
};
run().catch(e => { console.error('FAIL', e.message); process.exit(1); });
