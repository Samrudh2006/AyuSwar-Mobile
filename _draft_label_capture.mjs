import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const root = '/tmp/ayuswar-mobile-review/dist';
const LOG = (m) => { console.log(new Date().toISOString().slice(11, 19), m); };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.startsWith('/api/')) { res.writeHead(404); res.end('no backend'); return; }
  if (p.startsWith('/pack/')) {
    const pf = { model: '/tmp/asr-te/model.matmul-int8.onnx', preprocessor: '/tmp/asr-te/preprocessor.onnx', vocab: '/tmp/asr-te/vocab.txt' }[p.slice(6)];
    if (!pf) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': fs.statSync(pf).size });
    fs.createReadStream(pf).pipe(res);
    return;
  }
  let f = path.join(root, p);
  if (p.endsWith('/')) f = path.join(f, 'index.html');
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'index.html');
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    const ext = path.extname(f);
    const mime = (ext === '.js' || ext === '.mjs') ? 'text/javascript' : ext === '.wasm' ? 'application/wasm' : ext === '.css' ? 'text/css' : ext === '.html' ? 'text/html' : ext === '.png' ? 'image/png' : ext === '.svg' ? 'image/svg+xml' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});
srv.listen(8899);

const PACK_FILES = {
  'asr-te-matmul-int8.onnx': '/tmp/asr-te/model.matmul-int8.onnx',
  'asr-te-preprocessor-nemo80-conv.onnx': '/tmp/asr-te/preprocessor.onnx',
  'vocab.txt': '/tmp/asr-te/vocab.txt'
};

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome', headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu',
    '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
    '--use-file-for-fake-audio-capture=/tmp/pilot/ayuswar-local-voice-pilot/js-pilot/fixtures/independent-10s.wav']
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
page.on('console', (m) => { LOG('[page] ' + m.text().slice(0, 300)); });
page.on('pageerror', (e) => LOG('[pageerror] ' + String(e).slice(0, 200)));

// Trace worker traffic (decisive: does the ASR job get posted, does the worker answer?)
await page.evaluateOnNewDocument(() => {
  const OrigWorker = window.Worker;
  window.__workerLog = [];
  window.Worker = function (...args) {
    const w = new OrigWorker(...args);
    window.__workerLog.push('created: ' + args[0]);
    const origPost = w.postMessage.bind(w);
    w.postMessage = (msg, ...rest) => {
      try { window.__workerLog.push('post: ' + (msg && msg.type) + ' jobId=' + (msg && msg.jobId) + ' keys=' + (msg && msg.files ? Object.keys(msg.files).join(',') : '-')); } catch {}
      return origPost(msg, ...rest);
    };
    w.addEventListener('message', (e) => {
      try { window.__workerLog.push('msg: ' + (e.data && e.data.type) + ' jobId=' + (e.data && e.data.jobId) + (e.data && e.data.error ? ' err=' + JSON.stringify(e.data.error).slice(0,150) : '') + (e.data && e.data.transcript ? ' text=' + String(e.data.transcript).slice(0,60) : '')); } catch {}
    });
    w.addEventListener('error', (e) => { window.__workerLog.push('workererror: ' + (e.message || e)); });
    return w;
  };
});

// Seed recording consent (harness state, real consent record shape).
await page.evaluateOnNewDocument(() => {
  try {
    localStorage.setItem('ayuswar_recording_consent_v1', JSON.stringify({
      granted: true, version: '2026-11-20.initial', grantedAt: new Date().toISOString(),
      scope: 'microphone recording for synthetic demo consultations on this device'
    }));
  } catch {}
});

await page.goto('http://localhost:8899/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise((r) => setTimeout(r, 4000));

// 1. Seed the pack into Cache Storage via streaming put (harness; bytes identical
// to the pinned manifest files, sha256 re-verified by the app's own loader at
// transcription time). UI download flow OOMs this 2GB sandbox; install UI was
// separately verified. Consent record seeded in the app's real shape.
const seed = await page.evaluate(async () => {
  try {
    const store = await caches.open('ayuswar-local-voice-v1');
    const files = [['/pack/model', 'asr'], ['/pack/preprocessor', 'preprocessor'], ['/pack/vocab', 'vocab']];
    for (const [url, key] of files) {
      const res = await fetch(url);
      if (!res.ok) return 'seed fetch failed: ' + url;
      await store.put('/__local_voice__/asr/te/' + key, res);
    }
    localStorage.setItem('ayuswar.localAsr.consent.v1', JSON.stringify({
      language: 'te', totalBytes: 187133682, allowCellular: false, consentedAt: new Date().toISOString()
    }));
    return 'seeded';
  } catch (e) { return 'seed error: ' + e; }
});
LOG(seed);
await new Promise((r) => setTimeout(r, 1000));
const installed = seed === 'seeded';
LOG('installed=' + installed);
await page.screenshot({ path: '/downloads/draft-label-1-installed.png' });
if (!installed) { await browser.close(); srv.close(); process.exit(1); }

// 4. Close modal + drawer
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /^close$/i.test((x.textContent || '').trim()));
  b && b.click();
});
await new Promise((r) => setTimeout(r, 800));
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 800));

// 5. Open FloatingAssistant
const opened = await page.evaluate(() => {
  const fab = document.querySelector('[aria-label="Open AyuSwar AI Help voice assistant"]');
  if (fab) { fab.click(); return 'fab clicked: ' + fab.tagName; }
  return 'fab not found';
});
LOG(opened);
await new Promise((r) => setTimeout(r, 2000));
await page.screenshot({ path: '/downloads/draft-label-2-assistant.png' });

// 5b. Switch voice language to Telugu (pack is te-only; local fallback needs language te)
const lang = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /తెలుగు/.test(x.textContent || ''));
  if (b) { b.click(); return 'te clicked'; }
  return 'te lang button not found';
});
LOG(lang);
await new Promise((r) => setTimeout(r, 800));

// 6. Tap "Me to Speak", record ~12s of the fake mic (10s Telugu fixture), tap again to stop
const speak = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /Me to Speak/i.test(x.textContent || ''));
  if (b) { b.click(); return 'speak started'; }
  return 'speak button not found: ' + [...document.querySelectorAll('button')].map((x) => (x.textContent || '').trim()).filter(Boolean).slice(0, 20).join('|');
});
LOG(speak);
await new Promise((r) => setTimeout(r, 12000));
await page.screenshot({ path: '/downloads/draft-label-3-recording.png' });
const stop = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /Stop|Me to Speak/i.test(x.textContent || ''));
  if (b) { b.click(); return 'stop tapped: ' + (b.textContent || '').trim().slice(0, 30); }
  return 'no stop button';
});
LOG(stop);

// 7. Wait for the (local draft) transcript - poll fast, screenshot IMMEDIATELY on match
let got = '';
for (let i = 0; i < 220; i++) {
  await new Promise((r) => setTimeout(r, 400));
  const txt = await page.evaluate(() => document.body.innerText);
  if (/\(local draft\)/i.test(txt)) {
    got = txt.match(/[^\n]*\(local draft\)[^\n]*/i)?.[0] || '';
    await page.screenshot({ path: '/downloads/draft-label-4-result.png' });
    LOG('captured at poll ' + i + ' (~' + (i * 0.4).toFixed(1) + 's)');
    break;
  }
}
LOG('DRAFT LINE: ' + got);
const diag = await page.evaluate(async () => {
  try {
    const store = await caches.open('ayuswar-local-voice-v1');
    const keys = (await store.keys()).map((r) => r.url.replace(location.origin, ''));
    const sizes = {};
    for (const k of keys) { const r = await store.match(k); sizes[k] = r ? (await r.arrayBuffer()).byteLength : 0; }
    return JSON.stringify({ keys, sizes, consent: localStorage.getItem('ayuswar.localAsr.consent.v1') });
  } catch (e) { return 'diag error: ' + e; }
});
LOG('DIAG: ' + diag);
const wlog = await page.evaluate(() => (window.__workerLog || []).join('\n'));
LOG('WORKER LOG:\n' + wlog);
await page.screenshot({ path: '/downloads/draft-label-4-result.png' });
LOG('done');
await browser.close();
srv.close();
process.exit(0);
