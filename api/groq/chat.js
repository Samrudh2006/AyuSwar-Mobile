/**
 * AyuSwar AI — Groq LPU Cloud Reasoning & Whisper Proxy
 * POST /api/groq/chat
 * 
 * Secure Serverless Gateway:
 * - Credentials (GROQ_API_KEY) come EXCLUSIVELY from server environment variables.
 *   Browser / localStorage keys are never used and no secrets are sent to clients.
 * - Upstream host (api.groq.com) is validated against security allowlist.
 * - Safe rate limiting (best-effort serverless burst protection).
 * - Zero-leak audit logging: Never logs medical text, prompts, or patient data.
 */

import { validateUpstreamUrl, checkRateLimit, logSafeApiAccess, sanitizeClientError, verifyCallerAuthorization, applyCorsHeaders, handleCorsPreflight } from '../_lib/security.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100kb'
    }
  }
};

export default async function handler(req, res) {
  applyCorsHeaders(req, res);
  if (handleCorsPreflight(req, res)) return;
  const startTime = Date.now();
  const route = '/api/groq/chat';

  // 1. Method check
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    logSafeApiAccess({ route, method: req.method, status: 405, durationMs: Date.now() - startTime });
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Content-Type check
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    logSafeApiAccess({ route, method: req.method, status: 415, durationMs: Date.now() - startTime });
    return res.status(415).json({ error: 'Unsupported Media Type: application/json required' });
  }

  // 3. Rate limiting (Up to 30 requests per minute)
  const rateLimitResult = checkRateLimit(req, 30);
  if (!rateLimitResult.allowed) {
    res.setHeader('Retry-After', String(rateLimitResult.retryAfterSec));
    logSafeApiAccess({ route, method: req.method, status: 429, durationMs: Date.now() - startTime, clientNote: 'Rate limited' });
    return res.status(429).json({
      error: 'Too Many Requests. Please pause between queries.',
      retryAfterSec: rateLimitResult.retryAfterSec
    });
  }

  // Caller authorization (mandatory for all callers, fail-closed, no opt-out flag)
  const callerAuth = await verifyCallerAuthorization(req);
  if (!callerAuth.authorized) {
    logSafeApiAccess({ route, method: req.method, status: callerAuth.status, durationMs: Date.now() - startTime, clientNote: 'Caller auth rejected' });
    return res.status(callerAuth.status).json({ error: callerAuth.error });
  }

  // 4. Server-Side Environment Variable Only
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.includes('placeholder')) {
    logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime, clientNote: 'GROQ_API_KEY unset' });
    return res.status(200).json({
      status: 'UNCONFIGURED',
      error: 'Groq service unconfigured: GROQ_API_KEY server environment variable is not set.',
      available: false,
      fallbackRequired: true
    });
  }

  const upstreamUrl = 'https://api.groq.com/openai/v1/chat/completions';
  const urlValidation = validateUpstreamUrl(upstreamUrl);
  if (!urlValidation.valid) {
    logSafeApiAccess({ route, method: req.method, status: 500, durationMs: Date.now() - startTime, clientNote: 'Invalid upstream host' });
    return res.status(500).json({
      error: 'Server security configuration error: Upstream host is not in allowlist.',
      available: false,
      fallbackRequired: true
    });
  }

  const { prompt, systemInstruction, preferredModel = 'qwen/qwen3.8-27b', maxTokens = 650, messages } = req.body || {};

  if (!prompt && (!Array.isArray(messages) || messages.length === 0)) {
    logSafeApiAccess({ route, method: req.method, status: 400, durationMs: Date.now() - startTime });
    return res.status(400).json({ error: 'Missing required prompt or messages array.' });
  }

  const safeTokens = Math.min(Math.max(1, parseInt(maxTokens, 10) || 650), 2048);

  let chatMessages = [];
  if (Array.isArray(messages) && messages.length > 0) {
    chatMessages = messages.slice(-10).map(m => ({
      role: (m.role === 'system' || m.role === 'assistant') ? m.role : 'user',
      content: String(m.content || '').slice(0, 4000)
    }));
  } else {
    if (systemInstruction) {
      chatMessages.push({ role: 'system', content: String(systemInstruction).slice(0, 2500) });
    }
    chatMessages.push({ role: 'user', content: String(prompt || '').slice(0, 4000) });
  }

  const candidateModels = [
    preferredModel || 'qwen/qwen3.8-27b',
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b'
  ];

  for (const model of [...new Set(candidateModels)]) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const upstreamRes = await fetch(upstreamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: chatMessages,
          temperature: 0.1,
          max_tokens: safeTokens
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (upstreamRes.ok) {
        const data = await upstreamRes.json();
        const text = data?.choices?.[0]?.message?.content?.trim() || '';
        logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime });
        return res.status(200).json({
          success: true,
          available: true,
          text,
          model,
          usage: data?.usage || null
        });
      } else {
        const status = upstreamRes.status;
        // If model rate limited or unavailable, try next candidate
        if (status === 429 || status === 404 || status === 503) {
          continue;
        }
        logSafeApiAccess({ route, method: req.method, status, durationMs: Date.now() - startTime, clientNote: `Groq error ${status}` });
        return res.status(502).json({
          error: `Groq upstream returned HTTP ${status}. Using safe offline clinical fallback.`,
          fallbackRequired: true
        });
      }
    } catch (err) {
      continue;
    }
  }

  logSafeApiAccess({ route, method: req.method, status: 504, durationMs: Date.now() - startTime, clientNote: 'All Groq models exhausted' });
  return res.status(504).json({
    error: 'Groq inference unavailable or timed out. Falling back to local clinical knowledge.',
    fallbackRequired: true
  });
}
