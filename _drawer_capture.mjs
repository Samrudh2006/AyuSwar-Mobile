import http from 'http'; import fs from 'fs'; import path from 'path';
import puppeteer from 'puppeteer-core';
const root = '/tmp/ayuswar-mobile-review/dist';
const mime = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml', '.wasm':'application/wasm', '.onnx':'application/octet-stream', '.woff2':'font/woff2' };
const srv = http.createServer((req,res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  let f = path.join(root, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'index.html');
  res.setHeader('Content-Type', mime[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => srv.listen(8891, r));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--font-render-hinting=none'] });
for (const loc of ['kn-IN','mr-IN','te-IN','ta-IN','hi-IN']) {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument(l => { localStorage.setItem('ayuswar_selected_language', l); }, loc);
  await p.goto('http://127.0.0.1:8891/', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2500));
  await p.screenshot({ path: '/downloads/hero-' + loc + '.png' });
  await p.evaluate(() => { const tabs = [...document.querySelectorAll('.m-tab')]; tabs[tabs.length-1]?.click(); });
  await new Promise(r => setTimeout(r, 900));
  const drawerText = await p.evaluate(() => document.querySelector('.m-drawer')?.innerText || 'NO DRAWER');
  console.log('=== ' + loc + ' drawer contains:'); console.log(drawerText.split('\n').filter(l => l.trim()).slice(0, 25).join(' | '));
  const el = await p.$('.m-drawer');
  if (el) await el.screenshot({ path: '/downloads/drawer-' + loc + '.png' });
  await p.close();
}
await b.close(); srv.close();
