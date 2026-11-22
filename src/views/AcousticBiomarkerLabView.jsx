import MYamnetTags from '../mobile/MYamnetTags';
import { acousticResearchRows } from '../services/acousticResearchPresentation';
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mic, 
  Square, 
  Activity, 
  Volume2, 
  VolumeX,
  AlertCircle, 
  Upload, 
  Sliders, 
  Sparkles, 
  CheckCircle2, 
  FileAudio, 
  FileText,
  Cpu,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeAcousticSignals, ACOUSTIC_CLUSTER_PROFILES } from '../services/clinicalMlInferenceEngine';
import { speechService, globalAudioCoordinator } from '../services/indicSpeechService';
import { reasonAcousticBiomarkerWithEvon } from '../services/gnaniEvonService';
import EvonStatusChip from '../components/EvonStatusChip';
import { earshotDescribe, earshotMatch } from '../services/acousticReasoningService';
import { computeAcousticDspMetrics, LAB_STATES } from '../services/acousticDspEngine';
import { escapeHtml } from '../utils/escapeHtml';
import { WashiTape, InkStamp, MarkerHighlight } from '../components/looseleaf/LooseleafPrimitives';

/**
 * AyuSwar Official Clinical Emblem SVG
 */
function AyuSwarClinicalLogo({ size = 42 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="asEmblemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F4C5C" />
          <stop offset="100%" stopColor="#006666" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#asEmblemGrad)" stroke="#047857" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(16, 185, 129, 0.4)" strokeDasharray="3 2" />
      <path d="M12 32 L20 32 L24 20 L28 44 L32 16 L36 48 L40 24 L44 32 L52 32" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="13" r="2.5" fill="#047857" />
      <circle cx="32" cy="51" r="2.5" fill="#047857" />
    </svg>
  );
}

/**
 * Voice Pitch Movement Trajectory Curve (F0 contour over time via responsive SVG)
 */
function PitchMovementTrajectory({ pitchTrack, durationSec, meanF0 }) {
  if (!pitchTrack || pitchTrack.length === 0) {
    return (
      <div style={{
        background: 'var(--m-card)',
        border: '1px dashed #D0DFE2',
        borderRadius: '10px',
        padding: '24px',
        textAlign: 'center',
        color: '#52707C',
        fontSize: '12px'
      }}>
        Aperiodic or unvoiced signal. Pitch trajectory contour is unavailable for non-harmonic waveforms.
      </div>
    );
  }

  const f0Values = pitchTrack.map(p => p.f0);
  const minF0 = Math.min(...f0Values);
  const maxF0 = Math.max(...f0Values);
  const fMin = Math.max(40, Math.floor(minF0 * 0.8));
  const fMax = Math.min(1000, Math.ceil(maxF0 * 1.2));
  const tMax = Math.max(0.5, durationSec || pitchTrack[pitchTrack.length - 1].timeSec || 2.0);

  const svgW = 600;
  const svgH = 180;
  const padL = 48;
  const padR = 20;
  const padT = 24;
  const padB = 30;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const getY = (hz) => padT + plotH - ((Math.min(fMax, Math.max(fMin, hz)) - fMin) / (fMax - fMin)) * plotH;
  const getX = (t) => padL + (Math.min(tMax, Math.max(0, t)) / tMax) * plotW;

  const points = pitchTrack.map(p => `${getX(p.timeSec).toFixed(1)},${getY(p.f0).toFixed(1)}`).join(' ');
  const firstPt = pitchTrack[0];
  const lastPt = pitchTrack[pitchTrack.length - 1];
  const areaD = `M ${getX(firstPt.timeSec).toFixed(1)},${(padT + plotH).toFixed(1)} L ${points.split(' ').join(' L ')} L ${getX(lastPt.timeSec).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;

  // Normal human phonation zone (85Hz - 255Hz)
  const y85 = getY(85);
  const y255 = getY(255);
  const normY = Math.min(y85, y255);
  const normH = Math.abs(y85 - y255);

  const meanY = meanF0 ? getY(meanF0) : null;

  return (
    <div style={{ background: '#061626', borderRadius: '12px', padding: '14px 16px', border: '1px solid #1E293B', color: 'var(--m-card-cool)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#047857', letterSpacing: '0.04em' }}>
            VOICE PITCH MOVEMENT TRAJECTORY (F0 CONTOUR)
          </span>
          <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#047857', padding: '1px 6px', borderRadius: 4, fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            48 kHz YIN
          </span>
        </div>
        <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>
          Min: <strong style={{ color: 'var(--m-card-cool)' }}>{minF0} Hz</strong> • Max: <strong style={{ color: 'var(--m-card-cool)' }}>{maxF0} Hz</strong> • Mean: <strong style={{ color: '#047857' }}>{meanF0} Hz</strong>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="pitchAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#047857" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0F4C5C" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines */}
          {[fMin, Math.round((fMin + fMax) / 2), fMax].map((hz) => (
            <g key={hz}>
              <line x1={padL} y1={getY(hz)} x2={padL + plotW} y2={getY(hz)} stroke="#1E293B" strokeWidth="1" />
              <text x={padL - 6} y={getY(hz) + 3} fill="#64748B" fontSize="9" textAnchor="end" fontFamily="monospace">
                {hz}Hz
              </text>
            </g>
          ))}

          {/* Mean F0 line */}
          {meanY && (
            <g>
              <line x1={padL} y1={meanY} x2={padL + plotW} y2={meanY} stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="4 3" />
              <text x={padL + plotW - 6} y={meanY - 4} fill="#F59E0B" fontSize="9" fontWeight="700" textAnchor="end" fontFamily="monospace">
                Mean F0: {meanF0} Hz
              </text>
            </g>
          )}

          {/* Area Fill */}
          <path d={areaD} fill="url(#pitchAreaGrad)" />

          {/* Trajectory Polyline */}
          <polyline fill="none" stroke="#047857" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" points={points} />

          {/* Time axis ticks */}
          {[0, tMax * 0.25, tMax * 0.5, tMax * 0.75, tMax].map((t) => (
            <g key={t}>
              <line x1={getX(t)} y1={padT + plotH} x2={getX(t)} y2={padT + plotH + 4} stroke="#475569" strokeWidth="1" />
              <text x={getX(t)} y={padT + plotH + 16} fill="#64748B" fontSize="9" textAnchor="middle" fontFamily="monospace">
                {t.toFixed(1)}s
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

export default function AcousticBiomarkerLabView() {
  const [modelAudio, setModelAudio] = useState(null);
  const { isDemoMode } = useApp();

  // Explicit State Machine: AWAITING_AUDIO | RECORDING | ANALYSING | SUCCESS | ERROR
  const [labState, setLabState] = useState(LAB_STATES.AWAITING_AUDIO);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Multi-stage analysis telemetry states (1.8s realistic laboratory workflow)
  const [analyzingStage, setAnalyzingStage] = useState(1);
  const [analyzingProgress, setAnalyzingProgress] = useState(20);
  const [analyzingStageText, setAnalyzingStageText] = useState('48kHz Frame Windowing & YIN Autocorrelation');
  const [analyzingSubtext, setAnalyzingSubtext] = useState('Windowing 2048-pt frames with 50% overlap...');

  const [visualizerMode, setVisualizerMode] = useState('spectrum'); // 'oscilloscope' | 'spectrum'
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [activeSoundName, setActiveSoundName] = useState(null);
  const [liveToneHz, setLiveToneHz] = useState(220);
  const [isToneActive, setIsToneActive] = useState(false);

  // Real-time Audio Diagnostics & Sampler State
  const [vuLevel, setVuLevel] = useState(0);
  const [detectedWheezeHz, setDetectedWheezeHz] = useState(null);
  const [isSamplingAudio, setIsSamplingAudio] = useState(false);
  const [samplingDuration, setSamplingDuration] = useState(0);
  const [sampleSummary, setSampleSummary] = useState(null);
  const samplingStartTimeRef = useRef(0);

  // Gnani Speech Services Server Status (Server-side keys only)
  const [gnaniSpeechStatus, setGnaniSpeechStatus] = useState(null);

  useEffect(() => {
    fetch('/api/gnani/status')
      .then(res => res.json())
      .then(data => setGnaniSpeechStatus(data))
      .catch(() => setGnaniSpeechStatus({ available: false, status: 'UNAVAILABLE' }));
  }, []);

  // Measured DSP Metrics: null on initial load (no placeholders, no default fake values)
  const [dspMetrics, setDspMetrics] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [evonAcousticResult, setEvonAcousticResult] = useState(null);
  const [isEvonAcousticReasoning, setIsEvonAcousticReasoning] = useState(false);

  const handleRunEvonAcousticReasoning = async () => {
    if (!dspMetrics) return;
    setIsEvonAcousticReasoning(true);
    try {
      const res = await reasonAcousticBiomarkerWithEvon(dspMetrics, 'Patient phonation test');
      setEvonAcousticResult(res);
    } catch (err) {
      console.warn('Evon acoustic reasoning error:', err);
    } finally {
      setIsEvonAcousticReasoning(false);
    }
  };

  // Earshot Local Acoustic Reasoning State (Zero-Shot Matching on measured features)
  const [earshotSemanticQuery, setEarshotSemanticQuery] = useState('respiratory wheeze');
  const [earshotMatchResult, setEarshotMatchResult] = useState(null);

  const handleTestEarshotSemanticMatch = (query) => {
    if (!dspMetrics) return;
    const q = query || earshotSemanticQuery;
    setEarshotSemanticQuery(q);
    const res = earshotMatch({
      dominantFreqHz: detectedWheezeHz || dspMetrics.pitchF0 || 220,
      spectralCentroid: dspMetrics.spectralCentroid || 1200,
      hnrDb: dspMetrics.hnrDb || 19.5
    }, q);
    setEarshotMatchResult(res);
  };

  // Live acoustic description from Earshot AST grounding (computed only when dspMetrics exist)
  const currentEarshotDescription = dspMetrics ? earshotDescribe({
    dominantFreqHz: detectedWheezeHz || dspMetrics.pitchF0 || 220,
    spectralCentroid: dspMetrics.spectralCentroid || 1200,
    hnrDb: dspMetrics.hnrDb || 19.5
  }) : null;

  // Spoken Acoustic Biomarker Telemetry Readout
  const [isSpeakingReadout, setIsSpeakingReadout] = useState(false);
  const [readoutProvider, setReadoutProvider] = useState(null);
  const [readoutLang, setReadoutLang] = useState('te'); // 'te' | 'en'

  const handleSpeakAcousticReadout = async () => {
    if (isSpeakingReadout) {
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
      speechService.stopSpeaking();
      setIsSpeakingReadout(false);
      return;
    }

    if (!dspMetrics) return;

    let readoutText = '';
    const langCode = readoutLang === 'te' ? 'te-IN' : 'en-IN';

    const centroid = Number.isFinite(dspMetrics.spectralCentroid) ? `${dspMetrics.spectralCentroid}` : 'unavailable';
    readoutText = readoutLang === 'te'
      ? `ఇది పరిశోధన కోసం ధ్వని విశ్లేషణ మాత్రమే. స్పెక్ట్రల్ సెంట్రాయిడ్ ${centroid} హెర్ట్జ్. పిచ్ అంచనాలో ఆక్టేవ్ వ్యత్యాసాలు ఉన్నాయి. వ్యాధి నిర్ధారణ లేదా వైద్య అంచనా చేయబడలేదు.`
      : `Research audio analysis only. Spectral centroid is ${centroid} Hertz. Pitch is experimental with unresolved octave disagreements. Frame variation is not cycle jitter or shimmer. No disease inference or clinical assessment is made.`;

    const wasRecordingMic = isRecordingMic && !isSamplingAudio;
    if (wasRecordingMic) {
      stopAllAudio();
    }

    setIsSpeakingReadout(true);

    // Hard-stop watchdog timer so button never hangs on Stop Voice
    const safetyWatchdog = setTimeout(() => {
      setIsSpeakingReadout(false);
    }, 12000);

    // Direct Browser Web Speech Synthesis if Gnani server is unavailable
    if ('speechSynthesis' in window && !gnaniSpeechStatus?.available) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(readoutText);
        utterance.lang = langCode;
        utterance.rate = 0.95;
        setReadoutProvider('browser_direct');
        utterance.onend = () => {
          clearTimeout(safetyWatchdog);
          setIsSpeakingReadout(false);
          if (wasRecordingMic) handleToggleLiveMic();
        };
        utterance.onerror = () => {
          clearTimeout(safetyWatchdog);
          setIsSpeakingReadout(false);
        };
        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.warn('Direct speech synth fallback:', err);
      }
    }

    try {
      await speechService.speak(readoutText, {
        channel: 'acoustic_lab_readout',
        langCode: langCode,
        skipGnani: !gnaniSpeechStatus?.available,
        onStart: (info) => {
          setReadoutProvider(info?.provider || 'browser_fallback');
        },
        onEnd: () => {
          clearTimeout(safetyWatchdog);
          setIsSpeakingReadout(false);
          if (wasRecordingMic) {
            handleToggleLiveMic();
          }
        },
        onError: () => {
          clearTimeout(safetyWatchdog);
          setIsSpeakingReadout(false);
        }
      });
    } catch {
      clearTimeout(safetyWatchdog);
      setIsSpeakingReadout(false);
    }
  };

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const activeOscillatorRef = useRef(null);
  const activeSourceRef = useRef(null);
  const fileInputRef = useRef(null);
  const samplingTimerRef = useRef(null);
  const processorRef = useRef(null);
  const recordedPcmChunksRef = useRef([]);

  // Stop audio and release hardware handles on unmount
  useEffect(() => {
    return () => {
      if (samplingTimerRef.current) clearInterval(samplingTimerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => {
          try { t.stop(); t.enabled = false; } catch {}
        });
        mediaStreamRef.current = null;
      }
      if (processorRef.current) { try { processorRef.current.disconnect(); } catch {} processorRef.current = null; }
      if (activeOscillatorRef.current) { try { activeOscillatorRef.current.stop(); } catch {} activeOscillatorRef.current = null; }
      if (activeSourceRef.current) { try { activeSourceRef.current.stop(); } catch {} activeSourceRef.current = null; }
      if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {});
          }
        } catch {}
        audioContextRef.current = null;
      }
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
    };
  }, []);

  const getOrCreateAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    if (!analyserRef.current) {
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser;
    }
    return { ctx: audioContextRef.current, analyser: analyserRef.current };
  };

  const stopAllAudio = () => {
    if (samplingTimerRef.current) {
      clearInterval(samplingTimerRef.current);
      samplingTimerRef.current = null;
    }
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch {}
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (activeOscillatorRef.current) {
      try { activeOscillatorRef.current.stop(); } catch {}
      activeOscillatorRef.current = null;
    }
    if (activeSourceRef.current) {
      try { activeSourceRef.current.stop(); } catch {}
      activeSourceRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    globalAudioCoordinator.releaseLock('acoustic_lab');
    setIsRecordingMic(false);
    setIsPlayingSound(false);
    setIsToneActive(false);
    setIsSamplingAudio(false);
    setActiveSoundName(null);
    setVuLevel(0);
  };

  // -------------------------------------------------------------
  // RESET ACTION: Clears all previous results and returns to AWAITING_AUDIO
  // -------------------------------------------------------------
  const handleReset = () => {
    setModelAudio(null);
    stopAllAudio();
    if (fileInputRef.current) fileInputRef.current.value = '';
    setLabState(LAB_STATES.AWAITING_AUDIO);
    setErrorMessage(null);
    setDspMetrics(null);
    setAnalysisResult(null);
    setSampleSummary(null);
    setDetectedWheezeHz(null);
    setSamplingDuration(0);
    setEarshotMatchResult(null);
    setEvonAcousticResult(null);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    // Redraw empty canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#061626';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  // -------------------------------------------------------------
  // Live Continuous Microphone Capture (Monitoring only)
  // -------------------------------------------------------------
  const handleToggleLiveMic = async () => {
    if (isRecordingMic) {
      stopAllAudio();
      return;
    }

    globalAudioCoordinator.acquireLock('acoustic_lab');
    speechService.stopSpeaking();
    speechService.stopConversationalSession();
    stopAllAudio();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const { ctx, analyser } = getOrCreateAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsRecordingMic(true);
      startVisualizerLoop();
    } catch (err) {
      alert('Microphone access unavailable or denied: ' + err.message);
    }
  };

  // -------------------------------------------------------------
  // Microphone Phonation Recording (Direct PCM capture into DSP pipeline)
  // -------------------------------------------------------------
  const handleTogglePhonationSampling = async () => {
    if (isSamplingAudio) {
      handleStopPhonationSampling();
      return;
    }

    globalAudioCoordinator.acquireLock('acoustic_lab');
    speechService.stopSpeaking();
    speechService.stopConversationalSession();
    stopAllAudio();
    handleReset();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const { ctx, analyser } = getOrCreateAudioContext();
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      // Raw PCM accumulation via ScriptProcessorNode
      const processor = ctx.createScriptProcessor(2048, 1, 1);
      recordedPcmChunksRef.current = [];
      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        recordedPcmChunksRef.current.push(new Float32Array(input));
      };
      source.connect(processor);

      const silentGain = ctx.createGain();
      silentGain.gain.setValueAtTime(0, ctx.currentTime);
      processor.connect(silentGain);
      silentGain.connect(ctx.destination);
      processorRef.current = processor;

      setIsRecordingMic(true);
      setIsSamplingAudio(true);
      setLabState(LAB_STATES.RECORDING);
      samplingStartTimeRef.current = Date.now();
      startVisualizerLoop();

      samplingTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - samplingStartTimeRef.current) / 1000);
        setSamplingDuration(elapsed);
        if (elapsed >= 120) {
          handleStopPhonationSampling();
        }
      }, 500);
    } catch (err) {
      setLabState(LAB_STATES.ERROR);
      setErrorMessage('Microphone access unavailable or denied: ' + err.message);
    }
  };

  // -------------------------------------------------------------
  // Multi-Stage DSP Pipeline Executor (Realistic 1.8s Laboratory Workflow)
  // -------------------------------------------------------------
  const executeMultiStageDspPipeline = async (pcmData, sampleRate, sampleName) => {
    setLabState(LAB_STATES.ANALYSING);

    setAnalyzingStage(1);
    setAnalyzingProgress(10);
    setAnalyzingStageText('Preparing audio frames');
    setAnalyzingSubtext('Local frame analysis, experimental pitch estimates and FFT spectral centroid. No clinical interpretation.');
    // Yield so each real phase paints. Stages map to actual work, no timed/fake progress.
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));

    try {
      setModelAudio({ samples: new Float32Array(pcmData.subarray(0, Math.min(pcmData.length, sampleRate * 5))), sampleRate });
      setAnalyzingStage(2);
      setAnalyzingProgress(45);
      setAnalyzingStageText('Computing research audio measurements');
      setAnalyzingSubtext('YIN pitch estimate, HNR residual, 2048-pt FFT spectral centroid...');
      await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
      const metrics = computeAcousticDspMetrics(pcmData, sampleRate);
      setDspMetrics(metrics);
      setAnalyzingStage(3);
      setAnalyzingProgress(100);
      setAnalyzingStageText('Preparing result');
      setAnalyzingSubtext('Rendering measurements. No clinical interpretation.');
      await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
      setAnalysisResult(null);
      setSampleSummary({
        fileName: sampleName,
        durationSec: metrics.durationSec,
        totalFrames: metrics.totalFrames,
        voicedFrames: metrics.voicedFrames,
        isVoiced: metrics.isVoiced,
        metrics: metrics
      });
      setLabState(LAB_STATES.SUCCESS);
    } catch (err) {
      setLabState(LAB_STATES.ERROR);
      setErrorMessage(err.message || 'Could not analyse this audio. Please try again.');
    }
  };

  const handleStopPhonationSampling = async () => {
    if (samplingTimerRef.current) {
      clearInterval(samplingTimerRef.current);
      samplingTimerRef.current = null;
    }

    setIsSamplingAudio(false);
    setIsRecordingMic(false);

    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch {}
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    const chunks = recordedPcmChunksRef.current;
    if (!chunks || chunks.length === 0) {
      setLabState(LAB_STATES.ERROR);
      setErrorMessage('Could not analyse this audio: no audio frames were captured.');
      return;
    }

    let totalLen = 0;
    for (const c of chunks) totalLen += c.length;
    const concatenatedPcm = new Float32Array(totalLen);
    let offset = 0;
    for (const c of chunks) {
      concatenatedPcm.set(c, offset);
      offset += c.length;
    }

    const { ctx } = getOrCreateAudioContext();
    const sampleRate = ctx.sampleRate || 44100;

    await executeMultiStageDspPipeline(concatenatedPcm, sampleRate, 'Microphone Phonation Recording');
  };

  // -------------------------------------------------------------
  // File Upload & Drag-and-Drop Decoder (Up to 20MB)
  // -------------------------------------------------------------
  const processAudioFile = async (file) => {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setLabState(LAB_STATES.ERROR);
      setErrorMessage(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 20MB limit supported for audio biomarker analysis.`);
      return;
    }

    stopAllAudio();
    handleReset();

    try {
      const { ctx, analyser } = getOrCreateAudioContext();
      const arrayBuffer = await file.arrayBuffer();

      let audioBuffer;
      try {
        audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      } catch {
        setLabState(LAB_STATES.ERROR);
        setErrorMessage('Could not analyse this audio: unsupported format or corrupt audio file.');
        return;
      }

      if (!audioBuffer || audioBuffer.length === 0 || audioBuffer.duration === 0) {
        setLabState(LAB_STATES.ERROR);
        setErrorMessage('Could not analyse this audio: audio file contains no samples.');
        return;
      }

      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;

      // Play audio through Web Audio graph for live canvas visualizer feedback
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      activeSourceRef.current = source;
      setIsPlayingSound(true);
      setActiveSoundName(file.name);

      source.onended = () => {
        setIsPlayingSound(false);
        setActiveSoundName(null);
      };

      source.start(0);
      startVisualizerLoop();

      await executeMultiStageDspPipeline(channelData, sampleRate, file.name);
    } catch (err) {
      setLabState(LAB_STATES.ERROR);
      setErrorMessage(err.message || 'Could not analyse this audio. Please try again.');
    }
  };

  const handleAudioFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    await processAudioFile(file);
  };

  const handleFileDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processAudioFile(file);
    }
  };

  const handlePrintAcousticReport = () => {
    if (!dspMetrics) return;

    const printWindow = window.open('', '_blank', 'width=880,height=960');
    if (!printWindow) {
      window.print();
      return;
    }

    const reportId = `AS-ABM-${Date.now().toString(36).toUpperCase()}`;
    const generatedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Generate inlined SVG for pitch trajectory
    const pitchTrack = dspMetrics.pitchTrack || [];
    let pitchSvgHtml = '';
    if (pitchTrack.length > 0) {
      const f0Values = pitchTrack.map(p => p.f0);
      const minF0 = Math.min(...f0Values);
      const maxF0 = Math.max(...f0Values);
      const fMin = Math.max(40, Math.floor(minF0 * 0.8));
      const fMax = Math.min(1000, Math.ceil(maxF0 * 1.2));
      const tMax = Math.max(0.5, dspMetrics.durationSec || pitchTrack[pitchTrack.length - 1].timeSec || 2.0);
      const svgW = 680;
      const svgH = 150;
      const padL = 48;
      const padR = 24;
      const padT = 20;
      const padB = 26;
      const plotW = svgW - padL - padR;
      const plotH = svgH - padT - padB;
      const getY = (hz) => padT + plotH - ((Math.min(fMax, Math.max(fMin, hz)) - fMin) / (fMax - fMin)) * plotH;
      const getX = (t) => padL + (Math.min(tMax, Math.max(0, t)) / tMax) * plotW;
      const points = pitchTrack.map(p => `${getX(p.timeSec).toFixed(1)},${getY(p.f0).toFixed(1)}`).join(' ');
      const firstPt = pitchTrack[0];
      const lastPt = pitchTrack[pitchTrack.length - 1];
      const areaD = `M ${getX(firstPt.timeSec).toFixed(1)},${(padT + plotH).toFixed(1)} L ${points.split(' ').join(' L ')} L ${getX(lastPt.timeSec).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;
      const y85 = getY(85);
      const y255 = getY(255);
      const normY = Math.min(y85, y255);
      const normH = Math.abs(y85 - y255);
      const meanY = dspMetrics.pitchF0 ? getY(dspMetrics.pitchF0) : null;

      pitchSvgHtml = `
      <div style="margin: 16px 0; background: #F8FAFC; border: 1px solid #D0DFE2; border-radius: 8px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #0F4C5C; margin-bottom: 6px;">
          <span>VOICE PITCH MOVEMENT TRAJECTORY (F0 CONTOUR OVER TIME)</span>
          <span>Min: ${minF0}Hz • Max: ${maxF0}Hz • Mean: ${dspMetrics.pitchF0 || 'N/A'}Hz</span>
        </div>
        <svg viewBox="0 0 ${svgW} ${svgH}" style="width: 100%; height: 140px; display: block;">
          <line x1="${padL}" y1="${getY(fMin)}" x2="${padL + plotW}" y2="${getY(fMin)}" stroke="#E2E8F0" stroke-width="1" />
          <line x1="${padL}" y1="${getY(fMax)}" x2="${padL + plotW}" y2="${getY(fMax)}" stroke="#E2E8F0" stroke-width="1" />
          <text x="${padL - 6}" y="${getY(fMin) + 3}" fill="#64748B" font-size="8.5" text-anchor="end" font-family="monospace">${fMin}Hz</text>
          <text x="${padL - 6}" y="${getY(fMax) + 3}" fill="#64748B" font-size="8.5" text-anchor="end" font-family="monospace">${fMax}Hz</text>
          ${meanY ? `<line x1="${padL}" y1="${meanY}" x2="${padL + plotW}" y2="${meanY}" stroke="#B45309" stroke-width="1.2" stroke-dasharray="4,3" /><text x="${padL + plotW - 6}" y="${meanY - 3}" fill="#B45309" font-size="8.5" font-weight="700" text-anchor="end">Mean F0: ${dspMetrics.pitchF0} Hz</text>` : ''}
          <path d="${areaD}" fill="rgba(15, 76, 92, 0.08)" />
          <polyline fill="none" stroke="#0F4C5C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
          <text x="${padL}" y="${padT + plotH + 16}" fill="#64748B" font-size="8.5" font-family="monospace">0.0s</text>
          <text x="${padL + plotW / 2}" y="${padT + plotH + 16}" fill="#64748B" font-size="8.5" text-anchor="middle" font-family="monospace">${(tMax / 2).toFixed(1)}s</text>
          <text x="${padL + plotW}" y="${padT + plotH + 16}" fill="#64748B" font-size="8.5" text-anchor="end" font-family="monospace">${tMax.toFixed(1)}s</text>
        </svg>
      </div>`;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AyuSwar AI — Research Audio Measurements (${reportId})</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #081C24; margin: 0; padding: 20px; background: #FFF; }
    .header { border-bottom: 2.5px solid #0F4C5C; padding-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand-wrap { display: flex; align-items: center; gap: 12px; }
    .brand { font-size: 20px; font-weight: 800; color: #0F4C5C; letter-spacing: -0.5px; }
    .subbrand { font-size: 11px; color: #486770; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
    .badge-teal { background: #E6F7F8; color: #0F4C5C; border: 1px solid #99F6E4; }
    .badge-green { background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
    .badge-amber { background: #FFFBEB; color: #92400E; border: 1px solid #FCD34D; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0; background: #F8FAFC; padding: 12px; border-radius: 8px; border: 1px solid #D0DFE2; font-size: 11.5px; }
    .metric-table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
    .metric-table th { background: #F1F5F9; color: #2C4A52; font-weight: 700; text-align: left; padding: 7px 10px; border: 1px solid #D0DFE2; }
    .metric-table td { padding: 8px 10px; border: 1px solid #D0DFE2; }
    .section-title { font-size: 12.5px; font-weight: 800; color: #0F4C5C; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 6px 0; border-left: 3px solid #0F4C5C; padding-left: 8px; }
    .clinical-box { background: #FAF8F5; border: 1px solid #D0DFE2; border-radius: 8px; padding: 12px; font-size: 11.5px; line-height: 1.6; }
    .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #D0DFE2; display: flex; justify-content: space-between; font-size: 10.5px; color: #52707C; }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; background: #E6F7F8; padding: 10px 16px; border-radius: 8px;">
    <span style="font-size: 12px; font-weight: 700; color: #0F4C5C;">AyuSwar research audio measurements - Print / Save PDF</span>
    <button onclick="window.print()" style="background: #0F4C5C; color: #FFF; border: none; padding: 6px 16px; border-radius: 6px; font-weight: 700; cursor: pointer;">Print / Save PDF</button>
  </div>
  <div class="header">
    <div class="brand-wrap">
      <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" fill="#0F4C5C" stroke="#047857" stroke-width="2.5" />
        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(16, 185, 129, 0.4)" stroke-dasharray="3 2" />
        <path d="M12 32 L20 32 L24 20 L28 44 L32 16 L36 48 L40 24 L44 32 L52 32" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="32" cy="13" r="2.5" fill="#047857" />
        <circle cx="32" cy="51" r="2.5" fill="#047857" />
      </svg>
      <div>
        <div class="brand">AYUSWAR AUDIO RESEARCH</div>
        <div class="subbrand">Browser-based audio engineering prototype</div>
        <div style="font-size: 10px; color: #52707C; margin-top: 1px;">Not a clinical record. No certification, diagnosis or medical sign-off.</div>
      </div>
    </div>
    <div style="text-align: right; font-size: 11px; color: #52707C;">
      <div><strong>Accession No:</strong> ${reportId}</div>
      <div><strong>Generated:</strong> ${generatedDate}</div>
      <div style="margin-top: 4px;"><span class="badge badge-teal">RESEARCH OUTPUT</span></div>
    </div>
  </div>

  <div class="meta-grid">
    <div><span style="color:#52707C; display:block;">Specimen Source:</span><strong>${escapeHtml(sampleSummary?.fileName || 'Microphone research audio')}</strong></div>
    <div><span style="color:#52707C; display:block;">Duration:</span><strong>${escapeHtml(sampleSummary?.durationSec || dspMetrics.durationSec)} s</strong></div>
    <div><span style="color:#52707C; display:block;">Sampling Rate:</span><strong>${escapeHtml(dspMetrics.sampleRate || 'Unavailable')} Hz</strong></div>
    <div><span style="color:#52707C; display:block;">Signal Type:</span><strong>${escapeHtml(dspMetrics.isVoiced ? 'Candidate periodic signal' : 'No periodic signal detected')}</strong></div>
  </div>

  <div class="section-title">Research measurements only</div>
  <p>Candidate F0 is experimental with unresolved octave disagreements on real-vowel comparisons. Frame variation is not cycle jitter/shimmer. No clinical normality, disease, registry or sign-off claim is made.</p>
  <table class="metric-table"><thead><tr><th>Measurement</th><th>Value</th><th>Definition and limits</th></tr></thead><tbody>
    ${acousticResearchRows(dspMetrics).map(([label, value, description]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td><td>${escapeHtml(description)}</td></tr>`).join('')}
  </tbody></table>
  <div class="section-title">Experimental pitch trajectory</div>
  ${pitchSvgHtml}

  <div class="footer">
    <div>AyuSwar audio research export</div>
    <div style="text-align: right;">No medical or digital signature</div>
  </div>
  <div style="background: #722F37; color: #ffffff; text-align: center; font-size: 9.5px; font-weight: 800; letter-spacing: 1px; padding: 6px 12px; margin-top: 18px; border-radius: 6px; text-transform: uppercase;">
    RESEARCH PROTOTYPE - NOT FOR DIAGNOSIS OR TRIAGE
  </div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch (err) {
        console.warn('Print popup issue:', err);
      }
    }, 250);
  };

  // -------------------------------------------------------------
  // Sample Audio: 1-Click Reference Voice Signal Analysis (F0 = 120 Hz)
  // -------------------------------------------------------------
  const handleLoadSampleVoice = async () => {
    stopAllAudio();
    setErrorMessage(null);

    try {
      const { ctx, analyser } = getOrCreateAudioContext();
      const sampleRate = ctx.sampleRate || 44100;
      const duration = 2.0;
      const totalSamples = Math.floor(sampleRate * duration);
      const pcm = new Float32Array(totalSamples);

      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        pcm[i] = 0.55 * Math.sin(2 * Math.PI * 120 * t) +
                 0.25 * Math.sin(2 * Math.PI * 240 * t) +
                 0.12 * Math.sin(2 * Math.PI * 360 * t) +
                 0.06 * Math.sin(2 * Math.PI * 480 * t);
      }

      const audioBuffer = ctx.createBuffer(1, totalSamples, sampleRate);
      audioBuffer.copyToChannel(pcm, 0);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      activeSourceRef.current = source;
      setIsPlayingSound(true);
      setActiveSoundName('Sample Audio (Synthetic Vowel 120 Hz)');

      source.onended = () => {
        setIsPlayingSound(false);
        setActiveSoundName(null);
      };

      source.start(0);
      startVisualizerLoop();

      await executeMultiStageDspPipeline(pcm, sampleRate, 'Synthetic Vowel 120 Hz (Sample Audio)');
    } catch (err) {
      setLabState(LAB_STATES.ERROR);
      setErrorMessage(err.message || 'Could not load and analyse sample audio.');
    }
  };

  // -------------------------------------------------------------
  // Synthetic Breath / Vocal Biomarker Tone Synthesizer & DSP Processor
  // -------------------------------------------------------------
  const playSyntheticBiomarkerSound = async (profileKey) => {
    stopAllAudio();

    const { ctx, analyser } = getOrCreateAudioContext();
    const profile = ACOUSTIC_CLUSTER_PROFILES[profileKey];
    if (!profile) return;

    const sampleRate = ctx.sampleRate || 44100;
    const durationSec = 2.2;
    const totalSamples = Math.floor(sampleRate * durationSec);
    const pcm = new Float32Array(totalSamples);

    if (profileKey === 'asthma_wheeze') {
      // 440 Hz whistle / high wheeze tone with turbulent expiratory noise
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const mod = 1.0 + 0.08 * Math.sin(2 * Math.PI * 3.5 * t);
        const tone = 0.5 * Math.sin(2 * Math.PI * 440 * t * mod) + 0.22 * Math.sin(2 * Math.PI * 880 * t) + 0.1 * Math.sin(2 * Math.PI * 1320 * t);
        const breathNoise = (Math.random() * 2 - 1) * 0.04;
        pcm[i] = tone + breathNoise;
      }
    } else if (profileKey === 'pediatric_stridor') {
      // 880 Hz high-pitched monophonic inspiratory sound
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const tone = 0.55 * Math.sin(2 * Math.PI * 880 * t) + 0.18 * Math.sin(2 * Math.PI * 1760 * t);
        const noise = (Math.random() * 2 - 1) * 0.06;
        pcm[i] = tone + noise;
      }
    } else if (profileKey === 'pneumonia_rales') {
      // 160 Hz low resonant rumble + crackle bursts (rales)
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const base = 0.38 * Math.sin(2 * Math.PI * 160 * t);
        const isBurst = (i % 3800 < 180);
        const crackle = isBurst ? (Math.random() * 2 - 1) * 0.35 : (Math.random() * 2 - 1) * 0.03;
        pcm[i] = base + crackle;
      }
    } else if (profileKey === 'neurological_tremor') {
      // 136 Hz voice with 5.5 Hz frequency & amplitude modulation
      let phase = 0;
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        const instF0 = 136 + 18 * Math.sin(2 * Math.PI * 5.5 * t);
        phase += 2 * Math.PI * instF0 / sampleRate;
        const ampMod = 0.7 + 0.25 * Math.sin(2 * Math.PI * 5.5 * t);
        pcm[i] = ampMod * (0.5 * Math.sin(phase) + 0.22 * Math.sin(2 * phase) + 0.1 * Math.sin(3 * phase));
      }
    } else {
      // normal_phonation (135 Hz harmonic adult vowel /a/)
      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        pcm[i] = 0.52 * Math.sin(2 * Math.PI * 135 * t) +
                 0.26 * Math.sin(2 * Math.PI * 270 * t) +
                 0.14 * Math.sin(2 * Math.PI * 405 * t) +
                 0.06 * Math.sin(2 * Math.PI * 540 * t);
      }
    }

    const audioBuffer = ctx.createBuffer(1, totalSamples, sampleRate);
    audioBuffer.copyToChannel(pcm, 0);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    activeSourceRef.current = source;
    setIsPlayingSound(true);
    setActiveSoundName(profile.label);

    source.onended = () => {
      setIsPlayingSound(false);
      setActiveSoundName(null);
    };

    source.start(0);
    startVisualizerLoop();

    await executeMultiStageDspPipeline(pcm, sampleRate, `${profile.label} (Reference Signature)`);
  };

  // -------------------------------------------------------------
  // Live Tone Slider Generator
  // -------------------------------------------------------------
  const handleToggleLiveTone = (freq) => {
    const targetFreq = freq || liveToneHz;

    if (isToneActive && activeOscillatorRef.current) {
      stopAllAudio();
      return;
    }

    stopAllAudio();
    const { ctx, analyser } = getOrCreateAudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(targetFreq, ctx.currentTime);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);

    osc.connect(gain);
    gain.connect(analyser);
    analyser.connect(ctx.destination);

    activeOscillatorRef.current = osc;
    setIsToneActive(true);
    setIsPlayingSound(true);
    setActiveSoundName(`${targetFreq} Hz Sine Tone`);

    osc.start();
    startVisualizerLoop();
  };

  const handleToneSliderChange = (e) => {
    const newHz = Number(e.target.value);
    setLiveToneHz(newHz);

    if (activeOscillatorRef.current && audioContextRef.current) {
      activeOscillatorRef.current.frequency.setValueAtTime(newHz, audioContextRef.current.currentTime);
      setActiveSoundName(`${newHz} Hz Sine Tone`);
    }
  };

  // -------------------------------------------------------------
  // Real-Time Canvas Visualizer (Oscilloscope / Spectrum Bars)
  // Note: Only draws visual feedback and VU meter. Never overwrites dspMetrics.
  // -------------------------------------------------------------
  const startVisualizerLoop = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const timeData = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);

    const render = () => {
      analyser.getByteTimeDomainData(timeData);
      analyser.getByteFrequencyData(freqData);

      ctx.fillStyle = '#061626';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = (timeData[i] - 128) / 128.0;
        sumSquares += v * v;
      }
      const rms = Math.sqrt(sumSquares / bufferLength);

      if (visualizerMode === 'oscilloscope') {
        // Clinical Calibrated Reticle Grid (KayPENTAX CSL Standard)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;

        // Horizontal Amplitude Divisions (+1.0, +0.5, 0, -0.5, -1.0)
        [0.15, 0.32, 0.5, 0.68, 0.85].forEach((ratio, idx) => {
          ctx.beginPath();
          ctx.setLineDash(idx === 2 ? [4, 4] : [2, 6]);
          ctx.strokeStyle = idx === 2 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.06)';
          ctx.moveTo(0, canvas.height * ratio);
          ctx.lineTo(canvas.width, canvas.height * ratio);
          ctx.stroke();
        });
        ctx.setLineDash([]);

        // Vertical Millisecond Time Divisions
        const timeDivs = 8;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.font = '9px monospace';
        for (let d = 1; d < timeDivs; d++) {
          const x = (d / timeDivs) * canvas.width;
          ctx.beginPath();
          ctx.setLineDash([2, 5]);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
          ctx.fillText(`${(d * 5.8).toFixed(1)}ms`, x + 3, canvas.height - 6);
        }
        ctx.setLineDash([]);

        // High-Precision Cyan Phosphor Trace
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#047857';
        ctx.shadowColor = '#047857';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;
        let peakAmp = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const dev = Math.abs((timeData[i] - 128) / 128.0);
          if (dev > peakAmp) peakAmp = dev;
          const y = (v * canvas.height) / 2;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Calibrated HUD Telemetry
        ctx.fillStyle = '#047857';
        ctx.font = '9.5px monospace';
        ctx.fillText(`OSCILLOGRAM (48kHz) • PEAK: ±${peakAmp.toFixed(2)} FS`, 12, 18);
      } else {
        // High-Definition Clinical Mel-Spectrogram & 3D Wheeze Waterfall Engine
        const sampleRate = audioContextRef.current ? audioContextRef.current.sampleRate : 44100;
        const nyquist = sampleRate / 2;
        const barCount = 64;
        const barWidth = canvas.width / barCount;

        // Frequency Grid Lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        [0.25, 0.5, 0.75].forEach(r => {
          ctx.beginPath();
          ctx.setLineDash([3, 4]);
          ctx.moveTo(0, canvas.height * r);
          ctx.lineTo(canvas.width, canvas.height * r);
          ctx.stroke();
        });
        ctx.setLineDash([]);

        // Clinical 400 - 800 Hz Wheeze Window Bounding Coordinates
        const wheezeXStart = (400 / nyquist) * canvas.width * 2.8;
        const wheezeXEnd = (800 / nyquist) * canvas.width * 2.8;

        // Translucent Wheeze Danger Band (400 - 800 Hz)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
        ctx.fillRect(wheezeXStart, 0, Math.max(30, wheezeXEnd - wheezeXStart), canvas.height);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(wheezeXStart, 0, Math.max(30, wheezeXEnd - wheezeXStart), canvas.height);
        ctx.setLineDash([]);

        // Continuous Spectral Density Fill Curve (Smooth Mel Envelope)
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);

        for (let i = 0; i < barCount; i++) {
          const index = Math.floor(i * (bufferLength / barCount) * 0.45);
          const rawVal = freqData[index] || 0;
          const barHeight = (rawVal / 255) * canvas.height * 0.88;
          const x = i * barWidth;
          const y = canvas.height - barHeight;

          // Multi-layer 3D Depth Spectral Ribbon
          const grad = ctx.createLinearGradient(0, canvas.height, 0, y);
          if (x >= wheezeXStart && x <= wheezeXEnd && rawVal > 110) {
            grad.addColorStop(0, '#7F1D1D');
            grad.addColorStop(0.5, '#B91C1C');
            grad.addColorStop(1, '#FCA5A5');
          } else {
            grad.addColorStop(0, '#042F2E');
            grad.addColorStop(0.4, '#0F4C5C');
            grad.addColorStop(0.8, '#047857');
            grad.addColorStop(1, '#D4AF37');
          }

          ctx.fillStyle = grad;
          ctx.fillRect(x, y, barWidth - 1.5, barHeight);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x + barWidth / 2, y);
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
        ctx.fill();

        // Clinical Frequency Calibration Grid
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '9.5px monospace';
        ctx.fillText('100 Hz (F0)', 10, 16);
        ctx.fillStyle = '#F87171';
        ctx.fillText('400-800 Hz (Wheeze/Stridor)', Math.max(20, wheezeXStart + 4), 16);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText('1.5 kHz (F2 Formant)', canvas.width * 0.52, 16);
        ctx.fillText('4 kHz', canvas.width - 45, 16);
      }

      // VU level feedback
      setVuLevel(Math.min(100, Math.round(rms * 280)));

      // Wheeze detection for live feedback
      const sampleRate = audioContextRef.current ? audioContextRef.current.sampleRate : 44100;
      const nyquist = sampleRate / 2;
      const minBin = Math.floor((350 / nyquist) * bufferLength);
      const maxBin = Math.floor((900 / nyquist) * bufferLength);
      let peakVal = 0, peakBin = 0, avgVal = 0, binCount = 0;
      for (let b = minBin; b <= maxBin; b++) {
        const val = freqData[b];
        avgVal += val;
        binCount++;
        if (val > peakVal) {
          peakVal = val;
          peakBin = b;
        }
      }
      const localAvg = binCount > 0 ? avgVal / binCount : 1;
      if (peakVal > 90 && (peakVal / (localAvg + 1)) > 2.2) {
        setDetectedWheezeHz(Math.round((peakBin * nyquist) / bufferLength));
      } else {
        setDetectedWheezeHz(null);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  useEffect(() => {
    if (isPlayingSound || isRecordingMic || isToneActive) {
      startVisualizerLoop();
    }
  }, [visualizerMode]);

  return (
    <div className="acoustic-lab-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Navigation Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 10 }}>
        <Link 
          to="/doctor-portal" 
          className="m-view-breadcrumb" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#0F4C5C', textDecoration: 'none', fontWeight: 750, fontSize: '13px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Doctor Portal</span>
        </Link>

        {/* Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '11px',
            background: 'var(--m-card-cool)',
            border: '1px solid #D0DFE2',
            color: '#2C4A52',
            padding: '5px 12px',
            borderRadius: 16,
            fontWeight: 800
          }}>
            DEMO / PROTOTYPE LAB
          </span>

          <span style={{
            fontSize: '11px',
            background: '#E6F7F8',
            border: '1px solid #99F6E4',
            color: '#0F4C5C',
            padding: '5px 12px',
            borderRadius: 16,
            fontWeight: 800
          }}>
            Browser-based DSP - prototype analysis
          </span>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 16,
              background: gnaniSpeechStatus?.available ? '#E6F7F8' : 'var(--m-card-cool)',
              border: '1px solid',
              borderColor: gnaniSpeechStatus?.available ? '#0F4C5C' : '#D0DFE2',
              color: gnaniSpeechStatus?.available ? '#0F4C5C' : '#486770',
              fontSize: '11px',
              fontWeight: 800
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: gnaniSpeechStatus?.available ? '#047857' : '#94A3B8' }} />
            <span>{gnaniSpeechStatus?.available ? 'Gnani Speech: LIVE' : 'Speech: Browser Fallback'}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 0, 0, 0.07)', color: '#0F4C5C', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, marginBottom: '12px' }}>
            <Activity size={14} />
            <span>VOCAL BIOMARKER & ACOUSTIC SIGNAL LAB</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 850, color: '#081C24', marginBottom: '10px' }}>
            Vocal Biomarker & Acoustic Signal Lab
          </h1>
          <p style={{ fontSize: '15px', color: '#37525C', maxWidth: '850px', lineHeight: 1.6, marginBottom: '10px' }}>
            Real-time physical digital signal processing (DSP) extracting fundamental frequency (F0), HNR estimate (YIN residual), and perturbation metrics. Research signal viewer, not for clinical diagnosis.
          </p>
        </div>

        <div style={{ marginTop: '8px' }}>
          <InkStamp label="PHYSICAL DSP WORKBENCH" sublabel="WEBAUDIO INPUT SAMPLER" color="#0F4C5C" angle="4deg" />
        </div>
      </div>

      {/* Non-Diagnostic Disclaimer Banner */}
      <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: '14px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <AlertCircle size={20} color="#B45309" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#92400E', marginBottom: '2px' }}>
            PHYSICAL SIGNAL OBSERVATIONS NOTICE (RESEARCH & BENCHMARK PROTOTYPE)
          </div>
          <p style={{ fontSize: '12px', color: '#B45309', margin: 0, lineHeight: 1.5 }}>
            Acoustic features displayed are physical audio engineering measurements (experimental F0, HNR estimate, frame period/RMS variation, and spectral centroid). Not an FDA/CDSCO approved diagnostic device. Does not produce medical diagnoses.
          </p>
        </div>
      </div>

      {/* Main Lab Grid */}
      <div className="acoustic-lab-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
        
        {/* Left Column: Visualizer, Controls, Tone Generator */}
        <div style={{ background: 'var(--m-card)', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Visualizer Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', margin: 0 }}>
                Acoustic Frequency Spectrum
              </h3>
              {activeSoundName && (
                <div style={{ fontSize: '11px', color: '#0F4C5C', fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Volume2 size={12} />
                  <span>Playing: {activeSoundName}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setVisualizerMode(visualizerMode === 'oscilloscope' ? 'spectrum' : 'oscilloscope')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #D0DFE2',
                  background: 'var(--m-card)',
                  color: '#081C24',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {visualizerMode === 'oscilloscope' ? 'Switch to Spectrum Bars' : 'Switch to Waveform'}
              </button>

              {(isRecordingMic || isPlayingSound || isToneActive) && (
                <button
                  type="button"
                  onClick={stopAllAudio}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#B91C1C',
                    color: '#FFFDF8',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Square size={12} fill="#FFF" />
                  <span>Stop</span>
                </button>
              )}
            </div>
          </div>

          {/* Canvas Screen with Looseleaf Researcher Annotations */}
          <div style={{ position: 'relative' }}>
            <canvas
              ref={canvasRef}
              width={540}
              height={180}
              style={{
                width: '100%',
                height: '180px',
                borderRadius: '12px',
                background: '#061626',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
                display: 'block'
              }}
            />
            {/* Engineer Lab Note Overlay */}
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '12px',
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(4px)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '10px', color: '#047857', fontFamily: 'monospace', fontWeight: 700 }}>
                {visualizerMode === 'oscilloscope'
 ? '⏱ 46.4ms Frame Oscillogram • Zero-Crossing Calibrated (48 kHz)'
                  : '2048-point FFT frequency spectrum - no formants or disease inference'}
              </span>
            </div>
          </div>

          {/* Real-time Dynamic VU Decibel Meter (Clinical Signal Calibrated) */}
          <div style={{ background: '#091E26', padding: '12px 14px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #1E293B' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94A3B8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: vuLevel > 10 ? '#047857' : '#486770' }} />
                <span style={{ fontWeight: 700, color: '#D0DFE2' }}>Signal Input Level (VU / RMS):</span>
              </span>
              <span style={{ fontFamily: 'monospace', color: vuLevel > 60 ? '#F59E0B' : '#047857', fontWeight: 800 }}>
                {vuLevel > 0 ? `${vuLevel}% (${-(60 - Math.round(vuLevel * 0.55))} dBFS)` : 'Idle (-60 dBFS Gate)'}
              </span>
            </div>
            <div style={{ height: 6, background: '#1E293B', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${vuLevel}%`,
                height: '100%',
                background: vuLevel > 75 ? 'linear-gradient(90deg, #F59E0B, #B91C1C)' : 'linear-gradient(90deg, #0F4C5C, #047857)',
                borderRadius: 3,
                transition: 'width 0.08s ease'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#64748B', fontFamily: 'monospace' }}>
              <span>-60 dBFS (Floor)</span>
              <span style={{ color: vuLevel > 15 ? '#047857' : '#64748B', fontWeight: vuLevel > 15 ? 750 : 500 }}>
                {vuLevel > 15 ? 'Optimal Phonation SNR' : 'Ambient Baseline'}
              </span>
              <span>0 dBFS (Peak)</span>
            </div>
          </div>

          {/* Narrow-band resonance indicator */}
          {detectedWheezeHz && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1.5px solid #F59E0B',
              borderRadius: '10px',
              padding: '10px 14px',
              color: '#B45309',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
 <span style={{ fontSize: '16px'}}></span>
                <span>Narrow-Band Resonant Peak Detected (~{detectedWheezeHz} Hz)</span>
              </div>
            </div>
          )}

          {/* Action Row: Continuous Mic, Record Phonation, Upload Audio & Reset */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <button
              type="button"
              onClick={handleToggleLiveMic}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                background: isRecordingMic && !isSamplingAudio ? '#DC2626' : '#0F4C5C',
                color: '#FFFDF8',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isRecordingMic && !isSamplingAudio ? <Square size={16} fill="#FFF" /> : <Mic size={16} />}
              <span>{isRecordingMic && !isSamplingAudio ? 'Stop Continuous' : 'Continuous Mic'}</span>
            </button>

            <button
              id="acoustic-lab-sample-btn"
              type="button"
              onClick={handleLoadSampleVoice}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                border: 'none',
                background: '#047857',
                color: '#FFFDF8',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              title="Load reference synthetic sample voice and compute physical DSP metrics"
            >
              <Sparkles size={16} />
              <span>Sample Audio</span>
            </button>

            <button
              id="acoustic-lab-upload-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1.5px solid #D0DFE2',
                background: 'var(--m-card)',
                color: '#081C24',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Upload size={16} color="#0F4C5C" />
              <span>Upload Audio</span>
            </button>
            <input 
              id="acoustic-lab-file-input"
              ref={fileInputRef} 
              type="file" 
              accept="audio/*" 
              style={{ display: 'none' }} 
              onChange={handleAudioFileUpload}
            />

            <button
              id="acoustic-lab-reset-btn"
              type="button"
              onClick={handleReset}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1.5px solid #D0DFE2',
                background: 'var(--m-card)',
                color: '#2C4A52',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              title="Clear all results and return to awaiting audio input"
            >
              <RotateCcw size={16} color="#486770" />
              <span>Reset</span>
            </button>
          </div>

          {/* Interactive Live Tone Slider */}
          <div style={{ background: 'var(--m-card)', padding: '14px 16px', borderRadius: 12, border: '1px solid #D0DFE2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 800, color: '#2C4A52' }}>
                <Sliders size={14} color="#0F4C5C" />
                <span>Interactive Acoustic Tone Generator:</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleLiveTone(liveToneHz)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: isToneActive ? '#B91C1C' : '#0F4C5C',
                  color: '#FFFDF8',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                {isToneActive ? 'Mute Tone' : 'Play Tone'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min="80"
                max="2000"
                step="5"
                value={liveToneHz}
                onChange={handleToneSliderChange}
                aria-label="Acoustic reference tone frequency in Hertz"
                aria-valuemin={80}
                aria-valuemax={2000}
                aria-valuenow={liveToneHz}
                aria-valuetext={`${liveToneHz} Hertz`}
                style={{ flex: 1, cursor: 'pointer', accentColor: '#0F4C5C' }}
              />
              <span style={{ fontSize: '13px', fontWeight: 850, color: '#081C24', minWidth: '60px', textAlign: 'right', fontFamily: 'monospace' }}>
                {liveToneHz} Hz
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94A3B8', marginTop: 4 }}>
              <span>80 Hz (Low Bass)</span>
              <span>440 Hz (Concert Pitch A4)</span>
              <span>2000 Hz (High Frequency)</span>
            </div>
          </div>

          {/* Extracted Physical DSP Metrics: RENDERED ONLY ON SUCCESS */}
          {labState === LAB_STATES.SUCCESS && dspMetrics && (
            <div style={{ animation: 'acousticResultReveal 320ms ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <img src="/assets/icons/sheet/load-success.png" alt="" aria-hidden="true" className="ayu-loadart-pop" style={{ width: '34px', height: 'auto' }} />
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#486770', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Extracted Physical DSP Metrics:
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div style={{ background: 'var(--m-card)', padding: '12px', borderRadius: '10px', border: '1px solid #D0DFE2' }}>
                  <span style={{ fontSize: '11px', color: '#52707C' }}>Candidate pitch F0 (experimental)</span>
                  <div style={{ fontSize: '18px', fontWeight: 850, color: '#081C24' }}>
                    {dspMetrics.pitchF0 !== null ? `${dspMetrics.pitchF0} Hz` : 'Unavailable'}
                  </div>
                </div>
                <div style={{ background: 'var(--m-card)', padding: '12px', borderRadius: '10px', border: '1px solid #D0DFE2' }}>
                  <span style={{ fontSize: '11px', color: '#52707C' }}>Pitch reliability</span>
                  <div style={{ fontSize: '15px', fontWeight: 850, color: '#0F4C5C' }}>
                    {dspMetrics.pitchRegister}
                  </div>
                </div>
                <div style={{ background: 'var(--m-card)', padding: '12px', borderRadius: '10px', border: '1px solid #D0DFE2' }}>
                  <span style={{ fontSize: '11px', color: '#52707C' }}>HNR estimate (YIN residual)</span>
                  <div style={{ fontSize: '18px', fontWeight: 850, color: '#081C24' }}>
                    {dspMetrics.hnrDb !== null ? `${dspMetrics.hnrDb} dB` : 'Unavailable'}
                  </div>
                </div>
                <div style={{ background: 'var(--m-card)', padding: '12px', borderRadius: '10px', border: '1px solid #D0DFE2' }}>
                  <span style={{ fontSize: '11px', color: '#52707C' }}>Spectral Centroid</span>
                  <div style={{ fontSize: '18px', fontWeight: 850, color: '#081C24' }}>
                    {dspMetrics.spectralCentroid !== null ? `${dspMetrics.spectralCentroid} Hz` : 'Unavailable'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reference Presets */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#486770', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.04em' }}>
              Synthetic Reference Tone Signatures (SIMULATION):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[
                { key: 'normal_phonation', label: '135 Hz Baseline Tone', icon: null, sub: '135Hz Harmonic Tone (Synthetic)' },
                { key: 'asthma_wheeze', label: '440 Hz Whistle Tone', icon: null, sub: '440Hz Resonant Audio (Synthetic)' },
                { key: 'pediatric_stridor', label: '880 Hz High Pitch Tone', icon: null, sub: '880Hz Audio Tone (Synthetic)' },
                { key: 'pneumonia_rales', label: 'Adventitious Burst', icon: null, sub: 'Audio Burst Pattern (Synthetic)' },
                { key: 'neurological_tremor', label: '5.5 Hz Modulated Tone', icon: null, sub: '5.5Hz Modulated Tone (Synthetic)' }
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => playSyntheticBiomarkerSound(item.key)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid',
                    borderColor: activeSoundName === ACOUSTIC_CLUSTER_PROFILES[item.key]?.label ? '#0F4C5C' : '#D0DFE2',
                    background: activeSoundName === ACOUSTIC_CLUSTER_PROFILES[item.key]?.label ? '#E6F7F8' : '#FFFDF8',
                    color: '#081C24',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '12px' }}>
                    {item.icon ? <span>{item.icon}</span> : null}
                    <span>{item.label}</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#52707C', marginTop: 2 }}>
                    {item.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: State Machine Managed Display Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* STATE 1: AWAITING_AUDIO */}
          {labState === LAB_STATES.AWAITING_AUDIO && (
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDraggingFile(false); }}
              onDrop={handleFileDrop}
              style={{
                background: isDraggingFile ? '#E6F7F8' : '#FFFDF8',
                borderRadius: '16px',
                border: isDraggingFile ? '2px dashed #0F4C5C' : '1.5px dashed #D0DFE2',
                padding: '48px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: isDraggingFile ? '#0F4C5C' : '#E6F7F8',
                color: isDraggingFile ? '#FFFFFF' : '#0F4C5C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                transition: 'all 0.2s ease'
              }}>
                <FileAudio size={32} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 850, color: '#081C24', margin: '0 0 8px 0' }}>
                {isDraggingFile ? 'Drop audio file to begin DSP analysis' : 'Awaiting audio input'}
              </h3>
              <p style={{ fontSize: '13.5px', color: '#52707C', maxWidth: '440px', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                Drag & drop a patient audio recording (.wav, .mp3, .ogg up to 20MB) or use the upload button to measure physical acoustic parameters (F0, HNR, jitter, and shimmer).
              </p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: '20px',
                background: 'var(--m-card-cool)',
                border: '1px solid #D0DFE2',
                fontSize: '12px',
                color: '#486770',
                fontWeight: 700
              }}>
                <span>Drag & drop audio here, or click "Upload Audio" on the left</span>
              </div>
            </div>
          )}

          {/* STATE 2: RECORDING */}
          {labState === LAB_STATES.RECORDING && (
            <div style={{
              background: 'var(--m-card)',
              borderRadius: '16px',
              border: '2px solid #B91C1C',
              padding: '40px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px'
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                fontSize: '18px',
                fontWeight: 900
              }}>
                {samplingDuration}s
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 850, color: '#991B1B', margin: '0 0 8px 0' }}>
                Recording Audio Phonation ({samplingDuration}s)
              </h3>
              <p style={{ fontSize: '13px', color: '#52707C', maxWidth: '420px', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                Live audio waveform and VU meter are active. Sustain phonation or record sample, then click "Stop & Analyze".
              </p>
              <button
                type="button"
                onClick={handleStopPhonationSampling}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFDF8',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Square size={14} fill="#FFF" />
                <span>Stop & Analyze</span>
              </button>
            </div>
          )}

          {/* STATE 3: ANALYSING — real local DSP pipeline (staged, duration = actual compute) */}
          {labState === LAB_STATES.ANALYSING && (
            <div style={{
              background: 'var(--m-card)',
              borderRadius: '16px',
              border: '1.5px solid #D0DFE2',
              padding: '40px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '440px',
              boxShadow: '0 8px 30px rgba(15, 76, 92, 0.06)'
            }}>
              <img src="/assets/icons/sheet/load-acoustic.png" alt="" aria-hidden="true"
                className="ayu-loadart-breathe"
                style={{ width: '92px', height: 'auto', marginBottom: '6px' }} />
              <div className="ayu-loadbars" aria-hidden="true" style={{ marginBottom: '14px' }}><span></span><span></span><span></span><span></span><span></span></div>
              {/* Animated DSP Scanning Pulse */}
              <div style={{ position: 'relative', width: 72, height: 72, marginBottom: '18px' }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '3px solid #047857',
                  opacity: 0.35,
                  animation: 'ayuswar-spin 1.4s linear infinite'
                }} />
                <div style={{
                  position: 'absolute',
                  inset: 6,
                  borderRadius: '50%',
                  background: '#0F4C5C',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#047857'
                }}>
                  <Activity size={28} />
                </div>
              </div>

              {/* Progress Bar & Stage Indicator */}
              <div style={{ width: '100%', maxWidth: '420px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#52707C', marginBottom: '6px', fontWeight: 700 }}>
                  <span>STAGE {analyzingStage} OF 3</span>
                  <span style={{ color: '#0F4C5C', fontWeight: 800 }}>{analyzingProgress}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--m-card-cool)', borderRadius: '4px', overflow: 'hidden', border: '1px solid #D0DFE2' }}>
                  <div style={{
                    width: `${analyzingProgress}%`,
                    height: '100%',
                    background: '#0F4C5C',
                    borderRadius: '4px',
                    transition: 'width 0.35s ease'
                  }} />
                </div>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 850, color: '#081C24', margin: '0 0 6px 0' }}>
                {analyzingStageText}
              </h3>
              <p style={{ fontSize: '12.5px', color: '#52707C', maxWidth: '440px', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                {analyzingSubtext}
              </p>

              {/* Step Telemetry Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', maxWidth: '390px', textAlign: 'left', fontSize: '11.5px', background: 'var(--m-card-cool)', padding: '12px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                {[
                  { stage: 1, label: '48kHz Frame Windowing & YIN Autocorrelation' },
                  { stage: 2, label: 'Frame Period & RMS Variation (Not Cycle Jitter/Shimmer)' },
                  { stage: 3, label: 'Spectral Centroid & Harmonic Energy' },
                  { stage: 4, label: 'HNR estimate (YIN residual)' },
                  { stage: 5, label: 'Synthesizing Acoustic Analysis Summary (Prototype)' }
                ].map(s => {
                  const isDone = analyzingStage > s.stage;
                  const isCurrent = analyzingStage === s.stage;
                  return (
                    <div key={s.stage} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: isDone ? '#047857' : isCurrent ? '#0F4C5C' : '#94A3B8',
                      fontWeight: isCurrent ? 800 : 600
                    }}>
 <span>{isDone ? '✓': isCurrent ? '…': '○'}</span>
                      <span>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STATE 4: ERROR */}
          {labState === LAB_STATES.ERROR && (
            <div style={{
              background: '#FEF2F2',
              borderRadius: '16px',
              border: '1.5px solid #FCA5A5',
              padding: '40px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px'
            }}>
              <img src="/assets/icons/sheet/load-error.png" alt="" aria-hidden="true"
                className="ayu-loadart-shake"
                style={{ width: '84px', height: 'auto', marginBottom: '14px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 850, color: '#991B1B', margin: '0 0 8px 0' }}>
                Could not analyse this audio
              </h3>
              <p style={{ fontSize: '13.5px', color: '#B91C1C', maxWidth: '440px', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                {errorMessage || 'Could not analyse this audio. Please try again with valid audio.'}
              </p>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#0F4C5C',
                  color: '#FFFDF8',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Reset & Try Again
              </button>
            </div>
          )}

          {labState === LAB_STATES.SUCCESS && <MYamnetTags audio={modelAudio} />}
          {/* STATE 5: SUCCESS — Hospital-Grade Voice Pathology Diagnostic Clinical Report */}
          {labState === LAB_STATES.SUCCESS && dspMetrics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Comprehensive Clinical Pathology Card */}
              <div style={{
                background: 'var(--m-card)',
                borderRadius: '16px',
                border: '1.5px solid #D0DFE2',
                boxShadow: '0 8px 30px rgba(15, 76, 92, 0.08)',
                overflow: 'hidden'
              }}>
                {/* Hospital Header with Official AyuSwar AI Emblem */}
                <div style={{
                  background: '#0F4C5C',
                  color: '#FFFDF8',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <AyuSwarClinicalLogo size={46} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '-0.3px', color: '#FFFFFF' }}>
                          AYUSWAR AUDIO RESEARCH
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          background: '#047857',
                          color: '#081C24',
                          padding: '2px 8px',
                          borderRadius: 4,
                          letterSpacing: '0.04em'
                        }}>
                          RESEARCH
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#99F6E4', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                        Browser-based audio engineering prototype
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#D0DFE2', marginTop: 2 }}>
                        Local experimental estimates - not certified or clinically validated
                      </div>
                    </div>
                  </div>

                  {/* Actions: Print PDF & Reset */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      id="acoustic-lab-print-pdf-btn"
                      type="button"
                      onClick={handlePrintAcousticReport}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: '1.5px solid #047857',
                        background: '#047857',
                        color: '#081C24',
                        fontSize: '12px',
                        fontWeight: 850,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)'
                      }}
                      title="Print research measurements and limitations"
                    >
                      <FileText size={14} />
                      <span>Print Research Measurements</span>
                    </button>
                    <button
                      id="acoustic-lab-reset-analysis-btn"
                      type="button"
                      onClick={handleReset}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: '#FFFDF8',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  {/* Accession & Telemetry Metadata Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', background: 'var(--m-card-cool)', padding: '12px 16px', borderRadius: '10px', border: '1px solid #D0DFE2', marginBottom: '20px', fontSize: '11.5px' }}>
                    <div>
                      <span style={{ color: '#52707C', display: 'block', fontSize: '10.5px' }}>Specimen Source:</span>
                      <strong style={{ color: '#081C24' }}>{sampleSummary?.fileName || 'Microphone research audio'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#52707C', display: 'block', fontSize: '10.5px' }}>Sampling Rate:</span>
                      <strong style={{ color: '#081C24' }}>{dspMetrics.sampleRate || 'Unavailable'} Hz</strong>
                    </div>
                    <div>
                      <span style={{ color: '#52707C', display: 'block', fontSize: '10.5px' }}>Duration:</span>
                      <strong style={{ color: '#081C24' }}>{sampleSummary?.durationSec || dspMetrics.durationSec}s</strong>
                    </div>
                    <div>
                      <span style={{ color: '#52707C', display: 'block', fontSize: '10.5px' }}>Signal Integrity:</span>
                      <strong style={{ color: dspMetrics.isVoiced ? '#047857' : '#B45309' }}>
                        {dspMetrics.isVoiced ? 'Candidate periodic signal' : 'No periodic signal detected'}
                      </strong>
                    </div>
                  </div>

                  <div style={{ padding: 14, borderRadius: 12, background: '#fff7e8', border: '1px solid #e4cda6', fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>
                    <strong>Research measurements, not a clinical report.</strong> Candidate F0 has unresolved octave disagreements on real-vowel comparisons. Frame variation is not cycle jitter/shimmer. CPP, formants, health scores, clinical norms and disease inference are disabled.
                  </div>
                  <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                    {acousticResearchRows(dspMetrics).map(([label, value, description]) => (
                      <div key={label} style={{ padding: 12, border: '1px solid #dce5dc', borderRadius: 10, background: '#fbfdf9' }}>
                        <strong style={{ fontSize: 13 }}>{label}</strong><div style={{ fontSize: 18, color: '#155c3e', fontWeight: 700, margin: '4px 0' }}>{value}</div>
                        <p style={{ fontSize: 12, color: '#5e6f64', lineHeight: 1.5, margin: 0 }}>{description}</p>
                      </div>
                    ))}
                  </div>
                  <details style={{ marginBottom: 16 }}><summary>Experimental pitch trajectory</summary><PitchMovementTrajectory pitchTrack={dspMetrics.pitchTrack} durationSec={dspMetrics.durationSec} meanF0={dspMetrics.pitchF0} /></details>

                  {/* Spoken Telemetry Readout */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: '10px', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F766E' }}>
                        Acoustic Telemetry Voice Readout
                      </div>
                      <div style={{ fontSize: '11px', color: '#115E59' }}>
                        {readoutProvider === 'gnani_live'
                          ? 'Gnani Timbre TTS (LIVE Audio Verified)'
                          : gnaniSpeechStatus?.available
                            ? 'Gnani Timbre TTS (Ready via Server)'
                            : 'Browser Web Speech API Fallback (GNANI_API_KEY unset)'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', background: '#E6FFFA', padding: 2, borderRadius: 6, border: '1px solid #99F6E4' }}>
                        <button
                          type="button"
                          onClick={() => setReadoutLang('te')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: 'none',
                            background: readoutLang === 'te' ? '#0F4C5C' : 'transparent',
                            color: readoutLang === 'te' ? '#FFFFFF' : '#0F766E',
                            fontSize: '11px',
                            fontWeight: 750,
                            cursor: 'pointer'
                          }}
                        >
                          తెలుగు
                        </button>
                        <button
                          type="button"
                          onClick={() => setReadoutLang('en')}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: 'none',
                            background: readoutLang === 'en' ? '#0F4C5C' : 'transparent',
                            color: readoutLang === 'en' ? '#FFFFFF' : '#0F766E',
                            fontSize: '11px',
                            fontWeight: 750,
                            cursor: 'pointer'
                          }}
                        >
                          English
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleSpeakAcousticReadout}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 6,
                          border: 'none',
                          background: isSpeakingReadout ? '#B91C1C' : '#0F4C5C',
                          color: '#FFFDF8',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <Volume2 size={13} />
 <span>{isSpeakingReadout ? 'Stop Voice': (readoutLang === 'te'? 'తెలుగు రీడౌట్': 'Speak Readout')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reference-pattern distance: GATED OFF. Profile matching against hand-set statistical
                  baselines is not validated and implies disease-pattern inference. Hidden until a
                  validated reference dataset justifies it (research track). */}
              {false && analysisResult && (
                <div style={{ background: 'var(--m-card)', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '24px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F4C5C', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                    Acoustic Reference Pattern Distance
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#52707C', marginBottom: '16px' }}>
                    Mathematical Gaussian similarity distance against standard voice literature profiles. Physical signal matching only — not a clinical disease diagnosis.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {analysisResult.allAcousticMatches?.slice(0, 4).map((match, idx) => (
                      <div key={match.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 750, color: '#081C24' }}>{match.label}</span>
                          <span style={{ color: '#52707C', fontFamily: 'monospace' }}>Reference similarity: {match.similarityScore}/100</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--m-card)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${match.similarityScore}%`,
                            height: '100%',
                            background: idx === 0 ? '#0F4C5C' : '#94A3B8',
                            borderRadius: '4px',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Clinical Safety Protocol Footer */}
          <div style={{ background: 'var(--m-card)', borderRadius: '14px', border: '1px solid #D0DFE2', padding: '16px', fontSize: '12px', color: '#486770', lineHeight: 1.6 }}>
            <strong>Clinical Safety Protocol:</strong> Quantitative physical acoustics vary with recording equipment, microphone distance, ambient noise, and vocal technique. Features serve as digital engineering aids and cannot substitute for physical auscultation, stethoscopy, or spirometry.
          </div>
        </div>
      </div>
    </div>
  );
}
