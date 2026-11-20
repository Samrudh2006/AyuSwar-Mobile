import React, { useState, useEffect } from 'react';
import { 
  Siren, 
  CheckCircle2, 
  X, 
  Building2, 
  Car, 
  Phone, 
  MapPin, 
  Activity, 
  Clock, 
  FileText, 
  Shield, 
  Send,
  Heart,
  AlertTriangle,
  UserCheck,
  Check,
  Zap
} from 'lucide-react';
import { sanjivaniAudio, analyzeEmergencyClinicalTriage } from '../services/sanjivaniEmergencyService';
import { speechService } from '../services/indicSpeechService';

/**
 * Sanjivani-108 synthetic pre-arrival handover preview modal
 * 
 * Drafted from simulator conversation, acoustic notes, and selected location.
 * Generates a local structured preview only; no hospital transmission or bed reservation occurs.
 */
export default function SanjivaniTransferModal({
  isOpen,
  onClose,
  hospital,
  callerPhone,
  geoAddress,
  liveTranscript,
  englishTranslation,
  distressIndex = 89,
  vocalPitchHz = 295,
  respirationRate = 38,
  ambulanceData,
  onConfirmHandshake
}) {
  // Form State (Auto-filled from live conversation & GIS telemetry)
  const [formData, setFormData] = useState(() => {
    const triage = analyzeEmergencyClinicalTriage(liveTranscript || englishTranslation || '', distressIndex);
    return {
      patientName: 'Synthetic emergency caller',
      callerPhone: callerPhone || '+91 00000 00007',
      location: geoAddress || 'Sample incident location',
      chiefComplaint: liveTranscript || englishTranslation || 'Sample emergency symptoms from simulator input',
      triageCategory: `SAMPLE — ${triage.severity || 'keyword category'}`,
      icd10: `Sample reference (${triage.suspectedCondition}); clinician review required`,
      assignedBay: 'No bay reserved (simulation)',
      assignedAmbulance: `${ambulanceData?.id || 'A-12'} (ALS Unit • Defibrillator, Ventilator, 12-Lead ECG)`,
      driverContact: 'Demo transport contact • +91 90000 00000',
      clinicalNotes: `Sample observations: distress ${distressIndex}%, pitch ${vocalPitchHz} Hz, breathing estimate ${respirationRate}/min. Speech: "${liveTranscript || 'sample audio'}". Boundary: ${triage.priorityProtocol}`
    };
  });

  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionStep, setTransmissionStep] = useState(0); // 0: Idle, 1: Packaging, 2: Handshaking, 3: Confirmed
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(5);
  const [isAutoSubmitActive, setIsAutoSubmitActive] = useState(true);

  // Sync formData with incoming props in real time as symptoms are spoken
  useEffect(() => {
    const textToUse = liveTranscript || englishTranslation || '';
    const triage = analyzeEmergencyClinicalTriage(textToUse, distressIndex);
    setFormData(prev => ({
      ...prev,
      callerPhone: callerPhone || prev.callerPhone,
      location: geoAddress || prev.location,
      chiefComplaint: textToUse || prev.chiefComplaint,
      triageCategory: `SAMPLE — ${triage.severity || 'keyword category'}`,
      icd10: `Sample reference (${triage.suspectedCondition}); clinician review required`,
      assignedBay: hospital?.resuscitationBayAssigned || prev.assignedBay,
      assignedAmbulance: `${ambulanceData?.id || 'A-12'} (ALS Unit • Defibrillator, Ventilator, 12-Lead ECG)`,
      driverContact: 'Demo transport contact • +91 90000 00000',
      clinicalNotes: `Sample observations: distress ${distressIndex}%, pitch ${vocalPitchHz} Hz, breathing estimate ${respirationRate}/min. Speech: "${textToUse || 'sample audio'}". Boundary: ${triage.priorityProtocol}`
    }));
  }, [liveTranscript, englishTranslation, geoAddress, callerPhone, hospital, ambulanceData, distressIndex, vocalPitchHz, respirationRate]);

  // Automated Transmission Timer (Submits automatically after 5s if user does not cancel)
  useEffect(() => {
    if (!isOpen || isTransmitting || !isAutoSubmitActive) return;

    if (autoSubmitCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoSubmitCountdown(c => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (autoSubmitCountdown === 0 && !isTransmitting && transmissionStep === 0) {
      handleTransmitHandshake();
    }
  }, [isOpen, autoSubmitCountdown, isTransmitting, isAutoSubmitActive, transmissionStep]);

  const handleTransmitHandshake = () => {
    setIsTransmitting(true);
    setTransmissionStep(1);
    sanjivaniAudio.playClickSound(880, 0.08);

    // Step 1: preparing local preview
    setTimeout(() => {
      setTransmissionStep(2);
      sanjivaniAudio.playClickSound(1046, 0.08);
    }, 800);

    // Step 2: simulating handoff review
    setTimeout(() => {
      setTransmissionStep(3);
      sanjivaniAudio.playRadioChime();

      speechService.speak(
        `Simulation complete. No hospital connection or bay reservation was made for ${hospital?.shortName || hospital?.name || 'the selected facility'}.`,
        { langCode: 'en-IN' }
      );

      // Step 3: Complete Handshake & Close after celebration
      setTimeout(() => {
        setIsTransmitting(false);
        const panToken = `SIM-HANDOVER-${Math.floor(10000 + Math.random() * 90000)}`;
        onConfirmHandshake(panToken);
        onClose();
      }, 1200);
    }, 1800);
  };

  if (!isOpen || !hospital) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(2, 6, 17, 0.92)',
      backdropFilter: 'blur(12px)',
      zIndex: 220,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        background: '#071224',
        border: '1.5px solid #DC2626',
        borderRadius: '16px',
        boxShadow: '0 25px 70px rgba(220, 38, 38, 0.35)',
        width: '100%',
        maxWidth: '780px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        color: '#F8FAFC',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #7F1D1D 0%, #450A0A 100%)',
          borderBottom: '1px solid #991B1B',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/assets/sanjivani_circular_badge.png" 
              alt="Sanjivani 108 Emblem" 
              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }} 
            />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.3px' }}>
                Synthetic Handoff Preview (local ePCR-style draft)
              </div>
              <div style={{ fontSize: '11px', color: '#FCA5A5', marginTop: '2px' }}>
                Synthetic simulator draft • local structured preview only
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isTransmitting}
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid #991B1B',
              color: '#FCA5A5',
              borderRadius: '6px',
              padding: '4px',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body (Auto-Filled Content) */}
        <div style={{
          padding: '18px 20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          fontSize: '11.5px'
        }}>
          {/* Top Banner: Destination Facility & Assigned Bay */}
          <div style={{
            background: '#0B1B36',
            border: '1px solid #1E3E6E',
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={24} color="#38BDF8" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#FFFFFF' }}>
                  {hospital.name}
                </div>
                <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>
                  Demo facility ID: <strong style={{ color: '#38BDF8' }}>{hospital.hfrId}</strong> • {hospital.address}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 900, color: '#047857' }}>
                {formData.assignedBay}
              </div>
              <div style={{ fontSize: '9.5px', color: '#D0DFE2' }}>
                Road ETA: <strong>{hospital.etaMinutes} min ({hospital.distanceKm} km)</strong>
              </div>
            </div>
          </div>

          {/* Grid of Auto-filled Clinical Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Field 1: Patient / Caller Identity */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                Caller / Patient Phone
              </label>
              <input
                type="text"
                value={formData.callerPhone}
                onChange={(e) => setFormData({ ...formData, callerPhone: e.target.value })}
                style={{
                  width: '100%',
                  background: '#050B16',
                  border: '1px solid #1E3456',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#FFFFFF',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  marginTop: '4px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Field 2: Incident GPS Location */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                GPS Location & Anchor Landmark
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={{
                  width: '100%',
                  background: '#050B16',
                  border: '1px solid #1E3456',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#FFFFFF',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  marginTop: '4px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Field 3: Triage Classification */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: 800, color: '#B91C1C', textTransform: 'uppercase' }}>
                Clinical Triage Category
              </label>
              <input
                type="text"
                value={formData.triageCategory}
                onChange={(e) => setFormData({ ...formData, triageCategory: e.target.value })}
                style={{
                  width: '100%',
                  background: '#1F0B0B',
                  border: '1px solid #7F1D1D',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#FCA5A5',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  marginTop: '4px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Field 4: ICD-10 reference label */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase' }}>
                Suspected ICD-10 Coding
              </label>
              <input
                type="text"
                value={formData.icd10}
                onChange={(e) => setFormData({ ...formData, icd10: e.target.value })}
                style={{
                  width: '100%',
                  background: '#050B16',
                  border: '1px solid #1E3456',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#38BDF8',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  marginTop: '4px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Field 5: Assigned Ambulance */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                Assigned Ambulance Unit
              </label>
              <input
                type="text"
                value={formData.assignedAmbulance}
                readOnly
                style={{
                  width: '100%',
                  background: '#050B16',
                  border: '1px solid #1E3456',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#D0DFE2',
                  fontSize: '11.5px',
                  marginTop: '4px'
                }}
              />
            </div>

            {/* Field 6: EMT Driver Contact */}
            <div>
              <label style={{ fontSize: '10px', fontWeight: 800, color: '#047857', textTransform: 'uppercase' }}>
                EMT Specialist & Driver Direct Mobile
              </label>
              <input
                type="text"
                value={formData.driverContact}
                readOnly
                style={{
                  width: '100%',
                  background: '#050B16',
                  border: '1px solid #047857',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  color: '#047857',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  marginTop: '4px'
                }}
              />
            </div>
          </div>

          {/* Chief Complaint & Live Voice Ingestion Extract */}
          <div>
            <label style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
              Chief Complaint & Symptoms (from simulator input)
            </label>
            <textarea
              rows={2}
              value={formData.chiefComplaint}
              onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
              style={{
                width: '100%',
                background: '#050B16',
                border: '1px solid #1E3456',
                borderRadius: '6px',
                padding: '7px 10px',
                color: '#FFFFFF',
                fontSize: '11px',
                marginTop: '4px',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* Acoustic signal notes & handover draft */}
          <div style={{ background: '#09152B', border: '1px solid #162B4D', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#38BDF8', marginBottom: '4px' }}>
 Sample Speech & Acoustic Handoff Preview
            </div>
            <div style={{ fontSize: '10.5px', color: '#D0DFE2', lineHeight: 1.45 }}>
              <div><strong>Simulated speech input:</strong> "{liveTranscript}"</div>
              <div style={{ fontSize: '9.5px', color: '#94A3B8', fontStyle: 'italic', marginTop: '2px' }}>
                Translation: "{englishTranslation}"
              </div>
              <div style={{ marginTop: '4px', color: '#34D399', fontSize: '10px', fontWeight: 700 }}>
 ✓ Distress Index: {distressIndex}% • Vocal Tremor Spike: {vocalPitchHz} Hz • Respiration: {respirationRate}/min
              </div>
            </div>
          </div>

          {/* Interactive Transmission Progress Animation */}
          {isTransmitting && (
            <div style={{
              background: '#0B2244',
              border: '1.5px solid #38BDF8',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '12.5px', fontWeight: 900, color: '#FFFFFF', marginBottom: '6px' }}>
 {transmissionStep === 1 && 'Preparing synthetic diagnostic handoff preview...'}
 {transmissionStep === 2 && `Simulating telemetry handoff to ${hospital.name} ER desk...`}
 {transmissionStep === 3 && 'Simulation complete — no hospital connection or bay reservation'}
              </div>
              <div style={{ width: '100%', height: '4px', background: '#102A50', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  background: transmissionStep === 3 ? '#047857' : '#38BDF8',
                  width: transmissionStep === 1 ? '35%' : transmissionStep === 2 ? '75%' : '100%',
                  transition: 'width 0.6s ease'
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          background: '#050D1A',
          borderTop: '1px solid #14223A',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onClose}
              disabled={isTransmitting}
              style={{
                background: '#0B172E',
                border: '1px solid #1E3456',
                color: '#94A3B8',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel Handover
            </button>

            {isAutoSubmitActive && !isTransmitting && autoSubmitCountdown > 0 && (
              <span style={{
                fontSize: '11px',
                color: '#38BDF8',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid #0284C7',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Zap size={13} className="animate-pulse" />
                Auto-Submitting in {autoSubmitCountdown}s...
              </span>
            )}
          </div>

          <button
            onClick={handleTransmitHandshake}
            disabled={isTransmitting}
            style={{
              background: 'linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)',
              border: 'none',
              color: '#FFFFFF',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.45)'
            }}
          >
            <Send size={15} />
            <span>{isTransmitting ? 'Generating preview...' : 'Generate synthetic handover preview'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
