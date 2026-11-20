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
await new Promise(r => srv.listen(8893, r));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
// two aspect masters: 2:3 (xxxhdpi/xhdpi/mdpi) and 3:5 (xxhdpi/hdpi)
const jobs = [
  { w: 640, h: 960, out: '/tmp/native-splash-2x3.png' },
  { w: 480, h: 800, out: '/tmp/native-splash-3x5.png' },
];
for (const j of jobs) {
  const p = await b.newPage();
  await p.setViewport({ width: j.w, height: j.h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument(() => { localStorage.setItem('ayuswar_selected_language', 'te-IN'); });
  await p.goto('http://127.0.0.1:8893/?splash', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.addStyleTag({ content: '.m-splash > * { opacity: 1 !important; transform: none !important; }' });
  await new Promise(r => setTimeout(r, 1500));
  await p.screenshot({ path: j.out });
  console.log('captured', j.out);
  await p.close();
}
await b.close(); srv.close();
