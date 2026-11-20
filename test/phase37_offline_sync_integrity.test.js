/**
 * AyuSwar AI — Offline Sync Queue Integrity Regression
 * test/phase37_offline_sync_integrity.test.js
 *
 * Regression coverage for the offline-sync queue bugs found in review:
 *   1. A failed upload (Supabase insert resolving { error }) must NOT be
 *      counted as synced and must NOT be discarded from the queue.
 *   2. Concurrent syncAllPendingRecords() calls must not duplicate uploads.
 *   3. A record enqueued WHILE a sync is running must survive unattempted,
 *      never wiped by queue cleanup.
 * Cases 1-3 run on the localStorage fallback path (no window.indexedDB);
 * cases 4-6 repeat the failure/arrival/all-success scenarios on the
 * IndexedDB path using a minimal in-memory shim, since the queue cleanup
 * touches both stores.
 *
 * Runs fully local: in-memory localStorage + in-memory IndexedDB shim,
 * supabase .from() patched on the shared client object. No network.
 */

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

/* ---------------- localStorage fallback path (no window.indexedDB) ---------------- */

await record('localStorage: failed upload stays queued and is not counted', async () => {
  seedLS([mk('L1a'), mk('L1b')]);
  let n = 0;
  insertCalls = [];
  patchInsert(() => { n++; return Promise.resolve(n === 1 ? { data: null, error: new Error('HTTP 500') } : { data: [{}], error: null }); });
  const res = await sync.syncAllPendingRecords();
  const after = readLS();
  assert(res.syncedCount === 1, `expected syncedCount 1, got ${res.syncedCount}`);
  assert(after.some((i) => i.id === 'L1a'), 'failed record L1a was discarded from queue');
  assert(!after.some((i) => i.id === 'L1b'), 'successful record L1b was not removed');
});

await record('localStorage: concurrent syncs cannot duplicate uploads', async () => {
  seedLS([mk('L2a')]);
  insertCalls = [];
  patchInsert(() => new Promise((r) => setTimeout(() => r({ data: [{}], error: null }), 120)));
  const [r1, r2] = await Promise.all([sync.syncAllPendingRecords(), sync.syncAllPendingRecords()]);
  assert(insertCalls.length === 1, `expected 1 insert, got ${insertCalls.length}`);
  assert(r1.skipped === 'sync-in-progress' || r2.skipped === 'sync-in-progress', 'second concurrent call was not skipped');
});

await record('localStorage: record enqueued mid-sync survives unattempted', async () => {
  seedLS([mk('L3a')]);
  insertCalls = [];
  patchInsert(() => new Promise((r) => setTimeout(() => r({ data: [{}], error: null }), 120)));
  const p = sync.syncAllPendingRecords();
  setTimeout(() => seedLS([...readLS(), mk('L3b')]), 40);
  await p;
  const after = readLS();
  assert(after.some((i) => i.id === 'L3b'), 'mid-sync arrival L3b was wiped unattempted');
  assert(!after.some((i) => i.id === 'L3a'), 'synced record L3a was not removed');
});

/* ---------------- IndexedDB path (minimal in-memory shim) ---------------- */

function makeIDBShim() {
  const dbs = new Map();
  const fire = (fn) => setTimeout(fn, 0);
  const makeStore = (map, keyPath) => ({
    createIndex: () => {},
    getAll: () => { const req = {}; fire(() => { req.result = [...map.values()]; req.onsuccess && req.onsuccess({ target: req }); }); return req; },
    put: (v) => { map.set(v[keyPath], v); const req = {}; fire(() => req.onsuccess && req.onsuccess({ target: req })); return req; },
    delete: (k) => { map.delete(k); const req = {}; fire(() => req.onsuccess && req.onsuccess({ target: req })); return req; },
    clear: () => { map.clear(); const req = {}; fire(() => req.onsuccess && req.onsuccess({ target: req })); return req; }
  });
  const makeDB = () => {
    const stores = new Map();
    return {
      objectStoreNames: { contains: (n) => stores.has(n) },
      createObjectStore: (n, opts = {}) => { const s = makeStore(new Map(), opts.keyPath || 'id'); stores.set(n, s); return s; },
      transaction: (names) => ({ objectStore: (n) => stores.get(n) }),
      _stores: stores
    };
  };
  return {
    open: (name) => {
      const req = {};
      fire(() => {
        let db = dbs.get(name);
        if (!db) { db = makeDB(); dbs.set(name, db); req.onupgradeneeded && req.onupgradeneeded({ target: { result: db } }); }
        req.result = db;
        req.onsuccess && req.onsuccess({ target: req });
      });
      return req;
    }
  };
}

globalThis.window = { indexedDB: makeIDBShim(), dispatchEvent: () => true, addEventListener: () => {}, removeEventListener: () => {} };

const idbQueueStore = async () => {
  const db = await sync.openOfflineDatabase();
  assert(db, 'IndexedDB shim did not open');
  return db._stores.get('pending_sync_queue');
};
const seedIDB = async (items) => {
  const s = await idbQueueStore();
  s.clear();
  await new Promise((r) => setTimeout(r, 5));
  for (const it of items) s.put(it);
  await new Promise((r) => setTimeout(r, 5));
};
const readIDB = async () => (await idbQueueStore()).getAll ? new Promise((resolve) => {
  const req = (async () => (await idbQueueStore()))();
  req.then((s) => { const g = s.getAll(); g.onsuccess = (e) => resolve(e.target.result); });
}) : [];

await record('IndexedDB: failed upload stays queued and is not counted', async () => {
  await seedIDB([mk('I1a'), mk('I1b')]);
  let n = 0;
  insertCalls = [];
  patchInsert(() => { n++; return Promise.resolve(n === 1 ? { data: null, error: new Error('HTTP 500') } : { data: [{}], error: null }); });
  const res = await sync.syncAllPendingRecords();
  const after = await readIDB();
  assert(res.syncedCount === 1, `expected syncedCount 1, got ${res.syncedCount}`);
  assert(after.some((i) => i.id === 'I1a'), 'failed record I1a was discarded from IndexedDB queue');
  assert(!after.some((i) => i.id === 'I1b'), 'successful record I1b was not removed from IndexedDB queue');
});

await record('IndexedDB: record enqueued mid-sync survives unattempted', async () => {
  await seedIDB([mk('I2a')]);
  insertCalls = [];
  patchInsert(() => new Promise((r) => setTimeout(() => r({ data: [{}], error: null }), 120)));
  const p = sync.syncAllPendingRecords();
  setTimeout(async () => { (await idbQueueStore()).put(mk('I2b')); }, 40);
  await p;
  await new Promise((r) => setTimeout(r, 10));
  const after = await readIDB();
  assert(after.some((i) => i.id === 'I2b'), 'mid-sync arrival I2b was wiped unattempted from IndexedDB queue');
  assert(!after.some((i) => i.id === 'I2a'), 'synced record I2a was not removed from IndexedDB queue');
});

await record('IndexedDB: all-successful sync empties the queue', async () => {
  await seedIDB([mk('I3a'), mk('I3b')]);
  insertCalls = [];
  patchInsert(() => Promise.resolve({ data: [{}], error: null }));
  const res = await sync.syncAllPendingRecords();
  const after = await readIDB();
  assert(res.syncedCount === 2, `expected syncedCount 2, got ${res.syncedCount}`);
  assert(after.length === 0, `expected empty queue, found ${after.length} leftover record(s)`);
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
console.log(`phase37_offline_sync_integrity: ${passed}/${results.length} passed`);
if (passed !== results.length) process.exit(1);
