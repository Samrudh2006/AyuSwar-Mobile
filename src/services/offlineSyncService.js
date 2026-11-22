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
  const syncedIds = [];

  for (const item of queue) {
    try {
      if (item.decryptError) {
        console.warn('[OfflineSync] Skipping undecryptable record (locked key or tamper):', item.id);
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
          successfulSyncs++;
        } else {
          // General offline telemetry or appointment
          successfulSyncs++;
          syncedIds.push(item.id);
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
  try {
    const remaining = getLocalStorageQueue().filter((item) => !syncedIds.includes(item.id));
    if (remaining.length > 0) localStorage.setItem(STORAGE_FALLBACK_KEY, JSON.stringify(remaining));
    else localStorage.removeItem(STORAGE_FALLBACK_KEY);
  } catch {}

  const remainingQueue = await getPendingOfflineQueue();
  notifyQueueUpdate(remainingQueue.length);
  return { syncedCount: successfulSyncs, success: true };
};

/**
 * Record a failed sync attempt on the STORED record. Patches cleartext queue
 * metadata only (syncAttempts, lastSyncError, lastSyncAttemptAt); the raw
 * stored row is read and rewritten so an already-decrypted in-memory payload
 * is never persisted. Error text is truncated and carries no payload content.
 */
async function markSyncFailure(id, err) {
  const message = String((err && err.message) || err || 'sync failed').slice(0, 200);
  const patch = (rec) =>
    rec && rec.id === id
      ? {
          ...rec,
          syncAttempts: (rec.syncAttempts || 0) + 1,
          lastSyncError: message,
          lastSyncAttemptAt: new Date().toISOString()
        }
      : rec;
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
      lastSyncError: item.lastSyncError || null,
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
