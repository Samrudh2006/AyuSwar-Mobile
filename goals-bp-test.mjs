// Wellness BP card regression probe: honesty + validation behavior.
// Run against `npx vite preview --port 4173`.
// Note: the toast auto-clears 4s after each click, so asserts must land
// inside that window and each new click must wait for the prior toast to clear.
import { chromium } from 'playwright';
import assert from 'node:assert';

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
p.setDefaultTimeout(8000);
let passed = 0;
const ok = (name) => { passed++; console.log('PASS', name); };

await p.goto('http://localhost:4173/patient-portal?tab=health_goals', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3200);
const bpCard = p.locator('xpath=//button[contains(., "Log Vitals Reading")]/..');
const inputs = bpCard.locator('input[type=number]');
const logBtn = p.locator('button:has-text("Log Vitals Reading")');
const banner = () => p.locator('span', { hasText: /demo session only|Nothing was logged/ }).first();
const bannerText = async () => (await banner().innerText());
const waitToastGone = async () => { await p.waitForTimeout(4600); };

// 1. untouched sample shows sample-tagged band badge
assert(await bpCard.locator('text=In target band (sample)').count() === 1, 'initial sample badge');
ok('initial badge is sample-tagged band');

// 2. blank systolic -> error, nothing logged
await inputs.nth(0).fill('');
await inputs.nth(1).fill('80');
await logBtn.click();
await p.waitForTimeout(500);
assert((await bannerText()).includes('Nothing was logged'), 'blank rejected');
ok('blank input rejected, nothing logged');

// 3. zero / negative -> error
await waitToastGone();
await inputs.nth(0).fill('-5');
await logBtn.click();
await p.waitForTimeout(500);
assert((await bannerText()).includes('Nothing was logged'), 'negative rejected');
ok('zero/negative rejected');

// 4. reversed BP (80/120) -> error
await waitToastGone();
await inputs.nth(0).fill('80');
await inputs.nth(1).fill('120');
await logBtn.click();
await p.waitForTimeout(500);
assert((await bannerText()).includes('systolic must not be lower than diastolic'), 'reversed rejected');
ok('reversed systolic/diastolic rejected');

// 5. edited values -> neutral not-evaluated badge (no band judgment)
assert(await bpCard.locator('text=Edited, not evaluated (demo)').count() === 1, 'edited badge');
assert(await bpCard.locator('text=target band').count() === 0, 'no band claim on edited values');
ok('edited values carry no band judgment');

// 6. valid correction clears error and toasts honest demo-only success, no external write claim
await waitToastGone();
await inputs.nth(0).fill('130');
await inputs.nth(1).fill('85');
await inputs.nth(2).fill('70');
await logBtn.click();
await p.waitForTimeout(500);
const successText = await bannerText();
assert(successText.includes('demo session only'), 'demo-only framing');
assert(successText.includes('Nothing was saved or sent to ABHA'), 'explicit no-persistence statement');
assert(!successText.includes('recorded to ABHA'), 'no external-write claim');
const borderColor = await banner().evaluate(el => getComputedStyle(el.parentElement).borderColor);
assert(borderColor.includes('4, 120, 87'), 'banner back to success styling: ' + borderColor);
ok('correction clears error; success is demo-only with no external-write claim');

// 7. pulse edited -> resting HR line no longer tagged sample value
const hrLine = await bpCard.locator('strong', { hasText: 'bpm' }).evaluate(el => el.parentElement.innerText);
assert(!hrLine.includes('(sample value)'), 'sample-value tag dropped after edit: ' + hrLine);
ok('edited pulse drops the sample-value tag');

console.log(`\nBP CARD PROBE: ${passed}/7 scenarios passed`);
await b.close();
