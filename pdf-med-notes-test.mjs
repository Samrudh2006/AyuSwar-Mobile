// Probe: honest-note dialogs for the reports PDF button and the manual
// medication add flow (fix slice after the join-claims sweep).
// Scenario 1: reports card PDF button shows the honest "no PDF generated"
// note, not the old fabricated "Preparing demo PDF copy..." claim.
// Scenario 2: Add Medication Manually save shows the demo-only/no-persistence
// note with the medicine name interpolated.
// Both run against `vite preview` (dist build) at http://localhost:4173.
import { chromium } from 'playwright';

const BASE = 'http://localhost:4173/patient-portal';
let failures = 0;
const ok = (cond, label) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
  if (!cond) failures += 1;
};

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });

// Scenario 1: PDF button honest note
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let dialogText = null;
  page.on('dialog', async d => { dialogText = d.message(); await d.accept(); });
  await page.goto(`${BASE}?tab=reports`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3200);
  const pdfBtn = page.locator('button', { hasText: 'PDF' }).first();
  await pdfBtn.scrollIntoViewIfNeeded();
  await pdfBtn.click();
  await page.waitForTimeout(400);
  ok(dialogText !== null, 'S1: PDF click produced a dialog');
  ok(dialogText && !/Preparing/i.test(dialogText), 'S1: dialog does not claim a PDF is being prepared');
  ok(dialogText && /not available in this build/i.test(dialogText) && /No file was generated or downloaded/i.test(dialogText),
     'S1: dialog is the honest no-export note');
  await page.close();
}

// Scenario 2: manual med add honest note
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let dialogText = null;
  page.on('dialog', async d => { dialogText = d.message(); await d.accept(); });
  await page.goto(`${BASE}?tab=medications`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3200);
  await page.locator('button', { hasText: 'Add Medication Manually' }).first().click();
  await page.waitForTimeout(500);
  await page.locator('button', { hasText: 'Add to Chronotherapy Pillbox' }).first().click();
  await page.waitForTimeout(400);
  ok(dialogText !== null, 'S2: med save produced a dialog');
  ok(dialogText && dialogText.includes('Paracetamol 650mg'), 'S2: medicine name interpolated into the note');
  ok(dialogText && /demo schedule only/i.test(dialogText) && /not saved permanently/i.test(dialogText),
     'S2: note states demo-only and no permanent save');
  await page.close();
}

// Scenario 3: origin-aware report subtitle. A user-uploaded file saved from
// the upload modal must render the self-entered subtitle, while a bundled
// quick-select sample keeps the sample subtitle.
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on('dialog', async d => { await d.accept(); });
  await page.goto(`${BASE}?tab=reports`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3200);
  await page.locator('button', { hasText: 'Upload New Diagnostic Report' }).first().click();
  await page.waitForTimeout(500);
  const fileInput = page.locator('input[type="file"][accept*=".pdf"]').first();
  await fileInput.setInputFiles({ name: 'my-lab-jan.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 demo') });
  await page.waitForTimeout(400);
  await page.locator('button', { hasText: 'Verify & Add to My Reports' }).first().click();
  await page.waitForTimeout(500);
  const selfCard = page.locator('text=Self-entered report text').first();
  ok(await selfCard.count() === 1, 'S3: user-uploaded save renders the self-entered subtitle');
  ok(await page.locator('button', { hasText: 'Hear summary (demo voice)' }).count() === 1,
     'S3: user-entered card hear button drops the sample label');
  // Sample quick-select keeps the sample subtitle
  await page.locator('button', { hasText: 'Upload New Diagnostic Report' }).first().click();
  await page.waitForTimeout(500);
  await page.locator('button', { hasText: 'HbA1c Lab PDF' }).first().click();
  await page.waitForTimeout(400);
  await page.locator('button', { hasText: 'Verify & Add to My Reports' }).first().click();
  await page.waitForTimeout(500);
  const sampleCards = page.locator('text=Sample report data');
  ok(await sampleCards.count() >= 2, 'S3: sample quick-select save keeps the sample subtitle');
  await page.close();
}

await browser.close();
console.log(failures === 0 ? 'ALL 3 SCENARIOS PASS' : `${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
