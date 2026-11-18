import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  Sparkles, 
  Volume2, 
  TrendingDown, 
  Building2, 
  ExternalLink,
  RefreshCw,
  Tag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PMBJP_FORMULARY_DATABASE, lookupPmbjpDrug } from '../data/pmbjpFormulary';
import { generateAbdmFhirR4Bundle, downloadFhirJson } from '../data/clinicalSafetySentinel';
import { speechService } from '../services/indicSpeechService';
import AuthenticQrCode from '../components/AuthenticQrCode';
import { SketchBorder, WashiTape, MarkerHighlight, InkStamp } from '../components/looseleaf/LooseleafPrimitives';

export default function PrescriptionPreviewView({ isPublicDemoSlip = false }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ayuswar-ai.vercel.app';
  const isDemoSlipRoute = isPublicDemoSlip || (typeof window !== 'undefined' && window.location.pathname.startsWith('/rx/'));
  const { isDemoMode } = useApp();

  // Initial Patient Data
  const [patient, setPatient] = useState({
    name: 'Narayana Rao',
    vernacularName: 'నారాయణ రావు',
    abhaId: 'DEMO-ABHA-91-4521-8932',
    age: 58,
    gender: 'Male',
    date: '23/10/2026',
    doctorName: 'Dr. Demo Clinician (synthetic)',
    doctorSpecialty: 'General Medicine (demo)',
    regNumber: 'DEMO-HPR-8921-9942',
    facilityName: 'Synthetic OPD consultation suite',
    diagnosis: 'Type-2 Diabetes Mellitus with Mild Bronchial Airway Irritation (ICD-10: E11.9 / J45.9)',
    vitals: 'BP: 130/85 mmHg, HR: 76 bpm, SpO2: 98%, Fasting Blood Sugar: 128 mg/dL'
  });

  // Prescription Medications List (Interactive)
  const [medications, setMedications] = useState([
    {
      id: 'med-01',
      brandName: 'Pan 40 (Pantoprazole 40mg)',
      vernacular: 'ప్యాంటోప్రజోల్ 40mg (పసుపు గోళీ - పరగడుపున)',
      pmbjpId: 'pmbjp-gi-001',
      dosage: '1 Tablet Daily',
      timing: 'Morning (08:30 AM) • Empty Stomach Before Breakfast',
      duration: '30 Days',
      isJanAushadhi: true
    },
    {
      id: 'med-02',
      brandName: 'Glycomet 500 SR (Metformin 500mg)',
      vernacular: 'మెట్‌ఫార్మిన్ 500mg (గులాబీ గోళీ - రాత్రి భోజనం తర్వాత)',
      pmbjpId: 'pmbjp-dia-001',
      dosage: '1 Tablet Daily',
      timing: 'Night (08:30 PM) • After Dinner',
      duration: '30 Days',
      isJanAushadhi: true
    },
    {
      id: 'med-03',
      brandName: 'Telma 40 (Telmisartan 40mg)',
      vernacular: 'టెల్మిసార్టాన్ 40mg (రక్తపోటు నియంత్రణకు)',
      pmbjpId: 'pmbjp-cv-001',
      dosage: '1 Tablet Daily',
      timing: 'Morning (09:00 AM) • Post Breakfast',
      duration: '30 Days',
      isJanAushadhi: true
    }
  ]);

  // Drug Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [rxPadStyle, setRxPadStyle] = useState('sketch'); // 'sketch' (Looseleaf paper pad) | 'clean' (digital SaaS)

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Search Results from PMBJP Database
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase().trim();
    return PMBJP_FORMULARY_DATABASE.filter(item => 
      item.genericName.toLowerCase().includes(q) ||
      item.popularBrand.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.indications.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchTerm]);

  // Compute Live Financial Savings
  const financialSummary = useMemo(() => {
    let totalBranded = 0;
    let totalJanAushadhi = 0;

    medications.forEach(med => {
      const pmbjp = PMBJP_FORMULARY_DATABASE.find(d => d.id === med.pmbjpId) || lookupPmbjpDrug(med.brandName);
      if (!pmbjp) return; // no exact bundled sample match: no invented price or savings
      const brandedPrice = pmbjp.brandedMrp;
      const janPrice = pmbjp.janAushadhiPrice;

      totalBranded += brandedPrice;
      totalJanAushadhi += med.isJanAushadhi ? janPrice : brandedPrice;
    });

    const monthlySavings = Math.max(0, totalBranded - totalJanAushadhi);
    const savingsPercent = totalBranded > 0 ? Math.round((monthlySavings / totalBranded) * 100) : 0;
    const annualSavings = monthlySavings * 12;

    return {
      totalBranded,
      totalJanAushadhi,
      monthlySavings,
      savingsPercent,
      annualSavings
    };
  }, [medications]);

  // Add Medication to Prescription
  const handleAddMedication = (drug) => {
    const newMed = {
      id: `med-${medications.length + 1}`,
      brandName: drug.popularBrand.split('/')[0].trim(),
      vernacular: `${drug.genericName.split(' ')[0]} (${drug.indications.split(',')[0].trim()})`,
      pmbjpId: drug.id,
      dosage: '1 Tablet Daily',
      timing: 'As directed by physician',
      duration: '30 Days',
      isJanAushadhi: true
    };
    setMedications([...medications, newMed]);
    setSearchTerm('');
    showToast(`Added ${drug.genericName} with bundled sample pricing.`);
  };

  // Remove Medication
  const handleRemoveMedication = (id) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  // Toggle Generic Switcher
  const handleToggleJanAushadhi = (id) => {
    setMedications(medications.map(m => {
      if (m.id === id) {
        return { ...m, isJanAushadhi: !m.isJanAushadhi };
      }
      return m;
    }));
  };

  // Switch All to Jan Aushadhi
  const handleSwitchAllToJanAushadhi = () => {
    setMedications(medications.map(m => ({ ...m, isJanAushadhi: true })));
    showToast('Switched all visible sample items to bundled generic equivalents.');
  };

  // Spoken Vernacular Prescription Instructions (Telugu / Hindi)
  const handleSpeakPrescription = async () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      return;
    }

    const teluguText = `నమస్కారం ${patient.vernacularName} గారు. మీ డాక్టర్ ప్రిస్క్రిప్షన్ వివరాలు: ` +
      medications.map((m, idx) => {
        const drug = PMBJP_FORMULARY_DATABASE.find(d => d.id === m.pmbjpId) || lookupPmbjpDrug(m.brandName);
        const spokenName = (m.isJanAushadhi && drug) ? drug.genericName : m.brandName;
        return `మందు ${idx + 1}: ${spokenName}. సమయం: ${m.timing}. `;
      }).join(' ') +
      ` వేళకు మందులు వేసుకోండి, ఆరోగ్యంగా ఉండండి.`;

    setIsSpeaking(true);
    try {
      await speechService.speak(teluguText, { langCode: 'te-IN' });
    } catch {
      // Fallback completed
    } finally {
      setIsSpeaking(false);
    }
  };

  // Download ABDM FHIR R4 JSON Bundle
  const handleDownloadFhir = () => {
    const medNames = medications.map(m => {
      const drug = PMBJP_FORMULARY_DATABASE.find(d => d.id === m.pmbjpId) || lookupPmbjpDrug(m.brandName);
      return (m.isJanAushadhi && drug) ? drug.genericName : m.brandName;
    });

    const report = {
      patientName: patient.name,
      patientAbha: patient.abhaId,
      diagnosis: patient.diagnosis,
      icd10: 'E11.9',
      medications: medNames
    };

    downloadFhirJson(report);
    showToast('Sample health-record JSON (demo, unvalidated)');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="prescription-preview-container" style={{ padding: '36px 24px', maxWidth: '960px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#065F46',
          color: '#FFFFFF',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(6, 95, 70, 0.3)',
          zIndex: 9999,
          fontSize: '13.5px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} color="#34D399" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0F4C5C', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>
          <ArrowLeft size={16} />
          <span>Home</span>
        </Link>
        <span style={{ color: '#94A3B8' }}>/</span>
        <span style={{ color: '#081C24', fontSize: '13px', fontWeight: 700 }}>Sample generic prescription module</span>
      </div>

      {/* Demo Prescription Slip Top Banner */}
      {isDemoSlipRoute && (
        <div style={{
          background: '#722F37',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
          textAlign: 'center',
          fontWeight: 850,
          fontSize: '13.5px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          boxShadow: '0 4px 14px rgba(114, 47, 55, 0.25)'
        }}>
          Demo &#183; sample prescription slip
        </div>
      )}

      {/* Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#081C24', margin: 0 }}>
              Generic Prescription Demo
            </h1>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 800, 
              background: '#DCFCE7', 
              color: '#15803D', 
              padding: '4px 10px', 
              borderRadius: '12px',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CheckCircle2 size={13} />
              Sample formulary reference
            </span>
          </div>
          <p style={{ fontSize: '13.5px', color: '#698892', margin: 0 }}>
            Demo generic substitution using bundled sample prices. No live formulary, government verification, or guaranteed patient saving is claimed.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSpeakPrescription}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid #38BDF8',
              background: isSpeaking ? '#EF4444' : '#F0F9FF',
              color: isSpeaking ? '#FFFFFF' : '#0369A1',
              fontSize: '13px',
              fontWeight: 750,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Volume2 size={16} />
 <span>{isSpeaking ? 'Stop Audio': 'Listen (తెలుగు / Hindi)'}</span>
          </button>

          <button
            onClick={handleDownloadFhir}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              border: '1px solid #D0DFE2',
              background: '#FFFFFF',
              color: '#081C24',
              fontSize: '13px',
              fontWeight: 750,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={15} color="#0F4C5C" />
            <span>FHIR JSON</span>
          </button>

          <button
            onClick={handlePrint}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#0F4C5C',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.16)'
            }}
          >
            <Printer size={15} />
            <span>Print Rx Slip</span>
          </button>
        </div>
      </div>

      {/* Bundled sample generic-reference note: no prices or savings are shown
          because the bundled sample figures are unverified. */}
      <div style={{
        background: '#F0FDF4',
        color: '#064E3B',
        borderRadius: '16px',
        padding: '18px 22px',
        marginBottom: '28px',
        border: '1px solid #BBF7D0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        flexWrap: 'wrap'
      }}>
        <div style={{ maxWidth: '560px' }}>
          <h2 style={{ fontSize: 'clamp(16px, 4.5vw, 19px)', fontWeight: 900, margin: '0 0 6px 0', color: '#064E3B', overflowWrap: 'anywhere' }}>
            Sample generic references only — no prices shown
          </h2>
          <p style={{ fontSize: '13px', color: '#166534', margin: 0, lineHeight: 1.5 }}>
            Generic names below come from the bundled sample formulary and are not live-checked. Verify current prices, stock and eligibility at a Jan Aushadhi Kendra or with a pharmacist.
          </p>
        </div>
        <button
          onClick={handleSwitchAllToJanAushadhi}
          style={{
            padding: '12px 18px',
            borderRadius: '12px',
            border: '1px solid #059669',
            background: '#FFFFFF',
            color: '#065F46',
            fontSize: '13px',
            fontWeight: 850,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Sparkles size={16} />
          <span>Use sample generic references for all</span>
        </button>
      </div>

      {/* Search bundled generic samples */}
      <div style={{ 
        background: '#FFFFFF', 
        borderRadius: '14px', 
        border: '1px solid #D0DFE2', 
        padding: '18px 22px', 
        marginBottom: '24px',
        position: 'relative' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <Search size={16} color="#0F4C5C" />
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#081C24', textTransform: 'uppercase' }}>
            Search bundled generic samples:
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type drug name or brand (e.g., Telma, Atorva, Paracetamol, Metformin, Budesonide, Pantoprazole)..."
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1.5px solid #94A3B8',
              fontSize: '13.5px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#698892',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
 ✕
            </button>
          )}
        </div>

        {/* Live Search Autocomplete Dropdown */}
        {searchResults.length > 0 && (
          <div style={{
            marginTop: '10px',
            background: '#FFFFFF',
            border: '1px solid #D0DFE2',
            borderRadius: '10px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}>
            {searchResults.map(drug => (
              <div 
                key={drug.id}
                onClick={() => handleAddMedication(drug)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #F1F5F9',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
              >
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#081C24' }}>
                    {drug.genericName}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#698892', marginTop: '2px' }}>
                    Popular Brand: <strong>{drug.popularBrand}</strong> • Category: {drug.category} • Code: {drug.kendraCode}
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#698892' }}>Bundled sample reference; not live-checked</div>
                  </div>

                  <button
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#0F4C5C',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: 750,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

 {/* Prescription Document Sheet (Printable Format) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 750, color: '#486770' }}>Prescription Surface View:</span>
          <button
            onClick={() => setRxPadStyle('sketch')}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              border: rxPadStyle === 'sketch' ? '2px solid #0F4C5C' : '1px solid #CBD5E1',
              background: rxPadStyle === 'sketch' ? '#E6FFFA' : '#FFFFFF',
              color: rxPadStyle === 'sketch' ? '#0F4C5C' : '#64748B',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
 <span> Physical Rx Pad (Looseleaf)</span>
          </button>
          <button
            onClick={() => setRxPadStyle('clean')}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              border: rxPadStyle === 'clean' ? '2px solid #0F4C5C' : '1px solid #CBD5E1',
              background: rxPadStyle === 'clean' ? '#E6FFFA' : '#FFFFFF',
              color: rxPadStyle === 'clean' ? '#0F4C5C' : '#64748B',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
 <span> Digital EHR Card</span>
          </button>
        </div>
        <span style={{ fontSize: '11.5px', color: '#64748B' }}>
          {rxPadStyle === 'sketch' ? 'Hand-drawn notebook grid + doctor ink stamp' : 'Standard clinical card layout'}
        </span>
      </div>

      <div 
        id="prescription-sheet"
        className="prescription-sheet-card"
        style={{
          background: rxPadStyle === 'sketch' ? '#FAF8F3' : '#FFFFFF',
          backgroundImage: rxPadStyle === 'sketch' 
            ? `linear-gradient(to right, rgba(203, 194, 180, 0.28) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(203, 194, 180, 0.28) 1px, transparent 1px)`
            : 'none',
          backgroundSize: rxPadStyle === 'sketch' ? '22px 22px' : 'auto',
          borderRadius: '16px',
          border: rxPadStyle === 'sketch' ? '2.5px solid #292524' : '1px solid #D0DFE2',
          boxShadow: rxPadStyle === 'sketch' 
            ? '4px 6px 0px #292524, 0 16px 36px rgba(0,0,0,0.06)' 
            : '0 8px 30px rgba(0, 0, 0, 0.04)',
          padding: '36px',
          position: 'relative'
        }}
      >
        {rxPadStyle === 'sketch' && (
          <>
            <WashiTape color="#FDE047" angle="-3deg" width="100px" top="-12px" left="25%" />
            <WashiTape color="#93C5FD" angle="2.5deg" width="90px" top="-12px" left="75%" />
            <div style={{ position: 'absolute', top: '24px', right: '36px', zIndex: 10 }}>
              <InkStamp label="SAMPLE GENERIC MATCH" sublabel="SYNTHETIC DEMO" color="#047857" angle="-6deg" />
            </div>
          </>
        )}
        {/* Clinician Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0F4C5C', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#081C24', margin: '0 0 2px 0' }}>
              {patient.doctorName}
            </h2>
            <div style={{ fontSize: '13px', color: '#0F4C5C', fontWeight: 750 }}>
              {patient.doctorSpecialty}
            </div>
            <div style={{ fontSize: '11.5px', color: '#698892', marginTop: '2px' }}>
              Demo clinician ID: {patient.regNumber} • {patient.facilityName}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#081C24' }}>Date: {patient.date}</div>
            <div style={{ fontSize: '11px', color: '#698892', marginTop: '4px' }}>Local sample JSON #RX-2026-PMBJP-0941</div>
            <div style={{ fontSize: '10.5px', color: '#15803D', fontWeight: 750, marginTop: '2px' }}>
              Demo • no live formulary verification
            </div>
          </div>
        </div>

        {/* Patient Demographics */}
        <div style={{ 
          background: '#FAF8F5', 
          borderRadius: '12px', 
          padding: '16px', 
          marginBottom: '24px', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', 
          gap: '10px', 
          fontSize: '13px' 
        }}>
          <div>
            <span style={{ color: '#698892' }}>Patient Name: </span>
            <strong style={{ color: '#081C24' }}>{patient.name} ({patient.vernacularName})</strong>
          </div>
          <div>
            <span style={{ color: '#698892' }}>Age / Gender: </span>
            <strong style={{ color: '#081C24' }}>{patient.age}y / {patient.gender}</strong>
          </div>
          <div>
            <span style={{ color: '#698892' }}>Demo ABHA-style ID: </span>
            <strong style={{ color: '#081C24', fontFamily: 'monospace' }}>{patient.abhaId}</strong>
          </div>
          <div>
            <span style={{ color: '#698892' }}>Recorded Vitals: </span>
            <span style={{ color: '#081C24' }}>{patient.vitals}</span>
          </div>
        </div>

        {/* Sample clinical assessment */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#698892', textTransform: 'uppercase', marginBottom: '4px' }}>
            Sample Clinical Assessment:
          </div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#081C24' }}>
            {patient.diagnosis}
          </div>
        </div>

        {/* Prescription Table with PMBJP Switchers */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '26px', fontWeight: 900, color: '#0F4C5C', fontFamily: 'serif' }}>℞</span>
              <span style={{ fontSize: '14px', fontWeight: 850, color: '#081C24', textTransform: 'uppercase' }}>
                Medication Order & Sample Generic Mapping
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#698892' }}>
              {medications.length} Prescribed Medications
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {medications.map((med, idx) => {
              const drug = PMBJP_FORMULARY_DATABASE.find(d => d.id === med.pmbjpId) || lookupPmbjpDrug(med.brandName);
              const brandMrp = drug ? drug.brandedMrp : null;
              const janPrice = drug ? drug.janAushadhiPrice : null;
              const savings = drug ? drug.savingsPercent : null;

              return (
                <div 
                  key={med.id} 
                  style={{ 
                    border: rxPadStyle === 'sketch' 
                      ? (med.isJanAushadhi ? '2px solid #059669' : '2px dashed #78716C')
                      : (med.isJanAushadhi ? '1.5px solid #BBF7D0' : '1px solid #D0DFE2'), 
                    borderRadius: rxPadStyle === 'sketch' ? '14px' : '12px', 
                    padding: '16px 18px', 
                    background: med.isJanAushadhi ? '#F0FDF4' : '#FFFFFF',
                    boxShadow: rxPadStyle === 'sketch' ? '2px 3px 0px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14.5px', fontWeight: 850, color: '#081C24' }}>
                          {idx + 1}. {med.isJanAushadhi ? drug.genericName : med.brandName}
                        </span>
                        {med.isJanAushadhi && (
                          <span style={{ 
                            fontSize: '10.5px', 
                            background: '#DCFCE7', 
                            color: '#15803D', 
                            padding: '2px 8px', 
                            borderRadius: '6px', 
                            fontWeight: 800,
                            border: '1px solid #86EFAC'
                          }}>
                            Sample code #{drug.kendraCode}
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '12px', color: '#0F4C5C', fontWeight: 700, marginTop: '3px' }}>
                        {med.vernacular}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Price & Savings Badge */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10.5px', color: '#698892' }}>
                          {drug ? 'Bundled sample reference; not live-checked' : 'No bundled sample price reference'}
                        </div>
                      </div>

                      {/* Toggle Generic Button */}
                      <button
                        onClick={() => handleToggleJanAushadhi(med.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: med.isJanAushadhi ? '1px solid #059669' : '1px solid #D0DFE2',
                          background: med.isJanAushadhi ? '#ECFDF5' : '#F8FAFC',
                          color: med.isJanAushadhi ? '#065F46' : '#486770',
                          fontSize: '11.5px',
                          fontWeight: 750,
                          cursor: 'pointer'
                        }}
                      >
 {med.isJanAushadhi ? '✓ Sample generic': 'Switch to generic'}
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemoveMedication(med.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                        title="Remove drug"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#2C4A52', marginTop: '8px', borderTop: '1px dashed #D0DFE2', paddingTop: '8px' }}>
                    <strong>Dosage & Frequency:</strong> {med.dosage} • <strong>Timing:</strong> {med.timing} • <strong>Duration:</strong> {med.duration}
                  </div>

                  <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
                    Sample ceiling price: <strong>{drug.nlemCeiling}</strong> • Unit Pack: {drug.unit}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Doctor Signature & Dispense Stamp */}
        <div style={{ 
          borderTop: '2px solid #D0DFE2', 
          paddingTop: '20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <AuthenticQrCode 
              value={`${origin}/rx/DEMO-RX-001`}
              size={72}
              isDoctor={false}
              showCenterBadge={true}
            />
            <div>
              <div style={{ fontSize: '11.5px', color: '#059669', fontWeight: 750, marginBottom: '2px' }}>
                Sample generic price-comparison slip (demo)
              </div>
              <div style={{ fontSize: '11px', color: '#698892' }}>
                Opens a sample slip page for demo purposes.
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ borderBottom: '1px solid #0A2540', width: '200px', marginBottom: '4px' }} />
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#081C24' }}>{patient.doctorName}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
