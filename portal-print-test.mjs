import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport:{width:390,height:844} });
await ctx.addInitScript(() => {
  localStorage.setItem('ayuswar_live_opd_queue', JSON.stringify([{
    id: 'OPD-APT-201', token: 'OPD-201', patientId: 'DEMO-P001', patientName: 'Lakshmi Amma',
    age: 58, gender: 'Female', doctorName: 'Dr. Demo Clinician (synthetic)',
    specialty: 'General Medicine (demo)', date: 'Tomorrow', offsetDays: 1, time: '10:30 AM',
    mode: 'In-Person OPD', isTeleconsult: false, status: 'Upcoming', chiefComplaint: 'BP review', encounterIndex: 0
  }]));
  window.__printed = '';
  const origOpen = window.open.bind(window);
  window.open = (...a) => {
    const w = origOpen('about:blank', '_blank');
    const origWrite = w.document.write.bind(w.document);
    w.document.write = (html) => { window.__printed += html; return origWrite(html); };
    return w;
  };
});
const p = await ctx.newPage();
await p.goto('http://localhost:4173/patient-portal', { waitUntil:'domcontentloaded' });
await p.waitForTimeout(3200);
await p.evaluate(() => [...document.querySelectorAll('div')].filter(e => /Book Appointment/i.test(e.textContent) && e.textContent.length < 120).pop()?.click());
await p.waitForTimeout(1500);
await p.evaluate(() => [...document.querySelectorAll('button')].filter(b => /view.*ticket/i.test(b.textContent)).pop()?.click());
await p.waitForTimeout(1600);
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /Print \/ Save PDF/i.test(b.textContent))?.click());
await p.waitForTimeout(1200);
const html = await p.evaluate(() => window.__printed);
console.log('print html length:', html.length);
console.log('external qrserver referenced:', /qrserver/.test(html));
console.log('local data-url qr embedded:', /data:image\/png;base64/.test(html));
console.log('booking ref in print:', /OPD-APT-201/.test(html));
console.log('demo band in print:', /NOT A REAL HOSPITAL APPOINTMENT/.test(html));
await b.close();
