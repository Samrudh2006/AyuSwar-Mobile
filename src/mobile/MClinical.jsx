import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { mt } from './mobileTranslations';
import { CLINICAL_ENCOUNTERS } from '../data/clinicalEncounters';
import { speechService } from '../services/indicSpeechService';
import { openConsultationRecorder } from './consultationRecorder';
import { grantRecordingConsent, RecordingConsentRequiredError, CONSENT_TEXT_VERSION } from './recordingConsent';
import { IconMic, IconChevronR, IconHeart } from './MIcons';

const CONSENT_COPY = {
  'en-IN': {
    title: 'Recording consent',
    body: 'This app records your microphone only while you practice a consultation on this device. Audio stays in memory on this device, is never uploaded automatically, and is discarded unless you choose to transcribe it. You can withdraw this consent at any time.',
    agree: 'I agree, start recording',
    later: 'Not now'
  },
  'te-IN': {
    title: 'రికార్డింగ్ సమ్మతి',
    body: 'ఈ యాప్ మీరు ఈ పరికరంలో కన్సల్టేషన్ అభ్యసిస్తున్న సమయంలో మాత్రమే మీ మైక్రోఫోన్ రికార్డ్ చేస్తుంది. ఆడియో ఈ పరికరంలోనే మెమరీలో ఉంటుంది, ఆటోమేటిగ్గా ఎప్పుడూ అప్లోడ్ అవదు, మీరు ట్రాన్స్క్రైబ్ చేయాలని ఎంచుకోకపోతే తొలగించబడుతుంది. మీరు ఎప్పుడైనా ఈ సమ్మతిని ఉపసంహరించుకోవచ్చు.',
    agree: 'నేను అంగీకరిస్తున్నాను, రికార్డింగ్ ప్రారంభించండి',
    later: 'ఇప్పుడు వద్దు'
  },
  'hi-IN': {
    title: 'रिकॉर्डिंग सहमति',
    body: 'यह ऐप केवल तभी आपका माइक्रोफ़ोन रिकॉर्ड करता है जब आप इस डिवाइस पर परामर्श का अभ्यास कर रहे हों। ऑडियो इसी डिवाइस की मेमोरी में रहता है, अपने आप कभी अपलोड नहीं होता, और जब तक आप ट्रांसक्राइब करना न चुनें तब तक हटा दिया जाता है। आप कभी भी यह सहमति वापस ले सकते हैं।',
    agree: 'मैं सहमत हूँ, रिकॉर्डिंग शुरू करें',
    later: 'अभी नहीं'
  }
};
const consentCopy = lang => CONSENT_COPY[lang] || CONSENT_COPY['en-IN'];

export default function MClinical() {
  const navigate = useNavigate();
  const { selectedLanguage } = useApp();
  const t = key => mt(key, selectedLanguage);
  const [encId, setEncId] = React.useState(CLINICAL_ENCOUNTERS[0].id);
  const [mode, setMode] = React.useState('mic');
  const [phase, setPhase] = React.useState('idle');
  const [status, setStatus] = React.useState('');
  const [turns, setTurns] = React.useState([]);
  const [audio, setAudio] = React.useState(null);
  const [level, setLevel] = React.useState(0);
  const [seconds, setSeconds] = React.useState(0);
  const recorder = React.useRef(null);
  const mounted = React.useRef(true);
  const signalSeen = React.useRef(false);
  const english = { id: 'english_practice', language: 'English', langCode: 'en-IN', patient: { name: t('practiceParticipant') }, dialogue: [] };
  const languages = mode === 'mic' ? [...CLINICAL_ENCOUNTERS, english] : CLINICAL_ENCOUNTERS;
  const encounter = languages.find(e => e.id === encId) || CLINICAL_ENCOUNTERS[0];
  const busy = ['requesting', 'recording', 'transcribing'].includes(phase);
  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; recorder.current?.stop(); }; }, []);
  React.useEffect(() => () => { if (audio?.url) URL.revokeObjectURL(audio.url); }, [audio]);

  const stop = () => {
    const result = recorder.current?.stop();
    recorder.current = null;
    setLevel(0);
    if (!result || result.duration < 0.5) {
      setPhase('idle'); setStatus(t('tooShort')); return;
    }
    setAudio({ ...result, url: URL.createObjectURL(result.blob), signalSeen: signalSeen.current });
    setPhase('recorded');
    setStatus(signalSeen.current ? t('savedMemory') : t('noSignal'));
  };
  const start = async () => {
    setTurns([]); setAudio(null); setSeconds(0); signalSeen.current = false;
    setPhase('requesting'); setStatus(t('requestMic'));
    try {
      const capture = await openConsultationRecorder((rms, duration) => {
        if (!mounted.current) return;
        if (rms > 0.002) signalSeen.current = true;
        setLevel(rms); setSeconds(duration);
        if (duration >= 180 && recorder.current) stop();
      });
      if (!mounted.current) { capture.stop(); return; }
      recorder.current = capture; setPhase('recording');
      setStatus(t('recordingActual'));
    } catch (error) {
      setPhase('idle'); setLevel(0);
      if (error instanceof RecordingConsentRequiredError || error.name === 'RecordingConsentRequiredError') {
        setPhase('consent'); setStatus(''); return;
      }
      setStatus(error.name === 'NotAllowedError' ? t('micDenied') : `${t('recordingUnavailable')}: ${error.message}`);
    }
  };
  const grantAndStart = () => {
    grantRecordingConsent();
    start();
  };
  const transcribe = async () => {
    if (!audio?.blob || !audio.signalSeen) return;
    if (!navigator.onLine) { setStatus(t('offlineTranscribe')); return; }
    setPhase('transcribing'); setStatus(t('transcribing'));
    try {
      const result = await speechService.transcribeAudioWithGnani(audio.blob, encounter.langCode || 'te-IN', { timeoutMs: 20000 });
      if (!mounted.current) return;
      const text = result?.transcript?.trim();
      if (!text) { setPhase('recorded'); setStatus(t('noTranscript')); return; }
      setTurns([{ speaker: 'Consultation', text, live: true }]);
      setPhase('ready'); setStatus(t('transcriptReady'));
    } catch {
      if (!mounted.current) return;
      setPhase('recorded'); setStatus(t('transcriptionFailed'));
    }
  };
  const chooseMode = next => {
    if (busy) return;
    setMode(next); if (next === 'sample' && encId === 'english_practice') setEncId(CLINICAL_ENCOUNTERS[0].id); setAudio(null); setTurns([]); setSeconds(0); setLevel(0); setPhase('idle'); setStatus('');
  };
  const sample = () => {
    setTurns(encounter.dialogue.map(t => ({ ...t, live: false })));
    setPhase('ready'); setStatus(t('scriptedSample'));
  };
  const ready = turns.some(t => t.text?.trim()) && !busy && (mode === 'sample' || !!audio);
  return (
    <main className="m-page m-flow-page m-record-page">
      <div className="m-flow-steps" aria-label="Consultation journey">
        {[t('record'), t('reviewEdit'), t('voiceNote'), t('signShare')].map((label, i) => <div className={`m-flow-step ${i === 0 ? 'current' : ''}`} key={label}><span className="m-flow-dot">{i + 1}</span><span className="m-flow-label">{label}</span></div>)}
      </div>
      <section className="m-card m-card-pad m-tint-mint">
        <span className="m-clin-label">{t('syntheticConsultation')}</span>
        <h2 className="m-steps-title">{t('startConsultation')}</h2>
        <p className="m-record-intro">{t('consultationIntro')}</p>
        <div className="m-record-modes">
          <button className={`m-btn ${mode === 'mic' ? 'm-btn-primary' : 'm-btn-soft'}`} disabled={busy} onClick={() => chooseMode('mic')}>{t('microphone')}</button>
          <button className={`m-btn ${mode === 'sample' ? 'm-btn-primary' : 'm-btn-soft'}`} disabled={busy} onClick={() => chooseMode('sample')}>{t('sampleDemo')}</button>
        </div>
      </section>
      {phase === 'consent' && (
        <section className="m-card m-card-pad m-tint-mint" role="dialog" aria-label={consentCopy(selectedLanguage).title}>
          <h2 className="m-steps-title">{consentCopy(selectedLanguage).title}</h2>
          <p className="m-record-intro">{consentCopy(selectedLanguage).body}</p>
          <p className="m-record-intro">Consent text version: {CONSENT_TEXT_VERSION}</p>
          <div className="m-record-modes">
            <button className="m-btn m-btn-primary" onClick={grantAndStart}>{consentCopy(selectedLanguage).agree}</button>
            <button className="m-btn m-btn-soft" onClick={() => setPhase('idle')}>{consentCopy(selectedLanguage).later}</button>
          </div>
        </section>
      )}
      <section className="m-card m-card-pad m-tint-peach">
        <label className="m-record-language">{t('consultationLanguage')}
          <select disabled={busy} value={encounter.id} onChange={e => { setEncId(e.target.value); setTurns([]); setAudio(null); setPhase('idle'); setStatus(''); }}>
            {languages.map(e => <option key={e.id} value={e.id}>{e.language}</option>)}
          </select>
        </label>
        {mode === 'mic' ? <>
          <h2 className="m-steps-title">{t('recordPractice')}</h2>
          <p className="m-record-intro">{t('recordingPrivacy')}</p>
          <div className="m-record-meter" role="meter" aria-label="Actual microphone level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, level * 5) * 100)}>
            <span style={{ width: `${Math.min(100, level * 500)}%` }} />
          </div>
          <p className="m-record-clock">{Math.floor(seconds / 60)}:{String(Math.floor(seconds % 60)).padStart(2, '0')} <span>{phase === 'recording' ? t('recording') : t('stopped')}</span></p>
          <button className="m-clin-rec" disabled={phase === 'requesting' || phase === 'transcribing'} onClick={phase === 'recording' ? stop : start}>
            <span className="m-clin-rec-disc"><IconMic size={24} /></span>
            <span><b>{phase === 'recording' ? t('stopRecording') : phase === 'requesting' ? t('openingMic') : audio ? t('recordAgain') : t('recordConsultation')}</b><em>{phase === 'recording' ? 'Tap to finish and keep the audio' : t('practiceParticipant')}</em></span>
          </button>
          {audio && <div className="m-record-playback"><label>{t('sourceRecording')} · {audio.duration.toFixed(1)} {t('secondsLabel')}</label><audio controls src={audio.url} /><button className="m-btn m-btn-primary" disabled={phase === 'transcribing' || !audio.signalSeen} onClick={transcribe}>{phase === 'transcribing' ? t('transcribing') : t('transcribeRecording')}</button></div>}
        </> : <>
          <h2 className="m-steps-title">{t('trySample')}</h2>
          <p className="m-record-intro">{encounter.patient.name} · {encounter.patient.age}y · {t('noMicSample')}</p>
          <button className="m-btn m-btn-primary" onClick={sample}>{t('useSample')}</button>
        </>}
        {status && <p className="m-clin-status" role="status">{status}</p>}
      </section>
      {turns.length > 0 && <section className="m-card m-card-pad m-tint-sky"><h2 className="m-steps-title">{t('checkTranscript')}</h2><p className="m-record-intro">{mode === 'sample' ? t('scriptedSample') : t('correctRecognition')}</p>{turns.map((t, i) => <label key={i} className="m-flow-field"><span>{t.speaker}</span><textarea rows={3} value={t.text} onChange={e => setTurns(previous => previous.map((line, index) => index === i ? { ...line, text: e.target.value } : line))} /></label>)}</section>}
      <button className="m-btn m-btn-primary m-record-continue" disabled={!ready} onClick={() => navigate('/clinical-console/review', { state: { encounter: mode === 'mic' ? { id: 'recorded-practice', language: encounter.language, langCode: encounter.langCode, patient: { name: t('practiceParticipant') } } : encounter, turns, sourceMode: mode, recording: audio ? { duration: audio.duration, bytes: audio.blob.size } : null } })}>{t('generateDraft')} <IconChevronR size={18} /></button>
      <p className="m-sanj-note">{t('prototypeNote')}</p>
    </main>
  );
}
