import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await (await b.newContext({ viewport:{width:390,height:844} })).newPage();
await p.goto('http://localhost:4173/scanner', { waitUntil:'domcontentloaded' });
await p.waitForTimeout(2500);
const input = await p.$('label:has-text("Import PDF") input[type="file"]');
await input.setInputFiles('/tmp/test-rx.pdf');
await p.waitForTimeout(4000);
await p.screenshot({ path:'/tmp/pdf-1-review.png' });
const useBtn = p.getByText('Use as unverified draft');
if (await useBtn.count()) {
  await useBtn.first().click();
  await p.waitForTimeout(1500);
  await p.screenshot({ path:'/tmp/pdf-2-used.png' });
  console.log('REVIEW+USED');
} else {
  console.log('NO REVIEW PANEL');
}
await b.close();
