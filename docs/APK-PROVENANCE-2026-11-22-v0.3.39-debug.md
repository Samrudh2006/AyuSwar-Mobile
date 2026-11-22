# APK provenance: v0.3.39-debug, 2026-11-22

Mobile-only debug checkpoint built on the feature branch on top of `9eb9fbf`.
The release commit adds only version 0.3.39-debug / versionCode 42 and docs.
No main merge, frozen web/Vercel change or previous release replacement.

## Artifact

| Field | Value |
|---|---|
| Package | ai.ayuswar.app |
| Version | 0.3.39-debug, versionCode 42 |
| Type | Android debug APK, not production-signed |
| Size | 78,076,716 bytes |
| SHA-256 | eb05d5b433326f7bfbadbb314c2cd720b51d96170bb428b7cb4f6c2139b29a63 |
| Signer certificate SHA-256 | 57d44b07e4111ec3356d6b9f27ab37afcefb8256a696e670a464e7743f0b1b31 |
| Embedded assets/public/index.html SHA-256 | 90e25126fbbd54e9d3ec60d5c78bb9bd566f154ddd38a3fc23f069873207d128 |
| Built | 2026-11-22, approximately 20:03 IST |

`apksigner verify --print-certs` passes. The debug signer and package are
unchanged from earlier releases; versionCode rises 41 -> 42. Those are
build-side in-place update conditions, not a physical-device upgrade test.
Embedded index.html is byte-identical to the fresh dist/index.html.

Build sequence: `npm run build`, `npx cap sync android`, then
`JAVA_HOME=<JDK21> ANDROID_HOME=<SDK> ./gradlew assembleDebug` in android/.

## Meaningful change since v0.3.38

- `662dea1`: actual self-entered vital export, structured capture date/values,
  explicit selection and exclusions, with the initial missing-subject validator
  failure retained as evidence.
- `9eb9fbf`: per-entry declared person, stable local IDs isolated by profile,
  labels never identity/group keys, single-person output with one anonymous
  Patient and resolvable Observation references. No history migration, identity
  reassignment or label-edit feature. Old/seed/pre-subject rows remain excluded.
- `b2eee29`: earlier docs-only release-link correction.

The mobile-width route was exercised from Home through patient demo sign-in,
My Health and Export readings. Selection starts empty; mixed-person ticks and
mixed-person builder input are refused. Same-label people remain distinct.
The filename is person-neutral. No local labels, local IDs, relationships or
personal identifiers appear in the file. The UI prominently warns that a
recipient cannot identify the person from the file and asks the user to identify
them separately and keep different people's files separate.

## Checks and limits

The full source suite at `9eb9fbf` was independently reproduced: 441 passed,
3 conditional skips, 0 failed. The release changes no executable app logic.
Phase 50 has 31 checks. The mobile-width flow uses headless Chrome on the built
web bundle, not an Android device or native-runtime test.

Synthetic-only emitted fixture: official HL7 FHIR Validator 7.0.6, R4 4.0.1,
`-tx n/a`: 0 errors, 10 warnings, 11 notes. Terminology is unverified. Remaining
warnings include no performer and codes/UCUM not checked without a terminology
service. Disabling terminology does not establish a wholly offline run.
The previous 3-error missing-subject run is preserved, not hidden. Structural
validation is not semantic/clinical validation, registry linkage or ABDM
conformance. No real readings were used in the evidence or sent to a validator.

Only BP, pulse and weight are coded for export. SpO2 and blood glucose remain
excluded, with reasons and no note backdoor. No diagnoses, interpretation,
clinician identity, measurement device or verification status is invented.
The preliminary workflow status is separate from capture-proven provenance;
no assurance about consumer interpretation is made.

The existing text-guard limitations remain: 39 adversarial scenarios contain
35 PASS / 4 retained fail-closed FAILs (ADV-03, ADV-25, ADV-27, ADV-39). There
is no dose-safety or allergy-drug interaction check.

No clinical validation, real-user feedback, live provider success, native-runtime,
physical-device install or upgrade is claimed. Older releases, tags and dated
baselines are preserved. Independent public artifact readback is required before
user delivery.
