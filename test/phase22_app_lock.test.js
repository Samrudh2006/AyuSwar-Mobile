/**
 * AyuSwar AI — PIN App Lock & Withdraw Semantics (Phase 22)
 * test/phase22_app_lock.test.js
 *
 * 1. Behavioral: enableAppLock enforces 4-6 digit PIN format; a valid PIN
 *    enables the lock and verifyAppLock accepts only the correct PIN.
 * 2. Behavioral: disableAppLock requires the correct PIN and clears the lock.
 * 3. Static: MobileRoot renders the lock overlay on start when enabled.
 * 4. Static: MShell drawer exposes a reachable App lock settings entry.
 * 5. Static: withdraw semantics — consent copy no longer promises "at any
 *    time", and withdrawConsent discards pending audio/transcript on
 *    explicit withdraw (no implied upload consent).
 * 6. Static: assistant FAB uses the user-selected repo asset
 *    assistant-mark-original.png, not the old inline SVG orb.
 */

import { readFileSync } from 'node:fs';

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

const lock = await import('../src/mobile/appLock.js');

// 1. Format enforcement + enable/verify
await record('enableAppLock enforces 4-6 digit PIN and verifies only the correct PIN', async () => {
  const bad = await lock.enableAppLock('12a4');
  assert(bad.ok === false && bad.reason === 'PIN_FORMAT', `expected PIN_FORMAT rejection, got ${JSON.stringify(bad)}`);
  assert(lock.isAppLockEnabled() === false, 'lock must stay disabled after a rejected PIN');
  const good = await lock.enableAppLock('4291');
  assert(good.ok === true, 'valid PIN should enable the lock');
  assert(lock.isAppLockEnabled() === true, 'lock should report enabled');
  assert((await lock.verifyAppLock('4291')) === true, 'correct PIN must verify');
  assert((await lock.verifyAppLock('4292')) === false, 'wrong PIN must not verify');
  const raw = store.get('ayuswar_app_lock_v1');
  assert(raw && !raw.includes('4291'), 'stored record must not contain the plaintext PIN');
});

// 2. Disable requires the correct PIN
await record('disableAppLock requires the correct PIN and clears the record', async () => {
  const wrong = await lock.disableAppLock('0000');
  assert(wrong.ok === false, 'wrong PIN must not disable');
  assert(lock.isAppLockEnabled() === true, 'lock must stay enabled after wrong PIN');
  const right = await lock.disableAppLock('4291');
  assert(right.ok === true, 'correct PIN should disable');
  assert(lock.isAppLockEnabled() === false, 'lock record must be cleared');
});

// 3. MobileRoot lock overlay wiring
await record('MobileRoot renders AppLockScreen on start when the lock is enabled', async () => {
  const src = readFileSync(new URL('../src/mobile/MobileRoot.jsx', import.meta.url), 'utf8');
  assert(src.includes('AppLockScreen'), 'AppLockScreen import/use missing');
  assert(src.includes('isAppLockEnabled()'), 'initial locked state missing');
  assert(src.includes('appLocked &&'), 'lock overlay render gate missing');
});

// 4. MShell drawer settings entry
await record('MShell drawer exposes a reachable App lock settings entry', async () => {
  const src = readFileSync(new URL('../src/mobile/MShell.jsx', import.meta.url), 'utf8');
  assert(src.includes('AppLockSettings'), 'AppLockSettings import missing');
  assert(src.includes('setLockSettingsOpen(true)'), 'drawer entry handler missing');
  assert(src.includes('lockSettingsOpen &&'), 'settings modal render gate missing');
});

// 5. Withdraw semantics: honest copy + labeled discard of pending audio
await record('withdraw discards pending recording and copy matches behavior', async () => {
  const src = readFileSync(new URL('../src/mobile/MClinical.jsx', import.meta.url), 'utf8');
  assert(!src.includes('withdraw this consent at any time'), 'stale "at any time" copy must be gone');
  assert(src.includes('whenever you are not recording'), 'honest withdraw timing copy missing');
  const fn = src.slice(src.indexOf('const withdrawConsent'));
  assert(fn.includes('revokeRecordingConsent()'), 'revoke call missing');
  assert(fn.includes('setAudio(null)'), 'pending audio must be discarded on withdraw');
  assert(fn.includes('setTurns([])'), 'pending transcript must be discarded on withdraw');
  assert(src.includes('Withdraw consent & discard recording'), 'labeled withdraw action missing');
});

// 6. Assistant mark is the user-selected repo asset
await record('FloatingAssistant FAB uses assistant-mark-original.png', async () => {
  const src = readFileSync(new URL('../src/components/FloatingAssistant.jsx', import.meta.url), 'utf8');
  assert(src.includes('/assets/assistant-mark-original.png'), 'user-selected assistant mark missing');
  assert(!src.includes('assistant-voice-icon.png'), 'old hidden mark reference must be gone');
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
  console.error(`Phase 22: ${failed} of ${results.length} checks failed`);
  process.exit(1);
}
console.log(`Phase 22: ${results.length}/${results.length} app-lock/withdraw checks passed`);
