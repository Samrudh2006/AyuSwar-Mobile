import React, { useState, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Plus, 
  Minus, 
  Crosshair, 
  Navigation, 
  Layers, 
  Building2, 
  Car,
  Activity,
  Compass,
  Volume2,
  VolumeX,
  Radio,
  Gauge,
  Heart,
  ShieldAlert,
  Wifi,
  Sparkles
} from 'lucide-react';
import { emergencySiren } from '../services/emergencyAudioSiren';

// Universal High-Reliability OpenStreetMap Raster Tile Style (No token needed)
const OSM_STYLE = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

// Realistic Top-Down Moving Vehicle Generator (Ambulance Van or First-Responder Motorcycle)
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const getVehicleSvg = (type = 'ambulance', heading = 52, id = 'ALS-12') => {
  // Coerce heading to a finite number: a non-numeric value would otherwise be
  // interpolated raw into the rotate() CSS below (injection sink).
  const safeHeading = Number.isFinite(Number(heading)) ? Number(heading) : 52;
  if (type === 'bike') {
    return `
      <div class="emergency-vehicle-marker" style="display: flex; flex-direction: column; align-items: center; position: relative; width: 50px; height: 84px; cursor: pointer; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.85));">
        <!-- ROTATING VEHICLE CHASSIS -->
        <div class="vehicle-rotator" style="position: absolute; top: 0; left: 0; width: 50px; height: 84px; transform: rotate(${safeHeading}deg); transform-origin: 25px 42px; transition: transform 0.22s ease-out; pointer-events: none;">
          <svg viewBox="0 0 50 84" width="50" height="84" style="overflow: visible;">
            <defs>
              <linearGradient id="bike-beam" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stop-color="#FEF08A" stop-opacity="0.55" />
                <stop offset="60%" stop-color="#FEF08A" stop-opacity="0.18" />
                <stop offset="100%" stop-color="#FEF08A" stop-opacity="0" />
              </linearGradient>
            </defs>

            <!-- Forward-Projecting Headlight Beam Cone onto Asphalt -->
            <polygon points="23,24 6,-16 44,-16 27,24" fill="url(#bike-beam)" style="animation: ambulance-headlight-glow 1.2s ease-in-out infinite;" />

            <!-- Front Wheel -->
            <rect x="23" y="12" width="4" height="13" rx="2" fill="#0F172A" stroke="#334155" stroke-width="1" />

            <!-- Handlebars & Mirrors -->
            <path d="M 12 26 Q 25 24 38 26" stroke="#475569" stroke-width="3" stroke-linecap="round" fill="none" />
            <circle cx="12" cy="26" r="2.5" fill="#10B981" />
            <circle cx="38" cy="26" r="2.5" fill="#10B981" />

            <!-- Central Projector Headlight -->
            <ellipse cx="25" cy="24" rx="3.5" ry="2" fill="#FEF08A" stroke="#CA8A04" stroke-width="0.8" />

            <!-- Gas Tank & Frame -->
            <path d="M 22 28 L 28 28 L 27 42 L 23 42 Z" fill="#059669" stroke="#047857" stroke-width="1" />

            <!-- Paramedic First-Responder (Helmet & Hi-Vis Fluorescent Vest) -->
            <path d="M 17 40 Q 25 38 33 40 L 31 52 Q 25 50 19 52 Z" fill="#10B981" stroke="#064E3B" stroke-width="1.2" />
            <line x1="20" y1="46" x2="30" y2="46" stroke="#FEF08A" stroke-width="1.5" />
            <ellipse cx="25" cy="38" rx="5.5" ry="6" fill="#F8FAFC" stroke="#0F172A" stroke-width="1.2" />
            <path d="M 21 35 Q 25 33 29 35" stroke="#0284C7" stroke-width="2.2" stroke-linecap="round" fill="none" />

            <!-- Dual Red Trauma Supply Panniers with Crosses -->
            <rect x="12" y="52" width="8" height="15" rx="2" fill="#DC2626" stroke="#7F1D1D" stroke-width="1" />
            <rect x="30" y="52" width="8" height="15" rx="2" fill="#DC2626" stroke="#7F1D1D" stroke-width="1" />
            <line x1="16" y1="55" x2="16" y2="63" stroke="#FFFFFF" stroke-width="1.8" />
            <line x1="13" y1="59" x2="19" y2="59" stroke="#FFFFFF" stroke-width="1.8" />
            <line x1="34" y1="55" x2="34" y2="63" stroke="#FFFFFF" stroke-width="1.8" />
            <line x1="31" y1="59" x2="37" y2="59" stroke="#FFFFFF" stroke-width="1.8" />

            <!-- Rear Wheel -->
            <rect x="23" y="60" width="4" height="14" rx="2" fill="#0F172A" stroke="#334155" stroke-width="1" />

            <!-- Rear Strobe Beacon -->
            <line x1="25" y1="68" x2="25" y2="76" stroke="#64748B" stroke-width="1.2" />
            <circle cx="25" cy="76" r="3" fill="#0284C7" class="strobe-led-blue" />
          </svg>
        </div>

        <!-- TACTICAL CALLSIGN BADGE -->
        <div style="position: absolute; bottom: -6px; background: rgba(6, 78, 59, 0.95); border: 1.5px solid #10B981; border-radius: 999px; padding: 2px 7px; font-size: 8px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.5px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.8); pointer-events: auto;">
 108 M-01
        </div>
      </div>
    `;
  }

  // DEFAULT: TOP-DOWN REALISTIC 108 ALS AMBULANCE VAN
  return `
    <div class="emergency-vehicle-marker" style="display: flex; flex-direction: column; align-items: center; position: relative; width: 60px; height: 96px; cursor: pointer; filter: drop-shadow(0 8px 18px rgba(0,0,0,0.85));">
      <!-- ROTATING VEHICLE CHASSIS -->
      <div class="vehicle-rotator" style="position: absolute; top: 0; left: 0; width: 60px; height: 96px; transform: rotate(${safeHeading}deg); transform-origin: 30px 48px; transition: transform 0.22s ease-out; pointer-events: none;">
        <svg viewBox="0 0 60 96" width="60" height="96" style="overflow: visible;">
          <defs>
            <linearGradient id="amb-beam-l" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#FEF08A" stop-opacity="0.6" />
              <stop offset="60%" stop-color="#FEF08A" stop-opacity="0.18" />
              <stop offset="100%" stop-color="#FEF08A" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="amb-beam-r" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#FEF08A" stop-opacity="0.6" />
              <stop offset="60%" stop-color="#FEF08A" stop-opacity="0.18" />
              <stop offset="100%" stop-color="#FEF08A" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="amb-body" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#E2E8F0" />
              <stop offset="50%" stop-color="#FFFFFF" />
              <stop offset="100%" stop-color="#E2E8F0" />
            </linearGradient>
          </defs>

          <!-- Dual Headlight Cones Shining Forward Onto Road -->
          <polygon points="19,22 4,-18 26,-18 22,22" fill="url(#amb-beam-l)" style="animation: ambulance-headlight-glow 1.2s ease-in-out infinite;" />
          <polygon points="38,22 34,-18 56,-18 41,22" fill="url(#amb-beam-r)" style="animation: ambulance-headlight-glow 1.2s ease-in-out infinite;" />

          <!-- Side Mirrors -->
          <rect x="9" y="34" width="5" height="3" rx="1.5" fill="#334155" />
          <rect x="46" y="34" width="5" height="3" rx="1.5" fill="#334155" />

          <!-- Main Vehicle Body -->
          <rect x="14" y="22" width="32" height="60" rx="7" fill="url(#amb-body)" stroke="#0F172A" stroke-width="1.8" />

          <!-- Front Bumper & Dual Headlights -->
          <rect x="16" y="22" width="28" height="3" rx="1.5" fill="#475569" />
          <circle cx="19" cy="23" r="2.2" fill="#FEF08A" stroke="#CA8A04" stroke-width="0.6" />
          <circle cx="41" cy="23" r="2.2" fill="#FEF08A" stroke="#CA8A04" stroke-width="0.6" />

          <!-- Front Cab Windshield -->
          <path d="M 17 36 L 20 28 L 40 28 L 43 36 Z" fill="#0F172A" stroke="#1E293B" stroke-width="1" />

          <!-- Lightbar Housing & Dual Alternating Strobes -->
          <rect x="19" y="27.5" width="22" height="4.5" rx="2" fill="#0F172A" stroke="#334155" stroke-width="0.8" />
          <circle cx="23" cy="29.7" r="2.2" fill="#EF4444" class="strobe-led-red" />
          <circle cx="37" cy="29.7" r="2.2" fill="#0284C7" class="strobe-led-blue" />

          <!-- Side Windows -->
          <rect x="15.5" y="44" width="2" height="13" rx="1" fill="#1E293B" />
          <rect x="42.5" y="44" width="2" height="13" rx="1" fill="#1E293B" />

          <!-- Battenburg High-Vis Chevrons -->
          <rect x="14" y="58" width="3" height="5" fill="#16A34A" />
          <rect x="14" y="63" width="3" height="5" fill="#FACC15" />
          <rect x="43" y="58" width="3" height="5" fill="#16A34A" />
          <rect x="43" y="63" width="3" height="5" fill="#FACC15" />

          <!-- Roof Medical Cross -->
          <circle cx="30" cy="50" r="5.5" fill="#EF4444" />
          <rect x="28.5" y="46.5" width="3" height="7" rx="0.5" fill="#FFFFFF" />
          <rect x="26.5" y="48.5" width="7" height="3" rx="0.5" fill="#FFFFFF" />

          <!-- Roof Callsign 108 -->
          <text x="30" y="68" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="10" fill="#DC2626" letter-spacing="0.5">108</text>

          <!-- Rear Tail Lights -->
          <rect x="16" y="80" width="3" height="2" rx="0.5" fill="#EF4444" />
          <rect x="41" y="80" width="3" height="2" rx="0.5" fill="#EF4444" />
        </svg>
      </div>

      <!-- TACTICAL CALLSIGN BADGE -->
      <div style="position: absolute; bottom: -6px; background: rgba(15, 23, 42, 0.95); border: 1.5px solid #38BDF8; border-radius: 999px; padding: 2px 7px; font-size: 8px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.5px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.8); pointer-events: auto;">
 108 ALS-12
      </div>
    </div>
  `;
};

/**
 * EmergencyMap — Real-Time Mapbox GL JS GIS Operational Engine & Telemetry Suite
 * 
 * Upgraded Features:
 * - Real Mapbox dark cartographic vector basemap with road networks & regional hospitals
 * - Distinct, visible Caller Emergency Beacon (Red)
 * - Ultra-High-Visibility ALS Ambulance vehicle marker with alternating Red/Cyan LED strobes & heading
 * - Dynamic road route corridor with glowing pulse tracer
 * - Live Telemetry HUD: Real-time Speedometer, ETA Countdown, ALS Patient Vitals, Traffic Signal Preemption
 * - WebAudio Emergency Siren Controller with live audible dual-tone wail
 * - 3D Cockpit Follow Cam mode (60° tilt, camera orientation locked to vehicle heading)
 */
export default function EmergencyMap({
  callerCoords = { lat: 15.8281, lng: 78.0373 },
  hospitals = [],
  selectedHospital = null,
  onSelectHospital = () => {},
  ambulanceData = { id: 'A-12', lat: 15.8210, lng: 78.0320, heading: 52, speed: 54, status: 'EN_ROUTE' },
  vehicleType = 'ambulance',
  routeCoordinates = [],
  routeDistanceKm = 0,
  routeEtaMinutes = 0,
  trafficStatus = 'Traffic: Normal Flow',
  callerAmbulanceRoute = [],
  isDispatched = false
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const callerMarkerRef = useRef(null);
  const ambulanceMarkerRef = useRef(null);
  const hospitalMarkersRef = useRef([]);
  const latestCallerCoordsRef = useRef(callerCoords);

  // Layer & Camera Toggles
  const [showHospitals, setShowHospitals] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [mapStyleType, setMapStyleType] = useState('navigation'); // 'navigation' | 'streets' | 'satellite'
  const [followAmbulance, setFollowAmbulance] = useState(false);
  const [is3DCockpitView, setIs3DCockpitView] = useState(false);
  const [showTelemetryHUD, setShowTelemetryHUD] = useState(true);
  const [mapFailed, setMapFailed] = useState(false);

  // Siren Audio State
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);

  // Dynamic Live Telemetry Metrics
  const [telemetrySpeed, setTelemetrySpeed] = useState(ambulanceData.speed || 52);
  const [heartRate, setHeartRate] = useState(108);
  const [spO2, setSpO2] = useState(94);
  const [trafficOverrideCount, setTrafficOverrideCount] = useState(4);
  const [etaRemainingSec, setEtaRemainingSec] = useState(240);

  // Smooth Vehicle Animation Refs
  const currentPosRef = useRef({ lat: ambulanceData.lat, lng: ambulanceData.lng });
  const animFrameRef = useRef(null);

  // Toggle Siren Audio
  const handleToggleSiren = () => {
    const newState = emergencySiren.toggle();
    setIsSirenPlaying(newState);
  };

  // Clean up siren on unmount
  useEffect(() => {
    return () => {
      emergencySiren.stop();
    };
  }, []);

  // Live telemetry pulse simulation (vital signs fluctuation & ETA countdown)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isDispatched) {
        setTelemetrySpeed(Math.round(48 + Math.sin(Date.now() / 2000) * 14));
        setHeartRate(Math.round(106 + Math.sin(Date.now() / 3000) * 8));
        setSpO2(Math.min(98, Math.max(91, Math.round(94 + Math.sin(Date.now() / 4000) * 2))));
        setEtaRemainingSec((prev) => (prev > 10 ? prev - 1 : 240));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isDispatched]);

  // Format ETA seconds into MM:SS
  const formatEta = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 1. Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let map = null;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: OSM_STYLE,
        center: [callerCoords.lng, callerCoords.lat],
        zoom: 14.3,
        pitch: 32,
        bearing: 0,
        attributionControl: false
      });
      mapRef.current = map;
    } catch (err) {
      console.warn('MapLibre GL failed to initialize, degrading to hospital list:', err);
      setMapFailed(true);
      return;
    }

    map.on('load', () => {
      // 1. SOURCE: Caller ─── Ambulance Route (Subtle)
      map.addSource('caller-ambulance-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: 'caller-ambulance-line',
        type: 'line',
        source: 'caller-ambulance-source',
        layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'visible' },
        paint: {
          'line-color': '#F59E0B',
          'line-width': 2.5,
          'line-dasharray': [3, 2],
          'line-opacity': 0.8
        }
      });

      // 2. SOURCE: Ambulance ══════ Selected Hospital Route
      map.addSource('ambulance-hospital-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Route Outer Neon Glow
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'ambulance-hospital-source',
        layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'visible' },
        paint: {
          'line-color': '#0284C7',
          'line-width': 10,
          'line-opacity': 0.5
        }
      });

      // Route Core Line
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'ambulance-hospital-source',
        layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'visible' },
        paint: {
          'line-color': '#38BDF8',
          'line-width': 4.5,
          'line-opacity': 0.95
        }
      });

      // Route Pulsing Dash Flow
      map.addLayer({
        id: 'route-pulse',
        type: 'line',
        source: 'ambulance-hospital-source',
        layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'visible' },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 2.5,
          'line-dasharray': [1, 3],
          'line-opacity': 0.85
        }
      });

      // 3. CREATE PULSING CALLER EMERGENCY MARKER
      const callerEl = document.createElement('div');
      callerEl.className = 'caller-emergency-beacon';
      callerEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(220, 38, 38, 0.65);"></div>
            <div style="position: absolute; width: 15px; height: 15px; border-radius: 50%; background: #EF4444; border: 2.5px solid #FFF; box-shadow: 0 0 16px #EF4444;"></div>
          </div>
          <div style="
            background: rgba(10, 19, 36, 0.96);
            border: 1.5px solid #EF4444;
            color: #FFFFFF;
            padding: 3px 9px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 900;
            white-space: nowrap;
            box-shadow: 0 4px 14px rgba(0,0,0,0.85);
            margin-top: 2px;
          ">
 PATIENT DISTRESS ANCHOR
          </div>
        </div>
      `;
      const initialLng = latestCallerCoordsRef.current?.lng ?? callerCoords.lng;
      const initialLat = latestCallerCoordsRef.current?.lat ?? callerCoords.lat;
      callerMarkerRef.current = new maplibregl.Marker({ element: callerEl })
        .setLngLat([initialLng, initialLat])
        .addTo(map);
      map.setCenter([initialLng, initialLat]);

      // 4. CREATE HIGH-CONTRAST REALISTIC MOVING EMERGENCY VEHICLE MARKER
      const ambulanceEl = document.createElement('div');
      ambulanceEl.className = 'ambulance-live-vehicle-node';
      ambulanceEl.innerHTML = getVehicleSvg(vehicleType, ambulanceData.heading || 52, ambulanceData.id || 'ALS-12');
      ambulanceMarkerRef.current = new maplibregl.Marker({ element: ambulanceEl })
        .setLngLat([ambulanceData.lng, ambulanceData.lat])
        .addTo(map);
    });

    return () => {
      map.remove();
    };
  }, []);

  // 1b. Update vehicle graphic when vehicleType or callsign changes
  useEffect(() => {
    if (!ambulanceMarkerRef.current) return;
    const el = ambulanceMarkerRef.current.getElement();
    if (el) {
      el.innerHTML = getVehicleSvg(vehicleType, ambulanceData.heading || 52, ambulanceData.id || (vehicleType === 'bike' ? 'M-01' : 'ALS-12'));
    }
  }, [vehicleType, ambulanceData.id]);

  // 2. Update Caller Marker and Center Map when GPS resolves
  useEffect(() => {
    if (!callerCoords?.lat || !callerCoords?.lng) return;
    latestCallerCoordsRef.current = callerCoords;
    if (callerMarkerRef.current) {
      callerMarkerRef.current.setLngLat([callerCoords.lng, callerCoords.lat]);
    }
    if (mapRef.current && !followAmbulance) {
      mapRef.current.flyTo({
        center: [callerCoords.lng, callerCoords.lat],
        zoom: 14.3,
        essential: true,
        duration: 800
      });
    }
  }, [callerCoords?.lat, callerCoords?.lng, followAmbulance]);

  // 3. Render High-Visibility HTML Markers for ALL 12 Hospitals
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    hospitalMarkersRef.current.forEach((m) => m.remove());
    hospitalMarkersRef.current = [];

    if (!showHospitals) return;

    hospitals.forEach((hosp) => {
      const isSelected = selectedHospital && selectedHospital.id === hosp.id;
      const isTop = hosp.id === 'hosp_001';

      const el = document.createElement('div');
      el.className = 'hospital-map-node';
      el.style.cursor = 'pointer';

      const badgeBg = isSelected 
        ? '#0284C7' 
        : isTop 
        ? '#DC2626' 
        : hosp.ownership?.toLowerCase().includes('government')
        ? '#065F46'
        : 'rgba(8, 18, 36, 0.94)';
      const badgeBorder = isSelected 
        ? '2px solid #38BDF8' 
        : isTop 
        ? '1.5px solid #F59E0B' 
        : hosp.ownership?.toLowerCase().includes('government')
        ? '1px solid #10B981'
        : '1px solid #1E3A5F';

      el.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; transform: translateY(-50%);">
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            background: ${badgeBg};
            border: ${badgeBorder};
            padding: 3px 8px;
            border-radius: 8px;
            box-shadow: ${isSelected ? '0 0 18px rgba(56, 189, 248, 0.85)' : '0 4px 12px rgba(0,0,0,0.7)'};
            white-space: nowrap;
          ">
 <span style="font-size: 12px; line-height: 1;"></span>
            <span style="font-size: 10.5px; font-weight: 800; color: #FFFFFF;">
 ${escapeHtml(hosp.shortName || String(hosp.name || '').split(' ')[0])} ${isTop ? '★': ''}
            </span>
            <span style="
              font-size: 9px; 
              font-weight: 800; 
              color: ${isSelected ? '#FFFFFF' : '#38BDF8'};
              background: rgba(0,0,0,0.35);
              padding: 1px 5px;
              border-radius: 6px;
            ">
              ${escapeHtml(hosp.etaMinutes)}m
            </span>
          </div>
          <div style="width: 2px; height: 6px; background: ${isSelected ? '#38BDF8' : '#1E3A5F'};"></div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectHospital(hosp);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([hosp.lng, hosp.lat])
        .addTo(map);

      hospitalMarkersRef.current.push(marker);
    });
  }, [hospitals, selectedHospital, showHospitals]);

  // 4. Update Route 1 (Caller ─── Ambulance)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('caller-ambulance-source');
    if (source && callerCoords && ambulanceData) {
      source.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [callerCoords.lng, callerCoords.lat],
                [ambulanceData.lng, ambulanceData.lat]
              ]
            },
            properties: {}
          }
        ]
      });
    }
  }, [callerCoords.lat, callerCoords.lng, ambulanceData.lat, ambulanceData.lng]);

  // 5. Update Route 2 (Ambulance ══════ Selected Hospital) & Auto-Fit Navigation Corridor
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('ambulance-hospital-source');
    if (source) {
      if (routeCoordinates && routeCoordinates.length > 0) {
        source.setData({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates
              },
              properties: {}
            }
          ]
        });

        // Auto-fit camera to encompass the full road corridor to the hospital
        if (routeCoordinates.length >= 2 && !followAmbulance && !is3DCockpitView) {
          try {
            const bounds = new maplibregl.LngLatBounds(routeCoordinates[0], routeCoordinates[0]);
            routeCoordinates.forEach((pt) => bounds.extend(pt));
            if (callerCoords?.lng && callerCoords?.lat) {
              bounds.extend([callerCoords.lng, callerCoords.lat]);
            }
            map.fitBounds(bounds, {
              padding: { top: 85, bottom: 85, left: 70, right: 70 },
              maxZoom: 15.5,
              duration: 900
            });
          } catch (e) {
            // fallback gracefully
          }
        }
      } else {
        source.setData({ type: 'FeatureCollection', features: [] });
      }
    }
  }, [routeCoordinates, followAmbulance, is3DCockpitView, callerCoords?.lng, callerCoords?.lat]);

  // 6. Smooth Vehicle Movement Interpolation with 3D Camera Follow & Steering Rotation
  useEffect(() => {
    if (!ambulanceMarkerRef.current || !ambulanceData) return;

    const targetLng = ambulanceData.lng;
    const targetLat = ambulanceData.lat;
    const heading = ambulanceData.heading || 52;

    const updateVehicleHeading = (rotDeg) => {
      if (ambulanceMarkerRef.current) {
        const el = ambulanceMarkerRef.current.getElement();
        if (el) {
          const rotator = el.querySelector('.vehicle-rotator');
          if (rotator) {
            rotator.style.transform = `rotate(${rotDeg}deg)`;
          }
        }
      }
    };

    updateVehicleHeading(heading);

    const animate = () => {
      const curLng = currentPosRef.current.lng;
      const curLat = currentPosRef.current.lat;

      const diffLng = targetLng - curLng;
      const diffLat = targetLat - curLat;

      if (Math.abs(diffLng) > 0.000005 || Math.abs(diffLat) > 0.000005) {
        const nextLng = curLng + diffLng * 0.16;
        const nextLat = curLat + diffLat * 0.16;
        currentPosRef.current = { lng: nextLng, lat: nextLat };
        ambulanceMarkerRef.current.setLngLat([nextLng, nextLat]);
        updateVehicleHeading(heading);

        if (mapRef.current) {
          if (is3DCockpitView) {
            mapRef.current.easeTo({
              center: [nextLng, nextLat],
              pitch: 62,
              bearing: heading,
              zoom: 16.2,
              duration: 80
            });
          } else if (followAmbulance) {
            mapRef.current.easeTo({
              center: [nextLng, nextLat],
              duration: 80
            });
          }
        }
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        currentPosRef.current = { lng: targetLng, lat: targetLat };
        ambulanceMarkerRef.current.setLngLat([targetLng, targetLat]);
        updateVehicleHeading(heading);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [ambulanceData.lat, ambulanceData.lng, followAmbulance, is3DCockpitView, ambulanceData.heading]);

  // Layer Visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('route-line')) {
      map.setLayoutProperty('route-line', 'visibility', showRoutes ? 'visible' : 'none');
      map.setLayoutProperty('route-glow', 'visibility', showRoutes ? 'visible' : 'none');
      map.setLayoutProperty('route-pulse', 'visibility', showRoutes ? 'visible' : 'none');
      map.setLayoutProperty('caller-ambulance-line', 'visibility', showRoutes ? 'visible' : 'none');
    }
  }, [showRoutes]);

  // Controls Actions
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  const handleLocateCaller = () => {
    setIs3DCockpitView(false);
    mapRef.current?.flyTo({
      center: [callerCoords.lng, callerCoords.lat],
      zoom: 14.8,
      pitch: 28,
      bearing: 0,
      speed: 1.3
    });
  };

  const toggleSatelliteStyle = () => {
    if (!mapRef.current) return;
    if (mapStyleType === 'navigation') {
      mapRef.current.setStyle('mapbox://styles/mapbox/streets-v12');
      setMapStyleType('streets');
    } else if (mapStyleType === 'streets') {
      mapRef.current.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
      setMapStyleType('satellite');
    } else {
      mapRef.current.setStyle('mapbox://styles/mapbox/navigation-night-v1');
      setMapStyleType('navigation');
    }
  };

  if (mapFailed) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%', overflowY: 'auto', background: '#090F1E', padding: '24px', color: '#ffffff' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
 <div style={{ fontSize: '36px', marginBottom: '8px'}}></div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#F87171', margin: '0 0 6px 0' }}>
            Emergency Hospital Registry (Degraded Fallback)
          </h3>
          <div style={{
            background: 'rgba(239, 68, 68, 0.25)',
            border: '1px solid #EF4444',
            borderRadius: '10px',
            padding: '10px 16px',
            color: '#FEE2E2',
            fontWeight: 850,
            fontSize: '15px',
            display: 'inline-block',
            margin: '8px auto 14px auto'
          }}>
            Emergency? Dial 112 / 108
          </div>
          <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
            Operational GIS basemap unavailable. Showing live cached nearest emergency hospital facilities (SIMULATION):
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '580px', margin: '0 auto' }}>
          {hospitals.map((hosp, i) => (
            <div
              key={hosp.id || i}
              onClick={() => onSelectHospital(hosp)}
              style={{
                background: selectedHospital?.id === hosp.id ? 'rgba(0, 0, 0, 0.09)' : '#131F37',
                border: selectedHospital?.id === hosp.id ? '1.5px solid #D4AF37' : '1px solid #203554',
                padding: '14px 18px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>{hosp.name}</div>
                <div style={{ fontSize: '11.5px', color: '#38BDF8', marginTop: '2px' }}>
                  {hosp.type || 'Government District Hospital'} • {hosp.stemiReady ? 'Cath Lab Ready' : 'Emergency Resus'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 850, color: '#10B981' }}>{hosp.distanceKm || '2.8'} km</div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>{hosp.etaMinutes || '7'} mins ETA</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* MAPBOX CANVAS */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', background: '#090F1E' }} />

      {/* CLEAN REAL-TIME ROAD NAVIGATION TO HOSPITAL BANNER (SINGLE TOP-LEFT FLOATING PILL) */}
      {selectedHospital && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          zIndex: 22,
          background: 'rgba(5, 12, 28, 0.94)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid #0284C7',
          borderRadius: '12px',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.85), 0 0 20px rgba(2, 132, 199, 0.3)',
          maxWidth: '520px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: '#0369A1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.6)'
          }}>
            <Navigation size={17} color="#FFFFFF" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '9px', fontWeight: 900, background: '#DC2626', color: '#FFF', padding: '1px 5px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                LIVE ROUTE
              </span>
              <span style={{ fontSize: '12px', fontWeight: 850, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedHospital.name}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
              <span>ETA: <strong style={{ color: '#10B981', fontSize: '11px' }}>{routeEtaMinutes || selectedHospital.etaMinutes || 6} mins</strong></span>
              <span>•</span>
              <span>Dist: <strong style={{ color: '#38BDF8', fontSize: '11px' }}>{routeDistanceKm || selectedHospital.distanceKm || 3.8} km</strong></span>
              <span>•</span>
 <span style={{ color: '#34D399', fontWeight: 700 }}>{trafficStatus || 'Traffic Normal Flow'}</span>
            </div>
          </div>

          {/* Quick Center Route Button */}
          <button
            onClick={() => {
              if (mapRef.current && routeCoordinates && routeCoordinates.length >= 2) {
                const bounds = new maplibregl.LngLatBounds(routeCoordinates[0], routeCoordinates[0]);
                routeCoordinates.forEach((pt) => bounds.extend(pt));
                if (callerCoords?.lng && callerCoords?.lat) bounds.extend([callerCoords.lng, callerCoords.lat]);
                mapRef.current.fitBounds(bounds, { padding: { top: 85, bottom: 85, left: 70, right: 70 }, duration: 800 });
              }
            }}
            title="Center Route Corridor on Map"
            style={{
              background: '#0F2744',
              border: '1px solid #1C4472',
              color: '#38BDF8',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0
            }}
          >
            <Compass size={12} />
            <span>Center</span>
          </button>
        </div>
      )}

      {/* FLOATING ACTION TOOLBAR (MINIMAL ESSENTIAL CONTROLS) */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        background: 'rgba(6, 13, 26, 0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid #1C2E4C',
        borderRadius: '10px',
        padding: '6px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.8)'
      }}>
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          style={{ background: '#0F1E38', border: '1px solid #1C335A', color: '#FFF', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus size={15} />
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{ background: '#0F1E38', border: '1px solid #1C335A', color: '#FFF', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Minus size={15} />
        </button>

        <div style={{ height: '1px', background: '#1E2F4C', margin: '2px 0' }} />

        {/* Locate Caller / Recenter */}
        <button
          onClick={handleLocateCaller}
          title="Locate Patient Caller"
          style={{ background: '#0F1E38', border: '1px solid #1C335A', color: '#EF4444', borderRadius: '6px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Crosshair size={15} />
        </button>

        {/* Emergency Siren Audio Button */}
        <button
          onClick={handleToggleSiren}
          title={isSirenPlaying ? "Mute Emergency Siren" : "Sound Emergency Siren (WebAudio)"}
          style={{
            background: isSirenPlaying ? '#DC2626' : '#0F1E38',
            border: isSirenPlaying ? '1.5px solid #EF4444' : '1px solid #1C335A',
            color: '#FFF',
            borderRadius: '6px',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isSirenPlaying ? '0 0 14px rgba(239, 68, 68, 0.8)' : 'none'
          }}
        >
          {isSirenPlaying ? <Volume2 size={16} /> : <VolumeX size={15} />}
        </button>
      </div>

      {/* FLOATING ALS CLINICAL TELEMETRY HUD (BOTTOM LEFT OVERLAY) */}
      {showTelemetryHUD && isDispatched && (
        <div style={{
          position: 'absolute',
          bottom: '54px',
          left: '12px',
          zIndex: 25,
          background: 'rgba(6, 13, 28, 0.94)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid #1E3A66',
          borderRadius: '12px',
          padding: '12px 14px',
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          minWidth: '280px'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Radio size={14} color="#38BDF8" className="animate-pulse" />
              <span style={{ fontSize: '11px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.5px' }}>
                ALS-12 LIVE TELEMETRY
              </span>
            </div>
            <div style={{
              background: isSirenPlaying ? '#EF4444' : '#1E293B',
              color: '#FFFFFF',
              fontSize: '9px',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
            onClick={handleToggleSiren}
            >
 {isSirenPlaying ? 'SIREN WAILING': 'SIREN MUTED'}
            </div>
          </div>

          {/* Grid of Key Telemetry Gauges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {/* Speed Gauge */}
            <div style={{ background: '#0A1830', padding: '6px 8px', borderRadius: '8px', border: '1px solid #1C335A', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#94A3B8', fontWeight: 700 }}>SPEED</div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#38BDF8' }}>
                {telemetrySpeed}
              </div>
              <div style={{ fontSize: '7.5px', color: '#698892' }}>km/h</div>
            </div>

            {/* ETA Countdown */}
            <div style={{ background: '#0A1830', padding: '6px 8px', borderRadius: '8px', border: '1px solid #1C335A', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#94A3B8', fontWeight: 700 }}>LIVE ETA</div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#10B981' }}>
                {formatEta(etaRemainingSec)}
              </div>
              <div style={{ fontSize: '7.5px', color: '#698892' }}>mm:ss</div>
            </div>

            {/* Heart Rate */}
            <div style={{ background: '#0A1830', padding: '6px 8px', borderRadius: '8px', border: '1px solid #1C335A', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#94A3B8', fontWeight: 700 }}>PULSE</div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#EF4444' }}>
                {heartRate}
              </div>
              <div style={{ fontSize: '7.5px', color: '#698892' }}>BPM</div>
            </div>

            {/* SpO2 */}
            <div style={{ background: '#0A1830', padding: '6px 8px', borderRadius: '8px', border: '1px solid #1C335A', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#94A3B8', fontWeight: 700 }}>SPO2</div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#A78BFA' }}>
                {spO2}%
              </div>
              <div style={{ fontSize: '7.5px', color: '#698892' }}>O2 Sat</div>
            </div>
          </div>

          {/* Continuous Lead-II ECG Rhythm Strip & SpO2 Plethysmograph */}
          <div style={{ background: '#020617', borderRadius: '6px', border: '1px solid #0F2342', padding: '5px 7px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', fontSize: '8px' }}>
              <span style={{ color: '#10B981', fontWeight: 800 }}>● ECG LEAD-II (25 mm/s • 10 mm/mV)</span>
              <span style={{ color: '#38BDF8', fontWeight: 700 }}>PLETH SpO2: {spO2}%</span>
              <span style={{ color: '#698892', fontFamily: 'monospace' }}>IoT CAN-BUS: ACTIVE</span>
            </div>
            <svg viewBox="0 0 280 34" style={{ width: '100%', height: '34px', overflow: 'hidden' }}>
              <defs>
                <pattern id="ecgMiniGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                  <path d="M 8 0 L 0 0 0 8" fill="none" stroke="rgba(16, 185, 129, 0.12)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="280" height="34" fill="url(#ecgMiniGrid)" />
              <path
                d="M 0,17 L 18,17 Q 23,13 28,17 L 36,17 L 40,21 L 44,3 L 48,31 L 52,17 L 60,17 Q 67,11 75,17 L 95,17 L 110,17 Q 115,13 120,17 L 128,17 L 132,21 L 136,3 L 140,31 L 144,17 L 152,17 Q 159,11 167,17 L 187,17 L 202,17 Q 207,13 212,17 L 220,17 L 224,21 L 228,3 L 232,31 L 236,17 L 244,17 Q 251,11 259,17 L 280,17"
                fill="none"
                stroke="#10B981"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  filter: 'drop-shadow(0 0 5px rgba(16, 185, 129, 0.9))'
                }}
              />
            </svg>
          </div>

          {/* Clinical Vital Signs Ticker */}
          <div style={{
            background: '#040B17',
            padding: '5px 8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '9.5px',
            color: '#D0DFE2',
            border: '1px solid #12213A'
          }}>
            <span>Blood Pressure: <strong style={{ color: '#F1F5F9' }}>136/88 mmHg</strong></span>
            <span>Rhythm: <strong style={{ color: '#10B981' }}>Normal Sinus (Lead II)</strong></span>
            <span>O2: <strong style={{ color: '#38BDF8' }}>Ventilator Active</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
