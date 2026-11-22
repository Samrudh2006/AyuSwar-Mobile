# Synthetic FHIR profile-format validation (offline, ABDM IG 6.5.0)

**Scope.** Format/structure testing only. Every instance in
`synthetic-profile-format-bundle.json` is explicitly synthetic (synthetic
identifiers under `urn:ayuswar:synthetic-identifier`, synthetic names,
text-only codes, fixed UUIDs, `synthetic-profile-format-test` meta tag on
every resource). These instances are **not** emitted by the app, contain no
real patient/provider identity, no ABHA/HPR, no diagnosis, no medication
instruction, and a passing result is **not** ABDM conformance,
certification, onboarding readiness, or any clinical claim.

**What this adds.** Per-resource profile-format validation against the
five named ABDM profiles (Patient, Practitioner, Encounter, Condition,
Observation, MedicationRequest), run offline with the official validator,
answering what the profiles enforce structurally.

## Run record

| Field | Value |
|---|---|
| Validator | official HL7 FHIR Validator `validator_cli.jar` 7.0.6 (https://github.com/hapifhir/org.hl7.fhir.core/releases/download/7.0.6/validator_cli.jar) |
| JVM | OpenJDK 21 (`/home/sandbox/jdk21`; system default `java` is 11 and cannot load the validator — class-file 61 vs 55) |
| IG | `ndhm.in#6.5.0` package.tgz, sha256 `41fa99955adbd1983a235d7c7136b30f…` (public, https://www.nrces.in/ndhm/fhir/r4/package.tgz, no account) |
| Fixture generator | `scripts/export_fhir_profile_format_fixtures.mjs` (deterministic, fixed UUIDs, no randomness) |
| Command | `java -jar validator_cli.jar synthetic-profile-format-bundle.json -version 4.0.1 -ig package.tgz` |
| Verbatim log | `VALIDATOR_RUN.log` (this folder) |

## Result

**0 errors, 6 warnings, 7 notes.** All six resources were validated
against their declared ABDM profiles (meta.profile), references resolved
inside the bundle.

Read of the warnings (facts, not legal or onboarding conclusions):

- The ndhm identifier-type binding (`ndhm-identifier-type-code`) fired a
  **warning**, not an error, on the synthetic identifier type — consistent
  with its `extensible` strength. At schema level the profiles did not
  reject a non-ABHA identifier; whether a real deployment requires ABHA/
  HPR identity is a service/onboarding question outside schema validation
  and outside this artifact's scope.
- `Condition.code` with text only: no error (ICD-10/SNOMED CT coding
  slices are optional `0..*` in the profile differential).
- `Observation`: best-practice warnings only (performer, effective[x]
  recommended).
- `MedicationRequest` (status draft, intent proposal, synthetic requester
  reference to the in-bundle synthetic Practitioner, text-only dosage):
  no errors at format level.
- `urn:ayuswar:prototype` meta-tag system: unknown-codesystem notes only.

## Non-goals / unchanged gaps

- No ABDM document profile (e.g. PrescriptionRecord Composition) is
  asserted or validated here; document-level packaging, signatures and
  real registry identifiers are out of scope.
- Terminology-service validation used the validator's default public tx
  server for core terminologies; no ABDM-specific terminology service was
  exercised.
- Real-emission scope is unchanged: the app still emits only
  Bundle+QuestionnaireResponse (see matrix rows 45/47).
