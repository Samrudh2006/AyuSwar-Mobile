import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Activity, 
  Mic, 
  Volume2, 
  Shield, 
  FileText, 
  Database, 
  Layers, 
  Eye, 
  PhoneCall, 
  Play, 
  BarChart2, 
  Heart, 
  Building2, 
  Clock, 
  Download,
  Share2,
  ExternalLink,
  Award,
  Pause,
  RotateCcw,
  Sliders,
  VolumeX,
  Radio,
  Zap,
  User,
  Stethoscope
} from 'lucide-react';
import SolutionUiTourModal from './SolutionUiTourModal';

/**
 * OpdDualSpeakerStudio
 * Interactive sample dual-speaker acoustic studio replacing static presentation text cards.
 * Features:
 * - Sample dual-channel dialogue playback: Demo clinician (Cyan) vs Patient Lakshmi (Emerald)
 * - Color-coded sample speaker badges that illuminate during playback
 * - Interactive DSP filter toggle using a simulated rural OPD noise profile
 * - Sample note draft panel dynamically constructing a SOAP-shaped draft
 * - Direct action button to open the sample clinical console
 */
function OpdDualSpeakerStudio({ onLaunchInteractiveModal }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [filterMode, setFilterMode] = useState('kalman'); // 'kalman' | 'raw'
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const DIALOGUE = [
    {
      id: 0,
      speaker: 'doctor',
      name: 'Dr. Demo Clinician (synthetic)',
      role: 'Sample Clinician Voice',
      badgeColor: '#0F4C5C',
 avatar: 'Dr',
      teluguText: 'లక్ష్మి గారు, నమస్కారం. ఎలా ఉన్నారు? ఏమి ఇబ్బందిగా ఉంది మీకు?',
      englishText: 'Lakshmi garu, namaskaram. How are you? What trouble brings you today?',
      timestamp: '00:04',
      section: 'Subjective Initiation'
    },
    {
      id: 1,
      speaker: 'patient',
      name: 'Lakshmi Devi',
      role: 'Sample Patient Voice',
      badgeColor: '#10B981',
 avatar: 'Pt',
      teluguText: 'నమస్కారం డాక్టర్ అమ్మ. మూడు రోజుల నుంచి గుండెలో మంటగా ఉంది, ఆయాసంగా ఉంటే రాత్రి నిద్ర పట్టట్లేదు. వేలు లో ఆత్రంగా ఉంది.',
      englishText: 'Namaskaram doctor. For 3 days severe burning in chest and breathlessness so I cannot sleep at night. Restless inside.',
      timestamp: '00:18',
      section: 'Chief Complaint & History'
    },
    {
      id: 2,
      speaker: 'doctor',
      name: 'Dr. Demo Clinician (synthetic)',
      role: 'Sample Clinician Voice',
      badgeColor: '#0F4C5C',
 avatar: 'Dr',
      teluguText: 'సరే అమ్మ. మీ ఛాతిలో wheezing సౌండ్ వినిపిస్తుంది. బీపీ 138/88 ఉంది. Salbutamol inhaler మరియు Pantoprazole రాస్తున్నాను.',
      englishText: 'Okay amma. I can hear expiratory wheezing in your chest. Blood pressure is 138/88. Prescribing Salbutamol inhaler and Pantoprazole.',
      timestamp: '00:32',
      section: 'Objective Vitals & Assessment'
    },
    {
      id: 3,
      speaker: 'patient',
      name: 'Lakshmi Devi',
      role: 'Sample Patient Voice',
      badgeColor: '#10B981',
 avatar: 'Pt',
      teluguText: 'ఈ మందులు ఎప్పుడు వేసుకోవాలి డాక్టర్ అమ్మ? మాకు చదవడం రాదు.',
      englishText: 'When should I take these medicines, doctor? We do not know how to read.',
      timestamp: '00:46',
      section: 'Health Literacy Alert'
    },
    {
      id: 4,
      speaker: 'doctor',
      name: 'Dr. Demo Clinician (synthetic)',
      role: 'Sample Clinician Voice',
      badgeColor: '#0F4C5C',
 avatar: 'Dr',
      teluguText: 'కంగారుపడద్దు లక్ష్మి గారు. AyuSwar audio-rx మీకు తెలుగులో ఫోన్ లో చెప్తుంది. పొద్దున్న ఎర్రటి మాత్ర, రాత్రి ఆకుపచ్చ మాత్ర వేసుకోండి.',
      englishText: 'Do not worry Lakshmi garu. AyuSwar will speak the instructions in Telugu on WhatsApp. Red pill morning, green pill night.',
      timestamp: '00:58',
      section: 'Plan & Spoken Audio-Rx'
    }
  ];

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveStep((prev) => {
          if (prev >= DIALOGUE.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 4000 / playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, DIALOGUE.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Studio Header Bar */}
      <div className="opd-dual-studio-header-card" style={{
        background: '#08232C',
        color: '#ffffff',
        borderRadius: '24px',
        padding: '24px 28px',
        border: '1px solid #2C4A52',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(0, 0, 0, 0.16)',
              border: '1.5px solid #0F4C5C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D4AF37'
            }}>
              <Radio size={22} className={isPlaying ? 'animate-pulse' : ''} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#D4AF37' }}>
                  Synthetic Dialogue Telemetry
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: isPlaying ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                  color: isPlaying ? '#34D399' : '#94A3B8',
                  border: isPlaying ? '1px solid #059669' : '1px solid #486770'
                }}>
                  {isPlaying ? '● PLAYING SAMPLE' : 'PAUSED'}
                </span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#F8FAFC', margin: '2px 0 0 0' }}>
                Sample Dual-Speaker Acoustic Studio
              </h2>
            </div>
          </div>

          {/* Quick Launch Console Button */}
          <button
            onClick={() => onLaunchInteractiveModal && onLaunchInteractiveModal('scribe')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0F4C5C',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 750,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.16)',
              transition: 'all 0.2s ease'
            }}
          >
            <Zap size={16} />
 <span> Open Sample Doctor Console</span>
          </button>
        </div>

        {/* Sample DSP Noise Filter Toggle */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          borderRadius: '16px',
          padding: '14px 18px',
          border: '1px solid #2C4A52',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={18} color="#0F4C5C" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#D0DFE2' }}>
              DSP Acoustic Filter:
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterMode('raw')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                border: filterMode === 'raw' ? '1.5px solid #EF4444' : '1px solid #486770',
                background: filterMode === 'raw' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                color: filterMode === 'raw' ? '#FCA5A5' : '#94A3B8',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
 ⚠ Raw Rural OPD (72 dB Fan Hum + Corridor Noise)
            </button>
            <button
              onClick={() => setFilterMode('kalman')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                border: filterMode === 'kalman' ? '1.5px solid #0F4C5C' : '1px solid #486770',
                background: filterMode === 'kalman' ? 'rgba(0, 0, 0, 0.16)' : 'transparent',
                color: filterMode === 'kalman' ? '#0F4C5C' : '#94A3B8',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
 AyuSwar Adaptive Kalman Filter (De-hummed 50/120 Hz, +28 dB SNR)
            </button>
          </div>
        </div>

        {/* Filter Metrics Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginTop: '14px'
        }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '10px 14px', borderRadius: '10px', border: '1px solid #2C4A52' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Signal-to-Noise Profile (SIMULATION)</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: filterMode === 'kalman' ? '#34D399' : '#F87171' }}>
              {filterMode === 'kalman' ? 'Noise-Subtracted Voice' : 'Raw Ambient Voice'}
            </div>
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '10px 14px', borderRadius: '10px', border: '1px solid #2C4A52' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Diarization Separation (SIMULATION)</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: filterMode === 'kalman' ? '#0F4C5C' : '#FBBF24' }}>
              {filterMode === 'kalman' ? 'Dual Speaker Channel' : 'Overlap Detection'}
            </div>
          </div>
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '10px 14px', borderRadius: '10px', border: '1px solid #2C4A52' }}>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Audio Pipeline (SIMULATION)</div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#A78BFA' }}>
              Client WebAudio Pipeline (unmeasured)
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio Two-Column Layout */}
      <div className="opd-dual-studio-workspace" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
        {/* Left Column: Interactive Dialogue Timeline */}
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1.5px solid #D0DFE2',
          padding: 'clamp(14px, 3.5vw, 24px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          minWidth: 0,
          boxSizing: 'border-box'
        }}>
          {/* Timeline Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isPlaying ? '#EF4444' : '#0F4C5C',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 750,
                  cursor: 'pointer'
                }}
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                <span>{isPlaying ? 'Pause Audio' : 'Play Dual-Channel Audio'}</span>
              </button>
              <button
                onClick={() => { setActiveStep(0); setIsPlaying(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#FAF8F5',
                  color: '#486770',
                  border: '1px solid #D0DFE2',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 650,
                  cursor: 'pointer'
                }}
                title="Reset Dialogue"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#698892', fontWeight: 600 }}>Speed:</span>
              {[1, 1.5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: playbackSpeed === speed ? '1.5px solid #0F4C5C' : '1px solid #D0DFE2',
                    background: playbackSpeed === speed ? 'rgba(0, 0, 0, 0.07)' : '#ffffff',
                    color: playbackSpeed === speed ? '#0F4C5C' : '#698892',
                    cursor: 'pointer'
                  }}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Dialogue Turns */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {DIALOGUE.map((item, idx) => {
              const isCurrent = activeStep === idx;
              const isDoctor = item.speaker === 'doctor';
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveStep(idx)}
                  style={{
                    padding: '16px 18px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    background: isCurrent 
                      ? (isDoctor ? '#F0FDFA' : '#ECFDF5') 
                      : (idx < activeStep ? '#F8FAFC' : '#ffffff'),
                    border: isCurrent
                      ? (isDoctor ? '2px solid #0F4C5C' : '2px solid #10B981')
                      : '1.5px solid #D0DFE2',
                    boxShadow: isCurrent 
                      ? (isDoctor ? '0 6px 18px rgba(0, 0, 0, 0.13)' : '0 6px 18px rgba(16,185,129,0.18)')
                      : 'none',
                    opacity: idx > activeStep ? 0.6 : 1
                  }}
                >
                  {/* Speaker Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{item.avatar}</span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: isDoctor ? '#0F4C5C' : '#059669',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: isDoctor ? 'rgba(0, 0, 0, 0.07)' : 'rgba(16,185,129,0.1)'
                      }}>
                        {item.name}
                      </span>
                      <span style={{ fontSize: '11px', color: '#698892' }}>{item.role}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isCurrent && isPlaying && (
                        <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '12px' }}>
                          <span style={{ width: '2px', height: '100%', background: isDoctor ? '#0F4C5C' : '#10B981', borderRadius: '1px' }} className="animate-pulse" />
                          <span style={{ width: '2px', height: '60%', background: isDoctor ? '#0F4C5C' : '#10B981', borderRadius: '1px' }} className="animate-pulse" />
                          <span style={{ width: '2px', height: '80%', background: isDoctor ? '#0F4C5C' : '#10B981', borderRadius: '1px' }} className="animate-pulse" />
                        </div>
                      )}
                      <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>{item.timestamp}</span>
                    </div>
                  </div>

                  {/* Spoken Vernacular (Telugu) */}
                  <p style={{
                    fontSize: '14.5px',
                    fontWeight: 700,
                    color: '#091E26',
                    lineHeight: 1.5,
                    margin: '0 0 6px 0',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    {item.teluguText}
                  </p>

                  {/* English Clinical Translation */}
                  <p style={{
                    fontSize: '12.5px',
                    color: '#486770',
                    fontStyle: 'italic',
                    margin: 0,
                    lineHeight: 1.45
                  }}>
                    "{item.englishText}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Sample SOAP Note Draft */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          border: '1.5px solid #D0DFE2',
          padding: 'clamp(14px, 3.5vw, 24px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          minWidth: 0,
          boxSizing: 'border-box'
        }}>
          {/* Note Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid #D0DFE2', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#0F4C5C" />
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#0F4C5C' }}>
                  HL7 FHIR R4 Draft Scribe
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#081C24' }}>
                  Sample Structured SOAP Draft
                </div>
              </div>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '8px',
              background: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #FDE68A'
            }}>
              Draft (Review Pending)
            </span>
          </div>

          {/* SOAP Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {/* Subjective */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: activeStep >= 1 ? '#F0FDFA' : '#F1F5F9',
              border: activeStep >= 1 ? '1.5px solid #0F4C5C' : '1px dashed #D0DFE2',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: activeStep >= 1 ? '#0F4C5C' : '#698892', marginBottom: '4px' }}>
                SUBJECTIVE (S) — Vernacular Symptom Resolution
              </div>
              {activeStep >= 1 ? (
                <div style={{ fontSize: '12.5px', color: '#1E293B', lineHeight: 1.45 }}>
                  <strong>Chief Complaint:</strong> 3-day severe epigastric burning (<em>"gunde lo manta"</em>) and nocturnal dyspnea (<em>"aayasam"</em>) causing sleep disruption and restlessness.
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                  Waiting for sample dialogue playback...
                </div>
              )}
            </div>

            {/* Objective */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: activeStep >= 2 ? '#F0FDFA' : '#F1F5F9',
              border: activeStep >= 2 ? '1.5px solid #0F4C5C' : '1px dashed #D0DFE2',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: activeStep >= 2 ? '#0F4C5C' : '#698892', marginBottom: '4px' }}>
                OBJECTIVE (O) — Sample Vitals From Dialogue
              </div>
              {activeStep >= 2 ? (
                <div style={{ fontSize: '12.5px', color: '#1E293B', lineHeight: 1.45 }}>
                  <div><strong>Vitals:</strong> Blood Pressure 138/88 mmHg. Pulse: 84 bpm.</div>
                  <div><strong>Auscultation:</strong> Bilateral expiratory wheezing noted on chest exam.</div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                  Awaiting sample examination dialogue...
                </div>
              )}
            </div>

            {/* Assessment */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: activeStep >= 2 ? '#EFF6FF' : '#F1F5F9',
              border: activeStep >= 2 ? '1.5px solid #3B82F6' : '1px dashed #D0DFE2',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: activeStep >= 2 ? '#2563EB' : '#698892', marginBottom: '4px' }}>
                ASSESSMENT (A) — Sample ICD-10 Reference Codes
              </div>
              {activeStep >= 2 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ padding: '2px 6px', background: '#DBEAFE', color: '#1E40AF', borderRadius: '4px', fontWeight: 750 }}>
                      ICD-10 R06.2
                    </span>
                    <span style={{ color: '#1E293B', fontWeight: 650 }}>Wheezing / Bronchospasm</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ padding: '2px 6px', background: '#DBEAFE', color: '#1E40AF', borderRadius: '4px', fontWeight: 750 }}>
                      ICD-10 K21.9
                    </span>
                    <span style={{ color: '#1E293B', fontWeight: 650 }}>Gastro-esophageal reflux disease (GERD)</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                  Pending sample assessment draft...
                </div>
              )}
            </div>

            {/* Plan & Prescription */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: activeStep >= 4 ? '#ECFDF5' : '#F1F5F9',
              border: activeStep >= 4 ? '1.5px solid #10B981' : '1px dashed #D0DFE2',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '11.5px', fontWeight: 800, color: activeStep >= 4 ? '#059669' : '#698892', marginBottom: '4px' }}>
                PLAN (P) — Attending e-Rx & Spoken Audio-Rx
              </div>
              {activeStep >= 4 ? (
                <div style={{ fontSize: '12.5px', color: '#1E293B', lineHeight: 1.45 }}>
                  <div>1. <strong>Tab Pantoprazole 40mg</strong> — 1 tab OD (Morning AC) x 14 days</div>
                  <div>2. <strong>Salbutamol Inhaler 100mcg</strong> — 2 puffs PRN / SOS</div>
                  <div style={{ marginTop: '4px', color: '#059669', fontWeight: 700 }}>
 Spoken Telugu Audio-Rx prepared as a local share preview; delivery is not verified.
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
                  Awaiting prescription finalization...
                </div>
              )}
            </div>
          </div>

          {/* Bottom Safeguard Notice */}
          <div style={{
            fontSize: '11.5px',
            color: '#698892',
            background: '#FAF8F5',
            padding: '10px 12px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Shield size={16} color="#0F4C5C" />
            <span><strong>Doctor-in-the-Loop Safeguard:</strong> Attending reviewer acknowledgement is required before local export; no ABDM record is committed.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * DetailedModuleView Component
 * 
 * Provides deep-dive, multi-page standalone content for every feature and resource
 * in AyuSwar AI. Includes interactive charts, clinical metrics, architecture blueprints,
 * and next/previous section pagination so users never see sparse or generic AI text.
 */
export default function DetailedModuleView({ 
  moduleId: propModuleId, 
  onBackToHome, 
  onNavigateModule,
  onLaunchInteractiveModal 
}) {
  const navigate = useNavigate();
  const { moduleId: routeModuleId } = useParams();
  const effectiveModuleId = routeModuleId || propModuleId || 'opd_ambient_scribe';

  const [currentPage, setCurrentPage] = useState(1);
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);

  // Scroll to top when module or page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentPage(1);
  }, [effectiveModuleId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Comprehensive Clinical Modules Database
  const modulesData = {
    // -------------------------------------------------------------
    // SOLUTIONS
    // -------------------------------------------------------------
    opd_ambient_scribe: {
      id: 'opd_ambient_scribe',
      category: 'Solutions',
      badge: 'Core Prototype',
      badgeColor: '#0F4C5C',
      title: 'OPD Ambient Clinical Scribe',
      tagline: 'Dual-speaker consultation drafting prototype with browser and simulated audio paths',
      icon: Mic,
      totalPages: 3,
      interactiveActionLabel: 'Open Sample OPD Scribe Demo',
      interactiveModalKey: 'scribe',
      pages: [
        {
          pageTitle: 'Interactive OPD Ambient Acoustic Studio',
          subtitle: 'Prototype dual-speaker drafting with browser or simulated audio paths and DSP review.',
          content: (
            <OpdDualSpeakerStudio onLaunchInteractiveModal={onLaunchInteractiveModal} />
          )
        },
        {
          pageTitle: 'Code-Mixed Indic ASR & Semantic Metaphor Resolver',
          subtitle: 'How Telugu, Hindi, and colloquial idioms become draft ICD-10 mappings for review.',
          content: (
            <div className="space-y-8">
              <div className="p-3 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 sm:space-y-6 w-full max-w-full box-border overflow-hidden">
                <h3 className="text-xl font-bold text-slate-900">Sample Vernacular Metaphor Mapping</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Patients may describe symptoms with local metaphors rather than textbook terms. The prototype demonstrates a small bundled mapping from sample phrases to clinical concepts for reviewer inspection.
                </p>

                <div className="overflow-x-auto w-full -mx-1 sm:mx-0">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                      <tr>
                        <th className="p-3 border-b">Patient Spoken Dialect</th>
                        <th className="p-3 border-b">Literal Translation (Western Failure)</th>
                        <th className="p-3 border-b">AyuSwar Indic Semantic Resolution</th>
                        <th className="p-3 border-b">Sample ICD-10 Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="p-3 font-semibold text-teal-800">గుండెల్లో బండ పెట్టినట్లు బరువు (Telugu)</td>
                        <td className="p-3 text-slate-400">"Heavy rock placed on chest"</td>
                        <td className="p-3 font-bold text-rose-600">Acute Retrosternal Oppressive Angina</td>
                        <td className="p-3 font-mono font-bold">I20.9 (Angina Pectoris)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-teal-800">పసలీ చల్నా / पसली चलना (Hindi)</td>
                        <td className="p-3 text-slate-400">"Ribs are walking"</td>
                        <td className="p-3 font-bold text-rose-600">Pediatric Subcostal Retraction / Tachypnea</td>
                        <td className="p-3 font-mono font-bold">R06.89 (Dyspnea Respiratory Strain)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-teal-800">ఉడుకుబోస్తోంది మరియు దడ (Telugu)</td>
                        <td className="p-3 text-slate-400">"Boiling inside and tremor"</td>
                        <td className="p-3 font-bold text-rose-600">Cold Diaphoresis & Tachyarrhythmia</td>
                        <td className="p-3 font-mono font-bold">R00.2 + R61.0 (Palpitations + Sweats)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-teal-800">छाती में आग जैसे जल रहा है (Hinglish)</td>
                        <td className="p-3 text-slate-400">"Fire burning inside chest"</td>
                        <td className="p-3 font-bold text-rose-600">Pyrosis / Gastroesophageal Reflux (GERD)</td>
                        <td className="p-3 font-mono font-bold">K21.9 (GERD without Esophagitis)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-teal-50 border border-teal-200">
 <div className="text-base font-bold text-teal-950 mb-2">Indic Speech Recognition Architecture</div>
                  <p className="text-xs text-teal-900 leading-relaxed">
                    Planned Gnani Indic Voice Services (Prisma v3 ASR) integration. Live recognition quality and dialect coverage are not verified in this build.
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200">
 <div className="text-base font-bold text-blue-950 mb-2">Dual-Column Clinical SOAP Drafts</div>
                  <p className="text-xs text-blue-900 leading-relaxed">
                    Structures sample conversations into Subjective, Objective, Assessment, and Plan sections for clinician review.
                  </p>
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'FHIR Research Draft & Physician Review',
          subtitle: 'Human review with a local demo acknowledgement; no cryptographic signing.',
          content: (
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-4">
                <h3 className="text-xl font-bold text-teal-300">FHIR-format Research Draft</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  AyuSwar AI converts a reviewed consultation draft into a local HL7 FHIR R4-shaped JSON payload for research inspection. It is editable, non-immutable, and not registry validated.
                </p>
                <div className="p-4 rounded-2xl bg-slate-950 font-mono text-[11px] text-teal-300 overflow-x-auto border border-slate-800">
                  <pre>{`{
  "resourceType": "Bundle",
  "type": "document",
  "entry": [
    { "resource": { "resourceType": "Patient", "identifier": [{ "system": "urn:ayuswar:synthetic-abha", "value": "00-0000-0000-0000" }] } }
    { "resource": { "resourceType": "Condition", "code": { "coding": [{ "system": "http://hl7.org/fhir/sid/icd-10", "code": "J45.901", "display": "Bronchial Asthma (Acute)" }] } } },
    { "resource": { "resourceType": "MedicationRequest", "status": "draft", "intent": "proposal", "medicationCodeableConcept": { "text": "Synthetic demo medication only" } } }
  ]
}`}</pre>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-4">
 <div className="p-2 rounded-xl bg-emerald-500 text-white text-lg"></div>
                <div>
                  <div className="font-bold text-sm">Local Reviewer Acknowledgement</div>
                  <div className="text-xs text-emerald-800 mt-1">
                    The attending reviewer can inspect and acknowledge the draft locally. No ABDM hash, legal signature, or registry verification is generated.
                  </div>
                </div>
              </div>
            </div>
          )
        }
      ]
    },

    // -------------------------------------------------------------
    vernacular_audio_rx: {
      id: 'vernacular_audio_rx',
      category: 'Solutions',
      badge: 'Breakthrough Innovation',
      badgeColor: '#10B981',
      title: 'Vernacular Audio-Rx & Karaoke Visual Guide',
      tagline: 'Spoken instructions with synchronized word highlighting for low-literacy contexts',
      icon: Volume2,
      totalPages: 3,
      interactiveActionLabel: 'Open Vernacular Audio-Rx Studio',
      interactiveModalKey: 'audiorx',
      pages: [
        {
          pageTitle: 'The 600-Million Illiteracy Crisis in Indian Healthcare',
          subtitle: 'Why written paper prescriptions cause adverse drug events across rural Bharat.',
          content: (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-xl font-black text-rose-600 mb-2">Prescription Barriers</div>
                  <div className="text-sm font-bold text-slate-900">Medication Misunderstanding</div>
                  <div className="text-xs text-slate-500 mt-1">Rural patients routinely confuse morning vs night medications or struggle with complex inhalation instructions.</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-xl font-black text-amber-700 mb-2">Language Diversity</div>
                  <div className="text-sm font-bold text-slate-900">Vernacular Literacy Gap</div>
                  <div className="text-xs text-slate-500 mt-1">Millions of patients in Bharat navigate medical care in vernacular languages rather than English prescription labels.</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-xl font-black text-emerald-600 mb-2">Audio-Rx Prototype</div>
                  <div className="text-sm font-bold text-slate-900">Spoken Adherence Support</div>
                  <div className="text-xs text-slate-500 mt-1">Spoken vernacular voice notes are designed to make sample dosage instructions easier to review; comprehension and adherence are not measured.</div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-6">
                <h3 className="text-xl font-bold text-emerald-400">The AyuSwar Innovation: Spoken Audio-Prescription with Karaoke Sync</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  The prototype can prepare a synthetic spoken instruction note with word-by-word karaoke highlighting. Gnani TTS may be used when the configured service is available; otherwise the browser speech fallback is used honestly.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-teal-950/60 border border-teal-800">
                    <div className="text-xs font-bold text-teal-400">Teal Blue Capsule</div>
                    <div className="text-[11px] text-slate-300 mt-1">Morning After Breakfast (ఉదయం టిఫిన్ తర్వాత)</div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-800">
                    <div className="text-xs font-bold text-amber-400">Amber Yellow Tablet</div>
                    <div className="text-[11px] text-slate-300 mt-1">Afternoon Lunch (మధ్యాహ్నం భోజనం తర్వాత)</div>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800">
                    <div className="text-xs font-bold text-rose-400">Crimson Red Tablet</div>
                    <div className="text-[11px] text-slate-300 mt-1">Night After Dinner (రాత్రి నిద్రపోయే ముందు)</div>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-950/60 border border-orange-800">
                    <div className="text-xs font-bold text-orange-400">Terracotta Inhaler</div>
                    <div className="text-[11px] text-slate-300 mt-1">2 Puffs Deep Inhalation (పీల్చి వదలండి)</div>
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Speech Synthesis & Dialect Guidance (Prototype)',
          subtitle: 'Generating practice speech guidance across Telugu, Hindi, and regional language samples.',
          content: (
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-xl font-bold text-slate-900">Text-to-Speech Architecture for Healthcare Guidance</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Gnani Timbre Neural Voice Services. Provides spoken audio instructions with pauses between dosage intervals and stressed warning conditions (e.g. <em>"Don't take on an empty stomach"</em>).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
 <div className="text-sm font-bold text-slate-900 mb-2">Telugu (Rayalaseema Dialect) Sample</div>
                    <div className="text-xs font-serif text-teal-900 italic bg-white p-4 rounded-xl border border-teal-200">
                      "నారాయణ రావు గారూ, ఈ నీలిరంగు టాబ్లెట్ ఉదయం టిఫిన్ చేశాక వేసుకోండి. ఈ పసుపు రంగు మందు రాత్రి పడుకునే ముందు మాత్రమే వేసుకోవాలి. ఖాళీ కడుపుతో అస్సలు వేసుకోకండి."
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
 <div className="text-sm font-bold text-slate-900 mb-2">Hindi (Awadhi / Bundelkhandi) Sample</div>
                    <div className="text-xs font-serif text-amber-950 italic bg-white p-4 rounded-xl border border-amber-200">
                      "आरव के माताजी, यह पीली दवाई बच्चे को सुबह नाश्ते के बाद एक चम्मच देनी है। इनहेलर को दबाकर 2 पफ सांस अंदर खिंचवाएं। खाली पेट कभी न दें।"
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Simulated WhatsApp Voice Dispatch & Offline Rural Storage',
          subtitle: 'Previewing spoken instructions and user-controlled sharing without claiming delivery.',
          content: (
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-emerald-950 text-white border border-emerald-800 space-y-6">
                <h3 className="text-xl font-bold text-emerald-300">WhatsApp Share Preview (No Automatic Send)</h3>
                <p className="text-sm text-emerald-100 leading-relaxed">
                  The prototype can prepare a compressed voice note and visual card for user-controlled sharing. It does not store a registered family phone number, use WhatsApp Green API, send automatically, or verify delivery.
                </p>
                <div className="p-6 rounded-2xl bg-black/40 border border-emerald-700 space-y-3">
                  <div className="text-xs font-bold text-emerald-400">SIMULATED LOCAL HANDOFF LOG:</div>
                  <div className="text-xs font-mono text-emerald-200">
                    • Destination: demo recipient selected by the user; no stored number<br/>
                    • Media Type: local audio preview; codec depends on the browser recording<br/>
                    • Compression: local preview only; no network playback guarantee<br/>
                    • Delivery: not sent or verified by this prototype<br/>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      ]
    },

    // -------------------------------------------------------------
    opencv_strip_scanner: {
      id: 'opencv_strip_scanner',
      category: 'Solutions',
      badge: 'Vision AI & Safety',
      badgeColor: '#D97706',
      title: 'Tesseract Medicine Blister OCR & Safety Review',
      tagline: 'On-device OCR prototype with bundled formulary and safety reference',
      icon: Eye,
      totalPages: 3,
      interactiveActionLabel: 'Launch Blister Strip Scanner',
      interactiveModalKey: 'scanner',
      pages: [
        {
          pageTitle: 'Blister Pack Detection & Pharmacological Entity Matching',
          subtitle: 'Live browser OCR with contour review and bundled generic-salt candidate matching.',
          content: (
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-xl font-bold text-slate-900">Optical Character Inspection Pipeline</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Patients often bring crinkled, half-empty blister packs to the clinic with illegible brand text. AyuSwar uses a Tesseract-powered browser pipeline to inspect the blister strip, extract text candidates, and compare them with a bundled sample generic-salt list. It does not verify against a live National Formulary of India service.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-bold text-amber-700 uppercase mb-2">Step 1: Contour Segmentation</div>
                    <p className="text-xs text-slate-600">Canny edge detection and Otsu binarization locate foil packaging despite harsh clinic overhead lighting.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-bold text-amber-700 uppercase mb-2">Step 2: Tesseract OCR Filtering</div>
                    <p className="text-xs text-slate-600">Extracts text candidates and applies string matching against the bundled sample generic-salt list.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-xs font-bold text-amber-700 uppercase mb-2">Step 3: Jan Aushadhi Mapping</div>
                    <p className="text-xs text-slate-600">Shows possible generic-label candidates for review; any savings figure is sample-basket arithmetic, not live price or eligibility evidence.</p>
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Sample Drug-Drug Interaction Review',
          subtitle: 'Flagging potential contraindications for clinician review before any prescription decision.',
          content: (
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-rose-950 text-white border border-rose-800 space-y-6">
                <h3 className="text-xl font-bold text-rose-300">Sample Pharmacological Conflict Review</h3>
                <p className="text-sm text-rose-100 leading-relaxed">
                  The prototype can flag a bundled sample medication combination for clinician or pharmacist review. It does not query a live OpenFDA or National Formulary service and does not make a prescribing decision.
                </p>
                <div className="p-5 rounded-2xl bg-black/40 border border-rose-700 space-y-2">
                  <div className="text-xs font-bold text-rose-400">SAMPLE SAFETY REVIEW EXAMPLE:</div>
                  <div className="text-xs text-rose-200">
 <strong>Sample NSAID combination:</strong> The interface flags the pair for qualified clinician or pharmacist review. It does not assess patient-specific risk or recommend an alternative medicine.
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Sample Dosage Review Boundaries',
          subtitle: 'Demo age and weight safety checks for reviewer discussion.',
          content: (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Sample Dosage Review Boundaries</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  The prototype can display sample age and weight fields for reviewer discussion. It does not calculate a patient-specific dose or verify clinical thresholds.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                    <strong className="text-emerald-900">Pediatric boundary:</strong><br/>
                    No pediatric dose is calculated; a qualified clinician must determine dosing.
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                    <strong className="text-blue-900">Geriatric boundary:</strong><br/>
                    Medication suitability is left to qualified clinical review; no rule-based clearance is claimed.
                  </div>
                </div>
              </div>
            </div>
          )
        }
      ]
    },

    // -------------------------------------------------------------
    sanjivani_108_sos: {
      id: 'sanjivani_108_sos',
      category: 'Solutions',
      badge: 'Emergency Simulation',
      badgeColor: '#DC2626',
      title: 'Sanjivani-108 Emergency Simulation & Handoff Preview',
      tagline: 'Simulated acoustic triage, CPR pacing, and hospital handoff preview; no dispatch',
      icon: PhoneCall,
      totalPages: 3,
      interactiveActionLabel: 'Open Sanjivani-108 Emergency Console',
      interactiveModalKey: 'sanjivani',
      pages: [
        {
          pageTitle: 'The Golden-Hour Emergency Deficit in India',
          subtitle: 'Why STEMI cardiac arrests and highway trauma fail without pre-arrival notification.',
          content: (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-3xl font-black text-rose-600 mb-2">Call first</div>
                  <div className="text-sm font-bold text-slate-900">Official Response Required</div>
                  <div className="text-xs text-slate-500 mt-1">This prototype cannot measure response time, contact emergency services, or prepare a hospital bay.</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-3xl font-black text-amber-600 mb-2">Sample beat</div>
                  <div className="text-sm font-bold text-slate-900">Demonstration Pacing Tool</div>
                  <div className="text-xs text-slate-500 mt-1">The audible beat is an interface demo. In an emergency, call 112 / 108 and follow the official dispatcher.</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-3xl font-black text-teal-600 mb-2">No pre-alert</div>
                  <div className="text-sm font-bold text-slate-900">Hospital Capability Unknown</div>
                  <div className="text-xs text-slate-500 mt-1">Map place results do not verify cath labs, beds, bays, or pre-arrival notification.</div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-6">
                <h3 className="text-xl font-bold text-rose-400">The Sanjivani-108 Prototype Handoff Preview</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  The prototype demonstrates a possible handoff flow from sample audio or text and nearby map places. It does not monitor calls, diagnose distress, dispatch ambulances, notify hospitals, or initiate autonomous actions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800">
                    <div className="text-xs font-bold text-rose-400">1. 110 BPM Sample Beat</div>
                    <div className="text-[11px] text-slate-300 mt-1">A local beat demonstrates pacing UI only; it is not treatment guidance.</div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-950/70 border border-amber-800">
 <div className="text-xs font-bold text-amber-400">2. No Traffic Integration</div>
                    <div className="text-[11px] text-slate-300 mt-1">The prototype does not contact traffic police or control signals.</div>
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Sample Pre-Arrival Handoff Preview',
          subtitle: 'Simulated FHIR handoff preview; no live hospital bay or system handshake.',
          content: (
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-xl font-bold text-slate-900">Local Sample Handoff Token (No ABDM/ePCR Submission)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  The prototype can display the shape of a pre-arrival note for design review. It does not transmit an ePCR payload, contact a CMO, encrypt a live exchange, or assign a resuscitation bay.
                </p>
                <div className="p-6 rounded-2xl bg-slate-900 text-teal-300 font-mono text-xs border border-slate-800">
                  <div>SAMPLE-TOKEN: LOCAL-PREVIEW-ONLY</div>
                  <div>TRIAGE CATEGORY: SIMULATED RED SAMPLE — NOT A DIAGNOSIS</div>
                  <div>DESTINATION BAY: none (no bay contacted or reserved)</div>
                  <div>TELEMETRY: synthetic sample values; not measured from a patient</div>
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Mapbox GIS Navigation & Device GPS Radius Isolation',
          subtitle: 'Simulated ambulance routing and nearest-hospital selection for handoff preview.',
          content: (
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-6">
                <h3 className="text-xl font-bold text-teal-300">Device/Map Location Preview</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  The page uses the selected device or searched location to look up nearby map places. It does not dispatch ambulances, reserve facilities, or establish a cross-user privacy boundary.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <strong className="text-teal-400">Mapbox Road Matrix:</strong><br/>
                    Optional road routing when a routing token is configured; otherwise an estimated direct path is shown.
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <strong className="text-teal-400">Simulation Controls:</strong><br/>
                    Interactive Pause/Start and speed multipliers (1x, 2x, 5x) for full operator control.
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <strong className="text-teal-400">No Driver Contact:</strong><br/>
                    No paramedic, driver, phone bridge, or live dispatch contact is connected.
                  </div>
                </div>
              </div>
            </div>
          )
        }
      ]
    },

    // -------------------------------------------------------------
    // CORE NAVIGATION
    // -------------------------------------------------------------
    technology_hld: {
      id: 'technology_hld',
      category: 'Architecture',
      badge: 'High-Level Design',
      badgeColor: '#0F4C5C',
      title: 'Technology & High-Level Design (HLD)',
      tagline: 'Deep dive into proposed client speech-processing architecture; no sovereign deployment claim',
      icon: Layers,
      totalPages: 3,
      interactiveActionLabel: 'Inspect Technical Architecture Blueprint',
      interactiveModalKey: 'tech',
      pages: [
        {
          pageTitle: '8-Layer Deep-Tech Architectural Blueprint',
          subtitle: 'From 16 kHz microphone audio to a local FHIR-shaped research draft.',
          content: (
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-6">
                <h3 className="text-xl font-bold text-teal-300">End-to-End Latency & Data Flow Pipeline</h3>
                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-3 leading-relaxed">
 <div>1. <strong>Audio Stream:</strong> Web Audio API capture @ 16 kHz PCM (Single/Dual Channel) [15ms]</div>
 <div>2. <strong>ASR Processing:</strong> Gnani Prisma v3 Indic ASR [Local Client Pipeline]</div>
 <div>3. <strong>Acoustic DSP:</strong> 13-dim MFCCs + Spectral Centroid + Pitch Jitter Biomarkers [25ms]</div>
 <div>4. <strong>Semantic NLP:</strong> Indic Metaphor Resolver ➔ WHO ICD-10 & SNOMED-CT [30ms]</div>
 <div>5. <strong>Clinical Draft:</strong> Dual-Column SOAP Generator with Audio Timestamp Anchors [25ms]</div>
 <div className="text-teal-400 font-bold pt-2">➔ TOTAL END-TO-END LATENCY: ~180 ms (Imperceptible to Physician)</div>
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Indic AI Design vs Generic Western Models',
          subtitle: 'Where generic LLM workflows can struggle in Indian rural consultations.',
          content: (
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-xl font-bold text-slate-900">Speech Processing Approaches for Indic Consultations</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                      <tr>
                        <th className="p-3 border-b">Architecture Dimension</th>
                        <th className="p-3 border-b">Standard Cloud STT</th>
                        <th className="p-3 border-b">Generic Local Models</th>
                        <th className="p-3 border-b text-teal-700">AyuSwar Prototype Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="p-3 font-bold">Rural Dialect Code-Switching</td>
                        <td className="p-3 text-slate-600">Standard Lexicon</td>
                        <td className="p-3 text-slate-600">Variable Accuracy</td>
                        <td className="p-3 text-teal-700 font-bold">Gnani Prisma v3 ASR (Active)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">Tenglish / Hinglish Support</td>
                        <td className="p-3 text-slate-600">Dropout on colloquial terms</td>
                        <td className="p-3 text-slate-600">Inconsistent</td>
                        <td className="p-3 text-teal-700 font-bold">Deterministic Medical Vocabulary Crosswalk</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold">Deployment & Execution</td>
                        <td className="p-3 text-slate-500">Cloud API Dependency</td>
                        <td className="p-3 text-slate-500">High Compute Overhead</td>
                        <td className="p-3 text-teal-700 font-bold">Client-Side Zero-Install Prototype</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Security & Privacy Disclosure',
          subtitle: 'Feature-level disclosure of current microphone, processing, and retention behavior.',
          content: (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-4">
                <h3 className="text-xl font-bold text-teal-300">Data Protection & Privacy Architecture</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  This public prototype does not certify DPDP Act 2023, ABDM, or DISHA compliance. Microphone, processing, retention, and deletion behavior are disclosed per feature and depend on the actual deployment.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <strong>Encryption:</strong> Transport and storage protections depend on the deployment; this prototype does not claim a certified encryption boundary.
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <strong>Hosting:</strong> Hosting location and MeitY empanelment are not certified for this prototype.
                  </div>
                </div>
              </div>
            </div>
          )
        }
      ]
    },

    // -------------------------------------------------------------
    clinical_impact: {
      id: 'clinical_impact',
      category: 'Impact',
      badge: 'Prototype Goals',
      badgeColor: '#10B981',
      title: 'Workflow Impact & Health Economics Model',
      tagline: 'Prototype metrics for workflow burden, review controls, and health-literacy support',
      icon: BarChart2,
      totalPages: 3,
      interactiveActionLabel: 'Review 24-Point Benchmark Matrix',
      interactiveModalKey: 'benchmark',
      pages: [
        {
          pageTitle: 'Physician Burnout & Time Savings in High-Volume Clinics',
          subtitle: 'Target model for reducing physician documentation time in high-volume clinics.',
          content: (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-3xl font-black text-teal-600 mb-2">Draft</div>
                  <div className="text-sm font-bold text-slate-900">Documentation Draft</div>
                  <div className="text-xs text-slate-500 mt-1">The prototype can draft notes for review; measured time savings are not claimed.</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-3xl font-black text-emerald-600 mb-2">Review</div>
                  <div className="text-sm font-bold text-slate-900">Human Review Required</div>
                  <div className="text-xs text-slate-500 mt-1">Structured drafts still require clinician review; error reduction is not measured.</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-3xl font-black text-[#0F4C5C] mb-2">Share</div>
                  <div className="text-sm font-bold text-slate-900">User-Controlled Share Preview</div>
                  <div className="text-xs text-slate-500 mt-1">The user may export or share a draft themselves; automatic delivery and faster dispatch are not claimed.</div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Sample Workflow Time Reallocation</h3>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div>• <strong>Example only:</strong> documentation time varies by clinician and workflow; no measured percentage is claimed.</div>
                  <div>• <strong>Prototype intent:</strong> reduce typing after clinician review; clinical time savings remain unmeasured.</div>
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Health Economics & Prevention of Medication Non-Adherence',
          subtitle: 'Modeling potential avoided readmissions in diabetes, hypertension, and asthma workflows.',
          content: (
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-4">
                <h3 className="text-xl font-bold text-emerald-300">Economic Impact on Indian Rural Families</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Economic impact is not measured in this prototype. Vernacular Audio-Rx is designed to make sample medication instructions easier to review and share; adherence and avoided hospitalization are not verified.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <strong>Diabetes workflow:</strong> Spoken instructions are a sample communication aid; HbA1c impact is not measured.
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <strong>Asthma workflow:</strong> Spoken sample instructions support clinician review; clinical outcomes are not measured.
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Future ABDM Mapping Concept',
          subtitle: 'Exploring how local FHIR-shaped drafts could map to future ABDM milestones.',
          content: (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xl font-bold text-slate-900">ABDM Concept Exploration</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  AyuSwar explores how local FHIR-shaped drafts could align with future ABDM milestones. It does not provide ABDM compliance, national exchange connectivity, ABHA verification, or government adoption.
                </p>
              </div>
            </div>
          )
        }
      ]
    },

    // -------------------------------------------------------------
    // RESOURCES
    // -------------------------------------------------------------
    kaggle_dataset_hub: {
      id: 'kaggle_dataset_hub',
      category: 'Resources',
      badge: 'Clinical Data Hub',
      badgeColor: '#0284C7',
      title: 'Synthetic Clinical Knowledge & Vocabulary Hub',
      tagline: 'Multi-modal synthetic health-intelligence prototype with ICD-10 draft mapping',
      icon: Database,
      totalPages: 3,
      interactiveActionLabel: 'Open Clinical Knowledge Hub',
      interactiveModalKey: 'dataset',
      pages: [
        {
          pageTitle: 'Dataset Foundations & Multi-Source Alignment',
          subtitle: 'Combining bundled clinical matrices, simulated respiratory audio profiles, and public reference data.',
          content: (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-3xl font-black text-teal-600 mb-2">Synthetic</div>
                  <div className="text-sm font-bold text-slate-900">Respiratory Audio Profiles</div>
                  <div className="text-xs text-slate-500 mt-1">Simulated cough, wheezing, and sustained breath acoustic profiles for algorithmic prototyping.</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-3xl font-black text-blue-600 mb-2">4,920</div>
                  <div className="text-sm font-bold text-slate-900">Synthetic Disease Case Fixtures</div>
                  <div className="text-xs text-slate-500 mt-1">Multi-symptom synthetic presentations mapped to sample ICD-10 reference codes.</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-3xl font-black text-[#0F4C5C] mb-2">FHIR-shaped</div>
                  <div className="text-sm font-bold text-slate-900">Local Schema Drafts</div>
                  <div className="text-xs text-slate-500 mt-1">Sample vocabulary mapping for local inspection; no ABDM certification is claimed.</div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-4">
                <h3 className="text-xl font-bold text-teal-300">Open-Access Scientific Rigor</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  AyuSwar AI is a prototype demonstration utilizing synthetic clinical distributions, open medical vocabularies (WHO ICD-10, SNOMED-CT), and simulated acoustic biomarker profiles. Not for clinical diagnosis.
                </p>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Sample Indic Concept Mapping',
          subtitle: 'Extracting sample concepts and acoustic research cues without diagnosis or medication recommendation.',
          content: (
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Sample Multi-Modal Mapping Flow</h3>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700">
                  <div>• <strong>Input:</strong> Colloquial patient symptom (e.g., <em>"తీవ్రమైన ఆయాసం, రాత్రి వేళ పొడి దగ్గు"</em>)</div>
                  <div>• <strong>Indic Entity Matcher:</strong> Maps bundled sample phrases to wheezing, nocturnal cough, and dyspnea concepts.</div>
                  <div>• <strong>ICD-10 Mapping:</strong> Sample reference code J45.901 for reviewer inspection; not a diagnosis.</div>
                  <div>• <strong>Simulated Acoustic Risk:</strong> Dry Bronchospastic Signal Pattern (Experimental Prototype).</div>
                  <div>• <strong>Medication Suggestion:</strong> none; clinician review required.</div>
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Open Literature & Methodology References',
          subtitle: 'Open access research literature informing speech and acoustic analysis methodologies.',
          content: (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 text-xs">
                <div className="font-bold text-sm text-slate-900">Selected Research Context:</div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong>1. Acoustic Signal Analysis in Healthcare (Open Literature)</strong><br/>
                  Overview of spectral flux, MFCCs, and pitch dynamics for non-invasive exploratory screening.
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <strong>2. Health Literacy and Prescription Adherence in Rural Communities</strong><br/>
                  Demonstrating the utility of spoken audio instructions and color-coded visual packaging.
                </div>
              </div>
            </div>
          )
        }
      ]
    },

    // -------------------------------------------------------------
    acoustic_biomarker_lab: {
      id: 'acoustic_biomarker_lab',
      category: 'Resources',
      badge: 'Acoustic DSP',
      badgeColor: '#0284C7',
      title: 'Acoustic AI & Vocal Biomarker Signal Lab',
      tagline: 'Browser Digital Signal Processing for Acoustic Research Cues',
      icon: Activity,
      totalPages: 3,
      interactiveActionLabel: 'Launch Acoustic Biomarker Lab',
      interactiveModalKey: 'acoustic',
      pages: [
        {
          pageTitle: 'Acoustic Signal Lab: Digital Signal Processing (DSP)',
          subtitle: 'Extracting 13 Mel-Frequency Cepstral Coefficients (MFCCs) and spectral centroid in real time.',
          content: (
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-6">
                <h3 className="text-xl font-bold text-teal-300">Biomarker Extraction Architecture</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  When sample audio or a permitted microphone input is available, AyuSwar extracts acoustic features for research review. These features are not diagnostic measurements.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <strong className="text-teal-400">Fundamental Pitch (F0) & Tremor:</strong><br/>
                    Detects micro-tremors and pitch perturbations for acoustic signal research.
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <strong className="text-teal-400">Spectral Centroid & Energy Flux:</strong><br/>
                    Explores frequency distribution and resonance across cough and breath audio.
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Pediatric Respiratory Distress Sentinel',
          subtitle: 'Research cues for respiratory strain review; not pediatric diagnosis or early detection.',
          content: (
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-rose-950 text-white border border-rose-800 space-y-4">
                <h3 className="text-xl font-bold text-rose-300">Pediatric Respiratory Research Boundary</h3>
                <p className="text-sm text-rose-100 leading-relaxed">
                  The prototype can display a synthetic respiratory-strain cue for reviewer discussion. It does not detect pneumonia, alert doctors, or prompt nebulization or oxygen treatment.
                </p>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Microphone Audio Ingestion & Waveform Visualizer',
          subtitle: 'Runs in the browser on standard smartphones; no specialized hardware required.',
          content: (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Exploring Low-Cost Acoustic Review</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  The prototype explores whether browser microphone input can support acoustic research review. It is not a stethoscope, screening device, or diagnostic tool.
                </p>
              </div>
            </div>
          )
        }
      ]
    },

    // -------------------------------------------------------------
    clinical_benchmark_suite: {
      id: 'clinical_benchmark_suite',
      category: 'Resources',
      badge: 'Workflow Evaluation',
      badgeColor: '#10B981',
      title: '24-Point Synthetic Workflow Test Suite & Radar Matrix',
      tagline: 'Automated 24-scenario synthetic workflow test runner; not diagnostic validation',
      icon: Award,
      totalPages: 3,
      interactiveActionLabel: 'Run 24-Point Benchmark Test Suite',
      interactiveModalKey: 'benchmark',
      pages: [
        {
          pageTitle: 'The 24-Point Synthetic Workflow Check',
          subtitle: 'Automated checks for workflow behavior, speech handling, and latency on synthetic scenarios.',
          content: (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-3xl font-black text-emerald-600 mb-2">24 sample</div>
                  <div className="text-sm font-bold text-slate-900">Workflow Checks</div>
                  <div className="text-xs text-slate-500 mt-1">Synthetic workflow scenarios; current pass count is reported by the live test runner.</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-3xl font-black text-teal-600 mb-2">Passing</div>
                  <div className="text-sm font-bold text-slate-900">Entity Parser Status</div>
                  <div className="text-xs text-slate-500 mt-1">Deterministic symptom and vocabulary mapping on synthetic test assertions.</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-3xl font-black text-[#0F4C5C] mb-2">Local</div>
                  <div className="text-sm font-bold text-slate-900">Browser-Dependent Latency</div>
                  <div className="text-xs text-slate-500 mt-1">Local browser timing varies by device and is not a clinical validation metric.</div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-4">
                <h3 className="text-xl font-bold text-teal-300">Local Test Runner Architecture</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Evaluators can trigger the local runner to inspect workflow behavior on synthetic dialectal inputs. It does not verify diagnostic precision.
                </p>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Multi-Dimensional Radar Evaluation Matrix',
          subtitle: 'Illustrative comparison across workflow axes; not independent state-of-the-art validation.',
          content: (
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xl font-bold text-slate-900">The 6-Axis Evaluation Radar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>1. Indic ASR Focus:</strong> Designed for vernacular dialects and medical phrases.
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>2. Code-Mixed Dialect Support:</strong> Structured vocabulary crosswalk for Tenglish / Hinglish.
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>3. Acoustic Signal Lab:</strong> Browser WebAudio FFT spectral feature extraction for research review.
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>4. Low Latency Stream:</strong> Client-side zero-install lightweight UI architecture.
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>5. FHIR Draft Shape:</strong> Produces local FHIR R4-shaped JSON for inspection; no ABDM interoperability is certified.
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <strong>6. Accessibility Goal:</strong> Spoken sample prescription drafts with color-coded karaoke tracking.
                  </div>
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Clinical Safety Review Boundary',
          subtitle: 'Probabilistic uncertainty thresholding designed to flag unsupported outputs for clinician review.',
          content: (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-emerald-950 text-white border border-emerald-800 space-y-4">
                <h3 className="text-xl font-bold text-emerald-300">Sample Ontology Mapping Boundary</h3>
                <p className="text-sm text-emerald-100 leading-relaxed">
                  The prototype is designed to flag some ambiguous sample segments for explicit doctor review. It does not eliminate hallucinations and does not claim adherence to Indian Medical Council regulations.
                </p>
              </div>
            </div>
          )
        }
      ]
    },

    // -------------------------------------------------------------
    indic_voice_benchmarks: {
      id: 'indic_voice_benchmarks',
      category: 'Resources',
      badge: 'Speech AI Benchmarks',
      badgeColor: '#0F4C5C',
      title: 'Indic Voice Benchmarks (Prototype Architecture)',
      tagline: 'WER evaluation interface across Indian language samples; live-stream count not claimed',
      icon: Mic,
      totalPages: 3,
      interactiveActionLabel: 'Explore Indic Language Matrix',
      interactiveModalKey: 'language_matrix',
      pages: [
        {
          pageTitle: 'Indic Language Support & Methodology Overview',
          subtitle: 'Speech recognition and synthesis prototype matrix across Indian language samples.',
          content: (
            <div className="space-y-8">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-xl font-bold text-slate-900">Supported Voice Interfaces (Demo Status)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
                    <div className="text-lg font-bold text-teal-900">English (India)</div>
                    <div className="text-xs text-teal-700 mt-1">Default ASR / TTS language; full vocabulary support.</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
                    <div className="text-lg font-bold text-teal-900">Telugu (తెలుగు)</div>
                    <div className="text-xs text-teal-700 mt-1">Colloquial Rayalaseema & Coastal medical phrases mapped to ICD-10.</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
                    <div className="text-lg font-bold text-teal-900">Hindi (हिन्दी)</div>
                    <div className="text-xs text-teal-700 mt-1">Northern rural idioms and Awadhi pediatric retractions mapped.</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                  * Word Error Rates (WER) require reproducible benchmark datasets with sample sizes and ground truth audio. See the dedicated Indic Language Matrix for the current evaluation method and limits.
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Handling Code-Switching & Dialectal Variations',
          subtitle: 'Dialect normalization goals for clinical meaning, with unresolved accuracy limits visible.',
          content: (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-4">
                <h3 className="text-xl font-bold text-teal-300">Dialectal Acoustic Normalization</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  AyuSwar AI attempts to normalize sample dialectal phrases while preserving the entered text; accuracy across dialects is not verified.
                </p>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Voice Synthesis Naturalness & Accessibility (Prototype)',
          subtitle: 'Prototype voice synthesis reviewed for clarity in regional languages.',
          content: (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Synthetic Voice Assessment (Prototype)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Gnani Timbre Neural Voice Services may be used when configured; browser fallback remains available. Clarity and patient comprehension are design goals, not measured outcomes.
                </p>
              </div>
            </div>
          )
        }
      ]
    },

    // -------------------------------------------------------------
    abdm_fhir_whitepaper: {
      id: 'abdm_fhir_whitepaper',
      category: 'Resources',
      badge: 'Research Draft',
      badgeColor: '#0F4C5C',
      title: 'FHIR Research Draft Architecture Whitepaper',
      tagline: 'Technical review of standards-aligned FHIR draft structures; no NHA sandbox integration',
      icon: Shield,
      totalPages: 3,
      interactiveActionLabel: 'Inspect FHIR Draft Concepts',
      interactiveModalKey: 'tech',
      pages: [
        {
          pageTitle: 'ABDM Concepts & Future Milestones',
          subtitle: 'Standards-informed structures for ABHA-style identifiers, HIP concepts, and consent boundaries.',
          content: (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-xl font-black text-teal-700 mb-2">M1 Milestone</div>
                  <div className="text-sm font-bold text-slate-900">ABHA-Style Identifier Concept</div>
                  <div className="text-xs text-slate-500 mt-1">Local placeholder format only; no Aadhaar, OTP, or ABHA validation is connected.</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-xl font-black text-blue-700 mb-2">M2 Milestone</div>
                  <div className="text-sm font-bold text-slate-900">Local FHIR-Shaped Draft</div>
                  <div className="text-xs text-slate-500 mt-1">Generates inspectable local drafts; nothing is published to a health exchange.</div>
                </div>
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="text-xl font-black text-teal-800 mb-2">M3 Milestone</div>
                  <div className="text-sm font-bold text-slate-900">Consent Boundary Concept</div>
                  <div className="text-xs text-slate-500 mt-1">Design concept only; no live HIU consent manager or token service is connected.</div>
                </div>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'FHIR R4 JSON Schema Architecture',
          subtitle: 'Inspectable FHIR-shaped records for research review; no national exchange connection.',
          content: (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-4">
                <h3 className="text-xl font-bold text-teal-300">Standardized Clinical Artifacts</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  A reviewed sample consultation can produce a local, unsigned FHIR-shaped Bundle containing Encounter, Condition, and MedicationRequest-shaped resources.
                </p>
              </div>
            </div>
          )
        },
        {
          pageTitle: 'Digital Consent Management & Privacy by Design',
          subtitle: 'Exploring patient-controlled consent and data-sharing boundaries in a local prototype.',
          content: (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Protecting Citizen Privacy by Design</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Consent controls are a design concept. The current prototype stores local review acknowledgement only and is not linked to an ABHA mobile application.
                </p>
              </div>
            </div>
          )
        }
      ]
    }
  };

  const currentModule = modulesData[effectiveModuleId] || modulesData['opd_ambient_scribe'];
  const moduleKeys = Object.keys(modulesData);
  const currentModuleIndex = moduleKeys.indexOf(currentModule.id);
  const prevModuleKey = currentModuleIndex > 0 ? moduleKeys[currentModuleIndex - 1] : null;
  const nextModuleKey = currentModuleIndex < moduleKeys.length - 1 ? moduleKeys[currentModuleIndex + 1] : null;

  const currentPageData = currentModule.pages[currentPage - 1] || currentModule.pages[0];
  const IconComponent = currentModule.icon;

  const handleInteractiveLaunch = (k) => {
    if (onLaunchInteractiveModal) {
      onLaunchInteractiveModal(k);
      return;
    }
    if (k === 'scanner') navigate('/scanner');
    else if (k === 'language_matrix') navigate('/language-matrix');
    else if (k === 'acoustic') navigate('/acoustic-lab');
    else if (k === 'audiorx') navigate('/audio-rx');
    else if (k === 'tech') navigate('/technology');
    else if (k === 'benchmark') navigate('/benchmarks');
    else if (k === 'dataset') navigate('/datasets');
    else if (k === 'scribe') navigate('/auth/doctor');
    else navigate('/solutions/' + currentModule.id);
  };

  return (
    <div className="detailed-module-container" style={{ minHeight: '100vh', background: '#FAF8F5', color: '#091E26', paddingBottom: '96px' }}>
      {/* Top Breadcrumb & Navigation Bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #D0DFE2',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#698892' }}>
            <button 
              onClick={() => onBackToHome ? onBackToHome() : navigate('/')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: '#486770',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </button>
            <span style={{ color: '#D0DFE2' }}>/</span>
            <span style={{ color: '#698892', fontWeight: 600 }}>{currentModule.category}</span>
            <span style={{ color: '#D0DFE2' }}>/</span>
            <span style={{ color: '#0F4C5C', fontWeight: 800 }}>{currentModule.title}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {currentModule.interactiveActionLabel && (
              <button
                onClick={() => handleInteractiveLaunch(currentModule.interactiveModalKey)}
                style={{
                  padding: '9px 18px',
                  background: '#0F4C5C',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '12.5px',
                  borderRadius: '10px',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.16)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sparkles size={14} />
                <span>{currentModule.interactiveActionLabel}</span>
              </button>
            )}

            <button
              onClick={() => setIsTourModalOpen(true)}
              style={{
                padding: '9px 16px',
                background: '#091E26',
                color: '#FFFFFF',
                fontWeight: 750,
                fontSize: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Sparkles size={14} color="#0F4C5C" />
              <span>Interactive UI Tour</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Header for this Module */}
      <div style={{
        background: '#F8FAFC',
        borderBottom: '1px solid #D0DFE2',
        padding: '36px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            <div 
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
                boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                background: currentModule.badgeColor
              }}
            >
              <IconComponent size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span 
                  style={{
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#ffffff',
                    background: currentModule.badgeColor
                  }}
                >
                  {currentModule.badge}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#698892', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Deep Technical Specification
                </span>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#091E26', letterSpacing: '-0.02em', margin: '6px 0 0 0' }}>
                {currentModule.title}
              </h1>
            </div>
          </div>
          <p style={{ fontSize: '15px', color: '#486770', maxWidth: '780px', lineHeight: 1.5, margin: '14px 0 0 0' }}>
            {currentModule.tagline}
          </p>

          {/* Section Step Progress Bar */}
          <div style={{ paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#698892', textTransform: 'uppercase' }}>
              Section {currentPage} of {currentModule.totalPages}:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '220px' }}>
              {Array.from({ length: currentModule.totalPages }).map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  style={{
                    height: '8px',
                    flex: 1,
                    borderRadius: '999px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: currentPage === idx + 1 
                      ? '#0F4C5C' 
                      : idx + 1 < currentPage 
                      ? '#D4AF37' 
                      : '#D0DFE2',
                    boxShadow: currentPage === idx + 1 ? '0 0 0 2px rgba(0, 0, 0, 0.16)' : 'none'
                  }}
                  title={`Jump to section ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-Page Section Content */}
      <div className="detailed-module-main-body" style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(16px, 3vw, 32px) clamp(10px, 3vw, 24px)', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ borderBottom: '1px solid #D0DFE2', paddingBottom: '16px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#091E26', margin: 0, letterSpacing: '-0.01em' }}>
              {currentPageData.pageTitle}
            </h2>
            <p style={{ fontSize: '14px', color: '#698892', margin: '6px 0 0 0' }}>
              {currentPageData.subtitle}
            </p>
          </div>

          {/* Dynamic Rich Interactive Content */}
          <div style={{ minHeight: '420px', padding: '8px 0' }}>
            {currentPageData.content}
          </div>

          {/* Sub-Section Pagination: Next / Previous Buttons */}
          <div style={{
            paddingTop: '32px',
            borderTop: '1px solid #D0DFE2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                background: currentPage === 1 ? '#F1F5F9' : '#FFFFFF',
                color: currentPage === 1 ? '#94A3B8' : '#1E293B',
                border: '1px solid #D0DFE2',
                boxShadow: currentPage === 1 ? 'none' : '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <ChevronLeft size={16} />
              <span>Previous Section</span>
            </button>

            <div style={{ fontSize: '12px', fontWeight: 800, color: '#698892' }}>
              Section {currentPage} of {currentModule.totalPages}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(currentModule.totalPages, p + 1))}
              disabled={currentPage === currentModule.totalPages}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: currentPage === currentModule.totalPages ? 'not-allowed' : 'pointer',
                background: currentPage === currentModule.totalPages ? '#F1F5F9' : '#0F4C5C',
                color: currentPage === currentModule.totalPages ? '#94A3B8' : '#FFFFFF',
                border: 'none',
                boxShadow: currentPage === currentModule.totalPages ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.16)'
              }}
            >
              <span>Next Section</span>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Global Cross-Module Navigation Footer */}
          <div style={{
            paddingTop: '36px',
            marginTop: '36px',
            borderTop: '2px dashed #D0DFE2',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            {prevModuleKey ? (
              <button
                onClick={() => onNavigateModule ? onNavigateModule(prevModuleKey) : navigate('/solutions/' + prevModuleKey)}
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  background: '#FFFFFF',
                  border: '1px solid #D0DFE2',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ padding: '8px', borderRadius: '10px', background: '#FAF8F5', color: '#486770' }}>
                  <ArrowLeft size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8' }}>Previous Module</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#091E26' }}>{modulesData[prevModuleKey].title}</div>
                </div>
              </button>
            ) : <div />}

            {nextModuleKey ? (
              <button
                onClick={() => onNavigateModule ? onNavigateModule(nextModuleKey) : navigate('/solutions/' + nextModuleKey)}
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  background: '#FFFFFF',
                  border: '1px solid #D0DFE2',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  textAlign: 'right'
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8' }}>Next Module</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#091E26' }}>{modulesData[nextModuleKey].title}</div>
                </div>
                <div style={{ padding: '8px', borderRadius: '10px', background: '#E6F7F8', color: '#0F4C5C' }}>
                  <ArrowRight size={16} />
                </div>
              </button>
            ) : <div />}
          </div>
        </div>
      </div>

      {/* Interactive Guided UI Cursor Tour Modal */}
      <SolutionUiTourModal 
        isOpen={isTourModalOpen} 
        onClose={() => setIsTourModalOpen(false)} 
      />
    </div>
  );
}
