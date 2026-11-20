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
      <svg className="m-splash-leaf left" viewBox="0 0 90 120" aria-hidden="true">
        <path d="M14,4 C44,18 58,44 52,78 C30,66 14,42 14,4 Z" fill="#4E8F5A" opacity="0.85" />
        <path d="M52,40 C74,52 82,76 74,104 C56,90 48,66 52,40 Z" fill="#3E7A4B" opacity="0.7" />
        <path d="M16,8 C36,24 46,48 50,72" stroke="#2F6139" strokeWidth="1.6" fill="none" opacity="0.6" />
      </svg>
      <svg className="m-splash-leaf right" viewBox="0 0 90 120" aria-hidden="true">
        <path d="M76,4 C46,18 32,44 38,78 C60,66 76,42 76,4 Z" fill="#4E8F5A" opacity="0.85" />
        <path d="M38,40 C16,52 8,76 16,104 C34,90 42,66 38,40 Z" fill="#3E7A4B" opacity="0.7" />
        <path d="M74,8 C54,24 44,48 40,72" stroke="#2F6139" strokeWidth="1.6" fill="none" opacity="0.6" />
      </svg>
      <div className="m-splash-crown">
        <svg className="m-splash-halo" viewBox="0 0 260 260" aria-hidden="true">
          <circle cx="130" cy="130" r="124" fill="none" stroke="#E8A33D" strokeWidth="1.2" opacity="0.6" />
          <circle cx="130" cy="130" r="108" fill="none" stroke="#E8A33D" strokeWidth="0.8" opacity="0.4" strokeDasharray="2 7" />
          <circle cx="130" cy="130" r="93" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.55" />
          <circle cx="130" cy="8" r="3" fill="#FFFFFF" opacity="0.9" />
          <circle cx="245" cy="96" r="2.2" fill="#E8A33D" opacity="0.9" />
          <circle cx="22" cy="176" r="2.2" fill="#FFFFFF" opacity="0.85" />
          <circle cx="196" cy="240" r="2.6" fill="#E8A33D" opacity="0.8" />
          <circle cx="52" cy="46" r="2" fill="#E8A33D" opacity="0.75" />
        </svg>
        <img className="m-splash-mark" src="/assets/ayuswar_emblem_mark.webp" width="156" height="156" alt="AyuSwar logo" />
      </div>
      <b className="m-splash-word">AyuSwar <i>AI</i></b>
      <span className="m-splash-tag">{t('tagline').split('. ').map((part, i, arr) => (
        <React.Fragment key={i}>{i > 0 && '. '}<i className={i === arr.length - 1 && arr.length > 1 ? 'accent' : ''}>{part}</i></React.Fragment>
      ))}</span>
      <svg className="m-splash-flourish" viewBox="0 0 180 12" aria-hidden="true">
        <path d="M4,8 C60,2 120,2 176,7" stroke="#E8A33D" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
      </svg>
      <span className="m-splash-sub">{mt('tagline', selectedLanguage === 'en-IN' ? 'te-IN' : 'en-IN')}</span>
      <div className="m-splash-art" aria-hidden="true">
        <img src="/assets/ayuswar-doctor-hero-clean.png" alt="" />
      </div>
      <div className="m-splash-foot">
        <span className="m-splash-flag" aria-hidden="true" />
        {t('madeForIndia')}
      </div>
    </div>
  );
}
