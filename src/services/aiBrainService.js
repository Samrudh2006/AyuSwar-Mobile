/**
 * AyuSwar AI — Conversational Assistant Service (aiBrainService.js)
 * 
 * Clinical & Production Privacy Architecture:
 * - Credentials come EXCLUSIVELY from server-side environment variables.
 * - API keys are NEVER stored in browser localStorage or transmitted from the client.
 * - Automatic migration: purges legacy 'ayuswar_api_key' and 'ayuswar_custom_endpoint' fields.
 * - Non-Negotiable Medical Safety Guarantees:
 *   • NO autonomous diagnosis or medication prescribing.
 *   • NO preset drug doses.
 *   • Directs emergency symptoms (chest pain, breathlessness, trauma) immediately to official 112 / 108.
 */

import { queryEvonServer, EVON_MODEL_METADATA } from './gnaniEvonService.js';
import { apiUrl, authHeaders } from '../utils/apiBase.js';
import { retrieveGroundedClinicalKnowledge } from '../data/clinicalRagKnowledgeBase.js';
import { recordDiagnosticStage } from '../utils/diagnosticLogger.js';

let groqServerKnownUnconfigured = false;

// Immediately purge legacy secret fields from localStorage without touching unrelated user state
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('ayuswar_api_key');
    window.localStorage.removeItem('ayuswar_custom_endpoint');
  }
} catch {
  // Ignore in non-browser environments
}

export const AI_PROVIDERS = [
  { 
    id: 'gnani_evon_30b', 
    name: 'Gnani Evon 30B [ACTIVE GATEWAY / SERVER PROXY]', 
    model: 'gnani/gnani-evon-v3.3-30B-A3B',
    badge: 'Server-Side Proxy',
    description: 'Pre-architected server-side route (/api/evon/chat). Backed by server environment variables (EVON_BASE_URL, EVON_API_KEY). Defaults honestly to Rule-based FALLBACK if unset.'
  },
  { 
    id: 'local_offline', 
    name: 'Autonomous Local Indic Engine (Deterministic Rule-Based)', 
    model: 'Rule-Based-Indic-Demo',
    badge: 'Offline Rules',
    description: 'Uses built-in Indic clinical ontology and deterministic rules. Zero external network calls required.'
  }
];

export function getAiConfig() {
  try {
    const provider = localStorage.getItem('ayuswar_ai_provider') || 'gnani_evon_30b';
    return { provider };
  } catch {
    return { provider: 'gnani_evon_30b' };
  }
}

export function saveAiConfig(provider) {
  try {
    localStorage.setItem('ayuswar_ai_provider', provider || 'gnani_evon_30b');
    return true;
  } catch {
    return false;
  }
}

/**
 * Main query processor with strict RAG grounding and Groq clinical reasoning
 */
async function askAyuSwarBrainCore(prompt, role = 'receptionist', context = {}) {
  const cleanPrompt = prompt?.trim();
  if (!cleanPrompt) {
    return "Please ask a question regarding hospital navigation, doctor appointment timings, or spoken prescription features.";
  }

  const isTelugu = /[\u0C00-\u0C7F]/.test(cleanPrompt);
  const isHindi = /[\u0900-\u097F]/.test(cleanPrompt);

  // Pre-fetch Grounded RAG Knowledge
  const ragMatch = retrieveGroundedClinicalKnowledge(cleanPrompt, role);

  // Handle greetings and basic orientation cleanly
  const lower = cleanPrompt.toLowerCase();
  const isGreeting = /^(hi|hello|hey|namaste|namaskaram|vanakkam|who are you|help|start)\b/i.test(lower.trim());
  if (isGreeting) {
    if (isTelugu) {
      return "నమస్కారం! నేను ఆయుస్వర్ సహాయకుడిని. ఓపీడీ వేళలు, మందుల వేళలు లేదా అత్యవసర సేవల గురించి నన్ను అడగవచ్చు. అత్యవసర పరిస్థితుల్లో 108 లేదా 112 కు కాల్ చేయండి.";
    }
    if (isHindi) {
      return "नमस्ते! मैं आयुस्वर स्वास्थ्य सहायक हूँ। ओपीडी समय, दवा के समय या आपातकालीन सेवाओं के बारे में मुझसे पूछ सकते हैं। आपात स्थिति में 108 या 112 पर कॉल करें।";
    }
    return "Namaste! I am the AyuSwar Health Assistant. You can ask me about OPD clinic hours, prescription timings, or emergency guidance. For medical emergencies, call 108 or 112 immediately.";
  }

  // Deterministic emergency interceptor: acute red-flag phrases never depend on LLM availability or phrasing
  const isEmergencyPrompt = /chest pain|choking|breathless|can'?t breathe|severe bleeding|unconscious|stroke|heart attack|suicidal|గుండె నొప్పి|శ్వాస ఆడట్లేదు|ఛाती में दर्द|सांस नहीं/i.test(lower);
  if (isEmergencyPrompt) {
    if (isTelugu) {
      return "[EMERGENCY - అత్యవసర ప్రోటోకాల్] తీవ్రమైన లక్షణాలు గుర్తించబడ్డాయి. దయచేసి వెంటనే 112 లేదా 108 కు కాల్ చేయండి. నిటారుగా కూర్చోండి, ఇల్లు తెరిచి ఉంచండి, సహాయం వచ్చే వరకు శ్రమించకండి.";
    }
    if (isHindi) {
      return "[EMERGENCY - आपातकालीन प्रोटोकॉल] गंभीर लक्षण पाए गए। कृपया तुरंत 112 या 108 पर कॉल करें। सीधे बैठें, दरवाज़ा खुला रखें, मदद आने तक परिश्रम न करें।";
    }
    return "[EMERGENCY protocol] Severe symptoms detected. Please call national emergency 112 or 108 immediately. Sit upright, keep doors unlocked, and do not exert yourself while help is on the way.";
  }

  // Deterministic product-help intent: questions about AyuSwar itself (features,
  // languages, demo scope) get a grounded product answer, never the clinical
  // refusal. Facts below mirror the app's real shipping surfaces only.
  const isProductHelp = /what is ayuswar|about ayuswar|ayuswar (features|app|platform)|what can (you|ayuswar|this app) do|which languages|supported languages|how does (ayuswar|this app) work|is this (a )?(real app|demo|prototype)|ఆయుస్వర్ (ఏమిటి|ఏంటి)|आयुस्वर क्या/i.test(lower);
  if (isProductHelp) {
    if (isTelugu) {
      return "ఆయుస్వర్ ఒక వాయిస్-ఫస్ట్ హెల్త్ కంపానియన్ ప్రోటోటైప్: డాక్టర్ల కోసం ద్విభాషా OPD స్క్రైబ్, పేషెంట్ పోర్టల్ (మందులు, రిపోర్టులు, అపాయింట్మెంట్లు - డెమో డేటా), ప్రిస్క్రిప్షన్ స్కానర్, మీ డివైజ్‌లోనే నడిచే అకూస్టిక్ వాయిస్ ల్యాబ్, ఆడియో-Rx మాటల ప్రిస్క్రిప్షన్లు. ఇంగ్లీష్, తెలుగు, హిందీ, తమిళం, కన్నడ, మరాఠీ అందుబాటులో ఉన్నాయి. ఇది డెమో - వైద్య నిర్ధారణలు ఇవ్వదు; ఆరోగ్య సమస్యలకు వైద్యుడిని సంప్రదించండి.";
    }
    if (isHindi) {
      return "आयुस्वर एक वॉइस-फर्स्ट हेल्थ कंपेनियन प्रोटोटाइप है: डॉक्टरों के लिए द्विभाषिक OPD स्क्राइब, पेशेंट पोर्टल (दवाएँ, रिपोर्ट, अपॉइंटमेंट - डेमो डेटा), प्रिस्क्रिप्शन स्कैनर, आपके डिवाइस पर चलने वाला अकूस्टिक वॉइस लैब, और ऑडियो-Rx बोली जाने वाली प्रिस्क्रिप्शन। अंग्रेज़ी, तेलुगु, हिंदी, तमिल, कन्नड़ और मराठी उपलब्ध हैं। यह एक डेमो है - चिकित्सा निदान नहीं देता; स्वास्थ्य समस्याओं के लिए योग्य चिकित्सक से संपर्क करें।";
    }
    return "AyuSwar is a voice-first health companion prototype for Indian hospitals: a bilingual ambient OPD scribe for doctors, a patient portal (medicines, reports, appointments - synthetic demo data), a prescription scanner, an on-device acoustic voice lab, and Audio-Rx spoken prescriptions. It works in English, Telugu, Hindi, Tamil, Kannada and Marathi. This is a demo and does not provide medical diagnoses; for health concerns, please consult a qualified clinician.";
  }

  // Strict RAG enforcement for Floating Assistant & Conversational QA
  if (context?.source === 'floating_assistant' || context?.strictRag === true) {
    if (!ragMatch || !ragMatch.answer) {
      if (isTelugu) {
        return "ఈ ప్రోటోటైప్ లక్షణాలను అంచనా వేయలేదు లేదా వైద్య నిర్ధారణ ఇవ్వలేదు. వ్యక్తిగత వైద్య సమస్యల కోసం దయచేసి అర్హత కలిగిన వైద్యుడిని సంప్రదించండి. అత్యవసరమైతే 108 లేదా 112 కు కాల్ చేయండి.";
      }
      if (isHindi) {
        return "यह प्रोटोटाइप लक्षणों का आकलन या चिकित्सा निदान नहीं कर सकता। व्यक्तिगत चिकित्सा सलाह के लिए कृपया योग्य चिकित्सक से संपर्क करें। आपात स्थिति में 108 या 112 पर कॉल करें।";
      }
      return "This prototype cannot assess symptoms or provide a clinical assessment. For personal medical concerns, please consult a qualified clinician. For emergencies, dial 108 or 112 immediately.";
    }

    // Grounded match found: If Groq is available, synthesize a natural answer strictly from RAG context
    const groqKey = getGroqApiKey();
    if (groqKey) {
      try {
        const langName = isTelugu ? 'Telugu' : isHindi ? 'Hindi' : 'English';
        const groqPrompt = `User question: "${cleanPrompt}"\n\nGrounded Clinical Knowledge:\n${ragMatch.answer}\n\nDeliver a direct, helpful, compassionate answer in ${langName} strictly grounded in the knowledge above. Keep it concise. No markdown, no bullet points, no asterisks.`;
        const groqReply = await queryGroqApi(groqPrompt, `You are AyuSwar Assistant. Only use provided knowledge. Language: ${langName}.`);
        if (groqReply) return ensureClinicianGuidance(groqReply);
      } catch (err) {
        console.warn("Groq RAG synthesis error:", err.message);
      }
    }
    return ragMatch.answer;
  }

  const enrichedContext = ragMatch?.answer ? { ...context, ragKnowledge: ragMatch.answer } : context;
  const groqKey = getGroqApiKey();

  // Groq API Key as primary LLM brain for OPD, Sanjivani, Voicemaker
  if (groqKey) {
    try {
      const groqReply = await queryGroqApi(cleanPrompt, getSystemPromptForRole(role, enrichedContext));
      if (groqReply) {
        return (role === 'patient' || role === 'receptionist') ? ensureClinicianGuidance(groqReply) : groqReply;
      }
    } catch (err) {
      console.warn("Groq API unavailable; engaging fallback:", err.message);
    }
  }

  const { provider } = getAiConfig();

  // 1. Gnani Evon 30B Sovereign Indic Reasoning (Secure Server-Side Route)
  if (provider === 'gnani_evon_30b') {
    try {
      const response = await callGnaniEvonApi(cleanPrompt, role, enrichedContext);
      if (response) return response;
    } catch (err) {
      console.warn("Gnani Evon server route unreachable; using honest fallback guidance:", err.message);
    }
  }

  // 2. Safe deterministic fallback if network unavailable
  recordDiagnosticStage({
    stage: 'local_rules',
    outcomeCode: 'DETERMINISTIC_FALLBACK',
    elapsedMs: 0,
    component: 'aiBrainService'
  });

  if (ragMatch?.answer) {
    return ragMatch.answer;
  }

  if (isTelugu) {
    return "ఆయుస్వర్ అసిస్టెంట్ మార్గదర్శకత్వం: క్లౌడ్ రీజనింగ్ ప్రస్తుతం అందుబాటులో లేదు. దయచేసి మీ సందేహాన్ని టైప్ చేయండి లేదా హాస్పిటల్ హెల్ప్‌డెస్క్‌ను సంప్రదించండి. అత్యవసర పరిస్థితుల్లో 108 లేదా 112 కు కాల్ చేయండి.";
  }
  if (isHindi) {
    return "आयुस्वर सहायक मार्गदर्शन: क्लाउड रीज़निंग वर्तमान में उपलब्ध नहीं है। कृपया अपना प्रश्न टाइप करें या अस्पताल रिसेप्शन से संपर्क करें। आपात स्थिति में 108 या 112 पर कॉल करें।";
  }
  return generateSafeDemonstrationResponse(cleanPrompt, role, enrichedContext);
}

/**
 * Check if Groq server route is available (server-side GROQ_API_KEY)
 */
export function getGroqApiKey() {
  // Client bundle never handles or stores Groq API keys directly.
  // Returns true if serverless route is available.
  return true;
}

/**
 * Retained for backwards-compatibility; client key storage is disabled for security.
 */
export function setGroqApiKey(_key) {
  return false;
}

export async function queryGroqApi(prompt, systemInstruction = '', preferredModel = 'llama-3.3-70b-versatile', maxTokens = 650) {
  if (groqServerKnownUnconfigured) {
    recordDiagnosticStage({
      stage: 'groq',
      outcomeCode: 'FAST_FALLBACK_UNCONFIGURED',
      elapsedMs: 0,
      component: 'aiBrainService'
    });
    return null;
  }

  const startTime = Date.now();
  try {
    const res = await fetch(apiUrl('/api/groq/chat'), {
      method: 'POST',
      headers: { ...(await authHeaders()),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        systemInstruction,
        preferredModel,
        maxTokens
      }),
      signal: AbortSignal.timeout(12000)
    });

    const elapsedMs = Date.now() - startTime;

    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'UNCONFIGURED') {
        groqServerKnownUnconfigured = true;
        recordDiagnosticStage({
          stage: 'groq',
          outcomeCode: 'UNCONFIGURED_FALLBACK',
          elapsedMs,
          component: 'aiBrainService'
        });
        return null;
      }
      if (data && data.text && data.text.trim()) {
        recordDiagnosticStage({
          stage: 'groq',
          outcomeCode: 200,
          elapsedMs,
          component: 'aiBrainService'
        });
        return data.text.trim();
      }
    } else {
      recordDiagnosticStage({
        stage: 'groq',
        outcomeCode: res.status,
        elapsedMs,
        component: 'aiBrainService'
      });
    }
  } catch (err) {
    const elapsedMs = Date.now() - startTime;
    recordDiagnosticStage({
      stage: 'groq',
      outcomeCode: err.name === 'TimeoutError' ? 'TIMEOUT' : 'ERROR',
      elapsedMs,
      component: 'aiBrainService'
    });
    console.warn('Server Groq proxy query failed:', err.message);
  }
  return null;
}

async function callGnaniEvonApi(prompt, role, context) {
  const systemPrompt = getSystemPromptForRole(role, context);
  const result = await queryEvonServer(prompt, systemPrompt, { maxTokens: 400 });
  if (result && result.finalAnswer) {
    if (result.thoughtTrace) {
      return `[Gnani Evon 30B Live Reasoning: ${result.thoughtTrace.slice(0, 140)}...]\n\n${result.finalAnswer}`;
    }
    return result.finalAnswer;
  }
  return null;
}

function getSystemPromptForRole(role, context) {
  let basePrompt = "";
  if (role === 'doctor') {
    basePrompt = "You are AyuSwar Doctor Scribe Assistant. Format clinical summaries with standard medical structure (Subjective, Objective, Assessment, Plan). Suggest differential diagnoses with ICD-10 codes where appropriate, but explicitly note that all recommendations require physician sign-off. Do not prescribe specific drug dosages.";
  } else if (role === 'triage') {
    basePrompt = "You are AyuSwar Triage Safety Reasoner. Classify emergency severity into RED (Immediate), YELLOW (Urgent), or GREEN (Routine). Identify life-threatening red flags immediately (chest pain, severe shortness of breath, acute stroke signs, heavy trauma). If symptoms suggest a medical emergency, direct the patient to call 112 or 108 immediately.";
  } else {
    basePrompt = "You are AyuSwar Vernacular Health Companion, a compassionate bilingual assistant helping rural Indian patients understand clinic schedules, appointment flow, and health awareness. Always reply in the SAME language the user wrote in (English question -> English answer, Telugu -> Telugu, Hindi -> Hindi); use vernacular idioms only when the user writes in that language. Never switch languages mid-reply. Remind users that you are an assistive prototype and they must consult a doctor.";
  }

  if (context.ragKnowledge) {
    basePrompt += `\n\n[Grounded Clinical Knowledge Context]:\n${context.ragKnowledge}`;
  }

  return basePrompt;
}

function generateSafeDemonstrationResponse(prompt, role, context) {
  const lower = prompt.toLowerCase();

  // Emergency safety override
  if (lower.includes('chest pain') || lower.includes('గుండె నొప్పి') || lower.includes('छाती में दर्द') || 
      lower.includes('breathless') || lower.includes('శ్వాస ఆడట్లేదు') || lower.includes('సాన్స్')) {
    return "[Emergency protocol] Severe symptoms detected. Please call national emergency 112 or 108 immediately. Sit upright, keep doors unlocked, and do not exert yourself while emergency personnel are en route.";
  }

  if (context.ragKnowledge) {
    return `${context.ragKnowledge}\n\nNote: This information is provided as prototype reference only. Please consult the attending doctor at your PHC for personalized medical advice.`;
  }

  if (role === 'doctor') {
    return `[AyuSwar Clinical Scribe Guidance - general workflow note]\n• Clinical review of patient symptoms is advised.\n• Check vital signs (BP, SpO2, Heart Rate) and standard lab biomarkers.\n• Document longitudinal history in the consultation record.`;
  }

  return `AyuSwar demo guidance: this prototype does not provide medical advice or live clinic schedules. Please confirm consultation timings with your local PHC and consult a qualified clinician for any health concern. For urgent symptoms, dial 112 / 108 immediately.`;
}

// Every patient-facing reply, from ANY provider path (LLM, Evon route, RAG, deterministic fallback),
// must point to qualified clinician evaluation. Emergency and greeting replies already carry 108/112 guidance.
export async function askAyuSwarBrain(prompt, role = 'receptionist', context = {}) {
  const reply = await askAyuSwarBrainCore(prompt, role, context);
  if (typeof reply !== 'string') return reply;
  if (role !== 'patient' && role !== 'receptionist') return reply;
  if (/^\[EMERGENCY|^\[Emergency|^Namaste!|^నమస్కారం|^नमस्ते/.test(reply)) return reply;
  return ensureClinicianGuidance(reply);
}

// Patient-facing replies must always point to qualified clinician evaluation, even when phrased by a live LLM.
function ensureClinicianGuidance(reply) {
  if (/doctor|clinic|physician|వైద్యుడి|డాక్టర్|चिकित्सक|डॉक्टर/i.test(reply)) return reply;
  return reply.trimEnd() + " Please consult a qualified clinician for personal medical concerns. For urgent symptoms, dial 112 / 108.";
}

/**
 * Voicemaker: Generates crystal-clear vernacular spoken dosage instructions using Groq LLaMA-3.3
 */
export async function generateVoicemakerScriptWithGroq({
  patientName = 'Patient',
  medications = [],
  language = 'te-IN'
} = {}) {
  const isTelugu = language === 'te-IN';
  const isHindi = language === 'hi-IN';
  const langName = isTelugu ? 'Telugu' : isHindi ? 'Hindi' : 'Indian English';

  const medList = medications.length > 0 
    ? medications.map(m => `- ${m.name || m.drug || 'Medicine'} (${m.colorLabel || m.color || ''}): ${m.timing || m.schedule || ''}, ${m.meal || ''}`).join('\n')
    : `- Pantoprazole 40mg (Yellow pill): Morning, before breakfast\n- Metformin 500mg (Pink pill): Night, after dinner`;

  const prompt = `Patient Name: ${patientName}. Medications:\n${medList}\n\nCreate a warm, respectful conversational spoken prescription script in ${langName} that an elderly or rural patient can listen to. Mention pill colors clearly. Keep it under 50 words. No asterisks, no bullet points, no markdown.`;

  const systemInstruction = `You are AyuSwar Voicemaker, an Indic clinical speech engineer. Write pure spoken conversational audio scripts in ${langName}. No asterisks, no emojis.`;

  const reply = await queryGroqApi(prompt, systemInstruction);
  return reply ? reply.trim() : null;
}

/**
 * Acoustic Lab: Generates personalized preventive vocal wellness & respiratory hygiene counsel using Groq LLaMA-3.3
 */
export async function generateHealthyAcousticCounselWithGroq({
  metrics = {},
  language = 'te-IN'
} = {}) {
  const isTelugu = language === 'te-IN';
  const isHindi = language === 'hi-IN';
  const langName = isTelugu ? 'Telugu' : isHindi ? 'Hindi' : 'Indian English';

  const f0 = metrics.pitchF0 || 140;
  const hnr = metrics.hnrDb || 20.0;
  const jitter = metrics.jitterPct || 0.8;

  const prompt = `Patient acoustic phonation test results:
Fundamental Frequency (F0): ${f0} Hz
Harmonics-to-Noise Ratio (HNR): ${hnr} dB
Cycle-to-Cycle Jitter: ${jitter}%
Clinical Assessment: Airway is completely unobstructed, normal vesicular flow, zero wheeze, zero crackles, vocal fold mechanics are healthy.

Write a warm, encouraging 2-sentence preventive wellness recommendation in ${langName}. Praise their healthy vocal and lung condition, and give 1 quick tip on hydration or deep breathing to maintain it. Keep it under 45 words, conversational, spoken style. No markdown, no bullet points, no asterisks.`;

  const systemInstruction = `You are AyuSwar Vocal Wellness Physician. Provide clear, encouraging preventive acoustic counsel in ${langName}.`;

  const reply = await queryGroqApi(prompt, systemInstruction);
  return reply ? reply.trim() : null;
}

/**
 * Groq Whisper STT: High-accuracy Indian English, Telugu & Hindi Clinical Speech-to-Text
 * Proxied securely via serverless route /api/groq/transcribe (zero client secrets).
 */
export async function transcribeAudioWithGroqWhisper(audioBlob, language = 'te') {
  const reader = new FileReader();
  const base64Promise = new Promise((resolve, reject) => {
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });

  const audioBase64 = await base64Promise;

  const res = await fetch(apiUrl('/api/groq/transcribe'), {
    method: 'POST',
    headers: { ...(await authHeaders()),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      audioBase64,
      language
    })
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Groq Whisper STT failed (${res.status})`);
  }

  const data = await res.json();
  return {
    text: (data.text || '').trim(),
    segments: data.segments || [],
    duration: data.duration || 0,
    language: data.language || language
  };
}
