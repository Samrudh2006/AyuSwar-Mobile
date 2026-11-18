// AyuSwar Mobile — launch splash: hand-drawn stroke reveal of the Deepam Heartbeat mark
// (diya + flame -> heartbeat pulse + sound rings), on the cream brand canvas.
// No particles, no glow. Pure CSS stroke animation; finishes ~1.9s, never blocks app load.
import React from 'react';

export default function MSplash({ done }) {
  return (
    <div className={`m-splash ${done ? 'hide' : ''}`} aria-hidden={done}>
      <img className="m-splash-mark" src="/assets/ayuswar_emblem_mark.webp" width="150" height="150" alt="AyuSwar logo" />
      <b className="m-splash-word">AyuSwar</b>
      <span className="m-splash-tag">Voice-first health companion</span>
      <div className="m-splash-art" aria-hidden="true">
        <svg className="m-splash-waves" viewBox="0 0 390 90" preserveAspectRatio="none">
          <path d="M0,34 C70,10 140,56 210,36 C280,18 330,48 390,26 L390,90 L0,90 Z" fill="#BFE8DC" opacity="0.8" />
          <path d="M0,52 C80,32 150,70 225,52 C295,36 340,62 390,44 L390,90 L0,90 Z" fill="#5FB4A3" opacity="0.6" />
          <path d="M0,48 C80,28 150,66 225,48 C295,32 340,58 390,40" fill="none" stroke="#E8A33D" strokeWidth="2.5" opacity="0.85" />
        </svg>
        <img src="/assets/ayuswar-hospital-crop.jpg" alt="" />
      </div>
    </div>
  );
}
