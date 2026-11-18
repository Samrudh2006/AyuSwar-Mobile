import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Volume2, 
  Play, 
  Square, 
  Share2, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  MessageSquare,
  Globe,
  ExternalLink,
  Mic,
  Download,
  Copy,
  Activity,
  Check,
  Stethoscope,
  ShieldCheck,
  Award,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { speechService, INDIC_LANGUAGES, GNANI_TIMBRE_V3_VOICES } from '../services/indicSpeechService';
import { analyzeAcousticSample } from '../services/acousticCoughAnalyzer';
import { generateVoicemakerScriptWithGroq } from '../services/aiBrainService';
import { cleanTextForSpeech } from '../utils/speechSanitizer';

const defaultVoiceFor = (langCode) => INDIC_LANGUAGES.find(l => l.code === langCode)?.defaultVoice || null;

export default function AudioRxStudioView() {
  const { selectedLanguage, setSelectedLanguage, isDemoMode } = useApp();

  const [studioStatus, setStudioStatus] = useState('');
  const [activeLang, setActiveLang] = useState(selectedLanguage === 'hi-IN' ? 'hi-IN' : selectedLanguage === 'te-IN' ? 'te-IN' : 'en-IN');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioNotice, setAudioNotice] = useState(null);
  const [karaokeActiveIndex, setKaraokeActiveIndex] = useState(-1);
  const [activePillHighlight, setActivePillHighlight] = useState(null); // 'morning' | 'night'
  const [recipientPhone, setRecipientPhone] = useState('');
  const [whatsAppToast, setWhatsAppToast] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [wavExportedToast, setWavExportedToast] = useState(false);
  const [customGroqScript, setCustomGroqScript] = useState(null);
  const [isGeneratingGroqScript, setIsGeneratingGroqScript] = useState(false);
  const [selectedGnaniVoice, setSelectedGnaniVoice] = useState(() => defaultVoiceFor(selectedLanguage === 'hi-IN' ? 'hi-IN' : selectedLanguage === 'te-IN' ? 'te-IN' : 'en-IN'));

  useEffect(() => {
    setSelectedGnaniVoice(defaultVoiceFor(activeLang));
  }, [activeLang]);

  // Feature 1: Teach-Back Patient Adherence Quiz State
  const [teachBackModalOpen, setTeachBackModalOpen] = useState(false);
  const [teachBackAnswers, setTeachBackAnswers] = useState({ q1: null, q2: null });
  const [teachBackVerified, setTeachBackVerified] = useState(false);

  // Feature 2: Lancet Acoustic Cough & Breathing Biomarker State
  const [isAnalyzingCough, setIsAnalyzingCough] = useState(false);
  const [coughCountdown, setCoughCountdown] = useState(3);
  const [acousticResult, setAcousticResult] = useState(null);

  // Feature 3: Practice SOAP Clinical Note & ICD-10 State
  const [isSoapExpanded, setIsSoapExpanded] = useState(false);
  const [soapCopiedToast, setSoapCopiedToast] = useState(false);

  // Live Microphone Recording & 60 FPS Waveform State
  const [isRecordingLiveMic, setIsRecordingLiveMic] = useState(false);
  const [liveRecordedAudioUrl, setLiveRecordedAudioUrl] = useState(null);
  const [livePitchHz, setLivePitchHz] = useState(0);
  const [liveRmsDb, setLiveRmsDb] = useState(-60);
  const [micRecordingDuration, setMicRecordingDuration] = useState(0);

  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const animFrameRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const karaokeTimerRef = useRef(null);

  // Sync with global language selector
  useEffect(() => {
    setActiveLang(selectedLanguage);
  }, [selectedLanguage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechService.stopSpeaking();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch {}
      }
    };
  }, []);

  // Audio Prescription Scripts
  const SCRIPTS = {
    'te-IN': {
      title: 'నారాయణ రావు గారి డిజిటల్ ప్రిస్క్రిప్షన్',
      tokens: [
        { text: 'నమస్కారం.', pill: null },
        { text: 'డాక్టర్', pill: null },
        { text: 'ప్రియ', pill: null },
        { text: 'గారు', pill: null },
        { text: 'సూచించిన', pill: null },
        { text: 'ప్యాంటోప్రజోల్', pill: 'morning' },
        { text: '40mg', pill: 'morning' },
        { text: 'పసుపు', pill: 'morning' },
        { text: 'గోళీని', pill: 'morning' },
        { text: 'ఉదయం', pill: 'morning' },
        { text: 'టిఫిన్', pill: 'morning' },
        { text: 'ముందు', pill: 'morning' },
        { text: 'వేసుకోండి.', pill: 'morning' },
        { text: 'అలాగే', pill: null },
        { text: 'మెట్‌ఫార్మిన్', pill: 'night' },
        { text: '500mg', pill: 'night' },
        { text: 'గులాబీ', pill: 'night' },
        { text: 'గోళీని', pill: 'night' },
        { text: 'రాత్రి', pill: 'night' },
        { text: 'భోజనం', pill: 'night' },
        { text: 'తర్వాత', pill: 'night' },
        { text: 'వేసుకోండి.', pill: 'night' }
      ],
      fullText: 'నమస్కారం. డాక్టర్ ప్రియ గారు సూచించిన ప్యాంటోప్రజోల్ 40mg పసుపు గోళీని ఉదయం టిఫిన్ ముందు వేసుకోండి. అలాగే మెట్‌ఫార్మిన్ 500mg గులాబీ గోళీని రాత్రి భోజనం తర్వాత వేసుకోండి.'
    },
    'hi-IN': {
      title: 'नारायण राव जी का डिजिटल पर्चा',
      tokens: [
        { text: 'नमस्ते।', pill: null },
        { text: 'डॉक्टर', pill: null },
        { text: 'प्रिया', pill: null },
        { text: 'द्वारा', pill: null },
        { text: 'निर्धारित', pill: null },
        { text: 'पैंटोप्रजोल', pill: 'morning' },
        { text: '40mg', pill: 'morning' },
        { text: 'पीली', pill: 'morning' },
        { text: 'गोली', pill: 'morning' },
        { text: 'सुबह', pill: 'morning' },
        { text: 'नाश्ते', pill: 'morning' },
        { text: 'से', pill: 'morning' },
        { text: 'पहले', pill: 'morning' },
        { text: 'लें।', pill: 'morning' },
        { text: 'और', pill: null },
        { text: 'मेटफॉर्मिन', pill: 'night' },
        { text: '500mg', pill: 'night' },
        { text: 'गुलाबी', pill: 'night' },
        { text: 'गोली', pill: 'night' },
        { text: 'रात', pill: 'night' },
        { text: 'को', pill: 'night' },
        { text: 'खाने', pill: 'night' },
        { text: 'के', pill: 'night' },
        { text: 'बाद', pill: 'night' },
        { text: 'लें।', pill: 'night' }
      ],
      fullText: 'नमस्ते। डॉक्टर प्रिया द्वारा निर्धारित पैंटोप्रजोल 40mg पीली गोली सुबह नाश्ते से पहले लें। और मेटफॉर्मिन 500mg गुलाबी गोली रात को खाने के बाद लें।'
    },
    'en-IN': {
      title: 'Digital Spoken Prescription for Narayana Rao',
      tokens: [
        { text: 'Hello.', pill: null },
        { text: 'Take', pill: null },
        { text: 'Pantoprazole', pill: 'morning' },
        { text: '40mg', pill: 'morning' },
        { text: 'yellow', pill: 'morning' },
        { text: 'tablet', pill: 'morning' },
        { text: 'in', pill: 'morning' },
        { text: 'the', pill: 'morning' },
        { text: 'morning', pill: 'morning' },
        { text: 'before', pill: 'morning' },
        { text: 'breakfast.', pill: 'morning' },
        { text: 'Take', pill: null },
        { text: 'Metformin', pill: 'night' },
        { text: '500mg', pill: 'night' },
        { text: 'pink', pill: 'night' },
        { text: 'tablet', pill: 'night' },
        { text: 'at', pill: 'night' },
        { text: 'night', pill: 'night' },
        { text: 'after', pill: 'night' },
        { text: 'dinner.', pill: 'night' }
      ],
      fullText: 'Hello. Take Pantoprazole 40mg yellow tablet in the morning before breakfast. Take Metformin 500mg pink tablet at night after dinner.'
    }
  };

  const handleGenerateWithGroq = async () => {
    setIsGeneratingGroqScript(true);
    try {
      const generated = await generateVoicemakerScriptWithGroq({
        patientName: 'Narayana Rao',
        medications: [
          { name: 'Pantoprazole 40mg', colorLabel: 'Yellow tablet (పసుపు గోళీ)', timing: 'Morning', meal: 'before breakfast' },
          { name: 'Metformin 500mg SR', colorLabel: 'Pink tablet (గులాబీ గోళీ)', timing: 'Night', meal: 'after dinner' }
        ],
        language: activeLang
      });
      if (generated) {
        const cleaned = cleanTextForSpeech(generated);
        const words = cleaned.split(' ');
        const tokens = words.map(w => ({ 
          text: w, 
          pill: w.includes('పసుపు') || w.includes('पीली') || w.includes('yellow') ? 'morning' : (w.includes('గులాబీ') || w.includes('गुलाबी') || w.includes('pink') ? 'night' : null) 
        }));
        setCustomGroqScript({
          title: `Groq AI Spoken Prescription (${activeLang})`,
          tokens,
          fullText: cleaned
        });
      }
    } catch (err) {
      console.warn('Groq Voicemaker error:', err);
    } finally {
      setIsGeneratingGroqScript(false);
    }
  };

  const currentScript = customGroqScript || SCRIPTS[activeLang] || SCRIPTS['en-IN'];

  // -------------------------------------------------------------
  // Live Microphone 60 FPS Visualizer & Recording Pipeline
  // -------------------------------------------------------------
  const startLiveMicRecording = async () => {
    if (isRecordingLiveMic) {
      stopLiveMicRecording();
      return;
    }

    handleStopAudio();
    audioChunksRef.current = [];
    setLiveRecordedAudioUrl(null);
    setMicRecordingDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // MediaRecorder for capturing audio blob
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setLiveRecordedAudioUrl(url);
      };
      recorder.start(100);

      setIsRecordingLiveMic(true);

      // Duration timer
      let dur = 0;
      recordingTimerRef.current = setInterval(() => {
        dur++;
        setMicRecordingDuration(dur);
      }, 1000);

      // 60 FPS Waveform + Pitch Autocorrelation Loop
      runVisualizerLoop(analyser, audioCtx.sampleRate);
    } catch (err) {
      console.warn("Microphone access error:", err);
      alert("Microphone permission denied or not found: " + err.message);
    }
  };

  const stopLiveMicRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecordingLiveMic(false);
  };

  // 60 FPS Canvas Renderer with Dual Gradient (Emerald Green to Fiery Orange) & Pitch Extraction
  const runVisualizerLoop = (analyser, sampleRate) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.fftSize;
    const timeData = new Float32Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getFloatTimeDomainData(timeData);

      const width = canvas.width;
      const height = canvas.height;

      // Dark background
      ctx.fillStyle = '#061626';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Compute RMS Energy
      let sumSq = 0;
      for (let i = 0; i < bufferLength; i++) {
        sumSq += timeData[i] * timeData[i];
      }
      const rms = Math.sqrt(sumSq / bufferLength);
      const db = 20 * Math.log10(Math.max(rms, 1e-4));
      setLiveRmsDb(Math.round(db));

      // Autocorrelation Pitch Extraction for Voice Register (80 Hz to 380 Hz)
      let bestLag = 0;
      let maxCorr = -1;
      const minLag = Math.floor(sampleRate / 380);
      const maxLag = Math.floor(sampleRate / 80);

      if (rms > 0.015) {
        for (let lag = minLag; lag < maxLag; lag++) {
          let corr = 0;
          for (let i = 0; i < 512; i++) {
            corr += timeData[i] * timeData[i + lag];
          }
          if (corr > maxCorr) {
            maxCorr = corr;
            bestLag = lag;
          }
        }
        if (bestLag > 0) {
          const estimatedF0 = Math.round(sampleRate / bestLag);
          if (estimatedF0 >= 75 && estimatedF0 <= 400) {
            setLivePitchHz(estimatedF0);
          }
        }
      } else {
        setLivePitchHz(0);
      }

      // Dynamic 60 FPS Dual Gradient Waveform (Green to Fiery Amber)
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#10B981');   // Vibrant Emerald Green
      gradient.addColorStop(0.5, '#F59E0B'); // Warm Amber Orange
      gradient.addColorStop(1, '#EF4444');   // High Energy Coral Red

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = gradient;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = timeData[i];
        const y = (v * height * 0.45) + (height / 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow
    };

    draw();
  };

  // Handle Playback & Synchronized Karaoke
  const handlePlayAudio = () => {
    if (isPlayingAudio) {
      handleStopAudio();
      return;
    }

    stopLiveMicRecording();
    setAudioNotice(null);
    setKaraokeActiveIndex(0);

    const tokens = currentScript.tokens;
    let idx = 0;

    // Pacing timer fallback for smooth visual token progression.
    // HONESTY: starts only from onStart (real playback began) - the karaoke
    // must never advance while no audio is actually playing.
    const startPacingTimer = () => {
      if (karaokeTimerRef.current) return;
      const estimatedDurationMs = Math.max(7000, Math.round((tokens.length / 2.0) * 1000));
      const wordIntervalMs = Math.round(estimatedDurationMs / Math.max(1, tokens.length));
      karaokeTimerRef.current = setInterval(() => {
        idx++;
        if (idx < tokens.length) {
          setKaraokeActiveIndex(idx);
          setActivePillHighlight(tokens[idx].pill);
        } else {
          if (karaokeTimerRef.current) {
            clearInterval(karaokeTimerRef.current);
            karaokeTimerRef.current = null;
          }
        }
      }, wordIntervalMs);
    };

    // Trigger Speech via Unified Service with onTimeUpdate for exact acoustic alignment
    setIsPlayingAudio(true);
    speechService.speak(currentScript.fullText, {
      langCode: activeLang,
      voice: selectedGnaniVoice,
      rate: 0.92,
      onStart: () => startPacingTimer(),
      onTimeUpdate: (currentTimeMs, durationMs) => {
        if (durationMs > 0 && tokens.length > 0) {
          if (karaokeTimerRef.current) {
            clearInterval(karaokeTimerRef.current);
            karaokeTimerRef.current = null;
          }
          const progress = Math.min(0.99, currentTimeMs / durationMs);
          const activeIdx = Math.floor(progress * tokens.length);
          setKaraokeActiveIndex(activeIdx);
          if (tokens[activeIdx]?.pill) {
            setActivePillHighlight(tokens[activeIdx].pill);
          }
        }
      },
      onEnd: () => handleStopAudio(),
      onError: (err) => {
        handleStopAudio();
        const msg = (typeof err === 'string' && err.length > 4)
          ? err
          : 'Audio preview is unavailable in this browser right now. The practice text above remains readable.';
        setAudioNotice(msg);
      }
    });
  };

  const handleStopAudio = () => {
    speechService.stopSpeaking();
    setIsPlayingAudio(false);
    setKaraokeActiveIndex(-1);
    setActivePillHighlight(null);
    if (karaokeTimerRef.current) {
      clearInterval(karaokeTimerRef.current);
      karaokeTimerRef.current = null;
    }
  };

  // Helper: Encode standard 16-bit PCM RIFF/WAVE container
  const encodeWavPCM16 = (audioBuffer) => {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // Uncompressed PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const channelData = audioBuffer.getChannelData(0);
    const dataSize = channelData.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset, str) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
    return buffer;
  };

  // Client-Side Vernacular Audio-Rx .WAV Exporter
  const handleExportAudioRxWav = () => {
    setIsExportingWav(true);
    try {
      if (liveRecordedAudioUrl) {
        const a = document.createElement('a');
        a.href = liveRecordedAudioUrl;
        a.download = `AyuSwar_DoctorRecordedRx_${activeLang}.webm`;
        a.click();
        setWavExportedToast(true);
        setTimeout(() => setWavExportedToast(false), 3000);
        setIsExportingWav(false);
        return;
      }

      setStudioStatus('No recorded audio to export. Record your voice first. Synthetic tones are never substituted for speech.');
    } catch (e) {
      console.warn("WAV generation error", e);
    } finally {
      setIsExportingWav(false);
    }
  };

  // Sanitize Phone Number to Standard E.164
  const sanitizePhoneNumber = (raw) => {
    const digitsOnly = String(raw).replace(/[^0-9]/g, '');
    if (digitsOnly.length === 10) return `91${digitsOnly}`;
    return digitsOnly;
  };

  // Trigger Real-Time 3s Acoustic Cough & Breathing Capture (Lancet Digital Health Protocol)
  const handleStartAcousticAnalysis = () => {
    setStudioStatus('Disease or breath-sound inference is unavailable. Open Acoustic Signal Lab for optional research measurements and sound-event hints. No diagnostic output is generated.');
  };

  // Handle Teach-Back Answers (Schillinger et al., JAMA 2003)
  const handleTeachBackAnswer = (qKey, optionIdx) => {
    const updated = { ...teachBackAnswers, [qKey]: optionIdx };
    setTeachBackAnswers(updated);

    // Q1: Option 0 (Morning before breakfast) is correct; Q2: Option 0 (Night after dinner) is correct
    if (updated.q1 === 0 && updated.q2 === 0) {
      setTeachBackVerified(true);
      speechService.speak(
        activeLang === 'te-IN' 
          ? 'అభినందనలు! మందుల వేళలు మీకు సంపూర్ణంగా అర్థమయ్యాయి.' 
          : 'Great job! Both sample answers matched.',
        { langCode: activeLang }
      );
    }
  };

  // Generate Practice Structured SOAP Note Content
  const getAmieSoapNoteText = () => {
    return `AyuSwar synthetic practice voice note. Not a clinical record or prescription.\nLanguage: ${activeLang}\n\n${currentScript.fullText}\n\nSample quiz answers: ${teachBackVerified ? 'Two sample timing questions answered correctly, not adherence verification' : 'Not completed'}. No clinical vitals, acoustic diagnosis or dispatch is asserted.`;
  };

  const handleCopySoapNote = async () => {
    try {
      await navigator.clipboard.writeText(getAmieSoapNoteText());
      setSoapCopiedToast(true);
      setTimeout(() => setSoapCopiedToast(false), 3000);
    } catch (e) {
      console.warn("Clipboard write failed", e);
    }
  };

  const handleExportSoapJson = () => {
    const record = { type: 'synthetic-practice-voice-note', timestamp: new Date().toISOString(), language: activeLang, reviewedText: currentScript.fullText, recordedAudioPresent: !!liveRecordedAudioUrl, sampleQuizCompleted: teachBackVerified, sent: false, note: 'No clinical diagnosis, medical sign-off, audio attachment or real prescription.' };

    const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ayuswar-practice-note-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Construct Formatted Real WhatsApp Prescription Message
  const getFormattedWhatsAppMessage = () => {
    return `AyuSwar synthetic practice voice summary - not a prescription.

${currentScript.fullText}

Text only. No audio attachment. Not automatically sent.`;
  };

  const handleRealWhatsAppDispatch = async () => {
    try {
      if (navigator.share) { await navigator.share({ title: 'AyuSwar practice summary', text: getFormattedWhatsAppMessage() }); setStudioStatus('Share sheet opened. You choose an app and recipient; AyuSwar cannot verify sending.'); }
      else { await navigator.clipboard.writeText(getFormattedWhatsAppMessage()); setStudioStatus('Practice text copied. Open WhatsApp and choose a recipient yourself. Nothing was sent.'); }
    } catch { setStudioStatus('Share cancelled or unavailable. Nothing was sent.'); }
  };

  // Copy Message to Clipboard
  const handleCopyPrescriptionText = () => {
    const msg = getFormattedWhatsAppMessage();
    navigator.clipboard.writeText(msg);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  return (
    <div className="audiorx-view-container" style={{ padding: '36px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="m-audiorx-source-banner"><b>Synthetic practice only</b><p>This studio starts from an explicitly bundled medicine example, not a recorded consultation. Do not use it as a real prescription. For consultation-derived notes, use OPD Scribe.</p>{studioStatus && <p role="status">{studioStatus}</p>}</div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0F4C5C', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
          <ArrowLeft size={16} />
          <span>Home</span>
        </Link>
        <span style={{ color: '#94A3B8' }}>/</span>
        <span style={{ color: '#698892', fontSize: '13px' }}>Solutions</span>
        <span style={{ color: '#94A3B8' }}>/</span>
        <span style={{ color: '#081C24', fontSize: '13px', fontWeight: 700 }}>Vernacular Audio-Rx Studio</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, marginBottom: '12px' }}>
          <Volume2 size={14} />
          <span>PATIENT ADHERENCE & LIVE AUDIO-RX</span>
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: 850, color: '#081C24', marginBottom: '10px' }}>
          Vernacular Spoken Audio-Rx Studio
        </h1>
        <p style={{ fontSize: '15px', color: '#5A7184', maxWidth: '850px', lineHeight: 1.6 }}>
          Synthetic practice studio. Record real microphone audio, review the sample voice text, and open a share sheet yourself. No automatic dispatch or clinical diagnosis.
        </p>
      </div>

      {/* Main Studio Grid */}
      <div className="audiorx-studio-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
        
        {/* Left Column: Live Mic Studio & 60 FPS Visualizer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Live Waveform Studio Card */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mic size={18} color="#0F4C5C" />
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#081C24' }}>Live Microphone Recording Studio</span>
              </div>
              <span style={{ 
                background: isRecordingLiveMic ? '#FEE2E2' : '#ECFDF5', 
                color: isRecordingLiveMic ? '#991B1B' : '#065F46', 
                border: `1px solid ${isRecordingLiveMic ? '#FCA5A5' : '#A7F3D0'}`,
                fontSize: '11px', 
                padding: '3px 8px', 
                borderRadius: '6px', 
                fontWeight: 800 
              }}>
                {isRecordingLiveMic ? `● RECORDING (${micRecordingDuration}s)` : '● STUDIO READY'}
              </span>
            </div>

            {/* 60 FPS Waveform Oscilloscope Canvas */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #091E26', background: '#061626', position: 'relative' }}>
              <canvas 
                ref={canvasRef} 
                width={500} 
                height={160} 
                style={{ width: '100%', height: '160px', display: 'block' }}
              />

              {/* Overlay HUD Telemetry */}
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '12px',
                right: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                fontWeight: 700,
                color: '#94A3B8',
                pointerEvents: 'none'
              }}>
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Activity size={12} /> Live microphone amplitude
                </span>
                <span>
                  Pitch: <strong style={{ color: livePitchHz > 0 ? '#F59E0B' : '#94A3B8' }}>{livePitchHz > 0 ? `${livePitchHz} Hz` : 'Silent'}</strong>
                  {' • '}
                  Vol: <strong style={{ color: '#D0DFE2' }}>{liveRmsDb} dB</strong>
                </span>
              </div>

              {!isRecordingLiveMic && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(6, 22, 38, 0.75)',
                  color: '#94A3B8',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <Mic size={24} color="#10B981" />
                  <span>Click 'Record Doctor Voice' to capture live waveform</span>
                </div>
              )}
            </div>

            {/* Live Record Button Row */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={startLiveMicRecording}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isRecordingLiveMic ? '#DC2626' : '#0F4C5C',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: isRecordingLiveMic ? '0 4px 14px rgba(220,38,38,0.35)' : '0 4px 14px rgba(0, 0, 0, 0.16)'
                }}
              >
                {isRecordingLiveMic ? <Square size={16} fill="#FFF" /> : <Mic size={16} />}
                <span>{isRecordingLiveMic ? 'Stop Recording' : 'Record Doctor Voice (Live Mic)'}</span>
              </button>

              {liveRecordedAudioUrl && (
                <a
                  href={liveRecordedAudioUrl}
                  download="doctor_audio_prescription.webm"
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #D0DFE2',
                    background: '#FAF8F5',
                    color: '#081C24',
                    fontSize: '13px',
                    fontWeight: 750,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={15} /> Download Audio
                </a>
              )}
            </div>

            {/* Lancet Acoustic Cough & Breath Sound Analyzer Button */}
            <div style={{ marginTop: '4px' }}>
              <button
                onClick={handleStartAcousticAnalysis}
                disabled={isAnalyzingCough}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '12px',
                  border: '1.5px solid #0284C7',
                  background: isAnalyzingCough ? '#E0F2FE' : '#F0F9FF',
                  color: '#0369A1',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: isAnalyzingCough ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.12)'
                }}
              >
                <Stethoscope size={16} color="#0284C7" />
                <span>
                  {isAnalyzingCough 
                    ? `Listening & Sampling Breath Acoustics... [${coughCountdown}s]` 
 : 'Research analysis availability'}
                </span>
              </button>
            </div>

            {/* Acoustic Biomarker Results Card */}
            {acousticResult && (
              <div style={{
                background: acousticResult.wheezeIndex > 40 ? '#FFFBEB' : '#F0FDF4',
                border: `1.5px solid ${acousticResult.wheezeIndex > 40 ? '#FDE68A' : '#BBF7D0'}`,
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={16} color={acousticResult.wheezeIndex > 40 ? '#D97706' : '#16A34A'} />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#081C24' }}>
                      {acousticResult.title}
                    </span>
                  </div>
                  <span style={{
                    background: acousticResult.wheezeIndex > 40 ? '#FEF3C7' : '#DCFCE7',
                    color: acousticResult.wheezeIndex > 40 ? '#92400E' : '#166534',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    Wheeze Index: {acousticResult.wheezeIndex}%
                  </span>
                </div>

                <div style={{ fontSize: '11.5px', color: '#486770' }}>
                  Dominant Peak: <strong>{acousticResult.dominantFreqHz} Hz</strong> • Amplitude: <strong>{acousticResult.peakDb} dB</strong> • Acoustic Confidence: <strong>{acousticResult.confidence}%</strong>
                </div>

                <div style={{
                  fontSize: '11.5px',
                  color: '#064E3B',
                  background: 'rgba(255,255,255,0.7)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}>
 <strong>Unvalidated research output:</strong> {acousticResult.clinicalGuidance}
                </div>
              </div>
            )}

            {/* Recorded Audio Audio Element */}
            {liveRecordedAudioUrl && (
              <div style={{ background: '#FAF8F5', padding: '10px', borderRadius: '10px', border: '1px solid #D0DFE2' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', marginBottom: '6px' }}>
 ✓ Live Voice Note Recorded Ready for WhatsApp Dispatch:
                </div>
                <audio src={liveRecordedAudioUrl} controls style={{ width: '100%', height: '36px' }} />
              </div>
            )}
          </div>

          {/* Karaoke Telemetry Box */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#081C24' }}>Synthesized Mother Tongue Readout:</span>
                <button
                  onClick={handleGenerateWithGroq}
                  disabled={isGeneratingGroqScript}
                  title="Generate dynamic vernacular spoken prescription with Groq LLaMA-3.3"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '7px',
                    border: '1px solid #F59E0B',
                    background: '#FFFBEB',
                    color: '#92400E',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: isGeneratingGroqScript ? 'wait' : 'pointer'
                  }}
                >
                  <Volume2 size={12} color="#D97706" />
 <span>{isGeneratingGroqScript ? 'Generating...': 'Groq Voicemaker AI'}</span>
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
 <span style={{ fontSize: '11px', fontWeight: 800, color: '#698892'}}> Gnani Voice:</span>
                  <select
                    id="gnani-voice-select"
                    aria-label="Select Gnani Timbre Neural Voice Profile"
                    value={selectedGnaniVoice}
                    onChange={(e) => { setSelectedGnaniVoice(e.target.value); handleStopAudio(); }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '7px',
                      border: '1.5px solid #D0DFE2',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#081C24',
                      background: '#FFFFFF',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {defaultVoiceFor(activeLang) && (
                      <optgroup label="Language-matched Timbre v2.5">
                        <option value={defaultVoiceFor(activeLang)}>{defaultVoiceFor(activeLang)} (default)</option>
                      </optgroup>
                    )}
                    <optgroup label="Timbre v3.0 multilingual voices">
                      {GNANI_TIMBRE_V3_VOICES.map(v => (
                        <option key={v} value={v}>{v} (v3)</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { code: 'te-IN', label: 'తెలుగు (Telugu)' },
                  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
                  { code: 'en-IN', label: 'English' }
                ].map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      handleStopAudio();
                      setActiveLang(lang.code);
                      setSelectedLanguage(lang.code);
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: activeLang === lang.code ? '#0F4C5C' : '#F1F5F9',
                      color: activeLang === lang.code ? '#FFFFFF' : '#486770',
                      fontSize: '11.5px',
                      fontWeight: 750,
                      cursor: 'pointer'
                    }}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

            <div style={{
              background: '#0F4C5C',
              borderRadius: '14px',
              padding: '20px',
              minHeight: '130px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
            }}>
              <div style={{ fontSize: '11px', color: '#00A896', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                Synchronized Karaoke Transcript:
              </div>
              <div style={{ fontSize: '16px', lineHeight: 1.8, color: '#94A3B8', fontWeight: 650 }}>
                {currentScript.tokens.map((token, idx) => {
                  const isCurrent = idx === karaokeActiveIndex;
                  return (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-block',
                        marginRight: '6px',
                        color: isCurrent ? '#34D399' : idx < karaokeActiveIndex ? '#FFFFFF' : '#698892',
                        fontWeight: isCurrent ? 850 : 600,
                        transform: isCurrent ? 'scale(1.08)' : 'scale(1)',
                        transition: 'all 140ms ease',
                        textShadow: isCurrent ? '0 2px 8px rgba(52, 211, 153, 0.35)' : 'none'
                      }}
                    >
                      {token.text}
                    </span>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <label className="m-flow-field"><span>Review and edit spoken text before playback or sharing</span><textarea rows={6} value={currentScript.fullText} onChange={event => { handleStopAudio(); setTeachBackVerified(false); setCustomGroqScript({ title: 'Doctor-edited practice text', fullText: event.target.value, tokens: event.target.value.split(/\s+/).map(text => ({text,pill:null})) }); }} /></label>
            <button
                onClick={handlePlayAudio}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isPlayingAudio ? '#DC2626' : '#0F4C5C',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isPlayingAudio ? <Square size={16} fill="#FFF" /> : <Play size={16} fill="#FFF" />}
                <span>{isPlayingAudio ? 'Stop Synthetic Audio' : 'Play reviewed practice text'}</span>
              </button>

              {audioNotice && (
                <div role="status" style={{
                  marginTop: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #B45309',
                  background: '#FFF7ED',
                  color: '#92400E',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  lineHeight: 1.45
                }}>
                  {audioNotice}
                </div>
              )}

              <button
                onClick={handleExportAudioRxWav}
                disabled={isExportingWav}
                title="Download spoken prescription as authentic .WAV audio container"
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid #0F4C5C',
                  background: '#FAF8F5',
                  color: '#0F4C5C',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: isExportingWav ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={15} />
                <span>{isExportingWav ? 'Encoding...' : 'Export recorded audio'}</span>
              </button>
            </div>

            {wavExportedToast && (
              <div style={{
                marginTop: '10px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: '#ECFDF5',
                border: '1px solid #10B981',
                color: '#065F46',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Check size={14} /> Downloaded broadcast-grade Audio-Rx WAV container for offline playback!
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Visual Chronotherapy Pill Cards & Real WhatsApp Push */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Visual Pill Cards */}
          <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', marginBottom: '14px' }}>
              Color-Coded Visual Pill Chronotherapy Schedule
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Morning Pill */}
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                border: activePillHighlight === 'morning' ? '2.5px solid #F59E0B' : '1px solid #D0DFE2',
                background: activePillHighlight === 'morning' ? '#FEF3C7' : '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 200ms ease',
                transform: activePillHighlight === 'morning' ? 'scale(1.02)' : 'scale(1)'
              }}>
                <img 
                  src="/images/medicines/yellow_pantoprazole.jpg" 
                  alt="Pantoprazole 40mg (Yellow Pill)" 
                  style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #F59E0B', flexShrink: 0, boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)' }} 
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#081C24' }}>
                    Pantoprazole 40mg (పసుపు గోళీ / Yellow Pill)
                  </div>
                  <div style={{ fontSize: '12px', color: '#698892' }}>
                    Morning: 08:30 AM (Before Breakfast • 30 mins empty stomach)
                  </div>
                </div>
              </div>

              {/* Night Pill */}
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                border: activePillHighlight === 'night' ? '2.5px solid #C2410C' : '1px solid #D0DFE2',
                background: activePillHighlight === 'night' ? '#FFF7ED' : '#FAF8F5',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 200ms ease',
                transform: activePillHighlight === 'night' ? 'scale(1.02)' : 'scale(1)'
              }}>
                <img 
                  src="/images/medicines/pink_metformin.jpg" 
                  alt="Metformin 500mg SR (Pink Pill)" 
                  style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #C2410C', flexShrink: 0, boxShadow: '0 2px 8px rgba(194, 65, 12, 0.25)' }} 
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#081C24' }}>
                    Metformin 500mg SR (గులాబీ గోళీ / Pink Pill)
                  </div>
                  <div style={{ fontSize: '12px', color: '#698892' }}>
                    Night: 08:30 PM (After Dinner • Regular with water)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 1: Teach-Back Patient Adherence Quiz Card */}
          <div style={{
            background: teachBackVerified ? '#ECFDF5' : '#FFFBEB',
            border: `1.5px solid ${teachBackVerified ? '#10B981' : '#F59E0B'}`,
            borderRadius: '16px',
            padding: '20px',
            transition: 'all 200ms ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color={teachBackVerified ? '#059669' : '#D97706'} />
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: teachBackVerified ? '#065F46' : '#92400E' }}>
                  Teach-Back Patient Adherence Quiz
                </span>
              </div>
              <span style={{
                background: teachBackVerified ? '#059669' : '#D97706',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '10px'
              }}>
 {teachBackVerified ? '✓ Sample quiz complete': 'Action Required'}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: teachBackVerified ? '#047857' : '#78350F', lineHeight: 1.4, margin: '0 0 6px 0' }}>
              {teachBackVerified 
                ? 'Both synthetic timing answers matched. No real understanding, adherence or message delivery is verified.'
                : 'Try two timing questions for the bundled example. Matching these answers does not prove real patient understanding or medication adherence.'}
            </p>
            <div style={{ fontSize: '10.5px', color: teachBackVerified ? '#047857' : '#78350F', margin: '0 0 12px 0', fontStyle: 'italic', opacity: 0.85 }}>
              Originating literature: Schillinger et al., JAMA 2003 (educational reference; no institutional endorsement implied).
            </div>

            {!teachBackModalOpen && !teachBackVerified && (
              <button
                onClick={() => setTeachBackModalOpen(true)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#D97706',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)'
                }}
              >
                <HelpCircle size={15} />
                <span>Verify Patient Teach-Back Quiz (1-Click)</span>
              </button>
            )}

            {teachBackModalOpen && (
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '14px',
                border: '1px solid #FDE68A',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Question 1 */}
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#081C24', marginBottom: '6px' }}>
                    1. పసుపు గోళీ (Pantoprazole) ను ఎప్పుడు వేసుకోవాలి?
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleTeachBackAnswer('q1', 0)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: teachBackAnswers.q1 === 0 ? '2px solid #10B981' : '1px solid #D0DFE2',
                        background: teachBackAnswers.q1 === 0 ? '#DCFCE7' : '#F8FAFC',
                        color: teachBackAnswers.q1 === 0 ? '#166534' : '#2C4A52',
                        fontSize: '11px',
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                    >
 ఉదయం పరగడుపున
                    </button>
                    <button
                      onClick={() => handleTeachBackAnswer('q1', 1)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: teachBackAnswers.q1 === 1 ? '2px solid #EF4444' : '1px solid #D0DFE2',
                        background: teachBackAnswers.q1 === 1 ? '#FEE2E2' : '#F8FAFC',
                        color: teachBackAnswers.q1 === 1 ? '#991B1B' : '#2C4A52',
                        fontSize: '11px',
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                    >
 రాత్రి భోజనం తర్వాత
                    </button>
                  </div>
                </div>

                {/* Question 2 */}
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#081C24', marginBottom: '6px' }}>
                    2. గులాబీ గోళీ (Metformin) ను ఎప్పుడు వేసుకోవాలి?
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleTeachBackAnswer('q2', 0)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: teachBackAnswers.q2 === 0 ? '2px solid #10B981' : '1px solid #D0DFE2',
                        background: teachBackAnswers.q2 === 0 ? '#DCFCE7' : '#F8FAFC',
                        color: teachBackAnswers.q2 === 0 ? '#166534' : '#2C4A52',
                        fontSize: '11px',
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                    >
 రాత్రి భోజనం తర్వాత
                    </button>
                    <button
                      onClick={() => handleTeachBackAnswer('q2', 1)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: teachBackAnswers.q2 === 1 ? '2px solid #EF4444' : '1px solid #D0DFE2',
                        background: teachBackAnswers.q2 === 1 ? '#FEE2E2' : '#F8FAFC',
                        color: teachBackAnswers.q2 === 1 ? '#991B1B' : '#2C4A52',
                        fontSize: '11px',
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                    >
 ఉదయం ఖాళీ కడుపుతో
                    </button>
                  </div>
                </div>

                {teachBackVerified && (
                  <div style={{
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    color: '#166534',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontWeight: 750,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <CheckCircle2 size={16} color="#16A34A" />
                    <span>Both sample timing answers matched. This does not verify real patient understanding or adherence.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* WhatsApp Dispatch Compose Box */}
          <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '16px', padding: '20px 18px', boxSizing: 'border-box', overflow: 'hidden', width: '100%', maxWidth: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 800, fontSize: '15px' }}>
                <MessageSquare size={18} color="#16A34A" />
                <span>Share practice text</span>
              </div>
              <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>
                Recipient chosen by you
              </span>
            </div>

            <p style={{ fontSize: '13px', color: '#14532D', lineHeight: 1.5, marginBottom: '16px' }}>
              Open the device share sheet or copy text. Choose WhatsApp and a recipient yourself. Text only; no attached audio or delivery claim.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
              <button
                onClick={handleRealWhatsAppDispatch}
                aria-label="Open share options"
                style={{
                  width: '100%',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#16A34A',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                }}
              >
                <Share2 size={16} style={{ flexShrink: 0 }} />
                <span>Open share options</span>
              </button>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
                gap: '8px',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <button
                  onClick={handleCopyPrescriptionText}
                  aria-label="Copy Formatted Text"
                  style={{
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #86EFAC',
                    background: '#FFFFFF',
                    color: '#166534',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {copiedToast ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                  <span>{copiedToast ? 'Copied to Clipboard!' : 'Copy Formatted Text'}</span>
                </button>

                <button
                  onClick={handleRealWhatsAppDispatch}
                  aria-label="Open WhatsApp Web"
                  style={{
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #86EFAC',
                    background: '#FFFFFF',
                    color: '#166534',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Open WhatsApp Web</span>
                </button>
              </div>
            {whatsAppToast && (
              <div style={{ marginTop: '10px', padding: '10px', background: '#DCFCE7', borderRadius: '8px', fontSize: '12px', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} />
                <span>Share action opened. Delivery is not verified.</span>
              </div>
            )}
            </div>
          </div>

        </div>

      {/* Feature 3: Practice Clinical SOAP Note & ICD-10 Export Studio */}
      <div style={{
        marginTop: '24px',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #D0DFE2',
        padding: '24px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={20} color="#0F4C5C" />
              <h3 style={{ fontSize: '17px', fontWeight: 850, color: '#081C24', margin: 0 }}>
                Practice note preview & export
              </h3>
              <span style={{ background: '#E6FAF8', color: '#0F4C5C', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                Source text only
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: '#698892', margin: '4px 0 0 0' }}>
              Export the exact reviewed practice text. For consultation-derived SOAP, record and review an encounter in OPD Scribe.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopySoapNote}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #D0DFE2',
                background: '#FFFFFF',
                color: '#081C24',
                fontSize: '12px',
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {soapCopiedToast ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
              <span>{soapCopiedToast ? 'Copied SOAP Note!' : 'Copy practice note'}</span>
            </button>

            <button
              onClick={handleExportSoapJson}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: '#0A2540',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} />
              <span>Export practice JSON</span>
            </button>
          </div>
        </div>

        <div className="m-card m-card-pad m-tint-mint"><h3>Source-grounded practice note</h3><pre className="m-final-draft">{getAmieSoapNoteText()}</pre><p className="m-record-intro">For consultation-derived SOAP and doctor review, use OPD Scribe. No vitals, diagnoses, adherence verification or dispatch status are inferred by this studio.</p></div>
      </div>
    </div>
    </div>
  );
}
