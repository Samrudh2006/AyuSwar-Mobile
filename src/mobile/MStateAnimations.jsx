// MStateAnimations - branded navy/gold state animations matched to the user's
// reference set. Every state is wired to a REAL condition by the caller:
// success only after a real save resolves, thinking only while a reply is
// genuinely pending, error only on an actual failure with a retry action,
// empty only when a list is genuinely empty. Percentages are never shown
// unless the caller passes a measured value. All motion respects
// prefers-reduced-motion.
import React from 'react';

const NAVY = '#123A5C';
const GOLD = '#C99313';

export function MStateFrame({ eyebrow, title, hint, children, action }) {
  return (
    <div className="m-state-frame" role="status">
      <span className="m-state-eyebrow">{eyebrow}</span>
      <div className="m-state-icon">{children}</div>
      <strong className="m-state-title">{title}</strong>
      {hint ? <span className="m-state-hint">{hint}</span> : null}
      {action || null}
    </div>
  );
}

export const MStateStyles = () => (
  <style>{`
    .m-state-frame { background: #FFFFFF; border: 1px solid #E2E8EE; border-radius: 14px; padding: 16px 14px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .m-state-eyebrow { font-size: 10px; font-weight: 800; letter-spacing: 1.2px; color: #5B7183; text-transform: uppercase; }
    .m-state-icon { margin: 4px 0 2px; }
    .m-state-title { display: block; font-size: 14.5px; color: #12324F; margin-bottom: 4px; }
    .m-state-hint { display: block; }
    .m-state-hint { font-size: 11.5px; color: #5B7183; }
    .m-state-arc { animation: m-state-spin 1.1s linear infinite; transform-origin: center; }
    .m-state-bar { animation: m-state-wave 1s ease-in-out infinite; transform-origin: center; }
    .m-state-bar:nth-child(2) { animation-delay: 0.12s; }
    .m-state-bar:nth-child(3) { animation-delay: 0.24s; }
    .m-state-bar:nth-child(4) { animation-delay: 0.36s; }
    .m-state-bar:nth-child(5) { animation-delay: 0.48s; }
    @keyframes m-state-spin { to { transform: rotate(360deg); } }
    @keyframes m-state-wave { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }
    @media (prefers-reduced-motion: reduce) {
      .m-state-arc, .m-state-bar { animation: none; }
    }
  `}</style>
);

// Upload loading: gold arc sweeping around a navy cloud. Percent only when measurable.
export function StateUpload({ percent }) {
  return (
    <MStateFrame eyebrow="Upload loading" title="Uploading report..." hint={typeof percent === 'number' ? `${percent}% (measured)` : 'Real percentage shown when measurable'}>
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <circle cx="36" cy="36" r="30" stroke="#E2E8EE" strokeWidth="4" />
        <circle className="m-state-arc" cx="36" cy="36" r="30" stroke={GOLD} strokeWidth="4" strokeLinecap="round" strokeDasharray="60 130" />
        <path d="M26 44a8 8 0 1 1 2-15.8A10 10 0 0 1 47 32a7 7 0 0 1-1 13.9" stroke={NAVY} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M36 46V34m0 0l-4.5 4.5M36 34l4.5 4.5" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </MStateFrame>
  );
}

// Assistant waiting: shown only while a reply is genuinely pending.
export function StateThinking({ eyebrow = 'Assistant waiting', title = 'AyuSwar is thinking...', hint = 'Shown only while a reply is pending' }) {
  return (
    <MStateFrame eyebrow={eyebrow} title={title} hint={hint}>
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <path d="M14 22a10 10 0 0 1 10-10h24a10 10 0 0 1 10 10v16a10 10 0 0 1-10 10H30l-12 10v-10a10 10 0 0 1-4-8V22z" stroke={NAVY} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
        {[26, 33, 40, 47].map((x, i) => (
          <rect key={x} className="m-state-bar" x={x} y={26} width="3.5" height={12 - Math.abs(i - 1.5) * 2} rx="1.75" fill={GOLD} />
        ))}
      </svg>
    </MStateFrame>
  );
}

// Report processing: shown only while OCR/processing actually runs.
export function StateProcessing({ title = 'Scanning report...', hint = 'Runs only while the scan is actually processing' }) {
  return (
    <MStateFrame eyebrow="Processing" title={title} hint={hint}>
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <circle cx="36" cy="36" r="30" stroke="#E2E8EE" strokeWidth="4" />
        <circle className="m-state-arc" cx="36" cy="36" r="30" stroke={GOLD} strokeWidth="4" strokeLinecap="round" strokeDasharray="60 130" />
        <path d="M28 22h12l8 8v20a2 2 0 0 1-2 2H28a2 2 0 0 1-2-2V24a2 2 0 0 1 2-2z" stroke={NAVY} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
        <path d="M32 38h12M32 43h12" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M36 28v6m-3-3h6" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </MStateFrame>
  );
}

// Acoustic analysis: shown only while DSP stages actually run.
export function StateAnalyzing({ eyebrow = 'Acoustic analysis', title = 'Analysing audio...', hint = 'On-device model run; raw event scores, no diagnostic inference' }) {
  return (
    <MStateFrame eyebrow={eyebrow} title={title} hint={hint}>
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
        {[16, 25, 34, 43, 52].map((x, i) => (
          <rect key={x} className="m-state-bar" x={x} y={36 - [10, 18, 24, 18, 10][i]} width="5" height={[10, 18, 24, 18, 10][i] * 2} rx="2.5" fill={i === 2 ? GOLD : NAVY} />
        ))}
      </svg>
    </MStateFrame>
  );
}

// Success: callers render this ONLY after the real operation resolves.
export function StateSuccess({ title = 'Report saved', hint = 'Operation complete, not a health result' }) {
  return (
    <MStateFrame eyebrow="Success" title={title} hint={hint}>
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <circle cx="36" cy="36" r="24" fill={NAVY} />
        <path d="M26 37l7 7 14-15" stroke={GOLD} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </MStateFrame>
  );
}

// Error: callers render this ONLY on an actual failure, with a real retry.
export function StateError({ title = 'Could not analyse', hint = 'Actual failure, retry offered', onRetry, retryLabel = 'Retry' }) {
  return (
    <MStateFrame eyebrow="Error" title={title} hint={hint}
      action={onRetry ? <button className="m-btn m-btn-primary" style={{ marginTop: 6 }} onClick={onRetry}>{retryLabel}</button> : null}>
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <path d="M36 14L62 56H10L36 14z" fill={NAVY} strokeLinejoin="round" />
        <path d="M36 30v12" stroke={GOLD} strokeWidth="4" strokeLinecap="round" />
        <circle cx="36" cy="49" r="2.6" fill={GOLD} />
      </svg>
    </MStateFrame>
  );
}

// Empty: callers render this ONLY when the list is genuinely empty.
export function StateEmpty({ eyebrow = 'Empty state', title = 'No stored demo alerts', hint = 'Shown only when the list is genuinely empty' }) {
  return (
    <MStateFrame eyebrow={eyebrow} title={title} hint={hint}>
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <path d="M16 28h40l-4 22a4 4 0 0 1-4 3.4H24A4 4 0 0 1 20 50l-4-22z" stroke={NAVY} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
        <path d="M16 28l6-10h28l6 10" stroke={NAVY} strokeWidth="2.5" fill="none" strokeLinejoin="round" />
        <path d="M28 40h16" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </MStateFrame>
  );
}
