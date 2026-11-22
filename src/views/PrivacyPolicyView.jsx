import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Server, FileText, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyView() {
  return (
    <div style={{ padding: '40px 24px', maxWidth: '860px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0F4C5C', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
          <ArrowLeft size={16} />
          <span>Home</span>
        </Link>
        <span style={{ color: '#4A5A50' }}>/</span>
        <span style={{ color: '#081C24', fontSize: '13px', fontWeight: 700 }}>Privacy Policy</span>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#081C24', margin: 0 }}>
            Privacy & Ephemeral Audio Policy
          </h1>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            background: '#DCFCE7',
            color: '#15803D',
            padding: '4px 10px',
            borderRadius: '12px',
            border: '1px solid #BBF7D0'
          }}>
            Prototype privacy notes
          </span>
        </div>
        <p style={{ fontSize: '14px', color: '#37525C', margin: 0 }}>
          Last updated: October 2026 • AyuSwar AI Engineering & Open Clinical Research Consortium
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: '#2C4A52', lineHeight: 1.7, fontSize: '14.5px' }}>
        {/* Core Principles */}
        <div style={{ background: '#FAF8F5', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#081C24', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#0F4C5C" />
            1. Executive Privacy Principles for Bharat
          </h2>
          <p style={{ margin: 0 }}>
            AyuSwar AI is an experimental open-source clinical voice prototype. This page describes the current demo behavior and privacy goals. It does not certify DPDP Act 2023, ABDM, DISHA, or any other legal compliance.
          </p>
        </div>

        {/* Real-time Web Audio */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#081C24', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <EyeOff size={20} color="#0F4C5C" />
            2. Real-Time Client-Side Audio Signal Processing
          </h2>
          <p>
            When utilizing the <strong>Acoustic Biomarker Lab</strong> or microphone input:
          </p>
          <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
            <li><strong>Feature-scoped processing:</strong> Acoustic Lab signal calculations run in the browser. Speech-to-text and text-to-speech features may send the audio/text needed for that request to the configured provider.</li>
            <li><strong>Buffer handling:</strong> Acoustic Lab frames are intended to be transient. Export, download, share, or provider-processing actions are separate user-visible paths.</li>
          </ul>
        </div>

        {/* Serverless Speech Inference */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#081C24', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={20} color="#0F4C5C" />
            3. Serverless Speech Transcription & Secret Isolation
          </h2>
          <p>
            When speech-to-text (STT) or text-to-speech (TTS) services are called:
          </p>
          <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
            <li><strong>Server-side credential handling:</strong> The reference proxy is designed to keep provider tokens in server environment variables. This local audit did not verify a production deployment.</li>
            <li><strong>Payload scope:</strong> Features send the text or audio needed for the requested action. FHIR-shaped exports are local research drafts, not ABDM submissions.</li>
          </ul>
        </div>

        {/* Synthetic Safe Data */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#081C24', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={20} color="#0F4C5C" />
            4. Synthetic Demo Data & Non-Diagnostic Status
          </h2>
          <p>
            The public demo uses synthetic patient profiles, simulated vitals, and sample formulary data inspired by public PMBJP references; live formulary verification is not claimed. It is intended to contain no real-world Protected Health Information (PHI). AyuSwar AI is an engineering research prototype and does not function as an autonomous medical diagnostic device.
          </p>
        </div>

        {/* Contact Information */}
        <div style={{ borderTop: '1px solid #D0DFE2', paddingTop: '20px', fontSize: '13px', color: '#37525C' }}>
          For privacy or security research inquiries, visit the open repository at{' '}
          <a href="https://github.com/Samrudh2006/AyuSwar-Mobile" target="_blank" rel="noopener noreferrer" style={{ color: '#0F4C5C', fontWeight: 700 }}>
            github.com/Samrudh2006/AyuSwar-Mobile
          </a>.
        </div>
      </div>
    </div>
  );
}
