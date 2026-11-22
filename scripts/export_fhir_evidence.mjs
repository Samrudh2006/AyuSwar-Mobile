#!/usr/bin/env node
// Export actual draft-emitter fixtures and reproducible structural checks only.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDraftBundle } from '../src/mobile/scribeDraft.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(root, process.argv[2] || 'AYUSWAR-TECHNICAL-EVIDENCE/04-INTEROPERABILITY');
const schemaPath = path.join(root, 'benchmarks/fhir/fhir.schema.json');
const schemaBytes = readFileSync(schemaPath);
const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, validateSchema: false, schemaId: 'auto', logger: false });
const schemaCheck = ajv.compile(JSON.parse(schemaBytes));
function inspect(bundle) {
  const schemaValid = !!schemaCheck(bundle);
  const schemaErrors = JSON.parse(JSON.stringify(schemaCheck.errors || []));
  const errors = [];
  if (bundle.resourceType !== 'Bundle') errors.push('resourceType must be Bundle');
  if (bundle.type !== 'collection') errors.push('This emitter must produce a collection Bundle');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(bundle.timestamp || '')) errors.push('timestamp must be an ISO-8601 instant');
  if (!(bundle.meta?.tag || []).some(t => t.code === 'synthetic-research-draft')) errors.push('synthetic tag required');
  if (!Array.isArray(bundle.entry) || bundle.entry.length !== 1) errors.push('Exactly one draft entry expected');
  const qr = bundle.entry?.[0]?.resource;
  if (qr?.resourceType !== 'QuestionnaireResponse') errors.push('Expected QuestionnaireResponse');
  if (!['in-progress','completed','amended','entered-in-error','stopped'].includes(qr?.status)) errors.push('QuestionnaireResponse status outside R4 enum');
  const items = Array.isArray(qr?.item) ? qr.item : [];
  const links = items.map(i => i.linkId);
  if (new Set(links).size !== links.length) errors.push('Duplicate linkIds');
  for (const id of ['source-mode','source-transcript','subjective','objective','assessment','plan']) if (!links.includes(id)) errors.push('Missing linkId: '+id);
  for (const item of items) for (const answer of item.answer || []) if (Object.keys(answer).length !== 1 || !Object.hasOwn(answer,'valueString')) errors.push('Expected one valueString per answer');
  return { valid: schemaValid && errors.length === 0, schemaValid, schemaErrors, projectInvariantErrors: errors };
}
const valid = buildDraftBundle({ subjective: 'Explicit synthetic transcript copy for structural evaluation.', objective: 'Not documented', assessment: 'Clinician review required', plan: 'Not documented', bestMatterVernacular: '' }, [{speaker:'DOCTOR',text:'Synthetic structural fixture only.'},{speaker:'PATIENT',text:'No real patient or consultation.'}], 'sample');
const invalid = JSON.parse(JSON.stringify(valid));
invalid.type = 'INVALID-BUNDLE-TYPE';
invalid.entry[0].resource.status = 9;
const positive = inspect(valid), negative = inspect(invalid);
if (!positive.valid || negative.valid || !negative.schemaErrors.length || !negative.projectInvariantErrors.length) throw new Error('Fixture expectations did not hold');
const revision = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const report = { generatedAt:new Date().toISOString(), revision, trackedWorkingTreeDirty:!!execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:root,encoding:'utf8'}).trim(), scope:'FHIR R4 JSON Schema plus project draft-emitter invariants only. Not profile, terminology, ABDM, or clinical validation.', schemaSha256:createHash('sha256').update(schemaBytes).digest('hex'), validator:'ajv@'+require('ajv/package.json').version, fixtures:[{file:'sample-valid-bundle.json',input:'Actual buildDraftBundle output with synthetic turns',expectedValid:true,...positive},{file:'sample-invalid-bundle.json',input:'Clone with deliberately invalid Bundle.type and numeric QuestionnaireResponse.status',expectedValid:false,...negative}] };
mkdirSync(out,{recursive:true});
for (const [name,data] of [['sample-valid-bundle.json',valid],['sample-invalid-bundle.json',invalid],['FHIR_VALIDATION_REPORT.json',report]]) writeFileSync(path.join(out,name),JSON.stringify(data,null,2)+'\n');
console.log('Exported emitted positive fixture and deliberately invalid negative fixture; both expectations verified. Structural checks only.');
