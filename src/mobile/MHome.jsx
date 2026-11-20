import MLandingDetails from './MLandingDetails';
// AyuSwar Mobile — Home: concise welcome, emergency entry, core services, portals.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { mt } from './mobileTranslations';
import { useApp } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';
import {
  IconMic, IconScan, IconSpeaker, IconLab, IconStethoscope, IconUser,
  IconSiren, IconChevronR, IconDiya, IconGlobe, IconHeart, IconPhone
} from './MIcons';

export default function MHome() {
  const navigate = useNavigate();
  const { doctorProfile, patientProfile, selectedLanguage } = useApp();
  const t = key => mt(key, selectedLanguage);

  const go = (path) => { triggerHaptic('light'); navigate(path); };

  const greeting = () => t('greeting');

  return (
    <main className="m-page m-flow-page m-home-page">
      <section className="m-hero">
        <div className="m-hero-eyebrow">{t('brandScript')}</div>
        <h1>{greeting()}.<br />{t('heroTitle')}</h1>
        <p>{t('heroBody')}</p>
        <div className="m-hero-actions">
          <button className="m-btn m-btn-saffron" onClick={() => go('/solutions')}>
            {t('explore')}
          </button>
        </div>
        <div className="m-hero-flags">
          <span className="m-hero-flag"><span className="dot" />{t('prototypeDemo')}</span>
          <span className="m-hero-flag"><span className="dot" />{t('syntheticData')}</span>
          <span className="m-hero-flag"><span className="dot" />{t('emergencyNumbers')}</span>
        </div>
        <img className="m-hero-art" src="/assets/ayuswar-welcome-doctor-patient.jpg" alt={t('generatedConsultationAlt')} fetchPriority="high" width="1024" height="637" />
      </section>

      <button
        className="m-card m-card-pad"
        style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', cursor: 'pointer', border: '1.5px solid var(--m-danger-soft)', background: 'linear-gradient(0deg, #FFF9F8, #FFF9F8), var(--m-card)', fontFamily: 'var(--m-font-ui)' }}
        onClick={() => { triggerHaptic('warning'); go('/sanjivani'); }}
      >
        <span style={{ width: 48, height: 48, borderRadius: 15, background: 'var(--m-danger)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
          <IconSiren size={24} />
        </span>
        <span style={{ flex: 1 }}>
          <b style={{ display: 'block', fontSize: 15, color: 'var(--m-danger)' }}>{t('emergency')}</b>
          <span style={{ fontSize: 11.5, color: 'var(--m-muted)', lineHeight: 1.4, display: 'block', marginTop: 2 }}>
            {t('emergencyDesc')}
          </span>
        </span>
        <IconChevronR size={18} style={{ color: 'var(--m-danger)' }} />
      </button>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 className="m-section-title">{t('services')} <small>{t('tapOpen')}</small></h2>
        <div className="m-quickgrid">
          <button className="m-quick saffron" onClick={() => go('/audio-rx')}>
            <span className="m-quick-ic"><IconSpeaker /></span>
            <b>{t('audioRxStudio')}</b>
            <span>{t('serviceAudioRxDesc')}</span>
          </button>
          <button className="m-quick" onClick={() => go('/scanner')}>
            <span className="m-quick-ic"><IconScan /></span>
            <b>{t('prescriptionScanner')}</b>
            <span>{t('serviceScannerDesc')}</span>
          </button>
          <button className="m-quick" onClick={() => go('/acoustic-lab')}>
            <span className="m-quick-ic"><IconLab /></span>
            <b>{t('acousticLab')}</b>
            <span>{t('serviceAcousticDesc')}</span>
          </button>
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <img className="m-care-banner" src="/assets/ayuswar-care-crop.jpg" alt="Doctor consulting an elderly patient" loading="lazy" />
        <h2 className="m-section-title">{t('portals')}</h2>
        <button className="m-listrow" onClick={() => go(doctorProfile ? '/doctor-portal' : '/auth/doctor')}>
          <span className="m-listrow-ic"><IconStethoscope /></span>
          <span className="m-listrow-body">
            <b>{doctorProfile ? `Dr. ${doctorProfile.name || 'Portal'}` : t('doctorPortal')}</b>
            <span>{doctorProfile ? t('continueConsole') : t('doctorSignin')}</span>
          </span>
          <IconChevronR size={18} className="m-listrow-caret" />
        </button>
        <button className="m-listrow" onClick={() => go(patientProfile ? '/patient-portal' : '/auth/patient')}>
          <span className="m-listrow-ic" style={{ background: 'var(--m-saffron-soft)', color: 'var(--m-saffron)' }}><IconUser /></span>
          <span className="m-listrow-body">
            <b>{patientProfile ? `${patientProfile.name || 'Patient'} · Portal` : t('patientPortal')}</b>
            <span>{patientProfile ? t('continueRecords') : t('patientSignin')}</span>
          </span>
          <IconChevronR size={18} className="m-listrow-caret" />
        </button>
      </section>

      <section className="m-card m-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--m-saffron-soft)', color: 'var(--m-saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconDiya size={20} />
          </span>
          <h2 className="m-section-title" style={{ margin: 0 }}>{t('whyAyuswar')}</h2>
        </div>
        <p className="m-sub">
          {t('whyBody')}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span className="m-chip"><IconGlobe size={13} /> {t('chipIndic')}</span>
          <span className="m-chip saffron"><IconHeart size={13} /> {t('chipDoctorLoop')}</span>
          <span className="m-chip"><IconPhone size={13} /> {t('chipPhone')}</span>
        </div>
      </section>

      <MLandingDetails />

      <div className="m-tricolor" />
      <p className="m-footnote">
        {t('mobilePrototypeFootnote')}
      </p>
    </main>
  );
}
