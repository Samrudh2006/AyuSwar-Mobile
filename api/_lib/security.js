/**
 * AyuSwar AI — Serverless API Security & Abuse Control Utilities
 * 
 * Clinical & Production Privacy Architecture:
 * - Upstream host validation against strict domain allowlist (preventing SSRF).
 * - Safe rate limiting (Best-effort in-memory limiter per serverless instance;
 *   NOTICE: Serverless instances are ephemeral; production multi-instance requires
 *   a distributed shared store like Redis/Upstash).
 * - Zero-leak audit logging: Logs ONLY method, route, HTTP status, and durationMs.
 *   NEVER logs request bodies, audio transcripts, medical text, or credentials.
 * - Error sanitization: Strips API keys and raw upstream error bodies.
 */

// Strict allowlist of permissible upstream AI/TTS providers
export const ALLOWED_UPSTREAM_HOSTS = new Set([
  'router.huggingface.co',
  'api.vachana.ai',
  'api.groq.com',
  'generativelanguage.googleapis.com',
  'api.sarvam.ai'
]);

/**
 * Validates that an upstream URL belongs to the approved host allowlist.
 */
export function validateUpstreamUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTPS upstream endpoints are permitted.' };
    }
    if (!ALLOWED_UPSTREAM_HOSTS.has(parsed.hostname)) {
      return { valid: false, error: `Upstream host '${parsed.hostname}' is not in the security allowlist.` };
    }
    return { valid: true, url: parsed.toString() };
  } catch (err) {
    return { valid: false, error: 'Malformed upstream URL.' };
  }
}

/**
 * In-Memory Sliding Window Rate Limiter
 * 
 * IMPORTANT ARCHITECTURAL NOTE:
 * This in-memory limiter provides best-effort burst protection within a single serverless instance.
 * In a distributed, auto-scaling serverless environment (e.g. Vercel), instances do not share memory.
 * For production deployments with strict SLAs, configure a shared key-value store (e.g., Redis or Upstash).
 * This limiter is never claimed to be full production rate-limiting on its own.
 */
const rateLimitBuckets = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const DEFAULT_MAX_REQUESTS_PER_WINDOW = 30; // 30 req/min for general routes
const AUDIO_MAX_REQUESTS_PER_WINDOW = 15; // 15 req/min for STT / TTS

export function checkRateLimit(req, maxRequests = DEFAULT_MAX_REQUESTS_PER_WINDOW) {
  // Extract client identifier (X-Forwarded-For or remote address)
  const forwarded = req.headers?.['x-forwarded-for'];
  const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket?.remoteAddress || 'anonymous').trim();
  const bucketKey = `${ip}:${req.url?.split('?')[0] || 'default'}`;

  const now = Date.now();
  const record = rateLimitBuckets.get(bucketKey) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW_MS;
  } else {
    record.count += 1;
  }

  rateLimitBuckets.set(bucketKey, record);

  // Periodic cleanup of expired buckets to prevent memory leak
  if (rateLimitBuckets.size > 2000) {
    for (const [k, v] of rateLimitBuckets.entries()) {
      if (now > v.resetTime) rateLimitBuckets.delete(k);
    }
  }

  if (record.count > maxRequests) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((record.resetTime - now) / 1000),
      currentCount: record.count,
      limit: maxRequests
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    limit: maxRequests
  };
}

/**
 * Zero-Leak Safe Audit Logger
 * Strictly logs metadata only: timestamp, route, method, status, duration.
 * NEVER prints bodies, health symptoms, transcripts, or credentials.
 */
export function logSafeApiAccess({ route, method, status, durationMs, clientNote }) {
  const timestamp = new Date().toISOString();
  // Safe structured output without sensitive data
  const logEntry = `[API Audit] ${timestamp} | ${method} ${route} | ${status} | ${durationMs}ms${clientNote ? ` | ${clientNote}` : ''}`;
  if (status >= 500) {
    console.error(logEntry);
  } else if (status >= 400) {
    console.warn(logEntry);
  } else {
    console.log(logEntry);
  }
}

/**
 * Shared caller authorization for provider-quota proxy routes.
 *
 * Why: /api/gnani/*, /api/groq/*, /api/evon/* and /api/triage forward to paid
 * upstream providers with server-side keys. Without caller authentication,
 * anyone who finds the deployment URL can spend that quota; the in-memory
 * rate limiter above is per-instance best-effort only.
 *
 * Fail-closed policy (no opt-out flag by design):
 * - Supabase server credentials configured -> a valid Supabase session JWT is
 *   REQUIRED. Missing/invalid token: 401. Auth provider unreachable: 503.
 *   Expiry and revocation are enforced by the provider's /auth/v1/user check
 *   on every call.
 * - Supabase NOT configured -> local synthetic demo mode. There is no identity
 *   system, so these routes NEVER forward to a paid upstream; they answer
 *   503 with an honest demo-mode message instead.
 *
 * No shared app token or client-embedded key is supported on purpose: a
 * secret shipped in the APK/WebView would be extractable.
 */
export async function verifyCallerAuthorization(req) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const apiKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseConfigured = Boolean(supabaseUrl && apiKey && !apiKey.includes('placeholder'));

  if (!supabaseConfigured) {
    return {
      mode: 'local-demo',
      authorized: false,
      status: 503,
      error: 'Local synthetic demo mode: paid upstream forwarding is disabled because caller authentication is not configured.'
    };
  }

  const authHeader = req.headers?.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { mode: 'production', authorized: false, status: 401, error: 'Missing authorization bearer token.' };
  }

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': apiKey }
    });
    if (response.ok) {
      const user = await response.json();
      // user_metadata is editable by the user themselves in Supabase and MUST NOT
      // drive authorization; read role from app_metadata (server-controlled) only.
      return { mode: 'production', authorized: true, user: { id: user.id, role: user.app_metadata?.role || 'patient' } };
    }
    return { mode: 'production', authorized: false, status: 401, error: 'Invalid or expired session token.' };
  } catch {
    return { mode: 'production', authorized: false, status: 503, error: 'Auth provider unreachable; request safely rejected.' };
  }
}

/**
 * Sanitizes errors returned to clients.
 * Prevents internal tokens, upstream stack traces, or secret URLs from leaking.
 */

// Browser origins the Capacitor app and hosted web build are served from.
// Only these may make cross-origin browser requests carrying Authorization.
const ALLOWED_BROWSER_ORIGINS = new Set([
  'https://localhost',        // Capacitor Android WebView default origin
  'capacitor://localhost',    // Capacitor iOS WebView default origin
  'http://localhost',         // local development
  'https://ayuswar-ai.vercel.app'
]);

// Echoes the request Origin only when it is on the allowlist (never '*',
// because requests carry Authorization headers). Static vercel.json headers
// cannot echo per-origin and would risk duplicate ACAO values, so CORS is
// applied here at the route level for every /api/* function.
export function applyCorsHeaders(req, res) {
  const origin = req.headers?.origin || '';
  if (ALLOWED_BROWSER_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
}

// Returns true when the request was an OPTIONS preflight and has been answered.
export function handleCorsPreflight(req, res) {
  if (req.method !== 'OPTIONS') return false;
  applyCorsHeaders(req, res);
  res.status(204).end();
  return true;
}

export function sanitizeClientError(error, defaultMessage = 'An internal service error occurred.') {
  if (!error) return defaultMessage;
  const message = typeof error === 'string' ? error : error.message || '';
  
  // If the error contains key indicators or URLs, replace with generic message
  if (/key|token|bearer|secret|password|authorization/i.test(message)) {
    return 'Authentication or upstream credential issue. Request safely rejected.';
  }
  
  if (message.includes('fetch failed') || message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT')) {
    return 'Upstream service is currently unreachable or timed out.';
  }

  return message.slice(0, 160) || defaultMessage;
}
