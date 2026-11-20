import React, { useState, useEffect, useRef } from 'react';
import { buildManualVital, formatManualVital } from '../utils/vitalsEntry';
import { useForm } from 'react-hook-form';
import { useApp, SUPPORTED_LANGUAGES } from '../context/AppContext';
import { Globe, Sunrise, Sun, Video, Building2, Lock, Scan, User } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WashiTape, InkStamp, MarkerHighlight } from './looseleaf/LooseleafPrimitives';
import { 
  Home, 
  LayoutGrid,
  FlaskConical,
  ClipboardPlus,
  Heart, 
  Calendar, 
  FileText, 
  Pill, 
  Sparkles, 
  Target, 
  Settings, 
  Bell, 
  BookOpenCheck, 
  ChevronDown, 
  Upload, 
  Eye, 
  MessageSquare, 
  Send, 
  Activity, 
  Moon, 
  Scale, 
  Volume2, 
  Play, 
  Pause, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Users,
  Languages,
  QrCode,
  Download,
  AlertCircle,
  PhoneCall,
  Check,
  Award,
  LogOut,
  Plus,
  X,
  Menu,
  FileCheck,
  UploadCloud,
  FolderOpen,
  Droplets,
  Wind,
  Zap,
  Trash2,
  RefreshCw,
  Smartphone,
  Sliders,
  Shield,
  Leaf,
  WifiOff,
  Mic,
  MicOff,
  MoreHorizontal
} from 'lucide-react';
import { askAyuSwarBrain } from '../services/aiBrainService';
import { speechService } from '../services/indicSpeechService';
import AbhaDigitalCard from './AbhaDigitalCard';
import WhatsAppAudioRxModal from './WhatsAppAudioRxModal';
import OpdAppointmentTicketModal from './OpdAppointmentTicketModal';
import ConsultationVisitSummaryModal from './ConsultationVisitSummaryModal';
import { demoBookingService } from '../services/demoBookingService';
import AuthenticQrCode from './AuthenticQrCode';
import ClinicalNotificationsDrawer from './ClinicalNotificationsDrawer';
import PatientHealthGoalsTab from './patient/PatientHealthGoalsTab';
import DeepamHeartbeatEmblem from './DeepamHeartbeatEmblem';
import BotanicalWatermark from './BotanicalWatermark';
import MintIvoryWaveBackground from './MintIvoryWaveBackground';
import { checkDrugInteractions, calculateMewsScore, getJanAushadhiGenericInfo } from '../data/clinicalSafetySentinel';
import { DEMO_PATIENTS, DEMO_APPOINTMENTS, formatDemoDate, getRelativeDaysLabel, SampleDataChip } from '../data/demoData';
import { opdQueueService, STANDARD_OPD_TIME_SLOTS } from '../services/opdQueueService';
import { isFixtureSlotPassed } from '../services/appointmentTime';
import { loadLocalPreferences, saveLocalPreferences } from '../services/localPreferences';
import AbdmRegistryBadgeRow from './AbdmRegistryBadgeRow';
import { triggerHaptic } from '../utils/haptics';

/**
 * PatientPortal Component — Complete Enterprise Citizen Healthcare Operating System
 * Faithfully implements Screenshot 1 + All 8 dedicated sidebar views:
 * 1. Home (Hero welcome, 4 quick actions, Upcoming appts, Health overview vitals, Ask AyuSwar, Goals, Doctor card)
 * 2. {t('patient.home.myHealth')} (synthetic health card preview, sample QR, longitudinal vitals graphs, chronic-condition samples)
 * 3. Appointments (Upcoming online/in-person visits, Book New Appointment wizard, past visit summary)
 * 4. Reports (Lab test results, X-rays, blood biochemistry, 1-Click "Hear Report in My Language" native audio)
 * 5. Medications (Smart Chronotherapy Pillbox: Early morning empty stomach, meals, bedtime with spoken voiceover)
 * 6. AI Assistant (Vernacular health assistant, symptoms advice, emergency 108/104 direct action banner)
 * 7. Health Goals (10k steps tracker, hydration glasses, medication adherence streak, sleep tracker)
 * 8. Settings (Indic dialect selector, demo family-view controls, local reminder preferences)
 */
export default function PatientPortal({ 
  patientProfile, 
  onOpenDoctorAuthModal, 
  onLogoutPatient, 
  onSwitchPatient,
  appointmentsQueue = [],
  onBookAppointment
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabFromUrl = searchParams.get('tab');
  const validPatientTabs = ['home', 'my_health', 'appointments', 'reports', 'medications', 'ai_assistant', 'health_goals', 'settings'];
  const [activeTab, setActiveTabState] = useState(() => {
    return (tabFromUrl && validPatientTabs.includes(tabFromUrl)) ? tabFromUrl : 'home';
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
    if (tabFromUrl && validPatientTabs.includes(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl);
    }
  }, [tabFromUrl]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showWhatsAppRxModal, setShowWhatsAppRxModal] = useState(false);
  const [isNotificationsDrawerOpen, setIsNotificationsDrawerOpen] = useState(false);
  // State-driven header badge: mirrors the notification drawer's persisted store
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  useEffect(() => {
    const readUnread = () => {
      try {
        const list = JSON.parse(localStorage.getItem('ayuswar_patient_notifications_v1') || '[]');
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
        const list = JSON.parse(localStorage.getItem('ayuswar_patient_notifications_v1') || '[]');
        setUnreadNotifCount(Array.isArray(list) ? list.filter(n => !n.read).length : 0);
      } catch { setUnreadNotifCount(0); }
    }
  }, [isNotificationsDrawerOpen]);
  
  // Book Consultation Modal State
  const [isBookConsultationModalOpen, setIsBookConsultationModalOpen] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState('Dr. Demo Clinician (synthetic)');
  const [bookingSpecialty, setBookingSpecialty] = useState('General Medicine (demo)');
  const [bookingDate, setBookingDate] = useState(1);
  const bookingDateLabel = (off) => {
    if (off === 0) return t('patient.appts.today');
    if (off === 1) return t('patient.appts.tomorrow');
    const d = new Date(); d.setDate(d.getDate() + off);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };
  const bookingDateOptions = [0, 1, 2, 3];
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [bookingMode, setBookingMode] = useState('In-Person OPD');
  const [bookingReason, setBookingReason] = useState('ఛాతీలో అసౌకర్యం మరియు శ్వాస తీసుకోవడంలో ఇబ్బంది (Chest discomfort & dyspnea)');
  const [bookingSuccessToast, setBookingSuccessToast] = useState(false);
  const [liveAppointmentsQueue, setLiveAppointmentsQueue] = useState(() => opdQueueService.getQueue());
  const [demoBookingsList, setDemoBookingsList] = useState(() => demoBookingService.getBookings());
  const [bookedTicket, setBookedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedVisitSummary, setSelectedVisitSummary] = useState(null);

  // Listen to live OPD appointment booking and queue updates in real-time
  useEffect(() => {
    const unsub = opdQueueService.subscribe((updated) => {
      setLiveAppointmentsQueue(updated);
    });
    return () => unsub();
  }, []);


  // Multi-patient profiles available for switching - sourced directly from shared DEMO_PATIENTS
  const availablePatients = DEMO_PATIENTS.map(dp => ({
    patientName: dp.name,
    age: dp.age,
    gender: dp.genderLabel || (dp.gender === 'F' ? 'Female' : 'Male'),
    language: dp.language,
    abhaId: dp.abhaId,
    condition: dp.primaryCondition,
    facility: `${dp.village} Health Centre`,
    phone: dp.phone,
    vitalsHistory: dp.vitalsHistory,
    reports: dp.reports,
    prescriptions: dp.prescriptions
  }));

  const assignedDoctor = patientProfile?.assignedDoctor || {
    doctorName: 'Dr. Demo Clinician (synthetic)',
    specialty: 'General Medicine (demo)',
    facility: 'AyuSwar Demo District Hospital OPD (synthetic)'
  };

  const familyListToDisplay = (patientProfile?.familyMembers && patientProfile.familyMembers.length > 0)
    ? patientProfile.familyMembers
    : availablePatients;
  const hasFamilyLocker = familyListToDisplay.length > 1;

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    const onDocDown = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setIsProfileMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDocDown);
    return () => document.removeEventListener('pointerdown', onDocDown);
  }, [isProfileMenuOpen]);
  useEffect(() => { setIsProfileMenuOpen(false); }, [activeTab]);
  const [isUploadReportModalOpen, setIsUploadReportModalOpen] = useState(false);
  const [isAddMedicationModalOpen, setIsAddMedicationModalOpen] = useState(false);
  const [showPrintRxModal, setShowPrintRxModal] = useState(false);
  const [plannedNotice, setPlannedNotice] = useState(null);

  const showPlannedNotice = (featureName) => {
    setPlannedNotice(featureName);
    setTimeout(() => setPlannedNotice(null), 3500);
  };

  // Connect to shared global AppContext locale
  const { selectedLanguage: appLang, setSelectedLanguage: setAppLang, t } = useApp();
  // Localize known dataset vitals status labels; unknown values pass through unchanged
  const vitalStatusLabel = (status) => {
    if (!status) return status;
    const key = 'patient.home.vitalStatus.' + status;
    const v = t(key);
    return v === key ? status : v;
  };

  const [patientQuestion, setPatientQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState(() => [
    {
      sender: 'user',
      text: t('patient.assistant.seedQ')
    },
    {
      sender: 'ai',
      text: t('patient.assistant.seedA')
    }
  ]);

  const LANG_TO_NAME = {
    'te-IN': 'Telugu',
    'hi-IN': 'Hindi',
    'ta-IN': 'Tamil',
    'kn-IN': 'Kannada',
    'mr-IN': 'Marathi',
    'en-IN': 'English'
  };

  const NAME_TO_LANG = {
    'Telugu': 'te-IN',
    'Hindi': 'hi-IN',
    'Tamil': 'ta-IN',
    'Kannada': 'kn-IN',
    'Marathi': 'mr-IN',
    'English': 'en-IN'
  };

  const selectedLanguage = LANG_TO_NAME[appLang] || 'English';
  const setSelectedLanguage = (val) => {
    const code = NAME_TO_LANG[val] || val;
    if (setAppLang) setAppLang(code);
  };
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activePillSlot, setActivePillSlot] = useState('morning');
  const [dailyPillChecked, setDailyPillChecked] = useState({
    early_morning: true,
    morning: true,
    afternoon: false,
    evening: false,
    night: false
  });

  // --- Enhanced Settings Suite State ---
  const [voicePersona, setVoicePersona] = useState('female_compassionate');
  const [speechTempo, setSpeechTempo] = useState('1.0x');
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  
  // Omnichannel Dispatches & Notifications
  const [enableWhatsAppData, setEnableWhatsAppData] = useState(true);
  const [enableIvrPhoneCalls, setEnableIvrPhoneCalls] = useState(true);
  const [enableSmsRegional, setEnableSmsRegional] = useState(true);
  const [preferredReminderTime, setPreferredReminderTime] = useState('06:30 AM');

  const patientPreferenceScope = `patient:${patientProfile?.id || patientProfile?.abhaId || 'guest'}`;
  useEffect(() => {
    const saved = loadLocalPreferences(patientPreferenceScope);
    if (!saved) return;
    if (saved.voicePersona) setVoicePersona(saved.voicePersona);
    if (saved.speechTempo) setSpeechTempo(saved.speechTempo);
    if (typeof saved.autoPlayAudio === 'boolean') setAutoPlayAudio(saved.autoPlayAudio);
    if (typeof saved.enableWhatsAppData === 'boolean') setEnableWhatsAppData(saved.enableWhatsAppData);
    if (typeof saved.enableIvrPhoneCalls === 'boolean') setEnableIvrPhoneCalls(saved.enableIvrPhoneCalls);
    if (typeof saved.enableSmsRegional === 'boolean') setEnableSmsRegional(saved.enableSmsRegional);
    if (saved.preferredReminderTime) setPreferredReminderTime(saved.preferredReminderTime);
  }, [patientPreferenceScope]);

  const savePatientPreferences = () => {
    saveLocalPreferences(patientPreferenceScope, {
      voicePersona,
      speechTempo,
      autoPlayAudio,
      enableWhatsAppData,
      enableIvrPhoneCalls,
      enableSmsRegional,
      preferredReminderTime
    });
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 4000);
  };
  
  // Emergency Caregiver Escalation
  const [emergencyContactName, setEmergencyContactName] = useState('K. Rajesh (Son / Caregiver)');
  const [emergencyPhone, setEmergencyPhone] = useState('+91 00000 00009');
  const [emergencyAutoTransmit108, setEmergencyAutoTransmit108] = useState(true);

  // ABDM / ABHA Health Locker & Consent Governance
  const [consentDurationDays, setConsentDurationDays] = useState(30);
  const [autoShareEmergencyRecords, setAutoShareEmergencyRecords] = useState(true);
  const [fhirDataMasking, setFhirDataMasking] = useState(false);

  // Rural PHC Offline Mode & Low Data
  const [offlineVoiceCaching, setOfflineVoiceCaching] = useState(true);
  const [lowDataAudioCodec, setLowDataAudioCodec] = useState(true);
  const [cacheSizeMb, setCacheSizeMb] = useState('14.2 MB');
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);


  const patientName = patientProfile?.patientName || patientProfile?.name || DEMO_PATIENTS[0].name;
  const abhaId = patientProfile?.abhaId || DEMO_PATIENTS[0].abhaId;
  const activeDemoPatient = DEMO_PATIENTS.find(p => p.name === patientName || p.id === patientProfile?.id || p.abhaId === abhaId) || DEMO_PATIENTS[0];

  // Dynamic Reactive Diagnostic Reports List (Relative dates)
  const [reportsList, setReportsList] = useState(patientProfile?.reportsList || [
    {
      id: 1,
      title: 'Chest X-Ray Report',
      date: formatDemoDate(-3),
      icon: '🩻',
      doctor: assignedDoctor.doctorName,
      summary: 'Clear lung fields with no pneumonia or fluid buildup. Mild airway sensitivity.',
      spokenTelugu: 'మీ ఛాతీ ఎక్స్-రే లో ఎలాంటి ఇన్ఫెక్షన్ లేదా నీరు చేరడం లేదు. ఊపిరితిత్తులు ఆరోగ్యంగా ఉన్నాయి.',
      spokenHindi: 'आपकी छाती के एक्स-रे में कोई गंभीर संक्रमण नहीं है। फेफड़े सामान्य हैं।'
    },
    {
      id: 2,
      title: 'Complete Blood Count (CBC)',
      date: formatDemoDate(-4),
      icon: '🩸',
      doctor: 'Dr. Demo Clinician (synthetic)',
      summary: 'Hemoglobin: 12.4 g/dL (Good). White blood cells slightly raised indicating resolving seasonal cold.',
      spokenTelugu: 'మీ రక్త పరీక్షలో హిమోగ్లోబిన్ బాగుంది. ఇన్ఫెక్షన్ తగ్గిపోతోంది, భయపడాల్సిన పనిలేదు.',
      spokenHindi: 'आपकी खून की जांच में हीमोग्लोबिन अच्छा है। मौसमी सर्दी ठीक हो रही है।'
    },
    {
      id: 3,
      title: 'Pulmonary Spirometry Test',
      date: formatDemoDate(-7),
      icon: '𫁁',
      doctor: 'Dr. Demo Clinician (synthetic)',
      summary: 'Airway volume is 86% of predicted value, showing excellent response to your morning inhaler.',
      spokenTelugu: 'మీ ఊపిరితిత్తుల గాలి సామర్థ్యం 86 శాతం ఉంది. ఇన్హేలర్ సరిగ్గా పనిచేస్తోంది.',
      spokenHindi: 'आपके सांस लेने की क्षमता बहुत अच्छी है। इन्हेलर से सुधार दिख रहा है।'
    }
  ]);

  // ---------------------------------------------------------------------------
  // Longitudinal Vitals Tracker State (Manual Entry + Automatic Report Updates)
  // ---------------------------------------------------------------------------
  const [vitalsHistory, setVitalsHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`ayuswar_vitals_${abhaId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'vit_001',
        date: formatDemoDate(0),
        relativeLabel: 'Today',
        offsetDays: 0,
        bp: '132/84 mmHg',
        systolic: 132,
        diastolic: 84,
        pulse: '76 bpm',
        spo2: '98%',
        weight: '63 kg',
        source: 'Community Health Worker Visit',
        sourceType: 'manual',
        status: 'Self-reported'
      },
      {
        id: 'vit_002',
        date: formatDemoDate(-14),
        relativeLabel: '14 days ago',
        offsetDays: -14,
        bp: '138/88 mmHg',
        systolic: 138,
        diastolic: 88,
        pulse: '78 bpm',
        spo2: '97%',
        weight: '63.5 kg',
        source: 'Community Health Worker Visit',
        sourceType: 'manual',
        status: 'Self-reported'
      },
      {
        id: 'vit_003',
        date: formatDemoDate(-45),
        relativeLabel: '45 days ago',
        offsetDays: -45,
        bp: '144/92 mmHg',
        systolic: 144,
        diastolic: 92,
        pulse: '82 bpm',
        spo2: '97%',
        weight: '64 kg',
        source: 'District OPD Screening',
        sourceType: 'manual',
        status: 'Self-reported'
      }
    ];
  });

  // Persist vitals updates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`ayuswar_vitals_${abhaId}`, JSON.stringify(vitalsHistory));
    } catch {}
  }, [vitalsHistory, abhaId]);

  // Modal State for Manual Vitals Entry
  const [isAddVitalsModalOpen, setIsAddVitalsModalOpen] = useState(false);
  const EMPTY_VITALS_FORM = {
    date: formatDemoDate(0),
    time: '09:30 AM',
    systolic: '',
    diastolic: '',
    pulse: '',
    spo2: '',
    weight: '',
    bloodSugar: '',
    sourceNote: 'Self-measured at home'
  };
  // react-hook-form pilot: uncontrolled inputs, submit-time validation via
  // the pure buildManualVital module mapped into RHF field errors.
  const {
    register: registerVital,
    handleSubmit: handleVitalsSubmit,
    reset: resetVitalsForm,
    setError: setVitalError,
    clearErrors: clearVitalsErrors,
    formState: { errors: vitalsErrors }
  } = useForm({ defaultValues: EMPTY_VITALS_FORM, mode: 'onSubmit' });
  const vitalsSavingRef = useRef(false);
  const [vitalsToastMessage, setVitalsToastMessage] = useState(null);

  const showVitalsToast = (msg) => {
    setVitalsToastMessage(msg);
    setTimeout(() => setVitalsToastMessage(null), 3500);
  };

  const handleSaveManualVitals = (data) => {
    // Duplicate-save guard: one in-flight save at a time.
    if (vitalsSavingRef.current) return;
    clearVitalsErrors();
    const result = buildManualVital(data);
    if (!result.valid) {
      // Keep every entered value for correction; nothing is saved or invented.
      Object.entries(result.errors).forEach(([field, message]) =>
        setVitalError(field, { type: 'validation', message })
      );
      return;
    }
    vitalsSavingRef.current = true;
    const newVital = formatManualVital(result.values, 'vit_manual_' + Date.now());
    setVitalsHistory(prev => [newVital, ...prev]);
    setIsAddVitalsModalOpen(false);
    vitalsSavingRef.current = false;
    resetVitalsForm(EMPTY_VITALS_FORM);
    showVitalsToast('New vitals recorded manually and saved to longitudinal history!');
  };

  const handleClearVitalsForm = () => {
    // Explicit confirm before any entered draft is discarded.
    if (!window.confirm('Clear every value you entered in this form?')) return;
    resetVitalsForm(EMPTY_VITALS_FORM);
  };

  const handleSyncVitalsFromReports = () => {
    const reportVitals = [
      {
        id: 'vit_rep_cbc',
        date: formatDemoDate(-4),
        relativeLabel: '4 days ago',
        offsetDays: -4,
        bp: '128/82 mmHg',
        systolic: 128,
        diastolic: 82,
        pulse: '74 bpm',
        spo2: '98%',
        weight: '63.2 kg',
        source: 'Sample imported from bundled CBC record',
        sourceType: 'report',
        reportName: 'Complete Blood Count (CBC)',
        doctor: 'Dr. Demo Clinician (synthetic)',
        status: 'Review required'
      },
      {
        id: 'vit_rep_pft',
        date: formatDemoDate(-7),
        relativeLabel: '7 days ago',
        offsetDays: -7,
        bp: '130/84 mmHg',
        systolic: 130,
        diastolic: 84,
        pulse: '76 bpm',
        spo2: '99%',
        weight: '63.4 kg',
        source: 'Sample imported from bundled spirometry record',
        sourceType: 'report',
        reportName: 'Pulmonary Spirometry Test',
        doctor: 'District Respiratory Lab',
        status: 'Normal'
      }
    ];

    setVitalsHistory(prev => {
      const existingIds = new Set(prev.map(item => item.id));
      const toAdd = reportVitals.filter(item => !existingIds.has(item.id));
      if (toAdd.length === 0) {
        showVitalsToast('All bundled sample lab values are already shown in the local tracker.');
        return prev;
      }
      showVitalsToast(`Imported ${toAdd.length} bundled sample vitals entries locally. Review against the original report.`);
      const combined = [...toAdd, ...prev];
      return combined.sort((a, b) => (b.offsetDays || 0) - (a.offsetDays || 0));
    });
  };

  const handleDeleteVital = (id) => {
    setVitalsHistory(prev => prev.filter(v => v.id !== id));
    showVitalsToast('Vitals record removed from longitudinal tracking.');
  };

  // Upload Report Form State & File Handling
  const reportFileInputRef = useRef(null);
  const [uploadedReportFile, setUploadedReportFile] = useState(null);
  const [isReportDraggingOver, setIsReportDraggingOver] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState('HbA1c & Fasting Blood Glucose');
  const [newReportDoctor, setNewReportDoctor] = useState('Dr. Demo Clinician (synthetic)');
  const [newReportDate, setNewReportDate] = useState(formatDemoDate(0));
  const [newReportSummary, setNewReportSummary] = useState('HbA1c: 6.4% (Good Control). Fasting Blood Sugar: 104 mg/dL. Renal function intact.');
  const [newReportTelugu, setNewReportTelugu] = useState('మీ రక్తంలో చక్కెర స్థాయిలు అదుపులో ఉన్నాయి. హెచ్‌బీఏ1సి 6.4 శాతం ఉంది.');
  const [newReportHindi, setNewReportHindi] = useState('आपके खून में शुगर का स्तर नियंत्रण में है। दवाएं ठीक से काम कर रही हैं।');
  const [isAiScanningReport, setIsAiScanningReport] = useState(false);

  const handleReportFileChosen = (file) => {
    if (!file) return;
    const isImg = file.type?.startsWith('image/');
    let previewUrl = null;
    if (isImg) {
      try {
        previewUrl = URL.createObjectURL(file);
      } catch {}
    }
    const cleanName = file.name ? file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ') : 'Diagnostic Lab Report';
    
    setUploadedReportFile({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type || 'application/pdf',
      previewUrl
    });

    setNewReportTitle(cleanName);

    // Load the bundled sample preview automatically
    setIsAiScanningReport(true);
    setTimeout(() => {
      setIsAiScanningReport(false);
      // Uploaded reports are never read or interpreted: every language gets the
      // same honest sample-preview notice, with no canned findings or vitals.
      setNewReportSummary('Bundled sample preview only: this text is NOT read from your uploaded file. Review and edit it against your original report before saving. No result interpretation is provided.');
      setNewReportTelugu('నమూనా ప్రివ్యూ మాత్రమే: ఈ పాఠ్యం మీ అప్‌లోడ్ ఫైల్ నుండి చదవలేదు. సేవ్ చేయడానికి ముందు మీ అసలు నివేదికతో సరిచూసి సవరించండి. ఎలాంటి ఫలిత విశ్లేషణా ఇవ్వబడలేదు.');
      setNewReportHindi('केवल नमूना पूर्वावलोकन: यह पाठ आपकी अपलोड की गई फ़ाइल से नहीं पढ़ा गया है। सहेजने से पहले अपनी मूल रिपोर्ट से मिलाकर संपादित करें। कोई परिणाम व्याख्या नहीं दी जाती।');
    }, 600);
  };

  const handleSelectSampleReport = (sampleKey) => {
    if (sampleKey === 'hba1c') {
      setUploadedReportFile({
        name: 'Demo_Diagnostics_HbA1c_Blood_Panel.pdf',
        size: '1.45 MB',
        type: 'application/pdf',
        previewUrl: null
      });
      setNewReportTitle('HbA1c & Fasting Blood Glucose Panel');
      setNewReportDoctor('Dr. Demo Clinician (synthetic)');
      setNewReportDate(formatDemoDate(0));
      setNewReportSummary('HbA1c: 6.4% (Good Glycemic Control). Fasting Glucose: 104 mg/dL. Estimated Average Glucose: 137 mg/dL.');
      setNewReportTelugu('మీ రక్తంలో చక్కెర స్థాయిలు అదుపులో ఉన్నాయి. హెచ్‌బీఏ1సి 6.4 శాతం ఉంది.');
      setNewReportHindi('आपके खून में शुगर का स्तर नियंत्रण में है। दवाएं ठीक से काम कर रही हैं।');
    } else if (sampleKey === 'xray') {
      setUploadedReportFile({
        name: 'Govt_General_Hospital_Chest_PA.dcm',
        size: '14.2 MB',
        type: 'application/dicom',
        previewUrl: null
      });
      setNewReportTitle('Chest Radiograph (PA View)');
      setNewReportDoctor('Dr. Demo Reviewer (synthetic)');
      setNewReportDate(formatDemoDate(-2));
      setNewReportSummary('Clear bronchovascular markings. Normal cardiac apex. No signs of active tuberculosis, infiltrate, or pneumonia.');
      setNewReportTelugu('ఛాతీ ఎక్స్-రే లో ఎలాంటి నిమోనియా లేదా ఇన్ఫెక్షన్ లేదు. ఊపిరితిత్తులు ఆరోగ్యంగా ఉన్నాయి.');
      setNewReportHindi('छाती के एक्स-रे में कोई संक्रमण या निमोनिया नहीं है। फेफड़े बिल्कुल स्वस्थ हैं।');
    } else if (sampleKey === 'lipid') {
      setUploadedReportFile({
        name: 'Thyrocare_Lipid_Profile_Scan.png',
        size: '890 KB',
        type: 'image/png',
        previewUrl: null
      });
      setNewReportTitle('Complete Fasting Lipid Profile');
      setNewReportDoctor('Dr. Demo Reviewer (synthetic)');
      setNewReportDate(formatDemoDate(-5));
      setNewReportSummary('Total Cholesterol: 178 mg/dL. HDL: 49 mg/dL. LDL: 101 mg/dL. Triglycerides: 135 mg/dL. Optimal heart risk score.');
      setNewReportTelugu('మీ కొలెస్ట్రాల్ మరియు రక్త నాళాల కొవ్వు స్థాయిలు సాధారణంగా ఉన్నాయి.');
      setNewReportHindi('कोलेस्ट्रॉल का स्तर बिल्कुल सामान्य है और हृदय स्वास्थ्य अच्छा है।');
    }
  };

  // Dynamic Reactive Chronotherapy Medications Schedule
  const [chronotherapySchedule, setChronotherapySchedule] = useState([
    {
      id: 'early_morning',
      isBundledSample: true,
      label: 'Early Morning',
      time: '06:30 AM',
      mealContext: 'Empty Stomach (పరగడుపున / भूखे पेट)',
      medicine: 'Pantoprazole 40mg',
      purpose: 'Acid Reflux & Gastric Protection',
      color: '#B45309',
      bg: 'rgba(217, 119, 6, 0.1)',
      teluguAudioText: 'ఉదయం లేవగానే పరగడుపున ఈ పసుపు రంగు టాబ్లెట్ ఒక గ్లాసు నీళ్లతో వేసుకోండి.',
      hindiAudioText: 'सुबह उठते ही खाली पेट यह पीली गोली एक गिलास पानी के साथ लें।',
      englishAudioText: 'Take this yellow tablet first thing in the morning on an empty stomach with a glass of water.'
    },
    {
      id: 'morning',
      isBundledSample: true,
      label: 'Morning',
      time: '08:30 AM',
      mealContext: 'After Breakfast (టిఫిన్ తర్వాత / नाश्ते के बाद)',
      medicine: 'Budesonide Inhaler (200 mcg)',
      purpose: 'Airway anti-inflammatory for Asthma',
      color: '#0F4C5C',
      bg: 'rgba(0, 0, 0, 0.07)',
      teluguAudioText: 'ఉదయం టిఫిన్ తిన్న తర్వాత ఈ ఇన్హేలర్ రెండు పఫ్స్ తీసుకోండి, తర్వాత నోరు పుక్కిలించండి.',
      hindiAudioText: 'सुबह नाश्ते के बाद इस इन्हेलर के दो पफ लें, और फिर कुल्ला करें।',
      englishAudioText: 'Take two puffs of this inhaler after breakfast in the morning, then rinse your mouth thoroughly.'
    },
    {
      id: 'afternoon',
      isBundledSample: true,
      label: 'Afternoon',
      time: '01:30 PM',
      mealContext: 'After Lunch (భోజనం తర్వాత / दोपहर खाने के बाद)',
      medicine: 'Multivitamin & Zinc Capsule',
      purpose: 'Immune & energy booster',
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.1)',
      teluguAudioText: 'మధ్యాహ్నం భోజనం చేసిన తర్వాత ఈ ఎరుపు రంగు క్యాప్సూల్ ఒకసారి వేసుకోండి.',
      hindiAudioText: 'दोपहर खाने के बाद यह लाल कैप्सूल एक बार लें।',
      englishAudioText: 'Take this red capsule once in the afternoon after having your lunch.'
    },
    {
      id: 'evening',
      isBundledSample: true,
      label: 'Evening',
      time: '05:30 PM',
      mealContext: 'With Evening Tea/Snack (సాయంత్రం / शाम को)',
      medicine: 'Steam Inhalation + Lozenges',
      purpose: 'Throat soothing & airway clearance',
      color: '#B45309',
      bg: 'rgba(217, 119, 6, 0.1)',
      teluguAudioText: 'సాయంత్రం వేళల్లో వేడి నీళ్ల ఆవిరి పట్టండి మరియు గొంతు నొప్పి తగ్గడానికి ఈ మాత్ర చప్పరించండి.',
      hindiAudioText: 'शाम के समय गर्म पानी की भाप लें और गले की राहत के लिए यह गोली चूसें।',
      englishAudioText: 'In the evening, take steam inhalation and dissolve this lozenge slowly for throat soothing.'
    },
    {
      id: 'night',
      isBundledSample: true,
      label: 'Night',
      time: '08:30 PM',
      mealContext: 'After Dinner (రాత్రి భోజనం తర్వాత / रात खाने के बाद)',
      medicine: 'Montelukast + Levocetirizine',
      purpose: 'Nocturnal cough & allergy prevention',
      color: '#047857',
      bg: 'rgba(16, 185, 129, 0.1)',
      teluguAudioText: 'రాత్రి భోజనం తర్వాత పడుకోవడానికి ముందు ఈ నీలం రంగు మాత్ర ఒకటి వేసుకోండి.',
      hindiAudioText: 'रात के खाने के बाद सोने से पहले यह नीली गोली एक बार लें।',
      englishAudioText: 'Take this blue tablet once at night after dinner before going to sleep.'
    }
  ]);

  // Manual Add Medicine Form State
  const [manualMedName, setManualMedName] = useState('Paracetamol 650mg');
  const [manualSlot, setManualSlot] = useState('morning');
  const [manualMealContext, setManualMealContext] = useState('After Meals (భోజనం తర్వాత)');
  const [manualPurpose, setManualPurpose] = useState('Fever & Bodyache relief');
  const [manualTeluguAudio, setManualTeluguAudio] = useState('జ్వరం లేదా ఒళ్ళు నొప్పులు ఉన్నప్పుడు భోజనం తర్వాత ఈ టాబ్లెట్ వేసుకోండి.');
  const [manualHindiAudio, setManualHindiAudio] = useState('बुखार या बदन दर्द होने पर खाना खाने के बाद यह गोली लें।');

  const currentPill = chronotherapySchedule.find(p => p.id === activePillSlot) || chronotherapySchedule[1];

  // Dynamic Synchronization with Selected Citizen or Family Member
  useEffect(() => {
    if (patientProfile?.chronotherapySchedule) {
      setChronotherapySchedule(patientProfile.chronotherapySchedule);
    }
    if (patientProfile?.reportsList) {
      setReportsList(patientProfile.reportsList);
    }
    if (patientProfile?.assignedDoctor?.doctorName) {
      setNewReportDoctor(patientProfile.assignedDoctor.doctorName);
    }
  }, [patientProfile]);

  const [activeAudioSlotId, setActiveAudioSlotId] = useState(null);
  const [audioFeedbackToast, setAudioFeedbackToast] = useState(null);

  const handlePlayVoicePrescription = (customText, slotId = 'default') => {
    // Bundled sample scripts may be voiced only while they are unchanged:
    // an exact match against the slot's packaged script. Edited or
    // patient-specific text is never voiced as if it were the sample regimen.
    const boundSlot = chronotherapySchedule.find(s => s.id === slotId);
    if (boundSlot?.isBundledSample) {
      const packaged = [boundSlot.teluguAudioText, boundSlot.hindiAudioText, boundSlot.englishAudioText].filter(Boolean);
      if (!packaged.includes(customText)) {
        setAudioFeedbackToast('Sample voice is available only for the unchanged bundled script. Edited dosage text is read on screen above.');
        setTimeout(() => setAudioFeedbackToast(null), 6000);
        return;
      }
    }
    if (isPlayingAudio && activeAudioSlotId === slotId) {
      speechService.stopSpeaking();
      setIsPlayingAudio(false);
      setActiveAudioSlotId(null);
    } else {
      if (isPlayingAudio) {
        speechService.stopSpeaking();
      }
      setIsPlayingAudio(true);
      setActiveAudioSlotId(slotId);
      setAudioFeedbackToast(null);

      const textToSpeak = customText || (selectedLanguage === 'Telugu' 
        ? currentPill.teluguAudioText 
        : (selectedLanguage === 'Hindi' ? currentPill.hindiAudioText : (currentPill.englishAudioText || currentPill.teluguAudioText)));
      const langCode = selectedLanguage === 'Telugu' ? 'te-IN' : (selectedLanguage === 'Hindi' ? 'hi-IN' : 'en-IN');

      speechService.speak(textToSpeak, {
        langCode,
        rate: 0.92,
        isDemo: false,
        onEnd: () => {
          setIsPlayingAudio(false);
          setActiveAudioSlotId(null);
        },
        onError: () => {
          setIsPlayingAudio(false);
          setActiveAudioSlotId(null);
          setAudioFeedbackToast('Spoken audio is currently unavailable in this browser. Please read the dosage instructions above.');
          setTimeout(() => setAudioFeedbackToast(null), 6000);
        }
      });
    }
  };

  const [isOpdMicListening, setIsOpdMicListening] = useState(false);

  const toggleOpdSpeechRecognition = async () => {
    if (isOpdMicListening) {
      speechService.stopLiveRecognition();
      setIsOpdMicListening(false);
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const targetLang = selectedLanguage === 'Telugu' ? 'te-IN' : (selectedLanguage === 'Hindi' ? 'hi-IN' : 'en-IN');
      setIsOpdMicListening(true);

      speechService.startLiveRecognition({
        langCode: targetLang,
        onResult: ({ finalTranscript, interimTranscript }) => {
          const spoken = finalTranscript || interimTranscript;
          if (spoken) {
            setPatientQuestion(spoken);
            if (finalTranscript.trim()) {
              handleSendChatWithText(finalTranscript.trim());
              setIsOpdMicListening(false);
            }
          }
        },
        onError: () => {
          setIsOpdMicListening(false);
          setChatMessages(prev => [
            ...prev,
            {
              sender: 'ai',
              text: 'Could not hear speech clearly. Please check microphone permission and try speaking again, or type your query below.'
            }
          ]);
        },
        onStatusChange: ({ isListening }) => {
          setIsOpdMicListening(isListening);
        }
      });
    } catch {
      setIsOpdMicListening(false);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'Microphone access was denied. Please allow microphone permission in your browser or type your query below.'
        }
      ]);
    }
  };

  const handleSendChatWithText = async (textToSend) => {
    if (!textToSend || !textToSend.trim()) return;
    const userText = textToSend.trim();
    setPatientQuestion('');

    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: userText },
      { sender: 'ai', text: 'Checking bundled sample references; no medical advice...' }
    ]);

    const targetLang = selectedLanguage === 'Telugu' ? 'te-IN' : (selectedLanguage === 'Hindi' ? 'hi-IN' : 'en-IN');

    try {
      const aiReply = await askAyuSwarBrain(userText, 'patient');
      setChatMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { sender: 'ai', text: aiReply };
        return updated;
      });

      // Speak reply aloud with barge-in support
      await speechService.speak(aiReply, { langCode: targetLang, isDemo: false });
    } catch {
      const fallbackReply = "AyuSwar demo guidance: this prototype does not provide medical advice or live facility hours. Please consult a qualified clinician. In an emergency, dial 112 or 108 immediately.";
      setChatMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { 
          sender: 'ai', 
          text: fallbackReply 
        };
        return updated;
      });
      await speechService.speak(fallbackReply, { langCode: targetLang, isDemo: false });
    }
  };

  const handleSendChat = async (e) => {
    e?.preventDefault();
    if (!patientQuestion.trim()) return;
    handleSendChatWithText(patientQuestion);
  };

  const isCollapsedView = isSidebarCollapsed && !mobileDrawerOpen;

  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 860 : false
  );
  const [isDeviceOnline, setIsDeviceOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleResize = () => setIsMobileScreen(window.innerWidth <= 860);
    const handleOnline = () => setIsDeviceOnline(true);
    const handleOffline = () => setIsDeviceOnline(false);

    window.addEventListener('resize', handleResize);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="patient-portal-container" style={{ display: 'flex', height: '100vh', maxHeight: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
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
          LEFT SIDEBAR (MATCHING SCREENSHOT 1 PATIENT SIDEBAR WITH COLLAPSIBLE ARROW)
          ========================================================================= */}
      <aside 
        className={`patient-portal-aside ${mobileDrawerOpen ? 'mobile-open' : ''}`}
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
            color: '#52707C',
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
          {/* Logo */}
          <div 
            onClick={() => window.location.href = '/'}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              paddingLeft: isCollapsedView ? '2px' : '8px', 
              marginBottom: '32px', 
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
              color: '#52707C',
              paddingLeft: '6px',
              marginBottom: '14px',
              fontFamily: 'var(--font-main)'
            }}>
              Citizen Workspace
            </div>
          )}

          {/* Navigation Items (Exact Lucide Icons & Sizing Matching User Design) */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            {[
              { id: 'home', label: t('patient.dashboard'), icon: LayoutGrid },
              { id: 'my_health', label: t('patient.myHealth'), icon: Heart },
              { id: 'appointments', label: t('patient.appointments'), icon: Calendar },
              { id: 'reports', label: t('patient.reports'), icon: FlaskConical },
              { id: 'medications', label: t('patient.prescriptions'), icon: ClipboardPlus },
              { id: 'ai_assistant', label: t('patient.aiAssistant'), icon: Sparkles },
              { id: 'health_goals', label: t('patient.healthGoals'), icon: Target },
              { id: 'settings', label: t('patient.settings'), icon: Settings }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'home' && activeTab === 'dashboard');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    triggerHaptic('light');
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
                title={t('patient.nav.appHome')}
                style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', background: 'transparent', border: 'none', borderTop: '1px dashed #D0DFE2', borderRadius: '10px', cursor: 'pointer', color: '#0F4C5C', fontSize: '13.5px', fontWeight: 700, textAlign: 'left', width: '100%' }}
              >
                <Home size={20} strokeWidth={1.9} />
                <span>{t('patient.nav.appHome')}</span>
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

        {/* Bottom Citizen Workspace & Preferences Card (Matching User Image) */}
        {!isCollapsedView ? (
          <div style={{ width: '100%' }}>
            <div style={{ borderTop: '1px solid #D0DFE2', margin: '14px 0 10px 0' }} />
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
                border: '1px solid #D0DFE2',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Citizen Health Records & Settings"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#0F4C5C',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '15px',
                  flexShrink: 0,
                  border: '2px solid rgba(0, 0, 0, 0.14)'
                }}>
                  {patientName[0]}
                </div>
                <div style={{ minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#081C24', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Citizen Workspace
                  </div>
                  <div style={{ fontSize: '11px', color: '#52707C', whiteSpace: 'nowrap' }}>
                    Sample health records
                  </div>
                </div>
              </div>
              <ChevronRight size={16} color="#52707C" />
            </div>

            {/* Prominent Clean Logout */}
            <button
              onClick={() => {
                setMobileDrawerOpen(false);
                if (onLogoutPatient) onLogoutPatient();
              }}
              className="portal-drawer-logout-btn"
              title="Logout from Patient Session"
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
                value={appLang}
                onChange={e => setAppLang(e.target.value)}
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
            borderTop: '1px solid #D0DFE2'
          }}>
            <div 
              onClick={() => setActiveTab('settings')}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#0F4C5C',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '14px',
                cursor: 'pointer'
              }}
              title="Citizen Workspace"
            >
              {patientName[0]}
            </div>
            <button
              onClick={() => {
                if (onLogoutPatient) onLogoutPatient();
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
          </div>
        )}
      </aside>

      {/* =========================================================================
          MAIN PATIENT WORKSPACE CANVAS
          ========================================================================= */}
      <div className="patient-portal-main-canvas" style={{ flex: 1, height: '100vh', maxHeight: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', width: '100%', maxWidth: '100vw', minWidth: 0, position: 'relative', zIndex: 1, background: 'transparent' }}>
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
          {/* Left: Mobile 3-Lines Hamburger Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Single-row mobile header extras (shell topbar hides on this route at <=768px) */}
                        <div className="portal-mobile-header-extra" style={{ alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <button
                type="button"
                className="portal-mobile-menu-btn"
                onClick={() => setMobileDrawerOpen(true)}
                style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.10)', background: '#FAF8F5', color: '#0F4C5C', cursor: 'pointer', flexShrink: 0 }}
                title="Open Citizen Navigation Menu"
                aria-label="Open navigation menu"
              >
                <Menu size={18} />
              </button>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#081C24', whiteSpace: 'nowrap' }}>Patient Portal</span>
            </div>
            
            <span className="patient-portal-title" style={{ fontSize: '15px', fontWeight: 800, color: '#081C24' }}>
              Citizen Health Dashboard
            </span>
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="patient-header-settings-btn"
              onClick={() => setActiveTab('settings')}
            style={{ 
              cursor: 'pointer',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: activeTab === 'settings' ? '1.5px solid #0F4C5C' : '1px solid #D0DFE2',
              background: activeTab === 'settings' ? 'rgba(0, 0, 0, 0.07)' : '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease',
              padding: 0
            }} 
            title="Citizen Settings & ABHA Locker Preferences"
          >
            <Settings size={18} className="hdr-icon-lucide" color={activeTab === 'settings' ? '#0F4C5C' : '#52707C'} />
            <img src="/assets/icons/sheet/settings.png" alt="" aria-hidden="true" className="hdr-icon-art" />
          </button>

          <button 
            className="patient-header-notifications-btn"
            onClick={() => setIsNotificationsDrawerOpen(true)}
            style={{ 
              position: 'relative', 
              cursor: 'pointer',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: isNotificationsDrawerOpen ? '1.5px solid #0F4C5C' : '1px solid #D0DFE2',
              background: isNotificationsDrawerOpen ? 'rgba(0, 0, 0, 0.07)' : '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease',
              padding: 0
            }} 
            title="Citizen Health Alerts & Reminders"
            aria-label="Open Health Notifications"
          >
            <Bell size={18} className="hdr-icon-lucide" color={isNotificationsDrawerOpen ? '#0F4C5C' : '#52707C'} />
            <img src="/assets/icons/sheet/notifications.png" alt="" aria-hidden="true" className="hdr-icon-art" />
            {unreadNotifCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '7px',
              right: '7px',
              minWidth: '15px',
              height: '15px',
              borderRadius: '8px',
              background: '#B91C1C',
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

          {/* Profile Trigger */}
          <div 
            className="patient-header-profile-badge"
            ref={profileMenuRef}
            onClick={() => {
              setIsProfileMenuOpen(!isProfileMenuOpen);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '12px',
              background: isProfileMenuOpen ? 'rgba(0, 0, 0, 0.06)' : 'transparent',
              transition: 'background 140ms ease',
              position: 'relative',
              minWidth: 0,
              flexShrink: 0
            }}
            title="Click to Switch Citizen Profile"
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#0F4C5C',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '15px',
              flexShrink: 0
            }}>
              {patientName[0]}
            </div>
            <div className="patient-header-profile-sub" style={{ textAlign: 'left', minWidth: 0 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 750, color: '#081C24', whiteSpace: 'nowrap' }}>{patientName}</div>
              <div style={{ fontSize: '11px', color: '#52707C', whiteSpace: 'nowrap' }}>{abhaId}</div>
            </div>
            <ChevronDown className="patient-header-profile-chevron" size={14} color="#52707C" style={{ transform: isProfileMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 180ms ease', flexShrink: 0 }} />

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div 
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '52px',
                  right: '0',
                  width: '190px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 18px 45px rgba(0, 0, 0, 0.11)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  padding: '14px',
                  zIndex: 200
                }}
              >
                {/* Sign Out lives in the avatar menu (no separate header button) */}
                <button
                  type="button"
                  onClick={() => { setIsProfileMenuOpen(false); if (onLogoutPatient) onLogoutPatient(); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer' }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Offline Indicator Pill */}
          {!isDeviceOnline && (
            <span style={{ fontSize: '11px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', padding: '3px 8px', borderRadius: '12px', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626' }}></span>
              Offline
            </span>
          )}

          {/* Prominent Header Logout Button */}
          <button
            className="patient-header-logout-btn"
            onClick={() => {
              if (onLogoutPatient) onLogoutPatient();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FEF2F2',
              border: '1.5px solid #FCA5A5',
              color: '#DC2626',
              padding: '7px 14px',
              borderRadius: '18px',
              fontSize: '12px',
              fontWeight: 750,
              cursor: 'pointer',
              transition: 'all 140ms ease'
            }}
            title="Securely exit patient seva portal"
          >
            <LogOut size={13} />
            <span>{t('auth.logout')}</span>
          </button>
        </div>
      </header>

        {/* Content Body */}
        <div className="patient-portal-content-body" style={{ padding: isMobileScreen ? '14px 12px 24px 12px' : '24px 28px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>

          {/* ---------------------------------------------------------------------
              TAB 1: HOME (MATCHING SCREENSHOT 1 PATIENT VIEW)
              --------------------------------------------------------------------- */}
          {activeTab === 'home' && (
            <>
              {/* Iconic AyuSwar Botanical Greeting Banner */}
              <div 
                className="ayuswar-banner-botanical"
                style={{
                  padding: '28px 32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px',
                  position: 'relative',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                {/* Hospital Facade Decorative Zone (Authentic Handoff Artwork) */}
                <div
                  className="patient-greeting-hospital-strip"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '44%',
                    maxWidth: '480px',
                    height: '130px',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    zIndex: 0
                  }}
                  aria-hidden="true"
                >
                  <img
                    src="/assets/ayuswar-hospital-crop.jpg"
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'right bottom',
                      opacity: 0.92,
                      maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 20%, rgba(0,0,0,1) 60%)',
                      WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 20%, rgba(0,0,0,1) 60%)'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', zIndex: 1 }}>
                  <DeepamHeartbeatEmblem size={58} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h1 style={{ fontSize: '26px', fontWeight: 850, color: '#081C24', fontFamily: 'var(--font-main)', margin: 0 }}>
                        {t('patient.home.greeting', { name: patientName.split(' ')[0] })}
                      </h1>
                      <span className="ayuswar-accent-badge">
                        <Leaf size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '4px' }} />AyuSwar
                      </span>
                    </div>
                    <p style={{ fontSize: '13.5px', color: '#486770', marginTop: '5px', fontWeight: 500, marginBottom: '6px' }}>
                      {t('patient.home.subtitle')}
                    </p>
{(() => {
                      const idDisclosure = (
                        <>
                    <AbdmRegistryBadgeRow
                      abhaNumber={activeDemoPatient?.abhaNumber || abhaId}
                      abhaAddress={activeDemoPatient?.abhaAddress}
                      hprId={activeDemoPatient?.hprId || assignedDoctor?.hprId || 'DEMO-CLINICIAN-2026'}
                      doctorName={activeDemoPatient?.doctorName || assignedDoctor?.doctorName || 'Dr. Demo Clinician (synthetic)'}
                      hfrId={activeDemoPatient?.hfrId || 'DEMO-FACILITY-2026'}
                      facilityName={activeDemoPatient?.facilityName || assignedDoctor?.facility || 'Synthetic Demo Facility'}
                      icd10={activeDemoPatient?.icd10}
                      icd10Desc={activeDemoPatient?.icd10Desc}
                      snomedCt={activeDemoPatient?.snomedCt}
                      snomedDesc={activeDemoPatient?.snomedDesc}
                      compact={false}
                      style={{ marginTop: '6px' }}
                    />

                    {/* ABHA Verified Card positioned on left under registry chips matching reference design */}
                    <div style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '4px',
                      marginTop: '12px',
                      background: 'rgba(255, 255, 255, 0.94)',
                      backdropFilter: 'blur(10px)',
                      padding: '8px 16px',
                      borderRadius: '14px',
                      border: '1px solid rgba(0, 0, 0, 0.10)',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.03)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px'
                      }}>
                        <Shield size={14} />
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F4C5C' }}>
                          {t('patient.home.sampleRecord')}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#52707C', fontWeight: 650 }}>
                        {t('patient.home.demoId')} <code style={{ color: '#0F4C5C', fontWeight: 750 }}>{abhaId}</code>
                      </span>
                    </div>
                        </>
                      );
                      if (!isMobileScreen) return idDisclosure;
                      return (
                        <details style={{ marginTop: '8px', maxWidth: '100%' }}>
                          <summary style={{ listStyle: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800, color: '#0F4C5C', background: 'rgba(255,255,255,0.94)', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '999px', padding: '6px 12px', cursor: 'pointer' }}>
                            <Shield size={13} /> {t('patient.home.sampleRecord')} · {abhaId}
                          </summary>
                          <div style={{ marginTop: '8px' }}>{idDisclosure}</div>
                        </details>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* 4 Action Quick Cards (Authentic Handoff Pastel Tints) */}
              <div className="patient-quick-actions-grid" style={{
                display: 'grid',
                gridTemplateColumns: isMobileScreen ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: isMobileScreen ? '12px' : '18px',
                marginBottom: '26px',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <div 
                  onClick={() => setActiveTab('appointments')} 
                  className="ayuswar-glass-card" 
                  style={{ 
                    padding: '22px 18px', 
                    cursor: 'pointer', 
                    textAlign: 'center',
                    background: '#FFFFFF',
                    border: '1.5px solid rgba(15, 23, 42, 0.14)',
                    borderRadius: '20px',
                    boxShadow: '0 4px 18px -2px rgba(15, 76, 92, 0.05), 0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  <div className="qc-icon qc-appointments" style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(15, 76, 92, 0.10)', color: '#0F4C5C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                    <Calendar size={22} />
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#081C24', marginBottom: '4px' }}>
                    {t('patient.home.bookAppointment')}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#486770' }}>
                    {t('patient.home.bookAppointmentSub')}
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('my_health')} 
                  className="ayuswar-glass-card" 
                  style={{ 
                    padding: '22px 18px', 
                    cursor: 'pointer', 
                    textAlign: 'center',
                    background: '#FFFFFF',
                    border: '1.5px solid rgba(15, 23, 42, 0.14)',
                    borderRadius: '20px',
                    boxShadow: '0 4px 18px -2px rgba(220, 38, 38, 0.05), 0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  <div className="qc-icon qc-health" style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.10)', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                    <Heart size={22} />
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#081C24', marginBottom: '4px' }}>
                    {t('patient.home.myHealth')}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#486770' }}>
                    {t('patient.home.myHealthSub')}
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('reports')} 
                  className="ayuswar-glass-card" 
                  style={{ 
                    padding: '22px 18px', 
                    cursor: 'pointer', 
                    textAlign: 'center',
                    background: '#FFFFFF',
                    border: '1.5px solid rgba(15, 23, 42, 0.14)',
                    borderRadius: '20px',
                    boxShadow: '0 4px 18px -2px rgba(16, 185, 129, 0.05), 0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  <div className="qc-icon qc-upload" style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.12)', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                    <Upload size={22} />
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#081C24', marginBottom: '4px' }}>
                    {t('patient.home.uploadReports')}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#486770' }}>
                    {t('patient.home.uploadReportsSub')}
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('medications')} 
                  className="ayuswar-glass-card" 
                  style={{ 
                    padding: '22px 18px', 
                    cursor: 'pointer', 
                    textAlign: 'center',
                    background: '#FFFFFF',
                    border: '1.5px solid rgba(15, 23, 42, 0.14)',
                    borderRadius: '20px',
                    boxShadow: '0 4px 18px -2px rgba(217, 119, 6, 0.05), 0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  <div className="qc-icon qc-meds" style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'rgba(217, 119, 6, 0.12)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                    <Pill size={22} />
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#081C24', marginBottom: '4px' }}>
                    {t('patient.home.viewRx')}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#486770' }}>
                    {t('patient.home.viewRxSub')}
                  </div>
                </div>
              </div>

              {/* Middle Section: Left (Appointments, Vitals, Reports) | Right (Chat, Goals, Doctor card) */}
              <div className="patient-dashboard-grid" style={{ display: 'grid', gridTemplateColumns: isMobileScreen ? '1fr' : '1.08fr 0.92fr', gap: '22px', marginBottom: '26px', width: '100%', boxSizing: 'border-box' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Upcoming Appointments */}
                  <div className="ayuswar-glass-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', fontFamily: 'var(--font-main)' }}>
                        {t('patient.home.upcoming')}
                      </h3>
                      <span onClick={() => setActiveTab('appointments')} style={{ fontSize: '12px', fontWeight: 700, color: '#0F4C5C', cursor: 'pointer' }}>{t('patient.home.viewAll')}</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: '#F8FAFC',
                      border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 2px 10px -2px rgba(0, 0, 0, 0.02)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: '10px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#1D4ED8',
                          fontSize: '12px',
                          fontWeight: 800,
                          textAlign: 'center',
                          lineHeight: 1.2
                        }}>
                          Thu<br /><span style={{ fontSize: '14px' }}>Nov 19</span>
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 750, color: '#081C24' }}>{assignedDoctor.doctorName}</div>
                          <div style={{ fontSize: '11.5px', color: '#52707C' }}>{assignedDoctor.specialty} • 10:15 AM • {t('patient.home.onlineConsult')}</div>
                        </div>
                      </div>

                      <button 
                        onClick={() => alert(`Launching video session with ${assignedDoctor.doctorName}...`)}
                        style={{
                          background: '#0F4C5C',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '7px 18px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {t('patient.home.join')}
                      </button>
                    </div>
                  </div>

                  {/* Health Overview (Vitals) */}
                  <div className="ayuswar-glass-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', fontFamily: 'var(--font-main)', margin: 0 }}>
                          {t('patient.home.healthOverview')}
                        </h3>
                        {(() => {
                          const latestVitals = vitalsHistory?.[0] || {};
                          const sys = parseInt(latestVitals.bp?.split('/')[0]) || 120;
                          const hr = parseInt(latestVitals.pulse) || 72;
                          const spo2 = parseInt(latestVitals.spo2) || 98;
                          const mews = calculateMewsScore({ bpSystolic: sys, hr, spo2 });
                          return (
                            <span style={{ fontSize: '11px', background: mews.riskBg, color: mews.riskColor, padding: '2px 8px', borderRadius: '10px', fontWeight: 800, border: `1px solid ${mews.riskColor}33` }}>
                              MEWS {mews.score}: {t('patient.home.mewsSampleNote')}
                            </span>
                          );
                        })()}
                      </div>
                      <span onClick={() => setActiveTab('my_health')} style={{ fontSize: '12px', fontWeight: 700, color: '#0F4C5C', cursor: 'pointer' }}>{t('patient.home.viewDetails')}</span>
                    </div>

                    <div className="patient-vitals-summary-grid" style={{ display: 'grid', gridTemplateColumns: isMobileScreen ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
                      <div className="stripe-card" style={{ background: '#F8FAFD', padding: '14px 12px 10px 12px', borderRadius: '10px', border: '1px solid #E5EDF5', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Heart size={14} color="#B91C1C" />
                          <span style={{ fontSize: '11px', color: '#50617A', fontWeight: 650 }}>{t('patient.home.heartRate')}</span>
                        </div>
                        <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 800, color: '#061B31', marginTop: '4px', letterSpacing: '-0.02em' }}>
                          {vitalsHistory?.[0]?.pulse || '76 bpm'}
                        </div>
                        <svg width="100%" height="20" viewBox="0 0 100 20" fill="none" style={{ marginTop: '4px', display: 'block' }} aria-hidden="true">
                          <path d="M0,10 L30,10 L36,4 L42,16 L48,2 L54,18 L60,10 L100,10" stroke="#047857" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span style={{ fontSize: '10px', color: '#047857', fontWeight: 750, background: '#ECFDF5', padding: '1px 6px', borderRadius: '4px' }}>{t('patient.home.normalChip')} (72-80)</span>
                      </div>

                      <div className="stripe-card" style={{ background: '#F8FAFD', padding: '14px 12px 10px 12px', borderRadius: '10px', border: '1px solid #E5EDF5', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Activity size={14} color="#0F4C5C" />
                          <span style={{ fontSize: '11px', color: '#50617A', fontWeight: 650 }}>{t('patient.home.bloodPressure')}</span>
                        </div>
                        <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 800, color: '#061B31', marginTop: '4px', letterSpacing: '-0.02em' }}>
                          {vitalsHistory?.[0]?.bp ? vitalsHistory[0].bp.replace(' mmHg', '') : '132/84'}
                        </div>
                        <svg width="100%" height="20" viewBox="0 0 100 20" fill="none" style={{ marginTop: '4px', display: 'block' }} aria-hidden="true">
                          <path d="M0,12 Q25,8 50,11 T100,9" stroke="#0F4C5C" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M0,16 Q25,14 50,15 T100,14" stroke="#D4AF37" strokeWidth="1.3" strokeDasharray="2 2" strokeLinecap="round" />
                        </svg>
                        <span style={{ fontSize: '10px', color: '#047857', fontWeight: 750, background: '#ECFDF5', padding: '1px 6px', borderRadius: '4px' }}>
                          {vitalStatusLabel(vitalsHistory?.[0]?.status || 'Normal')}
                        </span>
                      </div>

                      <div className="stripe-card" style={{ background: '#F8FAFD', padding: '14px 12px 10px 12px', borderRadius: '10px', border: '1px solid #E5EDF5', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Scale size={14} color="#1D4ED8" />
                          <span style={{ fontSize: '11px', color: '#50617A', fontWeight: 650 }}>{t('patient.home.weight')}</span>
                        </div>
                        <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 800, color: '#061B31', marginTop: '4px', letterSpacing: '-0.02em' }}>
                          {vitalsHistory?.[0]?.weight || '63 kg'}
                        </div>
                        <svg width="100%" height="20" viewBox="0 0 100 20" fill="none" style={{ marginTop: '4px', display: 'block' }} aria-hidden="true">
                          <path d="M0,11 Q30,13 60,9 T100,10" stroke="#1D4ED8" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <span style={{ fontSize: '10px', color: '#047857', fontWeight: 750, background: '#ECFDF5', padding: '1px 6px', borderRadius: '4px' }}>BMI 22.4 · {t('patient.home.vitalStatus.Ideal')}</span>
                      </div>

                      <div className="stripe-card" style={{ background: '#F8FAFD', padding: '14px 12px 10px 12px', borderRadius: '10px', border: '1px solid #E5EDF5', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Moon size={14} color="#7C3AED" />
                          <span style={{ fontSize: '11px', color: '#50617A', fontWeight: 650 }}>{t('patient.home.sleepQuality')}</span>
                        </div>
                        <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 800, color: '#061B31', marginTop: '4px', letterSpacing: '-0.02em' }}>7.5 hrs</div>
                        <svg width="100%" height="20" viewBox="0 0 100 20" fill="none" style={{ marginTop: '4px', display: 'block' }} aria-hidden="true">
                          <path d="M0,14 Q25,6 50,7 T100,12" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                        <span style={{ fontSize: '10px', color: '#7C3AED', fontWeight: 750, background: '#F5F3FF', padding: '1px 6px', borderRadius: '4px' }}>88% {t('patient.home.vitalStatus.Rested')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Reports */}
                  <div className="ayuswar-glass-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', fontFamily: 'var(--font-main)' }}>
                        {t('patient.home.recentReports')}
                      </h3>
                      <span onClick={() => setActiveTab('reports')} style={{ fontSize: '12px', fontWeight: 700, color: '#0F4C5C', cursor: 'pointer' }}>{t('patient.home.viewAll')}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { title: t('patient.home.repChest'), date: formatDemoDate(-3), Icon: FileText },
                        { title: t('patient.home.repBlood'), date: formatDemoDate(-5), Icon: Droplets },
                        { title: t('patient.home.repLung'), date: formatDemoDate(-7), Icon: Wind }
                      ].map((rep, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: '#FAF8F5',
                          border: '1px solid #F1F5F9'
                        }}>
                          <div className="patient-report-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <rep.Icon size={15} color="#0F4C5C" />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#081C24' }}>{rep.title}</div>
                              <div style={{ fontSize: '11px', color: '#52707C' }}>{rep.date}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setActiveTab('reports')}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '6px',
                              border: '1px solid rgba(0, 0, 0, 0.08)',
                              background: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {t('patient.home.view')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Dedicated Care Team & Clinician Teleconsult Card */}
                  <div className="ayuswar-glass-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#047857', display: 'inline-block' }}></span>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#081C24', fontFamily: 'var(--font-main)', margin: 0 }}>
                          {t('patient.home.careTeam')}
                        </h3>
                      </div>
                      <span style={{ fontSize: '11px', color: '#0F4C5C', background: 'rgba(0, 0, 0, 0.06)', padding: '3px 8px', borderRadius: '10px', fontWeight: 750 }}>
                        {t('patient.home.districtOpd')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid #0F4C5C',
                        flexShrink: 0
                      }}>
                        <img 
                          src="/assets/dr_ananya_avatar.jpg" 
                          alt={assignedDoctor.doctorName} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#081C24' }}>
                          {assignedDoctor.doctorName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#52707C' }}>
                          {assignedDoctor.specialty}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#047857', fontWeight: 700, marginTop: '2px' }}>
                          {t('patient.home.teleAvailable')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        onClick={() => { setActiveTab('appointments'); setIsBookConsultationModalOpen(true); }}
                        style={{
                          flex: 1,
                          padding: '9px',
                          borderRadius: '10px',
                          border: 'none',
                          background: '#0F4C5C',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 750,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)'
                        }}
                      >
                        <Calendar size={13} />
                        <span>{t('patient.home.bookVisit')}</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('medications')}
                        style={{
                          flex: 1,
                          padding: '9px',
                          borderRadius: '10px',
                          border: '1px solid rgba(0, 0, 0, 0.14)',
                          background: '#FAF8F5',
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
                        <Pill size={13} />
                        <span>Audio-Rx</span>
                      </button>
                    </div>
                  </div>

                  {/* Health Goals Card */}
                  <div className="ayuswar-glass-card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#081C24', fontFamily: 'var(--font-main)', margin: 0 }}>
                        {t('patient.home.dailyAdherence')}
                      </h3>
                      <span onClick={() => setActiveTab('health_goals')} style={{ fontSize: '12px', fontWeight: 700, color: '#0F4C5C', cursor: 'pointer' }}>{t('patient.home.viewAll')}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        border: '4px solid #0F4C5C',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                        fontWeight: 850,
                        color: '#081C24',
                        flexShrink: 0,
                        background: '#FAF8F5'
                      }}>
                        4/5
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 750, color: '#081C24' }}>{t('patient.home.adherenceStatus')}</div>
                        <div style={{ fontSize: '12px', color: '#52707C', marginTop: '2px' }}>{t('patient.home.nextDoseSample')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Better Health Together Card */}
                  <div className="ayuswar-glass-card" style={{
                    background: '#FAF8F5',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)'
                  }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#081C24' }}>Better Health Together</h4>
                      <div style={{ fontSize: '11px', color: '#006D6D', margin: '2px 0 10px 0' }}>Ask. Learn. Stay Healthy.</div>
                      <button
                        onClick={() => setActiveTab('my_health')}
                        style={{
                          background: '#0A2540',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 14px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        View Health Records
                      </button>
                    </div>

                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid #ffffff',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
                    }}>
                      <img src="/assets/dr_ananya_avatar.jpg" alt="Doctor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ---------------------------------------------------------------------
              TAB 2: MY HEALTH (HEALTH ID CARD & VITALS HISTORY)
              --------------------------------------------------------------------- */}
          {activeTab === 'my_health' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#081C24', fontFamily: 'var(--font-main)', margin: 0 }}>
                    {t('patient.home.profileIdCard')}
                  </h2>
                  <SampleDataChip text={t('patient.common.sampleData')} />
                </div>
                <p style={{ fontSize: '13px', color: '#2E4753', margin: '4px 0 0 0' }}>
                  {t('patient.home.idCardSub')}
                </p>
              </div>

              {/* Honest Health ID (demo) Card */}
              <div style={{ marginBottom: '24px', maxWidth: '580px' }}>
                <div style={{
                  background: '#0F4C5C',
                  borderRadius: '20px',
                  padding: '24px',
                  color: '#ffffff',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.14)',
                  border: '1.5px solid rgba(0, 0, 0, 0.14)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 850, letterSpacing: '-0.2px' }}>Health ID (demo)</span>
                        <SampleDataChip text={t('patient.common.sampleData')} style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#A5F3FC', marginTop: '2px' }}>
                        AyuSwar AI Fictional Health Demonstration Record
                      </div>
                    </div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      background: 'rgba(255,255,255,0.12)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      borderRadius: '12px',
                      padding: '3px 9px',
                      color: '#E0F2FE'
                    }}>
                      DEMO ONLY
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.18)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '30px',
                      flexShrink: 0
                    }}>
                      {activeDemoPatient?.avatar ? <img src={activeDemoPatient.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : <User size={30} color="#ffffff" strokeWidth={1.8} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff' }}>
                        {activeDemoPatient?.name || patientName}
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#93C5FD', marginTop: '2px' }}>
                        Age: {activeDemoPatient?.age || 58} y • Gender: {activeDemoPatient?.genderLabel || 'Female'} • Blood: {activeDemoPatient?.bloodGroup || 'B+'}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: '#5EEAD4', marginTop: '4px' }}>
                        {activeDemoPatient?.abhaId || abhaId}
                      </div>
                    </div>
                  </div>

                  {/* ABDM Planned Line */}
                  <div style={{
                    fontSize: '11px',
                    color: '#D0DFE2',
                    background: 'rgba(0,0,0,0.25)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px dashed rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    <span>External registry integration: <strong>NOT CONNECTED</strong></span>
                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>Non-production demonstration</span>
                  </div>
                </div>
              </div>

              {/* Longitudinal Vitals Tracker (Manual Entry + Automated Lab Report Sync) */}
              <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#081C24', margin: 0 }}>
                        Longitudinal Vitals Tracker
                      </h3>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#065F46',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#047857', display: 'inline-block' }}></span>
                        Auto-Sync from Reports Active
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#52707C', margin: '4px 0 0 0' }}>
                      Self-entered demo values & bundled report previews. Computed from logged record entries.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleSyncVitalsFromReports}
                      style={{
                        background: '#FAF8F5',
                        color: '#0F4C5C',
                        border: '1.5px solid rgba(0, 0, 0, 0.16)',
                        borderRadius: '10px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 120ms ease'
                      }}
                      title="Preview sample report parsing; verify every value"
                    >
                      <Zap size={14} color="#0F4C5C" />
                      <span>Auto-Sync from Reports</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsAddVitalsModalOpen(true)}
                      style={{
                        background: '#0F4C5C',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 750,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.14)',
                        transition: 'all 120ms ease'
                      }}
                    >
                      <Plus size={15} />
                      <span>+ Add Vitals Manually</span>
                    </button>
                  </div>
                </div>

                {vitalsToastMessage && (
                  <div style={{
                    background: '#ECFDF5',
                    border: '1.5px solid #047857',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    color: '#065F46',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                    animation: 'fadeIn 0.2s ease'
                  }}>
                    <CheckCircle2 size={16} color="#047857" />
                    <span>{vitalsToastMessage}</span>
                  </div>
                )}

                {/* Vitals History Grid */}
                <div className="patient-vitals-history-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px', width: '100%' }}>
                  {vitalsHistory.map((v, i) => {
                    const isReportSource = v.sourceType === 'report';
                    return (
                      <div 
                        key={v.id || i} 
                        style={{ 
                          background: isReportSource ? '#F8FAFC' : '#FAF8F5', 
                          padding: '16px', 
                          borderRadius: '14px', 
                          border: isReportSource ? '1px solid rgba(15, 76, 92, 0.25)' : '1px solid rgba(0, 0, 0, 0.07)', 
                          boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.03)',
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px'
                        }}
                      >
                        <div>
                          {/* Top row: Date & Source Badge */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '8px' }}>
                            <div>
                              <div style={{ fontSize: '12px', color: '#0F4C5C', fontWeight: 800 }}>
                                {v.date || formatDemoDate(v.offsetDays || 0)}
                              </div>
                              <div style={{ fontSize: '11px', color: '#52707C', fontWeight: 600 }}>
                                {v.relativeLabel ? `(${v.relativeLabel})` : `(${getRelativeDaysLabel(v.offsetDays || 0)})`}
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isReportSource ? (
                                <span style={{
                                  fontSize: '10px',
                                  background: '#EEF2FF',
                                  color: '#4338CA',
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  fontWeight: 800,
                                  border: '1px solid #C7D2FE',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}>
                                  <Zap size={10} />
                                  <span>REPORT</span>
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '10px',
                                  background: '#ECFDF5',
                                  color: '#065F46',
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  fontWeight: 800,
                                  border: '1px solid #A7F3D0'
                                }}>
                                  MANUAL
                                </span>
                              )}

                              {vitalsHistory.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVital(v.id)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#94A3B8',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '4px'
                                  }}
                                  title="Delete record"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* BP */}
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ fontSize: '14px', color: '#081C24' }}>
                              BP: <strong style={{ fontWeight: 800 }}>{v.bp}</strong>
                            </div>
                            {v.status && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: v.status.includes('Normal') || v.status.includes('Optimal') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(234, 88, 12, 0.1)',
                                color: v.status.includes('Normal') || v.status.includes('Optimal') ? '#065F46' : '#C2410C'
                              }}>
                                {v.status}
                              </span>
                            )}
                          </div>

                          {/* Pulse & SpO2 */}
                          <div style={{ fontSize: '12.5px', color: '#2C4A52', marginBottom: '4px' }}>
                            Pulse: <strong>{v.pulse}</strong> • SpO2: <strong>{v.spo2}</strong>
                          </div>

                          {/* Weight & Blood Sugar */}
                          <div style={{ fontSize: '12px', color: '#486770', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            <span>Weight: <strong>{v.weight}</strong></span>
                            {v.bloodSugar && <span>• Glucose: <strong>{v.bloodSugar}</strong></span>}
                          </div>
                        </div>

                        {/* Source Note Footer */}
                        <div style={{ 
                          fontSize: '10.5px', 
                          color: '#52707C', 
                          borderTop: '1px dashed rgba(0, 0, 0, 0.08)', 
                          paddingTop: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>{v.source || 'Community Health Worker Visit'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: '#52707C' }}>
                  <span>Note: Health parameters reflect demo simulation data. Always seek professional physician evaluation for clinical readings.</span>
                  <span style={{ fontWeight: 700, color: '#0F4C5C' }}>{vitalsHistory.length} recordings logged</span>
                </div>
              </div>

              {/* Add Vitals Manually Modal */}
              {isAddVitalsModalOpen && (
                <div className="modal-overlay" style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(8, 28, 36, 0.7)',
                  backdropFilter: 'blur(4px)',
                  padding: '20px'
                }}>
                  <div className="modal-content" style={{
                    background: '#ffffff',
                    width: '100%',
                    maxWidth: '520px',
                    borderRadius: '18px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden'
                  }}>
                    {/* Header */}
                    <div style={{
                      background: '#0F4C5C',
                      padding: '18px 24px',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div className="patient-report-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={22} color="#2DD4BF" />
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-main)' }}>
                            Add Vitals Manually
                          </h3>
                          <div style={{ fontSize: '12px', color: '#D0DFE2', marginTop: '2px' }}>
                            Self-enter home readings or health worker visit measurements
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsAddVitalsModalOpen(false)}
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

                    {/* Form Body */}
                    <form noValidate onSubmit={handleVitalsSubmit(handleSaveManualVitals)} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {Object.keys(vitalsErrors).length > 0 && (
                        <div role="alert" aria-live="assertive" style={{ background: '#FEF2F2', border: '1px solid #B91C1C', borderRadius: '10px', padding: '10px 14px' }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#B91C1C', marginBottom: '4px' }}>
                            Please correct {Object.keys(vitalsErrors).length} field{Object.keys(vitalsErrors).length > 1 ? 's' : ''} — nothing was saved:
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#7F1D1D' }}>
                            {Object.entries(vitalsErrors).map(([field, err]) => (
                              <li key={field}><strong>{field}</strong>: {String(err?.message ?? '')}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {/* Date & Recording Context */}
                      <div className="patient-vitals-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                            Measurement Date
                          </label>
                          <input
                            type="text"
                            {...registerVital('date')}
                            placeholder="e.g. 23 Oct 2026"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '13px' }}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                            Recording Source / Location
                          </label>
                          <select
                            {...registerVital('sourceNote')}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '13px' }}
                          >
                            <option value="Self-measured at home">Home Self-Check (Digital Meter)</option>
                            <option value="Community Health Worker Visit">Community Health Worker (ASHA / ANM Visit)</option>
                            <option value="Village PHC OPD Health Camp">Village PHC OPD Health Camp</option>
                            <option value="Local Jan Aushadhi Pharmacy Check">Local Jan Aushadhi Pharmacy</option>
                          </select>
                        </div>
                      </div>

                      {/* Blood Pressure Fields */}
                      <div style={{ background: '#FAF8F5', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 750, color: '#081C24' }}>Blood Pressure (BP)</span>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#52707C' }}>
                            Self-reported; not clinically reviewed
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', color: '#52707C', marginBottom: '4px' }}>Systolic (mmHg)</label>
                            <input
                              type="number"
                              {...registerVital('systolic')}
                              placeholder="e.g. 120"
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D0DFE2', fontSize: '14px', fontWeight: 700 }}
                              required
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', color: '#52707C', marginBottom: '4px' }}>Diastolic (mmHg)</label>
                            <input
                              type="number"
                              {...registerVital('diastolic')}
                              placeholder="e.g. 80"
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #D0DFE2', fontSize: '14px', fontWeight: 700 }}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Pulse & SpO2 & Weight */}
                      <div className="patient-vitals-modal-grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', width: '100%' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 750, color: '#081C24', marginBottom: '4px' }}>
                            Pulse / HR (bpm)
                          </label>
                          <input
                            type="number"
                            {...registerVital('pulse')}
                            placeholder="e.g. 74"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '13px' }}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 750, color: '#081C24', marginBottom: '4px' }}>
                            SpO2 (%)
                          </label>
                          <input
                            type="number"
                            {...registerVital('spo2')}
                            placeholder="e.g. 98"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '13px' }}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 750, color: '#081C24', marginBottom: '4px' }}>
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            {...registerVital('weight')}
                            placeholder="e.g. 63"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '13px' }}
                            required
                          />
                        </div>
                      </div>

                      {/* Blood Sugar (optional) */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 750, color: '#081C24', marginBottom: '4px' }}>
                          Fasting / Random Blood Sugar (mg/dL) - Optional
                        </label>
                        <input
                          type="number"
                          {...registerVital('bloodSugar')}
                          placeholder="e.g. 104"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '13px' }}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setIsAddVitalsModalOpen(false)}
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
                          type="button"
                          onClick={handleClearVitalsForm}
                          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #B91C1C', background: '#FFFFFF', color: '#B91C1C', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Clear
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
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)'
                          }}
                        >
                          <CheckCircle2 size={16} />
                          <span>Save Vitals Entry</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------------------
              TAB 3: APPOINTMENTS (BOOKING & ONLINE CONSULTATION)
              --------------------------------------------------------------------- */}
          {activeTab === 'appointments' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#081C24', fontFamily: 'var(--font-main)', margin: 0 }}>
                      {t('patient.appts.title')}
                    </h2>
                    <SampleDataChip text={t('patient.common.sampleData')} />
                  </div>
                  <p style={{ fontSize: '13px', color: '#2E4753', margin: '4px 0 0 0' }}>
                    {t('patient.appts.subtitle')}
                  </p>
                </div>

                <button
                  onClick={() => setIsBookConsultationModalOpen(true)}
                  style={{
                    background: '#0F4C5C',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 750,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.16)'
                  }}
                >
                  <Plus size={16} />
                  <span>{t('patient.appts.bookNew')}</span>
                </button>
              </div>

              {bookingSuccessToast && (
                <div style={{
                  background: '#ECFDF5',
                  border: '1.5px solid #047857',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  color: '#065F46',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '16px'
                }}>
                  <CheckCircle2 size={18} color="#047857" />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span>{t('patient.appts.toastSaved')}</span>
                    {bookedTicket && (
                      <button
                        onClick={() => setShowTicketModal(true)}
                        style={{
                          background: '#0F4C5C',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '5px 12px',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}
                      >
                        {t('patient.appts.viewTicket')}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Interactive Book Consultation Modal */}
              {isBookConsultationModalOpen && (
                <div className="modal-overlay" style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(8, 28, 36, 0.7)',
                  backdropFilter: 'blur(4px)',
                  padding: '20px'
                }}>
                  <div className="modal-content" style={{
                    background: '#ffffff',
                    width: '100%',
                    maxWidth: '520px',
                    borderRadius: '18px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden'
                  }}>
                    {/* Header */}
                    <div style={{
                      background: '#0F4C5C',
                      padding: '18px 24px',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div className="patient-report-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calendar size={22} color="#2DD4BF" />
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-main)', color: '#ffffff' }}>
                            {t('patient.appts.modalTitle')}
                          </h3>
                          <div style={{ fontSize: '12px', color: '#D0DFE2', marginTop: '2px' }}>
                            AyuSwar Demo District Hospital • synthetic facility
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsBookConsultationModalOpen(false)}
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

                    {/* Body Form */}
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Select Doctor */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                          {t('patient.appts.selectDoctor')}
                        </label>
                        <select
                          value={bookingDoctor}
                          onChange={e => {
                            setBookingDoctor(e.target.value);
                            if (e.target.value.includes('Clinician B')) setBookingSpecialty('Cardiology & Hypertension (demo)');
                            else setBookingSpecialty('General Medicine (demo)');
                          }}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '13px', fontWeight: 700, color: '#081C24' }}
                        >
                          <option value="Dr. Demo Clinician (synthetic)">Dr. Demo Clinician A (synthetic) - General Medicine (demo)</option>
                          <option value="Dr. Demo Clinician B (synthetic)">Dr. Demo Clinician B (synthetic) (Cardiology & Heart Health)</option>
                          <option value="Dr. Demo Clinician C (synthetic)">Dr. Demo Clinician C (synthetic) (General Medicine & Diabetology)</option>
                          <option value="Dr. Demo Clinician D (synthetic)">Dr. Demo Clinician D (synthetic) (Pediatrics & Child Care)</option>
                        </select>
                      </div>

                      {/* Select Date */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                          {t('patient.appts.selectDate')}
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {bookingDateOptions.map(d => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setBookingDate(d)}
                              style={{
                                flex: 1,
                                padding: '8px 10px',
                                borderRadius: '8px',
                                border: bookingDate === d ? '2px solid #0F4C5C' : '1px solid #D0DFE2',
                                background: bookingDate === d ? 'rgba(0, 0, 0, 0.07)' : '#ffffff',
                                color: bookingDate === d ? '#0F4C5C' : '#486770',
                                fontSize: '12px',
                                fontWeight: 750,
                                cursor: 'pointer'
                              }}
                            >
                              {bookingDateLabel(d)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Select Time Slot with Dynamic Real-Time Allocation */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24' }}>
                            {t('patient.appts.selectSlot')}
                          </label>
                          <span style={{ fontSize: '10.5px', color: '#B45309', fontWeight: 750 }}>
                            ● {t('patient.appts.realtime')}
                          </span>
                        </div>
                        {/* Practo-Style Day-Phase Grouped Slots (Morning & Afternoon) */}
                        {(() => {
                          const allSlots = opdQueueService.getSlotsForDate(bookingDate === 0 ? 'Today' : bookingDateLabel(bookingDate));
                          const morningSlots = allSlots.filter(s => s.time.includes('AM') || s.time.startsWith('12:'));
                          const afternoonSlots = allSlots.filter(s => !morningSlots.includes(s));
                          const morningOpen = morningSlots.filter(s => s.isAvailable).length;
                          const afternoonOpen = afternoonSlots.filter(s => s.isAvailable).length;

                          const renderSlotGroup = (title, icon, openCount, slots) => (
                            <div style={{ marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 750, color: '#0F4C5C', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>{icon}</span> {title}
                                </span>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: openCount > 0 ? '#047857' : '#94A3B8', background: openCount > 0 ? '#ECFDF5' : '#F1F5F9', padding: '1px 6px', borderRadius: '4px' }}>
                                  {t('patient.appts.slotsOpen').replace('{n}', String(openCount))}
                                </span>
                              </div>
                              <div className="patient-time-slots-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', width: '100%' }}>
                                {slots.map(slotObj => {
                                  const isOccupied = !slotObj.isAvailable;
                                  const isSelected = bookingTime === slotObj.time;
                                  return (
                                    <button
                                      key={slotObj.time}
                                      type="button"
                                      disabled={isOccupied}
                                      onClick={() => !isOccupied && setBookingTime(slotObj.time)}
                                      style={{
                                        padding: '8px 6px',
                                        borderRadius: '8px',
                                        border: isSelected 
                                          ? '2px solid #0F4C5C' 
                                          : isOccupied 
                                          ? '1px dashed #CBD5E1' 
                                          : '1px solid #D0DFE2',
                                        background: isSelected 
                                          ? '#0A2540' 
                                          : isOccupied 
                                          ? '#F8FAFC' 
                                          : '#FFFFFF',
                                        color: isSelected 
                                          ? '#ffffff' 
                                          : isOccupied 
                                          ? '#94A3B8' 
                                          : '#0F4C5C',
                                        fontSize: '11px',
                                        fontWeight: 750,
                                        cursor: isOccupied ? 'not-allowed' : 'pointer',
                                        textAlign: 'center',
                                        opacity: isOccupied ? 0.6 : 1,
                                        transition: 'all 0.15s ease'
                                      }}
                                      title={isOccupied ? `Occupied by Token ${slotObj.token}` : 'Available Slot'}
                                    >
                                      <div>{slotObj.time}</div>
                                      <div style={{ fontSize: '9px', fontWeight: 700, marginTop: '2px', color: isSelected ? '#A7F3D0' : isOccupied ? '#94A3B8' : '#047857' }}>
                                        {isSelected ? t('patient.appts.slotSelected') : isOccupied ? t('patient.appts.slotBooked') : t('patient.appts.slotAvailable')}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {renderSlotGroup(t('patient.appts.slotMorning'), <Sunrise size={12} />, morningOpen, morningSlots)}
                              {renderSlotGroup(t('patient.appts.slotAfternoon'), <Sun size={12} />, afternoonOpen, afternoonSlots)}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Consultation Mode */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                          {t('patient.appts.modeLabel')}
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {[{ v: 'In-Person', label: t('patient.appts.modeInPerson') }, { v: 'Video', label: t('patient.appts.modeVideo') }].map(({ v, label }) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setBookingMode(v)}
                              style={{
                                flex: 1,
                                padding: '9px 12px',
                                borderRadius: '10px',
                                border: bookingMode.includes(v) ? '2px solid #0F4C5C' : '1px solid #D0DFE2',
                                background: bookingMode.includes(v) ? 'rgba(0, 0, 0, 0.06)' : '#ffffff',
                                color: bookingMode.includes(v) ? '#0F4C5C' : '#486770',
                                fontSize: '12px',
                                fontWeight: 750,
                                cursor: 'pointer'
                              }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Chief Complaint / Symptoms */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                          {t('patient.appts.symptoms')}
                        </label>
                        <input
                          type="text"
                          value={bookingReason}
                          onChange={e => setBookingReason(e.target.value)}
                          placeholder="e.g. ఛాతీలో దడ మరియు దగ్గు (Chest discomfort & cough)"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '12.5px', color: '#081C24', boxSizing: 'border-box' }}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setIsBookConsultationModalOpen(false)}
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
                          {t('patient.appts.cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newTicket = demoBookingService.createBooking({
                              patientName: patientName || 'Ananya Rao',
                              patientAge: activeDemoPatient?.age || patientProfile?.age || 28,
                              patientGender: activeDemoPatient?.genderLabel === 'Male' ? 'M' : 'F',
                              doctorName: bookingDoctor || 'Dr. Demo Sharma',
                              department: bookingSpecialty || 'General Medicine',
                              specialty: bookingSpecialty || 'General Medicine',
                              date: bookingDateLabel(bookingDate ?? 1),
                              time: bookingTime || '10:30 AM',
                              mode: bookingMode || 'In-person'
                            });
                            setBookedTicket(newTicket);
                            setShowTicketModal(true);
                            setDemoBookingsList(demoBookingService.getBookings());
                            if (onBookAppointment) {
                              onBookAppointment(newTicket);
                            }
                            setIsBookConsultationModalOpen(false);
                            setBookingSuccessToast(true);
                            setTimeout(() => setBookingSuccessToast(false), 6000);
                          }}
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
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)'
                          }}
                        >
                          <CheckCircle2 size={16} />
                          <span>{t('patient.appts.confirm')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming and Past Appointments from Live Real-Time Queue */}
              {(() => {
                const currentLive = liveAppointmentsQueue && liveAppointmentsQueue.length > 0 ? liveAppointmentsQueue : opdQueueService.getQueue();
                const patientAppts = currentLive.filter(a => a.patientId === activeDemoPatient.id || a.patientName === patientName);
                const allAppts = patientAppts.length > 0 ? patientAppts : currentLive;
                
                const upcomingAppts = allAppts
                  .filter(a => (a.status === 'Upcoming' || a.status === 'Waiting' || a.status === 'In Progress' || (a.offsetDays && a.offsetDays > 0 && a.status !== 'Completed')) && !isFixtureSlotPassed(a))
                  .sort((a, b) => (a.offsetDays || 0) - (b.offsetDays || 0));
                
                const pastAppts = allAppts
                  .filter(a => a.status === 'Completed' || (a.offsetDays && a.offsetDays < 0) || isFixtureSlotPassed(a))
                  .sort((a, b) => (b.offsetDays || 0) - (a.offsetDays || 0));
                // True when Past holds elapsed-but-not-completed fixtures: heading and count
                // must not claim every entry is a completed consultation.
                const pastHasElapsedSlots = pastAppts.some(a => isFixtureSlotPassed(a) && a.status !== 'Completed');

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Upcoming Appointments Card */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', padding: '22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', margin: 0 }}>
                            {t('patient.appts.upcoming')}
                          </h3>
                          <div style={{ fontSize: '12px', color: '#52707C', marginTop: '2px' }}>
                            {t('patient.appts.upcomingSub')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {demoBookingsList.length > 0 && (
                            <button
                              onClick={() => {
                                demoBookingService.clearBookings();
                                setDemoBookingsList([]);
                                setBookedTicket(null);
                              }}
                              style={{
                                fontSize: '11px',
                                color: '#722F37',
                                background: '#FFF1F2',
                                border: '1px solid #FECDD3',
                                borderRadius: '8px',
                                padding: '4px 10px',
                                fontWeight: 750,
                                cursor: 'pointer'
                              }}
                              title="Clears local demo bookings from ayuswar_demo_bookings"
                            >
                              {t('patient.appts.resetDemo')}
                            </button>
                          )}
                          <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(0, 0, 0, 0.07)', color: '#0F4C5C', padding: '3px 10px', borderRadius: '12px' }}>
                            {upcomingAppts.length + demoBookingsList.length} {t('patient.appts.scheduledSuffix')}
                          </span>
                        </div>
                      </div>

                      {upcomingAppts.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', background: '#FAF8F5', borderRadius: '12px', border: '1px dashed #D0DFE2' }}>
                          <p style={{ fontSize: '13px', color: '#52707C', margin: '0 0 10px 0' }}>{t('patient.appts.none')}</p>
                          <button
                            onClick={() => setIsBookConsultationModalOpen(true)}
                            style={{ background: '#0F4C5C', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 750, cursor: 'pointer' }}
                          >
                            + {t('patient.appts.requestFollowup')}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {/* Booked Demo Tickets from demoBookingService */}
                          {demoBookingsList.map((booking) => (
                            <div
                              key={booking.id}
                              style={{
                                padding: '16px 20px',
                                borderRadius: '14px',
                                background: '#FFFBEB',
                                border: '1.5px solid #F59E0B',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '14px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px', flex: 1 }}>
                                <div style={{
                                  background: '#0F4C5C',
                                  color: '#ffffff',
                                  padding: '8px 12px',
                                  borderRadius: '10px',
                                  textAlign: 'center',
                                  fontWeight: 800,
                                  fontSize: '12px',
                                  flexShrink: 0
                                }}>
                                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#D4AF37', letterSpacing: '0.5px' }}>OPD Token</div>
                                  <div style={{ fontSize: '15px', fontWeight: 900 }}>{booking.token || 'GM-042'}</div>
                                </div>

                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#081C24' }}>{booking.doctorName}</span>
                                    <span style={{ fontSize: '10px', background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '2px 7px', borderRadius: '6px', fontWeight: 800 }}>
                                      • Requested (demo)
                                    </span>
                                    <span style={{ fontSize: '10px', background: '#FAF8F5', color: '#486770', padding: '1px 6px', borderRadius: '6px', fontFamily: 'monospace' }}>
                                      {booking.ref}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#52707C', marginTop: '2px' }}>
                                    {booking.department} • {booking.mode} • {booking.date} at {booking.time}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#722F37', marginTop: '2px', fontWeight: 700 }}>
                                    DEMO · Prototype preview · Not a real hospital appointment
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  onClick={() => {
                                    setBookedTicket(booking);
                                    setShowTicketModal(true);
                                  }}
                                  style={{
                                    background: '#0F4C5C',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 14px',
                                    fontSize: '12px',
                                    fontWeight: 750,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    minHeight: '40px'
                                  }}
                                >
                                  <span><FileText size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> {t('patient.appts.viewTicket')}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                          {upcomingAppts.map((appt) => {
                            const isToday = appt.offsetDays === 0;
                            const isTeleconsult = appt.isTeleconsult || appt.type === 'Teleconsult';

                            return (
                              <div
                                key={appt.id}
                                style={{
                                  padding: '16px 20px',
                                  borderRadius: '14px',
                                  background: isToday ? '#FFFBEB' : '#F8FAFC',
                                  border: isToday ? '1.5px solid #F59E0B' : '1px solid #D0DFE2',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: '14px'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '220px', flex: 1 }}>
                                  <div style={{
                                    background: isToday ? '#FEF3C7' : 'rgba(0, 0, 0, 0.07)',
                                    color: isToday ? '#B45309' : '#0F4C5C',
                                    padding: '8px 12px',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                    fontWeight: 800,
                                    fontSize: '12px',
                                    flexShrink: 0
                                  }}>
                                    {formatDemoDate(appt.offsetDays)}<br />
                                    <span style={{ fontSize: '11px', fontWeight: 650 }}>{appt.time}</span>
                                    <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.85 }}>({getRelativeDaysLabel(appt.offsetDays)})</div>
                                  </div>

                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#081C24' }}>{appt.doctorName}</span>
                                      {appt.token && (
                                        <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#B45309', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '2px 7px', borderRadius: '6px', fontWeight: 800 }}>
                                          Token {appt.token && appt.token.startsWith('T-') ? appt.token.replace('T-0', 'OPD-10').replace('T-', 'OPD-1') : appt.token}
                                        </span>
                                      )}
                                      {isTeleconsult ? (
                                        <span style={{ fontSize: '10px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '1px 6px', borderRadius: '6px', fontWeight: 750 }}>
                                          <Video size={10} style={{ display: 'inline', verticalAlign: '-1px' }} /> {t('patient.appts.teleconsult')}
                                        </span>
                                      ) : (
                                        <span style={{ fontSize: '10px', background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '1px 6px', borderRadius: '6px', fontWeight: 750 }}>
                                          <Building2 size={10} style={{ display: 'inline', verticalAlign: '-1px' }} /> {t('patient.appts.inPerson')}
                                        </span>
                                      )}
                                      <span style={{ fontSize: '10px', background: '#FAF8F5', color: '#486770', padding: '1px 6px', borderRadius: '6px', fontFamily: 'monospace' }}>
                                        {appt.id}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#52707C', marginTop: '2px' }}>
                                      {appt.specialty || 'General Medicine'} • {appt.facility || 'AyuSwar Demo District Hospital OPD (synthetic)'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#0F4C5C', marginTop: '2px', fontWeight: 650 }}>
                                      {t('patient.appts.reasonPrefix')} {appt.reason || 'Routine follow-up'}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  {isTeleconsult ? (
                                    <button
                                      onClick={() => alert('Teleconsultation session initialized with secure WebRTC media bridge.')}
                                      style={{
                                        background: '#0F4C5C',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px 14px',
                                        fontSize: '12px',
                                        fontWeight: 750,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        minHeight: '44px'
                                      }}
                                    >
                                      <span>{t('patient.appts.joinCall')}</span>
                                      <span style={{ fontSize: '9px', background: 'rgba(52,211,153,0.3)', color: '#A7F3D0', padding: '1px 5px', borderRadius: '6px', fontWeight: 800 }}>ACTIVE</span>
                                    </button>
                                  ) : (
                                    <a
                                      href="https://www.google.com/maps/search/?api=1&query=AyuSwar+Demo+District+Hospital+synthetic"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        background: '#FAF8F5',
                                        color: '#081C24',
                                        border: '1px solid rgba(0, 0, 0, 0.08)',
                                        borderRadius: '8px',
                                        padding: '8px 14px',
                                        fontSize: '12px',
                                        fontWeight: 750,
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        minHeight: '44px',
                                        boxSizing: 'border-box'
                                      }}
                                    >
                                      {t('patient.appts.getDirections')}
                                    </a>
                                  )}

                                  <button
                                    onClick={() => alert(t('patient.appts.rescheduleNote'))}
                                    style={{
                                      background: '#ffffff',
                                      color: '#52707C',
                                      border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)',
                                      borderRadius: '8px',
                                      padding: '8px 12px',
                                      fontSize: '12px',
                                      fontWeight: 750,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      minHeight: '44px'
                                    }}
                                  >
                                    <span>{t('patient.appts.reschedule')}</span>
                                  </button>

                                  {/* Reference-style ticket for THIS queue entry: the selected card's
                                      own data opens in the ticket modal, never a different fixture. */}
                                  <button
                                    onClick={() => {
                                      setBookedTicket({
                                        ...appt,
                                        ref: appt.bookingRef || appt.id,
                                        patientName: appt.patientName || patientName,
                                        patientAge: appt.age,
                                        patientGender: appt.gender,
                                        department: appt.specialty,
                                        date: formatDemoDate(appt.offsetDays || 0),
                                        time: appt.time,
                                        mode: isTeleconsult ? 'Teleconsult' : 'In-person OPD',
                                        status: `${appt.status || 'Waiting'} - local demo queue entry; no hospital confirmation exists`
                                      });
                                      setShowTicketModal(true);
                                    }}
                                    style={{
                                      background: '#0F4C5C',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '8px',
                                      padding: '8px 14px',
                                      fontSize: '12px',
                                      fontWeight: 750,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      minHeight: '44px'
                                    }}
                                  >
                                    <FileText size={12} />
                                    <span>{t('patient.appts.viewTicket')}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Past Completed Visits Card */}
                    <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', padding: '22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', margin: 0 }}>
                            {pastHasElapsedSlots ? t('patient.appts.pastTitleMixed') : t('patient.appts.pastTitle')}
                          </h3>
                          <div style={{ fontSize: '12px', color: '#52707C', marginTop: '2px' }}>
                            {t('patient.appts.pastSub')}
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, background: '#FAF8F5', color: '#486770', padding: '3px 10px', borderRadius: '12px' }}>
                          {pastHasElapsedSlots ? `${pastAppts.length} ${t('patient.appts.pastSuffixMixed')}` : `${pastAppts.length} ${t('patient.appts.completedSuffix')}`}
                        </span>
                      </div>

                      {pastAppts.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', background: '#FAF8F5', borderRadius: '12px', color: '#52707C', fontSize: '13px' }}>
                          {t('patient.appts.pastNone')}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {pastAppts.map((past) => (
                            <div
                              key={past.id}
                              style={{
                                padding: '14px 18px',
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
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 auto' }}>
                                <div style={{
                                  background: '#D0DFE2',
                                  color: '#2C4A52',
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  textAlign: 'center',
                                  fontSize: '11px',
                                  fontWeight: 750,
                                  minWidth: '80px',
                                  flexShrink: 0
                                }}>
                                  {formatDemoDate(past.offsetDays)}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#081C24' }}>{past.doctorName}</span>
                                    {past.token && (
                                      <span style={{ fontSize: '9.5px', background: 'rgba(0, 0, 0, 0.06)', color: '#0F4C5C', padding: '1px 6px', borderRadius: '6px', fontWeight: 750 }}>
                                        {past.token}
                                      </span>
                                    )}
                                    {isFixtureSlotPassed(past) && past.status !== 'Completed' ? (
                                      <span style={{ fontSize: '10px', background: '#FCF3E2', color: '#8A5A13', padding: '1px 6px', borderRadius: '6px', fontWeight: 750 }}>
                                        Slot passed (simulated status: {past.status})
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '10px', background: '#ECFDF5', color: '#065F46', padding: '1px 6px', borderRadius: '6px', fontWeight: 750 }}>
                                        {t('patient.appts.completedChip')}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: '#52707C', marginTop: '2px' }}>
                                    {past.type ? past.type + ' • ' : ''}Reason: {past.reason || 'Clinical consultation'}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {past.status === 'Completed' && (
                                  <button
                                    onClick={() => setSelectedVisitSummary({
                                      patientName: patientName || 'Ananya Rao',
                                      patientAge: activeDemoPatient?.age || 28,
                                      patientGender: activeDemoPatient?.genderLabel === 'Male' ? 'M' : 'F',
                                      ref: past.ref || `VS-DEMO-${String(past.id).slice(-4)}`,
                                      date: formatDemoDate(past.offsetDays),
                                      doctorName: past.doctorName || 'Dr. Demo Clinician (synthetic)',
                                      approved: false
                                    })}
                                    style={{
                                      background: '#0F4C5C',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '8px',
                                      padding: '8px 14px',
                                      fontSize: '11.5px',
                                      fontWeight: 750,
                                      cursor: 'pointer',
                                      minHeight: '44px'
                                    }}
                                  >
                                    {t('patient.appts.viewSummary')}
                                  </button>
                                )}
                                <button
                                  onClick={() => setActiveTab('reports')}
                                  style={{
                                    background: 'rgba(0, 0, 0, 0.07)',
                                    color: '#0F4C5C',
                                    border: '1px solid rgba(0, 0, 0, 0.16)',
                                    borderRadius: '8px',
                                    padding: '8px 14px',
                                    fontSize: '11.5px',
                                    fontWeight: 750,
                                    cursor: 'pointer',
                                    minHeight: '44px'
                                  }}
                                >
                                  {t('patient.appts.viewReports')}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })()}
            </div>
          )}

          {/* ---------------------------------------------------------------------
              TAB 4: REPORTS (LABS & SPOKEN AUDIO EXPLANATION + UPLOAD FEATURE)
              --------------------------------------------------------------------- */}
          {activeTab === 'reports' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#081C24', fontFamily: 'var(--font-main)' }}>
                    {t('patient.reports.title')}
                  </h2>
                  <p style={{ fontSize: '13px', color: '#2E4753' }}>
                    {t('patient.reports.subtitle')}
                  </p>
                </div>

                {/* Upload New Diagnostic Report Button */}
                <button
                  onClick={() => setIsUploadReportModalOpen(true)}
                  style={{
                    background: '#0F4C5C',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 750,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.16)',
                    transition: 'all 140ms ease'
                  }}
                >
                  <Upload size={16} />
                  <span>+ {t('patient.reports.uploadBtn')}</span>
                </button>
              </div>

              {/* Reports List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {reportsList.map((rep, idx) => (
                  <div
                    key={rep.id || idx}
                    style={{
                      background: '#ffffff',
                      borderRadius: '14px',
                      padding: '20px',
                      border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ display: 'inline-flex', color: '#0F4C5C' }}>{rep.icon === '🩻' ? <Scan size={26} strokeWidth={1.7} /> : rep.icon === '🩸' ? <Droplets size={26} strokeWidth={1.7} /> : <FileText size={26} strokeWidth={1.7} />}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#081C24' }}>{rep.title}</span>

                        </div>
                        <div style={{ fontSize: '12px', color: '#52707C' }}>Sample report data from {rep.date} • not clinician-reviewed</div>
                        <div style={{ fontSize: '12.5px', color: '#1E293B', marginTop: '4px', maxWidth: '540px' }}>{rep.summary}</div>
                      </div>
                    </div>

                    <div className="patient-report-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => handlePlayVoicePrescription(
                          selectedLanguage === 'Telugu' ? rep.spokenTelugu : rep.spokenHindi,
                          `report-${rep.id || rep.title}`
                        )}
                        style={{
                          background: isPlayingAudio && activeAudioSlotId === `report-${rep.id || rep.title}` ? '#0F4C5C' : 'rgba(0, 0, 0, 0.07)',
                          border: '1.5px solid #0F4C5C',
                          color: isPlayingAudio && activeAudioSlotId === `report-${rep.id || rep.title}` ? '#ffffff' : '#0F4C5C',
                          padding: '8px 16px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 750,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Volume2 size={15} />
                        <span>
                          {isPlayingAudio && activeAudioSlotId === `report-${rep.id || rep.title}`
                            ? t('patient.reports.stopAudio')
                            : t('patient.reports.hearSample')}
                        </span>
                      </button>

                      <button
                        onClick={() => alert(`Preparing demo PDF copy of ${rep.title}...`)}
                        style={{
                          background: '#0A2540',
                          color: '#ffffff',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Download size={14} />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload Report Modal */}
              {isUploadReportModalOpen && (
                <div className="modal-overlay" style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(8, 28, 36, 0.7)',
                  backdropFilter: 'blur(4px)',
                  padding: '20px'
                }}>
                  <div className="modal-content" style={{
                    background: '#ffffff',
                    width: '100%',
                    maxWidth: '520px',
                    borderRadius: '18px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                  }}>
                    {/* Modal Header */}
                    <div style={{
                      background: '#0F4C5C',
                      padding: '18px 24px',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div className="patient-report-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <UploadCloud size={22} color="#2DD4BF" />
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-main)', color: '#ffffff' }}>
                            {t('patient.reports.modalTitle')}
                          </h3>
                          <div style={{ fontSize: '12px', color: '#D0DFE2', marginTop: '2px' }}>
                            {t('patient.reports.modalSub')}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsUploadReportModalOpen(false)}
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
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Hidden File Input for Native File Browser Selection */}
                      <input
                        type="file"
                        ref={reportFileInputRef}
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            handleReportFileChosen(e.target.files[0]);
                          }
                        }}
                        accept=".pdf,.png,.jpg,.jpeg,.dcm,.dicom,.webp,image/*"
                        style={{ display: 'none' }}
                      />

                      {/* Interactive Dropzone & File Selector */}
                      {!uploadedReportFile ? (
                        <div
                          onDragOver={e => {
                            e.preventDefault();
                            setIsReportDraggingOver(true);
                          }}
                          onDragLeave={e => {
                            e.preventDefault();
                            setIsReportDraggingOver(false);
                          }}
                          onDrop={e => {
                            e.preventDefault();
                            setIsReportDraggingOver(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleReportFileChosen(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => reportFileInputRef.current?.click()}
                          style={{
                            border: isReportDraggingOver ? '2px solid #0F4C5C' : '2px dashed #0F4C5C',
                            borderRadius: '16px',
                            padding: '24px 18px',
                            textAlign: 'center',
                            background: isReportDraggingOver ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.03)',
                            cursor: 'pointer',
                            transition: 'all 0.18s ease',
                            boxShadow: isReportDraggingOver ? '0 0 16px rgba(0, 0, 0, 0.14)' : 'none'
                          }}
                        >
                          <UploadCloud size={34} color="#0F4C5C" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                          <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#081C24' }}>
                            Drag & drop diagnostic PDF, DICOM, or scan image
                          </div>
                          <div style={{ fontSize: '11px', color: '#52707C', marginTop: '3px', marginBottom: '14px' }}>
                            Supports PDF, JPEG, PNG, DICOM, WebP up to 25 MB
                          </div>

                          {/* Explicit Manual Upload Button */}
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                reportFileInputRef.current?.click();
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#0F4C5C',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '8px 16px',
                                fontSize: '12px',
                                fontWeight: 750,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)'
                              }}
                            >
                              <FolderOpen size={15} />
                              <span>{t('patient.reports.browse')}</span>
                            </button>
                          </div>

                          {/* Quick One-Click Sample Reports */}
                          <div style={{ marginTop: '16px', borderTop: '1px solid rgba(0, 0, 0, 0.08)', paddingTop: '12px' }}>
                            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#52707C', marginBottom: '8px' }}>
                              Or quickly test with a sample clinical report:
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectSampleReport('hba1c');
                                }}
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #D1E1E6',
                                  borderRadius: '8px',
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  fontWeight: 650,
                                  color: '#0F4C5C',
                                  cursor: 'pointer'
                                }}
                              >
                                HbA1c Lab PDF
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectSampleReport('xray');
                                }}
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #D1E1E6',
                                  borderRadius: '8px',
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  fontWeight: 650,
                                  color: '#0F4C5C',
                                  cursor: 'pointer'
                                }}
                              >
                                Chest X-Ray DICOM
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectSampleReport('lipid');
                                }}
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #D1E1E6',
                                  borderRadius: '8px',
                                  padding: '4px 10px',
                                  fontSize: '11px',
                                  fontWeight: 650,
                                  color: '#0F4C5C',
                                  cursor: 'pointer'
                                }}
                              >
                                Fasting Lipid Scan
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          background: '#F0FDFA',
                          border: '1.5px solid #0F4C5C',
                          borderRadius: '16px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                            {uploadedReportFile.previewUrl ? (
                              <img
                                src={uploadedReportFile.previewUrl}
                                alt="Report Preview"
                                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #D1E1E6' }}
                              />
                            ) : (
                              <div style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '10px',
                                background: '#0F4C5C',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <FileCheck size={24} />
                              </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: '#081C24', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {uploadedReportFile.name}
                              </div>
                              <div style={{ fontSize: '11px', color: '#065F46', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span>{uploadedReportFile.size}</span>
                                <span>•</span>
 <span style={{ fontWeight: 700 }}>✓ Attached • bundled sample preview</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => reportFileInputRef.current?.click()}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #D1E1E6',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                color: '#0F4C5C',
                                cursor: 'pointer'
                              }}
                            >
                              Change File
                            </button>
                            <button
                              type="button"
                              onClick={() => setUploadedReportFile(null)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#DC2626',
                                cursor: 'pointer',
                                padding: '6px'
                              }}
                              title="Remove attached file"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}

                      {isAiScanningReport && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: 'rgba(15, 76, 92, 0.05)',
                          border: '1px dashed rgba(15, 76, 92, 0.25)',
                          marginBottom: '12px'
                        }}>
                          <span className="ayu-loadring" style={{ width: '46px', height: '46px' }}>
                            <svg viewBox="0 0 46 46" aria-hidden="true"><circle className="ayu-ring-bg" cx="23" cy="23" r="20"/><circle className="ayu-ring-fg" cx="23" cy="23" r="20" style={{ strokeDasharray: '35 91' }}/></svg>
                            <img
                              src="/assets/icons/sheet/load-report.png"
                              alt=""
                              className="ayu-loadart-loop"
                              style={{ width: '30px', height: '30px', objectFit: 'contain' }}
                            />
                          </span>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F4C5C' }}>
                            {t('patient.reports.scanning')}
                          </div>
                        </div>
                      )}

                      {/* Title & Date */}
                      <div className="patient-report-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px', width: '100%' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                            Report Name / Test Type
                          </label>
                          <input
                            type="text"
                            value={newReportTitle}
                            onChange={e => setNewReportTitle(e.target.value)}
                            placeholder="e.g. HbA1c Blood Test"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '12.5px' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                            Test Date
                          </label>
                          <input
                            type="text"
                            value={newReportDate}
                            onChange={e => setNewReportDate(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '12.5px' }}
                          />
                        </div>
                      </div>

                      {/* Doctor / Verifier */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                          Ordering Physician / Lab Name
                        </label>
                        <input
                          type="text"
                          value={newReportDoctor}
                          onChange={e => setNewReportDoctor(e.target.value)}
                          placeholder="Dr. Demo Clinician (synthetic) (Pulmonologist)"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '12.5px' }}
                        />
                      </div>

                      {/* Bundled sample preview autofill button */}
                      <div style={{
                        background: '#F0FDFA',
                        border: '1px solid #CCFBF1',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 750, color: '#065F46' }}>
                            AyuSwar Indic Bio-Scribe AI
                          </div>
                          <div style={{ fontSize: '11px', color: '#52707C' }}>
                            Autofills a bundled sample preview & translates to Telugu / Hindi speech
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setIsAiScanningReport(true);
                            setTimeout(() => {
                              setIsAiScanningReport(false);
                              setNewReportSummary('HbA1c: 6.4% (Good Control). Fasting Blood Sugar: 104 mg/dL. Renal function intact.');
                              setNewReportTelugu('మీ రక్తంలో చక్కెర స్థాయిలు అదుపులో ఉన్నాయి. హెచ్‌బీఏ1సి 6.4 శాతం ఉంది.');
                              setNewReportHindi('आपके खून में शुगर का स्तर नियंत्रण में है। दवाएं ठीक से काम कर रही हैं।');
                            }, 700);
                          }}
                          style={{
                            background: '#0F4C5C',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            fontSize: '11.5px',
                            fontWeight: 750,
                            cursor: 'pointer'
                          }}
                        >
                          {isAiScanningReport ? t('patient.reports.scanning') : t('patient.reports.ocr')}
                        </button>
                      </div>

                      {/* Summary */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                          Clinical Findings & Summary
                        </label>
                        <textarea
                          rows={2}
                          value={newReportSummary}
                          onChange={e => setNewReportSummary(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '12px' }}
                        />
                      </div>

                      {/* Spoken Dialect Audio Scripts */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                          Telugu Audio Script (తెలుగు వాయిస్ సారాంశం)
                        </label>
                        <input
                          type="text"
                          value={newReportTelugu}
                          onChange={e => setNewReportTelugu(e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '12px' }}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedReportFile(null);
                            setIsUploadReportModalOpen(false);
                          }}
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
                          type="button"
                          onClick={() => {
                            const newRep = {
                              id: Date.now(),
                              title: newReportTitle,
                              date: newReportDate,
                              icon: '🧪',
                              doctor: newReportDoctor,
                              summary: newReportSummary,
                              spokenTelugu: newReportTelugu,
                              spokenHindi: newReportHindi,
                              isNew: true
                            };
                            setReportsList([newRep, ...reportsList]);

                            // Saving a report adds only the report record. No vitals are
                            // invented from it: measurements enter the tracker only through
                            // explicit manual entry or the clearly-labeled bundled-sample import.
                            setUploadedReportFile(null);
                            setIsUploadReportModalOpen(false);
                          }}
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
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)'
                          }}
                        >
                          <CheckCircle2 size={16} />
                          <span>{t('patient.reports.verifyAdd')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------------------
              TAB 5: MEDICATIONS & CHRONOTHERAPY SMART PILLBOX
              --------------------------------------------------------------------- */}
          {activeTab === 'medications' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#081C24', fontFamily: 'var(--font-main)' }}>
                    {t('patient.meds.title')}
                  </h2>
                  <p style={{ fontSize: '13px', color: '#2E4753' }}>
                    {t('patient.meds.subtitle')}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {/* Auto-synced prescription badge */}
                  <div style={{
                    background: '#ECFDF5',
                    color: '#065F46',
                    border: '1px solid #A7F3D0',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span aria-hidden="true" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#15803D', display: 'inline-block', flexShrink: 0 }} />
                    <span>{t('patient.meds.badge')}</span>
                  </div>

                  {/* Add Medication Manually Button */}
                  <button
                    onClick={() => setIsAddMedicationModalOpen(true)}
                    style={{
                      background: '#B45309',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 14px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: 750,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)'
                    }}
                  >
                    <Plus size={15} />
                    <span>{t('patient.meds.addBtn')}</span>
                  </button>

                  <button
                    onClick={() => setShowPrintRxModal(true)}
                    style={{
                      background: '#ffffff',
                      color: '#0F4C5C',
                      border: '1.5px solid #0F4C5C',
                      borderRadius: '10px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 750,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <FileText size={15} color="#0F4C5C" />
                    <span>{t('patient.meds.rxPreview')}</span>
                  </button>

                  <button
                    onClick={() => setShowWhatsAppRxModal(true)}
                    style={{
                      background: '#0E7A3D',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 16px',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Send size={14} />
                    <span>{t('patient.meds.audioPreview')}</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Languages size={16} color="#0F4C5C" />
                    <select
                      value={selectedLanguage}
                      onChange={e => setSelectedLanguage(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 0, 0, 0.10)',
                        fontSize: '12px',
                        fontWeight: 750,
                        color: '#081C24',
                        background: '#ffffff'
                      }}
                    >
                      <option value="Telugu">తెలుగు (Telugu)</option>
                      <option value="Hindi">हिन्दी (Hindi)</option>
                      <option value="Tamil">தமிழ் (Tamil)</option>
                      <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                      <option value="Marathi">मराठी (Marathi)</option>
                      <option value="English">English (India)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Add Medication Manually Modal */}
              {isAddMedicationModalOpen && (
                <div className="modal-overlay" style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(8, 28, 36, 0.7)',
                  backdropFilter: 'blur(4px)',
                  padding: '20px'
                }}>
                  <div className="modal-content" style={{
                    background: '#ffffff',
                    width: '100%',
                    maxWidth: '520px',
                    borderRadius: '18px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: '#0F4C5C',
                      padding: '18px 24px',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div className="patient-report-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Pill size={22} color="#2DD4BF" />
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-main)', color: '#ffffff' }}>
                            Add Medication Manually
                          </h3>
                          <div style={{ fontSize: '12px', color: '#D0DFE2', marginTop: '2px' }}>
                            Set meal timing, dosage & auto-generate voice instructions
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsAddMedicationModalOpen(false)}
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

                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                          Medicine Name & Strength
                        </label>
                        <input
                          type="text"
                          value={manualMedName}
                          onChange={e => setManualMedName(e.target.value)}
                          placeholder="e.g. Metformin 500mg or Pantoprazole"
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '12.5px' }}
                        />
                      </div>

                      {/* Chronotherapy Slot */}
                      <div className="patient-med-modal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                            Timing Slot
                          </label>
                          <select
                            value={manualSlot}
                            onChange={e => {
                              setManualSlot(e.target.value);
                              if (e.target.value === 'early_morning') {
                                setManualMealContext('Empty Stomach (పరగడుపున / खाली पेट)');
                              } else if (e.target.value === 'morning') {
                                setManualMealContext('After Breakfast (టిఫిన్ తర్వాత / नाश्ते के बाद)');
                              } else if (e.target.value === 'afternoon') {
                                setManualMealContext('After Lunch (భోజనం తర్వాత / दोपहर खाने के बाद)');
                              } else if (e.target.value === 'evening') {
                                setManualMealContext('Evening Tea/Snack (సాయంత్రం / शाम को)');
                              } else if (e.target.value === 'night') {
                                setManualMealContext('After Dinner (రాత్రి భోజనం తర్వాత / रात खाने के बाद)');
                              }
                            }}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '12px' }}
                          >
                            <option value="early_morning">Early Morning (Empty Stomach)</option>
 <option value="morning">Morning (After Breakfast)</option>
                            <option value="afternoon">Afternoon (After Lunch)</option>
                            <option value="evening">Evening (Tea Time)</option>
                            <option value="night">Night (After Dinner)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                            Indication / Purpose
                          </label>
                          <input
                            type="text"
                            value={manualPurpose}
                            onChange={e => setManualPurpose(e.target.value)}
                            placeholder="e.g. Sugar control"
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '12.5px' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                          Telugu Voice Instruction (తెలుగు సూచన)
                        </label>
                        <input
                          type="text"
                          value={manualTeluguAudio}
                          onChange={e => setManualTeluguAudio(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.10)', fontSize: '12px' }}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setIsAddMedicationModalOpen(false)}
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
                          type="button"
                          onClick={() => {
                            const newSlotItem = {
                              id: `manual_${Date.now()}`,
                              label: manualSlot.replace('_', ' ').toUpperCase(),
                              time: manualSlot === 'early_morning' ? '06:30 AM' : (manualSlot === 'morning' ? '08:30 AM' : (manualSlot === 'afternoon' ? '01:30 PM' : '08:30 PM')),
                              mealContext: manualMealContext,
                              medicine: manualMedName,
                              purpose: manualPurpose,
                              color: '#0F4C5C',
                              bg: 'rgba(0, 0, 0, 0.07)',
                              teluguAudioText: manualTeluguAudio,
                              hindiAudioText: manualHindiAudio
                            };
                            setChronotherapySchedule([...chronotherapySchedule, newSlotItem]);
                            setIsAddMedicationModalOpen(false);
                            alert(`${manualMedName} added to your chronotherapy schedule!`);
                          }}
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
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.16)'
                          }}
                        >
                          <CheckCircle2 size={16} />
                          <span>Add to Chronotherapy Pillbox</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DDI Safety Sentinel Status Banner */}
              {(() => {
                const ddiAlerts = checkDrugInteractions(chronotherapySchedule.map(s => s.medicine));
                return (
                  <div style={{
                    background: ddiAlerts.length > 0 ? '#FEF2F2' : '#F0FDF4',
                    border: ddiAlerts.length > 0 ? '1.5px solid #FCA5A5' : '1.5px solid #BBF7D0',
                    borderRadius: '12px',
                    padding: '12px 18px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div className="patient-report-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ShieldCheck size={18} color={ddiAlerts.length > 0 ? '#DC2626' : '#15803D'} />
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 750, color: ddiAlerts.length > 0 ? '#991B1B' : '#166534' }}>
                          {ddiAlerts.length > 0 ? `Sample interaction reminder: ${ddiAlerts.length} item(s) need pharmacist or clinician review` : 'Sample interaction reminder: no clearance claimed'}
                        </div>
                        <div style={{ fontSize: '11px', color: ddiAlerts.length > 0 ? '#B91C1C' : '#15803D' }}>
                          {ddiAlerts.length > 0 ? (selectedLanguage === 'Telugu' ? ddiAlerts[0].alertTelugu : ddiAlerts[0].alertHindi) : 'No validated safety clearance. Verify every medicine, allergy and interaction with a pharmacist or qualified clinician.'}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '10.5px', background: ddiAlerts.length > 0 ? '#FEE2E2' : '#DCFCE7', color: ddiAlerts.length > 0 ? '#991B1B' : '#15803D', padding: '3px 10px', borderRadius: '12px', fontWeight: 800 }}>
                      {ddiAlerts.length > 0 ? t('patient.meds.reviewNeeded') : t('patient.meds.sampleCheckOnly')}
                    </span>
                  </div>
                );
              })()}

              {audioFeedbackToast && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: '#FEF3C7',
                  border: '1px solid #F59E0B',
                  color: '#92400E',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  marginBottom: '10px'
                }}>
 ℹ {audioFeedbackToast}
                </div>
              )}

              {/* Slot Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {chronotherapySchedule.map(slot => {
                  const isChecked = dailyPillChecked[slot.id];
                  const janInfo = getJanAushadhiGenericInfo(slot.medicine);
                  return (
                    <div
                      key={slot.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '20px 24px',
                        border: isChecked ? '1.5px solid #047857' : '1px solid #D0DFE2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                          onClick={() => setDailyPillChecked(prev => ({ ...prev, [slot.id]: !prev[slot.id] }))}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: isChecked ? 'none' : '2px solid #D0DFE2',
                            background: isChecked ? '#047857' : '#ffffff',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          {isChecked && <Check size={16} />}
                        </button>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: slot.color }}>
                              {slot.label} ({slot.time})
                            </span>
                            <span style={{ fontSize: '11px', background: slot.bg, color: slot.color, padding: '2px 8px', borderRadius: '8px', fontWeight: 700 }}>
                              {slot.mealContext}
                            </span>
                            {/* Looseleaf ASHA / Elder Hand-Drawn Marker Indicator */}
                            {(() => {
                              const slotText = (slot.label + ' ' + (slot.time || '')).toUpperCase();
                              const isMorn = slotText.includes('MORNING');
                              const isEveNight = slotText.includes('NIGHT') || slotText.includes('EVENING') || slotText.includes('DINNER');
                              const badgeBg = isMorn ? '#FEF08A' : (isEveNight ? '#DDD6FE' : '#BAE6FD');
                              const badgeText = isMorn ? 'ఉదయం' : (isEveNight ? 'రాత్రి' : 'మధ్యాహ్నం');

                              return (
                                <span style={{
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  background: badgeBg,
                                  color: '#1E293B',
                                  fontWeight: 800,
                                  transform: 'rotate(-1deg)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '1px 1px 0px rgba(0,0,0,0.1)'
                                }}>
                                  <span>{badgeText}</span>
                                </span>
                              );
                            })()}
                          </div>

                          <div style={{ fontSize: '16px', fontWeight: 850, color: '#081C24', marginTop: '2px' }}>
                            {slot.medicine}
                          </div>
                          <div style={{ fontSize: '12px', color: '#52707C' }}>
                            Purpose: {slot.purpose}
                          </div>

                          {/* Jan Aushadhi generic reference: shown only for an exact curated
                              ingredient+strength+form match against the bundled sample formulary.
                              No substitution advice, no promotional savings claims. */}
                          {janInfo && (
                            <div style={{
                              marginTop: '8px',
                              background: '#F8FAFC',
                              border: '1px solid #D0DFE2',
                              borderRadius: '10px',
                              padding: '8px 14px',
                              fontSize: '12px',
                              color: '#475569'
                            }}>
                              Jan Aushadhi generic reference: <span style={{ fontWeight: 700, color: '#14532D' }}>{janInfo.genericName}</span>
                              {' '}({janInfo.nlemCeiling})
                            </div>
                          )}

                          <div style={{ fontSize: '12px', color: '#006D6D', marginTop: '6px', fontStyle: 'italic' }}>
                            "{selectedLanguage === 'Telugu' ? slot.teluguAudioText : (selectedLanguage === 'Hindi' ? slot.hindiAudioText : slot.englishAudioText)}"
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePlayVoicePrescription(
                          selectedLanguage === 'Telugu' ? slot.teluguAudioText : (selectedLanguage === 'Hindi' ? slot.hindiAudioText : slot.englishAudioText),
                          slot.id
                        )}
                        style={{
                          background: isPlayingAudio && activeAudioSlotId === slot.id ? '#0F4C5C' : slot.color,
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '24px',
                          padding: '10px 20px',
                          fontSize: '12px',
                          fontWeight: 750,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Volume2 size={15} />
                        <span>
                          {isPlayingAudio && activeAudioSlotId === slot.id
                            ? t('patient.meds.stopAudio')
                            : (slot.isBundledSample ? t('patient.meds.playSample') : t('patient.meds.playSpoken'))}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------------
              TAB 6: AI ASSISTANT (PATIENT HEALTH ADVICE)
              --------------------------------------------------------------------- */}
          {activeTab === 'ai_assistant' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#081C24', fontFamily: 'var(--font-main)' }}>
                  {t('patient.assistant.hdr')}
                </h2>
                <p style={{ fontSize: '13px', color: '#2E4753' }}>
                  {t('patient.assistant.sub')}
                </p>
                <SampleDataChip text={t('patient.common.sampleData')} />
              </div>

              {/* Red Emergency Alert Box */}
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid rgba(239, 68, 68, 0.3)',
                padding: '14px 18px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 220px', minWidth: 0 }}>
                  <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '12.5px', color: '#991B1B', fontWeight: 650, minWidth: 0 }}>
                    {t('patient.assistant.emergencyNote')}
                  </span>
                </div>
                <button
                  onClick={() => { window.location.href = 'tel:108'; }}
                  style={{
                    background: '#DC2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  {t('patient.assistant.call108')}
                </button>
              </div>

              {/* Full Chat Screen */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)',
                padding: '24px',
                minHeight: '440px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.sender === 'user' ? '#0F4C5C' : '#F8FAFC',
                        color: msg.sender === 'user' ? '#ffffff' : '#1E293B',
                        border: msg.sender === 'user' ? 'none' : '1px solid #D0DFE2',
                        padding: '12px 18px',
                        borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        fontSize: '13.5px',
                        lineHeight: 1.5,
                        maxWidth: '85%'
                      }}
                    >
                      {msg.sender === 'assistant' || msg.sender !== 'user'
                        ? msg.text.split(/(\*\*[^*]+\*\*)/g).map((part, pi) =>
                            /^\*\*([^*]+)\*\*$/.test(part)
                              ? <strong key={pi}>{part.slice(2, -2)}</strong>
                              : <span key={pi}>{part}</span>
                          )
                        : msg.text}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <input 
                    type="text"
                    value={patientQuestion}
                    onChange={e => setPatientQuestion(e.target.value)}
                    placeholder={t('patient.assistant.inputPh')}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(0, 0, 0, 0.10)',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={toggleOpdSpeechRecognition}
                    style={{
                      background: isOpdMicListening ? '#B91C1C' : '#F1F5F9',
                      color: isOpdMicListening ? '#FFFFFF' : '#0F4C5C',
                      border: isOpdMicListening ? 'none' : '1.5px solid #0F4C5C',
                      borderRadius: '12px',
                      padding: '0 16px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isOpdMicListening ? '0 0 12px rgba(239, 68, 68, 0.5)' : 'none'
                    }}
                    title={isOpdMicListening ? "Listening... click to stop" : "Speak your question aloud"}
                  >
                    {isOpdMicListening ? <Mic size={16} className="animate-pulse" /> : <Mic size={16} />}
                    <span>{isOpdMicListening ? t('patient.assistant.listening') : t('patient.assistant.voice')}</span>
                  </button>

                  <button
                    type="submit"
                    style={{
                      background: '#0F4C5C',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0 20px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Send size={15} />
                    <span>{t('patient.assistant.send')}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------------
              TAB 7: HEALTH GOALS (WELLNESS TRACKING)
              --------------------------------------------------------------------- */}
          {activeTab === 'health_goals' && (
            <PatientHealthGoalsTab
              assignedDoctor={assignedDoctor}
              activeDemoPatient={activeDemoPatient}
              patientProfile={patientProfile}
              t={t}
            />
          )}

          {/* ---------------------------------------------------------------------
              TAB 8: SETTINGS (INDIC DIALECT, OMNICHANNEL DISPATCH, ABHA CONSENT & PRIVACY)
              --------------------------------------------------------------------- */}
          {activeTab === 'settings' && (
            <div>
              {/* Header Banner */}
              <div style={{ 
                background: '#0F4C5C', 
                borderRadius: '20px', 
                padding: '24px 28px', 
                color: '#ffffff',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.10)'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ 
                      background: 'rgba(0, 0, 0, 0.16)', 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '11px', 
                      fontWeight: 800, 
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      border: '1px solid rgba(255,255,255,0.2)' 
                    }}>
                      Synthetic patient record • demo
                    </span>
                    <span style={{ fontSize: '12px', color: '#CFE3E8' }}>• Synthetic {t('patient.home.demoId')} <code>{abhaId}</code></span>
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-main)', margin: '0 0 6px 0', color: '#FFFFFF' }}>
                    {t('patient.settings.title')}
                  </h2>
                  <p style={{ fontSize: '13px', color: '#D0DFE2', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
                    {t('patient.settings.subtitle')}
                  </p>
                </div>

                <button
                  onClick={savePatientPreferences}
                  className="btn-primary"
                  style={{ padding: '12px 24px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.16)' }}
                >
                  <ShieldCheck size={16} />
                  <span>{t('patient.settings.save')}</span>
                </button>
              </div>

              {/* Toast Feedback */}
              {settingsSavedToast && (
                <div style={{ 
                  background: '#ECFDF5', 
                  border: '1.5px solid #047857', 
                  borderRadius: '12px', 
                  padding: '14px 20px', 
                  marginBottom: '22px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  color: '#065F46',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.15)'
                }}>
                  <CheckCircle2 size={20} color="#047857" />
                  <span>{t('patient.settings.savedNote')}</span>
                </div>
              )}

              {/* Settings Sections Grid (2 Columns) */}
              <div className="patient-settings-grid" style={{ display: 'grid', gridTemplateColumns: isMobileScreen ? '1fr' : 'repeat(2, 1fr)', gap: '22px', width: '100%', boxSizing: 'border-box' }}>
                
                {/* 1. AyuSwar Indic Voice & Dialect Engine */}
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F4C5C' }}>
                      <Languages size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', margin: 0 }}>{t('patient.settings.voiceTitle')}</h3>
                      <div style={{ fontSize: '12px', color: '#52707C' }}>{t('patient.settings.voiceSub')}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 750, color: '#081C24', marginBottom: '6px' }}>
                      {t('patient.settings.dialectLabel')}
                    </label>
                    <select
                      value={selectedLanguage}
                      onChange={e => setSelectedLanguage(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 34px 10px 12px',
                        borderRadius: '10px',
                        border: '1px solid rgba(0, 0, 0, 0.10)',
                        fontSize: '12px',
                        fontWeight: 650,
                        color: '#081C24'
                      }}
                    >
                      <option value="English">English (India)</option>
                      <option value="Telugu">తెలుగు</option>
                      <option value="Hindi">हिन्दी</option>
                      <option value="Tamil">தமிழ்</option>
                      <option value="Kannada">ಕನ್ನಡ</option>
                      <option value="Marathi">मराठी</option>
                      <option value="Bengali">বাংলা</option>
                      <option value="Odia">ଓଡ଼ିଆ</option>
                    </select>
                    <div style={{ fontSize: '11px', color: '#486770', marginTop: '4px' }}>
                      {t('patient.settings.opt' + selectedLanguage)}
                    </div>
                  </div>

                  <div className="patient-settings-subgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px', width: '100%' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#081C24', marginBottom: '6px' }}>
                        {t('patient.settings.personaLabel')}
                      </label>
                      <select
                        value={voicePersona}
                        onChange={e => setVoicePersona(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.08)', fontSize: '12px', fontWeight: 650 }}
                      >
                        <option value="female_compassionate">{t('patient.settings.personaPriya')}</option>
                        <option value="male_calm">{t('patient.settings.personaRajesh')}</option>
                        <option value="elder_warm">{t('patient.settings.personaAsha')}</option>
                        <option value="maternal_sister">{t('patient.settings.personaChw')}</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#081C24', marginBottom: '6px' }}>
                        {t('patient.settings.tempoLabel')}
                      </label>
                      <select
                        value={speechTempo}
                        onChange={e => setSpeechTempo(e.target.value)}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.08)', fontSize: '12px', fontWeight: 650 }}
                      >
                        <option value="0.75x">{t('patient.settings.tempoSlow')}</option>
                        <option value="1.0x">{t('patient.settings.tempoStd')}</option>
                        <option value="1.25x">{t('patient.settings.tempoBrisk')}</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ background: '#FAF8F5', padding: '12px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24' }}>{t('patient.settings.autoPlay')}</div>
                      <div style={{ fontSize: '11px', color: '#52707C' }}>{t('patient.settings.autoPlaySub')}</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={autoPlayAudio} 
                      onChange={e => setAutoPlayAudio(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#0F4C5C', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                {/* 2. Omnichannel Alerts & Tele-Dispatch */}
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1D4ED8' }}>
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', margin: 0 }}>{t('patient.settings.remindersTitle')}</h3>
                      <div style={{ fontSize: '12px', color: '#52707C' }}>{t('patient.settings.remindersSub')}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24' }}>{t('patient.settings.waPreview')}</div>
                        <div style={{ fontSize: '11px', color: '#52707C' }}>{t('patient.settings.waPreviewSub')}</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={enableWhatsAppData} 
                        onChange={e => setEnableWhatsAppData(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#047857', cursor: 'pointer' }}
                      />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24' }}>{t('patient.settings.ivrPref')}</div>
                        <div style={{ fontSize: '11px', color: '#52707C' }}>{t('patient.settings.ivrPrefSub')}</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={enableIvrPhoneCalls} 
                        onChange={e => setEnableIvrPhoneCalls(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#1D4ED8', cursor: 'pointer' }}
                      />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24' }}>{t('patient.settings.smsAlerts')}</div>
                        <div style={{ fontSize: '11px', color: '#52707C' }}>{t('patient.settings.smsAlertsSub')}</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={enableSmsRegional} 
                        onChange={e => setEnableSmsRegional(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#B45309', cursor: 'pointer' }}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#52707C', fontWeight: 650 }}>{t('patient.settings.slotLabel')}</span>
                    <select
                      value={preferredReminderTime}
                      onChange={e => setPreferredReminderTime(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.08)', fontSize: '12px', fontWeight: 700 }}
                    >
                      <option value="06:30 AM">{t('patient.settings.slot0630')}</option>
                      <option value="08:30 AM">{t('patient.settings.slot0830')}</option>
                      <option value="01:00 PM">{t('patient.settings.slot1300')}</option>
                      <option value="08:30 PM">{t('patient.settings.slot2030')}</option>
                    </select>
                  </div>
                </div>

                {/* 3. Emergency Caregiver Escalation & 108 SOS */}
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}>
                      <PhoneCall size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', margin: 0 }}>{t('patient.settings.emergencyTitle')}</h3>
                      <div style={{ fontSize: '12px', color: '#52707C' }}>{t('patient.settings.emergencySub')}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#081C24', marginBottom: '4px' }}>
                      {t('patient.settings.caregiverNameLabel')}
                    </label>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={e => setEmergencyContactName(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.08)', fontSize: '13px', fontWeight: 650 }}
                    />
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#081C24', marginBottom: '4px' }}>
                      {t('patient.settings.emergencyPhoneLabel')}
                    </label>
                    <input
                      type="text"
                      value={emergencyPhone}
                      onChange={e => setEmergencyPhone(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.08)', fontSize: '13px', fontWeight: 650 }}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FECACA', cursor: 'pointer', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#991B1B' }}>{t('patient.settings.sosTitle')}</div>
                      <div style={{ fontSize: '11px', color: '#B91C1C' }}>{t('patient.settings.sosSub')}</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={false}
                      disabled
                      style={{ width: '18px', height: '18px', accentColor: '#DC2626', cursor: 'pointer' }}
                    />
                  </label>

                  <button
                    onClick={() => alert(t('patient.settings.alertCaregiver', { name: emergencyContactName, phone: emergencyPhone }))}
                    style={{ width: '100%', background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: 750, color: '#081C24', cursor: 'pointer' }}
                  >
                    {t('patient.settings.previewAlert')}
                  </button>
                </div>

                {/* 4. ABDM & ABHA Health Locker Consent Governance */}
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#047857' }}>
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', margin: 0 }}>{t('patient.settings.sharingTitle')}</h3>
                      <div style={{ fontSize: '12px', color: '#52707C' }}>{t('patient.settings.sharingSub')}</div>
                    </div>
                  </div>

                  <div style={{ background: '#FAF8F5', padding: '12px', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#52707C' }}>{t('patient.settings.sampleIdLabel')}</span>
                      <span style={{ fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '10px', fontWeight: 800 }}>{t('patient.settings.syntheticBadge')}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#081C24', fontFamily: 'monospace' }}>
                      {abhaId}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#081C24' }}>{t('patient.settings.durationLabel')}</span>
                    <select
                      value={consentDurationDays}
                      onChange={e => setConsentDurationDays(Number(e.target.value))}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.08)', fontSize: '12px', fontWeight: 650 }}
                    >
                      <option value={7}>{t('patient.settings.dur7')}</option>
                      <option value={30}>{t('patient.settings.dur30')}</option>
                      <option value={90}>{t('patient.settings.dur90')}</option>
                      <option value={365}>{t('patient.settings.dur365')}</option>
                    </select>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', cursor: 'pointer', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 750, color: '#081C24' }}>{t('patient.settings.specialistView')}</div>
                      <div style={{ fontSize: '11px', color: '#52707C' }}>{t('patient.settings.specialistViewSub')}</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={autoShareEmergencyRecords} 
                      onChange={e => setAutoShareEmergencyRecords(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#047857', cursor: 'pointer' }}
                    />
                  </label>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => alert(t('patient.settings.alertGovCard'))}
                      style={{ flex: 1, background: '#0F4C5C', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '11.5px', fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Download size={13} />
                      <span>{t('patient.settings.sampleCardBtn')}</span>
                    </button>
                    <button
                      onClick={() => alert(t('patient.settings.alertResearch'))}
                      style={{ flex: 1, background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '8px', padding: '8px', fontSize: '11.5px', fontWeight: 700, color: '#081C24', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <FileCheck size={13} />
                      <span>{t('patient.settings.researchBtn')}</span>
                    </button>
                  </div>
                </div>

                {/* 5. Family Locker & Caregiver Privacy Controls */}
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(217, 119, 6, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
                      <UserCheck size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', margin: 0 }}>{t('patient.settings.familyTitle')}</h3>
                      <div style={{ fontSize: '12px', color: '#52707C' }}>{t('patient.settings.familySub')}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#486770', marginBottom: '12px' }}>
                    {t('patient.settings.linkedLabel')} <strong>{familyListToDisplay.map(f => f.patientName).join(', ')}</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24' }}>{t('patient.settings.sharedMedsTitle')}</div>
                        <div style={{ fontSize: '11px', color: '#52707C' }}>{t('patient.settings.sharedMedsSub')}</div>
                      </div>
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        style={{ width: '18px', height: '18px', accentColor: '#B45309', cursor: 'pointer' }}
                      />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24' }}>{t('patient.settings.maskingTitle')}</div>
                        <div style={{ fontSize: '11px', color: '#52707C' }}>{t('patient.settings.maskingSub')}</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={fhirDataMasking}
                        onChange={e => setFhirDataMasking(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: '#B45309', cursor: 'pointer' }}
                      />
                    </label>
                  </div>

                  <div style={{ fontSize: '11.5px', background: '#FEF3C7', padding: '10px', borderRadius: '8px', color: '#92400E' }}>
                    <Lock size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} /> <strong>{t('patient.settings.privacyNote')}</strong>
                  </div>
                </div>

                {/* 6. Rural PHC Offline Mode & Low Data Compression */}
                <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
                      <WifiOff size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#081C24', margin: 0 }}>{t('patient.settings.offlineTitle')}</h3>
                      <div style={{ fontSize: '12px', color: '#52707C' }}>{t('patient.settings.offlineSub')}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24' }}>{t('patient.settings.offlineRxTitle')}</div>
                        <div style={{ fontSize: '11px', color: '#52707C' }}>{t('patient.settings.offlineRxSub')}</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={false}
                        disabled
                        style={{ width: '18px', height: '18px', accentColor: '#0284C7', cursor: 'pointer' }}
                      />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '10px', background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', cursor: 'pointer' }}>
                      <div>
                        <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#081C24' }}>{t('patient.settings.lowBwTitle')}</div>
                        <div style={{ fontSize: '11px', color: '#52707C' }}>{t('patient.settings.lowBwSub')}</div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={false}
                        disabled
                        style={{ width: '18px', height: '18px', accentColor: '#0284C7', cursor: 'pointer' }}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0F9FF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
                    <div style={{ fontSize: '12px', color: '#0369A1', fontWeight: 700 }}>
                      {t('patient.settings.cacheLabel')} <strong>{cacheSizeMb}</strong>
                    </div>
                    <button
                      onClick={() => {
                        setCacheSizeMb('0.0 MB');
                        alert(t('patient.settings.alertCache'))
                      }}
                      style={{ background: '#0284C7', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 750, cursor: 'pointer' }}
                    >
                      {t('patient.settings.clearCache')}
                    </button>
                  </div>
                </div>

              </div>

              {/* Bottom Action Footer */}
              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => alert(t('patient.settings.alertReset'))}
                  style={{ background: '#FAF8F5', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '10px', padding: '12px 20px', fontSize: '13px', fontWeight: 700, color: '#486770', cursor: 'pointer' }}
                >
                  {t('patient.settings.resetBtn')}
                </button>
                <button
                  onClick={savePatientPreferences}
                  className="btn-primary"
                  style={{ padding: '12px 28px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Check size={16} />
                  <span>{t('patient.settings.save')}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      {/* Demo Printable Prescription Preview for Patient */}
      {showPrintRxModal && (
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
            <div style={{
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
                  onClick={() => setShowPrintRxModal(false)}
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
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#B45309', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Synthetic demo document • not government issued
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#081C24', margin: '3px 0' }}>
                    {assignedDoctor.facility || 'Synthetic District Hospital Demo Facility'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#52707C' }}>
                    Department of {assignedDoctor.specialty} • Synthetic facility ID: DEMO-HFR-AP-14029
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F4C5C' }}>{assignedDoctor.doctorName}</div>
                  <div style={{ fontSize: '11px', color: '#486770' }}>{assignedDoctor.nmcRegNo || 'DEMO-REVIEWER-2026'}</div>
                  <div style={{ fontSize: '10.5px', color: '#52707C' }}>Demo clinician ID: {assignedDoctor.hprId || 'DEMO-CLINICIAN-2026'}</div>
                </div>
              </div>

              {/* Patient Barcode & Demographics Grid */}
              <div 
                className="patient-summary-slip-grid"
                style={{
                  background: '#FAF8F5',
                  border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '18px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  fontSize: '12px',
                  width: '100%'
                }}
              >
                <div>
                  <span style={{ color: '#52707C', display: 'block', fontSize: '10.5px' }}>PATIENT NAME</span>
                  <strong style={{ color: '#081C24', fontSize: '13px' }}>{patientName}</strong>
                </div>
                <div>
                  <span style={{ color: '#52707C', display: 'block', fontSize: '10.5px' }}>AGE / GENDER</span>
                  <strong style={{ color: '#081C24' }}>{activeDemoPatient?.age || patientProfile?.age || 58} Yrs • {activeDemoPatient?.genderLabel || patientProfile?.gender || 'Female'}</strong>
                </div>
                <div>
                  <span style={{ color: '#52707C', display: 'block', fontSize: '10.5px' }}>Demo ID</span>
                  <strong style={{ color: '#081C24', fontFamily: 'monospace' }}>{abhaId}</strong>
                </div>
                <div>
                  <span style={{ color: '#52707C', display: 'block', fontSize: '10.5px' }}>DATE OF ISSUE</span>
                  <strong style={{ color: '#081C24' }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong>
                </div>
              </div>

              {/* Vitals & Clinical Assessment */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 750, color: '#486770', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Recorded Vitals & Condition
                </div>
                <div style={{ fontSize: '12.5px', background: '#FAF8F5', padding: '8px 12px', borderRadius: '8px', color: '#2C4A52', marginBottom: '8px' }}>
                  BP: {patientProfile?.vitals?.bp || '120/80 mmHg'} • Pulse: {patientProfile?.vitals?.hr || '76 bpm'} • SpO2: {patientProfile?.vitals?.spo2 || '98%'}
                </div>
                <div style={{ fontSize: '13px', color: '#081C24', background: 'rgba(0, 0, 0, 0.06)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.14)' }}>
                  <strong>Provisional Diagnosis: </strong> {patientProfile?.condition || 'Seasonal Bronchial Sensitivity & Allergic Airway Reactivity'}
                </div>
              </div>

              {/* Prescribed Medications Table */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px', color: '#0F4C5C', fontWeight: 900, fontFamily: 'serif' }}>℞</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#081C24', textTransform: 'uppercase' }}>
                    Prescribed Medications (sample schedule)
                  </span>
                </div>

                <div style={{ border: '1px solid rgba(0, 0, 0, 0.06)', boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.03)', borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#FAF8F5', borderBottom: '1px solid #D0DFE2', color: '#486770', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px' }}>Medicine & Generic Equivalent</th>
                        <th style={{ padding: '10px 12px' }}>Timing & Indic Context</th>
                        <th style={{ padding: '10px 12px' }}>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(patientProfile?.chronotherapySchedule || [
                        { medicine: 'Pantoprazole 40mg (పసుపు గోళీ)', time: '08:30 AM', mealContext: 'Empty stomach (పరగడుపున)', purpose: 'Acidity & Reflux' },
                        { medicine: 'Metformin 500mg SR (గులాబీ గోళీ)', time: '08:30 PM', mealContext: 'After dinner (భోజనం తర్వాత)', purpose: 'Glucose Control' }
                      ]).map((med, mIdx) => (
                        <tr key={mIdx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <strong style={{ color: '#081C24', fontSize: '12.5px' }}>{med.medicine}</strong>
                            <div style={{ fontSize: '11px', color: '#15803D', fontWeight: 650, marginTop: '2px' }}>
                              Bundled sample entry - verify medicine and timing with a clinician
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#081C24', fontWeight: 600 }}>
                            {med.time} ({med.mealContext})
                          </td>
                          <td style={{ padding: '10px 12px', color: '#486770' }}>
                            {med.purpose || 'As directed by physician'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sample QR & Demo Sign-Off Footer */}
              <div style={{
                borderTop: '2px dashed #D0DFE2',
                paddingTop: '16px',
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <AuthenticQrCode 
                    value={`https://ayuswar-ai.vercel.app/patient-portal`}
                    size={68}
                    isDoctor={false}
                    showCenterBadge={false}
                  />
                  <div style={{ fontSize: '11px', color: '#52707C', maxWidth: '240px' }}>
                    ABDM Health Record Token: <strong>HRT-DEMO-9942</strong><br />
                    Synthetic QR token - no digital certificate issued. Scannable via any smartphone camera.
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
                    <div style={{ fontSize: '12.5px', fontWeight: 900, color: '#081C24' }}>{assignedDoctor.doctorName}</div>
                    <div style={{ fontSize: '10px', color: '#52707C' }}>Attending Physician (Demo)</div>
                  </div>
                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>Generated by the AyuSwar prototype</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPD Appointment Ticket Modal */}
      {showTicketModal && bookedTicket && (
        <OpdAppointmentTicketModal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          ticket={bookedTicket}
        />
      )}

      {/* Post-Consultation Visit Summary Modal */}
      {selectedVisitSummary && (
        <ConsultationVisitSummaryModal
          isOpen={!!selectedVisitSummary}
          onClose={() => setSelectedVisitSummary(null)}
          summary={selectedVisitSummary}
          initialApproved={!!selectedVisitSummary.approved}
        />
      )}

      {/* WhatsApp Vernacular Audio-Rx Modal */}
      <WhatsAppAudioRxModal 
        isOpen={showWhatsAppRxModal}
        onClose={() => setShowWhatsAppRxModal(false)}
        patientData={{
          name: patientName,
          vernacularName: (selectedLanguage === 'Telugu' ? (activeDemoPatient?.vernacularNames?.te || activeDemoPatient?.vernacular) : (activeDemoPatient?.vernacularNames?.hi || activeDemoPatient?.vernacular)) || patientName,
          phone: emergencyPhone || activeDemoPatient?.phone || '+91 00000 00001',
          cleanPhone: (emergencyPhone || activeDemoPatient?.phone || '910000000001').replace(/\D/g, ''),
          age: activeDemoPatient?.age || patientProfile?.age || 58,
          gender: activeDemoPatient?.genderLabel || patientProfile?.gender || 'Female',
          abhaId: abhaId,
          language: selectedLanguage,
          langCode: selectedLanguage === 'Telugu' ? 'te-IN' : 'hi-IN'
        }}
        doctorName={assignedDoctor.doctorName}
        initialLanguage={selectedLanguage === 'Telugu' ? 'te' : 'hi'}
      />



      {/* Real-time Citizen Health Notifications Drawer */}
      <ClinicalNotificationsDrawer
        isOpen={isNotificationsDrawerOpen}
        onClose={() => setIsNotificationsDrawerOpen(false)}
        mode="patient"
        userProfile={patientProfile}
        onActionClick={(item) => {
          if (item.actionType === 'listen_rx') {
            setShowWhatsAppRxModal(true);
          } else if (item.actionType === 'prescriptions') {
            setActiveTab('medications');
          } else if (item.actionType === 'health_records') {
            setActiveTab('my_health');
          } else if (item.actionType === 'scanner') {
            window.location.href = '/scanner';
          }
        }}
      />

      {/* Planned Notice Toast */}
      {plannedNotice && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          zIndex: 2000,
          background: '#0A2540',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.14)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: 700,
          border: '1px solid rgba(0, 0, 0, 0.14)',
          maxWidth: '90vw'
        }}>
          <span style={{ fontSize: '10px', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>PLANNED</span>
          <span>{plannedNotice}</span>
        </div>
      )}
    </div>
  );
}
