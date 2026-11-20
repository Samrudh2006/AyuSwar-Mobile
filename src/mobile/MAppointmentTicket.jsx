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

const SAMPLE_TICKET = {
  sample: true,
  patient: 'Lakshmi Amma',
  ageGender: '58 / F',
  bookingRef: 'AS-DEMO-CFFC',
  doctor: 'Dr. Demo Clinician (synthetic)',
  department: 'General Medicine (demo)',
  date: 'Tomorrow',
  time: '10:00 AM',
  mode: 'In-Person OPD',
  token: 'PUL-066',
  status: 'Request sent · hospital confirms'
};

export default function MAppointmentTicket() {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointmentsQueue, patientProfile, selectedLanguage } = useApp();
  const t = key => mt(key, selectedLanguage);
  const [qrUrl, setQrUrl] = React.useState('');

  // Real local booking wins; otherwise a clearly labelled sample.
  const fromState = location.state?.ticket;
  const fromQueue = Array.isArray(appointmentsQueue) && appointmentsQueue.length > 0 ? appointmentsQueue[appointmentsQueue.length - 1] : null;
  const ticket = fromState || (fromQueue && {
    sample: false,
    patient: fromQueue.patientName || patientProfile?.name || '',
    ageGender: fromQueue.ageGender || '',
    bookingRef: fromQueue.bookingRef || fromQueue.id || fromQueue.token || '',
    doctor: fromQueue.doctorName || '',
    department: fromQueue.department || '',
    date: fromQueue.date || '',
    time: fromQueue.time || '',
    mode: fromQueue.mode || '',
    token: fromQueue.token || '',
    status: fromQueue.status || t('Request sent · hospital confirms')
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
        @media print {
          body * { visibility: hidden; }
          .m-tkt, .m-tkt * { visibility: visible; }
          .m-tkt { position: absolute; inset: 0 auto auto 0; width: 100%; box-shadow: none; }
        }
      `}</style>

      <section style={{ maxWidth: 420, margin: '0 auto' }}>
        <div className="m-tkt">
          <div className="m-tkt-demo">
            {ticket.sample ? t('DEMO · PROTOTYPE PREVIEW · NOT A REAL HOSPITAL APPOINTMENT') : t('LOCAL BOOKING REQUEST · HOSPITAL CONFIRMATION PENDING')}
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
              <h5>{ticket.sample ? t('Demo preview QR') : t('Ticket QR')}</h5>
              <p>{t('Carries only the booking reference for ticket lookup. No health details stored in this code.')}</p>
            </div>
            <div className="m-tkt-foot">
              {ticket.sample
                ? t('Prototype ticket with sample details. A real ticket is issued only after the hospital confirms the slot. This image is a layout preview of the planned ticket.')
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
