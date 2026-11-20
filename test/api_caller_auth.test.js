/**
 * AyuSwar AI — Provider-Proxy Caller Authorization Verification
 * test/api_caller_auth.test.js
 *
 * Fail-closed policy for quota-forwarding routes:
 * 1. Local demo mode (no Supabase env): proxy routes must NOT forward to
 *    paid upstreams - they answer 503 honestly.
 * 2. Production mode (Supabase env set): missing bearer token -> 401.
 * 3. The static guard: every quota-forwarding route must call
 *    verifyCallerAuthorization before any upstream fetch.
 * 4. Clients attach the Supabase session JWT via authHeaders().
 *
 * No live upstream or Supabase call is made by this suite.
 */

import { readFileSync } from 'node:fs';

const results = [];
const check = (name, fn) => {
  Promise.resolve()
    .then(fn)
    .then(() => results.push({ name, ok: true }))
    .catch((err) => results.push({ name, ok: false, err }));
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const mockRes = () => {
  const res = { statusCode: 0, body: null, headers: {} };
  res.setHeader = (k, v) => (res.headers[k] = v);
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    res.body = obj;
    return res;
  };
  return res;
};

const ENV_KEYS = ['VITE_SUPABASE_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
const clearEnv = () => ENV_KEYS.forEach((k) => delete process.env[k]);

// 1. Local demo mode: stt route must refuse before any upstream forward
await (async () => {
  clearEnv();
  delete process.env.GNANI_API_KEY;
  const { default: handler } = await import('../api/gnani/stt.js');
  const res = mockRes();
  await handler({ method: 'POST', headers: {}, url: '/api/gnani/stt' }, res);
  try {
    assert(res.statusCode === 503, `expected 503 in demo mode, got ${res.statusCode}`);
    assert(/demo mode/i.test(res.body?.error || ''), 'honest demo-mode message missing');
    results.push({ name: 'demo mode: /api/gnani/stt refuses without forwarding (503)', ok: true });
  } catch (err) {
    results.push({ name: 'demo mode: /api/gnani/stt refuses without forwarding (503)', ok: false, err });
  }
})();

// 2. Production mode: missing token -> 401
await (async () => {
  clearEnv();
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  const { default: handler } = await import('../api/groq/chat.js');
  const res = mockRes();
  await handler({ method: 'POST', headers: { 'content-type': 'application/json' }, url: '/api/groq/chat' }, res);
  clearEnv();
  try {
    assert(res.statusCode === 401, `expected 401 without token, got ${res.statusCode}`);
    results.push({ name: 'production mode: missing bearer token -> 401', ok: true });
  } catch (err) {
    results.push({ name: 'production mode: missing bearer token -> 401', ok: false, err });
  }
})();

// 3. Static guard: every quota route calls verifyCallerAuthorization
{
  const routes = ['api/gnani/stt.js', 'api/gnani/tts.js', 'api/groq/chat.js', 'api/groq/transcribe.js', 'api/evon/chat.js', 'api/triage.js'];
  try {
    for (const r of routes) {
      const src = readFileSync(r, 'utf-8');
      assert(src.includes('verifyCallerAuthorization(req)'), `${r} missing caller-auth call`);
      // Within the request handler, caller auth must precede any upstream
      // call. Helpers defined above the handler (triage's advisory query)
      // must only be invoked after the auth gate.
      const handlerIdx = src.indexOf('export default async function handler');
      const authIdx = src.indexOf('verifyCallerAuthorization(req)', handlerIdx);
      assert(authIdx > handlerIdx, `${r}: caller-auth call not inside handler`);
      const fetchInHandler = src.indexOf('fetch(', handlerIdx);
      assert(fetchInHandler === -1 || authIdx < fetchInHandler, `${r}: upstream fetch before caller auth`);
      const advisoryIdx = src.indexOf('queryOptionalModelAdvisory(cleanTranscript', handlerIdx);
      if (advisoryIdx !== -1) {
        assert(authIdx < advisoryIdx, `${r}: model advisory invoked before caller auth`);
      }
    }
    results.push({ name: 'all 6 quota routes gate upstream behind verifyCallerAuthorization', ok: true });
  } catch (err) {
    results.push({ name: 'all 6 quota routes gate upstream behind verifyCallerAuthorization', ok: false, err });
  }
}

// 4. Client side: authHeaders exists and callers use it
{
  try {
    const apiBase = readFileSync('src/utils/apiBase.js', 'utf-8');
    assert(apiBase.includes('export async function authHeaders'), 'authHeaders missing in apiBase.js');
    const callers = [
      'src/services/aiBrainService.js',
      'src/services/indicSpeechService.js',
      'src/services/gnaniEvonService.js',
      'src/services/sanjivaniEmergencyService.js'
    ];
    for (const c of callers) {
      const src = readFileSync(c, 'utf-8');
      assert(src.includes('await authHeaders()'), `${c} does not attach caller token`);
    }
    results.push({ name: 'clients attach Supabase session JWT via authHeaders()', ok: true });
  } catch (err) {
    results.push({ name: 'clients attach Supabase session JWT via authHeaders()', ok: false, err });
  }
}

// 5. No health identifiers in QR/URL query strings (logs/history leak)
{
  try {
    const portal = readFileSync('src/components/PatientPortal.jsx', 'utf-8');
    assert(!/\?abha=/.test(portal), 'patient-portal QR still carries ?abha=');
    assert(!/\?pt=/.test(portal), 'patient-portal QR still carries ?pt=');
    results.push({ name: 'QR code value carries no patient identifiers in the URL', ok: true });
  } catch (err) {
    results.push({ name: 'QR code value carries no patient identifiers in the URL', ok: false, err });
  }
}

let failed = 0;
for (const r of results) {
  if (r.ok) console.log(`  ✓ ${r.name}`);
  else {
    failed += 1;
    console.error(`  ✗ ${r.name}: ${r.err.message}`);
  }
}
console.log(`api_caller_auth: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
