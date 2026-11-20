import { chromium } from 'playwright';
import fs from 'fs';
const run = async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto('http://localhost:4173/appointment-ticket', { waitUntil: 'networkidle' });
  await page.waitForSelector('.m-tkt', { timeout: 20000 });
  await page.waitForTimeout(3000);
  const qrSrc = await page.locator('.m-tkt-qr img').getAttribute('src');
  fs.writeFileSync('/tmp/qrdec/qr-b64.txt', qrSrc.split(',')[1]);
  await page.screenshot({ path: '/downloads/ticket-1.png', fullPage: true });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: '/downloads/ticket-print.pdf', format: 'A4' });
  console.log('ticket captured');
  await browser.close();
};
run().catch(e => { console.error('FAIL', e.message); process.exit(1); });
