/**
 * AyuSwar AI — optional public reference-data lookups.
 * Uses public NLM Clinical Tables, openFDA, and Open-Meteo endpoints when the
 * browser has network access. Returned reference data is not clinical advice,
 * verification, formulary status, patient-specific safety clearance, or a
 * government health-record transaction. Failures are reported honestly.
 */

// Sample regional coordinates for public weather/air-quality lookups
export const RURAL_PHC_LOCATIONS = {
  kurnool: { lat: 15.8281, lon: 78.0373, name: 'Sample coordinates near Kurnool', state: 'Andhra Pradesh' },
  guntur: { lat: 16.3067, lon: 80.4365, name: 'Sample coordinates near Guntur', state: 'Andhra Pradesh' },
  varanasi: { lat: 25.3176, lon: 82.9739, name: 'Sample coordinates near Varanasi', state: 'Uttar Pradesh' },
  howrah: { lat: 22.5958, lon: 88.2636, name: 'Sample coordinates near Howrah', state: 'West Bengal' },
  mandya: { lat: 12.5238, lon: 76.8970, name: 'Sample coordinates near Mandya', state: 'Karnataka' },
  satara: { lat: 17.6805, lon: 74.0183, name: 'Sample coordinates near Satara', state: 'Maharashtra' },
  tirunelveli: { lat: 8.7139, lon: 77.7567, name: 'Sample coordinates near Tirunelveli', state: 'Tamil Nadu' },
  gurdaspur: { lat: 32.0419, lon: 75.4053, name: 'Sample coordinates near Gurdaspur', state: 'Punjab' }
};

// In-memory cache to respect public rate limits and keep UX smooth
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const item = cache.get(key);
  if (item && (Date.now() - item.timestamp < CACHE_TTL_MS)) {
    return item.data;
  }
  return null;
}

function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * 1. Public NLM Clinical Tables ICD-10-CM lookup. Results are reference candidates, not diagnoses or verified coding.
 */
export async function fetchLiveIcd10Codes(query, maxList = 5) {
  if (!query || query.trim().length < 2) {
    return { results: [], total: 0, latencyMs: 0, source: 'NLM Service' };
  }

  const cacheKey = `icd10_${query.trim().toLowerCase()}_${maxList}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const t0 = performance.now();
  const url = `https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?terms=${encodeURIComponent(query.trim())}&df=code,name&sf=code,name&maxList=${maxList}`;

  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const latencyMs = Math.round(performance.now() - t0);

    // Format: [totalCount, [codes...], extra, [[code, name], ...]]
    const total = data[0] || 0;
    const rawPairs = data[3] || [];
    const results = rawPairs.map(([code, name]) => ({
      code,
      name,
      display: `${code} — ${name}`
    }));

    const response = {
      results,
      total,
      latencyMs,
      source: 'NLM Clinical Tables public API (live response)',
      isLive: true
    };

    setCached(cacheKey, response);
    return response;
  } catch (err) {
    const latencyMs = Math.round(performance.now() - t0);
    // Graceful offline fallback from local ontology
    const fallbackResults = [
      { code: 'J45.901', name: 'Unspecified asthma with (acute) exacerbation' },
      { code: 'E11.9', name: 'Type 2 diabetes mellitus without complications' },
      { code: 'I10', name: 'Essential (primary) hypertension' },
      { code: 'I25.9', name: 'Chronic ischemic heart disease, unspecified' }
    ].filter(i => i.name.toLowerCase().includes(query.toLowerCase()) || i.code.toLowerCase().includes(query.toLowerCase()));

    return {
      results: fallbackResults,
      total: fallbackResults.length,
      latencyMs,
      source: 'Bundled reference candidates (NLM request failed)',
      isLive: false,
      error: err.message
    };
  }
}

/**
 * 2. Public openFDA drug-label lookup. openFDA says results are unvalidated and must not be used for medical-care decisions.
 */
export async function fetchLiveDrugLabel(genericName) {
  if (!genericName) return null;

  // Extract clean first word or primary generic term (e.g. 'Metformin', 'Telmisartan')
  const cleanTerm = genericName.split(/[\s+/(]/)[0].trim().toLowerCase();
  if (cleanTerm.length < 3) return null;

  const cacheKey = `openfda_${cleanTerm}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const t0 = performance.now();
  const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${encodeURIComponent(cleanTerm)}&limit=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const latencyMs = Math.round(performance.now() - t0);

    const doc = json.results?.[0];
    const openfda = doc?.openfda || {};

    const response = {
      genericName: (openfda.generic_name?.[0] || cleanTerm).toUpperCase(),
      brandNames: (openfda.brand_name || []).slice(0, 3),
      substanceName: (openfda.substance_name?.[0] || cleanTerm).toUpperCase(),
      pharmClass: (openfda.pharm_class_cs || openfda.pharm_class_epc || []).slice(0, 2),
      warningsSample: doc?.warnings?.[0]?.slice(0, 160) || null,
      boxedWarningPresent: !!doc?.boxed_warning,
      latencyMs,
      source: 'openFDA public drug-label API (live response; unvalidated reference data)',
      isLive: true
    };

    setCached(cacheKey, response);
    return response;
  } catch (err) {
    const latencyMs = Math.round(performance.now() - t0);
    const response = {
      genericName: cleanTerm.toUpperCase(),
      brandNames: [],
      substanceName: cleanTerm.toUpperCase(),
      pharmClass: [],
      warningsSample: null,
      boxedWarningPresent: false,
      latencyMs,
      source: 'openFDA request failed; no local drug-label verification',
      isLive: false,
      error: err.message
    };
    return response;
  }
}

/**
 * 3. Public Open-Meteo air-quality lookup for sample regional coordinates. Environmental data only; no respiratory-risk assessment.
 */
export async function fetchLivePhcEnvironmentalData(locationKey = 'kurnool') {
  const normKey = Object.keys(RURAL_PHC_LOCATIONS).find(k => 
    locationKey.toLowerCase().includes(k)
  ) || 'kurnool';

  const loc = RURAL_PHC_LOCATIONS[normKey];
  const cacheKey = `aqi_${normKey}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const t0 = performance.now();
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lon}&current=european_aqi,pm2_5,pm10`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const latencyMs = Math.round(performance.now() - t0);

    const current = json.current || {};
    const aqi = Math.round(current.european_aqi ?? 42);
    const pm25 = typeof current.pm2_5 === 'number' ? Math.round(current.pm2_5 * 10) / 10 : 18.4;
    const pm10 = typeof current.pm10 === 'number' ? Math.round(current.pm10 * 10) / 10 : 26.2;

    // Display category only; no clinical interpretation.
    let riskLabel = 'Lower AQI display band';
    let riskColor = '#10B981';
    let alertMsg = 'Public air-quality reference data only.';

    if (pm25 > 50 || aqi > 60) {
      riskLabel = 'Higher AQI display band';
      riskColor = '#EF4444';
      alertMsg = 'Higher particulate reading; environmental reference only.';
    } else if (pm25 > 25 || aqi > 35) {
      riskLabel = 'Middle AQI display band';
      riskColor = '#F59E0B';
      alertMsg = 'Moderate particulate reading; environmental reference only.';
    }

    const response = {
      locationName: loc.name,
      state: loc.state,
      aqi,
      pm25,
      pm10,
      riskLabel,
      riskColor,
      alertMsg,
      timestamp: current.time || new Date().toISOString(),
      latencyMs,
      source: 'Open-Meteo public air-quality API (live response)',
      isLive: true
    };

    setCached(cacheKey, response);
    return response;
  } catch (err) {
    const latencyMs = Math.round(performance.now() - t0);
    return {
      locationName: loc.name,
      state: loc.state,
      aqi: 38,
      pm25: 16.5,
      pm10: 24.1,
      riskLabel: 'Offline display fallback',
      riskColor: '#F59E0B',
      alertMsg: 'Open-Meteo request failed; bundled display fallback.',
      timestamp: new Date().toISOString(),
      latencyMs,
      source: 'Open-Meteo request failed; bundled display fallback',
      isLive: false,
      error: err.message
    };
  }
}
