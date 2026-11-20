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
      <img className="m-splash-mark" src="/assets/ayuswar_emblem_mark.webp" width="156" height="156" alt="AyuSwar logo" />
      <b className="m-splash-word">AyuSwar <i>AI</i></b>
      <span className="m-splash-tag">{t('tagline').split('. ').map((part, i, arr) => (
        <React.Fragment key={i}>{i > 0 && '. '}<i className={i === arr.length - 1 && arr.length > 1 ? 'accent' : ''}>{part}</i></React.Fragment>
      ))}</span>
      <div className="m-splash-voice" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
      <div className="m-splash-art" aria-hidden="true">
        <img src="/assets/ayuswar-welcome-doctor-patient.jpg" alt="" />
      </div>
      <div className="m-splash-foot">
        <span className="m-splash-flag" aria-hidden="true" />
        {t('madeForIndia')}
      </div>
    </div>
  );
}
