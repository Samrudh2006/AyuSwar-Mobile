import { chromium } from 'playwright';

const run = async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: '/downloads/opd-video3', size: { width: 390, height: 844 } }
  });
  const page = await context.newPage();
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE-ERR', m.text().slice(0, 140)); });

  // Start at the real consultation screen (one splash at app open)
  await page.goto('http://localhost:4173/clinical-console', { waitUntil: 'networkidle' });
  await page.waitForSelector('button:has-text("Sample demo"), button:has-text("sample")', { timeout: 25000 });
  await page.waitForTimeout(3500);

  // Choose the built-in sample demo (explicit demo path, labelled in-app)
  await page.locator('button:has-text("Sample demo")').first().click().catch(async () => {
    await page.locator('button:has-text("sample")').first().click();
  });
  await page.waitForTimeout(1200);
  await page.locator('button:has-text("Use sample"), button:has-text("use sample")').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/downloads/flow-1-sample.png' });

  // Generate draft -> review screen
  await page.locator('button:has-text("Generate draft"), button:has-text("generate")').last().click();
  // Wait for either the AI draft or the honest failure card (manual entry path)
  const review = await Promise.race([
    page.waitForSelector('h2:has-text("Doctor review & edit")', { timeout: 90000 }).then(() => 'ai'),
    page.waitForSelector('h2:has-text("Draft not generated")', { timeout: 90000 }).then(() => 'manual')
  ]);
  console.log('review path:', review);
  if (review === 'manual') {
    console.log('AI draft unavailable in preview - taking genuine manual-entry path');
    await page.locator('button:has-text("Enter manual draft")').click();
    await page.waitForSelector('h2:has-text("Doctor review & edit")', { timeout: 10000 });
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/downloads/flow-2-review.png' });

  // Open the structured OPD note from the review screen
  await page.locator('button:has-text("Open structured OPD note")').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.locator('button:has-text("Open structured OPD note")').click();
  await page.waitForSelector('.m-opd-sheet', { timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.locator('.m-opd-sheet').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/downloads/flow-3-note-prefilled.png' });
  const prefill = await page.locator('label:has-text("Chief complaints:") textarea').inputValue();
  console.log('prefilled chief complaints length:', prefill.length);

  // Edit one field visibly
  await page.locator('label:has-text("Advice:") textarea').scrollIntoViewIfNeeded();
  await page.locator('label:has-text("Advice:") textarea').click();
  await page.keyboard.press('Control+A');
  await page.locator('label:has-text("Advice:") textarea').pressSequentially('Review if fever persists.', { delay: 80 });
  await page.waitForTimeout(1000);

  // Handwritten toggle
  await page.locator('button:has-text("Standard text style")').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.locator('button:has-text("Standard text style")').click();
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Handwritten style")').click();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: '/downloads/flow-4-handwritten.png' });

  // Save -> banner
  await page.locator('button:has-text("Save note")').click();
  await page.waitForSelector('text=Saved on this device.', { timeout: 5000 });
  await page.waitForTimeout(2200);

  // Export -> download + status line
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 8000 }),
    page.locator('button:has-text("Export text")').click()
  ]);
  await download.saveAs('/downloads/opd-note-export.txt');
  await page.waitForSelector('text=Downloaded as a text file.', { timeout: 5000 });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: '/downloads/flow-5-saved-exported.png' });

  // Real PDF via print emulation
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: '/downloads/opd-note-print.pdf', format: 'A4' });
  console.log('pdf written');

  await context.close();
  await browser.close();
  console.log('flow record done');
};
run().catch(e => { console.error('FAIL', e.message); process.exit(1); });
