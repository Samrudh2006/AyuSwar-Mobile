/**
 * AyuSwar AI — DoctorPortal Offline Consent Regression & Purge Wiring
 * test/doctor_portal_offline_consent.test.js
 *
 * Regression: DoctorPortal's zero-network simulation awaited consent-gated
 * saves with no error path, producing an unhandled
 * OfflineDataConsentRequiredError and a stuck silent flow.
 *
 * 1. queueSampleRuralEncounters NEVER throws: without consent it returns
 *    { ok: false, reason: 'CONSENT_REQUIRED' }; with consent it queues and
 *    returns counts.
 * 2. DoctorPortal source wires the reachable consent UI (prompt state, grant
 *    & retry handler, dismiss) and reverts the simulation toggle on failure.
 * 3. Purge is wired to an explicit UI control backed by purgeAllPendingRecords.
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

const consent = await import('../src/services/offlineDataConsent.js');
const secure = await import('../src/services/secureOfflineStorage.js');
const testKey = await globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
secure.__setDeviceKeyForTests(testKey);
const sim = await import('../src/services/offlineSimulationQueue.js');

// 1a. no consent: structured CONSENT_REQUIRED, never throws
await record('queueSampleRuralEncounters without consent: returns CONSENT_REQUIRED, never throws', async () => {
  const res = await sim.queueSampleRuralEncounters();
  assert(res && res.ok === false && res.reason === 'CONSENT_REQUIRED', `unexpected result: ${JSON.stringify(res)}`);
});

// 1b. with consent: queues 3, encrypted
await record('queueSampleRuralEncounters with consent: queues 3 encrypted records', async () => {
  consent.grantOfflineDataConsent();
  const res = await sim.queueSampleRuralEncounters();
  assert(res.ok === true, `expected ok, got ${JSON.stringify(res)}`);
  assert(res.count === 3, `expected 3 queued, got ${res.count}`);
  const raw = store.get('ayuswar_offline_sync_queue_v2');
  assert(raw && raw.includes('__encrypted'), 'queued records are not encrypted at rest');
});

// 2. DoctorPortal: reachable consent UI + toggle revert
await record('DoctorPortal: consent prompt UI, grant-and-retry, toggle revert are wired', async () => {
  const src = readFileSync('src/components/DoctorPortal.jsx', 'utf8');
  assert(src.includes('queueSampleRuralEncounters'), 'extracted queue module not used');
  assert(src.includes("result.reason === 'CONSENT_REQUIRED'"), 'CONSENT_REQUIRED branch missing');
  assert(src.includes('setIsSimulatingOffline(false)'), 'toggle not reverted on failure');
  assert(src.includes('offlineConsentPrompt &&'), 'consent prompt banner not rendered');
  assert(src.includes('handleGrantOfflineConsentAndRetry'), 'grant-and-retry handler missing');
  assert(src.includes('grantOfflineDataConsent'), 'consent grant not imported/used');
  assert(!/for \(const enc of sampleRuralEncounters\)[\s\S]{0,80}await clinicalOfflineStorage\.saveEncounter/.test(src), 'old unguarded save loop still present');
});

// 3. purge wired to explicit UI
await record('DoctorPortal: Purge Local Records button backed by purgeAllPendingRecords', async () => {
  const src = readFileSync('src/components/DoctorPortal.jsx', 'utf8');
  assert(src.includes('Purge Local Records'), 'purge button label missing');
  assert(src.includes('handlePurgeOfflineRecords'), 'purge handler missing');
  assert(src.includes('purgeAllPendingRecords'), 'purge service not imported/used');
  const svc = readFileSync('src/services/offlineSyncService.js', 'utf8');
  assert(svc.includes('export const purgeAllPendingRecords'), 'purgeAllPendingRecords not exported');
  assert(svc.includes('purgeWithConfirmation'), 'purge receipts not used');
});

// report
let passed = 0;
for (const r of results) {
  if (r.ok) {
    passed += 1;
    console.log(`✓ ${r.name}`);
  } else {
    console.error(`✗ ${r.name}: ${r.err.message}`);
  }
}
console.log(`doctor_portal_offline_consent: ${passed}/${results.length} passed`);
if (passed !== results.length) process.exit(1);
