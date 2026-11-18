import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Route metadata mapping for dynamic SEO, AEO, and GEO optimization.
 * Automatically updates document.title, canonical URL, meta description,
 * and Open Graph / Twitter card tags on client-side route transitions.
 */
const ROUTE_METADATA = {
  '/': {
    title: 'AyuSwar AI (ఆయుస్వర) : Synthetic Indic Healthcare Voice Prototype',
    description: 'Synthetic-data research prototype for consultation drafting, acoustic signal exploration, prescription scanning, and emergency handoff simulation. No diagnosis, dispatch, ABDM exchange, or production readiness is claimed.',
    keywords: 'AyuSwar AI, ఆయుస్వర, Synthetic Clinical Prototype, Indic Voice Demo, Telugu Medical Speech Demo, FHIR-shaped Draft, Sanjivani 108 Simulation, Jan Aushadhi Sample Mapping',
    section: 'Home'
  },
  '/solutions': {
    title: 'Clinical Solutions & Workflows : AyuSwar AI Indic Healthcare Prototype',
    description: 'Explore sample consultation drafting, spoken Audio-Rx share previews, blister-pack OCR review, and simulated 108 emergency handoff workflows.',
    keywords: 'Ambient Scribing Prototype, Audio-Rx Preview, Medicine Blister Scanner, Emergency Handoff Simulation, FHIR-shaped Draft',
    section: 'Solutions'
  },
  '/technology': {
    title: 'Deep-Tech Architectural Blueprint : AyuSwar AI Technical Specifications',
    description: 'Review proposed browser audio processing, sample vocabulary mapping, local FHIR-shaped JSON, and deployment-dependent privacy boundaries.',
    keywords: 'Prototype Architecture, Browser Audio DSP, Sample ICD-10 Mapping, FHIR-shaped JSON',
    section: 'Technology'
  },
  '/about': {
    title: 'About the Author & Prototype Project : AyuSwar AI',
    description: 'Learn about Satya Samrudh Dwivedula, Aditya University, and the synthetic-data Indic healthcare prototype project.',
    keywords: 'About AyuSwar AI, Satya Samrudh Dwivedula, Aditya University, Indic Healthcare Prototype, Gnani AI Challenge',
    section: 'About'
  },
  '/team': {
    title: 'About the Author & Prototype Project : AyuSwar AI',
    description: 'Learn about Satya Samrudh Dwivedula, Aditya University, and the synthetic-data Indic healthcare prototype project.',
    keywords: 'About AyuSwar AI, Satya Samrudh Dwivedula, Aditya University, Indic Healthcare Prototype, Gnani AI Challenge',
    section: 'Team'
  },
  '/scanner': {
    title: 'Computer Vision Medicine Scanner Demo : AyuSwar AI Pharmaceutical OCR',
    description: 'Interactive demonstration of synthetic medicine blister strip scanning, optical character recognition, Jan Aushadhi generic substitution mapping, and dosage scheduling.',
    keywords: 'Medicine Strip Scanner, Pharmaceutical OCR, Jan Aushadhi Generic Medicine, Drug Interaction Demo, Computer Vision Health',
    section: 'Scanner'
  },
  '/audio-rx': {
    title: 'Spoken Audio-Rx Studio : Vernacular Prescription Adherence for Patients',
    description: 'High-contrast vernacular spoken sample prescription playback with word-by-word karaoke in Telugu, Hindi, and English for clinician review workflows.',
    keywords: 'Spoken Audio-Rx Preview, Vernacular Prescription Draft, Telugu Audio Dosage Demo, Clinician Review Workflow',
    section: 'Audio-Rx'
  },
  '/acoustic-lab': {
    title: 'Non-Diagnostic Acoustic Signal Processing Lab : AyuSwar AI DSP Explorer',
    description: 'Interactive browser DSP demonstration analyzing vocal audio frequencies, spectral centroid, zero-crossing rate, and spectrograms. For non-diagnostic educational signal exploration.',
    keywords: 'Acoustic Signal Processing, Audio Biomarkers Demo, Vocal Frequency Analysis, Web Audio API DSP, Non-Diagnostic Biomarkers',
    section: 'Acoustic Lab'
  },
  '/language-matrix': {
    title: 'Indic Language & Dialect Matrix : Regional Speech Recognition Support',
    description: 'Sample Indic speech matrix covering Telugu dialect examples, Hindi dialect examples, and Indian English with colloquial phrase mapping; live recognition accuracy is not verified.',
    keywords: 'Indic Language Matrix, Telugu Dialect Examples, Colloquial Medical Idioms, Vernacular Health Speech Demo',
    section: 'Language Matrix'
  },
  '/benchmarks': {
    title: 'Clinical Contract & Architectural Benchmarks : AyuSwar AI Verification Suite',
    description: 'Local execution of workflow and boundary checks for synthetic scenarios, non-diagnostic limits, FHIR-shaped drafts, and offline behavior; no legal or clinical certification.',
    keywords: 'Workflow Checks, Automated Contract Tests, FHIR-shaped Draft Checks, Health AI Prototype Verification',
    section: 'Benchmarks'
  },
  '/datasets': {
    title: 'Synthetic Clinical Datasets & Idiom Lexicon : AyuSwar AI Open Corpus',
    description: 'Explore synthetic rural OPD consultation transcripts, bilingual doctor-patient dialogues, and colloquial Telugu phrase crosswalks mapped to standard SNOMED CT clinical codes.',
    keywords: 'Synthetic Clinical Datasets, Indic OPD Transcripts, Telugu Clinical Idioms, Open Health Data, Kaggle Health Corpus',
    section: 'Datasets'
  },
  '/emergency': {
    title: 'Sanjivani 108 Simulated Emergency Distress Triage : AyuSwar AI Prototype',
    description: 'Simulated 108 emergency distress demonstration with sample keyword categories, map place lookup, a demo pacing beat, and a handoff preview. No ambulance, hospital, bed, bay, or dispatcher is contacted.',
    keywords: 'Simulated 108 Emergency, Sanjivani Emergency Handoff Preview, Demo Pacing Beat, Map Place Lookup',
    section: 'Emergency'
  },
  '/prescription/preview': {
    title: 'FHIR-shaped Prescription Draft Preview : AyuSwar AI',
    description: 'Preview a local FHIR-shaped JSON draft, sample prescription formatting, and Jan Aushadhi-inspired generic mapping for clinician review.',
    keywords: 'FHIR-shaped JSON, Prescription Draft, Jan Aushadhi Sample Mapping, Digital Health Prototype',
    section: 'Prescription'
  },
  '/doctor-portal': {
    title: 'Clinician Consultation Portal : AyuSwar AI Doctor Workspace',
    description: 'Demo consultation workflow console for sample vernacular scribing, draft SOAP notes, vocabulary review, and local FHIR-shaped export.',
    keywords: 'Doctor OPD Portal Demo, Ambient Scribe Prototype, SOAP Draft Generator, Rural Health Workflow Demo',
    section: 'Doctor Portal'
  },
  '/patient-portal': {
    title: 'Citizen Demo Health Portal : AyuSwar AI Patient Hub',
    description: 'Demo patient portal for reviewing synthetic audio prescriptions, reminder schedules, sample Jan Aushadhi-inspired savings, and local health-record drafts. No ABHA record is connected.',
    keywords: 'Patient Health Portal Demo, Vernacular Spoken Rx, Medicine Reminders, Synthetic Health Records',
    section: 'Patient Portal'
  },
  '/auth/doctor': {
    title: 'Demo Clinician Portal Sign-In : AyuSwar AI',
    description: 'Demo clinician sign-in for the AyuSwar prototype. HPR credential verification is not connected.',
    keywords: 'Doctor Login Demo, Clinician Portal Demo, Rural PHC Workflow Prototype',
    section: 'Authentication'
  },
  '/auth/patient': {
    title: 'Demo Citizen Portal Sign-In : AyuSwar AI',
    description: 'Demo patient sign-in for reviewing synthetic audio prescriptions and local sample reports. ABHA authentication is not connected.',
    keywords: 'Patient Login Demo, Citizen Access Demo, Audio Prescription Preview',
    section: 'Authentication'
  }
};

/**
 * SeoHead component: Injects and synchronizes SEO, AEO, and GEO metadata in the DOM.
 */
export default function SeoHead() {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;
    
    // Resolve matching route or fallback to base
    let meta = ROUTE_METADATA[pathname];
    if (!meta) {
      if (pathname.startsWith('/solutions/')) {
        meta = {
          title: 'Specialized Prototype Module : AyuSwar AI Indic Healthcare',
          description: 'Deep-dive into synthetic clinical workflow modules designed for Indian primary-care scenarios.',
          keywords: 'AyuSwar AI, Clinical Workflow Prototype, Primary Health Center Scenario, FHIR-shaped Draft',
          section: 'Solutions'
        };
      } else {
        meta = ROUTE_METADATA['/'];
      }
    }

    // 1. Update document title
    document.title = meta.title;

    // Helper to set or create meta tag
    const setMetaTag = (attrName, attrValue, content) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Update Core SEO description & keywords
    setMetaTag('name', 'description', meta.description);
    setMetaTag('name', 'keywords', meta.keywords);

    // 3. Update Open Graph Protocol tags (WhatsApp, LinkedIn, X, Telegram, iMessage)
    const canonicalUrl = `https://ayuswar-ai.vercel.app${pathname === '/' ? '' : pathname}`;
    const socialImageUrl = 'https://ayuswar-ai.vercel.app/assets/ayuswar_og_banner.jpg';
    setMetaTag('property', 'og:site_name', 'AyuSwar AI (ఆయుస్వర)');
    setMetaTag('property', 'og:title', meta.title);
    setMetaTag('property', 'og:description', meta.description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', socialImageUrl);
    setMetaTag('property', 'og:image:secure_url', socialImageUrl);
    setMetaTag('property', 'og:image:type', 'image/jpeg');
    setMetaTag('property', 'og:image:width', '1200');
    setMetaTag('property', 'og:image:height', '630');
    setMetaTag('property', 'og:image:alt', 'AyuSwar AI Master Clinical Voice Platform Banner : Deepam Heartbeat Logo with Gnani.ai Voice Stack');

    // 4. Update Twitter Card tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', meta.title);
    setMetaTag('name', 'twitter:description', meta.description);
    setMetaTag('name', 'twitter:image', socialImageUrl);
    setMetaTag('name', 'twitter:image:alt', 'AyuSwar AI Synthetic Indic Healthcare Prototype');

    // 5. Update Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

  }, [location]);

  return null;
}
