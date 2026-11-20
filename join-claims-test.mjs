// Join-button honesty probe: no false video-session/WebRTC claims.
// Run against `npx vite preview --port 4173`.
import { chromium } from 'playwright';
import assert from 'node:assert';

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
p.setDefaultTimeout(8000);
let passed = 0;
const ok = (name) => { passed++; console.log('PASS', name); };
const dialogs = [];
p.on('dialog', d => { dialogs.push(d.message()); d.accept(); });

// 1. home tab Join button: honest no-session note
await p.goto('http://localhost:4173/patient-portal', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3200);
const joinBtn = p.locator('button', { hasText: /^Join$/ }).first();
assert(await joinBtn.count() === 1, 'home Join button present');
await joinBtn.click();
await p.waitForTimeout(300);
assert(dialogs.length === 1 && dialogs[0].startsWith('Demo preview only') && dialogs[0].includes('No video session was started'),
  'home Join dialog honest: ' + dialogs[0]);
ok('home Join: states no video session was started');

// 2. appointments Join Call button: honest no-WebRTC note.
// Reachability note: the bundled default patient (DEMO-P001) has no upcoming
// teleconsult fixture, so this scenario reseeds the probe browser's
// localStorage queue to assign the bundled OPD-104 teleconsult fixture to the
// active demo patient. Only test-local browser state is modified; app source
// and bundled data are untouched.
await p.goto('http://localhost:4173/patient-portal?tab=appointments', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3200);
await p.evaluate(() => {
  const key = 'ayuswar_live_opd_queue';
  const q = JSON.parse(localStorage.getItem(key) || '[]');
  const t = q.find(a => a.token === 'OPD-104');
  if (t) { t.patientId = 'DEMO-P001'; t.patientName = 'Lakshmi Amma'; }
  localStorage.setItem(key, JSON.stringify(q));
});
await p.reload({ waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3200);
const joinCall = p.locator('button', { hasText: 'Join Call' }).first();
assert(await joinCall.count() >= 1, 'teleconsult Join Call button present');
await joinCall.click();
await p.waitForTimeout(300);
assert(dialogs.length === 2 && dialogs[1].startsWith('Demo preview only') && dialogs[1].includes('teleconsultation is not connected'),
  'appointments Join Call dialog honest: ' + dialogs[1]);
ok('appointments Join Call: no false WebRTC/session claim');

// 3. visible control state: neutral sample chip, no ACTIVE liveness badge
const joinCallText = await joinCall.innerText();
assert(!joinCallText.includes('ACTIVE'), 'no ACTIVE liveness badge: ' + joinCallText);
assert(joinCallText.includes('(sample)'), 'sample chip present: ' + joinCallText);
await joinCall.scrollIntoViewIfNeeded();
await joinCall.screenshot({ path: '/tmp/joincall-control.png' });
ok('Join Call control shows sample chip, no ACTIVE badge');

console.log(`\nJOIN CLAIMS PROBE: ${passed}/3 scenarios passed`);
await b.close();
