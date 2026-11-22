/**
 * AyuSwar AI — Phase 47: Offline Queue Failure Visibility & Recovery
 * test/phase47_offline_recovery.test.js
 *
 * The queue is append-only inserts: no server-side versioning exists, so a
 * write-write "conflict" class cannot occur and is not simulated. The real
 * failure classes covered here:
 *   1. Failed upload attempts are counted on the stored record
 *      (syncAttempts/lastSyncErrorCategory/lastSyncAttemptAt) without ever
 *      touching the stored payload. Only bounded error categories are kept;
 *      raw upstream error text (which can embed identifiers) is never stored.
 *   2. Records at/above SYNC_ATTENTION_THRESHOLD surface via
 *      getOfflineQueueHealth() as 'repeated-failure'; below threshold they
 *      do not.
 *   3. Undecryptable records (locked key / tamper) surface as 'undecryptable'
 *      and are never uploaded.
 *   4. No automatic destruction: repeated failures never delete the record.
 *   5. discardOfflineRecord() (the explicit, user-confirmed UI path) removes
 *      exactly one record and nothing else.
 *   6. A later successful sync still removes the record (existing behavior).
 *   7. UI contract: MClinical wires the health/discard APIs, the confirmed
 *      data-loss copy, and all six locale dicts carry the new keys.
 *
 * Node path: in-memory localStorage fallback (no window.indexedDB), supabase
 * .from() patched. IDB-path behavior is exercised in the browser e2e proof.
 * Synthetic records only.
 */

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

const { supabase } = await import('../src/services/supabaseClient.js');
const sync = await import('../src/services/offlineSyncService.js');
const { readFileSync } = await import('node:fs');

const QUEUE_KEY = 'ayuswar_offline_sync_queue_v2';
const mk = (id, extra = {}) => ({
  id,
  type: 'vital',
  payload: { abhaId: 'SYNTH', pulse: '72' },
  createdAt: new Date().toISOString(),
  status: 'pending_sync',
  ...extra
});
const seedLS = (items) => globalThis.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
const readLS = () => JSON.parse(globalThis.localStorage.getItem(QUEUE_KEY) || '[]');
const failInsert = () => {
  supabase.from = () => ({ insert: () => Promise.resolve({ data: null, error: new Error('HTTP 500 synthetic') }) });
};

await record('failed upload stamps attempts/category on stored record, payload untouched', async () => {
  seedLS([mk('R1')]);
  failInsert();
  await sync.syncAllPendingRecords();
  const rec = readLS().find((i) => i.id === 'R1');
  assert(rec, 'record missing after failed sync');
  assert(rec.syncAttempts === 1, `syncAttempts ${rec.syncAttempts}, expected 1`);
  assert(rec.lastSyncErrorCategory === 'http-5xx', `category ${rec.lastSyncErrorCategory}`);
  assert(typeof rec.lastSyncAttemptAt === 'string', 'lastSyncAttemptAt not set');
  assert(JSON.stringify(rec.payload) === JSON.stringify({ abhaId: 'SYNTH', pulse: '72' }), 'stored payload was modified');
});

await record('below attention threshold, health does not flag; at threshold it flags repeated-failure', async () => {
  seedLS([mk('R2', { syncAttempts: sync.SYNC_ATTENTION_THRESHOLD - 1 })]);
  failInsert();
  let health = await sync.getOfflineQueueHealth();
  assert(health.pendingCount === 1, `pendingCount ${health.pendingCount}`);
  assert(health.needsAttention.length === 0, 'flagged below threshold');
  await sync.syncAllPendingRecords(); // reaches threshold
  health = await sync.getOfflineQueueHealth();
  assert(health.needsAttention.length === 1, 'not flagged at threshold');
  const item = health.needsAttention[0];
  assert(item.reason === 'repeated-failure', `reason ${item.reason}`);
  assert(item.syncAttempts === sync.SYNC_ATTENTION_THRESHOLD, `attempts ${item.syncAttempts}`);
  assert(item.lastSyncErrorCategory === 'http-5xx', `category ${item.lastSyncErrorCategory}`);
  assert(!('payload' in item), 'health diagnostic leaked payload');
});

await record('undecryptable record flagged, never uploaded, no attempts counted', async () => {
  seedLS([mk('R3', { payload: { __encrypted: true, algorithm: 'AES-256-GCM-KEYSTORE', ciphertext: 'AAAA' }, payloadEncrypted: true })]);
  let uploads = 0;
  supabase.from = () => ({ insert: () => { uploads++; return Promise.resolve({ data: [{}], error: null }); } });
  await sync.syncAllPendingRecords();
  assert(uploads === 0, 'undecryptable record was uploaded');
  const health = await sync.getOfflineQueueHealth();
  assert(health.needsAttention.length === 1 && health.needsAttention[0].reason === 'undecryptable', 'not flagged undecryptable');
  assert(health.needsAttention[0].syncAttempts === 0, 'attempts counted for a record never attempted');
});

await record('no automatic destruction: repeated failures retain the record', async () => {
  seedLS([mk('R4')]);
  failInsert();
  for (let i = 0; i < 5; i++) await sync.syncAllPendingRecords();
  const rec = readLS().find((i) => i.id === 'R4');
  assert(rec, 'record auto-deleted after repeated failures');
  assert(rec.syncAttempts === 5, `syncAttempts ${rec.syncAttempts}, expected 5`);
});

await record('discardOfflineRecord removes exactly one record', async () => {
  seedLS([mk('R5a', { syncAttempts: 4 }), mk('R5b', { syncAttempts: 4 })]);
  await sync.discardOfflineRecord('R5a');
  const after = readLS();
  assert(!after.some((i) => i.id === 'R5a'), 'discarded record still present');
  assert(after.some((i) => i.id === 'R5b'), 'unrelated record was removed');
  const health = await sync.getOfflineQueueHealth();
  assert(health.pendingCount === 1 && health.needsAttention.length === 1, 'health not updated after discard');
});

await record('encounter insert error retains record + counts attempt; acknowledged success deletes', async () => {
  seedLS([{ id: 'R8', type: 'encounter', payload: { abhaId: 'SYNTH', patientName: 'Synthetic', notes: '' }, createdAt: new Date().toISOString(), status: 'pending_sync' }]);
  failInsert();
  let res = await sync.syncAllPendingRecords();
  assert(res.syncedCount === 0, `failed encounter counted synced: ${res.syncedCount}`);
  let rec = readLS().find((i) => i.id === 'R8');
  assert(rec && rec.syncAttempts === 1, 'failed encounter not retained with attempt');
  supabase.from = () => ({ insert: () => Promise.resolve({ data: [{}], error: null }) });
  res = await sync.syncAllPendingRecords();
  assert(res.syncedCount === 1, `acknowledged encounter not synced: ${res.syncedCount}`);
  assert(!readLS().some((i) => i.id === 'R8'), 'acknowledged encounter not removed');
});

await record('record type without a backend route is never counted synced and never deleted', async () => {
  seedLS([{ id: 'R9', type: 'appointment', payload: { note: 'synthetic' }, createdAt: new Date().toISOString(), status: 'pending_sync' }]);
  supabase.from = () => ({ insert: () => Promise.resolve({ data: [{}], error: null }) });
  const res = await sync.syncAllPendingRecords();
  assert(res.syncedCount === 0, `route-less record counted synced: ${res.syncedCount}`);
  const rec = readLS().find((i) => i.id === 'R9');
  assert(rec, 'route-less record was deleted');
  assert(rec.lastSyncErrorCategory === 'no-sync-route', `category ${rec.lastSyncErrorCategory}`);
});

await record('error categories are bounded; raw upstream text/identifiers never stored', async () => {
  const cases = [
    ['HTTP 500 patient abha 91-4521-8820-9102', 'http-5xx'],
    ['HTTP 404 record 91-4521 not found', 'http-4xx'],
    ['Failed to fetch 91-4521', 'network'],
    ['request timed out for 91-4521', 'timeout'],
    ['weird provider text 91-4521-8820-9102', 'unknown']
  ];
  for (let i = 0; i < cases.length; i++) {
    const [message, expected] = cases[i];
    seedLS([mk(`RC${i}`)]);
    supabase.from = () => ({ insert: () => Promise.resolve({ data: null, error: new Error(message) }) });
    await sync.syncAllPendingRecords();
    const rec = readLS().find((r) => r.id === `RC${i}`);
    assert(rec.lastSyncErrorCategory === expected, `${message} -> ${rec.lastSyncErrorCategory}, expected ${expected}`);
    const raw = globalThis.localStorage.getItem(QUEUE_KEY);
    assert(!raw.includes('91-4521'), 'raw identifier leaked into stored queue');
  }
});

await record('successful sync still clears the record and attention', async () => {
  seedLS([mk('R6', { syncAttempts: 3, lastSyncErrorCategory: 'http-5xx' })]);
  supabase.from = () => ({ insert: () => Promise.resolve({ data: [{}], error: null }) });
  const res = await sync.syncAllPendingRecords();
  assert(res.syncedCount === 1, `syncedCount ${res.syncedCount}`);
  const health = await sync.getOfflineQueueHealth();
  assert(health.pendingCount === 0 && health.needsAttention.length === 0, 'attention persisted after success');
});

await record('UI contract: MClinical recovery card + confirm copy + six locale dicts', async () => {
  const src = readFileSync('src/mobile/MClinical.jsx', 'utf-8');
  assert(src.includes('getOfflineQueueHealth'), 'MClinical does not read queue health');
  assert(src.includes('discardOfflineRecord'), 'MClinical does not wire discard');
  assert(src.includes('offlineSyncDiscardConfirm'), 'confirmed data-loss copy missing');
  assert(!src.includes('window.confirm'), 'blocking window.confirm used instead of inline confirmation');
  const translations = readFileSync('src/mobile/mobileTranslations.js', 'utf-8');
  for (const locale of ["'en-IN'", "'te-IN'", "'hi-IN'", "'ta-IN'", "'kn-IN'", "'mr-IN'"]) {
    const start = translations.indexOf(`${locale}: {`);
    assert(start >= 0, `locale ${locale} missing`);
    const end = translations.indexOf("'en-IN': {", start + 1);
    const next = translations.slice(start + 1).search(/\n  '[a-z]{2}-IN': \{/);
    const body = translations.slice(start, next === -1 ? translations.length : start + 1 + next);
    for (const key of ['offlineSyncTitle', 'offlineSyncDiscardConfirm', 'offlineSyncUndecryptable', 'offlineSyncRepeatedFailure']) {
      assert(body.includes(`${key}:`), `${locale} missing ${key}`);
    }
    void end;
  }
});

let failed = 0;
for (const r of results) {
  if (r.ok) console.log(`  ✓ ${r.name}`);
  else {
    failed += 1;
    console.error(`  ✗ ${r.name}: ${r.err.message}`);
  }
}
console.log(`offline_recovery: ${results.length - failed}/${results.length} passed (0 conditional skip)`);
process.exit(failed ? 1 : 0);
