import http from 'http'; import fs from 'fs'; import path from 'path';
import puppeteer from 'puppeteer-core';
const root = '/tmp/ayuswar-mobile-review/dist';
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2' };
const srv = http.createServer((req,res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  let f = path.join(root, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'index.html');
  res.setHeader('Content-Type', mime[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => srv.listen(8896, r));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.goto('http://127.0.0.1:8896/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise(r => setTimeout(r, 3200));
await p.evaluate(() => window.scrollTo(0, 700));
await new Promise(r => setTimeout(r, 800));
const info = await p.evaluate(() => {
  const bg = document.querySelector('.m-appbg').getBoundingClientRect();
  const vv = window.visualViewport;
  return { bg: {l:bg.left,r:bg.right,w:bg.width}, iw: window.innerWidth, vvW: vv.width, vvScale: vv.scale, vvOffL: vv.offsetLeft, vvPageL: vv.pageLeft, scrollY: window.scrollY, scrollX: window.scrollX, dpr: window.devicePixelRatio };
});
console.log(JSON.stringify(info));
await b.close(); srv.close();
