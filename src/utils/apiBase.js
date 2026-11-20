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

/**
 * Caller-auth headers for provider-quota proxy routes.
 * The server fails closed without a valid Supabase session JWT whenever an
 * auth provider is configured, so authenticated calls must attach it.
 * In local synthetic demo mode (no Supabase) this returns no header and the
 * proxy routes answer 503 instead of forwarding to paid upstreams.
 */
export async function authHeaders() {
  try {
    const { supabase, isSupabaseConfigured } = await import('../services/supabaseClient.js');
    if (!isSupabaseConfigured) return {};
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
