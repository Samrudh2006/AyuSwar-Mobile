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
await new Promise(r => srv.listen(8899, r));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: false });
await p.evaluateOnNewDocument(() => { localStorage.setItem('ayuswar_selected_language', 'en-IN'); });
await p.goto('http://127.0.0.1:8899/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => document.querySelector(".m-splash") && getComputedStyle(document.querySelector(".m-splash")).visibility === "hidden", { timeout: 20000 });
await p.evaluate(() => window.scrollTo(0, 700));
await new Promise(r => setTimeout(r, 800));
// attempt 1: CDP capture without beyond-viewport
const cdp = await p.createCDPSession();
const shot1 = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true });
fs.writeFileSync('/downloads/s3-d-cdp.png', Buffer.from(shot1.data, 'base64'));
// attempt 2: force compositing nudge then puppeteer screenshot
await p.evaluate(() => { const el = document.querySelector('.m-app'); el.style.transform = 'translateZ(0)'; });
await new Promise(r => setTimeout(r, 400));
await p.screenshot({ path: '/downloads/s3-d-nudge.png' });
await p.evaluate(() => { const el = document.querySelector('.m-app'); el.style.transform = ''; });
await b.close(); srv.close();
console.log('done');
