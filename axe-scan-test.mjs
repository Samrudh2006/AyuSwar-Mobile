// Automated axe-core conformance scan of the built patient portal.
// Injects axe-core (installed under /tmp/node_modules, outside the repo) into
// the vite-preview dist build and runs WCAG 2.1 A/AA rules per tab.
// Measurement harness only: results are recorded, not a pass claim.
import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const AXE = readFileSync('/tmp/node_modules/axe-core/axe.min.js', 'utf8');
const BASE = 'http://localhost:4173/patient-portal';
const TABS = ['home', 'my_health', 'appointments', 'reports', 'medications', 'settings'];

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('dialog', d => d.accept());

const summary = [];
for (const tab of TABS) {
  await page.goto(`${BASE}?tab=${tab}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3200);
  await page.evaluate(AXE);
  const res = await page.evaluate(async () => {
    return await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      resultTypes: ['violations']
    });
  });
  const byImpact = {};
  const rules = [];
  for (const v of res.violations) {
    byImpact[v.impact] = (byImpact[v.impact] || 0) + 1;
    rules.push(`${v.id}(${v.nodes.length})`);
  }
  summary.push({ tab, violations: res.violations.length, byImpact, rules });
  console.log(`TAB ${tab}: ${res.violations.length} violation rule(s) ${JSON.stringify(byImpact)}`);
  for (const v of res.violations) {
    console.log(`  - ${v.id} [${v.impact}] ${v.nodes.length} node(s): ${v.help}`);
    const first = v.nodes[0];
    if (first) console.log(`    e.g. ${first.target.join(' ').slice(0, 140)}`);
  }
}
// Modal-open states: scanner the overlays users actually open.
const MODALS = [
  { name: 'modal-upload-report', tab: 'reports', opener: 'Upload New Diagnostic Report' },
  { name: 'modal-add-medication', tab: 'medications', opener: 'Add Medication Manually' },
  { name: 'modal-add-vitals', tab: 'my_health', opener: 'Add Vitals Manually' },
];
for (const m of MODALS) {
  await page.goto(`${BASE}?tab=${m.tab}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3200);
  await page.locator('button', { hasText: m.opener }).first().click();
  await page.waitForTimeout(700);
  await page.evaluate(AXE);
  const res = await page.evaluate(async () => {
    return await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      resultTypes: ['violations']
    });
  });
  const byImpact = {};
  for (const v of res.violations) byImpact[v.impact] = (byImpact[v.impact] || 0) + 1;
  summary.push({ tab: m.name, violations: res.violations.length, byImpact });
  console.log(`STATE ${m.name}: ${res.violations.length} violation rule(s) ${JSON.stringify(byImpact)}`);
  for (const v of res.violations) {
    console.log(`  - ${v.id} [${v.impact}] ${v.nodes.length} node(s): ${v.help}`);
    for (const n of v.nodes.slice(0, 4)) console.log(`    ${n.html.slice(0, 150).replace(/\n/g, ' ')}`);
  }
}

await browser.close();
console.log('AXE-SUMMARY ' + JSON.stringify(summary.map(s => ({ tab: s.tab, violations: s.violations, byImpact: s.byImpact }))));
