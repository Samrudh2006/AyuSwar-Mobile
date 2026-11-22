# APK Provenance — 2026-11-22 (debug checkpoint, 0.3.37-debug)

Build record for debug APK checkpoint `v0.3.37-debug`, built from
`feat/clinical-evidence-engine`. This is not a production-signed artifact
and not a device-verified install. All prior releases/tags (including
`v0.3.34-debug`, `v0.3.35-debug` and `v0.3.36-debug`) are preserved
unchanged.

## Artifact

| Field | Value |
|---|---|
| File | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Type | Android **debug** APK (debug key) |
| Source commit | version bump to 0.3.37-debug / versionCode 40 on top of `af92f33` (clean tree at build time; commit hash recorded in the release notes) |
| Built | 2026-11-22, ~17:06 IST (after `npm run build` + `npx cap sync android`) |
| Size | 78,072,020 bytes |
| SHA-256 | `b6baef97f8f6c1aeb88f40d80c0d497e32c17a4efe755ab9c938ebb39e4f722d` |
| Manifest (aapt2 dump badging) | package `ai.ayuswar.app`, **versionCode 40**, **versionName 0.3.37-debug**, minSdk 24, targetSdk 36 |
| Signer certificate (apksigner verify --print-certs) | CN=Android Debug; cert SHA-256 `57d44b07e4111ec3356d6b9f27ab37afcefb8256a696e670a464e7743f0b1b31` — identical to the published v0.3.34-debug, v0.3.35-debug and v0.3.36-debug signer |

## Embedded-content consistency

Embedded `assets/public/index.html` SHA-256
`d2015b33fe61f269c443e17d577411f2ce89c3be69ee6fa40c92226f87117150` is
byte-identical to `dist/index.html` after cap sync: the APK embeds the
fresh bundle, not a stale one.

## Why this checkpoint exists

This checkpoint carries the independently audited fallback-medication
changes and the license-cleared controlled-noise replacement evidence that
landed after the published `v0.3.36-debug` checkpoint. The earlier
MS-SNSD babble-noise run remains a separate, provisional, superseded
record and is not part of any claim section.

## Difference from the published v0.3.36-debug APK

App-source changes since the v0.3.36 build commit `46ab6e4`:
- `c2c1638` fallback medication mentions + measured RxNorm terminology match coverage (0.5 exact, not precision/recall)
- `65411a4` medication alias/normalization negation/allergy/mention-vs-instruction guards (tests)
- `9248d7c` historical-mention + cross-speaker ambiguity guards; fallback medication contract doc (tests/docs)
- `3405e2e` English contraction negation (straight/curly) + explicit UNKNOWN/HISTORICAL temporal status with source context in export
- `3c352b1` controlled-noise degradation on offline fallback ASR (n=120, SNR 20/10/5); temporal-cue contract precision (tests)
- `2bcc4e6`, `a6cb443`, `d222c22` docs only (measured-delta wording, license hold on MS-SNSD, matrix row)
- `af92f33` controlled-noise re-run with public-domain crowd recording (owning-source license verified); MS-SNSD run kept provisional/superseded (tests/evidence)
- version bump to 0.3.37-debug / versionCode 40

Suite on the build tree: 407 passed / 3 conditional skips / 0 failed.

## Upgrade compatibility (build-side only)

Package name identical (`ai.ayuswar.app`), signer certificate SHA-256
identical, versionCode strictly higher (39 -> 40): the conditions Android
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
