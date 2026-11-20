/**
 * AyuSwar AI — Sarvam Bulbul Indic TTS Proxy
 * POST /api/sarvam/tts
 *
 * Secure Serverless Gateway (same posture as api/gnani/tts.js):
 * - Credentials (SARVAM_API_KEY) come EXCLUSIVELY from server environment.
 * - Enforces text length limits (max 2500 chars, the Bulbul v3 upstream cap).
 * - Upstream host pinned to api.sarvam.ai via the security allowlist.
 * - Rate limited (best-effort burst protection).
 * - Zero-leak audit logging: never logs synthesized text.
 * - 402 (insufficient quota) is surfaced distinctly so the client can
 *   degrade instantly instead of retrying a billable path.
 */

import { validateUpstreamUrl, checkRateLimit, logSafeApiAccess, sanitizeClientError, verifyCallerAuthorization, applyCorsHeaders, handleCorsPreflight } from '../_lib/security.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50kb'
    }
  }
};

const SARVAM_LANGUAGES = new Set(['bn-IN', 'en-IN', 'gu-IN', 'hi-IN', 'kn-IN', 'ml-IN', 'mr-IN', 'od-IN', 'pa-IN', 'ta-IN', 'te-IN']);
const SARVAM_MODELS = new Set(['bulbul:v2', 'bulbul:v3', 'bulbul:v4-flash']);

export default async function handler(req, res) {
  applyCorsHeaders(req, res);
  if (handleCorsPreflight(req, res)) return;
  const startTime = Date.now();
  const route = '/api/sarvam/tts';

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    logSafeApiAccess({ route, method: req.method, status: 405, durationMs: Date.now() - startTime });
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    logSafeApiAccess({ route, method: req.method, status: 415, durationMs: Date.now() - startTime });
    return res.status(415).json({ error: 'Unsupported Media Type: application/json required' });
  }

  const rateLimitResult = checkRateLimit(req, 20);
  if (!rateLimitResult.allowed) {
    res.setHeader('Retry-After', String(rateLimitResult.retryAfterSec));
    logSafeApiAccess({ route, method: req.method, status: 429, durationMs: Date.now() - startTime, clientNote: 'TTS rate limit' });
    return res.status(429).json({ error: 'TTS synthesis rate limit exceeded. Please wait before retrying.', retryAfterSec: rateLimitResult.retryAfterSec });
  }

  const callerAuth = await verifyCallerAuthorization(req);
  if (!callerAuth.authorized) {
    logSafeApiAccess({ route, method: req.method, status: callerAuth.status, durationMs: Date.now() - startTime, clientNote: 'Caller auth rejected' });
    return res.status(callerAuth.status).json({ error: callerAuth.error });
  }

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
    logSafeApiAccess({ route, method: req.method, status: 503, durationMs: Date.now() - startTime, clientNote: 'SARVAM_API_KEY unset' });
    return res.status(503).json({
      error: 'Sarvam TTS service unavailable: Server credentials are not configured.',
      available: false,
      fallbackRequired: true
    });
  }

  const { text, language = 'te-IN', speaker, model = 'bulbul:v3', pace = 1.0 } = req.body || {};

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    logSafeApiAccess({ route, method: req.method, status: 400, durationMs: Date.now() - startTime });
    return res.status(400).json({ error: 'Invalid or missing text string for TTS synthesis' });
  }
  if (text.length > 2500) {
    logSafeApiAccess({ route, method: req.method, status: 400, durationMs: Date.now() - startTime });
    return res.status(400).json({ error: 'Text exceeds maximum length limit of 2500 characters' });
  }
  const safeLang = String(language).slice(0, 10);
  if (!SARVAM_LANGUAGES.has(safeLang)) {
    logSafeApiAccess({ route, method: req.method, status: 400, durationMs: Date.now() - startTime });
    return res.status(400).json({ error: `Unsupported language_code '${safeLang}' for Sarvam TTS.` });
  }
  const safeModel = SARVAM_MODELS.has(String(model)) ? String(model) : 'bulbul:v3';
  const safePace = Math.min(2.0, Math.max(0.5, Number(pace) || 1.0));

  const ttsEndpoint = process.env.SARVAM_TTS_ENDPOINT || 'https://api.sarvam.ai/text-to-speech';
  const urlCheck = validateUpstreamUrl(ttsEndpoint);
  if (!urlCheck.valid) {
    logSafeApiAccess({ route, method: req.method, status: 500, durationMs: Date.now() - startTime, clientNote: 'Invalid upstream host' });
    return res.status(500).json({ error: 'Server security configuration error: Upstream host not in allowlist.', available: false, fallbackRequired: true });
  }

  const body = {
    text: text.trim(),
    language_code: safeLang,
    model: safeModel,
    pace: safePace,
    speech_sample_rate: 24000,
    output_audio_codec: 'wav'
  };
  if (speaker && typeof speaker === 'string' && /^[a-z0-9_]{1,64}$/.test(speaker)) body.speaker = speaker;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const upstreamRes = await fetch(ttsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-subscription-key': apiKey },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (upstreamRes.ok) {
      const payload = await upstreamRes.json().catch(() => null);
      const b64 = payload && Array.isArray(payload.audios) && typeof payload.audios[0] === 'string' ? payload.audios[0] : null;
      if (!b64) {
        logSafeApiAccess({ route, method: req.method, status: 502, durationMs: Date.now() - startTime, clientNote: 'Invalid upstream payload shape' });
        return res.status(502).json({ error: 'Sarvam TTS returned an unexpected payload shape. No audio was fabricated.', fallbackRequired: true });
      }
      const outBuf = Buffer.from(b64, 'base64');
      if (outBuf.length < 48 || outBuf.toString('ascii', 0, 4) !== 'RIFF' || outBuf.toString('ascii', 8, 12) !== 'WAVE') {
        logSafeApiAccess({ route, method: req.method, status: 502, durationMs: Date.now() - startTime, clientNote: 'Invalid upstream audio container' });
        return res.status(502).json({ error: 'Sarvam TTS returned an invalid audio response. No error payload was converted into audio.', fallbackRequired: true });
      }
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', String(outBuf.length));
      res.setHeader('Cache-Control', 'private, no-store'); // spoken text can be clinical: never shared/browser-cached
      logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime });
      return res.status(200).send(outBuf);
    }

    if (upstreamRes.status === 402) {
      logSafeApiAccess({ route, method: req.method, status: 402, durationMs: Date.now() - startTime, clientNote: 'Insufficient quota' });
      return res.status(402).json({ error: 'Sarvam credits exhausted (insufficient quota). Add credits to resume.', available: false, fallbackRequired: true, quotaExhausted: true });
    }
    logSafeApiAccess({ route, method: req.method, status: upstreamRes.status, durationMs: Date.now() - startTime, clientNote: `Upstream HTTP ${upstreamRes.status}` });
    return res.status(502).json({ error: `Sarvam TTS service returned HTTP ${upstreamRes.status}`, fallbackRequired: true });
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    logSafeApiAccess({ route, method: req.method, status: 504, durationMs: Date.now() - startTime, clientNote: isTimeout ? 'Timeout' : 'Upstream fetch failure' });
    return res.status(504).json({ error: isTimeout ? 'Sarvam TTS upstream request timed out (>15s)' : sanitizeClientError(err), fallbackRequired: true });
  }
}
