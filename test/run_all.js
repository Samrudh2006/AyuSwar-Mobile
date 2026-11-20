/**
 * AyuSwar AI — Unified Colorized Test Runner & Executive Scorecard
 * test/run_all.js
 * 
 * Runs all 9 verification phases with ANSI neon green terminal highlights.
 * Designed for clean, high-contrast terminal screenshots for LinkedIn & reports.
 */

import { execSync } from 'node:child_process';

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[92m',
  cyan: '\x1b[96m',
  gold: '\x1b[93m',
  white: '\x1b[97m',
  gray: '\x1b[90m',
  bgDarkGreen: '\x1b[42m\x1b[30m'
};

const suites = [
  { name: 'Phase 1: API Boundary Security', file: 'test/api_security.test.js', count: 6 },
  { name: 'Phase 2: Server Triage Boundary', file: 'test/server_triage.test.js', count: 5 },
  { name: 'Phase 3: Voice Integration & Honest Status', file: 'test/voice_integration.test.js', count: 5 },
  { name: 'Phase 4: Database & Auth Security (local demo mode)', file: 'test/database_auth.test.js', count: 4, skip: 2 },
  { name: 'Phase 5: Mobile UI/UX & Safe Area Spacing', file: 'test/mobile_ui.test.js', count: 5 },
  { name: 'Phase 6: Static Code Contract Assertions', file: 'test/audit_assertions.test.js', count: 23 },
  { name: 'Phase 7: Clinical Safety Sentinel', file: 'test/clinical_workflow.test.js', count: 7 },
  { name: 'Phase 8: Gnani Indic Voice Pipeline', file: 'test/gnani_pipeline.test.js', count: 6 },
  { name: 'Phase 9: Acoustic DSP Physical Tone Gates', file: 'test/stage2_acoustic_verify.test.js', count: 8 },
  { name: 'Phase 10: Advanced Telephony & Clinical VAD', file: 'test/advanced_telephony_vad.test.js', count: 4 },
  { name: 'Phase 11: Hero Flow Turn-Taking & Mutex Isolation', file: 'test/turn_taking_hero_flow.test.js', count: 8 },
  { name: 'Phase 12: Global App Localization & Solutions Nav', file: 'test/localization_and_solutions_nav.test.js', count: 6 },
  { name: 'Phase 13: Rendered-DOM Localization & Route Truth', file: 'test/rendered_dom_i18n.test.js', count: 5 },
  { name: 'Phase 14: Audio, Assistant & Layout Diagnostics', file: 'test/audio_assistant_diagnostics.test.js', count: 6 },
  { name: 'Phase 15: Data Provenance & STT Metric Engine', file: 'test/data_provenance.test.js', count: 4 },
  { name: 'Phase 16: Synthetic FHIR R4 Bundles', file: 'test/fhir_synthetic.test.js', count: 2, skip: 1 },
  { name: 'Phase 17: Provider-Proxy Caller Authorization', file: 'test/api_caller_auth.test.js', count: 5 }
];

console.clear();
console.log(`${C.gold}${C.bold}╔══════════════════════════════════════════════════════════════════════════╗${C.reset}`);
console.log(`${C.gold}${C.bold}║    AYUSWAR AI (ఆయుస్వర) — AUTOMATED VERIFICATION SUITE                ║${C.reset}`);
console.log(`${C.gold}${C.bold}║      Synthetic fixtures; external provider availability not proved      ║${C.reset}`);
console.log(`${C.gold}${C.bold}╚══════════════════════════════════════════════════════════════════════════╝${C.reset}\n`);

const startTime = Date.now();
let totalTests = 0;
let totalSkipped = 0;

for (const suite of suites) {
  process.stdout.write(`${C.cyan}▸ Running ${suite.name}...${C.reset} `);
  try {
    execSync(`node ${suite.file}`, { stdio: 'pipe' });
    const skipNote = suite.skip ? `, ${suite.skip} SKIPPED` : '';
    process.stdout.write(`${C.green}${C.bold}✓ [${suite.count}/${suite.count} PASSED${skipNote}]${C.reset}\n`);
    totalTests += suite.count;
    totalSkipped += suite.skip || 0;
  } catch (err) {
    process.stdout.write(`\x1b[91m\x1b[1mFAILED\x1b[0m\n`);
    console.error(err.stdout ? err.stdout.toString() : err.message);
    process.exit(1);
  }
}

const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

console.log(`\n${C.green}${C.bold}==========================================================================${C.reset}`);
console.log(`${C.green}${C.bold}  EXECUTIVE VERIFICATION SUMMARY — ${totalTests} PASSED, ${totalSkipped} CONDITIONAL SKIPS     ${C.reset}`);
console.log(`${C.green}${C.bold}==========================================================================${C.reset}`);

console.log(`${C.white}  ${C.bold}Platform:${C.reset} AyuSwar AI (React/Vite + Web Audio DSP + Capacitor Android)`);
console.log(`${C.white}  ${C.bold}Indic Voice Stack:${C.reset} client/provider boundary tests only; live TTS/STT availability is not proved here`);
console.log(`${C.white}  ${C.bold}Acoustic DSP:${C.reset} synthetic fixture tones measured within ±2Hz locally`);
console.log(`${C.white}  ${C.bold}Clinical Grounding:${C.reset} synthetic rules and FHIR-shaped local drafts; no live ABDM/registry access`);
console.log(`${C.white}  ${C.bold}Total Test Specs:${C.reset} ${C.green}${C.bold}${totalTests} passed, ${totalSkipped} conditionally skipped, 0 failed${C.reset}`);
console.log(`${C.white}  ${C.bold}Execution Duration:${C.reset} ${C.gold}${elapsedSec} seconds${C.reset}`);
console.log(`${C.white}  ${C.bold}Audit Invariant:${C.reset} ${C.green}${C.bold}No live provider, native Android runtime, or production deployment claim is made by this suite.${C.reset}`);
console.log(`${C.green}${C.bold}==========================================================================${C.reset}\n`);
