/**
 * keystoreNative.js — bridge to the native Android Keystore plugin
 * (AyuSwarKeystorePlugin). Used by secureOfflineStorage.js to protect the
 * offline queue key material on native builds.
 *
 * Honest scope:
 * - The AES-256-GCM key is generated inside AndroidKeyStore and never leaves
 *   it; this bridge only ever moves base64 ciphertext across the WebView.
 * - "hardwareBacked" is whatever the device's KeyInfo reports at runtime:
 *   true (TEE/StrongBox), false (software), or null (unknown / no key yet).
 *   Callers must surface it verbatim and never upgrade it to a guarantee.
 * - On web/preview builds the plugin is absent; nativeAvailable() returns
 *   false and callers keep the WebCrypto path. No encryption claim is made
 *   for the fallback.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';

const Keystore = registerPlugin('AyuSwarKeystore');

export function nativeAvailable() {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AyuSwarKeystore');
}

export async function keystoreStatus() {
  if (!nativeAvailable()) return { available: false, hasKey: false, hardwareBacked: null };
  try {
    return await Keystore.status();
  } catch {
    return { available: false, hasKey: false, hardwareBacked: null };
  }
}

export async function keystoreEnsureKey() {
  if (!nativeAvailable()) return null;
  return Keystore.ensureKey(); // { hasKey, hardwareBacked }
}

const bytesToBase64 = (bytes) => {
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
};
const base64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

// plaintext: Uint8Array -> base64 ciphertext (iv || ciphertext), or null when native is unavailable.
export async function keystoreEncrypt(plainBytes) {
  if (!nativeAvailable()) return null;
  const result = await Keystore.encrypt({ data: bytesToBase64(plainBytes) });
  return result?.data ?? null;
}

// base64 ciphertext -> Uint8Array plaintext, or null when native is unavailable.
export async function keystoreDecrypt(packedB64) {
  if (!nativeAvailable()) return null;
  const result = await Keystore.decrypt({ data: packedB64 });
  return result?.data ? base64ToBytes(result.data) : null;
}

// Full-purge support: deleting the device key makes every Keystore-encrypted
// record permanently unreadable. Callers must also delete the records.
export async function keystoreDeleteKey() {
  if (!nativeAvailable()) return false;
  try {
    const result = await Keystore.deleteKey();
    return result?.deleted === true;
  } catch {
    return false;
  }
}
