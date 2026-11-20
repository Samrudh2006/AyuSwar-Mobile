import React, { useState, useEffect, useRef } from 'react';
import { 
  Siren, 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Heart, 
  Activity, 
  Clock, 
  Send, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Shield, 
  Car, 
  Building2, 
  FileText, 
  Volume2, 
  VolumeX, 
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Play,
  Pause,
  RotateCcw,
  Cpu
} from 'lucide-react';
import { sanjivaniAudio, analyzeEmergencyClinicalTriage } from '../services/sanjivaniEmergencyService';
import { queryEvonServer, EVON_MODEL_METADATA } from '../services/gnaniEvonService';
import { speechService } from '../services/indicSpeechService';
import { cleanTextForSpeech, speakHumanized } from '../utils/speechSanitizer';
import { queryGroqApi, getGroqApiKey } from '../services/aiBrainService';
import { telephonySipGateway } from '../services/telephonySipGateway';
import { clinicalVad } from '../services/clinicalVadEngine';
import { gnaniStreaming } from '../services/gnaniStreamingClient';

/**
 * Sanjivani-108 Dedicated Emergency AI Dispatch & Clinical Copilot
 * 
 * Features:
 * - Urgent Red/Crimson High-Acuity Theme
 * - Live Voice Call Audio Stream (Auto Timer, Mute, Real Microphone Web Speech, End Call)
 * - Dynamic Voice Intent Execution:
 *   • Sets Caller Location (Annavaram / Kakinada / Rajahmundry)
 *   • Selects Nearest Apex Hospital
 *   • Opens a local handoff preview without booking or dispatch
 *   • Activates a sample 110 BPM pacing beat
 *   • Updates Caller Name & Cellular Callback
 * - Connected with ultra-fast Groq LLaMA-3.3 Reasoning & Gnani Evon
 * - Clean Human Speech (Strips asterisks, emojis, bullet points)
 */
export default function SanjivaniEmergencyAssistant({
  isOpen,
  onToggle,
  callerPhone,
  callerName = 'Emergency Caller',
  geoAddress,
  selectedHospital,
  ambulanceData,
  hospitalsList = [],
  liveTranscript,
  englishTranslation,
  onUpdateTranscript,
  onOpenHandoverModal,
  onApplyLocation,
  onSelectHospital,
  onDispatch,
  onUpdateCallerName,
  onUpdateCallerPhone,
  distressIndex = 89,
  vocalPitchHz = 295,
  respirationRate = 38,
  isSimRunning = true,
  onToggleSim,
  simSpeed = 1,
  onChangeSimSpeed,
  dispatchState = 2
}) {
  const [callStatus, setCallStatus] = useState('ready'); // 'ready' | 'connected' | 'ended'
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isAiVoiceReplyEnabled, setIsAiVoiceReplyEnabled] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);
  const [isHandsFreeLiveTalk, setIsHandsFreeLiveTalk] = useState(false);
  const [voiceState, setVoiceState] = useState('IDLE'); // 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING'
  const [voiceRms, setVoiceRms] = useState(0);
  const [vadConfidence, setVadConfidence] = useState(94);
  const [sipQoS, setSipQoS] = useState({ rttMs: 24, jitterMs: 1.8, packetLossPercent: 0.0 });
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [metronomeBeat, setMetronomeBeat] = useState(1);
  const [compressionCount, setCompressionCount] = useState(0);

  // Dynamic Real-Time Copilot Event Feed (No static dummy chat, strictly real-time events)
  const [copilotEvents, setCopilotEvents] = useState(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const tNow = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    return [
      {
        id: 1,
        time: tNow,
        type: 'system',
 title: 'Sanjivani-108 Simulation Console Active',
        text: `Monitoring the local sample console at ${geoAddress}. No cellular call is connected and no acoustic diagnosis is made.`
      },
      {
        id: 2,
        time: tNow,
        type: 'triage',
 title: 'Sample distress pattern detected',
        text: `Sample values: ${distressIndex}% distress index, ${vocalPitchHz} Hz pitch, ${respirationRate}/min breathing estimate. Call 112/108; no ambulance or treatment is recommended by this prototype.`
      }
    ];
  });

  const [inputQuestion, setInputQuestion] = useState('');
  const recognitionRef = useRef(null);
  const eventsEndRef = useRef(null);

  // Clean teardown on unmount
  useEffect(() => {
    return () => {
      speechService.stopConversationalSession();
    };
  }, []);

  // Scroll to bottom of event feed
  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotEvents]);

  // Auto running timer for the live emergency call
  useEffect(() => {
    let t = null;
    if (callStatus === 'connected') {
      t = setInterval(() => {
        setElapsedSec((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [callStatus]);

  const formatElapsed = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Helper to add timestamped events to the dynamic feed
  const addCopilotEvent = (type, title, text) => {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour12: false });
    setCopilotEvents((prev) => [
      ...prev,
      { id: Date.now(), time: timeStr, type, title, text }
    ]);
  };

  // 1. MUTE / UNMUTE ACTION
  const handleToggleMute = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    if (next) {
      sanjivaniAudio.playClickSound(440, 0.05);
 addCopilotEvent('audio', 'Caller Audio Stream Muted', 'Microphone audio input muted on 108 telecommunication bridge.');
    } else {
      sanjivaniAudio.playClickSound(880, 0.05);
 addCopilotEvent('audio', 'Caller Audio Stream Active', 'Microphone audio input live. Continuous acoustic DSP listening.');
    }
  };

  // 2. FULL-DUPLEX HANDS-FREE LIVE TALK (CONVERSATIONAL VAD + BARGE-IN)
  const toggleHandsFreeLiveTalk = async () => {
    if (isHandsFreeLiveTalk) {
      speechService.stopConversationalSession();
      setIsHandsFreeLiveTalk(false);
      setIsMicListening(false);
      setVoiceState('IDLE');
      setVoiceRms(0);
 addCopilotEvent('audio', 'Hands-Free Live Talk Deactivated', 'Switched back to push-to-talk microphone mode.');
      return;
    }

    try {
      setIsHandsFreeLiveTalk(true);
      setIsMicListening(true);
      setVoiceState('LISTENING');
      sanjivaniAudio.playClickSound(1046, 0.08);
 addCopilotEvent('audio', 'Hands-Free Full-Duplex Voice Live', 'Speak in Telugu, English or Hindi. Gnani Evon will reason and reply via Timbre TTS. Interrupt anytime by speaking (Barge-In).');

      await speechService.startConversationalSession({
        language: 'te-IN',
        onStateChange: (st) => {
          setVoiceState(st);
        },
        onTranscript: ({ finalTranscript, interimTranscript }) => {
          const t = finalTranscript || interimTranscript;
          if (t) {
            onUpdateTranscript(t, `Live Audio Ingested: "${t}"`);
          }
        },
        onBargeIn: ({ rms }) => {
 addCopilotEvent('audio', 'Barge-In Interruption Detected', 'Assistant voice stopped immediately because you spoke. Listening to your voice...');
        },
        onVolumeChange: (rms, vadScore) => {
          setVoiceRms(rms);
          if (vadScore?.speechProbability) {
            setVadConfidence(Math.round(vadScore.speechProbability * 100));
          }
        },
        onRequestAssistantReply: async (userQuestion) => {
 addCopilotEvent('user', 'Voice Query', userQuestion);

          // Dynamic Emergency Triage check
          const triage = analyzeEmergencyClinicalTriage(userQuestion);
          if (triage.triageLevel === 'RED') {
 addCopilotEvent('triage', `Sample Keyword Alert: ${triage.suspectedCondition}`, `Safety boundary: ${triage.priorityProtocol}`);
            if (onOpenHandoverModal) onOpenHandoverModal();
          }

          const reply = await processCopilotVoiceCommand(userQuestion);
          return reply;
        }
      });
    } catch (err) {
      setIsHandsFreeLiveTalk(false);
      setIsMicListening(false);
      setVoiceState('IDLE');
 addCopilotEvent('error', '⚠ Microphone Permission Notice', 'Please allow microphone access in your browser to talk live.');
    }
  };

  // Process voice intent for setting location, finding nearest hospital, booking beds, guiding CPR, or clinical first-aid
  const processCopilotVoiceCommand = async (rawText) => {
    if (!rawText || !rawText.trim()) return null;
    const text = rawText.trim();
    const lower = text.toLowerCase();

    // Detect language: Telugu, Hindi, or English
    const isTelugu = /[\u0C00-\u0C7F]/.test(text) || 
      lower.includes('noppi') || lower.includes('ayasam') || lower.includes('pampandi') || 
      lower.includes('daggara') || lower.includes('gunde') || lower.includes('raktham') || 
      lower.includes('unaru') || lower.includes('ledu') || lower.includes('undi') || lower.includes('cheppandi');
    const isHindi = /[\u0900-\u097F]/.test(text) || 
      lower.includes('dard') || lower.includes('bhejo') || lower.includes('saans') || lower.includes('aspataal');
    const callerLang = isTelugu ? 'Telugu' : isHindi ? 'Hindi' : 'English';

    // 1. LOCATION INTENTS (REAL-TIME MAP ANCHORING)
    if (lower.includes('annavaram') || lower.includes('అన్నవరం')) {
      const loc = { lat: 17.2790, lon: 82.4042, address: 'Annavaram, Kakinada District, Andhra Pradesh' };
      onApplyLocation?.(loc);
 addCopilotEvent('system', 'Caller Location Locked via Voice', `Coordinates set to Annavaram, AP (17.2790° N, 82.4042° E). Opening nearby map results for the sample workflow.`);
      return isTelugu 
        ? `లొకేషన్ అన్నవరం గా సిమ్యులేషన్ కోసం గుర్తించాము. ఆంబులెన్స్ పంపలేదు; నిజమైన అత్యవసరం అయితే 112/108 కు కాల్ చేయండి.`
        : `Location set to Annavaram for the simulation. No ambulance was dispatched; call 112/108 for a real emergency.`;
    }

    if (lower.includes('kakinada') || lower.includes('కాకినాడ')) {
      const loc = { lat: 16.9891, lon: 82.2475, address: 'Kakinada, Andhra Pradesh' };
      onApplyLocation?.(loc);
 addCopilotEvent('system', 'Caller Location Locked via Voice', `Coordinates set to Kakinada, AP (16.9891° N, 82.2475° E).`);
      return isTelugu
        ? `లొకేషన్ కాకినాడ గా అప్‌డేట్ చేసాము. సమీప మ్యాప్ ఫలితాలను చూపగలం. హాస్పిటల్‌కు సమాచారం ఇవ్వలేదు; నిజమైన అత్యవసరం అయితే 112/108 కు కాల్ చేయండి.`
        : `Location updated to Kakinada. Nearby map lookup can run in the simulation. No hospital was alerted; call 112/108 for a real emergency.`;
    }

    if (lower.includes('rajahmundry') || lower.includes('rajamahendravaram') || lower.includes('రాజమండ్రి')) {
      const loc = { lat: 17.0005, lon: 81.8040, address: 'Rajahmahendravaram, Andhra Pradesh' };
      onApplyLocation?.(loc);
 addCopilotEvent('system', 'Caller Location Locked via Voice', `Coordinates set to Rajahmundry.`);
      return isTelugu
        ? `లొకేషన్ రాజమండ్రి గా నమోదైంది. ఇది స్థానిక సిమ్యులేషన్; ఆంబులెన్స్ రాలేదు. 112/108 కు కాల్ చేసి అధికారిక డిస్పాచర్ సూచనలు పాటించండి.`
        : `Location registered as Rajahmundry. This is a local simulation; no ambulance is en route. Call 112/108 and follow the official dispatcher.`;
    }

    if (lower.includes('visakhapatnam') || lower.includes('vizag') || lower.includes('విశాఖపట్నం')) {
      const loc = { lat: 17.6868, lon: 83.2185, address: 'Visakhapatnam, Andhra Pradesh' };
      onApplyLocation?.(loc);
 addCopilotEvent('system', 'Caller Location Locked via Voice', `Coordinates set to Visakhapatnam.`);
      return isTelugu
        ? `లొకేషన్ విశాఖపట్నం గా అప్‌డేట్ చేసాము. హాస్పిటల్‌కు సమాచారం ఇవ్వలేదు, ఆంబులెన్స్ రాలేదు. ఇది అనుకరణ; 112/108 కు కాల్ చేయండి.`
        : `Location updated to Visakhapatnam. No hospital was alerted and no ambulance is on the way. This is a simulation; call 112/108.`;
    }

    if (lower.includes('vijayawada') || lower.includes('విజయవాడ')) {
      const loc = { lat: 16.5062, lon: 80.6480, address: 'Vijayawada, Andhra Pradesh' };
      onApplyLocation?.(loc);
 addCopilotEvent('system', 'Caller Location Locked via Voice', `Coordinates set to Vijayawada.`);
      return isTelugu
        ? `లొకేషన్ విజయవాడ గా నమోదైంది. హాస్పిటల్‌కు సమాచారం ఇవ్వలేదు, ఆంబులెన్స్ బయలుదేరలేదు. నిజమైన సహాయం కోసం 112/108 కు కాల్ చేయండి.`
        : `Location set to Vijayawada. No hospital was alerted and no ambulance is en route. Call 112/108 for real help.`;
    }

    if (lower.includes('hyderabad') || lower.includes('హైదరాబాద్')) {
      const loc = { lat: 17.3850, lon: 78.4867, address: 'Hyderabad, Telangana' };
      onApplyLocation?.(loc);
 addCopilotEvent('system', 'Caller Location Locked via Voice', `Coordinates set to Hyderabad.`);
      return isTelugu
        ? `లొకేషన్ హైదరాబాద్ గా నమోదైంది. హాస్పిటల్ కు సమాచారం ఇవ్వలేదు, ఆంబులెన్స్ బయలుదేరలేదు. 112/108 కు కాల్ చేసి డిస్పాచర్ సూచనలు పాటించండి.`
        : `Location set to Hyderabad. No hospital was alerted and no ambulance is moving. Call 112/108 and follow the official dispatcher.`;
    }

    if (lower.includes('tirupati') || lower.includes('తిరుపతి')) {
      const loc = { lat: 13.6288, lon: 79.4192, address: 'Tirupati, Andhra Pradesh' };
      onApplyLocation?.(loc);
 addCopilotEvent('system', 'Caller Location Locked via Voice', `Coordinates set to Tirupati.`);
      return isTelugu
        ? `లొకేషన్ తిరుపతి గా నమోదైంది. హాస్పిటల్ కు సమాచారం ఇవ్వలేదు, ఆంబులెన్స్ పంపలేదు. నిజమైన అత్యవసరం అయితే 112/108 కు కాల్ చేయండి.`
        : `Location set to Tirupati. No hospital was alerted and no ambulance was dispatched. Call 112/108 for a real emergency.`;
    }

    // 2. REAL-TIME ROAD ROUTE & NAVIGATION TO HOSPITAL INTENT
    if (
      lower.includes('route to hospital') ||
      lower.includes('navigate to hospital') ||
      lower.includes('navigate') ||
      lower.includes('navigation') ||
      lower.includes('hospital route') ||
      lower.includes('show route') ||
      lower.includes('hospital ki route') ||
      lower.includes('hospital ki daari') ||
      lower.includes('దారి') ||
      lower.includes('రూట్') ||
      lower.includes('రహదారి') ||
      lower.includes('rasta') ||
      lower.includes('directions') ||
      lower.includes('how to reach')
    ) {
      const targetHospital = (hospitalsList && hospitalsList.length > 0)
        ? hospitalsList[0]
        : selectedHospital || { name: 'Demo Emergency Trauma Center (Simulation)', etaMinutes: 5, distanceKm: 3.4 };

      onSelectHospital?.(targetHospital);
      if (onDispatch) onDispatch(targetHospital); // starts local simulation only

      addCopilotEvent(
        'system',
 `Sample Route Preview: ${targetHospital.name}`,
        `Calculated an estimated route to ${targetHospital.name}. Distance: ${targetHospital.distanceKm || '3.4'} km, ETA: ${targetHospital.etaMinutes || '5'} min. No traffic signal or green corridor was controlled.`
      );

      return isTelugu
        ? `${targetHospital.name} కు అంచనా మార్గాన్ని నమూనా మ్యాప్‌లో చూపాం. దూరం ${targetHospital.distanceKm || '3.4'} కిలోమీటర్లు, ETA ${targetHospital.etaMinutes || '5'} నిమిషాలు. ట్రాఫిక్ సిగ్నళ్లు లేదా అత్యవసర సేవలను సంప్రదించలేదు.`
        : `Estimated route to ${targetHospital.name} is shown on the sample map. Distance: ${targetHospital.distanceKm || '3.4'} km, ETA: ${targetHospital.etaMinutes || '5'} minutes. No traffic signals or emergency services were contacted.`;
    }

    // 3. NEAREST HOSPITAL INTENT
    if (
      lower.includes('nearest hospital') || 
      lower.includes('nearby hospital') || 
      lower.includes('closest hospital') || 
      lower.includes('hospital daggara') || 
      lower.includes('ఆసుపత్రి') || 
      lower.includes('davaakhana') ||
      (lower.includes('which hospital') || lower.includes('where to go'))
    ) {
      const targetHospital = (hospitalsList && hospitalsList.length > 0) 
        ? hospitalsList[0] 
        : selectedHospital || { name: 'Demo Emergency Trauma Center (Simulation)', etaMinutes: 4, bedsAvailable: 8 };
      
      onSelectHospital?.(targetHospital);
 addCopilotEvent('system', `Nearest Hospital Selected: ${targetHospital.name}`, `Selected ${targetHospital.name} (${targetHospital.etaMinutes || 4} min ETA). Beds and emergency capability are not verified.`);
      return isTelugu
        ? `దగ్గరలోని మ్యాప్ ఫలితం ${targetHospital.name}. ప్రయాణ అంచనా ${targetHospital.etaMinutes || 4} నిమిషాలు; బెడ్స్, సామర్థ్యం ధృవీకరించబడలేదు. స్థానిక హ్యాండాఫ్ ప్రివ్యూ తెరవగలను, కానీ ఆంబులెన్స్/బెడ్ బుక్ చేయలేను.`
        : `Nearest map result is ${targetHospital.name}. Travel estimate is ${targetHospital.etaMinutes || 4} minutes; beds and capability are not verified. I can open the local handoff preview, but no ambulance or bed can be booked here.`;
    }

    // 3. BOOK BED / DISPATCH INTENT
    if (
      lower.includes('book bed') || 
      lower.includes('dispatch') || 
      lower.includes('send ambulance') || 
      lower.includes('ambulance pampandi') || 
      lower.includes('ఆంబులెన్స్ పంపండి') || 
      lower.includes('book cheyyi') ||
      lower.includes('bed handover') ||
      lower.includes('form') ||
      lower.includes('ఫారం') ||
      lower.includes('handover')
    ) {
      const hosp = selectedHospital || (hospitalsList && hospitalsList[0]) || { name: 'Demo Emergency Center (Simulation)', shortName: 'Demo Center' };
      if (onDispatch) onDispatch(hosp);
      if (onOpenHandoverModal) onOpenHandoverModal();
      return isTelugu
        ? `${hosp.name || 'ఎంచుకున్న ఆసుపత్రి'} కోసం స్థానిక హ్యాండాఫ్ ప్రివ్యూ తెరిచాం. ఆంబులెన్స్ పంపలేదు, బెడ్ బుక్ చేయలేదు, హాస్పిటల్ రికార్డ్ పంపలేదు.`
        : `Local handoff preview opened for ${hosp.name || 'the selected facility'}. No ambulance was dispatched, no bed was booked, and no hospital record was filed.`;
    }

    // 4. CARDIAC ARREST / CPR METRONOME INTENT (PULSE ABSENT / UNCONSCIOUS)
    if (
      lower.includes('cpr') || 
      lower.includes('compressions') || 
      lower.includes('pulse ledu') || 
      lower.includes('pulse లేదు') || 
      lower.includes('unconscious') || 
      lower.includes('స్పృహ లేదు') ||
      lower.includes('spruha ledu')
    ) {
      if (!isMetronomeActive) {
        handleTriggerCPR();
      }
      if (onOpenHandoverModal) onOpenHandoverModal();
      return isTelugu
        ? `110 BPM నమూనా పేసింగ్ టోన్ ప్రారంభించాను. ఇది CPR సూచనలు ఇవ్వదు; 112/108 కు కాల్ చేసి అధికారిక డిస్పాచర్ సూచనలు పాటించండి.`
        : `Starting a 110 beats-per-minute sample pacing tone. This does not provide CPR instructions; call 112/108 and follow the official emergency dispatcher.`;
    }

    // 5. CHEST PAIN / SUSPECTED STEMI HEART ATTACK (CONSCIOUS PATIENT FIRST AID)
    if (
      lower.includes('chest pain') || 
      lower.includes('gunde noppi') || 
      lower.includes('గుండె నొప్పి') || 
      lower.includes('heart attack') || 
      lower.includes('గుండెపోటు')
    ) {
      handlePreAlertCathLab();
      const hosp = selectedHospital || (hospitalsList && hospitalsList[0]) || { name: 'Demo Emergency Center (Simulation)' };
      if (onDispatch) onDispatch(hosp);
      if (onOpenHandoverModal) onOpenHandoverModal();

      return isTelugu
        ? `ఇప్పుడే 112 లేదా 108 కు కాల్ చేసి అధికారిక డిస్పాచర్ సూచనలు పాటించండి. ఈ ప్రోటోటైప్ ఆంబులెన్స్ పంపలేదు లేదా క్యాత్ ల్యాబ్‌కు సమాచారం ఇవ్వలేదు.`
        : `Stay calm. Call 112 or 108 now and follow the official emergency dispatcher. This prototype did not dispatch an ambulance or alert a cath lab.`;
    }

    // 6. ACCIDENT / SEVERE BLEEDING / TRAUMA
    if (
      lower.includes('accident') || 
      lower.includes('debba') || 
      lower.includes('రక్తం') || 
      lower.includes('raktham') || 
      lower.includes('bleeding')
    ) {
      handleGreenCorridor();
      const hosp = selectedHospital || (hospitalsList && hospitalsList[0]) || { name: 'Demo Emergency Center (Simulation)' };
      if (onDispatch) onDispatch(hosp);
      if (onOpenHandoverModal) onOpenHandoverModal();
      return isTelugu
        ? `ఇప్పుడే 112 లేదా 108 కు కాల్ చేసి అధికారిక డిస్పాచర్ సూచనలు పాటించండి. ఈ ప్రోటోటైప్ ట్రాఫిక్ క్లియర్ చేయలేదు లేదా ఆంబులెన్స్ పంపలేదు.`
        : `Call 112 or 108 now and follow the official emergency dispatcher. This prototype did not clear traffic or send an ambulance.`;
    }

    // 7. CALLER NAME INTENT
    const nameMatch = text.match(/(?:my name is|i am|peru|naa peru)\s+([a-zA-Z\s]+)/i);
    if (nameMatch && nameMatch[1]) {
      const extractedName = nameMatch[1].trim().split(' ')[0];
      if (extractedName && extractedName.length > 2) {
        onUpdateCallerName?.(extractedName);
 addCopilotEvent('system', `Caller Name Updated: ${extractedName}`, `Local sample record updated with the caller name.`);
        return isTelugu ? `కాలర్ పేరు ${extractedName} గా స్థానిక నమూనా రికార్డులో నమోదైంది.` : `Noted caller name as ${extractedName} for the local sample record.`;
      }
    }

    // 8. CALLER PHONE INTENT
    const phoneMatch = text.match(/\b([6-9]\d{9})\b/);
    if (phoneMatch && phoneMatch[1]) {
      const extractedPhone = phoneMatch[1];
      onUpdateCallerPhone?.(extractedPhone);
 addCopilotEvent('system', `Caller Contact Updated: +91 ${extractedPhone}`, `Local sample contact field updated; no callback was placed.`);
      return isTelugu ? `ఫోన్ నంబర్ ${extractedPhone} స్థానిక నమూనాకు మాత్రమే నమోదైంది; కంట్రోల్ రూమ్ కనెక్ట్ కాలేదు.` : `Updated contact number to ${extractedPhone} for the local sample only; no control room was connected.`;
    }

    // 9. GREEN CORRIDOR / TRAFFIC INTENT
    if (lower.includes('traffic') || lower.includes('green corridor') || lower.includes('clear road') || lower.includes('siren')) {
      handleGreenCorridor();
      return isTelugu
        ? `ఈ ప్రోటోటైప్‌లో ట్రాఫిక్ పోలీస్ క్లియరెన్స్ లేదు. నమూనా మార్గం స్థానికంగా కనిపిస్తుంది; నిజమైన రవాణా కోసం 112/108 కు కాల్ చేయండి.`
        : `No traffic-police clearance exists in this prototype. The sample route is visible locally; call 112/108 for real emergency transport.`;
    }

    // 10. GENERAL CLINICAL QUERY: Interactive, Life-Saving Tele-Triage Guidance via Groq
    try {
      const groqKey = getGroqApiKey();
      if (groqKey) {
        const groqPrompt = 
          `Emergency caller says: "${text}".\n` +
          `Patient location: ${geoAddress}.\n` +
          `Target emergency center: ${selectedHospital?.name || 'Demo Apex Trauma Center (Simulation)'} (${selectedHospital?.etaMinutes || 4} min ETA).\n` +
          `Assigned unit: none; local sample map only.\n\n` +
          `You are a safety-boundary emergency simulation narrator, not a doctor or dispatcher.\n` +
          `Respond in ${callerLang} in 25 to 35 words:\n` +
          `1. Say to call 112 or 108 and follow the official emergency dispatcher.\n` +
          `2. State clearly that no ambulance is dispatched by this app.\n` +
          `3. Tell the caller to share their exact location with 112/108.\n` +
          `Strict rules: no diagnosis, treatment, first-aid protocol, dispatch, hospital, bed, or authority claim. No markdown.`;

        const systemInstruction = `You are a prototype emergency simulation assistant in ${callerLang}. Tell callers to contact 112/108 and never provide diagnosis, treatment, first aid, dispatch, hospital, bed, or authority claims.`;
        const groqRes = await queryGroqApi(groqPrompt, systemInstruction);
        if (groqRes) {
          const cleaned = cleanTextForSpeech(groqRes);
 addCopilotEvent('ai', 'Sanjivani Simulation Safety Response', cleaned);
          return cleaned;
        }
      }

      // Evon reasoning fallback
      const systemInstruction = 
        `You are a prototype emergency simulation assistant for Sanjivani-108. ` +
        `Respond with the generic 112/108 contact boundary under 35 words in ${callerLang}. ` +
        `Never provide diagnosis, treatment, first aid, dispatch, hospital, bed, or authority claims. Context: local sample map only.`;
      const evonResult = await queryEvonServer(text, systemInstruction, { maxTokens: 100 });
      const rawAnswer = evonResult.finalAnswer || evonResult.raw || 'Call 112 or 108 now and follow the official emergency dispatcher. This prototype sends no ambulance or treatment instructions.';
      const cleaned = cleanTextForSpeech(rawAnswer);
 addCopilotEvent('ai', 'Sanjivani Simulation Safety Response', cleaned);
      return cleaned;
    } catch (err) {
      const fallback = isTelugu
        ? `ప్రశాంతంగా ఉండండి. ఇప్పుడే 112 లేదా 108 కు కాల్ చేసి అధికారిక డిస్పాచర్ సూచనలు పాటించండి. ఈ ప్రోటోటైప్ సహాయం పంపదు లేదా చికిత్స సూచనలు ఇవ్వదు.`
        : `Stay calm. Call 112 or 108 now and follow the official emergency dispatcher. This prototype does not send help or give treatment instructions.`;
 addCopilotEvent('ai', 'Sanjivani Simulation Safety Boundary', fallback);
      return fallback;
    }
  };

  // 2B. MANUAL BARGE-IN INTERRUPTION
  const handleInterruptAssistant = () => {
    speechService.interruptAssistant('manual_button');
    setVoiceState(isHandsFreeLiveTalk ? 'LISTENING' : 'IDLE');
 addCopilotEvent('audio', 'Voice Interruption Triggered', 'Assistant speech cut off immediately. Resuming live microphone intake.');
  };

  // 2C. BASIC MIC TOGGLE (FALLBACK / MANUAL)
  const toggleSpeechRecognition = async () => {
    if (isHandsFreeLiveTalk) {
      toggleHandsFreeLiveTalk();
      return;
    }

    if (isMicListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsMicListening(false);
      setVoiceState('IDLE');
 addCopilotEvent('audio', 'Hardware Microphone Paused', 'Microphone voice capture detached.');
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'te-IN'; // Multi-indic capable
        
        recognition.onresult = async (event) => {
          const text = Array.from(event.results)
            .map((r) => r[0].transcript)
            .join(' ');
          if (text) {
            onUpdateTranscript(text, `Live Audio Ingested: "${text}"`);
            
            // Dynamic Triage computation from user's live voice
            const triage = analyzeEmergencyClinicalTriage(text);
            if (triage.triageLevel === 'RED') {
 addCopilotEvent('triage', `Sample Keyword Alert: ${triage.suspectedCondition}`, `Identified sample emergency keywords. Safety boundary: ${triage.priorityProtocol}`);
            }

            const isFinal = Array.from(event.results).some(r => r.isFinal);
            if (isFinal) {
              const reply = await processCopilotVoiceCommand(text);
              if (reply && isAiVoiceReplyEnabled && !isAudioMuted) {
                setVoiceState('SPEAKING');
                const replyLang = /[\u0C00-\u0C7F]/.test(reply) ? 'te-IN' : (/[\u0900-\u097F]/.test(reply) ? 'hi-IN' : 'en-IN');
                await speechService.speak(reply, {
                  channel: 'sanjivani_emergency',
                  langCode: replyLang,
                  onStart: () => setVoiceState('SPEAKING'),
                  onEnd: () => setVoiceState('IDLE')
                });
              }
            }
          }
        };

        recognition.onend = () => {
          setIsMicListening(false);
          setVoiceState('IDLE');
        };
        recognition.onerror = (e) => console.warn('Speech rec error:', e);

        recognitionRef.current = recognition;
        recognition.start();
        setIsMicListening(true);
        setVoiceState('LISTENING');
        sanjivaniAudio.playClickSound(1046, 0.08);
 addCopilotEvent('audio', 'Live Microphone Connected', 'Listening to real speaker voice. Real-time Indic transcription running.');
      } else {
        setIsMicListening(true);
      }
    } catch (err) {
 addCopilotEvent('error', '⚠ Microphone Permission Notice', 'Please allow microphone access in your browser to speak live.');
    }
  };

  // 3. END CALL ACTION
  const handleEndCall = () => {
    setCallStatus('ended');
    sanjivaniAudio.playCallEndBeep();
    speechService.stopConversationalSession();
    telephonySipGateway.terminateCall();
    gnaniStreaming.stopStreaming();
    setIsHandsFreeLiveTalk(false);
    setIsMicListening(false);
    setVoiceState('IDLE');
    setVoiceRms(0);
    if (isMetronomeActive) {
      sanjivaniAudio.stopCPRMetronome();
      setIsMetronomeActive(false);
    }
    addCopilotEvent('call', 'Simulation Session Ended', `Local voice session terminated. Final duration: ${formatElapsed(elapsedSec)}.`);
  };

  // 4. START LIVE CALL ACTION (REAL-TIME CONVERSATIONAL 108 TELE-TRAUMA BRIDGE)
  const handleStartCall = async () => {
    setCallStatus('connected');
    setElapsedSec(0);
    setIsAudioMuted(false);
    setIsHandsFreeLiveTalk(true);
    setIsMicListening(true);
    sanjivaniAudio.playRadioChime();
 addCopilotEvent('network', 'Local Audio Session Started', 'No SIP/cellular bridge or 108 call is connected.');
    addCopilotEvent('call', 'Simulation Session Active', `Local hands-free sample session started for demo caller (${callerPhone}).`);

    const greeting = "Sanjivani simulation. For a real emergency call 112 or 108. Describe the sample scenario. నిజమైన అత్యవసరం అయితే 112 లేదా 108 కు కాల్ చేయండి.";
 addCopilotEvent('ai', 'Sanjivani Simulation', greeting);
    setVoiceState('SPEAKING');

    await speechService.speak(greeting, {
      channel: 'sanjivani_emergency',
      langCode: 'te-IN',
      onStart: () => setVoiceState('SPEAKING'),
      onEnd: () => {
        setVoiceState('LISTENING');
      }
    });

    try {
      await speechService.startConversationalSession({
        language: 'te-IN',
        onStateChange: (st) => {
          setVoiceState(st);
        },
        onTranscript: ({ finalTranscript, interimTranscript }) => {
          const t = finalTranscript || interimTranscript;
          if (t) {
            onUpdateTranscript(t, `Live Audio Ingested: "${t}"`);
          }
        },
        onBargeIn: () => {
 addCopilotEvent('audio', 'Caller Speaking', 'Assistant paused talking to hear caller.');
        },
        onVolumeChange: (rms) => {
          setVoiceRms(rms);
        },
        onRequestAssistantReply: async (userQuestion) => {
 addCopilotEvent('user', 'Caller', userQuestion);

          // Dynamic Emergency Triage check
          const triage = analyzeEmergencyClinicalTriage(userQuestion);
          if (triage.triageLevel === 'RED') {
 addCopilotEvent('triage', `Sample Keyword Alert: ${triage.suspectedCondition}`, `Safety boundary: ${triage.priorityProtocol}`);
            if (onOpenHandoverModal) onOpenHandoverModal();
          }

          setVoiceState('THINKING');
          const reply = await processCopilotVoiceCommand(userQuestion);
          return reply;
        }
      });
    } catch (err) {
      console.warn('Conversational session launch error:', err);
 addCopilotEvent('error', '⚠ Microphone Permission Notice', 'Please allow microphone access in your browser to speak live.');
    }
  };

  // 5. 110 BPM CPR ACTION (SOUND + VOICE + BEAT ANIMATION)
  const handleTriggerCPR = () => {
    if (isMetronomeActive) {
      sanjivaniAudio.stopCPRMetronome();
      setIsMetronomeActive(false);
      setCompressionCount(0);
 addCopilotEvent('cpr', '⏸ CPR Metronome Paused', 'Chest compression pacing halted.');
    } else {
      setIsMetronomeActive(true);
      setCompressionCount(1);
      sanjivaniAudio.startCPRMetronome((beat) => {
        setMetronomeBeat(beat);
        setCompressionCount((c) => (c >= 30 ? 1 : c + 1));
      });
      sanjivaniAudio.speakGuidance('Starting a 110 beats-per-minute sample pacing tone. Call 112 or 108 for emergency instructions.');
 addCopilotEvent('cpr', 'Sample 110 BPM Pacing Beat Activated', 'Audible sample beat running. This app does not provide CPR instructions; follow the official 112/108 dispatcher.');
    }
  };

  // 6. PRE-ALERT CATH LAB ACTION (CHIME + VOICE + TOKEN)
  const handlePreAlertCathLab = () => {
    sanjivaniAudio.playRadioChime();
    const hospName = selectedHospital?.name || 'Demo Apex Hospital (Simulation)';
    const token = `CATHLAB-AP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    sanjivaniAudio.speakGuidance(`Sample cath-lab alert chime for ${hospName}; no hospital team was notified.`);
    addCopilotEvent(
      'cathlab',
 `Sample Cath-Lab Alert Chime [${token}]`,
      `Local simulation only: no destination, cath lab, angiography bay, or resuscitation bay was contacted or reserved.`
    );
  };

  // 7. GREEN CORRIDOR ACTION (REAL SIREN WAIL + POLICE CLEARANCE TOKEN)
  const handleGreenCorridor = () => {
    sanjivaniAudio.playEmergencySiren();
    const token = `GREEN-CORRIDOR-AP-POLICE-${Math.floor(10000 + Math.random() * 90000)}`;
    const hospName = selectedHospital?.name || 'Emergency Center';
    sanjivaniAudio.speakGuidance(`Sample siren between ${geoAddress.split(',')[0]} and ${hospName}; no traffic police clearance or transit authorization exists.`);
    addCopilotEvent(
      'corridor',
 `Sample Route Siren [${token}]`,
      `Local route sound only; no traffic control room, signal priority, or ambulance was activated.`
    );
  };

  // 8. HANDOVER FORM ACTION
  const handleOpenHandover = () => {
    sanjivaniAudio.playClickSound(880, 0.08);
 addCopilotEvent('form', 'Local Handoff Preview Opened', 'Preparing a local sample summary from the current demo session; nothing is transmitted.');
    onOpenHandoverModal();
  };

  // 9. CALL PARAMEDIC DRIVER ACTION
  const handleCallDriver = () => {
    sanjivaniAudio.playClickSound(880, 0.1);
    addCopilotEvent(
      'driver',
 'Driver call unavailable in prototype',
      `No ambulance driver or cellular connection exists in this simulation.`
    );
  };

  // 10. INTERACTIVE USER PROMPT IN CHAT (Powered by local sample rules and optional prototype AI calls)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputQuestion.trim()) return;

    const q = inputQuestion.trim();
    setInputQuestion('');
 addCopilotEvent('user', 'Operator Query', q);
    setVoiceState('THINKING');

    const reply = await processCopilotVoiceCommand(q);
    if (reply) {
      setVoiceState('SPEAKING');
      await speechService.speak(reply, {
        channel: 'sanjivani_emergency',
        langCode: 'en-IN',
        onStart: () => setVoiceState('SPEAKING'),
        onEnd: () => setVoiceState(isHandsFreeLiveTalk ? 'LISTENING' : 'IDLE')
      });
    }
  };

  // If collapsed, do not render a competing floating circular FAB in the bottom right corner
  // The operator triggers the copilot cleanly via the top header '🚨 108 AI Copilot' button
  if (!isOpen) {
    return null;
  }

  // Expanded Serious Emergency AI Copilot Console
  return (
    <div style={{
      position: 'absolute',
      bottom: '16px',
      right: '18px',
      width: '470px',
      height: '670px',
      maxHeight: '88vh',
      background: '#07101E',
      border: '2px solid #DC2626',
      borderRadius: '16px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.95), 0 0 35px rgba(220, 38, 38, 0.45)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      color: '#F8FAFC',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* Header: Serious Urgent Emergency Red Branding */}
      <div style={{
        background: '#7F1D1D',
        borderBottom: '1.5px solid #991B1B',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img 
            src="/assets/sanjivani_circular_badge.png" 
            alt="Sanjivani 108 Emblem" 
            style={{ width: '34px', height: '34px', objectFit: 'cover', borderRadius: '50%', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }} 
          />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>SANJIVANI 108 COPILOT</span>
              <span style={{ fontSize: '8.5px', background: '#DC2626', color: '#FFF', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                SIMULATION
              </span>
            </div>
            <div style={{ fontSize: '9px', color: '#FCA5A5' }}>
              Sample workflow, pacing beat & local handoff preview
            </div>
          </div>
        </div>

        <button
          onClick={onToggle}
          title="Collapse Copilot"
          style={{ background: 'transparent', border: 'none', color: '#FCA5A5', cursor: 'pointer', padding: '4px' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* SECTION 1: LIVE 108 TELE-TRAUMA ACOUSTIC DISPATCH & AUDIO STREAM (NO AVATAR) */}
      <div style={{
        background: '#08232C',
        borderBottom: '1px solid #1E293B',
        padding: '14px 18px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1.5px solid #B91C1C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#B91C1C',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.35)'
            }}>
              <Activity size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14.5px', fontWeight: 850, color: '#FFFFFF', fontFamily: 'var(--font-main)' }}>
                  Sample Acoustic Telemetry
                </span>
                <span style={{
                  fontSize: '9.5px',
                  background: '#B91C1C',
                  color: '#FFFFFF',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.05em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FFFFFF' }}></span>
                  SIMULATION
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
                Sanjivani simulation assistant • no dispatch authority
              </div>
            </div>
          </div>

          {/* Real-Time 108 Emergency Calling Interface */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {callStatus !== 'connected' ? (
              <button
                onClick={handleStartCall}
                style={{
                  background: '#047857',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '8px 18px',
                  fontSize: '12.5px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.55)',
                  animation: 'pulse 2s infinite'
                }}
                title="Start local emergency simulation voice session"
              >
                <PhoneCall size={16} />
                <span>Start Simulation Session</span>
              </button>
            ) : (
              <>
                {/* 108 Call Live Indicator */}
                <div style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1.5px solid #B91C1C',
                  padding: '5px 11px',
                  borderRadius: '20px',
                  color: '#FCA5A5',
                  fontSize: '11px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#B91C1C', display: 'inline-block', boxShadow: '0 0 8px #B91C1C' }} />
                  <span>108 CALL LIVE</span>
                </div>

                {/* Call Timer */}
                <div style={{
                  background: '#091E26',
                  border: '1px solid #2C4A52',
                  padding: '5px 10px',
                  borderRadius: '20px',
                  color: '#38BDF8',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  fontWeight: 800
                }}>
 ⏱ {String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:{String(elapsedSec % 60).padStart(2, '0')}
                </div>

                {/* Live Voice Status Pill */}
                <div style={{
                  background: voiceState === 'SPEAKING' ? 'rgba(212, 175, 55, 0.25)' : voiceState === 'THINKING' ? 'rgba(217, 119, 6, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  border: voiceState === 'SPEAKING' ? '1px solid #D4AF37' : voiceState === 'THINKING' ? '1px solid #B45309' : '1px solid #047857',
                  color: voiceState === 'SPEAKING' ? '#FEF08A' : voiceState === 'THINKING' ? '#FDE68A' : '#A7F3D0',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {voiceState === 'SPEAKING' ? (
                    <>
                      <Volume2 size={13} />
 <span> Sanjivani simulation speaking</span>
                    </>
                  ) : voiceState === 'THINKING' ? (
                    <>
                      <Activity size={13} />
 <span> Sample reasoning...</span>
                    </>
                  ) : (
                    <>
                      <Mic size={13} />
 <span> Listening to Caller (Speak naturally)</span>
                    </>
                  )}
                </div>

                {/* Mic Mute / Unmute Button */}
                <button
                  onClick={handleToggleMute}
                  style={{
                    background: isAudioMuted ? '#B91C1C' : '#1E293B',
                    color: '#FFFFFF',
                    border: isAudioMuted ? 'none' : '1px solid #486770',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isAudioMuted ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'
                  }}
                  title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}
                >
                  {isAudioMuted ? <MicOff size={14} /> : <Mic size={14} />}
                </button>

                {/* Red End Call Button */}
                <button
                  onClick={handleEndCall}
                  style={{
                    background: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '11.5px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 0 12px rgba(220, 38, 38, 0.5)'
                  }}
                  title="End local simulation session"
                >
                  <PhoneOff size={13} />
                  <span>End Call</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Audio Energy (RMS) Waveform & State Banner */}
        {isHandsFreeLiveTalk && (
          <div style={{
            background: '#040B18',
            border: '1px solid #1E2E4A',
            borderRadius: '6px',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            fontSize: '10.5px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: voiceState === 'SPEAKING' ? '#D4AF37' : voiceState === 'THINKING' ? '#F59E0B' : '#047857'
              }}></span>
              <span style={{ color: '#D0DFE2', fontWeight: 700 }}>
                {voiceState === 'SPEAKING' 
 ? 'Sanjivani simulation speaking'
                  : voiceState === 'THINKING' 
 ? 'Sample reasoning...'
 : 'Simulation session active • Speak naturally (Telugu / Hindi / English)'}
              </span>
            </div>

            {/* Audio RMS & Clinical VAD / WebRTC SIP Telemetry */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#38BDF8', fontSize: '9.5px', fontFamily: 'monospace', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
                LOCAL: {sipQoS.rttMs}ms
              </span>
              <span style={{ color: '#047857', fontSize: '9.5px', fontFamily: 'monospace', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                VAD: {vadConfidence}%
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#52707C', fontSize: '9.5px', fontFamily: 'monospace' }}>MIC LEVEL</span>
                <div style={{ width: '48px', height: '6px', background: '#1E293B', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, Math.round(voiceRms * 400))}%`,
                    height: '100%',
                    background: voiceRms > 0.04 ? '#B91C1C' : '#047857',
                    transition: 'width 0.05s linear'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Subtitle Transcript Banner */}
        <div style={{
          background: '#090D16',
          border: '1px solid #1E293B',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#D0DFE2',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '9.5px', background: '#2C4A52', color: '#94A3B8', padding: '2px 5px', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase' }}>
            Sample transcript
          </span>
          <span style={{ fontStyle: 'italic', color: liveTranscript ? '#38BDF8' : '#52707C' }}>
            {liveTranscript || 'Listening for sample scenario audio...'}
          </span>
        </div>
      </div>

      {/* SECTION 2: AUTONOMOUS COPILOT ACTIONS & FIRST-AID GUIDANCE (FULLY FUNCTIONAL) */}
      <div style={{
        background: '#081224',
        borderBottom: '1px solid #16243C',
        padding: '8px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flexShrink: 0
      }}>
        <div style={{ fontSize: '9px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Simulation actions & safety boundary</span>
          {isMetronomeActive && (
            <span style={{ color: '#B91C1C', fontWeight: 800 }}>
 Beat {metronomeBeat} ({compressionCount}/30)
            </span>
          )}
        </div>

        {/* 4 Core Action Buttons (Each executes real sound, telemetry & state) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {/* Action 1: 110 BPM CPR */}
          <button
            onClick={handleTriggerCPR}
            title="Start sample 110 BPM pacing beat"
            style={{
              background: isMetronomeActive ? '#DC2626' : '#0B172E',
              border: isMetronomeActive ? '1px solid #B91C1C' : '1px solid #1E2D48',
              color: '#FFF',
              borderRadius: '7px',
              padding: '6px 4px',
              fontSize: '9.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              boxShadow: isMetronomeActive ? '0 0 12px rgba(220, 38, 38, 0.6)' : 'none'
            }}
          >
            <Heart size={13} color="#B91C1C" className={isMetronomeActive ? 'animate-ping' : ''} />
            <span>{isMetronomeActive ? `Beat (${metronomeBeat})` : '110 BPM beat'}</span>
          </button>

          {/* Action 2: Cath chime Lab */}
          <button
            onClick={handlePreAlertCathLab}
            title="Play sample cath-lab alert chime; nothing is transmitted"
            style={{
              background: '#0B172E',
              border: '1px solid #1E2D48',
              color: '#38BDF8',
              borderRadius: '7px',
              padding: '6px 4px',
              fontSize: '9.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px'
            }}
          >
 <span style={{ fontSize: '13px'}}></span>
            <span>Cath chime</span>
          </button>

          {/* Action 3: Route siren */}
          <button
            onClick={handleGreenCorridor}
            title="Play sample route siren; no traffic control"
            style={{
              background: '#0B172E',
              border: '1px solid #1E2D48',
              color: '#F59E0B',
              borderRadius: '7px',
              padding: '6px 4px',
              fontSize: '9.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px'
            }}
          >
 <span style={{ fontSize: '13px'}}></span>
            <span>Route siren</span>
          </button>

          {/* Action 4: Handoff preview */}
          <button
            onClick={handleOpenHandover}
            title="Open local handoff preview"
            style={{
              background: '#0B172E',
              border: '1px solid #047857',
              color: '#34D399',
              borderRadius: '7px',
              padding: '6px 4px',
              fontSize: '9.5px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px'
            }}
          >
 <span style={{ fontSize: '13px'}}></span>
            <span>Handoff preview</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: ASSIGNED PARAMEDIC DRIVER CONTACT BAR */}
      <div style={{
        background: '#0B1D36',
        borderBottom: '1px solid #1E3860',
        padding: '7px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: '#0284C7', padding: '5px', borderRadius: '6px' }}>
            <Car size={13} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#FFFFFF' }}>
              EMT Driver: Rajesh Meena (A-12)
            </div>
            <div style={{ fontSize: '9.5px', color: '#38BDF8', fontWeight: 700 }}>
              Mobile: +91 00000 00007 • Speed: 46 km/h
            </div>
          </div>
        </div>

        <button
          onClick={handleCallDriver}
          style={{
            background: '#047857',
            border: 'none',
            color: '#FFFFFF',
            borderRadius: '6px',
            padding: '5px 9px',
            fontSize: '10px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
          }}
        >
          <PhoneCall size={11} />
          <span>Call Driver</span>
        </button>
      </div>



      {/* SECTION 4: DYNAMIC REAL-TIME EVENT STREAM & OPERATOR INTERACTION FEED */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        fontSize: '11px'
      }}>
        {copilotEvents.map((ev) => (
          <div
            key={ev.id}
            style={{
              background: ev.type === 'cpr' 
                ? 'rgba(239, 68, 68, 0.15)' 
                : ev.type === 'corridor' 
                ? 'rgba(245, 158, 11, 0.15)' 
                : ev.type === 'cathlab' 
                ? 'rgba(56, 189, 248, 0.15)' 
                : ev.type === 'user' 
                ? '#0284C7' 
                : '#0D1E3A',
              border: ev.type === 'cpr' 
                ? '1px solid #DC2626' 
                : ev.type === 'corridor' 
                ? '1px solid #B45309' 
                : ev.type === 'cathlab' 
                ? '1px solid #0284C7' 
                : '1px solid #1E3456',
              borderRadius: '8px',
              padding: '7px 10px',
              lineHeight: 1.4
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: ev.type === 'cpr' ? '#FCA5A5' : '#38BDF8' }}>
                {ev.title}
              </span>
              <span style={{ fontSize: '8px', color: '#94A3B8', fontFamily: 'monospace' }}>
                {ev.time}
              </span>
            </div>
            <div style={{ color: '#F1F5F9', fontSize: '10.5px' }}>
              {ev.text}
            </div>
          </div>
        ))}
        <div ref={eventsEndRef} />
      </div>

      {/* SECTION 5: INTERACTIVE PROMPT INPUT (PLUGGABLE FOR EXTERNAL AI / LLM) */}
      <form
        onSubmit={handleSendMessage}
        style={{
          background: '#050D1A',
          borderTop: '1px solid #14223A',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0
        }}
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Ask Copilot (e.g. CPR guidance, road ETA, bed handover...)"
          style={{
            flex: 1,
            background: '#09152B',
            border: '1px solid #162B4D',
            borderRadius: '6px',
            padding: '7px 10px',
            color: '#FFFFFF',
            fontSize: '11px',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          style={{
            background: '#DC2626',
            border: 'none',
            color: '#FFF',
            borderRadius: '6px',
            padding: '7px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}
