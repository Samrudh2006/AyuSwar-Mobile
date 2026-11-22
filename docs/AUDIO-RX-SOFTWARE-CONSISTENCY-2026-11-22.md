# Audio-Rx software consistency clarification and correction

2026-11-22. Synthetic software checks only, not prescription correctness, clinician approval, patient understanding, adherence, intelligibility or audio-content validation.

## Download source binding

The modal's default text is a no-medicine-instruction disclaimer. Its former direct WAV download selected `gnani_lang_<language>.wav` without establishing that the file represented the visible text. The default disclaimer does not have a qualified recording binding. Downloads now fail closed before any file request when the exact visible text and selected language lack an existing binding. The visible text is not replaced to make a recording fit.

`src/services/bundledSpeechSamples.js` contains only the same two canonical scripts previously held inside `indicSpeechService.js`, moved without changing their literals. The resolver folds whitespace only. No canonical script was invented for any `gnani_lang` recording. The existing explicit-demo speech fallback still uses the same matching policy; download matching additionally requires the visible language to match the existing Telugu or Hindi sample.

A qualified existing script still downloads its corresponding original WAV bytes. HTTP or content-type errors produce no replacement audio. A request that finishes after the visible source/language changes, or after the modal closes/unmounts, cannot download its earlier recording. This is source-to-file binding, not an independent judgment about pronunciation or semantic accuracy of the recordings.

## Existing bundled quiz state

Completion is derived from the two current existing answer choices instead of a sticky success flag. A wrong or unanswered choice cannot retain the complete badge, success explanation, completed practice-note statement or `sampleQuizCompleted: true` in exported JSON. Correcting both choices restores the existing sample completion behavior.

Editing the source text resets both stored choices, so an old answer cannot silently combine with one new click to restore completion. The quiz remains explicitly about the bundled example, not a generated comprehension evaluator for arbitrary edited instructions. No medical answer key or free-text schedule parser was added.

## Reproduction

- `node test/phase52_audio_rx_consistency.test.js`: actual mounted modal and Studio handlers with provider boundaries instrumented. Existing script targets and quiz choices only. Covers six default-language rejections, unchanged-byte positive Telugu/Hindi downloads, text/language mismatch, error responses, in-flight source edits/unmount, current quiz choices, correction recovery, edit/reset, note and JSON consistency.
- `node test/phase52_audio_rx_browser.test.js`: builds current source and visits the real mobile routes at 390 and 360 CSS pixels using a local built preview. Opens the modal through the actual AI-tab quick action. Exercises blocked default download, unchanged-byte positive download, edited-source rejection, quiz correct/wrong/correct, practice JSON and source-edit reset. All external/provider requests are blocked; no microphone is opened. Browser absence fails direct execution; under the aggregate suite it is reported as a conditional skip.
- Set `AYUSWAR_AUDIO_RX_EVIDENCE_DIR` to retain browser screenshots and `browser-results.json` elsewhere; the default is a git-ignored test directory. The result records the source revision, tracked-tree state and build-index digest.

These checks are registered in `test/run_all.js`. They do not replace an independent source/browser review or an installed-Android test. No release is implied by a passing source check.

## Original deliverable remains open

The original synthetic prescription-comprehension proposal also asks about understanding, schedule repetition, approved-prescription matching, language clarity and spoken/written contradiction. Those outcomes are not established by this bounded software correction. No actual clinician approval, patient result, new recording, new clinical label, new provider call, medical-recall metric or clinical validation is claimed. Historical ASR measurements, release artifacts and recorded baseline reports are unchanged.
