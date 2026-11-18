/**
 * Emergency-area facility search for the prototype.
 *
 * Uses OpenStreetMap/Nominatim (and optional Mapbox geocoding) to find nearby
 * place names and estimate straight-line distance. It does not use ABDM/HFR,
 * verify trauma capability, check beds, reserve bays, or dispatch ambulances.
 */

export const MAPBOX_TOKEN = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) || '';

// High-performance in-memory hospital discovery cache (0ms instant return for same area)
const hospitalsCache = new Map();

// Helper to compute Haversine distance in km
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
/**
 * Search localities, streets, landmarks, cities and pin codes across India
 * Uses OpenStreetMap Nominatim for universal coverage, supplemented by Mapbox
 */
export async function searchLocationUniversal(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();
  let results = [];

  // 1. Universal OpenStreetMap Nominatim Search (Covers every village, city, pin code in India)
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`;
    const res = await fetch(osmUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AyuSwar-Prototype-FacilitySearch/1.0'
      },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        results = data.map((item) => {
          const shortText = item.name || item.display_name.split(',')[0];
          return {
            id: `osm_place_${item.place_id}`,
            placeName: item.display_name,
            text: shortText,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            source: 'OpenStreetMap'
          };
        });
      }
    }
  } catch (err) {
    console.warn('OSM Geocode search error:', err.message);
  }

  // 2. Supplement with Mapbox Places if token is available and OSM returned few results
  if (results.length < 3 && MAPBOX_TOKEN) {
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?country=IN&types=address,neighborhood,locality,place,poi&limit=5&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        const mapboxResults = (data.features || []).map((f) => ({
          id: f.id,
          placeName: f.place_name,
          text: f.text,
          lat: f.center[1],
          lng: f.center[0],
          source: 'Mapbox'
        }));
        // Merge without duplicate coordinates
        const existingKeys = new Set(results.map(r => `${r.lat.toFixed(3)},${r.lng.toFixed(3)}`));
        mapboxResults.forEach(r => {
          const key = `${r.lat.toFixed(3)},${r.lng.toFixed(3)}`;
          if (!existingKeys.has(key)) {
            results.push(r);
          }
        });
      }
    } catch (err) {
      console.warn('Mapbox Geocode fallback error:', err.message);
    }
  }

  return results;
}

// Export backward-compatible alias
export const searchMapboxGeocode = searchLocationUniversal;

/**
 * Clean up hospital name from raw OpenStreetMap display_name
 */
function cleanHospitalName(rawName, rawDisplay, localityFallback) {
  if (rawName && rawName.trim().length > 2 && rawName.toLowerCase() !== 'hospital') {
    return rawName.trim();
  }
  if (rawDisplay) {
    const parts = rawDisplay.split(',').map(p => p.trim());
    if (parts[0] && parts[0].toLowerCase() !== 'hospital') {
      return parts[0];
    }
    if (parts.length > 1) {
      return `${parts[1]} Hospital`;
    }
  }
  return `${localityFallback ? localityFallback.split(',')[0] : 'Local'} Emergency Hospital`;
}

/**
 * Extract district / city from address text
 */
function extractCityOrDistrict(addressText = '') {
  const parts = addressText.split(',').map(s => s.trim());
  if (parts.length >= 3) {
    return parts[parts.length - 3] || parts[0];
  }
  return parts[0] || 'Local';
}

/**
 * Regional Hospital Presets for fallback when offline or in rural pockets without OSM nodes
 */
// No synthetic hospital or capability fallback is generated. An empty OSM result stays empty.

export function isCoordinateInIndia(lat, lng) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  return !isNaN(nLat) && !isNaN(nLng) && nLat >= 6.5 && nLat <= 37.5 && nLng >= 68.0 && nLng <= 97.5;
}

/**
 * Fetch nearby hospital place results with OpenStreetMap Nominatim, bounded to India.
 * Capability, ABDM/HFR status, beds, and readiness remain unknown.
 */
export async function fetchNearbyHospitalsAPI({
  lat = 15.8281,
  lng = 78.0373,
  geoAddress = '',
  filterOption = 'ALL'
} = {}) {
  const cacheKey = `${Math.round(Number(lat) * 100) / 100}_${Math.round(Number(lng) * 100) / 100}_${filterOption}`;
  if (hospitalsCache.has(cacheKey)) {
    return hospitalsCache.get(cacheKey);
  }

  let rawList = [];

  const effectiveLat = Number(lat);
  const effectiveLng = Number(lng);
  const effectiveAddress = geoAddress;

  // 1. Live OpenStreetMap Nominatim Query around user's coordinates (strictly countrycodes=in)
  try {
    const box = 0.22; // ~22km primary bounding box
    const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=hospital&viewbox=${effectiveLng - box},${effectiveLat + box},${effectiveLng + box},${effectiveLat - box}&bounded=1&limit=12`;
    
    let res = await fetch(osmUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AyuSwar-Prototype-FacilitySearch/1.0'
      },
      signal: AbortSignal.timeout(5000)
    });

    let data = [];
    if (res.ok) {
      data = await res.json();
    }

    // 2. If rural / fewer than 2 facilities found, expand search radius to 45km
    if (!Array.isArray(data) || data.length < 2) {
      const wideBox = 0.45; // ~45km broader district perimeter
      const wideUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=hospital&viewbox=${effectiveLng - wideBox},${effectiveLat + wideBox},${effectiveLng + wideBox},${effectiveLat - wideBox}&bounded=1&limit=12`;
      const wideRes = await fetch(wideUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AyuSwar-Prototype-FacilitySearch/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });
      if (wideRes.ok) {
        const wideData = await wideRes.json();
        if (Array.isArray(wideData) && wideData.length > 0) {
          data = wideData;
        }
      }
    }

    if (Array.isArray(data) && data.length > 0) {
      const seenNames = new Set();

      rawList = data
        .map((item, idx) => {
          const hospLat = parseFloat(item.lat);
          const hospLng = parseFloat(item.lon);
          const distKm = calculateHaversineDistance(effectiveLat, effectiveLng, hospLat, hospLng);
          const etaMinutes = Math.max(3, Math.round((distKm / 32) * 60 + 2));
          const cleanedName = cleanHospitalName(item.name, item.display_name, effectiveAddress);
          
          const shortName = cleanedName.split(' ')[0] + ' ' + (cleanedName.split(' ')[1] || 'Facility');

          return {
            id: `hosp_osm_${item.place_id || idx + 1}`,
            name: cleanedName,
            officialName: cleanedName,
            shortName,
            facilityType: 'Map search result',
            ownership: 'Not verified',
            address: item.display_name || `${cleanedName}, near selected location`,
            emergencyContact: 'Emergency Services: 112 / 108',
            lat: hospLat,
            lng: hospLng,
            distanceKm: distKm,
            etaMinutes: etaMinutes,
            dataSource: 'OpenStreetMap place search',
            isRealRetrievedPlace: true,
            traumaTier: 'Emergency capability not verified',
            cathLab: null,
            bedsAvailable: null,
            icuBeds: null,
            resuscitationBayAssigned: null,
            lastVerifiedAt: 'Map place retrieved; emergency capability not verified',
            bedAvailability: 'Capacity and beds not verified',
            matchReason: `Nearby map result (~${distKm} km, estimated drive time ~${etaMinutes} min)`
          };
        })
        .filter((h) => {
          const key = h.name.toLowerCase();
          if (seenNames.has(key)) return false;
          seenNames.add(key);
          return true;
        })
        .sort((a, b) => a.distanceKm - b.distanceKm);
    }
  } catch (err) {
    console.warn('Live OSM hospital retrieval error:', err.message);
  }

  // Sparse or unavailable OSM results are shown honestly; no fallback facilities are invented.

  // Rank only by estimated travel time; clinical capability is not scored or inferred.
  const scored = rawList.map((facility) => ({
    ...facility,
    score: Math.round((10 / facility.etaMinutes) * 100),
    capabilities: {
      emergencyDepartment: null,
      traumaTier: null,
      cathLab: null,
      icu: null,
      cardiacSurgery: null,
      strokeUnit: null,
      bloodBank: null,
      ambulanceBay: null
    },
    liveStatus: {
      diversionStatus: 'UNKNOWN',
      acceptingEmergencies: null,
      totalBedsAvailable: null,
      icuBedsAvailable: null,
      ventilatorsAvailable: null,
      resuscitationBayAssigned: null,
      lastVerifiedAt: facility.lastVerifiedAt,
      source: facility.dataSource
    }
  }));

  // Sort by score descending to get top recommendation
  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const recommendedHospital = ranked[0] || null;

  // Filter only on facts available from the map search.
  let filteredList = [...scored];
  if (filterOption === 'FASTEST_ETA') {
    filteredList.sort((a, b) => a.etaMinutes - b.etaMinutes);
  } else if (filterOption === 'NEAREST') {
    filteredList.sort((a, b) => a.distanceKm - b.distanceKm);
  } else {
    filteredList.sort((a, b) => a.etaMinutes - b.etaMinutes);
  }

  const output = {
    success: true,
    callerLocation: { lat, lng },
    totalFound: filteredList.length,
    recommendedHospital,
    hospitals: filteredList
  };
  hospitalsCache.set(cacheKey, output);
  return output;
}

/**
 * Fetch traffic-aware road route geometry using Mapbox Directions API with fallback
 */
export async function fetchRoadRouteGeoJSON(startLng, startLat, endLng, endLat) {
  if (MAPBOX_TOKEN) {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          return {
            coordinates: data.routes[0].geometry.coordinates,
            distanceKm: Number((data.routes[0].distance / 1000).toFixed(2)),
            durationMinutes: Math.max(3, Math.round(data.routes[0].duration / 60)),
            trafficStatus: 'Traffic 🟢 Normal Flow'
          };
        }
      }
    } catch (err) {
      // Graceful fallback to curved multi-point coordinates
    }
  }

  // Estimated direct path when no routing provider is configured.
  const points = [];
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const curLng = startLng + (endLng - startLng) * t;
    const curLat = startLat + (endLat - startLat) * t;
    points.push([Number(curLng.toFixed(5)), Number(curLat.toFixed(5))]);
  }

  const dist = calculateHaversineDistance(startLat, startLng, endLat, endLng);
  return {
    coordinates: points,
    distanceKm: dist,
    durationMinutes: Math.max(3, Math.round((dist / 22) * 60 + 1)),
    trafficStatus: 'Estimated direct path (no live traffic)'
  };
}
