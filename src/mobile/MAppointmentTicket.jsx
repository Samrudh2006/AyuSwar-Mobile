// MAppointmentTicket - OPD appointment ticket matching the user's navy/gold reference.
// Honesty rules (user requirement, Nov 20):
//  - Status reflects the actual local/request state only. Nothing here implies
//    hospital confirmation; no confirmation channel exists in this build.
//  - The QR carries ONLY the booking reference (no health details), so it is
//    purposeful (ticket lookup) and privacy-safe. It is not a registry claim.
//  - Sample fallback is labelled DEMO everywhere, including inside the print/PDF.
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { mt } from './mobileTranslations';

// Exact sample date resolved at render, never a floating "Tomorrow".
const sampleDate = () => new Date(Date.now() + 86400000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const SAMPLE_TICKET = {
  sample: true,
  patient: 'Lakshmi Amma',
  ageGender: '58 / F',
  bookingRef: 'AS-DEMO-CFFC',
  doctor: 'Dr. Demo Clinician (synthetic)',
  department: 'General Medicine (demo)',
  date: sampleDate(),
  time: '10:00 AM',
  mode: 'In-Person OPD',
  token: 'PUL-066',
  // No request is actually sent anywhere in this build; the status says so.
  status: 'Simulated demo status - no request was sent. A hospital would confirm a real slot.'
};

export default function MAppointmentTicket() {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointmentsQueue, setAppointmentsQueue, isDemoMode, patientProfile, selectedLanguage } = useApp();
  const t = key => mt(key, selectedLanguage);
  const [qrUrl, setQrUrl] = React.useState('');
  // Chosen queue entry: last by default, switchable via the chooser below.
  const [selectedIdx, setSelectedIdx] = React.useState(() => (Array.isArray(appointmentsQueue) && appointmentsQueue.length > 0 ? appointmentsQueue.length - 1 : -1));
  const [lookupRef, setLookupRef] = React.useState('');
  const [lookupMsg, setLookupMsg] = React.useState('');

  // Real local booking wins; otherwise a clearly labelled sample.
  const fromState = location.state?.ticket;
  const fromQueue = !fromState && Array.isArray(appointmentsQueue) && appointmentsQueue.length > 0
    ? appointmentsQueue[Math.min(Math.max(selectedIdx, 0), appointmentsQueue.length - 1)]
    : null;

  // Demo booking action: creates a SYNTHETIC queue entry locally and selects it.
  // Nothing is sent anywhere; the entry and ticket are both marked synthetic.
  const bookDemoSlot = () => {
    const n = (Array.isArray(appointmentsQueue) ? appointmentsQueue.length : 0) + 1;
    const entry = {
      id: `demo_appt_${100 + n}`,
      token: `DEMO-${100 + n}`,
      patientName: patientProfile?.name || `Demo Patient ${String(n).padStart(2, '0')}`,
      age: null,
      gender: '',
      doctorName: 'Dr. Demo Clinician (synthetic)',
      specialty: 'General Medicine (demo)',
      date: sampleDate(),
      time: '11:00 AM',
      status: 'Waiting',
      isSyntheticFixture: true
    };
    const next = [...(Array.isArray(appointmentsQueue) ? appointmentsQueue : []), entry];
    setAppointmentsQueue(next);
    setSelectedIdx(next.length - 1);
  };
  // Local lookup: resolve a booking reference (typed or scanned elsewhere)
  // against the queue stored on this device. Nothing leaves the device.
  const findTicket = (override) => {
    const ref = String(override ?? lookupRef).trim().replace(/^AYUSWAR-TICKET:/i, '');
    if (!ref || !Array.isArray(appointmentsQueue)) {
      setLookupMsg(t('No ticket with that reference is stored on this device.'));
      return;
    }
    const idx = appointmentsQueue.findIndex(a =>
      [a.bookingRef, a.id, a.token].filter(Boolean).some(v => String(v).toLowerCase() === ref.toLowerCase()));
    if (idx >= 0) {
      setSelectedIdx(idx);
      setLookupMsg(t('Ticket found on this device.'));
    } else {
      setLookupMsg(t('No ticket with that reference is stored on this device.'));
    }
  };

  // Scan route: decode a ticket QR from an image entirely on-device. Uses the
  // native BarcodeDetector where present, otherwise the bundled jsQR decoder
  // (pure JS, no network, no camera permission; the file picker opens the
  // camera on phones). A QR-less image says so instead of pretending to scan.
  const scanTicketImage = async (file) => {
    if (!file) return;
    try {
      let payload = '';
      if ('BarcodeDetector' in window) {
        const bmp = await createImageBitmap(file);
        const codes = await new window.BarcodeDetector({ formats: ['qr_code'] }).detect(bmp);
        payload = codes && codes[0] && codes[0].rawValue ? codes[0].rawValue : '';
      } else {
        const { default: jsQR } = await import('jsqr');
        const bmp = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        canvas.width = bmp.width;
        canvas.height = bmp.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bmp, 0, 0);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height);
        payload = code && code.data ? code.data : '';
      }
      if (!payload) {
        setLookupMsg(t('No QR code found in that image.'));
        return;
      }
      setLookupRef(payload);
      findTicket(payload);
    } catch {
      setLookupMsg(t('Could not read that image.'));
    }
  };

  // Exact date, never a floating "Today"/"Tomorrow" on a saved or printed ticket.
  const exactDate = d => (d === 'Today' || d === 'Tomorrow')
    ? new Date(Date.now() + (d === 'Tomorrow' ? 86400000 : 0)).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : d;
  const ticket = fromState || (fromQueue && {
    sample: false,
    synthetic: !!fromQueue.isSyntheticFixture,
    patient: fromQueue.patientName || patientProfile?.name || '',
    ageGender: fromQueue.ageGender || [fromQueue.age && `${fromQueue.age}`, fromQueue.gender].filter(Boolean).join(' / '),
    bookingRef: fromQueue.bookingRef || fromQueue.id || fromQueue.token || '',
    doctor: fromQueue.doctorName || '',
    department: fromQueue.department || fromQueue.specialty || '',
    date: exactDate(fromQueue.date || ''),
    time: fromQueue.time || '',
    mode: fromQueue.mode || 'In-Person OPD',
    token: fromQueue.token || '',
    status: fromQueue.isSyntheticFixture
      ? `${fromQueue.status || 'Waiting'} · synthetic demo queue entry - no hospital involved.`
      : (fromQueue.status || t('Request sent · hospital confirms'))
  }) || SAMPLE_TICKET;

  React.useEffect(() => {
    let alive = true;
    // Purposeful, privacy-safe payload: the booking reference only.
    QRCode.toDataURL(`AYUSWAR-TICKET:${ticket.bookingRef}`, { margin: 1, width: 220, color: { dark: '#12324F', light: '#FFFFFF' } })
      .then(url => { if (alive) setQrUrl(url); })
      .catch(() => { if (alive) setQrUrl(''); });
    return () => { alive = false; };
  }, [ticket.bookingRef]);

  return (
    <main className="m-page m-flow-page">
      <style>{`
        .m-tkt { background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 18px rgba(9,30,38,0.2); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .m-tkt-demo { background: #8A2A2A; color: #FFFFFF; text-align: center; font-size: 11px; font-weight: 800; letter-spacing: 0.6px; padding: 8px 10px; }
        .m-tkt-body { padding: 14px; }
        .m-tkt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .m-tkt-cell { background: #F4F6F8; border: 1px solid #E2E8EE; border-radius: 10px; padding: 8px 10px; }
        .m-tkt-cell h4 { margin: 0 0 3px; font-size: 10px; font-weight: 800; letter-spacing: 0.6px; color: #5B7183; text-transform: uppercase; }
        .m-tkt-cell p { margin: 0; font-size: 14.5px; font-weight: 700; color: #12324F; }
        .m-tkt-wide { grid-column: 1 / -1; }
        .m-tkt-token { background: #123A5C; border-radius: 10px; padding: 10px 12px; }
        .m-tkt-token h4 { color: #9FB8CC; }
        .m-tkt-token p { color: #FFFFFF; font-size: 19px; letter-spacing: 1px; }
        .m-tkt-status { background: #FBF4DF; border: 1px solid #EAD9A6; border-radius: 10px; padding: 10px 12px; }
        .m-tkt-status p { color: #B07E10; font-size: 13.5px; }
        .m-tkt-qr { text-align: center; margin: 14px 0 6px; }
        .m-tkt-qr img { width: 168px; height: 168px; border: 1.5px solid #E2E8EE; border-radius: 12px; padding: 6px; background: #FFFFFF; }
        .m-tkt-qr h5 { margin: 6px 0 2px; font-size: 13px; color: #12324F; }
        .m-tkt-qr p { margin: 0; font-size: 11px; color: #5B7183; line-height: 1.45; }
        .m-tkt-foot { margin-top: 12px; border-top: 1px dashed #C6D2DB; padding-top: 9px; font-size: 11px; color: #5B7183; line-height: 1.5; }
        .m-tkt-wrap { max-width: 420px; margin: 0 auto; }
        @media print {
          body * { visibility: hidden; }
          .m-tkt, .m-tkt * { visibility: visible; }
          .m-tkt-wrap { max-width: none; width: 620px; margin: 0; }
          .m-tkt { position: absolute; inset: 0 auto auto 0; width: 620px; box-shadow: none; }
          .m-tkt-cell p { font-size: 15px; white-space: normal; }
          .m-tkt-qr img { width: 190px; height: 190px; }
        }
      `}</style>

      <section className="m-tkt-wrap">
        {isDemoMode && !fromState && (!Array.isArray(appointmentsQueue) || appointmentsQueue.length === 0) && (
          <div style={{ marginBottom: 10 }}>
            <button className="m-btn m-btn-ghost" style={{ padding: '6px 10px', fontSize: 12, borderStyle: 'dashed' }} onClick={bookDemoSlot}>
              {t('+ Book demo slot (synthetic, stays on this device)')}
            </button>
          </div>
        )}
        {!fromState && Array.isArray(appointmentsQueue) && appointmentsQueue.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: '#5B7183', margin: '0 0 6px' }}>
              {t('Demo queue - choose the appointment for this ticket (synthetic entries):')}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {appointmentsQueue.map((a, i) => (
                <button key={a.id || i} className={i === selectedIdx ? 'm-btn m-btn-primary' : 'm-btn m-btn-ghost'} style={{ padding: '6px 10px', fontSize: 12 }}
                  onClick={() => setSelectedIdx(i)}>
                  {a.token || a.id}
                </button>
              ))}
              {isDemoMode && (
                <button className="m-btn m-btn-ghost" style={{ padding: '6px 10px', fontSize: 12, borderStyle: 'dashed' }} onClick={bookDemoSlot}>
                  {t('+ Book demo slot (synthetic, stays on this device)')}
                </button>
              )}
            </div>
          </div>
        )}
        <div className="m-tkt">
          <div className="m-tkt-demo">
            {ticket.sample || ticket.synthetic ? t('DEMO · SYNTHETIC PREVIEW · NOT A REAL HOSPITAL APPOINTMENT') : t('LOCAL BOOKING REQUEST · HOSPITAL CONFIRMATION PENDING')}
          </div>
          <div className="m-tkt-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <img src="/assets/ayuswar_official_logo.webp" alt="AyuSwar logo" style={{ width: 34, height: 34, objectFit: 'contain' }} />
              <strong style={{ color: '#12324F', fontSize: 14, letterSpacing: '0.4px' }}>AYUSWAR OPD TICKET</strong>
            </div>
            <div className="m-tkt-grid">
              <div className="m-tkt-cell">
                <h4>{ticket.sample ? t('Patient (sample)') : t('Patient')}</h4>
                <p>{[ticket.patient, ticket.ageGender].filter(Boolean).join(' · ') || '—'}</p>
              </div>
              <div className="m-tkt-cell">
                <h4>{t('Booking ref')}</h4>
                <p>{ticket.bookingRef || '—'}</p>
              </div>
              <div className="m-tkt-cell m-tkt-wide">
                <h4>{ticket.sample ? t('Doctor · Department (sample)') : t('Doctor · Department')}</h4>
                <p>{[ticket.doctor, ticket.department].filter(Boolean).join(' · ') || '—'}</p>
              </div>
              <div className="m-tkt-cell"><h4>{t('Date')}</h4><p>{ticket.date || '—'}</p></div>
              <div className="m-tkt-cell"><h4>{t('Time')}</h4><p>{ticket.time || '—'}</p></div>
              <div className="m-tkt-cell"><h4>{t('Mode')}</h4><p>{ticket.mode || '—'}</p></div>
              <div className="m-tkt-cell m-tkt-token"><h4>{t('OPD Token')}</h4><p>{ticket.token || '—'}</p></div>
              <div className="m-tkt-cell m-tkt-status m-tkt-wide" style={{ gridColumn: 'auto' }}><h4>{t('Status')}</h4><p>{ticket.status}</p></div>
            </div>
            <div className="m-tkt-qr">
              {qrUrl ? <img src={qrUrl} alt={`QR code carrying booking reference ${ticket.bookingRef}`} /> : <p>{t('QR unavailable on this device.')}</p>}
              <h5>{ticket.sample || ticket.synthetic ? t('Demo preview QR') : t('Ticket QR')}</h5>
              <p>{t('Carries only the booking reference. Scan or enter it below to find the matching ticket on this device. No health details stored in this code.')}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <input
                  type="text"
                  value={lookupRef}
                  onChange={e => setLookupRef(e.target.value)}
                  placeholder={t('Booking reference')}
                  aria-label={t('Booking reference')}
                  style={{ flex: 1, minWidth: 0, fontSize: 13, padding: '7px 10px', borderRadius: 8, border: '1px solid #C6D2DB' }}
                />
                <button className="m-btn m-btn-ghost" style={{ padding: '7px 12px', fontSize: 12.5, flex: 'none', width: 'auto' }} onClick={() => findTicket()}>
                  {t('Find ticket')}
                </button>
                <label className="m-btn m-btn-ghost" style={{ padding: '7px 12px', fontSize: 12.5, flex: 'none', width: 'auto', cursor: 'pointer' }}>
                  {t('Scan ticket image')}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={e => { scanTicketImage(e.target.files?.[0]); e.target.value = ''; }}
                  />
                </label>
              </div>
              {lookupMsg && <p role="status" style={{ margin: '6px 0 0', fontSize: 11.5, fontWeight: 700, color: '#12324F' }}>{lookupMsg}</p>}
            </div>
            <div className="m-tkt-foot">
              {ticket.sample
                ? t('Prototype ticket with sample details. A real ticket is issued only after the hospital confirms the slot. This image is a layout preview of the planned ticket.')
                : ticket.synthetic
                  ? t('This ticket renders the current synthetic demo queue entry. No booking was sent anywhere; a real ticket is issued only after a hospital confirms a slot.')
                  : t('This ticket shows a local booking request. It becomes valid only after the hospital confirms the slot. No confirmation has been received in this build.')}
            </div>
          </div>
        </div>

        <button className="m-btn m-btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={() => window.print()}>
          {t('Print / Save PDF')}
        </button>
        <button className="m-btn m-btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate(-1)}>{t('Back')}</button>
      </section>
    </main>
  );
}
