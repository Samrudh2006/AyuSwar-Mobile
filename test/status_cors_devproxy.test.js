/**
 * AyuSwar AI — Status-Route Gating, CORS Boundary & Dev-Proxy Parity
 * test/status_cors_devproxy.test.js
 *
 * 1. /api/gnani/status and /api/evon/status: unauthenticated callers get a
 *    config-only answer (AUTH_REQUIRED) with NO upstream fetch and no
 *    key-validity detail; authenticated callers keep the live probe.
 * 2. CORS: OPTIONS preflight answers 204 with the echoed allowlisted origin;
 *    non-allowlisted origins get no Access-Control-Allow-Origin.
 * 3. No stale opt-in API_REQUIRE_AUTH comments remain.
 * 4. The vite dev server delegates to the real api/ handlers (no divergent
 *    dev-only upstream fetch logic in vite.config.js).
 * 5. EmergencyMap marker HTML escapes data-derived fields and coerces heading.
 *
 * No live upstream, Supabase, or network call is made by this suite.
 */

import { readFileSync } from 'node:fs';

const results = [];
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const record = (name, fn) => {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, err });
  }
};

const mockRes = () => {
  const res = { statusCode: 0, body: null, headers: {}, ended: false };
  res.setHeader = (k, v) => (res.headers[k] = v);
  res.getHeader = (k) => res.headers[k];
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    res.body = obj;
    return res;
  };
  res.end = () => {
    res.ended = true;
    return res;
  };
  return res;
};

const ENV_KEYS = ['VITE_SUPABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
const clearEnv = () => ENV_KEYS.forEach((k) => delete process.env[k]);

// --- 1a. gnani/status: unauthenticated -> config-only, no upstream fetch
{
  clearEnv();
  process.env.GNANI_API_KEY = 'test-key-present-but-must-not-be-used';
  let upstreamFetchCount = 0;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    upstreamFetchCount += 1;
    throw new Error('upstream fetch must not happen for unauthenticated status callers');
  };
  try {
    const { default: handler } = await import('../api/gnani/status.js');
    const res = mockRes();
    await handler({ method: 'GET', headers: {}, url: '/api/gnani/status' }, res);
    record('gnani/status unauthenticated: 200 config-only AUTH_REQUIRED, zero upstream fetches', () => {
      assert(res.statusCode === 200, `expected 200, got ${res.statusCode}`);
      assert(res.body?.status === 'AUTH_REQUIRED', `expected AUTH_REQUIRED, got ${res.body?.status}`);
      assert(res.body?.available === false, 'available must be false');
      assert(upstreamFetchCount === 0, `${upstreamFetchCount} upstream fetches happened`);
      assert(!/invalid|unauthorized/i.test(res.body?.reason || ''), 'no key-validity wording leaked');
    });
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.GNANI_API_KEY;
  }
}

// --- 1b. evon/status: unauthenticated -> config-only, no upstream fetch
{
  clearEnv();
  process.env.EVON_API_KEY = 'test-key-present-but-must-not-be-used';
  let upstreamFetchCount = 0;
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    upstreamFetchCount += 1;
    throw new Error('upstream fetch must not happen for unauthenticated status callers');
  };
  try {
    const { default: handler } = await import('../api/evon/status.js');
    const res = mockRes();
    await handler({ method: 'GET', headers: {}, url: '/api/evon/status' }, res);
    record('evon/status unauthenticated: 200 config-only AUTH_REQUIRED, zero upstream fetches', () => {
      assert(res.statusCode === 200, `expected 200, got ${res.statusCode}`);
      assert(res.body?.status === 'AUTH_REQUIRED', `expected AUTH_REQUIRED, got ${res.body?.status}`);
      assert(res.body?.available === false, 'available must be false');
      assert(upstreamFetchCount === 0, `${upstreamFetchCount} upstream fetches happened`);
    });
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.EVON_API_KEY;
  }
}

// --- 1c. static: both status files gate the probe behind verifyCallerAuthorization
record('gnani/status + evon/status: caller-auth gate precedes upstream probe (static order)', () => {
  for (const file of ['api/gnani/status.js', 'api/evon/status.js']) {
    const src = readFileSync(file, 'utf8');
    const gateIdx = src.indexOf('callerAuth.authorized');
    const fetchIdx = src.search(/fetch\(/);
    assert(gateIdx !== -1, `${file}: callerAuth.authorized check missing`);
    assert(fetchIdx === -1 || gateIdx < fetchIdx, `${file}: upstream fetch not behind the gate`);
  }
});

// --- 2a. CORS preflight: allowed origin echoed, 204
{
  clearEnv();
  const { default: handler } = await import('../api/groq/status.js');
  const res = mockRes();
  await handler({ method: 'OPTIONS', headers: { origin: 'https://localhost' }, url: '/api/groq/status' }, res);
  record('CORS preflight: OPTIONS from https://localhost -> 204 with echoed origin', () => {
    assert(res.statusCode === 204, `expected 204, got ${res.statusCode}`);
    assert(res.ended === true, 'preflight must end the response');
    assert(res.headers['Access-Control-Allow-Origin'] === 'https://localhost', 'origin not echoed');
    assert(/Authorization/.test(res.headers['Access-Control-Allow-Headers'] || ''), 'Authorization header not allowed');
  });
}

// --- 2b. CORS preflight: disallowed origin gets no ACAO
{
  clearEnv();
  const { default: handler } = await import('../api/groq/status.js');
  const res = mockRes();
  await handler({ method: 'OPTIONS', headers: { origin: 'https://evil.example.com' }, url: '/api/groq/status' }, res);
  record('CORS preflight: disallowed origin gets 204 with NO Access-Control-Allow-Origin', () => {
    assert(res.statusCode === 204, `expected 204, got ${res.statusCode}`);
    assert(res.headers['Access-Control-Allow-Origin'] === undefined, 'ACAO leaked to disallowed origin');
  });
}

// --- 2c. CORS on normal response path (allowed origin)
{
  clearEnv();
  delete process.env.GROQ_API_KEY;
  const { default: handler } = await import('../api/groq/status.js');
  const res = mockRes();
  await handler({ method: 'GET', headers: { origin: 'capacitor://localhost' }, url: '/api/groq/status' }, res);
  record('CORS: normal GET from capacitor://localhost carries echoed ACAO', () => {
    assert(res.statusCode === 200, `expected 200, got ${res.statusCode}`);
    assert(res.headers['Access-Control-Allow-Origin'] === 'capacitor://localhost', 'ACAO missing on normal response');
  });
}

// --- 3. no stale opt-in API_REQUIRE_AUTH comments anywhere
record('No stale opt-in API_REQUIRE_AUTH comments remain in api/ or src/', () => {
  const files = ['api/evon/chat.js', 'api/groq/chat.js', 'api/gnani/stt.js', 'api/triage.js'];
  for (const file of files) {
    assert(!readFileSync(file, 'utf8').includes('API_REQUIRE_AUTH'), `${file} still mentions API_REQUIRE_AUTH`);
  }
});

// --- 4. dev server delegates to real handlers; no dev-only upstream fetch logic
record('vite.config.js: dev middleware delegates to api/ handlers, no inline upstream fetch', () => {
  const src = readFileSync('vite.config.js', 'utf8');
  assert(src.includes('vercelDevAdapter'), 'dev adapter missing');
  assert(!/server\.middlewares\.use\('\/api\/[^']+',\s*async/.test(src), 'inline async dev middleware remains');
  assert(!src.includes('api.vachana.ai'), 'dev-only Gnani upstream URL remains');
  assert(!src.includes('chat/completions'), 'dev-only Evon upstream path remains');
  for (const mount of ['/api/gnani/status', '/api/gnani/tts', '/api/gnani/stt', '/api/gnani/asr', '/api/evon/status', '/api/evon/chat', '/api/groq/status', '/api/groq/chat', '/api/groq/transcribe', '/api/triage']) {
    assert(src.includes(`'${mount}'`), `dev mount missing for ${mount}`);
  }
});

// --- 5. EmergencyMap: heading coerced, data-derived marker fields escaped
record('EmergencyMap: heading number-coerced, hospital name/eta escaped in innerHTML', () => {
  const src = readFileSync('src/components/EmergencyMap.jsx', 'utf8');
  assert(!src.includes('rotate(${heading}deg)'), 'raw heading interpolation remains');
  assert(src.includes('safeHeading'), 'safeHeading coercion missing');
  assert(src.includes('escapeHtml(hosp.shortName'), 'hospital name not escaped');
  assert(src.includes('escapeHtml(hosp.etaMinutes)'), 'etaMinutes not escaped');
});

// --- report
let passed = 0;
for (const r of results) {
  if (r.ok) {
    passed += 1;
    console.log(`✓ ${r.name}`);
  } else {
    console.error(`✗ ${r.name}: ${r.err.message}`);
  }
}
console.log(`status_cors_devproxy: ${passed}/${results.length} passed`);
if (passed !== results.length) process.exit(1);
