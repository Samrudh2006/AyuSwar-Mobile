# APK Provenance — 2026-11-22 (debug candidate, 0.3.34-debug)

Verifiable build record for the debug APK candidate built from
`feat/clinical-evidence-engine`. This is provenance preparation only: **not a
release**, not a signed artifact, and not a device-verified install. Merge,
tag and release stay gated.

## Artifact

| Field | Value |
|---|---|
| File | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Type | Android **debug** APK (unsigned for release; debug key) |
| Source commit | `741a8f5` (branch `feat/clinical-evidence-engine`; version bump commit `4e5a8f5` plus a UI/docs-only delta — the subjective review label and engine-doc wording) |
| Built | 2026-11-22, ~14:31 IST (rebuilt after `npx cap sync android` re-embedded the updated web bundle) |
| Size | 78,487,151 bytes |
| SHA-256 | `bf7005afeb49ca3d4dfd9b0b9749707d757c6fc9eb4fb88b140c545d4c8c71f3` |
| Manifest (aapt2 dump badging) | package `ai.ayuswar.app`, **versionCode 37**, **versionName 0.3.34-debug**, minSdk 24, targetSdk 36 |
| Signer certificate (apksigner verify --print-certs) | CN=Android Debug (standard debug key); cert SHA-256 `57d44b07e4111ec3356d6b9f27ab37afcefb8256a696e670a464e7743f0b1b31` |

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

## Embedded-content consistency (this candidate)

- Embedded `assets/public/index.html` SHA-256
  `0a54afada91c1dc0370bdca4862ccfae6a64a5633f4443f85fd196e74af87566`
  matches the workspace `dist/index.html` byte-for-byte — the APK embeds the
  exact web bundle built from the recorded source commit.
- The per-section Subjective safeguard label string ("NOT verified against
  source evidence") is present in the embedded `MScribeFlow-*.js` and
  `ClinicalConsole-*.js` bundles inside the APK.
- `gradlew assembleDebug` without a preceding `npx cap sync android` reuses
  previously synced web assets: an intermediate build of this commit chain
  produced a different hash (`6d91f26c…`) with the pre-label bundle. The
  hash in the table above is the post-sync build and is the only candidate.

## Determinism note

Earlier on 2026-11-22, two independent builds at `0174027` and `4a91026`
(docs-only delta, version 0.3.33-debug metadata) produced a byte-identical
APK (`5ead7499…58b9`). The 0.3.34-debug candidate above supersedes both; it
differs by the version bump, the mobile subjective label and doc wording.

## What this artifact does and does not establish

- **Does:** the listed commit compiles into an installable debug APK whose
  manifest version, embedded web bundle and debug certificate any verifier
  can check against this file; the owner-side re-download of the staged
  draft-release asset matches the SHA-256 above.
- **Does not:** install/launch on a physical device, native microphone/STT/
  notifications, WebView behavior of offline packs, or any runtime claim.
  The physical-device matrix in `docs/RELEASE-READINESS.md` remains open.
  Manifest/certificate/embedded-asset checks above are build-side and
  owner-API checks, not an independent binary re-hash.
- The earlier recorded debug APK (20 Nov, `d295d34`, sha256 `7170DFF0…B4B`)
  predates this branch and is superseded as the current candidate.
