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

/* Wrong-PIN attempt guard: bounds brute-force on a shared clinic phone.
 * After MAX_ATTEMPTS consecutive failures a cooldown starts; each further
 * failure doubles it up to MAX_COOLDOWN_MS. The guard record holds only a
 * failure count and a cooldown timestamp — never the PIN or its hash. */
const GUARD_STORAGE_KEY = 'ayuswar_app_lock_guard_v1';
const MAX_ATTEMPTS = 5;
const BASE_COOLDOWN_MS = 30000;
const MAX_COOLDOWN_MS = 300000;

function readGuard(storage) {
  try {
    const raw = storage?.getItem(GUARD_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return { failures: Number(parsed?.failures) || 0, cooldownUntil: Number(parsed?.cooldownUntil) || 0 };
  } catch {
    return { failures: 0, cooldownUntil: 0 };
  }
}

export function getLockoutState(storage = globalThis.localStorage, now = Date.now()) {
  const guard = readGuard(storage);
  const remaining = guard.cooldownUntil - now;
  return { lockedOut: remaining > 0, retryAfterSeconds: remaining > 0 ? Math.ceil(remaining / 1000) : 0, failures: guard.failures };
}

export async function verifyAppLockGuarded(pin, storage = globalThis.localStorage) {
  const now = Date.now();
  const lockout = getLockoutState(storage, now);
  if (lockout.lockedOut) return { ok: false, reason: 'LOCKED_OUT', retryAfterSeconds: lockout.retryAfterSeconds };
  if (await verifyAppLock(pin, storage)) {
    storage?.removeItem(GUARD_STORAGE_KEY);
    return { ok: true };
  }
  const guard = readGuard(storage);
  const failures = guard.failures + 1;
  let cooldownUntil = 0;
  if (failures >= MAX_ATTEMPTS) {
    const backoff = Math.min(BASE_COOLDOWN_MS * 2 ** (failures - MAX_ATTEMPTS), MAX_COOLDOWN_MS);
    cooldownUntil = now + backoff;
  }
  storage?.setItem(GUARD_STORAGE_KEY, JSON.stringify({ failures, cooldownUntil }));
  const retryAfterSeconds = cooldownUntil > now ? Math.ceil((cooldownUntil - now) / 1000) : 0;
  return { ok: false, reason: cooldownUntil ? 'LOCKED_OUT' : 'PIN_MISMATCH', attemptsLeft: Math.max(0, MAX_ATTEMPTS - failures), retryAfterSeconds };
}
