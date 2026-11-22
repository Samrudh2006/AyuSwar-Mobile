# AyuSwar Mobile evaluator handoff

Snapshot: 22 November 2026, v0.3.42-debug. This is an evidence package, not a new app release or a clinical-readiness certificate.

## Start with the two different revisions

- **Released application:** `843ea7bf2b26a6d983f665e1488cb17f86d2010c`, tag v0.3.42-debug, package ai.ayuswar.app, versionCode 45. This release adds only version/docs/provenance to the accepted guard source.
- **Accepted full-suite evidence:** `651cf79e3b822afe7334fe3b939a120e96b0266c`, clean tracked tree. The recorded run is 57 suite processes, **550 passed / 3 actual conditional skips / 0 failed**. Do not relabel it as a full-suite run at the later release or packaging commit.

[APK release](https://github.com/Samrudh2006/AyuSwar-Mobile/releases/tag/v0.3.42-debug) · [Released source](https://github.com/Samrudh2006/AyuSwar-Mobile/commit/843ea7bf2b26a6d983f665e1488cb17f86d2010c) · [Accepted guard source](https://github.com/Samrudh2006/AyuSwar-Mobile/commit/651cf79e3b822afe7334fe3b939a120e96b0266c)

[Download the APK](https://github.com/Samrudh2006/AyuSwar-Mobile/releases/download/v0.3.42-debug/ayuswar-v0.3.42-843ea7b-debug.apk). It is intentionally not duplicated inside the evidence ZIP. APK SHA-256: `37e9875c2169440c3509e789f89c17ea2ef8a9d783fa4d6cb1507148493fd689`, 78,079,710 bytes. See [machine-readable release identity](RELEASE-IDENTITY.json).

## Inspect the current engineering evidence

The files below were previously retained for review and are now published under this dated handoff path, without rewriting older repository reports.

- [Whole-suite JSON](accepted-651cf79/TEST_RESULTS.json), [JUnit XML](accepted-651cf79/TEST_RESULTS.xml), [verbatim suite output](accepted-651cf79/TEST_OUTPUT.log). JUnit testcases represent suite processes, not one testcase per assertion. Skips are two external Supabase checks and one optional real-inference local-voice smoke. They are not passes.
- [42 guard pipeline observations](accepted-651cf79/SPAN_GUARDS.json). These use source registration, local-stub model parsing or deterministic fallback, actual verification, demo APPROVE and display-text EDIT, and the real export gate. The internal extraction enum MODEL_LIVE in tests does not mean an external provider was called. Demo review is not clinical sign-off.
- [Original 39-case rerun](accepted-651cf79/ADVERSARIAL-CURRENT.json) and [exact before/after difference](accepted-651cf79/ADVERSARIAL-DIFF.json). The original authored verdicts remain **35 PASS / 4 FAIL**. Only ADV-14's actual disposition changes: optional cold export is now AMBIGUOUS/held because the identical substring also occurs inside coldness. The other 38 actual records are unchanged. ADV-03/25/27/39 remain unresolved FAIL rows with empty exports. No positive-eligibility recovery is included.
- [Full lint result](accepted-651cf79/lint.log): 0 errors, 2472 warnings, not a warning-free run.

## Keep the failures visible

The final 42-check policy test was also run against an isolated copy of the four original service files from `fd34b9277522e5593cce039180ef4cb388b6568c`: **13 passed / 29 failed**. The [pre-fix observations](accepted-651cf79/PRE-FIX-FINAL42-SPAN-GUARDS.json) and [failed test output](accepted-651cf79/PRE-FIX-FINAL42-SPAN-GUARDS.log) are retained. An earlier 40-check version had 13 passed / 27 failed; its [observations](accepted-651cf79/PRE-FIX-SPAN-GUARDS.json) and [output](accepted-651cf79/PRE-FIX-SPAN-GUARDS.log) are separate files, not replacements for the final run. These are synthetic marker/span policy expectations, not new clinical gold annotations or production incident counts.

## Historical evidence is still historical

The ZIP includes the existing technical-evidence tree, selected documentation and benchmark reports at the released source snapshot. Historical evaluation files and their recorded dates/revisions remain intact. Current notes have a narrow privacy correction: private conversation locators, precise message times and operational references are omitted, while product-relevant provenance remains. This correction does not erase earlier Git history or previously downloaded archives. The manifest identifies the changed note copies. In particular:

- The corrected ASR PDF reports measured FLEURS and a bounded controlled-noise experiment. It does not establish clinical, Tenglish, dialect or native-device accuracy. Telugu local quantizer settings were not recorded; Hindi pilot model origin remains unverified. Neither is repaired by this handoff.
- The safety PDF remains the recorded 82-check text-level baseline with its later 407/3 appendix, not a new 550-check PDF or an audio-level clinical study.
- The file named `TEST_RESULTS_2026-11-22_current.json` in the older engineering-quality folder is a historical 407-assertion run at `2164f36`. The undated baseline is 383. The word current in those retained filenames does not make them the latest run.
- Official FHIR runs are scoped by their own logs. Format checks, disabled/default terminology settings and actual emitted-resource coverage differ by run. No full terminology, clinical semantics or ABDM exchange is implied.
- The ASR evidence trace includes a recorded 17.92-second full-clip inference that exceeds the shipping 15-second cap. It is not shipping-path evidence.

The [proposal completion matrix](https://github.com/Samrudh2006/AyuSwar-Mobile/blob/843ea7bf2b26a6d983f665e1488cb17f86d2010c/docs/PROPOSAL-COMPLETION-MATRIX-2026-11-22.md) records partial/deferred requirements. Historical PDFs and slides are not silently relabeled as this checkpoint.

## Replay without confusing the scope

For the full application and whole suite, clone the Mobile repository, check out v0.3.42-debug, and follow its documented npm/build instructions. A new run produces new evidence; preserve these recorded files. This evidence ZIP is not a complete application checkout, APK installer or model pack. Marketing pitch materials and video binaries are excluded; the separately delivered technical deck is not bundled.

A small byte-matched copy of the four evidence services and the 42-check test is included in `replay-span-guards/` inside the ZIP. With Node 22, run:

```sh
cd replay-span-guards
node test/phase53_evidence_span_guards.test.js
```

This needs no provider key, model download or dependency installation. It replays the 42 software policy checks only, not all 550 assertions. `MANIFEST.json` lists each ZIP payload path, byte size, SHA-256, and source path. The manifest does not checksum itself or the outer ZIP.

## Remaining limits

No medical-term recall denominator, consented Tenglish/dialect evaluation, 30-50 audio-level clinical scenarios, per-entity audio timing, patient-comprehension result, real clinician/user feedback, live authorized model-provider route, server-side exactly-once guarantee, full FHIR/ABDM semantics, production signing or physical Android runtime has been established. Existing source/data/privacy controls and the three conditional skips do not close these gaps. The broader proposal remains partial. Web/Vercel and main are outside this Mobile handoff.
