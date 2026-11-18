import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

if (!fs.existsSync(distDir)) {
  console.error('Error: dist directory does not exist. Run vite build first.');
  process.exit(1);
}

const templatePath = path.join(distDir, 'index.html');
const templateHtml = fs.readFileSync(templatePath, 'utf8');

const ROUTE_DATA = {
  '/solutions': {
    title: 'Clinical Solutions & Workflows : AyuSwar AI Indic Healthcare Prototype',
    description: 'Explore ambient clinical documentation, spoken Audio-Rx patient adherence cards, blister pack computer vision scanning, and simulated 108 emergency triage protocols.',
    canonical: 'https://ayuswar-ai.vercel.app/solutions',
    h1: 'AyuSwar AI Clinical Solutions & Workflows',
    content: `
      <header style="border-bottom: 2px solid #D0DFE2; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="font-size: 13px; font-weight: 800; color: #0F4C5C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          AyuSwar AI Modules · Clinical Workflow Overview
        </div>
        <h1 style="font-size: 32px; line-height: 1.2; color: #081C24; margin-bottom: 12px; font-weight: 850;">
          AyuSwar AI Clinical Solutions & Workflows
        </h1>
        <p style="font-size: 17px; color: #2C4A52; font-weight: 500; margin: 0;">
          Four sovereign voice-first healthcare workflows engineered for high-volume rural Primary Health Centers in India.
        </p>
      </header>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          1. Ambient Clinical Voice Scribing for Rural OPDs
        </h2>
        <p>
          AyuSwar AI is a research prototype for recording practice doctor-patient consultations in vernacular Indian languages (Telugu, Hindi, and Indian English). Transcription is user-initiated; colloquial-expression mappings come from bundled reference data and are marked unverified, and every draft requires physician review before any use.
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          2. Spoken Vernacular Audio-Rx Prescriptions
        </h2>
        <p>
          To combat medication non-adherence among illiterate rural patients, AyuSwar converts complex medical prescriptions into 30-second spoken voice instructions in regional dialects. Prescriptions are delivered via WhatsApp with word-by-word highlighted dosage schedules and color-coded morning/evening cards matching pill foils.
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          3. Computer Vision Medicine Blister Strip Scanner
        </h2>
        <p>
          Using client-side optical character recognition, the prototype reads pharmaceutical blister strips to extract active chemical salts. It queries the Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) public formulary to display affordable generic alternatives and check for potential adverse drug interactions.
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          4. Sanjivani 108 Simulated Emergency Distress Triage
        </h2>
        <p>
          An educational emergency simulation demonstrating conversational speech intake, red/yellow/green severity categorization, bystander CPR pacing metronome, and structured clinical handover summaries for ambulance telemetry. <em>(Simulated demonstration; real emergencies dial 112 or 108).</em>
        </p>
      </article>

      <nav aria-label="Related Modules" style="background: #FFFFFF; border: 1.5px solid #D0DFE2; border-radius: 16px; padding: 24px; margin-top: 32px;">
        <h2 style="font-size: 18px; color: #081C24; margin-bottom: 12px; font-weight: 800;">Related Technical Documentation</h2>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><a href="/technology" style="color: #0F4C5C; font-weight: 700;">Deep-Tech Architecture Blueprint</a></li>
          <li><a href="/about" style="color: #0F4C5C; font-weight: 700;">About the Author & Sovereign Consortium</a></li>
          <li><a href="/benchmarks" style="color: #0F4C5C; font-weight: 700;">Automated Clinical Benchmarks (74 Test Specs)</a></li>
          <li><a href="/" style="color: #0F4C5C; font-weight: 700;">Return to AyuSwar AI Homepage</a></li>
        </ul>
      </nav>
    `
  },

  '/technology': {
    title: 'Deep-Tech Architectural Blueprint : AyuSwar AI Technical Specifications',
    description: 'Zero-cloud ephemeral RAM audio pipeline, quantized edge ONNX speech transcription, deterministic SNOMED CT and WHO ICD-10 ontology crosswalk, and HL7 FHIR R4 JSON schemas.',
    canonical: 'https://ayuswar-ai.vercel.app/technology',
    h1: 'Deep-Tech Architectural Blueprint: AyuSwar AI Technical Specifications',
    content: `
      <header style="border-bottom: 2px solid #D0DFE2; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="font-size: 13px; font-weight: 800; color: #0F4C5C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Engineering Monograph · System Architecture
        </div>
        <h1 style="font-size: 32px; line-height: 1.2; color: #081C24; margin-bottom: 12px; font-weight: 850;">
          Deep-Tech Architectural Blueprint: AyuSwar AI Technical Specifications
        </h1>
        <p style="font-size: 17px; color: #2C4A52; font-weight: 500; margin: 0;">
          Comprehensive technical monograph detailing the 4 sovereign architectural pillars of AyuSwar AI.
        </p>
      </header>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          1. High-Fidelity 48kHz Acoustic Digital Signal Processing (DSP)
        </h2>
        <p>
          AyuSwar operates a 48kHz dual-channel Web Audio pipeline using 2048-point Fast Fourier Transforms (FFT). It isolates clinician and patient acoustic channels, computing real-time Voice Activity Detection (VAD) and audio Signal-to-Noise Ratio (SNR) aimed at reducing transcription drift; performance in crowded rural clinic environments has not been validated.
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          2. Sovereign Indic Voice Infrastructure (Gnani Prisma v3 & Timbre v2.5)
        </h2>
        <p>
          Leveraging Gnani.ai production-grade Indic speech models (Prisma v3 STT & Timbre v2.5 TTS), AyuSwar transcribes regional dialects across Telugu (Rayalaseema, Telangana, Coastal Andhra), Hindi, and Indian English via serverless API gateways (/api/gnani/stt, /api/gnani/tts), maintaining graceful client-side fallbacks when operating in low-connectivity rural environments.
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          3. Deterministic Clinical Safety Sentinel & Crosswalk
        </h2>
        <p>
          Medical documentation permits zero diagnostic hallucination. AyuSwar enforces a deterministic ontology crosswalk that resolves visceral colloquial expressions (e.g. Telugu 'పీకల్లో పిల్లికూతలు') directly into standardized WHO ICD-10 Code R06.2 and SNOMED-CT 195967001 before any LLM generates output.
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          4. Ephemeral Volatile RAM Processing & DPDP Act 2023 Sovereignty
        </h2>
        <p>
          Under India's Digital Personal Data Protection (DPDP) Act 2023, patient voice streams constitute sensitive biometric data. The browser prototype is designed to keep captured practice audio in memory and does not write audio files to external disk in the current implementation; this is a prototype implementation property, not a certified DPDP compliance determination. Encounter drafts can be exported as HL7 FHIR R4-format JSON bundles modelled on ABDM sandbox profiles for research inspection; they are not ABDM validated at any milestone and no registry exchange is performed.
        </p>
      </article>

      <nav aria-label="Navigation" style="background: #FFFFFF; border: 1.5px solid #D0DFE2; border-radius: 16px; padding: 24px; margin-top: 32px;">
        <h2 style="font-size: 18px; color: #081C24; margin-bottom: 12px; font-weight: 800;">Explore Specifications</h2>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><a href="/solutions" style="color: #0F4C5C; font-weight: 700;">Clinical Solutions & Workflows</a></li>
          <li><a href="/about" style="color: #0F4C5C; font-weight: 700;">About the Author & Sovereign Consortium</a></li>
          <li><a href="/benchmarks" style="color: #0F4C5C; font-weight: 700;">Clinical Benchmark Suite</a></li>
          <li><a href="/" style="color: #0F4C5C; font-weight: 700;">Return to Homepage</a></li>
        </ul>
      </nav>
    `
  },

  '/about': {
    title: 'About the Author & Sovereign Clinical AI Team : AyuSwar AI',
    description: 'Learn about Satya Samrudh Dwivedula, Aditya University, and the open-source engineering consortium building sovereign Indic ambient clinical intelligence.',
    canonical: 'https://ayuswar-ai.vercel.app/about',
    h1: 'About AyuSwar AI & The Engineering Consortium',
    content: `
      <header style="border-bottom: 2px solid #D0DFE2; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="font-size: 13px; font-weight: 800; color: #0F4C5C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          About The Initiative · Creator & Governance
        </div>
        <h1 style="font-size: 32px; line-height: 1.2; color: #081C24; margin-bottom: 12px; font-weight: 850;">
          About AyuSwar AI & The Engineering Consortium
        </h1>
        <p style="font-size: 17px; color: #2C4A52; font-weight: 500; margin: 0;">
          A sovereign, open-source Indic clinical speech assistant developed for the Great Indian AI Internship Challenge 2026 by Gnani.ai.
        </p>
      </header>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          Lead Systems Architect & Creator
        </h2>
        <p>
          AyuSwar AI was conceptualized, architected, and built solo by <strong>Satya Samrudh Dwivedula</strong>, a B.Tech Computer Science & Engineering undergraduate at <strong>Aditya University</strong>, Andhra Pradesh.
        </p>
        <p>
          Connect with the author and inspect verifiable code artifacts:
        </p>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><strong>GitHub Profile:</strong> <a href="https://github.com/Samrudh2006" target="_blank" rel="author noopener noreferrer" style="color: #0F4C5C; font-weight: 700; text-decoration: underline;">github.com/Samrudh2006</a></li>
          <li><strong>Project Repository:</strong> <a href="https://github.com/Samrudh2006/Ayuswar-Ai" target="_blank" rel="noopener noreferrer" style="color: #0F4C5C; font-weight: 700; text-decoration: underline;">github.com/Samrudh2006/Ayuswar-Ai</a></li>
          <li><strong>Challenge Context:</strong> Built for the Great Indian AI Internship Challenge 2026 sponsored by Gnani.ai.</li>
        </ul>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          The Problem AyuSwar Solves for Bharat
        </h2>
        <p>
          In rural Primary Health Centers across India, a single government doctor routinely attends to 80 to 120 patients during a four-hour morning shift. Mandating typed electronic documentation forces clinicians to look into a keyboard rather than the patient, consuming up to 42% of consultation time. AyuSwar AI restores the sacred human doctor-patient connection by making medical software listen and speak in the mother tongue of rural citizens.
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          Open Source & CNCF Sovereign Cloud-Native Stack
        </h2>
        <p>
          AyuSwar AI avoids costly proprietary cloud lock-in by providing a 100% free, production-ready CNCF open-source deployment suite:
        </p>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><strong>Lightweight Kubernetes (K3s / Minikube):</strong> Production HPA scaling from 3 to 30 pods at 70% CPU threshold.</li>
          <li><strong>Prometheus & Grafana:</strong> Real-time clinical telemetry tracking audio Real-Time Factor (RTF), wheeze density, and FHIR error rates.</li>
          <li><strong>ArgoCD GitOps:</strong> Automated continuous delivery synced directly with the open-source repository.</li>
          <li><strong>Zero Cloud Cost:</strong> Deployable locally or on sovereign government servers at ₹0 software license expense.</li>
        </ul>
      </article>

      <nav aria-label="Navigation" style="background: #FFFFFF; border: 1.5px solid #D0DFE2; border-radius: 16px; padding: 24px; margin-top: 32px;">
        <h2 style="font-size: 18px; color: #081C24; margin-bottom: 12px; font-weight: 800;">Explore AyuSwar AI</h2>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><a href="/technology" style="color: #0F4C5C; font-weight: 700;">Deep-Tech Architecture Blueprint</a></li>
          <li><a href="/solutions" style="color: #0F4C5C; font-weight: 700;">Clinical Solutions & Workflows</a></li>
          <li><a href="/benchmarks" style="color: #0F4C5C; font-weight: 700;">Clinical Verification Benchmarks (74 Specs Passed)</a></li>
          <li><a href="/" style="color: #0F4C5C; font-weight: 700;">Return to Homepage</a></li>
        </ul>
      </nav>
    `
  },

  '/scanner': {
    title: 'Computer Vision Medicine Scanner Demo : AyuSwar AI Pharmaceutical OCR',
    description: 'Interactive demonstration of synthetic medicine blister strip scanning, optical character recognition, Jan Aushadhi generic substitution mapping, and dosage scheduling.',
    canonical: 'https://ayuswar-ai.vercel.app/scanner',
    h1: 'Computer Vision Medicine Scanner Demo: Jan Aushadhi Generic Substitution',
    content: `
      <header style="border-bottom: 2px solid #D0DFE2; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="font-size: 13px; font-weight: 800; color: #0F4C5C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Computer Vision · PMBJP Jan Aushadhi Formulary
        </div>
        <h1 style="font-size: 32px; line-height: 1.2; color: #081C24; margin-bottom: 12px; font-weight: 850;">
          Computer Vision Medicine Scanner Demo: Jan Aushadhi Generic Substitution
        </h1>
        <p style="font-size: 17px; color: #2C4A52; font-weight: 500; margin: 0;">
          Client-side optical character recognition cross-referencing pharmaceutical active salts with government Jan Aushadhi generic price ceilings.
        </p>
      </header>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          Pharmaceutical Optical Character Recognition
        </h2>
        <p>
          The prototype demonstrates browser-based computer vision OCR (Tesseract.js and OpenCV filters) scanning medication blister packaging to detect active pharmaceutical ingredients, strengths, and dosage forms.
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) Matching
        </h2>
        <p>
          Once the active chemical salt is detected, the scanner queries the public PMBJP national formulary to display high-quality generic equivalents. For example, commercial Atorvastatin (₹95 per strip) is cross-matched with Jan Aushadhi generic Atorvastatin (₹13 per strip), illustrating potential out-of-pocket savings up to 86% for rural families.
        </p>
      </article>

      <nav aria-label="Navigation" style="background: #FFFFFF; border: 1.5px solid #D0DFE2; border-radius: 16px; padding: 24px; margin-top: 32px;">
        <h2 style="font-size: 18px; color: #081C24; margin-bottom: 12px; font-weight: 800;">Related Modules</h2>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><a href="/audio-rx" style="color: #0F4C5C; font-weight: 700;">Spoken Audio-Rx Studio</a></li>
          <li><a href="/solutions" style="color: #0F4C5C; font-weight: 700;">Clinical Solutions & Workflows</a></li>
          <li><a href="/" style="color: #0F4C5C; font-weight: 700;">Return to Homepage</a></li>
        </ul>
      </nav>
    `
  },

  '/audio-rx': {
    title: 'Spoken Audio-Rx Studio : Vernacular Prescription Adherence for Patients',
    description: 'High-contrast vernacular spoken prescription playback with word-by-word karaoke synchronization in Telugu, Hindi, and English to eliminate rural patient medication errors.',
    canonical: 'https://ayuswar-ai.vercel.app/audio-rx',
    h1: 'Spoken Audio-Rx Studio: Vernacular Prescription Adherence',
    content: `
      <header style="border-bottom: 2px solid #D0DFE2; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="font-size: 13px; font-weight: 800; color: #0F4C5C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Patient Adherence · Vernacular TTS
        </div>
        <h1 style="font-size: 32px; line-height: 1.2; color: #081C24; margin-bottom: 12px; font-weight: 850;">
          Spoken Audio-Rx Studio: Vernacular Prescription Adherence
        </h1>
        <p style="font-size: 17px; color: #2C4A52; font-weight: 500; margin: 0;">
          Word-by-word synchronized audio prescription playback in regional Indic dialects for patients unable to read printed text.
        </p>
      </header>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          Eliminating Prescription Illiteracy in Rural India
        </h2>
        <p>
          In rural Primary Health Centers, patients often receive English paper slips they cannot decipher, leading to severe medication non-adherence and accidental overdose. AyuSwar transforms structured clinical prescriptions into spoken audio voice notes synthesized in the patient's native dialect (Telugu, Hindi, and English).
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          Karaoke-Synchronized Visual Dosage Schedules
        </h2>
        <p>
          When a configured TTS service plays the vernacular audio, the on-screen card is designed to highlight words in synchronization, matching morning dosage (yellow sun icon) and evening dosage (blue moon icon) with physical blister foil colors (e.g. green foil for amoxicillin).
        </p>
      </article>

      <nav aria-label="Navigation" style="background: #FFFFFF; border: 1.5px solid #D0DFE2; border-radius: 16px; padding: 24px; margin-top: 32px;">
        <h2 style="font-size: 18px; color: #081C24; margin-bottom: 12px; font-weight: 800;">Related Modules</h2>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><a href="/scanner" style="color: #0F4C5C; font-weight: 700;">Medicine Scanner Demo</a></li>
          <li><a href="/language-matrix" style="color: #0F4C5C; font-weight: 700;">Indic Language & Dialect Matrix</a></li>
          <li><a href="/" style="color: #0F4C5C; font-weight: 700;">Return to Homepage</a></li>
        </ul>
      </nav>
    `
  },

  '/acoustic-lab': {
    title: 'Non-Diagnostic Acoustic Signal Processing Lab : AyuSwar AI DSP Explorer',
    description: 'Interactive browser DSP demonstration analyzing vocal audio frequencies, spectral centroid, zero-crossing rate, and spectrograms. For non-diagnostic educational signal exploration.',
    canonical: 'https://ayuswar-ai.vercel.app/acoustic-lab',
    h1: 'Non-Diagnostic Acoustic Signal Processing Lab',
    content: `
      <header style="border-bottom: 2px solid #D0DFE2; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="font-size: 13px; font-weight: 800; color: #0F4C5C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Digital Signal Processing · Educational Tool
        </div>
        <h1 style="font-size: 32px; line-height: 1.2; color: #081C24; margin-bottom: 12px; font-weight: 850;">
          Non-Diagnostic Acoustic Signal Processing Lab
        </h1>
        <p style="font-size: 17px; color: #2C4A52; font-weight: 500; margin: 0;">
          Real-time frequency-domain digital signal analysis demonstrating physical audio feature extraction using the browser Web Audio API.
        </p>
      </header>

      <article style="background: #FFFBEB; border: 1.5px solid #F59E0B; border-radius: 12px; padding: 18px; margin-bottom: 28px;">
        <strong style="color: #92400E;">NON-DIAGNOSTIC RESEARCH NOTICE:</strong>
        <p style="color: #78350F; margin: 4px 0 0 0; font-size: 14px;">
          This acoustic signal analyzer is an experimental engineering demonstration of digital signal processing (DSP). It is NOT a medical device, does not diagnose any respiratory or vocal pathology, and must never be used for clinical decision-making.
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          48kHz Frequency Domain Feature Extraction
        </h2>
        <p>
          Demonstrates Fast Fourier Transform (FFT) analysis computing fundamental frequency (F0 pitch), spectral centroid, spectral rolloff, zero-crossing rate, and Harmonics-to-Noise Ratio (HNR) with a physical tone precision within ±2Hz.
        </p>
      </article>

      <nav aria-label="Navigation" style="background: #FFFFFF; border: 1.5px solid #D0DFE2; border-radius: 16px; padding: 24px; margin-top: 32px;">
        <h2 style="font-size: 18px; color: #081C24; margin-bottom: 12px; font-weight: 800;">Related Modules</h2>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><a href="/technology" style="color: #0F4C5C; font-weight: 700;">Deep-Tech Architecture Blueprint</a></li>
          <li><a href="/benchmarks" style="color: #0F4C5C; font-weight: 700;">Acoustic DSP Phase 9 Test Specs</a></li>
          <li><a href="/" style="color: #0F4C5C; font-weight: 700;">Return to Homepage</a></li>
        </ul>
      </nav>
    `
  },

  '/language-matrix': {
    title: 'Indic Language & Dialect Matrix : Regional Speech Recognition Support',
    description: 'Vernacular clinical speech support covering Telugu (Rayalaseema, Telangana, Coastal Andhra, Uttarandhra), Hindi dialects, and Indian English with colloquial idiom translation.',
    canonical: 'https://ayuswar-ai.vercel.app/language-matrix',
    h1: 'Indic Language & Regional Dialect Support Matrix',
    content: `
      <header style="border-bottom: 2px solid #D0DFE2; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="font-size: 13px; font-weight: 800; color: #0F4C5C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Linguistic Engineering · Regional Speech AI
        </div>
        <h1 style="font-size: 32px; line-height: 1.2; color: #081C24; margin-bottom: 12px; font-weight: 850;">
          Indic Language & Regional Dialect Support Matrix
        </h1>
        <p style="font-size: 17px; color: #2C4A52; font-weight: 500; margin: 0;">
          Detailed overview of dialect clusters and colloquial medical idiom mappings in Telugu, Hindi, and Indian English.
        </p>
      </header>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          Sovereign Indic Voice Architecture (Gnani Prisma v3 & Timbre v2.5)
        </h2>
        <p>
          AyuSwar AI integrates Gnani.ai's state-of-the-art Indic speech models through secure serverless gateways:
        </p>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><strong>Gnani Prisma v3 Streaming ASR:</strong> Multi-dialect speech-to-text supporting code-mixed Telugu-English and Hindi-English consultations with linguistic pitch diarization.</li>
          <li><strong>Gnani Timbre v2.5 Neural TTS:</strong> Authentic 24kHz vernacular voice synthesis (Nalini & Arya voices) with 1:1 synchronized karaoke highlighting.</li>
          <li><strong>Gnani Evon 30B Clinical Reasoner:</strong> Maps colloquial Indic symptom metaphors directly to WHO ICD-10 and SNOMED-CT clinical ontologies.</li>
          <li><strong>National Health Authority (NHA) ABDM:</strong> HL7 FHIR R4-format JSON serialization for research inspection, structured with ABDM profiles in mind. No ABHA verification, HIP/HIU exchange, or ABDM certification is implemented.</li>
        </ul>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          Four Major Telugu Regional Dialect Clusters
        </h2>
        <p>
          AyuSwar AI specifically models phonological and lexical variations across the four primary Telugu socio-linguistic regions:
        </p>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><strong>Rayalaseema Dialect:</strong> (Kurnool, Anantapur, Kadapa, Chittoor) — Characterized by distinct visceral symptom phrasing such as <em>"పీకల్లో పిల్లికూతలు"</em> (wheezing).</li>
          <li><strong>Telangana Dialect:</strong> (Hyderabad, Warangal, Karimnagar, Nizamabad) — Influenced by Dakhni and Urdu loanwords in medical interactions.</li>
          <li><strong>Coastal Andhra:</strong> (Krishna, Guntur, Godavari, Prakasam) — Standard literary Telugu register with distinct nasalization.</li>
          <li><strong>Uttarandhra:</strong> (Visakhapatnam, Vizianagaram, Srikakulam) — Unique grammatical cadences and rural health vocabularies.</li>
        </ul>
      </article>

      <nav aria-label="Navigation" style="background: #FFFFFF; border: 1.5px solid #D0DFE2; border-radius: 16px; padding: 24px; margin-top: 32px;">
        <h2 style="font-size: 18px; color: #081C24; margin-bottom: 12px; font-weight: 800;">Related Modules</h2>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><a href="/datasets" style="color: #0F4C5C; font-weight: 700;">Colloquial Idiom Lexicon</a></li>
          <li><a href="/audio-rx" style="color: #0F4C5C; font-weight: 700;">Spoken Audio-Rx Studio</a></li>
          <li><a href="/" style="color: #0F4C5C; font-weight: 700;">Return to Homepage</a></li>
        </ul>
      </nav>
    `
  },

  '/benchmarks': {
    title: 'Clinical Contract & Architectural Benchmarks : AyuSwar AI Verification Suite',
    description: 'Real-time execution of 74 contract tests verifying DPDP Act 2023 ephemeral RAM safety, non-diagnostic boundaries, ABDM FHIR R4 schema integrity, and offline edge resilience.',
    canonical: 'https://ayuswar-ai.vercel.app/benchmarks',
    h1: 'AyuSwar AI Clinical & Architectural Verification Benchmarks',
    content: `
      <header style="border-bottom: 2px solid #D0DFE2; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="font-size: 13px; font-weight: 800; color: #0F4C5C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Verification Suite · Automated Specifications
        </div>
        <h1 style="font-size: 32px; line-height: 1.2; color: #081C24; margin-bottom: 12px; font-weight: 850;">
          AyuSwar AI Clinical & Architectural Verification Benchmarks
        </h1>
        <p style="font-size: 17px; color: #2C4A52; font-weight: 500; margin: 0;">
          Scope of the 10-phase automated clinical verification suite executed on synthetic fixtures. Pass/fail results are produced at test time and published with each build's QA evidence; this page intentionally does not hardcode a score.
        </p>
      </header>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          10-Phase Clinical Safety Verification Coverage
        </h2>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><strong>Phase 1: API Boundary Security</strong> — checks API key leakage prevention, CORS restrictions, rate limiting.</li>
          <li><strong>Phase 2: Server Triage Boundary</strong> — checks acuity floor preservation, no autonomous downgrade.</li>
          <li><strong>Phase 3: Voice Integration & Honest Status</strong> — checks graceful unconfigured fallback, honest unavailability states.</li>
          <li><strong>Phase 4: Database & Auth Security (RLS)</strong> — checks row-level security, role-based clinician access.</li>
          <li><strong>Phase 5: Mobile UI/UX & Safe Area Spacing</strong> — checks contrast and responsive touch-target checks.</li>
          <li><strong>Phase 6: Static Code Contract Assertions</strong> — checks no external analytics calls, bundle hygiene.</li>
          <li><strong>Phase 7: Clinical Safety Sentinel</strong> — checks deterministic crosswalk behavior with bundled reference data.</li>
          <li><strong>Phase 8: Gnani Indic Voice Pipeline</strong> — checks STT/TTS service contract validation.</li>
          <li><strong>Phase 9: Acoustic DSP Physical Tone Gates</strong> — checks FFT tone-gate accuracy against generated signals.</li>
          <li><strong>Phase 10: Advanced Telephony & Clinical VAD</strong> — checks dual-channel handling and SNR estimation.</li>
        </ul>
      </article>

      <nav aria-label="Navigation" style="background: #FFFFFF; border: 1.5px solid #D0DFE2; border-radius: 16px; padding: 24px; margin-top: 32px;">
        <h2 style="font-size: 18px; color: #081C24; margin-bottom: 12px; font-weight: 800;">Related Documentation</h2>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><a href="/technology" style="color: #0F4C5C; font-weight: 700;">Deep-Tech Architecture Blueprint</a></li>
          <li><a href="/datasets" style="color: #0F4C5C; font-weight: 700;">Synthetic Datasets & Lexicon</a></li>
          <li><a href="/" style="color: #0F4C5C; font-weight: 700;">Return to Homepage</a></li>
        </ul>
      </nav>
    `
  },

  '/datasets': {
    title: 'Synthetic Clinical Datasets & Idiom Lexicon : AyuSwar AI Open Corpus',
    description: 'Explore synthetic rural OPD consultation transcripts, bilingual doctor-patient dialogues, and colloquial Telugu phrase crosswalks mapped to standard SNOMED CT clinical codes.',
    canonical: 'https://ayuswar-ai.vercel.app/datasets',
    h1: 'Synthetic Clinical Datasets & Colloquial Idiom Lexicon',
    content: `
      <header style="border-bottom: 2px solid #D0DFE2; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="font-size: 13px; font-weight: 800; color: #0F4C5C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Open Research Corpus · Synthetic Datasets
        </div>
        <h1 style="font-size: 32px; line-height: 1.2; color: #081C24; margin-bottom: 12px; font-weight: 850;">
          Synthetic Clinical Datasets & Colloquial Idiom Lexicon
        </h1>
        <p style="font-size: 17px; color: #2C4A52; font-weight: 500; margin: 0;">
          Synthetic rural consultation dialogues, diarized audio transcripts, and standardized ontology crosswalk tables.
        </p>
      </header>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          Synthetic Rural Primary Health Center Encounters
        </h2>
        <p>
          To maintain strict clinical privacy under India's DPDP Act 2023, AyuSwar was developed using synthetic, de-identified clinical dialogues modeling real-world rural health encounters:
        </p>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><strong>Asthma & Nocturnal Dyspnea:</strong> Colloquial Rayalaseema Telugu dialogues with wheeze biomarker features.</li>
          <li><strong>Type-2 Diabetes & Hypertension:</strong> Routine chronic follow-up with generic metformin and amlodipine substitution.</li>
          <li><strong>Acute Gastritis & Dyspepsia:</strong> Colloquial symptom expressions mapped to WHO ICD-10 K30 and PMBJP antacid options.</li>
        </ul>
      </article>

      <nav aria-label="Navigation" style="background: #FFFFFF; border: 1.5px solid #D0DFE2; border-radius: 16px; padding: 24px; margin-top: 32px;">
        <h2 style="font-size: 18px; color: #081C24; margin-bottom: 12px; font-weight: 800;">Related Modules</h2>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><a href="/language-matrix" style="color: #0F4C5C; font-weight: 700;">Indic Language & Dialect Matrix</a></li>
          <li><a href="/benchmarks" style="color: #0F4C5C; font-weight: 700;">Clinical Benchmarks</a></li>
          <li><a href="/" style="color: #0F4C5C; font-weight: 700;">Return to Homepage</a></li>
        </ul>
      </nav>
    `
  },

  '/emergency': {
    title: 'Sanjivani 108 Simulated Emergency Distress Triage : AyuSwar AI Prototype',
    description: 'Simulated 108 emergency distress demonstration featuring bilingual conversational triage, GPS ambulance tracking simulation, CPR guidance metronome, and hospital pre-alert telemetry.',
    canonical: 'https://ayuswar-ai.vercel.app/emergency',
    h1: 'Sanjivani 108 Simulated Emergency Distress Triage Protocol',
    content: `
      <header style="border-bottom: 2px solid #D0DFE2; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="font-size: 13px; font-weight: 800; color: #0F4C5C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Emergency Protocol · Simulation Demonstration
        </div>
        <h1 style="font-size: 32px; line-height: 1.2; color: #081C24; margin-bottom: 12px; font-weight: 850;">
          Sanjivani 108 Simulated Emergency Distress Triage Protocol
        </h1>
        <p style="font-size: 17px; color: #2C4A52; font-weight: 500; margin: 0;">
          Demonstration of voice-first conversational emergency triage and structured ambulance handover telemetry.
        </p>
      </header>

      <article style="background: #FEF2F2; border: 1.5px solid #EF4444; border-radius: 12px; padding: 18px; margin-bottom: 28px;">
        <strong style="color: #991B1B;">REAL EMERGENCY NOTICE FOR BHARAT:</strong>
        <p style="color: #7F1D1D; margin: 4px 0 0 0; font-size: 14px;">
          AyuSwar AI Sanjivani-108 is strictly an educational research simulation. It does NOT dispatch real ambulances, medical personnel, or police. For any real medical emergency anywhere in India, immediately dial <strong>112</strong> or <strong>108</strong>.
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          Deterministic Acuity Scoring & Categorization
        </h2>
        <p>
          Simulates conversational voice intake in Telugu, Hindi, and English. A deterministic safety sentinel evaluates distress indicators, preventing generative AI models from downgrading red-flag emergency symptoms (chest pain, severe dyspnea, acute trauma).
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          Bystander CPR Acoustic Metronome
        </h2>
        <p>
          Features an audio metronome calibrated to standard resuscitation guidelines (100–120 beats per minute) to guide bystanders through rhythmic chest compressions while emergency services are en route.
        </p>
      </article>

      <nav aria-label="Navigation" style="background: #FFFFFF; border: 1.5px solid #D0DFE2; border-radius: 16px; padding: 24px; margin-top: 32px;">
        <h2 style="font-size: 18px; color: #081C24; margin-bottom: 12px; font-weight: 800;">Related Modules</h2>
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><a href="/solutions" style="color: #0F4C5C; font-weight: 700;">Clinical Solutions & Workflows</a></li>
          <li><a href="/technology" style="color: #0F4C5C; font-weight: 700;">Deep-Tech Architecture Blueprint</a></li>
          <li><a href="/" style="color: #0F4C5C; font-weight: 700;">Return to Homepage</a></li>
        </ul>
      </nav>
    `
  },

  '/privacy': {
    title: 'Privacy Policy & DPDP Act 2023 Compliance : AyuSwar AI',
    description: 'AyuSwar AI data privacy policy, ephemeral RAM audio processing guarantees, zero cloud retention, and Digital Personal Data Protection Act 2023 alignment.',
    canonical: 'https://ayuswar-ai.vercel.app/privacy',
    h1: 'Privacy Policy & Data Sovereignty Alignment',
    content: `
      <header style="border-bottom: 2px solid #D0DFE2; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="font-size: 13px; font-weight: 800; color: #0F4C5C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Data Sovereignty · DPDP Act 2023
        </div>
        <h1 style="font-size: 32px; line-height: 1.2; color: #081C24; margin-bottom: 12px; font-weight: 850;">
          Privacy Policy & Data Sovereignty Alignment
        </h1>
        <p style="font-size: 17px; color: #2C4A52; font-weight: 500; margin: 0;">
          Strict privacy architecture ensuring volatile audio processing and zero persistent cloud storage.
        </p>
      </header>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          1. Ephemeral Volatile RAM Audio Processing
        </h2>
        <p>
          Under the Digital Personal Data Protection (DPDP) Act 2023, patient biometric voice streams are treated as sensitive personal data. AyuSwar AI processes audio streams strictly in volatile RAM memory within Indian sovereign boundaries and purges audio buffers the instant note transcription completes.
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          2. Zero Persistent Cloud Voice Retention
        </h2>
        <p>
          AyuSwar AI does not record, archive, or sell patient audio or conversation transcripts to third-party advertising networks or external model training pools.
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          3. Synthetic Benchmark Evaluation Notice
        </h2>
        <p>
          All clinical encounters, patient profiles, and demonstration data featured across this website are synthetic fixtures created for research validation. No real patient health records have been accessed or stored.
        </p>
      </article>

      <nav aria-label="Navigation" style="background: #FFFFFF; border: 1.5px solid #D0DFE2; border-radius: 16px; padding: 24px; margin-top: 32px;">
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><a href="/terms" style="color: #0F4C5C; font-weight: 700;">Terms of Service</a></li>
          <li><a href="/about" style="color: #0F4C5C; font-weight: 700;">About the Project</a></li>
          <li><a href="/" style="color: #0F4C5C; font-weight: 700;">Return to Homepage</a></li>
        </ul>
      </nav>
    `
  },

  '/terms': {
    title: 'Terms of Service & Research Prototype Notice : AyuSwar AI',
    description: 'Terms of service, clinical research prototype boundaries, non-diagnostic disclaimers, and open-source usage terms for AyuSwar AI.',
    canonical: 'https://ayuswar-ai.vercel.app/terms',
    h1: 'Terms of Service & Research Prototype Disclaimers',
    content: `
      <header style="border-bottom: 2px solid #D0DFE2; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="font-size: 13px; font-weight: 800; color: #0F4C5C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
          Legal Terms · Prototype Notice
        </div>
        <h1 style="font-size: 32px; line-height: 1.2; color: #081C24; margin-bottom: 12px; font-weight: 850;">
          Terms of Service & Research Prototype Disclaimers
        </h1>
        <p style="font-size: 17px; color: #2C4A52; font-weight: 500; margin: 0;">
          Terms governing the evaluation and open-source demonstration of AyuSwar AI.
        </p>
      </header>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          1. Research Prototype Status
        </h2>
        <p>
          AyuSwar AI is an engineering research prototype developed for the Great Indian AI Internship Challenge 2026 by Gnani.ai. It is not an approved medical device, is not certified for autonomous diagnosis, and does not provide medical advice.
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          2. Mandatory Clinician-in-the-Loop
        </h2>
        <p>
          All draft SOAP notes, ICD-10 codes, and prescriptions generated by AyuSwar AI are draft proposals requiring review, validation, and digital signature by a licensed medical practitioner.
        </p>
      </article>

      <article style="margin-bottom: 32px;">
        <h2 style="font-size: 22px; color: #0F4C5C; margin-bottom: 12px; font-weight: 800;">
          3. Emergency Services Simulation
        </h2>
        <p>
          All emergency 108 triage modules are educational simulations. In real health emergencies anywhere in India, users must immediately contact emergency services by dialing 112 or 108.
        </p>
      </article>

      <nav aria-label="Navigation" style="background: #FFFFFF; border: 1.5px solid #D0DFE2; border-radius: 16px; padding: 24px; margin-top: 32px;">
        <ul style="line-height: 1.8; padding-left: 20px;">
          <li><a href="/privacy" style="color: #0F4C5C; font-weight: 700;">Privacy Policy</a></li>
          <li><a href="/about" style="color: #0F4C5C; font-weight: 700;">About the Project</a></li>
          <li><a href="/" style="color: #0F4C5C; font-weight: 700;">Return to Homepage</a></li>
        </ul>
      </nav>
    `
  }
};

// Private / Portal routes that should be noindexed
const PRIVATE_ROUTES = [
  '/doctor-portal',
  '/patient-portal',
  '/clinical-console',
  '/login',
  '/auth',
  '/auth/doctor',
  '/auth/patient',
  '/prescription/preview'
];

console.log('Starting AyuSwar AI static route prerendering...');

// 1. Prerender Public Indexable Routes
for (const [routePath, data] of Object.entries(ROUTE_DATA)) {
  const routeRel = routePath.replace(/^\//, '');
  const outDir = path.join(distDir, routeRel);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'index.html');

  let html = templateHtml;

  // Replace Title
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${data.title}</title>`);

  // Replace Meta Description
  html = html.replace(/<meta\s+name="description"\s+content="[^"]*"/i, `<meta name="description" content="${data.description}"`);

  // Replace Canonical URL
  html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"/i, `<link rel="canonical" href="${data.canonical}"`);

  // Replace Open Graph Metadata
  html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"/i, `<meta property="og:title" content="${data.title}"`);
  html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"/i, `<meta property="og:description" content="${data.description}"`);
  html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"/i, `<meta property="og:url" content="${data.canonical}"`);

  // Replace Twitter Metadata
  html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"/i, `<meta name="twitter:title" content="${data.title}"`);
  html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"/i, `<meta name="twitter:description" content="${data.description}"`);

  // Replace prerendered root content
  const rootContent = `
    <div id="root">
      <div class="aeo-crawler-monograph" style="max-width: 960px; margin: 0 auto; padding: 40px 24px; font-family: 'Albert Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FAF8F5; color: #091E26; line-height: 1.65;">
        ${data.content}
        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #D0DFE2; font-size: 13px; color: #486770; text-align: center;">
          AyuSwar AI Collective &copy; 2026. Built by <a href="https://github.com/Samrudh2006" rel="author" style="color: #0F4C5C; font-weight: 700; text-decoration: underline;">Samrudh</a> (Aditya University). Open clinical research prototype. Not a certified medical device. | <a href="/about" style="color: #0F4C5C; font-weight: 700; text-decoration: underline;">About</a> · <a href="/terms" style="color: #0F4C5C; font-weight: 700; text-decoration: underline;">Terms</a> · <a href="/privacy" style="color: #0F4C5C; font-weight: 700; text-decoration: underline;">Privacy</a>
        </footer>
      </div>
    </div>
  `;

  const rootRe = /<div id="root">[\s\S]*?<\/div>\s*<noscript/i;
  const beforeReplace = html;
  html = html.replace(rootRe, `${rootContent}\n    <noscript`);
  if (html === beforeReplace) {
    throw new Error(`Prerender root-content replacement did not match for ${routePath} - refusing silent no-op`);
  }

  // Replace the shared noscript monograph with a compact route-specific fallback
  // (avoids duplicating the entire homepage - h1 included - into every route).
  const noscriptContent = `<noscript>
      <div style="max-width: 960px; margin: 0 auto; padding: 40px 24px; font-family: 'Albert Sans', -apple-system, sans-serif; background: #FAF8F5; color: #091E26; line-height: 1.65;">
        <p style="font-size: 22px; font-weight: 800; color: #081C24; margin: 0 0 10px;">${data.title.split(':')[0]}</p>
        <p style="font-size: 15px; color: #2C4A52; margin: 0 0 14px;">${data.description}</p>
        <p style="font-size: 13px; color: #486770; margin: 0;">AyuSwar AI is a JavaScript application. Enable JavaScript for the full interactive prototype, or visit <a href="/" style="color: #0F4C5C; font-weight: 700;">the homepage</a>.</p>
      </div>
    </noscript>`;
  const noscriptRe = /<noscript>[\s\S]*?<\/noscript>/i;
  const beforeNs = html;
  html = html.replace(noscriptRe, noscriptContent);
  if (html === beforeNs) {
    throw new Error(`Prerender noscript replacement did not match for ${routePath} - refusing silent no-op`);
  }

  fs.writeFileSync(outFile, html, 'utf8');
  console.log(`✓ Prerendered ${routePath} -> dist/${routeRel}/index.html`);
}

// 2. Prerender Private / Portal Routes (with noindex)
for (const privRoute of PRIVATE_ROUTES) {
  const routeRel = privRoute.replace(/^\//, '');
  const outDir = path.join(distDir, routeRel);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'index.html');

  let html = templateHtml;
  // Add noindex tag
  html = html.replace(/<meta\s+name="robots"\s+content="[^"]*"/i, '<meta name="robots" content="noindex, nofollow" />');
  
  // Replace prerendered root content with secure portal placeholder
  const portalRootContent = `
    <div id="root">
      <div style="min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Albert Sans', sans-serif; padding: 24px; text-align: center; color: #0F4C5C;">
        <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 12px;">AyuSwar AI Secure Clinical Workspace</h1>
        <p style="font-size: 14px; color: #486770; max-width: 440px; margin-bottom: 20px;">
          Loading secure clinical portal. If this page does not redirect automatically, please verify your browser JavaScript is enabled.
        </p>
        <a href="/" style="font-size: 13px; font-weight: 700; color: #D4AF37; text-decoration: underline;">Return to Home</a>
      </div>
    </div>
  `;
  html = html.replace(/<div id="root">[\s\S]*?<\/div>\s*<script type="module"/i, `${portalRootContent}\n    <script type="module"`);

  fs.writeFileSync(outFile, html, 'utf8');
  console.log(`✓ Generated private route shell ${privRoute} (noindex) -> dist/${routeRel}/index.html`);
}

// 3. Generate Dedicated 404.html
const out404Path = path.join(distDir, '404.html');
let html404 = templateHtml;
html404 = html404.replace(/<title>[\s\S]*?<\/title>/i, '<title>Page Not Found (404) : AyuSwar AI</title>');
html404 = html404.replace(/<meta\s+name="robots"\s+content="[^"]*"/i, '<meta name="robots" content="noindex, nofollow" />');

const notFoundRootContent = `
  <div id="root">
    <div style="min-height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'Albert Sans', -apple-system, BlinkMacSystemFont, sans-serif; padding: 40px 24px; text-align: center; color: #081C24; background: #FAF8F5;">
      <div style="font-size: 13px; font-weight: 800; color: #D64550; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
        Error 404 · Route Not Found
      </div>
      <h1 style="font-size: 34px; font-weight: 850; color: #081C24; margin-bottom: 12px; letter-spacing: -0.5px;">
        Clinical Module Not Found
      </h1>
      <p style="font-size: 16px; color: #486770; max-width: 520px; line-height: 1.6; margin-bottom: 28px;">
        The requested URL does not match any public clinical module, documentation page, or portal in the AyuSwar AI health network.
      </p>
      <div style="display: flex; gap: 14px; flex-wrap: wrap; justify-content: center;">
        <a href="/" style="display: inline-block; padding: 12px 24px; background: #0F4C5C; color: #FFFFFF; font-weight: 750; font-size: 14px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(15, 76, 92, 0.25);">
          Return to Homepage
        </a>
        <a href="/solutions" style="display: inline-block; padding: 12px 24px; background: #FFFFFF; color: #0F4C5C; font-weight: 750; font-size: 14px; border: 1.5px solid #0F4C5C; border-radius: 12px; text-decoration: none;">
          Explore Solutions
        </a>
        <a href="/technology" style="display: inline-block; padding: 12px 24px; background: #FFFFFF; color: #0F4C5C; font-weight: 750; font-size: 14px; border: 1.5px solid #0F4C5C; border-radius: 12px; text-decoration: none;">
          Technical Blueprint
        </a>
      </div>
    </div>
  </div>
`;
html404 = html404.replace(/<div id="root">[\s\S]*?<\/div>\s*<script type="module"/i, `${notFoundRootContent}\n    <script type="module"`);
fs.writeFileSync(out404Path, html404, 'utf8');
console.log('✓ Generated dist/404.html (with real HTTP 404 response payload)');

console.log('Prerendering completed successfully!');

