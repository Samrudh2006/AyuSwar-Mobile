#!/usr/bin/env node
// Generate EXPLICITLY SYNTHETIC FHIR R4 instances for offline profile-FORMAT
// validation against the public ABDM IG (ndhm.in 6.5.0).
//
// Scope: format/structure testing only. Every identifier, name, code and
// reference below is synthetic; nothing here is a real patient, provider,
// ABHA/HPR identity, diagnosis, medication instruction or clinical record,
// and a passing validation is NOT ABDM conformance, certification or any
// clinical claim. These instances are not emitted by the app; they probe
// what the profiles enforce structurally.
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(root, process.argv[2] || 'AYUSWAR-TECHNICAL-EVIDENCE/04-INTEROPERABILITY/profile-format-synthetic');
const SD = 'https://nrces.in/ndhm/fhir/r4/StructureDefinition';
const SYN_TAG = { system: 'urn:ayuswar:prototype', code: 'synthetic-profile-format-test', display: 'Synthetic profile-format fixture only; not a clinical record; not ABDM conformance evidence' };
const narrative = (t) => ({ status: 'generated', div: `<div xmlns="http://www.w3.org/1999/xhtml">${t}</div>` });

const patient = {
  resourceType: 'Patient',
  meta: { profile: [`${SD}/Patient`], tag: [SYN_TAG] },
  text: narrative('Synthetic test patient for profile-format validation only. Not a real person.'),
  identifier: [{ type: { text: 'synthetic-test-identifier' }, system: 'urn:ayuswar:synthetic-identifier', value: 'SYNTH-PAT-0001' }],
  name: [{ text: 'SYNTHETIC TEST PATIENT (not a real person)' }],
  gender: 'other'
};
const practitioner = {
  resourceType: 'Practitioner',
  meta: { profile: [`${SD}/Practitioner`], tag: [SYN_TAG] },
  text: narrative('Synthetic test practitioner for profile-format validation only. Not a real provider.'),
  identifier: [{ type: { text: 'synthetic-test-identifier' }, system: 'urn:ayuswar:synthetic-identifier', value: 'SYNTH-PRAC-0001' }],
  name: [{ text: 'SYNTHETIC TEST PRACTITIONER (not a real provider)' }]
};
const encounter = {
  resourceType: 'Encounter',
  meta: { profile: [`${SD}/Encounter`], tag: [SYN_TAG] },
  text: narrative('Synthetic test encounter for profile-format validation only.'),
  status: 'finished',
  class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB', display: 'ambulatory' },
  subject: { reference: 'urn:uuid:11111111-1111-4111-8111-111111111111' }
};
const condition = {
  resourceType: 'Condition',
  meta: { profile: [`${SD}/Condition`], tag: [SYN_TAG] },
  text: narrative('Synthetic test condition for profile-format validation only. Not a diagnosis.'),
  code: { text: 'synthetic condition text - not a real or validated diagnosis' },
  subject: { reference: 'urn:uuid:11111111-1111-4111-8111-111111111111' }
};
const observation = {
  resourceType: 'Observation',
  meta: { profile: [`${SD}/Observation`], tag: [SYN_TAG] },
  text: narrative('Synthetic test observation for profile-format validation only. Not a measurement.'),
  status: 'final',
  code: { text: 'synthetic observation label - not a coded clinical concept' },
  subject: { reference: 'urn:uuid:11111111-1111-4111-8111-111111111111' },
  valueString: 'synthetic value - format test only'
};
const medicationRequest = {
  resourceType: 'MedicationRequest',
  meta: { profile: [`${SD}/MedicationRequest`], tag: [SYN_TAG] },
  text: narrative('Synthetic test medication request for profile-format validation only. Not a prescription.'),
  status: 'draft',
  intent: 'proposal',
  medicationCodeableConcept: { text: 'synthetic demo medication only - not a real product or instruction' },
  subject: { reference: 'urn:uuid:11111111-1111-4111-8111-111111111111' },
  authoredOn: '2026-01-01',
  requester: { reference: 'urn:uuid:22222222-2222-4222-8222-222222222222' },
  dosageInstruction: [{ text: 'synthetic dosage text - not a real instruction' }]
};

const withId = (r, uuid) => ({ fullUrl: `urn:uuid:${uuid}`, resource: { id: uuid, ...r } });
const bundle = {
  resourceType: 'Bundle', type: 'collection', timestamp: '2026-01-01T00:00:00Z',
  meta: { tag: [SYN_TAG] },
  entry: [
    withId(patient, '11111111-1111-4111-8111-111111111111'),
    withId(practitioner, '22222222-2222-4222-8222-222222222222'),
    withId(encounter, '33333333-3333-4333-8333-333333333333'),
    withId(condition, '44444444-4444-4444-8444-444444444444'),
    withId(observation, '55555555-5555-4555-8555-555555555555'),
    withId(medicationRequest, '66666666-6666-4666-8666-666666666666')
  ]
};

mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, 'synthetic-profile-format-bundle.json'), JSON.stringify(bundle, null, 2) + '\n');
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
console.log(`wrote synthetic profile-format bundle (6 resources, all synthetic) at ${revision}`);
