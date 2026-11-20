// AyuSwar Mobile — Network speech opt-in settings.
// Live voice recognition through a network-backed engine only runs after an
// explicit user opt-in here (privacy fail-closed). This setting governs LIVE
// voice only; recordings leave the device only on explicit Transcribe/sync.
import React from 'react';
import { speechService } from '../services/indicSpeechService';

const COPY = {
  'en-IN': {
    title: 'Network speech',
    body: 'This setting covers live voice only (the assistant microphone). Live voice uses the browser or Android speech service, which may send audio off this device, and stays OFF until you enable it here. Recorded consultations are stored on this device and leave it only if you explicitly tap Transcribe or choose to sync. On-device recognition is used when your device and Android version support it and the offline speech pack is installed.',
    enable: 'Enable network speech',
    disable: 'Disable network speech',
    on: 'Network speech is ON. Live voice may send audio off this device.',
    off: 'Network speech is OFF. Live voice is unavailable unless on-device recognition works.'
  },
  'te-IN': {
    title: 'నెట్‌వర్క్ స్పీచ్',
    body: 'ఈ సెట్టింగ్ కేవలం లైవ్ వాయిస్ (అసిస్టెంట్ మైక్రోఫోన్) కోసమే. లైవ్ వాయిస్ బ్రౌజర్ లేదా Android స్పీచ్ సర్వీస్ వాడుతుంది, ఇది ఆడియోను ఈ పరికరం బయటకు పంపొచ్చు; మీరు ఇక్కడ ఆన్ చేయకపోతే అది ఆఫ్‌గానే ఉంటుంది. రికార్డ్ చేసిన కన్సల్టేషన్లు ఈ పరికరంలోనే నిలువుతాయి; మీరు స్పష్టంగా Transcribe నొక్కినప్పుడు లేదా సింక్ ఎంచుకున్నప్పుడు మాత్రమే బయటకు వెళ్తాయి. మీ పరికరం మరియు Android వెర్షన్ సపోర్ట్ చేసి, ఆఫ్‌లైన్ స్పీచ్ ప్యాక్ ఇన్‌స్టాల్ అయి ఉంటేనే ఆన్-డివైస్ రికగ్నిషన్ వాడబడుతుంది.',
    enable: 'నెట్‌వర్క్ స్పీచ్ ఆన్ చేయండి',
    disable: 'నెట్‌వర్క్ స్పీచ్ ఆఫ్ చేయండి',
    on: 'నెట్‌వర్క్ స్పీచ్ ఆన్ ఉంది. లైవ్ వాయిస్ ఆడియోను ఈ పరికరం బయటకు పంపొచ్చు.',
    off: 'నెట్‌వర్క్ స్పీచ్ ఆఫ్ ఉంది. ఆన్-డివైస్ రికగ్నిషన్ పనిచేయకపోతే లైవ్ వాయిస్ అందుబాటులో ఉండదు.'
  },
  'hi-IN': {
    title: 'नेटवर्क स्पीच',
    body: 'यह सेटिंग केवल लाइव वॉइस (असिस्टेंट माइक्रोफ़ोन) के लिए है। लाइव वॉइस ब्राउज़र या Android स्पीच सेवा का उपयोग करता है, जो ऑडियो को इस डिवाइस से बाहर भेज सकती है; जब तक आप यहां चालू नहीं करते, यह बंद रहता है। रिकॉर्ड किए गए परामर्श इसी डिवाइस पर सहेजे रहते हैं और केवल तभी बाहर जाते हैं जब आप स्पष्ट रूप से Transcribe दबाएं या सिंक चुनें। जब आपका डिवाइस और Android संस्करण समर्थन करे और ऑफ़लाइन स्पीच पैक इंस्टॉल हो, तभी ऑन-डिवाइस पहचान उपयोग होती है।',
    enable: 'नेटवर्क स्पीच चालू करें',
    disable: 'नेटवर्क स्पीच बंद करें',
    on: 'नेटवर्क स्पीच चालू है। लाइव वॉइस ऑडियो इस डिवाइस से बाहर भेज सकता है।',
    off: 'नेटवर्क स्पीच बंद है। ऑन-डिवाइस पहचान काम न करे तो लाइव वॉइस उपलब्ध नहीं होगा।'
  }
};
const SARVAM_COPY = {
  'en-IN': {
    title: 'Sarvam voice processing (optional)',
    body: 'If the primary voice service is unavailable, the app can send the text to be spoken to Sarvam AI (an Indian voice provider) to synthesize speech. That text leaves this device to a third-party processor and a small per-character cost applies. It stays OFF until you enable it here; when off, the app never sends text to Sarvam and falls back to the on-device voice pack (if installed) or the browser voice.',
    enable: 'Allow Sarvam voice processing',
    disable: 'Stop Sarvam voice processing',
    on: 'Sarvam processing is ON. Spoken text may be sent to Sarvam AI when the primary voice service is unavailable.',
    off: 'Sarvam processing is OFF. Nothing is sent to Sarvam.'
  },
  'te-IN': {
    title: 'Sarvam వాయిస్ ప్రాసెసింగ్ (ఐచ్ఛికం)',
    body: 'ప్రధాన వాయిస్ సర్వీస్ అందుబాటులో లేకపోతే, మాట్లడాల్సిన టెక్స్ట్‌ను స్పీచ్‌గా మార్చడానికి యాప్ దాన్ని Sarvam AI (భారతీయ వాయిస్ ప్రొవైడర్) కు పంపవచ్చు. ఆ టెక్స్ట్ ఈ పరికరం నుండి మూడవ పక్ష ప్రాసెసర్‌కు వెళ్తుంది మరియు చిన్న పెర్-క్యారెక్టర్ ఛార్జీ వర్తిస్తుంది. మీరు ఇక్కడ ఆన్ చేయకపోతే ఇది ఆఫ్‌గానే ఉంటుంది; ఆఫ్‌లో ఉన్నప్పుడు యాప్ Sarvam కు ఏ టెక్స్ట్‌నూ పంపదు, ఆన్-డివైస్ వాయిస్ ప్యాక్ (ఇన్‌స్టాల్ అయితే) లేదా బ్రౌజర్ వాయిస్‌ను వాడుతుంది.',
    enable: 'Sarvam వాయిస్ ప్రాసెసింగ్ అనుమతించండి',
    disable: 'Sarvam వాయిస్ ప్రాసెసింగ్ ఆపండి',
    on: 'Sarvam ప్రాసెసింగ్ ఆన్ ఉంది. ప్రధాన వాయిస్ సర్వీస్ అందుబాటులో లేనప్పుడు మాట్లడే టెక్స్ట్ Sarvam AI కు పంపబడవచ్చు.',
    off: 'Sarvam ప్రాసెసింగ్ ఆఫ్ ఉంది. Sarvam కు ఏమీ పంపబడదు.'
  },
  'hi-IN': {
    title: 'Sarvam वॉइस प्रोसेसिंग (वैकल्पिक)',
    body: 'यदि प्राथमिक वॉइस सेवा उपलब्ध न हो, तो ऐप बोले जाने वाले टेक्स्ट को स्पीच बनाने के लिए Sarvam AI (एक भारतीय वॉइस प्रदाता) को भेज सकता है। वह टेक्स्ट इस डिवाइस से किसी तीसरे पक्ष प्रोसेसर के पास जाता है और छोटा प्रति-अक्षर शुल्क लगता है। जब तक आप यहां चालू नहीं करते, यह बंद रहता है; बंद होने पर ऐप Sarvam को कोई टेक्स्ट नहीं भेजता और ऑन-डिवाइस वॉइस पैक (यदि इंस्टॉल है) या ब्राउज़र वॉइस का उपयोग करता है।',
    enable: 'Sarvam वॉइस प्रोसेसिंग अनुमत करें',
    disable: 'Sarvam वॉइस प्रोसेसिंग बंद करें',
    on: 'Sarvam प्रोसेसिंग चालू है। प्राथमिक वॉइस सेवा उपलब्ध न होने पर बोला जाने वाला टेक्स्ट Sarvam AI को भेजा जा सकता है।',
    off: 'Sarvam प्रोसेसिंग बंद है। Sarvam को कुछ नहीं भेजा जाता।'
  }
};
const sarvamCopy = (lang) => SARVAM_COPY[lang] || SARVAM_COPY['en-IN'];

const copy = (lang) => COPY[lang] || COPY['en-IN'];

export function NetworkSpeechSettings({ lang, onClose }) {
  const c = copy(lang);
  const [allowed, setAllowed] = React.useState(() => speechService.isNetworkSpeechAllowed());
  const toggle = () => {
    const next = !allowed;
    speechService.setNetworkSpeechAllowed(next);
    setAllowed(next);
  };
  return (
    <div className="m-consent-backdrop" onClick={onClose}>
      <section className="m-consent-modal" role="dialog" aria-modal="true" aria-label={c.title} onClick={(e) => e.stopPropagation()}>
        <h2 className="m-steps-title">{c.title}</h2>
        <p className="m-record-intro">{c.body}</p>
        <div className="m-record-modes">
          <button className={`m-btn ${allowed ? 'm-btn-soft' : 'm-btn-primary'}`} onClick={toggle}>{allowed ? c.disable : c.enable}</button>
          <button className="m-btn m-btn-soft" onClick={onClose}>{lang === 'te-IN' ? 'మూసివేయండి' : lang === 'hi-IN' ? 'बंद करें' : 'Close'}</button>
        </div>
        <p className="m-applock-msg" role="status">{allowed ? c.on : c.off}</p>
        <SarvamOptInSection lang={lang} />
      </section>
    </div>
  );
}

function SarvamOptInSection({ lang }) {
  const sc = sarvamCopy(lang);
  const [sarvamAllowed, setSarvamAllowed] = React.useState(() => speechService.isSarvamProcessingAllowed());
  const toggleSarvam = () => {
    const next = !sarvamAllowed;
    speechService.setSarvamProcessingAllowed(next);
    setSarvamAllowed(next);
  };
  return (
    <div style={{ marginTop: 16, borderTop: '1px solid rgba(0,0,0,0.12)', paddingTop: 12 }}>
      <h3 className="m-steps-title" style={{ fontSize: '1rem' }}>{sc.title}</h3>
      <p className="m-record-intro">{sc.body}</p>
      <div className="m-record-modes">
        <button className={`m-btn ${sarvamAllowed ? 'm-btn-soft' : 'm-btn-primary'}`} onClick={toggleSarvam}>{sarvamAllowed ? sc.disable : sc.enable}</button>
      </div>
      <p className="m-applock-msg" role="status">{sarvamAllowed ? sc.on : sc.off}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Offline voice pack (on-device TTS): explicit-consent installer.
// The pack speaks ONLY the fixed qualified interface prompts, never clinical
// or patient text. Download requires explicit consent shown the exact byte
// size; Wi-Fi by default, mobile data only if the user explicitly allows it.
// Integrity is hash-verified on download and on every load (localModelManager).
import {
  getModelStatus,
  installLocalVoiceModel,
  uninstallLocalVoiceModel,
  recordLocalVoiceConsent,
  clearLocalVoiceConsent
} from '../services/localVoice/localModelManager';
import { TTS_MODELS, ttsTotalBytes } from '../services/localVoice/localVoiceManifest';

const LV_COPY = {
  'en-IN': {
    title: 'Offline voice pack (Telugu)',
    body: 'An optional on-device voice for fixed interface prompts (greeting, retry, read-aloud instructions) when the network voice is unavailable. It never speaks patient or clinical text, runs entirely on this device after download, and adds nothing to your recordings.',
    size: (mb, mib) => `Download size: exactly ${mb} (${mib}). Voice: qualified te_M speaker. License: CC-BY-4.0 weights, MIT code (sulabhkatiyar/indic-tiny-tts-telugu).`,
    wifiOnly: 'Download over Wi-Fi only (recommended)',
    allowCellular: 'Allow mobile data for this download',
    install: 'Download & install',
    installing: 'Downloading…',
    cancel: 'Cancel',
    uninstall: 'Remove pack',
    close: 'Close',
    statusInstalled: 'Installed. The offline voice can speak the fixed interface prompts.',
    statusNotInstalled: 'Not installed. The app works fully without this pack.',
    statusUnsupported: 'This browser cannot store the pack (Cache API missing).',
    errCellular: 'Mobile data is blocked for this download. Connect to Wi-Fi or tick "Allow mobile data".',
    errHash: 'A downloaded file failed its integrity check and was deleted. Nothing was kept; please try again on a stable connection.',
    errDownload: 'The download failed. Please try again on a stable connection.',
    errCancelled: 'Download cancelled. Partial files were not kept.',
    progress: (file, files, pct) => `File ${file} of ${files} — ${pct}%`
  },
  'te-IN': {
    title: 'ఆఫ్‌లైన్ వాయిస్ ప్యాక్ (తెలుగు)',
    body: 'నెట్‌వర్క్ వాయిస్ అందుబాటులో లేనప్పుడు స్థిర ఇంటర్ఫేస్ ప్రాంప్టులు (స్వాగతం, మళ్లీ ప్రయత్నించండి, చదవండి సూచన) కోసం ఐచ్ఛిక ఆన్-డివైస్ వాయిస్. ఇది పేషెంట్ లేదా క్లినికల్ టెక్స్ట్‌ను ఎప్పుడూ చదవదు; డౌన్‌లోడ్ తర్వాత పూర్తిగా ఈ పరికరంలోనే నడుస్తుంది; మీ రికార్డింగ్‌లకు ఏమీ జోడించదు.',
    size: (mb, mib) => `డౌన్‌లోడ్ పరిమాణం: ఖచ్చితంగా ${mb} (${mib}). వాయిస్: క్వాలిఫైడ్ te_M స్పీకర్. లైసెన్స్: CC-BY-4.0 వెయిట్స్, MIT కోడ్ (sulabhkatiyar/indic-tiny-tts-telugu).`,
    wifiOnly: 'Wi-Fi లో మాత్రమే డౌన్‌లోడ్ (సిఫార్సు)',
    allowCellular: 'ఈ డౌన్‌లోడ్ కోసం మొబైల్ డేటాను అనుమతించండి',
    install: 'డౌన్‌లోడ్ & ఇన్‌స్టాల్',
    installing: 'డౌన్‌లోడ్ అవుతోంది…',
    cancel: 'రద్దు',
    uninstall: 'ప్యాక్ తొలగించండి',
    close: 'మూసివేయండి',
    statusInstalled: 'ఇన్‌స్టాల్ అయింది. ఆఫ్‌లైన్ వాయిస్ స్థిర ఇంటర్ఫేస్ ప్రాంప్టులు మాట్లాడగలదు.',
    statusNotInstalled: 'ఇన్‌స్టాల్ కాలేదు. ఈ ప్యాక్ లేకుండానే యాప్ పూర్తిగా పనిచేస్తుంది.',
    statusUnsupported: 'ఈ బ్రౌజర్ ప్యాక్‌ను నిలువ చేయలేదు (Cache API లేదు).',
    errCellular: 'ఈ డౌన్‌లోడ్‌కు మొబైల్ డేటా బ్లాక్ చేయబడింది. Wi-Fi కు కనెక్ట్ అవ్వండి లేదా "మొబైల్ డేటాను అనుమతించండి" టిక్ చేయండి.',
    errHash: 'డౌన్‌లోడ్ చేసిన ఫైల్ దాని ఇంటెగ్రిటీ తనిఖీలో విఫలమై తొలగించబడింది. ఏమీ నిలువ లేదు; స్థిరమైన కనెక్షన్‌లో మళ్లీ ప్రయత్నించండి.',
    errDownload: 'డౌన్‌లోడ్ విఫలమైంది. స్థిరమైన కనెక్షన్‌లో మళ్లీ ప్రయత్నించండి.',
    errCancelled: 'డౌన్‌లోడ్ రద్దు చేయబడింది. పాక్షిక ఫైళ్లు నిలువ చేయబడలేదు.',
    progress: (file, files, pct) => `ఫైల్ ${file} / ${files} — ${pct}%`
  },
  'hi-IN': {
    title: 'ऑफ़लाइन वॉइस पैक (तेलुगु)',
    body: 'नेटवर्क वॉइस उपलब्ध न होने पर तय इंटरफ़ेस प्रॉम्प्ट (अभिवादन, पुनः प्रयास, पढ़ने के निर्देश) के लिए वैकल्पिक ऑन-डिवाइस वॉइस। यह कभी भी मरीज़ या क्लिनिकल टेक्स्ट नहीं बोलती; डाउनलोड के बाद पूरी तरह इसी डिवाइस पर चलती है; आपकी रिकॉर्डिंग में कुछ नहीं जोड़ती।',
    size: (mb, mib) => `डाउनलोड आकार: ठीक ${mb} (${mib})। वॉइस: qualified te_M स्पीकर। लाइसेंस: CC-BY-4.0 वेट्स, MIT कोड (sulabhkatiyar/indic-tiny-tts-telugu).`,
    wifiOnly: 'केवल Wi-Fi पर डाउनलोड (अनुशंसित)',
    allowCellular: 'इस डाउनलोड के लिए मोबाइल डेटा अनुमत करें',
    install: 'डाउनलोड और इंस्टॉल',
    installing: 'डाउनलोड हो रहा है…',
    cancel: 'रद्द करें',
    uninstall: 'पैक हटाएं',
    close: 'बंद करें',
    statusInstalled: 'इंस्टॉल हो गया। ऑफ़लाइन वॉइस तय इंटरफ़ेस प्रॉम्प्ट बोल सकती है।',
    statusNotInstalled: 'इंस्टॉल नहीं है। ऐप इस पैक के बिना पूरी तरह काम करता है।',
    statusUnsupported: 'यह ब्राउज़र पैक सहेज नहीं सकता (Cache API उपलब्ध नहीं)।',
    errCellular: 'इस डाउनलोड के लिए मोबाइल डेटा अवरुद्ध है। Wi-Fi से जुड़ें या "मोबाइल डेटा अनुमत करें" चुनें।',
    errHash: 'डाउनलोड की गई फ़ाइल इंटीग्रिटी जाँच में असफल होकर हटा दी गई। कुछ भी सहेजा नहीं गया; स्थिर कनेक्शन पर पुनः प्रयास करें।',
    errDownload: 'डाउनलोड विफल। स्थिर कनेक्शन पर पुनः प्रयास करें।',
    errCancelled: 'डाउनलोड रद्द किया गया। आंशिक फ़ाइलें सहेजी नहीं गईं।',
    progress: (file, files, pct) => `फ़ाइल ${file} / ${files} — ${pct}%`
  }
};
const lvCopy = (lang) => LV_COPY[lang] || LV_COPY['en-IN'];

function formatBytes(n) {
  return [(n / 1e6).toFixed(1) + ' MB', (n / (1024 * 1024)).toFixed(1) + ' MiB'];
}

export function LocalVoicePackSettings({ lang, onClose }) {
  const c = lvCopy(lang);
  const totalBytes = ttsTotalBytes('te');
  const [mb, mib] = formatBytes(totalBytes);
  const [status, setStatus] = React.useState({ state: 'loading' });
  const [allowCellular, setAllowCellular] = React.useState(false);
  const [progress, setProgress] = React.useState(null); // {fileIndex, fileCount, received, total}
  const [errorCode, setErrorCode] = React.useState(null);
  const abortRef = React.useRef(null);

  const refresh = React.useCallback(async () => {
    try { setStatus(await getModelStatus('te')); } catch { setStatus({ state: 'unavailable_no_cache_api' }); }
  }, []);
  React.useEffect(() => { refresh(); return () => { try { abortRef.current?.abort(); } catch {} }; }, [refresh]);

  const startInstall = async () => {
    setErrorCode(null);
    recordLocalVoiceConsent({ language: 'te', allowCellular });
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus({ state: 'downloading' });
    try {
      await installLocalVoiceModel('te', {
        signal: controller.signal,
        onProgress: (p) => setProgress(p)
      });
      setProgress(null);
      await refresh();
    } catch (err) {
      setProgress(null);
      setErrorCode(err && err.code ? err.code : 'DOWNLOAD_FAILED');
      await refresh();
    }
  };

  const cancelInstall = () => { try { abortRef.current?.abort(); } catch {} };
  const removePack = async () => { await uninstallLocalVoiceModel('te'); clearLocalVoiceConsent(); await refresh(); };

  const errMsg = errorCode === 'CELLULAR_BLOCKED' ? c.errCellular
    : errorCode === 'HASH_MISMATCH' ? c.errHash
    : errorCode === 'ABORTED' ? c.errCancelled
    : errorCode ? c.errDownload : null;

  const downloading = status.state === 'downloading';
  return (
    <div className="m-consent-backdrop" onClick={downloading ? undefined : onClose}>
      <section className="m-consent-modal" role="dialog" aria-modal="true" aria-label={c.title} onClick={(e) => e.stopPropagation()}>
        <h2 className="m-steps-title">{c.title}</h2>
        <p className="m-record-intro">{c.body}</p>
        <p className="m-record-intro">{c.size(mb, mib)}</p>

        {status.state !== 'installed' && !downloading && (
          <div className="m-record-modes" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <p className="m-applock-msg">{c.wifiOnly}</p>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" checked={allowCellular} onChange={(e) => setAllowCellular(e.target.checked)} />
              <span>{c.allowCellular}</span>
            </label>
          </div>
        )}

        {downloading && progress && (
          <p className="m-applock-msg" role="status">
            {c.installing} {c.progress(progress.fileIndex + 1, progress.fileCount, Math.min(100, Math.round((progress.received / Math.max(1, progress.total)) * 100)))}
          </p>
        )}
        {errMsg && <p className="m-applock-msg" role="alert">{errMsg}</p>}
        <p className="m-applock-msg" role="status">
          {status.state === 'installed' ? c.statusInstalled
            : status.state === 'unsupported' || status.state === 'unavailable_no_cache_api' ? c.statusUnsupported
            : !downloading ? c.statusNotInstalled : ''}
        </p>

        <div className="m-record-modes">
          {status.state !== 'installed' && !downloading && status.state !== 'unsupported' && status.state !== 'unavailable_no_cache_api' && (
            <button className="m-btn m-btn-primary" onClick={startInstall}>{c.install}</button>
          )}
          {downloading && <button className="m-btn m-btn-soft" onClick={cancelInstall}>{c.cancel}</button>}
          {status.state === 'installed' && <button className="m-btn m-btn-soft" onClick={removePack}>{c.uninstall}</button>}
          {!downloading && <button className="m-btn m-btn-soft" onClick={onClose}>{c.close}</button>}
        </div>
      </section>
    </div>
  );
}
