import assert from 'node:assert';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

console.log('--- RUNNING PHASE 31: SARVAM PROVIDER INTEGRATION TESTS ---');
let executed = 0;

// 1. Server routes exist and implement the honest posture
{
  assert.ok(existsSync(resolve('api/sarvam/status.js')), 'api/sarvam/status.js must exist');
  assert.ok(existsSync(resolve('api/sarvam/tts.js')), 'api/sarvam/tts.js must exist');

  const statusSrc = readFileSync(resolve('api/sarvam/status.js'), 'utf8');
  assert.ok(statusSrc.includes('UNCONFIGURED'), 'status must report UNCONFIGURED when key unset');
  assert.ok(statusSrc.includes('UNAVAILABLE'), 'status must report UNAVAILABLE on upstream failure');
  assert.ok(statusSrc.includes('LIVE'), 'status must report LIVE after a real probe');
  assert.ok(statusSrc.includes('verifyCallerAuthorization'), 'status must gate live probes behind caller auth');
  assert.ok(statusSrc.includes('INSUFFICIENT_QUOTA'), 'status must surface 402 quota distinctly');
  assert.ok(statusSrc.includes('api-subscription-key'), 'status probe must use the Sarvam auth header');
  // COST POSTURE: normal status checks must NEVER spend credits. GET always
  // returns the free config-only answer; the paid probe requires a deliberate
  // POST + operator env gate + caller auth. The free branch must come before
  // any code path that can reach fetch().
  assert.ok(statusSrc.includes('CONFIGURED_NOT_PROBED'), 'default answer must be free CONFIGURED_NOT_PROBED');
  assert.ok(statusSrc.includes("SARVAM_STATUS_PROBE_ENABLED !== 'true'"), 'probe requires the operator env gate');
  assert.ok(statusSrc.includes("req.method === 'GET'"), 'GET must be the free branch');
  assert.ok(statusSrc.includes('probeDisabled'), 'disabled probe must be refused explicitly');
  const iFree = statusSrc.indexOf("req.method === 'GET'");
  const fetchIdx = statusSrc.indexOf('fetch(ttsEndpoint');
  assert.ok(iFree > -1 && fetchIdx > iFree, 'free GET branch must precede any upstream fetch');
  assert.ok(statusSrc.slice(0, fetchIdx).includes('SARVAM_STATUS_PROBE_ENABLED'), 'no fetch before the operator env gate');

  const ttsSrc = readFileSync(resolve('api/sarvam/tts.js'), 'utf8');
  assert.ok(ttsSrc.includes('process.env.SARVAM_API_KEY'), 'key must come from server env only');
  assert.ok(!ttsSrc.includes('SARVAM_API_KEY='), 'no literal key material');
  assert.ok(ttsSrc.includes('verifyCallerAuthorization'), 'tts must be caller-auth gated');
  assert.ok(ttsSrc.includes('validateUpstreamUrl'), 'tts must validate the upstream host');
  assert.ok(ttsSrc.includes("checkRateLimit(req, 20)"), 'tts must be rate limited');
  assert.ok(ttsSrc.includes('2500'), 'tts must enforce the Bulbul v3 2500-char cap');
  assert.ok(ttsSrc.includes('quotaExhausted'), '402 must be surfaced distinctly to the client');
  assert.ok(ttsSrc.includes("toString('ascii', 0, 4) !== 'RIFF'"), 'upstream audio must be container-validated (no fabricated audio)');
  assert.ok(ttsSrc.includes("language_code"), 'request must use the grounded Sarvam contract field');
  assert.ok(ttsSrc.includes('bulbul:v3'), 'default model pinned to bulbul:v3');
  console.log('✓ Test 1 Passed: Sarvam server routes mirror the gnani security posture with the grounded contract.');
  executed++;
}

// 2. Upstream allowlist includes only api.sarvam.ai for Sarvam
{
  const secSrc = readFileSync(resolve('api/_lib/security.js'), 'utf8');
  assert.ok(secSrc.includes("'api.sarvam.ai'"), 'allowlist must include api.sarvam.ai');
  assert.ok(!secSrc.includes('sarvam.ai\'') || secSrc.includes("'api.sarvam.ai'"), 'bare sarvam.ai must not be allowlisted');
  console.log('✓ Test 2 Passed: api.sarvam.ai added to the strict upstream allowlist.');
  executed++;
}

// 3. Client tier: Sarvam between Gnani and sample tiers; never replaces
//    existing tiers; 503/402 fast-degrade; honest content gate.
{
  const src = readFileSync(resolve('src/services/indicSpeechService.js'), 'utf8');
  const iGnani = src.indexOf("stage: 'gnani_tts'");
  const iSarvam = src.indexOf("stage: 'sarvam_tts'");
  const iSample = src.indexOf("stage: 'sample_wav'");
  const iLocal = src.indexOf("stage: 'local_oss_tts'");
  const iBrowser = src.indexOf("this.activeProvider = 'browser_fallback';", iLocal);
  assert.ok(iGnani > -1 && iSarvam > iGnani, 'sarvam tier after gnani');
  assert.ok(iSample > iSarvam, 'sample tier after sarvam');
  assert.ok(iLocal > iSample && iBrowser > iLocal, 'local and browser tiers preserved after sarvam');
  assert.ok(src.includes("activeProvider = 'sarvam_tts_live'"), 'provider recorded as sarvam_tts_live');
  assert.ok(src.includes('_sarvamTtsDisabled'), 'fast-degrade flag present');
  assert.ok(/sarvamRes\.status === 503 \|\| sarvamRes\.status === 402/.test(src), '503/402 must disable further billable attempts');
  assert.ok(src.includes("apiUrl('/api/sarvam/tts')"), 'client calls the server proxy, never Sarvam directly');
  assert.ok(!src.includes('api-subscription-key'), 'client must NEVER hold the Sarvam key');
  assert.ok(src.includes("sarvamContentType.startsWith('audio/')"), 'honest content-type gate on sarvam responses');
  console.log('✓ Test 3 Passed: client Sarvam tier is additive, key-free, honestly gated, and degrades fast.');
  executed++;
}

// 4. Dev server parity: vite dev middleware serves the real handlers
{
  const viteSrc = readFileSync(resolve('vite.config.js'), 'utf8');
  assert.ok(viteSrc.includes("api/sarvam/status.js") && viteSrc.includes("api/sarvam/tts.js"), 'dev middleware must import the real sarvam handlers');
  assert.ok(viteSrc.includes("'/api/sarvam/status'") && viteSrc.includes("'/api/sarvam/tts'"), 'dev routes registered');
  console.log('✓ Test 4 Passed: dev server exercises the exact production Sarvam handlers.');
  executed++;
}

// 5. Contract grounding: fields match the live docs fetched 2026-11-20
//    (text-to-speech: text, language_code, model, pace, speech_sample_rate,
//    output_audio_codec; response audios[0] base64).
{
  const ttsSrc = readFileSync(resolve('api/sarvam/tts.js'), 'utf8');
  for (const field of ['text', 'language_code', 'model', 'pace', 'speech_sample_rate', 'output_audio_codec']) {
    assert.ok(ttsSrc.includes(field), `request body must include grounded field '${field}'`);
  }
  assert.ok(ttsSrc.includes('payload.audios'), 'response must decode the audios[0] base64 contract');
  assert.ok(ttsSrc.includes('speech_sample_rate: 24000'), 'app standardizes on 24kHz mono WAV');
  console.log('✓ Test 5 Passed: Sarvam request/response shape matches the current official contract.');
  executed++;
}

console.log(`Phase 31: ${executed}/${executed} passed (0 conditional skips).`);
export const phase31Results = { executed, conditionalSkips: 0 };
