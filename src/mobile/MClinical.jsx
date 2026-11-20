import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { mt } from './mobileTranslations';
import { CLINICAL_ENCOUNTERS } from '../data/clinicalEncounters';
import { speechService } from '../services/indicSpeechService';
import { openConsultationRecorder } from './consultationRecorder';
import { startBackgroundAudio, stopBackgroundAudio } from './backgroundAudio.js';
import { getRecordingConsent, grantRecordingConsent, revokeRecordingConsent, RecordingConsentRequiredError, CONSENT_TEXT_VERSION } from './recordingConsent';
import { IconMic, IconChevronR, IconHeart } from './MIcons';

const CONSENT_COPY = {
  'en-IN': {
    title: 'Recording consent',
    body: 'This app records your microphone only while you practice a consultation on this device. Audio stays in memory on this device, is never uploaded automatically, and is discarded unless you choose to transcribe it. If you tap Transcribe, that recording is sent over the internet to the speech transcription service, and Transcribe asks for your confirmation separately at that moment. You can withdraw this consent whenever you are not recording; withdrawing discards any unshared recording.',
    agree: 'I agree, start recording',
    later: 'Not now',
    withdraw: 'Withdraw consent & discard recording',
    withdrawn: 'Recording consent withdrawn. Any unshared recording was discarded and microphone recording stays off until you agree again.'
  },
  'te-IN': {
    title: 'రికార్డింగ్ సమ్మతి',
    body: 'ఈ యాప్ మీరు ఈ పరికరంలో కన్సల్టేషన్ అభ్యసిస్తున్న సమయంలో మాత్రమే మీ మైక్రోఫోన్ రికార్డ్ చేస్తుంది. ఆడియో ఈ పరికరంలోనే మెమరీలో ఉంటుంది, ఆటోమేటిగ్గా ఎప్పుడూ అప్లోడ్ అవదు, మీరు ట్రాన్స్క్రైబ్ చేయాలని ఎంచుకోకపోతే తొలగించబడుతుంది. మీరు Transcribe నొక్కితే, ఆ రికార్డింగ్ ఇంటర్నెట్ ద్వారా స్పీచ్ ట్రాన్స్క్రిప్షన్ సర్వీస్‌కు పంపబడుతుంది, మరియు ఆ సమయంలో Transcribe మీ నిర్ధారణను విడిగా అడుగుతుంది. మీరు రికార్డింగ్ చేయని సమయంలో ఈ సమ్మతిని ఉపసంహరించుకోవచ్చు; ఉపసంహరించుకుంటే షేర్ చేయని రికార్డింగ్ తొలగించబడుతుంది.',
    agree: 'నేను అంగీకరిస్తున్నాను, రికార్డింగ్ ప్రారంభించండి',
    later: 'ఇప్పుడు వద్దు',
    withdraw: 'సమ్మతి ఉపసంహరించి రికార్డింగ్ తొలగించండి',
    withdrawn: 'రికార్డింగ్ సమ్మతి ఉపసంహరించబడింది. షేర్ చేయని రికార్డింగ్ తొలగించబడింది, మీరు మళ్లీ అంగీకరించే వరకు మైక్రోఫోన్ రికార్డింగ్ ఆగిపోతుంది.'
  },
  'hi-IN': {
    title: 'रिकॉर्डिंग सहमति',
    body: 'यह ऐप केवल तभी आपका माइक्रोफ़ोन रिकॉर्ड करता है जब आप इस डिवाइस पर परामर्श का अभ्यास कर रहे हों। ऑडियो इसी डिवाइस की मेमोरी में रहता है, अपने आप कभी अपलोड नहीं होता, और जब तक आप ट्रांसक्राइब करना न चुनें तब तक हटा दिया जाता है। यदि आप Transcribe दबाते हैं, तो वह रिकॉर्डिंग इंटरनेट पर स्पीच ट्रांसक्रिप्शन सेवा को भेजी जाती है, और उस समय Transcribe आपसे अलग से पुष्टि मांगता है। जब आप रिकॉर्ड नहीं कर रहे हों, तब आप यह सहमति वापस ले सकते हैं; वापस लेने पर साझा न की गई रिकॉर्डिंग हटा दी जाती है।',
    agree: 'मैं सहमत हूँ, रिकॉर्डिंग शुरू करें',
    later: 'अभी नहीं',
    withdraw: 'सहमति वापस लें और रिकॉर्डिंग हटाएँ',
    withdrawn: 'रिकॉर्डिंग सहमति वापस ले ली गई। साझा न की गई रिकॉर्डिंग हटा दी गई और जब तक आप फिर सहमत न हों, माइक्रोफ़ोन रिकॉर्डिंग बंद रहेगी.'
  }
};
const consentCopy = lang => CONSENT_COPY[lang] || CONSENT_COPY['en-IN'];

// Transcribe-time upload consent: recording consent is not upload consent.
// The recording leaves the device ONLY after an explicit confirmation here.
const TRANSCRIBE_COPY = {
  'en-IN': {
    title: 'Send recording for transcription?',
    body: 'Transcribing sends this recording over the internet to the speech transcription service, which returns the text. Nothing is uploaded until you confirm here. Recording consent does not cover this upload.',
    confirm: 'Send & transcribe',
    cancel: 'Keep on device'
  },
  'te-IN': {
    title: 'రికార్డింగ్‌ను ట్రాన్స్క్రిప్షన్ కోసం పంపాలా?',
    body: 'ట్రాన్స్క్రైబ్ చేస్తే ఈ రికార్డింగ్ ఇంటర్నెట్ ద్వారా స్పీచ్ ట్రాన్స్క్రిప్షన్ సర్వీస్‌కు పంపబడుతుంది, అది టెక్స్ట్ తిరిగి ఇస్తుంది. మీరు ఇక్కడ నిర్ధారించే వరకు ఏమీ అప్లోడ్ అవదు. రికార్డింగ్ సమ్మతి ఈ అప్లోడ్‌ను కవర్ చేయదు.',
    confirm: 'పంపి ట్రాన్స్క్రైబ్ చేయండి',
    cancel: 'పరికరంలోనే ఉంచండి'
  },
  'hi-IN': {
    title: 'ट्रांसक्रिप्शन के लिए रिकॉर्डिंग भेजें?',
    body: 'ट्रांसक्राइब करने पर यह रिकॉर्डिंग इंटरनेट पर स्पीच ट्रांसक्रिप्शन सेवा को भेजी जाती है, जो टेक्स्ट लौटाती है। जब तक आप यहां पुष्टि न करें, कुछ भी अपलोड नहीं होता। रिकॉर्डिंग सहमति इस अपलोड को कवर नहीं करती।',
    confirm: 'भेजें और ट्रांसक्राइब करें',
    cancel: 'डिवाइस पर ही रखें'
  }
};
const transcribeCopy = lang => TRANSCRIBE_COPY[lang] || TRANSCRIBE_COPY['en-IN'];

// Noise gate copy: honest, off by default, warns about quiet speech.
const GATE_COPY = {
  'en-IN': {
    toggle: 'Noise gate (beta)',
    hint: 'Off by default. When on, steady background hum between speech is reduced at export; quiet voices below the threshold may be cut short or silenced. Raw audio stays with this recording until you leave or discard, so you can switch the gate before transcribing.',
    onTag: 'Noise gate on (beta)',
    remove: 'Remove noise gate',
    apply: 'Apply noise gate (beta)'
  },
  'te-IN': {
    toggle: 'నాయిజ్ గేట్ (బీటా)',
    hint: 'డిఫాల్ట్‌గా ఆఫ్. ఆన్ చేస్తే, మాటల మధ్య నిలిచే బ్యాక్‌గ్రౌండ్ శబ్దం ఎక్స్‌పోర్ట్ సమయంలో తగ్గుతుంది; మెల్లగా మాట్లాడే స్వరం కోతపడి లేదా నిశ్శబ్దం కావచ్చు. మీరు వదిలే లేదా తొలగించే వరకు అసలు ఆడియో ఈ రికార్డింగ్‌తోనే ఉంటుంది, కాబట్టి ట్రాన్స్క్రైబ్ చేయడానికి ముందు గేట్ మార్చవచ్చు.',
    onTag: 'నాయిజ్ గేట్ ఆన్ (బీటా)',
    remove: 'నాయిజ్ గేట్ తీసివేయండి',
    apply: 'నాయిజ్ గేట్ వర్తింపజేయండి (బీటా)'
  },
  'hi-IN': {
    toggle: 'नॉइज़ गेट (बीटा)',
    hint: 'डिफ़ॉल्ट रूप से बंद। चालू करने पर, बोलने के बीच की स्थिर पृष्ठभूमि आवाज़ एक्सपोर्ट के समय घटती है; धीमी आवाज़ कट सकती है या खामोश हो सकती है। मूल ऑडियो इस रिकॉर्डिंग के साथ तब तक रहता है जब तक आप छोड़ें या हटाएँ नहीं, इसलिए ट्रांसक्राइब करने से पहले गेट बदल सकते हैं।',
    onTag: 'नॉइज़ गेट चालू (बीटा)',
    remove: 'नॉइज़ गेट हटाएँ',
    apply: 'नॉइज़ गेट लागू करें (बीटा)'
  }
};
const gateCopy = lang => GATE_COPY[lang] || GATE_COPY['en-IN'];

export default function MClinical() {
  const navigate = useNavigate();
  const { selectedLanguage } = useApp();
  const t = key => mt(key, selectedLanguage);
  const [encId, setEncId] = React.useState(CLINICAL_ENCOUNTERS[0].id);
  const [mode, setMode] = React.useState('mic');
  const [phase, setPhase] = React.useState('idle');
  const [noiseGate, setNoiseGate] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [turns, setTurns] = React.useState([]);
  const [audio, setAudio] = React.useState(null);
  const [level, setLevel] = React.useState(0);
  const [seconds, setSeconds] = React.useState(0);
  const recorder = React.useRef(null);
  const consentAgreeRef = React.useRef(null);
  const [consentGiven, setConsentGiven] = React.useState(() => !!getRecordingConsent());
  const mounted = React.useRef(true);
  const signalSeen = React.useRef(false);
  const english = { id: 'english_practice', language: 'English', langCode: 'en-IN', patient: { name: t('practiceParticipant') }, dialogue: [] };
  const languages = mode === 'mic' ? [...CLINICAL_ENCOUNTERS, english] : CLINICAL_ENCOUNTERS;
  const encounter = languages.find(e => e.id === encId) || CLINICAL_ENCOUNTERS[0];
  const busy = ['requesting', 'recording', 'transcribing'].includes(phase);
  // Unmount/navigation cleanup must stop BOTH the WebView recorder and the
  // native foreground service; otherwise the mic-type FGS and its "recording"
  // notification leak until process death after the user navigates away.
  React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; stopBackgroundAudio(); recorder.current?.stop(); }; }, []);
  React.useEffect(() => () => { if (audio?.url) URL.revokeObjectURL(audio.url); }, [audio]);

  const stop = () => {
    stopBackgroundAudio();
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
      }, { noiseGate });
      if (!mounted.current) { capture.stop(); return; }
      recorder.current = capture; setPhase('recording');
      // Background recording (rural-PHC must-have): on native builds a
      // microphone-type foreground service with the OS persistent
      // notification runs while the app is backgrounded, satisfying
      // Android's while-in-use mic rule. It holds no audio; all
      // consent/lifecycle rules still apply. Continued WebView capture on a
      // specific device is unverified until physical-device testing. A
      // foreground-service rejection never blocks a foreground recording.
      startBackgroundAudio();
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
    setConsentGiven(true);
    start();
  };
  const declineConsent = () => setPhase('idle');
  const withdrawConsent = () => {
    stopBackgroundAudio();
    revokeRecordingConsent();
    setConsentGiven(false);
    // Explicit, labeled destruction: any unshared recording and transcript are
    // discarded on withdraw, so nothing remains uploadable after consent ends.
    if (audio?.url) URL.revokeObjectURL(audio.url);
    setAudio(null); setTurns([]); setPhase('idle');
    setStatus(consentCopy(selectedLanguage).withdrawn);
  };
  // Consent modal accessibility: focus the agree action on open, Escape declines.
  React.useEffect(() => {
    if (phase !== 'consent') return undefined;
    consentAgreeRef.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape') declineConsent(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);
  const [transcribeConsentOpen, setTranscribeConsentOpen] = React.useState(false);
  const requestTranscribe = () => setTranscribeConsentOpen(true);
  const confirmTranscribe = () => { setTranscribeConsentOpen(false); transcribe(); };
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
        <div className="m-consent-backdrop" onClick={declineConsent}>
          <section className="m-consent-modal" role="dialog" aria-modal="true" aria-label={consentCopy(selectedLanguage).title} onClick={e => e.stopPropagation()}>
            <h2 className="m-steps-title">{consentCopy(selectedLanguage).title}</h2>
            <p className="m-record-intro">{consentCopy(selectedLanguage).body}</p>
            <p className="m-record-intro">Consent text version: {CONSENT_TEXT_VERSION}</p>
            <div className="m-record-modes">
              <button ref={consentAgreeRef} className="m-btn m-btn-primary" onClick={grantAndStart}>{consentCopy(selectedLanguage).agree}</button>
              <button className="m-btn m-btn-soft" onClick={declineConsent}>{consentCopy(selectedLanguage).later}</button>
            </div>
          </section>
        </div>
      )}
      {transcribeConsentOpen && (
        <div className="m-consent-backdrop" onClick={() => setTranscribeConsentOpen(false)}>
          <section className="m-consent-modal" role="dialog" aria-modal="true" aria-label={transcribeCopy(selectedLanguage).title} onClick={e => e.stopPropagation()}>
            <h2 className="m-steps-title">{transcribeCopy(selectedLanguage).title}</h2>
            <p className="m-record-intro">{transcribeCopy(selectedLanguage).body}</p>
            <div className="m-record-modes">
              <button className="m-btn m-btn-primary" onClick={confirmTranscribe}>{transcribeCopy(selectedLanguage).confirm}</button>
              <button className="m-btn m-btn-soft" onClick={() => setTranscribeConsentOpen(false)}>{transcribeCopy(selectedLanguage).cancel}</button>
            </div>
          </section>
        </div>
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
          {consentGiven && !['recording', 'requesting', 'transcribing', 'consent'].includes(phase) && (
            <button className="m-btn m-btn-ghost m-consent-withdraw" onClick={withdrawConsent}>{consentCopy(selectedLanguage).withdraw}</button>
          )}
          <button className="m-clin-rec" disabled={phase === 'requesting' || phase === 'transcribing'} onClick={phase === 'recording' ? stop : start}>
            <span className="m-clin-rec-disc"><IconMic size={24} /></span>
            <span><b>{phase === 'recording' ? t('stopRecording') : phase === 'requesting' ? t('openingMic') : audio ? t('recordAgain') : t('recordConsultation')}</b><em>{phase === 'recording' ? 'Tap to finish and keep the audio' : t('practiceParticipant')}</em></span>
          </button>
          <label className="m-noisegate-toggle">
            <input type="checkbox" checked={noiseGate} disabled={phase === 'recording' || phase === 'requesting'} onChange={(e) => setNoiseGate(e.target.checked)} />
            <span><b>{gateCopy(selectedLanguage).toggle}</b> · {gateCopy(selectedLanguage).hint}</span>
          </label>
          {audio && <div className="m-record-playback"><label>{t('sourceRecording')} · {audio.duration.toFixed(1)} {t('secondsLabel')}{audio.noiseGate ? ` · ${gateCopy(selectedLanguage).onTag}` : ''}</label><audio controls src={audio.url} />
            {typeof audio.reexport === 'function' && (
              <button className="m-btn m-btn-ghost" onClick={() => {
                const next = audio.reexport(!audio.noiseGate);
                if (!next) return;
                URL.revokeObjectURL(audio.url);
                setAudio({ ...audio, ...next, url: URL.createObjectURL(next.blob) });
              }}>{audio.noiseGate ? gateCopy(selectedLanguage).remove : gateCopy(selectedLanguage).apply}</button>
            )}
            <button className="m-btn m-btn-primary" disabled={phase === 'transcribing' || !audio.signalSeen} onClick={requestTranscribe}>{phase === 'transcribing' ? t('transcribing') : t('transcribeRecording')}</button></div>}
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
