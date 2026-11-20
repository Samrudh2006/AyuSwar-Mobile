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
      <span className="m-splash-tri" aria-hidden="true"><i /><i /><i /></span>
      <img className="m-splash-mark" src="/assets/ayuswar_emblem_mark.webp" width="120" height="120" alt="AyuSwar logo" />
      <b className="m-splash-word">AyuSwar <i>AI</i></b>
      <span className="m-splash-tag">{t('tagline')}</span>
      <div className="m-splash-voice" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
      <div className="m-splash-art" aria-hidden="true">
        <svg className="m-splash-waves" viewBox="0 0 390 90" preserveAspectRatio="none">
          <path d="M0,34 C70,10 140,56 210,36 C280,18 330,48 390,26 L390,90 L0,90 Z" fill="#BFE8DC" opacity="0.8" />
          <path d="M0,52 C80,32 150,70 225,52 C295,36 340,62 390,44 L390,90 L0,90 Z" fill="#5FB4A3" opacity="0.6" />
          <path d="M0,48 C80,28 150,66 225,48 C295,32 340,58 390,40" fill="none" stroke="#E8A33D" strokeWidth="2.5" opacity="0.85" />
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
