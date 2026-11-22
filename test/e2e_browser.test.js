/**
 * e2e_browser.test.js — Headless-browser end-to-end checks against the
 * BUILT app (vite preview of dist/), never the dev server.
 *
 * Auditor requirements:
 * 1. Fail-loud missing browser: run directly (`node test/e2e_browser.test.js`)
 *    without a supported browser exits 1 with a clear message. Under the
 *    aggregate runner (AYUSWAR_SUITE_RUN=1) a missing browser is a reported
 *    conditional skip, never a silent pass.
 * 2. Real assertions: rendered content, honest failure attribution and panel
 *    behavior are asserted exactly; page errors fail the run.
 * 3. Built preview: the current working tree is built (`npm run build`) and
 *    served with `vite preview`; the dev server is never used.
 * 4. Conditional-skip convention: skips are emitted as "↷ ... Skipped" lines
 *    plus a "(N passes, M conditional skips)" summary for the runner.
 */
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import { chromium } from 'playwright-core';

const UNDER_SUITE = process.env.AYUSWAR_SUITE_RUN === '1';
const TEST_COUNT = 5;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/microsoft-edge',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].filter(Boolean);
const CHROME_PATH = CHROME_CANDIDATES.find(p => fs.existsSync(p));

if (!CHROME_PATH) {
  if (UNDER_SUITE) {
    console.log('↷ e2e 1 Skipped: no supported Chrome/Chromium/Edge executable found.');
    console.log('↷ e2e 2 Skipped: no supported Chrome/Chromium/Edge executable found.');
    console.log('↷ e2e 3 Skipped: no supported Chrome/Chromium/Edge executable found.');
    console.log('↷ e2e 4 Skipped: no supported Chrome/Chromium/Edge executable found.');
    console.log('↷ e2e 5 Skipped: no supported Chrome/Chromium/Edge executable found.');
    console.log(`(0 passes, ${TEST_COUNT} conditional skips)`);
    process.exit(0);
  }
  console.error('E2E FAILED LOUDLY: no supported Chrome/Chromium/Edge executable found.');
  console.error('Set CHROME_PATH or install a supported browser to run these checks.');
  process.exit(1);
}

let passed = 0, failed = 0;
const check = (name, cond, detail = '') => {
  if (cond) { passed++; console.log(`PASS ${name}`); }
  else { failed++; console.log(`FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
};

const waitForServer = (url, timeoutMs = 20000) => new Promise((resolve, reject) => {
  const start = Date.now();
  const poll = () => {
    http.get(url, res => { res.resume(); resolve(); })
      .on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error('preview server did not start'));
        else setTimeout(poll, 400);
      });
  };
  poll();
});

const clickText = async (page, re) => {
  const loc = page.locator('button', { hasText: re }).first();
  try {
    await loc.click({ timeout: 5000 });
  } catch {
    // Some mobile buttons fail actionability after section swaps; DOM click is exact.
    await page.evaluate((reSrc) => {
      const r = new RegExp(reSrc, 'i');
      const b = [...document.querySelectorAll('button')].find(x => r.test(x.innerText));
      if (!b) throw new Error(`button not found: ${reSrc}`);
      b.click();
    }, re.source);
  }
};

async function main() {
  // 3. Built preview: build the current working tree, then serve dist/.
  console.log('Building current working tree (npm run build)...');
  execSync('npm run build', { stdio: 'pipe' });
  const preview = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { stdio: 'pipe' });
  process.on('exit', () => { try { preview.kill(); } catch {} });
  await waitForServer('http://127.0.0.1:4174/');
  const BASE = 'http://127.0.0.1:4174';
  console.log(`Preview of built app serving at ${BASE} (browser: ${CHROME_PATH})`);

  const browser = await chromium.launch({ executablePath: CHROME_PATH, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(e.message));

    // 1. Landing route renders at mobile width
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const title = await page.title();
    const bodyLen = (await page.locator('body').innerText()).trim().length;
    check('landing renders with title and content', /ayuswar/i.test(title) && bodyLen > 50,
      `title=${JSON.stringify(title)} bodyLen=${bodyLen}`);

    // 2. Mobile clinical record screen renders its real controls
    await page.goto(`${BASE}/clinical-console`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);
    let body = await page.locator('body').innerText();
    check('mobile record screen renders sample-demo control', /sample/i.test(body));

    // 3. Review route is honestly gated without a consultation
    await page.goto(`${BASE}/clinical-console/review`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(800);
    body = await page.locator('body').innerText();
    check('review route gates without consultation', /consultation is needed first/i.test(body));

    // 4. Keyless draft failure attributes truthfully (never implies AI responded)
    await page.goto(`${BASE}/clinical-console`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);
    await clickText(page, /sample/i);
    await page.waitForTimeout(400);
    await clickText(page, /use sample/i);
    await page.waitForTimeout(400);
    await clickText(page, /generate draft/i);
    await page.waitForTimeout(4000);
    body = await page.locator('body').innerText();
    check('keyless failure says AI unavailable, never incomplete draft',
      /AI is unavailable\. No model response was received/i.test(body) && !/incomplete draft/i.test(body),
      (body.match(/Draft not generated[\s\S]{0,200}/) || ['no failure banner'])[0]);

    // 5. Keyless evidence check: reachable in failure state, offline-only, honest note
    await clickText(page, /Evidence check/i);
    await page.waitForTimeout(500);
    body = await page.locator('body').innerText();
    const modelButtonAbsent = !body.includes('labelled fallback if unavailable');
    const offlineVisible = body.includes('Run offline extraction');
    if (offlineVisible) {
      await clickText(page, /Run offline extraction/);
      await page.waitForTimeout(2500);
      body = await page.locator('body').innerText();
    }
    check('keyless evidence check is offline-only with honest note',
      modelButtonAbsent && offlineVisible && body.includes('no model was called'));

    check('no page errors across all flows', pageErrors.length === 0, pageErrors.join(' | '));
  } finally {
    await browser.close();
    // Kill the whole preview process group so no detached child outlives the run.
    try { preview.kill('SIGKILL'); } catch {}
    try { execSync('pkill -f "vite preview --port 4174" || true', { stdio: 'pipe', shell: '/bin/bash' }); } catch {}
  }
}

main()
  .then(() => {
    console.log(`\n(${passed} passes, ${Math.max(TEST_COUNT - passed - failed, 0)} conditional skips)`);
    console.log(`e2e_browser: ${passed}/${passed + failed} passed`);
    process.exit(failed === 0 && passed >= TEST_COUNT ? 0 : 1);
  })
  .catch(err => {
    console.error('E2E FAILED LOUDLY:', err.message);
    process.exit(1);
  });
