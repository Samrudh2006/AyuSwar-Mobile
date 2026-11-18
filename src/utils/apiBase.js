// API base resolution.
// In the browser (dev preview / live Vercel site) relative '/api/*' paths work.
// Inside the native Android/iOS WebView the app origin is the local Capacitor
// server, so relative paths would hit localhost and fail. Native builds call
// the deployed backend origin directly. CapacitorHttp (enabled in
// capacitor.config.json) routes these through native HTTP, so browser CORS
// does not apply.
import { Capacitor } from '@capacitor/core';

export const API_ORIGIN = 'https://ayuswar-ai.vercel.app';

export function apiUrl(path) {
  if (Capacitor.isNativePlatform()) {
    return API_ORIGIN + path;
  }
  return path;
}
