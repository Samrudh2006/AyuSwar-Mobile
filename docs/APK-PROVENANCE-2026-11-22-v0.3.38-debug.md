# APK Provenance — 2026-11-22 (debug checkpoint, 0.3.38-debug)

Build record for debug APK checkpoint `v0.3.38-debug`, built from
`feat/clinical-evidence-engine`. This is not a production-signed artifact
and not a device-verified install. All prior releases and tags (including
`v0.3.34-debug` to `v0.3.37-debug`) are preserved unchanged.

## Artifact

| Field | Value |
|---|---|
| File | `android/app/build/outputs/apk/debug/app-debug.apk` |
| Type | Android **debug** APK (debug key) |
| Source commit | version bump to 0.3.38-debug / versionCode 41 on top of `bf92492` (only package.json, package-lock.json, build.gradle, matrix row 57 and this doc differ from `bf92492`) |
| Built | 2026-11-22, ~18:45 IST (after `npm run build` + `npx cap sync android`) |
| Size | 78,072,160 bytes |
| SHA-256 | `43b2016b48ab7f036f4ba9b33ca62f3e5fc34d23d88a2f3376d256f1010fd1d2` |
| Manifest (aapt2 dump badging) | package `ai.ayuswar.app`, **versionCode 41**, **versionName 0.3.38-debug** |
| Signer certificate (apksigner verify --print-certs) | CN=Android Debug; cert SHA-256 `57d44b07e4111ec3356d6b9f27ab37afcefb8256a696e670a464e7743f0b1b31`, identical to earlier published debug releases |

## Embedded-content consistency

Embedded `assets/public/index.html` SHA-256
`194c83a8c58fdf812c160b9e46e687d094fd5cb0559a9614b5eb77a6451af1f8`
equals `dist/index.html` after cap sync.

## Why this checkpoint exists

`v0.3.37-debug` does not contain the guard fixes below; they exist only in
branch source until this build. Every change tightens the guard (fail-closed).

- combining marks are counted as word characters
- a question span is held AMBIGUOUS
- the Hindi marker 'ना' matches as a whole token
- explicit Telugu polite negation ('లేదండి', 'కాదండి') is recognized
- ASR manifest provenance strings corrected: no quantizer version or operator claim is made (the 0.3.37 APK embeds the older, unproven string)

Commits since 0.3.37 build: guard/provenance fixes and tests through
`d440775`, adversarial harness `01fdad0`, docs/evidence `0a2f92f`, `bf92492`.

Suite on the build tree: 410 passed / 3 conditional skips / 0 failed.

## Known limitations (kept on the record)

Adversarial artifact `AYUSWAR-TECHNICAL-EVIDENCE/03-CLINICAL-SAFETY/ADVERSARIAL_SCENARIOS_2026-11-22.json`: 39 scenarios, 35 PASS / 4 FAIL.
Four retained fail-closed FAILs: ADV-03, ADV-25, ADV-27 (marker-window over-negation) and ADV-39 (an affirmed clause ending in a question is held AMBIGUOUS).
Non-capabilities: no dose-safety check (ADV-07) and no allergy-drug interaction check (ADV-29).
Pre-fix runs are retained beside it.

## Scope limits

Debug key only. No physical device install or upgrade was performed. No
clinical validation, live provider/ABDM integration, native-runtime or
real-user claims. Package name and signer are unchanged and versionCode is
higher (40 -> 41), so build-side in-place update conditions hold; on-device
behavior is untested.

## Reproduce

```bash
npm ci && npm run build && npx cap sync android
cd android && JAVA_HOME=<jdk21> ANDROID_HOME=<sdk with android-36> ./gradlew assembleDebug
sha256sum app/build/outputs/apk/debug/app-debug.apk
```
