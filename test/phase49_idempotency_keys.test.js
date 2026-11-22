/**
 * AyuSwar AI — Offline Sync Idempotency Keys
 * test/phase49_idempotency_keys.test.js
 *
 * Covers the client-side idempotency-key contract in offlineSyncService:
 *   1. getRecordIdempotencyKey prefers the stored key and falls back to the
 *      queue id for legacy records.
 *   2. When the backend table advertises an idempotency_key column (probe
 *      succeeds), the sync insert payload carries the record's key.
 *   3. A legacy record (no stored key) surfaces its queue id as the key.
 *   4. When the probe fails (PGRST204-style, un-migrated backend), the key
 *      is OMITTED and the insert still succeeds: existing backends keep
 *      syncing unchanged.
 *   5. The probe runs once per table per session (cached).
 *   6. The key is stable across a failed attempt and its backoff retry.
 *   7. Source contract: saveOfflineRecord stamps idempotencyKey at enqueue.
 * Server-side dedupe (UNIQUE + upsert) is documented in
 * docs/OFFLINE-SYNC-IDEMPOTENCY.md and explicitly NOT claimed here.
 * Runs fully local: in-memory localStorage, supabase .from() patched. No network.
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
const mk = (id, extra = {}) => ({ id, type: 'vital', payload: { abhaId: 'X', pulse: '72' }, createdAt: new Date().toISOString(), status: 'pending_sync', ...extra });
const seedLS = (items) => globalThis.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
const readLS = () => JSON.parse(globalThis.localStorage.getItem(QUEUE_KEY) || '[]');
const makeDue = (id) => seedLS(readLS().map((i) => i.id === id
  ? { ...i, lastSyncAttemptAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() }
  : i));

let probeCalls;
let insertCalls;
const patchClient = ({ probeErrors }) => {
  probeCalls = [];
  insertCalls = [];
  supabase.from = (table) => ({
    select: (cols, opts) => {
      probeCalls.push({ table, cols, opts });
      return Promise.resolve(probeErrors
        ? { data: null, error: { code: 'PGRST204', message: "Could not find the 'idempotency_key' column of the table in the schema cache" } }
        : { data: [], error: null });
    },
    insert: (rec) => { insertCalls.push({ table, rec }); return Promise.resolve({ data: [{}], error: null }); }
  });
};

await record('getRecordIdempotencyKey prefers stored key, falls back to queue id', async () => {
  assert(sync.getRecordIdempotencyKey({ id: 'off_1', idempotencyKey: 'ik_1' }) === 'ik_1', 'stored key not preferred');
  assert(sync.getRecordIdempotencyKey({ id: 'off_1' }) === 'off_1', 'legacy fallback to queue id missing');
});

await record('probe success: insert payload carries the stored idempotency key', async () => {
  sync.__resetIdempotencyProbeCacheForTests();
  seedLS([mk('K1', { idempotencyKey: 'ik_stored_K1' })]);
  patchClient({ probeErrors: false });
  const res = await sync.syncAllPendingRecords();
  assert(res.syncedCount === 1, `syncedCount ${res.syncedCount} != 1`);
  assert(insertCalls.length === 1 && insertCalls[0].rec.idempotency_key === 'ik_stored_K1',
    `payload key ${insertCalls[0] && insertCalls[0].rec.idempotency_key} != ik_stored_K1`);
});

await record('legacy record surfaces its queue id as the key', async () => {
  sync.__resetIdempotencyProbeCacheForTests();
  seedLS([mk('K2legacy')]);
  patchClient({ probeErrors: false });
  await sync.syncAllPendingRecords();
  assert(insertCalls.length === 1 && insertCalls[0].rec.idempotency_key === 'K2legacy',
    `payload key ${insertCalls[0] && insertCalls[0].rec.idempotency_key} != K2legacy`);
});

await record('probe failure: key omitted, insert still succeeds (un-migrated backend safe)', async () => {
  sync.__resetIdempotencyProbeCacheForTests();
  seedLS([mk('K3', { idempotencyKey: 'ik_K3' })]);
  patchClient({ probeErrors: true });
  const res = await sync.syncAllPendingRecords();
  assert(res.syncedCount === 1, `syncedCount ${res.syncedCount} != 1 on probe failure`);
  assert(insertCalls.length === 1 && !('idempotency_key' in insertCalls[0].rec),
    'idempotency_key leaked into payload despite failed probe');
});

await record('probe is cached: one probe per table per session', async () => {
  sync.__resetIdempotencyProbeCacheForTests();
  seedLS([mk('K4a'), mk('K4b')]);
  patchClient({ probeErrors: false });
  await sync.syncAllPendingRecords();
  const tableProbes = probeCalls.filter((p) => p.table === 'patient_vitals_log');
  assert(insertCalls.length === 2, `expected 2 inserts, got ${insertCalls.length}`);
  assert(tableProbes.length === 1, `expected 1 cached probe, got ${tableProbes.length}`);
});

await record('key is stable across a failed attempt and its backoff retry', async () => {
  sync.__resetIdempotencyProbeCacheForTests();
  seedLS([mk('K5', { idempotencyKey: 'ik_K5_stable' })]);
  patchClient({ probeErrors: false });
  const seen = [];
  supabase.from = (table) => ({
    select: (cols, opts) => Promise.resolve({ data: [], error: null }),
    insert: (rec) => {
      seen.push(rec.idempotency_key);
      return Promise.resolve(seen.length === 1
        ? { data: null, error: new Error('HTTP 500') }
        : { data: [{}], error: null });
    }
  });
  await sync.syncAllPendingRecords();
  makeDue('K5');
  await sync.syncAllPendingRecords();
  assert(seen.length === 2, `expected 2 attempts, got ${seen.length}`);
  assert(seen[0] === 'ik_K5_stable' && seen[1] === 'ik_K5_stable', `key changed across retry: ${seen[0]} -> ${seen[1]}`);
});

await record('source contract: saveOfflineRecord stamps idempotencyKey at enqueue', async () => {
  const src = readFileSync(new URL('../src/services/offlineSyncService.js', import.meta.url), 'utf8');
  assert(/idempotencyKey:\s*`ik_/.test(src), 'saveOfflineRecord does not stamp an ik_ idempotencyKey');
});

let passed = 0;
for (const r of results) {
  if (r.ok) {
    passed += 1;
    console.log(`✓ ${r.name}`);
  } else {
    console.error(`✗ ${r.name}: ${r.err.message}`);
  }
}
console.log(`phase49_idempotency_keys: ${passed}/${results.length} passed`);
if (passed !== results.length) process.exit(1);
