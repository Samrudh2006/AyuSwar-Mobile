// AyuSwar Mobile — optional PIN app lock overlay + settings.
// Synthetic practice data only; this deters casual access on a shared clinic
// phone. It is WebView-local (PBKDF2 hash in localStorage), NOT
// Android-Keystore-backed, and no biometric claim is made.
import React from 'react';
import { enableAppLock, disableAppLock, verifyAppLock, isAppLockEnabled } from './appLock';

const COPY = {
  'en-IN': {
    lockTitle: 'App locked', lockBody: 'Enter the app PIN to continue.', unlock: 'Unlock',
    wrongPin: 'Incorrect PIN. Try again.',
    settingsTitle: 'App lock', setPin: 'Set a 4-6 digit PIN', confirmPin: 'Confirm PIN',
    enable: 'Turn on app lock', disable: 'Turn off app lock', enterCurrent: 'Enter current PIN to turn off',
    mismatch: 'PINs do not match.', enabled: 'App lock is on. The app asks for this PIN on every open.',
    disabled: 'App lock is off.', format: 'PIN must be 4-6 digits.'
  },
  'te-IN': {
    lockTitle: 'యాప్ లాక్ చేయబడింది', lockBody: 'కొనసాగడానికి యాప్ PIN నమోదు చేయండి.', unlock: 'అన్‌లాక్',
    wrongPin: 'తప్పు PIN. మళ్లీ ప్రయత్నించండి.',
    settingsTitle: 'యాప్ లాక్', setPin: '4-6 అంకెల PIN పెట్టండి', confirmPin: 'PIN నిర్ధారించండి',
    enable: 'యాప్ లాక్ ఆన్ చేయండి', disable: 'యాప్ లాక్ ఆఫ్ చేయండి', enterCurrent: 'ఆఫ్ చేయడానికి ప్రస్తుత PIN నమోదు చేయండి',
    mismatch: 'PINలు సరిపోలలేదు.', enabled: 'యాప్ లాక్ ఆన్ ఉంది. ప్రతీ సారీ యాప్ ఓపెన్ చేసినప్పుడు ఈ PIN అడుగుతుంది.',
    disabled: 'యాప్ లాక్ ఆఫ్ ఉంది.', format: 'PIN తప్పనిసరిగా 4-6 అంకెలు ఉండాలి.'
  },
  'hi-IN': {
    lockTitle: 'ऐप लॉक है', lockBody: 'जारी रखने के लिए ऐप PIN डालें।', unlock: 'अनलॉक',
    wrongPin: 'गलत PIN। फिर कोशिश करें।',
    settingsTitle: 'ऐप लॉक', setPin: '4-6 अंकों का PIN सेट करें', confirmPin: 'PIN की पुष्टि करें',
    enable: 'ऐप लॉक चालू करें', disable: 'ऐप लॉक बंद करें', enterCurrent: 'बंद करने के लिए वर्तमान PIN डालें',
    mismatch: 'PIN मेल नहीं खाते।', enabled: 'ऐप लॉक चालू है। हर बार ऐप खोलने पर यह PIN मांगा जाएगा।',
    disabled: 'ऐप लॉक बंद है।', format: 'PIN 4-6 अंकों का होना चाहिए।'
  }
};
const copy = (lang) => COPY[lang] || COPY['en-IN'];

export function AppLockScreen({ lang, onUnlock }) {
  const c = copy(lang);
  const [pin, setPin] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const ok = await verifyAppLock(pin);
      if (ok) { onUnlock(); return; }
      setError(c.wrongPin); setPin('');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="m-applock" role="dialog" aria-modal="true" aria-label={c.lockTitle}>
      <div className="m-applock-card">
        <h2 className="m-steps-title">{c.lockTitle}</h2>
        <p className="m-record-intro">{c.lockBody}</p>
        <input className="m-applock-input" type="password" inputMode="numeric" autoComplete="off"
          maxLength={6} value={pin} aria-label="PIN"
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
        {error && <p className="m-applock-error" role="alert">{error}</p>}
        <button className="m-btn m-btn-primary" disabled={busy || pin.length < 4} onClick={submit}>{c.unlock}</button>
      </div>
    </div>
  );
}

export function AppLockSettings({ lang, onClose }) {
  const c = copy(lang);
  const [enabled, setEnabled] = React.useState(() => isAppLockEnabled());
  const [pin, setPin] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const enable = async () => {
    if (busy) return;
    if (pin !== confirm) { setMessage(c.mismatch); return; }
    setBusy(true);
    try {
      const result = await enableAppLock(pin);
      if (!result.ok) { setMessage(c.format); return; }
      setEnabled(true); setPin(''); setConfirm(''); setMessage(c.enabled);
    } finally {
      setBusy(false);
    }
  };
  const disable = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await disableAppLock(pin);
      if (!result.ok) { setMessage(c.wrongPin); setPin(''); return; }
      setEnabled(false); setPin(''); setMessage(c.disabled);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="m-consent-backdrop" onClick={onClose}>
      <section className="m-consent-modal" role="dialog" aria-modal="true" aria-label={c.settingsTitle} onClick={(e) => e.stopPropagation()}>
        <h2 className="m-steps-title">{c.settingsTitle}</h2>
        {enabled ? (
          <>
            <p className="m-record-intro">{c.enterCurrent}</p>
            <input className="m-applock-input" type="password" inputMode="numeric" autoComplete="off"
              maxLength={6} value={pin} aria-label="PIN" onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
            <div className="m-record-modes">
              <button className="m-btn m-btn-primary" disabled={busy || pin.length < 4} onClick={disable}>{c.disable}</button>
              <button className="m-btn m-btn-soft" onClick={onClose}>{copy(lang).later || 'Close'}</button>
            </div>
          </>
        ) : (
          <>
            <p className="m-record-intro">{c.setPin}</p>
            <input className="m-applock-input" type="password" inputMode="numeric" autoComplete="off"
              maxLength={6} value={pin} aria-label="PIN" onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setMessage(''); }} />
            <p className="m-record-intro">{c.confirmPin}</p>
            <input className="m-applock-input" type="password" inputMode="numeric" autoComplete="off"
              maxLength={6} value={confirm} aria-label="Confirm PIN" onChange={(e) => { setConfirm(e.target.value.replace(/\D/g, '')); setMessage(''); }} />
            <div className="m-record-modes">
              <button className="m-btn m-btn-primary" disabled={busy || pin.length < 4} onClick={enable}>{c.enable}</button>
              <button className="m-btn m-btn-soft" onClick={onClose}>{copy(lang).later || 'Close'}</button>
            </div>
          </>
        )}
        {message && <p className="m-applock-msg" role="status">{message}</p>}
      </section>
    </div>
  );
}
