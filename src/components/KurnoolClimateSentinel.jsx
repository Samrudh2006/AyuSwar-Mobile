import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sun, 
  Wind, 
  Droplets, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Thermometer, 
  Activity 
} from 'lucide-react';

export default function KurnoolClimateSentinel({ onAddOrsToRx }) {
  const { t } = useApp();
  const [orsAddedToast, setOrsAddedToast] = useState(false);

  const handleAddOrs = () => {
    if (onAddOrsToRx) {
      onAddOrsToRx();
    }
    setOrsAddedToast(true);
    setTimeout(() => setOrsAddedToast(false), 3500);
  };

  return (
    <div style={{
      background: '#0F4C5C',
      borderRadius: '16px',
      padding: '16px 20px',
      color: '#ffffff',
      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.08)',
      marginBottom: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Subtle Wave Accents */}
      <div style={{
        position: 'absolute',
        right: '-20px',
        bottom: '-20px',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: 'rgba(0, 0, 0, 0.05)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.2)', color: '#7DD3FC', padding: '3px 8px', borderRadius: '8px', fontWeight: 800, letterSpacing: '0.5px' }}>
            {t('doctor.sentinel.title')}
          </span>
          <span style={{ fontSize: '11.5px', color: '#D0DFE2', fontWeight: 650 }}>
            {t('doctor.sentinel.hospital')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px 14px', fontSize: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FDE047', fontWeight: 700, whiteSpace: 'nowrap' }}>
            <Thermometer size={14} />
            <span>37°C ({t('doctor.sentinel.heatHigh')})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#34D399', fontWeight: 700, whiteSpace: 'nowrap' }}>
            <Wind size={14} />
            <span>AQI 38 ({t('doctor.sentinel.aqiGood')})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#BAE6FD', fontWeight: 700, whiteSpace: 'nowrap' }}>
            <Droplets size={14} />
            <span>{t('doctor.sentinel.humidity')} 41%</span>
          </div>
        </div>
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.07)',
        borderRadius: '12px',
        padding: '12px 14px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', maxWidth: '620px' }}>
          <AlertTriangle size={18} color="#FBBF24" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 750, color: '#FEF3C7' }}>
              {t('doctor.sentinel.advisoryTitle')}
            </div>
            <div style={{ fontSize: '11.5px', color: '#D0DFE2', marginTop: '2px', lineHeight: 1.4 }}>
              {t('doctor.sentinel.advisoryBody')}
            </div>
          </div>
        </div>

        <button
          onClick={handleAddOrs}
          style={{
            background: '#D4AF37',
            color: '#081C24',
            border: 'none',
            borderRadius: '10px',
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.14)',
            transition: 'all 0.15s ease'
          }}
        >
          <Plus size={14} />
          <span>{t('doctor.sentinel.addOrs')}</span>
        </button>
      </div>

      {orsAddedToast && (
        <div style={{
          marginTop: '10px',
          background: '#ECFDF5',
          color: '#065F46',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '11.5px',
          fontWeight: 750,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <CheckCircle2 size={14} color="#047857" />
          <span>{t('doctor.sentinel.orsToast')}</span>
        </div>
      )}
    </div>
  );
}

