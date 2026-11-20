import { chromium } from 'playwright';
const cases = [
  ['/tmp/fix-encrypted.pdf', 'password'],
  ['/tmp/fix-big.pdf', 'oversize'],
  ['/tmp/fix-plain.txt', 'notpdf-txt'],
  ['/tmp/fix-notpdf.pdf', 'fakepdf'],
  ['/tmp/fix-notext.pdf', 'notext'],
  ['/tmp/fix-corrupt.pdf', 'corrupt'],
  ['/tmp/fix-21pages.pdf', '21pages-truncate']
];
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
for (const [file, tag] of cases) {
  const p = await (await b.newContext({ viewport:{width:390,height:844} })).newPage();
  await p.goto('http://localhost:4173/scanner', { waitUntil:'domcontentloaded' });
  await p.waitForTimeout(2200);
  const input = await p.$('label:has-text("Import PDF") input[type="file"]');
  await input.setInputFiles(file);
  await p.waitForTimeout(5000);
  await p.screenshot({ path:`/tmp/pdferr-${tag}.png` });
  const body = await p.evaluate(() => document.body.innerText.slice(0, 3000));
  const lines = body.split('\n').filter(l => /password|15 ?MB|20 pages|not a PDF|could not be read|no (selectable|extractable)|text layer|first 20/i.test(l));
  console.log(`== ${tag}: ${lines.slice(0,3).join(' | ') || 'NO ERROR LINE FOUND'}`);
  await p.close();
}
await b.close();
