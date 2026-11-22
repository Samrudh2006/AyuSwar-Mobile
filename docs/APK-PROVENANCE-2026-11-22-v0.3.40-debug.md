# APK provenance: v0.3.40-debug, 2026-11-22

Mobile-only debug checkpoint on the feature branch, directly on accepted source
`5371787`. The release commit adds only version 0.3.40-debug / versionCode 43,
this build record and current README/matrix wording. No extra feature delta,
main merge, web/Vercel change or previous release replacement.

## Artifact

| Field | Value |
|---|---|
| Package | ai.ayuswar.app |
| Version | 0.3.40-debug, versionCode 43 |
| Type | Android debug APK, not production-signed |
| Size | 78,079,422 bytes |
| SHA-256 | 43bc4568bf618285b934ae80e503dbf6bfc3322112cb7b47fd071cf88c26acc6 |
| Signer certificate SHA-256 | 57d44b07e4111ec3356d6b9f27ab37afcefb8256a696e670a464e7743f0b1b31 |
| Embedded assets/public/index.html SHA-256 | b353f4676810b3f5de8b4f0de1f35ba7802ed7a0848b84287b2d061c49d873a5 |
| Built | 2026-11-22, approximately 20:31 IST |

`apksigner verify --print-certs` passes. Package and debug signer are unchanged
from the previous releases; versionCode rises 42 -> 43. These are build-side
update conditions, not a physical-device install or upgrade test. Embedded
index.html matches the freshly built dist/index.html byte for byte.

Build: `npm run build`, `npx cap sync android`, then
`JAVA_HOME=<JDK21> ANDROID_HOME=<SDK> ./gradlew assembleDebug` in android/.

## Change since v0.3.39-debug

`5371787` adds a bounded local app integrity gate before the existing scribe
and vital collection file actions. It checks only their current emitted shapes:
required subset fields, UUID entry identities/uniqueness, and the single
anonymous Patient reference graph for vital files. Missing, duplicate,
dangling, external or wrong-target links are rejected before any file/cache/share
transport. Fixed messages explain review/retry without copying values, quotes
or identifiers into diagnostics. Accepted output is not rewritten.

The two actual mobile-width actions were independently exercised with browser
UUID fault injection: failure created zero download objects; restoring the UUID
function and retrying produced a file. There is no production fault hook or
validation bypass. No known bad output from the accepted builders is claimed to
have been fixed; the missing runtime boundary was the gap.

The gate is NOT a full FHIR, profile, terminology, semantic, clinical, privacy or
ABDM validator. It does not establish identity, measurement accuracy or clinical
safety. It adds no resources, identities, persistence or services.

## Checks and retained limits

- Source `5371787` independently accepted: 479 passed, 3 conditional skips,
  0 failed (441 earlier checks + 38 gate checks). No executable app logic differs
  in this release commit.
- Targeted checks prove accepted objects reach transport unchanged, rejected
  objects call the writer zero times, and messages are fixed/value-free.
- Build passes. Lint: 0 errors, 2472 warnings, not a warning-free claim.
- Actual 390 x 844 browser success/fault/retry paths cover both UI actions.
  They are NOT native Android or physical-device evidence.
- Existing anonymous BP/pulse/weight export remains bounded to selected new
  declared-person entries. Old/seed/pre-subject rows, SpO2 and glucose remain
  excluded. No inferred measurements, clinician/device identity or diagnosis.
- Files omit person labels/IDs/relationships/ABHA; recipients need the person
  identified separately. One person per file, not an identity-linkage service.
- Prior synthetic-only official HL7 validator results remain as recorded:
  0 errors / 10 warnings / 11 notes for the identity fixture, with terminology
  disabled and LOINC/UCUM machine-unverified. This checkpoint does not alter
  accepted emitted content or add another standards-validation claim. Failed
  validator evidence is preserved; terminology disabled is not wholly offline.
- Existing 39 adversarial TEXT scenarios retain 35 PASS / 4 fail-closed FAILs
  (ADV-03/25/27/39). No dose-safety/allergy-drug interaction check. Audio-level
  adversarial coverage remains incomplete.

Evidence: `AYUSWAR-TECHNICAL-EVIDENCE/04-INTEROPERABILITY/EXPORT_INTEGRITY_GATE_2026-11-22.md`,
targeted/flow logs, captured synthetic output and screenshots. Matrix wording
now distinguishes completed scoped validator/text/PDF work from broader
unverified claims; dated evidence records are not rewritten.

No clinical validation, real-user feedback, provider success, native-runtime,
physical install/upgrade, production signing or live ABDM claim. All older
releases, tags and baselines are preserved. Independent public artifact readback
is required before user delivery.
