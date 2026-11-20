// AyuSwar Mobile — launch splash on the cream brand canvas: tricolor accent,
// Deepam Heartbeat emblem, AyuSwar AI wordmark, localized tagline, voice bars,
// waves + care illustration, Made-for-India band. Pure CSS animation; MobileRoot
// controls timing via the done prop; never blocks app load.
import React from 'react';
import { mt } from './mobileTranslations';
import { useApp } from '../context/AppContext';

export default function MSplash({ done }) {
  const { selectedLanguage } = useApp();
  const t = key => mt(key, selectedLanguage);
  return (
    <div className={`m-splash ${done ? 'hide' : ''}`} aria-hidden={done}>
      <img className="m-splash-mark" src="/assets/ayuswar_emblem_mark.webp" width="140" height="140" alt="AyuSwar logo" />
      <b className="m-splash-word">AyuSwar <i>AI</i></b>
      <div className="m-splash-voice" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
      <div className="m-splash-art" aria-hidden="true">
        <svg className="m-splash-waves" viewBox="0 0 390 110" preserveAspectRatio="none">
          <path d="M0,46 C70,24 150,68 225,50 C295,34 340,60 390,42 L390,110 L0,110 Z" fill="#BFE8DC" opacity="0.3" />
          <path d="M0,0 L390,0 L390,38 C340,56 295,30 225,46 C150,64 70,20 0,42 Z" fill="#FAF5EA" />
          <path d="M0,42 C70,20 150,64 225,46 C295,30 340,56 390,38" fill="none" stroke="#E8A33D" strokeWidth="2.5" opacity="0.9" />
        </svg>
        <img src="/assets/ayuswar-hospital-crop.jpg" alt="" />
      </div>
      <div className="m-splash-foot">
        <span className="m-splash-flag" aria-hidden="true" />
        {t('madeForIndia')}
      </div>
    </div>
  );
}
