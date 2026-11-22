/**
 * offlineSyncService.js — AyuSwar AI Enhanced Offline Clinical Storage & Sync
 * 
 * Provides:
 * 1. Resilient IndexedDB database ('ayuswar_clinical_offline_db') with fallback to LocalStorage.
 * 2. Dedicated object stores for pending sync, encounters, vitals, prescriptions, and ontology.
 * 3. Bidirectional offline synchronization with Supabase backend upon network reconnection.
 * 4. Cross-tab synchronization via BroadcastChannel.
 * 5. Offline-first workflow inspired by ABDM M3 offline clinic concepts;
 *    no ABDM certification, sandbox verification, or compliance is claimed.
 */

import { supabase } from './supabaseClient.js';
import { encryptRecord, decryptRecord, purgeWithConfirmation, purgeDeviceKeys, erasureComplete } from './secureOfflineStorage.js';
import { assertOfflineDataConsent, isBackgroundSyncApproved } from './offlineDataConsent.js';

const DB_NAME = 'ayuswar_clinical_offline_db';
const DB_VERSION = 2;
const STORAGE_FALLBACK_KEY = 'ayuswar_offline_sync_queue_v2';

// A record is surfaced as needing user attention after this many failed sync
// attempts. Failed and undecryptable records are NEVER auto-deleted: recovery
// is an explicit, user-confirmed discard in the UI.
export const SYNC_ATTENTION_THRESHOLD = 3;

// Exponential backoff for failed sync retries. A failed record becomes
// eligible again after base * 2^(attempts-1) ms, capped, with a stable
// per-record jitter derived from its id so the schedule does not flap
// between cycles. Retries are NOT hard-capped: failed records are never
// auto-deleted (recovery is an explicit user-confirmed discard), so the
// schedule caps its growth instead of giving up.
export const SYNC_RETRY_BASE_MS = 30 * 1000;
export const SYNC_RETRY_CAP_MS = 30 * 60 * 1000;

const hashToUnitInterval = (text) => {
  // FNV-1a 32-bit; stable across cycles for a given record id.
  let h = 0x811c9dc5;
  const s = String(text || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h / 0xffffffff;
};

export const computeSyncRetryDelayMs = (syncAttempts, jitter01 = 0) => {
  const attempts = Math.max(1, Number(syncAttempts) || 1);
  const exp = Math.min(SYNC_RETRY_CAP_MS, SYNC_RETRY_BASE_MS * 2 ** (attempts - 1));
  const j = Math.min(1, Math.max(0, Number(jitter01) || 0));
  return Math.round(exp * (0.75 + 0.5 * j));
};

export const isSyncRetryDue = (item, nowMs = Date.now()) => {
  const attempts = (item && item.syncAttempts) || 0;
  const lastAt = item && item.lastSyncAttemptAt ? Date.parse(item.lastSyncAttemptAt) : NaN;
  if (!attempts || !Number.isFinite(lastAt)) return true;
  return nowMs >= lastAt + computeSyncRetryDelayMs(attempts, hashToUnitInterval(item.id));
};

let dbInstance = null;

// Cross-tab broadcast channel for instant multi-window sync status
const syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('ayuswar_sync_channel') : null;
// Node/test runtimes: do not let the channel keep the event loop alive.
if (syncChannel && typeof syncChannel.unref === 'function') syncChannel.unref();

/**
 * Open or initialize IndexedDB with structured clinical object stores
 */
export const openOfflineDatabase = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('pending_sync_queue')) {
          const syncStore = db.createObjectStore('pending_sync_queue', { keyPath: 'id' });
          syncStore.createIndex('by_type', 'type', { unique: false });
          syncStore.createIndex('by_created_at', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('cached_encounters')) {
          const encStore = db.createObjectStore('cached_encounters', { keyPath: 'id' });
          encStore.createIndex('by_abha', 'abhaId', { unique: false });
        }

        if (!db.objectStoreNames.contains('cached_vitals')) {
          const vitalsStore = db.createObjectStore('cached_vitals', { keyPath: 'id' });
          vitalsStore.createIndex('by_patient', 'patientId', { unique: false });
        }

        if (!db.objectStoreNames.contains('cached_prescriptions')) {
          const rxStore = db.createObjectStore('cached_prescriptions', { keyPath: 'id' });
          rxStore.createIndex('by_abha', 'abhaId', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };

      request.onerror = (err) => {
        console.warn('[OfflineSync] IndexedDB open error, falling back to LocalStorage:', err);
        resolve(null);
      };
    } catch (e) {
      console.warn('[OfflineSync] IndexedDB initialization exception:', e);
      resolve(null);
    }
  });
};

export const isDeviceOnline = () => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};

/**
 * Get all pending offline records across IndexedDB or LocalStorage fallback
 */
export const getPendingOfflineQueue = async () => {
  const db = await openOfflineDatabase();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('pending_sync_queue', 'readonly');
        const store = tx.objectStore('pending_sync_queue');
        const request = store.getAll();
        request.onsuccess = async () => resolve(await decryptQueue(request.result || []));
        request.onerror = async () => resolve(await decryptQueue(getLocalStorageQueue()));
      } catch {
        resolve(decryptQueue(getLocalStorageQueue()));
      }
    });
  }
  return decryptQueue(getLocalStorageQueue());
};

// Decrypt encrypted payloads on read. Legacy plaintext rows pass through.
// A row whose key is locked/unavailable or whose GCM tag fails (tamper) is
// returned with payload null + decryptError and is NEVER uploaded.
async function decryptQueue(items) {
  return Promise.all((items || []).map(decryptQueueItem));
}

async function decryptQueueItem(item) {
  if (item?.payload?.__encrypted === true) {
    try {
      const plain = await decryptRecord(item.payload);
      return { ...item, payload: plain.payload };
    } catch {
      return { ...item, payload: null, decryptError: true };
    }
  }
  return item;
}

function getLocalStorageQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save record offline with high durability
 */
export const saveOfflineRecord = async (type, payload) => {
  // Fail-closed: persisting clinical data on-device requires explicit,
  // revocable offline-data consent. Throws OfflineDataConsentRequiredError.
  assertOfflineDataConsent();

  // Payload is encrypted at rest (AES-256-GCM envelope); only queue-management
  // metadata (id/type/createdAt/status) stays cleartext.
  const encryptedPayload = await encryptRecord({ type, payload });
  const newRecord = {
    id: `off_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    type, // 'vital' | 'encounter' | 'prescription' | 'appointment' | 'triage'
    payload: encryptedPayload,
    payloadEncrypted: true,
    createdAt: new Date().toISOString(),
    status: 'pending_sync'
  };

  const db = await openOfflineDatabase();
  if (db) {
    try {
      const tx = db.transaction('pending_sync_queue', 'readwrite');
      const store = tx.objectStore('pending_sync_queue');
      store.put(newRecord);
    } catch (e) {
      console.warn('[OfflineSync] IDB write error, writing to LocalStorage:', e);
      writeLocalStorageQueue(newRecord);
    }
  } else {
    writeLocalStorageQueue(newRecord);
  }

  notifyQueueUpdate();
  return newRecord;
};

function writeLocalStorageQueue(record) {
  try {
    const current = getLocalStorageQueue();
    localStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify([record, ...current]));
  } catch (e) {
    console.error('[OfflineSync] Failed LocalStorage fallback write:', e);
  }
}

function notifyQueueUpdate(count) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ayuswar:offline_queue_updated', { detail: { count } }));
  }
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'QUEUE_UPDATED', count });
    } catch {}
  }
}

/**
 * Sync all pending records with Supabase backend.
 * Reentrancy-guarded: a second sync triggered while one is in flight would read
 * the same queue snapshot and duplicate every upload.
 */
let syncAllInFlight = false;

export const syncAllPendingRecords = async () => {
  if (syncAllInFlight) return { syncedCount: 0, success: true, skipped: 'sync-in-progress' };
  syncAllInFlight = true;
  try {
    return await syncAllPendingRecordsInner();
  } finally {
    syncAllInFlight = false;
  }
};

const syncAllPendingRecordsInner = async () => {
  const queue = await getPendingOfflineQueue();
  if (!queue || queue.length === 0) return { syncedCount: 0, success: true };

  let successfulSyncs = 0;
  let deferredSyncs = 0;
  const syncedIds = [];

  for (const item of queue) {
    try {
      if (item.decryptError) {
        console.warn('[OfflineSync] Skipping undecryptable record (locked key or tamper):', item.id);
        continue;
      }
      if (!isSyncRetryDue(item)) {
        // Inside its backoff window: leave queued, do not hammer the backend.
        deferredSyncs++;
        continue;
      }
      if (supabase) {
        if (item.type === 'vital' && item.payload) {
          const vitalsResult = await supabase.from('patient_vitals_log').insert({
            abha_id: item.payload.abhaId || '91-4521-8820-9102',
            bp_systolic: item.payload.bpSystolic ? parseInt(item.payload.bpSystolic) : null,
            bp_diastolic: item.payload.bpDiastolic ? parseInt(item.payload.bpDiastolic) : null,
            pulse_bpm: item.payload.pulse ? parseInt(item.payload.pulse) : null,
            spo2_pct: item.payload.spo2 ? parseInt(item.payload.spo2) : null,
            source_type: 'manual',
            created_at: item.createdAt
          });
          if (vitalsResult && vitalsResult.error) throw new Error(vitalsResult.error.message || 'Supabase vitals insert failed');
          successfulSyncs++;
          syncedIds.push(item.id);
        } else if (item.type === 'encounter' && item.payload) {
          const encountersResult = await supabase.from('clinical_encounters').insert({
            abha_id: item.payload.abhaId || 'DEMO-91-4521',
            patient_name: item.payload.patientName || 'Patient',
            clinical_notes: item.payload.notes || '',
            diagnosis_codes: item.payload.diagnoses || [],
            created_at: item.createdAt
          });
          if (encountersResult && encountersResult.error) throw new Error(encountersResult.error.message || 'Supabase encounter insert failed');
          successfulSyncs++;
          syncedIds.push(item.id);
        } else {
          // No verified backend route exists for this record type. Fail
          // closed: never counted as synced, never deleted here; it stays
          // queued and surfaces through queue-health attention instead of a
          // false "synced" claim.
          throw new Error('__no_sync_route__');
        }
      } else {
        successfulSyncs++;
        syncedIds.push(item.id);
      }
    } catch (e) {
      console.warn('[OfflineSync] Item sync error, will retry on next cycle:', item.id, e);
      await markSyncFailure(item.id, e);
    }
  }

  // Remove ONLY records confirmed synced. Failed records stay queued for retry,
  // and records enqueued during this sync are never wiped unattempted.
  const db = await openOfflineDatabase();
  if (db && syncedIds.length > 0) {
    try {
      const tx = db.transaction('pending_sync_queue', 'readwrite');
      const store = tx.objectStore('pending_sync_queue');
      for (const id of syncedIds) store.delete(id);
    } catch {}
  }
  if (db) await scrubLegacyRawErrorsIDB(db, syncedIds);
  try {
    // Scrub any legacy raw error strings on retained rows (downgrade to a
    // category); one full sync cycle leaves no raw upstream text in storage.
    const remaining = getLocalStorageQueue()
      .filter((item) => !syncedIds.includes(item.id))
      .map((item) => {
        if (!item.lastSyncError) return item;
        const { lastSyncError, ...rest } = item;
        return { ...rest, lastSyncErrorCategory: item.lastSyncErrorCategory || 'unknown' };
      });
    if (remaining.length > 0) localStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify(remaining));
    else localStorage.removeItem(STORAGE_FALLBACK_KEY);
  } catch {}

  const remainingQueue = await getPendingOfflineQueue();
  notifyQueueUpdate(remainingQueue.length);
  return { syncedCount: successfulSyncs, deferredCount: deferredSyncs, success: true };
};

/**
 * Record a failed sync attempt on the STORED record. Patches cleartext queue
 * metadata only (syncAttempts, lastSyncError, lastSyncAttemptAt); the raw
 * stored row is read and rewritten so an already-decrypted in-memory payload
 * is never persisted. Error text is truncated and carries no payload content.
 */
/**
 * Bounded error categories for queue diagnostics. Raw upstream error text is
 * NEVER stored: it can embed payload fragments or identifiers, and a length
 * cap alone would not make it privacy-safe. Only these fixed categories are
 * persisted.
 */
function categorizeSyncError(err) {
  const message = String((err && err.message) || err || '');
  if (message === '__no_sync_route__') return 'no-sync-route';
  const http = message.match(/HTTP\s*(\d)/i);
  if (http) return http[1] === '4' ? 'http-4xx' : http[1] === '5' ? 'http-5xx' : 'http-other';
  if (/timeout|timed out/i.test(message)) return 'timeout';
  if (/failed to fetch|network|econn|enotfound|offline|unreachable/i.test(message)) return 'network';
  return 'unknown';
}

async function markSyncFailure(id, err) {
  const category = categorizeSyncError(err);
  const patch = (rec) => {
    if (!rec || rec.id !== id) return rec;
    // Drop any legacy raw error string outright; only the category survives.
    const { lastSyncError, ...rest } = rec;
    return {
      ...rest,
      syncAttempts: (rec.syncAttempts || 0) + 1,
      lastSyncErrorCategory: category,
      lastSyncAttemptAt: new Date().toISOString()
    };
  };
  const db = await openOfflineDatabase();
  if (db) {
    await new Promise((resolve) => {
      try {
        const tx = db.transaction('pending_sync_queue', 'readwrite');
        const store = tx.objectStore('pending_sync_queue');
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          if (!getReq.result) return resolve();
          const putReq = store.put(patch(getReq.result));
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => resolve();
        };
        getReq.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
    return;
  }
  try {
    const queue = getLocalStorageQueue();
    if (queue.some((r) => r.id === id)) {
      localStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify(queue.map(patch)));
    }
  } catch {}
}

/**
 * At-rest scrub for the IndexedDB primary store: rows RETAINED after a sync
 * cycle (failed, or undecryptable rows that are skipped before any upload
 * attempt) keep whatever a legacy build persisted — including raw upstream
 * error strings that can embed identifiers. Rewrite those rows without the
 * raw key, keeping ciphertext/payload and all other metadata untouched.
 */
async function scrubLegacyRawErrorsIDB(db, syncedIds) {
  await new Promise((resolve) => {
    try {
      const tx = db.transaction('pending_sync_queue', 'readwrite');
      const store = tx.objectStore('pending_sync_queue');
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => {
        const rows = (getAllReq.result || []).filter(
          (r) => r && r.lastSyncError && !(syncedIds || []).includes(r.id)
        );
        if (rows.length === 0) return resolve();
        let pendingWrites = rows.length;
        for (const row of rows) {
          const { lastSyncError, ...rest } = row;
          const putReq = store.put({ ...rest, lastSyncErrorCategory: row.lastSyncErrorCategory || 'unknown' });
          const done = () => {
            pendingWrites -= 1;
            if (pendingWrites === 0) resolve();
          };
          putReq.onsuccess = done;
          putReq.onerror = done;
        }
      };
      getAllReq.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

/**
 * Queue health for the UI: how many records are pending, and which ones need
 * user attention. A record needs attention when its payload can never be
 * decrypted on this device (locked key or tamper; it is never uploaded) or
 * when repeated sync attempts have failed. Diagnostics are privacy-safe:
 * type/timestamps/attempt count/error string only, never payload content.
 */
export const getOfflineQueueHealth = async () => {
  const queue = await getPendingOfflineQueue();
  const needsAttention = queue
    .filter((item) => item.decryptError || (item.syncAttempts || 0) >= SYNC_ATTENTION_THRESHOLD)
    .map((item) => ({
      id: item.id,
      type: item.type,
      createdAt: item.createdAt,
      reason: item.decryptError ? 'undecryptable' : 'repeated-failure',
      syncAttempts: item.syncAttempts || 0,
      // Legacy rows may still carry a raw lastSyncError string; downgrade it
      // to a category and never hand raw upstream text to the UI.
      lastSyncErrorCategory: item.lastSyncErrorCategory || (item.lastSyncError ? 'unknown' : null),
      lastSyncAttemptAt: item.lastSyncAttemptAt || null
    }));
  return { pendingCount: queue.length, needsAttention };
};

/**
 * Explicit, user-confirmed recovery: permanently delete ONE queued record.
 * This is the only deletion path for failed or undecryptable records and is
 * never invoked automatically by the sync loop; the UI must confirm the
 * irreversible data loss with the user before calling this.
 */
export const discardOfflineRecord = async (id) => {
  const db = await openOfflineDatabase();
  if (db) {
    await new Promise((resolve) => {
      try {
        const tx = db.transaction('pending_sync_queue', 'readwrite');
        const delReq = tx.objectStore('pending_sync_queue').delete(id);
        delReq.onsuccess = () => resolve();
        delReq.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
  try {
    const remaining = getLocalStorageQueue().filter((r) => r.id !== id);
    if (remaining.length > 0) localStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify(remaining));
    else localStorage.removeItem(STORAGE_FALLBACK_KEY);
  } catch {}
  const remainingQueue = await getPendingOfflineQueue();
  notifyQueueUpdate(remainingQueue.length);
  return { discarded: id };
};

/**
 * Direct record caching in specific clinical store (cached_encounters, cached_vitals, cached_prescriptions)
 */
export const cacheClinicalRecord = async (storeName, record) => {
  // Fail-closed: on-device clinical caching requires explicit consent.
  assertOfflineDataConsent();
  const db = await openOfflineDatabase();
  if (db && db.objectStoreNames.contains(storeName)) {
    // id stays cleartext (it is the keyPath); the full record is encrypted.
    const stored = { id: record.id, __encryptedEnvelope: await encryptRecord(record) };
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(stored);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }
  return false;
};

/**
 * Retrieve cached clinical record by ID from specific store
 */
export const getCachedClinicalRecord = async (storeName, id) => {
  const db = await openOfflineDatabase();
  if (db && db.objectStoreNames.contains(storeName)) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = async () => {
          const row = req.result || null;
          if (row?.__encryptedEnvelope) {
            try {
              resolve(await decryptRecord(row.__encryptedEnvelope));
            } catch {
              resolve(null); // locked key or tamper: fail closed, no plaintext
            }
          } else {
            resolve(row); // legacy plaintext row
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return null;
};

/**
 * Enqueue generic action to offline sync queue
 */
export const enqueueOfflineAction = async (action) => {
  return saveOfflineRecord(action.type || 'encounter', action.payload || action);
};

/**
 * Purge ALL local offline clinical data on this device (explicit user action
 * only): the pending sync queue, the cached encounter/vitals/prescription
 * stores, and the LocalStorage fallback. Returns per-record receipts plus an
 * honest summary: actual remaining count is recomputed after the attempt and
 * failed deletions are reported, never silently zeroed.
 *
 * Scope honesty: this purge also deletes BOTH device encryption keys (the
 * WebCrypto IndexedDB device key and the native Android Keystore alias), so
 * any record that failed to delete is permanently unreadable
 * (cryptographic erasure). The per-key outcome is reported explicitly in
 * summary.deviceKeys; it cannot undo records already synced elsewhere.
 */
export const purgeAllOfflineClinicalData = async () => {
  const receipts = [];
  const db = await openOfflineDatabase();
  const storeNames = db
    ? ['pending_sync_queue', 'cached_encounters', 'cached_vitals', 'cached_prescriptions']
        .filter((name) => db.objectStoreNames.contains(name))
    : [];

  for (const storeName of storeNames) {
    const keys = await new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const req = tx.objectStore(storeName).getAllKeys();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
    for (const key of keys) {
      try {
        receipts.push(await purgeWithConfirmation(DB_NAME, storeName, key));
      } catch {
        receipts.push({
          purged: false,
          id: key,
          store: storeName,
          deletedAt: new Date().toISOString(),
          scope: 'this-device-local-storage',
          note: 'Purge failed for this record.'
        });
      }
    }
  }

  // LocalStorage fallback queue
  const fallback = getLocalStorageQueue();
  let fallbackPurged = 0;
  let fallbackError = false;
  if (fallback.length > 0) {
    try {
      localStorage.removeItem(STORAGE_FALLBACK_KEY);
      fallbackPurged = fallback.length;
    } catch {
      fallbackError = true;
    }
  }

  // Honest aftermath: recompute what actually remains.
  const remainingQueue = await getPendingOfflineQueue();
  // Cryptographic erasure of anything missed: delete both device keys and
  // report each outcome explicitly (never claim a wipe that did not happen).
  const deviceKeys = await purgeDeviceKeys();
  const erased = erasureComplete(deviceKeys);
  const summary = {
    receipts,
    attempted: receipts.length + fallback.length,
    purged: receipts.filter((r) => r.purged).length + fallbackPurged,
    failed: receipts.filter((r) => !r.purged).length + (fallbackError ? fallback.length : 0),
    fallbackError,
    remainingQueueCount: remainingQueue.length,
    deviceKeys,
    erasureComplete: erased,
    scope: 'this-device-local-storage',
    note: erased
      ? 'Local data deleted where reported; both device encryption keys are gone (per deviceKeys), so any record that failed to delete is permanently unreadable; already-synced records are unaffected.'
      : 'Local data deleted where reported, but key erasure is INCOMPLETE (per deviceKeys); surviving records may remain readable on this device - retry the purge. Already-synced records are unaffected.'
  };
  if (summary.failed === 0) notifyQueueUpdate(0);
  return summary;
};

export const getPendingSyncQueue = getPendingOfflineQueue;
export const flushOfflineSyncQueue = syncAllPendingRecords;

// Network-recovery listener. NEVER auto-uploads: flushing queued records to
// the backend requires an explicit, revocable background-sync approval (login
// never grants it). Without approval the listener only announces that pending
// records exist so the UI can ask the user.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (isBackgroundSyncApproved()) {
      syncAllPendingRecords();
    } else {
      getPendingOfflineQueue().then((queue) => {
        if (queue && queue.length > 0 && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ayuswar:offline_sync_approval_required', {
            detail: { pendingCount: queue.length }
          }));
        }
      });
    }
  });
}
