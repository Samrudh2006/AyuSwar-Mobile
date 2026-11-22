# APK provenance: v0.3.42-debug, 2026-11-22

Mobile-only debug checkpoint on `feat/clinical-evidence-engine`, directly on independently accepted guard source `651cf79e3b822afe7334fe3b939a120e96b0266c`. The release commit adds only version 0.3.42-debug / versionCode 45, this build record and README/matrix wording. No additional executable feature delta, main merge, frozen-web/Vercel change or previous-release replacement.

## Artifact

| Field | Value |
|---|---|
| Package | ai.ayuswar.app |
| Version | 0.3.42-debug, versionCode 45 |
| Type | Android debug APK, not production-signed |
| Size | 78,079,710 bytes |
| SHA-256 | 37e9875c2169440c3509e789f89c17ea2ef8a9d783fa4d6cb1507148493fd689 |
| Signer certificate SHA-256 | 57d44b07e4111ec3356d6b9f27ab37afcefb8256a696e670a464e7743f0b1b31 |
| Embedded assets/public/index.html SHA-256 | dbd634043deb9d9600756348b61f83f4765e28749b741d636bcbaf1bac107188 |
| Built | 2026-11-22, approximately 21:53 IST |

`apksigner verify --print-certs` passes. Package and debug certificate are unchanged; versionCode rises 44 -> 45. These are build-side update conditions only, not a physical install/upgrade or native-runtime test. All 133 generated dist HTML/JS/CSS/JSON files were compared byte for byte with the corresponding APK assets/public members. The compiled verifier payload contains the new interior-marker and non-unique-occurrence guard messages. Build inputs differ from accepted source only in version metadata; release documentation does not change executable app logic.

Build: `npm run build`, `npx cap sync android`, then `JAVA_HOME=<JDK21> ANDROID_HOME=<SDK> ./gradlew assembleDebug` in android/. Recorded JDK: Temurin 21.0.13.1+2. The debug APK is not a production signing/AAB/Play release.

## Change since v0.3.41-debug

- A question mark inside a source quote now holds the evidence AMBIGUOUS instead of being hidden from the outer question check.
- The same existing English/Indic negation rules now scan the quote interior. A quote cannot hide its own denial from the outer marker window. Negated records remain excluded after actual demo APPROVE or display-text EDIT.
- Multiple exact substring occurrences of the quote in its original utterance now hold AMBIGUOUS rather than trusting a first-index location. This includes overlaps and occurrences embedded inside a longer word. No boundary-aware occurrence selection or parser rewrite was added.
- The original outer temporal window and historical-cue calculation remain unchanged. No positive-eligibility recovery was added for the retained over-holds.

## Deliberate additional hold

The original 39 authored scenario verdicts remain **35 PASS / 4 FAIL**. ADV-03, ADV-25, ADV-27 and ADV-39 retain their previous actual behavior and empty exports. They were not relabeled or repaired by this patch.

One actual-case disposition changes: ADV-14's optional `cold` export is now held AMBIGUOUS because the identical raw substring also occurs inside `coldness`. ADV-14 still meets its original authored PASS expectation, but its optional export disappears. This is a real conservative usability tradeoff; it is not identical behavior, broader language understanding or full negation/scope parsing. The other 38 original actual-behavior records are unchanged. All historical adversarial artifacts and failed runs remain preserved.

## Verification and scope

- Independently accepted source `651cf79`: 550 passed, 3 actual conditional skips, 0 failed across 57 suite processes. The release commit changes no executable app logic beyond version metadata.
- New regression coverage: 42 actual source-registration, local-stub model-parser or fallback, verifier, demo APPROVE/EDIT and export checks in `test/phase53_evidence_span_guards.test.js`.
- The exact same final 42-check test file against the four byte-verified original service files from `fd34b92` yielded 13 passed / 29 failed before the fix. The initial 40-check pre-fix run yielded 13 passed / 27 failed and is also preserved. These failure logs/JSON were attached for review and remain local supporting evidence, not committed historical artifacts. They are not clinical gold labels or measured production incident counts.
- The fresh whole-suite JSON/logs at clean `651cf79` and a fresh original 39-case comparison were attached for independent review. Historical repository test/adversarial reports were not regenerated or overwritten to imply new results.
- Build passes. Lint: 0 errors, 2472 warnings, not warning-free. The source review and pipeline checks are simulated-model engineering evidence, not a live provider incident or provider-success result.

Reproduce targeted checks with `node test/phase53_evidence_span_guards.test.js`; full suite with `npm test`. Scope detail: [quote-span guards](EVIDENCE-SPAN-GUARDS-2026-11-22.md). Existing Audio-Rx software consistency and export-integrity behavior remain in place.

All older releases, tags, baseline reports, ASR measurements and prior known limitations remain. No new clinical labels, scope interpretation, dose-safety/allergy-interaction check, real consultation, patient-comprehension result, real-user feedback, live provider, clinical/ABDM validation, physical install/upgrade or native-runtime claim. Independent public artifact readback is required before user delivery.
