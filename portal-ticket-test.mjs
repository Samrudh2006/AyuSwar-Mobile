import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport:{width:390,height:844} });
await ctx.addInitScript(() => {
  const seed = [{
    id: 'OPD-APT-201', token: 'OPD-201', patientId: 'DEMO-P001', patientName: 'Lakshmi Amma',
    age: 58, gender: 'Female', doctorName: 'Dr. Demo Clinician (synthetic)',
    specialty: 'General Medicine (demo)', date: 'Tomorrow', offsetDays: 1, time: '10:30 AM',
    mode: 'In-Person OPD', isTeleconsult: false, status: 'Upcoming', chiefComplaint: 'BP review', encounterIndex: 0
  }];
  localStorage.setItem('ayuswar_live_opd_queue', JSON.stringify(seed));
});
const p = await ctx.newPage();
await p.goto('http://localhost:4173/patient-portal', { waitUntil:'domcontentloaded' });
await p.waitForTimeout(3500);
await p.evaluate(() => {
  const el = [...document.querySelectorAll('div')].filter(e => /Book Appointment/i.test(e.textContent) && e.textContent.length < 120).pop();
  el?.click();
});
await p.waitForTimeout(1800);
await p.screenshot({ path:'/tmp/portal-2-appts.png' });
const info = await p.evaluate(() => [...document.querySelectorAll('button')].map(b => b.textContent.trim().slice(0,40)).filter(t => /ticket/i.test(t)));
console.log('ticket buttons:', JSON.stringify(info));
await p.evaluate(() => [...document.querySelectorAll('button')].filter(b => /view.*ticket/i.test(b.textContent)).pop()?.click());
await p.waitForTimeout(1600);
await p.screenshot({ path:'/tmp/portal-3-ticket.png' });
const modalText = await p.evaluate(() => document.body.innerText.match(/OPD Appointment Ticket[\s\S]{0,800}/)?.[0] || 'no modal');
console.log('modal:', modalText.replace(/\n+/g,' | ').slice(0, 700));
await b.close();
