/**
 * AyuSwar AI — On-Device-First Speech Recognition (Phase 24)
 * test/phase24_ondevice_asr.test.js
 *
 * 1. Static: AyuSwarSpeechPlugin prefers on-device recognition
 *    (createOnDeviceSpeechRecognizer + isOnDeviceRecognitionAvailable on
 *    API 31+), reports the ACTUAL recognizer via the onDevice result flag,
 *    and treats EXTRA_PREFER_OFFLINE as a hint, never a guarantee.
 * 2. Static: network recognition is gated behind an explicit allowNetwork
 *    caller option (default false) with an ON_DEVICE_UNAVAILABLE rejection
 *    that discloses the network path - no silent autoswitch.
 * 3. Static: the plugin mirrors the community plugin contract
 *    (requestPermissions/start/stop, partialResults + listeningState).
 * 4. Static: registration in MainActivity.
 * 5. Static: the JS bridge guards availability and exposes the same shape.
 * 6. Static: the service prefers the on-device engine, labels the provider
 *    only from the plugin's own onDevice report, and defaults
 *    allowNetworkRecognition to false.
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

// 1. On-device-first with honest reporting
await record('plugin prefers on-device and reports the actual recognizer', async () => {
  const src = readFileSync(new URL('../android/app/src/main/java/ai/ayuswar/app/AyuSwarSpeechPlugin.java', import.meta.url), 'utf8');
  assert(src.includes('createOnDeviceSpeechRecognizer'), 'on-device recognizer creation missing');
  assert(src.includes('isOnDeviceRecognitionAvailable'), 'on-device availability check missing');
  assert(src.includes('result.put("onDevice", onDevice)'), 'start must report the actual recognizer used');
  assert(src.includes('A preference hint only'), 'EXTRA_PREFER_OFFLINE must be documented as hint, not guarantee');
  assert(!src.includes('guaranteed offline'), 'no offline guarantee wording allowed');
});

// 2. Network recognition requires explicit caller choice
await record('network recognition is gated behind explicit allowNetwork', async () => {
  const src = readFileSync(new URL('../android/app/src/main/java/ai/ayuswar/app/AyuSwarSpeechPlugin.java', import.meta.url), 'utf8');
  assert(src.includes('call.getBoolean("allowNetwork", false)'), 'allowNetwork must default to false');
  assert(src.includes('!onDevice && !allowNetwork'), 'network fallback must be gated');
  assert(src.includes('ON_DEVICE_UNAVAILABLE'), 'honest rejection code missing');
  assert(src.includes('audio is sent to the Android speech service'), 'network path privacy disclosure missing');
});

// 3. Community-plugin contract compatibility
await record('plugin mirrors the community speech-recognition contract', async () => {
  const src = readFileSync(new URL('../android/app/src/main/java/ai/ayuswar/app/AyuSwarSpeechPlugin.java', import.meta.url), 'utf8');
  assert(src.includes('notifyListeners("partialResults"'), 'partialResults event missing');
  assert(src.includes('notifyListeners("listeningState"'), 'listeningState event missing');
  assert(src.includes('"speechRecognition"'), 'permission alias must match the community contract');
  for (const m of ['start', 'stop', 'status']) {
    assert(src.includes(`public void ${m}(`), `missing method ${m}`);
  }
});

// 4. Registration
await record('MainActivity registers the speech plugin', async () => {
  const src = readFileSync(new URL('../android/app/src/main/java/ai/ayuswar/app/MainActivity.java', import.meta.url), 'utf8');
  assert(src.includes('registerPlugin(AyuSwarSpeechPlugin.class)'), 'speech plugin not registered');
});

// 5. JS bridge
await record('ayuswarSpeech bridge guards availability and mirrors the API', async () => {
  const src = readFileSync(new URL('../src/mobile/ayuswarSpeech.js', import.meta.url), 'utf8');
  assert(src.includes("Capacitor.isPluginAvailable('AyuSwarSpeech')"), 'availability guard missing');
  for (const m of ['requestPermissions', 'addListener', 'start', 'stop', 'status']) {
    assert(src.includes(m), `bridge missing ${m}`);
  }
  assert(src.includes('never upgrade'), 'honest no-upgrade wording missing');
});

// 6. Service wiring honesty
await record('service prefers on-device engine and labels provider from the actual report', async () => {
  const src = readFileSync(new URL('../src/services/indicSpeechService.js', import.meta.url), 'utf8');
  assert(src.includes('ayuswarSpeechAvailable()'), 'engine selection missing');
  assert(src.includes("started?.onDevice === true ? 'capacitor_native_ondevice' : 'capacitor_native'"), 'provider must come from the plugin report, not assumption');
  assert(src.includes('allowNetworkRecognition = false'), 'network recognition must default to disallowed');
  assert(src.includes('allowNetwork: allowNetworkRecognition === true'), 'allowNetwork pass-through missing');
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
  console.error(`Phase 24: ${failed} of ${results.length} checks failed`);
  process.exit(1);
}
console.log(`Phase 24: ${results.length}/${results.length} on-device ASR checks passed`);
