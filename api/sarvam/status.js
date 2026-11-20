/**
 * AyuSwar AI — Sarvam Indic Speech Services Status Endpoint
 * GET /api/sarvam/status
 *
 * Reports Sarvam (Bulbul TTS / Saaras STT) availability with the honest
 * 3-state schema (LIVE | UNAVAILABLE | UNCONFIGURED). The subscription key
 * (SARVAM_API_KEY) is configured exclusively server-side and NEVER exposed
 * to clients. Unauthenticated callers get a config-only answer: no upstream
 * fetch, no key-validity detail.
 *
 * Cost note: a LIVE probe performs one minimal (few-character) Bulbul
 * synthesis, billed per character by Sarvam (see
 * https://docs.sarvam.ai/api/getting-started/pricing). Probes only run for
 * authorized callers; config checks are free.
 */

import { validateUpstreamUrl, checkRateLimit, logSafeApiAccess, verifyCallerAuthorization, applyCorsHeaders, handleCorsPreflight } from '../_lib/security.js';

let lastSuccessTime = null;

const UNCONFIGURED_BODY = {
  available: false,
  status: 'UNCONFIGURED',
  provider: 'sarvam',
  tts: { configured: false, status: 'UNCONFIGURED', model: 'Sarvam Bulbul (not configured)' },
  stt: { configured: false, status: 'UNCONFIGURED', model: 'Sarvam Saaras (not configured)' },
  latencyMs: null,
  lastSuccessTime: null,
  reason: 'SARVAM_API_KEY unset on server.'
};

export default async function handler(req, res) {
  applyCorsHeaders(req, res);
  if (handleCorsPreflight(req, res)) return;
  const startTime = Date.now();
  const route = '/api/sarvam/status';

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    logSafeApiAccess({ route, method: req.method, status: 405, durationMs: Date.now() - startTime });
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rateLimitResult = checkRateLimit(req, 60);
  if (!rateLimitResult.allowed) {
    res.setHeader('Retry-After', String(rateLimitResult.retryAfterSec));
    logSafeApiAccess({ route, method: req.method, status: 429, durationMs: Date.now() - startTime });
    return res.status(429).json({ error: 'Rate limit exceeded for status probes.' });
  }

  const callerAuth = await verifyCallerAuthorization(req);
  const apiKey = process.env.SARVAM_API_KEY;

  if (!apiKey || apiKey.includes('placeholder')) {
    logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime, clientNote: 'SARVAM_API_KEY unset' });
    return res.status(200).json(UNCONFIGURED_BODY);
  }

  if (!callerAuth.authorized) {
    logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime, clientNote: 'Config-only status (caller not authenticated)' });
    return res.status(200).json({
      available: false,
      status: 'AUTH_REQUIRED',
      provider: 'sarvam',
      tts: { configured: true, status: 'AUTH_REQUIRED', model: 'Sarvam Bulbul' },
      stt: { configured: true, status: 'AUTH_REQUIRED', model: 'Sarvam Saaras' },
      latencyMs: null,
      lastSuccessTime: null,
      reason: 'Sign in required to check live Sarvam provider status.'
    });
  }

  const ttsEndpoint = 'https://api.sarvam.ai/text-to-speech';
  const urlCheck = validateUpstreamUrl(ttsEndpoint);
  if (!urlCheck.valid) {
    logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime, clientNote: 'Invalid upstream host' });
    return res.status(200).json({
      available: false,
      status: 'UNAVAILABLE',
      provider: 'sarvam',
      tts: { configured: false, status: 'UNAVAILABLE' },
      stt: { configured: false, status: 'UNAVAILABLE' },
      latencyMs: null,
      lastSuccessTime,
      reason: 'Upstream speech host is not in the approved allowlist.'
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const probeStart = Date.now();
    // Minimal paid probe: a few characters of Telugu. Cost is per-character.
    const probe = await fetch(ttsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
      body: JSON.stringify({ text: 'నమస్కారం', language_code: 'te-IN', model: 'bulbul:v3', speech_sample_rate: 8000, output_audio_codec: 'wav' }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (probe.ok) {
      lastSuccessTime = new Date().toISOString();
      logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime });
      return res.status(200).json({
        available: true,
        status: 'LIVE',
        provider: 'sarvam',
        tts: { configured: true, status: 'LIVE', model: 'Sarvam Bulbul v3' },
        stt: { configured: true, status: 'CONFIGURED_NOT_PROBED', model: 'Sarvam Saaras v4' },
        latencyMs: Date.now() - probeStart,
        lastSuccessTime
      });
    }
    const status = probe.status === 402 ? 'INSUFFICIENT_QUOTA' : probe.status === 429 ? 'RATE_LIMITED' : 'UNAVAILABLE';
    logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime, clientNote: `Upstream HTTP ${probe.status}` });
    return res.status(200).json({
      available: false,
      status,
      provider: 'sarvam',
      tts: { configured: true, status, model: 'Sarvam Bulbul v3' },
      stt: { configured: true, status: 'CONFIGURED_NOT_PROBED', model: 'Sarvam Saaras v4' },
      latencyMs: null,
      lastSuccessTime,
      reason: `Sarvam upstream returned HTTP ${probe.status}.`
    });
  } catch (err) {
    logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime, clientNote: err.name === 'AbortError' ? 'Timeout' : 'Upstream fetch failure' });
    return res.status(200).json({
      available: false,
      status: 'UNAVAILABLE',
      provider: 'sarvam',
      tts: { configured: true, status: 'UNAVAILABLE', model: 'Sarvam Bulbul v3' },
      stt: { configured: true, status: 'CONFIGURED_NOT_PROBED', model: 'Sarvam Saaras v4' },
      latencyMs: null,
      lastSuccessTime,
      reason: 'Sarvam status probe failed (network/timeout).'
    });
  }
}
