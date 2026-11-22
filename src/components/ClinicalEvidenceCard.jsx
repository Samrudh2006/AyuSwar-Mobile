/**
 * ClinicalEvidenceCard.jsx
 * One evidence candidate with verification status, source quotation and
 * clinician review actions. Presentational; all decisions happen in the
 * engine/verifier/persistence services. Beta review layer.
 */

import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, HelpCircle, FileWarning, Check, X, Edit3, MessageSquare } from 'lucide-react';

const STATUS_STYLE = {
  SUPPORTED: { color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4', label: 'Supported by source', Icon: ShieldCheck },
  AMBIGUOUS: { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', label: 'Ambiguous', Icon: HelpCircle },
  UNSUPPORTED: { color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', label: 'Unsupported', Icon: XCircle },
  CONFLICTING: { color: '#B91C1C', bg: '#FFF1F2', border: '#FDA4AF', label: 'Conflicting', Icon: AlertTriangle },
  INVALID_SOURCE: { color: '#6B21A8', bg: '#FAF5FF', border: '#E9D5FF', label: 'Invalid source', Icon: FileWarning }
};

const CLINICIAN_LABEL = {
  PENDING_REVIEW: 'Pending review',
  APPROVED: 'Approved (demo review)',
  EDITED: 'Edited (demo review)',
  REJECTED: 'Rejected (demo review)',
  CLARIFICATION_REQUESTED: 'Clarification requested'
};

export default function ClinicalEvidenceCard({ record, onReview }) {
  const st = STATUS_STYLE[record.verificationStatus] || STATUS_STYLE.UNSUPPORTED;
  const canAct = record.verificationStatus === 'SUPPORTED' || record.verificationStatus === 'AMBIGUOUS';
  const isEdited = record.clinicianStatus === 'EDITED' && record.displayText && record.displayText !== record.sourceQuote;
  return (
    <div style={{
      background: '#FFFDF7', border: `1.5px solid ${st.border}`, borderRadius: '14px',
      padding: '14px 16px', marginBottom: '12px', textAlign: 'left'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: '#0F3B3A', textTransform: 'uppercase' }}>
          {record.entityType.replace(/_/g, ' ')}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          fontSize: '11px', fontWeight: 700, color: st.color,
          background: st.bg, border: `1px solid ${st.border}`, borderRadius: '999px', padding: '3px 10px'
        }}>
          <st.Icon size={12} /> {st.label}
        </span>
      </div>

      <blockquote style={{
        margin: '10px 0 6px', padding: '8px 12px', borderLeft: '3px solid #0F766E',
        background: '#F8FAF9', borderRadius: '0 8px 8px 0', fontSize: '14px', color: '#16403F'
      }}>
        "{record.sourceQuote}"
      </blockquote>
      {isEdited && (
        <div style={{
          margin: '0 0 6px', padding: '8px 12px', border: '1.5px dashed #B45309',
          background: '#FFFBEB', borderRadius: '8px', fontSize: '13px', color: '#92400E'
        }}>
          <strong>Clinician correction (reviewer text, NOT source):</strong> "{record.displayText}"
        </div>
      )}
      {record.isNegatedContext && (
        <div style={{
          margin: '0 0 6px', padding: '8px 12px', border: '1.5px solid #B91C1C',
          background: '#FEF2F2', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, color: '#991B1B'
        }}>
          NEGATED FINDING: the source marks this as absent / ruled out. It is excluded from positive export even if approved.
        </div>
      )}
      <div style={{ fontSize: '11px', color: '#5B706E' }}>
        Source: {record.utteranceId} · chars {record.startOffset}–{record.endOffset}
        {record.modelVersion ? ` · model ${record.modelVersion}` : ''}
        {record.extractionMethod === 'DETERMINISTIC_FALLBACK' ? ' · deterministic fallback (not live model)' : ''}
        {record.isSynthetic ? ' · synthetic demo' : ''}
        {record.isNegatedContext ? '' : ''}
      </div>
      {(record.verificationNotes || []).map((n, i) => (
        <div key={i} style={{ fontSize: '11px', color: '#B45309', marginTop: '4px' }}>Note: {n}</div>
      ))}
      <div style={{ fontSize: '11px', color: '#5B706E', marginTop: '6px', fontStyle: 'italic' }}>
        Source-supported is not clinically confirmed. Reviewer: {CLINICIAN_LABEL[record.clinicianStatus] || record.clinicianStatus}.
      </div>

      {onReview && canAct && record.clinicianStatus === 'PENDING_REVIEW' && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => onReview(record, { type: 'APPROVE' })} style={btn('#0F766E')}>
            <Check size={13} /> Approve
          </button>
          <button onClick={() => {
            const edited = window.prompt('Edit display text (original extraction is preserved):', record.displayText || record.sourceQuote);
            if (edited && edited.trim()) onReview(record, { type: 'EDIT', editedText: edited.trim() });
          }} style={btn('#B45309')}>
            <Edit3 size={13} /> Edit
          </button>
          <button onClick={() => onReview(record, { type: 'REJECT' })} style={btn('#B91C1C')}>
            <X size={13} /> Reject
          </button>
          <button onClick={() => onReview(record, { type: 'REQUEST_CLARIFICATION' })} style={btn('#5B706E')}>
            <MessageSquare size={13} /> Clarify
          </button>
        </div>
      )}
    </div>
  );
}

const btn = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  fontSize: '12px', fontWeight: 700, color: '#FFFFFF', background: color,
  border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer'
});
