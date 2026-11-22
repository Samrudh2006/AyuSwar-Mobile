/**
 * ClinicalEvidenceTimeline.jsx
 * Original consultation transcript with speaker and language labels and
 * source-quotation highlighting for extracted evidence spans. Read-only;
 * the transcript shown here is the unchanged original text.
 */

import React from 'react';

const SPEAKER_STYLE = {
  DOCTOR: { color: '#0F766E', label: 'Doctor' },
  PATIENT: { color: '#B45309', label: 'Patient' },
  OTHER: { color: '#5B706E', label: 'Other' }
};

function renderWithHighlights(text, spans) {
  if (!spans.length) return text;
  const sorted = [...spans].sort((a, b) => a.startOffset - b.startOffset);
  const out = [];
  let cursor = 0;
  sorted.forEach((sp, i) => {
    if (sp.startOffset < cursor) return; // overlapping spans: first wins
    if (sp.startOffset > cursor) out.push(text.slice(cursor, sp.startOffset));
    out.push(
      <mark key={i} style={{
        background: sp.status === 'SUPPORTED' ? '#CCFBF1' : '#FEF3C7',
        color: '#16403F', borderRadius: '3px', padding: '0 1px'
      }}>
        {text.slice(sp.startOffset, sp.endOffset)}
      </mark>
    );
    cursor = sp.endOffset;
  });
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

export default function ClinicalEvidenceTimeline({ utterances, evidence }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {utterances.map(u => {
        const sp = SPEAKER_STYLE[u.speaker] || SPEAKER_STYLE.OTHER;
        const spans = (evidence || [])
          .filter(e => e.utteranceId === u.utteranceId)
          .map(e => ({ startOffset: e.startOffset, endOffset: e.endOffset, status: e.verificationStatus }));
        return (
          <div key={u.utteranceId} style={{
            background: '#FFFFFF', border: '1px solid #E4EAE9', borderRadius: '12px', padding: '10px 12px'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: sp.color }}>{sp.label}</span>
              <span style={{ fontSize: '10px', color: '#5B706E' }}>{u.language}</span>
              {u.sourceType === 'SCRIPTED_DEMO' && (
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B21A8', background: '#FAF5FF', borderRadius: '999px', padding: '2px 8px' }}>
                  synthetic demo
                </span>
              )}
              {u.provider && <span style={{ fontSize: '10px', color: '#5B706E' }}>via {u.provider}</span>}
              {u.timestampStartMs !== undefined
                ? <span style={{ fontSize: '10px', color: '#5B706E' }}>{new Date(u.timestampStartMs).toLocaleTimeString()}</span>
                : <span style={{ fontSize: '10px', color: '#94A3B8' }}>no recorded timestamps</span>}
            </div>
            <div style={{ fontSize: '14px', color: '#16403F', lineHeight: 1.55 }}>
              {renderWithHighlights(u.text, spans)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
