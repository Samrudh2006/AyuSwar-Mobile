/**
 * appLock.js — AyuSwar AI optional PIN app lock
 *
 * Rural-PHC must-have ("app-lock"). A shared clinic phone can hold synthetic
 * practice data; an optional PIN keeps casual onlookers out of the app.
 *
 * Honest scope: the PIN is stored as a PBKDF2-SHA-256 hash (150k iterations,
 * random salt) in WebView localStorage. This deters casual access; it is NOT
 * Android-Keystore-backed protection and does not claim to be. Biometric
 * unlock needs a native plugin plus physical-device verification and is not
 * claimed here.
 */

const LOCK_STORAGE_KEY = 'ayuswar_app_lock_v1';
const ITERATIONS = 150000;
const encoder = new TextEncoder();

const bytesToHex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hashPin(pin, saltHex, iterations = ITERATIONS) {
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map((h) => parseInt(h, 16)));
  const key = await globalThis.crypto.subtle.importKey('raw', encoder.encode(String(pin)), 'PBKDF2', false, ['deriveBits']);
  const bits = await globalThis.crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return bytesToHex(bits);
}

function readRecord(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(LOCK_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.salt && parsed?.hash && parsed?.iterations) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function isAppLockEnabled(storage = globalThis.localStorage) {
  return readRecord(storage) !== null;
}

export async function enableAppLock(pin, storage = globalThis.localStorage) {
  const pinText = String(pin ?? '');
  if (!/^\d{4,6}$/.test(pinText)) {
    return { ok: false, reason: 'PIN_FORMAT' }; // 4-6 digits
  }
  const saltBytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bytesToHex(saltBytes);
  const hash = await hashPin(pinText, saltHex);
  storage?.setItem(LOCK_STORAGE_KEY, JSON.stringify({ salt: saltHex, hash, iterations: ITERATIONS, createdAt: new Date().toISOString() }));
  return { ok: true };
}

export async function verifyAppLock(pin, storage = globalThis.localStorage) {
  const record = readRecord(storage);
  if (!record) return false;
  const candidate = await hashPin(String(pin ?? ''), record.salt, record.iterations);
  return candidate === record.hash;
}

export async function disableAppLock(pin, storage = globalThis.localStorage) {
  const ok = await verifyAppLock(pin, storage);
  if (!ok) return { ok: false, reason: 'PIN_MISMATCH' };
  storage?.removeItem(LOCK_STORAGE_KEY);
  return { ok: true };
}
