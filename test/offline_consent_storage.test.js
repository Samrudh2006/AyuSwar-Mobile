/**
 * AyuSwar AI — Offline Consent & Encrypted Storage Verification
 * test/offline_consent_storage.test.js
 *
 * 1. Fail-closed consent: saving on-device clinical records without explicit
 *    offline-data consent throws and stores nothing.
 * 2. With consent, queue payloads are encrypted at rest (AES-256-GCM envelope)
 *    and decrypted on read (legacy plaintext passes through).
 * 3. Tamper/locked-key fail-closed: a corrupted ciphertext is never uploaded
 *    and never crashes the queue.
 * 4. The network-recovery listener is statically gated behind explicit
 *    background-sync approval (never auto-upload).
 *
 * Runs fully local: injected test key, in-memory localStorage, no IndexedDB,
 * no network.
 */

import { readFileSync } from 'node:fs';

// In-memory localStorage BEFORE any module under test reads it
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

// Inject a test device key (Node has WebCrypto but no IndexedDB)
const testKey = await globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
secure.__setDeviceKeyForTests(testKey);

const sync = await import('../src/services/offlineSyncService.js');
const QUEUE_KEY = 'ayuswar_offline_sync_queue_v2';

// 1. Fail-closed: no consent -> throw + nothing stored
await record('no consent: saveOfflineRecord throws OfflineDataConsentRequiredError and stores nothing', async () => {
  let threw = null;
  try {
    await sync.saveOfflineRecord('vital', { bp: '130/84' });
  } catch (err) {
    threw = err;
  }
  assert(threw && threw.name === 'OfflineDataConsentRequiredError', `expected consent error, got ${threw && threw.name}`);
  assert(!store.has(QUEUE_KEY), 'queue must remain empty');
});

// 1b. cacheClinicalRecord also fail-closed without consent
await record('no consent: cacheClinicalRecord throws OfflineDataConsentRequiredError', async () => {
  let threw = null;
  try {
    await sync.cacheClinicalRecord('cached_vitals', { id: 'v1', pulse: 76 });
  } catch (err) {
    threw = err;
  }
  assert(threw && threw.name === 'OfflineDataConsentRequiredError', `expected consent error, got ${threw && threw.name}`);
});

// 2. With consent: encrypted at rest + decrypt-on-read roundtrip
await record('with consent: queue payload is encrypted at rest and decrypts on read', async () => {
  consent.grantOfflineDataConsent();
  const saved = await sync.saveOfflineRecord('vital', { bp: '130/84', pulse: 76 });
  assert(saved.payloadEncrypted === true, 'record not marked encrypted');
  assert(saved.payload && saved.payload.__encrypted === true, 'payload is not an encrypted envelope');
  const raw = JSON.parse(store.get(QUEUE_KEY));
  assert(raw[0].payload.__encrypted === true, 'stored fallback copy is not encrypted');
  assert(!JSON.stringify(raw[0].payload).includes('130/84'), 'plaintext leaked into stored record');
  const queue = await sync.getPendingOfflineQueue();
  assert(queue[0].payload && queue[0].payload.bp === '130/84', 'decrypt-on-read roundtrip failed');
});

// 2b. consent versioning: wrong-version grant does not satisfy the gate
await record('consent record with stale version does not satisfy the gate', async () => {
  store.set('ayuswar_offline_data_consent_v1', JSON.stringify({ granted: true, version: '1999-01-01.old' }));
  assert(consent.getOfflineDataConsent() === null, 'stale consent version accepted');
  consent.grantOfflineDataConsent(); // restore valid consent for later checks
});

// 3. Tamper: corrupted ciphertext -> decryptError, never uploaded
await record('tampered ciphertext: marked decryptError, skipped by sync, queue intact', async () => {
  const raw = JSON.parse(store.get(QUEUE_KEY));
  const env = raw[0].payload;
  const bytes = Uint8Array.from(atob(env.ciphertext), (c) => c.charCodeAt(0));
  bytes[0] ^= 0xff;
  env.ciphertext = btoa(String.fromCharCode(...bytes));
  store.set(QUEUE_KEY, JSON.stringify(raw));
  const queue = await sync.getPendingOfflineQueue();
  assert(queue[0].decryptError === true, 'tamper not detected (GCM tag should fail)');
  assert(queue[0].payload === null, 'payload must be null on tamper');
  const res = await sync.syncAllPendingRecords();
  assert(res.syncedCount === 0, `tampered record was synced (${res.syncedCount})`);
});

// 3b. unique IVs: two encryptions of identical plaintext differ
await record('AES-GCM uses a unique IV per record', async () => {
  const a = await secure.encryptRecord({ x: 'same-plaintext' });
  const b = await secure.encryptRecord({ x: 'same-plaintext' });
  assert(a.iv !== b.iv, 'IV reuse detected');
  assert(a.ciphertext !== b.ciphertext, 'ciphertexts identical for same plaintext');
});

// 3c. legacy plaintext rows pass through decrypt unchanged
await record('legacy plaintext rows pass through decryption unchanged', async () => {
  const legacy = { plain: true, value: 42 };
  const out = await secure.decryptRecord(legacy);
  assert(out === legacy, 'legacy row not passed through');
});

// 4. static: the online listener is gated behind background-sync approval
await record("static: 'online' listener cannot auto-upload without explicit approval", async () => {
  const src = readFileSync('src/services/offlineSyncService.js', 'utf8');
  const listenerIdx = src.indexOf("window.addEventListener('online'");
  assert(listenerIdx !== -1, 'online listener missing');
  const after = src.slice(listenerIdx);
  const gateIdx = after.indexOf('isBackgroundSyncApproved()');
  const flushIdx = after.indexOf('syncAllPendingRecords()');
  assert(gateIdx !== -1 && gateIdx < flushIdx, 'listener flush is not gated behind approval');
  // consent module: approval is never granted implicitly
  const consentSrc = readFileSync('src/services/offlineDataConsent.js', 'utf8');
  assert(!consentSrc.includes('approveBackgroundSync() // auto'), 'auto-approval marker found');
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
console.log(`offline_consent_storage: ${passed}/${results.length} passed`);
if (passed !== results.length) process.exit(1);
