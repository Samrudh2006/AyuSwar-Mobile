/**
 * AyuSwar AI — Recording Consent Gate, Modal & Withdraw (Phase 21)
 * test/phase21_recording_consent.test.js
 *
 * Rural-PHC must-have: consultation recording requires an explicit consent
 * screen before the microphone opens, and the promised withdraw path must be
 * reachable from the UI.
 *
 * 1. Behavioral: assertRecordingConsent throws RecordingConsentRequiredError
 *    without a grant, passes after grantRecordingConsent.
 * 2. Behavioral: revokeRecordingConsent clears the grant and a consent text
 *    version change requires re-consent.
 * 3. Static: consultationRecorder.js asserts consent BEFORE getUserMedia.
 * 4. Static: MClinical renders an accessible floating modal (backdrop,
 *    aria-modal dialog, Escape decline, focused agree action).
 * 5. Static: MClinical maps RecordingConsentRequiredError to the consent
 *    phase and wires a reachable withdraw control to revokeRecordingConsent.
 * 6. Static: mobile.css carries the modal/backdrop styles, record-page
 *    clearance and the labeled helpdesk pill rules.
 */

import { readFileSync } from 'node:fs';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};

const results = [];
const record = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, err });
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const rc = await import('../src/mobile/recordingConsent.js');

// 1. Gate behavior: throws without grant, passes after explicit grant
await record('assertRecordingConsent throws without grant and passes after explicit grant', async () => {
  let threw = false;
  try {
    rc.assertRecordingConsent();
  } catch (err) {
    threw = err.name === 'RecordingConsentRequiredError';
  }
  assert(threw, 'expected RecordingConsentRequiredError without a grant');
  rc.grantRecordingConsent();
  assert(rc.assertRecordingConsent() === true, 'expected pass after grant');
  assert(rc.getRecordingConsent()?.version === rc.CONSENT_TEXT_VERSION, 'grant must record the current consent text version');
});

// 2. Revoke and versioned re-consent
await record('revokeRecordingConsent clears the grant; wording change requires re-consent', async () => {
  rc.revokeRecordingConsent();
  assert(rc.getRecordingConsent() === null, 'grant should be cleared after revoke');
  store.set('ayuswar_recording_consent_v1', JSON.stringify({ granted: true, version: '2020-01-01.outdated' }));
  assert(rc.getRecordingConsent() === null, 'outdated consent text version must require re-consent');
});

// 3. Recorder asserts consent before touching the microphone
await record('consultationRecorder asserts consent before getUserMedia', async () => {
  const src = readFileSync(new URL('../src/mobile/consultationRecorder.js', import.meta.url), 'utf8');
  const assertAt = src.indexOf('assertRecordingConsent()');
  const gumAt = src.indexOf('getUserMedia');
  assert(assertAt > -1, 'assertRecordingConsent() call missing');
  assert(gumAt > -1, 'getUserMedia call missing');
  assert(assertAt < gumAt, 'consent assert must run before getUserMedia');
});

// 4. Accessible floating modal wiring
await record('MClinical renders accessible floating consent modal (backdrop, aria-modal, Escape, focus)', async () => {
  const src = readFileSync(new URL('../src/mobile/MClinical.jsx', import.meta.url), 'utf8');
  assert(src.includes('m-consent-backdrop'), 'modal backdrop class missing');
  assert(src.includes('aria-modal="true"'), 'aria-modal dialog semantics missing');
  assert(src.includes("event.key === 'Escape'"), 'Escape decline handler missing');
  assert(src.includes('consentAgreeRef.current?.focus()'), 'agree action focus on open missing');
  assert(src.includes('declineConsent'), 'decline path missing');
});

// 5. Error mapping + reachable withdraw control
await record('MClinical maps consent error to modal and wires withdraw to revokeRecordingConsent', async () => {
  const src = readFileSync(new URL('../src/mobile/MClinical.jsx', import.meta.url), 'utf8');
  assert(src.includes('RecordingConsentRequiredError'), 'consent error import/use missing');
  assert(src.includes("setPhase('consent')"), 'consent phase transition missing');
  assert(src.includes('revokeRecordingConsent'), 'revoke import missing');
  assert(src.includes('withdrawConsent'), 'withdraw handler missing');
  assert(src.includes('m-consent-withdraw'), 'reachable withdraw control missing');
});

// 6. Styles: modal, record-page clearance, labeled helpdesk pill
await record('mobile.css carries consent modal, record-page clearance and labeled helpdesk pill', async () => {
  const css = readFileSync(new URL('../src/mobile/mobile.css', import.meta.url), 'utf8');
  assert(css.includes('.m-consent-backdrop'), 'backdrop style missing');
  assert(css.includes('.m-consent-modal'), 'modal style missing');
  assert(css.includes('.m-record-page { padding-bottom: 170px; }'), 'record-page clearance missing');
  assert(css.includes('floating-assistant-mobile-label'), 'labeled helpdesk pill rule missing');
});

let failed = 0;
for (const r of results) {
  if (!r.ok) {
    failed += 1;
    console.error(`  FAIL  ${r.name}: ${r.err?.message || r.err}`);
  } else {
    console.log(`  PASS  ${r.name}`);
  }
}
if (failed > 0) {
  console.error(`Phase 21: ${failed} of ${results.length} checks failed`);
  process.exit(1);
}
console.log(`Phase 21: ${results.length}/${results.length} recording-consent checks passed`);
