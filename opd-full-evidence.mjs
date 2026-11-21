import { chromium } from 'playwright';
import fs from 'node:fs';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const p = await ctx.newPage();
  // OPD note: fill, save, full-sheet capture, real A4 print PDF
  await p.goto('http://localhost:4173/opd-note', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
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
  await p.waitForTimeout(600);
  await p.locator('button:has-text("Save note")').click();
  await p.locator('text=/Note saved/').waitFor({ timeout: 5000 });
  await p.waitForTimeout(700);
  // full sheet element capture (entire height, beyond viewport)
  await p.locator('.m-opd-sheet').screenshot({ path: '/tmp/opd-sheet-full.png' });
  console.log('sheet full captured');
  await p.pdf({ path: '/tmp/opd-now-print-a4.pdf', format: 'A4', printBackground: true });
  console.log('opd a4 pdf written');
  // Ticket: QR decode evidence
  await p.addInitScript(() => localStorage.setItem('ayuswar_demo_mode', 'true'));
  await p.goto('http://localhost:4173/appointment-ticket', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  const qr = await p.evaluate(() => {
    const img = document.querySelector('img[src^="data:image"]');
    const ref = (document.body.innerText.match(/demo_appt_\d+|AS-DEMO-[A-Z0-9]+/) || [])[0] || null;
    return img ? { src: img.src, ref } : { src: null, ref };
  });
  console.log('booking ref on ticket:', qr.ref);
  if (qr.src) fs.writeFileSync('/tmp/ticket-qr-b64.txt', qr.src);
  console.log('qr data url saved:', !!qr.src);
  await ctx.close();
  await b.close();
})();
