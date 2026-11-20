/**
 * generate-sw-manifest.cjs — writes dist/sw-assets.json, the asset list the
 * service worker (public/sw.js) fetches at install time to precache the app
 * shell. Only static shell prefixes (/assets/, /fonts/) are listed; clinical
 * APIs, private routes and media are never precached, mirroring sw.js policy.
 * Output is sorted so builds are deterministic.
 */
const fs = require('node:fs');
const path = require('node:path');

const DIST = path.resolve(process.cwd(), 'dist');
const PREFIXES = ['/assets/', '/fonts/'];
const MEDIA = ['.mp3', '.wav', '.ogg', '.m4a', '.mp4', '.webm'];

function walk(dir, base, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, base, out);
    } else {
      const rel = '/' + path.relative(base, full).split(path.sep).join('/');
      if (PREFIXES.some((p) => rel.startsWith(p)) && !MEDIA.some((m) => rel.toLowerCase().endsWith(m))) {
        out.push(rel);
      }
    }
  }
}

if (!fs.existsSync(DIST)) {
  console.error('[sw-manifest] dist/ not found; run vite build first.');
  process.exit(1);
}

const urls = [];
walk(DIST, DIST, urls);
urls.sort();
fs.writeFileSync(path.join(DIST, 'sw-assets.json'), JSON.stringify(urls));
console.log(`[sw-manifest] wrote dist/sw-assets.json with ${urls.length} static shell assets.`);
