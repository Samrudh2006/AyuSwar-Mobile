# Evidence quote-interior and repeated-occurrence guard delta

Date: 2026-11-22. Source-only change pending independent review. The delivered v0.3.41-debug APK and its tag/provenance are unchanged; this document is not a new release or clinical-readiness claim.

## Scope

Three fail-closed additions to deterministic evidence verification:

- A question mark inside a verbatim quote now yields AMBIGUOUS, as an outer question delimiter already did.
- The same existing English/Indic negation-marker rules now also inspect the quote interior. An interior marker flags the record as negated; APPROVE or a display-text EDIT cannot make it export as a positive item.
- More than one exact substring occurrence of a quote in its unchanged source utterance now yields AMBIGUOUS, even when supplied offsets reproduce one occurrence. This includes overlapping occurrences and occurrences embedded in a longer word. Materialization itself still uses first indexOf; this patch prevents treating that choice as settled evidence rather than rewriting the parser.

The existing outer 40-character window and English historical-cue calculation are unchanged. Interior temporal cues are not newly parsed. Exact-source, speaker, conflict, fallback/provider, review and export gates are preserved. No new clinical labels, provider execution, audio claims, native-runtime claims, web changes, or ADV-03/25 eligibility expansion.

## Targeted regression evidence

`test/phase53_evidence_span_guards.test.js` contains 42 synthetic source-span/marker-policy checks. The real source registration, local-stub model parser or deterministic fallback, verifier, demo APPROVE and demo EDIT, and actual export gate are used. Tests do not equate the local stub with a live provider and do not claim authenticated clinical sign-off.

The same final 42-check suite was run against an isolated copy of the four original service files from clean source fd34b9277522e5593cce039180ef4cb388b6568c: 13 passed / 29 failed before the fix. After the fix: 42/42 passed. An earlier 40-check pre-fix run (13 passed / 27 failed) is also preserved outside the repository, not silently replaced by the final run. Baseline and changed observations show 29 newly held cases and zero newly export-eligible cases across the 42 synthetic probes. These are engineering regression counts, not clinical accuracy or production incident counts.

Existing engine tests pass 34/34 and spoken-vital context tests pass 36/36. The new suite is included in the unified runner. Fresh full-run results are recorded separately at the tested commit; this document does not predict them.

## Historical adversarial cases and deliberate tradeoff

The 39 original authored expectations and checks are unchanged. A scratch rerun still reports 35 PASS / 4 FAIL. ADV-03, ADV-25, ADV-27 and ADV-39 retain their previous dispositions, including their empty exports. Their expectations have not been relabeled to make the result green.

There is one per-case disposition change among these 39 cases: ADV-14's optional `cold` export is now held AMBIGUOUS because the exact substring also occurs within `coldness` in that source. Its authored expectation permits the standalone candidate and does not require its export, so ADV-14 remains PASS. This is a real conservative usability tradeoff, not identical behavior and not a lexicon change. The patch intentionally does not add boundary-aware occurrence selection. Any later narrowing needs separately qualified evidence for both fallback and arbitrary model quote shapes.

The existing dated adversarial JSON and all three pre-fix adversarial artifacts are preserved byte-for-byte. New scratch runs do not overwrite them. Pre-fix and changed-run logs/JSON are supporting review attachments, not committed evidence artifacts unless separately listed in a later evidence publication.

## Limits

These changes close the inspected synthetic quote-interior/first-occurrence bypass shapes. They do not provide full negation semantics, resolve scope, validate speaker truth or clinical meaning, enable the gated model-provider route, or make the app suitable for clinical use. The shared temporal heuristic remains bounded and English-only, with UNKNOWN/HISTORICAL output and no automatic CURRENT inference.
