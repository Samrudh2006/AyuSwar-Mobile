import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Wind, Database, ShieldCheck } from 'lucide-react';
import { fetchLivePhcEnvironmentalData, fetchLiveDrugLabel, fetchLiveIcd10Codes } from '../services/liveMedicalDataService';

/**
 * LiveTelemetryBadge Component
 * Shows actual public reference-data lookup status using synthetic queries only.
 * Reference data is not clinical advice, patient-specific verification, or a registry transaction.
 */
export default function LiveTelemetryBadge({ location = 'kurnool', compact = false, style = {} }) {
  const { t } = useApp();
  const [telemetry, setTelemetry] = useState(null);
  const [referenceStatus, setReferenceStatus] = useState({ icd: null, drug: null });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const [env, icd, drug] = await Promise.all([
        fetchLivePhcEnvironmentalData(location).catch(() => null),
        fetchLiveIcd10Codes('asthma', 3).catch(() => null),
        fetchLiveDrugLabel('metformin').catch(() => null)
      ]);
      if (isMounted) {
        setTelemetry(env);
        setReferenceStatus({ icd, drug });
      }
    }

    loadData();
    const interval = setInterval(loadData, 3 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location]);

  const statusText = service => (service ? (service.isLive ? t('telemetry.stLive') : t('telemetry.stUnavail')) : t('telemetry.stChecking'));
  const statusColor = service => (service?.isLive ? '#86EFAC' : '#FDE68A');
  const compactTitle = telemetry
    ? `${telemetry.locationName}: AQI ${telemetry.aqi}, PM2.5 ${telemetry.pm25}. ${telemetry.alertMsg} Source: ${telemetry.source}`
    : 'Checking public reference-data services...';

  if (compact) {
    return (
      <div
        title={compactTitle}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '2px 8px',
          borderRadius: '20px',
          fontSize: '11px',
          color: '#065F46',
          fontFamily: 'var(--font-main)',
          fontWeight: 700,
          userSelect: 'none',
          ...style
        }}
      >
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: telemetry?.isLive ? '#047857' : '#B45309', display: 'inline-block' }}></span>
        <Wind size={11} color="#047857" />
        <span>{t('telemetry.pubAqi')}</span>
        <strong style={{ color: '#047857' }}>{telemetry ? telemetry.aqi : '...'}</strong>
        <span style={{ fontSize: '10px', opacity: 0.85 }}>{telemetry?.isLive ? t('telemetry.live') : t('telemetry.offline')}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        background: '#0D3B47',
        color: '#ffffff',
        padding: '7px 14px',
        borderRadius: '10px',
        fontSize: '11.5px',
        fontFamily: 'var(--font-main)',
        border: '1px solid rgba(45, 212, 191, 0.35)',
        ...style
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: telemetry?.isLive ? '#2DD4BF' : '#F59E0B', display: 'inline-block' }}></span>
          <span style={{ fontWeight: 800, color: '#2DD4BF', textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '10.5px' }}>
            {t('telemetry.pubRefData')}
          </span>
        </div>
        <span style={{ opacity: 0.4 }}>|</span>
        <div title={telemetry?.alertMsg || 'Public environmental reference data'} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Wind size={12} color="#FDE047" />
          <span style={{ color: '#D0DFE2' }}>{telemetry?.locationName || t('telemetry.sampleRegion')} {t('telemetry.aqiLabel')}</span>
          <strong style={{ color: telemetry?.riskColor || '#2DD4BF', fontFamily: 'monospace' }}>{telemetry ? telemetry.aqi : '--'}</strong>
          {telemetry && <span style={{ fontSize: '10.5px', color: '#B9CDD3' }}>({telemetry.isLive ? t('telemetry.liveMs', { ms: telemetry.latencyMs }) : t('telemetry.offlineFallback')})</span>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '11px' }}>
        <div title="Synthetic terminology query against the public NLM Clinical Tables API" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#C4DCF5' }}>
          <Database size={11} color="#60A5FA" />
          <span>{t('telemetry.nlmRef')}</span>
          <span style={{ color: statusColor(referenceStatus.icd), fontWeight: 700 }}>{statusText(referenceStatus.icd)}</span>
        </div>
        <span style={{ opacity: 0.3 }}>•</span>
        <div title="Synthetic drug-label query against the public openFDA API; openFDA data is unvalidated" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D0DFE2' }}>
          <ShieldCheck size={11} color="#34D399" />
          <span>{t('telemetry.openfdaRef')}</span>
          <span style={{ color: statusColor(referenceStatus.drug), fontWeight: 700 }}>{statusText(referenceStatus.drug)}</span>
        </div>
      </div>
    </div>
  );
}
