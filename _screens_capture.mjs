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
await new Promise(r => srv.listen(8893, r));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
const routes = [['home','/'],['solutions','/solutions'],['clinical','/clinical-console'],['auth','/login']];
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument(() => { localStorage.setItem('ayuswar_selected_language', 'en-IN'); });
await p.goto('http://127.0.0.1:8893/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise(r => setTimeout(r, 3200)); // let splash dismiss
for (const [name, route] of routes) {
  await p.evaluate(r => { history.pushState({}, '', r); window.dispatchEvent(new PopStateEvent('popstate')); }, route);
  await new Promise(r => setTimeout(r, 1400));
  await p.screenshot({ path: '/downloads/screen-' + name + '.png' });
  console.log(name, 'captured');
}
await b.close(); srv.close();
