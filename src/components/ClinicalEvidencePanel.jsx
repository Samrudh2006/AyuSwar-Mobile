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

import React, { useMemo, useState } from 'react';
import { ShieldCheck, AlertTriangle, FlaskConical } from 'lucide-react';
import {
  createEvidenceSession, registerUtterance, extractEvidence
} from '../services/clinicalEvidenceEngine.js';
import { verifyEvidence } from '../services/clinicalEvidenceVerifier.js';
import { applyReviewAction, selectApprovedForExport } from '../services/clinicalEvidencePersistence.js';
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
function buildSessionFromTurns(turns, { sessionId, isScriptedDemo }) {
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

  const approvedCount = useMemo(() =>
    records.filter(r => r.clinicianStatus === 'APPROVED' || r.clinicianStatus === 'EDITED').length, [records]);

  const runExtraction = async (allowFallback) => {
    setPhase('running'); setError(null);
    try {
      const sess = buildSessionFromTurns(dialogueTurns || [], {
        sessionId: `console_${Date.now().toString(36)}`,
        isScriptedDemo
      });
      const out = await extractEvidence(sess, {
        callModel: allowFallback ? callModel : (callModel || undefined),
        modelVersion,
        allowFallback
      });
      if (out.status === 'EXTRACTION_UNAVAILABLE') {
        setPhase('unavailable');
        setError(`Extraction unavailable: ${out.reason}. No fallback was run because you chose model-only.`);
        setSession(sess);
        return;
      }
      if (out.status === 'FALLBACK_USED') {
        setMethodNote(`Live model unavailable (${out.fallbackReason}). Showing explicitly labelled deterministic fallback results: NOT live model output.`);
      } else {
        setMethodNote(null);
      }
      const { verified, counts } = verifyEvidence(sess, out.candidates);
      sess.evidence = verified;
      setSession(sess);
      setRecords(verified);
      setCounts(counts);
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
      setRecords(prev => prev.map(r => r.evidenceId === record.evidenceId ? updated : r));
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => runExtraction(true)} style={primaryBtn}>
            <FlaskConical size={13} /> Run evidence extraction
          </button>
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
