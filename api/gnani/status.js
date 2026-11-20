/**
 * AyuSwar AI — Gnani Indic Speech Services Status Endpoint
 * GET /api/gnani/status
 * 
 * Verifies live operational status of Gnani Speech Services (Prisma STT & Timbre TTS).
 * Keys (GNANI_API_KEY / GNANI_TTS_KEY / GNANI_STT_KEY) are configured exclusively server-side and NEVER exposed to clients.
 */

import { validateUpstreamUrl, checkRateLimit, logSafeApiAccess, verifyCallerAuthorization, applyCorsHeaders, handleCorsPreflight } from '../_lib/security.js';

let lastSuccessTime = null;
let lastSttSuccessTime = null;

export default async function handler(req, res) {
  applyCorsHeaders(req, res);
  if (handleCorsPreflight(req, res)) return;
  const startTime = Date.now();
  const route = '/api/gnani/status';

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    logSafeApiAccess({ route, method: req.method, status: 405, durationMs: Date.now() - startTime });
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Rate limiting (Allow up to 60 status checks per minute)
  const rateLimitResult = checkRateLimit(req, 60);
  if (!rateLimitResult.allowed) {
    res.setHeader('Retry-After', String(rateLimitResult.retryAfterSec));
    logSafeApiAccess({ route, method: req.method, status: 429, durationMs: Date.now() - startTime });
    return res.status(429).json({ error: 'Rate limit exceeded for status probes.' });
  }

  // Live status probes spend server keys against paid upstreams, so they are
  // gated behind caller auth exactly like the quota routes. Unauthenticated
  // callers receive a config-only answer: no upstream fetch, no key-validity detail.
  const callerAuth = await verifyCallerAuthorization(req);

  const ttsKey = process.env.GNANI_TTS_KEY || process.env.GNANI_API_KEY;
  const sttKey = process.env.GNANI_STT_KEY || process.env.GNANI_API_KEY;
  const upstreamBase = 'https://api.vachana.ai';

  if ((!ttsKey && !sttKey) || (ttsKey && ttsKey.includes('placeholder')) || (sttKey && sttKey.includes('placeholder'))) {
    logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime, clientNote: 'GNANI_API_KEY unset' });
    return res.status(200).json({
      available: false,
      status: 'UNCONFIGURED',
      provider: 'browser_fallback',
      tts: {
        configured: false,
        status: 'UNCONFIGURED',
        model: 'Browser Web SpeechSynthesis (Client Fallback)'
      },
      stt: {
        configured: false,
        status: 'UNCONFIGURED',
        model: 'Browser Web SpeechRecognition (Client Fallback)'
      },
      models: {
        stt: 'Browser Web SpeechRecognition (Client Fallback)',
        tts: 'Browser Web SpeechSynthesis (Client Fallback)'
      },
      latencyMs: null,
      lastSuccessTime: lastSuccessTime,
      reason: 'GNANI_API_KEY unset on server. Using safe browser speech fallback.'
    });
  }

  if (!callerAuth.authorized) {
    logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime, clientNote: 'Config-only status (caller not authenticated)' });
    return res.status(200).json({
      available: false,
      status: 'AUTH_REQUIRED',
      provider: 'browser_fallback',
      tts: {
        configured: Boolean(ttsKey),
        status: 'AUTH_REQUIRED',
        model: 'Browser Web SpeechSynthesis (Client Fallback)'
      },
      stt: {
        configured: Boolean(sttKey),
        status: 'AUTH_REQUIRED',
        model: 'Browser Web SpeechRecognition (Client Fallback)'
      },
      models: {
        stt: 'Browser Web SpeechRecognition (Client Fallback)',
        tts: 'Browser Web SpeechSynthesis (Client Fallback)'
      },
      latencyMs: null,
      lastSuccessTime: null,
      reason: 'Sign in required to check live speech provider status. Using safe browser speech fallback.'
    });
  }

  // Validate upstream host
  const urlCheck = validateUpstreamUrl(upstreamBase);
  if (!urlCheck.valid) {
    logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime, clientNote: 'Invalid upstream host' });
    return res.status(200).json({
      available: false,
      status: 'UNAVAILABLE',
      provider: 'browser_fallback',
      tts: { configured: false, status: 'UNAVAILABLE' },
      stt: { configured: false, status: 'UNAVAILABLE' },
      models: {
        stt: 'Browser Web SpeechRecognition (Client Fallback)',
        tts: 'Browser Web SpeechSynthesis (Client Fallback)'
      },
      latencyMs: null,
      lastSuccessTime: lastSuccessTime,
      reason: 'Upstream speech host is not in the approved allowlist.'
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    // 1. Probe TTS genuine synthesis capability on Gnani API
    const ttsPromise = ttsKey ? fetch('https://api.vachana.ai/api/v1/tts/inference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key-ID': ttsKey,
        'x-api-key': ttsKey,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Origin': 'https://vachana.ai',
        'Referer': 'https://vachana.ai/'
      },
      body: JSON.stringify({
        text: 'ఆయుస్వర',
        voice: 'Nalini',
        model: 'timbre-v2.5',
        language: 'te-IN',
        speed: 1.0,
        audio_config: { sample_rate: 16000, num_channels: 1, sample_width: 2, encoding: 'linear_pcm', container: 'wav' }
      }),
      signal: controller.signal
    }).catch(err => ({ ok: false, status: 503, error: err.message })) : Promise.resolve(null);

    // 2. Probe STT endpoint readiness (OPTIONS or lightweight probe)
    const sttEndpoint = process.env.GNANI_STT_ENDPOINT || process.env.GNANI_ASR_ENDPOINT || 'https://api.vachana.ai/stt/v3';
    const sttPromise = sttKey ? fetch(sttEndpoint, {
      method: 'GET',
      headers: {
        'X-API-Key-ID': sttKey,
        'x-api-key': sttKey,
        'User-Agent': 'AyuSwar-AI/1.0 Status-Probe'
      },
      signal: controller.signal
    }).catch(err => ({ ok: false, status: 503, error: err.message })) : Promise.resolve(null);

    const [probeRes, sttRes] = await Promise.all([ttsPromise, sttPromise]);
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    const ttsOk = Boolean(probeRes && (probeRes.status === 200 || probeRes.ok));
    // STT endpoint responds with 405 Method Not Allowed to GET or 200 if alive, but 401/403 if invalid key
    const sttOk = Boolean(sttRes && (sttRes.status === 200 || sttRes.status === 405 || sttRes.ok));

    if (ttsOk) {
      lastSuccessTime = new Date().toISOString();
    }
    if (sttOk) {
      lastSttSuccessTime = new Date().toISOString();
    }

    const overallLive = ttsOk || sttOk;

    if (overallLive) {
      logSafeApiAccess({ route, method: req.method, status: 200, durationMs: latencyMs, clientNote: 'Live inference probe verified' });
      return res.status(200).json({
        available: true,
        status: 'LIVE',
        provider: 'gnani',
        verifiedCapability: ttsOk && sttOk ? 'TTS_AND_STT_AUTHENTICATED' : (ttsOk ? 'TTS_AUTHENTICATED' : 'STT_AUTHENTICATED'),
        tts: {
          configured: Boolean(ttsKey),
          status: ttsOk ? 'LIVE' : 'UNAVAILABLE',
          model: 'Gnani Timbre v2.5 / v3.0'
        },
        stt: {
          configured: Boolean(sttKey),
          status: sttOk ? 'LIVE' : 'UNAVAILABLE',
          model: 'Gnani Prisma v3 STT'
        },
        models: {
          stt: sttOk ? 'Gnani Prisma v3 STT' : 'Browser Web SpeechRecognition (Client Fallback)',
          tts: ttsOk ? 'Gnani Timbre v2.5 / v3.0' : 'Browser Web SpeechSynthesis (Client Fallback)'
        },
        latencyMs,
        lastSuccessTime,
        lastSttSuccessTime
      });
    } else {
      const status = probeRes?.status || sttRes?.status || 500;
      logSafeApiAccess({ route, method: req.method, status: 200, durationMs: latencyMs, clientNote: `Upstream HTTP ${status}` });
      return res.status(200).json({
        available: false,
        status: 'UNAVAILABLE',
        provider: 'browser_fallback',
        tts: {
          configured: Boolean(ttsKey),
          status: 'UNAVAILABLE',
          model: 'Browser Web SpeechSynthesis (Client Fallback)'
        },
        stt: {
          configured: Boolean(sttKey),
          status: 'UNAVAILABLE',
          model: 'Browser Web SpeechRecognition (Client Fallback)'
        },
        models: {
          stt: 'Browser Web SpeechRecognition (Client Fallback)',
          tts: 'Browser Web SpeechSynthesis (Client Fallback)'
        },
        latencyMs,
        lastSuccessTime,
        reason: status === 401 || status === 403
          ? 'Invalid or unauthorized GNANI_API_KEY. Using safe browser speech fallback.'
          : `Gnani speech service returned HTTP ${status}. Using safe browser speech fallback.`
      });
    }
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    logSafeApiAccess({ route, method: req.method, status: 200, durationMs: latencyMs, clientNote: 'Gnani status check error' });
    return res.status(200).json({
      available: false,
      status: 'UNAVAILABLE',
      provider: 'browser_fallback',
      tts: { configured: Boolean(ttsKey), status: 'UNAVAILABLE' },
      stt: { configured: Boolean(sttKey), status: 'UNAVAILABLE' },
      models: {
        stt: 'Browser Web SpeechRecognition (Client Fallback)',
        tts: 'Browser Web SpeechSynthesis (Client Fallback)'
      },
      latencyMs: null,
      lastSuccessTime: lastSuccessTime,
      reason: err.name === 'AbortError' ? 'Gnani probe timed out (>6s)' : 'Speech service probe error'
    });
  }
}
