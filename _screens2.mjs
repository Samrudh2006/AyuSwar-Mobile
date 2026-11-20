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
await new Promise(r => srv.listen(8894, r));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument(() => { localStorage.setItem('ayuswar_selected_language', 'en-IN'); });
await p.goto('http://127.0.0.1:8894/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await new Promise(r => setTimeout(r, 3200));
for (const [name, route, full] of [['home','/',false],['solutions','/solutions',false],['clinical','/clinical-console',false],['auth','/login',false],['doctor-portal','/doctor-portal',false],['patient-portal','/patient-portal',false]]) {
  await p.evaluate(r => { history.pushState({}, '', r); window.dispatchEvent(new PopStateEvent('popstate')); }, route);
  await new Promise(r => setTimeout(r, 1500));
  await p.screenshot({ path: '/downloads/s2-' + name + '.png', fullPage: !!full });
  console.log(name, 'captured');
}
await p.evaluate(r => { history.pushState({}, '', r); window.dispatchEvent(new PopStateEvent('popstate')); }, '/');
await new Promise(r => setTimeout(r, 1200));
await p.evaluate(() => window.scrollTo(0, 700));
await new Promise(r => setTimeout(r, 800));
await p.screenshot({ path: '/downloads/s2-home-scrolled.png' });
console.log('home-scrolled captured');
await b.close(); srv.close();
