/**
 * AyuSwar AI — bundled sample retrieval corpus.
 * These entries provide prototype navigation only. They are not live facility,
 * registry, formulary, emergency, or clinical guidance.
 */
export const CLINICAL_RAG_CORPUS = [
  {
    id: 'sample_navigation',
    category: 'Sample navigation',
    topics: ['opd_timings', 'doctor_schedule', 'clinic_hours', 'token_booking', 'appointment', 'queue'],
    keywords: ['timing', 'timings', 'time', 'open', 'hours', 'schedule', 'doctor', 'opd', 'clinic', 'hospital', 'token', 'appointment', 'queue', 'సమయం', 'డాక్టర్', 'समय', 'डॉक्टर'],
    questions: ['What are the clinic timings?', 'How do appointments work?'],
    answerEn: 'This is a synthetic demo. It has no live facility schedule, token desk, SMS, or queue integration. Use the on-screen demo appointment flow for prototype testing, and verify real timings with the actual facility.',
    shortAnswerEn: 'Synthetic demo only; no live schedule or queue integration.',
    answerTe: 'ఇది నమూనా డెమో మాత్రమే. ప్రత్యక్ష హాస్పిటల్ వేళలు, టోకెన్ డెస్క్, SMS లేదా క్యూ అనుసంధానం లేదు. అసలు వివరాలను సంబంధిత ఆసుపత్రితో ధృవీకరించండి.',
    answerHi: 'यह केवल सिंथेटिक डेमो है। इसमें लाइव अस्पताल समय, टोकन डेस्क, SMS या कतार एकीकरण नहीं है। वास्तविक जानकारी संबंधित अस्पताल से सत्यापित करें।'
  },
  {
    id: 'sample_records',
    category: 'Sample records',
    topics: ['abha', 'health_records', 'fhir', 'locker'],
    keywords: ['abha', 'health id', 'record', 'records', 'locker', 'fhir', 'abdm', 'రికార్డ్', 'रिकॉर्ड'],
    questions: ['How do health records work?', 'Can this sync a health locker?'],
    answerEn: 'The app shows synthetic sample IDs and can export a local FHIR-shaped research draft. It is not connected to any registry, locker, or official health record service.',
    shortAnswerEn: 'Synthetic sample IDs and local research-draft export only.',
    answerTe: 'యాప్ నమూనా ఐడీలను చూపిస్తుంది మరియు స్థానిక FHIR-ఆకారపు పరిశోధన డ్రాఫ్ట్‌ను ఎగుమతి చేయగలదు. ఇది ఏ రిజిస్ట్రీ, లాకర్ లేదా అధికారిక హెల్త్ రికార్డ్ సేవకు కనెక్ట్ కాలేదు.',
    answerHi: 'ऐप सिंथेटिक नमूना आईडी दिखाता है और स्थानीय FHIR-आकार का शोध मसौदा निर्यात कर सकता है। यह किसी रजिस्ट्री, लॉकर या आधिकारिक स्वास्थ्य रिकॉर्ड सेवा से जुड़ा नहीं है।'
  },
  {
    id: 'sample_audio_rx',
    category: 'Sample audio preview',
    topics: ['audio_rx', 'spoken_note', 'voice_note', 'share_preview'],
    keywords: ['audio rx', 'voice note', 'spoken', 'audio', 'whatsapp', 'ఆడియో', 'वॉयस'],
    questions: ['How does the audio note work?', 'Can it send WhatsApp?'],
    answerEn: 'The prototype can prepare and play a clinician-reviewed sample voice-note draft locally. It does not send WhatsApp messages, place calls, schedule reminders, or provide medicine instructions.',
    shortAnswerEn: 'Local sample voice-note preview only; no send or medical instruction.',
    answerTe: 'ప్రోటోటైప్ వైద్యుడు సమీక్షించిన నమూనా వాయిస్ నోట్ డ్రాఫ్ట్‌ను స్థానికంగా తయారు చేసి ప్లే చేయగలదు. ఇది WhatsApp పంపదు, కాల్ చేయదు, రిమైండర్ షెడ్యూల్ చేయదు లేదా మందుల సూచన ఇవ్వదు.',
    answerHi: 'प्रोटोटाइप चिकित्सक-समीक्षित नमूना वॉयस नोट मसौदा स्थानीय रूप से तैयार और चला सकता है। यह WhatsApp नहीं भेजता, कॉल नहीं करता, रिमाइंडर नहीं बनाता और दवा निर्देश नहीं देता।'
  },
  {
    id: 'sample_safety',
    category: 'Sample safety boundary',
    topics: ['medication_safety', 'interaction', 'diagnosis', 'emergency'],
    keywords: ['medicine', 'drug', 'interaction', 'safe', 'diagnosis', 'emergency', 'మందులు', 'दवा'],
    questions: ['Is this medicine safe?', 'Can the app diagnose or advise treatment?'],
    answerEn: 'No. The prototype does not diagnose, clear medicines, calculate doses, check live interactions, or provide treatment advice. Verify medicines and symptoms with a pharmacist or qualified clinician. In an emergency, call 112 or 108.',
    shortAnswerEn: 'No diagnosis, treatment, dose, or safety clearance. Emergency: 112/108.',
    answerTe: 'లేదు. ఈ ప్రోటోటైప్ వ్యాధిని నిర్ధారించదు, మందులకు అనుమతి ఇవ్వదు, మోతాదు లెక్కించదు, ప్రత్యక్ష ఇంటరాక్షన్ తనిఖీ చేయదు లేదా చికిత్స సలహా ఇవ్వదు. అత్యవసర పరిస్థితిలో 112 లేదా 108 కు కాల్ చేయండి.',
    answerHi: 'नहीं। यह प्रोटोटाइप निदान, दवा क्लीयरेंस, खुराक, लाइव इंटरैक्शन जांच या उपचार सलाह नहीं देता। आपात स्थिति में 112 या 108 पर कॉल करें।'
  }
];

export function retrieveGroundedClinicalKnowledge(queryText = '', role = 'patient', options = { concise: true }) {
  if (!queryText || typeof queryText !== 'string') return null;

  const normalized = queryText.toLowerCase().trim();
  const isTelugu = /[\u0C00-\u0C7F]/.test(queryText);
  const isHindi = /[\u0900-\u097F]/.test(queryText);
  const preferredLang = isTelugu ? 'te' : (isHindi ? 'hi' : 'en');
  const effectiveRole = role === 'doctor' ? 'doctor' : (role === 'patient' ? 'patient' : 'landing');
  const useConcise = options?.concise !== false;

  let bestEntry = null;
  let highestScore = -999;

  for (const entry of CLINICAL_RAG_CORPUS) {
    let score = 0;
    const targetRole = entry.targetRole || 'all';

    // 1. Contextual Role Affinity Weighting
    if (targetRole === effectiveRole) {
      score += 14; // Massive boost for matching portal role!
    } else if (targetRole === 'all') {
      score += 4;
    } else {
      score -= 10; // Deprioritize opposite role
    }

    // 2. Check exact topic match
    for (const topic of entry.topics) {
      if (normalized.includes(topic.replace(/_/g, ' '))) {
        score += 8;
      }
    }

    // 3. Check keyword matches
    for (const kw of entry.keywords) {
      const cleanKw = kw.toLowerCase();
      if (normalized.includes(cleanKw)) {
        score += (cleanKw.length > 5 ? 5 : 3);
      }
    }

    // 4. Check category match
    if (normalized.includes(entry.category.toLowerCase())) {
      score += 4;
    }

    if (score > highestScore) {
      highestScore = score;
      bestEntry = entry;
    }
  }

  // Minimum threshold for confident retrieval match
  if (bestEntry && highestScore >= 6) {
    let fullAnswer = bestEntry.answerEn;
    let shortAnswer = bestEntry.shortAnswerEn;
    if (preferredLang === 'te') {
      fullAnswer = bestEntry.answerTe;
      shortAnswer = bestEntry.shortAnswerTe;
    } else if (preferredLang === 'hi') {
      fullAnswer = bestEntry.answerHi;
      shortAnswer = bestEntry.shortAnswerHi;
    }

    // If shortAnswer is not explicitly defined on this entry, extract first 1-2 punchy sentences
    if (!shortAnswer && fullAnswer) {
      const lines = fullAnswer.split('\n').filter(l => l.trim().length > 0);
      const header = lines[0] || '';
      const firstBullet = lines.find(l => l.includes('•') || l.includes('1.')) || lines[1] || '';
      shortAnswer = (header + ' ' + firstBullet.replace(/^[•\d\.\s*]+/, '')).trim();
    }

    const formattedAnswer = (useConcise && shortAnswer) ? shortAnswer : fullAnswer;

    return {
      matchFound: true,
      entryId: bestEntry.id,
      category: bestEntry.category,
      targetRole: bestEntry.targetRole || 'all',
      confidenceScore: highestScore,
      language: preferredLang,
      answer: formattedAnswer,
      fullAnswer,
      shortAnswer: shortAnswer || formattedAnswer,
      groundedSource: 'AyuSwar bundled sample corpus (not verified clinical guidance)'
    };
  }

  return null;
}


