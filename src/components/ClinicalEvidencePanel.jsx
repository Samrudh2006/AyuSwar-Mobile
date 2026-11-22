/**
 * ClinicalEvidencePanel.jsx
 * Clinical Evidence Engine — opt-in BETA review layer for the Clinical
 * Console. Wires Source Registry -> Extraction -> Verification -> Clinician
 * Review for the CURRENT demo consultation. Does not replace or feed the
 * existing SOAP/export workflow: only records a human explicitly approves
 * are eligible for verified output, and nothing is auto-exported here.
 *
 * Model path: extraction runs through the caller-supplied callModel
 * (the console passes its existing server-proxy caller). When no caller is
 * available the panel says so and offers the explicitly labelled
 * deterministic fallback only.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ShieldCheck, AlertTriangle, FlaskConical } from 'lucide-react';
import {
  createEvidenceSession, clearEvidenceSession, registerUtterance, extractEvidence
} from '../services/clinicalEvidenceEngine.js';
import { verifyEvidence } from '../services/clinicalEvidenceVerifier.js';
import {
  applyReviewAction, selectApprovedForExport, persistEvidenceSession, loadEvidenceSession
} from '../services/clinicalEvidencePersistence.js';
import { SPEAKER, SOURCE_TYPE } from '../services/clinicalEvidenceTypes.js';
import ClinicalEvidenceTimeline from './ClinicalEvidenceTimeline.jsx';
import ClinicalEvidenceCard from './ClinicalEvidenceCard.jsx';

const mapSpeaker = (s) => (typeof s === 'string' && s.startsWith('Doctor')) ? SPEAKER.DOCTOR
  : (typeof s === 'string' && s.startsWith('Patient')) ? SPEAKER.PATIENT : SPEAKER.OTHER;

/**
 * Build a registry session from the console's existing dialogue turns.
 * Provenance is derived ONLY from what each turn actually carries:
 * - sourceType from the real capture path flags the console sets
 *   (scripted demo turns are marked by the caller via isScriptedDemo)
 * - provider from the actual capture label, else absent
 * - no timestamps are invented; live turns may carry real capturedAtMs
 */
function hashTurns(turns) {
  const s = (turns || []).map(t => `${t.speaker}|${t.text}`).join('\n');
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function buildSessionFromTurns(turns, { sessionId, isScriptedDemo }) {
  clearEvidenceSession(sessionId); // deterministic id may exist from an earlier run in this page session
  const session = createEvidenceSession(sessionId);
  turns.forEach((t) => {
    const isScriptedTurn = Boolean(t.isScripted) || isScriptedDemo;
    const provider = t.isScripted ? 'scripted_demo'
      : t.isGnaniLive ? 'gnani_stt'
      : t.isLocalDraft ? 'local_onnx_draft'
      : t.isGroqWhisper ? 'groq_whisper_large_v3_turbo'
      : t.isWebSpeech ? 'browser_webspeech'
      : isScriptedDemo ? 'scripted_demo'
      : undefined;
    registerUtterance(session, {
      speaker: mapSpeaker(t.speaker),
      language: t.lang || 'Unknown',
      text: t.text,
      sourceType: isScriptedTurn ? SOURCE_TYPE.SCRIPTED_DEMO
        : (t.isGnaniLive || t.isLocalDraft || t.isGroqWhisper || t.isWebSpeech) ? SOURCE_TYPE.PROVIDER_TRANSCRIPTION
        : SOURCE_TYPE.MANUAL_ENTRY,
      provider,
      timestampStartMs: Number.isFinite(t.capturedAtMs) ? t.capturedAtMs : undefined,
      // Scripted/demo turns are synthetic; live-captured and manually typed turns are real data.
      isSynthetic: isScriptedTurn ? true : Boolean(t.isSynthetic)
    });
  });
  return session;
}

export default function ClinicalEvidencePanel({ dialogueTurns, isScriptedDemo = true, callModel, modelVersion, reviewerIdentity }) {
  const [phase, setPhase] = useState('idle'); // idle | running | done | unavailable
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [counts, setCounts] = useState({});
  const [methodNote, setMethodNote] = useState(null);
  const [persistOptIn, setPersistOptIn] = useState(false);
  const [persistNote, setPersistNote] = useState(null);

  // Deterministic per-consultation id so a prior opt-in demo review of the
  // SAME turns restores on revisit (device-local, synthetic sessions only).
  const sessionIdRef = useRef(null);
  sessionIdRef.current = `console_${hashTurns(dialogueTurns || [])}`;

  const approvedCount = useMemo(() =>
    records.filter(r => r.clinicianStatus === 'APPROVED' || r.clinicianStatus === 'EDITED').length, [records]);

  const allSynthetic = useMemo(() =>
    (dialogueTurns || []).length > 0 && (dialogueTurns || []).every(t => t.isScripted || isScriptedDemo),
  [dialogueTurns, isScriptedDemo]);

  // Restore a previous opt-in review of this exact consultation, if any.
  useEffect(() => {
    const saved = loadEvidenceSession(sessionIdRef.current);
    if (saved && Array.isArray(saved.evidence) && saved.evidence.length > 0) {
      setSession({ sessionId: saved.sessionId, utterances: saved.utterances || [], evidence: saved.evidence });
      setRecords(saved.evidence);
      const c = {};
      for (const r of saved.evidence) c[r.verificationStatus] = (c[r.verificationStatus] || 0) + 1;
      setCounts(c);
      setPersistNote('Restored your earlier on-device demo review of this consultation (local storage, synthetic data only).');
      setPhase('done');
    }
  }, [sessionIdRef.current]);

  const maybePersist = (sess, recs) => {
    if (!persistOptIn || !sess) return;
    const res = persistEvidenceSession(sess, recs, { allowPersist: true });
    setPersistNote(res.saved
      ? 'Review saved on this device (synthetic demo data only; no live-captured content is stored).'
      : `Not saved: ${res.reason}`);
  };

  const runExtraction = async (mode) => { // 'auto' (model w/ labelled fallback) | 'offline' (never calls a model)
    setPhase('running'); setError(null); setPersistNote(null);
    try {
      const sess = buildSessionFromTurns(dialogueTurns || [], {
        sessionId: sessionIdRef.current,
        isScriptedDemo
      });
      const out = mode === 'offline'
        ? await extractEvidence(sess, { allowFallback: true }) // no caller: deterministic lexicon only
        : await extractEvidence(sess, { callModel: callModel || undefined, modelVersion, allowFallback: true });
      if (out.status === 'EXTRACTION_UNAVAILABLE') {
        setPhase('unavailable');
        setError(`Extraction unavailable: ${out.reason}. No fallback was run because you chose model-only.`);
        setSession(sess);
        return;
      }
      if (mode === 'offline') {
        setMethodNote('Offline deterministic lexicon extraction: no model was called. Coverage is limited to exact lexicon matches (some Telugu/Hindi inflected forms are not matched; unmatched content fails closed). NOT live model output.');
      } else if (out.status === 'FALLBACK_USED') {
        setMethodNote(`Live model unavailable (${out.fallbackReason}). Showing explicitly labelled deterministic fallback results: NOT live model output.`);
      } else {
        setMethodNote(null);
      }
      const { verified, counts } = verifyEvidence(sess, out.candidates);
      sess.evidence = verified;
      setSession(sess);
      setRecords(verified);
      setCounts(counts);
      maybePersist(sess, verified);
      setPhase('done');
    } catch (err) {
      setPhase('unavailable');
      setError(`Extraction failed closed: ${err.message}`);
    }
  };

  const handleReview = (record, action) => {
    try {
      const updated = applyReviewAction(record, action,
        { identity: reviewerIdentity || 'demo-reviewer', isDemo: true },
        action.type === 'EDIT' ? 'demo reviewer edit' : `demo reviewer ${action.type.toLowerCase()}`);
      setRecords(prev => {
        const next = prev.map(r => r.evidenceId === record.evidenceId ? updated : r);
        maybePersist(session, next);
        return next;
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const exportable = selectApprovedForExport(records);

  return (
    <div style={{
      background: '#F4F7F6', border: '1.5px solid #D8E2E0', borderRadius: '16px', padding: '16px',
      marginTop: '16px', textAlign: 'left'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <ShieldCheck size={16} color="#0F766E" />
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F3B3A' }}>Clinical Evidence Review</span>
        <span style={{
          fontSize: '10px', fontWeight: 800, color: '#6B21A8', background: '#FAF5FF',
          border: '1px solid #E9D5FF', borderRadius: '999px', padding: '2px 8px'
        }}>
          BETA · opt-in · demo data
        </span>
      </div>
      <p style={{ fontSize: '12px', color: '#5B706E', margin: '8px 0 12px' }}>
        Every extracted claim is checked against the exact source sentence. Approved items are marked
        source-supported, never clinically confirmed. This panel does not change the existing
        documentation, prescription or export flow.
      </p>

      {phase === 'idle' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => runExtraction('auto')} style={primaryBtn}>
              <FlaskConical size={13} /> Run evidence extraction (model, labelled fallback if unavailable)
            </button>
            <button onClick={() => runExtraction('offline')} style={{ ...primaryBtn, background: '#FFFFFF', color: '#0F766E', border: '1.5px solid #0F766E' }}>
              Run offline extraction (no model)
            </button>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '11.5px', color: allSynthetic ? '#0F3B3A' : '#94A3B8' }}>
            <input
              type="checkbox"
              checked={persistOptIn}
              disabled={!allSynthetic}
              onChange={e => setPersistOptIn(e.target.checked)}
            />
            Remember this demo review on this device (synthetic sessions only; live-captured consultations are never stored)
          </label>
        </div>
      )}
      {phase === 'running' && <div style={{ fontSize: '12px', color: '#5B706E' }}>Extracting and verifying against source...</div>}
      {phase === 'unavailable' && (
        <div style={{ fontSize: '12px', color: '#B91C1C', background: '#FEF2F2', borderRadius: '8px', padding: '10px 12px' }}>
          <AlertTriangle size={12} style={{ marginRight: 4 }} />{error}
        </div>
      )}

      {phase === 'done' && session && (
        <>
          {methodNote && (
            <div style={{ fontSize: '11px', color: '#B45309', background: '#FFFBEB', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px' }}>
              {methodNote}
            </div>
          )}
          {persistNote && (
            <div style={{ fontSize: '11px', color: '#0F766E', background: '#F0FDFA', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px' }}>
              {persistNote}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {Object.entries(counts).map(([k, v]) => (
              <span key={k} style={{ fontSize: '11px', fontWeight: 700, color: '#0F3B3A', background: '#E6F4F1', borderRadius: '999px', padding: '3px 10px' }}>
                {k}: {v}
              </span>
            ))}
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F766E', background: '#F0FDFA', borderRadius: '999px', padding: '3px 10px' }}>
              reviewed: {approvedCount}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#0F766E', background: '#F0FDFA', borderRadius: '999px', padding: '3px 10px' }}>
              export-eligible: {exportable.length}
            </span>
          </div>
          <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '12px' }}>
            <ClinicalEvidenceTimeline utterances={session.utterances} evidence={records} />
          </div>
          <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {records.map(r => <ClinicalEvidenceCard key={r.evidenceId} record={r} onReview={handleReview} />)}
            {records.length === 0 && (
              <div style={{ fontSize: '12px', color: '#5B706E' }}>No candidates extracted from this consultation.</div>
            )}
          </div>
          {error && <div style={{ fontSize: '11px', color: '#B91C1C', marginTop: '8px' }}>{error}</div>}
        </>
      )}
    </div>
  );
}

const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  fontSize: '13px', fontWeight: 700, color: '#FFFFFF', background: '#0F766E',
  border: 'none', borderRadius: '10px', padding: '9px 16px', cursor: 'pointer'
};
