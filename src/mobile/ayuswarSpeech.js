/**
 * ayuswarSpeech.js — bridge to the on-device-first AyuSwarSpeech plugin.
 *
 * The plugin mirrors the @capacitor-community/speech-recognition call/event
 * contract but prefers on-device recognition (Android 13+ on-device
 * recognizer, EXTRA_PREFER_OFFLINE elsewhere). Honest scope: on-device ASR
 * works only when the device has the language pack installed; onDevice is
 * reported verbatim from the plugin and must never be upgraded to an
 * offline guarantee. When this plugin is unavailable (web, older devices),
 * callers fall back to the community plugin or the browser path.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';

const Engine = registerPlugin('AyuSwarSpeech');

export function ayuswarSpeechAvailable() {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AyuSwarSpeech');
}

// Same shape as the community plugin so the service can swap engines.
export const AyuSwarSpeech = {
  requestPermissions: () => Engine.requestPermissions(),
  addListener: (event, handler) => Engine.addListener(event, handler),
  // Resolves { started, onDevice } — onDevice is true only when an on-device
  // recognizer was actually created (report verbatim, never upgrade).
  start: (options) => Engine.start(options),
  stop: () => Engine.stop(),
  status: () => Engine.status()
};
