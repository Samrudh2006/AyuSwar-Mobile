/**
 * Phase 39: axe-core route accessibility checks (development-only).
 *
 * axe-core is a devDependency and runs here against the local production
 * preview; it is never bundled into the patient APK. A passing scan does NOT
 * establish WCAG conformance or TalkBack behavior - pair with manual keyboard,
 * zoom and screen-reader checks (handoff boundary).
 *
 * Policy: CRITICAL violations fail the suite; serious/moderate/minor findings
 * are written to test/reports/axe-report.json with rule, route, viewport,
 * selector and failure summary for triage.
 */
import assert from 'node:assert';
import fs from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const CHROME_PATH = [
  '/usr/bin/google-chrome',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
].find(p => fs.existsSync(p));

const AXE_PATH = resolve('node_modules/axe-core/axe.min.js');
const DIST_OK = fs.existsSync(resolve('dist/index.html'));

if (!CHROME_PATH || !fs.existsSync(AXE_PATH) || !DIST_OK) {
  console.log('Skipping axe route checks: needs google-chrome/Edge, node_modules/axe-core and a built dist/ (run npm run build first).');
  process.exit(0);
}

console.log('--- RUNNING PHASE 39: AXE-CORE ROUTE ACCESSIBILITY CHECKS (DEV-ONLY) ---');

const ROUTES = ['/', '/scanner', '/patient-portal', '/appointment-ticket', '/clinical-console/full'];
const WIDTHS = [{ width: 390, height: 844 }, { width: 320, height: 720 }, { width: 430, height: 860 }];

const viteBin = resolve('node_modules/vite/bin/vite.js');
const server = spawn(process.execPath, [viteBin, 'preview', '--port', '4199', '--strictPort'], { stdio: 'ignore' });
const stop = () => { try { server.kill('SIGKILL'); } catch {} };
await new Promise(r => setTimeout(r, 3500));

const report = { generatedAt: new Date().toISOString(), tool: 'axe-core (devDependency, not in APK)', routes: [] };
let failures = 0;
try {
  const { chromium } = await import('playwright');
  const axeSrc = fs.readFileSync(AXE_PATH, 'utf8');
  const browser = await chromium.launch({ executablePath: CHROME_PATH });

  // 1. Every primary route scans at 390px with zero CRITICAL violations
  {
    const criticals = [];
    for (const route of ROUTES) {
      const page = await (await browser.newContext({ viewport: WIDTHS[0] })).newPage();
      await page.goto('http://localhost:4199' + route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3500);
      const res = await page.evaluate(async (src) => { eval(src); return await axe.run(document, { resultTypes: ['violations'] }); }, axeSrc);
      report.routes.push({ route, viewport: `${WIDTHS[0].width}px`, violations: res.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 5).map(n => ({ target: n.target.join(' '), summary: (n.failureSummary || '').split('\n')[0] })) })) });
      for (const v of res.violations) if (v.impact === 'critical') criticals.push(`${route}: ${v.id}`);
      await page.close();
    }
    assert.deepStrictEqual(criticals, [], `CRITICAL accessibility violations: ${criticals.join('; ')}`);
    console.log('✓ Test 1 Passed: no CRITICAL axe violations on any primary route at 390px.');
  }

  // 2. Scanner and ticket hold the same bar at 320px and 430px
  {
    const criticals = [];
    for (const route of ['/scanner', '/appointment-ticket']) {
      for (const vp of WIDTHS.slice(1)) {
        const page = await (await browser.newContext({ viewport: vp })).newPage();
        await page.goto('http://localhost:4199' + route, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        const res = await page.evaluate(async (src) => { eval(src); return await axe.run(document, { resultTypes: ['violations'] }); }, axeSrc);
        report.routes.push({ route, viewport: `${vp.width}px`, violations: res.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 5).map(n => ({ target: n.target.join(' '), summary: (n.failureSummary || '').split('\n')[0] })) })) });
        for (const v of res.violations) if (v.impact === 'critical') criticals.push(`${route}@${vp.width}: ${v.id}`);
        await page.close();
      }
    }
    assert.deepStrictEqual(criticals, [], `CRITICAL accessibility violations at narrow widths: ${criticals.join('; ')}`);
    console.log('✓ Test 2 Passed: scanner and ticket routes stay critical-free at 320px and 430px.');
  }

  // 3. Form controls on the scanner route all carry accessible names
  {
    const page = await (await browser.newContext({ viewport: WIDTHS[0] })).newPage();
    await page.goto('http://localhost:4199/scanner', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const res = await page.evaluate(async (src) => { eval(src); return await axe.run(document, { resultTypes: ['violations'], rules: { 'select-name': { enabled: true }, 'label': { enabled: true } } }); }, axeSrc);
    const nameViolations = res.violations.filter(v => v.id === 'select-name' || v.id === 'label');
    assert.deepStrictEqual(nameViolations.map(v => v.id), [], 'every select/input on the scanner must have an accessible name');
    await page.close();
    console.log('✓ Test 3 Passed: scanner form controls all expose accessible names.');
  }

  // 4. The machine-readable report is written for developer triage
  {
    fs.mkdirSync(resolve('test/reports'), { recursive: true });
    fs.writeFileSync(resolve('test/reports/axe-report.json'), JSON.stringify(report, null, 2));
    const written = JSON.parse(fs.readFileSync(resolve('test/reports/axe-report.json'), 'utf8'));
    assert.ok(written.routes.length >= ROUTES.length + 4, 'report must cover every scanned route and viewport');
    console.log('✓ Test 4 Passed: axe JSON report written to test/reports/axe-report.json (rule, route, viewport, selector).');
  }

  await browser.close();
} catch (err) {
  failures++;
  stop();
  throw err;
}
stop();
if (failures) process.exit(1);
