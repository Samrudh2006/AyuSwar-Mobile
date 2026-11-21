// Probe: v0.3.21 i18n + audio-honesty slice.
// S1: Telugu locale renders the add-medication modal fully in Telugu,
//     with the honest subtitle (no auto-generate claim).
// S2: Hindi locale: a user-uploaded report card's hear button discloses
//     that playback reads the untranslated user text.
import { chromium } from 'playwright';
const BASE = 'http://localhost:4173/patient-portal';
const results = [];
const check = (name, ok) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });

{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.on('dialog', d => d.accept());
  await p.addInitScript(() => localStorage.setItem('ayuswar_selected_language', 'te-IN'));
  await p.goto(`${BASE}?tab=medications`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.locator('button', { hasText: 'ఔషధాన్ని మాన్యువల్‌గా జోడించండి' }).first().click();
  await p.waitForTimeout(700);
  const modal = await p.evaluate(() => {
    const sel = document.querySelector('select');
    const dialog = sel ? sel.closest('div[class*="fixed"], div[class*="modal"]') : null;
    return (dialog || document.body).innerText;
  });
  const body = modal;
  check('S1 modal title in Telugu', /ఔషధాన్ని మాన్యువల్‌గా జోడించండి/.test(body));
  check('S1 slot label in Telugu', /సమయ స్లాట్/.test(body));
  check('S1 no English Timing Slot label', !/Timing Slot/.test(body));
  const optTexts = await p.evaluate(() => [...document.querySelectorAll('select option')].map(o => o.textContent).join(' | '));
  check('S1 slot options localized', /పరగడుపున/.test(optTexts) && !/Empty Stomach/.test(optTexts) && !/Tea Time/.test(optTexts));
  check('S1 honest subtitle (no auto-generate claim)', !/auto-generate/i.test(body));
  check('S1 Telugu voice label present', /వాయిస్ సూచన/.test(body));
  check('S1 pillbox button in Telugu', /పిల్‌బాక్స్‌కు జోడించండి/.test(body));
  await p.screenshot({ path: '/tmp/med-modal-telugu.png' });
  await ctx.close();
}

{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  p.on('dialog', d => d.accept());
  await p.addInitScript(() => localStorage.setItem('ayuswar_selected_language', 'hi-IN'));
  await p.goto(`${BASE}?tab=reports`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3200);
  await p.locator('button', { hasText: 'नई डायग्नोस्टिक रिपोर्ट अपलोड करें' }).first().click();
  await p.waitForTimeout(500);
  const fileInput = p.locator('input[type="file"][accept*=".pdf"]').first();
  await fileInput.setInputFiles({ name: 'meri-report.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 demo') });
  await p.waitForTimeout(400);
  await p.locator('button', { hasText: 'सत्यापित करें और मेरी रिपोर्ट में जोड़ें' }).first().click();
  await p.waitForTimeout(600);
  const untranslated = p.locator('button', { hasText: 'अननुवादित अंग्रेज़ी टेक्स्ट' });
  check('S2 Hindi user card discloses untranslated playback', await untranslated.count() === 1);
  const plainHear = p.locator('button', { hasText: 'सारांश सुनें (डेमो वॉइस)' }).or(p.locator('button', { hasText: 'नमूना सुनें' }));
  check('S2 sample cards keep sample hear label', await p.locator('button', { hasText: 'नमूना' }).count() >= 1);
  await untranslated.first().scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await p.screenshot({ path: '/tmp/hindi-report-card.png' });
  await ctx.close();
}

console.log(results.join('\n'));
const fails = results.filter(r => r.startsWith('FAIL')).length;
console.log(`${results.length} scenarios, ${fails} failed`);
await browser.close();
process.exit(fails ? 1 : 0);
