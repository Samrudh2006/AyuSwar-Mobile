# AyuSwar Mobile Deployment Guide

Scope: **mobile build and release only** (Android debug APK via GitHub
Releases). Web/Vercel/backend deployment is out of scope for this document
and this repository effort.

Honesty boundary: the debug-APK path below was executed end-to-end and
verified on 2026-11-22 for `v0.3.34-debug` (see
[APK provenance](APK-PROVENANCE-2026-11-22.md)). Release signing, AAB
creation and Play Store submission were NOT performed; the final section
lists what they would need without claiming any of it was done.

## 1. Prerequisites

- Node.js 22 (`v22.23.5` used here)
- JDK 21 (OpenJDK 21 used here)
- Android SDK with platform android-36, plus `aapt2`/`apksigner` from
  build-tools for verification
- Gradle is provided by the repo wrapper (8.14.3)

## 2. Version model

Two places must move together for every release:

| Location | Field | Current |
|---|---|---|
| `package.json` | `version` | `0.3.34-debug` |
| `android/app/build.gradle` | `versionCode` / `versionName` | `37` / `0.3.34-debug` |

Rules:

- `versionCode` is an integer that must increase monotonically every
  release; Android refuses same-or-lower-code upgrades.
- `versionName` should match `package.json` `version`.
- Tag convention in use: `v<versionName>` on the provenance commit
  (example: `v0.3.34-debug`). Verify the tag does not already exist before
  releasing; never overwrite an existing tag or release.

## 3. Build

```bash
npm ci                  # clean install
npm run build           # vite build + prerender + service-worker manifest
npx cap sync android    # REQUIRED: embeds the fresh web bundle into the
                        # Android project; skipping this ships a stale bundle
cd android
JAVA_HOME=<jdk21> ANDROID_HOME=<sdk> ./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

## 4. Verify the artifact before publishing

```bash
sha256sum app/build/outputs/apk/debug/app-debug.apk
aapt2 dump badging app/build/outputs/apk/debug/app-debug.apk | head -5
apksigner verify --print-certs app/build/outputs/apk/debug/app-debug.apk
```

Record in the provenance document: size, SHA-256, package
(`ai.ayuswar.app`), versionCode/versionName, minSdk 24 / targetSdk 36, and
the signer certificate SHA-256. Also verify the embedded web bundle matches
`dist/` (embedded `assets/public/index.html` hash vs `dist/index.html`),
as done in the 2026-11-22 provenance record.

## 5. Publish on GitHub Releases

1. Confirm the exact APK whose hashes were recorded (publish that file,
   not a rebuild).
2. Create the release as a **prerelease** (debug research prototype), tag
   `v<versionName>` targeting the provenance commit.
3. Preserve all prior releases and tags; check for tag collision first.
4. After publishing, re-download the public asset and re-verify SHA-256
   and size against the provenance record (post-publication readback).

## 6. Upgrade compatibility for testers

- Debug builds are signed with the Android debug key. Upgrade
  compatibility is checked build-side only: identical package name,
  identical signer certificate SHA-256 and a strictly higher versionCode
  are the conditions Android requires for an in-place update, and those
  comparisons were verified for v0.3.33 -> v0.3.34-debug (codes 36 -> 37)
  and for the staged v0.3.35-debug candidate (code 38). **No physical
  device install or upgrade was performed**: on-device upgrade behavior
  is untested, and the build installed on any given device may differ.
  When the build-side conditions hold, do NOT advise uninstalling first.
- Per platform behavior, an APK signed with a different key will NOT
  upgrade in place; Android rejects it. That is expected key-mismatch
  behavior, not app corruption.
- Install requires allowing installs from unknown sources on the device
  (sideloaded debug artifact).

## 7. Not done (would be needed for production distribution)

- A release keystore (generated, backed up, never committed) and
  `signingConfigs` wiring in `android/app/build.gradle`.
- AAB build (`./gradlew bundleRelease`) and Play Console listing, review
  and rollout.
- CI pipeline executing this recipe on every accepted commit.
- None of these steps were executed or verified here.
