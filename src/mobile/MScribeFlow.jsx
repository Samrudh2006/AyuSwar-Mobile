import { exportTextFile } from '../services/exportFileService';
import { Capacitor, registerPlugin } from '@capacitor/core';
// AyuSwar Mobile — OPD scribe journey: record (done in MClinical) -> AI processing ->
// doctor review & edit -> voice note -> sign & dispatch.
// The doctor reviews and can edit the AI draft before anything is signed, spoken or shared;
// edited values are authoritative downstream and signing after an edit requires a fresh tap.
// Same services as the desktop console. Synthetic demo data only - not a clinical device.
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { queryGroqApi, getGroqApiKey } from '../services/aiBrainService';
import { speechService } from '../services/indicSpeechService';
import { buildDraftBundle, draftSummary } from './scribeDraft';
import { triggerHaptic } from '../utils/haptics';
import { checkNotificationPermission, requestNotificationPermission, sendLocalDemoNotification } from '../services/deviceNotificationService';
import { IconChevronR, IconMic, IconHeart } from './MIcons';
import { useApp } from '../context/AppContext';
import { mt } from './mobileTranslations';
import { MStateStyles, StateProcessing, StateError } from './MStateAnimations.jsx';
import ClinicalEvidencePanel from '../components/ClinicalEvidencePanel';
import { SUBJECTIVE_NOT_VERIFIED_LABEL } from '../services/soapDraftSafeguards';

// Full 4-stage journey. Stage 1 (record) is already complete when this screen opens.
const AyuSwarShare = registerPlugin('AyuSwarShare');
const JOURNEY_KEYS = ['Record', 'Review & edit', 'Voice note', 'Sign & share'];

const SOAP_FIELDS = [
  ['subjective', 'Subjective'],
  ['objective', 'Objective'],
  ['assessment', 'Assessment'],
  ['plan', 'Plan']
];

export default function MScribeFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedLanguage } = useApp();
  const t = key => mt(key, selectedLanguage);
  const state = location.state || {};
  const encounter = state.encounter;
  const turns = Array.isArray(state.turns) ? state.turns.filter(t => t.text?.trim()) : [];
  const validInput = !!encounter?.patient && turns.length > 0 && (state.sourceMode === 'sample' || (state.sourceMode === 'mic' && state.recording?.bytes > 44));
  const transcriptText = turns.map(d => `${d.speaker}: ${d.text}`).join('\n');

  const [step, setStep] = React.useState(0); // 0 review, 1 voice, 2 dispatch (journey stages 2-4)
  const [processing, setProcessing] = React.useState(validInput);
  const [failure, setFailure] = React.useState('');
  const [attempt, setAttempt] = React.useState(0);
  const [stage, setStage] = React.useState(t('Preparing consultation summary...'));
  const [soap, setSoap] = React.useState(null);
  const [aiLive, setAiLive] = React.useState(false);
  const [edited, setEdited] = React.useState(false);
  const [voiceState, setVoiceState] = React.useState('idle'); // idle | playing | unavailable
  const [playSecs, setPlaySecs] = React.useState(0);
  const [signed, setSigned] = React.useState(false);
  const [shared, setShared] = React.useState('');
  const [alertState, setAlertState] = React.useState('');
  const [showEvidence, setShowEvidence] = React.useState(false);
  const sessionRef = React.useRef(0);
  const playTimerRef = React.useRef(null);

  // STAGE 2: AI processing (same prompt shape as the desktop console, bounded)
  React.useEffect(() => {
    const token = ++sessionRef.current;
    if (!validInput) return;
    setProcessing(true); setFailure('');
    if (!getGroqApiKey()) {
      setFailure(t('AI is unavailable. The source transcript is retained; no draft or sample was substituted.'));
      setProcessing(false); return;
    }
    const fullDialogueText = transcriptText;
    const targetLang = (encounter.langCode || '').startsWith('te') ? 'Telugu' : ((encounter.langCode || '').startsWith('hi') ? 'Hindi' : 'English');
    const prompt = `Synthetic practice encounter. Use ONLY the supplied transcript. Do not invent symptoms, vitals, diagnoses, medications or doses; write Not documented for missing facts. This is not clinical advice.
Clinical Encounter Spoken Dialogue:
${fullDialogueText}

Synthesize an objective clinical assessment strictly from the dialogue:
1. SUBJECTIVE 2. OBJECTIVE 3. ASSESSMENT (only what was stated; do not infer diagnoses or codes) 4. PLAN
5. bestMatterVernacular: brief plain-language summary in ${targetLang}, limited to documented dialogue. Not a new prescription.
Respond strictly as JSON with keys: "subjective", "objective", "assessment", "plan", "bestMatterVernacular". Do not wrap in markdown.`;
    setStage(t('Extracting SOAP summary from the consultation...'));
    queryGroqApi(prompt, 'You are AyuSwar Clinical Scribe AI. Output valid JSON only.', 'llama-3.3-70b-versatile', 700)
      .then((raw) => {
        if (sessionRef.current !== token) return;
        if (typeof raw !== 'string' || !raw.trim()) {
          // No model response arrived (proxy route missing, unconfigured or
          // unreachable). Nothing may be attributed to the AI here.
          setSoap(null);
          setFailure(t('AI is unavailable. No model response was received. The source transcript is retained; no draft or sample was substituted.'));
          setAiLive(false);
          setProcessing(false);
          return;
        }
        try {
          const parsed = JSON.parse(String(raw).replace(/```json|```/g, '').trim());
          if (!parsed || !['subjective', 'objective', 'assessment', 'plan', 'bestMatterVernacular'].every(key => typeof parsed[key] === 'string' && parsed[key].trim())) throw new Error('incomplete');
          setSoap(parsed);
          setAiLive(true);
        } catch {
          setSoap(null); setFailure(t('AI returned an incomplete draft. Retry with the same transcript. No sample was substituted.'));
          setAiLive(false);
        }
        setProcessing(false);
      })
      .catch(() => {
        if (sessionRef.current !== token) return;
        setSoap(null); setFailure(t('AI request failed. Check your connection and retry. Source transcript retained; no sample was substituted.'));
        setAiLive(false);
        setProcessing(false);
      });
    return () => { sessionRef.current += 1; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  React.useEffect(() => () => {
    speechService.stopSpeaking();
    if (playTimerRef.current) clearInterval(playTimerRef.current);
  }, []);

  // Doctor edit: updates the authoritative draft. Any edit after signing invalidates the
  // signature so a stale artifact can never be dispatched.
  const editField = (key, value) => {
    stopVoiceNote();
    setSoap((prev) => ({ ...prev, [key]: value, ...(key !== 'bestMatterVernacular' ? { bestMatterVernacular: '' } : {}) }));
    setEdited(true);
    if (signed) setSigned(false);
    setShared('');
  };


  const startManualDraft = () => {
    setSoap({
      subjective: transcriptText,
      objective: t('Not documented in the source transcript.'),
      assessment: t('Clinician review required. No AI draft or diagnosis was generated.'),
      plan: t('Not documented. Add only clinician-reviewed instructions.'),
      bestMatterVernacular: ''
    });
    setAiLive(false);
    setEdited(true);
    setFailure('');
    setShared(t('Manual draft started from the retained source transcript. No AI output was substituted.'));
  };

  const playVoiceNote = () => {
    if (!soap?.bestMatterVernacular) return;
    triggerHaptic('medium');
    setVoiceState('preparing');
    setPlaySecs(0);
    const finish = (state) => {
      if (playTimerRef.current) { clearInterval(playTimerRef.current); playTimerRef.current = null; }
      setVoiceState(state);
    };
    speechService.speak(soap.bestMatterVernacular, {
      channel: 'mscribe_flow',
      langCode: encounter.langCode || 'en-IN',
      onStart: () => { setVoiceState('playing'); playTimerRef.current = setInterval(() => setPlaySecs(s => s + 1), 1000); },
      onEnd: () => finish('idle'),
      onError: () => finish('unavailable')
    });
  };

  const stopVoiceNote = () => {
    speechService.stopSpeaking();
    if (playTimerRef.current) { clearInterval(playTimerRef.current); playTimerRef.current = null; }
    setVoiceState('idle');
  };

  const signDemoDraft = async () => {
    triggerHaptic('medium');
    setSigned(true);
    const permission = await checkNotificationPermission();
    if (permission.supported && ['granted', 'limited'].includes(permission.status)) {
      const result = await sendLocalDemoNotification({
        title: t('AyuSwar demo draft signed'),
        body: t('Synthetic reviewed draft is ready locally on this device. No external dispatch or clinical sign-off occurred.')
      });
      setAlertState(result.delivered
        ? t('Local device notification sent. This is a synthetic draft alert only.')
        : `Demo sign-off recorded. Local notification was not sent: ${result.reason || result.error || result.status}.`);
    } else {
      setAlertState(t('Demo sign-off recorded. Enable local draft alerts below to use this device notification system.'));
    }
  };

  const enableDraftAlerts = async () => {
    const permission = await requestNotificationPermission();
    if (permission.supported && ['granted', 'limited'].includes(permission.status)) {
      const result = await sendLocalDemoNotification({
        title: t('AyuSwar local draft alerts enabled'),
        body: t('Only local synthetic draft notifications are enabled. Server push and external dispatch remain disconnected.')
      });
      setAlertState(result.delivered
        ? t('Local draft alerts enabled and a test notification was sent.')
        : `Permission is ${permission.status}, but the notification could not be sent: ${result.reason || result.error || result.status}.`);
    } else {
      setAlertState(`Local notifications were not enabled (${permission.status}${permission.error ? `: ${permission.error}` : ''}).`);
    }
  };

  const downloadFhir = async () => {
    // Built from the CURRENT (possibly doctor-edited) draft at tap time.
    const bundle = buildDraftBundle(soap, turns, state.sourceMode);
    const filename = `ayuswar-demo-fhir-${encounter.id}.json`;
    try {
      const result = await exportTextFile({
        filename,
        text: JSON.stringify(bundle, null, 2),
        shareTitle: t('AyuSwar FHIR-format research draft')
      });
      setShared(result.mode === 'native-share-sheet'
        ? t('FHIR-format research draft saved and the share sheet opened - you choose where it goes. Not ABDM validated.')
        : t('FHIR-format research draft downloaded with all reviewed fields. Not ABDM validated.'));
    } catch {
      setShared(t('Export failed or was cancelled. Nothing was sent.'));
    }
  };

  const shareSummary = async () => {
    // Built from the CURRENT (possibly doctor-edited) draft at tap time.
    const text = draftSummary(soap);
    if (navigator.share) {
      try {
        await navigator.share({ title: t('AyuSwar demo summary'), text });
        setShared(t('Share sheet opened. You choose the recipient - the app sends nothing by itself.'));
      } catch {
        setShared(t('Share cancelled.'));
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setShared(t('Summary copied. Paste it wherever you want - the app sends nothing by itself.'));
      } catch {
        setShared(t('Sharing is not available in this browser.'));
      }
    }
  };

  if (!validInput) return <main className="m-page m-flow-page"><section className="m-card m-card-pad m-tint-peach"><h2 className="m-steps-title">{t('A consultation is needed first')}</h2><p>{t('Record practice audio and check its transcript, or explicitly choose the sample demo. No draft is generated without source input.')}</p><button className="m-btn m-btn-primary" onClick={() => navigate('/clinical-console')}>{t('Start consultation')}</button></section></main>;

  const whatsappSummary = async () => {
    if (!signed) return;
    if (Capacitor.isNativePlatform()) {
      try {
        await AyuSwarShare.whatsapp({ text: draftSummary(soap) });
        setShared(t('WhatsApp opened. Choose a recipient and review before sending. AyuSwar cannot confirm delivery.'));
      } catch (error) { setShared(error.message || 'WhatsApp could not be opened. No message was sent.'); }
    } else {
      try { await navigator.clipboard.writeText(draftSummary(soap)); setShared(t('Summary copied. Open WhatsApp, choose a recipient and review it yourself. This browser cannot target the Android app.')); }
      catch { setShared(t('Direct WhatsApp handoff is available in the Android app. Use the general share option here.')); }
    }
  };

  const initials = (encounter.patient.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('');

  return (
    <main className={`m-page m-flow-page ${step > 0 ? 'm-flow-short' : ''}`}>
      <MStateStyles />
      <div className="m-flow-steps">
        {JOURNEY_KEYS.map((rawLabel, i) => { const label = t(rawLabel);
          const isDone = i === 0 || i < step + 1;
          const isCurrent = i === step + 1;
          return (
            <div key={label} className={`m-flow-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
 <span className="m-flow-dot">{isDone && !isCurrent ? '✓': i + 1}</span>
              <span className="m-flow-label">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="m-flow-patient-card">
        <span className="m-flow-avatar">{initials}</span>
        <span className="m-flow-patient-meta">
          <b>{encounter.patient.name}</b>
          <span>{state.sourceMode === 'sample' ? `${encounter.patient.age}y ${encounter.patient.gender} · ` : ''}{turns.length} {t('transcript lines')} · {state.sourceMode === 'mic' ? `${t('Recorded audio')} · ${state.recording.duration.toFixed(1)}s` : t('Sample transcript · no recording')}</span>
        </span>
      </div>

      {step === 0 && (
        <section>
          {processing ? (
            <div className="m-card m-card-pad m-tint-mint">
              <StateProcessing title={t('AI processing')} hint={stage} />
            </div>
          ) : failure ? (
            <div className="m-card m-card-pad m-tint-peach" role="alert"><StateError title={t('Draft not generated')} hint={failure} /><button className="m-btn m-btn-primary" onClick={() => setAttempt(a => a + 1)}>{t('Retry with same transcript')}</button><button className="m-btn m-btn-primary" onClick={startManualDraft}>{t('Enter manual draft from source transcript')}</button><button className="m-btn m-btn-ghost" onClick={() => navigate('/clinical-console')}>{t('Back to recording')}</button></div>
          ) : (
            <>
              <details className="m-flow-source"><summary>{t('View source transcript')} · {state.sourceMode === 'sample' ? t('sample') : t('recorded audio')}</summary>{turns.map((t, i) => <p key={i}><b>{t.speaker}:</b> {t.text}</p>)}</details>
              <div className={`m-flow-draft-banner ${aiLive ? 'is-live' : 'is-demo'}`}>
                {aiLive
                  ? t('AI draft - review and edit before signing. Your edits are final.')
                  : t('Demo draft - live AI unavailable on this device. Not a real assessment.')}
                {edited ? ` · ${t('Edited by doctor')}` : ''}
              </div>
              <div className="m-card m-card-pad m-tint-mint">
                <h2 className="m-steps-title">{t('Doctor review & edit')}</h2>
                {SOAP_FIELDS.map(([key, label]) => (
                  <label key={key} className="m-flow-field">
                    <span>{t(label)}</span>
                    {key === 'subjective' && (
                      <span style={{
                        display: 'block',
                        fontSize: '10.5px',
                        lineHeight: 1.4,
                        color: '#92400E',
                        background: '#FFFBEB',
                        border: '1px dashed #D97706',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        marginBottom: '4px'
                      }}>
                        {SUBJECTIVE_NOT_VERIFIED_LABEL}
                      </span>
                    )}
                    <textarea
                      rows={key === 'subjective' ? 3 : 2}
                      value={soap?.[key] || ''}
                      onChange={(e) => editField(key, e.target.value)}
                    />
                  </label>
                ))}
                <label className="m-flow-field">
                  <span>{t('Voice note text (spoken to patient)')}</span>
                  <textarea
                    rows={3}
                    placeholder={t('After changing SOAP fields, write or update the voice summary here.')}
                    value={soap?.bestMatterVernacular || ''}
                    onChange={(e) => editField('bestMatterVernacular', e.target.value)}
                  />
                </label>
                <button className="m-btn m-btn-ghost" style={{ marginTop: 6 }} onClick={() => { triggerHaptic('light'); navigate('/opd-note', { state: { soap, encounter, turns, sourceMode: state.sourceMode } }); }}>
                  {t('Open structured OPD note')}
                </button>
                <button className="m-btn m-btn-primary" disabled={!soap?.bestMatterVernacular?.trim()} style={{ marginTop: 6 }} onClick={() => { triggerHaptic('light'); setStep(1); }}>
                  {edited ? t('Continue with my edits') : t('Approve & continue to voice note')}
                </button>
              </div>
            </>
          )}
          {/* Evidence check is reachable in every step-0 state, including the
              keyless failure state - it checks the source transcript, not the
              draft, so it must not be gated on a draft existing. */}
          {!processing && (
            <div className="m-card m-card-pad m-tint-sky" style={{ marginTop: 10 }}>
              <button className="m-btn m-btn-ghost" style={{ width: '100%' }} onClick={() => { triggerHaptic('light'); setShowEvidence(v => !v); }}>
                {showEvidence ? t('evidenceReviewHide') : t('evidenceReviewToggle')}
              </button>
              <p style={{ fontSize: 12, color: 'var(--m-muted)', margin: '8px 0 0' }}>{t('evidenceReviewHint')}</p>
              {showEvidence && (
                <ClinicalEvidencePanel
                  dialogueTurns={turns}
                  isScriptedDemo={state.sourceMode === 'sample'}
                  reviewerIdentity="Clinician (demo)"
                />
              )}
            </div>
          )}
        </section>
      )}

      {step === 1 && (
        <section>
          <div className="m-card m-card-pad m-tint-peach">
            <h2 className="m-steps-title">{t('Reviewed voice summary')}</h2>
            {!aiLive && (
              <p className="m-flow-demo-note">{t('Manual/local draft - not extracted by AI, not a real assessment, and not a prescription.')}</p>
            )}
            {edited && <p className="m-flow-edited-note">{t('Includes the doctor edits from the review step.')}</p>}
            <p className="m-flow-voice-text">{soap?.bestMatterVernacular || t('No voice note text.')}</p>
            <figure className="m-consultation-photo"><img src="/assets/consultation-indian-generated-20261117.webp" alt="AI-generated fictional Indian consultation illustration" /><figcaption>{t('AI-generated illustration · fictional people, not a patient record')}</figcaption></figure>
            <details className="m-flow-source"><summary>{t('Consultation source')}</summary>{turns.map((line,index)=><p key={index}>{line.text}</p>)}</details>
            <button
              className={`m-clin-rec ${voiceState === 'playing' ? 'recording' : ''}`}
              disabled={voiceState === 'preparing'}
              onClick={() => { voiceState === 'playing' ? stopVoiceNote() : playVoiceNote(); }}
            >
              <span className="m-clin-rec-disc"><IconMic size={24} /></span>
              <span>
                <b>{voiceState === 'preparing' ? t('Preparing audio...') : voiceState === 'playing' ? `${t('Playing')} - ${playSecs}s - ${t('tap to stop')}` : t('Play voice note')}</b>
                <em>{voiceState === 'unavailable' ? t('Voice unavailable on this device - read the text above') : `${t('Speaks in')} ${(encounter.langCode || '').startsWith('te') ? 'తెలుగు' : (encounter.langCode || '').startsWith('hi') ? 'हिन्दी' : (encounter.language || 'English')}`}</em>
              </span>
            </button>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="m-btn m-btn-ghost" onClick={() => { stopVoiceNote(); setStep(0); }}>{t('Back to review')}</button>
              <button className="m-btn m-btn-primary" onClick={() => { stopVoiceNote(); triggerHaptic('light'); setStep(2); }}>{t('Continue to sign & send')}</button>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="m-dispatch-section">
          <div className="m-card m-card-pad m-tint-sky">
            <h2 className="m-steps-title">{t('Review & share (demo)')}</h2>
            <button className={`m-btn ${signed ? 'm-btn-primary' : 'm-btn-ghost'}`} style={{ width: '100%' }} onClick={signDemoDraft}>
              {signed ? t('Signed by doctor (demo)') : t('Tap to sign (demo)')}
            </button>
            <details className="m-flow-source" open style={{ marginTop: 12 }}><summary>{t('Final reviewed draft')}</summary><pre className="m-final-draft" tabIndex={0} role="region" aria-label="Final reviewed draft, scrollable">{draftSummary(soap)}</pre></details>
            {signed && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="m-whatsapp-share" onClick={whatsappSummary}>
                  <img src="/assets/whatsapp-official-green.svg" alt="" width="34" height="34" />
                  <span><b>{t('Share on WhatsApp')}</b><small>{Capacitor.isNativePlatform() ? t('Choose a recipient in WhatsApp - no automatic send') : t('Copy summary, then choose a WhatsApp recipient')}</small></span>
                  <IconChevronR size={18} />
                </button>
                <button className="m-solrow" onClick={shareSummary}>
                  <span className="m-solrow-icon tint-green"><IconHeart size={18} /></span>
                  <span className="m-solrow-text"><b>{t('Other share options')}</b><span>{t('Opens the phone share sheet - you pick the recipient')}</span></span>
                  <IconChevronR size={16} style={{ color: 'var(--m-muted)', flex: '0 0 auto' }} />
                </button>
                <button className="m-solrow" onClick={enableDraftAlerts}>
                  <span className="m-solrow-icon tint-green"><IconHeart size={18} /></span>
                  <span className="m-solrow-text"><b>{t('Enable local draft alerts')}</b><span>{t('Android/browser local notification only · no server push')}</span></span>
                  <IconChevronR size={16} style={{ color: 'var(--m-muted)', flex: '0 0 auto' }} />
                </button>
                <button className="m-solrow" onClick={downloadFhir}>
                  <span className="m-solrow-icon tint-green"><IconHeart size={18} /></span>
                  <span className="m-solrow-text"><b>{t('Download FHIR research draft')}</b><span>{t('All edited fields · not ABDM validated')}</span></span>
                  <IconChevronR size={16} style={{ color: 'var(--m-muted)', flex: '0 0 auto' }} />
                </button>
              </div>
            )}
            {alertState ? <p className="m-clin-status">{alertState}</p> : null}
            {shared ? <p className="m-clin-status">{shared}</p> : null}
            <button className="m-btn m-btn-ghost" style={{ marginTop: 8 }} onClick={() => setStep(1)}>{t('Back')}</button>
          </div>
          <p className="m-sanj-note">{t('Synthetic practice only. AI and speech services process input when requested. Signing is a demo acknowledgement, not a digital signature. Nothing is dispatched to WhatsApp or ABDM.')}</p>
        </section>
      )}
    </main>
  );
}
