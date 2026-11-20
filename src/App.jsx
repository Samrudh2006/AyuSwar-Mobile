import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
const HeroLanding = lazyWithRetry(() => import('./components/HeroLanding'));
// Lazy-loaded on-demand modals for ultra-fast initial page load
const DoctorAuthModal = lazyWithRetry(() => import('./components/DoctorAuthModal'));
const PatientAuthModal = lazyWithRetry(() => import('./components/PatientAuthModal'));
const WhatsAppAudioRxModal = lazyWithRetry(() => import('./components/WhatsAppAudioRxModal'));
const MobileInnovationHubModal = lazyWithRetry(() => import('./components/MobileInnovationHubModal'));
const TeleconsultModal = lazyWithRetry(() => import('./components/TeleconsultModal'));
const VitalsRppgModal = lazyWithRetry(() => import('./components/VitalsRppgModal'));
const PillVisionScannerModal = lazyWithRetry(() => import('./components/PillVisionScannerModal'));
const LiveScribeSessionModal = lazyWithRetry(() => import('./components/LiveScribeSessionModal'));
import SeoHead from './components/SeoHead';

import MobileRoot from './mobile/MobileRoot';
import './mobile/mobile.css';
import { initAllRoutesPreload, lazyWithRetry, preloadModule } from './utils/routePreloader';
import { initGlobalClickSounds } from './utils/soundEffects';
import { demoBookingService } from './services/demoBookingService';

// Route-Level Code-Split Components with resilient automatic retry
const DetailedModuleView = lazyWithRetry(() => import('./components/DetailedModuleView'));
const DoctorPortal = lazyWithRetry(() => import('./components/DoctorPortal'));
const ClinicalConsole = lazyWithRetry(() => import('./components/ClinicalConsole'));
const PatientPortal = lazyWithRetry(() => import('./components/PatientPortal'));
const SanjivaniEmergencyModal = lazyWithRetry(() => import('./components/SanjivaniEmergencyModal'));
const ArchitectureView = lazyWithRetry(() => import('./views/ArchitectureView'));
const AboutView = lazyWithRetry(() => import('./views/AboutView'));
const PrescriptionScannerView = lazyWithRetry(() => import('./views/PrescriptionScannerView'));
const AudioRxStudioView = lazyWithRetry(() => import('./views/AudioRxStudioView'));
const AcousticBiomarkerLabView = lazyWithRetry(() => import('./views/AcousticBiomarkerLabView'));
const ClinicalBenchmarkView = lazyWithRetry(() => import('./views/ClinicalBenchmarkView'));
const IndicLanguageMatrixView = lazyWithRetry(() => import('./views/IndicLanguageMatrixView'));
const DatasetExplorerView = lazyWithRetry(() => import('./views/DatasetExplorerView'));
const EmergencyTriageView = lazyWithRetry(() => import('./views/EmergencyTriageView'));
const EmergencyHandoverView = lazyWithRetry(() => import('./views/EmergencyHandoverView'));
const PrescriptionPreviewView = lazyWithRetry(() => import('./views/PrescriptionPreviewView'));
const PrivacyPolicyView = lazyWithRetry(() => import('./views/PrivacyPolicyView'));

// Desktop-only chrome: split out of the phone-experience entry chunk
const Navbar = lazyWithRetry(() => import('./components/Navbar'));
const FloatingAssistant = lazyWithRetry(() => import('./components/FloatingAssistant'));
const MobilePwaInstallBanner = lazyWithRetry(() => import('./components/MobilePwaInstallBanner'));
const DemoRecordingOverlay = lazyWithRetry(() => import('./components/DemoRecordingOverlay'));
const CookieConsentBanner = lazyWithRetry(() => import('./components/CookieConsentBanner'));
const FeedbackPopup = lazyWithRetry(() => import('./components/FeedbackPopup'));
const MintIvoryWaveBackground = lazyWithRetry(() => import('./components/MintIvoryWaveBackground'));
const TermsOfServiceView = lazyWithRetry(() => import('./views/TermsOfServiceView'));
const NotFoundView = lazyWithRetry(() => import('./views/NotFoundView'));
const UnifiedAuthView = lazyWithRetry(() => import('./views/UnifiedAuthView'));

function RouteLoadingFallback() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '14px',
      background: '#FAF8F5',
      color: '#0F4C5C',
      fontFamily: 'var(--font-main)'
    }}>
      <div style={{
        width: '38px',
        height: '38px',
        border: '3px solid rgba(0, 0, 0, 0.10)',
        borderTopColor: '#0F4C5C',
        borderRadius: '50%',
        animation: 'ayuswar-spin 0.75s linear infinite'
      }} />
      <span style={{ fontSize: '13px', fontWeight: 650, color: '#091E26', letterSpacing: '0.02em' }}>
        Loading clinical module...
      </span>
      <style>{`
        @keyframes ayuswar-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.style.overflow = '';
  }, [pathname]);

  return null;
}

import { useApp, DEFAULT_DOCTOR_PROFILE, DEFAULT_PATIENT_PROFILE } from './context/AppContext';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    doctorProfile: currentDoctor, 
    setDoctorProfile: setCurrentDoctor, 
    patientProfile: currentPatient, 
    setPatientProfile: setCurrentPatient 
  } = useApp();
  const [isPhoneExperience] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isCapacitorNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    return isCapacitorNative || window.innerWidth <= 768;
  });
  const [isSanjivaniModalOpen, setIsSanjivaniModalOpen] = useState(false);
  const [isDoctorAuthModalOpen, setIsDoctorAuthModalOpen] = useState(false);
  const [isPatientAuthModalOpen, setIsPatientAuthModalOpen] = useState(false);
  const [isWhatsAppAudioRxModalOpen, setIsWhatsAppAudioRxModalOpen] = useState(false);

  // 14-Phase Mobile Innovation Suite Modals State
  const [isInnovationHubOpen, setIsInnovationHubOpen] = useState(false);
  const [isTeleconsultOpen, setIsTeleconsultOpen] = useState(false);
  const [isVitalsRppgOpen, setIsVitalsRppgOpen] = useState(false);
  const [isPillVisionOpen, setIsPillVisionOpen] = useState(false);
  const [isLiveScribeOpen, setIsLiveScribeOpen] = useState(false);

  // Mobile Web Audio Autoplay Unlock on First Touch/Click
  React.useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
        }
      } catch {}
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
    window.addEventListener('click', unlockAudio, { passive: true, once: true });
    return () => {
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };
  }, []);

  // Universal subtle tactile micro-interaction click audio
  React.useEffect(() => {
    const cleanup = initGlobalClickSounds();
    return cleanup;
  }, []);

  // Preload route chunks during idle time for instantaneous 0ms page navigation
  React.useEffect(() => {
    initAllRoutesPreload();
  }, []);

  // Mobile Hardware Back Button Handling for Active Full-Screen Modals
  const anyModalOpen = 
    isSanjivaniModalOpen || 
    isDoctorAuthModalOpen || 
    isPatientAuthModalOpen || 
    isWhatsAppAudioRxModalOpen || 
    isInnovationHubOpen || 
    isTeleconsultOpen || 
    isVitalsRppgOpen || 
    isPillVisionOpen || 
    isLiveScribeOpen;

  React.useEffect(() => {
    const openVitals = () => setIsVitalsRppgOpen(true);
    const openPill = () => setIsPillVisionOpen(true);
    window.addEventListener('ayuswar:open-vitals-rppg', openVitals);
    window.addEventListener('ayuswar:open-pill-vision', openPill);
    return () => {
      window.removeEventListener('ayuswar:open-vitals-rppg', openVitals);
      window.removeEventListener('ayuswar:open-pill-vision', openPill);
    };
  }, []);

  React.useEffect(() => {
    if (!anyModalOpen) return;

    let isPopped = false;
    window.history.pushState({ modalOpen: true }, '');

    const handlePopState = () => {
      isPopped = true;
      setIsSanjivaniModalOpen(false);
      setIsDoctorAuthModalOpen(false);
      setIsPatientAuthModalOpen(false);
      setIsWhatsAppAudioRxModalOpen(false);
      setIsInnovationHubOpen(false);
      setIsTeleconsultOpen(false);
      setIsVitalsRppgOpen(false);
      setIsPillVisionOpen(false);
      setIsLiveScribeOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (!isPopped && window.history.state?.modalOpen) {
        window.history.back();
      }
    };
  }, [anyModalOpen]);

  const handleDoctorLoginSuccess = (docProfile) => {
    setCurrentDoctor(docProfile);
    setIsDoctorAuthModalOpen(false);
    navigate('/doctor-portal');
  };

  const handlePatientLoginSuccess = (patientProfile) => {
    setCurrentPatient(patientProfile);
    setIsPatientAuthModalOpen(false);
    navigate('/patient-portal');
  };

  const handleLaunchInteractiveModal = (modalKey) => {
    if (modalKey === 'sanjivani') {
      setIsSanjivaniModalOpen(true);
    } else if (modalKey === 'scanner') {
      navigate('/scanner');
    } else if (modalKey === 'acoustic' || modalKey === 'acoustic_lab') {
      navigate('/acoustic-lab');
    } else if (modalKey === 'language_matrix') {
      navigate('/language-matrix');
    } else if (modalKey === 'audiorx') {
      navigate('/audio-rx');
    } else if (modalKey === 'tech' || modalKey === 'architecture') {
      navigate('/technology');
    } else if (modalKey === 'benchmark' || modalKey === 'benchmark_suite') {
      navigate('/benchmarks');
    } else if (modalKey === 'dataset' || modalKey === 'kaggle_hub') {
      navigate('/datasets');
    } else if (modalKey === 'scribe' || modalKey === 'console') {
      navigate('/clinical-console');
    }
  };

  const isDedicatedPortal = 
    location.pathname.startsWith('/doctor-portal') || 
    location.pathname.startsWith('/patient-portal') || 
    location.pathname.startsWith('/clinical-console') ||
    location.pathname.startsWith('/auth') ||
    location.pathname === '/login' ||
    location.pathname === '/sanjivani';

  if (isPhoneExperience) {
    return (
      <>
        <ScrollToTop />
        <SeoHead />
        <MobileRoot />
        {/* Phone-reachable demo modals (opened from the mobile drawer) */}
        <React.Suspense fallback={null}>
          {isVitalsRppgOpen && (
            <VitalsRppgModal
              isOpen={isVitalsRppgOpen}
              onClose={() => setIsVitalsRppgOpen(false)}
            />
          )}
          {isPillVisionOpen && (
            <PillVisionScannerModal
              isOpen={isPillVisionOpen}
              onClose={() => setIsPillVisionOpen(false)}
            />
          )}
        </React.Suspense>
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'transparent', position: 'relative' }}>
      {/* Route-Change Instant Scroll to Top and Body Overflow Reset */}
      <ScrollToTop />

      {/* Signature AyuSwar Mint-Ivory Vector Wave Canvas (Active on every screen) */}
      <React.Suspense fallback={null}><MintIvoryWaveBackground /></React.Suspense>

      {/* Mobile PWA Add-To-Home-Screen Install Banner (Shown on public landing/website pages) */}
      {!isDedicatedPortal && <React.Suspense fallback={null}><MobilePwaInstallBanner /></React.Suspense>}

      {/* Accessible Skip-To-Content for Screen Readers & Keyboard Navigation */}
      <a href="#main-content" className="skip-to-content-link">
        Skip to main content
      </a>

      {/* Dynamic SEO, AEO, and GEO Route Metadata Manager */}
      <SeoHead />

      {/* Accessible Enterprise Top Navbar (Only on public website routes) */}
      {!isDedicatedPortal && (
        <React.Suspense fallback={null}><Navbar 
          onOpenSanjivani={() => setIsSanjivaniModalOpen(true)}
          onOpenDoctorAuth={() => navigate('/auth/doctor')}
          onOpenPatientAuth={() => navigate('/auth/patient')}
          onOpenInnovationHub={() => setIsInnovationHubOpen(true)}
        /></React.Suspense>
      )}

      {/* Main Routed Content Workspace */}
      <main 
        id="main-content"
        className={isDedicatedPortal ? 'portal-canvas-main' : 'app-public-main'}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', height: isDedicatedPortal ? '100vh' : 'auto', position: 'relative', zIndex: 1 }}
      >
        <React.Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Public Home & Marketing */}
            <Route 
            path="/" 
            element={
              <HeroLanding 
                onOpenSanjivaniModal={() => setIsSanjivaniModalOpen(true)}
                onOpenDoctorAuthModal={() => navigate('/auth/doctor')}
                onOpenPatientAuthModal={() => navigate('/auth/patient')}
                onLaunchStudio={() => navigate('/auth/doctor')}
                onOpenAcousticLab={() => navigate('/acoustic-lab')}
                onOpenTechModal={() => navigate('/technology')}
                onOpenDatasetModal={() => navigate('/datasets')}
                onOpenBenchmarkSuite={() => navigate('/benchmarks')}
              />
            } 
          />

          {/* Dedicated Solution & Resource Specifications */}
          <Route 
            path="/solutions" 
            element={
              <DetailedModuleView 
                moduleId="opd_ambient_scribe" 
                onLaunchInteractiveModal={handleLaunchInteractiveModal}
              />
            } 
          />
          <Route 
            path="/solutions/:moduleId" 
            element={
              <DetailedModuleView 
                onLaunchInteractiveModal={handleLaunchInteractiveModal}
              />
            } 
          />

          {/* Deep-Tech Architectural Blueprint */}
          <Route path="/technology" element={<ArchitectureView />} />
          {/* Creator & Sovereign Clinical AI Consortium */}
          <Route path="/about" element={<AboutView />} />
          <Route path="/team" element={<AboutView />} />

          {/* Interactive Medical Vision Scanner & Aliases */}
          <Route path="/scanner" element={<PrescriptionScannerView />} />
          <Route path="/scanrx" element={<Navigate to="/scanner" replace />} />
          <Route path="/scan-rx" element={<Navigate to="/scanner" replace />} />

          {/* Spoken Dosage & Karaoke Rx Studio */}
          <Route path="/audio-rx" element={<AudioRxStudioView />} />

          {/* Non-Diagnostic Acoustic Signal Processing Lab */}
          <Route path="/acoustic-lab" element={<AcousticBiomarkerLabView />} />

          {/* 24 Executed Unit & Contract Assertions */}
          <Route path="/benchmarks" element={<ClinicalBenchmarkView />} />

          {/* Indic Language Support & Dialect Matrix */}
          <Route path="/language-matrix" element={<IndicLanguageMatrixView />} />

          {/* Clinical Knowledge & Colloquial Lexicon Reference */}
          <Route path="/datasets" element={<DatasetExplorerView />} />

          {/* Simulated Emergency Distress Triage */}
          <Route 
            path="/emergency" 
            element={
              <EmergencyTriageView 
                onOpenFullConsole={() => setIsSanjivaniModalOpen(true)}
              />
            } 
          />
          <Route 
            path="/sanjivani" 
            element={
              <SanjivaniEmergencyModal 
                isOpen={true} 
                onClose={() => navigate('/')} 
              />
            } 
          />
          <Route path="/emergency/handover" element={<EmergencyHandoverView />} />

          {/* ABDM FHIR R4 Prescription Preview */}
          <Route path="/prescription/preview" element={<PrescriptionPreviewView />} />

          {/* Dedicated Unified Split-Screen Auth Routes (Matching Visual Mockup) */}
          <Route 
            path="/login" 
            element={
              currentDoctor ? (
                <Navigate to="/doctor-portal" replace />
              ) : currentPatient ? (
                <Navigate to="/patient-portal" replace />
              ) : (
                <UnifiedAuthView defaultUserType="doctor" />
              )
            } 
          />
          <Route 
            path="/auth" 
            element={
              currentDoctor ? (
                <Navigate to="/doctor-portal" replace />
              ) : currentPatient ? (
                <Navigate to="/patient-portal" replace />
              ) : (
                <UnifiedAuthView defaultUserType="doctor" />
              )
            } 
          />
          <Route 
            path="/auth/doctor" 
            element={
              currentDoctor ? (
                <Navigate to="/doctor-portal" replace />
              ) : (
                <UnifiedAuthView defaultUserType="doctor" />
              )
            } 
          />
          <Route 
            path="/auth/patient" 
            element={
              currentPatient ? (
                <Navigate to="/patient-portal" replace />
              ) : (
                <UnifiedAuthView defaultUserType="patient" />
              )
            } 
          />

          {/* Doctor & Patient Portals (Reliable Fallback Session Profile) */}
          <Route 
            path="/doctor-portal" 
            element={
              <DoctorPortal 
                doctorProfile={currentDoctor || DEFAULT_DOCTOR_PROFILE} 
                onSelectEncounterAndLaunch={(idx, patientData) => {
                  const params = new URLSearchParams();
                  if (idx !== undefined && idx !== null) params.set('encounter', idx);
                  if (patientData?.patientName || patientData?.name) params.set('name', patientData.patientName || patientData.name);
                  if (patientData?.token) params.set('token', patientData.token);
                  if (patientData?.phone) params.set('phone', patientData.phone);
                  const qs = params.toString();
                  navigate(qs ? `/clinical-console?${qs}` : '/clinical-console');
                }}
                onOpenTechModal={() => navigate('/technology')}
                onOpenDatasetModal={() => navigate('/datasets')}
                onLogoutDoctor={() => {
                  setCurrentDoctor(null);
                  navigate('/');
                }}
              />
            } 
          />
          <Route 
            path="/patient-portal" 
            element={
              <PatientPortal 
                patientProfile={currentPatient || DEFAULT_PATIENT_PROFILE} 
                onOpenDoctorAuthModal={() => {
                  navigate('/doctor-portal');
                }}
                onLogoutPatient={() => {
                  setCurrentPatient(null);
                  navigate('/');
                }}
                onSwitchPatient={(newProfile) => setCurrentPatient(newProfile)}
                onBookAppointment={(bookingData) => demoBookingService.createBooking(bookingData)}
              />
            } 
          />
          <Route 
            path="/clinical-console" 
            element={
              <ClinicalConsole 
                doctorProfile={currentDoctor || { doctorName: 'Dr. Demo Clinician (synthetic)', registrationNumber: 'MCI-98421-AP', specialty: 'General & Preventive Medicine' }} 
              />
            } 
          />

          {/* Public Demo Prescription Slip Route (Serves ONLY bundled demo content) */}
          <Route path="/rx/:ref" element={<PrescriptionPreviewView isPublicDemoSlip={true} />} />

          {/* Legal & Compliance Routes */}
          <Route path="/privacy" element={<PrivacyPolicyView />} />
          <Route path="/terms" element={<TermsOfServiceView />} />

          {/* Custom 404 Route */}
          <Route path="*" element={<NotFoundView />} />
        </Routes>
        </React.Suspense>
      </main>

      {/* DPDP Act 2023 & Ephemeral Consent Banner */}
      {!isDedicatedPortal && !isSanjivaniModalOpen && <React.Suspense fallback={null}><CookieConsentBanner /></React.Suspense>}

      {/* Global Prototype Disclaimer Footer Banner (Only on public showcase routes) */}
      {!isDedicatedPortal && (
        <footer 
          className="site-footer"
          style={{
          background: '#082E37',
          color: '#E0F2F1',
          borderTop: '1px solid rgba(212, 175, 55, 0.35)',
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: '12.5px',
          fontWeight: 650,
          zIndex: 30,
          position: 'relative'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }}></span>
            <span>AyuSwar AI is a prototype demo on synthetic data. Not a medical device. Not for diagnosis.</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>Built by <a href="https://github.com/Samrudh2006" target="_blank" rel="author noopener noreferrer" style={{ color: '#D4AF37', textDecoration: 'underline' }}>Samrudh</a> (Aditya University)</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <Link to="/about" style={{ color: '#D4AF37', textDecoration: 'underline' }}>About & Team</Link>
          </div>
        </footer>
      )}

      {/* Sanjivani-108 Masterclass Operational GIS Console Modal */}
      {isSanjivaniModalOpen && (
        <React.Suspense fallback={
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(6, 22, 38, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            gap: 16,
            fontFamily: 'var(--font-main)'
          }}>
            <div style={{
              width: 44,
              height: 44,
              border: '3px solid rgba(239, 68, 68, 0.25)',
              borderTopColor: '#B91C1C',
              borderRadius: '50%',
              animation: 'ayuswar-spin 0.7s linear infinite'
            }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#FEE2E2', letterSpacing: '0.02em' }}>
              Launching Sanjivani 108 Emergency System...
            </div>
          </div>
        }>
          <SanjivaniEmergencyModal 
            isOpen={isSanjivaniModalOpen}
            onClose={() => setIsSanjivaniModalOpen(false)}
          />
        </React.Suspense>
      )}

      <React.Suspense fallback={null}>
        {/* Clinician Authentication & OPD Login Modal */}
        {isDoctorAuthModalOpen && (
          <DoctorAuthModal
            isOpen={isDoctorAuthModalOpen}
            onClose={() => setIsDoctorAuthModalOpen(false)}
            onLoginSuccess={handleDoctorLoginSuccess}
          />
        )}

      {/* Patient ABHA Citizen Login Modal */}
      {isPatientAuthModalOpen && (
        <PatientAuthModal
          isOpen={isPatientAuthModalOpen}
          onClose={() => setIsPatientAuthModalOpen(false)}
          onLoginSuccess={handlePatientLoginSuccess}
        />
      )}

      {/* Floating Ambient Voice Assistant (Role-aware across landing, doctor, and patient portals) */}
      {!isSanjivaniModalOpen && location.pathname !== '/sanjivani' && !location.pathname.startsWith('/emergency') && !location.pathname.startsWith('/auth') && (
        <React.Suspense fallback={null}><FloatingAssistant 
          activeView={
            location.pathname.startsWith('/doctor-portal') 
              ? 'doctor_portal' 
              : (location.pathname.startsWith('/patient-portal') 
                ? 'patient_portal' 
                : (location.pathname.startsWith('/clinical-console') ? 'console' : 'landing'))
          }
          doctorProfile={currentDoctor}
          onOpenSanjivani={() => setIsSanjivaniModalOpen(true)}
          onOpenClinicalConsole={() => {
            if (currentDoctor) {
              navigate('/clinical-console');
            } else {
              setIsDoctorAuthModalOpen(true);
            }
          }}
          onOpenWhatsAppRx={() => setIsWhatsAppAudioRxModalOpen(true)}
        /></React.Suspense>
      )}

      {/* Universal WhatsApp Vernacular Spoken Audio-Rx Modal */}
      {isWhatsAppAudioRxModalOpen && (
        <WhatsAppAudioRxModal 
          isOpen={isWhatsAppAudioRxModalOpen}
          onClose={() => setIsWhatsAppAudioRxModalOpen(false)}
          patientData={{
            name: currentPatient?.patientName || 'Narayana Rao',
            vernacularName: 'నారాయణ రావు',
            phone: '+91 00000 00002',
            cleanPhone: '910000000002',
            age: currentPatient?.age || 58,
            gender: currentPatient?.gender || 'Male',
            abhaId: currentPatient?.abhaId || 'DEMO-ABHA-0000-1049',
            language: currentPatient?.language || 'Telugu',
            langCode: 'te-IN'
          }}
          doctorName={currentDoctor?.doctorName || 'Dr. Demo Clinician (synthetic)'}
          initialLanguage="te"
        />
      )}

      {/* 14-Phase Mobile Clinical Innovation Hub Modal */}
      {isInnovationHubOpen && (
        <MobileInnovationHubModal 
          isOpen={isInnovationHubOpen}
          onClose={() => setIsInnovationHubOpen(false)}
          onOpenTeleconsult={() => setIsTeleconsultOpen(true)}
          onOpenScribe={() => setIsLiveScribeOpen(true)}
          onOpenAbha={() => {
            if (currentPatient) navigate('/patient-portal');
            else setIsPatientAuthModalOpen(true);
          }}
          onOpenScanner={() => navigate('/scanner')}
          onOpenPillVision={() => setIsPillVisionOpen(true)}
          onOpenGeoBeacon={() => setIsSanjivaniModalOpen(true)}
          onOpenAudioRx={() => setIsWhatsAppAudioRxModalOpen(true)}
          onOpenVitalsRppg={() => setIsVitalsRppgOpen(true)}
        />
      )}

      {/* Phase 1: WebRTC Telemedicine Video Call Modal */}
      {isTeleconsultOpen && (
        <TeleconsultModal 
          isOpen={isTeleconsultOpen}
          onClose={() => setIsTeleconsultOpen(false)}
          patientName={currentPatient?.patientName || 'Narayana Rao'}
          doctorName={currentDoctor?.doctorName || 'Dr. Demo Clinician (synthetic)'}
        />
      )}

      {/* Phase 10: Vitals-rPPG Contactless Camera Scanner Modal */}
      {isVitalsRppgOpen && (
        <VitalsRppgModal 
          isOpen={isVitalsRppgOpen}
          onClose={() => setIsVitalsRppgOpen(false)}
        />
      )}

      {/* Phase 7: Pill-Vision Computer Vision Scanner Modal */}
      {isPillVisionOpen && (
        <PillVisionScannerModal 
          isOpen={isPillVisionOpen}
          onClose={() => setIsPillVisionOpen(false)}
        />
      )}

        {/* Phase 2: Live Ambient Voice Scribe Session Modal */}
        {isLiveScribeOpen && currentPatient && (
          <LiveScribeSessionModal 
            isOpen={isLiveScribeOpen}
            onClose={() => setIsLiveScribeOpen(false)}
            patientData={currentPatient}
            doctorName={currentDoctor?.doctorName || 'Dr. Demo Clinician (synthetic)'}
          />
        )}
      </React.Suspense>


      {/* Demo Recording Mode Overlay (Active only with ?demo-record=1) */}
      <React.Suspense fallback={null}><DemoRecordingOverlay /></React.Suspense>

      {/* AyuSwar Active-Time Feedback Popup (Banarasi Zari Theme) */}
      <React.Suspense fallback={null}><FeedbackPopup /></React.Suspense>
    </div>
  );
}
