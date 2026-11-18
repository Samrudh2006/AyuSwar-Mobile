// AyuSwar Mobile — Solutions: every service as a compact mobile list.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';
import { useApp } from '../context/AppContext';
import { mt } from './mobileTranslations';
import {
  IconMic, IconScan, IconSpeaker, IconLab, IconSiren, IconStethoscope,
  IconUser, IconChevronR, IconGlobe, IconWave
} from './MIcons';

const SERVICES = [
  { path: '/clinical-console', icon: IconMic, tint: 'green', nameKey: 'opdVoiceScribe', descKey: 'serviceOpdDesc', tagKey: 'coreDemoTag' },
  { path: '/audio-rx', icon: IconSpeaker, tint: 'saffron', nameKey: 'audioRxStudio', descKey: 'serviceAudioRxDesc', tagKey: 'coreDemoTag' },
  { path: '/sanjivani', icon: IconSiren, tint: 'red', nameKey: 'emergency', descKey: 'serviceEmergencyDesc', tagKey: 'simulationTag' },
  { path: '/scanner', icon: IconScan, tint: 'green', nameKey: 'prescriptionScanner', descKey: 'serviceScannerDesc', tagKey: 'demoTag' },
  { path: '/acoustic-lab', icon: IconLab, tint: 'saffron', nameKey: 'acousticLab', descKey: 'serviceAcousticDesc', tagKey: 'researchDemoTag' },
];

const LEARN = [
  { path: '/technology', icon: IconWave, nameKey: 'technology', descKey: 'technologyDesc' },
  { path: '/benchmarks', icon: IconWave, nameKey: 'benchmarks', descKey: 'benchmarksDesc' },
  { path: '/language-matrix', icon: IconGlobe, nameKey: 'languageMatrix', descKey: 'languageMatrixDesc' },
  { path: '/datasets', icon: IconGlobe, nameKey: 'datasets', descKey: 'datasetsDesc' },
];

const PORTALS = [
  { path: '/auth/doctor', icon: IconStethoscope, nameKey: 'doctorPortal', descKey: 'doctorPortalDesc' },
  { path: '/auth/patient', icon: IconUser, nameKey: 'patientPortal', descKey: 'patientPortalDesc' },
];

function Row({ item, onGo, t }) {
  const Icon = item.icon;
  return (
    <button className="m-solrow" onClick={() => onGo(item.path)}>
      <span className={`m-solrow-icon tint-${item.tint || 'green'}`}><Icon size={20} /></span>
      <span className="m-solrow-text">
        <b>{t(item.nameKey)}</b>
        <span>{t(item.descKey)}</span>
      </span>
      {item.tagKey && <span className="m-solrow-tag">{t(item.tagKey)}</span>}
      <IconChevronR size={16} style={{ color: 'var(--m-muted)', flex: '0 0 auto' }} />
    </button>
  );
}

export default function MSolutions() {
  const navigate = useNavigate();
  const { selectedLanguage } = useApp();
  const t = key => mt(key, selectedLanguage);
  const go = (p) => { triggerHaptic('light'); navigate(p); };
  return (
    <main className="m-page">
      <section>
        <h2 className="m-section-title">{t('services')}</h2>
        <p className="m-sub" style={{ margin: '2px 2px 10px' }}>{t('solutionsIntro')}</p>
        <div className="m-sollist">{SERVICES.map(s => <Row key={s.path} item={s} onGo={go} t={t} />)}</div>
      </section>
      <section>
        <h2 className="m-section-title">{t('portals')}</h2>
        <div className="m-sollist">{PORTALS.map(s => <Row key={s.path} item={s} onGo={go} t={t} />)}</div>
      </section>
      <section>
        <h2 className="m-section-title">{t('learnMore')}</h2>
        <div className="m-sollist">{LEARN.map(s => <Row key={s.path} item={s} onGo={go} t={t} />)}</div>
      </section>
    </main>
  );
}
