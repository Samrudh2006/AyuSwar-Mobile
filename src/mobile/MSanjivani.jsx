// AyuSwar Mobile — Sanjivani 108: calm, thumb-reachable emergency entry.
// Prototype simulation only. Real emergencies: call 112 / 108.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';
import { useApp } from '../context/AppContext';
import { mt } from './mobileTranslations';
import { IconMic, IconHeart, IconSiren, IconChevronR, IconPhone, IconLab } from './MIcons';

function CprPacer() {
  const { selectedLanguage } = useApp();
  const t = key => mt(key, selectedLanguage);
  const [on, setOn] = React.useState(false);
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    if (!on) return;
    const iv = setInterval(() => {
      setCount(c => c + 1);
      try { triggerHaptic('medium'); } catch (_) {}
    }, 545); // ~110 compressions per minute
    return () => clearInterval(iv);
  }, [on]);
  return (
    <div className="m-card m-card-pad m-cpr">
      <div className="m-cpr-row">
        <button
          className={`m-cpr-disc ${on ? 'beating' : ''}`}
          onClick={() => { setOn(!on); setCount(0); triggerHaptic('warning'); }}
          aria-pressed={on}
        >
          <IconHeart size={26} />
        </button>
        <div style={{ flex: 1 }}>
          <b>{t('sanjPaceTitle')}</b>
          <span>{on ? `${t('sanjPaceOnA')} ${count}. ${t('sanjPaceOnB')}` : t('sanjPaceOff')}</span>
        </div>
        <button className={`m-btn ${on ? 'm-btn-ghost' : 'm-btn-red'}`} style={{ width: 'auto', padding: '10px 14px' }} onClick={() => { setOn(!on); setCount(0); }}>
          {on ? t('sanjStop') : t('sanjStart')}
        </button>
      </div>
    </div>
  );
}

export default function MSanjivani() {
  const { selectedLanguage } = useApp();
  const t = key => mt(key, selectedLanguage);
  const navigate = useNavigate();
  const go = (p) => { triggerHaptic('light'); navigate(p); };
  return (
    <main className="m-page">
      <section className="m-sanj-hero">
        <div className="m-sanj-top">
          <img className="m-sanj-avatar" src="/assets/sanjivani_doctor_avatar.webp" alt="" loading="lazy" />
          <span className="m-sanj-badge"><IconSiren size={16} /> Sanjivani 108</span>
          <span className="m-sanj-sim">{t('sanjSim')}</span>
        </div>
        <h1>{t('sanjTitle')}</h1>
        <p>{t('sanjIntro')}</p>
        <div className="m-sanj-real">{t('sanjRealA')} <a href="tel:112">112</a> {t('sanjOr')} <a href="tel:108">108</a> {t('sanjRealB')}</div>
      </section>

      <button className="m-sanj-voice" onClick={() => { triggerHaptic('warning'); go('/emergency'); }}>
        <span className="m-sanj-voice-disc"><IconMic size={30} /></span>
        <span>
          <b>{t('sanjVoiceTitle')}</b>
          <em>{t('sanjVoiceSub')}</em>
        </span>
        <IconChevronR size={18} />
      </button>

      <CprPacer />

      <div className="m-card m-card-pad">
        <h2 className="m-steps-title">{t('sanjHowTitle')}</h2>
        <div className="m-steps">
          <div className="m-step">
            <span className="m-step-num">1</span>
            <div><b>{t('sanjStep1B')}</b><span>{t('sanjStep1S')}</span></div>
          </div>
          <div className="m-step">
            <span className="m-step-num">2</span>
            <div><b>{t('sanjStep2B')}</b><span>{t('sanjStep2S')}</span></div>
          </div>
          <div className="m-step">
            <span className="m-step-num">3</span>
            <div><b>{t('sanjStep3B')}</b><span>{t('sanjStep3S')}</span></div>
          </div>
        </div>
      </div>

      <button className="m-solrow" onClick={() => go('/emergency/handover')}>
        <span className="m-solrow-icon tint-red"><IconPhone size={20} /></span>
        <span className="m-solrow-text">
          <b>{t('sanjHandoffB')}</b>
          <span>{t('sanjHandoffS')}</span>
        </span>
        <IconChevronR size={16} style={{ color: 'var(--m-muted)', flex: '0 0 auto' }} />
      </button>

      <button className="m-solrow" onClick={() => go('/sanjivani-console')}>
        <span className="m-solrow-icon tint-green"><IconLab size={20} /></span>
        <span className="m-solrow-text">
          <b>{t('sanjConsoleB')}</b>
          <span>{t('sanjConsoleS')}</span>
        </span>
        <IconChevronR size={16} style={{ color: 'var(--m-muted)', flex: '0 0 auto' }} />
      </button>

      <p className="m-sanj-note">
        {t('sanjNote')}
      </p>
    </main>
  );
}
