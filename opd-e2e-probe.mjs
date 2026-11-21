import { chromium } from 'playwright';
import fs from 'node:fs';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4173/opd-note', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  await p.evaluate(() => { document.querySelector('.m-opd-sheet')?.scrollIntoView({ block: 'start' }); });
  await p.screenshot({ path: '/tmp/opd-now-blank.png' });
  // Fill with the reference sheet content
  const vals = ['DEMO-024', '18/11/2026', 'Kavya Example', '28 years / Female'];
  const inputs = p.locator('.m-opd-form input');
  for (let i = 0; i < vals.length; i++) await inputs.nth(i).fill(vals[i]);
  const secs = [
    'Sore throat and dry cough for 2 days. Mild tiredness. No breathlessness reported.',
    'No known chronic illness reported. Drug allergies: Not documented.',
    'BP: 118/76 mmHg, Pulse: 82/min, Temperature: 37.4 C, SpO2: 98% on room air.',
    'Alert and comfortable at rest. Mild throat redness noted.',
    'Upper respiratory symptoms. Provisional impression only.',
    'Rest and adequate oral fluids. Review if symptoms persist or worsen. Seek urgent care for breathing difficulty.',
    '',
    'Review in 3 days if not improving.'
  ];
  const areas = p.locator('.m-opd-form textarea');
  for (let i = 0; i < secs.length; i++) await areas.nth(i).fill(secs[i]);
  await inputs.nth(4).fill('Dr. Demo Clinician (synthetic)');
  await p.evaluate(() => { document.querySelector('.m-opd-sheet')?.scrollIntoView({ block: 'start' }); });
  await p.waitForTimeout(600);
  await p.screenshot({ path: '/tmp/opd-now-typed.png', fullPage: false });
  // Save
  await p.locator('button:has-text("Save note")').click();
  await p.locator('text=/Note saved/').waitFor({ timeout: 5000 });
  await p.evaluate(() => { document.querySelector('.m-opd-sheet')?.scrollIntoView({ block: 'start' }); });
  await p.waitForTimeout(800);
  await p.screenshot({ path: '/tmp/opd-now-saved.png' });
  // Reload persistence
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  const persisted = await p.evaluate(() => ({
    opdNo: document.querySelectorAll('.m-opd-form input')[0]?.value,
    complaints: document.querySelectorAll('.m-opd-form textarea')[0]?.value?.slice(0, 40),
    doctor: document.querySelectorAll('.m-opd-form input')[4]?.value,
  }));
  console.log('persisted:', JSON.stringify(persisted));
  await p.evaluate(() => { document.querySelector('.m-opd-sheet')?.scrollIntoView({ block: 'start' }); });
  await p.screenshot({ path: '/tmp/opd-now-reloaded.png' });
  // Export
  const dl = p.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  await p.locator('button:has-text("Export text")').click();
  const d = await dl;
  if (d) {
    const path = await d.path();
    const txt = fs.readFileSync(path, 'utf8');
    console.log('export file:', d.suggestedFilename(), '| has footer:', txt.includes('SYNTHETIC DEMO - NOT A REAL PATIENT RECORD'), '| has complaints:', txt.includes('Sore throat and dry cough'), '| has doctor:', txt.includes('Dr. Demo Clinician'));
  } else {
    const state = await p.locator('text=/share sheet|Downloaded|failed/').first().innerText().catch(() => 'none');
    console.log('export: no download event; visible state:', state);
  }
  // Print emulation
  await p.emulateMedia({ media: 'print' });
  await p.waitForTimeout(600);
  await p.screenshot({ path: '/tmp/opd-now-print.png' });
  await ctx.close();
  await b.close();
})();
