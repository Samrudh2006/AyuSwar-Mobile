import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sarvamStatusHandler from '../api/sarvam/status.js';
import gnaniStatusHandler from '../api/gnani/status.js';
import { IndicSpeechService } from '../src/services/indicSpeechService.js';

console.log('--- RUNNING PHASE 32: SPEECH PROVIDER ROUTING & BILLING-SAFETY BEHAVIORAL TESTS ---');
let executed = 0;

function makeRes() {
  return {
    code: null,
    body: null,
    headers: {},
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    getHeader(k) { return this.headers[k.toLowerCase()]; },
    status(code) { this.code = code; return { json: (b) => { this.body = b; } }; },
    json(b) { this.body = b; },
    end() {}
  };
}

function withFetchSpy(fn) {
  const calls = [];
  const orig = globalThis.fetch;
  globalThis.fetch = (...a) => { calls.push(a[0]); return Promise.reject(new Error('fetch must not be called in this scenario')); };
  return Promise.resolve()
    .then(fn)
    .then(() => calls)
    .finally(() => { globalThis.fetch = orig; });
}

// 1. GET /api/sarvam/status with a configured key returns the FREE
//    config-only answer and performs ZERO upstream fetches.
{
  process.env.SARVAM_API_KEY = 'test-key-not-real';
  const res = makeRes();
  const calls = await withFetchSpy(() => sarvamStatusHandler({ method: 'GET', url: '/api/sarvam/status', headers: {} }, res));
  assert.strictEqual(calls.length, 0, 'GET status must never fetch upstream');
  assert.strictEqual(res.code, 200);
  assert.strictEqual(res.body.status, 'CONFIGURED_NOT_PROBED', 'free default must be CONFIGURED_NOT_PROBED');
  assert.strictEqual(res.body.available, false, 'unprobed config must not claim availability');
  delete process.env.SARVAM_API_KEY;
  console.log('✓ Test 1 Passed: Sarvam GET status is free, config-only, zero upstream fetches.');
  executed++;
}

// 2. GET /api/gnani/status with configured keys returns the FREE config-only
//    answer and performs ZERO upstream fetches (F1: the old behavior probed
//    on ANY authorized GET).
{
  process.env.GNANI_API_KEY = 'test-key-not-real';
  const res = makeRes();
  const calls = await withFetchSpy(() => gnaniStatusHandler({ method: 'GET', url: '/api/gnani/status', headers: {} }, res));
  assert.strictEqual(calls.length, 0, 'GET status must never fetch upstream');
  assert.strictEqual(res.code, 200);
  assert.strictEqual(res.body.status, 'CONFIGURED_NOT_PROBED');
  delete process.env.GNANI_API_KEY;
  console.log('✓ Test 2 Passed: Gnani GET status no longer spends upstream quota.');
  executed++;
}

// 3. POST probe WITHOUT the operator env gate is refused before any fetch
//    (both providers), with an explicit probeDisabled marker.
{
  process.env.SARVAM_API_KEY = 'test-key-not-real';
  process.env.GNANI_API_KEY = 'test-key-not-real';
  delete process.env.SARVAM_STATUS_PROBE_ENABLED;
  delete process.env.GNANI_STATUS_PROBE_ENABLED;
  const resS = makeRes();
  const resG = makeRes();
  const calls = await withFetchSpy(async () => {
    await sarvamStatusHandler({ method: 'POST', url: '/api/sarvam/status', headers: {}, body: {} }, resS);
    await gnaniStatusHandler({ method: 'POST', url: '/api/gnani/status', headers: {}, body: {} }, resG);
  });
  assert.strictEqual(calls.length, 0, 'disabled probe must never fetch');
  assert.strictEqual(resS.code, 403);
  assert.strictEqual(resS.body.probeDisabled, true);
  assert.strictEqual(resG.code, 403);
  assert.strictEqual(resG.body.probeDisabled, true);
  delete process.env.SARVAM_API_KEY;
  delete process.env.GNANI_API_KEY;
  console.log('✓ Test 3 Passed: paid probes require the operator env gate; refused clean before any fetch.');
  executed++;
}

// 4. Client routing: Sarvam tier is opt-in (default OFF), skipped in strict
//    Gnani mode, and the pinned local tier stays reachable.
{
  // localStorage stub: default = no keys -> opt-in false
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  };
  const svc = new IndicSpeechService();
  assert.strictEqual(svc.isSarvamProcessingAllowed(), false, 'Sarvam processing must default OFF');
  svc.setSarvamProcessingAllowed(true);
  assert.strictEqual(svc.isSarvamProcessingAllowed(), true);
  svc.setSarvamProcessingAllowed(false);
  assert.strictEqual(svc.isSarvamProcessingAllowed(), false);
  const src = readFileSync(resolve('src/services/indicSpeechService.js'), 'utf8');
  assert.ok(/!options\.skipSarvam && !options\.strictGnani && this\.isSarvamProcessingAllowed\(\)/.test(src), 'sarvam tier must require opt-in AND non-strict mode');
  assert.ok(src.includes("'SKIPPED_STRICT_GNANI'"), 'strict-mode skip must be recorded');
  assert.ok(src.includes("'NOT_OPTED_IN'"), 'opt-out skip must be recorded');
  const iSarvam = src.indexOf("stage: 'sarvam_tts'");
  const iLocal = src.indexOf("stage: 'local_oss_tts'");
  const iStrict = src.indexOf('options.strictGnani && options.suppressBrowserFallback');
  assert.ok(iSarvam < iLocal && iLocal < iStrict, 'sarvam -> local -> strict/browser order preserved (local fallback reachable in every mode)');
  delete globalThis.localStorage;
  console.log('✓ Test 4 Passed: Sarvam is explicit-opt-in, strict-mode-safe, and never shadows the on-device fallback.');
  executed++;
}

// 5. Clinical audio cache posture: BOTH provider TTS routes are
//    private, no-store; no public caching remains anywhere in api/.
{
  const gnaniTts = readFileSync(resolve('api/gnani/tts.js'), 'utf8');
  const sarvamTts = readFileSync(resolve('api/sarvam/tts.js'), 'utf8');
  assert.ok(gnaniTts.includes("Cache-Control', 'private, no-store'"), 'gnani tts must be private, no-store');
  assert.ok(sarvamTts.includes("Cache-Control', 'private, no-store'"), 'sarvam tts must be private, no-store');
  const { readdirSync, statSync } = await import('node:fs');
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(p) : (p.endsWith('.js') ? [p] : []);
  });
  for (const file of walk(resolve('api'))) {
    const s = readFileSync(file, 'utf8');
    assert.ok(!/Cache-Control'?,?\s*'public/.test(s), `${file} must not publicly cache API responses`);
  }
  console.log('✓ Test 5 Passed: no API route publicly caches audio; both TTS routes are private, no-store.');
  executed++;
}

// 6. Disclosure UI: the Sarvam opt-in section exists with trilingual
//    disclosure naming the third-party processor and the cost.
{
  const ui = readFileSync(resolve('src/mobile/MSpeechSettings.jsx'), 'utf8');
  assert.ok(ui.includes('SarvamOptInSection'), 'Sarvam opt-in UI section must exist');
  assert.ok(ui.includes('isSarvamProcessingAllowed') && ui.includes('setSarvamProcessingAllowed'), 'UI must drive the service opt-in flag');
  for (const lang of ['en-IN', 'te-IN', 'hi-IN']) {
    assert.ok(ui.includes(`'${lang}'`), `Sarvam copy must cover ${lang}`);
  }
  assert.ok(ui.includes('third-party processor') || ui.includes('మూడవ పక్ష') || ui.includes('तीसरे पक्ष'), 'disclosure must name third-party processing');
  console.log('✓ Test 6 Passed: Sarvam opt-in disclosure UI is present and trilingual.');
  executed++;
}

console.log(`Phase 32: ${executed}/${executed} passed (0 conditional skips).`);
export const phase32Results = { executed, conditionalSkips: 0 };
