/**
 * AyuSwar AI — Network Speech Privacy Gate (Phase 26)
 * test/phase26_network_speech_gate.test.js
 *
 * Audit-driven: no engine (AyuSwarSpeech allowNetwork path, community
 * plugin fallback, or browser Web Speech) may use network recognition
 * without an explicit user opt-in; offline-unsupported paths must report
 * visibly unavailable, and recognizer errors must surface real reasons.
 *
 * 1. Static: the service exposes the opt-in flag API (is/set) backed by
 *    localStorage, defaulting off.
 * 2. Static: the browser Web Speech path fails closed with a visible
 *    disclosure when the opt-in is absent.
 * 3. Static: the native community-plugin fallback fails closed with a
 *    visible disclosure when the opt-in is absent; the opt-in is forwarded
 *    to startNativeRecognition from startLiveRecognition.
 * 4. Static: the plugin exposes recognizer error reasons
 *    (errorCode/errorMessage with a code-to-reason map), and the service
 *    forwards errorMessage to onError.
 * 5. Static: NetworkSpeechSettings UI discloses the network path and toggles
 *    the flag; the drawer Settings section wires the entry and modal.
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

// 1. Opt-in flag API
await record('service exposes network speech opt-in flag, default off', async () => {
  const src = readFileSync(new URL('../src/services/indicSpeechService.js', import.meta.url), 'utf8');
  assert(src.includes('isNetworkSpeechAllowed()'), 'reader missing');
  assert(src.includes('setNetworkSpeechAllowed(allowed)'), 'writer missing');
  assert(src.includes("ayuswar_network_speech_allowed"), 'flag key missing');
  assert(src.includes("=== 'true'"), 'default must be off (strict true comparison)');
});

// 2. Browser path fails closed
await record('browser Web Speech fails closed without opt-in', async () => {
  const src = readFileSync(new URL('../src/services/indicSpeechService.js', import.meta.url), 'utf8');
  assert(src.includes('Live voice uses the browser speech service, which may send audio off this device'), 'browser-path disclosure missing');
  assert(src.includes('enable network speech in Settings'), 'enable path hint missing');
});

// 3. Native fallback fails closed
await record('native community-plugin fallback fails closed without opt-in', async () => {
  const src = readFileSync(new URL('../src/services/indicSpeechService.js', import.meta.url), 'utf8');
  assert(src.includes('!useOnDeviceEngine && !allowNetworkRecognition'), 'fallback gate missing');
  assert(src.includes('On-device speech recognition is not available on this device, and network speech is off'), 'fallback disclosure missing');
  assert(src.includes('allowNetworkRecognition: this.isNetworkSpeechAllowed()'), 'startLiveRecognition must forward the opt-in');
});

// 4. Recognizer error reasons surface
await record('recognizer errors carry real reasons end to end', async () => {
  const java = readFileSync(new URL('../android/app/src/main/java/ai/ayuswar/app/AyuSwarSpeechPlugin.java', import.meta.url), 'utf8');
  assert(java.includes('event.put("errorMessage", errorReason(error))'), 'plugin must attach error reason');
  assert(java.includes('ERROR_LANGUAGE_UNAVAILABLE'), 'offline-pack-missing reason must be mapped');
  assert(java.includes('ERROR_NETWORK'), 'network error reason must be mapped');
  const svc = readFileSync(new URL('../src/services/indicSpeechService.js', import.meta.url), 'utf8');
  assert(svc.includes('if (data.errorMessage) onError(data.errorMessage)'), 'service must forward the error reason');
});

// 5. Settings UI
await record('Network speech settings UI discloses and toggles the opt-in', async () => {
  const ui = readFileSync(new URL('../src/mobile/MSpeechSettings.jsx', import.meta.url), 'utf8');
  assert(ui.includes('setNetworkSpeechAllowed'), 'toggle must write the flag');
  assert(ui.includes('may send audio off this device'), 'network disclosure missing');
  assert(ui.includes('leave it only if you explicitly tap Transcribe or choose to sync'), 'recordings-leave-only-on-explicit-choice wording missing');
  assert(ui.includes('covers live voice only'), 'setting must be scoped to live voice, not recordings');
  assert(ui.includes('device and Android version support it'), 'on-device availability must need platform support, not pack alone');
  const shell = readFileSync(new URL('../src/mobile/MShell.jsx', import.meta.url), 'utf8');
  assert(shell.includes('NetworkSpeechSettings'), 'modal not wired');
  assert(shell.includes('setSpeechSettingsOpen(true)'), 'drawer entry missing');
});

// 6. Revocation stops an in-flight network session immediately
await record('turning network speech off stops an in-flight network session', async () => {
  const src = readFileSync(new URL('../src/services/indicSpeechService.js', import.meta.url), 'utf8');
  assert(src.includes('activeLiveRecognitionUsesNetwork'), 'network-usage tracking missing');
  assert(src.includes("if (allowed === true || !this.activeLiveRecognitionUsesNetwork) return;"), 'revocation guard missing');
  assert(src.includes('Network speech was turned off in Settings, so the in-progress network speech session stopped'), 'visible revocation reason missing');
  const setter = src.split('setNetworkSpeechAllowed(allowed)')[1] || '';
  assert(setter.includes('this.stopLiveRecognition()'), 'revocation must stop the active session, not just the next start');
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
  console.error(`Phase 26: ${failed} of ${results.length} checks failed`);
  process.exit(1);
}
console.log(`Phase 26: ${results.length}/${results.length} network-speech gate checks passed`);
