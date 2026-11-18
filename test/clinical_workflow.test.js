import assert from 'node:assert';
import { 
  checkDrugInteractions, 
  calculateMewsScore, 
  getJanAushadhiGenericInfo, 
  generateAbdmFhirR4Bundle 
} from '../src/data/clinicalSafetySentinel.js';
import { resolveIndicVernacular } from '../src/data/indicVernacularOntology.js';
import { DIAGNOSTIC_REPORTS_DATABASE } from '../src/data/diagnosticReportsDataset.js';

console.log('--- RUNNING AYUSWAR AI CLINICAL WORKFLOW & SAFETY INTEGRATION TESTS ---');

// 1. DDI Sentinel Tests: Verify critical and high drug-drug contraindication alerts
const criticalDdi = checkDrugInteractions(['Warfarin 5mg', 'Ciprofloxacin 500mg']);
assert.ok(Array.isArray(criticalDdi) && criticalDdi.length > 0, 'Warfarin + Ciprofloxacin must trigger interaction alert');
assert.strictEqual(criticalDdi[0].severity, 'Critical', 'Severity must be Critical');
assert.ok(criticalDdi[0].mechanism.includes('CYP1A2'), 'Must cite CYP1A2 mechanism');
console.log('✓ Test 1 Passed: Pharmacovigilance DDI Sentinel detects Warfarin + Ciprofloxacin Critical Bleeding Risk.');

const dualRaasDdi = checkDrugInteractions(['Enalapril 5mg', 'Telmisartan 40mg']);
assert.ok(Array.isArray(dualRaasDdi) && dualRaasDdi.length > 0, 'Enalapril + Telmisartan must trigger dual RAAS blockade alert');
assert.strictEqual(dualRaasDdi[0].severity, 'High', 'Dual RAAS must be High severity');
console.log('✓ Test 2 Passed: Pharmacovigilance DDI Sentinel detects Dual RAAS Blockade Contraindication.');

// 2. MEWS Score Deterioration Tests
const normalVitals = { bpSystolic: 120, hr: 72, spo2: 98, respRate: 16 };
const normalMews = calculateMewsScore(normalVitals);
assert.strictEqual(normalMews.score, 0, 'Normal vitals must score MEWS 0');
assert.ok(normalMews.riskLevel.includes('Sample low-score'), 'Normal synthetic vitals must use the sample low-score label');

const criticalVitals = { bpSystolic: 70, hr: 135, spo2: 90, respRate: 32 };
const criticalMews = calculateMewsScore(criticalVitals);
assert.ok(criticalMews.score >= 5, 'Deteriorating vitals must score MEWS >= 5');
assert.ok(criticalMews.riskLevel.includes('Sample high-score'), 'Synthetic score >= 5 must use the sample high-score label');
console.log('✓ Test 3 Passed: MEWS-shaped sample scoring returns deterministic synthetic display bands.');

// 3. PMBJP Jan Aushadhi generic reference: identity-only matching, never invented.
// A query must name the full generic including strength AND formulation/release
// type; unsourced brand-to-generic mappings are never asserted.
const exactInfo = getJanAushadhiGenericInfo('Telmisartan 40mg Tablets IP');
assert.ok(exactInfo && exactInfo.genericName === 'Telmisartan 40mg Tablets IP', 'Full generic name must return the matching entry');
assert.strictEqual(exactInfo.verificationStatus, 'not live-checked', 'Sample formulary reference must be explicitly marked not live-checked');

// A name missing the release form must not establish gastro-resistant / SR equivalence
assert.strictEqual(getJanAushadhiGenericInfo('Pantoprazole 40mg'), null, 'Name without gastro-resistant form must not map to the GR pack');
assert.strictEqual(getJanAushadhiGenericInfo('Metformin 500mg'), null, 'Name without SR form must not map to the SR pack');
// Brand names are unsourced mappings and must not resolve
assert.strictEqual(getJanAushadhiGenericInfo('Telma 40'), null, 'Unsourced brand-to-generic mapping must not resolve');
assert.strictEqual(getJanAushadhiGenericInfo('Dolo 650'), null, 'Unsourced brand-to-generic mapping must not resolve');
// A single-ingredient inhaler must never map to the Budesonide+Formoterol combo
assert.strictEqual(getJanAushadhiGenericInfo('Budesonide Inhaler (200 mcg)'), null, 'Single-ingredient Budesonide must not map to the combo inhaler');
// The exact combo generic name does map to the combo entry
const comboInfo = getJanAushadhiGenericInfo('Budesonide 200mcg + Formoterol 6mcg Inhaler');
assert.ok(comboInfo && comboInfo.genericName.includes('Formoterol'), 'Exact combo generic name must map to the combo entry');
// Unknown medicines must return null, never an invented generic equivalent
assert.strictEqual(getJanAushadhiGenericInfo('Some Unknown Syrup 123'), null, 'Unknown medicine must return null');
console.log('✓ Test 4 Passed: Jan Aushadhi generic reference is identity-only (ingredient+strength+form) and never invents substitutions.');

// 4. Indic Vernacular Colloquial Idiom Resolution
const teluguPalpitation = resolveIndicVernacular('గుండెల్లో దడ');
assert.ok(Array.isArray(teluguPalpitation) && teluguPalpitation.length > 0, 'Telugu phrase must resolve to ontology entry');
assert.strictEqual(teluguPalpitation[0].icd10, 'R00.2', 'Must map to Palpitations R00.2');

const hindiRetraction = resolveIndicVernacular('पसली चलना');
assert.ok(Array.isArray(hindiRetraction) && hindiRetraction.length > 0, 'Hindi retraction phrase must resolve');
assert.strictEqual(hindiRetraction[0].snomed, '267036007', 'Must map to SNOMED 267036007');

const bengaliChestTightness = resolveIndicVernacular('বুকে চাপ আর শ্বাসকষ্ট');
assert.ok(Array.isArray(bengaliChestTightness) && bengaliChestTightness.length > 0, 'Bengali phrase must resolve');
assert.strictEqual(bengaliChestTightness[0].icd10, 'R07.89', 'Must map to ICD-10 R07.89');

const marathiChestPain = resolveIndicVernacular('छातीत दुखणे आणि धाप लागणे');
assert.ok(Array.isArray(marathiChestPain) && marathiChestPain.length > 0, 'Marathi phrase must resolve');
assert.strictEqual(marathiChestPain[0].icd10, 'I20.9', 'Must map to ICD-10 I20.9');

console.log('✓ Test 5 Passed: Indic Vernacular Ontology translates regional metaphors directly to ICD-10 / SNOMED-CT (Telugu, Hindi, Bengali, Marathi).');

// 5. ABDM FHIR R4 JSON Serialization Format
const mockPatient = {
  id: 'DEMO-P001',
  name: 'Lakshmi Amma',
  gender: 'female',
  abhaId: 'DEMO-PATIENT-001',
  dob: '1968-04-12'
};

const mockDoctor = {
  nmcRegNo: 'DEMO-CLINICIAN-001',
  name: 'Dr. Priya Sharma, MD',
  hprId: 'demo-clinician@example.invalid',
  qualification: 'MBBS, MD'
};

const mockDiagnosis = {
  icd10: 'DRAFT-CODE',
  name: 'Draft coding candidate only'
};

const mockMeds = ['Clinician-entered sample item A', 'Clinician-entered sample item B'];

const fhirBundle = generateAbdmFhirR4Bundle(mockPatient, mockDoctor, mockDiagnosis, mockMeds);

assert.strictEqual(fhirBundle.resourceType, 'Bundle', 'FHIR root resourceType must be Bundle');
assert.strictEqual(fhirBundle.type, 'document', 'FHIR bundle type must be document');
const resourceTypes = fhirBundle.entry.map(e => e.resource.resourceType);
assert.ok(resourceTypes.includes('Patient'), 'Bundle must contain Patient resource');
assert.ok(resourceTypes.includes('Practitioner'), 'Bundle must contain Practitioner resource');
assert.ok(resourceTypes.includes('Condition'), 'Bundle must contain Condition resource');
assert.ok(resourceTypes.includes('MedicationRequest'), 'Bundle must contain MedicationRequest resource');
console.log('✓ Test 6 Passed: FHIR R4 JSON bundle shape smoke test (Bundle, Patient, Practitioner, Condition, MedicationRequest).');

// 6. Diagnostic Reports Database Integrity
assert.ok(Array.isArray(DIAGNOSTIC_REPORTS_DATABASE) && DIAGNOSTIC_REPORTS_DATABASE.length >= 4, 'Must have at least 4 diagnostic report modalities');
const modalities = DIAGNOSTIC_REPORTS_DATABASE.map(r => r.category);
assert.ok(modalities.includes('Chest Imaging') || modalities.includes('Hematology') || modalities.includes('Pulmonology'), 'Must include clinical diagnostic modalities');
for (const rep of DIAGNOSTIC_REPORTS_DATABASE) {
  assert.ok(rep.id, 'Report must have an id');
  assert.ok(rep.title, 'Report must have a title');
  assert.ok(rep.findings, 'Report must have clinical findings');
}
console.log('✓ Test 7 Passed: Diagnostic reports registry contains structured findings across multiple clinical modalities.');

console.log('======================================================================');
console.log('ALL 7 CLINICAL WORKFLOW & SAFETY INTEGRATION TESTS PASSED! 🎉');
console.log('======================================================================\n');
