// Scratch probe: verify the manual-vitals fabrication fix. Never commit.
import { chromium } from 'playwright';

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, recordVideo: { dir: '/tmp/vid', size: { width: 390, height: 844 } } });
const p = await ctx.newPage();
const out = [];

// Accept confirm dialogs (for Clear test) but track them
let confirmSeen = 0;
p.on('dialog', async d => { confirmSeen++; await d.accept(); });

await p.goto('http://localhost:4173/patient-portal?tab=my_health', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);

// Open the Add Vitals modal
const addBtn = p.locator('button:has-text("Add Vitals Manually")').first();
await addBtn.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await addBtn.click();
await p.waitForTimeout(800);
await p.screenshot({ path: '/tmp/vf-1-empty.png' });

// 1. Save with all measurement fields EMPTY -> error summary, modal stays open, nothing saved
await p.locator('button:has-text("Save Vitals Entry")').click();
await p.waitForTimeout(500);
const alert1 = await p.locator('[role="alert"]').count();
out.push(['empty-save blocked with alert', alert1 === 1]);
await p.screenshot({ path: '/tmp/vf-2-errors.png' });

// 2. Enter zeros and impossible values
const sys = p.locator('input[placeholder="120"]');
const dia = p.locator('input[placeholder="80"]');
await sys.fill('0');
await dia.fill('98');
await p.locator('button:has-text("Save Vitals Entry")').click();
await p.waitForTimeout(400);
const alertText = await p.locator('[role="alert"]').innerText();
out.push(['zero systolic rejected', /systolic/i.test(alertText)]);
out.push(['values kept for correction', (await sys.inputValue()) === '0']);

// 3. Definitional guards: spo2 > 100 and sys < dia
await sys.fill('70');
await dia.fill('98');
const spo2Input = p.locator('input[placeholder="98"]').last();
// find spo2 input by label proximity instead
const spo2 = p.locator('div:has(> label:text-is("SpO2")) input, input[placeholder="98"]').first();
await spo2.fill('105');
await p.locator('input[placeholder="74"]').fill('72');
await p.locator('button:has-text("Save Vitals Entry")').click();
await p.waitForTimeout(400);
const alertText2 = await p.locator('[role="alert"]').innerText();
out.push(['spo2>100 rejected as definitional', /cannot exceed 100/i.test(alertText2)]);
out.push(['sys<dia rejected as definitional', /cannot be higher than systolic/i.test(alertText2)]);
await p.screenshot({ path: '/tmp/vf-3-guards.png' });

// 4. Extreme-but-real values must NOT be rejected (no clinical caps)
await sys.fill('210');
await dia.fill('130');
await spo2.fill('91');
await p.locator('button:has-text("Save Vitals Entry")').click();
await p.waitForTimeout(700);
const modalOpen = await p.locator('button:has-text("Save Vitals Entry")').count();
out.push(['extreme real values accepted (no clinical rejection)', modalOpen === 0]);
await p.screenshot({ path: '/tmp/vf-4-saved.png' });

// 5. Reload: entry persists from localStorage
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const body = await p.locator('body').innerText();
out.push(['reload preserves saved entry (210/130)', /210\/130/.test(body)]);
out.push(['saved entry labeled Self-reported', /Self-reported/.test(body)]);
await p.screenshot({ path: '/tmp/vf-5-reload.png' });

// 6. Duplicate-tap guard: open modal, valid values, double-click save fast
const addBtn2 = p.locator('button:has-text("Add Vitals Manually")').first();
await addBtn2.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await addBtn2.click();
await p.waitForTimeout(600);
await p.locator('input[placeholder="120"]').fill('118');
await p.locator('input[placeholder="80"]').fill('76');
await p.locator('input[placeholder="74"]').fill('70');
await spo2.fill('97');
const saveBtn = p.locator('button:has-text("Save Vitals Entry")');
await saveBtn.scrollIntoViewIfNeeded(); await p.waitForTimeout(200); await saveBtn.dblclick();
await p.waitForTimeout(700);
const body2 = await p.locator('body').innerText();
const count118 = (body2.match(/118\/76/g) || []).length;
out.push([`double-tap produced exactly one entry (found ${count118})`, count118 === 1]);

// 7. Clear with confirm (fresh page so a post-save assistant panel can't intercept)
await p.reload({ waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await addBtn2.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await addBtn2.click();
await p.waitForTimeout(500);
await p.locator('input[placeholder="120"]').fill('130');
await p.locator('button:has-text("Clear")').click();
await p.waitForTimeout(400);
out.push(['clear asked for confirm', confirmSeen >= 1]);
out.push(['clear blanked the field', (await p.locator('input[placeholder="120"]').inputValue()) === '']);

await ctx.close();
await b.close();
let fail = 0;
for (const [name, ok] of out) { console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name); if (!ok) fail++; }
console.log(fail === 0 ? 'ALL PASS' : fail + ' FAILURES');
