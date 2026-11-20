import http from 'http'; import fs from 'fs'; import path from 'path';
import puppeteer from 'puppeteer-core';
const root = '/tmp/ayuswar-mobile-review/dist';
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.woff2':'font/woff2' };
const srv = http.createServer((req,res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  let f = path.join(root, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(root, 'index.html');
  res.setHeader('Content-Type', mime[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => srv.listen(8895, r));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument(() => { localStorage.setItem('ayuswar_selected_language', 'en-IN'); });
await p.goto('http://127.0.0.1:8895/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => document.querySelector(".m-splash") && getComputedStyle(document.querySelector(".m-splash")).visibility === "hidden", { timeout: 20000 }); await new Promise(r => setTimeout(r, 600));
const diag = await p.evaluate(() => {
  const bg = document.querySelector('.m-appbg');
  const cs = getComputedStyle(bg);
  return { display: cs.display, position: cs.position, zIndex: cs.zIndex,
    bgImage: cs.backgroundImage.slice(0,60), appZ: getComputedStyle(document.querySelector('.m-app')).zIndex,
    scroller: document.scrollingElement ? document.scrollingElement.tagName : null };
});
console.log('DIAG', JSON.stringify(diag));
await p.screenshot({ path: '/downloads/s3-home-top.png' });
await p.evaluate(() => window.scrollTo(0, 700));
await new Promise(r => setTimeout(r, 900));
await p.screenshot({ path: '/downloads/s3-home-scrolled.png' });
await p.evaluate(r => { history.pushState({}, '', r); window.dispatchEvent(new PopStateEvent('popstate')); }, '/clinical-console');
await new Promise(r => setTimeout(r, 1500));
await p.evaluate(() => window.scrollTo(0, 500));
await new Promise(r => setTimeout(r, 800));
await p.screenshot({ path: '/downloads/s3-clinical-scrolled.png' });
await p.evaluate(r => { history.pushState({}, '', r); window.dispatchEvent(new PopStateEvent('popstate')); }, '/solutions');
await new Promise(r => setTimeout(r, 1500));
await p.screenshot({ path: '/downloads/s3-solutions.png' });
await b.close(); srv.close();
console.log('done');
