/**
 * backgroundAudio.js — bridge to the microphone-type foreground service
 * used when a consultation is recorded while the app is backgrounded.
 *
 * Honest scope: the service holds no audio; capture stays in the WebView
 * under the existing consent rules (stop on withdraw, on leaving the
 * recorder, at the 3-minute cap). The service satisfies Android's
 * while-in-use microphone rule for backgrounded apps and shows the
 * OS-mandated persistent notification. Whether WebView capture actually
 * continues on a specific device is NOT proven by this and needs
 * physical-device verification. On web/preview this is a no-op.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';

const BackgroundAudio = registerPlugin('AyuSwarBackgroundAudio');

export function backgroundAudioAvailable() {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AyuSwarBackgroundAudio');
}

export async function startBackgroundAudio() {
  if (!backgroundAudioAvailable()) return false;
  try {
    const result = await BackgroundAudio.start();
    return result?.started === true;
  } catch {
    return false; // foreground-service rejection must never break a recording
  }
}

export async function stopBackgroundAudio() {
  if (!backgroundAudioAvailable()) return;
  try {
    await BackgroundAudio.stop();
  } catch {
    // already stopped; nothing to do
  }
}
