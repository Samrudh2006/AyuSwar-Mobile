import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

console.log('--- RUNNING PHASE: OPD TICKET MODAL & PORTAL PLACEMENT CONTRACTS ---');

const modal = readFileSync(resolve('src/components/OpdAppointmentTicketModal.jsx'), 'utf8');
const portal = readFileSync(resolve('src/components/PatientPortal.jsx'), 'utf8');

// 1. QR is purposeful, privacy-safe and locally generated
{
  assert.ok(modal.includes('AYUSWAR-TICKET:'), 'ticket QR must carry the booking reference');
  assert.ok(!modal.includes('api.qrserver.com'), 'ticket QR must never be rendered by an external service');
  assert.ok(modal.includes('QRCode.toDataURL'), 'ticket QR must be generated locally');
  assert.ok(modal.includes('No health details in this code'), 'QR caption must state its privacy boundary');
  console.log('✓ Test 1 Passed: ticket QR carries only the booking reference and is generated on-device.');
}

// 2. No invented ticket fields
{
  for (const invented of ["'Ananya Rao'", "'AS-DEMO-1105'", "'Dr. Demo Sharma'", "'Fri, 6 Nov 2026'", "'GM-042'"]) {
    assert.ok(!modal.includes(invented), `modal must not invent fallback ${invented}`);
  }
  assert.ok(modal.includes("'Not recorded'"), 'missing fields must render as Not recorded');
  assert.ok(modal.includes("'Not assigned'"), 'a missing token must render as Not assigned');
  console.log('✓ Test 2 Passed: the ticket never invents patient demographics, refs, dates or tokens.');
}

// 3. Demo framing survives on screen and in print
{
  assert.ok(modal.includes('NOT A REAL HOSPITAL APPOINTMENT'), 'demo band must be present');
  assert.ok(modal.includes('A real ticket is issued only after the hospital confirms the slot'), 'footer must state confirmation reality');
  console.log('✓ Test 3 Passed: ticket keeps honest prototype framing on screen and in print.');
}

// 4. Portal appointment cards open the ticket for their own entry
{
  assert.ok(portal.includes('setShowTicketModal(true)'), 'portal must open the ticket modal');
  assert.ok(portal.includes('ref: appt.bookingRef || appt.id'), 'card action must preserve the selected entry identity');
  assert.ok(portal.includes('date: formatDemoDate(appt.offsetDays || 0)'), 'card action must resolve an exact date, never a floating label');
  assert.ok(portal.includes('no hospital confirmation exists'), 'card action must carry an honest status');
  console.log('✓ Test 4 Passed: every queue appointment card opens the reference ticket with its own data.');
}

// 5. Mobile ticket: demo booking is reachable from an empty queue and never shows a floating "Tomorrow"
{
  const mticket = readFileSync(resolve('src/mobile/MAppointmentTicket.jsx'), 'utf8');
  assert.ok(mticket.includes("date: sampleDate(),"), 'demo booking must resolve an exact date at render, not a floating Tomorrow');
  assert.ok(!mticket.includes("date: 'Tomorrow'"), 'no floating Tomorrow may remain in the demo booking entry');
  const emptyIdx = mticket.indexOf("appointmentsQueue.length === 0");
  assert.ok(emptyIdx > -1, 'empty-queue state must offer the demo booking action');
  const bookIdx = mticket.indexOf('onClick={bookDemoSlot}');
  assert.ok(emptyIdx < bookIdx, 'the empty-queue booking button must render before the queue chooser');
  console.log('✓ Test 5 Passed: demo booking is reachable from an empty queue with an exact render-time date.');
}

// 6. Mobile ticket QR lookup: local resolution against the on-device queue only
{
  const mticket = readFileSync(resolve('src/mobile/MAppointmentTicket.jsx'), 'utf8');
  assert.ok(mticket.includes("replace(/^AYUSWAR-TICKET:/i, '')"), 'lookup must accept a scanned payload and strip the prefix');
  assert.ok(mticket.includes('toLowerCase() === ref.toLowerCase()'), 'lookup matching must be case-insensitive');
  assert.ok(mticket.includes('a.bookingRef, a.id, a.token'), 'lookup must match bookingRef, id or token');
  assert.ok(mticket.includes('No ticket with that reference is stored on this device.'), 'a miss must say so honestly');
  assert.ok(!mticket.includes('for ticket lookup. No health details'), 'caption must not imply an unspecified lookup capability');
  const dicts = readFileSync(resolve('src/mobile/mobileTranslations.js'), 'utf8');
  for (const key of ["'Find ticket'", "'Booking reference'", "'Ticket found on this device.'", "'No ticket with that reference is stored on this device.'"]) {
    const count = (dicts.split(key).length - 1);
    assert.ok(count >= 6, `${key} must exist in all 6 mobile locales, found ${count}`);
  }
  console.log('✓ Test 6 Passed: QR reference lookup resolves locally with an honest miss state and 6-locale strings.');
}
