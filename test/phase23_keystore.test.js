/**
 * AyuSwar AI — Native Keystore At-Rest Protection (Phase 23)
 * test/phase23_keystore.test.js
 *
 * 1. Static: AyuSwarKeystorePlugin exists with the required surface
 *    (status/ensureKey/encrypt/decrypt/deleteKey), a dedicated key alias,
 *    GCM parameters, and runtime KeyInfo-based hardware reporting that can
 *    return "unknown" — never a blanket hardware guarantee.
 * 2. Static: the plugin is registered in MainActivity.
 * 3. Static: the JS bridge guards every call behind nativeAvailable() and
 *    surfaces hardwareBacked verbatim without upgrading it.
 * 4. Static: secureOfflineStorage routes through the native path on Android
 *    (AES-256-GCM-KEYSTORE envelope), keeps the WebCrypto fallback, and the
 *    honest-scope comment no longer defers the Keystore path.
 * 5. Behavioral (node, no native): encryptRecord/decryptRecord still round
 *    trip through the WebCrypto fallback when the native bridge import
 *    fails, and the envelope is honestly labeled AES-256-GCM.
 */

import { readFileSync } from 'node:fs';

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

// 1. Native plugin surface
await record('AyuSwarKeystorePlugin has required surface and honest hardware reporting', async () => {
  const src = readFileSync(new URL('../android/app/src/main/java/ai/ayuswar/app/AyuSwarKeystorePlugin.java', import.meta.url), 'utf8');
  for (const method of ['status', 'ensureKey', 'encrypt', 'decrypt', 'deleteKey']) {
    assert(src.includes(`public void ${method}(`), `missing @PluginMethod ${method}`);
  }
  assert(src.includes('AndroidKeyStore'), 'must use AndroidKeyStore provider');
  assert(src.includes('ayuswar_offline_storage_v1'), 'dedicated key alias missing');
  assert(src.includes('AES/GCM/NoPadding'), 'GCM transformation missing');
  assert(src.includes('isInsideSecureHardware()'), 'runtime KeyInfo hardware check missing');
  assert(src.includes('return null;'), 'unknown hardware state must be representable');
  assert(!src.includes('hardwareBacked", true'), 'hardware backing must never be hardcoded true');
});

// 2. Registration
await record('MainActivity registers the Keystore plugin', async () => {
  const src = readFileSync(new URL('../android/app/src/main/java/ai/ayuswar/app/MainActivity.java', import.meta.url), 'utf8');
  assert(src.includes('registerPlugin(AyuSwarKeystorePlugin.class)'), 'plugin not registered');
});

// 3. JS bridge honesty
await record('keystoreNative bridge guards native availability and reports verbatim', async () => {
  const src = readFileSync(new URL('../src/mobile/keystoreNative.js', import.meta.url), 'utf8');
  assert(src.includes("Capacitor.isPluginAvailable('AyuSwarKeystore')"), 'plugin availability check missing');
  const guardCount = (src.match(/nativeAvailable\(\)/g) || []).length;
  assert(guardCount >= 5, `every bridge call must be guarded (found ${guardCount} guards)`);
  assert(src.includes('hardwareBacked: null'), 'web fallback must report hardware unknown, not false/true');
  assert(!src.includes('hardware-backed, guaranteed'), 'no hardware guarantee wording allowed');
});

// 4. Offline storage integration
await record('secureOfflineStorage uses native path with honest fallback', async () => {
  const src = readFileSync(new URL('../src/services/secureOfflineStorage.js', import.meta.url), 'utf8');
  assert(src.includes('AES-256-GCM-KEYSTORE'), 'native envelope algorithm label missing');
  assert(src.includes("import('../mobile/keystoreNative.js')"), 'lazy native bridge import missing');
  assert(src.includes('never claimed to be Keystore protection'), 'no-plaintext fallback guarantee missing');
  assert(src.includes('KeyInfo reports at runtime'), 'honest hardware-scope wording missing');
  assert(!src.includes('tracked separately'), 'stale "tracked separately" deferral must be gone');
});

// 5. Behavioral fallback round trip (node has no native bridge)
await record('WebCrypto fallback still round trips when native is absent', async () => {
  const mod = await import('../src/services/secureOfflineStorage.js');
  const key = await globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  mod.__setDeviceKeyForTests(key);
  const payload = { note: 'synthetic', reading: 42 };
  const envelope = await mod.encryptRecord(payload);
  assert(envelope.__encrypted === true, 'envelope flag missing');
  assert(envelope.algorithm === 'AES-256-GCM', `fallback envelope mislabeled: ${envelope.algorithm}`);
  assert(envelope.ciphertext && !envelope.ciphertext.includes('synthetic'), 'ciphertext must not leak plaintext');
  const round = await mod.decryptRecord(envelope);
  assert(round.note === 'synthetic' && round.reading === 42, 'round trip mismatch');
});

// 6. Behavioral: a REJECTING native plugin must degrade to the honestly
//    labeled WebCrypto envelope, never break the save, never store plaintext.
await record('rejecting Keystore plugin degrades to labeled WebCrypto fallback', async () => {
  const mod = await import('../src/services/secureOfflineStorage.js');
  const key = await globalThis.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  mod.__setDeviceKeyForTests(key);
  mod.__setKeystoreBridgeForTests({
    nativeAvailable: () => true,
    keystoreEncrypt: async () => { throw new Error('simulated transient keystore rejection'); }
  });
  const envelope = await mod.encryptRecord({ note: 'transient-path' });
  assert(envelope.algorithm === 'AES-256-GCM', `fallback envelope mislabeled: ${envelope.algorithm}`);
  assert(!envelope.ciphertext.includes('transient-path'), 'no plaintext may be stored');
  const round = await mod.decryptRecord(envelope);
  assert(round.note === 'transient-path', 'fallback round trip broken');
  mod.__setKeystoreBridgeForTests(null);
});

// 7. Behavioral: Keystore-envelope decrypt failure throws a clean
//    unrecoverable error - no silent downgrade, no plaintext, no guessing.
await record('Keystore envelope decrypt failure is honest and unrecoverable', async () => {
  const mod = await import('../src/services/secureOfflineStorage.js');
  mod.__setKeystoreBridgeForTests({
    nativeAvailable: () => true,
    keystoreDecrypt: async () => { throw new Error('simulated key loss'); }
  });
  let message = '';
  try {
    await mod.decryptRecord({ __encrypted: true, algorithm: 'AES-256-GCM-KEYSTORE', ciphertext: 'AAAA' });
  } catch (error) {
    message = error.message;
  }
  assert(message.includes('unrecoverable'), `clean unrecoverable message missing: ${message}`);
  assert(message.includes('no plaintext copy exists'), 'must state there is no plaintext fallback');
  mod.__setKeystoreBridgeForTests(null);
});

// 8. Behavioral: purgeDeviceKeys reports both keys explicitly; a native
//    deleteKey true -> 'deleted', rejecting deleteKey -> 'failed'.
await record('purgeDeviceKeys reports both keys explicitly', async () => {
  const mod = await import('../src/services/secureOfflineStorage.js');
  mod.__setKeystoreBridgeForTests({ nativeAvailable: () => true, keystoreDeleteKey: async () => true });
  const okRun = await mod.purgeDeviceKeys();
  assert(okRun.nativeKeystoreKey === 'deleted', `expected deleted, got ${okRun.nativeKeystoreKey}`);
  assert(['deleted', 'absent', 'failed'].includes(okRun.indexedDbDeviceKey), 'IndexedDB key outcome must be explicit');
  mod.__setKeystoreBridgeForTests({ nativeAvailable: () => true, keystoreDeleteKey: async () => { throw new Error('boom'); } });
  const failRun = await mod.purgeDeviceKeys();
  assert(failRun.nativeKeystoreKey === 'failed', `rejection must report failed, got ${failRun.nativeKeystoreKey}`);
  mod.__setKeystoreBridgeForTests(null);
});

let failed = 0;
for (const r of results) {
  if (!r.ok) {
    failed += 1;
    console.error(`  FAIL  ${r.name}: ${r.err?.message || r.err}`);
  } else {
    console.log(`  PASS  ${r.name}`);
  }
}
if (failed > 0) {
  console.error(`Phase 23: ${failed} of ${results.length} checks failed`);
  process.exit(1);
}
console.log(`Phase 23: ${results.length}/${results.length} keystore checks passed`);
