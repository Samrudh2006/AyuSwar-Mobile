/**
 * Synthetic consultation fixtures for UI testing.
 * They contain no patient record, diagnosis, treatment, dose, medicine instruction,
 * registry identifier, clinical-code assignment, or interaction clearance.
 */
const safeEncounter = ({
  id,
  title,
  language,
  langCode,
  patientName,
  age,
  gender,
  patientLine,
  followUpLine,
  colloquial,
  clinicalTerm
}, index) => ({
  id,
  title,
  language,
  langCode,
  diagnosis: 'Documentation draft (no diagnosis generated)',
  patient: {
    name: patientName,
    age,
    gender,
    abhaId: `DEMO-PATIENT-${index + 1}`,
    location: 'Synthetic Demo Facility',
    abhaAddress: `demo-patient-${index + 1}@example.invalid`,
    hprId: 'DEMO-CLINICIAN-2026',
    doctorName: 'Demo Clinician',
    hfrId: 'DEMO-FACILITY-2026',
    facilityName: 'Synthetic Demo Facility',
    icd10: 'DRAFT-CODE',
    icd10Desc: 'Draft coding candidate only',
    snomedCt: 'DRAFT-CODE',
    snomedDesc: 'Draft coding candidate only',
    phone: `+91 00000 0000${index + 1}`
  },
  audioDuration: '18s',
  dialogue: [
    { speaker: 'Patient', text: patientLine, time: '0:02' },
    { speaker: 'Doctor', text: 'This demo records and reviews documentation only. No diagnosis, medicine, dose, treatment, or discharge instruction is generated.', time: '0:08' },
    { speaker: 'Patient', text: followUpLine, time: '0:14' },
    { speaker: 'Doctor', text: 'A qualified clinician must review the actual conversation before any care decision.', time: '0:17' }
  ],
  acousticBiomarkers: {
    respiratoryEffort: 'Sample visualization only',
    coughType: 'No clinical interpretation',
    vocalTremor: 'Sample visualization only',
    spectralCentroid: 'Sample value',
    jitterPercent: 'Sample value',
    shimmerDb: 'Sample value',
    riskCategory: 'No risk score generated'
  },
  vernacularMappings: [
    {
      dialect: colloquial,
      clinicalTerm,
      icd10: 'DRAFT-CODE',
      snomed: 'DRAFT-CODE'
    }
  ],
  vitals: {
    bp: 'Not recorded',
    heartRate: 'Not recorded',
    spo2: 'Not recorded',
    temp: 'Not recorded',
    bloodSugar: 'Not recorded'
  },
  medications: [],
  fullAudioRxTelugu: 'This is a sample voice note only. It contains no medicine instruction. Follow only instructions reviewed by a qualified clinician.',
  karaokeWordsTelugu: [],
  drugInteractionNotice: 'No interaction clearance is generated. Verify all medicines with a pharmacist or qualified clinician.'
});

export const CLINICAL_ENCOUNTERS = [
  {
    id: 'telugu_documentation',
    title: 'Synthetic Telugu Documentation Demo',
    language: 'Telugu',
    langCode: 'te-IN',
    patientName: 'Demo Participant 1',
    age: 42,
    gender: 'Not specified',
    patientLine: 'డాక్టర్ గారు, నేను నా లక్షణాల గురించి వివరించాలనుకుంటున్నాను.',
    followUpLine: 'దయచేసి ఇది నమూనా రికార్డింగ్ అని గుర్తుంచుకోండి.',
    colloquial: 'నమూనా స్థానిక పదం',
    clinicalTerm: 'Sample term for clinician review'
  },
  {
    id: 'hindi_documentation',
    title: 'Synthetic Hindi Documentation Demo',
    language: 'Hindi',
    langCode: 'hi-IN',
    patientName: 'Demo Participant 2',
    age: 35,
    gender: 'Not specified',
    patientLine: 'डॉक्टर साहब, मैं अपनी समस्या के बारे में बताना चाहता हूँ।',
    followUpLine: 'कृपया इसे केवल नमूना रिकॉर्डिंग समझें।',
    colloquial: 'नमूना स्थानीय शब्द',
    clinicalTerm: 'Sample term for clinician review'
  },
  {
    id: 'tamil_documentation',
    title: 'Synthetic Tamil Documentation Demo',
    language: 'Tamil',
    langCode: 'ta-IN',
    patientName: 'Demo Participant 3',
    age: 29,
    gender: 'Not specified',
    patientLine: 'மருத்துவரே, எனது அறிகுறிகளைப் பற்றி விளக்க விரும்புகிறேன்.',
    followUpLine: 'இது வெறும் மாதிரி பதிவு என்பதை நினைவில் கொள்ளவும்.',
    colloquial: 'மாதிரி உள்ளூர் சொல்',
    clinicalTerm: 'Sample term for clinician review'
  },
  {
    id: 'kannada_documentation',
    title: 'Synthetic Kannada Documentation Demo',
    language: 'Kannada',
    langCode: 'kn-IN',
    patientName: 'Demo Participant 4',
    age: 51,
    gender: 'Not specified',
    patientLine: 'ಡಾಕ್ಟರ್, ನನ್ನ ರೋಗಲಕ್ಷಣಗಳ ಬಗ್ಗೆ ವಿವರಿಸಲು ಬಯಸುತ್ತೇನೆ.',
    followUpLine: 'ಇದು ಕೇವಲ ಮಾದರಿ ದಾಖಲೆ ಎಂದು ನೆನಪಿಡಿ.',
    colloquial: 'ಮಾದರಿ ಸ್ಥಳೀಯ ಪದ',
    clinicalTerm: 'Sample term for clinician review'
  },
  {
    id: 'marathi_documentation',
    title: 'Synthetic Marathi Documentation Demo',
    language: 'Marathi',
    langCode: 'mr-IN',
    patientName: 'Demo Participant 5',
    age: 47,
    gender: 'Not specified',
    patientLine: 'डॉक्टर, मला माझ्या तक्रारींबद्दल सांगायचे आहे.',
    followUpLine: 'हे फक्त नमुना रेकॉर्डिंग आहे हे लक्षात ठेवा.',
    colloquial: 'नमुना स्थानिक शब्द',
    clinicalTerm: 'Sample term for clinician review'
  },
  {
    id: 'bengali_documentation',
    title: 'Synthetic Bengali Documentation Demo',
    language: 'Bengali',
    langCode: 'bn-IN',
    patientName: 'Demo Participant 6',
    age: 38,
    gender: 'Not specified',
    patientLine: 'ডাক্তার বাবু, আমি আমার সমস্যাটা ব্যাখ্যা করতে চাই।',
    followUpLine: 'দয়া করে মনে রাখবেন এটি শুধুমাত্র একটি নমুনা রেকর্ডিং।',
    colloquial: 'নমুনা স্থানীয় শব্দ',
    clinicalTerm: 'Sample term for clinician review'
  }
].map(safeEncounter);
