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
| Source commit | `ad55365` (branch `feat/clinical-evidence-engine`; version bump commit `4e5a8f5` plus the source-aware subjective label, audio-provenance predicate, engine-doc wording and the mobile colour/readability pass) |
| Built | 2026-11-22, ~14:58 IST (rebuilt after `npx cap sync android` re-embedded the updated web bundle) |
| Size | 78,487,184 bytes |
| SHA-256 | `5d41bb462dcd83ed0cf9f979d75b9646ee50a63c84ff044a874cf73869785137` |
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
  `3fa91b8c7046a574a7653736972c0e5e8dbbec6866bd8aded32e8d62677fe11b`
  matches the workspace `dist/index.html` byte-for-byte, and the embedded
  `soapDraftSafeguards-*.js` and `MScribeFlow-*.js` chunks hash-match their
  `dist/` counterparts exactly — the APK embeds the exact web bundle built
  from the recorded source commit.
- The source-aware Subjective boundary label ("Confirm every statement
  against ...") is present in the embedded safeguards chunk inside the APK.
- `gradlew assembleDebug` without a preceding `npx cap sync android` reuses
  previously synced web assets: intermediate builds of this commit chain
  produced different hashes (`6d91f26c…`, `bf7005af…`, `2fb592e1…`) with
  stale bundles.
  The hash in the table above is the post-sync build and is the only
  candidate.

## Determinism note

Earlier on 2026-11-22, two independent builds at `0174027` and `4a91026`
(docs-only delta, version 0.3.33-debug metadata) produced a byte-identical
APK (`5ead7499…58b9`). The 0.3.34-debug candidate above supersedes all of
these; it differs by the version bump, the source-aware subjective label
and doc wording.

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
