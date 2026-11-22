# Local export integrity gate, 2026-11-22

Source-only follow-up to the published v0.3.39-debug checkpoint. Not in that
APK. Independent source and mobile success/failure-flow review required before
any release checkpoint. No new resources, identities, persistence, services or
web-repository work.

## Actual behavior

Both existing FHIR collection actions now call
`src/services/checkedCollectionExport.js` instead of calling the file transport
directly. It calls the pure `src/utils/exportIntegrity.js` checker, then
serializes and invokes the existing exportTextFile transport only if accepted.
Accepted objects are not changed. No caller-supplied validation bypass exists
in either UI. The writer injection in unit tests substitutes only the transport,
not the checker.

Two supported shapes, deliberately limited to what the app emits today:

- Scribe: one completed QuestionnaireResponse, synthetic-research tag, the
  existing seven unique section IDs and valueString answers. No references or
  invented Patient are accepted on this route.
- Vitals: one anonymous Patient and at least one BP/pulse/weight Observation.
  Every Observation.subject must resolve to that single Patient inside the
  current file. Required date/value/unit/code fields are checked against the
  current emitter's fixed contract. A Patient identity expansion or unexpected
  resource/reading type is refused rather than silently accepted.

Shared checks cover collection shape, timestamp/calendar date, generated
narratives, UUID fullUrls and uniqueness (including case variants). Recursive
reference scanning refuses missing/dangling/external/wrong-target links and
unexpected nested references; it never fetches anything. Cycles/deep reference
structures fail closed. No correction, inferred value or identity is added.

Rejected objects return fixed error categories/messages. Diagnostics never
include submitted values, quotes, URLs or identifiers. Both UIs show an
explanation and retry/review direction, and stop before creating any file,
writing native cache or opening a share sheet. The vital error remains visible
until the next attempt; the scribe status is announced as a live status message.
Successful output retains the existing download/native-share behavior.

This is an APP INTEGRITY GATE, not a full FHIR, profile, terminology, clinical,
semantic, privacy or ABDM validator. A passing result does not prove identity,
correct measurements, clinical safety or recipient understanding. The app's
existing capture/approval/exclusion boundaries still do that separate work.
No known bad file emitted by the accepted builders is claimed to have been
fixed; the previously missing runtime boundary is the change.

## Reproduction and results

- `node test/phase51_export_integrity.test.js`: 38 passed, 0 failed.
  Uses the actual two emitters. Proves valid output is unchanged and transported
  once; malformed clones cover missing/duplicate identities, references,
  sections, narrative, dates, values, units and unsupported shapes. Rejection
  calls the writer zero times; messages are fixed and value-free.
- `npm test`: 479 passed, 3 conditional skips, 0 failed (82.67 seconds).
  Full recorded output: `../05-ENGINEERING-QUALITY/TEST_OUTPUT_2026-11-22_export-integrity.log`.
- `npm run lint`: 0 errors, 2472 warnings. Warnings are not hidden or called
  a warning-free result.
- `npm run build`: passed, also rebuilt by the aggregate browser e2e phase.
- `node scripts/test_export_integrity_flow.mjs`: actual 390 x 844 mobile-width
  built-app flow for BOTH actions, synthetic inputs only, non-local requests
  blocked. See `EXPORT_INTEGRITY_FLOW_2026-11-22.log` and
  `export-integrity-ui-2026-11-22/` screenshots.

The browser fault injection changes only crypto.randomUUID in that test page:
constant valid UUIDs create duplicate vital-entry identities; an invalid UUID
creates a malformed scribe entry identity. The real production click handlers,
checker and transport are exercised. There is no production test/fault hook.
Each failure shows its fixed explanation and creates zero download objects.
Restoring the UUID function and retrying yields exactly one download from each
action. These are browser-transport tests, not native Android runtime tests.
The scribe flow explicitly selects a sample and starts a manual draft; no model
response or provider success is claimed.

Actual successful captured files:
`INTEGRITY_VITALS_SYNTHETIC_OUTPUT_2026-11-22.json` and
`INTEGRITY_SCRIBE_SYNTHETIC_OUTPUT_2026-11-22.json`. They contain only synthetic
input and the existing emitted shapes, not new clinical resources. No redundant
Java-validator run was added: this change does not alter accepted output; the
prior scoped validator results and failed-run evidence remain unchanged.

The proposal matrix was reconciled against existing evidence: completed scoped
official-validator/profile-format runs are no longer described as unstarted;
39 text scenarios and delivered PDFs are distinguished from the still-unfinished
audio adversarial lab. No fresh PDF or count-only report regeneration was done.
