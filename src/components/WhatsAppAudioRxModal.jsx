import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Send, 
  Phone, 
  CheckCheck, 
  Volume2, 
  ExternalLink, 
  Share2, 
  Download, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Pill, 
  QrCode, 
  CheckCircle2, 
  Smartphone,
  RefreshCw,
  FileText,
  Info
} from 'lucide-react';
import { speechService } from '../services/indicSpeechService';
import { getBoundSampleAudioUrl } from '../services/bundledSpeechSamples';
import { queryGroqApi, getGroqApiKey } from '../services/aiBrainService';
import { cleanTextForSpeech } from '../utils/speechSanitizer';
import AbdmRegistryBadgeRow from './AbdmRegistryBadgeRow';
import { audioMutex } from '../services/clinicalTelemetry';

/**
 * WhatsAppAudioRxModal Component
 * Implements Vernacular WhatsApp Audio-Rx using Unified Indic Speech Service (Gnani Timbre TTS / Browser Fallback).
 * Features:
 * 1. Local WhatsApp-style preview frame with clear synthetic status.
 * 2. Playable Indic Voice Note with real Web Speech Synthesis in Telugu, Hindi, or English.
 * 3. Real-time word-by-word karaoke synchronization highlighting spoken sample text.
 * 4. Color-coded visual schedule highlighting in sync with sample spoken text.
 * 5. User-reviewed WhatsApp compose (wa.me) plus clipboard copy fallback; the user picks the recipient and taps send.
 * 6. Interactive local preview pipeline; no ABDM sync, WhatsApp API, automated delivery, or read receipt.
 */
export default function WhatsAppAudioRxModal({
  isOpen,
  onClose,
  patientData = null,
  doctorName = 'Dr. Demo Clinician (synthetic)',
  customMedications = null,
  initialLanguage = 'te',
  customPrescriptionText = null
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ayuswar-ai.vercel.app';
  // Default patient fallback
  const defaultPatient = {
    name: 'Narayana Rao',
    vernacularName: 'నారాయణ రావు',
    phone: '+91 00000 00001',
    cleanPhone: '910000000001',
    age: 58,
    gender: 'Male',
    abhaId: 'DEMO-ABHA-0000-1049',
    language: 'Telugu',
    langCode: 'te-IN'
  };

  const patient = patientData || defaultPatient;
  const [phoneNumber, setPhoneNumber] = useState(patient.phone || '+91 00000 00001');
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage === 'hi' ? 'hi' : 'te'); // 'te' | 'hi' | 'en'
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [karaokeActiveIndex, setKaraokeActiveIndex] = useState(-1);
  const [activePillHighlight, setActivePillHighlight] = useState(null); // 'morning' | 'night' | null
  const [audioPlaybackRate, setAudioPlaybackRate] = useState(1.0);
  const [audioProgress, setAudioProgress] = useState(0); // 0 to 100%
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [sendSuccessToast, setSendSuccessToast] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState('preview'); // local preview states only

  const karaokeTimerRef = useRef(null);
  const progressTimerRef = useRef(null);

  // Doctor-configurable dosage schedule timings & meal relationships
  const [morningTime, setMorningTime] = useState('08:30 AM');
  const [morningMeal, setMorningMeal] = useState('after'); // 'before' | 'after'
  const [morningDoseText, setMorningDoseText] = useState('Sample morning item (పసుపు గోళీ)');

  const [nightTime, setNightTime] = useState('08:30 PM');
  const [nightMeal, setNightMeal] = useState('after'); // 'before' | 'after'
  const [nightDoseText, setNightDoseText] = useState('Sample evening item (గులాబీ గోళీ)');

  const morningMealTelugu = morningMeal === 'before' ? 'టిఫిన్ ముందు' : 'టిఫిన్ తర్వాత';
  const morningMealHindi = morningMeal === 'before' ? 'नाश्ते से पहले' : 'नाश्ते के बाद';
  const morningMealEnglish = morningMeal === 'before' ? 'before breakfast' : 'after breakfast';

  const nightMealTelugu = nightMeal === 'before' ? 'భోజనం ముందు' : 'భోజనం తర్వాత';
  const nightMealHindi = nightMeal === 'before' ? 'रात के खाने से पहले' : 'रात के खाने के बाद';
  const nightMealEnglish = nightMeal === 'before' ? 'before dinner' : 'after dinner';

  // Safe sample notes per language (with locally selected preview times)
  const rxContent = {
    te: {
      langLabel: 'తెలుగు (Telugu)',
      langCode: 'te-IN',
      doctorVernacular: 'డాక్టర్ ప్రియా శర్మ',
      audioDuration: '0:24',
      speechText: `ఇది నమూనా ఆడియో నోట్. ఇందులో మందుల సూచన లేదు. అర్హత కలిగిన వైద్యుడు సమీక్షించిన సూచనలను మాత్రమే అనుసరించండి.`,
      karaokeTokens: [],
      whatsappSummary: `*AyuSwar Synthetic Demo Audio-Rx*

Sample audio preview only. No medicine instruction, external link, WhatsApp delivery, registry verification, or medical advice is included.`
    },
    hi: {
      langLabel: 'हिंदी (Hindi)',
      langCode: 'hi-IN',
      doctorVernacular: 'डॉ. प्रिया शर्मा',
      audioDuration: '0:22',
      speechText: `यह केवल नमूना ऑडियो नोट है। इसमें दवा का निर्देश नहीं है। केवल योग्य चिकित्सक द्वारा समीक्षित निर्देशों का पालन करें।`,
      karaokeTokens: [],
      whatsappSummary: `*AyuSwar Synthetic Demo Audio-Rx*

Sample audio preview only. No medicine instruction, external link, WhatsApp delivery, registry verification, or medical advice is included.`
    },
    en: {
      langLabel: 'English (Indic Accent)',
      langCode: 'en-IN',
      doctorVernacular: 'Dr. Demo Clinician (synthetic)',
      audioDuration: '0:20',
      speechText: `This is a sample audio note only. It contains no medicine instruction. Follow only instructions reviewed by a qualified clinician.`,
      karaokeTokens: [],
      whatsappSummary: `*AyuSwar Synthetic Demo Audio-Rx*

Sample audio preview only. No medicine instruction, external link, WhatsApp delivery, registry verification, or medical advice is included.`
    },
    ta: {
      langLabel: 'தமிழ் (Tamil)',
      langCode: 'ta-IN',
      doctorVernacular: 'டாக்டர் பிரியா சர்மா',
      audioDuration: '0:22',
      speechText: `இது மாதிரி ஆடியோ குறிப்பு மட்டுமே. இதில் மருந்து வழிமுறை இல்லை. தகுதியான மருத்துவர் மதிப்பாய்வு செய்த வழிமுறைகளை மட்டும் பின்பற்றவும்.`,
      karaokeTokens: [],
      whatsappSummary: `*AyuSwar Synthetic Demo Audio-Rx*

Sample audio preview only. No medicine instruction, external link, WhatsApp delivery, registry verification, or medical advice is included.`
    },
    mr: {
      langLabel: 'मराठी (Marathi)',
      langCode: 'mr-IN',
      doctorVernacular: 'डॉ. प्रिया शर्मा',
      audioDuration: '0:22',
      speechText: `हा केवल नमुना ऑडिओ नोट आहे. यात औषध सूचना नाही. केवळ पात्र डॉक्टरांनी तपासलेल्या सूचनांचे पालन करा.`,
      karaokeTokens: [],
      whatsappSummary: `*AyuSwar Synthetic Demo Audio-Rx*

Sample audio preview only. No medicine instruction, external link, WhatsApp delivery, registry verification, or medical advice is included.`
    },
    bn: {
      langLabel: 'বাংলা (Bengali)',
      langCode: 'bn-IN',
      doctorVernacular: 'ডাঃ প্রিয়া শর্মা',
      audioDuration: '0:22',
      speechText: `এটি শুধুমাত্র নমুনা অডিও নোট। এতে ওষুধের নির্দেশনা নেই। শুধুমাত্র যোগ্য চিকিৎসকের পর্যালোচিত নির্দেশনা অনুসরণ করুন।`,
      karaokeTokens: [],
      whatsappSummary: `*AyuSwar Synthetic Demo Audio-Rx*

Sample audio preview only. No medicine instruction, external link, WhatsApp delivery, registry verification, or medical advice is included.`
    }
  };

  const [isGeneratingGroqRx, setIsGeneratingGroqRx] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [customSpokenText, setCustomSpokenText] = useState(null);
  const [customWhatsappText, setCustomWhatsappText] = useState(null);
  const [doctorEditedSpeech, setDoctorEditedSpeech] = useState('');

  const handleGenerateGroqVoiceNote = async () => {
    setIsGeneratingGroqRx(true);
    setGenerationError('');
    try {
      const langName = selectedLanguage === 'te' ? 'Telugu' : (selectedLanguage === 'hi' ? 'Hindi' : 'English');
      const medPrompt = `Create a conservative sample voice-note draft in ${langName}. Do not prescribe, diagnose, calculate doses, identify medicines, verify records, or include patient advice. Say only that this is a sample note and instructions must come from a qualified clinician. Return JSON only with keys SPOKEN_NOTE and WHATSAPP_SUMMARY.`;

      const res = await queryGroqApi(medPrompt, `You are an AyuSwar demo documentation assistant. Generate only non-clinical sample note text in ${langName}. Output JSON only.`);
      if (res) {
        try {
          const cleaned = res.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.spokenNote) {
            setCustomSpokenText(parsed.spokenNote);
            setDoctorEditedSpeech(parsed.spokenNote);
          }
          if (parsed.whatsappSummary) {
            setCustomWhatsappText(parsed.whatsappSummary);
          }
        } catch {
          setCustomSpokenText(cleanTextForSpeech(res));
          setDoctorEditedSpeech(cleanTextForSpeech(res));
        }
      }
    } catch (err) {
      console.warn('Groq WhatsApp summarization error:', err);
      setGenerationError('Voice-note generation failed. Edit the visible source text manually; no replacement note was invented.');
    } finally {
      setIsGeneratingGroqRx(false);
    }
  };

  const effectivePrescriptionText = doctorEditedSpeech || customPrescriptionText || customSpokenText;
  const baseRx = rxContent[selectedLanguage] || rxContent.te;
  const baseKaraokeTokens = baseRx.speechText.split(/\s+/).filter(Boolean).map(word => ({ word, pill: null }));
  const currentRx = {
    ...baseRx,
    speechText: effectivePrescriptionText || baseRx.speechText,
    whatsappSummary: customWhatsappText || (effectivePrescriptionText ? `*AyuSwar Synthetic Demo Audio-Rx*

${effectivePrescriptionText}

Local prototype preview only. No external link, WhatsApp delivery, registry verification, or medical advice.` : baseRx.whatsappSummary),
    karaokeTokens: effectivePrescriptionText 
      ? effectivePrescriptionText.split(' ').map(w => ({
          word: w,
          pill: w.includes('పసుపు') || w.includes('पीली') || w.includes('yellow') ? 'morning' : (w.includes('గులాబీ') || w.includes('गुलाबी') || w.includes('pink') ? 'night' : null)
        }))
      : baseKaraokeTokens
  };

  // Phone labels are demo-only; no external send is performed
  const sanitizePhone = (num) => {
    return num.replace(/[^0-9]/g, '');
  };

  // Download an audio note only when an actual audio source exists AND the spoken
  // text is exactly the canonical bundled sample. Edited or patient-entered text must
  // never ship with packaged sample audio.
  const [audioDownloadError, setAudioDownloadError] = useState('');
  const [audioNotice, setAudioNotice] = useState('');
  const currentAudioSourceRef = useRef(null);
  currentAudioSourceRef.current = { text: currentRx.speechText, langCode: currentRx.langCode, isOpen };
  const audioSourceMountedRef = useRef(true);
  useEffect(() => {
    audioSourceMountedRef.current = true;
    return () => { audioSourceMountedRef.current = false; };
  }, []);
  const handleDownloadAudioRxWav = async () => {
    setAudioDownloadError('');
    const sampleAudioUrl = getBoundSampleAudioUrl(currentRx.speechText, currentRx.langCode);
    if (!sampleAudioUrl) {
      setAudioDownloadError('No recorded audio is bound to this exact text and language. No audio was downloaded. Keep this as a written note only.');
      return;
    }
    try {
      const res = await fetch(sampleAudioUrl);
      if (!res.ok) throw new Error('audio source unavailable');
      const blob = await res.blob();
      if (!blob.type.includes('audio')) throw new Error('invalid audio response');
      // A pending fetch must not download an earlier script after visible text
      // or language changes, or after the modal has closed/unmounted.
      const latest = currentAudioSourceRef.current;
      if (!audioSourceMountedRef.current || !latest?.isOpen ||
          getBoundSampleAudioUrl(latest.text, latest.langCode) !== sampleAudioUrl) {
        if (audioSourceMountedRef.current) setAudioDownloadError('The note changed before the audio was ready. No audio was downloaded.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AyuSwar_Sample_AudioRx_DEMO_${selectedLanguage}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      if (audioSourceMountedRef.current) setAudioDownloadError('Actual voice audio is unavailable right now. No synthetic tone was downloaded.');
    }
  };

  // Play / Pause Spoken Audio-Rx with Web Speech API & Karaoke
  const togglePlayAudio = () => {
    if (isPlayingAudio) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  const stopAudio = () => {
    audioMutex.release('whatsapp-audio-rx');
    setIsPlayingAudio(false);
    if (karaokeTimerRef.current) clearInterval(karaokeTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setKaraokeActiveIndex(-1);
    setActivePillHighlight(null);
    setAudioProgress(0);
    speechService.stopSpeaking();
  };

  const startAudio = () => {
    stopAudio();
    setAudioNotice('');
    audioMutex.acquire('whatsapp-audio-rx', () => stopAudio());
    setIsPlayingAudio(true);
    const tokens = currentRx.karaokeTokens;
    let tokenIdx = 0;
    setKaraokeActiveIndex(0);
    setActivePillHighlight(tokens[0]?.pill || null);

    // Speak using Unified Indic Speech Service (Gnani Timbre TTS when live / safe browser fallback)
    speechService.speak(currentRx.speechText, {
      channel: 'opd_audio_rx',
      langCode: currentRx.langCode,
      rate: audioPlaybackRate,
      onTimeUpdate: (currentTimeMs, durationMs) => {
        if (durationMs > 0 && tokens.length > 0) {
          if (karaokeTimerRef.current) {
            clearInterval(karaokeTimerRef.current);
            karaokeTimerRef.current = null;
          }
          const progress = Math.min(0.99, currentTimeMs / durationMs);
          const activeIdx = Math.floor(progress * tokens.length);
          setKaraokeActiveIndex(activeIdx);
          setActivePillHighlight(tokens[activeIdx]?.pill || null);
          setAudioProgress(Math.floor(progress * 100));
        }
      },
      onStart: () => {
        // Pacing fallback for visual word progression starts only once real
        // audio playback has begun (never on click alone).
        const intervalTime = Math.max(250, Math.floor(750 / audioPlaybackRate));
        karaokeTimerRef.current = setInterval(() => {
          tokenIdx++;
          if (tokenIdx < tokens.length) {
            setKaraokeActiveIndex(tokenIdx);
            setActivePillHighlight(tokens[tokenIdx]?.pill || null);
            setAudioProgress(Math.floor((tokenIdx / tokens.length) * 100));
          } else {
            if (karaokeTimerRef.current) {
              clearInterval(karaokeTimerRef.current);
              karaokeTimerRef.current = null;
            }
          }
        }, intervalTime);
      },
      onEnd: () => stopAudio(),
      onError: (msg) => {
        stopAudio();
        setAudioNotice(msg || 'Voice playback is unavailable right now. No audio was played.');
      }
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        stopAudio();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopAudio();
    };
  }, [selectedLanguage, onClose]);

  // User-reviewed WhatsApp compose: opens WhatsApp with the draft text only.
  // The user picks the recipient and taps send themselves; nothing is sent or
  // dispatched by this prototype. Clipboard copy stays as an offline fallback.
  const handleRedirectToWhatsApp = () => {
    const composeUrl = `https://wa.me/?text=${encodeURIComponent(currentRx.whatsappSummary)}`;
    window.open(composeUrl, '_blank', 'noopener,noreferrer');
    setDeliveryStatus('preview-compose-opened');
  };

  const handleCopyPreview = async () => {
    try {
      await navigator.clipboard.writeText(currentRx.whatsappSummary);
      alert('Share text copied to clipboard. No WhatsApp message was opened or sent.');
    } catch {
      alert('Clipboard unavailable. Use Review in WhatsApp Compose instead.');
    }
  };

  // Simulate local preview progression only
  const handleSimulateDispatch = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(22); } catch {}
    }
    setIsSendingWhatsApp(true);
    setDeliveryStatus('preview-preparing');

    setTimeout(() => {
      setDeliveryStatus('preview-ready');
    }, 900);

    setTimeout(() => {
      setDeliveryStatus('preview-complete');
    }, 1800);

    setTimeout(() => {
      setDeliveryStatus('preview-complete');
      setIsSendingWhatsApp(false);
      setSendSuccessToast(true);
      setTimeout(() => setSendSuccessToast(false), 4500);
    }, 2800);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay whatsapp-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopAudio();
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(6, 22, 38, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div 
        className="modal-content whatsapp-modal-container"
        style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '92vh',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.2)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Top Header */}
        <div style={{
          background: '#0F4C5C',
          padding: '20px 28px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: '#25D366',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.4)'
            }}>
              <Smartphone size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px', fontFamily: 'var(--font-main)', color: '#FFFFFF' }}>
                  Vernacular WhatsApp Audio-Rx
                </h2>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  background: 'rgba(255,255,255,0.15)',
                  padding: '3px 8px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  letterSpacing: '0.5px'
                }}>
                  VOICE STATUS: LIVE TTS NOT VERIFIED
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#D0DFE2', margin: '3px 0 0 0' }}>
                Prototype Audio-Rx review screen: editable spoken text, schedule timing, WhatsApp compose preview and synchronized text highlight.
              </p>
            </div>
          </div>

          <button
            onClick={() => { stopAudio(); onClose(); }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Main Body (2 Columns: Left Controls & Karaoke, Right Realistic WhatsApp Frame) */}
        <div 
          className="whatsapp-modal-body-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 1fr',
            flex: 1,
            overflowY: 'auto',
            background: '#FAF8F5'
          }}
        >
          {/* LEFT COLUMN: Controls, Language, Karaoke Spoken Rx, Visual Schedule */}
          <div className="whatsapp-modal-controls-pane" style={{ padding: '26px', borderRight: '1px solid #D0DFE2', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Patient & Dispatch Selector */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #D0DFE2' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#52707C', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                Demo Recipient & Phone Label
              </div>
              <div className="whatsapp-recipient-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#486770', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Recipient Patient
                  </label>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#081C24' }}>
                    {patient.name} <span style={{ color: '#0F4C5C', fontWeight: 700 }}>({patient.vernacularName || 'నారాయణ'})</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#52707C' }}>
                    Demo ID: {patient.abhaId} • {patient.age}y {patient.gender}
                  </div>
                  <AbdmRegistryBadgeRow
                    abhaNumber={patient.abhaNumber || patient.abhaId}
                    abhaAddress={patient.abhaAddress}
                    hprId={patient.hprId || 'DEMO-CLINICIAN-2026'}
                    doctorName={doctorName || patient.doctorName || 'Dr. Demo Clinician (synthetic)'}
                    hfrId={patient.hfrId || 'DEMO-FACILITY-2026'}
                    facilityName={patient.facilityName || 'Synthetic Demo Facility'}
                    icd10={patient.icd10}
                    icd10Desc={patient.icd10Desc}
                    snomedCt={patient.snomedCt}
                    snomedDesc={patient.snomedDesc}
                    compact={true}
                    style={{ marginTop: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#486770', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Demo phone label
                  </label>
                  <input
                    type="text"
                    aria-label="Demo phone label"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="+91 00000 00001"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1.5px solid #D0DFE2',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#081C24',
                      outline: 'none',
                      boxSizing: 'border-box',
                      minWidth: 0
                    }}
                  />
                </div>
              </div>

              {/* Fast Phone Presets */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10.5px', color: '#52707C', alignSelf: 'center', marginRight: '4px' }}>Quick Select:</span>
                {[
                  { label: 'Narayana (demo)', num: '+91 00000 00001', lang: 'te' },
                  { label: 'Aarav Kumar (demo)', num: '+91 00000 00002', lang: 'hi' },
                  { label: 'Ananya Rao (demo)', num: '+91 00000 00003', lang: 'te' }
                ].map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => { setPhoneNumber(preset.num); setSelectedLanguage(preset.lang); }}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #D0DFE2',
                      background: phoneNumber === preset.num ? 'rgba(0, 0, 0, 0.07)' : '#F1F5F9',
                      color: phoneNumber === preset.num ? '#0F4C5C' : '#486770',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language & Voice Synthesis Engine */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #D0DFE2' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#52707C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Spoken Dialect & Synthesis Speed
                </div>
                <span style={{ fontSize: '11px', color: '#0F4C5C', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Volume2 size={13} /> Sample voice
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                {[
                  { code: 'te', label: 'తెలుగు (Telugu)' },
                  { code: 'hi', label: 'हिंदी (Hindi)' },
                  { code: 'ta', label: 'தமிழ் (Tamil)' },
                  { code: 'mr', label: 'मराठी (Marathi)' },
                  { code: 'bn', label: 'বাংলা (Bengali)' },
                  { code: 'en', label: 'English' }
                ].map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setSelectedLanguage(lang.code); stopAudio(); }}
                    style={{
                      padding: '8px 6px',
                      borderRadius: '10px',
                      border: selectedLanguage === lang.code ? '2px solid #0F4C5C' : '1px solid #D0DFE2',
                      background: selectedLanguage === lang.code ? 'rgba(0, 0, 0, 0.06)' : '#ffffff',
                      color: selectedLanguage === lang.code ? '#0F4C5C' : '#486770',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '4px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={handleGenerateGroqVoiceNote}
                  disabled={isGeneratingGroqRx}
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: '10px',
                    background: isGeneratingGroqRx ? '#94A3B8' : '#0F4C5C',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: isGeneratingGroqRx ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)'
                  }}
                >
                  <FileText size={14} color="#34D399" />
                  <span>{isGeneratingGroqRx ? 'Preparing sample note...' : 'Prepare Sample Voice Note'}</span>
                </button>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '4px 0 10px', fontSize: '11.5px', color: '#52707C', fontWeight: 700 }}>
                Sample note text (not clinician-reviewed)
                <textarea
                  aria-label="Sample note text (not clinician-reviewed)"
                  rows={4}
                  value={doctorEditedSpeech || currentRx.speechText}
                  onChange={(e) => setDoctorEditedSpeech(e.target.value)}
                  style={{ width: '100%', resize: 'vertical', border: '1.5px solid #D0DFE2', borderRadius: '10px', padding: '10px', font: 'inherit', fontSize: '13px', color: '#081C24', background: '#fff' }}
                />
                <span>Edits are used for local playback, preview and exports. No external message is sent.</span>
              </label>
              {generationError && <p role="status" style={{ margin: '0 0 8px', color: '#B45309', fontSize: '12px', fontWeight: 700 }}>{generationError}</p>}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: '#52707C' }}>
                <span>Speech Tempo:</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[0.8, 1.0, 1.25].map(rate => (
                    <button
                      key={rate}
                      onClick={() => setAudioPlaybackRate(rate)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid #D0DFE2',
                        background: audioPlaybackRate === rate ? '#0A2540' : '#F1F5F9',
                        color: audioPlaybackRate === rate ? '#ffffff' : '#486770',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Word-by-Word Synchronized Glowing Karaoke Box */}
            <div style={{
              background: '#061626',
              borderRadius: '16px',
              padding: '20px',
              border: '1.5px solid rgba(0, 0, 0, 0.16)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.10)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#D4AF37" />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#D4AF37', letterSpacing: '0.5px' }}>
                    LIVE WORD-BY-WORD KARAOKE SYNCHRONIZATION
                  </span>
                </div>
                {isPlayingAudio && (
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: '#ffffff',
                    background: '#B45309',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    animation: 'pulse 1s infinite'
                  }}>
                    VOICE ACTIVE
                  </span>
                )}
              </div>

              {/* Interactive Glowing Words Display */}
              <div style={{
                minHeight: '84px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
                lineHeight: 1.8,
                marginBottom: '16px'
              }}>
                {currentRx.karaokeTokens.map((token, idx) => {
                  const isActive = karaokeActiveIndex === idx;
                  const isPill = token.pill !== null;
                  return (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '14.5px',
                        fontWeight: isActive ? 850 : 600,
                        color: isActive ? '#061626' : (isPill ? '#FDE68A' : '#D0DFE2'),
                        background: isActive 
                          ? (token.pill === 'night' ? '#F472B6' : (token.pill === 'morning' ? '#FBBF24' : '#047857'))
                          : (isPill ? 'rgba(251, 191, 36, 0.15)' : 'rgba(255, 255, 255, 0.05)'),
                        border: isActive ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: 'none',
                        transform: isActive ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {token.word}
                    </span>
                  );
                })}
              </div>

              {/* Audio Play Trigger Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={togglePlayAudio}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    background: isPlayingAudio ? '#B91C1C' : '#0E7A3D',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '13.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.16)'
                  }}
                >
                  {isPlayingAudio ? <Pause size={16} fill="#ffffff" /> : <Play size={16} fill="#ffffff" />}
                  <span>{isPlayingAudio ? 'Pause Voice Note' : `Play Spoken Audio-Rx (${currentRx.langLabel.split(' ')[0]})`}</span>
                </button>
              </div>
            </div>

            {/* Visual Color-Coded Pill Schedule (Doctor-Configurable Timings) */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #D0DFE2' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#52707C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Sample Schedule Preview & Meal Timings
                </div>
                <span style={{ fontSize: '10px', background: '#FAF8F5', color: '#0F4C5C', padding: '2px 8px', borderRadius: '8px', fontWeight: 700 }}>
                  Text-synchronized preview
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Morning Pill Card with Doctor Timing Controls */}
                <div style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: activePillHighlight === 'morning' ? 'rgba(251, 191, 36, 0.18)' : '#FFFBEB',
                  border: activePillHighlight === 'morning' ? '2px solid #F59E0B' : '1px solid #FDE68A',
                  boxShadow: 'none',
                  transform: activePillHighlight === 'morning' ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <img 
                      src="/images/medicines/yellow_pantoprazole.jpg" 
                      alt="Illustrative morning tablet image, not identification of an actual medicine pack" 
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '1.5px solid #F59E0B',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                      }} 
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#92400E' }}>
                        ఉదయం / Morning sample
                      </div>
                      <div style={{ fontSize: '11px', color: '#B45309' }}>
                        Sample morning item (పసుపు గోళీ)
                      </div>
                    </div>
                  </div>

                  {/* Doctor Time Selector */}
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(245, 158, 11, 0.2)' }}>
                    <div style={{ fontSize: '10.5px', color: '#78350F', fontWeight: 700, marginBottom: '4px' }}>
                      Select sample time:
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      {['07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM'].map(t => (
                        <button
                          key={t}
                          onClick={() => setMorningTime(t)}
                          style={{
                            padding: '2px 7px',
                            borderRadius: '6px',
                            border: morningTime === t ? '1.5px solid #B45309' : '1px solid #FCD34D',
                            background: morningTime === t ? '#B45309' : '#ffffff',
                            color: morningTime === t ? '#ffffff' : '#78350F',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Meal Relation Toggle */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => setMorningMeal('before')}
                        style={{
                          flex: 1,
                          padding: '3px',
                          borderRadius: '6px',
                          border: morningMeal === 'before' ? '1.5px solid #B45309' : '1px solid #FCD34D',
                          background: morningMeal === 'before' ? '#B45309' : '#ffffff',
                          color: morningMeal === 'before' ? '#ffffff' : '#78350F',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        టిఫిన్ ముందు (Before)
                      </button>
                      <button
                        onClick={() => setMorningMeal('after')}
                        style={{
                          flex: 1,
                          padding: '3px',
                          borderRadius: '6px',
                          border: morningMeal === 'after' ? '1.5px solid #B45309' : '1px solid #FCD34D',
                          background: morningMeal === 'after' ? '#B45309' : '#ffffff',
                          color: morningMeal === 'after' ? '#ffffff' : '#78350F',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        టిఫిన్ తర్వాత (After)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Night Pill Card with Doctor Timing Controls */}
                <div style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: activePillHighlight === 'night' ? 'rgba(194, 65, 12, 0.15)' : '#FFF7ED',
                  border: activePillHighlight === 'night' ? '2px solid #C2410C' : '1px solid #FED7AA',
                  boxShadow: 'none',
                  transform: activePillHighlight === 'night' ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <img 
                      src="/images/medicines/pink_metformin.jpg" 
                      alt="Illustrative night tablet image, not identification of an actual medicine pack" 
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '1.5px solid #C2410C',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(194, 65, 12, 0.25)'
                      }} 
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#9A3412' }}>
                        రాత్రి / Night sample
                      </div>
                      <div style={{ fontSize: '11px', color: '#BE185D' }}>
                        Sample evening item (గులాబీ గోళీ)
                      </div>
                    </div>
                  </div>

                  {/* Doctor Time Selector */}
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(236, 72, 153, 0.2)' }}>
                    <div style={{ fontSize: '10.5px', color: '#831843', fontWeight: 700, marginBottom: '4px' }}>
                      Select sample time:
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      {['08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM'].map(t => (
                        <button
                          key={t}
                          onClick={() => setNightTime(t)}
                          style={{
                            padding: '2px 7px',
                            borderRadius: '6px',
                            border: nightTime === t ? '1.5px solid #DB2777' : '1px solid #F472B6',
                            background: nightTime === t ? '#DB2777' : '#ffffff',
                            color: nightTime === t ? '#ffffff' : '#831843',
                            fontSize: '10px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Meal Relation Toggle */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => setNightMeal('before')}
                        style={{
                          flex: 1,
                          padding: '3px',
                          borderRadius: '6px',
                          border: nightMeal === 'before' ? '1.5px solid #DB2777' : '1px solid #F472B6',
                          background: nightMeal === 'before' ? '#DB2777' : '#ffffff',
                          color: nightMeal === 'before' ? '#ffffff' : '#831843',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        భోజనం ముందు (Before)
                      </button>
                      <button
                        onClick={() => setNightMeal('after')}
                        style={{
                          flex: 1,
                          padding: '3px',
                          borderRadius: '6px',
                          border: nightMeal === 'after' ? '1.5px solid #DB2777' : '1px solid #F472B6',
                          background: nightMeal === 'after' ? '#DB2777' : '#ffffff',
                          color: nightMeal === 'after' ? '#ffffff' : '#831843',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        భోజనం తర్వాత (After)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Local share-preview actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', flexWrap: 'wrap' }}>
              <button
                onClick={handleRedirectToWhatsApp}
                style={{
                  flex: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '14px 20px',
                  borderRadius: '12px',
                  background: '#25D366',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(37, 211, 102, 0.35)',
                  transition: 'all 0.2s'
                }}
              >
                <Send size={18} />
                <span>Review in WhatsApp Compose</span>
                <ExternalLink size={14} />
              </button>
              <button
                onClick={handleCopyPreview}
                style={{
                  flex: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#ffffff',
                  color: '#166534',
                  border: '1.5px solid #86b89d',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Share2 size={16} />
                <span>Copy Share Text</span>
              </button>

              <button
                onClick={handleSimulateDispatch}
                disabled={isSendingWhatsApp}
                style={{
                  flex: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: '#0A2540',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={15} className={isSendingWhatsApp ? 'spin-animation' : ''} />
                <span>{isSendingWhatsApp ? 'Simulating preview...' : 'Preview push simulation'}</span>
              </button>
            </div>

            {/* Print & Download Action Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                onClick={() => {
                  window.print();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '10px 8px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  color: '#081C24',
                  border: '1.5px solid #D0DFE2',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
 <span> Print Slip</span>
              </button>

              <button
                id="whatsapp-audio-rx-download-wav-btn"
                onClick={handleDownloadAudioRxWav}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '10px 8px',
                  borderRadius: '10px',
                  background: '#0F4C5C',
                  color: '#ffffff',
                  border: '1.5px solid #0F4C5C',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
                title="Download actual audio file when an audio source is available"
              >
                <Download size={13} />
                <span>Audio (.wav)</span>
              </button>

              {audioNotice && (
                <div style={{
                  gridColumn: '1 / -1',
                  fontSize: '11px',
                  fontWeight: 650,
                  color: '#92400E',
                  background: '#FEF3C7',
                  border: '1px solid #F59E0B',
                  borderRadius: '8px',
                  padding: '6px 10px'
                }}>
                  {audioNotice}
                </div>
              )}

              {audioDownloadError && (
                <div role="status" style={{
                  gridColumn: '1 / -1',
                  fontSize: '11px',
                  fontWeight: 650,
                  color: '#92400E',
                  background: '#FEF3C7',
                  border: '1px solid #F59E0B',
                  borderRadius: '8px',
                  padding: '6px 10px'
                }}>
                  {audioDownloadError}
                </div>
              )}

              <button
                onClick={() => {
                  const blob = new Blob([
                    `AYUSWAR AI — VERNACULAR SPOKEN AUDIO-RX\n\n` +
                    `Patient: ${patient.name} (${patient.abhaId})\n` +
                    `Doctor: ${doctorName}\n` +
                    `Language: ${currentRx.langLabel}\n` +
                    `Timestamp: ${new Date().toLocaleString()}\n\n` +
                    `--- SAMPLE VOICE NOTE TEXT ---\n` +
                    `${currentRx.speechText}\n\n` +
                    `--- SAMPLE SCHEDULE PREVIEW ---\n` +
                    `Morning: sample item (${morningMealEnglish} / ${morningTime})\n` +
                    `Night: sample item (${nightMealEnglish} / ${nightTime})\n\n` +
                    `Synthetic demo record for doctor review. No ABDM, HPR, or live dispatch verification is claimed.`
                  ], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `AyuSwar_AudioRx_${patient.name.replace(/\s+/g, '_')}_Transcript.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '10px 8px',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.06)',
                  color: '#0F4C5C',
                  border: '1.5px solid rgba(0, 0, 0, 0.16)',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <FileText size={13} />
                <span>Notes (.txt)</span>
              </button>
            </div>

            {sendSuccessToast && (
              <div style={{
                background: '#ECFDF5',
                border: '1.5px solid #047857',
                padding: '10px 16px',
                borderRadius: '10px',
                color: '#065F46',
                fontSize: '12.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} color="#047857" />
                <span>Preview simulation finished. This does not prove WhatsApp delivery or read receipts.</span>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Realistic Mobile WhatsApp Chat Simulation Frame */}
          <div className="whatsapp-modal-preview-pane" style={{
            background: '#E5DDD5',
            backgroundImage: 'radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* WhatsApp Phone Mockup Container */}
            <div style={{
              width: '100%',
              maxWidth: '380px',
              background: '#E5DDD5',
              borderRadius: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2), 0 0 0 8px #1E293B',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '620px'
            }}>
              {/* WhatsApp App Top Bar */}
              <div style={{
                background: '#075E54',
                padding: '12px 14px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ position: 'relative', width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', background: '#ffffff' }}>
                    <img 
                      src="/assets/dr_ananya_avatar.jpg" 
                      alt="Doctor" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                        AyuSwar OPD Preview
                      </span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#A7F3D0' }}>
                      Synthetic preview • no live health-record dispatch
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff' }}>
                  <Phone size={16} />
                  <Info size={16} />
                </div>
              </div>

              {/* WhatsApp Chat Area */}
              <div style={{
                flex: 1,
                padding: '16px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflowY: 'auto'
              }}>
                {/* Security encryption pill */}
                <div style={{
                  alignSelf: 'center',
                  background: '#FCF4CB',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '9.5px',
                  color: '#54656F',
                  textAlign: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  maxWidth: '90%'
                }}>
 Preview only - synthetic demo record; live ABDM record and WhatsApp delivery are not established
                </div>

                {/* Received WhatsApp Voice Note Bubble */}
                <div style={{
                  alignSelf: 'flex-start',
                  background: '#ffffff',
                  borderRadius: '12px 12px 12px 2px',
                  padding: '10px 12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  maxWidth: '92%',
                  border: isPlayingAudio ? '1.5px solid #25D366' : '1px solid #D0DFE2'
                }}>
                  {/* Doctor Voice Note Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#0F4C5C',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    onClick={togglePlayAudio}
                    >
                      {isPlayingAudio ? <Pause size={16} fill="#ffffff" /> : <Play size={16} fill="#ffffff" style={{ marginLeft: '2px' }} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#075E54' }}>
                          Text/audio preview ({currentRx.langLabel.split(' ')[0]})
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#92400E', background: '#FEF3C7', border: '1px solid #D4AF37', borderRadius: '6px', padding: '1px 6px' }}>
                          audio not verified
                        </span>
                      </div>

                      {/* Oscillating Audio Waveform */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '18px', marginTop: '4px' }}>
                        {[6, 12, 18, 10, 16, 22, 14, 8, 20, 16, 10, 14, 18, 12, 8, 16, 22, 14, 10, 16, 12, 8].map((h, i) => {
                          const isBarActive = (i / 22) * 100 <= audioProgress;
                          return (
                            <span
                              key={i}
                              style={{
                                width: '3px',
                                height: isPlayingAudio ? `${Math.max(4, (h * (0.6 + ((h * 11) % 7) * 0.1)))}px` : `${h}px`,
                                background: isBarActive ? '#25D366' : '#94A3B8',
                                borderRadius: '2px',
                                transition: 'height 0.1s'
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '10.5px', color: '#54656F', borderTop: '1px solid #F1F5F9', paddingTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
 <span> Preview text in {currentRx.langLabel}; no current generated-audio proof</span>
 <span style={{ color: '#075E54', fontWeight: 800, fontSize: '9.5px'}}>✓✓ Preview simulation only</span>
                  </div>
                </div>

                {/* Accompanying Visual Schedule Text Message Bubble */}
                <div style={{
                  alignSelf: 'flex-start',
                  background: '#ffffff',
                  borderRadius: '12px 12px 12px 2px',
                  padding: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  maxWidth: '92%',
                  fontSize: '11.5px',
                  lineHeight: 1.5,
                  color: '#111B21'
                }}>
                  <div style={{ fontWeight: 800, color: '#075E54', marginBottom: '4px' }}>
 AyuSwar Sample Audio-Rx
                  </div>
                  <div style={{ fontSize: '11px', color: '#486770', marginBottom: '8px' }}>
                    Patient: <strong>{patient.name}</strong> • Dr. Demo Clinician (synthetic)
                  </div>

                  <div style={{ background: '#FFFBEB', padding: '6px 8px', borderRadius: '6px', marginBottom: '6px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <strong>{selectedLanguage === 'te' ? 'పసుపు రంగు (Morning)' : (selectedLanguage === 'hi' ? 'पीली गोली (Morning)' : 'Yellow Pill (Morning)')}:</strong> Sample morning item (1 {selectedLanguage === 'te' ? 'గోళీ' : 'sample'} {selectedLanguage === 'te' ? morningMealTelugu : (selectedLanguage === 'hi' ? morningMealHindi : morningMealEnglish)} - {morningTime})
                  </div>

                  <div style={{ background: '#FDF2F8', padding: '6px 8px', borderRadius: '6px', marginBottom: '8px', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                    <strong>{selectedLanguage === 'te' ? 'గులాబీ రంగు (Night)' : (selectedLanguage === 'hi' ? 'गुलाबी गोली (Night)' : 'Pink Pill (Night)')}:</strong> Sample evening item (1 {selectedLanguage === 'te' ? 'గోళీ' : 'sample'} {selectedLanguage === 'te' ? nightMealTelugu : (selectedLanguage === 'hi' ? nightMealHindi : nightMealEnglish)} - {nightTime})
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#667781', marginTop: '6px' }}>
                    <span>10:42 AM</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: deliveryStatus === 'preview-complete' ? '#53BDEB' : '#8696A0' }}>
                      <CheckCheck size={14} />
                    </span>
                  </div>
                </div>

                {/* Interactive Audio-Rx Web Link Card */}
                <div style={{
                  alignSelf: 'flex-start',
                  background: '#ffffff',
                  borderRadius: '12px 12px 12px 2px',
                  padding: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                  maxWidth: '92%',
                  border: '1px solid #D0DFE2',
                  cursor: 'pointer'
                }}
                onClick={togglePlayAudio}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '40px', height: '40px', background: '#0A2540', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                      <Volume2 size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#081C24' }}>
                        Tap to Replay Spoken Audio-Rx
                      </div>
                      <div style={{ fontSize: '10px', color: '#52707C' }}>
                        ayuswar-demo/rx/DEMO-RX-001
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Fake Input Bar */}
              <div style={{
                background: '#F0F2F5',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  flex: 1,
                  background: '#ffffff',
                  borderRadius: '20px',
                  padding: '8px 14px',
                  fontSize: '11.5px',
                  color: '#52707C'
                }}>
                  Local preview input only...
                </div>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#00A884',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Volume2 size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          background: '#ffffff',
          padding: '14px 28px',
          borderTop: '1px solid #D0DFE2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#52707C'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#047857" />
            <span>Synthetic prototype • Groq/TTS use external services when available • no active ABDM/FHIR exchange verified</span>
          </div>

          <button
            onClick={() => { stopAudio(); onClose(); }}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: '1px solid #D0DFE2',
              background: '#ffffff',
              color: '#2C4A52',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
