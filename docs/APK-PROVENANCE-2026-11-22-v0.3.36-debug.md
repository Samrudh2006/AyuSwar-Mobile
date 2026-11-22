# APK Provenance — 2026-11-22 (debug checkpoint, 0.3.36-debug)

Build record for debug APK checkpoint `v0.3.36-debug`, built from
`feat/clinical-evidence-engine`. This is not a production-signed artifact
and not a device-verified install. All prior releases/tags (including
`v0.3.34-debug` and `v0.3.35-debug`) are preserved unchanged.

## Artifact

| Field | Value |
|---|---|
| File | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Type | Android **debug** APK (debug key) |
| Source commit | version bump to 0.3.36-debug / versionCode 39 on top of `4605b69` (clean tree at build time; commit hash recorded in the release notes) |
| Built | 2026-11-22, ~16:07 IST (after `npm run build` + `npx cap sync android`) |
| Size | 78,071,624 bytes |
| SHA-256 | `e9a22d04982aa6b94af6db0a3d2d97e9eb0fbdc48d8524605ff07338f4ecacb3` |
| Manifest (aapt2 dump badging) | package `ai.ayuswar.app`, **versionCode 39**, **versionName 0.3.36-debug**, minSdk 24, targetSdk 36 |
| Signer certificate (apksigner verify --print-certs) | CN=Android Debug; cert SHA-256 `57d44b07e4111ec3356d6b9f27ab37afcefb8256a696e670a464e7743f0b1b31` — identical to the published v0.3.34-debug and v0.3.35-debug signer |

## Embedded-content consistency

Embedded `assets/public/index.html` SHA-256
`5a7f6ce509d0823880635f1b91730869835ed2527f3ad2bd37682b4d00c0578d` is
byte-identical to `dist/index.html` after cap sync: the APK embeds the
fresh bundle, not a stale one.

## Why this checkpoint exists

The published `v0.3.35-debug` APK (asset sha256
`9899fb9c...8980`) does NOT contain the FHIR fullUrl fix: that defect was
caught later by the official HL7 validator run and fixed in `d018cda`
(after the v0.3.35 build commit `0bbcb45`). This checkpoint is the first
APK that contains the actual fullUrl fix. The fix delta was independently
audited (official validator re-runs plus source/fixture checks) before
this build was prepared.

## Difference from the published v0.3.35-debug APK

App-source changes since the v0.3.35 build commit `0bbcb45`:
- `21f6f12` test only (IDB-path enqueue regression, no app code)
- `d018cda` FHIR fullUrl emitter fix + official validator run artifacts
- `4605b69` docs only (ABDM IG offline validation route)
- version bump to 0.3.36-debug / versionCode 39

Suite on the build tree: 398 passed / 3 conditional skips / 0 failed.

## Upgrade compatibility (build-side only)

Package name identical (`ai.ayuswar.app`), signer certificate SHA-256
identical, versionCode strictly higher (38 -> 39): the conditions Android
requires for an in-place update hold on the build side. **No physical
device install or upgrade was performed**; on-device upgrade behavior is
untested and the build installed on any given device may differ.

## Reproduce

```bash
npm ci
npm run build
npx cap sync android
cd android
JAVA_HOME=<jdk21> ANDROID_HOME=<sdk with android-36> ./gradlew assembleDebug
sha256sum app/build/outputs/apk/debug/app-debug.apk
```
