#!/usr/bin/env node
// Generate a per-scenario red-team ledger JSON from a recorded suite run log.
// Same schema as the baseline AYUSWAR-TECHNICAL-EVIDENCE/03-CLINICAL-SAFETY/RED_TEAM_TESTS.json
// (which stays untouched as the dated baseline at commit 1447957).
//
// Text-level guard checks only - NOT the proposed 30-50 audio-level red-team
// lab with per-scenario clinical narratives. Scenario names are verbatim
// PASS lines from the phase 40-44 sections of the run log. A run with any
// FAIL in those sections is refused (a red run is not evidence).
//
// Usage: node scripts/export_red_team_ledger.mjs <TEST_OUTPUT.log> <out.json> <evidence-log-relative-path>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [logPath, outPath, evidenceRel] = process.argv.slice(2);
if (!logPath || !outPath || !evidenceRel) {
  console.error('usage: node scripts/export_red_team_ledger.mjs <TEST_OUTPUT.log> <out.json> <evidence-log-relative-path>');
  process.exit(2);
}
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const short = revision.slice(0, 7);

const GUARD_PHASES = /^=== (Phase 4[0-4]: .+?) \((test\/.+?)\) ===$/;
const log = readFileSync(logPath, 'utf8');
const scenarios = [];
let suite = null, testFile = null, fails = 0;
for (const line of log.split('\n')) {
  const h = line.match(/^=== (.+?) \((test\/.+?)\) ===$/);
  if (h) {
    const g = line.match(GUARD_PHASES);
    suite = g ? g[1] : null;
    testFile = g ? g[2] : null;
    continue;
  }
  if (!suite) continue;
  if (line.startsWith('FAIL ')) {
    fails++;
    scenarios.push({ suite, testFile, scenario: line.slice(5), expectedBehaviour: 'Guard holds as named', actualBehaviour: 'FAILED', passFail: 'fail', evidence: `${evidenceRel} (recorded run at commit ${short})` });
  } else if (line.startsWith('PASS ')) {
    scenarios.push({ suite, testFile, scenario: line.slice(5), expectedBehaviour: 'Guard holds as named', actualBehaviour: 'passed', passFail: 'pass', evidence: `${evidenceRel} (recorded run at commit ${short})` });
  }
}
if (scenarios.length === 0) throw new Error('no guard-phase scenarios found in the log - wrong log?');
if (fails > 0) {
  // Refuse to publish a red run as a passing ledger, but RETAIN the raw log:
  // failed evidence must stay visible next to the refused output path.
  const { copyFileSync } = await import('node:fs');
  const stamp = new Date().toISOString().slice(0, 10);
  const retained = outPath.replace(/\.json$/, `.FAILED-RUN-${stamp}.log`);
  mkdirSync(path.dirname(outPath), { recursive: true });
  copyFileSync(logPath, retained);
  throw new Error(`${fails} failing guard checks in this run - no ledger exported; raw log retained at ${retained} (failed evidence, not a passing ledger)`);
}
const ledger = {
  scope: 'Executed deterministic safety checks from the recorded suite run. Text-level guards; NOT the proposed 30-50 audio-level red-team lab with per-scenario clinical narratives. Scenario names are verbatim from the run log.',
  generatedFrom: evidenceRel,
  runCommit: short,
  scenarioCount: scenarios.length,
  scenarios
};
mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(ledger, null, 2) + '\n');
console.log(`ledger exported: ${scenarios.length} scenarios, 0 failures, run commit ${short}`);
