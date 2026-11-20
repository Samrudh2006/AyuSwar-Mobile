import React, { useState, useEffect } from 'react';
import { CheckCircle2, Volume2, Flame, Droplets, Moon, Leaf } from 'lucide-react';

/**
 * PatientHealthGoalsTab — Daily Health Goals & Longitudinal Wellness Streaks
 * Extracted modular component for PatientPortal.
 */
export default function PatientHealthGoalsTab({
  assignedDoctor,
  activeDemoPatient,
  patientProfile,
  t
}) {
  // Goal states
  const [dailySteps, setDailySteps] = useState(6420);
  const stepsGoal = 10000;
  const [waterGlasses, setWaterGlasses] = useState(5);
  const waterGoal = 8;
  const adherenceStreak = 7;
  
  // Blood Pressure & Resting Pulse
  const [bpSystolic, setBpSystolic] = useState(118);
  const [bpDiastolic, setBpDiastolic] = useState(78);
  const [restingPulse, setRestingPulse] = useState(72);
  const [bpLogNotification, setBpLogNotification] = useState('');

  // Blood Sugar & Glycemic Control
  const [fastingSugar, setFastingSugar] = useState(96);
  const [postMealSugar, setPostMealSugar] = useState(128);
  const [sugarLogNotification, setSugarLogNotification] = useState('');

  // Circadian Sleep & Recovery
  const [sleepHours, setSleepHours] = useState(7.5);
  const deepSleepPercent = 24;
  const sleepScore = 88;

  // Respiratory Peak Expiratory Flow Rate (PEFR) - Asthma Green Zone
  const [peakFlowRate, setPeakFlowRate] = useState(460);
  const peakFlowPersonalBest = 520;

  // WHO Dietary Salt / Sodium Intake
  const [sodiumMg, setSodiumMg] = useState(1650);

  // Interactive Guided Pranayama / Anulom Vilom Breathing Exercise
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('Inhale'); // 'Inhale' | 'Hold' | 'Exhale'
  const [breathingTimer, setBreathingTimer] = useState(4);
  const [breathingCyclesCompleted, setBreathingCyclesCompleted] = useState(3);

  // Interactive Guided Breathing Timer Cycle
  useEffect(() => {
    let interval = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathingTimer(prev => {
          if (prev <= 1) {
            setBreathingPhase(currentPhase => {
              if (currentPhase === 'Inhale') return 'Hold';
              if (currentPhase === 'Hold') return 'Exhale';
              if (currentPhase === 'Exhale') {
                setBreathingCyclesCompleted(c => c + 1);
                return 'Inhale';
              }
              return 'Inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive]);

  const doctorName = assignedDoctor?.doctorName || 'Dr. Demo Clinician (synthetic)';
  const conditionName = activeDemoPatient?.primaryCondition || patientProfile?.condition || 'Asthma & Chronic Care';

  return (
    <div>
      {/* Header Banner */}
      <div style={{ 
        background: '#0F4C5C', 
        borderRadius: '20px', 
        padding: '24px 28px', 
        color: '#ffffff',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ 
              background: 'rgba(0, 0, 0, 0.16)', 
              padding: '4px 10px', 
              borderRadius: '20px', 
              fontSize: '11px', 
              fontWeight: 800, 
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.3)' 
            }}>
              {t('patient.goals.planBadge')}
            </span>
            <span style={{ fontSize: '12px', color: '#CFE3E8' }}>{t('patient.goals.supervisedBy')} {doctorName}</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-main)', margin: '0 0 6px 0', color: '#FFFFFF' }}>
            {t('patient.goals.heroTitle')}
          </h2>
          <p style={{ fontSize: '13px', color: '#F1F5F9', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
            {t('patient.goals.heroSub', { condition: conditionName })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', padding: '12px 18px', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '11px', color: '#F8FAFC', fontWeight: 700 }}>{t('patient.goals.dailyCompliance')} <span style={{ fontSize: '9px', opacity: 0.9 }}>{t('patient.goals.sampleTag')}</span></div>
            <div style={{ fontSize: '22px', fontWeight: 850, color: '#34D399' }}>94%</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', padding: '12px 18px', borderRadius: '14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.3)' }}>
            <div style={{ fontSize: '11px', color: '#F8FAFC', fontWeight: 700 }}>{t('patient.goals.activeStreak')}</div>
            <div style={{ fontSize: '22px', fontWeight: 850, color: '#FDE047' }}>{adherenceStreak} {t('patient.goals.days')} <Flame size={18} style={{ display: 'inline', verticalAlign: 'middle' }} /></div>
          </div>
        </div>
      </div>

      {/* Toast feedback if logged */}
      {(bpLogNotification || sugarLogNotification) && (
        <div style={{ 
          background: '#ECFDF5', 
          border: '1px solid #047857', 
          borderRadius: '12px', 
          padding: '12px 18px', 
          marginBottom: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          color: '#065F46',
          fontSize: '13px',
          fontWeight: 650
        }}>
          <CheckCircle2 size={18} color="#047857" />
          <span>{bpLogNotification || sugarLogNotification}</span>
        </div>
      )}

      {/* 3x3 Clinical Goals Grid */}
      <div className="patient-goals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', width: '100%' }}>
        
        {/* 1. Daily Walking & Steps Goal */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 750, color: '#081C24' }}>{t('patient.goals.physicalActivity')}</span>
              <span style={{ background: 'rgba(0, 0, 0, 0.07)', color: '#0F4C5C', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px' }}>
                {Math.round((dailySteps / stepsGoal) * 100)}% {t('patient.goals.reached')}
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 850, color: '#0F4C5C', margin: '4px 0 2px 0' }}>
              {dailySteps.toLocaleString()}
            </div>
            <div style={{ fontSize: '11.5px', color: '#52707C', marginBottom: '12px' }}>
              {t('patient.goals.target')} {stepsGoal.toLocaleString()} {t('patient.goals.steps')} • {(dailySteps * 0.00075).toFixed(1)} km • {Math.round(dailySteps * 0.038)} kcal
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '8px', background: '#FAF8F5', borderRadius: '6px', overflow: 'hidden', marginBottom: '14px' }}>
              <div style={{ width: `${Math.min(100, (dailySteps / stepsGoal) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #0F4C5C 0%, #2DD4BF 100%)', borderRadius: '6px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setDailySteps(s => s + 500)}
              style={{ flex: 1, background: '#FAF8F5', border: '1px solid #D0DFE2', borderRadius: '8px', padding: '6px', fontSize: '11.5px', fontWeight: 700, color: '#091E26', cursor: 'pointer' }}
            >
              +500 {t('patient.goals.steps')}
            </button>
            <button
              onClick={() => setDailySteps(s => s + 1000)}
              style={{ flex: 1, background: '#FAF8F5', border: '1px solid #D0DFE2', borderRadius: '8px', padding: '6px', fontSize: '11.5px', fontWeight: 700, color: '#091E26', cursor: 'pointer' }}
            >
              +1k {t('patient.goals.steps')}
            </button>
            <button
              onClick={() => setDailySteps(0)}
              style={{ background: '#FEE2E2', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '11.5px', fontWeight: 700, color: '#DC2626', cursor: 'pointer' }}
              title={t('patient.goals.resetDay')}
            >
              ↺
            </button>
          </div>
        </div>

        {/* 2. Smart Hydration Logger */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 750, color: '#081C24' }}>{t('patient.goals.hydration')}</span>
              <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#1D4ED8', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px' }}>
                {(waterGlasses * 0.25).toFixed(2)} / 2.0 Liters
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 850, color: '#1D4ED8', margin: '4px 0 2px 0' }}>
              {waterGlasses} <span style={{ fontSize: '18px', fontWeight: 600, color: '#52707C' }}>/ {waterGoal} {t('patient.goals.glasses')}</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#52707C', marginBottom: '12px' }}>
              {t('patient.goals.hydrationReco')}
            </div>

            {/* Visual 8 glasses row */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {Array.from({ length: 8 }).map((_, idx) => (
                <div 
                  key={idx}
                  style={{
                    flex: 1,
                    height: '24px',
                    borderRadius: '6px',
                    background: idx < waterGlasses ? '#3B82F6' : '#D0DFE2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800
                  }}
                >
                  <Droplets size={12} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setWaterGlasses(w => Math.min(12, w + 1))}
              style={{ flex: 2, background: 'rgba(59, 130, 246, 0.1)', color: '#1D4ED8', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', padding: '6px', fontSize: '11.5px', fontWeight: 750, cursor: 'pointer' }}
            >
              {t('patient.goals.logGlass')}
            </button>
            <button
              onClick={() => setWaterGlasses(w => Math.max(0, w - 1))}
              style={{ flex: 1, background: '#FAF8F5', border: '1px solid #D0DFE2', borderRadius: '8px', padding: '6px', fontSize: '11.5px', fontWeight: 700, color: '#52707C', cursor: 'pointer' }}
            >
              {t('patient.goals.minusGlass')}
            </button>
          </div>
        </div>

        {/* 3. Chronotherapy Pillbox Adherence Streak */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 750, color: '#081C24' }}>{t('patient.goals.chronoStreak')}</span>
              <span style={{ background: '#ECFDF5', color: '#047857', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px' }}>
                {t('patient.goals.onTime')}
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 850, color: '#047857', margin: '4px 0 2px 0' }}>
              {adherenceStreak} {t('patient.goals.days')} <Flame size={18} style={{ display: 'inline', verticalAlign: 'middle', color: '#F59E0B' }} />
            </div>
            <div style={{ fontSize: '11.5px', color: '#52707C', marginBottom: '12px' }}>
              {t('patient.goals.pillboxNote')}
            </div>

            {/* 7-day checklist */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', marginBottom: '14px' }}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} style={{ textAlign: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#047857', color: '#ffffff', fontSize: '12px', fontWeight: 850, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto' }}>
 ✓
                  </div>
                  <div style={{ fontSize: '10px', color: '#52707C', fontWeight: 700 }}>{day}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              alert('Audio Feedback: మీ మందుల క్రమం అద్భుతంగా ఉంది! డాక్టర్ ప్రియా గారు సూచించిన విధంగా అన్ని మందులు సమయానికి వేసుకుంటున్నారు.');
            }}
            style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '6px', fontSize: '11.5px', fontWeight: 750, color: '#166534', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Volume2 size={13} />
            <span>{t('patient.goals.hearPraise')}</span>
          </button>
        </div>

        {/* 4. Cardiovascular Blood Pressure & Resting Pulse */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 750, color: '#081C24' }}>{t('patient.goals.bpTitle')}</span>
              <span style={{ 
                background: bpSystolic < 120 && bpDiastolic < 80 ? '#ECFDF5' : '#FEF3C7', 
                color: bpSystolic < 120 && bpDiastolic < 80 ? '#047857' : '#B45309', 
                fontSize: '11px', 
                fontWeight: 800, 
                padding: '3px 8px', 
                borderRadius: '12px' 
              }}>
                {bpSystolic < 120 && bpDiastolic < 80 ? t('patient.goals.bpOptimal') : t('patient.goals.bpPre')}
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 850, color: '#081C24', margin: '4px 0 2px 0' }}>
              {bpSystolic} / {bpDiastolic} <span style={{ fontSize: '14px', color: '#52707C', fontWeight: 600 }}>mmHg</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#52707C', marginBottom: '12px' }}>
              {t('patient.goals.restingHr')}: <strong>{restingPulse} bpm</strong> {t('patient.goals.sampleValue')}
            </div>

            <div className="patient-bp-subgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px', width: '100%' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#52707C', fontWeight: 700 }}>{t('patient.goals.systolic')}</label>
                <input
                  type="number"
                  value={bpSystolic}
                  onChange={e => setBpSystolic(Number(e.target.value))}
                  style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #D0DFE2', fontSize: '12px', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#52707C', fontWeight: 700 }}>{t('patient.goals.diastolic')}</label>
                <input
                  type="number"
                  value={bpDiastolic}
                  onChange={e => setBpDiastolic(Number(e.target.value))}
                  style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #D0DFE2', fontSize: '12px', fontWeight: 700 }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#52707C', fontWeight: 700 }}>{t('patient.goals.pulse')}</label>
                <input
                  type="number"
                  value={restingPulse}
                  onChange={e => setRestingPulse(Number(e.target.value))}
                  style={{ width: '100%', padding: '4px 6px', borderRadius: '6px', border: '1px solid #D0DFE2', fontSize: '12px', fontWeight: 700 }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setBpLogNotification(`Vitals Logged: ${bpSystolic}/${bpDiastolic} mmHg at ${restingPulse} bpm recorded to ABHA.`);
              setTimeout(() => setBpLogNotification(''), 4000);
            }}
            style={{ background: '#0A2540', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '7px', fontSize: '11.5px', fontWeight: 750, cursor: 'pointer' }}
          >
            Log Vitals Reading
          </button>
        </div>

        {/* 5. Glycemic Fasting & Post-Meal Sugar Tracker */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 750, color: '#081C24' }}>{t('patient.goals.glucose')}</span>
              <span style={{ background: '#ECFDF5', color: '#047857', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px' }}>
                {t('patient.goals.bpOptimal')}
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 850, color: '#081C24', margin: '4px 0 2px 0' }}>
              {fastingSugar} <span style={{ fontSize: '13px', color: '#52707C', fontWeight: 600 }}>FBS</span> • {postMealSugar} <span style={{ fontSize: '13px', color: '#52707C', fontWeight: 600 }}>PPBS</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#52707C', marginBottom: '12px' }}>
              {t('patient.goals.target')} FBS &lt; 100 mg/dL • {t('patient.goals.estHbA1c')} <strong>5.6%</strong> {t('patient.goals.controlled')}
            </div>

            <div style={{ background: '#FAF8F5', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D0DFE2', fontSize: '11px', color: '#486770', marginBottom: '12px' }}>
              {t('patient.goals.fastingNote')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => {
                setFastingSugar(94);
                setSugarLogNotification(t('patient.goals.toastFasting'));
                setTimeout(() => setSugarLogNotification(''), 4000);
              }}
              style={{ flex: 1, background: '#FAF8F5', border: '1px solid #D0DFE2', borderRadius: '8px', padding: '6px', fontSize: '11px', fontWeight: 700, color: '#091E26', cursor: 'pointer' }}
            >
              {t('patient.goals.logFasting', { v: 94 })}
            </button>
            <button
              onClick={() => {
                setPostMealSugar(124);
                setSugarLogNotification(t('patient.goals.toastPostMeal'));
                setTimeout(() => setSugarLogNotification(''), 4000);
              }}
              style={{ flex: 1, background: '#FAF8F5', border: '1px solid #D0DFE2', borderRadius: '8px', padding: '6px', fontSize: '11px', fontWeight: 700, color: '#091E26', cursor: 'pointer' }}
            >
              {t('patient.goals.logPostMeal', { v: 124 })}
            </button>
          </div>
        </div>

        {/* 6. Circadian Sleep Duration & Nocturnal Recovery */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 750, color: '#081C24' }}>{t('patient.goals.sleepTitle')}</span>
              <span style={{ background: 'rgba(15, 76, 92, 0.1)', color: '#0F4C5C', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px' }}>
                {t('patient.goals.sleepQuality')}
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 850, color: '#0F4C5C', margin: '4px 0 2px 0' }}>
              {sleepHours} hrs <span style={{ fontSize: '14px', color: '#52707C', fontWeight: 600 }}>(Score: {sleepScore}/100)</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#52707C', marginBottom: '12px' }}>
              {t('patient.goals.deepSleep')} <strong>{deepSleepPercent}% (1h 48m)</strong> • {t('patient.goals.rem')} <strong>22%</strong> • {t('patient.goals.sleepDebt')} 0m
            </div>

            <div style={{ background: '#FAF8F5', padding: '8px 10px', borderRadius: '8px', border: '1px solid #D0DFE2', fontSize: '11px', color: '#0F4C5C', marginBottom: '12px' }}>
              <Moon size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /><strong>{t('patient.goals.sleepNoteTitle')}</strong> {t('patient.goals.sleepNoteBody')}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setSleepHours(h => +(h + 0.5).toFixed(1))}
              style={{ flex: 1, background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '6px', fontSize: '11.5px', fontWeight: 750, color: '#166534', cursor: 'pointer' }}
            >
              {t('patient.goals.sleepPlus30')}
            </button>
            <button
              onClick={() => setSleepHours(h => Math.max(4, +(h - 0.5).toFixed(1)))}
              style={{ flex: 1, background: '#FAF8F5', border: '1px solid #D0DFE2', borderRadius: '8px', padding: '6px', fontSize: '11.5px', fontWeight: 700, color: '#52707C', cursor: 'pointer' }}
            >
              {t('patient.goals.sleepMinus30')}
            </button>
          </div>
        </div>

        {/* 7. Respiratory Peak Flow Rate (PEFR) - Asthma Green Zone */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 750, color: '#081C24' }}>{t('patient.goals.pefr')}</span>
              <span style={{ 
                background: peakFlowRate >= 0.8 * peakFlowPersonalBest ? '#ECFDF5' : peakFlowRate >= 0.5 * peakFlowPersonalBest ? '#FEF3C7' : '#FEE2E2', 
                color: peakFlowRate >= 0.8 * peakFlowPersonalBest ? '#047857' : peakFlowRate >= 0.5 * peakFlowPersonalBest ? '#B45309' : '#DC2626', 
                fontSize: '11px', 
                fontWeight: 800, 
                padding: '3px 8px', 
                borderRadius: '12px' 
              }}>
                {peakFlowRate >= 0.8 * peakFlowPersonalBest ? t('patient.goals.greenZone') : peakFlowRate >= 0.5 * peakFlowPersonalBest ? t('patient.goals.yellowZone') : t('patient.goals.redZone')}
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 850, color: '#0F4C5C', margin: '4px 0 2px 0' }}>
              {peakFlowRate} <span style={{ fontSize: '14px', color: '#52707C', fontWeight: 600 }}>L/min</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#52707C', marginBottom: '12px' }}>
              {Math.round((peakFlowRate / peakFlowPersonalBest) * 100)}% {t('patient.goals.pefrNote', { best: peakFlowPersonalBest })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#52707C' }}>{t('patient.goals.adjust')}</span>
              <input 
                type="range" 
                min="250" 
                max="550" 
                step="10"
                value={peakFlowRate}
                onChange={e => setPeakFlowRate(Number(e.target.value))}
                aria-label="Adjust peak flow rate target in liters per minute"
                aria-valuemin={250}
                aria-valuemax={550}
                aria-valuenow={peakFlowRate}
                aria-valuetext={`${peakFlowRate} L/min`}
                style={{ flex: 1, accentColor: '#0F4C5C' }}
              />
            </div>
          </div>

          <div style={{ fontSize: '11px', color: '#065F46', background: 'rgba(16, 185, 129, 0.08)', padding: '6px 10px', borderRadius: '8px', fontWeight: 650 }}>
            {t('patient.goals.ginaNote')}
          </div>
        </div>

        {/* 8. WHO Dietary Sodium & Salt Restriction */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #D0DFE2', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 750, color: '#081C24' }}>{t('patient.goals.sodium')}</span>
              <span style={{ background: '#ECFDF5', color: '#047857', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px' }}>
                {t('patient.goals.safeRange')}
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 850, color: '#081C24', margin: '4px 0 2px 0' }}>
              {sodiumMg.toLocaleString()} <span style={{ fontSize: '14px', color: '#52707C', fontWeight: 600 }}>/ 2,000 mg max</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#52707C', marginBottom: '12px' }}>
              {t('patient.goals.sodiumEquiv')}
            </div>

            {/* Salt progress meter */}
            <div style={{ width: '100%', height: '8px', background: '#FAF8F5', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${(sodiumMg / 2000) * 100}%`, height: '100%', background: '#F59E0B', borderRadius: '6px' }} />
            </div>

            <div style={{ fontSize: '11px', color: '#486770', lineHeight: 1.4, marginBottom: '8px' }}>
              <Leaf size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /><strong>{t('patient.goals.dietNoteTitle')}</strong> {t('patient.goals.dietNoteBody')}
            </div>
          </div>

          <button
            onClick={() => setSodiumMg(prev => Math.min(2200, prev + 150))}
            style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', padding: '6px', fontSize: '11.5px', fontWeight: 700, color: '#B45309', cursor: 'pointer' }}
          >
            {t('patient.goals.logSnack')}
          </button>
        </div>

        {/* 9. Interactive Guided Pranayama & Box Breathing */}
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '2px solid #0F4C5C', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.06)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F4C5C' }}>{t('patient.goals.pranayama')}</span>
              <span style={{ background: isBreathingActive ? '#ECFDF5' : '#F1F5F9', color: isBreathingActive ? '#047857' : '#52707C', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px' }}>
                {isBreathingActive ? t('patient.goals.activeLive') : t('patient.goals.ready')}
              </span>
            </div>

            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              {/* Pulsating breathing circle */}
              <div style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: breathingPhase === 'Inhale' 
                  ? 'radial-gradient(circle, #2DD4BF 0%, #0F4C5C 100%)' 
                  : breathingPhase === 'Hold' 
                  ? 'radial-gradient(circle, #FBBF24 0%, #B45309 100%)' 
                  : 'radial-gradient(circle, #60A5FA 0%, #1D4ED8 100%)',
                color: '#ffffff',
                margin: '0 auto 10px auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isBreathingActive ? '0 0 25px rgba(0, 0, 0, 0.16)' : 'none',
                transition: 'all 0.5s ease',
                transform: breathingPhase === 'Inhale' ? 'scale(1.1)' : breathingPhase === 'Exhale' ? 'scale(0.92)' : 'scale(1.0)'
              }}>
                <span style={{ fontSize: '20px', fontWeight: 900 }}>{breathingTimer}s</span>
                <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>{breathingPhase === 'Inhale' ? t('patient.goals.phaseInhale') : breathingPhase === 'Hold' ? t('patient.goals.phaseHold') : t('patient.goals.phaseExhale')}</span>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 800, color: '#081C24' }}>
                {breathingPhase === 'Inhale' ? t('patient.goals.inhaleDeeply') : breathingPhase === 'Hold' ? t('patient.goals.holdBreath') : t('patient.goals.exhaleSlowly')}
              </div>
              <div style={{ fontSize: '11px', color: '#52707C', marginTop: '2px' }}>
                {t('patient.goals.cyclesInfo', { cycles: breathingCyclesCompleted })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setIsBreathingActive(a => !a)}
              style={{ 
                flex: 2, 
                background: isBreathingActive ? '#DC2626' : '#0F4C5C', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '8px', 
                padding: '7px', 
                fontSize: '11.5px', 
                fontWeight: 750, 
                cursor: 'pointer' 
              }}
            >
              {isBreathingActive ? t('patient.goals.pauseExercise') : t('patient.goals.startPranayama')}
            </button>
            <button
              onClick={() => {
                setIsBreathingActive(false);
                setBreathingPhase('Inhale');
                setBreathingTimer(4);
              }}
              style={{ flex: 1, background: '#FAF8F5', border: '1px solid #D0DFE2', borderRadius: '8px', padding: '7px', fontSize: '11.5px', fontWeight: 700, color: '#52707C', cursor: 'pointer' }}
            >
              {t('patient.goals.reset')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
