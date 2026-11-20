import { chromium } from 'playwright';

const MODALS = [
  ['my_health', 'Add Vitals Manually'],
  ['appointments', 'Book New Consultation'],
  ['reports', 'Upload New Diagnostic Report'],
  ['medications', 'Add Medication'],
];
const HITTEST = `() => {
  const ov = document.querySelector('.modal-overlay');
  if (!ov) return { open: false };
  const btns = [...ov.querySelectorAll('button, a, input[type="submit"]')].filter(el => el.offsetParent !== null);
  const bad = [];
  for (const b of btns) {
    b.scrollIntoView({ block: 'center' });
    const r = b.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const pts = [[r.left + r.width/2, r.top + r.height/2], [r.left + 4, r.top + 4], [r.right - 4, r.bottom - 4]];
    for (const [x, y] of pts) {
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
      const el = document.elementFromPoint(x, y);
      if (el && !ov.contains(el)) bad.push({ btn: (b.textContent || '').trim().slice(0, 28), blocker: (el.className || el.tagName).toString().slice(0, 60) });
    }
  }
  return { open: true, count: btns.length, bad };
}`;
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  for (const [tab, name] of MODALS) {
    await p.goto(`http://localhost:4173/patient-portal?tab=${tab}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1400);
    const openBtn = p.locator(`button:has-text("${name}")`).first();
    if ((await openBtn.count()) === 0) { console.log(`SKIP  | ${name} | opener not found`); continue; }
    await openBtn.scrollIntoViewIfNeeded(); await p.waitForTimeout(250);
    try { await openBtn.click({ timeout: 5000 }); } catch (e) { console.log(`FAIL  | ${name} | opener not clickable: intercepted`); continue; }
    await p.waitForTimeout(800);
    const res = await p.evaluate(`(${HITTEST})()`);
    if (!res.open) { console.log(`SKIP  | ${name} | modal did not open`); continue; }
    const pill = await p.locator('.floating-assistant-pill').first().isVisible().catch(() => 'err');
    console.log(`${res.bad.length === 0 ? 'PASS' : 'FAIL'}  | ${name} | buttons:${res.count} pill-visible:${pill}${res.bad.length ? ' blockers:' + JSON.stringify(res.bad.slice(0, 3)) : ''}`);
  }
  await b.close();
})();
