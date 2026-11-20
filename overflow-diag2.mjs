import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['microphone'] });
const page = await ctx.newPage();
await page.route('**/api/groq/transcribe', () => new Promise(() => {}));
await page.goto('http://localhost:4173/clinical-console/full', { waitUntil: 'networkidle', timeout: 60000 });
const measure = (label) => page.evaluate(() => {
  const vw = document.documentElement.clientWidth, sw = document.documentElement.scrollWidth;
  const offenders = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 && r.width > 40 && ![...el.children].some(c => c.getBoundingClientRect().right > vw + 1))
      offenders.push({ tag: el.tagName, right: Math.round(r.right), text: (el.textContent || '').trim().slice(0, 45) });
  }
  return { label: '', vw, sw, n: offenders.length, sample: offenders.slice(0, 6) };
}).then(r => console.log(label, JSON.stringify(r)));
await measure('IDLE');
await page.getByText('Start OPD Recording').first().click();
await page.waitForTimeout(3000);
await measure('RECORDING');
await page.getByText('Pause Recording').first().click();
await page.waitForTimeout(2500);
await measure('TRANSCRIBING');
await page.screenshot({ path: '/downloads/overflow-state.png' });
await b.close();
