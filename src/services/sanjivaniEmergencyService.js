/**
 * Sanjivani-108 prototype emergency simulator.
 *
 * Browser APIs may provide microphone capture, location, map lookup, speech, and
 * a sample beat. Triage labels are local sample keyword rules, not clinical
 * triage, dispatch authorization, or first-aid instructions.
 */

import { EVON_MODEL_METADATA } from './gnaniEvonService.js';
import { apiUrl, authHeaders } from '../utils/apiBase.js';
import { cleanTextForSpeech, getBestVoice } from '../utils/speechSanitizer.js';
import { speechService } from './indicSpeechService.js';

export function isWithinIndia(lat, lon) {
  const nLat = Number(lat);
  const nLon = Number(lon);
  return !isNaN(nLat) && !isNaN(nLon) && nLat >= 6.5 && nLat <= 37.5 && nLon >= 68.0 && nLon <= 97.5;
}

// In-Memory Fast Caches for 0ms Navigation
const reverseGeocodeCache = new Map();
let cachedDeviceLocation = null;
let cachedLocationTimestamp = 0;

// API tokens from Vite env
const MAPBOX_TOKEN_GEO = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MAPBOX_ACCESS_TOKEN) || '';
const IPINFO_TOKEN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_IPINFO_TOKEN) || '';
const LOCATIONIQ_TOKEN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LOCATIONIQ_TOKEN) || '';

/**
 * Reverse geocode GPS coordinates to a human-readable place name.
 * Priority: LocationIQ (best for Indian villages/mandals) → Mapbox → Nominatim
 */
export async function reverseGeocodeGPS(lat, lon) {
  const cacheKey = `${Number(lat).toFixed(3)},${Number(lon).toFixed(3)}`;
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey);
  }

  // Helper to save to cache and return
  const returnAndCache = (res) => {
    reverseGeocodeCache.set(cacheKey, res);
    return res;
  };

  // 1. LocationIQ — best for Indian village/mandal level names (Annavaram, Tuni, etc.)
  if (LOCATIONIQ_TOKEN) {
    try {
      const url = `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_TOKEN}&lat=${lat}&lon=${lon}&format=json&zoom=16&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        const a = data.address || {};
        // Village > town > suburb > city — most granular first
        const localName = a.village || a.hamlet || a.town || a.suburb || a.city_district || a.city || a.county || '';
        const district = a.county || a.state_district || a.district || '';
        const state = a.state || 'India';
        const postcode = a.postcode || '';
        const displayParts = [localName, district, state].filter(Boolean);
        return returnAndCache({
          displayName: displayParts.join(', ') || data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
          road: a.road || a.pedestrian || a.footway || localName || 'Main Road',
          neighborhood: a.suburb || a.neighbourhood || a.village || a.hamlet || '',
          city: a.city || a.town || a.county || localName || 'Local',
          state,
          postcode,
          source: 'LocationIQ',
          raw: data
        });
      }
    } catch (err) {
      console.warn('LocationIQ reverse geocode failed:', err.message);
    }
  }

  // 2. Mapbox — good for towns and districts
  if (MAPBOX_TOKEN_GEO) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?types=place,locality,neighborhood,address&language=en&access_token=${MAPBOX_TOKEN_GEO}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        const feature = data.features?.[0];
        if (feature) {
          const parts = [feature.text];
          (feature.context || []).forEach(ctx => {
            if (ctx.id.startsWith('place') || ctx.id.startsWith('region') || ctx.id.startsWith('district')) {
              parts.push(ctx.text);
            }
          });
          const displayName = parts.filter(Boolean).slice(0, 4).join(', ');
          const postcode = (feature.context || []).find(c => c.id.startsWith('postcode'))?.text || '';
          return returnAndCache({
            displayName,
            road: feature.properties?.address || feature.place_name || displayName,
            neighborhood: feature.text || '',
            city: (feature.context || []).find(c => c.id.startsWith('place'))?.text || '',
            state: (feature.context || []).find(c => c.id.startsWith('region'))?.text || 'India',
            postcode,
            source: 'Mapbox',
            raw: feature
          });
        }
      }
    } catch (err) {
      console.warn('Mapbox reverse geocode failed:', err.message);
    }
  }

  // 3. OSM Nominatim — free fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'AyuSwar-Sanjivani108-EmergencyAgent/2.0' }, signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const data = await res.json();
      const a = data.address || {};
      const localName = a.village || a.hamlet || a.town || a.suburb || a.city_district || a.city || a.county || '';
      const district = a.county || a.state_district || '';
      const state = a.state || 'India';
      const postcode = a.postcode || '';
      const displayParts = [localName, district, state].filter(Boolean);
      return returnAndCache({
        displayName: displayParts.join(', ') || data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`,
        road: a.road || a.pedestrian || a.footway || localName || 'Main Road',
        neighborhood: a.suburb || a.neighbourhood || a.village || '',
        city: a.city || a.town || a.county || localName || 'Local',
        state,
        postcode,
        source: 'Nominatim',
        raw: data
      });
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode failed:', err.message);
  }

  return returnAndCache({
    displayName: `${lat.toFixed(5)}°N, ${lon.toFixed(5)}°E`,
    road: 'Locating...',
    neighborhood: '',
    city: 'Local Emergency Sector',
    state: 'India',
    postcode: '',
    source: 'coordinate',
    raw: null
  });
}

/**
 * Request real device location.
 * Priority: Browser GPS (exact) → ipinfo.io (accurate city) → ipapi.co → freeipapi.com → offline default
 */
export function requestRealDeviceLocation() {
  // If we already resolved a location in the last 5 minutes, return it in 0ms!
  if (cachedDeviceLocation && (Date.now() - cachedLocationTimestamp < 5 * 60 * 1000)) {
    return Promise.resolve(cachedDeviceLocation);
  }

  return new Promise((resolve) => {
    const handleResolved = (loc) => {
      cachedDeviceLocation = loc;
      cachedLocationTimestamp = Date.now();
      resolve(loc);
    };

    const fetchIpLocation = async () => {
      // 1. ipinfo.io — most accurate IP geo for India (50k free/month), knows small towns
      try {
        const url = IPINFO_TOKEN
          ? `https://ipinfo.io/json?token=${IPINFO_TOKEN}`
          : 'https://ipinfo.io/json';
        const res = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(4500) });
        if (res.ok) {
          const data = await res.json();
          if (data.loc) {
            const [rawLat, rawLng] = data.loc.split(',').map(Number);
            if (!isNaN(rawLat) && !isNaN(rawLng)) {
              return {
                latitude: rawLat,
                longitude: rawLng,
                accuracy: 1500,
                city: data.city || 'Local Area',
                region: data.region || 'Andhra Pradesh',
                isIpGeo: true,
                ipGeoSource: 'ipinfo.io',
                timestamp: Date.now()
              };
            }
          }
        }
      } catch (e) {
        console.warn('ipinfo.io unavailable:', e.message);
      }

      // 2. freeipapi.com fallback
      try {
        const res = await fetch('https://freeipapi.com/api/json', {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(4500)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            return {
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
              accuracy: 2500,
              city: data.cityName || 'Local Area',
              region: data.regionName || 'Andhra Pradesh',
              isIpGeo: true,
              ipGeoSource: 'freeipapi.com',
              timestamp: Date.now()
            };
          }
        }
      } catch (e) {
        console.warn('freeipapi.com unavailable:', e.message);
      }

      // 3. ipapi.co fallback
      try {
        const res = await fetch('https://ipapi.co/json/', {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(4500)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            return {
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
              accuracy: 3000,
              city: data.city || 'Local Area',
              region: data.region || 'Andhra Pradesh',
              isIpGeo: true,
              ipGeoSource: 'ipapi.co',
              timestamp: Date.now()
            };
          }
        }
      } catch (e) {
        console.warn('ipapi.co unavailable:', e.message);
      }

      // 4. Offline default — Annavaram, Andhra Pradesh (User's home town)
      return {
        latitude: 17.2790,
        longitude: 82.4042,
        accuracy: 100,
        city: 'Annavaram',
        region: 'Andhra Pradesh',
        isIpGeo: false,
        ipGeoSource: 'offline-default',
        isFallback: true,
        timestamp: Date.now()
      };
    };

    if (!navigator.geolocation) {
      fetchIpLocation().then(handleResolved);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Always trust real GPS — exact coordinates from device hardware
        handleResolved({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 15),
          altitude: pos.coords.altitude,
          isHardwareGps: true,
          timestamp: pos.timestamp
        });
      },
      async (err) => {
        console.warn('GPS unavailable (err code', err.code, '):', err.message, '→ falling back to IP geo');
        const ipLoc = await fetchIpLocation();
        handleResolved(ipLoc);
      },
      {
        enableHighAccuracy: true,
        timeout: 2500, // Fast 2.5s timeout prevents page freeze
        maximumAge: 60000
      }
    );
  });
}

// Landmark voice parser: extracts landmarks & street cues from Indian code-mixed speech
export function extractLandmarksFromSpeech(transcript) {
  const text = transcript.toLowerCase();
  const landmarkPatterns = [
    /(?:near|paas|ke paas|samne|opposite|daggara|aduthu)\s+([a-zA-Z0-9\s]+?)(?:,|\.|\bhai|\bundi|\birukku|$)/i,
    /(?:gali no|road|sector|colony|gate no|hospital|temple|mandir|masjid|school|cross|junction|bridge|flyover)\s*([a-zA-Z0-9\s]+)/i,
    /(?:chandni chowk|aiims|kurnool|connaught place|whitefield|t nagar|indirapuram|kondapur)/i
  ];

  for (const regex of landmarkPatterns) {
    const match = text.match(regex);
    if (match && match[0]) {
      return match[0].trim();
    }
  }
  return null;
}

// Asynchronous Server Triage Gateway (/api/triage) with Local Rule Fallback
export async function fetchServerTriage(transcript, acousticPanicIndex = 70) {
  try {
    const res = await fetch(apiUrl('/api/triage'), {
      method: 'POST',
      headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, acousticPanicIndex })
    });
    if (res.ok) {
      const data = await res.json();
      const localRules = analyzeEmergencyClinicalTriage(transcript, acousticPanicIndex);
      return {
        ...localRules,
        triageLevel: data.triageLevel,
        severity: data.severity,
        executionSource: data.executionSource,
        modelEscalationApplied: Boolean(data.modelEscalationApplied),
        prototypeDisclaimer: data.prototypeDisclaimer || 'Prototype safeguard rules'
      };
    }
  } catch (err) {
    console.warn('Server triage fetch failed, falling back to local deterministic rules:', err.message);
  }
  return {
    ...analyzeEmergencyClinicalTriage(transcript, acousticPanicIndex),
    executionSource: 'LOCAL_RULES_FALLBACK'
  };
}

// Local sample keyword matcher for prototype triage categories
export function analyzeEmergencyClinicalTriage(transcript, acousticPanicIndex = 70) {
  const text = transcript.toLowerCase();
  
  // Sample red-keyword override (not a clinical rule): Chest pain + Sweating + Breathlessness (English & Telugu-script)
  const hasChestPain = /chest\s*pain|chest\s*discomfort|heart\s*pain|angina|pressure\s*in\s*chest|chhati\s*noppi|gundello\s*noppi|ఛాతీ\s*నొప్పి|గుండెల్లో\s*నొప్పి|ఛాతీలో\s*నొప్పి|గుండె\s*నొప్పి|గుండెలో\s*నొప్పి|ఛాతీ|గుండె|seena|chhati|heart/i.test(text);
  const hasSweating = /sweat|sweating|perspir|cold\s*sweat|diaphoresis|paseena|చెమట|చమట|చెమటలు|చమటలు|చల్లని\s*చెమటలు/i.test(text);
  const hasBreathless = /breath|breathless|breathlessness|shortness\s*of\s*breath|dyspnea|gasping|cant\s*breathe|can't\s*breathe|saans|oopiri|ఆయాసం|శ్వాస|ఊపిరి|దమ్ము|ఊపిరి\s*ఆడటం\s*లేదు/i.test(text);

  // Sample scenario keyword triggers (not validated triage triggers)
  const isRedFlagCardiacOverride = (hasChestPain && (hasSweating || hasBreathless)) || (hasChestPain && hasSweating && hasBreathless);
  const isCardiac = isRedFlagCardiacOverride || /chhati|chest|seena|heart|gir pade|behosh|unconscious|dhadkan|palpitations|stemi|gundello|గుండె|ఛాతీ|స్పృహ తప్పి|స్పృహ కోల్పో/i.test(text);
  const isPediatricRespiratory = /babu|bachha|child|baby|oopiri|saans|wheez|stridor|chhati lopalki|retraction|pasli chalna|blue lips|neela|ఆయాసం|శ్వాస|పిల్ల/i.test(text);
  const isTrauma = /accident|crash|lorry|car|bike|vandi|blood|khoon|raktham|fracture|haddi|trapped|sir phat|రక్తం|గాయం/i.test(text);
  const isAnaphylaxisOrStroke = /paralysis|bol nahi pa|face drop|slur|lakwa|soojan|throat choke|allerg|పక్షవాతం/i.test(text);

  if (isCardiac) {
    return {
      triageLevel: 'RED',
      severity: 'SIMULATED RED - urgent sample category',
      targetResponseSec: 8,
      suspectedCondition: 'Sample chest-pain pattern (not a diagnosis)',
      icd10: 'sample reference only: I21.9 / I46.9',
      priorityProtocol: 'Prototype escalation preview; call official emergency services',
      triageMethod: 'LOCAL_SAMPLE_KEYWORD_RULE',
      isEmergencyOverride: true,
      firstAidKey: 'cpr_cardiac',
      firstAidInstructions: [
        'Call 112 or 108 now and follow the official emergency dispatcher.',
        'Share the exact location and stay with the person until help arrives.',
        'Move the person only if they are in immediate danger.',
        'Do not use this prototype to choose treatment or delay emergency care.'
      ],
      firstAidVernacular: {
        hi: 'अभी 112 या 108 को कॉल करें और डिस्पैचर के निर्देशों का पालन करें। यह ऐप इलाज तय नहीं करता।',
        te: 'ఇప్పుడే 112 లేదా 108కు కాల్ చేసి డిస్పాచర్ సూచనలు పాటించండి. ఈ యాప్ చికిత్స నిర్ణయించదు.',
        en: 'Call 112 or 108 now and follow the dispatcher. This app does not decide treatment.'
      }
    };
  }

  if (isPediatricRespiratory) {
    return {
      triageLevel: 'RED',
      severity: 'SIMULATED RED - pediatric breathing sample',
      targetResponseSec: 10,
      suspectedCondition: 'Sample pediatric breathing-distress pattern (not a diagnosis)',
      icd10: 'sample reference only: J45.901 / J38.5',
      priorityProtocol: 'Prototype escalation preview; call official emergency services',
      triageMethod: 'LOCAL_SAMPLE_KEYWORD_RULE',
      isEmergencyOverride: true,
      firstAidKey: 'pediatric_airway',
      firstAidInstructions: [
        'Call 112 or 108 now and follow the official emergency dispatcher.',
        'Share the exact location and stay with the person until help arrives.',
        'Move the person only if they are in immediate danger.',
        'Do not use this prototype to choose treatment or delay emergency care.'
      ],
      firstAidVernacular: {
        hi: 'अभी 112 या 108 को कॉल करें और डिस्पैचर के निर्देशों का पालन करें। यह ऐप इलाज तय नहीं करता।',
        te: 'ఇప్పుడే 112 లేదా 108కు కాల్ చేసి డిస్పాచర్ సూచనలు పాటించండి. ఈ యాప్ చికిత్స నిర్ణయించదు.',
        en: 'Call 112 or 108 now and follow the dispatcher. This app does not decide treatment.'
      }
    };
  }

  if (isTrauma) {
    return {
      triageLevel: 'RED',
      severity: 'SIMULATED RED - trauma keyword sample',
      targetResponseSec: 12,
      suspectedCondition: 'Sample trauma/bleeding pattern (not a diagnosis)',
      icd10: 'sample reference only: T07 / R57.1',
      priorityProtocol: 'Prototype escalation preview; call official emergency services',
      triageMethod: 'LOCAL_SAMPLE_KEYWORD_RULE',
      isEmergencyOverride: true,
      firstAidKey: 'trauma_hemorrhage',
      firstAidInstructions: [
        'Call 112 or 108 now and follow the official emergency dispatcher.',
        'Share the exact location and stay with the person until help arrives.',
        'Move the person only if they are in immediate danger.',
        'Do not use this prototype to choose treatment or delay emergency care.'
      ],
      firstAidVernacular: {
        hi: 'अभी 112 या 108 को कॉल करें और डिस्पैचर के निर्देशों का पालन करें। यह ऐप इलाज तय नहीं करता।',
        te: 'ఇప్పుడే 112 లేదా 108కు కాల్ చేసి డిస్పాచర్ సూచనలు పాటించండి. ఈ యాప్ చికిత్స నిర్ణయించదు.',
        en: 'Call 112 or 108 now and follow the dispatcher. This app does not decide treatment.'
      }
    };
  }

  // Moderate / Yellow Triage Fallback
  return {
    triageLevel: acousticPanicIndex > 75 ? 'RED' : 'YELLOW',
    severity: acousticPanicIndex > 75 ? 'SIMULATED RED - urgent acoustic sample' : 'SIMULATED YELLOW - moderate sample',
    targetResponseSec: 25,
    suspectedCondition: 'Sample medical-distress pattern (not a diagnosis)',
    icd10: 'sample reference only: R68.89',
    priorityProtocol: 'Prototype escalation preview; call official emergency services',
    triageMethod: 'LOCAL_SAMPLE_KEYWORD_RULE',
    isEmergencyOverride: false,
    firstAidKey: 'general_stabilize',
    firstAidInstructions: [
        'Call 112 or 108 now and follow the official emergency dispatcher.',
        'Share the exact location and stay with the person until help arrives.',
        'Move the person only if they are in immediate danger.',
        'Do not use this prototype to choose treatment or delay emergency care.'
      ],
    firstAidVernacular: {
        hi: 'अभी 112 या 108 को कॉल करें और डिस्पैचर के निर्देशों का पालन करें। यह ऐप इलाज तय नहीं करता।',
        te: 'ఇప్పుడే 112 లేదా 108కు కాల్ చేసి డిస్పాచర్ సూచనలు పాటించండి. ఈ యాప్ చికిత్స నిర్ణయించదు.',
        en: 'Call 112 or 108 now and follow the dispatcher. This app does not decide treatment.'
      }
    };
}

// WebAudio Sound Synthesizer: sample beat and demo sounds
class SanjivaniAudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.metronomeInterval = null;
    this.isMetronomePlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Plays a single crisp woodblock/metronome click
  playClickSound(frequency = 880, duration = 0.04) {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio click error:', e);
    }
  }

  // Starts a sample 110 BPM beat for demonstration timing
  startCPRMetronome(onBeat) {
    this.init();
    this.stopCPRMetronome();
    this.isMetronomePlaying = true;
    let count = 0;
    const intervalMs = (60 / 110) * 1000; // ~545ms

    this.metronomeInterval = setInterval(() => {
      count = (count % 4) + 1;
      const freq = count === 1 ? 1046.5 : 784; // High tone on beat 1
      this.playClickSound(freq, 0.05);
      if (onBeat) onBeat(count);
    }, intervalMs);
  }

  stopCPRMetronome() {
    if (this.metronomeInterval) {
      clearInterval(this.metronomeInterval);
      this.metronomeInterval = null;
    }
    this.isMetronomePlaying = false;
  }

  // Plays a subtle two-tone demo chime
  playRadioChime() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      gain.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);
    } catch (e) {
      console.warn('Chime error:', e);
    }
  }

  // Plays a two-tone demo siren sound
  playEmergencySiren() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      
      // Siren wail: 700Hz to 1100Hz and back
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.35);
      osc.frequency.linearRampToValueAtTime(700, now + 0.7);
      osc.frequency.linearRampToValueAtTime(1100, now + 1.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 1.4);
    } catch (e) {
      console.warn('Siren error:', e);
    }
  }

  // Plays a distinctive disconnect tone when call ends
  playCallEndBeep() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Call end tone error:', e);
    }
  }

  // Speaks guidance using unified Indic Speech Service (coordinating mutex and echo blanking)
  speakGuidance(text) {
    if (!text || typeof window === 'undefined') return;
    try {
      const clean = cleanTextForSpeech(text);
      if (!clean) return;
      speechService.speak(clean, {
        channel: 'sanjivani_guidance',
        rate: 0.94,
        pitch: 1.0
      });
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }
}

export const sanjivaniAudio = new SanjivaniAudioSynthesizer();

export function simulateEvonDispatchPipeline({
  coords,
  landmark,
  hospitalName: customHospitalName,
  triageData,
  onToolStep,
  onComplete
}) {
  const ambulanceId = `SIM-ALS-108-${Math.floor(1000 + Math.random() * 9000)}`;
  const driverName = 'Simulation Crew (Demo EMT)';
  const hospitalName = customHospitalName || (triageData?.triageLevel === 'RED' 
    ? 'Regional Tertiary Hospital (Simulation Bay)' 
    : 'District Hospital Emergency Ward (Simulation)');

  const tools = [
    {
      id: 'tool_1',
      name: '[SIMULATION] Telephony Coordinate Triangulation',
      desc: 'Simulating caller coordinates and landmark resolution...',
      durationMs: 700,
      output: {
        gps: `${coords?.latitude?.toFixed(5) || 15.8281}° N, ${coords?.longitude?.toFixed(5) || 78.0373}° E`,
        accuracy: `±${coords?.accuracy || 15}m (Simulated)`,
        landmarkExtracted: landmark || 'Demonstration Landmark',
        isSimulation: true
      }
    },
    {
      id: 'tool_2',
      name: '[SIMULATION] GIS Demo Vehicle Search',
      desc: 'Simulating nearest demonstration vehicle selection...',
      durationMs: 900,
      output: {
        assignedVehicle: ambulanceId,
        driver: driverName,
        currentLocation: 'Nearby Transit Corridor (Simulated 1.8 km away)',
        calculatedEtaSec: 280, // ~4.6 mins
        isSimulation: true
      }
    },
    {
      id: 'tool_3',
      name: '[SIMULATION] Hospital Emergency Bay Pre-Notification',
      desc: `Simulating emergency triage transmission to ${hospitalName}...`,
      durationMs: 800,
      output: {
        facility: hospitalName,
        triageCode: triageData?.triageLevel || 'YELLOW',
        bedAssigned: null,
        reservationStatus: 'No hospital bay reserved',
        note: 'SIMULATION ONLY — In a real emergency, emergency staff must be contacted via 112 / 108.',
        isSimulation: true
      }
    },
    {
      id: 'tool_4',
      name: '[SIMULATION] Paramedic Synthetic Audio Briefing',
      desc: 'Simulating audio handover note for paramedic demonstration tablet...',
      durationMs: 850,
      output: {
        audioStatus: 'Synthesized demonstration audio',
        briefContent: `Simulation Alert: Sample distress pattern at ${landmark || 'GPS location'}. Caller screen shows a generic emergency-contact checklist, not treatment guidance.`,
        isSimulation: true
      }
    },
    {
      id: 'tool_5',
      name: '[SIMULATION] Demonstration Tracking Link Generator',
      desc: 'Generating mock tracking interface token for prototype review...',
      durationMs: 650,
      output: {
        dispatchId: `SIM-DISPATCH-${Date.now().toString().slice(-6)}`,
        note: 'PROTOTYPE SIMULATION ONLY — No live ambulance has been dispatched. Call 112 / 108 for real medical emergency.',
        isSimulation: true
      }
    }
  ];

  let currentStep = 0;

  function runNextStep() {
    if (currentStep >= tools.length) {
      if (onComplete) {
        onComplete({
          ambulanceId,
          driverName,
          hospitalName,
          etaMinutes: 4.6,
          dispatchTimestamp: new Date().toLocaleTimeString('en-IN', { hour12: true })
        });
      }
      return;
    }

    const step = tools[currentStep];
    if (onToolStep) {
      onToolStep(step, currentStep, tools.length);
    }
    sanjivaniAudio.playRadioChime();

    setTimeout(() => {
      currentStep++;
      runNextStep();
    }, step.durationMs);
  }

  runNextStep();
}

// -------------------------------------------------------------
// EMERGENCY HOSPITAL DISCOVERY, BED BOOKING & INTIMATION ENGINE
// -------------------------------------------------------------

// Haversine formula to compute real spherical distance in kilometers
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((R * c) * 10) / 10;
}

/**
 * Discovers Real Emergency Hospitals around Caller GPS Coordinates
 * Supports regional centers across Andhra Pradesh, Delhi NCR, Kurnool, and Pan-India.
 */
export async function fetchNearbyEmergencyHospitals(callerLat, callerLon, triageCondition = '') {
  try {
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json][timeout:3];node["amenity"="hospital"](around:25000,${callerLat},${callerLon});out 5;`;
    const res = await fetch(overpassUrl, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.elements)) {
        return data.elements
          .filter((elem) => elem.tags?.name)
          .map((elem) => {
            const distanceKm = calculateHaversineDistanceKm(callerLat, callerLon, elem.lat, elem.lon);
            return {
              id: `hosp_osm_${elem.id}`,
              name: elem.tags.name,
              city: elem.tags['addr:city'] || 'Nearby area',
              state: elem.tags['addr:state'] || 'India',
              lat: elem.lat,
              lon: elem.lon,
              distanceKm,
              etaMinutes: Math.max(3, Math.round((distanceKm / 32) * 60 + 2)),
              type: 'OpenStreetMap place result',
              tier: 'Emergency capability not verified',
              emergencyBeds: null,
              specialties: [],
              onDutyCmo: null,
              hotline: elem.tags.phone || 'Emergency services: 112 / 108',
              stemiReady: null,
              picuReady: null,
              traumaBayReady: null,
              dataSource: 'OpenStreetMap place search',
              conditionMatchScore: null,
              note: `Place result only; capability, beds, and readiness are not verified${triageCondition ? ' for the sample scenario' : ''}.`
            };
          })
          .sort((a,b) => a.distanceKm - b.distanceKm);
      }
    }
  } catch (err) {
    console.warn('OSM hospital compatibility lookup failed:', err.message);
  }
  return [];
}

/**
 * Executes Instant Emergency Bed Booking & Pre-Arrival Hospital Intimation
 */
export async function intimateAndBookHospitalEmergencyBed({
  hospital,
  callerCoords,
  callerAddress,
  callerLandmark,
  triageData,
  patientSummary
}) {
  return {
    simulationOnly: true,
    bookingToken: null,
    hospitalName: hospital?.name || 'Selected map place',
    abdmHfrId: null,
    bedAssigned: null,
    triageLevel: triageData?.triageLevel || 'SIMULATED',
    suspectedCondition: triageData?.suspectedCondition || 'Sample scenario',
    icd10: triageData?.icd10 || null,
    etaMinutes: hospital?.etaMinutes ?? null,
    distanceKm: hospital?.distanceKm ?? null,
    attendingCmo: null,
    hotline: 'Emergency services: 112 / 108',
    lockTimestamp: new Date().toLocaleTimeString('en-IN', { hour12: true }),
    patientVitalsSummary: patientSummary || 'No real patient vitals submitted',
    callerCoords,
    callerAddress,
    callerLandmark,
    preArrivalRadioAlert: 'SIMULATION PREVIEW ONLY: no hospital was contacted, no bed or bay was reserved, and no ambulance was dispatched. Call 112 / 108 for a real emergency.'
  };
}
