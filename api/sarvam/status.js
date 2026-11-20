/**
 * AyuSwar AI — Sarvam Indic Speech Services Status Endpoint
 * GET /api/sarvam/status
 *
 * Reports Sarvam (Bulbul TTS / Saaras STT) availability with an honest
 * schema. The subscription key (SARVAM_API_KEY) is configured exclusively
 * server-side and NEVER exposed to clients.
 *
 * COST POSTURE (deliberate): a LIVE probe spends real credits (billed per
 * character by Sarvam). Normal status checks must therefore NEVER probe:
 * GET always returns the free config-only answer (CONFIGURED_NOT_PROBED /
 * UNCONFIGURED, no upstream fetch, no key-validity detail). A probe runs
 * ONLY on a deliberate POST while the server operator has set
 * SARVAM_STATUS_PROBE_ENABLED=true AND the caller is authorized — a bounded
 * test action, never automatic, never from a polled health check.
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

  // GET  = free config-only status (NEVER probes, never spends credits).
  // POST = explicit live probe, only when the server operator enabled it via
  //        SARVAM_STATUS_PROBE_ENABLED=true and the caller is authorized.
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    logSafeApiAccess({ route, method: req.method, status: 405, durationMs: Date.now() - startTime });
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rateLimitResult = checkRateLimit(req, 60);
  if (!rateLimitResult.allowed) {
    res.setHeader('Retry-After', String(rateLimitResult.retryAfterSec));
    logSafeApiAccess({ route, method: req.method, status: 429, durationMs: Date.now() - startTime });
    return res.status(429).json({ error: 'Rate limit exceeded for status probes.' });
  }

  const apiKey = process.env.SARVAM_API_KEY;

  if (!apiKey || apiKey.includes('placeholder')) {
    logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime, clientNote: 'SARVAM_API_KEY unset' });
    return res.status(200).json(UNCONFIGURED_BODY);
  }

  // FREE default: GET never probes. Credentials exist, but nothing has been
  // verified live and no credit is spent. This is the answer normal UI
  // health checks, startup banners and polls get.
  if (req.method === 'GET') {
    logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime, clientNote: 'Config-only status (no probe, no spend)' });
    return res.status(200).json({
      available: false,
      status: 'CONFIGURED_NOT_PROBED',
      provider: 'sarvam',
      tts: { configured: true, status: 'CONFIGURED_NOT_PROBED', model: 'Sarvam Bulbul v3' },
      stt: { configured: true, status: 'CONFIGURED_NOT_PROBED', model: 'Sarvam Saaras v4' },
      latencyMs: null,
      lastSuccessTime,
      reason: 'Credentials configured; live status intentionally not probed (a probe spends credits). An explicit operator-enabled POST probe is required.'
    });
  }

  // Explicit live probe path (POST): operator-enabled and authorized only.
  // A query flag on a polled GET was judged too easy to trigger by accident:
  // probing requires a deliberate POST AND the server-side env gate.
  if (process.env.SARVAM_STATUS_PROBE_ENABLED !== 'true') {
    logSafeApiAccess({ route, method: req.method, status: 403, durationMs: Date.now() - startTime, clientNote: 'Probe disabled by server configuration; no spend' });
    return res.status(403).json({ error: 'Live status probes are disabled by server configuration. Config-only status is available via GET.', probeDisabled: true });
  }
  const callerAuth = await verifyCallerAuthorization(req);
  if (!callerAuth.authorized) {
    logSafeApiAccess({ route, method: req.method, status: callerAuth.status, durationMs: Date.now() - startTime, clientNote: 'Probe rejected (caller not authenticated); no spend' });
    return res.status(callerAuth.status).json({ error: callerAuth.error });
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
