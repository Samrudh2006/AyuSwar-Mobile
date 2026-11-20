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

// 7. Wrong-PIN guard: 5 consecutive failures trigger a cooldown; even the
//    correct PIN is refused while locked out; the guard stores no PIN material.
await record('verifyAppLockGuarded bounds wrong attempts with cooldown', async () => {
  store.clear();
  await lock.enableAppLock('246810');
  for (let i = 0; i < 4; i++) {
    const r = await lock.verifyAppLockGuarded('000000');
    assert(!r.ok && r.reason === 'PIN_MISMATCH', `attempt ${i + 1} should be PIN_MISMATCH, got ${r.reason}`);
  }
  const fifth = await lock.verifyAppLockGuarded('000000');
  assert(fifth.reason === 'LOCKED_OUT' && fifth.retryAfterSeconds >= 30, `5th failure must lock out, got ${JSON.stringify(fifth)}`);
  const correctDuringLockout = await lock.verifyAppLockGuarded('246810');
  assert(correctDuringLockout.reason === 'LOCKED_OUT', 'correct PIN must still be refused during cooldown');
  const guardRaw = store.get('ayuswar_app_lock_guard_v1');
  assert(guardRaw && !guardRaw.includes('246810') && !guardRaw.includes('hash'), 'guard record must not carry PIN material');
});

// 8. Lockout expires and a correct PIN then clears the guard.
await record('lockout expires and success clears guard', async () => {
  const future = Date.now() + 31000;
  assert(!lock.getLockoutState(globalThis.localStorage, future).lockedOut, 'lockout must expire after cooldown');
  // simulate expiry by clearing the cooldown manually
  const guard = JSON.parse(store.get('ayuswar_app_lock_guard_v1'));
  guard.cooldownUntil = Date.now() - 1;
  store.set('ayuswar_app_lock_guard_v1', JSON.stringify(guard));
  const ok = await lock.verifyAppLockGuarded('246810');
  assert(ok.ok, 'correct PIN must unlock after cooldown expires');
  assert(!store.has('ayuswar_app_lock_guard_v1'), 'guard record must be cleared on success');
});

// 9. MobileRoot re-locks on backgrounding.
await record('MobileRoot relocks on visibilitychange/pagehide', async () => {
  const src = readFileSync(new URL('../src/mobile/MobileRoot.jsx', import.meta.url), 'utf8');
  assert(src.includes("addEventListener('visibilitychange'"), 'visibilitychange relock listener missing');
  assert(src.includes("addEventListener('pagehide'"), 'pagehide relock listener missing');
  assert(src.includes('document.hidden'), 'relock must trigger only when hidden');
});

// 10. Recorder noise gate (rural-PHC must-have): off by default,
//     user-controllable, raw frames always captured, gate applied only at
//     export on a copy, and honestly labeled (no denoiser claim).
await record('consultationRecorder noise gate is conservative and export-time only', async () => {
  const src = readFileSync(new URL('../src/mobile/consultationRecorder.js', import.meta.url), 'utf8');
  assert(src.includes('options.noiseGate === true'), 'gate must default to off');
  assert(src.includes('applyNoiseGate'), 'gate export function missing');
  assert(!src.includes('frame.fill(0)'), 'gate must not destroy audio during capture');
  assert(src.includes('RAW frame, always retained'), 'raw-capture guarantee missing');
  assert(src.includes('NOT a validated speech denoiser'), 'honest no-denoiser-claim wording missing');
  assert(src.includes('reexport('), 'working re-export control (raw PCM retained with the result) missing');
  assert(src.includes('channelCount: 1'), 'mono capture constraint missing');
  const { applyNoiseGate, GATE_THRESHOLD, GATE_HOLD_FRAMES } = await import('../src/mobile/consultationRecorder.js');
  assert(GATE_THRESHOLD > 0 && GATE_HOLD_FRAMES > 0, 'gate constants must be exported for review');
  const loud = new Float32Array(64).fill(0.5);
  const quiet = new Float32Array(64).fill(0.001);
  const raw = [loud, quiet, quiet, quiet, quiet, quiet, quiet, quiet];
  const gated = applyNoiseGate(raw);
  assert(gated[0] === loud, 'loud frame must pass through');
  assert(gated[7].every((v) => v === 0), 'frame after hold expiry must be silenced');
  assert(raw[7].some((v) => v !== 0), 'raw source must remain unmodified');
});

// 10b. Recording UI exposes the toggle (off by default) and a visible
//      indicator on the playback card when the gate was on.
await record('recording UI shows noise gate toggle and honest indicator', async () => {
  const src = readFileSync(new URL('../src/mobile/MClinical.jsx', import.meta.url), 'utf8');
  assert(src.includes('m-noisegate-toggle'), 'toggle element missing');
  assert(src.includes("useState(false)"), 'toggle must default to off');
  assert(src.includes('{ noiseGate }'), 'option must be passed to recorder');
  assert(src.includes('audio.noiseGate'), 'playback indicator missing');
  assert(src.includes('audio.reexport'), 're-export control on the playback card missing');
  assert(src.includes('(beta)'), 'honest beta labeling missing');
});

// 11. Assistant input placeholder is demo-safe (no clinical/dosage invitation).
await record('assistant placeholder is demo-safe', async () => {
  const src = readFileSync(new URL('../src/components/FloatingAssistant.jsx', import.meta.url), 'utf8');
  assert(src.includes('synthetic demo (no clinical advice or dosage)'), 'demo-safe placeholder missing');
  assert(!src.includes('Ask clinical question, dosage'), 'old clinical placeholder must be gone');
});

// 12. Lock settings: localized Close key and forgot-PIN data-loss note.
await record('lock settings localizes Close and documents forgot-PIN data loss', async () => {
  const src = readFileSync(new URL('../src/mobile/MAppLock.jsx', import.meta.url), 'utf8');
  assert(src.includes("close: 'Close'") && src.includes("close: 'మూసివేయండి'") && src.includes("close: 'बंद करें'"), 'localized Close key missing');
  assert(src.includes('forgot:') && src.includes('clears') || src.includes('clearing'), 'forgot-PIN data-loss note missing');
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
