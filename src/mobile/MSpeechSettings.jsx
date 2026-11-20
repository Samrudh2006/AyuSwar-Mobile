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
      </section>
    </div>
  );
}
