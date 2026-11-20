/**
 * AyuSwar AI — Certificate Pinning Config (Phase 28)
 * test/phase28_certificate_pinning.test.js
 *
 * Audit-driven (pin-set expiry regression): the pinning config must exist,
 * be wired in the manifest, disable cleartext, carry at least two
 * non-leaf pins, and expire IN THE FUTURE — an already-expired pin-set is
 * silently ignored by Android, which would leave the brief item unmet
 * while appearing done.
 *
 * 1. Static: config file exists with cleartext disabled and >=2 SHA-256 pins.
 * 2. Static: manifest wires android:networkSecurityConfig.
 * 3. Behavioral: the pin-set expiration parses as a date later than today.
 * 4. Static: honest scope comments (any-pin-matches trust breadth, WebView
 *    enforcement variance, maintenance requirement) are documented.
 */

import { readFileSync } from 'node:fs';

const results = [];
const record = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, err });
  }
};
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

await record('pinning config disables cleartext and carries >=2 pins', async () => {
  const xml = readFileSync(new URL('../android/app/src/main/res/xml/network_security_config.xml', import.meta.url), 'utf8');
  assert(xml.includes('cleartextTrafficPermitted="false"'), 'cleartext must be disabled');
  const pins = xml.match(/<pin digest="SHA-256">[^<]+<\/pin>/g) || [];
  assert(pins.length >= 2, 'need at least two non-leaf pins (root + intermediate)');
  assert(!xml.includes('ED02jY6POswcMjticCshf50ywurppjVGa00Y+Oqf8ho='), 'leaf certificate must not be pinned');
  // Backup must be an INDEPENDENT hierarchy, not a second pin of the same CA:
  // GTS Root R1 (live chain today) AND ISRG Root X1 (Vercel-documented issuer).
  assert(xml.includes('hxqRlPTu1bMS/0DITB1SSu0vd4u/8l8TjPgfaAp63Gc='), 'GTS Root R1 pin missing');
  assert(xml.includes('C5+lpZ7tcVwmwQIMcRtPbsQtWLABXhQzejna0wHFr8M='), 'ISRG Root X1 backup pin missing (independent hierarchy)');
});

await record('manifest wires the network security config', async () => {
  const m = readFileSync(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8');
  assert(m.includes('android:networkSecurityConfig="@xml/network_security_config"'), 'config not wired');
});

await record('pin-set expiration is in the future', async () => {
  const xml = readFileSync(new URL('../android/app/src/main/res/xml/network_security_config.xml', import.meta.url), 'utf8');
  const m = xml.match(/<pin-set expiration="(\d{4}-\d{2}-\d{2})">/);
  assert(m, 'pin-set expiration missing');
  const today = new Date().toISOString().slice(0, 10);
  assert(m[1] > today, `pin-set already expired (${m[1]} <= ${today}) — Android ignores expired pins`);
});

await record('honest scope and maintenance are documented', async () => {
  const xml = readFileSync(new URL('../android/app/src/main/res/xml/network_security_config.xml', import.meta.url), 'utf8');
  assert(xml.includes('ANY pin matches'), 'any-pin-matches trust breadth must be documented');
  assert(xml.includes('WebView'), 'WebView enforcement variance must be documented');
  assert(xml.includes('MAINTENANCE'), 'pin maintenance requirement must be documented');
});

let failed = 0;
for (const r of results) {
  if (!r.ok) {
    failed += 1;
    console.error(`  FAIL  ${r.name}: ${r.err?.message || r.err}`);
  } else {
    console.log(`  PASS  ${r.name}`);
  }
}
if (failed > 0) {
  console.error(`Phase 28: ${failed} of ${results.length} checks failed`);
  process.exit(1);
}
console.log(`Phase 28: ${results.length}/${results.length} certificate pinning checks passed`);
