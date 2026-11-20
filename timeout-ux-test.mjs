import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['microphone'] });
const page = await ctx.newPage();
// stalled server: request stays pending forever
await page.route('**/api/groq/transcribe', () => new Promise(() => {}));
await page.goto('http://localhost:4173/clinical-console/full', { waitUntil: 'networkidle', timeout: 60000 });
await page.getByText('Start OPD Recording').first().click();
await page.waitForTimeout(3500);
const st1 = await page.evaluate(() => document.body.innerText.match(/Consultation recording in progress|microphone|Mic|denied|error|unavailable/gi)?.slice(0, 5));
console.log('after start:', JSON.stringify(st1));
await page.getByText('Pause Recording').first().click();
await page.waitForTimeout(2000);
const st2 = await page.evaluate(() => { const el = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && /Recording paused|Transcribing|note:/i.test(e.textContent)); return el.map(e => e.textContent.trim().slice(0, 80)).slice(0, 4); });
console.log('after pause:', JSON.stringify(st2));
// transcribe auto-fires on pause; spinner message appears
await page.waitForFunction(() => document.body.innerText.includes('Whisper Transcribing'), undefined, { timeout: 10000 });
console.log('transcribe started, spinner visible; waiting for timeout recovery (45s cap in code)');
const t0 = Date.now();
await page.waitForFunction(() => document.body.innerText.includes('note:'), undefined, { timeout: 65000 });
const secs = Math.round((Date.now() - t0) / 1000);
const note = await page.evaluate(() => {
  const els = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.includes('note:'));
  return els.length ? els[0].textContent.trim() : 'NOTE TEXT NOT ISOLATED';
});
const spinnerGone = await page.evaluate(() => !document.body.innerText.includes('Whisper Transcribing'));
console.log('RESULT timeout-note-after=' + secs + 's | spinner-cleared=' + spinnerGone);
console.log('NOTE: ' + note.slice(0, 160));
await page.screenshot({ path: '/downloads/phase11-timeout-note.png' });
await b.close();
console.log('done');
