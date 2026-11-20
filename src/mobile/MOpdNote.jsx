// MOpdNote - editable structured OPD note built from the consultation draft.
// Visual target: the user's reference OPD sheet (AyuSwar Demo Clinic paper note).
// Rules honoured here (user requirement, Nov 20):
//  - Empty stays empty: nothing is invented; a field with no source text renders blank.
//  - Medication is never auto-filled.
//  - Save writes to local storage and the success state appears only after the
//    write actually resolves.
//  - Print/PDF renders a print-only mirror as wrapping text, so long values are
//    never clipped inside fixed-height textareas.
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { mt } from './mobileTranslations';
import { exportTextFile } from '../services/exportFileService';
// Kalam (OFL, Indian Type Foundry) - bundled so the handwritten style renders
// identically on every device, no runtime font download.
import kalamUrl from '../assets/fonts/Kalam-Regular.ttf';

const STORAGE_KEY = 'ayuswar.opdNote.draft.v2';

const TOP_FIELDS = [
  ['opdNo', 'OPD No:'],
  ['noteDate', 'Date:'],
  ['patientName', 'Patient:'],
  ['ageGender', 'Age / Sex:']
];

const SECTIONS = [
  ['chiefComplaints', 'Chief complaints:'],
  ['history', 'History:'],
  ['vitals', 'Vitals:'],
  ['examination', 'Examination:'],
  ['assessment', 'Assessment:'],
  ['advice', 'Advice:'],
  ['medication', 'Medication:'],
  ['followUp', 'Follow-up:']
];

function buildInitial(state, doctorProfile) {
  const encounter = state?.encounter;
  const soap = state?.soap || null;
  const p = encounter?.patient || {};
  const ageGender = [p.age ? `${p.age} years` : '', p.gender || ''].filter(Boolean).join(' / ');
  return {
    opdNo: encounter?.token || p.token || '',
    noteDate: new Date().toLocaleDateString('en-IN'),
    patientName: p.name || '',
    ageGender,
    chiefComplaints: soap?.subjective || '',
    history: '',
    vitals: '',
    examination: soap?.objective || '',
    assessment: soap?.assessment || '',
    advice: soap?.plan || '',
    medication: '',
    followUp: '',
    doctorName: doctorProfile?.doctorName || p.doctorName || ''
  };
}

export default function MOpdNote() {
  const navigate = useNavigate();
  const location = useLocation();
  const { doctorProfile, selectedLanguage } = useApp();
  const t = key => mt(key, selectedLanguage);
  const state = location.state || null;

  const [note, setNote] = React.useState(() => {
    if (state?.soap || state?.encounter) return buildInitial(state, doctorProfile);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') return { ...buildInitial(null, doctorProfile), ...saved.note };
    } catch { /* corrupt draft: start blank */ }
    return buildInitial(null, doctorProfile);
  });
  const [handwritten, setHandwritten] = React.useState(true); // reference sheet is handwritten by default
  const [saveState, setSaveState] = React.useState('idle'); // idle | saving | saved | failed
  const [exportState, setExportState] = React.useState('');

  const isDemoSource = !state?.encounter || state?.sourceMode === 'sample';

  const setField = (key, value) => {
    setNote(prev => ({ ...prev, [key]: value }));
    if (saveState === 'saved') setSaveState('idle');
  };

  // Save is a real local write; the success banner appears only after it resolves.
  const saveNote = () => {
    setSaveState('saving');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ note, savedAt: new Date().toISOString(), sourceMode: state?.sourceMode || 'manual' }));
      setSaveState('saved');
    } catch {
      setSaveState('failed');
    }
  };

  const noteText = () => {
    const lines = ['AYUSWAR DEMO CLINIC - OPD consultation note (draft)', ''];
    TOP_FIELDS.forEach(([key, label]) => lines.push(`${label.replace(':', '')}: ${note[key] || ''}`));
    SECTIONS.forEach(([key, label]) => lines.push(`${label.replace(':', '')}: ${note[key] || ''}`));
    lines.push(`Doctor: ${note.doctorName || ''}`, '', 'SYNTHETIC DEMO - NOT A REAL PATIENT RECORD. NOT A VALID PRESCRIPTION.');
    return lines.join('\n');
  };

  const exportNote = async () => {
    setExportState('');
    try {
      const result = await exportTextFile({ filename: `opd-note-${note.opdNo || 'draft'}.txt`, text: noteText(), mime: 'text/plain', shareTitle: 'OPD note draft' });
      setExportState(result.mode === 'native-share-sheet' ? t('Opened the share sheet.') : t('Downloaded as a text file.'));
    } catch {
      setExportState(t('Export failed on this device. The note text is unchanged.'));
    }
  };

  const inkClass = handwritten ? 'm-opd-hand' : '';

  return (
    <main className="m-page m-flow-page">
      <style>{`
        @font-face { font-family: 'Kalam'; src: url(${kalamUrl}) format('truetype'); font-weight: 400; }
        .m-opd-sheet { background: #FFFFFF; border-radius: 6px; padding: 16px 14px 12px; box-shadow: 0 3px 14px rgba(9,30,38,0.18); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .m-opd-head { display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #2A7F8E; padding-bottom: 8px; }
        .m-opd-head img { width: 52px; height: 52px; object-fit: contain; }
        .m-opd-head h3 { margin: 0; color: #12324F; font-size: 17px; font-weight: 900; letter-spacing: 0.5px; }
        .m-opd-head p { margin: 1px 0 0; color: #12324F; font-size: 12px; font-weight: 600; }
        .m-opd-toprow { display: flex; align-items: baseline; gap: 6px; margin: 7px 0 0; }
        .m-opd-toprow > span { flex: none; font-size: 12.5px; font-weight: 800; color: #12324F; }
        .m-opd-pair { display: flex; gap: 14px; }
        .m-opd-pair .m-opd-toprow { flex: 1 1 0; min-width: 0; }
        .m-opd-sheet.m-opd-hand .m-opd-toprow input, .m-opd-sheet.m-opd-hand .m-opd-sec textarea, .m-opd-sheet.m-opd-hand .m-opd-pval { font-family: 'Kalam','Segoe Script','Comic Sans MS',cursive; font-size: 18px; color: #1E3FAE; }
        .m-opd-toprow input { flex: 1 1 auto; min-width: 0; font-size: 14.5px; color: #233043; background: transparent; border: none; border-bottom: 1px dashed #B9C8CE; padding: 1px 2px; }
        .m-opd-sec { margin-top: 12px; }
        .m-opd-sec > span { display: inline-block; background: #C7E5E0; color: #12324F; font-size: 12px; font-weight: 800; padding: 2px 10px; border-radius: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .m-opd-sec textarea { display: block; width: 100%; box-sizing: border-box; margin-top: 4px; font-size: 14.5px; color: #233043; background: transparent; border: none; padding: 1px 2px 4px 14px; resize: vertical; }
        .m-opd-sheet input:focus, .m-opd-sheet textarea:focus { outline: 1.5px solid #2A7F8E; border-radius: 4px; }
        .m-opd-foot { border-top: 2px solid #2A7F8E; margin-top: 14px; padding-top: 7px; text-align: center; color: #12324F; font-size: 10.5px; font-weight: 800; letter-spacing: 0.4px; }
        .m-opd-printonly { display: none; }
        .m-opd-printonly .m-opd-sec p { margin: 4px 0 4px 14px; font-size: 14.5px; color: #233043; white-space: pre-wrap; word-break: break-word; min-height: 1em; }
        .m-opd-printonly .m-opd-pval { font-size: 14.5px; color: #233043; white-space: pre-wrap; word-break: break-word; }
        @media print {
          body * { visibility: hidden; }
          .m-opd-sheet, .m-opd-sheet * { visibility: visible; }
          .m-opd-sheet { position: absolute; inset: 0 auto auto 0; width: 100%; box-shadow: none; }
          .m-opd-form { display: none; }
          .m-opd-printonly { display: block; }
        }
      `}</style>

      <section className="m-card m-card-pad m-tint-mint">
        <h2 className="m-steps-title">{t('Structured OPD note')}</h2>
        <p style={{ fontSize: '13px', margin: '4px 0 10px' }}>
          {t('Draft for clinician review - not a medical record. Empty fields stay blank; nothing is auto-filled. Medication is never suggested.')}
        </p>
        {isDemoSource && (
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#8A5A00', margin: '0 0 10px' }}>
            {t('Source: synthetic demo consultation. Not a real patient record.')}
          </p>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <button className="m-btn m-btn-ghost" onClick={() => setHandwritten(h => !h)}>
            {handwritten ? t('Standard text style') : t('Handwritten style')}
          </button>
          <button className="m-btn m-btn-primary" onClick={saveNote} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? t('Saving...') : t('Save note')}
          </button>
          <button className="m-btn m-btn-ghost" onClick={() => window.print()}>{t('Print / Save PDF')}</button>
          <button className="m-btn m-btn-ghost" onClick={exportNote}>{t('Export text')}</button>
        </div>
        <div aria-live="polite" style={{ fontSize: '12.5px', minHeight: 18, marginBottom: 8 }}>
          {saveState === 'saved' && t('Saved on this device.')}
          {saveState === 'failed' && t('Save failed - browser storage refused the write. Your text is still on screen.')}
          {exportState}
        </div>

        <div className={`m-opd-sheet ${inkClass}`}>
          <div className="m-opd-head">
            <img src="/assets/ayuswar_official_logo.webp" alt="AyuSwar logo" />
            <div>
              <h3>AYUSWAR DEMO CLINIC</h3>
              <p>{t('Fictional OPD consultation note')}</p>
            </div>
          </div>

          {/* On-screen editable form */}
          <div className="m-opd-form">
            <div className="m-opd-pair">
              {TOP_FIELDS.slice(0, 2).map(([key, label]) => (
                <label key={key} className="m-opd-toprow">
                  <span>{t(label)}</span>
                  <input type="text" value={note[key]} onChange={e => setField(key, e.target.value)} />
                </label>
              ))}
            </div>
            {TOP_FIELDS.slice(2).map(([key, label]) => (
              <label key={key} className="m-opd-toprow">
                <span>{t(label)}</span>
                <input type="text" value={note[key]} onChange={e => setField(key, e.target.value)} />
              </label>
            ))}
            {SECTIONS.map(([key, label]) => (
              <label key={key} className="m-opd-sec">
                <span>{t(label)}</span>
                <textarea rows={key === 'medication' ? 1 : 2} value={note[key]} onChange={e => setField(key, e.target.value)} />
              </label>
            ))}
            <label className="m-opd-toprow" style={{ marginTop: 12 }}>
              <span>{t('Doctor:')}</span>
              <input type="text" value={note.doctorName} onChange={e => setField('doctorName', e.target.value)} />
            </label>
          </div>

          {/* Print mirror: same values as wrapping text so nothing clips in PDF */}
          <div className="m-opd-printonly" aria-hidden="true">
            <div className="m-opd-pair">
              {TOP_FIELDS.slice(0, 2).map(([key, label]) => (
                <div key={key} className="m-opd-toprow"><span>{t(label)}</span><span className="m-opd-pval">{note[key]}</span></div>
              ))}
            </div>
            {TOP_FIELDS.slice(2).map(([key, label]) => (
              <div key={key} className="m-opd-toprow"><span>{t(label)}</span><span className="m-opd-pval">{note[key]}</span></div>
            ))}
            {SECTIONS.map(([key, label]) => (
              <div key={key} className="m-opd-sec"><span>{t(label)}</span><p className="m-opd-pval">{note[key]}</p></div>
            ))}
            <div className="m-opd-toprow" style={{ marginTop: 12 }}><span>{t('Doctor:')}</span><span className="m-opd-pval">{note.doctorName}</span></div>
          </div>

          <div className="m-opd-foot">
            {t('SYNTHETIC DEMO - NOT A REAL PATIENT RECORD')}<br />{t('NOT A VALID PRESCRIPTION')}
          </div>
        </div>
      </section>

      <button className="m-btn m-btn-ghost" style={{ marginTop: 10 }} onClick={() => navigate(-1)}>{t('Back')}</button>
    </main>
  );
}
