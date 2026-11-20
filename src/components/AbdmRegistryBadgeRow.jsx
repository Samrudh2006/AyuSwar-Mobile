import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Stethoscope, Building2, Tag, Copy, Check } from 'lucide-react';

/**
 * AbdmRegistryBadgeRow Component
 * Synthetic registry-style identifiers and clinical coding display.
 * 
 * Renders clearly labelled synthetic badges for sample IDs and draft coding candidates. No registry lookup, verification, or official code assignment is performed.
 */
export default function AbdmRegistryBadgeRow({
  abhaNumber,
  abhaAddress,
  hprId = 'DEMO-HPR-99824',
  doctorName = 'Dr. Demo Clinician (synthetic)',
  hfrId = 'DEMO-HFR-0042',
  facilityName = 'Synthetic rural clinic',
  icd10,
  icd10Desc,
  snomedCt,
  snomedDesc,
  compact = false,
  onToast = null,
  style = {}
}) {
  const { t } = useApp();
  const [copiedKey, setCopiedKey] = useState(null);

  // Normalize ABHA value
  const cleanAbha = abhaNumber || 'DEMO-HEALTH-ID';
  const cleanAddress = abhaAddress || 'demo@example.test';

  const handleCopy = (e, key, label, value, detail) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(value);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
      if (onToast) {
 onToast(`✓ Copied ${label}: ${value} ${detail ? `(${detail})`: ''}`);
      }
    } catch {
      // Fallback
      if (onToast) {
        onToast(`${label}: ${value}`);
      }
    }
  };

  const badgeBase = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: compact ? '3px' : '5px',
    fontSize: compact ? '10.5px' : '11px',
    fontFamily: 'monospace',
    fontWeight: 700,
    padding: compact ? '2px 6px' : '3px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    userSelect: 'none',
    lineHeight: '1.3'
  };

  return (
    <div
      className="abdm-registry-badge-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: compact ? '4px' : '6px',
        flexWrap: 'wrap',
        ...style
      }}
      title="Synthetic sample identifiers - not verified against any registry"
    >
      {/* 1. Sample health ID badge */}
      <div
        onClick={(e) => handleCopy(e, 'abha', 'Sample health ID', cleanAbha, cleanAddress)}
        title={`Sample health ID: ${cleanAbha} • ${cleanAddress} • Click to copy`}
        style={{
          ...badgeBase,
          background: copiedKey === 'abha' ? '#DCFCE7' : 'rgba(16, 185, 129, 0.08)',
          color: '#065F46',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 1px 2px rgba(16, 185, 129, 0.05)'
        }}
      >
        <ShieldCheck size={compact ? 11 : 12} color="#047857" />
        <span>{t('abdm.badge.sampleId')}</span>
        <strong style={{ color: '#047857' }}>{cleanAbha}</strong>
        {!compact && cleanAddress && (
          <span style={{ color: '#047857', opacity: 0.85, fontSize: '10px' }}>
            ({cleanAddress})
          </span>
        )}
        {copiedKey === 'abha' ? <Check size={11} color="#047857" /> : <Copy size={9} opacity={0.5} />}
      </div>

      {/* 2. Demo clinician ID */}
      <div
        onClick={(e) => handleCopy(e, 'hpr', 'Demo clinician ID', hprId, doctorName)}
        title={`Demo clinician ID: ${hprId} • ${doctorName} • Click to copy`}
        style={{
          ...badgeBase,
          background: copiedKey === 'hpr' ? '#CCFBF1' : 'rgba(0, 0, 0, 0.04)',
          color: '#0F4C5C',
          border: '1px solid rgba(0, 0, 0, 0.15)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)'
        }}
      >
        <Stethoscope size={compact ? 11 : 12} color="#0F4C5C" />
        <span>{t('abdm.badge.demoClinician')}</span>
        <strong style={{ color: '#0B3B48' }}>{hprId}</strong>
        {copiedKey === 'hpr' ? <Check size={11} color="#0F4C5C" /> : <Copy size={9} opacity={0.5} />}
      </div>

      {/* 3. Demo facility ID */}
      <div
        onClick={(e) => handleCopy(e, 'hfr', 'Demo facility ID', hfrId, facilityName)}
        title={`Demo facility ID: ${hfrId} • ${facilityName} • Click to copy`}
        style={{
          ...badgeBase,
          background: copiedKey === 'hfr' ? '#FEF3C7' : 'rgba(217, 119, 6, 0.08)',
          color: '#92400E',
          border: '1px solid rgba(217, 119, 6, 0.25)',
          boxShadow: '0 1px 2px rgba(217, 119, 6, 0.05)'
        }}
      >
        <Building2 size={compact ? 11 : 12} color="#B45309" />
        <span>{t('abdm.badge.demoFacility')}</span>
        <strong style={{ color: '#78350F' }}>{hfrId}</strong>
        {copiedKey === 'hfr' ? <Check size={11} color="#92400E" /> : <Copy size={9} opacity={0.5} />}
      </div>

      {/* 4. Draft coding candidate */}
      {icd10 && (
        <div
          onClick={(e) => handleCopy(e, 'icd10', 'Draft code candidate', icd10, icd10Desc)}
          title={`Draft code candidate: ${icd10} — ${icd10Desc || 'Review required'} • Click to copy`}
          style={{
            ...badgeBase,
            background: copiedKey === 'icd10' ? '#DBEAFE' : '#EFF6FF',
            color: '#1E40AF',
            border: '1px solid #BFDBFE',
            boxShadow: '0 1px 2px rgba(30, 64, 175, 0.05)'
          }}
        >
          <Tag size={compact ? 11 : 12} color="#1D4ED8" />
          <span>{t('abdm.badge.draftCode')}</span>
          <strong style={{ color: '#1D4ED8' }}>{icd10}</strong>
          {copiedKey === 'icd10' ? <Check size={11} color="#1D4ED8" /> : <Copy size={9} opacity={0.5} />}
        </div>
      )}

      {/* 5. Draft terminology candidate */}
      {snomedCt && (
        <div
          onClick={(e) => handleCopy(e, 'snomed', 'Draft terminology candidate', snomedCt, snomedDesc)}
          title={`Draft terminology candidate: ${snomedCt} — ${snomedDesc || 'Review required'} • Click to copy`}
          style={{
            ...badgeBase,
            background: copiedKey === 'snomed' ? '#F3E8FF' : '#FAF5FF',
            color: '#6B21A8',
            border: '1px solid #E9D5FF',
            boxShadow: '0 1px 2px rgba(107, 33, 168, 0.05)'
          }}
        >
          <span>{t('abdm.badge.draftTerm')}</span>
          <strong style={{ color: '#581C87' }}>{snomedCt}</strong>
          {copiedKey === 'snomed' ? <Check size={11} color="#6B21A8" /> : <Copy size={9} opacity={0.5} />}
        </div>
      )}
    </div>
  );
}

