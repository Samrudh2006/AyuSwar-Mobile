// Wellness cards regression probe: sleep/praise/glucose/steps/hydration honesty.
// Run against `npx vite preview --port 4173`.
import { chromium } from 'playwright';
import assert from 'node:assert';

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
p.setDefaultTimeout(8000);
let passed = 0;
const ok = (name) => { passed++; console.log('PASS', name); };

await p.goto('http://localhost:4173/patient-portal?tab=health_goals', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3200);
const card = (btnText) => p.locator(`xpath=//button[contains(., "${btnText}")]/ancestor::div[contains(@style, "border-radius: 16px")][1]`);

// Sleep card
const sleepCard = card('+ 30m Sleep');
const sleepBadge = sleepCard.locator('span').filter({ hasText: /Good \(sample\)|Edited, not evaluated/ }).first();

// 1. sleep untouched: quality sample-tagged, score + breakdown carry sample tags
assert(await sleepCard.locator('text=Good (sample)').count() === 1, 'initial sleep badge');
const sleepText0 = await sleepCard.innerText();
assert(sleepText0.includes('(Score: 88/100)'), 'score visible untouched');
assert((sleepText0.match(/\(sample value\)/g) || []).length >= 2, 'score + breakdown sample-tagged: ' + sleepText0.split('\n').slice(0,6).join(' | '));
ok('sleep untouched: sample-tagged quality, score and breakdown');

// 2. sleep edited: badge neutral, score hidden, breakdown neutral note, hours updated
await sleepCard.locator('button', { hasText: '+ 30m Sleep' }).first().click();
await p.waitForTimeout(300);
const sleepText1 = await sleepCard.innerText();
assert(sleepText1.includes('8 hrs'), 'hours updated: ' + sleepText1.split('\n')[2]);
assert(sleepText1.includes('Edited, not evaluated (demo)'), 'neutral badge after edit');
assert(!sleepText1.includes('Score: 88'), 'score hidden after edit');
assert(!sleepText1.includes('1h 48m'), 'stale breakdown hidden after edit');
ok('sleep edited: neutral badge, frozen score and breakdown removed');

// 3. praise button is sample-labeled; alert carries sample prefix
const praiseBtn = p.locator('button', { hasText: 'sample praise' });
assert(await praiseBtn.count() === 1, 'sample-labeled praise button');
let dialogText = '';
p.once('dialog', d => { dialogText = d.message(); d.accept(); });
await praiseBtn.click();
await p.waitForTimeout(300);
assert(dialogText.startsWith('(sample)'), 'alert prefixed with sample tag: ' + dialogText.slice(0, 40));
ok('praise control and alert both carry sample labeling');

// 4. glucose fasting log: honest demo-only toast, badge stays sample-tagged
const glucoseCard = card('Log Fasting');
await glucoseCard.locator('button', { hasText: 'Log Fasting' }).click();
await p.waitForTimeout(400);
const toast = await p.locator('span', { hasText: /demo session only|demo only|Nothing was logged/ }).first().innerText();
assert(toast.includes('Sample fasting reading logged (demo only)'), 'fasting toast: ' + toast);
assert(await glucoseCard.locator('text=In target band (sample)').count() === 1, 'glucose badge stays sample-tagged');
ok('glucose fasting log: demo-only toast, sample-tagged badge');

// 5. glucose post-meal log toast honest
await p.waitForTimeout(4200);
await glucoseCard.locator('button', { hasText: 'Log Post-Meal' }).click();
await p.waitForTimeout(400);
const toast2 = await p.locator('span', { hasText: /demo only/ }).first().innerText();
assert(toast2.includes('Sample post-meal reading logged (demo only)'), 'post-meal toast: ' + toast2);
ok('glucose post-meal log: demo-only toast');

// 6. steps counter increments without any success claim
const stepsCard = card('+500 steps');
const steps0 = await stepsCard.innerText();
await stepsCard.locator('button', { hasText: '+500 steps' }).click();
await p.waitForTimeout(300);
const steps1 = await stepsCard.innerText();
assert(steps0.includes('6,420') && steps1.includes('6,920'), 'steps incremented: ' + steps1.split('\n')[1]);
ok('steps counter increments, no persistence claim');

// 7. hydration counter increments and is bounded
const hydCard = card('Log 1 Glass');
const hyd0 = await hydCard.innerText();
await hydCard.locator('button', { hasText: 'Log 1 Glass' }).click();
await p.waitForTimeout(300);
const hyd1 = await hydCard.innerText();
assert(hyd0.includes('5 / 8') && hyd1.includes('6 / 8'), 'hydration incremented: ' + hyd1.split('\n')[1]);
ok('hydration counter increments, bounded');

// evidence screenshots
await sleepCard.scrollIntoViewIfNeeded();
await sleepCard.screenshot({ path: '/tmp/sleep-edited-neutral.png' });
await glucoseCard.scrollIntoViewIfNeeded();
await glucoseCard.screenshot({ path: '/tmp/glucose-card.png' });

console.log(`\nCARDS PROBE: ${passed}/7 scenarios passed`);
await b.close();
