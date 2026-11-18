import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp, SUPPORTED_LANGUAGES } from '../context/AppContext';
import { Globe } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Activity, 
  FileText, 
  Search, 
  Bell, 
  Layers,
  BarChart3,
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Sparkles, 
  Sun, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  ArrowLeft, 
  Mic, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Stethoscope, 
  Pill, 
  BookOpen, 
  LayoutGrid,
  FlaskConical,
  ClipboardPlus,
  BookOpenCheck,
  Settings, 
  Home, 
  Database,
  Send,
  MessageSquare,
  FileCheck,
  Filter,
  Plus,
  AlertTriangle,
  Heart,
  QrCode,
  Volume2,
  Scan,
  Maximize2,
  Download,
  Share2,
  PhoneCall,
  UserCheck,
  Check,
  Play,
  LogOut,
  Menu,
  X,
  WifiOff,
  RefreshCw,
  Printer,
  Camera,
  Upload,
  MoreHorizontal,
  Droplets
} from 'lucide-react';
import { askAyuSwarBrain } from '../services/aiBrainService';
import AbhaDigitalCard from './AbhaDigitalCard';
import WhatsAppAudioRxModal from './WhatsAppAudioRxModal';
import LiveScribeSessionModal from './LiveScribeSessionModal';
import AuthenticQrCode from './AuthenticQrCode';
import { escapeHtml } from '../utils/escapeHtml';
import ClinicalNotificationsDrawer from './ClinicalNotificationsDrawer';
import DoctorClinicalLibraryTab from './doctor/DoctorClinicalLibraryTab';
import DoctorAiAssistantTab from './doctor/DoctorAiAssistantTab';
import DeepamHeartbeatEmblem from './DeepamHeartbeatEmblem';
import BotanicalWatermark from './BotanicalWatermark';
import MintIvoryWaveBackground from './MintIvoryWaveBackground';
import PatientAnalyticsCard from './PatientAnalyticsCard';
import { DIAGNOSTIC_REPORTS_DATABASE } from '../data/diagnosticReportsDataset';
import { downloadFhirJson, calculateMewsScore, getJanAushadhiGenericInfo } from '../data/clinicalSafetySentinel';
import { DEMO_PATIENTS, DEMO_APPOINTMENTS, formatDemoDate, getRelativeDaysLabel, SampleDataChip } from '../data/demoData';
import AbdmRegistryBadgeRow from './AbdmRegistryBadgeRow';
import LiveTelemetryBadge from './LiveTelemetryBadge';
import { useDoctorVoiceNavigation } from '../hooks/useDoctorVoiceNavigation';
import LiveOpdDemoSimulator from './LiveOpdDemoSimulator';
import KurnoolClimateSentinel from './KurnoolClimateSentinel';
import { triggerHaptic } from '../utils/haptics';
import { audioMutex } from '../services/clinicalTelemetry';
import { downloadAbdmWhitepaper, printAbdmDossier } from '../utils/abdmWhitepaperExport';
import { clinicalOfflineStorage } from '../services/clinicalOfflineStorage';
import { opdQueueService, STANDARD_OPD_TIME_SLOTS } from '../services/opdQueueService';
import { loadLocalPreferences, saveLocalPreferences } from '../services/localPreferences';

/**
 * DoctorPortal Component — Complete Enterprise Physician Operating System
 * Faithfully implements Screenshot 1 + All 8 dedicated sidebar views:
 * 1. Dashboard (KPIs, OPD appointments, AI assistant, Analytics chart, Recent reports, Features)
 * 2. Patients (Full OPD registry, risk triage, ABHA IDs, longitudinal EHR & vitals)
 * 3. AI Assistant (Dedicated clinical co-pilot, GINA/ICMR guidelines, DDI checker, differential diagnosis)
 * 4. Appointments (OPD queue master, live token display, waiting times, triage priority)
 * 5. Reports & Lab (X-Ray DICOM viewer, CBC, Spirometry PFT, 12-lead ECG, local FHIR research export)
 * 6. Prescriptions (Active e-Rx, NFI formulary samples, AyuVision bundled demo-comparison lens, spoken Audio-Rx)
 * 7. Clinical Library (WHO ICD-10 taxonomy, colloquial Indic symptom resolver, clinical protocols)
 * 8. Settings (demo clinician credentials, facility display, WebAudio mic VAD calibration)
 */
const INITIAL_DASHBOARD_APPOINTMENTS = [
  {
    id: 0,
    patientName: 'Rohit Kumar',
    name: 'Rohit Kumar',
    vernacular: 'రోహిత్ కుమార్',
    token: 'OPD-101',
    age: 42,
    gender: 'Male',
    time: '09:30 AM',
    type: 'Follow-up (Asthma)',
    status: 'Completed',
    statusColor: '#10B981',
    statusBg: 'rgba(16, 185, 129, 0.1)',
    encounterIndex: 0
  },
  {
    id: 1,
    patientName: 'Ananya Rao',
    name: 'Ananya Rao',
    vernacular: 'అనన్య రావు',
    token: 'OPD-102',
    age: 28,
    gender: 'Female',
    time: '10:15 AM',
    type: 'Consultation (Fever)',
    status: 'In Progress',
    statusColor: '#3B82F6',
    statusBg: 'rgba(59, 130, 246, 0.12)',
    encounterIndex: 1
  },
  {
    id: 2,
    patientName: 'Suresh Babu',
    name: 'Suresh Babu',
    vernacular: 'సురేష్ బాబు',
    token: 'OPD-103',
    age: 56,
    gender: 'Male',
    time: '11:00 AM',
    type: 'Follow-up (Diabetes)',
    status: 'Upcoming',
    statusColor: '#D97706',
    statusBg: 'rgba(217, 119, 6, 0.1)',
    encounterIndex: 2
  },
  {
    id: 3,
    patientName: 'Meera Nair',
    name: 'Meera Nair',
    vernacular: 'మీరా నాయర్',
    token: 'OPD-104',
    age: 34,
    gender: 'Female',
    time: '11:45 AM',
    type: 'Consultation (Cough)',
    status: 'Upcoming',
    statusColor: '#D97706',
    statusBg: 'rgba(217, 119, 6, 0.1)',
    encounterIndex: 0
  },
  {
    id: 4,
    patientName: 'Thirunavukkarasu',
    name: 'Thirunavukkarasu',
    vernacular: 'திருநாவுக்கரசு',
    token: 'OPD-105',
    age: 62,
    gender: 'Male',
    language: 'Tamil',
    time: '12:15 PM',
    type: 'Consultation (Diabetic Neuropathy)',
    status: 'Upcoming',
    statusColor: '#0F4C5C',
    statusBg: 'rgba(0, 0, 0, 0.07)',
    encounterIndex: 3
  },
  {
    id: 5,
    patientName: 'Lakshmi Gowda',
    name: 'Lakshmi Gowda',
    vernacular: 'ಲಕ್ಷ್ಮಿ ಗೌಡ',
    token: 'OPD-106',
    age: 26,
    gender: 'Female',
    language: 'Kannada',
    time: '12:45 PM',
    type: 'Antenatal Checkup (Anemia)',
    status: 'Upcoming',
    statusColor: '#D97706',
    statusBg: 'rgba(217, 119, 6, 0.1)',
    encounterIndex: 4
  },
  {
    id: 6,
    patientName: 'Dattatray Shinde',
    name: 'Dattatray Shinde',
    vernacular: 'दत्तात्रय शिंदे',
    token: 'OPD-107',
    age: 54,
    gender: 'Male',
    language: 'Marathi',
    time: '01:15 PM',
    type: 'Consultation (Bronchitis & Wheeze)',
    status: 'Upcoming',
    statusColor: '#EF4444',
    statusBg: 'rgba(239, 68, 68, 0.1)',
    encounterIndex: 5
  },
  {
    id: 7,
    patientName: 'Debabrata Ghosh',
    name: 'Debabrata Ghosh',
    vernacular: 'দেবব্রত ঘোষ',
    token: 'OPD-108',
    age: 48,
    gender: 'Male',
    language: 'Bengali',
    time: '01:45 PM',
    type: 'Consultation (Gastritis & Dyspepsia)',
    status: 'Upcoming',
    statusColor: '#D97706',
    statusBg: 'rgba(217, 119, 6, 0.1)',
    encounterIndex: 6
  }
];

export default function DoctorPortal({ 
  doctorProfile, 
  onSelectEncounterAndLaunch, 
  onOpenTechModal, 
  onOpenDatasetModal,
  onLogoutDoctor, 
  greetingKey = 'doctor.home.greeting',
  registeredPatients = [],
  appointmentsQueue = [],
  onAcceptAppointment
}) {
  const { selectedLanguage, setSelectedLanguage, t } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabFromUrl = searchParams.get('tab');
  const validDoctorTabs = ['dashboard', 'opd_queue', 'reports', 'prescriptions', 'ai_assistant', 'clinical_library', 'settings'];
  const [activeTab, setActiveTabState] = useState(() => {
    return (tabFromUrl && validDoctorTabs.includes(tabFromUrl)) ? tabFromUrl : 'dashboard';
  });

  const setActiveTab = (newTab) => {
    setActiveTabState(newTab);
    try {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('tab', newTab);
        return next;
      }, { replace: true });
    } catch {}
  };

  useEffect(() => {
    if (tabFromUrl && validDoctorTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl);
    }
  }, [tabFromUrl]);
  const [isOpdDemoModalOpen, setIsOpdDemoModalOpen] = useState(false);
  const [isDeviceOnline, setIsDeviceOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsDeviceOnline(true);
    const handleOffline = () => setIsDeviceOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);
  const [lastSyncAuditHash, setLastSyncAuditHash] = useState(null);

  // Monitor offline queue count from IndexedDB
  useEffect(() => {
    let isMounted = true;
    async function checkPending() {
      try {
        const count = await clinicalOfflineStorage.getPendingCount();
        if (isMounted) setPendingOfflineCount(count);
      } catch (e) {
        console.warn('[DoctorPortal] Could not read offline queue count:', e);
      }
    }
    checkPending();
    const handleQueueUpdate = () => checkPending();
    window.addEventListener('ayuswar:offline_queue_updated', handleQueueUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('ayuswar:offline_queue_updated', handleQueueUpdate);
    };
  }, []);

  const handleToggleOfflineSimulation = async () => {
    triggerHaptic('medium');
    if (!isSimulatingOffline) {
      setIsSimulatingOffline(true);
      // Durably queue 3 realistic rural OPD consultations into IndexedDB
      const sampleRuralEncounters = [
        {
          id: `ENC_RURAL_${Date.now()}_1`,
          token: 'OPD-101',
          patientName: 'Narayana Rao',
          age: 68,
          gender: 'Male',
          chiefComplaint: 'గుండెల్లో మంట, దడ (Chest tightness & palpitations)',
          diagnosis: 'Sample presentation: palpitations/chest discomfort (clinician review required)',
          prescription: 'Sample medication text only; no dose or substitution recommendation',
          timestamp: Date.now()
        },
        {
          id: `ENC_RURAL_${Date.now()}_2`,
          token: 'OPD-102',
          patientName: 'Lakshmi Devi',
          age: 54,
          gender: 'Female',
          chiefComplaint: 'కాళ్ల వాపు, నిద్రలేమి (T2DM Review, peripheral tingling)',
          diagnosis: 'Sample presentation: diabetes review with tingling (clinician review required)',
          prescription: 'Sample medication text only; no dose or substitution recommendation',
          timestamp: Date.now() + 1000
        },
        {
          id: `ENC_RURAL_${Date.now()}_3`,
          token: 'OPD-103',
          patientName: 'Venkat Ramana',
          age: 47,
          gender: 'Male',
          chiefComplaint: 'దగ్గు, ఆయాసం (Severe nocturnal wheezing)',
          diagnosis: 'Sample presentation: nocturnal wheeze (clinician review required)',
          prescription: 'Sample medication text only; no dose recommendation',
          timestamp: Date.now() + 2000
        }
      ];

      for (const enc of sampleRuralEncounters) {
        await clinicalOfflineStorage.saveEncounter(enc);
      }
      const count = await clinicalOfflineStorage.getPendingCount();
      setPendingOfflineCount(count);
      setFhirToast('Rural Zero-Network Simulation Active. 3 Encounters saved locally to IndexedDB (ayuswar_clinical_offline_db).');
      setTimeout(() => setFhirToast(null), 4500);
    } else {
      await handleTriggerAbdmSync();
    }
  };

  const handleTriggerAbdmSync = async () => {
    if (pendingOfflineCount === 0) {
      setFhirToast('No queued local records to validate.');
      setTimeout(() => setFhirToast(null), 2500);
      return;
    }
    setIsSyncingOffline(true);
    triggerHaptic('heavy');
    try {
      const res = await clinicalOfflineStorage.syncAll();
      const count = Number.isFinite(res?.syncedCount) ? res.syncedCount : pendingOfflineCount;
      const validationId = 'LOCAL-CHECK-' + Math.random().toString(16).substring(2, 8).toUpperCase();
      setLastSyncAuditHash(validationId);
      setIsSimulatingOffline(false);
      setPendingOfflineCount(0);
 setFhirToast(`✓ Local queue validation: ${count} queued encounter(s) checked against the local FHIR-shaped schema. No live gateway used. Local validation ID: #${validationId}`);
      setTimeout(() => setFhirToast(null), 5500);
    } catch (e) {
      console.error('[DoctorPortal] Offline sync failed:', e);
      setFhirToast('Offline sync encounter error. Retrying background sync queue.');
      setTimeout(() => setFhirToast(null), 4000);
    } finally {
      setIsSyncingOffline(false);
    }
  };

  const [fhirToast, setFhirToast] = useState(null);
  const [allAppointmentsList, setAllAppointmentsList] = useState(() => opdQueueService.getQueue());
  const [dashboardAppointments, setDashboardAppointments] = useState(() => opdQueueService.getQueue());

  // Real-Time Queue Synchronization with Patient Portal & OPD Master
  useEffect(() => {
    const unsub = opdQueueService.subscribe((updated) => {
      setAllAppointmentsList(updated);
      setDashboardAppointments(updated);
    });
    return () => unsub();
  }, []);

  const { isVoiceNavActive, toggleVoiceNav, lastCommandHeard, commandFeedbackToast } = useDoctorVoiceNavigation({
    onNavigateTab: (tab) => {
      triggerHaptic('light');
      setActiveTab(tab);
    },
    onSelectNextPatient: () => {
      triggerHaptic('medium');
      const upcoming = allAppointmentsList.find(a => a.status === 'Upcoming' || a.offsetDays === 0);
      if (upcoming) {
        setFhirToast(`Advancing OPD Queue: Selected Token ${upcoming.token} (${upcoming.patientName || upcoming.name})`);
        setTimeout(() => setFhirToast(null), 3500);
      }
    }
  });

  const [dashboardPillView, setDashboardPillView] = useState('overview'); // 'overview' | 'queue' | 'analytics'
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState('all'); // 'all' | 'Upcoming' | 'In Progress' | 'Completed'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isDoctorProfileMenuOpen, setIsDoctorProfileMenuOpen] = useState(false);
  const doctorProfileMenuRef = useRef(null);
  useEffect(() => {
    if (!isDoctorProfileMenuOpen) return;
    const onDocDown = (e) => {
      if (doctorProfileMenuRef.current && !doctorProfileMenuRef.current.contains(e.target)) setIsDoctorProfileMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDocDown);
    return () => document.removeEventListener('pointerdown', onDocDown);
  }, [isDoctorProfileMenuOpen]);
  useEffect(() => { setIsDoctorProfileMenuOpen(false); }, [activeTab]);
  const [analyticsRange, setAnalyticsRange] = useState('weekly');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCategory, setAiCategory] = useState('guidelines'); // 'guidelines' | 'ddi' | 'ddx' | 'vernacular'
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedPatientModal, setSelectedPatientModal] = useState(null);
  const [whatsAppModalPatient, setWhatsAppModalPatient] = useState(null);
  const [activeScribeSessionPatient, setActiveScribeSessionPatient] = useState(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  // Linear-style Command Palette / Spotlight search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [patientTriageFilter, setPatientTriageFilter] = useState('all');
  const [opdViewMode, setOpdViewMode] = useState('queue'); // 'queue' | 'schedule' | 'directory'
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
  const [newApptForm, setNewApptForm] = useState({
    patientId: 'DEMO-P001',
    patientName: 'Lakshmi Amma (fictional)',
    dateOffset: 0,
    time: '11:30 AM',
    type: 'In-Person OPD',
    complaint: 'Seasonal dry cough and breathlessness on exertion',
    triage: 'Green'
  });

  const handleCreateAppointment = (e) => {
    e.preventDefault();
    const tokenNum = 100 + allAppointmentsList.length + 1;
    const newToken = `OPD-${tokenNum}`;
    
    const selectedPat = DEMO_PATIENTS.find(p => p.id === newApptForm.patientId) || {
      id: `DEMO-P${tokenNum}`,
      name: newApptForm.patientName || 'Walk-in Patient',
      age: 45,
      gender: 'M',
      genderLabel: 'Male',
      language: 'Telugu (తెలుగు)',
      phone: '+91-00000-00001'
    };

    const newApptItem = {
      id: `DEMO-APPT-${Date.now()}`,
      patientId: selectedPat.id,
      patientName: selectedPat.name,
      token: newToken,
      offsetDays: Number(newApptForm.dateOffset),
      time: newApptForm.time,
      isTeleconsult: newApptForm.type.includes('Teleconsult'),
      complaint: newApptForm.complaint,
      status: 'Upcoming',
      language: selectedPat.language?.split(' ')[0] || 'Telugu'
    };

    const newDashItem = {
      id: Date.now(),
      patientName: selectedPat.name,
      name: selectedPat.name,
      vernacular: selectedPat.name,
      token: newToken,
      age: selectedPat.age || 45,
      gender: selectedPat.genderLabel || 'Male',
      time: newApptForm.time,
      type: `${newApptForm.type} (${newApptForm.complaint.slice(0, 24)}...)`,
      status: 'Upcoming',
      statusColor: '#D97706',
      statusBg: 'rgba(217, 119, 6, 0.1)',
      encounterIndex: 0
    };

    const booked = opdQueueService.bookAppointment({
      patientId: selectedPat.id,
      patientName: selectedPat.name,
      phone: selectedPat.phone,
      age: selectedPat.age,
      gender: selectedPat.genderLabel || selectedPat.gender,
      language: selectedPat.language,
      doctorName: doctorProfile?.doctorName || 'Dr. Demo Clinician (synthetic)',
      specialty: doctorProfile?.specialty || 'General Medicine',
      date: Number(newApptForm.dateOffset) === 0 ? 'Today' : 'Tomorrow',
      time: newApptForm.time,
      mode: newApptForm.type,
      reason: newApptForm.complaint
    });

    setFhirToast(`Appointment Scheduled: Token ${booked.token} generated for ${booked.patientName} at ${booked.time}. Added to Live OPD Queue.`);
    setTimeout(() => setFhirToast(null), 4500);
    setIsNewAppointmentModalOpen(false);
  };
  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [reportCategoryFilter, setReportCategoryFilter] = useState('all');
  const [selectedReportPatient, setSelectedReportPatient] = useState(null);
  const [reportsViewMode, setReportsViewMode] = useState('by_patient'); // 'by_patient' | 'all'
  const [dicomInvert, setDicomInvert] = useState(false);
  // dicomContrast omitted
  const [plannedToast, setPlannedToast] = useState(null);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);
  // State-driven header badge: mirrors the notification drawer's persisted store
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  useEffect(() => {
    const readUnread = () => {
      try {
        const list = JSON.parse(localStorage.getItem('ayuswar_doctor_notifications_v1') || '[]');
        setUnreadNotifCount(Array.isArray(list) ? list.filter(n => !n.read).length : 0);
      } catch { setUnreadNotifCount(0); }
    };
    readUnread();
    window.addEventListener('focus', readUnread);
    return () => window.removeEventListener('focus', readUnread);
  }, []);
  useEffect(() => {
    if (!isNotificationsDrawerOpen) {
      try {
        const list = JSON.parse(localStorage.getItem('ayuswar_doctor_notifications_v1') || '[]');
        setUnreadNotifCount(Array.isArray(list) ? list.filter(n => !n.read).length : 0);
      } catch { setUnreadNotifCount(0); }
    }
  }, [isNotificationsDrawerOpen]);

  const showPlannedNotice = (featureName = 'This feature') => {
    setPlannedToast(`${featureName}: PLANNED in upcoming release.`);
    setTimeout(() => setPlannedToast(null), 3500);
  };

  // Canonical Shared WhatsApp Audio-Rx Modal Handler
  const handleOpenAudioRxModal = (p) => {
    const raw = p || patientsList[0] || DEMO_PATIENTS[0];
    const rawPhone = raw.phone || '+91-9XXX-XXX-001';
    setWhatsAppModalPatient({
      id: raw.id || 'DEMO-P001',
      name: raw.name || raw.patient || 'Lakshmi Amma (fictional)',
      vernacularName: raw.vernacular || raw.vernacularName || 'లక్ష్మి అమ్మ',
      phone: rawPhone,
      cleanPhone: (rawPhone || '919000000001').replace(/[^0-9]/g, ''),
      age: raw.age || 58,
      gender: raw.genderLabel || (raw.gender === 'F' ? 'Female' : 'Male'),
      abhaId: raw.abhaId || 'DEMO-91-4521-8932-1049',
      language: raw.language || (raw.lang === 'hi' ? 'Hindi' : 'Telugu'),
      langCode: (raw.lang === 'hi' || raw.langCode?.includes('hi')) ? 'hi-IN' : 'te-IN'
    });
  };


  // AyuVision Blister Pack demo-comparison lens & NFI formulary samples
  const [ocrSampleIdx, setOcrSampleIdx] = useState(0);
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrScanComplete, setOcrScanComplete] = useState(false);
  const [printableRxData, setPrintableRxData] = useState(null);
  const [ocrMode, setOcrMode] = useState('samples'); // 'samples' | 'camera' | 'upload'
  const [isOcrCameraActive, setIsOcrCameraActive] = useState(false);
  const [ocrCameraError, setOcrCameraError] = useState(null);
  const [capturedOcrImage, setCapturedOcrImage] = useState(null);
  const [ocrSearchQuery, setOcrSearchQuery] = useState('');
  const [customOcrResult, setCustomOcrResult] = useState(null);
  const ocrVideoRef = useRef(null);
  const ocrStreamRef = useRef(null);
  const ocrFileInputRef = useRef(null);

  // Physician Settings State Suite
  const [docScribeEngine, setDocScribeEngine] = useState('browser_speech');
  const [docNoiseCancellation, setDocNoiseCancellation] = useState('crowded_opd');
  const [docAutoCoding, setDocAutoCoding] = useState(true);
  const [docDdiSentinel, setDocDdiSentinel] = useState(true);
  const [docGenericPref, setDocGenericPref] = useState(true);
  const [docDigitalSign, setDocDigitalSign] = useState(true);
  const [docAbdmAutoSync, setDocAbdmAutoSync] = useState(true);
  const [docWhatsAppPush, setDocWhatsAppPush] = useState(true);
  const [docSettingsSaved, setDocSettingsSaved] = useState(false);

  const doctorPreferenceScope = `doctor:${doctorProfile?.id || doctorProfile?.hprId || 'guest'}`;
  useEffect(() => {
    const saved = loadLocalPreferences(doctorPreferenceScope);
    if (!saved) return;
    if (saved.docScribeEngine) setDocScribeEngine(saved.docScribeEngine);
    if (saved.docNoiseCancellation) setDocNoiseCancellation(saved.docNoiseCancellation);
    if (typeof saved.docAutoCoding === 'boolean') setDocAutoCoding(saved.docAutoCoding);
    if (typeof saved.docDdiSentinel === 'boolean') setDocDdiSentinel(saved.docDdiSentinel);
    if (typeof saved.docGenericPref === 'boolean') setDocGenericPref(saved.docGenericPref);
  }, [doctorPreferenceScope]);

  const saveDoctorPreferences = () => {
    saveLocalPreferences(doctorPreferenceScope, {
      docScribeEngine,
      docNoiseCancellation,
      docAutoCoding,
      docDdiSentinel,
      docGenericPref
    });
    setDocSettingsSaved(true);
    setTimeout(() => setDocSettingsSaved(false), 4000);
  };

  const doctorName = doctorProfile?.doctorName || 'Dr. Demo Clinician (synthetic)';
  const doctorSpecialty = doctorProfile?.specialty || 'General Medicine (demo)';

  // Determine clinical domain of logged-in doctor
  const isRespiratoryDoctor = 
    doctorSpecialty.toLowerCase().includes('pulmon') || 
    doctorSpecialty.toLowerCase().includes('resp') ||
    doctorSpecialty.toLowerCase().includes('chest');

  const isCardioDoctor = 
    doctorSpecialty.toLowerCase().includes('cardio') || 
    doctorSpecialty.toLowerCase().includes('diabet') ||
    doctorSpecialty.toLowerCase().includes('heart');

  // Shared Fictional OPD Registry from DEMO_PATIENTS
  const patientsList = DEMO_PATIENTS.map((dp, idx) => {
    // Triage mapping for visual cues
    const triageLevel = idx === 1 ? 'Critical' : (idx === 0 || idx === 3 ? 'Urgent' : (idx === 2 || idx === 5 ? 'Moderate' : 'Stable'));
    const triageColor = triageLevel === 'Critical' ? '#EF4444' : (triageLevel === 'Urgent' ? '#D97706' : (triageLevel === 'Moderate' ? '#3B82F6' : '#10B981'));
    const latestVitals = dp.vitalsHistory && dp.vitalsHistory.length > 0 ? dp.vitalsHistory[0] : { bp: '120/80 mmHg', pulse: '76 bpm', spo2: '98%' };
    const latestComplaint = dp.encounters && dp.encounters.length > 0 ? dp.encounters[0].complaint : dp.primaryCondition;
    
    // Domain categorization based on primary conditions
    const condStr = (dp.conditions || []).join(' ').toLowerCase();
    const domain = condStr.includes('asthma') || condStr.includes('copd') || condStr.includes('rhinitis') 
      ? 'respiratory' 
      : (condStr.includes('diabet') || condStr.includes('hypertens') ? 'cardiometabolic' : 'general');

    return {
      id: dp.id,
      token: `OPD-${101 + idx}`,
      name: dp.name,
      vernacular: dp.name.split(' ')[0],
      age: dp.age,
      gender: dp.genderLabel || (dp.gender === 'F' ? 'Female' : 'Male'),
      language: dp.language,
      langCode: dp.langCode,
      phone: dp.phone,
      village: dp.village,
      abhaId: dp.abhaId,
      abhaNumber: dp.abhaNumber || dp.abhaId,
      abhaAddress: 'demo-patient@example.invalid',
      hprId: dp.hprId || 'DEMO-CLINICIAN-2026',
      doctorName: dp.doctorName || 'Dr. Demo Clinician (synthetic)',
      hfrId: dp.hfrId || 'DEMO-FACILITY-2026',
      facilityName: dp.facilityName || 'Synthetic Demo Facility',
      icd10: dp.icd10,
      icd10Desc: dp.icd10Desc,
      snomedCt: dp.snomedCt,
      snomedDesc: dp.snomedDesc,
      chiefComplaint: latestComplaint,
      conditions: dp.conditions || [],
      primaryCondition: dp.primaryCondition,
      triage: triageLevel,
      triageColor: triageColor,
      vitals: {
        bp: latestVitals.bp?.replace(' mmHg', '') || '120/80',
        hr: latestVitals.pulse || '76 bpm',
        spo2: latestVitals.spo2 || '98%',
        weight: latestVitals.weight || '64 kg'
      },
      history: `${dp.conditions?.join(', ')}. Living in ${dp.village}.`,
      allergies: (dp.allergies || []).join(', ') || 'No known allergies',
      encounterIndex: idx % 3,
      domain: domain,
      lastVisitOffset: dp.lastVisitOffset,
      nextVisitOffset: dp.nextVisitOffset,
      encounters: dp.encounters || [],
      prescriptions: dp.prescriptions || [],
      reports: dp.reports || [],
      vitalsHistory: dp.vitalsHistory || []
    };
  });

  const formattedRegistered = (registeredPatients || []).map((rp, idx) => ({
    id: `reg_${idx}`,
    token: `OPD-${201 + idx}`,
    name: rp.patientName,
    vernacular: rp.patientName,
    age: rp.age || 40,
    gender: rp.gender || 'Female',
    language: rp.language || 'Telugu',
    phone: rp.phone || '+91-9XXX-XXX-099',
    village: rp.village || 'Primary Health Centre',
    abhaId: rp.abhaId || `DEMO-${2000 + idx}-8842-1049`,
    abhaNumber: rp.abhaNumber || rp.abhaId || `DEMO-${2000 + idx}-8842-1049`,
    abhaAddress: `demo-patient${idx + 1}@example.invalid`,
    hprId: 'DEMO-CLINICIAN-2026',
    doctorName: 'Dr. Demo Clinician (synthetic)',
    hfrId: 'DEMO-FACILITY-2026',
    facilityName: 'Synthetic Demo Facility',
    icd10: 'Z00.00',
    icd10Desc: 'General adult medical examination',
    snomedCt: '308335008',
    snomedDesc: 'Patient encounter (procedure)',
    chiefComplaint: `${rp.condition || 'Consultation'} (${rp.relation || 'Registered Citizen'})`,
    conditions: [rp.condition || 'General OPD Consultation'],
    primaryCondition: rp.condition || 'Consultation',
    triage: 'Moderate',
    triageColor: '#3B82F6',
    vitals: rp.vitals || { bp: '120/80', hr: '76 bpm', spo2: '98%', weight: '65 kg' },
    history: `Registered via Family Health Locker. Condition: ${rp.condition}`,
    allergies: 'None documented',
    encounterIndex: 0,
    lastVisitOffset: -2,
    nextVisitOffset: 5,
    encounters: [],
    prescriptions: [],
    reports: [],
    vitalsHistory: [],
    domain: rp.domain || (rp.condition?.toLowerCase().includes('diabet') || rp.condition?.toLowerCase().includes('hypertens') ? 'cardiometabolic' : (rp.condition?.toLowerCase().includes('asthma') ? 'respiratory' : 'general'))
  }));

  const allPatients = [...formattedRegistered, ...patientsList];

  const domainPatients = allPatients.filter(p => {
    if (isRespiratoryDoctor) return p.domain === 'respiratory';
    if (isCardioDoctor) return p.domain === 'cardiometabolic';
    return true; // General sees all
  });

  const appointments = dashboardAppointments;

  const recentReports = DIAGNOSTIC_REPORTS_DATABASE;

  // Group diagnostics by individual patient profile
  const patientsWithReports = useMemo(() => {
    const map = new Map();

    // 1. Index known patients from allPatients
    allPatients.forEach(p => {
      const key = (p.name || '').trim().toLowerCase();
      map.set(key, {
        id: p.id,
        name: p.name,
        vernacular: p.vernacular || p.name,
        age: p.age,
        gender: p.gender || 'Unknown',
        genderLabel: p.genderLabel || p.gender || 'Unknown',
        abhaId: p.abhaId,
        phone: p.phone,
        village: p.village,
        conditions: p.conditions || [],
        primaryCondition: p.primaryCondition || (p.conditions && p.conditions[0]) || 'General Clinical Care',
        triage: p.triage || 'Stable',
        triageColor: p.triageColor || '#10B981',
        vitals: p.vitals || { bp: '120/80', hr: '76 bpm', spo2: '98%' },
        reports: []
      });
    });

    // 2. Populate and connect from DIAGNOSTIC_REPORTS_DATABASE
    DIAGNOSTIC_REPORTS_DATABASE.forEach(rep => {
      const pName = (rep.patient || '').trim();
      const key = pName.toLowerCase();

      let entry = null;
      for (const [k, v] of map.entries()) {
        if (k === key || k.includes(key) || key.includes(k)) {
          entry = v;
          break;
        }
      }

      if (!entry) {
        entry = {
          id: `rep_patient_${rep.id}`,
          name: rep.patient,
          vernacular: rep.patient,
          age: rep.age || 45,
          gender: rep.gender || 'Male',
          genderLabel: rep.gender || 'Male',
          abhaId: rep.abhaId || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          phone: '+91 00000 00002',
          village: 'Kurnool PHC Catchment',
          conditions: [rep.category || 'Pathology Examination'],
          primaryCondition: rep.category || 'Clinical Examination',
          triage: 'Stable',
          triageColor: '#10B981',
          vitals: { bp: '120/80', hr: '74 bpm', spo2: '98%' },
          reports: []
        };
        map.set(key, entry);
      }

      entry.reports.push(rep);
    });

    // Return only patients with at least 1 diagnostic report, sorted by report count
    return Array.from(map.values())
      .filter(p => p.reports.length > 0)
      .sort((a, b) => b.reports.length - a.reports.length);
  }, [allPatients]);

  const filteredPatientsWithReports = useMemo(() => {
    let list = patientsWithReports;

    if (reportCategoryFilter !== 'all') {
      list = list.filter(p => p.reports.some(r => {
        if (reportCategoryFilter === 'Radiology') return r.category === 'Radiology' || r.modality?.toLowerCase().includes('radiograph') || r.modality?.toLowerCase().includes('ct') || r.modality?.toLowerCase().includes('mri') || r.modality?.toLowerCase().includes('sonography');
        if (reportCategoryFilter === 'Cardiology') return r.category === 'Cardiology' || r.title?.toLowerCase().includes('ecg') || r.title?.toLowerCase().includes('echo');
        if (reportCategoryFilter === 'Hematology') return r.category === 'Hematology' || r.title?.toLowerCase().includes('blood') || r.title?.toLowerCase().includes('cbc');
        if (reportCategoryFilter === 'Biochemistry') return r.category === 'Biochemistry' || r.title?.toLowerCase().includes('hba1c') || r.title?.toLowerCase().includes('lipid') || r.title?.toLowerCase().includes('renal') || r.title?.toLowerCase().includes('liver');
        if (reportCategoryFilter === 'Microbiology') return r.category === 'Microbiology' || r.category === 'Infectious' || r.title?.toLowerCase().includes('dengue') || r.title?.toLowerCase().includes('widal') || r.title?.toLowerCase().includes('genexpert');
        if (reportCategoryFilter === 'Pulmonology') return r.category === 'Pulmonology' || r.title?.toLowerCase().includes('spirometry') || r.title?.toLowerCase().includes('abg');
        return true;
      }));
    }

    if (reportSearchTerm.trim()) {
      const q = reportSearchTerm.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.vernacular?.toLowerCase().includes(q) ||
        p.abhaId?.toLowerCase().includes(q) ||
        p.primaryCondition?.toLowerCase().includes(q) ||
        p.reports.some(r => 
          r.title.toLowerCase().includes(q) || 
          r.modality?.toLowerCase().includes(q) || 
          (r.loincCode && r.loincCode.toLowerCase().includes(q)) ||
          r.findings?.toLowerCase().includes(q) ||
          r.impression?.toLowerCase().includes(q)
        )
      );
    }

    return list;
  }, [patientsWithReports, reportCategoryFilter, reportSearchTerm]);

  // If a patient is selected, their specific filtered reports
  const selectedPatientReports = useMemo(() => {
    if (!selectedReportPatient) return [];
    let list = selectedReportPatient.reports;

    if (reportCategoryFilter !== 'all') {
      list = list.filter(r => {
        if (reportCategoryFilter === 'Radiology') return r.category === 'Radiology' || r.modality?.toLowerCase().includes('radiograph') || r.modality?.toLowerCase().includes('ct') || r.modality?.toLowerCase().includes('mri') || r.modality?.toLowerCase().includes('sonography');
        if (reportCategoryFilter === 'Cardiology') return r.category === 'Cardiology' || r.title?.toLowerCase().includes('ecg') || r.title?.toLowerCase().includes('echo');
        if (reportCategoryFilter === 'Hematology') return r.category === 'Hematology' || r.title?.toLowerCase().includes('blood') || r.title?.toLowerCase().includes('cbc');
        if (reportCategoryFilter === 'Biochemistry') return r.category === 'Biochemistry' || r.title?.toLowerCase().includes('hba1c') || r.title?.toLowerCase().includes('lipid') || r.title?.toLowerCase().includes('renal') || r.title?.toLowerCase().includes('liver');
        if (reportCategoryFilter === 'Microbiology') return r.category === 'Microbiology' || r.category === 'Infectious' || r.title?.toLowerCase().includes('dengue') || r.title?.toLowerCase().includes('widal') || r.title?.toLowerCase().includes('genexpert');
        if (reportCategoryFilter === 'Pulmonology') return r.category === 'Pulmonology' || r.title?.toLowerCase().includes('spirometry') || r.title?.toLowerCase().includes('abg');
        return true;
      });
    }

    if (reportSearchTerm.trim()) {
      const q = reportSearchTerm.toLowerCase().trim();
      list = list.filter(r => 
        r.title.toLowerCase().includes(q) || 
        r.modality?.toLowerCase().includes(q) || 
        (r.loincCode && r.loincCode.toLowerCase().includes(q)) ||
        r.findings?.toLowerCase().includes(q) ||
        r.impression?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [selectedReportPatient, reportCategoryFilter, reportSearchTerm]);

  const [aiResponses, setAiResponses] = useState([
    {
      q: 'What are the latest treatment guidelines for mild asthma in adults?',
      a: 'Bundled sample reference only, not current clinical guidance. A qualified clinician must verify current guidelines, patient history, contraindications and dosing before any treatment decision.'
    }
  ]);

  const handleAskAi = async (e) => {
    e?.preventDefault();
    if (!aiPrompt.trim()) return;

    const newQuery = aiPrompt.trim();
    setAiPrompt('');

    // Live queries never route to bundled sample answers: no symptom-to-canned-answer
    // mapping. Bundled samples live only in the explicitly user-selected Sample Q&A
    // library in the floating assistant.

    // Pre-insert with loading indicator
    setAiResponses(prev => [{ q: newQuery, a: 'Checking bundled sample references; clinician review required...' }, ...prev]);

    try {
      const answer = await askAyuSwarBrain(newQuery, 'doctor');
      setAiResponses(prev => {
        const updated = [...prev];
        updated[0] = { q: newQuery, a: answer };
        return updated;
      });
    } catch {
      setAiResponses(prev => {
        const updated = [...prev];
        updated[0] = { q: newQuery, a: `Processed query: "${newQuery}" against bundled sample references only. This is not verified clinical guidance.` };
        return updated;
      });
    }
  };

  const filteredPatients = domainPatients.filter(p => {
    const term = patientSearchTerm.trim().toLowerCase();
    const matchesSearch = !term || 
                          p.name.toLowerCase().includes(term) ||
                          String(p.id).toLowerCase().includes(term) ||
                          p.token.toLowerCase().includes(term) ||
                          p.chiefComplaint.toLowerCase().includes(term) ||
                          (p.conditions && p.conditions.some(c => c.toLowerCase().includes(term)));
    
    let matchesChip = true;
    if (patientTriageFilter === 'this_week') {
      matchesChip = typeof p.lastVisitOffset === 'number' && Math.abs(p.lastVisitOffset) <= 7;
    } else if (patientTriageFilter === 'has_upcoming') {
      matchesChip = typeof p.nextVisitOffset === 'number' && p.nextVisitOffset >= 0 && p.nextVisitOffset <= 10;
    } else if (patientTriageFilter === 'critical') {
      matchesChip = p.triage.toLowerCase() === 'critical';
    } else if (patientTriageFilter === 'urgent') {
      matchesChip = p.triage.toLowerCase() === 'urgent' || p.triage.toLowerCase() === 'critical';
    } else if (patientTriageFilter !== 'all') {
      matchesChip = p.triage.toLowerCase() === patientTriageFilter.toLowerCase();
    }
    
    return matchesSearch && matchesChip;
  });

  const filteredReports = recentReports.filter(rep => {
    const matchesCategory = 
      reportCategoryFilter === 'all' || 
      (reportCategoryFilter === 'Radiology' && (rep.category === 'Radiology' || rep.modality?.toLowerCase().includes('radiograph') || rep.modality?.toLowerCase().includes('ct') || rep.modality?.toLowerCase().includes('mri') || rep.modality?.toLowerCase().includes('sonography'))) ||
      (reportCategoryFilter === 'Cardiology' && (rep.category === 'Cardiology' || rep.title?.toLowerCase().includes('ecg') || rep.title?.toLowerCase().includes('echo') || rep.title?.toLowerCase().includes('troponin') || rep.title?.toLowerCase().includes('bnp'))) ||
      (reportCategoryFilter === 'Hematology' && (rep.category === 'Hematology' || rep.title?.toLowerCase().includes('blood') || rep.title?.toLowerCase().includes('cbc') || rep.title?.toLowerCase().includes('ferritin') || rep.title?.toLowerCase().includes('coagulation'))) ||
      (reportCategoryFilter === 'Biochemistry' && (rep.category === 'Biochemistry' || rep.title?.toLowerCase().includes('hba1c') || rep.title?.toLowerCase().includes('lipid') || rep.title?.toLowerCase().includes('renal') || rep.title?.toLowerCase().includes('liver') || rep.title?.toLowerCase().includes('thyroid') || rep.title?.toLowerCase().includes('vitamin') || rep.title?.toLowerCase().includes('calcium') || rep.title?.toLowerCase().includes('crp') || rep.title?.toLowerCase().includes('uric'))) ||
      (reportCategoryFilter === 'Microbiology' && (rep.category === 'Microbiology' || rep.category === 'Infectious' || rep.title?.toLowerCase().includes('dengue') || rep.title?.toLowerCase().includes('widal') || rep.title?.toLowerCase().includes('genexpert') || rep.title?.toLowerCase().includes('urine') || rep.title?.toLowerCase().includes('stool') || rep.title?.toLowerCase().includes('culture'))) ||
      (reportCategoryFilter === 'Pulmonology' && (rep.category === 'Pulmonology' || rep.title?.toLowerCase().includes('spirometry') || rep.title?.toLowerCase().includes('abg') || rep.title?.toLowerCase().includes('fev1')));

    const q = reportSearchTerm.toLowerCase().trim();
    const matchesSearch = 
      !q || 
      rep.title?.toLowerCase().includes(q) ||
      rep.patient?.toLowerCase().includes(q) ||
      rep.modality?.toLowerCase().includes(q) ||
      (rep.loincCode && rep.loincCode.toLowerCase().includes(q)) ||
      rep.findings?.toLowerCase().includes(q) ||
      rep.impression?.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const handleExportFhir = (rep) => {
    downloadFhirJson(rep);
    setFhirToast('Sample health-record JSON (demo, unvalidated)');
    setTimeout(() => setFhirToast(null), 4500);
  };

  const handlePrintLabSheet = (rep) => {
    if (!rep) return;
    const printWindow = window.open('', '_blank', 'width=860,height=980');
    if (!printWindow) {
      window.print();
      return;
    }

    const metricsHtml = (rep.metrics || []).map(m => {
      const isNorm = m.status === 'Normal';
      const isHigh = m.status === 'High';
      const badgeColor = isNorm ? '#15803d' : (isHigh ? '#b91c1c' : '#b45309');
      const badgeBg = isNorm ? '#dcfce7' : (isHigh ? '#fee2e2' : '#fef3c7');
      return `
        <tr style="border-bottom: 1px solid #8FA8AE;">
          <td style="padding: 9px 12px; font-family: monospace; font-size: 11px; color: #698892;">${escapeHtml(m.loinc || rep.loincCode || '-')}</td>
          <td style="padding: 9px 12px; font-weight: 600; color: #091E26;">${escapeHtml(m.name)}</td>
          <td style="padding: 9px 12px; font-weight: 700; color: ${badgeColor}; font-family: monospace;">${escapeHtml(m.result)}</td>
          <td style="padding: 9px 12px; color: #698892;">${escapeHtml(m.unit || '-')}</td>
          <td style="padding: 9px 12px; color: #486770; font-family: monospace;">${escapeHtml(m.normalRange || '-')}</td>
          <td style="padding: 9px 12px;">
            <span style="font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; background: ${badgeBg}; color: ${badgeColor}; text-transform: uppercase;">
              ${escapeHtml(m.status)}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AyuSwar AI — Sample Diagnostic Report — ${escapeHtml(rep.patient)} (${escapeHtml(rep.title)})</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #091E26; margin: 0; padding: 24px; font-size: 13px; line-height: 1.45; }
            .header-table { width: 100%; border-bottom: 2px solid #0f4c5c; padding-bottom: 12px; margin-bottom: 14px; }
            .badge-demo { background: #0f4c5c; color: #ffffff; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; }
            .demo-box { background: #f8fafc; border: 1px solid #8FA8AE; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12px; }
            .demo-item strong { display: block; font-size: 10.5px; color: #698892; text-transform: uppercase; margin-bottom: 2px; }
            table.results { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            table.results th { background: #0f4c5c; color: #ffffff; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            .section-title { font-size: 13px; font-weight: 800; color: #0f4c5c; text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 0 6px 0; border-left: 3px solid #0f4c5c; padding-left: 8px; }
            .findings-box { background: #f8fafc; border: 1px solid #8FA8AE; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; font-size: 12px; }
            .footer-strip { margin-top: 28px; padding-top: 12px; border-top: 1px solid #8FA8AE; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #698892; }
            .signature-box { text-align: right; }
            .demo-footer-band { background: #722F37; color: #ffffff; text-align: center; font-size: 10px; font-weight: 800; letter-spacing: 1px; padding: 7px 12px; margin-top: 20px; border-radius: 6px; text-transform: uppercase; }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; background: #e0f2fe; padding: 10px 14px; border-radius: 6px;">
            <span style="color: #0369a1; font-weight: 600;">AyuSwar AI — Sample Diagnostic Report Preview</span>
            <button onclick="window.print()" style="background: #0f4c5c; color: #ffffff; border: none; padding: 6px 16px; border-radius: 4px; font-weight: 700; cursor: pointer;">Print Report</button>
          </div>

          <table class="header-table">
            <tr>
              <td>
                <div style="font-size: 18px; font-weight: 900; color: #0f4c5c; letter-spacing: -0.3px;">AyuSwar AI &#183; Sample Diagnostic Report</div>
                <div style="font-size: 11px; color: #486770; margin-top: 2px;">Prototype demo output</div>
              </td>
              <td style="text-align: right;">
                <span class="badge-demo">PROTOTYPE DEMO</span>
              </td>
            </tr>
          </table>

          <div class="demo-box">
            <div class="demo-item"><strong>Patient Name</strong> ${escapeHtml(rep.patient)}</div>
            <div class="demo-item"><strong>Age / Gender</strong> ${escapeHtml(rep.age || '42')} Y / ${escapeHtml(rep.gender || 'Male')}</div>
            <div class="demo-item"><strong>ABHA Address</strong> ${escapeHtml(rep.abhaId || 'DEMO-8842-1940-2219')}</div>
            <div class="demo-item"><strong>Referred By</strong> Dr. Demo Referrer (synthetic)</div>
            <div class="demo-item"><strong>Sample / Accession ID</strong> ${escapeHtml(rep.specimenId || 'LAB-2026-X992')}</div>
            <div class="demo-item"><strong>Date of Collection</strong> ${escapeHtml(rep.date || '10 May 2026, 08:30 AM')}</div>
          </div>

          <div class="section-title">${escapeHtml(rep.title)} (LOINC: ${escapeHtml(rep.loincCode || '36572-6')})</div>
          ${(rep.metrics && rep.metrics.length > 0) ? `
            <table class="results">
              <thead>
                <tr>
                  <th style="width: 15%;">LOINC</th>
                  <th style="width: 35%;">Investigation / Parameter</th>
                  <th style="width: 15%;">Result</th>
                  <th style="width: 10%;">Unit</th>
                  <th style="width: 15%;">Biological Ref Range</th>
                  <th style="width: 10%;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${metricsHtml}
              </tbody>
            </table>
          ` : ''}

          <div class="section-title" style="margin-top: 16px;">Detailed Clinical Findings</div>
          <div class="findings-box">${escapeHtml(rep.findings || 'No acute focal abnormalities visualised.')}</div>

          <div class="section-title">Definitive Impression & Conclusion</div>
          <div class="findings-box" style="background: #f0fdf4; border-color: #bbf7d0; color: #166534; font-weight: 600;">
            ${escapeHtml(rep.impression || 'Study within clinically acceptable physiological thresholds.')}
          </div>

          <div class="footer-strip">
            <div>
              <div>Prototype demo report for evaluation purposes only.</div>
              <div style="margin-top: 2px;">This is synthetic data generated for clinical workflow prototyping.</div>
            </div>
            <div class="signature-box">
              <div style="border: 1px solid #8FA8AE; border-radius: 6px; padding: 8px 14px; background: #FAF8F5; font-size: 11px; color: #64748B; font-weight: 700;">
                Doctor review: pending (demo)
              </div>
            </div>
          </div>

          <div class="demo-footer-band">
            Prototype demo &#183; synthetic sample data &#183; not a medical document
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch (err) {
        console.warn('Print popup blocked or failed, falling back:', err);
      }
    }, 400);
  };


  const ocrSamples = [
    {
      id: 'ocr_01',
      title: 'Pan-D Capsule Strip',
      type: 'Blister Foil Pack',
            brandName: 'PAN-D Capsule SR',
      genericSalt: 'Pantoprazole (40mg) + Domperidone (30mg SR)',
      manufacturer: 'Alkem Laboratories Ltd.',
      batchNo: 'ALK-24B09',
      expDate: '11/2027',
      brandMrp: 198,
      janAushadhiGeneric: 'Pantoprazole 40mg + Domperidone 30mg SR',
      janAushadhiPrice: 28,
      savingsPercent: 86,
      indications: 'Gastroesophageal Reflux Disease (GERD), Hyperacidity, Eructation',
      contraindication: 'Caution in cardiac arrhythmia / prolonged QT interval',
      vernacularSummary: 'ఉదయం టిఫిన్ ముందు 1 గోళీ (కడుపులో మంట మరియు తేన్పుల కోసం)'
    },
    {
      id: 'ocr_02',
      title: 'Glycomet-GP 2 Tablet Strip',
      type: 'Blister Foil Pack',
            brandName: 'Glycomet-GP 2 Tablet',
      genericSalt: 'Glimepiride (2mg) + Metformin Hydrochloride (500mg SR)',
      manufacturer: 'USV Private Limited',
      batchNo: 'USV-7718',
      expDate: '09/2026',
      brandMrp: 245,
      janAushadhiGeneric: 'Glimepiride 2mg + Metformin 500mg SR',
      janAushadhiPrice: 35,
      savingsPercent: 85,
      indications: 'Type-2 Diabetes Mellitus glycemic control',
      contraindication: 'Check eGFR. Withhold if severe renal impairment (<30 mL/min)',
      vernacularSummary: 'రాత్రి భోజనం తర్వాత 1 గోళీ (షుగర్ నియంత్రణ కోసం)'
    },
    {
      id: 'ocr_03',
      title: 'Augmentin 625 Duo Strip',
      type: 'Alu-Alu Blister Strip',
            brandName: 'Augmentin 625 Duo Tablet',
      genericSalt: 'Amoxicillin (500mg) + Potassium Clavulanate (125mg)',
      manufacturer: 'GlaxoSmithKline Pharmaceuticals',
      batchNo: 'GSK-9921',
      expDate: '04/2026',
      brandMrp: 215,
      janAushadhiGeneric: 'Amoxycillin 500mg + Clavulanic Acid 125mg',
      janAushadhiPrice: 48,
      savingsPercent: 78,
      indications: 'Bacterial respiratory tract infections, sinusitis, acute bronchitis',
      contraindication: 'Strictly avoid in penicillin hypersensitivity / anaphylaxis',
      vernacularSummary: 'ఉదయం మరియు రాత్రి భోజనం తర్వాత 1 గోళీ (ఇన్ఫెక్షన్ తగ్గడానికి)'
    },
    {
      id: 'ocr_04',
      title: 'Telma 40 Tablet Strip',
      type: 'Alu-Alu Blister Pack',
            brandName: 'Telma 40 Tablet',
      genericSalt: 'Telmisartan 40mg IP',
      manufacturer: 'Glenmark Pharmaceuticals Ltd.',
      batchNo: 'GLN-4421B',
      expDate: '08/2027',
      brandMrp: 145,
      janAushadhiGeneric: 'Telmisartan Tablets IP 40mg',
      janAushadhiPrice: 12,
      savingsPercent: 92,
      indications: 'Essential Hypertension, Cardiovascular Risk Reduction',
      contraindication: 'Contraindicated in pregnancy (2nd and 3rd trimesters)',
      vernacularSummary: 'ఉదయం టిఫిన్ తర్వాత 1 గోళీ (రక్తపోటు/బీపీ అదుపులో ఉండటానికి)'
    },
    {
      id: 'ocr_05',
      title: 'Dolo 650 Tablet Strip',
      type: 'Blister Foil Pack',
            brandName: 'Dolo 650 Tablet',
      genericSalt: 'Paracetamol 650mg IP',
      manufacturer: 'Micro Labs Limited',
      batchNo: 'ML-98201',
      expDate: '12/2026',
      brandMrp: 34,
      janAushadhiGeneric: 'Paracetamol Tablets IP 650mg',
      janAushadhiPrice: 9.50,
      savingsPercent: 72,
      indications: 'Pyrexia (Fever), Mild to Moderate Myalgia, Headache',
      contraindication: 'Caution in severe hepatic impairment, do not exceed 4g/day',
      vernacularSummary: 'జ్వరం లేదా ఒంటి నొప్పులు ఉన్నప్పుడు భోజనం తర్వాత 1 గోళీ'
    },
    {
      id: 'ocr_06',
      title: 'Atorva 10 Tablet Strip',
      type: 'Blister Foil Pack',
            brandName: 'Atorva 10mg Tablet',
      genericSalt: 'Atorvastatin Calcium 10mg IP',
      manufacturer: 'Zydus Cadila Healthcare',
      batchNo: 'ZYD-1092',
      expDate: '03/2027',
      brandMrp: 120,
      janAushadhiGeneric: 'Atorvastatin Tablets IP 10mg',
      janAushadhiPrice: 15,
      savingsPercent: 87,
      indications: 'Hypercholesterolemia, Primary Dyslipidemia, Atherosclerosis prevention',
      contraindication: 'Active liver disease, unexplained persistent elevations of transaminases',
      vernacularSummary: 'రాత్రి పడుకునే ముందు 1 గోళీ (కొలెస్ట్రాల్ తగ్గించడానికి)'
    },
    {
      id: 'ocr_07',
      title: 'Montair-LC Tablet Strip',
      type: 'Alu-Alu Blister Pack',
            brandName: 'Montair-LC Tablet',
      genericSalt: 'Montelukast Sodium (10mg) + Levocetirizine (5mg)',
      manufacturer: 'Cipla Limited',
      batchNo: 'CIP-8812',
      expDate: '05/2027',
      brandMrp: 195,
      janAushadhiGeneric: 'Montelukast 10mg + Levocetirizine 5mg Tablets',
      janAushadhiPrice: 24,
      savingsPercent: 88,
      indications: 'Allergic Rhinitis, Seasonal Allergy, Bronchial Asthma prophylaxis',
      contraindication: 'Monitor for neuropsychiatric symptoms or extreme sedation',
      vernacularSummary: 'రాత్రి పడుకునే ముందు 1 గోళీ (దగ్గు, తుమ్ములు, రొంప నివారణకు)'
    },
    {
      id: 'ocr_08',
      title: 'Handwritten Doctor Rx Note',
      type: 'Doctor Handwriting (Cursive)',
            brandName: 'Rx: Inhaler Budecort 200 + Tab Levocet 5mg',
      genericSalt: 'Budesonide Rotacaps 200mcg (BID) + Levocetirizine 5mg (HS)',
      manufacturer: 'Bundled demo illustration (not OCR output)',
      batchNo: 'N/A (Clinical Order)',
      expDate: '30 Days Supply',
      brandMrp: null,
      janAushadhiGeneric: null,
      janAushadhiPrice: null,
      savingsPercent: null,
      noSinglePackGeneric: 'Two-product order: Budesonide 200mcg inhaler + Levocetirizine 5mg tablet are separate packs; no single-pack generic reference exists in the bundled sample formulary.',
      indications: 'Bronchial Asthma maintenance & Allergic Rhinitis',
      contraindication: 'Rinse mouth after steroid inhalation to prevent oral candidiasis',
      vernacularSummary: 'రోజుకు 2 సార్లు పీల్చండి, పీల్చిన తర్వాత నోరు పుక్కిలించండి'
    }
  ];

  const triggerOcrScan = (sampleIndex) => {
    setCustomOcrResult(null);
    setOcrSampleIdx(sampleIndex);
    setIsOcrScanning(true);
    setOcrScanComplete(false);
    setTimeout(() => {
      setIsOcrScanning(false);
      setOcrScanComplete(true);
    }, 1000);
  };

  const startOcrCamera = async () => {
    stopOcrCamera();
    setOcrCameraError(null);
    setOcrMode('camera');
    setCustomOcrResult(null);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device access not supported in this environment');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      ocrStreamRef.current = stream;
      if (ocrVideoRef.current) {
        ocrVideoRef.current.srcObject = stream;
        ocrVideoRef.current.play().catch(() => {});
      }
      setIsOcrCameraActive(true);
    } catch (err) {
      console.warn('Camera stream error:', err);
      setOcrCameraError('Camera access unavailable or blocked. You can upload an image or select from 8 clinical presets.');
    }
  };

  const stopOcrCamera = () => {
    if (ocrStreamRef.current) {
      ocrStreamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch (e) {}
      });
      ocrStreamRef.current = null;
    }
    setIsOcrCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!ocrVideoRef.current) return;
    try {
      const video = ocrVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedOcrImage(dataUrl);
      stopOcrCamera();
      setOcrMode('upload');
      processOcrImage(dataUrl, 'Live Camera Strip Capture');
    } catch (e) {
      console.error(e);
    }
  };

  const handleOcrFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopOcrCamera();
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setCapturedOcrImage(dataUrl);
      setOcrMode('upload');
      processOcrImage(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
  };

  const processOcrImage = (dataUrl, sourceName) => {
    setIsOcrScanning(true);
    setOcrScanComplete(false);
    setCustomOcrResult(null); // clear any stale result so it never shows under a new scan
    setTimeout(() => {
      const idx = (ocrSampleIdx + 1) % ocrSamples.length;
      const matched = ocrSamples[idx] || ocrSamples[0];
      // Demonstration only: the bundled sample is shown for comparison and is NOT
      // extracted from the uploaded image. Keep the sample's own identity visible.
      setCustomOcrResult({
        ...matched,
        title: `${matched.brandName} (bundled demo sample)`,
        type: 'Bundled sample comparison (demo)',
        demoComparison: true
      });
      setIsOcrScanning(false);
      setOcrScanComplete(true);
      setFhirToast(`AyuVision demo: text was not read from ${sourceName || 'the uploaded image'}. Showing a bundled sample for comparison.`);
      setTimeout(() => setFhirToast(null), 4000);
    }, 1200);
  };

  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 860 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth <= 860);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isCollapsedView = isSidebarCollapsed && !mobileDrawerOpen;

  return (
    <div className="doctor-portal-container" style={{ display: 'flex', height: '100vh', maxHeight: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Pristine Mint-Ivory Flow Vector Canvas handled globally by App shell */}

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="mobile-drawer-backdrop"
          onClick={() => setMobileDrawerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 95
          }}
        />
      )}

      {/* =========================================================================
          LEFT SIDEBAR (MATCHING SCREENSHOT 1 DOCTOR SIDEBAR)
          ========================================================================= */}
      <aside 
        className={`doctor-portal-aside ${mobileDrawerOpen ? 'mobile-open' : ''}`}
        style={{
          width: isCollapsedView ? '76px' : '270px',
          height: '100vh',
          maxHeight: '100vh',
          position: 'relative',
          top: 0,
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: isCollapsedView ? '20px 10px' : '20px 16px',
          flexShrink: 0,
          overflowY: 'hidden',
          overflowX: 'visible',
          zIndex: 96,
          transition: 'width 200ms cubic-bezier(0.2, 0, 0, 1), left 250ms ease-in-out'
        }}
      >
        {/* Mobile Close X Button */}
        <button
          className="portal-mobile-close-btn"
          onClick={() => setMobileDrawerOpen(false)}
          style={{
            display: 'none',
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#FAF8F5',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#698892',
            zIndex: 70
          }}
          aria-label="Close menu"
        >
          <X size={16} />
        </button>

        {/* Collapse / Expand Toggle Arrow Button (Enlarged, Clear & Never Clipped) */}
        <button
          className="portal-desktop-collapse-btn"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '-16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '2px solid #0F4C5C',
            boxShadow: '0 4px 12px rgba(15, 76, 92, 0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 60,
            color: '#0F4C5C',
            transition: 'all 0.18s ease'
          }}
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          aria-label={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'hidden', overflowX: 'hidden' }}>
          {/* Brand Logo */}
          <div 
            onClick={() => window.location.href = '/'}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              paddingLeft: isCollapsedView ? '2px' : '8px', 
              marginBottom: '28px', 
              cursor: 'pointer',
              justifyContent: isCollapsedView ? 'center' : 'flex-start'
            }}
            title="AyuSwar AI — Return to Website"
          >
            <div style={{
              width: isCollapsedView ? '44px' : '50px',
              height: isCollapsedView ? '44px' : '50px',
              borderRadius: '50%',
              border: '2px solid #D4AF37',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#FAF8F5',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.14)',
              flexShrink: 0,
              padding: '2px'
            }}>
              <img src="/assets/ayuswar_emblem_mark.webp" alt="AyuSwar AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            {!isCollapsedView && (
              <div style={{ fontFamily: 'var(--font-main)', fontSize: '20px', fontWeight: 800, color: '#091E26', whiteSpace: 'nowrap' }}>
                Ayu<span style={{ color: '#0F4C5C' }}>Swar</span> <span style={{ color: '#D4AF37' }}>AI</span>
              </div>
            )}
          </div>

          {/* Section Category Header (Matching User Design) */}
          {!isCollapsedView && (
            <div style={{
              fontSize: '11px',
              fontWeight: 750,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              color: '#698892',
              paddingLeft: '6px',
              marginBottom: '14px',
              fontFamily: 'var(--font-main)'
            }}>
              Clinical Workspace
            </div>
          )}

          {/* Navigation Items (Exact Lucide Icons & Sizing Matching User Design) */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            {[
              { id: 'dashboard', label: t('doctor.dashboard'), icon: LayoutGrid },
              { id: 'opd_queue', label: t('doctor.opdQueue'), icon: Users },
              { id: 'reports', label: t('doctor.reports'), icon: FlaskConical },
              { id: 'prescriptions', label: t('doctor.prescriptions'), icon: ClipboardPlus },
              { id: 'ai_assistant', label: t('doctor.aiAssistant'), icon: Sparkles },
              { id: 'clinical_library', label: t('doctor.library'), icon: BookOpenCheck },
              { id: 'settings', label: t('doctor.settings'), icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'opd_queue' && (activeTab === 'patients' || activeTab === 'appointments' || activeTab === 'opd_queue'));
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileDrawerOpen(false);
                  }}
                  title={item.label}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsedView ? 'center' : 'flex-start',
                    gap: isCollapsedView ? '0' : '14px',
                    padding: isCollapsedView ? '12px 0' : '12px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: isActive ? 'rgba(0, 0, 0, 0.06)' : 'transparent',
                    color: isActive ? '#0F4C5C' : '#1E293B',
                    fontFamily: 'var(--font-main)',
                    fontSize: '15px',
                    fontWeight: isActive ? 750 : 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 160ms ease',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    boxShadow: 'none',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
                      e.currentTarget.style.color = '#0F4C5C';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#1E293B';
                    }
                  }}
                >
                  {/* Distinctive Teal Active Left Accent Bar (Matching User Design) */}
                  {isActive && !isCollapsedView && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: '#0F4C5C',
                      borderRadius: '4px 0 0 4px'
                    }} />
                  )}
                  <Icon size={20} color={isActive ? '#0F4C5C' : '#1E293B'} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                  {!isCollapsedView && <span style={{ fontSize: '14px', fontWeight: isActive ? 750 : 600 }}>{item.label}</span>}
                </button>
              );
            })}
                      {isMobileScreen && (
              <button
                type="button"
                onClick={() => { triggerHaptic('light'); setMobileDrawerOpen(false); navigate('/'); }}
                title={t('doctor.nav.appHome')}
                style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', background: 'transparent', border: 'none', borderTop: '1px dashed #D0DFE2', borderRadius: '10px', cursor: 'pointer', color: '#0F4C5C', fontSize: '13.5px', fontWeight: 700, textAlign: 'left', width: '100%' }}
              >
                <Home size={20} strokeWidth={1.9} />
                <span>{t('doctor.nav.appHome')}</span>
              </button>
            )}
          </nav>

          {/* Authentic Sidebar Care Illustration Slot (Visual Handoff Specification) */}
          {!isCollapsedView && (
            <div 
              className="sidebar-care-illustration-container"
              style={{
                flex: 1,
                minHeight: '80px',
                maxHeight: '145px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '0 8px 6px 14px',
                overflow: 'hidden',
                pointerEvents: 'none',
                opacity: 0.95
              }}
              aria-hidden="true"
            >
              <img
                src="/assets/ayuswar-care-crop.jpg"
                alt=""
                style={{
                  width: '100%',
                  maxWidth: '195px',
                  height: 'auto',
                  maxHeight: '135px',
                  objectFit: 'contain',
                  objectPosition: 'left center',
                  filter: 'drop-shadow(0 2px 8px rgba(15, 76, 92, 0.08))',
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, rgba(0,0,0,0.85) 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,1) 15%, rgba(0,0,0,1) 85%, rgba(0,0,0,0.85) 100%)'
                }}
              />
            </div>
          )}
        </div>

        {/* Bottom Clinician Workspace & Preferences Card (Matching User Image) */}
        {!isCollapsedView ? (
          <div style={{ width: '100%' }}>
            <div style={{ borderTop: '1px solid #8FA8AE', margin: '14px 0 10px 0' }} />
            <div 
              onClick={() => {
                setActiveTab('settings');
                setMobileDrawerOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '12px',
                background: '#FAF8F5',
                border: '1px solid #8FA8AE',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Physician Credentials & Settings"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #0F4C5C',
                  flexShrink: 0
                }}>
                  <img 
                    src="/assets/dr_ananya_avatar.jpg" 
                    alt={doctorName} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
                <div style={{ minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#081C24', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Clinician Workspace
                  </div>
                  <div style={{ fontSize: '11px', color: '#698892', whiteSpace: 'nowrap' }}>
                    Account & preferences
                  </div>
                </div>
              </div>
              <ChevronRight size={16} color="#698892" />
            </div>

            {/* Prominent Clean Logout */}
            <button
              onClick={() => {
                setMobileDrawerOpen(false);
                if (onLogoutDoctor) onLogoutDoctor();
              }}
              className="portal-drawer-logout-btn"
              title="Logout from Doctor Session"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                background: 'rgba(254, 242, 242, 0.75)',
                color: '#DC2626',
                fontFamily: 'var(--font-main)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 160ms ease',
                marginTop: '8px'
              }}
            >
              <LogOut size={15} color="#DC2626" />
              <span>{t('auth.logout')}</span>
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', border: '1px solid rgba(0, 0, 0, 0.10)', borderRadius: '10px', background: '#FAF8F5', padding: '8px 10px' }}>
              <Globe size={15} color="#0F4C5C" />
              <select
                aria-label="Language"
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 700, color: '#0F4C5C', cursor: 'pointer', flex: 1, outline: 'none' }}
              >
                {SUPPORTED_LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.vernacular || lang.label}</option>)}
              </select>
            </label>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 0',
            borderTop: '1px solid #8FA8AE'
          }}>
            <div 
              onClick={() => setActiveTab('settings')}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid #0F4C5C',
                cursor: 'pointer'
              }}
              title="Clinician Workspace"
            >
              <img 
                src="/assets/dr_ananya_avatar.jpg" 
                alt={doctorName} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <button
              onClick={() => {
                if (onLogoutDoctor) onLogoutDoctor();
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#DC2626',
                cursor: 'pointer',
                padding: '4px'
              }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', border: '1px solid rgba(0, 0, 0, 0.10)', borderRadius: '10px', background: '#FAF8F5', padding: '8px 10px', width: '100%' }}>
              <Globe size={15} color="#0F4C5C" />
              <select
                aria-label="Language"
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 700, color: '#0F4C5C', cursor: 'pointer', flex: 1, outline: 'none' }}
              >
                {SUPPORTED_LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.vernacular || lang.label}</option>)}
              </select>
            </label>
          </div>
        )}
      </aside>

      {/* =========================================================================
          MAIN PHYSICIAN OPERATING CANVAS
          ========================================================================= */}
      <div className="doctor-portal-main-canvas" style={{ flex: 1, height: '100vh', maxHeight: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', width: '100%', maxWidth: '100vw', minWidth: 0, position: 'relative', zIndex: 1, background: 'transparent' }}>
        {/* Top Header */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          padding: '12px clamp(12px, 2vw, 28px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          gap: '12px'
        }}>
          {/* Left: Universal Search Bar with Mobile Menu Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            {/* Single-row mobile header extras (shell topbar hides on this route at <=768px) */}
                        <div className="portal-mobile-header-extra" style={{ alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                className="portal-mobile-menu-btn"
                onClick={() => setMobileDrawerOpen(true)}
                style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.10)', background: '#FAF8F5', color: '#0F4C5C', cursor: 'pointer', flexShrink: 0 }}
                title="Open Doctor Navigation Menu"
                aria-label="Open navigation menu"
              >
                <Menu size={18} />
              </button>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#081C24', whiteSpace: 'nowrap' }}>Doctor Portal</span>
            </div>
            

            <div className="doctor-search-box" style={{ position: 'relative', width: '380px', maxWidth: '100%' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder="Search patients, tokens, reports... (⌘K)"
              value={patientSearchTerm}
              onChange={e => setPatientSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 48px 9px 38px',
                borderRadius: '24px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)',
                background: '#FAF8F5',
                fontSize: '13px',
                color: '#091E26',
                outline: 'none',
                transition: 'border-color 0.2s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.2s cubic-bezier(0.25, 1, 0.5, 1)'
              }}
            />
            <kbd style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '10.5px',
              fontWeight: 700,
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '5px',
              padding: '1.5px 5px',
              color: '#64748D',
              fontFamily: 'monospace',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              pointerEvents: 'none'
            }}>
              ⌘K
            </kbd>
          </div>
        </div>

          {/* Controls: Clean, Streamlined Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            {/* Synchronized Interface Language Selector */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #8FA8AE',
              background: '#F8FAFC'
            }}>
              <Globe size={14} color="#0F4C5C" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                aria-label="Select Clinical Workstation Interface Language"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 750,
                  color: '#081C24',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.vernacular} ({l.label})
                  </option>
                ))}
              </select>
            </div>

            {/* Offline Health Mode Status Pill */}
            {(!isDeviceOnline || isSimulatingOffline) && (
              <div 
                style={{
                  background: '#064E3B',
                  color: '#6EE7B7',
                  border: '1px solid #059669',
                  borderRadius: '10px',
                  padding: '6px 11px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Zero-Network Rural Mode: Local VAD & IndexedDB Active"
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', animation: 'pulse 1s infinite' }} />
                <span>Offline OPD {pendingOfflineCount > 0 ? `(${pendingOfflineCount})` : ''}</span>
              </div>
            )}

            {/* Clinical Alert Notifications Bell */}
            <button 
              className="doctor-header-notifications-btn"
              onClick={() => setIsNotificationsDrawerOpen(true)}
              style={{ 
                position: 'relative', 
                cursor: 'pointer',
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: isNotificationsDrawerOpen ? '1.5px solid #0F4C5C' : '1px solid #8FA8AE',
                background: isNotificationsDrawerOpen ? 'rgba(0, 0, 0, 0.07)' : '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms ease',
                padding: 0
              }} 
              title="Clinical Alert Sentinel & Telemetry"
              aria-label="Open Clinical Notifications"
            >
              <Bell size={17} className="hdr-icon-lucide" color={isNotificationsDrawerOpen ? '#0F4C5C' : '#486770'} />
              <img src="/assets/icons/sheet/notifications.png" alt="" aria-hidden="true" className="hdr-icon-art" />
              {unreadNotifCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                minWidth: '15px',
                height: '15px',
                borderRadius: '8px',
                background: '#EF4444',
                border: '1.5px solid #ffffff',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px'
              }}>{unreadNotifCount}</span>
              )}
            </button>

            {/* Clean Compact Doctor Profile Badge with Quick Logout Action */}
            <div 
              className="doctor-header-profile-badge"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px 4px 6px',
                borderRadius: '24px',
                background: '#FAF8F5',
                border: '1px solid #8FA8AE',
                minWidth: 0,
                flexShrink: 0,
                position: 'relative',
                cursor: 'pointer'
              }}
              title={`Logged in as ${doctorName} (${doctorSpecialty}) - tap for account options`}
              ref={doctorProfileMenuRef}
              onClick={() => setIsDoctorProfileMenuOpen(prev => !prev)}
            >
              <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '1.5px solid #0F4C5C'
                }}>
                  <img
                    src="/assets/dr_ananya_avatar.jpg"
                    alt={doctorName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <span style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#10B981',
                  border: '2px solid #ffffff',
                  zIndex: 2
                }} title="Demo profile (sample account)"></span>
              </div>
              <div className="doctor-header-profile-text" style={{ textAlign: 'left', minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#081C24", whiteSpace: "nowrap" }}>
                  {doctorName.split(',')[0]}
                </div>
              </div>

              {isDoctorProfileMenuOpen && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{ position: 'absolute', top: '46px', right: '0', width: '210px', background: '#ffffff', borderRadius: '14px', border: '1px solid rgba(0, 0, 0, 0.08)', boxShadow: '0 14px 34px rgba(0, 0, 0, 0.14)', padding: '10px', zIndex: 200 }}
                >
                  <button
                    type="button"
                    onClick={() => { setIsDoctorProfileMenuOpen(false); if (onLogoutDoctor) onLogoutDoctor(); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}

              {/* Minimalist Inline Logout */}
              <button
                className="doctor-header-logout-btn"
                onClick={() => {
                  if (onLogoutDoctor) onLogoutDoctor();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  color: '#DC2626',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginLeft: '4px'
                }}
                title="Logout"
                aria-label="Logout"
              >
                <LogOut size={14} />
              </button>
            </div>          </div>
        </header>

        {/* Hands-Free Doctor Voice Command Feedback Toast */}
        {commandFeedbackToast && (
          <div style={{
            background: '#0F4C5C',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '12px',
            margin: '14px 28px 0 28px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1.5px solid #5EEAD4',
            animation: 'fadeIn 0.2s ease',
            zIndex: 60
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 750 }}>
              <Sparkles size={16} color="#5EEAD4" />
              <span>{commandFeedbackToast}</span>
            </div>
            <span style={{ fontSize: '11px', color: '#99F6E4', fontWeight: 650 }}>Hands-Free Doctor Voice Engine</span>
          </div>
        )}

        {/* Content Body */}
        <div className="doctor-portal-content-body" style={{ padding: isMobileScreen ? '14px 12px 24px 12px' : '24px 28px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>

          {/* ---------------------------------------------------------------------
              TAB 1: DASHBOARD (EXACT TO SCREENSHOT 1)
              --------------------------------------------------------------------- */}
          {activeTab === 'dashboard' && (() => {
            // Real dynamic counts derived from existing records & state (no hardcoded counts)
            const totalPatientsVal = registeredPatients?.length > 0 
              ? registeredPatients.length 
              : DEMO_PATIENTS?.length 
              ? DEMO_PATIENTS.length 
              : null;

            const todayApptsVal = (allAppointmentsList?.filter(a => a.offsetDays === 0).length || dashboardAppointments?.length) || null;
            const completedCount = allAppointmentsList?.filter(a => a.status === 'Completed').length ?? 0;
            const inProgressCount = allAppointmentsList?.filter(a => a.status === 'In Progress' || a.status === 'In-Progress').length ?? 0;
            const upcomingCount = allAppointmentsList?.filter(a => a.status === 'Upcoming').length ?? 0;
            const pendingConsultsVal = (inProgressCount + upcomingCount) || (dashboardAppointments?.filter(a => a.status !== 'Completed').length) || null;

            // Derived language distribution from real appointments
            const langMap = {};
            allAppointmentsList.forEach(item => {
              const lang = (item.language || 'Telugu').split(' ')[0];
              langMap[lang] = (langMap[lang] || 0) + 1;
            });
            const totalLang = Object.values(langMap).reduce((s, v) => s + v, 0);
            const languageStats = Object.entries(langMap).map(([lang, count]) => ({
              language: lang,
              count,
              pct: totalLang > 0 ? Math.round((count / totalLang) * 100) : 0
            }));

            // Filtered appointments for table
            const filteredConsultations = dashboardAppointments.filter(item => {
              if (dashboardStatusFilter === 'all') return true;
              return item.status?.toLowerCase() === dashboardStatusFilter.toLowerCase();
            });

            return (
              <>
                {/* 1. Clinician Greeting & Date Banner */}
                <div 
                  className="ayuswar-banner-botanical"
                  style={{
                    padding: '22px 26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    position: 'relative',
                    flexWrap: 'wrap',
                    gap: '16px',
                    borderRadius: '20px'
                  }}
                >
                  {/* Hospital Facade Decorative Zone (Authentic Handoff Artwork) */}
                  <div
                    className="greeting-hospital-crop-zone"
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      bottom: 0,
                      width: '38%',
                      maxWidth: '460px',
                      overflow: 'hidden',
                      pointerEvents: 'none',
                      zIndex: 0
                    }}
                    aria-hidden="true"
                  >
                    <picture>
                      <source media="(max-width: 640px)" srcSet="/assets/ayuswar-doctor-workspace.jpg" />
                    <img
                      className="greeting-crop-img"
                      src="/assets/ayuswar-hospital-crop.jpg"
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'right center',
                        opacity: 0.92,
                        maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 22%, rgba(0,0,0,1) 55%)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 22%, rgba(0,0,0,1) 55%)'
                      }}
                    />
                    </picture>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1, minWidth: 0 }}>
                    <DeepamHeartbeatEmblem size={50} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: '22px', fontWeight: 850, color: '#081C24', fontFamily: 'var(--font-main)', margin: 0, letterSpacing: '-0.3px' }}>
                          {t(greetingKey, { name: doctorName ? doctorName.split(',')[0] : 'Dr. Demo Clinician (synthetic)' })}
                        </h1>
                        <span className="ayuswar-accent-badge">
                          {t ? t('doctor.attendingClinician') : 'Clinician Seva Portal'}
                        </span>
                        <span style={{ fontSize: '10.5px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', padding: '2px 8px', borderRadius: '12px', fontWeight: 750 }}>
                          {t('doctor.home.sampleData')}
                        </span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#486770', marginTop: '4px', fontWeight: 500, lineHeight: 1.4 }}>
                        {t('doctor.home.facilityLine')}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px', fontSize: '11.5px', color: '#0F4C5C', fontWeight: 650 }}>
                        <span>{t('doctor.home.bullet1')}</span>
                        <span>{t('doctor.home.bullet2')}</span>
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#698892', marginTop: '2px', fontWeight: 600 }}>
                        <AlertTriangle size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />{t('doctor.home.simWarning')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1, flexWrap: 'wrap' }}>
                    <div style={{
                      padding: '8px 14px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(0, 0, 0, 0.10)',
                      textAlign: 'right',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
                    }}>
                      <div style={{ fontSize: '10px', color: '#698892', fontWeight: 750, textTransform: 'uppercase' }}>{t('doctor.home.sessionDate')}</div>
                      <div style={{ fontSize: '13px', fontWeight: 850, color: '#0F4C5C' }}>{formatDemoDate(0)}</div>
                    </div>
                    <div style={{
                      padding: '8px 14px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.92)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(0, 0, 0, 0.10)',
                      textAlign: 'right',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
                    }}>
                      <div style={{ fontSize: '10px', color: '#698892', fontWeight: 750, textTransform: 'uppercase' }}>{t('doctor.home.activeRoster')}</div>
                      <div style={{ fontSize: '13px', fontWeight: 850, color: '#059669' }}>{t('doctor.home.consultations', { count: dashboardAppointments.length })}</div>
                    </div>
                  </div>
                </div>

                {/* 2. Overview / Queue / Analytics Pills Switcher */}
                <div 
                  role="tablist"
                  aria-label="Dashboard views"
                  className="doctor-dashboard-pills-bar"
                >
                  <button
                    role="tab"
                    aria-selected={dashboardPillView === 'overview'}
                    onClick={() => setDashboardPillView('overview')}
                    className={`doctor-dashboard-pill ${dashboardPillView === 'overview' ? 'doctor-dashboard-pill-active' : ''}`}
                  >
                    <Layers size={14} />
                    <span>{t('doctor.home.overview')}</span>
                  </button>

                  <button
                    role="tab"
                    aria-selected={dashboardPillView === 'queue'}
                    onClick={() => setDashboardPillView('queue')}
                    className={`doctor-dashboard-pill ${dashboardPillView === 'queue' ? 'doctor-dashboard-pill-active' : ''}`}
                  >
                    <Users size={14} />
                    <span>{t('doctor.home.queue')} ({dashboardAppointments.length})</span>
                  </button>

                  <button
                    role="tab"
                    aria-selected={dashboardPillView === 'analytics'}
                    onClick={() => setDashboardPillView('analytics')}
                    className={`doctor-dashboard-pill ${dashboardPillView === 'analytics' ? 'doctor-dashboard-pill-active' : ''}`}
                  >
                    <BarChart3 size={14} />
                    <span>{t('doctor.home.analytics')}</span>
                  </button>
                </div>

                {/* Kurnool PHC Live Weather-Health & Environmental Sentinel */}
                <KurnoolClimateSentinel 
                  onAddOrsToRx={() => {
                    triggerHaptic('success');
                    setFhirToast('Added sample ORS text to the local draft. No price, stock, formulary or dose recommendation is verified.');
                    setTimeout(() => setFhirToast(null), 3500);
                  }}
                />

                {/* 3. Core Feature Command Strip: OPD Ambient Scribe & WhatsApp Audio-Rx (Preserved) */}
                <div style={{
                  background: '#0F4C5C',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '22px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.11)',
                  border: '1.5px solid rgba(0, 0, 0, 0.14)',
                  flexWrap: 'wrap',
                  gap: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'rgba(0, 0, 0, 0.09)',
                      border: '1px solid #D4AF37',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10B981',
                      flexShrink: 0
                    }}>
                      <Mic size={22} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-main)', margin: 0 }}>
                          {t('doctor.dash.scribeTitle')}
                        </h2>
                        <span style={{ fontSize: '9.5px', background: '#D4AF37', color: '#081C24', padding: '2px 7px', borderRadius: '10px', fontWeight: 900 }}>
                          {t('doctor.dash.coreEngine')}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#94A3B8', margin: '3px 0 0 0' }}>
                        {t('doctor.dash.scribeFlow')}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        if (onSelectEncounterAndLaunch) {
                          onSelectEncounterAndLaunch();
                        } else {
                          window.location.href = '/clinical-console';
                        }
                      }}
                      style={{
                        background: '#D4AF37',
                        color: '#08232C',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 18px',
                        fontSize: '12.5px',
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.16)',
                        minHeight: '44px'
                      }}
                    >
                      <Mic size={15} />
                      <span>{t('doctor.dash.launchScribe')}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAudioRxModal(DEMO_PATIENTS[0]);
                      }}
                      style={{
                        background: '#0E7A3D',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 18px',
                        fontSize: '12.5px',
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.18)',
                        minHeight: '44px'
                      }}
                    >
                      <Send size={15} />
                      <span>{t('doctor.dash.openAudioRx')}</span>
                    </button>
                  </div>
                </div>

                {/* 4. KPI Cards (Derived from real state/records, no hardcoded counts) */}
                <div className="doctor-dashboard-kpi-grid">
                  {/* Card 1: Total Patients */}
                  <div className="doctor-dashboard-kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0, 0, 0, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F4C5C' }}>
                        <Users size={17} />
                      </div>
                      <span className="doctor-dashboard-kpi-badge">{t('doctor.home.sampleData')}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#698892', fontWeight: 650 }}>{t('doctor.dash.totalPatients')}</div>
                    <div style={{ fontSize: '26px', fontWeight: 850, color: '#081C24', fontFamily: 'var(--font-main)', marginTop: '2px' }}>
                      {totalPatientsVal !== null ? totalPatientsVal : t('doctor.dash.noDataYet')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{t('doctor.dash.regLocal')}</div>
                  </div>

                  {/* Card 2: Today's Appointments */}
                  <div className="doctor-dashboard-kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                        <Calendar size={17} />
                      </div>
                      <span className="doctor-dashboard-kpi-badge">{t('doctor.home.sampleData')}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#698892', fontWeight: 650 }}>{t('doctor.dash.todaysAppts')}</div>
                    <div style={{ fontSize: '26px', fontWeight: 850, color: '#081C24', fontFamily: 'var(--font-main)', marginTop: '2px' }}>
                      {todayApptsVal !== null ? todayApptsVal : t('doctor.dash.noDataYet')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{t('doctor.dash.activeTokens')}</div>
                  </div>

                  {/* Card 3: Completed Consultations */}
                  <div className="doctor-dashboard-kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                        <Activity size={17} />
                      </div>
                      <span className="doctor-dashboard-kpi-badge">{t('doctor.home.sampleData')}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#698892', fontWeight: 650 }}>{t('doctor.dash.completedConsults')}</div>
                    <div style={{ fontSize: '26px', fontWeight: 850, color: '#081C24', fontFamily: 'var(--font-main)', marginTop: '2px' }}>
                      {completedCount !== null ? completedCount : t('doctor.dash.noDataYet')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{t('doctor.dash.scribeCompleted')}</div>
                  </div>

                  {/* Card 4: In Queue / Pending Voice Rx */}
                  <div className="doctor-dashboard-kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                        <FileText size={17} />
                      </div>
                      <span className="doctor-dashboard-kpi-badge">{t('doctor.home.sampleData')}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#698892', fontWeight: 650 }}>{t('doctor.dash.inQueuePending')}</div>
                    <div style={{ fontSize: '26px', fontWeight: 850, color: '#081C24', fontFamily: 'var(--font-main)', marginTop: '2px' }}>
                      {pendingConsultsVal !== null ? pendingConsultsVal : t('doctor.dash.noDataYet')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>{t('doctor.dash.awaitingReview')}</div>
                  </div>
                </div>

                {/* 5. VIEW CONTENT BASED ON SELECTED PILL */}
                {dashboardPillView === 'overview' && (
                  <>
                    {/* Charts Section: Queue Status & Language Distribution */}
                    <div className="doctor-dashboard-charts-grid">
                      {/* Chart A: Queue Status Chart (Lightweight SVG) */}
                      <div className="doctor-dashboard-chart-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#081C24', margin: 0 }}>
                              Queue Status Breakdown
                            </h3>
                            <p style={{ fontSize: '11.5px', color: '#698892', margin: '2px 0 0 0' }}>
                              Current active token distribution for today's session
                            </p>
                          </div>
                          <span className="doctor-dashboard-kpi-badge">{t('doctor.home.sampleData')}</span>
                        </div>

                        {/* Multi-segment Horizontal Progress Bar */}
                        <div style={{ height: '14px', borderRadius: '7px', background: '#8FA8AE', overflow: 'hidden', display: 'flex', marginBottom: '14px' }}>
                          <div 
                            style={{ 
                              width: `${todayApptsVal ? (completedCount / todayApptsVal) * 100 : 33}%`, 
                              background: '#10B981', 
                              transition: 'width 0.3s ease' 
                            }} 
                            title={`Completed: ${completedCount}`} 
                          />
                          <div 
                            style={{ 
                              width: `${todayApptsVal ? (inProgressCount / todayApptsVal) * 100 : 25}%`, 
                              background: '#3B82F6', 
                              transition: 'width 0.3s ease' 
                            }} 
                            title={`In Progress: ${inProgressCount}`} 
                          />
                          <div 
                            style={{ 
                              width: `${todayApptsVal ? (upcomingCount / todayApptsVal) * 100 : 42}%`, 
                              background: '#F59E0B', 
                              transition: 'width 0.3s ease' 
                            }} 
                            title={`Upcoming: ${upcomingCount}`} 
                          />
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                          <div style={{ padding: '8px', borderRadius: '8px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                            <div style={{ fontSize: '11px', color: '#065F46', fontWeight: 700 }}>Completed</div>
                            <div style={{ fontSize: '16px', fontWeight: 850, color: '#047857' }}>{completedCount}</div>
                          </div>
                          <div style={{ padding: '8px', borderRadius: '8px', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                            <div style={{ fontSize: '11px', color: '#1E40AF', fontWeight: 700 }}>In Progress</div>
                            <div style={{ fontSize: '16px', fontWeight: 850, color: '#1D4ED8' }}>{inProgressCount}</div>
                          </div>
                          <div style={{ padding: '8px', borderRadius: '8px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                            <div style={{ fontSize: '11px', color: '#92400E', fontWeight: 700 }}>Upcoming</div>
                            <div style={{ fontSize: '16px', fontWeight: 850, color: '#B45309' }}>{upcomingCount}</div>
                          </div>
                        </div>
                      </div>

                      {/* Chart B: Language Breakdown Chart (Lightweight SVG) */}
                      <div className="doctor-dashboard-chart-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                          <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#081C24', margin: 0 }}>
                              Patient Language Distribution
                            </h3>
                            <p style={{ fontSize: '11.5px', color: '#698892', margin: '2px 0 0 0' }}>
                              Vernacular consultation routing in clinical registry
                            </p>
                          </div>
                          <span className="doctor-dashboard-kpi-badge">{t('doctor.home.sampleData')}</span>
                        </div>

                        {languageStats.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {languageStats.map((item, lIdx) => {
                              const barColors = ['#0F4C5C', '#10B981', '#D4AF37', '#C2410C'];
                              const barColor = barColors[lIdx % barColors.length];
                              return (
                                <div key={item.language} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 750, color: '#2C4A52', width: '70px', flexShrink: 0 }}>
                                    {item.language}
                                  </span>
                                  <div style={{ flex: 1, height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div 
                                      style={{ 
                                        width: `${item.pct}%`, 
                                        height: '100%', 
                                        background: barColor, 
                                        borderRadius: '4px',
                                        transition: 'width 0.3s ease'
                                      }} 
                                    />
                                  </div>
                                  <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#091E26', width: '38px', textAlign: 'right' }}>
                                    {item.pct}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ padding: '24px', textAlign: 'center', color: '#698892', fontSize: '12.5px' }}>
                            No language data recorded yet
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Consultation Queue Table */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', marginBottom: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#081C24', fontFamily: 'var(--font-main)', margin: 0 }}>
                              Today's Consultation Queue
                            </h3>
                            <span style={{ fontSize: '11px', background: 'rgba(0, 0, 0, 0.07)', color: '#0F4C5C', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>
                              {t('doctor.home.consultations', { count: filteredConsultations.length })}
                            </span>
                          </div>
                          <p style={{ fontSize: '12px', color: '#698892', margin: '3px 0 0 0' }}>
                            Dr. Demo Clinician (synthetic) • Active outpatient roster
                          </p>
                        </div>

                        {/* Status Filters */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {['all', 'Upcoming', 'In Progress', 'Completed'].map((filterKey) => (
                            <button
                              key={filterKey}
                              onClick={() => setDashboardStatusFilter(filterKey)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '8px',
                                fontSize: '11.5px',
                                fontWeight: 750,
                                border: dashboardStatusFilter === filterKey ? '1px solid #0F4C5C' : '1px solid #8FA8AE',
                                background: dashboardStatusFilter === filterKey ? '#0F4C5C' : '#FFFFFF',
                                color: dashboardStatusFilter === filterKey ? '#FFFFFF' : '#486770',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {filterKey === 'all' ? 'All' : filterKey}
                            </button>
                          ))}

                          <button
                            onClick={() => setIsNewAppointmentModalOpen(true)}
                            style={{
                              padding: '6px 14px',
                              background: '#0F4C5C',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 750,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              marginLeft: '6px'
                            }}
                          >
                            <Plus size={13} />
                            <span>Add</span>
                          </button>
                        </div>
                      </div>

                      {/* Consultation Rows */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredConsultations.map((item, idx) => (
                          <div 
                            key={item.id || idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              borderRadius: '12px',
                              background: '#FAF8F5',
                              border: '1px solid rgba(0, 0, 0, 0.06)',
                              flexWrap: 'wrap',
                              gap: '12px',
                              minWidth: 0
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'rgba(0, 0, 0, 0.08)',
                                color: '#0F4C5C',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '13px',
                                fontWeight: 800,
                                flexShrink: 0
                              }}>
                                {item.token || `OPD-${101 + idx}`}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#081C24' }}>{item.patientName}</span>
                                  <span style={{ fontSize: '11px', color: '#698892' }}>• {item.age} y • {item.gender}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#486770', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.type}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#081C24' }}>{item.time}</div>
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 750,
                                  padding: '2px 7px',
                                  borderRadius: '8px',
                                  background: item.status === 'Completed' ? '#DCFCE7' : item.status === 'In Progress' ? '#DBEAFE' : '#FEF3C7',
                                  color: item.status === 'Completed' ? '#166534' : item.status === 'In Progress' ? '#1E40AF' : '#92400E',
                                  display: 'inline-block',
                                  marginTop: '2px'
                                }}>
                                  {item.status}
                                </span>
                              </div>

                              <button
                                onClick={() => setActiveScribeSessionPatient({
                                  name: item.patientName || item.name,
                                  vernacular: item.vernacular || item.patientName,
                                  token: item.token || `OPD-${101 + idx}`,
                                  phone: '+91 00000 00003',
                                  age: item.age || 50,
                                  gender: item.gender || 'Female',
                                  language: 'Telugu',
                                  domain: 'general'
                                })}
                                title="Launch In-Situ Ambient Voice Scribe Studio"
                                style={{
                                  background: '#0F4C5C',
                                  border: 'none',
                                  borderRadius: '8px',
                                  color: '#ffffff',
                                  padding: '7px 14px',
                                  fontSize: '12px',
                                  fontWeight: 750,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  minHeight: '38px',
                                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.16)'
                                }}
                              >
                                <Mic size={13} />
                                <span>{t('doctor.opd.card.voiceScribe')}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Patient Inflow & Follow-Up Analytics Card (Full-Width Showcase) */}
                    <PatientAnalyticsCard />

                    {/* Recent Diagnostic & Lab Reports Preview */}
                    <div style={{ background: '#ffffff', borderRadius: '18px', padding: '22px 26px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', marginBottom: '28px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#081C24', fontFamily: 'var(--font-main)', margin: 0 }}>
                            Recent Diagnostic & Lab Reports
                          </h3>
                          <p style={{ fontSize: '12px', color: '#698892', margin: '3px 0 0 0' }}>
                            Diagnostic laboratory investigations & synthetic DICOM records (Simulated Demo)
                          </p>
                        </div>
                        <span onClick={() => setActiveTab('reports')} style={{ fontSize: '13px', fontWeight: 700, color: '#0F4C5C', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          View All in Reports & Lab →
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                        {recentReports.slice(0, 3).map(rep => (
                          <div
                            key={rep.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                              borderRadius: '12px',
                              background: '#FAF8F5',
                              border: '1px solid rgba(0, 0, 0, 0.06)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ display:'inline-flex', color:'#0F4C5C' }}>{(rep.icon === '🩻' || rep.icon === '🫁') ? <Scan size={22} strokeWidth={1.7} /> : rep.icon === '🩸' ? <Droplets size={22} strokeWidth={1.7} /> : <FileText size={22} strokeWidth={1.7} />}</span>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 750, color: '#081C24' }}>{rep.title}</div>
                                <div style={{ fontSize: '11px', color: '#698892' }}>{rep.patient} • {rep.date}</div>
                              </div>
                            </div>

                            <button
                              onClick={() => setSelectedReport(rep)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: '1px solid rgba(0, 0, 0, 0.10)',
                                background: '#ffffff',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#0F4C5C',
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                              }}
                            >
                              Inspect
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Queue Pill View: Full Interactive Roster */}
                {dashboardPillView === 'queue' && (
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '22px', border: '1px solid #8FA8AE', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#081C24', margin: 0 }}>
                          {t('doctor.dash.queueRoster')}
                        </h3>
                        <p style={{ fontSize: '12.5px', color: '#698892', margin: '3px 0 0 0' }}>
                          {t('doctor.dash.queueRosterSub')}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsNewAppointmentModalOpen(true)}
                        style={{
                          padding: '8px 16px',
                          background: '#0F4C5C',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 750,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Plus size={14} />
                        <span>{t('doctor.dash.addToken')}</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {allAppointmentsList.map((appt, idx) => (
                        <div 
                          key={appt.id || idx}
                          style={{
                            padding: '14px 18px',
                            borderRadius: '12px',
                            background: '#FAF8F5',
                            border: '1px solid #8FA8AE',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.08)', color: '#0F4C5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                              {appt.token || `OPD-${101 + idx}`}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: '#091E26' }}>{appt.patientName}</div>
                              <div style={{ fontSize: '12px', color: '#698892' }}>{appt.complaint || t('doctor.dash.generalEval')}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '8px', background: '#DBEAFE', color: '#1E40AF', fontWeight: 750 }}>
                              {appt.time}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '8px',
                              background: appt.status === 'Completed' ? '#DCFCE7' : '#FEF3C7',
                              color: appt.status === 'Completed' ? '#166534' : '#92400E',
                              fontWeight: 750
                            }}>
                              {appt.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analytics Pill View: Real Dated Consultation Trends */}
                {dashboardPillView === 'analytics' && (
                  <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #8FA8AE', marginBottom: '24px' }}>
                    <div style={{ marginBottom: '18px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#081C24', margin: 0 }}>
                        {t('doctor.dash.analyticsTitle')}
                      </h3>
                      <p style={{ fontSize: '12.5px', color: '#698892', margin: '3px 0 0 0' }}>
                        {t('doctor.dash.analyticsSub')}
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '18px', marginBottom: '20px' }}>
                      {/* Hourly Inflow Chart */}
                      <div style={{ padding: '18px', borderRadius: '12px', background: '#FAF8F5', border: '1px solid #8FA8AE' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#091E26', marginBottom: '12px' }}>
                          {t('doctor.dash.hourlyDensity')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '120px', padding: '10px 0' }}>
                          {[
                            { hour: '09 AM', count: 3 },
                            { hour: '10 AM', count: 5 },
                            { hour: '11 AM', count: 4 },
                            { hour: '12 PM', count: 2 },
                            { hour: '01 PM', count: 1 }
                          ].map((slot) => (
                            <div key={slot.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F4C5C' }}>{slot.count}</span>
                              <div style={{ width: '100%', height: `${slot.count * 18}px`, background: 'linear-gradient(180deg, #2DD4BF 0%, #0F4C5C 100%)', borderRadius: '4px' }} />
                              <span style={{ fontSize: '10px', color: '#698892', whiteSpace: 'nowrap' }}>{slot.hour}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Longitudinal Data Status */}
                      <div style={{ padding: '18px', borderRadius: '12px', background: '#FAF8F5', border: '1px solid #8FA8AE', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#091E26', marginBottom: '6px' }}>
                          {t('doctor.dash.multiDayTrend')}
                        </div>
                        <p style={{ fontSize: '12px', color: '#698892', lineHeight: 1.5, margin: 0 }}>
                          {t('doctor.dash.trendsEmpty')}
                        </p>
                        <div style={{ marginTop: '12px', fontSize: '11px', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '6px 10px', borderRadius: '6px', display: 'inline-block' }}>
 ✓ {t('doctor.dash.sessionLogging')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scoped Styles for Doctor Dashboard */}
                <style>{`
                  .doctor-dashboard-pills-bar {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: #FAF8F5;
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    padding: 4px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    max-width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                  }

                  .doctor-dashboard-pill {
                    padding: 8px 16px;
                    min-height: 44px;
                    border-radius: 9px;
                    border: 1px solid rgba(15, 76, 92, 0.28);
                    background: rgba(15, 76, 92, 0.05);
                    color: #1F4550;
                    font-size: 13px;
                    font-weight: 750;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.15s ease;
                    white-space: nowrap;
                  }

                  .doctor-dashboard-pill:focus-visible {
                    outline: 2px solid #0F4C5C;
                    outline-offset: 2px;
                  }

                  .doctor-dashboard-pill-active {
                    background: #0F4C5C;
                    border-color: #0F4C5C;
                    color: #FFFFFF;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
                  }

                  .doctor-dashboard-kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
                    gap: 14px;
                    margin-bottom: 22px;
                    width: 100%;
                    box-sizing: border-box;
                  }

                  .doctor-dashboard-kpi-card {
                    background: #ffffff;
                    border-radius: 16px;
                    padding: 16px 18px;
                    border: 1px solid rgba(0, 0, 0, 0.06);
                    box-shadow: 0 4px 18px -2px rgba(0, 0, 0, 0.03);
                    min-width: 0;
                    box-sizing: border-box;
                  }

                  .doctor-dashboard-kpi-badge {
                    font-size: 9.5px;
                    font-weight: 750;
                    background: #FEF3C7;
                    color: #92400E;
                    border: 1px solid #FDE68A;
                    padding: 1px 6px;
                    border-radius: 8px;
                  }

                  .doctor-dashboard-charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
                    gap: 16px;
                    margin-bottom: 22px;
                    width: 100%;
                    box-sizing: border-box;
                  }

                  .doctor-dashboard-chart-card {
                    background: #ffffff;
                    border-radius: 16px;
                    padding: 18px 20px;
                    border: 1px solid rgba(0, 0, 0, 0.06);
                    box-shadow: 0 4px 18px -2px rgba(0, 0, 0, 0.03);
                    min-width: 0;
                    box-sizing: border-box;
                  }

                  @media (max-width: 480px) {
                    .doctor-dashboard-pills-bar {
                      width: 100%;
                      display: flex;
                    }
                    .doctor-dashboard-pill {
                      flex: 1;
                      justify-content: center;
                      padding: 8px 10px;
                      font-size: 12px;
                    }
                  }
                `}</style>
              </>
            );
          })()}

          {/* ---------------------------------------------------------------------
              TAB 2: UNIFIED OPD QUEUE & PATIENTS (MASTER TOKEN QUEUE, SCHEDULE & EHR)
              --------------------------------------------------------------------- */}
          {(activeTab === 'opd_queue' || activeTab === 'patients' || activeTab === 'appointments') && (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#081C24', fontFamily: 'var(--font-main)', margin: 0 }}>
                      {t ? t('doctor.opdQueue') : 'OPD Queue & Patients'}
                    </h2>
                    <SampleDataChip text={t('doctor.home.sampleData')} />
                  </div>
                  <p style={{ fontSize: '13px', color: '#698892', margin: '4px 0 0 0' }}>
                    {t('doctor.opd.hdr.subtitle')}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setIsNewAppointmentModalOpen(true)}
                    style={{
                      background: '#0F4C5C',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '8px 16px',
                      fontSize: '12.5px',
                      fontWeight: 750,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)'
                    }}
                  >
                    <Plus size={14} />
                    <span>{t('doctor.opd.hdr.newAppt')}</span>
                  </button>

                  <div style={{
                    padding: '8px 16px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '20px',
                    color: '#065F46',
                    fontSize: '12.5px',
                    fontWeight: 750
                  }}>
                    {t('doctor.opd.hdr.todayChip', { date: formatDemoDate(0) })}
                  </div>
                </div>
              </div>

              {/* Rural Offline-First OPD & ABDM Gateway Sync Engine */}
              <div 
                style={{
                  background: isSimulatingOffline 
                    ? '#B45309' 
                    : '#0F4C5C',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  color: '#ffffff',
                  marginBottom: '20px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.10)',
                  border: isSimulatingOffline ? '1.5px solid #FCD34D' : '1px solid rgba(255, 255, 255, 0.15)',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ maxWidth: '650px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: isSimulatingOffline ? '#FEF3C7' : '#DCFCE7',
                        color: isSimulatingOffline ? '#92400E' : '#166534',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 850,
                        letterSpacing: '0.4px',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSimulatingOffline ? '#D97706' : '#22C55E', animation: 'pulse 1s infinite' }} />
                        {isSimulatingOffline 
                          ? t('doctor.opd.off.chipOffline', { n: pendingOfflineCount }) 
                          : t('doctor.opd.off.chipReady')}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#8FA8AE' }}>
                        {t('doctor.opd.off.dbLabel')} <code>ayuswar_clinical_offline_db</code>
                      </span>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff' }}>
                      {t('doctor.opd.off.title')}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#8FA8AE', lineHeight: 1.55, margin: 0 }}>
                      {t('doctor.opd.off.desc')}
                    </p>
                  </div>

                  {/* Simulator Controls */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleToggleOfflineSimulation}
                      style={{
                        background: isSimulatingOffline ? '#FEF3C7' : 'rgba(255, 255, 255, 0.15)',
                        color: isSimulatingOffline ? '#92400E' : '#ffffff',
                        border: isSimulatingOffline ? '1.5px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <WifiOff size={14} color={isSimulatingOffline ? '#D97706' : '#ffffff'} />
                      <span>{isSimulatingOffline ? t('doctor.opd.off.simStop') : t('doctor.opd.off.simStart')}</span>
                    </button>

                    <button
                      onClick={handleTriggerAbdmSync}
                      disabled={isSyncingOffline || pendingOfflineCount === 0}
                      style={{
                        background: '#0F4C5C',
                        color: '#ffffff',
                        border: '1px solid #0B3A46',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: (isSyncingOffline || pendingOfflineCount === 0) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <RefreshCw size={14} style={{ animation: isSyncingOffline ? 'spin 1s linear infinite' : 'none' }} />
                      <span>{isSyncingOffline ? t('doctor.opd.off.validating') : t('doctor.opd.off.validate', { n: pendingOfflineCount })}</span>
                    </button>
                  </div>
                </div>
              </div>

              <LiveTelemetryBadge location="kurnool" style={{ marginBottom: '16px' }} />
              {/* KPI Counters */}
              {(() => {
                const todayAppts = allAppointmentsList.filter(a => a.offsetDays === 0);
                const completedCount = allAppointmentsList.filter(a => a.status === 'Completed').length;
                const upcomingCount = allAppointmentsList.filter(a => a.status === 'Upcoming').length;

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '22px' }}>
                    <div 
                      onClick={() => setOpdViewMode('queue')}
                      style={{ 
                        background: '#ffffff', 
                        padding: '16px 20px', 
                        borderRadius: '14px', 
                        border: opdViewMode === 'queue' ? '2px solid #0F4C5C' : '1px solid #8FA8AE',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: opdViewMode === 'queue' ? '0 4px 14px rgba(0, 0, 0, 0.08)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '11px', color: '#698892', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('doctor.opd.kpiQueue')}</div>
                      <div style={{ fontSize: '24px', fontWeight: 850, color: '#081C24', marginTop: '4px' }}>{t('doctor.opd.valPatients', { n: todayAppts.length })}</div>
                      <div style={{ fontSize: '11px', color: '#D97706', marginTop: '2px', fontWeight: 600 }}>{t('doctor.opd.nextPrefix', { t: todayAppts[0]?.time || '10:00 AM' })}</div>
                    </div>

                    <div 
                      onClick={() => setOpdViewMode('schedule')}
                      style={{ 
                        background: '#ffffff', 
                        padding: '16px 20px', 
                        borderRadius: '14px', 
                        border: opdViewMode === 'schedule' ? '2px solid #0F4C5C' : '1px solid #8FA8AE',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: opdViewMode === 'schedule' ? '0 4px 14px rgba(0, 0, 0, 0.08)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '11px', color: '#698892', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('doctor.opd.kpiUpcoming')}</div>
                      <div style={{ fontSize: '24px', fontWeight: 850, color: '#2563EB', marginTop: '4px' }}>{t('doctor.opd.valScheduled', { n: upcomingCount })}</div>
                      <div style={{ fontSize: '11px', color: '#698892', marginTop: '2px' }}>{t('doctor.opd.kpiInPerson')}</div>
                    </div>

                    <div 
                      onClick={() => setOpdViewMode('schedule')}
                      style={{ 
                        background: '#ffffff', 
                        padding: '16px 20px', 
                        borderRadius: '14px', 
                        border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '11px', color: '#698892', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('doctor.opd.kpiCompleted')}</div>
                      <div style={{ fontSize: '24px', fontWeight: 850, color: '#10B981', marginTop: '4px' }}>{t('doctor.opd.valRecorded', { n: completedCount })}</div>
                      <div style={{ fontSize: '11px', color: '#698892', marginTop: '2px' }}>{t('doctor.opd.kpiNotes')}</div>
                    </div>

                    <div 
                      onClick={() => setOpdViewMode('directory')}
                      style={{ 
                        background: '#ffffff', 
                        padding: '16px 20px', 
                        borderRadius: '14px', 
                        border: opdViewMode === 'directory' ? '2px solid #0F4C5C' : '1px solid #8FA8AE',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: opdViewMode === 'directory' ? '0 4px 14px rgba(0, 0, 0, 0.08)' : 'none'
                      }}
                    >
                      <div style={{ fontSize: '11px', color: '#698892', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('doctor.opd.kpiAll')}</div>
                      <div style={{ fontSize: '24px', fontWeight: 850, color: '#0F4C5C', marginTop: '4px' }}>{t('doctor.opd.valRegistered', { n: patientsList.length })}</div>
                      <div style={{ fontSize: '11px', color: '#698892', marginTop: '2px' }}>{t('doctor.opd.kpiSearch')}</div>
                    </div>
                  </div>
                );
              })()}

              {/* View Selector Switcher */}
              <div 
                className="opd-subview-tabs-container"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: '20px', 
                  background: '#FAF8F5', 
                  padding: '8px 12px', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                <div 
                  className="opd-subview-tabs-group"
                  style={{ display: 'inline-flex', background: '#8FA8AE', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                  <button
                    className="opd-subview-tab-btn"
                    onClick={() => setOpdViewMode('queue')}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '9px',
                      border: 'none',
                      background: opdViewMode === 'queue' ? '#0F4C5C' : 'transparent',
                      color: opdViewMode === 'queue' ? '#ffffff' : '#1F4550',
                      fontSize: '12.5px',
                      fontWeight: 750,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Clock size={14} />
                    <span className="opd-tab-label-full">{t('doctor.opd.tabQueueFull', { n: allAppointmentsList.filter(a => a.offsetDays === 0).length })}</span>
                    <span className="opd-tab-label-compact">{t('doctor.opd.tabQueueCompact', { n: allAppointmentsList.filter(a => a.offsetDays === 0).length })}</span>
                  </button>

                  <button
                    className="opd-subview-tab-btn"
                    onClick={() => setOpdViewMode('schedule')}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '9px',
                      border: 'none',
                      background: opdViewMode === 'schedule' ? '#0F4C5C' : 'transparent',
                      color: opdViewMode === 'schedule' ? '#ffffff' : '#1F4550',
                      fontSize: '12.5px',
                      fontWeight: 750,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Calendar size={14} />
                    <span className="opd-tab-label-full">{t('doctor.opd.tabScheduleFull', { n: allAppointmentsList.length })}</span>
                    <span className="opd-tab-label-compact">{t('doctor.opd.tabScheduleCompact', { n: allAppointmentsList.length })}</span>
                  </button>

                  <button
                    className="opd-subview-tab-btn"
                    onClick={() => setOpdViewMode('directory')}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '9px',
                      border: 'none',
                      background: opdViewMode === 'directory' ? '#0F4C5C' : 'transparent',
                      color: opdViewMode === 'directory' ? '#ffffff' : '#1F4550',
                      fontSize: '12.5px',
                      fontWeight: 750,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Users size={14} />
                    <span className="opd-tab-label-full">{t('doctor.opd.tabRegistryFull', { n: patientsList.length })}</span>
                    <span className="opd-tab-label-compact">{t('doctor.opd.tabRegistryCompact', { n: patientsList.length })}</span>
                  </button>
                </div>

                {/* Quick Search */}
                <div className="opd-subview-search-box" style={{ position: 'relative', width: '260px' }}>
                  <Search size={14} color="#698892" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder={t('doctor.opd.searchPh')}
                    value={patientSearchTerm}
                    onChange={(e) => setPatientSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      borderRadius: '20px',
                      border: '1px solid rgba(0, 0, 0, 0.10)',
                      fontSize: '12.5px',
                      outline: 'none',
                      background: '#ffffff',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* -------------------------------------------------------------
                  SUBVIEW 1: TODAY'S LIVE QUEUE
                  ------------------------------------------------------------- */}
              {opdViewMode === 'queue' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#081C24' }}>
                      {t('doctor.opd.queueTokensTitle', { date: formatDemoDate(0) })}
                    </div>
                    <span style={{ fontSize: '11px', color: '#059669', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 10px', borderRadius: '12px', fontWeight: 750 }}>
                      {t('doctor.opd.sortChip')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(() => {
                      const todayAppts = allAppointmentsList.filter(a => a.offsetDays === 0);
                      const matchingToday = todayAppts.filter(a => {
                        if (!patientSearchTerm.trim()) return true;
                        const term = patientSearchTerm.toLowerCase();
                        return (
                          a.patientName.toLowerCase().includes(term) ||
                          a.token.toLowerCase().includes(term) ||
                          a.complaint.toLowerCase().includes(term)
                        );
                      });

                      if (matchingToday.length === 0) {
                        return (
                          <div style={{
                            padding: '36px',
                            textAlign: 'center',
                            background: '#ffffff',
                            borderRadius: '16px',
                            border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)',
                            color: '#698892'
                          }}>
                            <p style={{ margin: 0, fontWeight: 700 }}>No consultations in queue matching the criteria.</p>
                            <button
                              onClick={() => setPatientSearchTerm('')}
                              style={{
                                marginTop: '12px',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: '1px solid rgba(0, 0, 0, 0.08)',
                                background: '#FAF8F5',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 700
                              }}
                            >
                              Clear search
                            </button>
                          </div>
                        );
                      }

                      return matchingToday.map((appt, idx) => {
                        const pat = patientsList.find(p => p.id === appt.patientId) || patientsList[0];
                        const cleanToken = (appt.token && !appt.token.startsWith('T-'))
                          ? appt.token
                          : (appt.token?.startsWith('T-')
                              ? appt.token.replace('T-0', 'OPD-10').replace('T-', 'OPD-1')
                              : `OPD-${101 + idx}`);
                        const patientScribeData = { ...pat, ...appt, token: cleanToken };
                        return (
                          <div
                            key={appt.id}
                            style={{
                              background: '#ffffff',
                              borderRadius: '14px',
                              padding: '18px 22px',
                              border: '1.5px solid #F59E0B',
                              boxShadow: '0 3px 12px rgba(245, 158, 11, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '16px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{
                                minWidth: '66px',
                                height: '52px',
                                padding: '4px 6px',
                                borderRadius: '12px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 850,
                                fontSize: '13.5px',
                                color: '#B45309',
                                textAlign: 'center'
                              }}>
                                <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#78350F', letterSpacing: '0.5px' }}>{t('doctor.opd.card.token')}</span>
                                <span>{cleanToken}</span>
                              </div>

                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#081C24' }}>{appt.patientName}</span>
                                  <span style={{ fontSize: '12px', color: '#698892' }}>({pat.vernacular})</span>
                                  <span style={{ fontSize: '10px', background: `${pat.triageColor}18`, color: pat.triageColor, padding: '2px 8px', borderRadius: '8px', fontWeight: 750 }}>
                                    {t('doctor.opd.card.triage' + pat.triage)}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#0F4C5C', background: 'rgba(0, 0, 0, 0.06)', padding: '2px 8px', borderRadius: '8px', fontWeight: 700 }}>
                                    {t('doctor.opd.card.slot', { t: appt.time })}
                                  </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#698892', marginTop: '3px' }}>
                                  {pat.age} y • {pat.gender} • {pat.language} • {pat.village}
                                </div>
                                <div style={{ fontSize: '12.5px', color: '#1E293B', fontWeight: 600, marginTop: '3px' }}>
                                  {t('doctor.opd.card.complaint', { c: appt.complaint || t('doctor.dash.generalEval') })}
                                </div>
                                <AbdmRegistryBadgeRow
                                  abhaNumber={pat.abhaNumber || pat.abhaId}
                                  abhaAddress={pat.abhaAddress}
                                  hprId={pat.hprId}
                                  doctorName={pat.doctorName}
                                  hfrId={pat.hfrId}
                                  facilityName={pat.facilityName}
                                  icd10={pat.icd10}
                                  icd10Desc={pat.icd10Desc}
                                  snomedCt={pat.snomedCt}
                                  snomedDesc={pat.snomedDesc}
                                  compact={true}
                                  onToast={setFhirToast}
                                  style={{ marginTop: '5px' }}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '18px', flexWrap: 'wrap', rowGap: '10px' }}>
                              {/* Vitals HUD */}
                              <div style={{ textAlign: 'right', fontSize: '12px', color: '#486770' }}>
                                <div>BP: <strong>{pat.vitals.bp}</strong> • HR: <strong>{pat.vitals.hr}</strong></div>
                                <div>SpO2: <strong>{pat.vitals.spo2}</strong> {pat.vitals.rbs && `• RBS: ${pat.vitals.rbs}`}</div>
                                {(() => {
                                  const sys = parseInt(pat.vitals.bp?.split('/')[0]) || 120;
                                  const hr = parseInt(pat.vitals.hr) || 76;
                                  const spo2 = parseInt(pat.vitals.spo2) || 98;
                                  const mews = calculateMewsScore({ bpSystolic: sys, hr, spo2 });
                                  return (
                                    <div style={{ fontSize: '11px', color: mews.riskColor, fontWeight: 750, marginTop: '2px' }}>
                                      MEWS {mews.score} ({mews.riskLevel})
                                    </div>
                                  );
                                })()}
                              </div>

                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => setSelectedPatientModal(pat)}
                                  style={{
                                    padding: '8px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(0, 0, 0, 0.10)',
                                    background: '#ffffff',
                                    color: '#081C24',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {t('doctor.opd.card.viewEhr')}
                                </button>

                                <button
                                  onClick={() => {
                                    const encIdx = appt.encounterIndex !== undefined ? appt.encounterIndex : 0;
                                    if (onSelectEncounterAndLaunch) {
                                      onSelectEncounterAndLaunch(encIdx, patientScribeData);
                                    } else {
                                      const n = encodeURIComponent(appt.patientName || pat.name || '');
                                      const t = encodeURIComponent(cleanToken);
                                      const p = encodeURIComponent(pat.phone || appt.phone || '');
                                      window.location.href = `/clinical-console?encounter=${encIdx}&name=${n}&token=${t}&phone=${p}`;
                                    }
                                  }}
                                  style={{
                                    padding: '8px 13px',
                                    borderRadius: '10px',
                                    border: '1px solid #0F4C5C',
                                    background: 'rgba(15, 76, 92, 0.08)',
                                    color: '#0F4C5C',
                                    fontSize: '12px',
                                    fontWeight: 750,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    cursor: 'pointer'
                                  }}
                                  title="Launch directly into 4-step Clinical Console (AI Scribe & Audio-Rx)"
                                >
                                  <Sparkles size={13} color="#0F4C5C" />
                                  <span>{t('doctor.opd.card.openConsole')}</span>
                                </button>

                                <button
                                  onClick={() => setActiveScribeSessionPatient(patientScribeData)}
                                  style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: '#0F4C5C',
                                    color: '#ffffff',
                                    fontSize: '12px',
                                    fontWeight: 750,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)'
                                  }}
                                >
                                  <Mic size={14} />
                                  <span>{t('doctor.opd.card.startScribe')}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------
                  SUBVIEW 2: CONSULTATION SCHEDULES
                  ------------------------------------------------------------- */}
              {opdViewMode === 'schedule' && (
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#081C24' }}>
                      {t('doctor.opd.sched.title')}
                    </div>
                    <span style={{ fontSize: '11px', color: '#059669', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 10px', borderRadius: '12px', fontWeight: 750 }}>
                      Click any patient to inspect EHR dossier or start scribe
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {allAppointmentsList.filter(item => {
                      if (!patientSearchTerm.trim()) return true;
                      const term = patientSearchTerm.toLowerCase();
                      return (
                        item.patientName.toLowerCase().includes(term) ||
                        item.token.toLowerCase().includes(term) ||
                        item.complaint.toLowerCase().includes(term)
                      );
                    }).map((item) => {
                      const matchedPatient = patientsList.find(p => p.id === item.patientId) || patientsList[0];
                      const isToday = item.offsetDays === 0;
                      const isTeleconsult = item.isTeleconsult;
                      const isCompleted = item.status === 'Completed';

                      return (
                        <div
                          key={item.id}
                          style={{
                            padding: '16px 20px',
                            borderRadius: '14px',
                            background: isToday ? '#FFFBEB' : '#F8FAFC',
                            border: isToday ? '1.5px solid #F59E0B' : '1px solid #8FA8AE',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '14px',
                            boxShadow: isToday ? '0 4px 14px rgba(245, 158, 11, 0.12)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              background: isToday ? '#F59E0B' : (isCompleted ? '#10B981' : '#0F4C5C'),
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '13px'
                            }}>
                              {item.token}
                            </div>

                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span
                                  onClick={() => setSelectedPatientModal(matchedPatient)}
                                  style={{
                                    fontSize: '15px',
                                    fontWeight: 800,
                                    color: '#081C24',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    textDecorationColor: '#8FA8AE'
                                  }}
                                >
                                  {item.patientName}
                                </span>
                                <span style={{ fontSize: '11px', color: '#698892' }}>
                                  ({item.language})
                                </span>
                                {isTeleconsult && (
                                  <span style={{ fontSize: '10px', background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '10px', fontWeight: 750 }}>
                                    Teleconsult
                                  </span>
                                )}
                                <span style={{
                                  fontSize: '10px',
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontWeight: 750,
                                  background: isCompleted ? '#DCFCE7' : (isToday ? '#FEF3C7' : '#E0E7FF'),
                                  color: isCompleted ? '#166534' : (isToday ? '#92400E' : '#3730A3')
                                }}>
                                  {item.status} ({getRelativeDaysLabel(item.offsetDays)})
                                </span>
                              </div>

                              <div style={{ fontSize: '12.5px', color: '#486770', marginTop: '3px' }}>
                                <strong>{formatDemoDate(item.offsetDays)} at {item.time}</strong> • {item.complaint}
                              </div>
                              <AbdmRegistryBadgeRow
                                abhaNumber={matchedPatient.abhaNumber || matchedPatient.abhaId}
                                abhaAddress={matchedPatient.abhaAddress}
                                hprId={matchedPatient.hprId}
                                doctorName={matchedPatient.doctorName}
                                hfrId={matchedPatient.hfrId}
                                facilityName={matchedPatient.facilityName}
                                icd10={matchedPatient.icd10}
                                icd10Desc={matchedPatient.icd10Desc}
                                snomedCt={matchedPatient.snomedCt}
                                snomedDesc={matchedPatient.snomedDesc}
                                compact={true}
                                onToast={setFhirToast}
                                style={{ marginTop: '5px' }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                              onClick={() => setSelectedPatientModal(matchedPatient)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(0, 0, 0, 0.08)',
                                background: '#ffffff',
                                color: '#081C24',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Dossier
                            </button>

                            <button
                              onClick={() => setActiveScribeSessionPatient(matchedPatient)}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#0F4C5C',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: 750,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)'
                              }}
                            >
                              <Mic size={14} />
                              <span>{t('doctor.opd.card.voiceScribe')}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* -------------------------------------------------------------
                  SUBVIEW 3: ALL PATIENTS REGISTRY & LONGITUDINAL EHR
                  ------------------------------------------------------------- */}
              {opdViewMode === 'directory' && (
                <div>
                  {/* Filter Chips Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { key: 'all', label: t('doctor.opd.filter.all') },
                        { key: 'this_week', label: t('doctor.opd.filter.thisWeek') },
                        { key: 'has_upcoming', label: t('doctor.opd.filter.hasUpcoming') },
                        { key: 'urgent', label: t('doctor.opd.filter.urgent') }
                      ].map(chip => (
                        <button
                          key={chip.key}
                          onClick={() => setPatientTriageFilter(chip.key)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: 'none',
                            background: patientTriageFilter === chip.key ? '#0A2540' : '#8FA8AE',
                            color: patientTriageFilter === chip.key ? '#ffffff' : '#1F4550',
                            fontSize: '12px',
                            fontWeight: 750,
                            cursor: 'pointer'
                          }}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ fontSize: '12px', color: '#698892', fontWeight: 600 }}>
                      {t('doctor.opd.filter.showing', { a: filteredPatients.length, b: patientsList.length })}
                    </div>
                  </div>

                  {/* Patient Table Grid */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredPatients.length === 0 ? (
                      <div style={{
                        padding: '36px',
                        textAlign: 'center',
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)',
                        color: '#698892'
                      }}>
                        <p style={{ margin: 0, fontWeight: 700 }}>No demo patients found matching "{patientSearchTerm}".</p>
                        <button
                          onClick={() => { setPatientSearchTerm(''); setPatientTriageFilter('all'); }}
                          style={{
                            marginTop: '12px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            background: '#FAF8F5',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700
                          }}
                        >
                          Reset filters
                        </button>
                      </div>
                    ) : null}

                    {filteredPatients.map(pat => (
                      <div
                        key={pat.id}
                        style={{
                          background: '#ffffff',
                          borderRadius: '14px',
                          padding: '18px 22px',
                          border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '16px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            background: 'rgba(0, 0, 0, 0.07)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '16px',
                            color: '#0F4C5C'
                          }}>
                            {pat.token.split('-')[1]}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '15px', fontWeight: 800, color: '#081C24' }}>{pat.name}</span>
                              <span style={{ fontSize: '12px', color: '#698892' }}>({pat.vernacular})</span>
                              <span style={{ fontSize: '10px', background: `${pat.triageColor}18`, color: pat.triageColor, padding: '2px 8px', borderRadius: '8px', fontWeight: 750 }}>
                                {t('doctor.opd.card.triage' + pat.triage)}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#698892', marginTop: '2px' }}>
                              {pat.age} y • {pat.gender} • {pat.language} • {pat.village}
                            </div>
                            <div style={{ fontSize: '12.5px', color: '#1E293B', fontWeight: 600, marginTop: '3px' }}>
                              {t('doctor.opd.card.complaint', { c: pat.chiefComplaint || t('doctor.dash.generalEval') })}
                            </div>
                            <AbdmRegistryBadgeRow
                              abhaNumber={pat.abhaNumber || pat.abhaId}
                              abhaAddress={pat.abhaAddress}
                              hprId={pat.hprId}
                              doctorName={pat.doctorName}
                              hfrId={pat.hfrId}
                              facilityName={pat.facilityName}
                              icd10={pat.icd10}
                              icd10Desc={pat.icd10Desc}
                              snomedCt={pat.snomedCt}
                              snomedDesc={pat.snomedDesc}
                              compact={false}
                              onToast={setFhirToast}
                              style={{ marginTop: '6px' }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                          {/* Vitals HUD */}
                          <div style={{ textAlign: 'right', fontSize: '12px', color: '#486770' }}>
                            <div>BP: <strong>{pat.vitals.bp}</strong> • HR: <strong>{pat.vitals.hr}</strong></div>
                            <div>SpO2: <strong>{pat.vitals.spo2}</strong> {pat.vitals.rbs && `• RBS: ${pat.vitals.rbs}`}</div>
                            {(() => {
                              const sys = parseInt(pat.vitals.bp?.split('/')[0]) || 120;
                              const hr = parseInt(pat.vitals.hr) || 76;
                              const spo2 = parseInt(pat.vitals.spo2) || 98;
                              const mews = calculateMewsScore({ bpSystolic: sys, hr, spo2 });
                              return (
                                <div style={{ fontSize: '11px', color: mews.riskColor, fontWeight: 750, marginTop: '2px' }}>
                                  MEWS {mews.score} ({mews.riskLevel})
                                </div>
                              );
                            })()}
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => setSelectedPatientModal(pat)}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '10px',
                                border: '1px solid rgba(0, 0, 0, 0.10)',
                                background: '#ffffff',
                                color: '#081C24',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              View EHR
                            </button>

                            <button
                              onClick={() => setActiveScribeSessionPatient(pat)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '10px',
                                border: 'none',
                                background: '#0F4C5C',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: 750,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)'
                              }}
                            >
                              <Mic size={14} />
                              <span>{t('doctor.opd.card.startScribe')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------------------
              TAB 3: AI CLINICAL ASSISTANT (ADVANCED CO-PILOT VIEW)
              --------------------------------------------------------------------- */}
          {activeTab === 'ai_assistant' && (
            <DoctorAiAssistantTab
              aiCategory={aiCategory}
              setAiCategory={setAiCategory}
              aiResponses={aiResponses}
              aiPrompt={aiPrompt}
              setAiPrompt={setAiPrompt}
              handleAskAi={handleAskAi}
            />
          )}

          {/* ---------------------------------------------------------------------
              TAB 5: REPORTS & LAB (DIAGNOSTIC & RADIOLOGY HUB)
              --------------------------------------------------------------------- */}
          {activeTab === 'reports' && (
            <div>
              {/* Header & Meta */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#081C24', fontFamily: 'var(--font-main)' }}>
                      Diagnostic Pathology & Imaging Hub
                    </h2>
                    <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(0, 0, 0, 0.08)', color: '#0F4C5C', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.16)' }}>
                      Synthetic Diagnostic Records ({recentReports.length} demo records)
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#698892' }}>
                    {selectedReportPatient 
                      ? `Viewing individual diagnostic repository for ${selectedReportPatient.name} (ABHA: ${selectedReportPatient.abhaId})`
                      : "Browse patient diagnostic profiles. Click any patient's card or arrow to review their individual lab tests, radiography, and DICOM series."}
                  </p>
                </div>

                {/* Right Header Controls: Mode Toggle & Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {/* View Mode Toggle: By Patient vs All Flat */}
                  <div style={{ 
                    display: 'flex', 
                    background: '#DCE6E8', 
                    borderRadius: '10px', 
                    padding: '3px',
                    gap: '2px'
                  }}>
                    <button
                      type="button"
                      onClick={() => { setReportsViewMode('by_patient'); }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: reportsViewMode === 'by_patient' ? '#ffffff' : 'transparent',
                        color: reportsViewMode === 'by_patient' ? '#0F4C5C' : '#486770',
                        fontSize: '12px',
                        fontWeight: 750,
                        cursor: 'pointer',
                        boxShadow: reportsViewMode === 'by_patient' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      By Patient Directory ({patientsWithReports.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setReportsViewMode('all'); setSelectedReportPatient(null); }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: reportsViewMode === 'all' ? '#ffffff' : 'transparent',
                        color: reportsViewMode === 'all' ? '#0F4C5C' : '#486770',
                        fontSize: '12px',
                        fontWeight: 750,
                        cursor: 'pointer',
                        boxShadow: reportsViewMode === 'all' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s'
                      }}
                    >
                      All Reports ({recentReports.length})
                    </button>
                  </div>

                  {/* Quick Search */}
                  <div style={{ position: 'relative', width: '280px' }}>
                    <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder={selectedReportPatient ? `Search ${selectedReportPatient.name.split(' ')[0]}'s tests...` : "Search by patient, LOINC or test..."}
                      value={reportSearchTerm}
                      onChange={e => setReportSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px 9px 36px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                        fontSize: '13px',
                        background: '#ffffff',
                        color: '#081C24',
                        outline: 'none'
                      }}
                    />
                    {reportSearchTerm && (
                      <button
                        onClick={() => setReportSearchTerm('')}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: '13px' }}
                      >
 ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* VIEW 1: SELECTED PATIENT'S DEDICATED REPORTS */}
              {selectedReportPatient ? (
                <div>
                  {/* Back Navigation Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <button
                      onClick={() => { setSelectedReportPatient(null); setReportSearchTerm(''); setReportCategoryFilter('all'); }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: '1.5px solid #0F4C5C',
                        background: '#ffffff',
                        color: '#0F4C5C',
                        fontSize: '13px',
                        fontWeight: 750,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Patients Directory</span>
                    </button>

                    <div style={{ fontSize: '12px', color: '#698892', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Reports & Lab</span>
                      <span>/</span>
                      <strong style={{ color: '#0F4C5C' }}>{selectedReportPatient.name}</strong>
                      <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, fontSize: '11px' }}>
                        {selectedReportPatient.reports.length} {selectedReportPatient.reports.length === 1 ? 'Report' : 'Reports'}
                      </span>
                    </div>
                  </div>

                  {/* Patient Clinical Profile Card */}
                  <div style={{
                    background: '#0F4C5C',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    color: '#ffffff',
                    marginBottom: '20px',
                    boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#FAF8F5',
                        color: '#0F4C5C',
                        fontWeight: 900,
                        fontSize: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2.5px solid #D4AF37',
                        flexShrink: 0
                      }}>
                        {selectedReportPatient.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3 style={{ fontSize: '19px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                            {selectedReportPatient.name}
                          </h3>
                          {selectedReportPatient.vernacular && selectedReportPatient.vernacular !== selectedReportPatient.name && (
                            <span style={{ fontSize: '13px', color: '#99F6E4', fontWeight: 650 }}>
                              ({selectedReportPatient.vernacular})
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', fontSize: '12.5px', color: '#8FA8AE', flexWrap: 'wrap' }}>
                          <span>{selectedReportPatient.age} Yrs • {selectedReportPatient.genderLabel || selectedReportPatient.gender}</span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldCheck size={14} color="#34D399" />
                            ABHA: <strong>{selectedReportPatient.abhaId}</strong>
                          </span>
                          <span>•</span>
                          <span>Village: {selectedReportPatient.village || 'Kurnool PHC'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vitals & Summary Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>
                        <span style={{ color: '#94A3B8' }}>Primary: </span>
                        <strong>{selectedReportPatient.primaryCondition}</strong>
                      </div>
                      {selectedReportPatient.vitals && (
                        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>
                          <span style={{ color: '#94A3B8' }}>BP: </span>
                          <strong>{selectedReportPatient.vitals.bp}</strong>
                          <span style={{ color: '#94A3B8', marginLeft: '6px' }}>SpO2: </span>
                          <strong>{selectedReportPatient.vitals.spo2}</strong>
                        </div>
                      )}
                      <div style={{
                        background: '#D4AF37',
                        color: '#081C24',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <FileText size={14} />
                        <span>{selectedReportPatient.reports.length} {selectedReportPatient.reports.length === 1 ? 'Report' : 'Reports'} on Record</span>
                      </div>
                    </div>
                  </div>

                  {/* Category Filter Pills for Selected Patient */}
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '18px' }}>
                    {[
                      { key: 'all', label: 'All Patient Reports', count: selectedReportPatient.reports.length },
                      { key: 'Radiology', label: 'Radiology & DICOM', count: selectedReportPatient.reports.filter(r => r.category === 'Radiology').length },
                      { key: 'Cardiology', label: 'Cardiology & ECG', count: selectedReportPatient.reports.filter(r => r.category === 'Cardiology').length },
                      { key: 'Hematology', label: 'Hematology', count: selectedReportPatient.reports.filter(r => r.category === 'Hematology').length },
                      { key: 'Biochemistry', label: 'Biochemistry', count: selectedReportPatient.reports.filter(r => r.category === 'Biochemistry').length },
                      { key: 'Microbiology', label: 'Microbiology', count: selectedReportPatient.reports.filter(r => r.category === 'Microbiology' || r.category === 'Infectious').length },
                      { key: 'Pulmonology', label: 'Pulmonology & PFT', count: selectedReportPatient.reports.filter(r => r.category === 'Pulmonology').length }
                    ].filter(cat => cat.key === 'all' || cat.count > 0).map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => setReportCategoryFilter(cat.key)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: reportCategoryFilter === cat.key ? '1.5px solid #0F4C5C' : '1px solid #8FA8AE',
                          background: reportCategoryFilter === cat.key ? '#0F4C5C' : '#ffffff',
                          color: reportCategoryFilter === cat.key ? '#ffffff' : '#1F4550',
                          whiteSpace: 'nowrap',
                          boxShadow: reportCategoryFilter === cat.key ? '0 2px 8px rgba(0, 0, 0, 0.16)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {cat.label} <span style={{ opacity: 0.8, fontSize: '11px', marginLeft: '4px' }}>({cat.count})</span>
                      </button>
                    ))}
                  </div>

                  {/* Reports Grid for Selected Patient */}
                  {selectedPatientReports.length === 0 ? (
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)' }}>
                      <p style={{ fontSize: '15px', color: '#698892', fontWeight: 600 }}>No reports matching query "{reportSearchTerm}" for {selectedReportPatient.name}.</p>
                      <button onClick={() => { setReportSearchTerm(''); setReportCategoryFilter('all'); }} className="btn-outline" style={{ marginTop: '12px', padding: '6px 16px', fontSize: '12px' }}>
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '18px' }}>
                      {selectedPatientReports.map(rep => {
                        const hasAbnormal = (rep.quantitativeMetrics || []).some(m => m.status && m.status !== 'Normal');
                        return (
                          <div
                            key={rep.id}
                            style={{
                              background: '#ffffff',
                              borderRadius: '16px',
                              padding: '20px',
                              border: '1.5px solid #94A3B8',
                              boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.04)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                            }}
                          >
                            <div>
                              {/* Header */}
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                  <span style={{ display:'inline-flex', color:'#0F4C5C' }}>{(rep.icon === '🩻' || rep.icon === '🫁') ? <Scan size={22} strokeWidth={1.7} /> : rep.icon === '🩸' ? <Droplets size={22} strokeWidth={1.7} /> : <FileText size={22} strokeWidth={1.7} />}</span>
                                  <div>
                                    <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#081C24', lineHeight: 1.3 }}>{rep.title}</div>
                                    <div style={{ fontSize: '11.5px', color: '#698892', marginTop: '2px' }}>
                                      {rep.modality} • {rep.date}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                  <span style={{ fontSize: '10.5px', background: '#FAF8F5', color: '#2C4A52', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, border: '1px solid #8FA8AE' }}>
                                    {rep.facility ? rep.facility.split('(')[0].trim() : 'PHC Diagnostic Lab'}
                                  </span>
                                  {rep.loincCode && (
                                    <span style={{ fontSize: '9.5px', color: '#0F4C5C', fontWeight: 750, fontFamily: 'monospace' }}>
                                      LOINC: {rep.loincCode}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Original Diagnostic Scan Thumbnail Preview */}
                              {rep.realScanImage && (
                                <div 
                                  onClick={() => setSelectedReport(rep)}
                                  style={{
                                    height: '140px',
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    marginBottom: '12px',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    border: '1.5px solid #94A3B8',
                                    background: '#07111E'
                                  }}
                                  title="Click to inspect original high-resolution scan & DICOM telemetry"
                                >
                                  <img 
                                    src={rep.realScanImage} 
                                    alt={rep.title} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    bottom: '6px',
                                    right: '6px',
                                    background: 'rgba(0, 0, 0, 0.14)',
                                    backdropFilter: 'blur(4px)',
                                    color: '#38BDF8',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    border: '1px solid rgba(56, 189, 248, 0.4)'
                                  }}>
                                    <span>View Original Scan</span>
                                  </div>
                                  <div style={{
                                    position: 'absolute',
                                    top: '6px',
                                    left: '6px',
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    background: 'rgba(15, 76, 92, 0.85)',
                                    color: '#E0F2FE',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    border: '1px solid #38BDF8'
                                  }}>
                                    SYNTHETIC
                                  </div>
                                </div>
                              )}

                              {/* Quantitative Metrics Snippet */}
                              {rep.quantitativeMetrics && rep.quantitativeMetrics.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', background: '#FAF8F5', padding: '10px', borderRadius: '10px', border: '1.5px solid #8FA8AE', marginBottom: '12px' }}>
                                  {rep.quantitativeMetrics.slice(0, 4).map((m, mIdx) => {
                                    const isNorm = m.status === 'Normal';
                                    const isHigh = m.status?.toLowerCase().includes('high') || m.status?.toLowerCase().includes('elevated') || m.status?.toLowerCase().includes('severe');
                                    return (
                                      <div key={mIdx} style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ color: '#698892', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.parameter}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                          <strong style={{ color: '#081C24', fontSize: '12px' }}>{m.result} {m.unit}</strong>
                                          <span style={{
                                            fontSize: '9px',
                                            fontWeight: 800,
                                            padding: '1px 5px',
                                            borderRadius: '4px',
                                            background: isNorm ? '#DCFCE7' : (isHigh ? '#FEE2E2' : '#FEF3C7'),
                                            color: isNorm ? '#15803D' : (isHigh ? '#B91C1C' : '#B45309')
                                          }}>
                                            {m.status}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Findings Snippet */}
                              <div style={{ fontSize: '12px', color: '#2C4A52', lineHeight: 1.45, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                <strong>Findings:</strong> {rep.findings}
                              </div>

                              {/* Impression */}
                              <div style={{
                                fontSize: '11.5px',
                                color: hasAbnormal ? '#991B1B' : '#065F46',
                                background: hasAbnormal ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                lineHeight: 1.35,
                                marginBottom: '14px',
                                border: hasAbnormal ? '1px solid #FECACA' : '1px solid #A7F3D0'
                              }}>
                                <strong>Impression:</strong> {rep.impression}
                              </div>
                            </div>

                            {/* Card Actions */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                              <button
                                onClick={() => setSelectedReport(rep)}
                                style={{
                                  flex: 1,
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: '1.5px solid #0F4C5C',
                                  background: 'transparent',
                                  color: '#0F4C5C',
                                  fontSize: '12px',
                                  fontWeight: 750,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                              >
                                <FileText size={13} />
                                <span>Inspect Lab / DICOM</span>
                              </button>

                              <button
                                onClick={() => handleExportFhir(rep)}
                                style={{
                                  padding: '8px 14px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: '#0A2540',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <Download size={13} />
                                <span>FHIR draft</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : reportsViewMode === 'by_patient' ? (
                /* VIEW 2: PATIENTS DIRECTORY (DEFAULT - AS REQUESTED BY USER) */
                <div>
                  {/* Category Filter Pills for Patient Directory */}
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '18px' }}>
                    {[
                      { key: 'all', label: `All Patients (${patientsWithReports.length})` },
                      { key: 'Radiology', label: 'Radiology' },
                      { key: 'Cardiology', label: 'Cardiology' },
                      { key: 'Hematology', label: 'Hematology' },
                      { key: 'Biochemistry', label: 'Biochemistry' },
                      { key: 'Microbiology', label: 'Microbiology' },
                      { key: 'Pulmonology', label: 'Pulmonology' }
                    ].map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => setReportCategoryFilter(cat.key)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: reportCategoryFilter === cat.key ? '1.5px solid #0F4C5C' : '1px solid #8FA8AE',
                          background: reportCategoryFilter === cat.key ? '#0F4C5C' : '#ffffff',
                          color: reportCategoryFilter === cat.key ? '#ffffff' : '#1F4550',
                          whiteSpace: 'nowrap',
                          boxShadow: reportCategoryFilter === cat.key ? '0 2px 8px rgba(0, 0, 0, 0.16)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Patient Cards List with Arrow at the end */}
                  {filteredPatientsWithReports.length === 0 ? (
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)' }}>
                      <p style={{ fontSize: '15px', color: '#698892', fontWeight: 600 }}>No patients found matching query "{reportSearchTerm}".</p>
                      <button onClick={() => { setReportSearchTerm(''); setReportCategoryFilter('all'); }} className="btn-outline" style={{ marginTop: '12px', padding: '6px 16px', fontSize: '12px' }}>
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {filteredPatientsWithReports.map(pat => {
                        const categoriesPresent = Array.from(new Set(pat.reports.map(r => r.category))).filter(Boolean);
                        const hasAbnormal = pat.reports.some(r => (r.quantitativeMetrics || []).some(m => m.status && m.status !== 'Normal'));

                        return (
                          <div
                            key={pat.id}
                            onClick={() => { setSelectedReportPatient(pat); setReportCategoryFilter('all'); }}
                            style={{
                              background: '#ffffff',
                              borderRadius: '16px',
                              padding: '18px 22px',
                              border: '1.5px solid #94A3B8',
                              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '16px',
                              flexWrap: 'wrap',
                              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.borderColor = '#0F4C5C';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(0, 0, 0, 0.10)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.borderColor = '#94A3B8';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.03)';
                            }}
                          >
                            {/* Left: Patient Avatar & Profile Details */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '280px' }}>
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: '#EEF6F8',
                                color: '#0F4C5C',
                                fontWeight: 800,
                                fontSize: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #D8EBEF',
                                flexShrink: 0
                              }}>
                                {pat.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <strong style={{ fontSize: '15.5px', color: '#081C24' }}>
                                    {pat.name}
                                  </strong>
                                  {pat.vernacular && pat.vernacular !== pat.name && (
                                    <span style={{ fontSize: '12px', color: '#0F4C5C', fontWeight: 700 }}>
                                      ({pat.vernacular})
                                    </span>
                                  )}
                                  {hasAbnormal && (
                                    <span style={{ fontSize: '10px', background: '#FEE2E2', color: '#B91C1C', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                      Needs Review
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', fontSize: '12px', color: '#698892' }}>
                                  <span>{pat.age} Yrs • {pat.genderLabel || pat.gender}</span>
                                  <span>•</span>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#486770' }}>
                                    <ShieldCheck size={13} color="#0D9488" />
                                    {pat.abhaId}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Center: Report Count & Modality Badges */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '240px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  background: pat.reports.length >= 3 ? '#EEF6F8' : '#FAF8F5',
                                  color: pat.reports.length >= 3 ? '#0F4C5C' : '#2C4A52',
                                  border: `1.5px solid ${pat.reports.length >= 3 ? '#0F4C5C' : '#8FA8AE'}`,
                                  padding: '3px 10px',
                                  borderRadius: '20px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  {pat.reports.length} {pat.reports.length === 1 ? 'Report Available' : 'Reports Available'}
                                </span>

                                {categoriesPresent.map(cat => (
                                  <span key={cat} style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    background: '#F1F5F9',
                                    color: '#486770',
                                    padding: '2px 8px',
                                    borderRadius: '6px'
                                  }}>
                                    {cat === 'Radiology' ? 'Radiology' :
                                     cat === 'Cardiology' ? 'Cardiology' :
                                     cat === 'Hematology' ? 'Hematology' :
                                     cat === 'Biochemistry' ? 'Biochemistry' :
                                     cat === 'Pulmonology' ? 'Pulmonology' : cat}
                                  </span>
                                ))}
                              </div>

                              <div style={{ fontSize: '11.5px', color: '#698892' }}>
                                <span style={{ color: '#0F4C5C', fontWeight: 650 }}>Latest:</span> {pat.reports[0].title} ({pat.reports[0].date})
                              </div>
                            </div>

                            {/* Right: ARROW IN THE LAST OF THEIR PROFILE (AS REQUESTED) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '9px 18px',
                                borderRadius: '24px',
                                border: '1.5px solid #0F4C5C',
                                background: '#EEF6F8',
                                color: '#0F4C5C',
                                fontSize: '13px',
                                fontWeight: 800,
                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                                transition: 'all 0.15s ease'
                              }}>
                                <span>View Reports ({pat.reports.length})</span>
                                <ArrowRight size={15} color="#0F4C5C" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* VIEW 3: ALL FLAT REPORTS GRID */
                <div>
                  {/* Category Filter Pills */}
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '18px' }}>
                    {[
                      { key: 'all', label: 'All Reports', count: recentReports.length },
                      { key: 'Radiology', label: 'Radiology & DICOM', count: recentReports.filter(r => r.category === 'Radiology').length },
                      { key: 'Cardiology', label: 'Cardiology & ECG', count: recentReports.filter(r => r.category === 'Cardiology').length },
                      { key: 'Hematology', label: 'Hematology', count: recentReports.filter(r => r.category === 'Hematology').length },
                      { key: 'Biochemistry', label: 'Biochemistry', count: recentReports.filter(r => r.category === 'Biochemistry').length },
                      { key: 'Microbiology', label: 'Microbiology', count: recentReports.filter(r => r.category === 'Microbiology' || r.category === 'Infectious').length },
                      { key: 'Pulmonology', label: 'Pulmonology & PFT', count: recentReports.filter(r => r.category === 'Pulmonology').length }
                    ].map(cat => (
                      <button
                        key={cat.key}
                        onClick={() => setReportCategoryFilter(cat.key)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: reportCategoryFilter === cat.key ? '1.5px solid #0F4C5C' : '1px solid #8FA8AE',
                          background: reportCategoryFilter === cat.key ? '#0F4C5C' : '#ffffff',
                          color: reportCategoryFilter === cat.key ? '#ffffff' : '#1F4550',
                          whiteSpace: 'nowrap',
                          boxShadow: reportCategoryFilter === cat.key ? '0 2px 8px rgba(0, 0, 0, 0.16)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {cat.label} <span style={{ opacity: 0.8, fontSize: '11px', marginLeft: '4px' }}>({cat.count})</span>
                      </button>
                    ))}
                  </div>

                  {filteredReports.length === 0 ? (
                    <div style={{ background: '#ffffff', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)' }}>
                      <p style={{ fontSize: '15px', color: '#698892', fontWeight: 600 }}>No diagnostic records matching query "{reportSearchTerm}" in {reportCategoryFilter} filter.</p>
                      <button onClick={() => { setReportSearchTerm(''); setReportCategoryFilter('all'); }} className="btn-outline" style={{ marginTop: '12px', padding: '6px 16px', fontSize: '12px' }}>
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '18px' }}>
                      {filteredReports.map(rep => {
                        const hasAbnormal = (rep.quantitativeMetrics || []).some(m => m.status && m.status !== 'Normal');
                        return (
                          <div
                            key={rep.id}
                            style={{
                              background: '#ffffff',
                              borderRadius: '16px',
                              padding: '20px',
                              border: '1.5px solid #94A3B8',
                              boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.04)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                  <span style={{ display:'inline-flex', color:'#0F4C5C' }}>{(rep.icon === '🩻' || rep.icon === '🫁') ? <Scan size={22} strokeWidth={1.7} /> : rep.icon === '🩸' ? <Droplets size={22} strokeWidth={1.7} /> : <FileText size={22} strokeWidth={1.7} />}</span>
                                  <div>
                                    <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#081C24', lineHeight: 1.3 }}>{rep.title}</div>
                                    <div style={{ fontSize: '11.5px', color: '#698892', marginTop: '2px' }}>
                                      {rep.modality} • {rep.date}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                  <span 
                                    onClick={() => {
                                      const matchedPat = patientsWithReports.find(p => p.name.toLowerCase() === rep.patient?.toLowerCase());
                                      if (matchedPat) {
                                        setSelectedReportPatient(matchedPat);
                                      }
                                    }}
                                    style={{ fontSize: '10.5px', background: '#FAF8F5', color: '#0F4C5C', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', border: '1px solid #8FA8AE' }}
                                    title="Click to view all reports for this patient"
                                  >
                                    {rep.patient} →
                                  </span>
                                  {rep.loincCode && (
                                    <span style={{ fontSize: '9.5px', color: '#0F4C5C', fontWeight: 750, fontFamily: 'monospace' }}>
                                      LOINC: {rep.loincCode}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Original Diagnostic Scan Thumbnail Preview */}
                              {rep.realScanImage && (
                                <div 
                                  onClick={() => setSelectedReport(rep)}
                                  style={{
                                    height: '140px',
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    marginBottom: '12px',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    border: '1.5px solid #94A3B8',
                                    background: '#07111E'
                                  }}
                                  title="Click to inspect original high-resolution scan & DICOM telemetry"
                                >
                                  <img 
                                    src={rep.realScanImage} 
                                    alt={rep.title} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    bottom: '6px',
                                    right: '6px',
                                    background: 'rgba(0, 0, 0, 0.14)',
                                    backdropFilter: 'blur(4px)',
                                    color: '#38BDF8',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    border: '1px solid rgba(56, 189, 248, 0.4)'
                                  }}>
                                    <span>View Original Scan</span>
                                  </div>
                                  <div style={{
                                    position: 'absolute',
                                    top: '6px',
                                    left: '6px',
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    background: 'rgba(15, 76, 92, 0.85)',
                                    color: '#E0F2FE',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    border: '1px solid #38BDF8'
                                  }}>
                                    SYNTHETIC
                                  </div>
                                </div>
                              )}

                              {rep.quantitativeMetrics && rep.quantitativeMetrics.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', background: '#FAF8F5', padding: '10px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.06)', marginBottom: '12px' }}>
                                  {rep.quantitativeMetrics.slice(0, 4).map((m, mIdx) => {
                                    const isNorm = m.status === 'Normal';
                                    const isHigh = m.status?.toLowerCase().includes('high') || m.status?.toLowerCase().includes('elevated') || m.status?.toLowerCase().includes('severe');
                                    return (
                                      <div key={mIdx} style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                        <div style={{ color: '#698892', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.parameter}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                          <strong style={{ color: '#081C24', fontSize: '12px' }}>{m.result} {m.unit}</strong>
                                          <span style={{
                                            fontSize: '9px',
                                            fontWeight: 800,
                                            padding: '1px 5px',
                                            borderRadius: '4px',
                                            background: isNorm ? '#DCFCE7' : (isHigh ? '#FEE2E2' : '#FEF3C7'),
                                            color: isNorm ? '#15803D' : (isHigh ? '#B91C1C' : '#B45309')
                                          }}>
                                            {m.status}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              <div style={{ fontSize: '12px', color: '#2C4A52', lineHeight: 1.45, marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                <strong>Findings:</strong> {rep.findings}
                              </div>

                              <div style={{
                                fontSize: '11.5px',
                                color: hasAbnormal ? '#991B1B' : '#065F46',
                                background: hasAbnormal ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                lineHeight: 1.35,
                                marginBottom: '14px'
                              }}>
                                <strong>Impression:</strong> {rep.impression}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                              <button
                                onClick={() => setSelectedReport(rep)}
                                style={{
                                  flex: 1,
                                  padding: '8px 10px',
                                  borderRadius: '8px',
                                  border: '1.5px solid #0F4C5C',
                                  background: 'transparent',
                                  color: '#0F4C5C',
                                  fontSize: '12px',
                                  fontWeight: 750,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px'
                                }}
                              >
                                <FileText size={13} />
                                <span>Inspect Lab / DICOM</span>
                              </button>

                              <button
                                onClick={() => handleExportFhir(rep)}
                                style={{
                                  padding: '8px 14px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  background: '#0A2540',
                                  color: '#ffffff',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <Download size={13} />
                                <span>FHIR draft</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------------------
              TAB 6: PRESCRIPTIONS (E-RX, NFI FORMULARY & BLISTER SCANNER)
              --------------------------------------------------------------------- */}
          {activeTab === 'prescriptions' && (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#081C24', fontFamily: 'var(--font-main)' }}>
                      E-Prescription Drafts, Sample Generic Comparisons & AyuVision Lens
                    </h2>
                    <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(0, 0, 0, 0.08)', color: '#0F4C5C', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.16)' }}>
                      Bundled sample references
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#698892' }}>
                    Bundled sample comparisons for medicine packaging and prescription text demos; the lens does not read uploaded images. No live price, stock, formulary or substitution check.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      const sample = ocrSamples[0];
                      setPrintableRxData({
                        patientName: 'Narayana Rao',
                        vernacularName: 'నారాయణ రావు',
                        abhaId: 'DEMO-ABHA-0000-1049',
                        age: 58,
                        gender: 'Male',
                        diagnosis: 'Type-2 Diabetes Mellitus & Dyslipidemia (E11.9)',
                        vitals: 'BP: 140/90 mmHg, HR: 88 bpm, RBS: 168 mg/dL',
                        date: new Date().toLocaleDateString('en-GB'),
                        medications: [
                          { name: 'Pantoprazole 40mg (పసుపు గోళీ)', timing: '08:30 AM (టిఫిన్ ముందు)', days: '30 Days', generic: 'Pantoprazole 40mg (bundled sample reference, not live-checked)' },
                          { name: 'Metformin 500mg SR (గులాబీ గోళీ)', timing: '08:30 PM (భోజనం తర్వాత)', days: '30 Days', generic: 'Metformin 500mg SR (bundled sample reference, not live-checked)' }
                        ]
                      });
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      background: '#ffffff',
                      color: '#081C24',
                      fontSize: '12.5px',
                      fontWeight: 750,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FileText size={14} color="#0F4C5C" />
                    <span>Print Demo Rx Preview</span>
                  </button>
                </div>
              </div>

              {/* AyuVision Blister Lens Studio (bundled demo comparisons) */}
              <div style={{
                background: '#0F4C5C',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '22px 26px',
                marginBottom: '22px',
                border: '1px solid #1E293B',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.10)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#38BDF8', color: '#081C24', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Scan size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: isMobileScreen ? '14px' : '16px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                        AyuVision™ Blister Pack & Prescription Lens — Bundled Demos
                      </h3>
                      <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                        Bundled sample comparisons for packaging demos only; the lens does not read uploaded images. No live price, stock, formulary or substitution check.
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '11px', background: ocrMode === 'camera' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.2)', color: ocrMode === 'camera' ? '#34D399' : '#38BDF8', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                    {ocrMode === 'camera' ? 'LIVE CAMERA PREVIEW' : ocrMode === 'upload' ? 'UPLOADED PREVIEW - NOT READ' : 'NFI FORMULARY PRESETS'}
                  </span>
                </div>

                {/* 3-Way Mode Switcher: Presets, Live Camera, Upload */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      stopOcrCamera();
                      setOcrMode('samples');
                      setCustomOcrResult(null);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 750,
                      cursor: 'pointer',
                      border: ocrMode === 'samples' ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.2)',
                      background: ocrMode === 'samples' ? '#38BDF8' : 'rgba(255,255,255,0.08)',
                      color: ocrMode === 'samples' ? '#0A2540' : '#8FA8AE',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Formulary Presets (8)</span>
                  </button>

                  <button
                    type="button"
                    onClick={startOcrCamera}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 750,
                      cursor: 'pointer',
                      border: ocrMode === 'camera' ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.2)',
                      background: ocrMode === 'camera' ? '#10B981' : 'rgba(255,255,255,0.08)',
                      color: ocrMode === 'camera' ? '#ffffff' : '#8FA8AE',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Camera size={14} />
                    <span>Live Camera Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopOcrCamera();
                      if (ocrFileInputRef.current) {
                        ocrFileInputRef.current.click();
                      }
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 750,
                      cursor: 'pointer',
                      border: ocrMode === 'upload' ? '1.5px solid #F59E0B' : '1px solid rgba(255,255,255,0.2)',
                      background: ocrMode === 'upload' ? '#F59E0B' : 'rgba(255,255,255,0.08)',
                      color: ocrMode === 'upload' ? '#0A2540' : '#8FA8AE',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Upload size={14} />
                    <span>Upload Strip / Rx Photo</span>
                  </button>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={ocrFileInputRef}
                    accept="image/*"
                    onChange={handleOcrFileUpload}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Instant Medicine Search Filter */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '14px',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  border: '1px solid rgba(255,255,255,0.15)'
                }}>
                  <Search size={15} color="#38BDF8" />
                  <input
                    type="text"
                    value={ocrSearchQuery}
                    onChange={(e) => setOcrSearchQuery(e.target.value)}
                    placeholder="Search any medicine name, salt, or indication (e.g., Telma, Dolo, Augmentin, Atorva, Allergy)..."
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      outline: 'none',
                      width: '100%'
                    }}
                  />
                  {ocrSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setOcrSearchQuery('')}
                      style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Sample Presets Selection Bar (Filtered by Search Query) */}
                {ocrMode === 'samples' && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 750 }}>Select Bundled Sample:</span>
                    {ocrSamples
                      .filter(s => !ocrSearchQuery || s.title.toLowerCase().includes(ocrSearchQuery.toLowerCase()) || s.genericSalt.toLowerCase().includes(ocrSearchQuery.toLowerCase()))
                      .map((sample, sIdx) => {
                        const actualIdx = ocrSamples.findIndex(x => x.id === sample.id);
                        return (
                          <button
                            key={sample.id}
                            onClick={() => triggerOcrScan(actualIdx)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '16px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: ocrSampleIdx === actualIdx && !customOcrResult ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.2)',
                              background: ocrSampleIdx === actualIdx && !customOcrResult ? '#38BDF8' : 'rgba(255,255,255,0.08)',
                              color: ocrSampleIdx === actualIdx && !customOcrResult ? '#0A2540' : '#8FA8AE',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {sample.title}
                          </button>
                        );
                      })}
                  </div>
                )}

                {/* Lens Viewport & Bundled Comparison Grid */}
                <div className="ayuvision-ocr-grid" style={{ display: 'grid', gridTemplateColumns: isMobileScreen ? '1fr' : '1.1fr 1.4fr', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
                  {/* Scanner Visual Box */}
                  <div style={{
                    background: '#0B132B',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '260px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    {/* Loading overlay: bundled demo comparison lookup (no scanning occurs) */}
                    {isOcrScanning && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: 'rgba(8, 19, 43, 0.72)',
                        zIndex: 10
                      }}>
                        <span className="ayu-loadring" style={{ width: '68px', height: '68px' }}>
                          <svg viewBox="0 0 68 68" aria-hidden="true"><circle className="ayu-ring-bg" cx="34" cy="34" r="30"/><circle className="ayu-ring-fg" cx="34" cy="34" r="30" style={{ strokeDasharray: '53 136' }}/></svg>
                          <img
                            src="/assets/icons/sheet/load-upload.png"
                            alt=""
                            aria-hidden="true"
                            className="ayu-loadart-loop"
                            style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                          />
                        </span>
                        <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#FBBF24', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                          LOADING DEMO COMPARISON...
                        </span>
                      </div>
                    )}

                    {/* Viewport Content based on Mode */}
                    {ocrMode === 'camera' ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '11px', color: '#34D399', fontWeight: 750, fontFamily: 'monospace' }}>
                            CAMERA PREVIEW - NOT READ BY LENS
                          </span>
                          <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.25)', color: '#34D399', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                            LIVE FEED
                          </span>
                        </div>

                        {ocrCameraError ? (
                          <div style={{ padding: '20px 14px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#FCA5A5', marginBottom: '10px' }}>
                              {ocrCameraError}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                stopOcrCamera();
                                ocrFileInputRef.current?.click();
                              }}
                              style={{ padding: '6px 14px', borderRadius: '8px', background: '#38BDF8', color: '#081C24', border: 'none', fontWeight: 750, fontSize: '11px', cursor: 'pointer' }}
                            >
                              Upload Strip Image Instead
                            </button>
                          </div>
                        ) : (
                          <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: '#000000', minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <video
                              ref={ocrVideoRef}
                              autoPlay
                              playsInline
                              muted
                              style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                            />
                            {/* Scanning Targeting Frame Overlay */}
                            <div style={{
                              position: 'absolute',
                              top: '15%',
                              left: '10%',
                              right: '10%',
                              bottom: '15%',
                              border: '2px dashed #38BDF8',
                              borderRadius: '8px',
                              pointerEvents: 'none'
                            }}>
                              <span style={{ position: 'absolute', bottom: '6px', left: '8px', fontSize: '10px', color: '#38BDF8', fontWeight: 800 }}>
                                PREVIEW ONLY - NOT READ
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : ocrMode === 'upload' && capturedOcrImage ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 750, fontFamily: 'monospace' }}>
                            {isOcrScanning ? 'LOADING DEMO COMPARISON...' : 'UPLOADED IMAGE - LOCAL PREVIEW'}
                          </span>
                          <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                            DEMO
                          </span>
                        </div>
                        <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: '#000000', maxHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img
                            src={capturedOcrImage}
                            alt="Captured medicine strip"
                            style={{ width: '100%', maxHeight: '180px', objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Presets Feed */
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 750, fontFamily: 'monospace' }}>
                            SAMPLE PREVIEW • {(customOcrResult || ocrSamples[ocrSampleIdx]).type}
                          </span>
                          <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', padding: '2px 6px', borderRadius: '4px' }}>
                            DEMO
                          </span>
                        </div>

                        {/* Sample Details Card */}
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '14px', border: '1px dashed #38BDF8', position: 'relative' }}>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                            {(customOcrResult || ocrSamples[ocrSampleIdx]).brandName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '6px' }}>
                            {(customOcrResult || ocrSamples[ocrSampleIdx]).genericSalt}
                          </div>
                          <div style={{ fontSize: '11px', color: '#38BDF8', fontFamily: 'monospace' }}>
                            BATCH: {(customOcrResult || ocrSamples[ocrSampleIdx]).batchNo} • EXP: {(customOcrResult || ocrSamples[ocrSampleIdx]).expDate} (illustrative - not verified)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Viewport Action Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '10.5px', color: '#698892' }}>
                        Demo lens - bundled sample comparisons only
                      </span>

                      {ocrMode === 'camera' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={captureCameraFrame}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              background: '#10B981',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Camera size={13} />
                            <span>Capture & Load Demo</span>
                          </button>
                          <button
                            type="button"
                            onClick={stopOcrCamera}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: 'rgba(255,255,255,0.1)',
                              color: '#ffffff',
                              border: '1px solid rgba(255,255,255,0.2)',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            Stop
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (ocrMode === 'upload' && capturedOcrImage) {
                              processOcrImage(capturedOcrImage, 'the uploaded image');
                            } else {
                              triggerOcrScan(ocrSampleIdx);
                            }
                          }}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            background: '#0F4C5C',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {isOcrScanning ? 'Loading demo...' : 'Load Demo Comparison'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bundled sample comparison & Jan Aushadhi reference (hidden while a demo loads) */}
                  {!isOcrScanning && (() => {
                    const activeItem = customOcrResult || ocrSamples[ocrSampleIdx];
                    const savingsAmount = (activeItem.brandMrp != null && activeItem.janAushadhiPrice != null) ? activeItem.brandMrp - activeItem.janAushadhiPrice : null;

                    return (
                      <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px 18px', color: '#081C24', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', color: '#698892', fontWeight: 750, textTransform: 'uppercase' }}>
                              Bundled Sample Composition (Demo)
                            </span>
                            <span style={{ fontSize: '11px', background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '6px', fontWeight: 750 }}>
                              Bundled sample reference
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#92400E', background: '#FEF3C7', padding: '5px 8px', borderRadius: '6px', marginBottom: '8px', fontWeight: 650 }}>
                            Bundled demonstration sample - not extracted from any uploaded or captured image.
                          </div>

                          <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#081C24', margin: '0 0 4px 0' }}>
                            {activeItem.genericSalt}
                          </h4>
                          <div style={{ fontSize: '12px', color: '#486770', marginBottom: '8px' }}>
                            <strong>Indications:</strong> {activeItem.indications}
                          </div>
                          {activeItem.contraindication && (
                            <div style={{ fontSize: '11px', color: '#B45309', background: '#FFFBEB', padding: '4px 8px', borderRadius: '6px', marginBottom: '8px' }}>
                              <AlertTriangle size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} /><strong>Precaution:</strong> {activeItem.contraindication}
                            </div>
                          )}

                          {/* Jan Aushadhi reference box: rendered only when an exact curated generic reference exists */}
                          {activeItem.janAushadhiGeneric ? (
                          <div style={{ background: '#F0FDF4', borderRadius: '10px', padding: '10px 12px', border: '1px solid #BBF7D0', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ fontSize: '10.5px', color: '#166534', fontWeight: 750 }}>Jan Aushadhi generic reference (bundled sample, not live-checked):</div>
                                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#15803D' }}>{activeItem.janAushadhiGeneric}</div>
                              </div>

                            </div>
                            <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                              Bundled sample reference; no price shown. Verify current price, stock and eligibility at a Jan Aushadhi Kendra.
                            </div>
                          </div>
                          ) : (
                            <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '10px 12px', border: '1px solid #8FA8AE', marginBottom: '10px', fontSize: '11.5px', color: '#475569' }}>
                              {activeItem.noSinglePackGeneric || 'No exact generic reference for this item in the bundled sample formulary.'}
                            </div>
                          )}

                          {/* Vernacular Spoken Tip */}
                          <div style={{ fontSize: '11.5px', color: '#0369A1', background: '#E0F2FE', padding: '6px 10px', borderRadius: '6px', fontWeight: 650 }}>
                            <strong>తెలుగు సూచన:</strong> {activeItem.vernacularSummary}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          {activeItem.janAushadhiGeneric && (
                          <button
                            type="button"
                            onClick={() => {
                              setPrintableRxData({
                                patientName: 'Lakshmi Amma',
                                age: 58,
                                gender: 'Female',
                                doctorName: doctorProfile?.doctorName || 'Dr. Demo Clinician (synthetic)',
                                registrationNumber: 'DEMO-REVIEWER-2026',
                                date: new Date().toLocaleDateString('en-GB'),
                                medications: [
                                  {
                                    name: `${activeItem.genericSalt}`,
                                    timing: activeItem.vernacularSummary,
                                    days: '30 Days',
                                    generic: `${activeItem.janAushadhiGeneric} (bundled sample reference, not live-checked)`
                                  }
                                ]
                              });
                              setFhirToast(`Added bundled sample generic reference to the draft prescription. Verify against a current formulary before sign-off.`);
                              setTimeout(() => setFhirToast(null), 4000);
                            }}
                            className="btn-primary"
                            style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                          >
                            Add generic reference to draft Rx
                          </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Active Prescriptions Table */}
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', padding: '22px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', margin: 0 }}>
                    Today's Active Regimens & Patient Dispatches
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', background: '#DCFCE7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontWeight: 750, border: '1px solid #BBF7D0' }}>
                      Sample rule check: no conflicts flagged in bundled sample data
                    </span>
                    <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: '12px', fontWeight: 750 }}>
                      Bundled sample reference
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { id: 1, patient: 'Narayana Rao', vernacular: 'నారాయణ రావు', phone: '+91 00000 00003', abhaId: 'DEMO-ABHA-0000-1049', lang: 'te', med: 'Pantoprazole 40mg + Metformin 500mg', schedule: 'Morning (08:30 AM) + Post-dinner (08:30 PM)', status: 'Active • Telugu sample audio preview' },
                    { id: 2, patient: 'Aarav Kumar', vernacular: 'आरव कुमार', phone: '+91 00000 00004', abhaId: 'DEMO-8821-4432-9012', lang: 'hi', med: 'Budesonide Nebulization (0.5mg) + Salbutamol', schedule: 'BD (Morning 08:30 AM & Night 08:30 PM)', status: 'Active • Hindi sample audio preview' },
                    { id: 3, patient: 'Ananya Rao', vernacular: 'అనన్య రావు', phone: '+91 00000 00005', abhaId: 'DEMO-ABHA-0000-1047', lang: 'te', med: 'Montelukast 10mg + Levocetirizine', schedule: 'Night at bedtime (09:30 PM)', status: 'Active • sample preview' }
                  ].map(rx => (
                    <div
                      key={rx.id}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: '#FAF8F5',
                        border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#081C24' }}>{rx.patient}</span>
                          <span style={{ fontSize: '12px', color: '#0F4C5C', fontWeight: 700 }}>({rx.vernacular})</span>
                          <span style={{ fontSize: '11px', color: '#698892' }}>• {rx.phone}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#0F4C5C', fontWeight: 700, marginTop: '2px' }}>{rx.med}</div>
                        {(() => {
                          const jan = getJanAushadhiGenericInfo(rx.med);
                          if (!jan) return null;
                          return (
                            <div style={{
                              fontSize: '11px',
                              color: '#475569',
                              marginTop: '5px',
                              background: '#F8FAFC',
                              border: '1px solid #8FA8AE',
                              borderRadius: '6px',
                              padding: '4px 8px'
                            }}>
                              Jan Aushadhi generic reference: <span style={{ fontWeight: 700, color: '#14532D' }}>{jan.genericName}</span> ({jan.nlemCeiling})
                            </div>
                          );
                        })()}
                        <div style={{ fontSize: '11.5px', color: '#698892', marginTop: '2px' }}>Timing: {rx.schedule}</div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#059669', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '8px', fontWeight: 700 }}>
                          {rx.status}
                        </span>

                        <button
                          onClick={() => {
                            const med1 = rx.med.split('+')[0]?.trim() || rx.med;
                            const med2 = rx.med.includes('+') ? rx.med.split('+')[1]?.trim() : null;
                            const jan1 = getJanAushadhiGenericInfo(med1);
                            const jan2 = med2 ? getJanAushadhiGenericInfo(med2) : null;
                            
                            setPrintableRxData({
                              patientName: rx.patient,
                              vernacularName: rx.vernacular,
                              abhaId: rx.abhaId,
                              age: 42,
                              gender: 'Male',
                              diagnosis: 'Clinical Consultation & Prescription (Demo)',
                              vitals: 'BP: 120/80 mmHg, HR: 76 bpm, SpO2: 98%',
                              date: new Date().toLocaleDateString('en-GB'),
                              medications: [
                                { 
                                  name: med1, 
                                  timing: rx.schedule.split('+')[0]?.trim() || 'Morning (After Food)', 
                                  days: '30 Days', 
                                  generic: jan1 ? `${jan1.genericName} (bundled sample reference, not live-checked)` : null 
                                },
                                ...((jan2 && med2) ? [{ 
                                  name: med2, 
                                  timing: rx.schedule.split('+')[1]?.trim() || 'Night (After Food)', 
                                  days: '30 Days', 
                                  generic: `${jan2.genericName} (bundled sample reference, not live-checked)` 
                                }] : [])
                              ]
                            });
                          }}
                          style={{
                            padding: '7px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            background: '#ffffff',
                            color: '#2C4A52',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FileText size={13} />
                          <span>Print Slip</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAudioRxModal(rx);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 14px',
                            borderRadius: '8px',
                            background: '#0E7A3D',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                          }}
                        >
                          <Send size={13} />
                          <span>WhatsApp Audio-Rx</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------------
              TAB 7: CLINICAL LIBRARY (WHO ICD-10 & VERNACULAR ONTOLOGY)
              --------------------------------------------------------------------- */}
          {activeTab === 'clinical_library' && (
            <DoctorClinicalLibraryTab onShowToast={(msg) => { setFhirToast(msg); setTimeout(() => setFhirToast(null), 3000); }} />
          )}

          {/* ---------------------------------------------------------------------
              TAB 8: SETTINGS (ABDM HPR CREDENTIALS & HARDWARE CALIBRATION)
              --------------------------------------------------------------------- */}
          {activeTab === 'settings' && (
            <div>
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderLeft: '4px solid #1B3A55',
                borderRadius: '16px',
                padding: '20px 22px',
                color: '#0F172A',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: '#FAF8F5',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.4px',
                      textTransform: 'uppercase',
                      color: '#92400E',
                      border: '1px solid #E7D9BC'
                    }}>
                      Synthetic clinician profile • demo
                    </span>
                    <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600 }}>Demo console - no registry verification claimed</span>
                  </div>
                  <h2 style={{ fontSize: 'clamp(17px, 4.8vw, 22px)', fontWeight: 750, fontFamily: 'var(--font-display, var(--font-main))', margin: '0 0 6px 0', color: '#1B3A55', letterSpacing: '-0.02em' }}>
                    Physician Demo Console, AI Scribe & Draft Record Settings
                  </h2>
                  <p style={{ fontSize: '13.5px', color: '#475569', margin: 0, maxWidth: '680px', lineHeight: 1.55, fontWeight: 500 }}>
                    Configure demo speech services, draft coding review, record export and clinician preferences. External speech availability and live registry/signing exchange are separately verified before any claim.
                  </p>
                </div>

                <button
                  onClick={saveDoctorPreferences}
                  className="btn-primary"
                  style={{ padding: '12px 24px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <ShieldCheck size={16} />
                  <span>Save preferences</span>
                </button>
              </div>

              {/* Toast Feedback */}
              {docSettingsSaved && (
                <div style={{ 
                  background: '#ECFDF5', 
                  border: '1.5px solid #10B981', 
                  borderRadius: '12px', 
                  padding: '14px 20px', 
                  marginBottom: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  color: '#065F46',
                  fontSize: '13.5px',
                  fontWeight: 700
                }}>
                  <CheckCircle2 size={20} color="#10B981" />
                  <span>Preferences saved on this device for this demo account. No registry, signing or external service sync is claimed.</span>
                </div>
              )}

              {/* Authentic ABDM HPR Doctor Smart Card & QR Inspector */}
              <div style={{ marginBottom: '24px' }}>
                <AbhaDigitalCard 
                  isDoctorMode={true}
                  doctor={{
                    doctorName: doctorName,
                    vernacular: 'డాక్టర్ ప్రియా శర్మ',
                    hprId: 'DEMO-dr.priya@hpr.abdm',
                    abhaNumber: 'DEMO-91-6742-8921-9942',
                    nmcRegNo: 'DEMO-DEMO-NMC-0000',
                    specialty: doctorSpecialty,
                    facility: doctorProfile?.facility || 'Synthetic Demo Facility (DEMO-FACILITY-2026)',
                    avatar: '/assets/dr_ananya_avatar.jpg'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
                {/* 1. ABDM HPR Registry */}
                <div style={{ background: '#ffffff', borderRadius: '16px', padding: '22px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} color="#0F4C5C" />
                    <span>Synthetic clinician profile • demo [DEMO]</span>
                  </h3>
                  <div style={{ fontSize: '13px', color: '#486770', lineHeight: 1.8 }}>
                    <div>Practitioner Name: <strong>{doctorName}</strong></div>
                    <div>HPR Token ID: <code>DEMO-ABHA-HPR-8921-9942-IN</code></div>
                    <div>Medical Council: <strong>DEMO National Medical Commission (NMC) AP-67420</strong></div>
                    <div>Facility: <strong>{doctorProfile?.facility || 'Synthetic Demo Facility (DEMO-FACILITY-2026)'}</strong></div>
                    <div>External registry status: <span style={{ color: '#B45309', fontWeight: 750 }}>Not connected • demo identifiers only</span></div>
                  </div>
                </div>

                {/* 2. Microphone & AudioWorklet VAD Calibration */}
                <div style={{ background: '#ffffff', borderRadius: '16px', padding: '22px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mic size={18} color="#2563EB" />
                    <span>Microphone & Acoustic VAD Calibration</span>
                  </h3>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#081C24', marginBottom: '4px' }}>
                      Clinical Ambient Scribe Engine
                    </label>
                    <select
                      value={docScribeEngine}
                      onChange={e => setDocScribeEngine(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '12.5px', fontWeight: 650 }}
                    >
                      <option value="browser_speech">Configured speech service (availability tested separately)</option>
                      <option value="google_medlm" disabled>External clinical model (not configured)</option>
                      <option value="whisper_indic" disabled>Research speech model (not bundled)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#081C24', marginBottom: '4px' }}>
                      Acoustic Noise Floor Profile
                    </label>
                    <select
                      value={docNoiseCancellation}
                      onChange={e => setDocNoiseCancellation(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '12.5px', fontWeight: 650 }}
                    >
                      <option value="crowded_opd">OPD ambient setting (saved preference; DSP effect unverified)</option>
                      <option value="quiet_chamber">Low ambient setting (saved preference; DSP effect unverified)</option>
                      <option value="icu_ward">High ambient setting (saved preference; DSP effect unverified)</option>
                    </select>
                  </div>

                  <div style={{ fontSize: '12px', color: '#698892' }}>
                    Capture format: <strong>device/browser dependent</strong> • Speaker separation: <strong style={{ color: '#B45309' }}>not verified on Android</strong>
                  </div>
                </div>

                {/* 3. Clinical AI Guardrails & Auto-Coding */}
                <div style={{ background: '#ffffff', borderRadius: '16px', padding: '22px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Stethoscope size={18} color="#059669" />
                    <span>Clinical Guardrails & Auto-Coding</span>
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24' }}>Clinical code draft suggestions</div>
                        <div style={{ fontSize: '11px', color: '#698892' }}>Prototype draft suggestions only; clinician review is required and billing-code validation is not claimed.</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={docAutoCoding}
                        onChange={e => setDocAutoCoding(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#0F4C5C', cursor: 'pointer' }}
                      />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24' }}>Interaction-review reminder</div>
                        <div style={{ fontSize: '11px', color: '#698892' }}>Prototype draft reminder only; not a validated medication-safety clearance.</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={docDdiSentinel}
                        onChange={e => setDocDdiSentinel(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#DC2626', cursor: 'pointer' }}
                      />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24' }}>Generic-comparison examples</div>
                        <div style={{ fontSize: '11px', color: '#698892' }}>Show bundled generic-comparison examples; no current price, stock, or substitution advice.</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={docGenericPref}
                        onChange={e => setDocGenericPref(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                      />
                    </label>
                  </div>
                </div>

                {/* 4. Digital Signature & Patient Push */}
                <div style={{ background: '#ffffff', borderRadius: '16px', padding: '22px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCheck size={18} color="#D97706" />
                    <span>Document & dispatch status</span>
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24' }}>Demo sign-off marker</div>
                        <div style={{ fontSize: '11px', color: '#698892' }}>Local demo marker only; no PKI credential, official prescription, or registry verification.</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={docDigitalSign}
                        onChange={e => setDocDigitalSign(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#D97706', cursor: 'pointer' }}
                      />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24' }}>External registry sync (not connected)</div>
                        <div style={{ fontSize: '11px', color: '#698892' }}>Unavailable in this build; FHIR-format research export is local only.</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={false}
                        disabled
                        style={{ width: '18px', height: '18px', accentColor: '#059669', cursor: 'pointer' }}
                      />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24' }}>WhatsApp dispatch (not connected)</div>
                        <div style={{ fontSize: '11px', color: '#698892' }}>Unavailable in this build; no message or audio is sent.</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={false}
                        disabled
                        style={{ width: '18px', height: '18px', accentColor: '#2563EB', cursor: 'pointer' }}
                      />
                    </label>
                  </div>
                </div>

                {/* 5. ABDM Milestone 1, 2, 3 Engineering Whitepaper & Certification Dossier */}
                <div style={{ 
                  gridColumn: '1 / -1',
                  background: '#0F4C5C', 
                  borderRadius: '16px', 
                  padding: '24px 28px', 
                  border: '1px solid rgba(255, 255, 255, 0.15)', 
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.10)',
                  color: '#ffffff',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '20px'
                }}>
                  <div style={{ maxWidth: '650px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(52, 211, 153, 0.15)', color: '#6EE7B7', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, marginBottom: '10px' }}>
                      <ShieldCheck size={14} />
                      <span>EXTERNAL INTEGRATION STATUS • NOT CERTIFIED</span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 850, margin: '0 0 6px 0', color: '#ffffff' }}>
                      Prototype integration status report
                    </h3>
                    <p style={{ fontSize: '13px', color: '#8FA8AE', lineHeight: 1.55, margin: '0 0 14px 0' }}>
                      Prototype status report describing which external registry, signing, dispatch, and offline integrations are connected, unavailable, or still unverified.
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11.5px', background: 'rgba(255, 255, 255, 0.08)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                        External registry: not connected
                      </span>
                      <span style={{ fontSize: '11.5px', background: 'rgba(255, 255, 255, 0.08)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                        FHIR export: research draft only
                      </span>
                      <span style={{ fontSize: '11.5px', background: 'rgba(255, 255, 255, 0.08)', padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                        Offline queue: local prototype
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '220px' }}>
                    <button
                      onClick={downloadAbdmWhitepaper}
                      style={{
                        background: '#C2550F',
                        color: '#ffffff',
                        border: '1px solid #9A4208',
                        borderRadius: '10px',
                        padding: '11px 16px',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Download size={15} />
                      <span>Download integration status (.txt)</span>
                    </button>

                    <button
                      onClick={printAbdmDossier}
                      style={{
                        background: 'rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        borderRadius: '10px',
                        padding: '11px 16px',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Printer size={15} />
                      <span>Print prototype status (A4)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Toast Notification for local FHIR research draft export */}
      {fhirToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0A2540',
          color: '#ffffff',
          padding: '14px 20px',
          borderRadius: '12px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          fontWeight: 650,
          border: '1px solid #10B981',
          maxWidth: '480px',
          animation: 'slideUp 0.25s ease'
        }}>
          <CheckCircle2 size={20} color="#10B981" style={{ flexShrink: 0 }} />
          <span>{fhirToast}</span>
        </div>
      )}

      {/* Comprehensive Diagnostic & DICOM Inspection Modal */}
      {selectedReport && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.14)',
          backdropFilter: 'blur(4px)',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            width: '840px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            borderRadius: '18px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}>
            {/* Diagnostic Letterhead Header */}
            <div style={{
              background: '#0F4C5C',
              color: '#ffffff',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '3px solid #0F4C5C'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ display:'inline-flex', color:'#0F4C5C' }}>{(selectedReport.icon === '🩻' || selectedReport.icon === '🫁') ? <Scan size={22} strokeWidth={1.7} /> : selectedReport.icon === '🩸' ? <Droplets size={22} strokeWidth={1.7} /> : <FileText size={22} strokeWidth={1.7} />}</span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.2px', margin: 0, color: '#ffffff' }}>
                    {selectedReport.title}
                  </h3>
                </div>
                <div style={{ fontSize: '11.5px', color: '#94A3B8', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span>{selectedReport.facility || 'Synthetic Demo Diagnostic Center'}</span>
                  <span>•</span>
                  <span>LOINC: <strong style={{ color: '#38BDF8', fontFamily: 'monospace' }}>{selectedReport.loincCode || '36572-6'}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#94A3B8',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}>
                  Standard LOINC / FHIR Diagnostic Schema
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  background: 'rgba(15, 76, 92, 0.2)',
                  color: '#38BDF8',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid rgba(56, 189, 248, 0.4)'
                }}>
                  SYNTHETIC DEMO REPORT
                </span>
                <button
                  onClick={() => setSelectedReport(null)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#ffffff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
 ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Patient & Specimen Demographics Strip */}
              <div style={{
                background: '#FAF8F5',
                border: '1.5px solid #8FA8AE',
                boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                fontSize: '12px'
              }}>
                <div>
                  <div style={{ color: '#698892', fontSize: '11px' }}>Patient Name</div>
                  <strong style={{ color: '#081C24', fontSize: '13px' }}>{selectedReport.patient}</strong>
                  <div style={{ color: '#698892', fontSize: '10.5px' }}>{selectedReport.age || 42} Y / {selectedReport.gender || 'Male'}</div>
                </div>
                <div>
                  <div style={{ color: '#698892', fontSize: '11px' }}>ABHA Address</div>
                  <strong style={{ color: '#081C24', fontFamily: 'monospace', fontSize: '12px' }}>{selectedReport.abhaId || 'DEMO-ABHA-0000-1049'}</strong>
                  <div style={{ color: '#059669', fontSize: '10.5px', fontWeight: 700 }}>Demo ID • not verified</div>
                </div>
                <div>
                  <div style={{ color: '#698892', fontSize: '11px' }}>Modality & Accession</div>
                  <strong style={{ color: '#081C24' }}>{selectedReport.modality}</strong>
                  <div style={{ color: '#698892', fontSize: '10.5px' }}>Date: {selectedReport.date}</div>
                </div>
                <div>
                  <div style={{ color: '#698892', fontSize: '11px' }}>Sample reviewer</div>
                  <strong style={{ color: '#081C24' }}>{selectedReport.radiologist || selectedReport.pathologist || 'Dr. Demo Reviewer (synthetic)'}</strong>
                  <div style={{ color: '#698892', fontSize: '10.5px' }}>Demo reviewer ID • not registry verified</div>
                </div>
              </div>

              {/* Primary High-Resolution Authentic Diagnostic Scan & Analyzer Asset Viewport */}
              {selectedReport.realScanImage && (
                <div style={{
                  background: '#07111E',
                  borderRadius: '14px',
                  padding: '16px',
                  color: '#ffffff',
                  border: '1.5px solid #2C4A52',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.35)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        
                        <span>Original Diagnostic Scan & Analyzer Printout</span>
                      </span>
                      <span style={{
                        fontSize: '10.5px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38BDF8',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        fontWeight: 750
                      }}>
                        Simulated Diagnostic Record (Demo)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {selectedReport.category === 'Radiology' && (
                        <button
                          onClick={() => setDicomInvert(!dicomInvert)}
                          style={{
                            background: dicomInvert ? '#38BDF8' : 'rgba(255,255,255,0.12)',
                            color: dicomInvert ? '#07111E' : '#ffffff',
                            border: '1px solid rgba(255,255,255,0.2)',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {dicomInvert ? 'Negative Inverted' : 'Invert Grayscale'}
                        </button>
                      )}
                      <a
                        href={selectedReport.realScanImage}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: 'rgba(255,255,255,0.12)',
                          color: '#ffffff',
                          border: '1px solid rgba(255,255,255,0.2)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>Open Full Image ↗</span>
                      </a>
                    </div>
                  </div>

                  {selectedReport.instrument && (
                    <div style={{
                      fontSize: '11.5px',
                      color: '#94A3B8',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(255,255,255,0.04)',
                      padding: '5px 10px',
                      borderRadius: '6px'
                    }}>
                      <strong style={{ color: '#8FA8AE' }}>Laboratory Instrument:</strong> {selectedReport.instrument}
                    </div>
                  )}

                  {/* The Authentic Scan Viewport */}
                  <div style={{
                    maxHeight: '440px',
                    borderRadius: '10px',
                    background: dicomInvert ? '#FFFFFF' : '#030712',
                    border: '1.5px solid #2C4A52',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '8px'
                  }}>
                    <img
                      src={selectedReport.realScanImage}
                      alt={selectedReport.title}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '420px',
                        objectFit: 'contain',
                        borderRadius: '6px',
                        filter: (selectedReport.category === 'Radiology' && dicomInvert) ? 'invert(1)' : 'none',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Full Quantitative Metrics Table */}
              {selectedReport.quantitativeMetrics && selectedReport.quantitativeMetrics.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#081C24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Quantitative Analyte & Parameter Analysis</span>
                  </h4>
                  <div style={{ border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', borderRadius: '10px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                      <thead>
                        <tr style={{ background: '#FAF8F5', color: '#486770', textAlign: 'left', fontWeight: 700 }}>
                          <th style={{ padding: '10px 14px' }}>Investigation / Parameter</th>
                          <th style={{ padding: '10px 14px' }}>Observed Result</th>
                          <th style={{ padding: '10px 14px' }}>Unit</th>
                          <th style={{ padding: '10px 14px' }}>Biological Reference Interval</th>
                          <th style={{ padding: '10px 14px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReport.quantitativeMetrics.map((metric, idx) => {
                          const isNorm = metric.status === 'Normal';
                          const isHigh = metric.status?.toLowerCase().includes('high') || metric.status?.toLowerCase().includes('elevated') || metric.status?.toLowerCase().includes('severe');
                          return (
                            <tr key={idx} style={{ borderTop: '1px solid #8FA8AE', background: idx % 2 === 0 ? '#ffffff' : '#F8FAFC' }}>
                              <td style={{ padding: '10px 14px', fontWeight: 650, color: '#081C24' }}>
                                {metric.parameter}
                              </td>
                              <td style={{ padding: '10px 14px', fontWeight: 800, color: isNorm ? '#0A2540' : (isHigh ? '#DC2626' : '#D97706') }}>
                                {metric.result}
                              </td>
                              <td style={{ padding: '10px 14px', color: '#698892' }}>
                                {metric.unit || '-'}
                              </td>
                              <td style={{ padding: '10px 14px', color: '#486770', fontFamily: 'monospace' }}>
                                {metric.normalRange}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: isNorm ? '#DCFCE7' : (isHigh ? '#FEE2E2' : '#FEF3C7'),
                                  color: isNorm ? '#15803D' : (isHigh ? '#B91C1C' : '#B45309')
                                }}>
                                  {metric.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Findings & Clinical Impression */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '14px' }}>
                <div style={{ background: '#FAF8F5', padding: '14px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)' }}>
                  <div style={{ fontSize: '11px', color: '#698892', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Detailed Clinical Findings
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#1E293B', lineHeight: 1.5 }}>
                    {selectedReport.findings}
                  </div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '11px', color: '#065F46', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Definitive Impression & Conclusion
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#065F46', fontWeight: 700, lineHeight: 1.5 }}>
                    {selectedReport.impression}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div style={{
              background: '#FAF8F5',
              borderTop: '1px solid #8FA8AE',
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ fontSize: '11.5px', color: '#698892' }}>
                Prototype report profile: <code>DemoDiagnosticReportRecord-v1.0</code>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handlePrintLabSheet(selectedReport)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    background: '#ffffff',
                    color: '#2C4A52',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileText size={14} />
                  <span>Print Lab Sheet</span>
                </button>

                <button
                  onClick={() => handleExportFhir(selectedReport)}
                  className="btn-primary"
                  style={{
                    padding: '8px 18px',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Download size={14} />
                  <span>Download FHIR research draft (JSON)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Detail Modal (Full Longitudinal EHR & Shared Demo Dataset) */}
      {selectedPatientModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.14)',
          backdropFilter: 'blur(4px)',
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            width: '680px',
            maxWidth: '96vw',
            maxHeight: '90vh',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.28)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #8FA8AE', paddingBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#081C24', margin: 0 }}>
                    {selectedPatientModal.name}
                  </h3>
                  <SampleDataChip text={t('doctor.home.sampleData')} />
                </div>
                <div style={{ fontSize: '12.5px', color: '#698892', marginTop: '4px' }}>
                  ID: <code style={{ fontWeight: 800, color: '#0F4C5C' }}>{selectedPatientModal.id}</code> • Token: <strong>{selectedPatientModal.token}</strong> • {selectedPatientModal.age} y • {selectedPatientModal.gender} • {selectedPatientModal.language} • {selectedPatientModal.village}
                </div>
                <AbdmRegistryBadgeRow
                  abhaNumber={selectedPatientModal.abhaNumber || selectedPatientModal.abhaId}
                  abhaAddress={selectedPatientModal.abhaAddress}
                  hprId={selectedPatientModal.hprId}
                  doctorName={selectedPatientModal.doctorName}
                  hfrId={selectedPatientModal.hfrId}
                  facilityName={selectedPatientModal.facilityName}
                  icd10={selectedPatientModal.icd10}
                  icd10Desc={selectedPatientModal.icd10Desc}
                  snomedCt={selectedPatientModal.snomedCt}
                  snomedDesc={selectedPatientModal.snomedDesc}
                  compact={false}
                  onToast={setFhirToast}
                  style={{ marginTop: '8px' }}
                />
              </div>
              <button 
                onClick={() => setSelectedPatientModal(null)} 
                style={{ 
                  background: '#FAF8F5', 
                  border: 'none', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  fontSize: '16px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#486770'
                }}
              >
 ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Vitals Summary Card */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', background: '#FAF8F5', padding: '12px', borderRadius: '12px', textAlign: 'center', fontSize: '12px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)' }}>
                <div><span style={{ color: '#698892' }}>BP</span><br /><strong style={{ fontSize: '14px', color: '#081C24' }}>{selectedPatientModal.vitals.bp}</strong></div>
                <div><span style={{ color: '#698892' }}>Pulse</span><br /><strong style={{ fontSize: '14px', color: '#081C24' }}>{selectedPatientModal.vitals.hr}</strong></div>
                <div><span style={{ color: '#698892' }}>SpO2</span><br /><strong style={{ fontSize: '14px', color: '#081C24' }}>{selectedPatientModal.vitals.spo2}</strong></div>
                <div><span style={{ color: '#698892' }}>Weight</span><br /><strong style={{ fontSize: '14px', color: '#081C24' }}>{selectedPatientModal.vitals.weight || '64 kg'}</strong></div>
              </div>

              {/* Conditions List */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', padding: '12px 14px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#486770', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                  Active Clinical Conditions
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(selectedPatientModal.conditions || [selectedPatientModal.primaryCondition]).map((cond, i) => (
                    <span key={i} style={{ background: 'rgba(0, 0, 0, 0.07)', color: '#0F4C5C', border: '1px solid rgba(0, 0, 0, 0.16)', borderRadius: '12px', padding: '3px 10px', fontSize: '11.5px', fontWeight: 700 }}>
                      {cond}
                    </span>
                  ))}
                </div>
              </div>

              {/* Encounter Timeline (Most Recent First) */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#081C24', textTransform: 'uppercase' }}>
                    Past Encounters Timeline
                  </div>
                  <span style={{ fontSize: '11px', color: '#698892' }}>Most recent first</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(selectedPatientModal.encounters && selectedPatientModal.encounters.length > 0 ? selectedPatientModal.encounters : [
                    { id: 'DEMO-ENC-01', offsetDays: -3, complaint: selectedPatientModal.chiefComplaint, doctorNote: 'Evaluated patient. Adjusted lifestyle and dosage. Advised regular follow-up.' }
                  ]).map((enc, idx) => (
                    <div key={enc.id || idx} style={{ background: '#FAF8F5', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F4C5C', fontWeight: 750, marginBottom: '3px' }}>
                        <span>{formatDemoDate(enc.offsetDays || 0)} ({getRelativeDaysLabel(enc.offsetDays || 0)})</span>
                        <span style={{ fontSize: '11px', color: '#698892' }}>{enc.id}</span>
                      </div>
                      <div style={{ color: '#081C24', fontWeight: 650 }}>{enc.complaint}</div>
                      <div style={{ color: '#486770', marginTop: '2px', fontStyle: 'italic' }}>Note: {enc.doctorNote}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prescriptions with Audio-Rx Play Action */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#081C24', textTransform: 'uppercase' }}>
                    Active Prescriptions & Spoken Audio-Rx
                  </div>
                  <span style={{ fontSize: '10px', color: '#698892' }}>Demo data - not medical advice</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(selectedPatientModal.prescriptions && selectedPatientModal.prescriptions.length > 0 ? selectedPatientModal.prescriptions : [
                    { id: 'DEMO-RX-01', drugName: 'Metformin Hydrochloride', dosage: '500 mg', frequency: '1 tab BD after meals (as prescribed)' }
                  ]).map((rx, idx) => (
                    <div key={rx.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAF8F5', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#081C24' }}>{rx.drugName} • {rx.dosage}</div>
                        <div style={{ fontSize: '11.5px', color: '#698892' }}>{rx.frequency}</div>
                        {rx.instructionsVernacular && (
                          <div style={{ fontSize: '11px', color: '#0F4C5C', marginTop: '2px' }}>{rx.instructionsVernacular}</div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAudioRxModal(selectedPatientModal);
                        }}
                        style={{
                          background: '#0E7A3D',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0
                        }}
                      >
                        <Volume2 size={13} />
                        <span>Play Audio-Rx</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab Reports with Status Chips */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#081C24', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Laboratory & Diagnostic Reports
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(selectedPatientModal.reports && selectedPatientModal.reports.length > 0 ? selectedPatientModal.reports : [
                    { id: 'DEMO-LAB-01', title: 'Routine Metabolic Profile', result: 'All parameters normal', status: 'REVIEWED' }
                  ]).map((rep, idx) => (
                    <div key={rep.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#FAF8F5', borderRadius: '6px', fontSize: '12px' }}>
                      <div>
                        <strong>{rep.title}</strong>: {rep.result}
                      </div>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: rep.status === 'REVIEWED' ? '#DCFCE7' : '#FEF3C7',
                        color: rep.status === 'REVIEWED' ? '#15803D' : '#B45309'
                      }}>
                        {rep.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allergies Notice */}
              <div style={{ fontSize: '12px', color: '#DC2626', background: 'rgba(239, 68, 68, 0.08)', padding: '10px 12px', borderRadius: '8px' }}>
                <strong>Allergy Sentinel:</strong> {selectedPatientModal.allergies}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #8FA8AE', flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  const pat = selectedPatientModal;
                  setSelectedPatientModal(null);
                  setActiveScribeSessionPatient(pat);
                }}
                className="btn-primary"
                style={{ flex: 1, minWidth: '180px', padding: '10px', fontSize: '12.5px', fontWeight: 750 }}
              >
                Launch Ambient Voice Scribe
              </button>

              <button 
                onClick={() => { const pat = selectedPatientModal; setSelectedPatientModal(null); setActiveScribeSessionPatient(pat); }}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  background: '#FAF8F5',
                  color: '#486770',
                  fontSize: '12px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Start Encounter</span>
                <span style={{ fontSize: '9px', background: '#D1FAE5', color: '#047857', padding: '2px 6px', borderRadius: '8px', fontWeight: 800 }}>ACTIVE</span>
              </button>

              <button 
                onClick={() => setSelectedPatientModal(null)}
                className="btn-outline"
                style={{ padding: '10px 18px', fontSize: '12.5px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indic Vernacular Semantic Hierarchy Modal */}
      
      
      {/* Schedule New OPD Appointment Modal */}
      {isNewAppointmentModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(8, 28, 36, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              background: '#0F4C5C',
              color: '#ffffff',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-main)' }}>
                  Schedule New OPD Consultation
                </h3>
                <div style={{ fontSize: '12px', color: '#8FA8AE', marginTop: '2px' }}>
                  Assign token, consultation slot & register chief complaint
                </div>
              </div>
              <button
                onClick={() => setIsNewAppointmentModalOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: '#ffffff',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAppointment} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24', display: 'block', marginBottom: '6px' }}>
                  Select Patient (from sample cohort)
                </label>
                <select
                  value={newApptForm.patientId}
                  onChange={(e) => {
                    const pat = DEMO_PATIENTS.find(p => p.id === e.target.value);
                    setNewApptForm(prev => ({
                      ...prev,
                      patientId: e.target.value,
                      patientName: pat?.name || 'Walk-in Patient'
                    }));
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(0, 0, 0, 0.10)',
                    fontSize: '13px',
                    background: '#FAF8F5'
                  }}
                >
                  {DEMO_PATIENTS.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.age}y {p.genderLabel || p.gender}) — {p.primaryCondition}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24', display: 'block', marginBottom: '6px' }}>
                    Consultation Day
                  </label>
                  <select
                    value={newApptForm.dateOffset}
                    onChange={(e) => setNewApptForm(prev => ({ ...prev, dateOffset: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0, 0, 0, 0.10)',
                      fontSize: '13px',
                      background: '#FAF8F5'
                    }}
                  >
                    <option value={0}>Today ({formatDemoDate(0)})</option>
                    <option value={1}>Tomorrow ({formatDemoDate(1)})</option>
                    <option value={2}>In 2 Days ({formatDemoDate(2)})</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24', display: 'block', marginBottom: '6px' }}>
                    Time Slot
                  </label>
                  <select
                    value={newApptForm.time}
                    onChange={(e) => setNewApptForm(prev => ({ ...prev, time: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(0, 0, 0, 0.10)',
                      fontSize: '13px',
                      background: '#FAF8F5'
                    }}
                  >
                    <option value="11:30 AM">11:30 AM (Next Slot)</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="12:30 PM">12:30 PM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24', display: 'block', marginBottom: '6px' }}>
                  Consultation Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { label: 'In-Person OPD (Room 4)', val: 'In-Person OPD' },
                    { label: 'Teleconsult (WhatsApp)', val: 'Teleconsult' }
                  ].map(mode => (
                    <button
                      type="button"
                      key={mode.val}
                      onClick={() => setNewApptForm(prev => ({ ...prev, type: mode.val }))}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        border: newApptForm.type === mode.val ? '2px solid #0F4C5C' : '1px solid #8FA8AE',
                        background: newApptForm.type === mode.val ? 'rgba(0, 0, 0, 0.06)' : '#FAF8F5',
                        color: newApptForm.type === mode.val ? '#0F4C5C' : '#486770',
                        fontSize: '12px',
                        fontWeight: 750,
                        cursor: 'pointer'
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24', display: 'block', marginBottom: '6px' }}>
                  Chief Complaint / Reason for Visit
                </label>
                <input
                  type="text"
                  required
                  value={newApptForm.complaint}
                  onChange={(e) => setNewApptForm(prev => ({ ...prev, complaint: e.target.value }))}
                  placeholder="e.g. Wheezing, dry cough & fever for 3 days"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid rgba(0, 0, 0, 0.10)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewAppointmentModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    background: '#FAF8F5',
                    color: '#486770',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#0F4C5C',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 750,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)'
                  }}
                >
                  Confirm & Generate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Demo Printable Prescription Preview */}
      {printableRxData && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.14)',
          backdropFilter: 'blur(6px)',
          padding: '20px'
        }}>
          <div className="printable-rx-container" style={{
            background: '#ffffff',
            width: '680px',
            maxHeight: '94vh',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #D8E7EB'
          }}>
            {/* Header / Actions Bar */}
            <div className="no-print" style={{
              background: '#0A2540',
              color: '#ffffff',
              padding: '14px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileCheck size={20} color="#D4AF37" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>Demo Prescription Print Preview</div>
                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>Local synthetic draft • unsigned</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => window.print()}
                  className="btn-primary"
                  style={{
                    padding: '7px 14px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px'
                  }}
                >
                  <Download size={14} />
                  <span>Print / Save PDF</span>
                </button>

                <button
                  onClick={() => setPrintableRxData(null)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: '#ffffff',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
 ✕
                </button>
              </div>
            </div>

            {/* Printable Body */}
            <div style={{ padding: '26px 30px', overflowY: 'auto', flex: 1, color: '#1E293B', fontFamily: 'Inter, sans-serif' }}>
              
              {/* Government / Hospital Letterhead */}
              <div style={{
                borderBottom: '2px solid #0F4C5C',
                paddingBottom: '16px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#D97706', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Synthetic demo document • not government issued
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#081C24', margin: '3px 0' }}>
                    {doctorProfile?.facility || 'Synthetic District Hospital Demo Facility'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#698892' }}>
                    Department of {doctorSpecialty} • Synthetic facility ID: DEMO-HFR-AP-14029
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F4C5C' }}>{doctorName}</div>
                  <div style={{ fontSize: '11px', color: '#486770' }}>{doctorProfile?.nmcRegNo || 'DEMO-REVIEWER-2026'}</div>
                  <div style={{ fontSize: '10.5px', color: '#698892' }}>Demo clinician ID: {doctorProfile?.hprId || 'DEMO-CLINICIAN-2026'}</div>
                </div>
              </div>

              {/* Patient Barcode & Demographics Grid */}
              <div style={{
                background: '#FAF8F5',
                border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '18px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ color: '#698892', display: 'block', fontSize: '10.5px' }}>PATIENT NAME</span>
                  <strong style={{ color: '#081C24', fontSize: '13px' }}>{printableRxData.patientName}</strong>
                  <span style={{ color: '#0F4C5C', fontSize: '11px', display: 'block' }}>{printableRxData.vernacularName}</span>
                </div>
                <div>
                  <span style={{ color: '#698892', display: 'block', fontSize: '10.5px' }}>AGE / GENDER</span>
                  <strong style={{ color: '#081C24' }}>{printableRxData.age} Yrs • {printableRxData.gender}</strong>
                </div>
                <div>
                  <span style={{ color: '#698892', display: 'block', fontSize: '10.5px' }}>ABHA ID</span>
                  <strong style={{ color: '#081C24', fontFamily: 'monospace' }}>{printableRxData.abhaId}</strong>
                </div>
                <div>
                  <span style={{ color: '#698892', display: 'block', fontSize: '10.5px' }}>DATE OF ISSUE</span>
                  <strong style={{ color: '#081C24' }}>{printableRxData.date}</strong>
                </div>
              </div>

              {/* Vitals & Provisional Diagnosis */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 750, color: '#486770', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Recorded Vitals & Clinical Assessment
                </div>
                <div style={{ fontSize: '12.5px', background: '#FAF8F5', padding: '8px 12px', borderRadius: '8px', color: '#2C4A52', marginBottom: '8px' }}>
                  {printableRxData.vitals}
                </div>
                <div style={{ fontSize: '13px', color: '#081C24', background: 'rgba(0, 0, 0, 0.06)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.14)' }}>
                  <strong>Sample assessment draft: </strong> {printableRxData.diagnosis}
                </div>
              </div>

              {/* Prescribed Medications Table */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px', color: '#0F4C5C', fontWeight: 900, fontFamily: 'serif' }}>℞</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#081C24', textTransform: 'uppercase' }}>
                    Prescribed Medications (sample generic references)
                  </span>
                </div>

                <div style={{ border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#FAF8F5', borderBottom: '1px solid #8FA8AE', color: '#486770', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px' }}>Medicine & Generic Equivalent</th>
                        <th style={{ padding: '10px 12px' }}>Timing & Indic Context</th>
                        <th style={{ padding: '10px 12px' }}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printableRxData.medications.map((med, mIdx) => (
                        <tr key={mIdx} style={{ borderBottom: mIdx < printableRxData.medications.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <strong style={{ color: '#081C24', fontSize: '12.5px' }}>{med.name}</strong>
                            {med.generic && (
                            <div style={{ fontSize: '11px', color: '#15803D', fontWeight: 650, marginTop: '2px' }}>
                              Sample generic reference: {med.generic}
                            </div>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#081C24', fontWeight: 600 }}>
                            {med.timing}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#486770', fontWeight: 700 }}>
                            {med.days}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sample QR & Demo Sign-Off Footer */}
              <div style={{
                borderTop: '2px dashed #8FA8AE',
                paddingTop: '16px',
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AuthenticQrCode 
                    value={typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://ayuswar-ai.vercel.app/'}
                    size={68}
                    isDoctor={true}
                    showCenterBadge={false}
                  />
                  <div style={{ fontSize: '11px', color: '#698892', maxWidth: '240px' }}>
                    Scan to view the AyuSwar demo. This is a sample document.
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    display: 'inline-block',
                    border: '1.5px solid #0F4C5C',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    background: 'rgba(0, 0, 0, 0.03)',
                    marginBottom: '4px'
                  }}>
                    <div style={{ fontSize: '10px', color: '#0F4C5C', fontWeight: 800 }}>DEMO SIGN-OFF MARKER • NOT A DIGITAL SIGNATURE</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 900, color: '#081C24' }}>{doctorName}</div>
                    <div style={{ fontSize: '10px', color: '#698892' }}>Synthetic demo clinician • no registry verification</div>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>Generated by the AyuSwar prototype</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Ambient Voice Scribe Studio Modal (In-Situ Telemetry Studio) */}
      {activeScribeSessionPatient && (
        <LiveScribeSessionModal
          isOpen={!!activeScribeSessionPatient}
          onClose={() => setActiveScribeSessionPatient(null)}
          patientData={activeScribeSessionPatient}
          doctorName={doctorName}
          onSwitchToWizard={(encounterIdx) => {
            const idx = encounterIdx !== undefined ? encounterIdx : (activeScribeSessionPatient?.encounterIndex ?? 0);
            const patData = activeScribeSessionPatient;
            setActiveScribeSessionPatient(null);
            if (onSelectEncounterAndLaunch) {
              onSelectEncounterAndLaunch(idx, patData);
            } else {
              const n = encodeURIComponent(patData?.patientName || patData?.name || '');
              const t = encodeURIComponent(patData?.token || '');
              const p = encodeURIComponent(patData?.phone || '');
              window.location.href = `/clinical-console?encounter=${idx}&name=${n}&token=${t}&phone=${p}`;
            }
          }}
        />
      )}

      {/* WhatsApp Vernacular Audio-Rx Modal */}
      <WhatsAppAudioRxModal 
        isOpen={!!whatsAppModalPatient}
        onClose={() => setWhatsAppModalPatient(null)}
        patientData={whatsAppModalPatient}
        doctorName={doctorName}
        initialLanguage={whatsAppModalPatient?.langCode?.includes('hi') ? 'hi' : 'te'}
      />

      {/* 60s Live Rayalaseema Telugu OPD Simulation Modal */}
      <LiveOpdDemoSimulator
        isOpen={isOpdDemoModalOpen}
        onClose={() => setIsOpdDemoModalOpen(false)}
        onApplyToPrescription={() => {
          triggerHaptic('success');
          setActiveTab('prescriptions');
          setFhirToast('Transferred sample OPD encounter to the local draft (bundled sample reference applied, not live-checked).');
          setTimeout(() => setFhirToast(null), 4500);
        }}
      />

      {/* Real-time Clinical Notifications Drawer */}
      <ClinicalNotificationsDrawer
        isOpen={isNotificationsDrawerOpen}
        onClose={() => setIsNotificationsDrawerOpen(false)}
        mode="doctor"
        userProfile={doctorProfile}
        onActionClick={(item) => {
          if (item.actionType === 'reports') setActiveTab('reports');
          else if (item.actionType === 'settings') setActiveTab('settings');
          else if (item.actionType === 'prescriptions') setActiveTab('prescriptions');
          else if (item.actionType === 'emergency') {
            window.location.href = '/emergency';
          }
        }}
      />



    </div>
  );
}
