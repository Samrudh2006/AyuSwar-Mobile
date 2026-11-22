# APK Provenance — 2026-11-22 (debug candidate)

Verifiable build record for the debug APK candidate built from
`feat/clinical-evidence-engine`. This is provenance preparation only: **not a
release**, not a signed artifact, and not a device-verified install. Merge,
tag and release stay gated.

## Artifact

| Field | Value |
|---|---|
| File | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Type | Android **debug** APK (unsigned for release; debug key) |
| Source commit | `4a9102611372cc0a5f9be939f68024aa8b1df536` (branch `feat/clinical-evidence-engine`; code identical to `0174027`, docs-only delta) |
| Built | 2026-11-22, ~14:21 IST (rebuild; first build ~14:17 IST at `0174027`) |
| Size | 78,469,555 bytes |
| SHA-256 | `5ead74993acfb69f01698631a96bb8e03d85ad44c8e565b40efb7581e8be58b9` |

## Build recipe (reproduce)

```bash
npm ci            # or npm install
npm run build     # vite + prerender + sw manifest
npx cap sync android
cd android
JAVA_HOME=<jdk21> ANDROID_HOME=<sdk with android-36> ./gradlew assembleDebug
sha256sum app/build/outputs/apk/debug/app-debug.apk
```

Toolchain used here: OpenJDK 21 (`/home/sandbox/jdk21`), Android SDK platform
android-36 (`/home/sandbox/android-sdk`), Gradle 8.14.3 wrapper.

## Determinism check

Two independent `gradlew assembleDebug` runs — at `0174027` and again at
`4a91026` (docs-only delta) — produced a **byte-identical APK** (same size and
SHA-256 above), consistent with the docs-only source difference.

This provenance file itself lands in a later docs-only commit on top of the
recorded source commit; it does not alter the build inputs.

## What this artifact does and does not establish

- **Does:** the listed commit compiles into an installable debug APK whose
  hash any verifier can reproduce or compare.
- **Does not:** install/launch on a physical device, native microphone/STT/
  notifications, WebView behavior of offline packs, or any runtime claim.
  The physical-device matrix in `docs/RELEASE-READINESS.md` remains open.
- The earlier recorded debug APK (20 Nov, `d295d34`, sha256 `7170DFF0…B4B`)
  predates this branch and is superseded as the current candidate.
