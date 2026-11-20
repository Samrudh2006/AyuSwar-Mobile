/**
 * AyuSwar AI — Background Recording Foreground Service (Phase 25)
 * test/phase25_background_recording.test.js
 *
 * 1. Static: RecordingForegroundService is a microphone-type foreground
 *    service with the OS-mandated persistent notification and holds NO
 *    audio pipeline (capture stays in the WebView).
 * 2. Static: the plugin start/stop wraps the service and a start rejection
 *    never breaks recording.
 * 3. Static: manifest declares the service with
 *    foregroundServiceType="microphone" plus FOREGROUND_SERVICE and
 *    FOREGROUND_SERVICE_MICROPHONE permissions.
 * 4. Static: registration in MainActivity.
 * 5. Static: the JS bridge is guarded and a start failure degrades to false.
 * 6. Static: MClinical starts the service with recording and stops it on
 *    stop and on consent withdraw.
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

// 1. Service honesty
await record('foreground service is microphone-type with notification, holds no audio', async () => {
  const src = readFileSync(new URL('../android/app/src/main/java/ai/ayuswar/app/RecordingForegroundService.java', import.meta.url), 'utf8');
  assert(src.includes('FOREGROUND_SERVICE_TYPE_MICROPHONE'), 'microphone foreground type missing');
  assert(src.includes('setOngoing(true)'), 'persistent disclosure notification missing');
  assert(src.includes('createNotificationChannel'), 'notification channel missing');
  assert(!src.includes('MediaRecorder') && !src.includes('AudioRecord'), 'service must not hold its own audio pipeline');
  assert(src.includes('consent'), 'honest consent-scope comment missing');
});

// 2. Plugin wrapper
await record('background audio plugin wraps the service with honest failure', async () => {
  const src = readFileSync(new URL('../android/app/src/main/java/ai/ayuswar/app/AyuSwarBackgroundAudioPlugin.java', import.meta.url), 'utf8');
  assert(src.includes('startForegroundService'), 'start must launch the foreground service');
  assert(src.includes('stopService'), 'stop missing');
  assert(src.includes('call.reject'), 'start failure must reject honestly');
});

// 3. Manifest
await record('manifest declares microphone foreground service and permissions', async () => {
  const src = readFileSync(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8');
  assert(src.includes('android:name=".RecordingForegroundService"'), 'service not declared');
  assert(src.includes('android:foregroundServiceType="microphone"'), 'foregroundServiceType microphone missing');
  assert(src.includes('android.permission.FOREGROUND_SERVICE"'), 'FOREGROUND_SERVICE permission missing');
  assert(src.includes('android.permission.FOREGROUND_SERVICE_MICROPHONE'), 'FOREGROUND_SERVICE_MICROPHONE permission missing');
});

// 4. Registration
await record('MainActivity registers the background audio plugin', async () => {
  const src = readFileSync(new URL('../android/app/src/main/java/ai/ayuswar/app/MainActivity.java', import.meta.url), 'utf8');
  assert(src.includes('registerPlugin(AyuSwarBackgroundAudioPlugin.class)'), 'plugin not registered');
});

// 5. JS bridge
await record('backgroundAudio bridge is guarded and degrades safely', async () => {
  const src = readFileSync(new URL('../src/mobile/backgroundAudio.js', import.meta.url), 'utf8');
  assert(src.includes("Capacitor.isPluginAvailable('AyuSwarBackgroundAudio')"), 'availability guard missing');
  assert(src.includes('return false; // foreground-service rejection must never break a recording'), 'start failure must degrade to false');
});

// 6. Recorder wiring
await record('MClinical pairs background service lifecycle with recording and consent', async () => {
  const src = readFileSync(new URL('../src/mobile/MClinical.jsx', import.meta.url), 'utf8');
  assert(src.includes('startBackgroundAudio()'), 'service start not wired to recording start');
  const stopCount = (src.match(/stopBackgroundAudio\(\)/g) || []).length;
  assert(stopCount >= 2, `service stop must be wired to stop AND withdraw (found ${stopCount})`);
  const withdraw = src.slice(src.indexOf('const withdrawConsent'));
  assert(withdraw.includes('stopBackgroundAudio()'), 'withdraw must stop the background service');
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
  console.error(`Phase 25: ${failed} of ${results.length} checks failed`);
  process.exit(1);
}
console.log(`Phase 25: ${results.length}/${results.length} background-recording checks passed`);
