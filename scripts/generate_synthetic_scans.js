// scripts/generate_synthetic_scans.js
// Generates 14 genuine synthetic clinical diagnostic SVG graphics
// Every asset is 100% synthetically generated with zero PII or copyright restrictions,
// prominently watermarked [SYNTHETIC CLINICAL SPECIMEN • DEMO ONLY].

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetDir = path.resolve(__dirname, '../public/assets/reports');

function header(title, modality, specimenId) {
  return `
    <rect width="800" height="600" fill="#0A0F1D"/>
    <!-- Diagnostic Header Bar -->
    <rect x="0" y="0" width="800" height="56" fill="#0D1527" stroke="#1E293B" stroke-width="1"/>
    <text x="24" y="34" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="16" font-weight="700">${title}</text>
    <text x="500" y="34" fill="#94A3B8" font-family="monospace" font-size="12">MODALITY: ${modality} | ID: ${specimenId}</text>
    <!-- Watermark Banner -->
    <rect x="24" y="66" width="752" height="28" rx="4" fill="#1E293B" stroke="#F59E0B" stroke-dasharray="4 4"/>
    <text x="400" y="85" text-anchor="middle" fill="#FBBF24" font-family="system-ui, sans-serif" font-size="11" font-weight="700" letter-spacing="1.5">⚠ SYNTHETIC CLINICAL SPECIMEN • DEMO ONLY • NO REAL PATIENT DATA</text>
  `;
}

function footer() {
  return `
    <rect x="0" y="560" width="800" height="40" fill="#0D1527" stroke="#1E293B" stroke-width="1"/>
    <text x="24" y="584" fill="#64748B" font-family="system-ui, sans-serif" font-size="11">AyuSwar AI Synthetic Test Suite • Standards Compliant DICOM/FHIR Render Engine</text>
    <text x="776" y="584" text-anchor="end" fill="#10B981" font-family="monospace" font-size="11">VERIFIED SYNTHETIC ARTIFACT</text>
  `;
}

const svgs = {
  // 1. Chest X-Ray PA
  'synthetic_chest_xray_pa.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      ${header('DIGITAL CHEST RADIOGRAPH (POSTEROANTERIOR VIEW)', 'RAD-CR-PA', 'SYN-CXR-2026-01')}
      <!-- Thorax Background Grid -->
      <g stroke="#1E293B" stroke-width="0.5" opacity="0.6">
        <line x1="200" y1="120" x2="200" y2="540"/><line x1="300" y1="120" x2="300" y2="540"/>
        <line x1="400" y1="120" x2="400" y2="540"/><line x1="500" y1="120" x2="500" y2="540"/><line x1="600" y1="120" x2="600" y2="540"/>
        <line x1="120" y1="200" x2="680" y2="200"/><line x1="120" y1="300" x2="680" y2="300"/>
        <line x1="120" y1="400" x2="680" y2="400"/><line x1="120" y1="500" x2="680" y2="500"/>
      </g>
      <!-- Thoracic Cage Outline -->
      <path d="M 280 140 Q 400 120 520 140 Q 640 220 620 450 Q 560 520 400 520 Q 240 520 180 450 Q 160 220 280 140 Z" fill="#050811" stroke="#334155" stroke-width="2"/>
      <!-- Bilateral Lung Fields -->
      <path d="M 270 170 C 230 250 220 380 250 470 C 300 480 340 450 350 380 C 350 250 330 180 270 170 Z" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
      <path d="M 530 170 C 570 250 580 380 550 470 C 500 480 460 450 450 380 C 450 250 470 180 530 170 Z" fill="#0F172A" stroke="#475569" stroke-width="1.5"/>
      <!-- Bronchovascular Tree Markings -->
      <g stroke="#94A3B8" stroke-width="1.2" opacity="0.4" fill="none">
        <path d="M 350 280 Q 300 320 260 380 M 350 290 Q 290 350 270 420 M 350 310 Q 310 390 300 450"/>
        <path d="M 450 280 Q 500 320 540 380 M 450 290 Q 510 350 530 420 M 450 310 Q 490 390 500 450"/>
      </g>
      <!-- Cardiac Silhouette (CTR ~0.48) -->
      <path d="M 380 260 C 350 320 330 420 370 470 C 430 480 470 460 460 380 C 440 320 420 260 380 260 Z" fill="#1E293B" stroke="#64748B" stroke-width="2"/>
      <!-- Rib Shadows -->
      <g stroke="#475569" stroke-width="2" opacity="0.3" fill="none">
        <path d="M 220 220 Q 320 260 360 280"/><path d="M 580 220 Q 480 260 440 280"/>
        <path d="M 200 280 Q 310 330 360 350"/><path d="M 600 280 Q 490 330 440 350"/>
        <path d="M 210 350 Q 310 400 370 420"/><path d="M 590 350 Q 490 400 430 420"/>
      </g>
      <!-- Costophrenic Angles & Markers -->
      <text x="200" y="490" fill="#38BDF8" font-family="monospace" font-size="12">CP Angle: Clear</text>
      <text x="560" y="490" fill="#38BDF8" font-family="monospace" font-size="12">CP Angle: Clear</text>
      <text x="730" y="160" fill="#EF4444" font-family="system-ui, sans-serif" font-size="20" font-weight="900">R</text>
      <text x="70" y="160" fill="#3B82F6" font-family="system-ui, sans-serif" font-size="20" font-weight="900">L</text>
      ${footer()}
    </svg>
  `,

  // 2. HRCT Chest 128-Slice
  'synthetic_hrct_chest_128slice.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      ${header('HIGH RESOLUTION CT CHEST (128-SLICE AXIAL VIEW)', 'CT-HRCT-128', 'SYN-HRCT-2026-02')}
      <circle cx="400" cy="330" r="210" fill="#070B14" stroke="#334155" stroke-width="3"/>
      <!-- Axial Ring & Calibration Ticks -->
      <g stroke="#475569" stroke-width="1" opacity="0.5">
        <circle cx="400" cy="330" r="170" fill="none" stroke-dasharray="3 6"/>
        <line x1="400" y1="110" x2="400" y2="550" stroke-dasharray="2 4"/>
        <line x1="180" y1="330" x2="620" y2="330" stroke-dasharray="2 4"/>
      </g>
      <!-- Lung Parenchyma (Axial Slices) -->
      <path d="M 280 230 C 230 280 240 400 290 430 C 340 440 360 380 360 330 C 360 260 330 210 280 230 Z" fill="#0B132B" stroke="#60A5FA" stroke-width="1.5"/>
      <path d="M 520 230 C 570 280 560 400 510 430 C 460 440 440 380 440 330 C 440 260 470 210 520 230 Z" fill="#0B132B" stroke="#60A5FA" stroke-width="1.5"/>
      <!-- Mediastinal Center & Spine -->
      <ellipse cx="400" cy="320" rx="35" ry="50" fill="#1E293B" stroke="#64748B" stroke-width="1.5"/>
      <circle cx="400" cy="470" r="22" fill="#334155" stroke="#94A3B8" stroke-width="2"/>
      <text x="400" y="474" text-anchor="middle" fill="#E2E8F0" font-family="monospace" font-size="10">Vertebra</text>
      <!-- CT Parameters Overlay -->
      <g fill="#38BDF8" font-family="monospace" font-size="11">
        <text x="40" y="140">KV: 120 | mA: 280</text>
        <text x="40" y="160">Thickness: 1.0 mm</text>
        <text x="40" y="180">Window: LUNG (W:1500 L:-600)</text>
        <text x="630" y="140">FOV: 350 mm</text>
        <text x="630" y="160">Filter: B70f High</text>
        <text x="630" y="180">Index: -142.50 mm</text>
      </g>
      ${footer()}
    </svg>
  `,

  // 3. Echocardiogram Color Doppler
  'synthetic_echo_color_doppler.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      ${header('TRANSTHORACIC ECHOCARDIOGRAPHY (COLOR DOPPLER A4C)', 'US-ECHO-TTE', 'SYN-ECHO-2026-03')}
      <!-- Sector Pie Scan -->
      <path d="M 400 120 L 220 520 A 240 240 0 0 0 580 520 Z" fill="#020617" stroke="#334155" stroke-width="2"/>
      <!-- Chamber Boundaries (LV, RV, LA, RA) -->
      <g stroke="#475569" stroke-width="1.5" fill="#0F172A" opacity="0.8">
        <!-- LV -->
        <path d="M 380 200 C 330 260 320 380 370 410 C 390 380 400 280 380 200 Z"/>
        <!-- RV -->
        <path d="M 420 200 C 470 260 480 380 430 410 C 410 380 400 280 420 200 Z"/>
        <!-- Mitral/Tricuspid Rings & Atria -->
        <ellipse cx="360" cy="460" rx="40" ry="30"/>
        <ellipse cx="440" cy="460" rx="40" ry="30"/>
      </g>
      <!-- Color Doppler Jet (Regurgitant Flow Mosaic) -->
      <ellipse cx="370" cy="380" rx="20" ry="35" fill="url(#dopplerGrad)" opacity="0.75"/>
      <defs>
        <linearGradient id="dopplerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#EF4444"/>
          <stop offset="50%" stop-color="#F59E0B"/>
          <stop offset="100%" stop-color="#3B82F6"/>
        </linearGradient>
      </defs>
      <!-- Doppler Scale Bar -->
      <g>
        <rect x="710" y="160" width="18" height="240" fill="url(#scaleGrad)" stroke="#64748B"/>
        <defs>
          <linearGradient id="scaleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#EF4444"/>
            <stop offset="50%" stop-color="#000000"/>
            <stop offset="100%" stop-color="#3B82F6"/>
          </linearGradient>
        </defs>
        <text x="735" y="170" fill="#EF4444" font-family="monospace" font-size="10">+65 cm/s</text>
        <text x="735" y="280" fill="#94A3B8" font-family="monospace" font-size="10">0</text>
        <text x="735" y="400" fill="#3B82F6" font-family="monospace" font-size="10">-65 cm/s</text>
      </g>
      <!-- Velocity & Volume Telemetry -->
      <g fill="#38BDF8" font-family="monospace" font-size="11">
        <text x="40" y="140">EF: 62% (Simpson's BP)</text>
        <text x="40" y="160">LVEDD: 4.6 cm | LVESD: 2.9 cm</text>
        <text x="40" y="180">E/A Ratio: 1.18 (Normal)</text>
        <text x="40" y="200">Peak PG: 18 mmHg</text>
      </g>
      ${footer()}
    </svg>
  `,

  // 4. Pelvic / Prostate Ultrasound
  'synthetic_pelvic_prostate_ultrasound.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      ${header('PELVIC & PROSTATE ULTRASOUND (TRANSABDOMINAL 3.5MHz)', 'US-PELVIC', 'SYN-US-2026-04')}
      <!-- Sector Field -->
      <path d="M 400 110 L 160 520 A 300 300 0 0 0 640 520 Z" fill="#030712" stroke="#334155" stroke-width="2"/>
      <!-- Urinary Bladder Anechoic Lumen -->
      <ellipse cx="400" cy="270" rx="140" ry="80" fill="#090E17" stroke="#475569" stroke-width="1.5"/>
      <text x="400" y="275" text-anchor="middle" fill="#64748B" font-family="monospace" font-size="11">URINARY BLADDER (ANECHOIC)</text>
      <!-- Prostate Gland Outline below Bladder Base -->
      <ellipse cx="400" cy="400" rx="65" ry="45" fill="#1E293B" stroke="#38BDF8" stroke-width="2"/>
      <circle cx="400" cy="400" r="6" fill="#F59E0B"/>
      <!-- Measurement Calipers -->
      <line x1="335" y1="400" x2="465" y2="400" stroke="#F59E0B" stroke-dasharray="2 2"/>
      <line x1="400" y1="355" x2="400" y2="445" stroke="#F59E0B" stroke-dasharray="2 2"/>
      <g fill="#FBBF24" font-family="monospace" font-size="10">
        <text x="475" y="405">D1: 4.2 cm</text>
        <text x="408" y="445">D2: 3.1 cm</text>
      </g>
      <!-- Depth Markers -->
      <g fill="#64748B" font-family="monospace" font-size="9">
        <text x="140" y="200">- 5 cm</text>
        <text x="140" y="300">- 10 cm</text>
        <text x="140" y="400">- 15 cm</text>
        <text x="140" y="500">- 20 cm</text>
      </g>
      <!-- Telemetry Box -->
      <g fill="#38BDF8" font-family="monospace" font-size="11">
        <text x="560" y="140">Transducer: C5-2</text>
        <text x="560" y="160">Prostate Vol: 22 cc</text>
        <text x="560" y="180">PVR: 15 mL (Normal)</text>
        <text x="560" y="200">Capsule: Intact</text>
      </g>
      ${footer()}
    </svg>
  `,

  // 5. MRI Lumbar Spine
  'synthetic_mri_lumbar_spine.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      ${header('MAGNETIC RESONANCE IMAGING (LUMBAR SPINE SAGITTAL T2)', 'MR-LSPINE-T2', 'SYN-MRI-2026-05')}
      <!-- Sagittal Anatomy Layout -->
      <rect x="250" y="110" width="300" height="430" rx="8" fill="#050811" stroke="#334155" stroke-width="2"/>
      <!-- Vertebral Bodies (L1 to L5) -->
      <g fill="#1E293B" stroke="#64748B" stroke-width="1.5">
        <rect x="340" y="150" width="70" height="36" rx="4"/><text x="320" y="172" fill="#94A3B8" font-family="monospace" font-size="10">L1</text>
        <rect x="340" y="200" width="70" height="36" rx="4"/><text x="320" y="222" fill="#94A3B8" font-family="monospace" font-size="10">L2</text>
        <rect x="340" y="250" width="70" height="36" rx="4"/><text x="320" y="272" fill="#94A3B8" font-family="monospace" font-size="10">L3</text>
        <rect x="340" y="300" width="70" height="36" rx="4"/><text x="320" y="322" fill="#94A3B8" font-family="monospace" font-size="10">L4</text>
        <rect x="335" y="350" width="70" height="36" rx="4"/><text x="315" y="372" fill="#94A3B8" font-family="monospace" font-size="10">L5</text>
        <!-- Sacrum -->
        <polygon points="330,400 410,400 370,470" fill="#1E293B" stroke="#64748B" stroke-width="1.5"/>
        <text x="310" y="425" fill="#94A3B8" font-family="monospace" font-size="10">S1</text>
      </g>
      <!-- Intervertebral Discs (Hydrated T2 hyperintense) -->
      <g fill="#38BDF8" opacity="0.6">
        <ellipse cx="375" cy="192" rx="30" ry="5"/>
        <ellipse cx="375" cy="242" rx="30" ry="5"/>
        <ellipse cx="375" cy="292" rx="30" ry="5"/>
        <ellipse cx="372" cy="342" rx="32" ry="5"/>
        <ellipse cx="370" cy="392" rx="33" ry="5" fill="#F59E0B" opacity="0.9"/> <!-- Desiccated Disc L5-S1 -->
      </g>
      <!-- Spinal Cord & Thecal Sac -->
      <path d="M 425 130 Q 425 280 420 380 Q 415 450 400 480" stroke="#E2E8F0" stroke-width="6" fill="none" opacity="0.8"/>
      <!-- MRI Sequence Parameters -->
      <g fill="#38BDF8" font-family="monospace" font-size="11">
        <text x="40" y="140">Echo Time (TE): 102 ms</text>
        <text x="40" y="160">Repetition (TR): 3500 ms</text>
        <text x="40" y="180">Flip Angle: 90 deg</text>
        <text x="40" y="200">Field Strength: 1.5 Tesla</text>
        <text x="600" y="140">Slice: 4.0 mm</text>
        <text x="600" y="160">Matrix: 384 x 256</text>
        <text x="600" y="180">Orientation: Sagittal</text>
      </g>
      ${footer()}
    </svg>
  `,

  // 6. CBC Hematology Sysmex
  'synthetic_cbc_hematology_sysmex.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      ${header('AUTOMATED HEMATOLOGY 5-PART DIFFERENTIAL ANALYZER', 'LAB-HEM-CBC', 'SYN-CBC-2026-06')}
      <!-- Scattergram Panels (WBC Diff, RBC Vol, PLT) -->
      <g>
        <!-- WBC Scatterplot -->
        <rect x="50" y="120" width="200" height="180" fill="#040711" stroke="#334155" stroke-width="1.5"/>
        <text x="60" y="140" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="12" font-weight="700">WBC 5-Part Scattergram</text>
        <!-- Dot Cluster Simulation -->
        <circle cx="110" cy="240" r="14" fill="#3B82F6" opacity="0.6"/> <!-- Lymphocytes -->
        <circle cx="150" cy="220" r="10" fill="#10B981" opacity="0.6"/> <!-- Monocytes -->
        <circle cx="170" cy="180" r="24" fill="#F59E0B" opacity="0.6"/> <!-- Neutrophils -->
        <circle cx="210" cy="240" r="8" fill="#EC4899" opacity="0.6"/> <!-- Eosinophils -->
        <text x="60" y="290" fill="#94A3B8" font-family="monospace" font-size="9">Side Scatter (Granularity) vs Fwd</text>
      </g>
      <!-- RBC Volume Histogram -->
      <g>
        <rect x="280" y="120" width="200" height="180" fill="#040711" stroke="#334155" stroke-width="1.5"/>
        <text x="290" y="140" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="12" font-weight="700">RBC Volume Histogram</text>
        <path d="M 290 280 Q 340 280 370 170 Q 400 280 460 280" fill="none" stroke="#EF4444" stroke-width="2"/>
        <text x="290" y="290" fill="#94A3B8" font-family="monospace" font-size="9">MCV Peak: 88.4 fL (Normal bell)</text>
      </g>
      <!-- PLT Histogram -->
      <g>
        <rect x="510" y="120" width="240" height="180" fill="#040711" stroke="#334155" stroke-width="1.5"/>
        <text x="520" y="140" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="12" font-weight="700">Platelet Volume Distribution</text>
        <path d="M 520 280 Q 550 190 580 230 Q 640 280 720 280" fill="none" stroke="#10B981" stroke-width="2"/>
        <text x="520" y="290" fill="#94A3B8" font-family="monospace" font-size="9">MPV: 9.8 fL | Normal log-normal</text>
      </g>
      <!-- Numerical Quantitative Table -->
      <g fill="#E2E8F0" font-family="monospace" font-size="11.5">
        <rect x="50" y="320" width="700" height="220" fill="#0D1527" stroke="#1E293B" stroke-width="1"/>
        <text x="70" y="345" fill="#94A3B8" font-weight="700">PARAMETER             RESULT       UNIT          REFERENCE RANGE    FLAG</text>
        <line x1="60" y1="355" x2="740" y2="355" stroke="#334155"/>
        <text x="70" y="380">Hemoglobin (Hb)       14.2         g/dL          13.0 - 17.0        NORMAL</text>
        <text x="70" y="405">Total WBC Count       7,450        /uL           4,000 - 10,000     NORMAL</text>
        <text x="70" y="430">Absolute Neutrophils  4,820        /uL (64.7%)   2,000 - 7,000      NORMAL</text>
        <text x="70" y="455">Absolute Lymphocytes  2,100        /uL (28.2%)   1,000 - 3,000      NORMAL</text>
        <text x="70" y="480">Platelet Count        265,000      /uL           150,000 - 450,000  NORMAL</text>
        <text x="70" y="505">Packed Cell Vol (PCV) 42.5         %             40.0 - 50.0        NORMAL</text>
        <text x="70" y="530">RBC Count             4.92         mil/uL        4.50 - 5.50        NORMAL</text>
      </g>
      ${footer()}
    </svg>
  `,

  // 7. HbA1c HPLC Chromatogram
  'synthetic_hba1c_hplc_chromatogram.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      ${header('ION-EXCHANGE HIGH PERFORMANCE LIQUID CHROMATOGRAPHY (HPLC)', 'LAB-HPLC-GLYC', 'SYN-HBA1C-2026-07')}
      <!-- Chromatogram Graph Window -->
      <rect x="60" y="120" width="680" height="260" fill="#040711" stroke="#334155" stroke-width="1.5"/>
      <!-- Gridlines -->
      <g stroke="#1E293B" stroke-width="0.5">
        <line x1="60" y1="185" x2="740" y2="185"/><line x1="60" y1="250" x2="740" y2="250"/><line x1="60" y1="315" x2="740" y2="315"/>
        <line x1="200" y1="120" x2="200" y2="380"/><line x1="340" y1="120" x2="340" y2="380"/><line x1="480" y1="120" x2="480" y2="380"/><line x1="620" y1="120" x2="620" y2="380"/>
      </g>
      <!-- HPLC Peaks (HbA1a, HbA1b, HbF, HbA1c, HbA0) -->
      <path d="M 80 370 
               L 130 370 Q 140 330 150 370 
               L 180 370 Q 195 320 210 370 
               L 240 370 Q 255 350 270 370 
               L 330 370 Q 360 140 390 370 
               L 450 370 Q 510 130 570 370 
               L 720 370" fill="none" stroke="#10B981" stroke-width="2.5"/>
      <!-- Peak Annotations -->
      <g fill="#FBBF24" font-family="monospace" font-size="10">
        <text x="140" y="325">A1a</text>
        <text x="195" y="315">A1b</text>
        <text x="250" y="340">HbF</text>
        <text x="345" y="130" fill="#EF4444" font-weight="700">★ HbA1c (9.8%)</text>
        <text x="500" y="125" fill="#38BDF8">HbA0 (Major Peak)</text>
      </g>
      <!-- Retention Times and Area Data -->
      <g fill="#E2E8F0" font-family="monospace" font-size="11">
        <rect x="60" y="400" width="680" height="145" fill="#0D1527" stroke="#1E293B" stroke-width="1"/>
        <text x="80" y="425" fill="#94A3B8" font-weight="700">PEAK NAME        RETENTION TIME (min)    AREA (%)        CONCENTRATION</text>
        <line x1="75" y1="435" x2="725" y2="435" stroke="#334155"/>
        <text x="80" y="460">HbA1a            0.22 min                1.2 %           -</text>
        <text x="80" y="482">HbA1b            0.34 min                2.4 %           -</text>
        <text x="80" y="504" fill="#EF4444" font-weight="700">HbA1c (Glycated) 0.68 min                9.8 %           EAG: 235 mg/dL (UNCONTROLLED)</text>
        <text x="80" y="526">HbA0 (Principal) 1.25 min                84.6 %          -</text>
      </g>
      ${footer()}
    </svg>
  `,

  // 8. Lipid Profile Panel
  'synthetic_lipid_profile.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      ${header('AUTOMATED SPECTROPHOTOMETRIC SERUM LIPID PROFILE', 'LAB-LIPID', 'SYN-LIP-2026-08')}
      <!-- Fractionation Bar Visualizer -->
      <rect x="50" y="120" width="700" height="200" fill="#040711" stroke="#334155" stroke-width="1.5"/>
      <text x="70" y="145" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="12" font-weight="700">Lipoprotein Fraction Distribution (mg/dL)</text>
      <!-- Bar: Total Cholesterol -->
      <text x="70" y="180" fill="#94A3B8" font-family="monospace" font-size="11">Total Chol (245)</text>
      <rect x="220" y="165" width="380" height="18" rx="3" fill="#EF4444"/>
      <!-- Bar: Triglycerides -->
      <text x="70" y="215" fill="#94A3B8" font-family="monospace" font-size="11">Triglycerides (220)</text>
      <rect x="220" y="200" width="340" height="18" rx="3" fill="#F59E0B"/>
      <!-- Bar: HDL Direct -->
      <text x="70" y="250" fill="#94A3B8" font-family="monospace" font-size="11">HDL Direct (38)</text>
      <rect x="220" y="235" width="80" height="18" rx="3" fill="#10B981"/>
      <!-- Bar: LDL Calculated -->
      <text x="70" y="285" fill="#94A3B8" font-family="monospace" font-size="11">LDL Calculated (163)</text>
      <rect x="220" y="270" width="280" height="18" rx="3" fill="#EF4444"/>
      <!-- Clinical Summary Table -->
      <g fill="#E2E8F0" font-family="monospace" font-size="11">
        <rect x="50" y="340" width="700" height="200" fill="#0D1527" stroke="#1E293B" stroke-width="1"/>
        <text x="70" y="365" fill="#94A3B8" font-weight="700">ANALYTE                 RESULT     UNIT       DESIRABLE       STATUS</text>
        <line x1="60" y1="375" x2="740" y2="375" stroke="#334155"/>
        <text x="70" y="400" fill="#EF4444">Total Cholesterol       245.0      mg/dL      &lt; 200.0         ELEVATED (High Risk)</text>
        <text x="70" y="425" fill="#F59E0B">Triglycerides           220.0      mg/dL      &lt; 150.0         BORDERLINE HIGH</text>
        <text x="70" y="450" fill="#F59E0B">HDL Cholesterol         38.0       mg/dL      &gt; 40.0          LOW (Suboptimal)</text>
        <text x="70" y="475" fill="#EF4444">LDL Cholesterol         163.0      mg/dL      &lt; 100.0         HIGH</text>
        <text x="70" y="500">VLDL Cholesterol        44.0       mg/dL      &lt; 30.0          BORDERLINE HIGH</text>
        <text x="70" y="525" fill="#EF4444">TC / HDL Ratio          6.44       Ratio      &lt; 4.5           ATHEROGENIC RISK</text>
      </g>
      ${footer()}
    </svg>
  `,

  // 9. Biochem LFT/KFT Sheet
  'synthetic_biochem_lft_kft_sheet.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      ${header('COMPREHENSIVE METABOLIC PANEL (LFT & KFT DUAL REPORT)', 'LAB-CMP-LFT-KFT', 'SYN-CMP-2026-09')}
      <!-- LFT Box -->
      <g>
        <rect x="50" y="120" width="340" height="420" fill="#0D1527" stroke="#1E293B" stroke-width="1"/>
        <text x="70" y="145" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="12" font-weight="700">LIVER FUNCTION TEST (LFT)</text>
        <line x1="60" y1="155" x2="380" y2="155" stroke="#334155"/>
        <g fill="#E2E8F0" font-family="monospace" font-size="10.5">
          <text x="70" y="180">Total Bilirubin:     0.8 mg/dL    (0.2 - 1.2)</text>
          <text x="70" y="210">Direct Bilirubin:    0.2 mg/dL    (0.0 - 0.3)</text>
          <text x="70" y="240">SGOT / AST:          28 U/L       (10 - 40)</text>
          <text x="70" y="270">SGPT / ALT:          32 U/L       (7 - 56)</text>
          <text x="70" y="300">Alkaline Phosphatase:78 U/L       (44 - 147)</text>
          <text x="70" y="330">Total Protein:       7.2 g/dL     (6.0 - 8.3)</text>
          <text x="70" y="360">Serum Albumin:       4.4 g/dL     (3.5 - 5.0)</text>
          <text x="70" y="390">A/G Ratio:           1.57         (1.2 - 2.2)</text>
          <text x="70" y="450" fill="#10B981" font-weight="700">✓ HEPATIC PROFILE: NORMAL INTACT</text>
        </g>
      </g>
      <!-- KFT Box -->
      <g>
        <rect x="410" y="120" width="340" height="420" fill="#0D1527" stroke="#1E293B" stroke-width="1"/>
        <text x="430" y="145" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="12" font-weight="700">KIDNEY FUNCTION TEST (KFT)</text>
        <line x1="420" y1="155" x2="740" y2="155" stroke="#334155"/>
        <g fill="#E2E8F0" font-family="monospace" font-size="10.5">
          <text x="430" y="180">Blood Urea:          26.0 mg/dL   (15 - 40)</text>
          <text x="430" y="210">Serum Creatinine:    0.92 mg/dL   (0.7 - 1.3)</text>
          <text x="430" y="240">Uric Acid:           5.4 mg/dL    (3.5 - 7.2)</text>
          <text x="430" y="270">eGFR (CKD-EPI):      98 mL/min    (&gt; 90)</text>
          <text x="430" y="300">Serum Sodium (Na+):  141 mEq/L    (136 - 145)</text>
          <text x="430" y="330">Serum Potassium(K+): 4.2 mEq/L    (3.5 - 5.1)</text>
          <text x="430" y="360">Chloride (Cl-):      102 mEq/L    (96 - 106)</text>
          <text x="430" y="390">Calcium:             9.4 mg/dL    (8.8 - 10.2)</text>
          <text x="430" y="450" fill="#10B981" font-weight="700">✓ RENAL CLEARANCE: NORMAL GFR</text>
        </g>
      </g>
      ${footer()}
    </svg>
  `,

  // 10. Vitamin D3 ECLIA Curve
  'synthetic_vitamin_d3_eclia_curve.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      ${header('ELECTROCHEMILUMINESCENCE IMMUNOASSAY (25-OH VIT D3 ECLIA)', 'LAB-ECLIA-VITD', 'SYN-VITD-2026-10')}
      <!-- Calibration Curve Graph -->
      <rect x="60" y="120" width="680" height="260" fill="#040711" stroke="#334155" stroke-width="1.5"/>
      <path d="M 100 150 Q 200 160 300 240 T 700 360" fill="none" stroke="#F59E0B" stroke-width="2.5"/>
      <!-- Calibration Reference Points -->
      <circle cx="120" cy="155" r="4" fill="#38BDF8"/><text x="130" y="150" fill="#94A3B8" font-family="monospace" font-size="9">Cal 1 (4 ng/mL)</text>
      <circle cx="280" cy="225" r="4" fill="#38BDF8"/><text x="290" y="220" fill="#94A3B8" font-family="monospace" font-size="9">Cal 3 (30 ng/mL)</text>
      <circle cx="500" cy="320" r="4" fill="#38BDF8"/><text x="510" y="315" fill="#94A3B8" font-family="monospace" font-size="9">Cal 5 (100 ng/mL)</text>
      <!-- Patient Measured Signal -->
      <circle cx="210" cy="188" r="7" fill="#EF4444" stroke="#ffffff" stroke-width="2"/>
      <text x="225" y="193" fill="#EF4444" font-family="system-ui, sans-serif" font-size="12" font-weight="800">PATIENT SIGNAL (11.4 ng/mL)</text>
      <!-- Results Table -->
      <g fill="#E2E8F0" font-family="monospace" font-size="11">
        <rect x="60" y="400" width="680" height="145" fill="#0D1527" stroke="#1E293B" stroke-width="1"/>
        <text x="80" y="425" fill="#94A3B8" font-weight="700">ANALYTE                OBSERVED      UNIT     CLINICAL TIER          INTERPRETATION</text>
        <line x1="75" y1="435" x2="725" y2="435" stroke="#334155"/>
        <text x="80" y="460" fill="#EF4444" font-weight="700">25-OH Vitamin D Total  11.4          ng/mL    &lt; 20 ng/mL             DEFICIENT (Requires Rx)</text>
        <text x="80" y="485">Reference Guideline:   Deficient: &lt; 20 | Insufficient: 21-29 | Sufficient: 30-100</text>
        <text x="80" y="510">Methodology:           Roche Cobas e601 Competitive Electro-chemiluminescence</text>
      </g>
      ${footer()}
    </svg>
  `,

  // 11. GeneXpert CBNAAT Real-Time PCR
  'synthetic_cbnaat_genexpert_mtb.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      ${header('CARTRIDGE BASED NUCLEIC ACID AMPLIFICATION TEST (CBNAAT)', 'MOL-PCR-MTB', 'SYN-XPERT-2026-11')}
      <!-- Real-Time PCR Multi-Channel Cycle Graph -->
      <rect x="60" y="120" width="680" height="260" fill="#040711" stroke="#334155" stroke-width="1.5"/>
      <g stroke="#1E293B" stroke-width="0.5">
        <line x1="60" y1="180" x2="740" y2="180"/><line x1="60" y1="240" x2="740" y2="240"/><line x1="60" y1="300" x2="740" y2="300"/>
        <line x1="200" y1="120" x2="200" y2="380"/><line x1="360" y1="120" x2="360" y2="380"/><line x1="520" y1="120" x2="520" y2="380"/>
      </g>
      <!-- Baseline Noise -->
      <line x1="80" y1="360" x2="300" y2="360" stroke="#64748B" stroke-width="1.5"/>
      <!-- Sigmoidal Amplification Curves (Probes A, B, C, D, E & SPC) -->
      <path d="M 80 360 L 260 360 Q 340 360 380 180 T 480 150 L 720 150" fill="none" stroke="#EF4444" stroke-width="2.5"/> <!-- Probe A -->
      <path d="M 80 360 L 270 360 Q 350 360 390 190 T 490 160 L 720 160" fill="none" stroke="#F59E0B" stroke-width="2"/> <!-- Probe B -->
      <path d="M 80 360 L 250 360 Q 330 360 370 200 T 470 170 L 720 170" fill="none" stroke="#10B981" stroke-width="2"/> <!-- SPC -->
      <text x="490" y="145" fill="#EF4444" font-family="monospace" font-size="10">Probe A (Ct 17.8)</text>
      <text x="500" y="175" fill="#10B981" font-family="monospace" font-size="10">SPC (Ct 19.2 Valid)</text>
      <!-- Results Table -->
      <g fill="#E2E8F0" font-family="monospace" font-size="11">
        <rect x="60" y="400" width="680" height="145" fill="#0D1527" stroke="#1E293B" stroke-width="1"/>
        <text x="80" y="425" fill="#94A3B8" font-weight="700">TARGET                   STATUS           CYCLE THRESHOLD (Ct)   RIF RESISTANCE</text>
        <line x1="75" y1="435" x2="725" y2="435" stroke="#334155"/>
        <text x="80" y="460" fill="#EF4444" font-weight="700">Mycobacterium TB (MTB)   DETECTED (HIGH)  Ct: 17.8               NOT DETECTED (Sensitive)</text>
        <text x="80" y="485">Sample Processing Ctrl   PASS (Valid)     Ct: 19.2               -</text>
        <text x="80" y="510">Interpretation:          Consistent with Pulmonary Tuberculosis; Sensitive to Rifampicin</text>
      </g>
      ${footer()}
    </svg>
  `,

  // 12. Urine Microscopy Sediment
  'synthetic_urine_microscopy_sediment.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      ${header('CLINICAL URINALYSIS & MICROSCOPIC SEDIMENT EXAMINATION', 'LAB-URI-MIC', 'SYN-URI-2026-12')}
      <!-- Circular High-Power Field (HPF) 400x -->
      <circle cx="250" cy="320" r="190" fill="#030712" stroke="#38BDF8" stroke-width="2"/>
      <circle cx="250" cy="320" r="190" fill="radial-gradient(circle, #0F172A 0%, #030712 100%)" opacity="0.6"/>
      <!-- Cellular Elements in Field -->
      <!-- Squamous Epithelial Cell -->
      <polygon points="200,240 260,230 280,270 230,290 190,270" fill="#334155" stroke="#94A3B8" stroke-width="1.5"/>
      <circle cx="235" cy="260" r="6" fill="#64748B"/>
      <!-- Scattered WBCs (Pyuria) -->
      <circle cx="160" cy="340" r="9" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/><circle cx="160" cy="340" r="3" fill="#F59E0B"/>
      <circle cx="310" cy="310" r="9" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/><circle cx="310" cy="310" r="3" fill="#F59E0B"/>
      <circle cx="240" cy="380" r="9" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5"/><circle cx="240" cy="380" r="3" fill="#F59E0B"/>
      <!-- Calcium Oxalate Crystal (Envelope Shape) -->
      <rect x="290" y="220" width="22" height="22" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>
      <line x1="290" y1="220" x2="312" y2="242" stroke="#38BDF8"/>
      <line x1="312" y1="220" x2="290" y2="242" stroke="#38BDF8"/>
      <!-- Right Side Quantitative Findings -->
      <g fill="#E2E8F0" font-family="monospace" font-size="11">
        <rect x="470" y="120" width="280" height="420" fill="#0D1527" stroke="#1E293B" stroke-width="1"/>
        <text x="490" y="145" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="12" font-weight="700">SEDIMENT MICROSCOPY (400x)</text>
        <line x1="480" y1="155" x2="740" y2="155" stroke="#334155"/>
        <text x="490" y="180">Pus Cells (WBC):    15-20 / HPF</text>
        <text x="490" y="210">Red Blood Cells:    2-4 / HPF</text>
        <text x="490" y="240">Epithelial Cells:   4-6 / HPF</text>
        <text x="490" y="270">Casts:              None Seen</text>
        <text x="490" y="300">Crystals:           CaOx (+) Occasional</text>
        <text x="490" y="330">Bacteria:           Moderate (++)</text>
        <line x1="480" y1="355" x2="740" y2="355" stroke="#334155"/>
        <text x="490" y="380" fill="#F59E0B" font-weight="700">⚠ URINE BIOCHEMISTRY</text>
        <text x="490" y="410">Leukocyte Esterase: Positive (+)</text>
        <text x="490" y="440">Nitrite:            Positive (+)</text>
        <text x="490" y="470">Protein:            Trace (15 mg/dL)</text>
        <text x="490" y="500" fill="#EF4444" font-weight="700">Impression: Acute UTI</text>
      </g>
      ${footer()}
    </svg>
  `,

  // 13. 12-Lead Diagnostic ECG
  'synthetic_ecg_12lead_tracing.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      ${header('12-LEAD DIAGNOSTIC ELECTROCARDIOGRAM (25mm/s, 10mm/mV)', 'ECG-12LEAD', 'SYN-ECG-2026-13')}
      <!-- Standard Pink ECG Grid Background -->
      <rect x="30" y="110" width="740" height="430" fill="#1C1014" stroke="#831843" stroke-width="1.5"/>
      <g stroke="#9D174D" stroke-width="0.4" opacity="0.4">
        <!-- Minor 1mm Gridlines simulated -->
        <line x1="30" y1="160" x2="770" y2="160"/><line x1="30" y1="210" x2="770" y2="210"/>
        <line x1="30" y1="260" x2="770" y2="260"/><line x1="30" y1="310" x2="770" y2="310"/>
        <line x1="30" y1="360" x2="770" y2="360"/><line x1="30" y1="410" x2="770" y2="410"/><line x1="30" y1="460" x2="770" y2="460"/>
        <line x1="150" y1="110" x2="150" y2="540"/><line x1="270" y1="110" x2="270" y2="540"/>
        <line x1="390" y1="110" x2="390" y2="540"/><line x1="510" y1="110" x2="510" y2="540"/><line x1="630" y1="110" x2="630" y2="540"/>
      </g>
      <!-- ECG Waveforms (Lead I, II, III, V1-V6) -->
      <!-- P-Q-R-S-T repeated sequence function -->
      <g stroke="#34D399" stroke-width="1.6" fill="none">
        <!-- Row 1: Lead I & aVR -->
        <path d="M 50 180 L 80 180 Q 90 170 100 180 L 110 180 L 115 185 L 120 130 L 128 200 L 132 180 L 150 180 Q 165 165 180 180 L 220 180
                 L 250 180 Q 260 170 270 180 L 280 180 L 285 185 L 290 130 L 298 200 L 302 180 L 320 180 Q 335 165 350 180 L 390 180"/>
        <path d="M 420 180 L 450 180 Q 460 190 470 180 L 480 180 L 485 175 L 490 230 L 498 160 L 502 180 L 520 180 Q 535 195 550 180 L 750 180"/>
        <!-- Row 2: Lead II (Rhythm Strip) -->
        <path d="M 50 280 L 90 280 Q 105 268 120 280 L 135 280 L 140 288 L 145 210 L 155 305 L 160 280 L 185 280 Q 205 260 225 280 L 270 280
                 L 310 280 Q 325 268 340 280 L 355 280 L 360 288 L 365 210 L 375 305 L 380 280 L 405 280 Q 425 260 445 280 L 490 280
                 L 530 280 Q 545 268 560 280 L 575 280 L 580 288 L 585 210 L 595 305 L 600 280 L 625 280 Q 645 260 665 280 L 750 280"/>
        <!-- Row 3: Precordial Leads V1 - V6 -->
        <path d="M 50 380 L 100 380 L 105 385 L 110 330 L 118 400 L 122 380 L 150 380 Q 170 365 190 380 L 260 380
                 L 290 380 L 295 385 L 300 320 L 310 405 L 315 380 L 340 380 Q 360 360 380 380 L 450 380
                 L 480 380 L 485 385 L 490 310 L 500 410 L 505 380 L 530 380 Q 550 355 570 380 L 750 380"/>
      </g>
      <!-- Lead Markers -->
      <g fill="#F43F5E" font-family="monospace" font-size="12" font-weight="700">
        <text x="50" y="150">Lead I</text><text x="420" y="150">aVR</text>
        <text x="50" y="250">Lead II (Rhythm)</text><text x="420" y="250">V1</text>
        <text x="50" y="350">Lead III</text><text x="420" y="350">V5</text>
      </g>
      <!-- Heart Rate & Intervals -->
      <g fill="#FBBF24" font-family="monospace" font-size="11">
        <text x="50" y="525">HR: 72 bpm (Normal Sinus)</text>
        <text x="240" y="525">PR: 156 ms</text>
        <text x="350" y="525">QRS: 84 ms</text>
        <text x="450" y="525">QT/QTc: 388/412 ms</text>
        <text x="610" y="525">P-R-T Axis: 48° 56° 42°</text>
      </g>
      ${footer()}
    </svg>
  `,

  // 14. Spirometry PFT Flow-Volume Curve
  'synthetic_spirometry_pft_curve.svg': `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      ${header('PULMONARY FUNCTION TESTING (SPIROMETRY FLOW-VOLUME LOOP)', 'PFT-SPIRO', 'SYN-PFT-2026-14')}
      <!-- Flow-Volume Graph Window -->
      <rect x="60" y="120" width="360" height="420" fill="#040711" stroke="#334155" stroke-width="1.5"/>
      <text x="80" y="145" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="12" font-weight="700">Flow-Volume Loop (L/s vs L)</text>
      <!-- Axes -->
      <line x1="80" y1="330" x2="400" y2="330" stroke="#64748B" stroke-width="1.5"/> <!-- Zero Flow Line -->
      <line x1="120" y1="160" x2="120" y2="500" stroke="#64748B" stroke-width="1.5"/> <!-- Volume Axis -->
      <!-- Pre-Bronchodilator (Obstructive Scooped Curve) -->
      <path d="M 120 330 Q 140 180 180 200 Q 230 300 360 330 Q 250 430 120 330 Z" fill="none" stroke="#EF4444" stroke-width="2.5"/>
      <!-- Post-Bronchodilator (Improved Response) -->
      <path d="M 120 330 Q 140 160 190 170 Q 250 260 380 330 Q 260 440 120 330 Z" fill="none" stroke="#10B981" stroke-width="2" stroke-dasharray="4 2"/>
      <text x="210" y="165" fill="#10B981" font-family="monospace" font-size="10">Post-BD (+18%)</text>
      <text x="200" y="225" fill="#EF4444" font-family="monospace" font-size="10">Pre-BD Scooped</text>
      <!-- Quantitative Spirometry Metrics Table -->
      <g fill="#E2E8F0" font-family="monospace" font-size="11">
        <rect x="440" y="120" width="310" height="420" fill="#0D1527" stroke="#1E293B" stroke-width="1"/>
        <text x="460" y="145" fill="#38BDF8" font-family="system-ui, sans-serif" font-size="12" font-weight="700">QUANTITATIVE PFT DATA</text>
        <line x1="450" y1="155" x2="740" y2="155" stroke="#334155"/>
        <text x="460" y="180">PARAMETER    PRE    POST   %CHG</text>
        <line x1="450" y1="190" x2="740" y2="190" stroke="#334155"/>
        <text x="460" y="215">FVC (L)      3.42   3.85   +12%</text>
        <text x="460" y="245" fill="#EF4444" font-weight="700">FEV1 (L)     1.95   2.38   +22%</text>
        <text x="460" y="275" fill="#EF4444" font-weight="700">FEV1/FVC     57%    62%    Revers.</text>
        <text x="460" y="305">PEF (L/s)    4.80   6.10   +27%</text>
        <text x="460" y="335">FEF 25-75%   1.45   2.10   +45%</text>
        <line x1="450" y1="355" x2="740" y2="355" stroke="#334155"/>
        <text x="460" y="380" fill="#10B981" font-weight="700">Reversibility: POSITIVE (&gt;12% &amp; &gt;200mL)</text>
        <text x="460" y="410" fill="#F59E0B">Impression: Obstructive Airway</text>
        <text x="460" y="430" fill="#F59E0B">Defect (Bronchial Asthma) with</text>
        <text x="460" y="450" fill="#F59E0B">Significant Bronchodilator</text>
        <text x="460" y="470" fill="#F59E0B">Responsiveness.</text>
      </g>
      ${footer()}
    </svg>
  `
};

for (const [filename, content] of Object.entries(svgs)) {
  const filePath = path.join(targetDir, filename);
  fs.writeFileSync(filePath, content.trim(), 'utf8');
  console.log(`✓ Generated synthetic scan: ${filename}`);
}
