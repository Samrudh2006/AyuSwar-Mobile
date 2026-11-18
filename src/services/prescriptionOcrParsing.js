// Shared scanner parsing helpers kept separate for deterministic regression tests.
// Comprehensive Indian Clinical Formulary Database for Real-Time OCR Matching
export const CLINICAL_FORMULARY_DATABASE = [
  {
    id: 'pantoprazole',
    keywords: ['pantocid', 'pantoprazole', 'panto', 'pantodac', 'pan-40', 'pan 40', 'pan-d'],
    brand: 'Pantocid-40 / Pan-40 (Gastro-Resistant)',
    genericSalt: 'Pantoprazole Gastro-resistant 40mg IP',
    nfiCode: 'NFI-2025-GAS-0492',
    dosageForm: 'Enteric-Coated Tablet',
    imageUrl: '/images/medicines/yellow_pantoprazole.jpg',
    janAushadhiGeneric: 'Pantoprazole 40mg (PMBJP)',
    brandedPrice: '₹148.50 per strip',
    janAushadhiPrice: '₹22.40 per strip',
    savingsPct: '85%',
    vernacularTe: 'పసుపు రంగు క్యాప్సూల్ — ఉదయం పరగడుపున గ్యాస్ మరియు ఎసిడిటీ నివారణకు',
    ddiConflict: null
  },
  {
    id: 'metformin',
    keywords: ['glycomet', 'metformin', 'glyciphage', 'glucophage', '500 sr', 'metfor'],
    brand: 'Glycomet-500 SR',
    genericSalt: 'Metformin Hydrochloride Prolonged Release 500mg IP',
    nfiCode: 'NFI-2025-MET-0814',
    dosageForm: 'Sustained-Release Tablet',
    imageUrl: '/images/medicines/pink_metformin.jpg',
    janAushadhiGeneric: 'Metformin 500mg SR (PMBJP)',
    brandedPrice: '₹62.00 per strip',
    janAushadhiPrice: '₹14.50 per strip',
    savingsPct: '76%',
    vernacularTe: 'గులాబీ రంగు మాత్ర — రాత్రి భోజనం తర్వాత డయాబెటిస్/షుగర్ నియంత్రణకు',
    ddiConflict: null
  },
  {
    id: 'paracetamol_ibuprofen',
    keywords: ['combiflam', 'ibuprofen', 'brufen', 'paracetamol', 'crocin', 'dolo', 'calpol', 'pcm', '650'],
    brand: 'Combiflam / Paracetamol IP 650mg',
    genericSalt: 'Ibuprofen 400mg + Paracetamol 325mg (or Paracetamol 650mg IP)',
    nfiCode: 'NFI-2025-ANA-0102',
    dosageForm: 'Oral Film-Coated Tablet',
    imageUrl: '/images/medicines/white_paracetamol.jpg',
    janAushadhiGeneric: 'Ibuprofen + Paracetamol (PMBJP)',
    brandedPrice: '₹54.00 per strip',
    janAushadhiPrice: '₹18.00 per strip',
    savingsPct: '66%',
    vernacularTe: 'తెలుపు రంగు మాత్ర — జ్వరం మరియు ఒంటి నొప్పులకు (భోజనం తర్వాత వేసుకోవాలి)',
    ddiConflict: 'CRITICAL SAFETY ALERT: If patient has history of gastric ulcers or is on anti-platelet therapy (Aspirin/Ecosprin), check competitive COX-1 GI bleeding risk.'
  },
  {
    id: 'amoxicillin_clav',
    keywords: ['amoxicillin', 'augmentin', 'mox', 'clav', 'amoxyclav', 'amox', '625'],
    brand: 'Augmentin 625 Duo / Amoxicillin 500mg',
    genericSalt: 'Amoxicillin 500mg + Potassium Clavulanate 125mg IP',
    nfiCode: 'NFI-2025-ANT-0284',
    dosageForm: 'Film-Coated Tablet',
    imageUrl: '/images/medicines/silver_amoxicillin_blister.jpg',
    janAushadhiGeneric: 'Amoxicillin + Clavulanic Acid (PMBJP)',
    brandedPrice: '₹198.00 per strip',
    janAushadhiPrice: '₹48.00 per strip',
    savingsPct: '75%',
    vernacularTe: 'సిల్వర్ బ్లిస్టర్ మాత్ర — బ్యాక్టీరియల్ ఇన్ఫెక్షన్ నివారణకు పూర్తి కోర్సు వాడాలి',
    ddiConflict: 'Verify prior history of penicillin/beta-lactam allergy before dispensing.'
  },
  {
    id: 'amlodipine_telmisartan',
    keywords: ['amlodipine', 'amlo', 'telma', 'telmisartan', 'amlopres', 'telvas', '5mg', '40mg'],
    brand: 'Amlodipine 5mg / Telma-40 (Antihypertensive)',
    genericSalt: 'Amlodipine Besylate 5mg (or Telmisartan 40mg IP)',
    nfiCode: 'NFI-2025-CVS-0145',
    dosageForm: 'Uncoated Tablet',
    imageUrl: '/images/medicines/blue_amlodipine.jpg',
    janAushadhiGeneric: 'Amlodipine 5mg / Telmisartan 40mg (PMBJP)',
    brandedPrice: '₹84.00 per strip',
    janAushadhiPrice: '₹11.20 per strip',
    savingsPct: '86%',
    vernacularTe: 'నీలం రంగు స్ట్రిప్ మాత్ర — రక్తపోటు (బీపీ) నియంత్రణకు ఉదయం వేళ',
    ddiConflict: 'Monitor blood pressure regularly for orthostatic hypotension.'
  },
  {
    id: 'atorvastatin',
    keywords: ['atorva', 'atorvastatin', 'lipitor', 'statin', 'cholesterol', '10mg', '20mg'],
    brand: 'Atorva-20 / Lipitor (Lipid-Lowering)',
    genericSalt: 'Atorvastatin Calcium 20mg IP',
    nfiCode: 'NFI-2025-CVS-0892',
    dosageForm: 'Film-Coated Tablet',
    imageUrl: '/images/medicines/orange_atorvastatin.jpg',
    janAushadhiGeneric: 'Atorvastatin 20mg (PMBJP)',
    brandedPrice: '₹165.00 per strip',
    janAushadhiPrice: '₹28.50 per strip',
    savingsPct: '82%',
    vernacularTe: 'నారింజ రంగు మాత్ర — కొలెస్ట్రాల్ మరియు గుండె రక్తనాళాల రక్షణకు రాత్రి వేళ',
    ddiConflict: 'Do not co-administer with high-dose macrolides or fibrates without monitoring AST/ALT.'
  },
  {
    id: 'azithromycin',
    keywords: ['azithromycin', 'azee', 'zithromax', 'azimax', 'azithro', '500'],
    brand: 'Azee-500 (Macrolide Antibiotic)',
    genericSalt: 'Azithromycin Dihydrate 500mg IP',
    nfiCode: 'NFI-2025-ANT-0312',
    dosageForm: 'Tablet',
    imageUrl: '/images/medicines/silver_amoxicillin_blister.jpg',
    janAushadhiGeneric: 'Azithromycin 500mg (PMBJP)',
    brandedPrice: '₹132.00 per strip',
    janAushadhiPrice: '₹34.00 per strip',
    savingsPct: '74%',
    ddiConflict: 'Monitor cardiac QT interval if co-administered with antiarrhythmics or macrolides.'
  },
  {
    id: 'montelukast_levo',
    keywords: ['montair', 'montelukast', 'levocetirizine', 'telekast', 'montek', 'lc'],
    brand: 'Montair-LC (Antihistamine / Leukotriene Inhibitor)',
    genericSalt: 'Montelukast Sodium 10mg + Levocetirizine 5mg IP',
    nfiCode: 'NFI-2025-RES-0542',
    dosageForm: 'Chewable / Film Tablet',
    imageUrl: '/images/medicines/white_paracetamol.jpg',
    janAushadhiGeneric: 'Montelukast + Levocetirizine (PMBJP)',
    brandedPrice: '₹185.00 per strip',
    janAushadhiPrice: '₹38.50 per strip',
    savingsPct: '79%',
    ddiConflict: null
  },
  {
    id: 'zerodol_p',
    keywords: ['zerodol', 'aceclofenac', 'hifenac', 'zerodol-p'],
    brand: 'Zerodol-P (NSAID + Paracetamol)',
    genericSalt: 'Aceclofenac 100mg + Paracetamol 325mg IP',
    nfiCode: 'NFI-2025-ANA-0329',
    dosageForm: 'Film-Coated Tablet',
    imageUrl: '/images/medicines/white_paracetamol.jpg',
    janAushadhiGeneric: 'Aceclofenac + Paracetamol (PMBJP)',
    brandedPrice: '₹88.00 per strip',
    janAushadhiPrice: '₹22.00 per strip',
    savingsPct: '75%',
    ddiConflict: 'Do not use in active renal impairment or severe congestive heart failure.'
  },
  {
    id: 'omeprazole',
    keywords: ['omeprazole', 'omez', 'omecid', 'ocid', '20mg'],
    brand: 'Omez-20 (Proton Pump Inhibitor)',
    genericSalt: 'Omeprazole 20mg IP',
    nfiCode: 'NFI-2025-GAS-0310',
    dosageForm: 'Hard Gelatin Capsule',
    imageUrl: '/images/medicines/yellow_pantoprazole.jpg',
    janAushadhiGeneric: 'Omeprazole 20mg (PMBJP)',
    brandedPrice: '₹68.00 per strip',
    janAushadhiPrice: '₹12.00 per strip',
    savingsPct: '82%',
    ddiConflict: null
  }
];


export function extractBatchAndExpiry(rawText) {
  let batch = null;
  let expiry = null;

  const batchMatch = rawText.match(/(?:B\.?\s*No\.?|Batch(?:\s*No)?|BNo)[:\s]*([A-Z0-9/-]+)/i);
  if (batchMatch) batch = batchMatch[1].trim();

  const expMatch = rawText.match(/(?:EXP\.?|Expiry|Exp\s*Date)[:\s]*([0-9]{1,2}[/-][0-9]{2,4}|[A-Za-z]{3}[/-\s]*[0-9]{2,4})/i);
  if (expMatch) expiry = expMatch[1].trim();

  return { batch, expiry };
}

// High-Dimensional Character N-Gram & Cosine Vector Similarity Engine (Local RAG)
function computeCharacterNgramVector(str, n = 3) {
  const clean = (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const ngrams = {};
  for (let i = 0; i <= clean.length - n; i++) {
    const gram = clean.substring(i, i + n);
    ngrams[gram] = (ngrams[gram] || 0) + 1;
  }
  return ngrams;
}

function computeCosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const k in vecA) {
    normA += vecA[k] * vecA[k];
    if (vecB[k]) dotProduct += vecA[k] * vecB[k];
  }
  for (const k in vecB) {
    normB += vecB[k] * vecB[k];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function matchDrugFromOcrText(rawText) {
  const lower = String(rawText || '').toLowerCase();
  // No fuzzy drug substitution. A partial keyword is not an exact medicine identity.
  const candidates = CLINICAL_FORMULARY_DATABASE.filter(item => {
    const name = item.genericSalt.split(/\s+(?:gastro|hydrochloride|ip|bp|[0-9])/i)[0].toLowerCase();
    const strength = item.genericSalt.match(/\b(\d+(?:\.\d+)?)\s*mg/i)?.[1];
    if (!strength || !new RegExp(`\\b${strength}\\s*mg\\b`, 'i').test(lower)) return false;
    if (item.id === 'paracetamol_ibuprofen') return false; // Conflated old entry disabled until split and verified.
    return name.length >= 5 && lower.includes(name) && (lower.includes('tablet') || lower.includes('capsule'));
  });
  return candidates.length === 1 ? { ...candidates[0], matchType: 'Candidate: verify name, strength and formulation', vectorConfidence: null } : null;
}

