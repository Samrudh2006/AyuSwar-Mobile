/**
 * AyuSwar AI — Groq Whisper Audio Transcription Proxy
 * POST /api/groq/transcribe
 * 
 * Secure Serverless Gateway:
 * - Credentials (GROQ_API_KEY) come EXCLUSIVELY from server environment variables.
 * - Enforces audio payload limits (10MB max).
 * - Upstream host (api.groq.com) is validated against security allowlist.
 */

import { validateUpstreamUrl, checkRateLimit, logSafeApiAccess, sanitizeClientError } from '../_lib/security.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req, res) {
  const startTime = Date.now();
  const route = '/api/groq/transcribe';

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    logSafeApiAccess({ route, method: req.method, status: 405, durationMs: Date.now() - startTime });
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rateLimitResult = checkRateLimit(req, 15);
  if (!rateLimitResult.allowed) {
    res.setHeader('Retry-After', String(rateLimitResult.retryAfterSec));
    logSafeApiAccess({ route, method: req.method, status: 429, durationMs: Date.now() - startTime, clientNote: 'Audio rate limit' });
    return res.status(429).json({
      error: 'Audio processing rate limit exceeded. Please wait before retrying.',
      retryAfterSec: rateLimitResult.retryAfterSec
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
    logSafeApiAccess({ route, method: req.method, status: 503, durationMs: Date.now() - startTime, clientNote: 'GROQ_API_KEY unset' });
    return res.status(503).json({
      error: 'Groq transcription service unavailable: GROQ_API_KEY is not configured on the server.',
      available: false,
      fallbackRequired: true
    });
  }

  const upstreamUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';
  const urlCheck = validateUpstreamUrl(upstreamUrl);
  if (!urlCheck.valid) {
    logSafeApiAccess({ route, method: req.method, status: 500, durationMs: Date.now() - startTime, clientNote: 'Invalid upstream host' });
    return res.status(500).json({
      error: 'Server security configuration error: Upstream host not in allowlist.',
      available: false,
      fallbackRequired: true
    });
  }

  try {
    let audioBuffer = null;
    let language = 'te';

    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      const { audioBase64, language: lang } = req.body || {};
      if (!audioBase64) {
        logSafeApiAccess({ route, method: req.method, status: 400, durationMs: Date.now() - startTime });
        return res.status(400).json({ error: 'Missing audioBase64 payload' });
      }
      audioBuffer = Buffer.from(audioBase64, 'base64');
      if (lang) language = String(lang).slice(0, 5);
    } else if (Buffer.isBuffer(req.body)) {
      audioBuffer = req.body;
      language = (req.headers['x-language-code'] || 'te').slice(0, 5);
    } else if (typeof req.body === 'string') {
      audioBuffer = Buffer.from(req.body, 'base64');
      language = (req.headers['x-language-code'] || 'te').slice(0, 5);
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      logSafeApiAccess({ route, method: req.method, status: 400, durationMs: Date.now() - startTime });
      return res.status(400).json({ error: 'No audio data received' });
    }

    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', audioBlob, 'clinical_consultation.webm');
    formData.append('model', 'whisper-large-v3-turbo');
    if (language && language !== 'auto') {
      formData.append('language', language.split('-')[0]);
    }
    formData.append('response_format', 'verbose_json');
    formData.append('temperature', '0.0');
    formData.append('prompt', 'AyuSwar clinical consultation. Medications and symptoms transcription.');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const upstreamRes = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (upstreamRes.ok) {
      const data = await upstreamRes.json();
      logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime });
      return res.status(200).json({
        text: (data.text || '').trim(),
        segments: data.segments || [],
        duration: data.duration || 0,
        language: data.language || language,
        provider: 'groq_whisper'
      });
    } else {
      logSafeApiAccess({ route, method: req.method, status: upstreamRes.status, durationMs: Date.now() - startTime, clientNote: `Groq STT error ${upstreamRes.status}` });
      return res.status(502).json({
        error: `Groq STT upstream returned HTTP ${upstreamRes.status}`,
        fallbackRequired: true
      });
    }
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    logSafeApiAccess({ route, method: req.method, status: 504, durationMs: Date.now() - startTime, clientNote: isTimeout ? 'Timeout' : 'Fetch failure' });
    return res.status(504).json({
      error: isTimeout ? 'Groq STT request timed out (>15s)' : sanitizeClientError(err),
      fallbackRequired: true
    });
  }
}
