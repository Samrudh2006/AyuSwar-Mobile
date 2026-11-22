/**
 * AyuSwar AI — Sync Retry Exponential Backoff
 * test/phase48_sync_backoff.test.js
 *
 * Covers the backoff schedule in offlineSyncService:
 *   1. Delay doubles per failed attempt at fixed jitter.
 *   2. Delay growth is capped no matter how many attempts have failed.
 *   3. Per-record jitter stays within +/-25% and is stable for a record id.
 *   4. isSyncRetryDue: never-attempted is due; just-failed is not; an
 *      attempt older than its window is due again.
 *   5. Integration: a record that failed this cycle is deferred on the
 *      immediate next cycle (no re-upload hammering) and reported via
 *      deferredCount.
 *   6. Integration: once its backoff window has elapsed, the deferred
 *      record is retried.
 * Runs fully local: in-memory localStorage, supabase .from() patched on the
 * shared client object. No network.
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

const QUEUE_KEY = 'ayuswar_offline_sync_queue_v2';
const mk = (id) => ({ id, type: 'vital', payload: { abhaId: 'X', pulse: '72' }, createdAt: new Date().toISOString(), status: 'pending_sync' });
const seedLS = (items) => globalThis.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
const readLS = () => JSON.parse(globalThis.localStorage.getItem(QUEUE_KEY) || '[]');

let insertCalls;
const patchInsert = (fn) => {
  supabase.from = (table) => ({ insert: (rec) => { insertCalls.push({ table, rec }); return fn(rec); } });
};

await record('delay doubles per failed attempt at fixed jitter', async () => {
  const d1 = sync.computeSyncRetryDelayMs(1, 0);
  const d2 = sync.computeSyncRetryDelayMs(2, 0);
  const d3 = sync.computeSyncRetryDelayMs(3, 0);
  assert(d1 === Math.round(sync.SYNC_RETRY_BASE_MS * 0.75), `attempt-1 delay ${d1} != base*0.75`);
  assert(d2 === 2 * d1, `attempt-2 delay ${d2} != 2x attempt-1 (${d1})`);
  assert(d3 === 2 * d2, `attempt-3 delay ${d3} != 2x attempt-2 (${d2})`);
});

await record('delay growth: base capped before jitter, top-end envelope is cap +/-25%', async () => {
  const dLow = sync.computeSyncRetryDelayMs(50, 0);
  const dHigh = sync.computeSyncRetryDelayMs(50, 1);
  assert(dLow === Math.round(sync.SYNC_RETRY_CAP_MS * 0.75), `capped low-jitter delay ${dLow} != cap*0.75`);
  assert(dHigh === Math.round(sync.SYNC_RETRY_CAP_MS * 1.25), `capped high-jitter delay ${dHigh} != cap*1.25`);
  assert(dHigh <= sync.SYNC_RETRY_CAP_MS * 1.25, 'delay exceeded cap plus jitter envelope');
});

await record('jitter stays within +/-25% and is stable per record', async () => {
  const base = sync.SYNC_RETRY_BASE_MS;
  for (let j = 0; j <= 100; j++) {
    const d = sync.computeSyncRetryDelayMs(1, j / 100);
    assert(d >= base * 0.75 - 1 && d <= base * 1.25 + 1, `delay ${d} outside +/-25% envelope at jitter ${j / 100}`);
  }
  const item = { id: 'stable-id', syncAttempts: 2, lastSyncAttemptAt: new Date().toISOString() };
  const first = sync.isSyncRetryDue(item);
  for (let i = 0; i < 100; i++) {
    assert(sync.isSyncRetryDue(item) === first, 'due decision flapped between cycles for the same record');
  }
});

await record('due gate: fresh record due, just-failed not due, elapsed window due', async () => {
  assert(sync.isSyncRetryDue({ id: 'fresh' }) === true, 'never-attempted record was not due');
  const justFailed = { id: 'recent', syncAttempts: 1, lastSyncAttemptAt: new Date().toISOString() };
  assert(sync.isSyncRetryDue(justFailed) === false, 'just-failed record was due inside its backoff window');
  const elapsed = { id: 'recent', syncAttempts: 1, lastSyncAttemptAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() };
  assert(sync.isSyncRetryDue(elapsed) === true, 'record past its backoff window was not due');
});

await record('integration: failed record is deferred on the immediate next cycle', async () => {
  seedLS([mk('B1')]);
  insertCalls = [];
  patchInsert(() => Promise.resolve({ data: null, error: new Error('HTTP 500') }));
  const r1 = await sync.syncAllPendingRecords();
  assert(r1.syncedCount === 0, `first cycle syncedCount ${r1.syncedCount} != 0`);
  assert(insertCalls.length === 1, `first cycle uploads ${insertCalls.length} != 1`);
  const stored1 = readLS().find((i) => i.id === 'B1');
  assert(stored1 && stored1.syncAttempts === 1, `syncAttempts after first failure: ${stored1 && stored1.syncAttempts}`);
  const r2 = await sync.syncAllPendingRecords();
  assert(r2.syncedCount === 0, `second cycle syncedCount ${r2.syncedCount} != 0`);
  assert(r2.deferredCount === 1, `second cycle deferredCount ${r2.deferredCount} != 1`);
  assert(insertCalls.length === 1, `backoff window violated: uploads rose to ${insertCalls.length}`);
  const stored2 = readLS().find((i) => i.id === 'B1');
  assert(stored2 && stored2.syncAttempts === 1, 'deferred record was re-attempted inside its window');
});

await record('integration: record is retried once its backoff window elapses', async () => {
  const queued = readLS();
  const backdated = queued.map((i) => i.id === 'B1'
    ? { ...i, lastSyncAttemptAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() }
    : i);
  seedLS(backdated);
  insertCalls = [];
  patchInsert(() => Promise.resolve({ data: null, error: new Error('HTTP 500') }));
  const r = await sync.syncAllPendingRecords();
  assert(r.deferredCount === 0, `elapsed record was still deferred (deferredCount ${r.deferredCount})`);
  assert(insertCalls.length === 1, `expected 1 retry upload, got ${insertCalls.length}`);
  const stored = readLS().find((i) => i.id === 'B1');
  assert(stored && stored.syncAttempts === 2, `syncAttempts after retry: ${stored && stored.syncAttempts}`);
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
console.log(`phase48_sync_backoff: ${passed}/${results.length} passed`);
if (passed !== results.length) process.exit(1);
