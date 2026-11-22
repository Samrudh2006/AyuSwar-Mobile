#!/usr/bin/env node
/**
 * measure_performance.mjs — reproducible performance metric collection.
 *
 * Runs the real production build with per-step wall-time measurement,
 * walks dist/ for bundle size facts, and writes PERFORMANCE_METRICS.json
 * with environment facts (node/os/cpu/memory, git revision + dirty flag).
 *
 * Honest scope: these are build/bundle metrics from one sandbox machine.
 * No Android device, runtime, battery, memory-under-load or network
 * performance is measured or claimed. Fails loudly when a step fails.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const root = process.cwd();
const outDir = path.join(root, 'AYUSWAR-TECHNICAL-EVIDENCE', '06-PERFORMANCE');
const outFile = path.join(outDir, 'PERFORMANCE_METRICS.json');

const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0;

const steps = [
  ['vite build', 'npx', ['vite', 'build']],
  ['prerender', 'node', ['scripts/prerender.js']],
  ['generate-sw-manifest', 'node', ['scripts/generate-sw-manifest.cjs']]
];

const buildSteps = [];
for (const [name, cmd, args] of steps) {
  const started = Date.now();
  try {
    execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });
  } catch (err) {
    console.error(`measure_performance: step "${name}" FAILED: ${err.message}`);
    process.exit(1);
  }
  buildSteps.push({ name, wallMs: Date.now() - started });
}

const walk = (dir, acc = []) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile()) acc.push({ file: path.relative(path.join(root, 'dist'), full), bytes: statSync(full).size });
  }
  return acc;
};

const distDir = path.join(root, 'dist');
const files = walk(distDir);
const byExt = {};
for (const f of files) {
  const ext = (path.extname(f.file) || '(none)').toLowerCase();
  byExt[ext] = byExt[ext] || { count: 0, bytes: 0 };
  byExt[ext].count += 1;
  byExt[ext].bytes += f.bytes;
}
const largest = [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 10);

const metrics = {
  scope: 'Build-time and bundle-size metrics from one sandbox machine. No Android device, runtime, battery, memory-under-load or network performance measured or claimed.',
  generatedAt: new Date().toISOString(),
  revision,
  trackedWorkingTreeDirty: dirty,
  environment: {
    node: process.version,
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    cpuModel: os.cpus()[0] ? os.cpus()[0].model : 'unknown',
    totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024)
  },
  build: {
    steps: buildSteps,
    totalWallMs: buildSteps.reduce((s, x) => s + x.wallMs, 0)
  },
  bundle: {
    distFileCount: files.length,
    distTotalBytes: files.reduce((s, f) => s + f.bytes, 0),
    byExtension: byExt,
    largestFiles: largest
  }
};

writeFileSync(outFile, JSON.stringify(metrics, null, 2) + '\n');
console.log(`wrote ${path.relative(root, outFile)}`);
console.log(`build total: ${metrics.build.totalWallMs}ms; dist: ${metrics.bundle.distFileCount} files, ${metrics.bundle.distTotalBytes} bytes`);
