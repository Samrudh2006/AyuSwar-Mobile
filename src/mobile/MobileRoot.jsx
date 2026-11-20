// AyuSwar Mobile — phone-experience root. Desktop rendering is untouched;
// this component owns routing and shell for phone-sized viewports / the Android app.
import React from 'react';
import { Routes, Route, Navigate, Navigate as N2, useLocation, useNavigate } from 'react-router-dom';
import MShell from './MShell';
import MHome from './MHome';
import MSplash from './MSplash';
const MSolutions = lazyWithRetry(() => import('./MSolutions'));
const UnifiedAuthView = lazyWithRetry(() => import('../views/UnifiedAuthView'));
const MSanjivani = lazyWithRetry(() => import('./MSanjivani'));
const MClinical = lazyWithRetry(() => import('./MClinical'));
const MScribeFlow = lazyWithRetry(() => import('./MScribeFlow'));
import FloatingAssistant from '../components/FloatingAssistant';
import { AppLockScreen } from './MAppLock';
import { isAppLockEnabled } from './appLock';
import { useApp } from '../context/AppContext';
import { lazyWithRetry } from '../utils/routePreloader';
import { mt } from './mobileTranslations';

// Existing views reused inside the mobile shell until each gets its own mobile screen.
const EmergencyTriageView = lazyWithRetry(() => import('../views/EmergencyTriageView'));
const SanjivaniEmergencyModal = lazyWithRetry(() => import('../components/SanjivaniEmergencyModal'));
const WhatsAppAudioRxModal = lazyWithRetry(() => import('../components/WhatsAppAudioRxModal'));
const PrescriptionScannerView = lazyWithRetry(() => import('../views/PrescriptionScannerView'));
const AudioRxStudioView = lazyWithRetry(() => import('../views/AudioRxStudioView'));
const AcousticBiomarkerLabView = lazyWithRetry(() => import('../views/AcousticBiomarkerLabView'));
const ClinicalBenchmarkView = lazyWithRetry(() => import('../views/ClinicalBenchmarkView'));
const IndicLanguageMatrixView = lazyWithRetry(() => import('../views/IndicLanguageMatrixView'));
const DatasetExplorerView = lazyWithRetry(() => import('../views/DatasetExplorerView'));
const ArchitectureView = lazyWithRetry(() => import('../views/ArchitectureView'));
const AboutView = lazyWithRetry(() => import('../views/AboutView'));
const EmergencyHandoverView = lazyWithRetry(() => import('../views/EmergencyHandoverView'));
const PrescriptionPreviewView = lazyWithRetry(() => import('../views/PrescriptionPreviewView'));
const PrivacyPolicyView = lazyWithRetry(() => import('../views/PrivacyPolicyView'));
const TermsOfServiceView = lazyWithRetry(() => import('../views/TermsOfServiceView'));
const NotFoundView = lazyWithRetry(() => import('../views/NotFoundView'));
const DoctorPortal = lazyWithRetry(() => import('../components/DoctorPortal'));
const PatientPortal = lazyWithRetry(() => import('../components/PatientPortal'));
const ClinicalConsole = lazyWithRetry(() => import('../components/ClinicalConsole'));
const DetailedModuleView = lazyWithRetry(() => import('../components/DetailedModuleView'));
const HeroLanding = lazyWithRetry(() => import('../components/HeroLanding'));

function Embedded({ children, title, subtitle, showBack, hideTabs }) {
  const { selectedLanguage } = useApp();
  const loadingLabel = mt('loading', selectedLanguage);
  return (
    <MShell title={title} subtitle={subtitle} showBack={showBack} hideTabs={hideTabs}>
      <React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--m-muted)' }}>{loadingLabel}</div>}>
        {children}
      </React.Suspense>
    </MShell>
  );
}

export default function MobileRoot() {
  const navigate = useNavigate();
  const location = useLocation();
  const { doctorProfile, patientProfile, setDoctorProfile, setPatientProfile, selectedLanguage } = useApp();
  const [appLocked, setAppLocked] = React.useState(() => isAppLockEnabled());
  const loadingLabel = mt('loading', selectedLanguage);

  const sanjivani = (
    <Embedded title="Sanjivani 108" subtitle="Emergency simulation console" hideTabs>
      <SanjivaniEmergencyModal isOpen={true} onClose={() => navigate('/')} />
    </Embedded>
  );

  const freezeSplash = typeof window !== 'undefined' && window.location.search.includes('splash');
  const [splash, setSplash] = React.useState(true);
  const [whatsAppRxOpen, setWhatsAppRxOpen] = React.useState(false);
  const [portalScrolling, setPortalScrolling] = React.useState(false);
  const [fieldFocused, setFieldFocused] = React.useState(false);
  const portalScrollTimer = React.useRef(null);
  React.useEffect(() => {
    const isField = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
    const onIn = (e) => { if (isField(e.target)) setFieldFocused(true); };
    const onOut = (e) => { if (isField(e.target)) setFieldFocused(false); };
    document.addEventListener('focusin', onIn, true);
    document.addEventListener('focusout', onOut, true);
    return () => { document.removeEventListener('focusin', onIn, true); document.removeEventListener('focusout', onOut, true); };
  }, []);
  // Collision-aware assistant placement: after scrolling settles, place the
  // collapsed pill in the lowest candidate spot that overlaps no visible text
  // or interactive element; hide it when no clear spot exists.
  const placeAssistant = React.useCallback(() => {
    // Assistant is an integrated bottom dock on portal routes (layout chrome) - no collision placement.
    if (document.querySelector('.m-assistant.portal-edge.docked')) return;
    const wrap = document.querySelector('.m-assistant.portal-edge');
    const cont = wrap ? wrap.querySelector('.floating-assistant-container[data-assistant-state="collapsed"]') : null;
    const pill = cont ? cont.querySelector('.floating-assistant-pill') : null;
    if (!wrap || !cont || !pill || !pill.offsetParent) return;
    const w = pill.offsetWidth, h = pill.offsetHeight;
    const W = window.innerWidth, H = window.innerHeight;
    const xs = [W - w - 14, 14, Math.round((W - w) / 2), W - w - 70, 70];
    const ys = [];
    for (let y = H - h - 16; y >= Math.round(H * 0.35); y -= 46) ys.push(y);
    // Pixel-truth probe: actual rendered TEXT rects (any element type, incl. nested table/row text
    // like the MEWS row) + non-text visual controls. Element-tag probing missed real text before.
    const rects = [...document.querySelectorAll('input,select,textarea,img,video,svg,canvas')]
      .filter(el => el.offsetParent && !cont.contains(el))
      .map(el => el.getBoundingClientRect())
      .filter(r => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < H);
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let tn;
    while ((tn = tw.nextNode())) {
      if (!tn.nodeValue || !tn.nodeValue.trim()) continue;
      const el = tn.parentElement;
      if (!el || !el.offsetParent || cont.contains(el)) continue;
      const range = document.createRange();
      range.selectNodeContents(tn);
      const rs = range.getClientRects();
      for (let i = 0; i < rs.length; i++) {
        const r = rs[i];
        if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < H) rects.push(r);
      }
      range.detach();
    }
    const overlapArea = (x, y) => {
      let a = 0;
      for (const r of rects) {
        const ox = Math.min(x + w, r.right) - Math.max(x, r.left);
        const oy = Math.min(y + h, r.bottom) - Math.max(y, r.top);
        if (ox > 2 && oy > 2) a += ox * oy;
      }
      return a;
    };
    const findClear = (pw, ph) => {
      const overlapArea2 = (x, y) => {
        let a = 0;
        for (const r of rects) {
          const ox = Math.min(x + pw, r.right) - Math.max(x, r.left);
          const oy = Math.min(y + ph, r.bottom) - Math.max(y, r.top);
          if (ox > 2 && oy > 2) a += ox * oy;
        }
        return a;
      };
      for (const y of ys) for (const x of xs) {
        if (overlapArea2(x, y) === 0) return [Math.round(x), Math.round(y)];
      }
      return null;
    };
    let chosen = findClear(w, h);
    let mini = false;
    if (!chosen) {
      // Dense screen: retry as orb-only (label hidden) - smaller footprint, still discoverable.
      mini = true;
      chosen = findClear(52, 52);
    }
    if (!chosen) {
      // Never hide outright: least-overlapping orb position.
      let best = null, bestA = Infinity;
      const area = (x, y) => {
        let a = 0;
        for (const r of rects) {
          const ox = Math.min(x + 52, r.right) - Math.max(x, r.left);
          const oy = Math.min(y + 52, r.bottom) - Math.max(y, r.top);
          if (ox > 2 && oy > 2) a += ox * oy;
        }
        return a;
      };
      for (const y of ys) for (const x of xs) {
        const a = area(x, y);
        if (a < bestA) { bestA = a; best = [Math.round(x), Math.round(y)]; }
      }
      chosen = best || [Math.round(W - w - 14), Math.round(H - h - 20)];
    }
    cont.classList.toggle('fab-mini', mini);
    wrap.style.setProperty('--fab-l', chosen[0] + 'px');
    wrap.style.setProperty('--fab-t', chosen[1] + 'px');
    wrap.style.setProperty('--fab-r', 'auto');
    wrap.style.setProperty('--fab-b', 'auto');
    cont.classList.remove('fab-nowhere');
  }, []);
  React.useEffect(() => {
    const onScroll = () => {
      setPortalScrolling(true);
      if (portalScrollTimer.current) clearTimeout(portalScrollTimer.current);
      portalScrollTimer.current = setTimeout(() => { setPortalScrolling(false); placeAssistant(); }, 900);
    };
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', placeAssistant);
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', placeAssistant);
      if (portalScrollTimer.current) clearTimeout(portalScrollTimer.current);
    };
  }, [placeAssistant]);
  const placeTimer = React.useRef(null);
  React.useEffect(() => {
    if (placeTimer.current) clearTimeout(placeTimer.current);
    placeTimer.current = setTimeout(placeAssistant, 1400);
    return () => { if (placeTimer.current) clearTimeout(placeTimer.current); };
  }, [location.pathname, placeAssistant]);
  React.useEffect(() => {
    if (freezeSplash) return;
    const t = setTimeout(() => setSplash(false), 2450);
    return () => clearTimeout(t);
  }, [freezeSplash]);

  // Warm up Indic webfont faces (all weights) so first bold Telugu/Indic paint never shows tofu.
  // The font stylesheet loads async, so retry once faces register and once more on a delay.
  React.useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) return;
    const warm = () => {
      ['400', '600', '700'].forEach((w) => {
        document.fonts.load(`${w} 16px "Noto Sans Telugu"`, '\u0C28\u0C3E\u0C30\u0C3E\u0C2F\u0C23').catch(() => {});
        document.fonts.load(`${w} 16px "Noto Sans Devanagari"`, '\u0928\u093E\u0930\u093E\u092F\u0923').catch(() => {});
      });
    };
    warm();
    if (document.fonts.ready && document.fonts.ready.then) document.fonts.ready.then(warm).catch(() => {});
    const t = setTimeout(warm, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <MSplash done={!splash} />
      <React.Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--m-muted)' }}>{loadingLabel}</div>}>
        <Routes>
          <Route path="/" element={<MShell><MHome /></MShell>} />
          <Route path="/home" element={<Navigate to="/" replace />} />

          <Route path="/sanjivani" element={
            <Embedded title="Sanjivani 108" subtitle="Emergency simulation" showBack hideTabs><MSanjivani /></Embedded>
          } />
          <Route path="/sanjivani-console" element={
            <SanjivaniEmergencyModal isOpen={true} onClose={() => navigate('/sanjivani')} />
          } />
          <Route path="/emergency" element={
            <Embedded title="Emergency Triage" subtitle="Symptom check demo" showBack hideTabs>
              <EmergencyTriageView onOpenFullConsole={() => navigate('/sanjivani')} />
            </Embedded>
          } />
          <Route path="/emergency/handover" element={
            <Embedded title="Hospital Handover" showBack hideTabs><EmergencyHandoverView /></Embedded>
          } />

          <Route path="/solutions" element={
            <MShell><MSolutions /></MShell>
          } />
          <Route path="/solutions/:moduleId" element={
            <Embedded title="Module" showBack>
              <DetailedModuleView onLaunchInteractiveModal={(k) => {
                if (k === 'sanjivani') navigate('/sanjivani');
                else if (k === 'scanner') navigate('/scanner');
                else if (k === 'audiorx') navigate('/audio-rx');
                else if (k === 'acoustic' || k === 'acoustic_lab') navigate('/acoustic-lab');
                else navigate('/solutions');
              }} />
            </Embedded>
          } />

          <Route path="/scanner" element={<Embedded title="Prescription Scanner" showBack hideTabs><PrescriptionScannerView /></Embedded>} />
          <Route path="/scanrx" element={<Navigate to="/scanner" replace />} />
          <Route path="/scan-rx" element={<Navigate to="/scanner" replace />} />
          <Route path="/audio-rx" element={<Embedded title="Audio-Rx Studio" showBack hideTabs><AudioRxStudioView /></Embedded>} />
          <Route path="/acoustic-lab" element={<Embedded title="Acoustic Lab" showBack hideTabs><AcousticBiomarkerLabView /></Embedded>} />
          <Route path="/benchmarks" element={<Embedded title="Benchmarks" showBack><ClinicalBenchmarkView /></Embedded>} />
          <Route path="/language-matrix" element={<Embedded title="Language Matrix" showBack><IndicLanguageMatrixView /></Embedded>} />
          <Route path="/datasets" element={<Embedded title="Datasets" showBack><DatasetExplorerView /></Embedded>} />
          <Route path="/technology" element={<Embedded title="Technology" showBack><ArchitectureView /></Embedded>} />
          <Route path="/about" element={<Embedded title="About" showBack><AboutView /></Embedded>} />
          <Route path="/team" element={<Embedded title="About" showBack><AboutView /></Embedded>} />

          <Route path="/clinical-console" element={<Embedded title="OPD Scribe" subtitle="Voice consultation demo" showBack hideTabs><MClinical /></Embedded>} />
          <Route path="/clinical-console/full" element={<Embedded title="OPD Scribe Studio" subtitle="Voice consultation demo" showBack hideTabs><ClinicalConsole /></Embedded>} />
          <Route path="/clinical-console/review" element={<Embedded title="Visit summary" subtitle="Steps 2-4 demo" showBack hideTabs><MScribeFlow /></Embedded>} />
          <Route path="/doctor-portal" element={<Embedded title="Doctor Portal" showBack hideTabs><DoctorPortal greetingKey="doctor.home.greetingNeutral" doctorProfile={doctorProfile} onLogoutDoctor={() => { setDoctorProfile(null); navigate('/'); }} /></Embedded>} />
          <Route path="/patient-portal" element={<Embedded title="Patient Portal" showBack hideTabs><PatientPortal patientProfile={patientProfile} onLogoutPatient={() => { setPatientProfile(null); navigate('/'); }} onSwitchPatient={setPatientProfile} /></Embedded>} />

          <Route path="/login" element={<div className="m-uawrap"><UnifiedAuthView /></div>} />
          <Route path="/auth" element={<div className="m-uawrap"><UnifiedAuthView /></div>} />
          <Route path="/auth/doctor" element={<div className="m-uawrap"><UnifiedAuthView defaultUserType="doctor" /></div>} />
          <Route path="/auth/patient" element={<div className="m-uawrap"><UnifiedAuthView defaultUserType="patient" /></div>} />

          <Route path="/prescription/preview" element={<Embedded title="Prescription" showBack hideTabs><PrescriptionPreviewView /></Embedded>} />
          <Route path="/rx/:ref" element={<Embedded title="Prescription" hideTabs><PrescriptionPreviewView isPublicDemoSlip={true} /></Embedded>} />
          <Route path="/privacy" element={<Embedded title="Privacy" showBack><PrivacyPolicyView /></Embedded>} />
          <Route path="/terms" element={<Embedded title="Terms" showBack><TermsOfServiceView /></Embedded>} />
          <Route path="*" element={<Embedded title="Not found"><NotFoundView /></Embedded>} />
        </Routes>
      </React.Suspense>
      {(location.pathname === '/' || location.pathname.startsWith('/clinical-console') || location.pathname.startsWith('/patient-portal') || location.pathname.startsWith('/doctor-portal')) && (
        <div className={`m-assistant summon-only${portalScrolling ? ' scrolling' : ''}${(location.pathname.startsWith('/patient-portal') || location.pathname.startsWith('/doctor-portal')) ? ' portal-edge docked' : ''}${location.pathname.startsWith('/clinical-console') ? ' lift-more' : ''}${fieldFocused ? ' kb-hide' : ''}`}>
          <FloatingAssistant
            activeView={
              location.pathname.startsWith('/doctor-portal') ? 'doctor_portal'
              : location.pathname.startsWith('/patient-portal') ? 'patient_portal'
              : location.pathname.startsWith('/clinical-console') ? 'console' : 'landing'
            }
            mobileFull
            doctorProfile={doctorProfile}
            patientProfile={patientProfile}
            onOpenSanjivani={() => navigate('/sanjivani')}
            onOpenClinicalConsole={() => navigate('/clinical-console')}
            onOpenWhatsAppRx={() => setWhatsAppRxOpen(true)}
            onNavigateTab={(tab) => {
              if (location.pathname.startsWith('/patient-portal')) navigate(`/patient-portal?tab=${tab}`);
              else if (location.pathname.startsWith('/doctor-portal')) navigate(`/doctor-portal?tab=${tab}`);
            }}
          />
        </div>
      )}
      {whatsAppRxOpen && (
        <React.Suspense fallback={null}>
          <WhatsAppAudioRxModal
            isOpen={whatsAppRxOpen}
            onClose={() => setWhatsAppRxOpen(false)}
            patientData={{
              name: patientProfile?.patientName || 'Narayana Rao',
              vernacularName: 'నారాయణ రావు',
              phone: '+91 00000 00002',
              cleanPhone: '910000000002',
              age: patientProfile?.age || 58,
              gender: patientProfile?.gender || 'Male',
              abhaId: patientProfile?.abhaId || 'DEMO-ABHA-0000-1049',
              language: patientProfile?.language || 'Telugu',
              langCode: 'te-IN'
            }}
            doctorName={doctorProfile?.doctorName || 'Dr. Demo Clinician (synthetic)'}
            initialLanguage="te"
          />
        </React.Suspense>
      )}
      {appLocked && <AppLockScreen lang={selectedLanguage} onUnlock={() => setAppLocked(false)} />}
    </>
  );
}
