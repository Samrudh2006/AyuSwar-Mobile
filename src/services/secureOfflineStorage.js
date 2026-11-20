/**
 * secureOfflineStorage.js — AyuSwar AI encrypted-at-rest offline storage
 *
 * Wraps the existing IndexedDB offline queue/cache (offlineSyncService.js)
 * with AES-256-GCM encryption via WebCrypto, so queued consultation notes
 * and audio metadata are not stored in plaintext on the device.
 *
 * Honest scope:
 * - The device key is a non-extractable CryptoKey persisted in a dedicated
 *   IndexedDB store. This protects data at rest against casual inspection
 *   and offline DB extraction; it is not a hardware-backed keystore and
 *   does not replace server-side security. On native Android builds the
 *   SQLCipher path (user-suggested plugin) is the stronger option and is
 *   tracked separately.
 * - purgeWithConfirmation() actually deletes records and returns a purge
 *   receipt the UI can surface as the "audio deleted" confirmation the
 *   rural-PHC requirements call for. It cannot guarantee erasure of data
 *   already synced elsewhere; the receipt states what was deleted locally.
 */

const KEY_DB_NAME = 'ayuswar_secure_keys';
const KEY_STORE = 'device_keys';
const KEY_ID = 'offline-storage-aes-gcm-v1';
const GCM_IV_BYTES = 12;

const subtle = () => {
  const c = globalThis.crypto;
  if (!c || !c.subtle) throw new Error('WebCrypto unavailable on this device');
  return c.subtle;
};

function openKeyDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(KEY_DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(KEY_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Test hook: lets unit tests inject a CryptoKey instead of IndexedDB persistence.
// Production code never calls this; the key stays non-extractable either way.
let injectedDeviceKey = null;
export function __setDeviceKeyForTests(key) {
  injectedDeviceKey = key;
}

async function getOrCreateDeviceKey() {
  if (injectedDeviceKey) return injectedDeviceKey;
  const db = await openKeyDb();
  const existing = await new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, 'readonly');
    const req = tx.objectStore(KEY_STORE).get(KEY_ID);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  if (existing) return existing;
  const key = await subtle().generateKey({ name: 'AES-GCM', length: 256 }, false, [
    'encrypt',
    'decrypt'
  ]);
  await new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, 'readwrite');
    tx.objectStore(KEY_STORE).put(key, KEY_ID);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return key;
}

const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (b64) => Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));

export async function encryptRecord(plainObject) {
  const key = await getOrCreateDeviceKey();
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(GCM_IV_BYTES));
  const encoded = new TextEncoder().encode(JSON.stringify(plainObject));
  const cipher = await subtle().encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    __encrypted: true,
    algorithm: 'AES-256-GCM',
    iv: toB64(iv),
    ciphertext: toB64(cipher)
  };
}

export async function decryptRecord(record) {
  if (!record || record.__encrypted !== true) return record; // legacy plaintext row
  const key = await getOrCreateDeviceKey();
  const plain = await subtle().decrypt(
    { name: 'AES-GCM', iv: fromB64(record.iv) },
    key,
    fromB64(record.ciphertext)
  );
  return JSON.parse(new TextDecoder().decode(plain));
}

export function isEncryptedRecord(record) {
  return Boolean(record && record.__encrypted === true && record.iv && record.ciphertext);
}

/**
 * Delete a record from a named IndexedDB store and return a purge receipt
 * suitable for a visible "deleted on this device" confirmation.
 */
export async function purgeWithConfirmation(dbName, storeName, id) {
  const deletedAt = new Date().toISOString();
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const existed = await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(id);
    req.onsuccess = () => resolve(Boolean(req.result));
    req.onerror = () => reject(req.error);
  });
  await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return {
    purged: existed,
    id,
    store: storeName,
    deletedAt,
    scope: 'this-device-local-storage',
    note: existed
      ? 'Deleted from local encrypted offline storage on this device.'
      : 'No local record found; nothing to delete on this device.'
  };
}
