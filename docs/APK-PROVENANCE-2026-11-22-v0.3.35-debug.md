# APK Provenance — 2026-11-22 (STAGED debug candidate, 0.3.35-debug)

Build record for the next debug APK candidate, built from
`feat/clinical-evidence-engine`. **STAGED, NOT PUBLISHED.** Publishing is
gated on the maintainer's explicit lift; the published `v0.3.34-debug`
release and all prior releases/tags are preserved unchanged. This is not a
production-signed artifact and not a device-verified install.

## Artifact

| Field | Value |
|---|---|
| File | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Type | Android **debug** APK (debug key) |
| Source commit | `0bbcb45` (clean tree at build time: version bump to 0.3.35-debug / versionCode 38 on top of d5f61fd) |
| Built | 2026-11-22, ~15:47 IST (after `npm run build` + `npx cap sync android`) |
| Size | 78,071,500 bytes |
| SHA-256 | `9899fb9c9014802faeab57b988125fee94541d50d265469cad8bf82c1b588980` |
| Manifest (aapt2 dump badging) | package `ai.ayuswar.app`, **versionCode 38**, **versionName 0.3.35-debug**, minSdk 24, targetSdk 36 |
| Signer certificate (apksigner verify --print-certs) | CN=Android Debug; cert SHA-256 `57d44b07e4111ec3356d6b9f27ab37afcefb8256a696e670a464e7743f0b1b31` — identical to the published v0.3.34-debug signer |

## Embedded-content consistency

Recursive byte-level diff of the APK's `assets/public/` against the
workspace `dist/` after cap sync: identical except

- `cordova.js`, `cordova_plugins.js` — injected by Capacitor into the APK
  only (expected);
- `.well-known/` — present in `dist/`, not embedded by cap sync (expected).

## Upgrade compatibility vs the published v0.3.34-debug (build-side only)

Package name identical (`ai.ayuswar.app`), signer certificate SHA-256
identical, versionCode strictly higher (37 -> 38): the conditions Android
requires for an in-place update hold on the build side. **No physical
device install or upgrade was performed**; on-device upgrade behavior is
untested and the build installed on any given device may differ.

## Difference from the published v0.3.34-debug APK

App-source changes since the published candidate `faea07f`: offline sync
exponential backoff (5812fa5), client idempotency keys with probed payload
surfacing (89aad44); test/docs/evidence-only commits in between. Suite at
89aad44: 396 passed / 3 conditional skips / 0 failed.

## Reproduce

```bash
npm ci
npm run build
npx cap sync android
cd android
JAVA_HOME=<jdk21> ANDROID_HOME=<sdk with android-36> ./gradlew assembleDebug
sha256sum app/build/outputs/apk/debug/app-debug.apk
```
