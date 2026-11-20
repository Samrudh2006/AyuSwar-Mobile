import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';
import { mt } from './mobileTranslations';
import { AppLockSettings } from './MAppLock';
import { NetworkSpeechSettings } from './MSpeechSettings';
import {
  IconHome, IconWave, IconMic, IconMenu, IconClose, IconChevronR,
  IconStethoscope, IconUser, IconScan, IconSpeaker, IconLab, IconSiren,
  IconGlobe, IconDatabase, IconChart, IconCpu, IconInfo, IconShield,
  IconFile, IconLogout, IconHeart
} from './MIcons';

// Approved AyuSwar sheet artwork for mapped drawer entries (user-selected family)
const SheetIcon = ({ name }) => (
  <img className="m-drawer-sheeticon" src={`/assets/icons/sheet/${name}.png`} alt="" aria-hidden="true" width={20} height={20} />
);

const TAB_HOME = 'home';
const TAB_TOOLS = 'tools';
const TAB_VOICE = 'voice';

function tabForPath(pathname) {
  if (pathname === '/' || pathname === '/home') return TAB_HOME;
  if (['/solutions', '/scanner', '/audio-rx', '/acoustic-lab', '/datasets', '/technology', '/benchmarks', '/language-matrix'].some(p => pathname.startsWith(p))) return TAB_TOOLS;
  if (['/assistant', '/clinical-console'].some(p => pathname.startsWith(p))) return TAB_VOICE;
  return null;
}

export default function MShell({ children, title, subtitle, showBack, onBack, hideTabs }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { doctorProfile, patientProfile, setDoctorProfile, setPatientProfile, selectedLanguage, setSelectedLanguage, supportedLanguages } = useApp();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [lockSettingsOpen, setLockSettingsOpen] = React.useState(false);
  const [speechSettingsOpen, setSpeechSettingsOpen] = React.useState(false);
  const [languageNotice, setLanguageNotice] = React.useState('');
  const activeTab = tabForPath(location.pathname);
  const t = key => mt(key, selectedLanguage);
  const currentLanguage = supportedLanguages.find(lang => lang.code === selectedLanguage) || supportedLanguages[0];
  const displayTitle = location.pathname.startsWith('/auth/doctor') ? t('doctorSigninTitle') : (location.pathname.startsWith('/auth/patient') ? t('patientSigninTitle') : title);

  const go = (path) => {
    triggerHaptic('light');
    setDrawerOpen(false);
    navigate(path);
  };

  const openSanjivani = () => {
    triggerHaptic('warning');
    navigate('/sanjivani');
  };

  const signedIn = doctorProfile || patientProfile;
  const displayName = doctorProfile?.name || patientProfile?.name || null;

  const logout = () => {
    triggerHaptic('medium');
    setDoctorProfile(null);
    setPatientProfile(null);
    setDrawerOpen(false);
    navigate('/');
  };

  const changeLanguage = (event) => {
    setSelectedLanguage(event.target.value);
    setLanguageNotice(t('languageUpdated'));
    const timer = setTimeout(() => setLanguageNotice(''), 1800);
    return () => clearTimeout(timer);
  };

  return (
    <div className={`m-app ${hideTabs ? 'm-app-no-tabs' : ''}`}>
      <header className="m-topbar">
        {showBack ? (
          <button className="m-iconbtn" aria-label={t('back')} onClick={() => { triggerHaptic('light'); onBack ? onBack() : navigate(-1); }}>
            <IconChevronR size={20} style={{ transform: 'rotate(180deg)' }} />
          </button>
        ) : (
          <img className="m-topbar-logo" src="/assets/ayuswar_emblem_mark.webp" alt="AyuSwar" />
        )}
        <div className="m-topbar-title">
          <b>{displayTitle || 'AyuSwar'}</b>
          <span>{subtitle || t('tagline')}</span>
        </div>
        <div className="m-topbar-spacer" />
        <label className="m-topbar-lang">
          <span className="sr-only">{t('language')}</span>
          <IconGlobe size={16} aria-hidden="true" />
          <select aria-label={`${t('language')}: ${currentLanguage?.name || currentLanguage?.label || selectedLanguage}`} title={`${t('language')}: ${currentLanguage?.name || currentLanguage?.label || selectedLanguage}`} value={selectedLanguage} onChange={changeLanguage}>
            {supportedLanguages.map(lang => <option key={lang.code} value={lang.code}>{lang.vernacular || lang.label}</option>)}
          </select>
        </label>
      </header>

      {children}

      {!hideTabs && (
        <nav className="m-tabbar" aria-label="Primary">
          <button className={`m-tab ${activeTab === TAB_HOME ? 'active' : ''}`} onClick={() => go('/')}>
            <IconHome /><span>{t('home')}</span>
          </button>
          <button className={`m-tab ${activeTab === TAB_TOOLS ? 'active' : ''}`} onClick={() => go('/solutions')}>
            <IconWave /><span>{t('tools')}</span>
          </button>
          <button className="m-tab-sos" aria-label={t('emergency')} onClick={openSanjivani}>
            <span className="m-tab-sos-btn"><IconSiren size={20} />108</span>
          </button>
          <button className={`m-tab ${activeTab === TAB_VOICE ? 'active' : ''}`} onClick={() => go('/clinical-console')}>
            <IconMic /><span>{t('scribe')}</span>
          </button>
          <button className="m-tab" aria-label={t('assistant')} onClick={() => { triggerHaptic('light'); window.dispatchEvent(new CustomEvent('ayuswar:open-assistant')); }}>
            <IconCpu /><span>{t('assistant')}</span>
          </button>
          <button className="m-tab" onClick={() => { triggerHaptic('light'); setDrawerOpen(true); }}>
            <IconMenu /><span>{t('menu')}</span>
          </button>
        </nav>
      )}

      <div className={`m-drawer-scrim ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <aside className={`m-drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen} inert={!drawerOpen ? true : undefined}>
        <div className="m-drawer-head">
          <img src="/assets/ayuswar_emblem_mark.webp" alt="" />
          <div style={{ flex: 1 }}>
            <b>AyuSwar AI</b>
            <span>{t('drawerTagline')}</span>
          </div>
          <button className="m-iconbtn" aria-label={t('closeMenu')} onClick={() => setDrawerOpen(false)}>
            <IconClose size={18} />
          </button>
        </div>
        <label className="m-drawer-lang">
          <span>{t('language')}</span>
          <select value={selectedLanguage} onChange={changeLanguage}>
            {supportedLanguages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
          </select>
        </label>
        {languageNotice && <p className="m-language-notice" role="status">{languageNotice}</p>}
        <nav className="m-drawer-nav">
          <div className="m-drawer-section">{t('home')}</div>
          <button className={`m-drawer-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => go('/')}>
            <IconHome /> {t('home')}
          </button>
          <button className="m-drawer-item" onClick={() => go('/sanjivani')}>
            <SheetIcon name="emergency-help" /> {t('emergency')}
          </button>
          <button className="m-drawer-item" onClick={() => go('/emergency')}>
            <IconHeart /> {t('emergencyTriage')}
          </button>
          <button className="m-drawer-item" onClick={() => go('/clinical-console')}>
            <SheetIcon name="opd-scribe" /> {t('opdVoiceScribe')}
          </button>

          <div className="m-drawer-section">{t('services')}</div>
          <button className={`m-drawer-item ${location.pathname.startsWith('/solutions') ? 'active' : ''}`} onClick={() => go('/solutions')}>
            <IconWave /> {t('allSolutions')}
          </button>
          <button className="m-drawer-item" onClick={() => go('/scanner')}>
            <IconScan /> {t('prescriptionScanner')}
          </button>
          <button className="m-drawer-item" onClick={() => go('/audio-rx')}>
            <IconSpeaker /> {t('audioRxStudio')}
          </button>
          <button className="m-drawer-item" onClick={() => go('/acoustic-lab')}>
            <SheetIcon name="acoustic-analysis" /> {t('acousticLab')}
          </button>
          <button className="m-drawer-item" onClick={() => { triggerHaptic('light'); setDrawerOpen(false); window.dispatchEvent(new CustomEvent('ayuswar:open-pill-vision')); }}>
            <SheetIcon name="medicines" /> {t('pillVision')}
          </button>
          <button className="m-drawer-item" onClick={() => { triggerHaptic('light'); setDrawerOpen(false); window.dispatchEvent(new CustomEvent('ayuswar:open-vitals-rppg')); }}>
            <SheetIcon name="vitals" /> {t('vitalsRppg')}
          </button>

          <div className="m-drawer-section">{t('portals')}</div>
          <button className="m-drawer-item" onClick={() => go(doctorProfile ? '/doctor-portal' : '/auth/doctor')}>
            <SheetIcon name="doctor" /> {t('doctorPortal')}
          </button>
          <button className="m-drawer-item" onClick={() => go(patientProfile ? '/patient-portal' : '/auth/patient')}>
            <SheetIcon name="patient" /> {t('patientPortal')}
          </button>

          <div className="m-drawer-section">{t('learn')}</div>
          <button className="m-drawer-item" onClick={() => go('/technology')}>
            <IconCpu /> {t('technology')}
          </button>
          <button className="m-drawer-item" onClick={() => go('/language-matrix')}>
            <SheetIcon name="languages" /> {t('languageMatrix')}
          </button>
          <button className="m-drawer-item" onClick={() => go('/benchmarks')}>
            <IconChart /> {t('benchmarks')}
          </button>
          <button className="m-drawer-item" onClick={() => go('/datasets')}>
            <IconDatabase /> {t('datasets')}
          </button>
          <button className="m-drawer-item" onClick={() => go('/about')}>
            <IconInfo /> {t('about')}
          </button>

          <div className="m-drawer-section">{{ 'en-IN': 'Settings', 'te-IN': 'సెట్టింగ్స్', 'hi-IN': 'सेटिंग्स' }[selectedLanguage] || 'Settings'}</div>
          <button className="m-drawer-item" onClick={() => { setDrawerOpen(false); setLockSettingsOpen(true); }}>
            <SheetIcon name="privacy-consent" /> {{ 'en-IN': 'App lock', 'te-IN': 'యాప్ లాక్', 'hi-IN': 'ऐप लॉक' }[selectedLanguage] || 'App lock'}
          </button>
          <button className="m-drawer-item" onClick={() => { setDrawerOpen(false); setSpeechSettingsOpen(true); }}>
            <SheetIcon name="privacy-consent" /> {{ 'en-IN': 'Network speech', 'te-IN': 'నెట్‌వర్క్ స్పీచ్', 'hi-IN': 'नेटवर्क स्पीच' }[selectedLanguage] || 'Network speech'}
          </button>

          <div className="m-drawer-section">{t('legal')}</div>
          <button className="m-drawer-item" onClick={() => go('/privacy')}>
            <SheetIcon name="privacy-consent" /> {t('privacy')}
          </button>
          <button className="m-drawer-item" onClick={() => go('/terms')}>
            <IconFile /> {t('terms')}
          </button>

          {signedIn && (
            <>
              <div className="m-drawer-section">{t('account')}</div>
              <button className="m-drawer-item" onClick={logout}>
                <SheetIcon name="logout" /> {t('signOut')} {displayName ? `(${displayName})` : ''}
              </button>
            </>
          )}
        </nav>
        <div className="m-drawer-foot">
          <div className="m-tricolor" style={{ marginBottom: 10 }} />
          {t('drawerFoot')}
        </div>
      </aside>
      {lockSettingsOpen && <AppLockSettings lang={selectedLanguage} onClose={() => setLockSettingsOpen(false)} />}
      {speechSettingsOpen && <NetworkSpeechSettings lang={selectedLanguage} onClose={() => setSpeechSettingsOpen(false)} />}
    </div>
  );
}
