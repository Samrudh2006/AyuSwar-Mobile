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
await new Promise(r => srv.listen(8896, r));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument(() => { localStorage.setItem('ayuswar_selected_language', 'en-IN'); });
await p.goto('http://127.0.0.1:8896/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => document.querySelector(".m-splash") && getComputedStyle(document.querySelector(".m-splash")).visibility === "hidden", { timeout: 20000 });
await new Promise(r => setTimeout(r, 600));
await p.evaluate(() => window.scrollTo(0, 700));
await new Promise(r => setTimeout(r, 900));
const probe = await p.evaluate(() => {
  const cards = [...document.querySelectorAll('.m-card, .m-page > *')].slice(0, 12).map(el => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return { cls: el.className.toString().slice(0,40), top: Math.round(r.top), h: Math.round(r.height), vis: cs.visibility, op: cs.opacity, disp: cs.display, bg: cs.backgroundColor };
  });
  const mid = document.elementFromPoint(195, 420);
  return { scrollY: window.scrollY, docH: document.documentElement.scrollHeight, mid: mid ? mid.className.toString().slice(0,60) : null, cards };
});
console.log(JSON.stringify(probe, null, 1));
await b.close(); srv.close();
