import http from 'http'; import fs from 'fs'; import path from 'path';
import puppeteer from 'puppeteer-core';
const root = '/tmp/ayuswar-mobile-review/dist';
const mime = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.wasm':'application/wasm', '.onnx':'application/octet-stream', '.woff2':'font/woff2' };
const srv = http.createServer((req,res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  let f = path.join(root, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'index.html');
  res.setHeader('Content-Type', mime[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => srv.listen(8892, r));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
for (const loc of ['te-IN','en-IN']) {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument(l => { localStorage.setItem('ayuswar_selected_language', l); }, loc);
  await p.goto('http://127.0.0.1:8892/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.addStyleTag({ content: '.m-splash > * { opacity: 1 !important; transform: none !important; }' });
  await new Promise(r => setTimeout(r, 1500));
  console.log(loc, 'hide class at shot:', await p.evaluate(() => document.querySelector('.m-splash')?.className));
  const splashVisible = await p.evaluate(() => !!document.querySelector('.m-splash'));
  await p.screenshot({ path: '/downloads/splash2-' + loc + '.png' });
  console.log(loc, 'splash visible at 1.2s:', splashVisible);
  await new Promise(r => setTimeout(r, 2600));
  const splashGone = await p.evaluate(() => !document.querySelector('.m-splash'));
  const homeVisible = await p.evaluate(() => !!document.querySelector('.m-hero'));
  console.log(loc, 'splash gone at 3.8s:', splashGone, '| home rendered:', homeVisible);
  await p.screenshot({ path: '/downloads/after-splash-' + loc + '.png' });
  await p.close();
}
await b.close(); srv.close();
