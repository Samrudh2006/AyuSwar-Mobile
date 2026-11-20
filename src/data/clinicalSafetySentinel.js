/**
 * AyuSwar AI — bundled sample interaction reminders and FHIR-shaped research draft helpers.
 *
 * This is not a validated clinical safety database, guideline implementation,
 * ABDM validator, formulary source, or digital-signature service.
 */

import { lookupPmbjpDrug, PMBJP_FORMULARY_DATABASE } from './pmbjpFormulary.js';

export const DRUG_INTERACTION_DATABASE = [
  {
    drugPair: ['Atorvastatin', 'Clarithromycin'],
    severity: 'High',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'CYP3A4 inhibition increases statin serum concentration',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Metformin', 'Contrast Media / Alcohol'],
    severity: 'High',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'Renal clearance impairment leads to toxic metformin accumulation',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Aspirin', 'Ibuprofen'],
    severity: 'Moderate',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'Competitive COX-1 binding and additive GI mucosal toxicity',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Budesonide', 'Ketoconazole'],
    severity: 'Moderate',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'CYP3A4 inhibition increases systemic steroid exposure',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Telmisartan', 'Spironolactone'],
    severity: 'High',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'Dual RAAS blockade causes excessive potassium retention',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Clopidogrel', 'Omeprazole'],
    severity: 'High',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'CYP2C19 competitive inhibition prevents conversion of Clopidogrel to active metabolite',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Warfarin', 'Ciprofloxacin'],
    severity: 'Critical',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'CYP1A2 and CYP3A4 inhibition elevates free Warfarin levels',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Digoxin', 'Amiodarone'],
    severity: 'High',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'P-glycoprotein efflux pump inhibition doubles serum Digoxin concentration',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Enalapril', 'Telmisartan'],
    severity: 'High',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'Dual RAAS blockade without additive clinical benefit, marked increase in renal injury',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Amlodipine', 'Simvastatin'],
    severity: 'Moderate',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'CYP3A4 competitive metabolism increases statin bioavailability',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Fluconazole', 'Glimepiride'],
    severity: 'High',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'CYP2C9 inhibition decreases sulfonylurea hepatic clearance',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Ciprofloxacin', 'Theophylline'],
    severity: 'High',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'Hepatic CYP1A2 inhibition reduces Theophylline clearance by up to 50%',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Sildenafil', 'Nitroglycerin / Sorbitrate'],
    severity: 'Critical',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'Synergistic cGMP pathway vasodilation causing irreversible circulatory collapse',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Levothyroxine', 'Calcium / Iron'],
    severity: 'Moderate',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'Insoluble chelation complexes in the stomach prevent Levothyroxine absorption',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Salbutamol', 'Propranolol'],
    severity: 'High',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'Non-cardioselective beta-antagonism completely blocks beta-2 bronchodilation',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Azithromycin', 'Ondansetron'],
    severity: 'Moderate',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'Additive cardiac cardiac potassium channel blockade (hERG), prolonged QTc',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Paracetamol', 'Alcohol'],
    severity: 'Moderate',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'CYP2E1 induction increases toxic NAPQI metabolite while depleting hepatic glutathione',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  },
  {
    drugPair: ['Methotrexate', 'Aceclofenac / NSAIDs'],
    severity: 'High',
    alertTelugu: 'నమూనా హెచ్చరిక మాత్రమే. మందులు, అలర్జీలు మరియు మోతాదును ఫార్మసిస్ట్ లేదా అర్హత కలిగిన వైద్యుడితో ధృవీకరించండి.',
    alertHindi: 'केवल नमूना चेतावनी। दवाएं, एलर्जी और खुराक फार्मासिस्ट या योग्य चिकित्सक से सत्यापित करें।',
    mechanism: 'Decreased renal tubular clearance of Methotrexate leading to fatal myelosuppression',
    recommendation: 'Sample reminder only. Verify medicines, allergies, kidney/liver status, pregnancy status and dosing with a pharmacist or qualified clinician; no dose adjustment is generated.'
  }
];

/**
 * Checks a list against bundled sample interaction-reminder patterns. It does not prove safety or clearance.
 */
export function checkDrugInteractions(medicationList = []) {
  const alerts = [];
  const medNames = (medicationList || []).map(m => (typeof m === 'string' ? m : (m.brand || m.name || m.medicine || '')).toLowerCase());

  DRUG_INTERACTION_DATABASE.forEach(interaction => {
    const d1 = interaction.drugPair[0].toLowerCase();
    const d2 = interaction.drugPair[1].toLowerCase();

    const hasD1 = medNames.some(name => name.includes(d1) || d1.includes(name.split(' ')[0]));
    const hasD2 = medNames.some(name => name.includes(d2) || d2.includes(name.split(' ')[0]));

    if (hasD1 && hasD2) {
      alerts.push(interaction);
    }
  });

  return alerts;
}

/**
 * Calculates Modified Early Warning Score (MEWS) from physiological parameters.
 * Bundled sample scoring display only; not a validated clinical assessment.
 */
export function calculateMewsScore({ bpSystolic = 120, hr = 76, spo2 = 98, respRate = 16 } = {}) {
  let score = 0;
  
  // Systolic BP
  if (bpSystolic <= 70) score += 3;
  else if (bpSystolic <= 80 || bpSystolic >= 200) score += 2;
  else if (bpSystolic <= 100) score += 1;
  
  // Heart Rate
  if (hr <= 40 || hr >= 130) score += 3;
  else if (hr >= 111) score += 2;
  else if (hr <= 50 || hr >= 101) score += 1;
  
  // SpO2
  if (spo2 < 92) score += 3;
  else if (spo2 <= 93) score += 2;
  else if (spo2 <= 95) score += 1;
  
  // Respiratory Rate
  if (respRate < 9 || respRate >= 30) score += 3;
  else if (respRate >= 21) score += 2;
  else if (respRate <= 14 && respRate >= 9) score += 0;

  let riskLevel = 'Sample low-score display';
  let riskColor = '#047857';
  let riskBg = '#DCFCE7';

  if (score >= 5) {
    riskLevel = 'Sample high-score display';
    riskColor = '#DC2626';
    riskBg = '#FEE2E2';
  } else if (score >= 3) {
    riskLevel = 'Sample middle-score display';
    riskColor = '#B45309';
    riskBg = '#FEF3C7';
  }

  return { score, riskLevel, riskColor, riskBg };
}

/**
 * Calculates quick Sepsis-related Organ Failure Assessment (qSOFA) score.
 */
export function calculateQsofaScore({ respRate = 16, bpSystolic = 120, alteredMentation = false } = {}) {
  let score = 0;
  if (respRate >= 22) score += 1;
  if (bpSystolic <= 100) score += 1;
  if (alteredMentation) score += 1;

  return {
    score,
    isHighRisk: score >= 2,
    recommendation: 'Sample score only. No sepsis risk, treatment, investigation or disposition recommendation is generated.'
  };
}

/**
 * Maps a prescribed medicine name to a bundled sample generic reference, or
 * null. An association is returned only for an exact curated
 * ingredient+strength+form match (see lookupPmbjpDrug); a single-ingredient
 * medicine never maps to a combination product and nothing is invented.
 * No live authenticity, price, stock, eligibility, formulary status, or
 * substitution advice.
 */
export function getJanAushadhiGenericInfo(medName = '') {
  const info = lookupPmbjpDrug(medName);
  if (!info) return null;
  return {
    genericName: info.genericName,
    janAushadhiBrand: `${info.janAushadhiBrand} (bundled sample)`,
    brandedMrp: info.brandedMrp,
    janAushadhiPrice: info.janAushadhiPrice,
    savingsPercent: info.savingsPercent,
    nlemCompliant: false,
    nlemCeiling: 'Bundled sample reference; not live-checked',
    kendraCode: info.kendraCode,
    indications: 'Bundled sample reference; verify with a pharmacist or clinician',
    unit: info.unit,
    isBundledSample: true,
    verificationStatus: 'not live-checked'
  };
}

/**
 * Computes a local SHA-256 sample digest for prototype displays. Not a digital signature.
 */
export async function computeSha256Digest(data) {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(typeof data === 'string' ? data : JSON.stringify(data));
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {}
  return `local-random-id-${Math.random().toString(16).slice(2)}${Date.now()}`;
}

/**
 * Generates a local FHIR R4-shaped research bundle from synthetic demo data. It is not ABDM validated or registry connected.
 */
export function generateAbdmFhirR4Bundle(patient, doctor, diagnosis, medications) {
  const timestamp = new Date().toISOString();
  const encounterId = `enc-${Date.now()}`;

  return {
    resourceType: 'Bundle',
    id: `ayuswar-demo-bundle-${Date.now()}`,
    meta: {
      versionId: '1',
      lastUpdated: timestamp,
      tag: [{ system: 'urn:ayuswar:prototype', code: 'synthetic-research-draft', display: 'Synthetic research draft - not registry validated' }]
    },
    identifier: {
      system: 'urn:ayuswar:synthetic-record',
      value: `DEMO-REC-${Math.floor(100000 + Math.random() * 900000)}`
    },
    type: 'document',
    timestamp,
    entry: [
      {
        fullUrl: `urn:uuid:patient-${patient.abhaId || 'DEMO-PATIENT-2026'}`,
        resource: {
          resourceType: 'Patient',
          id: patient.abhaId || 'DEMO-PATIENT-2026',
          name: [{ text: patient.name || 'Demo Patient' }],
          gender: (patient.gender || 'male').toLowerCase(),
          birthDate: patient.dob || '1974-06-15',
          identifier: [
            {
              system: 'urn:ayuswar:synthetic-abha',
              value: patient.abhaId || 'DEMO-PATIENT-2026'
            }
          ]
        }
      },
      {
        fullUrl: `urn:uuid:practitioner-${doctor.nmcRegNo || 'DEMO-REVIEWER-2026'}`,
        resource: {
          resourceType: 'Practitioner',
          id: doctor.nmcRegNo || 'DEMO-REVIEWER-2026',
          name: [{ text: doctor.name || 'Demo Clinician' }],
          qualification: [{ code: { text: doctor.qualification || 'MBBS, MD (General Medicine)' } }],
          identifier: [
            {
              system: 'urn:ayuswar:synthetic-clinician',
              value: doctor.hprId || 'demo-clinician@example.invalid'
            }
          ]
        }
      },
      {
        fullUrl: `urn:uuid:${encounterId}`,
        resource: {
          resourceType: 'Encounter',
          id: encounterId,
          status: 'finished',
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'AMB',
            display: 'ambulatory'
          },
          subject: { reference: `urn:uuid:patient-${patient.abhaId || 'DEMO-PATIENT-2026'}` }
        }
      },
      {
        fullUrl: `urn:uuid:condition-${Date.now()}`,
        resource: {
          resourceType: 'Condition',
          clinicalStatus: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }]
          },
          verificationStatus: {
            coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status', code: 'unconfirmed' }]
          },
          code: {
            coding: [
              {
                system: 'http://hl7.org/fhir/sid/icd-10',
                code: diagnosis.icd10 || 'DRAFT-CODE',
                display: diagnosis.name || 'Draft documentation only'
              }
            ],
            text: `Synthetic demo documentation: ${diagnosis.name || 'no diagnosis generated'}`
          },
          subject: { reference: `urn:uuid:patient-${patient.abhaId || 'DEMO-PATIENT-2026'}` }
        }
      },
      ...medications.map((med, index) => {
        const medId = `med-req-${index}-${Date.now()}`;
        const pmbjp = getJanAushadhiGenericInfo(typeof med === 'string' ? med : (med.medicine || med.name || ''));
        return {
          fullUrl: `urn:uuid:${medId}`,
          resource: {
            resourceType: 'MedicationRequest',
            id: medId,
            status: 'draft',
            intent: 'proposal',
            medicationCodeableConcept: {
              coding: [
                {
                  system: 'urn:ayuswar:bundled-sample',
                  code: pmbjp ? (pmbjp.kendraCode || 'BUNDLED-SAMPLE') : 'NO-SAMPLE-MATCH',
                  display: pmbjp ? pmbjp.genericName : (typeof med === 'string' ? med : (med.medicine || med.name || 'Unmatched sample item'))
                }
              ],
              text: typeof med === 'string' ? med : (med.medicine || med.name)
            },
            subject: { reference: `urn:uuid:patient-${patient.abhaId || 'DEMO-PATIENT-2026'}` },
            dosageInstruction: [
              {
                text: typeof med === 'object' && med.dosage ? `Demo only, not a prescription: ${med.dosage}` : 'Demo only, not a prescription: no dose instruction generated',
                timing: { repeat: { frequency: 1, period: 1, periodUnit: 'd' } }
              }
            ]
          }
        };
      })
    ]
  };
}

export function downloadFhirJson(report) {
  const patient = {
    abhaId: report.patientAbha || 'DEMO-PATIENT-2026',
    name: report.patientName || 'Demo Patient',
    gender: 'male',
    dob: '1974-06-15'
  };

  const doctor = {
    nmcRegNo: 'DEMO-REVIEWER-2026',
    name: 'Demo Clinician',
    hprId: 'demo-clinician@example.invalid',
    qualification: 'MBBS, MD'
  };

  const diagnosis = {
    icd10: 'DRAFT-CODE',
    name: report.diagnosis || 'Documentation draft'
  };

  const medications = report.medications || [];
  const bundle = generateAbdmFhirR4Bundle(patient, doctor, diagnosis, medications);

  const jsonString = JSON.stringify(bundle, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', `ayuswar_fhir_research_draft_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
