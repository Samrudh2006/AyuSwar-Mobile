/**
 * AyuSwar AI — API Reliability Chain (Phase 11 audit regression)
 * test/phase38_api_reliability_chain.test.js
 *
 * Assistant answer chain under provider failures: HTTP 500 on both providers,
 * malformed JSON, full network down. Verifies labeled deterministic fallbacks,
 * exactly one call per provider (no retries), no thrown errors, and that the
 * emergency and strict-RAG refusal paths never touch the network.
 * Stubs global fetch only; runs fully local.
 */
// Stubs global fetch only; exercises the real aiBrainService/gnaniEvonService chain.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};

let fetchCalls;
let fetchImpl;
globalThis.fetch = (url, opts) => { fetchCalls.push(url); return fetchImpl(url, opts); };

const brain = await import('../src/services/aiBrainService.js');

const results = [];
const record = async (name, fn) => {
  try { await fn(); results.push([name, true]); }
  catch (e) { results.push([name, false, e.message]); }
};
const assert = (c, m) => { if (!c) throw new Error(m); };
const resp500 = () => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ error: 'boom' }) });

// 1. Both providers return HTTP 500 -> labeled deterministic fallback, exactly one call per provider, no retry
await record('both providers 500 -> labeled fallback, no retry, no throw', async () => {
  fetchCalls = [];
  fetchImpl = resp500;
  const reply = await brain.askAyuSwarBrain('what are the OPD timings today?', 'patient', {});
  assert(typeof reply === 'string' && reply.length > 0, 'empty/non-string reply');
  assert(fetchCalls.length === 2, `expected exactly 2 fetch calls (groq+evon, no retries), got ${fetchCalls.length}`);
  assert(/demo|prototype|మార్గదర్శకత్వం|मार्गदर्शन|consult/i.test(reply), 'fallback reply lacks honesty label: ' + reply.slice(0, 120));
});

// 2. Groq leg returns 200 with malformed JSON body -> chain degrades to fallback, no crash
await record('malformed JSON from groq -> fallback, no crash', async () => {
  fetchCalls = [];
  fetchImpl = (url) => url.includes('/api/groq/')
    ? Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError('Unexpected token <')) })
    : resp500();
  const reply = await brain.askAyuSwarBrain('what are the OPD timings today?', 'patient', {});
  assert(typeof reply === 'string' && reply.length > 0, 'empty reply after malformed JSON');
  assert(fetchCalls.length === 2, `expected 2 fetch calls, got ${fetchCalls.length}`);
});

// 3. Emergency prompt with network fully down -> deterministic emergency protocol, ZERO network calls
await record('emergency red-flag prompt -> deterministic protocol without any network call', async () => {
  fetchCalls = [];
  fetchImpl = () => Promise.reject(new Error('network down'));
  const reply = await brain.askAyuSwarBrain('I have severe chest pain and cant breathe', 'patient', {});
  assert(reply.includes('EMERGENCY') && reply.includes('112'), 'emergency protocol not returned: ' + reply.slice(0, 120));
  assert(fetchCalls.length === 0, `emergency path made ${fetchCalls.length} network calls`);
});

// 4. Floating assistant strict-RAG refusal with no knowledge match -> refusal, ZERO network calls
await record('strict-RAG assistant with no match -> refusal without network call', async () => {
  fetchCalls = [];
  fetchImpl = () => Promise.reject(new Error('network down'));
  const reply = await brain.askAyuSwarBrain('zzqwxv unrelated gibberish query 12345', 'patient', { source: 'floating_assistant' });
  assert(/prototype|consult/i.test(reply), 'strict-RAG refusal missing: ' + reply.slice(0, 120));
  assert(fetchCalls.length === 0, `strict refusal path made ${fetchCalls.length} network calls`);
});

// 5. Telugu emergency prompt -> Telugu deterministic protocol, no network
await record('telugu emergency prompt -> telugu protocol without network', async () => {
  fetchCalls = [];
  fetchImpl = () => Promise.reject(new Error('network down'));
  const reply = await brain.askAyuSwarBrain('నాకు గుండె నొప్పి గా ఉంది', 'patient', {});
  assert(reply.includes('EMERGENCY') && reply.includes('108'), 'telugu emergency protocol not returned');
  assert(fetchCalls.length === 0, `made ${fetchCalls.length} network calls`);
});

let pass = 0;
for (const [n, ok, err] of results) { console.log((ok ? 'PASS ' : 'FAIL ') + n + (err ? ' :: ' + err : '')); if (ok) pass++; }
console.log(`phase38_api_reliability_chain: ${pass}/${results.length} passed`);
process.exit(pass === results.length ? 0 : 1);
