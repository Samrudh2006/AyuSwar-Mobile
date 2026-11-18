import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Code2, 
  ExternalLink, 
  ShieldCheck, 
  Heart, 
  Cpu, 
  Building2,
  Stethoscope,
  Terminal,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function AboutView() {
  const { t } = useApp();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.title = 'About the Creator & Architect : AyuSwar AI';
  }, []);

  return (
    <div className="about-view-container" style={{ padding: '36px 24px 64px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0F4C5C', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
          <ArrowLeft size={16} />
          <span>Home</span>
        </Link>
        <span style={{ color: '#94A3B8' }}>/</span>
        <Link to="/about" style={{ color: '#698892', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>About</Link>
        <span style={{ color: '#94A3B8' }}>/</span>
        <span style={{ color: '#081C24', fontSize: '13px', fontWeight: 700 }}>Lead Architect & Creator</span>
      </div>

      {/* Header */}
      <header style={{ borderBottom: '2px solid #D0DFE2', paddingBottom: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(15, 76, 92, 0.08)', color: '#0F4C5C', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, marginBottom: '12px' }}>
          <Building2 size={14} />
          <span>ABOUT THE INITIATIVE · LEAD ARCHITECT</span>
        </div>
        <h1 style={{ fontSize: '34px', lineHeight: 1.2, color: '#081C24', marginBottom: '12px', fontWeight: 850, letterSpacing: '-0.4px' }}>
          About AyuSwar AI · Lead Architect & Creator
        </h1>
        <p style={{ fontSize: '16.5px', color: '#2C4A52', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
          A sovereign, open-source Indic clinical speech assistant developed for the Great Indian AI Internship Challenge 2026 by Gnani.ai.
        </p>
      </header>

      {/* Lead Systems Architect Card */}
      <section style={{ 
        background: '#FFFFFF', 
        borderRadius: '16px', 
        border: '1.5px solid #D0DFE2', 
        padding: '28px', 
        marginBottom: '32px',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '22px', flexWrap: 'wrap' }}>
          {/* Authentic Creator Portrait */}
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '22px',
            overflow: 'hidden',
            border: '2.5px solid #0F4C5C',
            boxShadow: '0 8px 22px rgba(15, 76, 92, 0.24)',
            flexShrink: 0,
            background: '#0F4C5C'
          }}>
            <img 
              src="/assets/satya_samrudh_avatar.jpg" 
              alt="Satya Samrudh Dwivedula — Lead Systems Architect & Creator"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://github.com/Samrudh2006.png';
              }}
            />
          </div>

          <div style={{ flex: '1 1 300px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>
              Lead Systems Architect & Creator
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 850, color: '#081C24', margin: '0 0 8px 0' }}>
              Satya Samrudh Dwivedula
            </h2>
            <div style={{ fontSize: '14px', color: '#698892', fontWeight: 600, marginBottom: '16px' }}>
              B.Tech Computer Science & Engineering Undergraduate · <strong>Aditya University</strong>, Andhra Pradesh
            </div>
            <p style={{ fontSize: '14.5px', color: '#334155', lineHeight: 1.6, margin: '0 0 18px 0' }}>
              AyuSwar AI was conceptualized, architected, and built solo by Satya Samrudh Dwivedula to address clinical documentation burnout and linguistic disparities in Indian healthcare. Grounded in rural Primary Health Center workflows across Andhra Pradesh and Telangana, the system restores the sacred human doctor-patient connection by making healthcare software listen and speak in the mother tongue of citizens.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a 
                href="https://github.com/Samrudh2006" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: '#091E26',
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(9, 30, 38, 0.2)',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(9, 30, 38, 0.3)';
                  e.currentTarget.style.background = '#0F4C5C';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(9, 30, 38, 0.2)';
                  e.currentTarget.style.background = '#091E26';
                }}
              >
                <Code2 size={16} />
                <span>GitHub @Samrudh2006</span>
                <ExternalLink size={13} />
              </a>

              <a 
                href="https://github.com/Samrudh2006/Ayuswar-Ai" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '2px solid #0F4C5C',
                  background: '#FAF8F5',
                  color: '#0F4C5C',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(15, 76, 92, 0.08)',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 76, 92, 0.18)';
                  e.currentTarget.style.background = '#E8F7F5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(15, 76, 92, 0.08)';
                  e.currentTarget.style.background = '#FAF8F5';
                }}
              >
                <Terminal size={16} />
                <span>Project Repository</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* The Mission: Restoring the Human Doctor-Patient Connection */}
      <section style={{ 
        background: '#FAF8F5', 
        borderRadius: '16px', 
        border: '1px solid #D0DFE2', 
        padding: '24px', 
        marginBottom: '28px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <Stethoscope size={22} color="#0F4C5C" />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#081C24', margin: 0 }}>
            The Problem AyuSwar Solves for Bharat
          </h2>
        </div>
        <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.6, margin: '0 0 12px 0' }}>
          In rural Primary Health Centers across India, a single government doctor routinely attends to 80 to 120 patients during a four-hour morning shift. Mandating typed electronic medical documentation forces clinicians to look into a computer screen rather than the patient, consuming up to 42% of consultation time.
        </p>
        <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
          AyuSwar AI operates in the background: listening to bilingual, code-mixed conversations in Telugu, Hindi, Tamil, Kannada, Marathi, and English, drafting structured SOAP notes, and generating color-coded spoken prescriptions directly for patients on WhatsApp.
        </p>
      </section>

      {/* Challenge Context & Academic Governance */}
      <section style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', 
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #D0DFE2', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D97706', fontWeight: 800, fontSize: '14px', marginBottom: '8px' }}>
            <Award size={18} />
            <span>Gnani.ai Challenge Context</span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
            Engineered for the <strong>Great Indian AI Internship Challenge 2026</strong> organized by Gnani.ai to push the state of sovereign Indic speech recognition (Prisma v3), voice synthesis (Timbre v2.5/v3), and clinical reasoning (Evon 30B).
          </p>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '14px', border: '1px solid #D0DFE2', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 800, fontSize: '14px', marginBottom: '8px' }}>
            <ShieldCheck size={18} />
            <span>Ethical Prototype Safeguards</span>
          </div>
          <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
            AyuSwar AI is an engineering research prototype evaluated on synthetic fixtures. It is not an approved medical device and does not make independent clinical determinations. In any genuine medical emergency, citizens must dial <strong>108</strong> or <strong>112</strong>.
          </p>
        </div>
      </section>

      {/* Footer navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '12px' }}>
        <Link to="/technology" style={{ color: '#0F4C5C', fontWeight: 700, fontSize: '13.5px', textDecoration: 'none' }}>
          &larr; View Technical Architecture Blueprint (/technology)
        </Link>
        <Link to="/solutions/opd_ambient_scribe" style={{ color: '#0F4C5C', fontWeight: 700, fontSize: '13.5px', textDecoration: 'none' }}>
          Explore OPD Ambient Scribe Solution &rarr;
        </Link>
      </div>
    </div>
  );
}
