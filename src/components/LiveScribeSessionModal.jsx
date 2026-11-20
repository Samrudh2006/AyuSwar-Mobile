import { exportTextFile } from '../services/exportFileService';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Mic,
  MicOff,
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  Volume2,
  ShieldCheck,
  Activity,
  Pill,
  FileText,
  Send,
  RotateCcw,
  Cpu,
  Heart,
  AlertTriangle,
  Smartphone,
  ExternalLink,
  Download,
  Layers,
  Globe,
  ArrowRight
} from 'lucide-react';
import WhatsAppAudioRxModal from './WhatsAppAudioRxModal';
import { CLINICAL_ENCOUNTERS } from '../data/clinicalEncounters';
import { checkDrugInteractions, generateAbdmFhirR4Bundle } from '../data/clinicalSafetySentinel';
import { reasonClinicalNoteWithEvon, EVON_MODEL_METADATA } from '../services/gnaniEvonService';
import { speechService } from '../services/indicSpeechService';
import { resolveIndicVernacular } from '../data/indicVernacularOntology';
import EvonStatusChip from './EvonStatusChip';

/**
 * LiveScribeSessionModal Component
 * In-Situ Ambient Voice Scribe Live Session Studio for Doctor Portal.
 * Eliminates full-page redirects by opening directly over the Doctor Portal.
 * Features:
 * 1. Dual-speaker diarization telemetry (Doctor in Cyan, Patient in Amber).
 * 2. Live WebAudio STFT spectrum & 16kHz PCM audio buffer simulation.
 * 3. Real-time Indic draft-term extraction (sample coding candidates, simulated acoustic signal features).
 * 4. Local documentation draft; no auto-generated prescription or formulary verification.
 * 5. Local review acknowledgement and share-preview launcher.
 */
export default function LiveScribeSessionModal({
  isOpen,
  onClose,
  patientData,
  doctorName = 'Dr. Demo Clinician (synthetic)',
  onCompleteEncounter,
  onSwitchToWizard
}) {
  const safePatient = patientData || {
    name: 'Narayana Rao',
    vernacular: 'నారాయణ రావు',
    token: 'OPD-101',
    age: 58,
    gender: 'Male',
    language: 'Telugu',
    domain: 'cardiometabolic'
  };

  const [isRecording, setIsRecording] = useState(false);
  const [micMode, setMicMode] = useState('physical_mic'); // Default to live mic on standby
  const [currentStep, setCurrentStep] = useState(0);
  const [dialogueList, setDialogueList] = useState([]);
  const [micVolume, setMicVolume] = useState(35);
  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 860 : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth <= 860);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [isSynthesizingRx, setIsSynthesizingRx] = useState(false);
  const [isRxSigned, setIsRxSigned] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [liveTranscriptInterim, setLiveTranscriptInterim] = useState('');
  const [evonReasoning, setEvonReasoning] = useState(null);
  const [isReasoningWithEvon, setIsReasoningWithEvon] = useState(false);
  const [showEvonDrawer, setShowEvonDrawer] = useState(false);

  // Gnani Prisma v3 STT & Speech Service Status
  const [gnaniSpeechStatus, setGnaniSpeechStatus] = useState(null);
  const [hasGnaniSttTranscribed, setHasGnaniSttTranscribed] = useState(false);
  const [isTranscribingChunk, setIsTranscribingChunk] = useState(false);
  const [lastSttError, setLastSttError] = useState(null);

  const dialogueIntervalRef = useRef(null);
  const micIntervalRef = useRef(null);
  const speechRecognizerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioStreamRef = useRef(null);
  const chunkIntervalRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Check Gnani operational status on mount
  useEffect(() => {
    speechService.checkGnaniStatus().then(status => {
      setGnaniSpeechStatus(status);
    });
  }, []);

  // Scripted clinical encounters based on patient
  const encounterPresets = {
    cardiometabolic: {
      dialogueSequence: [
        { speaker: 'Doctor', lang: 'Telugu', text: 'నమస్కారం. ఈ నమూనా రికార్డింగ్ కేవలం డాక్యుమెంటేషన్ పరీక్ష కోసం.' },
        { speaker: 'Patient', lang: 'Telugu', text: 'నేను నా సమస్య గురించి వివరిస్తాను.' },
        { speaker: 'Doctor', lang: 'Telugu', text: 'ఈ డెమోలో వ్యాధి నిర్ధారణ, మందు, మోతాదు లేదా చికిత్స సూచన ఇవ్వబడదు.' },
        { speaker: 'Patient', lang: 'Telugu', text: 'అర్థమైంది, ఇది నమూనా రికార్డింగ్ మాత్రమే.' },
        { speaker: 'Doctor', lang: 'Telugu', text: 'అసలు నిర్ణయానికి అర్హత కలిగిన వైద్యుడు సమీక్ష అవసరం.' }
      ],
      vitals: { bp: 'Not recorded', hr: 'Not recorded', spo2: 'Not recorded', temp: 'Not recorded', rbs: 'Not recorded' },
      biomarkers: { coughIndex: 'Sample visualization only', dyspneaScore: 'No risk score generated', wheezeDetection: 'No clinical interpretation' },
      icdMappings: [
        { colloquial: 'నమూనా స్థానిక పదం', clinical: 'Sample term for clinician review', icd10: 'DRAFT-CODE', snomed: 'DRAFT-CODE' }
      ],
      prescriptions: [],
      spokenTeluguRx: 'ఇది నమూనా ఆడియో నోట్ మాత్రమే. మందుల సూచన ఇవ్వబడలేదు. అర్హత కలిగిన వైద్యుడు సమీక్షించిన సూచనలను మాత్రమే అనుసరించండి.'
    },
    respiratory: {
      dialogueSequence: [
        { speaker: 'Doctor', lang: 'Hindi', text: 'नमस्ते। यह नमूना रिकॉर्डिंग केवल दस्तावेज़ समीक्षा के लिए है।' },
        { speaker: 'Patient', lang: 'Hindi', text: 'मैं अपनी समस्या के बारे में बताऊँगा।' },
        { speaker: 'Doctor', lang: 'Hindi', text: 'इस डेमो में निदान, दवा, खुराक या उपचार निर्देश नहीं दिया जाएगा।' },
        { speaker: 'Patient', lang: 'Hindi', text: 'समझ गया, यह केवल नमूना रिकॉर्डिंग है।' },
        { speaker: 'Doctor', lang: 'Hindi', text: 'किसी भी वास्तविक निर्णय से पहले योग्य चिकित्सक की समीक्षा आवश्यक है।' }
      ],
      vitals: { bp: 'Not recorded', hr: 'Not recorded', spo2: 'Not recorded', temp: 'Not recorded', rbs: 'Not recorded' },
      biomarkers: { coughIndex: 'Sample visualization only', dyspneaScore: 'No risk score generated', wheezeDetection: 'No clinical interpretation' },
      icdMappings: [
        { colloquial: 'नमूना स्थानीय शब्द', clinical: 'Sample term for clinician review', icd10: 'DRAFT-CODE', snomed: 'DRAFT-CODE' }
      ],
      prescriptions: [],
      spokenTeluguRx: 'यह केवल नमूना ऑडियो नोट है। कोई दवा या खुराक का निर्देश नहीं दिया गया है। कृपया योग्य चिकित्सक की समीक्षित सूचनाओं का पालन करें।'
    }
  };

  const encFromList = (safePatient?.encounterIndex !== undefined && CLINICAL_ENCOUNTERS[safePatient.encounterIndex])
    ? CLINICAL_ENCOUNTERS[safePatient.encounterIndex]
    : CLINICAL_ENCOUNTERS.find(e => safePatient?.language && e.language.toLowerCase().includes(safePatient.language.toLowerCase()));

  const dynamicEncounterData = encFromList ? {
    dialogueSequence: encFromList.dialogue.map(d => ({
      speaker: d.speaker,
      lang: encFromList.language,
      text: d.text
    })),
    vitals: {
      bp: encFromList.vitals.bp,
      hr: encFromList.vitals.heartRate,
      spo2: encFromList.vitals.spo2,
      temp: encFromList.vitals.temp,
      rbs: encFromList.vitals.bloodSugar
    },
    biomarkers: {
      coughIndex: encFromList.acousticBiomarkers?.coughType || '0.12 (Normal)',
      dyspneaScore: encFromList.acousticBiomarkers?.respiratoryEffort || 'Grade-1 Mild',
      wheezeDetection: encFromList.acousticBiomarkers?.vocalTremor || 'None'
    },
    icdMappings: encFromList.vernacularMappings.map(v => ({
      colloquial: v.dialect,
      clinical: v.clinicalTerm,
      icd10: v.icd10,
      snomed: v.snomed
    })),
    prescriptions: encFromList.medications.map(m => ({
      name: m.name,
      type: m.type,
      color: m.color,
      colorLabel: m.colorLabel,
      timing: m.timing,
      meal: m.dose,
      days: m.duration
    })),
    spokenTeluguRx: encFromList.fullAudioRxTelugu
  } : null;

  const domainKey = safePatient?.domain || ((safePatient?.age || 0) < 15 ? 'respiratory' : 'cardiometabolic');
  const baseEncounterData = dynamicEncounterData || encounterPresets[domainKey] || encounterPresets.cardiometabolic;
  const encounterData = {
    ...baseEncounterData,
    diagnosis: 'Documentation draft (no diagnosis generated)',
    prescriptions: [],
    spokenTeluguRx: 'This is a sample voice note only. It contains no medicine instruction. Follow only instructions reviewed by a qualified clinician.'
  };

  // Live dynamic Indic ontology extraction from spoken dialogue
  const allSpokenText = dialogueList.map(d => d.text).join(' ') + ' ' + (liveTranscriptInterim || '');
  const dynamicallyResolvedOntology = useMemo(() => {
    if (!allSpokenText.trim()) return [];
    const matches = resolveIndicVernacular(allSpokenText);
    return matches.map(m => ({
      colloquial: `${m.vernacular} (${m.transliteration})`,
      clinical: m.clinicalTerm,
      icd10: m.icd10,
      snomed: m.snomed,
      severity: m.severity,
      guideline: m.guideline,
      isLiveExtracted: true
    }));
  }, [allSpokenText]);

  // Combined with presets so both live spoken terms and encounter mappings are available
  const displayIcdMappings = useMemo(() => {
    const list = [...dynamicallyResolvedOntology];
    const presets = encounterData?.icdMappings || [];
    presets.forEach(preset => {
      if (!list.some(item => item.icd10 === preset.icd10)) {
        list.push(preset);
      }
    });
    return list;
  }, [dynamicallyResolvedOntology, encounterData]);

  // Helper to send recorded audio chunk to serverless Gnani STT endpoint
  const sendChunkToGnani = async (blob) => {
    if (!blob || blob.size < 500) return;
    setIsTranscribingChunk(true);
    setLastSttError(null);
    const targetLang = encFromList?.langCode || (safePatient?.language?.toLowerCase().includes('hindi') ? 'hi-IN' : 'te-IN');
    try {
      const res = await speechService.transcribeAudioWithGnani(blob, targetLang);
      if (res && res.transcript && res.transcript.trim()) {
        const isDraft = Boolean(res.draft);
        if (!isDraft) setHasGnaniSttTranscribed(true);
        setDialogueList(prev => [...prev, {
          speaker: isDraft ? 'Doctor (Local on-device DRAFT - review required)' : 'Doctor (Gnani STT - Live)',
          lang: safePatient.language || 'Telugu',
          text: res.transcript.trim(),
          isGnaniLive: !isDraft,
          isLocalDraft: isDraft
        }]);
      } else if (res?.fallbackRequired) {
        // Gnani unavailable or key unset, keep fallback active
      }
    } catch (err) {
      console.warn('Gnani STT chunk error:', err);
      setLastSttError(err.message);
    } finally {
      setIsTranscribingChunk(false);
    }
  };

  // Manual trigger to force transcribe current chunk immediately
  const handleTranscribeCurrentChunk = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.requestData();
    }
  };

  // Physical Microphone Pipeline: Gnani STT Chunking with Fallback to Browser SpeechRecognition
  useEffect(() => {
    if (micMode !== 'physical_mic' || !isRecording) {
      // Clean up physical recording pipelines
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
        chunkIntervalRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) { }
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => { try { t.stop(); t.enabled = false; } catch { } });
        audioStreamRef.current = null;
      }
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.onresult = null;
        speechRecognizerRef.current.onerror = null;
        speechRecognizerRef.current.onend = null;
        try { speechRecognizerRef.current.abort(); } catch (e) { }
        speechRecognizerRef.current = null;
      }
      return;
    }

    let isMounted = true;
    const targetLang = safePatient.language?.toLowerCase().includes('hindi') ? 'hi-IN' : 'te-IN';

    // Fallback: Browser Web Speech API
    const startBrowserSpeechFallback = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = targetLang;

        recognition.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const text = event.results[i][0].transcript;
              setDialogueList(prev => [...prev, {
                speaker: 'Doctor (Browser WebSpeech Fallback)',
                lang: 'Indic',
                text: text,
                isGnaniLive: false
              }]);
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setLiveTranscriptInterim(interim);
        };

        recognition.onerror = (e) => {
          console.warn('Browser SpeechRecognition error:', e);
        };

        recognition.start();
        speechRecognizerRef.current = recognition;
      } catch (err) {
        console.warn('Browser SpeechRecognition init error:', err);
      }
    };

    // If Gnani is available on server, initiate MediaRecorder audio chunk pipeline
    if (gnaniSpeechStatus?.available && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        audioStreamRef.current = stream;

        try {
          const recorder = new MediaRecorder(stream);
          recordedChunksRef.current = [];

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              recordedChunksRef.current.push(e.data);
              // Process chunk
              const audioBlob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
              recordedChunksRef.current = [];
              sendChunkToGnani(audioBlob);
            }
          };

          recorder.start();
          mediaRecorderRef.current = recorder;

          // Request chunk slice every 4 seconds for continuous Indic ASR
          chunkIntervalRef.current = setInterval(() => {
            if (recorder && recorder.state === 'recording') {
              recorder.requestData();
            }
          }, 4000);
        } catch (e) {
          console.warn('MediaRecorder init failed, falling back to browser speech:', e);
          startBrowserSpeechFallback();
        }
      }).catch(err => {
        console.warn('getUserMedia failed, falling back to browser speech:', err);
        startBrowserSpeechFallback();
      });
    } else {
      // Gnani key unset on server: safe browser speech fallback
      startBrowserSpeechFallback();
    }

    return () => {
      isMounted = false;
      if (chunkIntervalRef.current) {
        clearInterval(chunkIntervalRef.current);
        chunkIntervalRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) { }
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => { try { t.stop(); t.enabled = false; } catch { } });
        audioStreamRef.current = null;
      }
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.onresult = null;
        speechRecognizerRef.current.onerror = null;
        speechRecognizerRef.current.onend = null;
        try { speechRecognizerRef.current.abort(); } catch (e) { }
        speechRecognizerRef.current = null;
      }
    };
  }, [micMode, isRecording, gnaniSpeechStatus]);

  // Stream dialogue automatically when recording in simulated mode
  useEffect(() => {
    if (isRecording && micMode === 'ambient_sim') {
      setDialogueList([encounterData.dialogueSequence[0]]);
      setCurrentStep(1);

      dialogueIntervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < encounterData.dialogueSequence.length) {
            setDialogueList(list => [...list, encounterData.dialogueSequence[prev]]);
            return prev + 1;
          } else {
            clearInterval(dialogueIntervalRef.current);
            setIsRecording(false);
            return prev;
          }
        });
      }, 2600);

      micIntervalRef.current = setInterval(() => {
        setMicVolume(Math.floor(25 + Math.random() * 60));
      }, 120);
    }

    return () => {
      if (dialogueIntervalRef.current) clearInterval(dialogueIntervalRef.current);
      if (micIntervalRef.current) clearInterval(micIntervalRef.current);
    };
  }, [isRecording, micMode]);

  const handleRunEvonReasoning = async () => {
    setIsReasoningWithEvon(true);
    const transcriptText = dialogueList.map(d => `${d.speaker}: ${d.text}`).join('\n') ||
      'నమస్కారం డాక్టర్, 4 రోజుల నుంచి ఛాతీలో బరువుగా ఉంది, మెట్లు ఎక్కితే ఆయాసం వస్తోంది.';
    try {
      const res = await reasonClinicalNoteWithEvon(transcriptText, patientData);
      setEvonReasoning(res);
      setShowEvonDrawer(true);
    } catch (err) {
      console.warn('Evon reasoning error:', err);
    } finally {
      setIsReasoningWithEvon(false);
    }
  };

  const handleSignPrescription = () => {
    setIsSynthesizingRx(true);
    setTimeout(() => {
      setIsSynthesizingRx(false);
      setIsRxSigned(true);
      setShowWhatsAppModal(true);
      if (onCompleteEncounter) onCompleteEncounter(safePatient);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(6, 22, 38, 0.88)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: isMobileScreen ? '8px' : '20px',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: '1200px',
        maxHeight: '94vh',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 30px 70px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.15)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Studio Header Bar */}
        <div style={{
          background: '#0F4C5C',
          padding: isMobileScreen ? '14px 16px' : '18px 28px',
          color: '#ffffff',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: isRecording ? '#B91C1C' : '#0F4C5C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isRecording ? '0 0 18px rgba(239, 68, 68, 0.6)' : 'none',
              animation: isRecording ? 'pulse 1.5s infinite' : 'none'
            }}>
              {isRecording ? <Mic size={24} color="#ffffff" /> : <Cpu size={24} color="#ffffff" />}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: isMobileScreen ? '16px' : '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px', fontFamily: 'var(--font-main)', color: '#ffffff' }}>
                  Live Ambient Voice Scribe Studio
                </h2>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  background: isRecording ? '#B91C1C' : '#047857',
                  color: '#ffffff',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  letterSpacing: '0.5px'
                }}>
                  {isRecording ? 'LIVE AMBIENT STREAMING' : 'AUDIO PROCESSED • NLP READY'}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#D0DFE2', margin: '3px 0 0 0' }}>
                Patient: <strong>{safePatient.name}</strong> ({safePatient.vernacular || 'నారాయణ'}) • Token #{safePatient.token || 'OPD-101'} • Attending: {doctorName}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: isMobileScreen ? 'flex-start' : 'flex-end' }}>
            {/* Physical Mic vs Simulated Stream Toggle */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)' }}>
              <button
                onClick={() => setMicMode('ambient_sim')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: micMode === 'ambient_sim' ? '#0F4C5C' : 'transparent',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
 Simulated Stream
              </button>

              <button
                onClick={() => setMicMode('physical_mic')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: micMode === 'physical_mic' ? '#B91C1C' : 'transparent',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Mic size={12} />
 <span> Live Laptop Mic</span>
              </button>
            </div>

            {/* Configured draft-note action and service status chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleRunEvonReasoning}
                disabled={isReasoningWithEvon}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  background: '#0F172A',
                  border: '1px solid #047857',
                  color: '#34D399',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
                title="Run configured draft-note reasoning; no diagnosis or prescription is generated"
              >
                <Cpu size={13} />
 <span>{isReasoningWithEvon ? 'Evon Reasoning...': 'Draft Note Review'}</span>
              </button>
              <EvonStatusChip compact={true} />
            </div>

            <button
              onClick={() => setIsRecording(!isRecording)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                border: isRecording ? '1px solid #B91C1C' : '1px solid #047857',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
              <span>{isRecording ? 'Pause' : 'Resume'}</span>
            </button>

            {/* Switch to 4-Step Master Clinical Wizard */}
            <button
              onClick={() => {
                if (onSwitchToWizard) {
                  onSwitchToWizard(safePatient?.encounterIndex ?? 0);
                } else {
                  window.location.href = `/clinical-console?encounter=${safePatient?.encounterIndex ?? 0}`;
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.15)',
                border: '1px solid #FDE047',
                color: '#FDE047',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Switch to Sequential 4-Step Master Wizard View"
            >
              <Layers size={13} />
              <span>4-Step Wizard View</span>
            </button>

            <button
              onClick={onClose}
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
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Asymmetric Cross-Lingual Language Bridge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobileScreen ? '8px 12px' : '8px 20px',
          background: '#0B3540',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#94A3B8'
            }}>
              <Sparkles size={13} color="#F59E0B" />
              <span>Doctor & Patient Input:</span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34D399',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '11px'
              }}>
                ● Auto-Detect Dialect Active
              </span>
            </div>
            <ArrowRight size={14} color="#52707C" />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#D0DFE2',
              fontWeight: 700,
              flexWrap: 'wrap'
            }}>
              <Volume2 size={13} color="#38BDF8" />
              <span>Patient Vernacular Voice-Rx:</span>
              <span style={{
                background: 'rgba(56, 189, 248, 0.18)',
                color: '#38BDF8',
                padding: '2px 10px',
                borderRadius: '6px',
                fontWeight: 800,
                border: '1px solid rgba(56, 189, 248, 0.35)'
              }}>
                {safePatient.language || 'Telugu / Mother Tongue'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94A3B8' }}>
 <span style={{ color: '#D4AF37', fontWeight: 700 }}> Asymmetric Translation:</span>
            <span>Doctor speaks English/clinical jargon; patient receives audio in native mother tongue</span>
          </div>
        </div>

        {/* Studio Content (3 Column Grid: Dialogue Stream | Telemetry & Biomarkers | e-Prescription Draft) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobileScreen ? '1fr' : '1.2fr 1fr 1.1fr',
          flex: 1,
          overflowY: 'auto',
          background: '#FAF8F5'
        }}>

          {/* COLUMN 1: Ambient Multi-Speaker Dialogue Stream */}
          <div style={{ padding: isMobileScreen ? '14px' : '20px', borderRight: isMobileScreen ? 'none' : '1px solid #D0DFE2', borderBottom: isMobileScreen ? '1px solid #D0DFE2' : 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#52707C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Dual-Speaker Diarization (16 kHz PCM)
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 750,
                color: hasGnaniSttTranscribed ? '#047857' : gnaniSpeechStatus?.available ? '#0F4C5C' : '#52707C',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                {hasGnaniSttTranscribed ? (
                  <span>Configured STT Returned Transcript</span>
                ) : gnaniSpeechStatus?.available ? (
                  <span>Configured STT Available</span>
                ) : (
                  <span>Browser Web Speech Fallback (GNANI_API_KEY unset)</span>
                )}
              </span>
            </div>

            {/* Simulated Live Spectrogram */}
            <div style={{
              background: '#061626',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Activity size={16} color="#2DD4BF" />
                <span style={{ fontSize: '11px', color: '#2DD4BF', fontFamily: 'monospace' }}>
                  WebAudio STFT Real-time Spectrum
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '24px' }}>
                {[12, 24, 16, 32, 28, 14, 20, 36, 18, 28, 22, 14, 30, 26, 18, 24].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      width: '3px',
                      height: isRecording ? `${Math.max(4, (h * (micVolume / 45)))}px` : '4px',
                      background: i % 2 === 0 ? '#2DD4BF' : '#F59E0B',
                      borderRadius: '2px',
                      transition: 'height 0.1s ease'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Physical Mic Active Banner / Quick Transcribe Action */}
            {micMode === 'physical_mic' && (
              <div style={{
                background: gnaniSpeechStatus?.available ? '#F0FDF4' : '#F8FAFC',
                border: `1px solid ${gnaniSpeechStatus?.available ? '#86EFAC' : '#D0DFE2'}`,
                borderRadius: '10px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <span style={{ fontSize: '13px', color: gnaniSpeechStatus?.available ? '#166534' : '#94A3B8' }}>{gnaniSpeechStatus?.available ? '●' : '○'}</span>
                  <span style={{ color: gnaniSpeechStatus?.available ? '#166534' : '#486770', fontWeight: 700 }}>
                    {hasGnaniSttTranscribed
                      ? 'Configured STT Returned Transcript'
                      : gnaniSpeechStatus?.available
                        ? (isTranscribingChunk ? 'Transcribing audio chunk with Gnani STT...' : 'Configured STT Active (Streaming 4s chunks)')
                        : 'Safe Browser WebSpeech API Fallback (GNANI_API_KEY unset on server)'}
                  </span>
                </div>
                {gnaniSpeechStatus?.available && (
                  <button
                    onClick={handleTranscribeCurrentChunk}
                    disabled={isTranscribingChunk}
                    style={{
                      background: '#15803D',
                      color: '#ffffff',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '10.5px',
                      fontWeight: 750,
                      cursor: 'pointer'
                    }}
                    title="Send current microphone chunk to /api/gnani/stt"
                  >
 {isTranscribingChunk ? 'Transcribing...': 'Transcribe Chunk'}
                  </button>
                )}
              </div>
            )}

            {/* Real-time Dialogue Bubbles */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minHeight: '360px',
              maxHeight: '440px'
            }}>
              {dialogueList.length === 0 && !liveTranscriptInterim && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: '#ffffff',
                  borderRadius: '14px',
                  border: '2px dashed #D0DFE2',
                  margin: 'auto 0',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(0, 0, 0, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Mic size={24} color="#0F4C5C" />
                  </div>
                  <h3 style={{ fontSize: '14.5px', fontWeight: 800, color: '#091E26', margin: 0 }}>
                    Consultation Room on Standby
                  </h3>
                  <p style={{ fontSize: '12px', color: '#52707C', maxWidth: '320px', margin: 0, lineHeight: 1.5 }}>
                    {micMode === 'physical_mic'
                      ? (isRecording
 ? 'Listening to your microphone... Speak clearly and live doctor-patient turns will appear here in real-time!'
                        : 'Microphone is ready. Click "Resume" or "Start Recording" and speak into your laptop mic.')
 : 'Click "Start Recording" to stream the simulated encounter, or switch to " Live Laptop Mic" above to speak live.'}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button
                      onClick={() => {
                        setMicMode('physical_mic');
                        setIsRecording(true);
                      }}
                      style={{
                        background: '#0F4C5C',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Mic size={14} />
                      <span>Start Live Laptop Mic</span>
                    </button>
                    <button
                      onClick={() => {
                        setMicMode('ambient_sim');
                        setIsRecording(true);
                        setDialogueList([encounterData.dialogueSequence[0]]);
                        setCurrentStep(1);
                      }}
                      style={{
                        background: '#FAF8F5',
                        color: '#486770',
                        border: '1px solid #D0DFE2',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                    >
 Load Demo Simulation
                    </button>
                  </div>
                </div>
              )}

              {dialogueList.map((item, idx) => {
                const isDoc = typeof item.speaker === 'string' && item.speaker.startsWith('Doctor');
                return (
                  <div
                    key={idx}
                    style={{
                      alignSelf: isDoc ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                      background: isDoc ? '#0A2540' : '#ffffff',
                      color: isDoc ? '#ffffff' : '#1E293B',
                      borderRadius: isDoc ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      padding: '12px 16px',
                      border: isDoc ? 'none' : '1px solid #D0DFE2',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                      animation: 'slideUp 0.25s ease-out'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 800, color: isDoc ? '#2DD4BF' : '#B45309' }}>
                          {item.speaker} {item.lang ? `(${item.lang})` : ''}
                        </span>
                        {item.isGnaniLive && (
                          <span style={{
                            fontSize: '9px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#047857',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontWeight: 800
                          }}>
                            GNANI STT LIVE
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '9.5px', opacity: 0.7 }}>00:0{idx * 4 + 2}</span>
                    </div>
                    <div style={{ fontSize: '13px', lineHeight: 1.5, fontWeight: 550 }}>
                      {item.text}
                    </div>
                  </div>
                );
              })}

              {liveTranscriptInterim && (
                <div style={{
                  alignSelf: 'flex-start',
                  maxWidth: '88%',
                  background: 'rgba(0, 0, 0, 0.06)',
                  color: '#0F4C5C',
                  borderRadius: '14px 14px 14px 2px',
                  padding: '10px 14px',
                  border: '1.5px dashed #0F4C5C',
                  fontSize: '12.5px',
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#B91C1C', animation: 'pulse 1s infinite' }} />
                  <span>{liveTranscriptInterim}...</span>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: Clinical Telemetry, Biomarkers & Ontology */}
          <div style={{ padding: isMobileScreen ? '14px' : '20px', borderRight: isMobileScreen ? 'none' : '1px solid #D0DFE2', borderBottom: isMobileScreen ? '1px solid #D0DFE2' : 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#52707C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Extracted Vitals & Biomarkers
            </div>

            {/* Vitals Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #D0DFE2' }}>
                <div style={{ fontSize: '10px', color: '#52707C' }}>Blood Pressure</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#081C24' }}>{encounterData.vitals.bp}</div>
              </div>
              <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #D0DFE2' }}>
                <div style={{ fontSize: '10px', color: '#52707C' }}>Heart Rate / SpO2</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F4C5C' }}>{encounterData.vitals.hr} • {encounterData.vitals.spo2}</div>
              </div>
            </div>

            {/* Acoustic Biomarkers */}
            <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #D0DFE2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Activity size={14} color="#0F4C5C" />
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#081C24' }}>Simulated Acoustic Signal Features</span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#486770', lineHeight: 1.6 }}>
                <div>• Sample cough metric: <strong>{encounterData.biomarkers.coughIndex}</strong></div>
                <div>• Sample breathing metric: <strong>{encounterData.biomarkers.dyspneaScore}</strong></div>
                <div>• Sample wheeze metric: <strong>{encounterData.biomarkers.wheezeDetection}</strong></div>
              </div>
            </div>

            {/* Vernacular term to draft coding candidate */}
            <div style={{ background: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #D0DFE2', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Sparkles size={14} color="#B45309" />
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#081C24' }}>Colloquial → Draft Coding Candidates</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dialogueList.length === 0 ? (
                  <div style={{ padding: '18px 12px', textAlign: 'center', background: '#FAF8F5', borderRadius: '8px', border: '1px dashed #D0DFE2', color: '#52707C', fontSize: '11px', lineHeight: 1.5 }}>
                    <Sparkles size={16} color="#B45309" style={{ margin: '0 auto 6px auto', display: 'block' }} />
                    Awaiting speech input... Regional sample phrases will appear as draft coding candidates for clinician review.
                  </div>
                ) : (
                  displayIcdMappings.map((icd, i) => (
                    <div key={i} style={{ background: icd.isLiveExtracted ? '#F0FDF4' : '#FAF8F5', padding: '8px 10px', borderRadius: '8px', border: icd.isLiveExtracted ? '1px solid #86EFAC' : '1px solid #D0DFE2', transition: 'all 0.3s ease' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: 750, color: '#0F4C5C' }}>{icd.colloquial}</div>
                        {icd.isLiveExtracted && (
                          <span style={{ fontSize: '9px', fontWeight: 800, background: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '4px' }}>
 DRAFT CANDIDATE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#1E293B', fontWeight: 600 }}>{icd.clinical}</div>
                      <div style={{ fontSize: '10px', color: '#52707C', fontFamily: 'monospace', marginTop: '2px' }}>
                        <code>{icd.icd10}</code> • <code>Draft terminology: {icd.snomed}</code>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 3: Documentation Draft & Local Share Preview */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#52707C', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AI-Drafted Documentation
              </div>
              <span style={{ fontSize: '10.5px', color: '#047857', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '8px', fontWeight: 700 }}>
                NO PRESCRIPTION GENERATED
              </span>
            </div>

            {/* Prescribed Items Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dialogueList.length === 0 ? (
                <div style={{ padding: '24px 14px', textAlign: 'center', background: '#FAF8F5', borderRadius: '10px', border: '1px dashed #D0DFE2', color: '#52707C', fontSize: '11.5px', lineHeight: 1.5 }}>
                  <Pill size={18} color="#0F4C5C" style={{ margin: '0 auto 6px auto', display: 'block' }} />
                  Awaiting consultation recording... This prototype does not formulate prescriptions. Clinician review is required for any treatment decision.
                </div>
              ) : (
                encounterData.prescriptions.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: '#FAF8F5',
                      border: `1.5px solid ${p.color}33`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#081C24' }}>{p.name}</span>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: p.color }}>{p.colorLabel}</span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#0F4C5C', fontWeight: 700 }}>
                      ⏰ {p.timing} • {p.days}
                    </div>
                    <div style={{ fontSize: '11px', color: '#52707C', marginTop: '2px' }}>
                      Instructions: {p.meal}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sample interaction reminder */}
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldCheck size={18} color="#047857" />
              <div style={{ fontSize: '11px', color: '#065F46', fontWeight: 700 }}>
                No drug-interaction clearance is generated. Verify all medicines with a pharmacist or qualified clinician.
              </div>
            </div>

            {/* Human Review & Local Share Preview */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', color: '#52707C', lineHeight: 1.4 }}>
 <strong>Clinician review required:</strong> Local acknowledgement prepares a sample spoken note in {safePatient.language || 'Telugu'}. No prescription, external voice service, or WhatsApp message is sent by this step.
              </div>

              <button
                onClick={handleSignPrescription}
                disabled={isSynthesizingRx || dialogueList.length === 0}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: dialogueList.length === 0 ? '#94A3B8' : (isRxSigned ? '#047857' : '#0F4C5C'),
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: dialogueList.length === 0 ? 'not-allowed' : 'pointer',
                  boxShadow: dialogueList.length === 0 ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.16)'
                }}
              >
                {dialogueList.length === 0 ? (
                  <span>Record Consultation for Local Review</span>
                ) : isSynthesizingRx ? (
                  <span>Preparing Sample Spoken Note...</span>
                ) : isRxSigned ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Demo Review Acknowledged & Sample Note Ready</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Acknowledge Review & Prepare Sample Voice Note</span>
                  </>
                )}
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => setShowWhatsAppModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '10px',
                    background: '#25D366',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                  }}
                >
                  <Smartphone size={14} />
                  <span>Local Audio-Rx Preview</span>
                </button>

                <button
                  onClick={() => {
                    const bundle = generateAbdmFhirR4Bundle(
                      patientData,
                      { doctorName, hprId: 'DEMO-HPR-8921-9942', specialty: 'General Medicine (demo)' },
                      encounterData.diagnosis,
                      encounterData.prescriptions
                    );
                    exportTextFile({
                      filename: `AyuSwar_FHIR_Draft_${(safePatient.name || 'Patient').replace(/\s+/g, '_')}.json`,
                      text: JSON.stringify(bundle, null, 2),
                      shareTitle: 'AyuSwar FHIR-format research draft'
                    }).catch(() => {});
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '10px',
                    background: '#0A2540',
                    color: '#2DD4BF',
                    border: '1px solid rgba(45, 212, 191, 0.3)',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                  title="Export FHIR-shaped research draft JSON; not registry validated"
                >
                  <Download size={13} />
                  <span>FHIR R4 JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gnani Evon 30B SOAP Clinical Reasoning Drawer */}
      {showEvonDrawer && evonReasoning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(2, 6, 23, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '20px'
        }}>
          <div style={{
            width: '680px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            background: '#091E26',
            border: '1px solid #334155',
            borderRadius: '20px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            color: '#F8FAFC'
          }}>
            {/* Drawer Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 22px',
              borderBottom: '1px solid #1E293B',
              background: '#0F4C5C'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#047857',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#081C24'
                }}>
                  <Cpu size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{evonReasoning.isEvonLive ? 'Configured Draft-Note Assistant' : '[FALLBACK] Clinical Encounter Template'}</span>
                    <span style={{
                      fontSize: '9.5px',
                      background: evonReasoning.isEvonLive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: evonReasoning.isEvonLive ? '#047857' : '#FCD34D',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${evonReasoning.isEvonLive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                      fontWeight: 800
                    }}>
                      {evonReasoning.isEvonLive ? 'CONFIGURED MODEL RESPONSE' : 'Rule-based FALLBACK (Not Evon)'}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                    {evonReasoning.isEvonLive
                      ? 'Configured draft-note reasoning (availability checked separately)'
                      : `Rule-based FALLBACK (Not Evon) — standard clinical encounter template (${evonReasoning.error || 'Evon offline'})`}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowEvonDrawer(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: '#94A3B8',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Chain-of-Thought Reasoning (Only for authentic live Evon) */}
              {evonReasoning.isEvonLive && evonReasoning.thoughtTrace && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                    Draft reasoning trace (not clinical evidence):
                  </div>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    fontFamily: 'monospace',
                    fontSize: '11.5px',
                    color: '#D0DFE2',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-line'
                  }}>
                    {evonReasoning.thoughtTrace}
                  </div>
                </div>
              )}

              {/* Structured SOAP Notes */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#34D399', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                  Draft documentation note:
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  fontSize: '12.5px',
                  lineHeight: '1.65',
                  color: '#F1F5F9',
                  whiteSpace: 'pre-line'
                }}>
                  {evonReasoning.finalAnswer}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div style={{
              padding: '14px 22px',
              borderTop: '1px solid #1E293B',
              background: '#091E26',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '11px', color: '#52707C' }}>
                Synthetic documentation draft · clinician review required · no registry compliance or signature claimed
              </span>
              <button
                onClick={() => setShowEvonDrawer(false)}
                style={{
                  background: '#0F4C5C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Done / Apply to e-Rx
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Local Audio-Rx Preview */}
      <WhatsAppAudioRxModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        patientData={safePatient}
        doctorName={doctorName}
        initialLanguage={safePatient.language?.toLowerCase().includes('hindi') ? 'hi' : 'te'}
      />
    </div>
  );
}
