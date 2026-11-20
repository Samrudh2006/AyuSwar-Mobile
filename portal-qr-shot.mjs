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
});
const p = await ctx.newPage();
await p.goto('http://localhost:4173/patient-portal', { waitUntil:'domcontentloaded' });
await p.waitForTimeout(3200);
await p.evaluate(() => [...document.querySelectorAll('div')].filter(e => /Book Appointment/i.test(e.textContent) && e.textContent.length < 120).pop()?.click());
await p.waitForTimeout(1500);
await p.evaluate(() => [...document.querySelectorAll('button')].filter(b => /view.*ticket/i.test(b.textContent)).pop()?.click());
await p.waitForTimeout(1600);
await p.evaluate(() => {
  const svgs = [...document.querySelectorAll('svg')].filter(el => {
    const r = el.getBoundingClientRect();
    return r.width >= 100 && r.height >= 100;
  });
  svgs[0]?.scrollIntoView({ block:'center' });
});
await p.waitForTimeout(700);
await p.screenshot({ path:'/tmp/portal-4-qrvisible.png' });
const box = await p.evaluate(() => {
  const svgs = [...document.querySelectorAll('svg')].filter(el => {
    const r = el.getBoundingClientRect();
    return r.width >= 100 && r.height >= 100;
  });
  const r = svgs[0]?.getBoundingClientRect();
  return r ? { x:r.x, y:r.y, width:r.width, height:r.height } : null;
});
if (box) {
  await p.screenshot({ path:'/tmp/portal-qr.png', clip: { x: Math.max(0,box.x-14), y: Math.max(0,box.y-14), width: box.width+28, height: box.height+28 } });
  console.log('qr captured', Math.round(box.width), Math.round(box.height));
} else console.log('no large svg found');
await b.close();
