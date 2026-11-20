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

// 3. purge wired to explicit UI (full-scope, honest receipts)
await record('DoctorPortal: Purge Local Records button backed by full-scope purge with honest aftermath', async () => {
  const src = readFileSync('src/components/DoctorPortal.jsx', 'utf8');
  assert(src.includes('Purge Local Records'), 'purge button label missing');
  assert(src.includes('handlePurgeOfflineRecords'), 'purge handler missing');
  assert(src.includes('purgeAllOfflineClinicalData'), 'full-scope purge service not imported/used');
  assert(src.includes('result.remainingQueueCount'), 'handler must reflect recomputed remaining count');
  const svc = readFileSync('src/services/offlineSyncService.js', 'utf8');
  assert(svc.includes('export const purgeAllOfflineClinicalData'), 'purgeAllOfflineClinicalData not exported');
  assert(svc.includes('purgeWithConfirmation'), 'purge receipts not used');
  assert(svc.includes('cached_encounters') && svc.includes('cached_vitals') && svc.includes('cached_prescriptions'), 'cache stores not covered by purge');
  assert(svc.includes('deviceKeys'), 'per-key purge receipt (both device keys) missing');
  assert(svc.includes('purgeDeviceKeys'), 'full purge must also purge device keys');
});

// 3b. behavioral: purge clears fallback queue and recomputes remaining
await record('purgeAllOfflineClinicalData: clears records and recomputes honest remaining count', async () => {
  const sync = await import('../src/services/offlineSyncService.js');
  const before = await sync.getPendingOfflineQueue();
  assert(before.length === 3, `expected 3 queued from earlier check, got ${before.length}`);
  const result = await sync.purgeAllOfflineClinicalData();
  assert(result.purged === 3 && result.failed === 0, `expected 3 purged 0 failed, got ${result.purged}/${result.failed}`);
  assert(result.remainingQueueCount === 0, `remaining recomputed to ${result.remainingQueueCount}`);
  const after = await sync.getPendingOfflineQueue();
  assert(after.length === 0, 'queue not actually empty after purge');
  assert(result.deviceKeys && typeof result.deviceKeys === 'object', 'per-key purge receipt missing');
  assert(result.deviceKeys.nativeKeystoreKey === 'not-applicable', `web run must report native key not-applicable, got ${result.deviceKeys.nativeKeystoreKey}`);
  assert(['deleted', 'absent', 'failed'].includes(result.deviceKeys.indexedDbDeviceKey), 'IndexedDB device key outcome must be explicit');
});

// 3c. behavioral failure path: deletion error is reported, not silently zeroed
await record('purge failure path: failed deletions are reported with honest remaining count', async () => {
  const sync = await import('../src/services/offlineSyncService.js');
  await sync.saveOfflineRecord('vital', { bp: '120/80' });
  const realRemove = globalThis.localStorage.removeItem;
  globalThis.localStorage.removeItem = () => { throw new Error('simulated storage failure'); };
  try {
    const result = await sync.purgeAllOfflineClinicalData();
    assert(result.failed > 0, 'failure not reported');
    assert(result.fallbackError === true, 'fallback error flag missing');
    assert(result.remainingQueueCount === 1, `remaining should be 1, got ${result.remainingQueueCount}`);
  } finally {
    globalThis.localStorage.removeItem = realRemove;
  }
  // cleanup so the suite leaves no residue
  await sync.purgeAllOfflineClinicalData();
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
