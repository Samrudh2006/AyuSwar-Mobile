/**
 * AyuSwar AI — Gnani Evon (30B-A3B) Indic Reasoning Service
 * (src/services/gnaniEvonService.js)
 * 
 * Configured model reference used by the prototype when the server route is available.
 * This service is not a medical authority and does not validate clinical output.
 *
 * Integrity boundaries:
 * 1. No hardcoded or mocked reply is presented as live model output.
 * 2. Calls use /api/evon/* routes backed by EVON_BASE_URL and EVON_API_KEY. Secret keys are not stored in frontend code.
 * 3. If Evon is unreachable or unset, the result is an explicit UNAVAILABLE state or a clearly labelled rule-based fallback.
 * 4. Live status requires an HTTP 200 response from /api/evon/status.
 * 5. Emergency detection uses local sample rules only and does not dispatch help or provide clinical advice.
 * 6. No autonomous diagnosis, treatment, dose, or medication-safety decision is produced.
 */

import { queryGroqApi, getGroqApiKey } from './aiBrainService.js';
import { apiUrl, authHeaders } from '../utils/apiBase.js';
import { recordDiagnosticStage } from '../utils/diagnosticLogger.js';

export const EVON_MODEL_METADATA = {
  modelId: 'gnani/gnani-evon-v3.3-30B-A3B',
  organization: 'Gnani.ai',
  displayName: 'Gnani Evon v3.3-30B-A3B',
  architecture: 'Mamba + MoE Hybrid (30B total, ~3.5B active/token)',
  contextLength: '128K tokens',
  supportedLanguages: [
    { code: 'te', name: 'Telugu (తెలుగు)', nativeScript: true },
    { code: 'hi', name: 'Hindi (हिन्दी)', nativeScript: true },
    { code: 'ta', name: 'Tamil (தமிழ்)', nativeScript: true },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)', nativeScript: true },
    { code: 'mr', name: 'Marathi (मराठी)', nativeScript: true },
    { code: 'bn', name: 'Bengali (বাংলা)', nativeScript: true },
    { code: 'gu', name: 'Gujarati (ગુજરાતી)', nativeScript: true },
    { code: 'ml', name: 'Malayalam (മലയാളം)', nativeScript: true },
    { code: 'or', name: 'Odia (ଓଡ଼ିଆ)', nativeScript: true },
    { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)', nativeScript: true },
    { code: 'en', name: 'Indian English', nativeScript: false }
  ],
  features: [
    'Native Indic Vocabulary optimized for 11 Indian languages',
    '128K Long Context for Longitudinal Patient EHR Dossiers',
    'Long-context documentation-draft synthesis',
    'OpenAI-compatible server-side route (/chat/completions) backed by EVON_BASE_URL'
  ]
};

/**
 * Checks live operational status of Gnani Evon via server-side status endpoint.
 * Returns { status: 'LIVE' | 'UNAVAILABLE', available: boolean, model: string, latencyMs, lastSuccessTime }
 */
export async function checkEvonStatus() {
  try {
    const res = await fetch(apiUrl('/api/evon/status'), {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();
      return {
        status: data.status || (data.available ? 'LIVE' : 'UNAVAILABLE'),
        available: Boolean(data.available),
        model: data.model || EVON_MODEL_METADATA.modelId,
        latencyMs: data.latencyMs ?? null,
        lastSuccessTime: data.lastSuccessTime ?? null,
        reason: data.reason || null
      };
    }

    return {
      status: 'UNAVAILABLE',
      available: false,
      model: EVON_MODEL_METADATA.modelId,
      latencyMs: null,
      lastSuccessTime: null,
      reason: `Server status returned HTTP ${res.status}`
    };
  } catch (err) {
    return {
      status: 'UNAVAILABLE',
      available: false,
      model: EVON_MODEL_METADATA.modelId,
      latencyMs: null,
      lastSuccessTime: null,
      reason: `Network error connecting to status route: ${err.message}`
    };
  }
}

let evonServerKnownUnconfigured = false;

/**
 * Dispatches query exclusively through the secure server-side route (/api/evon/chat).
 * Throws an explicit error if Evon is unconfigured or unreachable.
 * NEVER returns simulated or hardcoded responses presented as Evon output.
 */
export async function queryEvonServer(prompt, systemInstruction = '', options = {}) {
  const startTime = Date.now();

  // Fast-degradation if previously reported unconfigured by server
  if (evonServerKnownUnconfigured && !options.forceCheck) {
    recordDiagnosticStage({
      stage: 'evon_chat',
      outcomeCode: 'FAST_FALLBACK_UNCONFIGURED',
      elapsedMs: 0,
      component: 'gnaniEvonService'
    });
    const fastErr = new Error('Evon server route is unconfigured (cached).');
    fastErr.isFallback = true;
    fastErr.cached = true;
    throw fastErr;
  }

  const timeoutMs = options.timeoutMs || 12000;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal;

  try {
    const response = await fetch(apiUrl('/api/evon/chat'), {
      method: 'POST',
      headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        systemInstruction,
        maxTokens: options.maxTokens || 450,
        temperature: options.temperature || 0.2
      }),
      signal
    });

    const elapsedMs = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      recordDiagnosticStage({
        stage: 'evon_chat',
        outcomeCode: response.status,
        elapsedMs,
        component: 'gnaniEvonService'
      });
      const err = new Error(errorData.error || `Evon server route returned HTTP ${response.status}`);
      err.status = response.status;
      err.data = errorData;
      throw err;
    }

    const data = await response.json();
    if (data.isFallback || data.fallbackRequired || !data.text) {
      evonServerKnownUnconfigured = true;
      recordDiagnosticStage({
        stage: 'evon_chat',
        outcomeCode: 'UNCONFIGURED_FALLBACK',
        elapsedMs,
        component: 'gnaniEvonService'
      });
      const err = new Error(data.error || 'Evon server returned fallback or unconfigured state.');
      err.isFallback = true;
      err.data = data;
      throw err;
    }

    recordDiagnosticStage({
      stage: 'evon_chat',
      outcomeCode: 200,
      elapsedMs,
      component: 'gnaniEvonService'
    });

    return parseEvonReasoningOutput(data.text, data.model || EVON_MODEL_METADATA.modelId);
  } catch (err) {
    const elapsedMs = Date.now() - startTime;
    const isTimeout = err.name === 'TimeoutError' || err.message?.includes('timeout');
    recordDiagnosticStage({
      stage: 'evon_chat',
      outcomeCode: isTimeout ? 'TIMEOUT' : (err.status || 'ERROR'),
      elapsedMs,
      component: 'gnaniEvonService'
    });
    throw err;
  }
}

/**
 * Parses real output from Evon containing <reasoning> ... </reasoning> tags
 */
export function parseEvonReasoningOutput(rawText, model = EVON_MODEL_METADATA.modelId) {
  let thoughtTrace = '';
  let finalAnswer = rawText;

  if (rawText.includes('</reasoning>')) {
    const parts = rawText.split('</reasoning>');
    thoughtTrace = parts[0].replace('<reasoning>', '').trim();
    finalAnswer = parts[1].replace('<|im_end|>', '').trim();
  } else if (rawText.includes('<reasoning>')) {
    thoughtTrace = rawText.replace('<reasoning>', '').trim();
  }

  return {
    raw: rawText,
    thoughtTrace,
    finalAnswer,
    model,
    isEvonLive: true,
    isFallback: false
  };
}

/**
 * Higher-Level: Sample Emergency Transcript Reasoner with Evon
 * 
 * CRITICAL SAFETY NOTE:
 * Emergency triage RED rules run synchronously in 0ms via sanjivaniEmergencyService.js.
 * This LLM call is strictly non-blocking advisory analysis. If Evon is unavailable or fails,
 * it returns a clearly labelled Rule-based FALLBACK (Not Evon), NEVER masquerading as Evon output.
 */
export async function reasonEmergencyTriageWithEvon(transcript, patientContext = {}) {
  const systemInstruction = 
    `You are Gnani Evon (v3.3-30B-A3B), an Indic clinical reasoning foundation model. ` +
    `Review a sample emergency transcript for documentation keywords only. ` +
    `Format with an explicit <reasoning> block showing step-by-step chain-of-thought, ` +
    `identifying sample language cues and phrases for human review. ` +
    `Do not provide triage, pre-hospital guidance, diagnosis, treatment, or medication advice. Tell the reader to call 112 or 108 for a real emergency.`;

  try {
    const reasoningResult = await queryEvonServer(
      `Patient Transcript: "${transcript}"\nPatient Age/Gender: ${patientContext.age || 'Unknown'}, ${patientContext.gender || 'Unknown'}`,
      systemInstruction,
      { maxTokens: 400, temperature: 0.2 }
    );

    return {
      ...reasoningResult,
      modelName: EVON_MODEL_METADATA.displayName,
      modelId: EVON_MODEL_METADATA.modelId
    };
  } catch (err) {
    // Honest Fallback: clearly labelled 'Rule-based FALLBACK (Not Evon)'
    return {
      isEvonLive: false,
      isFallback: true,
      source: 'Rule-based FALLBACK (Not Evon)',
      status: 'UNAVAILABLE',
      error: err.message,
      modelName: null,
      modelId: null,
      thoughtTrace: null,
      finalAnswer: `[Rule-based FALLBACK (Not Evon)] Sample emergency keyword review is unavailable. For a real emergency, call 112 or 108.`
    };
  }
}

/**
 * Higher-Level: Clinical Documentation Draft Scribe with Evon 30B
 * If Evon is unavailable, returns honest Rule-based FALLBACK (Not Evon) state.
 */
export async function reasonClinicalNoteWithEvon(transcriptOrNotes, patient = {}) {
  const systemInstruction = 
    `You are Gnani Evon (v3.3-30B-A3B), an Indic clinical scribe foundation model. ` +
    `Draft a structured documentation note using only facts explicitly stated in the transcript. ` +
    `Do not diagnose, prescribe, calculate doses, give treatment advice, invent measurements, or add medication instructions. ` +
    `Mark uncertain items for clinician review.`;

  // OPD documentation mode: use configured Groq route when available
  const groqKey = getGroqApiKey();
  if (groqKey) {
    try {
      const groqPrompt = 
        `Draft a structured clinical encounter documentation note and a plain-language patient summary using only stated facts:\n` +
        `Patient: ${patient.name || 'Patient'}, Age: ${patient.age || 'Adult'}, Known Conditions: ${patient.condition || 'None'}\n` +
        `Clinical Dialogue / Transcription:\n${transcriptOrNotes}\n\n` +
        `Format clearly:\n` +
        `[S - STATED CONCERNS]\n[O - STATED OBSERVATIONS]\n[A - ITEMS FOR CLINICIAN REVIEW]\n[P - DOCUMENTATION NOTES ONLY]\n[PLAIN-LANGUAGE SUMMARY - NO MEDICINE INSTRUCTIONS]`;
      const groqRes = await queryGroqApi(groqPrompt, systemInstruction);
      if (groqRes) {
        return {
          raw: groqRes,
          finalAnswer: groqRes,
          thoughtTrace: 'Configured Groq model (documentation draft mode)',
          model: 'llama-3.3-70b-versatile',
          modelName: 'Configured Groq model (OPD documentation draft)',
          modelId: 'groq/llama-3.3-70b',
          isGroqLive: true,
          isEvonLive: false,
          isFallback: false
        };
      }
    } catch (err) {
      console.warn('Groq OPD Scribe error, attempting Evon server:', err.message);
    }
  }

  try {
    const reasoningResult = await queryEvonServer(
      `Patient: ${patient.name || 'Patient'}, Age: ${patient.age || 'Adult'}, Known Conditions: ${patient.condition || 'None'}\nClinical Notes/Dialogue:\n${transcriptOrNotes}`,
      systemInstruction,
      { maxTokens: 500, temperature: 0.2 }
    );

    return {
      ...reasoningResult,
      modelName: EVON_MODEL_METADATA.displayName,
      modelId: EVON_MODEL_METADATA.modelId
    };
  } catch (err) {
    // Honest Fallback: clearly labelled 'Rule-based FALLBACK (Not Evon)'
    return {
      isEvonLive: false,
      isFallback: true,
      source: 'Rule-based FALLBACK (Not Evon)',
      status: 'UNAVAILABLE',
      error: err.message,
      modelName: null,
      modelId: null,
      thoughtTrace: null,
      finalAnswer: `[Rule-based FALLBACK (Not Evon)] Clinical Encounter Template\nSubjective: Patient reported symptoms documented.\nObjective: Outpatient vitals recorded.\nAssessment: Clinical review required.\nPlan: Attending physician review and routine follow-up.`
    };
  }
}

/**
 * Higher-Level: Acoustic Biomarker Correlation with Evon 30B
 * If Evon is unavailable, returns honest Rule-based FALLBACK (Not Evon) state.
 */
export async function reasonAcousticBiomarkerWithEvon(dspMetrics = {}, symptoms = '') {
  const prompt = 
    `Analyze physical acoustic DSP metrics:\n` +
    `- Fundamental Frequency (F0): ${dspMetrics.pitchF0 || 140} Hz\n` +
    `- Jitter (Period Perturbation): ${dspMetrics.jitterPct || 0.8} %\n` +
    `- Shimmer (Amplitude Perturbation): ${dspMetrics.shimmerPct || 2.0} %\n` +
    `- Harmonics-to-Noise Ratio (HNR): ${dspMetrics.hnrDb || 20.0} dB\n` +
    `- Patient Reported Symptoms: "${symptoms || 'General phonation test'}"\n\n` +
    `Describe these sample acoustic metrics without clinical interpretation or diagnosis. ` +
    `Explain the physiological implication of vocal fold mechanics in plain language.`;

  const systemInstruction = 
    `You are Gnani Evon (v3.3-30B-A3B). Provide physical voice acoustic correlation ` +
    `based on vocal fold mass and turbulence, emphasizing that DSP features require clinical evaluation.`;

  try {
    const result = await queryEvonServer(prompt, systemInstruction, { maxTokens: 350, temperature: 0.2 });
    return {
      ...result,
      modelName: EVON_MODEL_METADATA.displayName
    };
  } catch (err) {
    // Honest Fallback: clearly labelled 'Rule-based FALLBACK (Not Evon)'
    return {
      isEvonLive: false,
      isFallback: true,
      source: 'Rule-based FALLBACK (Not Evon)',
      status: 'UNAVAILABLE',
      error: err.message,
      thoughtTrace: null,
      finalAnswer: `[Rule-based FALLBACK (Not Evon)] Sample DSP visualization reports fundamental frequency F0: ${dspMetrics.pitchF0 || 140} Hz with HNR: ${dspMetrics.hnrDb || 20} dB. Non-diagnostic audio engineering observation.`
    };
  }
}
