/**
 * AyuSwar AI — Groq Cloud Inference Status Endpoint
 * GET /api/groq/status
 * 
 * Reports configuration readiness of the Groq LPU reasoning proxy.
 * To preserve API quotas and keep health checks completely free, this endpoint
 * checks server-side environment variable configuration WITHOUT issuing billable upstream completions.
 * Keys are NEVER sent to the client.
 */

import { checkRateLimit, logSafeApiAccess } from '../_lib/security.js';

export default async function handler(req, res) {
  const startTime = Date.now();
  const route = '/api/groq/status';

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

  const apiKey = process.env.GROQ_API_KEY;
  const isConfigured = Boolean(apiKey && !apiKey.includes('placeholder') && apiKey.length > 10);

  if (!isConfigured) {
    logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime, clientNote: 'GROQ_API_KEY unset' });
    return res.status(200).json({
      available: false,
      configured: false,
      status: 'UNCONFIGURED',
      provider: 'local_heuristic_fallback',
      model: 'llama-3.3-70b-versatile',
      ready: false,
      proxyRoute: '/api/groq/chat',
      reason: 'GROQ_API_KEY server environment variable is not configured. Using local heuristic/Evon fallback.'
    });
  }

  logSafeApiAccess({ route, method: req.method, status: 200, durationMs: Date.now() - startTime, clientNote: 'GROQ_API_KEY configured' });
  return res.status(200).json({
    available: true,
    configured: true,
    status: 'CONFIGURED',
    provider: 'groq_lpu_cloud',
    model: 'llama-3.3-70b-versatile',
    ready: true,
    proxyRoute: '/api/groq/chat',
    latencyMs: null, // Zero upstream calls performed to preserve credits
    reason: 'GROQ_API_KEY is configured on server. Proxy gateway is active.'
  });
}
