# APK provenance: v0.3.41-debug, 2026-11-22

Mobile-only debug checkpoint on `feat/clinical-evidence-engine`, directly on independently accepted Audio-Rx source `c14bf445d3250eef0859b2d203210086c7a89132` (implementation `7744450`, Node import compatibility follow-up `c14bf44`). The release commit adds only version 0.3.41-debug / versionCode 44, this build record and README/matrix wording. No extra feature delta, main merge, frozen-web/Vercel change or previous-release replacement.

## Artifact

| Field | Value |
|---|---|
| Package | ai.ayuswar.app |
| Version | 0.3.41-debug, versionCode 44 |
| Type | Android debug APK, not production-signed |
| Size | 78,079,594 bytes |
| SHA-256 | 5190dd8e76a274ba02183a96040401f78f777e9faec5b8c6d06e7f0246c58eae |
| Signer certificate SHA-256 | 57d44b07e4111ec3356d6b9f27ab37afcefb8256a696e670a464e7743f0b1b31 |
| Embedded assets/public/index.html SHA-256 | efc452ab0ffa030de87fdd60eca3a41aafd9e46ec2457419659ba709faa51497 |
| Built | 2026-11-22, approximately 21:18 IST |

`apksigner verify --print-certs` passes. Package and debug certificate are unchanged; versionCode rises 43 -> 44. These are build-side update conditions only, not a physical install/upgrade or native-runtime test. Every dist HTML/JS/CSS/JSON file was compared byte for byte with the corresponding APK assets/public member, including index.html. Build inputs differ from accepted source only in version metadata; the release documentation does not change executable app logic.

Build: `npm run build`, `npx cap sync android`, then `JAVA_HOME=<JDK21> ANDROID_HOME=<SDK> ./gradlew assembleDebug` in android/.

## Change since v0.3.40-debug

- The actual Audio-Rx modal download handler now fails closed when the exact visible text and selected language lack an existing recorded-file binding. In particular, the default no-medicine-instruction disclaimer has no qualified recording binding: its unknown-default WAV download is **blocked, not replaced by newly verified audio**. No canonical script was invented for a `gnani_lang` file and no new audio was recorded or generated.
- Only the two pre-existing Telugu/Hindi canonical script literals were moved into a shared resolver, unchanged. Precisely matching existing script/language pairs retain unchanged original WAV downloads. Whitespace-only normalization follows the earlier service policy. Text/language mismatch, HTTP/non-audio failure, and an in-flight source edit/close/unmount cannot substitute or download stale audio. This is an existing script-to-static-file binding, not independent audio-semantic validation or a new runtime cryptographic asset validator.
- Sample quiz completion is derived from current existing answers. Correct-to-wrong states revoke the badge, success explanation, practice-note completion and exported JSON completion. Correcting both restores existing success behavior. Editing the source resets both stored choices, so stale answers cannot silently reacquire completion.
- The quiz is a **bundled-example check, not patient comprehension or adherence evidence**, and is not a medical evaluator for arbitrary edited instructions. No new answer key, clinician approval or clinical labels were added.

## Verification and scope

- Accepted source `c14bf44`: 508 passed, 3 actual conditional skips, 0 failed, independently reproduced. The release commit changes no executable app logic.
- New regression coverage: 22 actual mounted-handler checks plus 7 built-app phone-width flows, registered in `test/run_all.js`. Existing canonical positive downloads are compared with exact repository WAV bytes; unknown defaults reject before fetch and file creation.
- Actual styled mobile routes at 390 and 360 CSS pixels cover default/edited rejection, known canonical download, quiz correct/wrong/correct, source-edit choice reset, note and JSON state. Browser reports record the source revision and clean tracked tree. No page errors. API/provider requests are blocked at the local test boundary and no microphone is opened. This is not native-device or acoustic-listening validation.
- Build passes. Lint: 0 errors, 2472 warnings, not warning-free.
- The first full-suite run at `7744450` failed because the new shared service import lacked a Node-compatible `.js` suffix. The follow-up `c14bf44` repaired it; the subsequent clean whole-suite run passed. That first failed-run summary is retained locally and was attached for review; it is **not committed as a repository evidence artifact**. Earlier local browser-harness selector failures were also retained, not reclassified as application passes.

Reproduce: `node test/phase52_audio_rx_consistency.test.js` and `node test/phase52_audio_rx_browser.test.js`. Scope detail: [Audio-Rx software consistency](AUDIO-RX-SOFTWARE-CONSISTENCY-2026-11-22.md). The original comprehension deliverable stays DEFERRED in the matrix.

All older releases, tags, baseline reports, recorded ASR measurements and prior known limitations remain. The 17.92-second respiratory ASR trace is full-clip local inference beyond the shipping 15-second cap, not shipping-path evidence. No numerical medical-term recall, dose-safety/allergy-interaction check, real consultation, language intelligibility, real-user feedback, provider success, clinical/ABDM validation, physical install/upgrade, native runtime or production-signing claim. Independent public artifact readback is required before user delivery.
