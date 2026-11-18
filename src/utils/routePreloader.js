/**
 * routePreloader.js
 * Intelligent Zero-Latency Route & Module Preloader with Resilient Retry for AyuSwar AI
 * 
 * 1. Preloads code-split route chunks and heavyweight modals during browser idle periods.
 * 2. Implements lazyWithRetry to prevent "chunk failed to load" errors.
 * 3. Provides instantaneous 0ms page transitions when users click any link or button.
 */
import React from 'react';

export const ROUTE_IMPORTERS = {
  // Primary Public & Feature Routes
  '/about': () => import('../views/AboutView'),
  '/team': () => import('../views/AboutView'),
  '/technology': () => import('../views/ArchitectureView'),
  '/benchmarks': () => import('../views/ClinicalBenchmarkView'),
  '/language-matrix': () => import('../views/IndicLanguageMatrixView'),
  '/datasets': () => import('../views/DatasetExplorerView'),
  '/scanner': () => import('../views/PrescriptionScannerView'),
  '/audio-rx': () => import('../views/AudioRxStudioView'),
  '/acoustic-lab': () => import('../views/AcousticBiomarkerLabView'),
  '/emergency': () => import('../views/EmergencyTriageView'),
  '/emergency/handover': () => import('../views/EmergencyHandoverView'),
  '/sanjivani': () => import('../components/SanjivaniEmergencyModal'),
  'sanjivani_modal': () => import('../components/SanjivaniEmergencyModal'),
  '/solutions': () => import('../components/DetailedModuleView'),
  '/solutions/opd_ambient_scribe': () => import('../components/DetailedModuleView'),
  '/clinical-console': () => import('../components/ClinicalConsole'),
  '/auth': () => import('../views/UnifiedAuthView'),
  '/auth/doctor': () => import('../views/UnifiedAuthView'),
  '/auth/patient': () => import('../views/UnifiedAuthView'),
  '/login': () => import('../views/UnifiedAuthView'),
  '/doctor-portal': () => import('../components/DoctorPortal'),
  '/patient-portal': () => import('../components/PatientPortal'),
  '/prescription/preview': () => import('../views/PrescriptionPreviewView'),
  '/privacy': () => import('../views/PrivacyPolicyView'),
  '/terms': () => import('../views/TermsOfServiceView'),

  // Route aliases for maximum safety
  '/architecture': () => import('../views/ArchitectureView'),
  '/benchmark': () => import('../views/ClinicalBenchmarkView'),
  '/languages': () => import('../views/IndicLanguageMatrixView'),
  '/dataset': () => import('../views/DatasetExplorerView'),
  '/doctor': () => import('../components/DoctorPortal'),
  '/patient': () => import('../components/PatientPortal')
};

const preloadedCache = new Set();
const moduleCache = new Map();

/**
 * Resilient React.lazy wrapper with exponential backoff retry and stale bundle auto-reload.
 * Prevents "Failed to fetch dynamically imported module" errors when network is fluctuating
 * or when the dev server re-optimizes/restarts.
 */
export function lazyWithRetry(importer, retries = 3, interval = 300) {
  return React.lazy(() => {
    return new Promise((resolve, reject) => {
      const attempt = (remainingRetries) => {
        importer()
          .then(resolve)
          .catch((error) => {
            const isImportError = error?.message?.includes('Failed to fetch dynamically imported module') ||
              error?.message?.includes('dynamically imported module') ||
              error?.name === 'ChunkLoadError';

            if (remainingRetries > 0) {
              setTimeout(() => {
                attempt(remainingRetries - 1);
              }, interval);
            } else if (isImportError && typeof window !== 'undefined' && !sessionStorage.getItem('retry_reload_lock')) {
              // Dev server restart or new build hash: one-time safe reload
              sessionStorage.setItem('retry_reload_lock', '1');
              console.warn('Stale dynamic chunk detected. Auto-reloading page once:', error);
              window.location.reload();
            } else {
              console.warn('Module dynamic import failed after retries:', error);
              reject(error);
            }
          });
      };
      attempt(retries);
    });
  });
}

/**
 * Preloads a specific route or modal module immediately (e.g., on button/link hover/touch)
 */
export function preloadModule(keyOrPath) {
  if (!keyOrPath) return;

  const normalized = keyOrPath.startsWith('http')
    ? (new URL(keyOrPath, window.location.origin)).pathname
    : keyOrPath;

  if (preloadedCache.has(normalized)) return;

  const importer = ROUTE_IMPORTERS[normalized] ||
    Object.entries(ROUTE_IMPORTERS).find(([k]) => normalized.startsWith(k) && k !== '/')?.[1];

  if (importer) {
    preloadedCache.add(normalized);
    try {
      importer()
        .then(mod => {
          moduleCache.set(normalized, mod);
        })
        .catch(() => {
          preloadedCache.delete(normalized);
        });
    } catch {
      preloadedCache.delete(normalized);
    }
  }
}

/**
 * Preload all primary routes sequentially during browser idle time so the entire app
 * is warmed up and delivers instant 0ms transitions on every page and button.
 */
export function initAllRoutesPreload() {
  if (typeof window === 'undefined') return;

  // Respect constrained connections: on 2G/save-data, skip eager route warmup.
  // Routes still lazy-load on demand and via intent-based hover/touch preload.
  const conn = typeof navigator !== 'undefined' ? navigator.connection : null;
  const constrained = !!conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''));
  if (constrained) return;

  const priorityKeys = [
    '/emergency',
    '/solutions',
    '/scanner',
    '/audio-rx',
    '/acoustic-lab',
    '/about',
    '/technology',
    '/benchmarks',
    '/language-matrix',
    '/datasets',
    '/clinical-console',
    '/auth/doctor',
    '/auth/patient',
    '/doctor-portal',
    '/patient-portal'
  ];

  const runPreload = () => {
    priorityKeys.forEach((key, index) => {
      setTimeout(() => {
        preloadModule(key);
      }, 50 + index * 40); // 40ms stagger keeps frame rate locked at 60 FPS
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(runPreload, { timeout: 1000 });
  } else {
    setTimeout(runPreload, 200);
  }

  // Heavyweight emergency modal (maplibre ~230KB) is deferred past first paint;
  // intent-based hover/touch preload below still fetches it before most taps.
  setTimeout(() => { preloadModule('sanjivani_modal'); }, 6000);

  // Preload on mouseover/pointerdown across all links and buttons
  try {
    const handlePointerHover = (e) => {
      if (!e.target || typeof e.target.closest !== 'function') return;
      const el = e.target.closest('a[href], button[data-route], [data-preload]');
      if (!el) return;

      const href = el.getAttribute('href') || el.getAttribute('data-route') || el.getAttribute('data-preload');
      if (href && href.startsWith('/')) {
        preloadModule(href);
      }
    };

    document.addEventListener('pointerenter', handlePointerHover, { passive: true, capture: true });
    document.addEventListener('touchstart', handlePointerHover, { passive: true, capture: true });
  } catch { }
}
