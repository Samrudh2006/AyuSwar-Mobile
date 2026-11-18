/**
 * AyuSwar AI — Local-Only Sanitized Diagnostic Logger
 * src/utils/diagnosticLogger.js
 * 
 * Provides opt-in diagnostic instrumentation via ?diag=1 query parameter or localStorage.
 * 
 * STRICT PRIVACY & HONESTY CONTRACT:
 * - Records SANITIZED stage names, HTTP status codes, and elapsed execution time.
 * - Records boolean transcript existence and mic permission state strings.
 * - NEVER logs raw transcript text, provider error response bodies, request payloads,
 *   patient records, API keys, or secrets.
 */

const MAX_LOG_ENTRIES = 100;
const memoryLogBuffer = [];

/**
 * Checks if diagnostic mode is active.
 * Opt-in via URL (?diag=1) or localStorage key 'ayuswar_diag'.
 */
export function isDiagnosticModeEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    const searchParams = new URLSearchParams(window.location.search || '');
    if (searchParams.get('diag') === '1' || searchParams.get('diagnostic') === '1') {
      return true;
    }
    return window.localStorage?.getItem('ayuswar_diag') === '1';
  } catch {
    return false;
  }
}

/**
 * Enable or disable diagnostic mode programmatically in localStorage.
 */
export function setDiagnosticMode(enabled) {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      window.localStorage.setItem('ayuswar_diag', '1');
    } else {
      window.localStorage.removeItem('ayuswar_diag');
    }
  } catch {}
}

/**
 * Records a sanitized diagnostic stage event.
 * 
 * @param {Object} event
 * @param {string} event.stage - Stage name (e.g. 'gnani_tts', 'sample_wav', 'browser_fallback', 'evon', 'groq', 'local_rules', 'mic_check')
 * @param {string|number} event.outcomeCode - Sanitized status code (e.g. 200, 503, 'OK', 'TIMEOUT', 'FALLBACK', 'DENIED')
 * @param {number} [event.elapsedMs] - Elapsed time in milliseconds
 * @param {string} [event.recognizer] - 'gnani_stt' | 'web_speech' | 'none'
 * @param {string} [event.micState] - 'granted' | 'denied' | 'prompt' | 'unknown'
 * @param {boolean} [event.hasTranscript] - Boolean only (never log text!)
 * @param {string} [event.component] - Calling component/service name
 */
export function recordDiagnosticStage({
  stage = 'unknown_stage',
  outcomeCode = 'UNKNOWN',
  elapsedMs = 0,
  recognizer = undefined,
  micState = undefined,
  hasTranscript = undefined,
  component = 'general'
} = {}) {
  const sanitizedEntry = {
    timestamp: new Date().toISOString(),
    component: String(component).slice(0, 40),
    stage: String(stage).slice(0, 40),
    outcomeCode: typeof outcomeCode === 'number' ? outcomeCode : String(outcomeCode).slice(0, 30),
    elapsedMs: Math.round(Number(elapsedMs) || 0)
  };

  if (recognizer !== undefined) {
    sanitizedEntry.recognizer = ['gnani_stt', 'web_speech', 'none'].includes(recognizer) 
      ? recognizer 
      : 'other';
  }

  if (micState !== undefined) {
    sanitizedEntry.micState = ['granted', 'denied', 'prompt', 'unknown'].includes(micState)
      ? micState
      : 'unknown';
  }

  if (hasTranscript !== undefined) {
    sanitizedEntry.hasTranscript = Boolean(hasTranscript);
  }

  memoryLogBuffer.push(sanitizedEntry);
  if (memoryLogBuffer.length > MAX_LOG_ENTRIES) {
    memoryLogBuffer.shift();
  }

  if (typeof window !== 'undefined') {
    window.__AYUSWAR_DIAG_LOGS__ = memoryLogBuffer;
    if (isDiagnosticModeEnabled()) {
      console.info(
        `[AyuSwar Diag] ${sanitizedEntry.component} -> ${sanitizedEntry.stage}: ` +
        `code=${sanitizedEntry.outcomeCode} (${sanitizedEntry.elapsedMs}ms)` +
        (sanitizedEntry.micState ? ` mic=${sanitizedEntry.micState}` : '') +
        (sanitizedEntry.hasTranscript !== undefined ? ` hasTranscript=${sanitizedEntry.hasTranscript}` : '')
      );
    }
  }

  return sanitizedEntry;
}

/**
 * Returns all recorded sanitized diagnostic entries.
 */
export function getDiagnosticLogs() {
  return [...memoryLogBuffer];
}

/**
 * Clears the diagnostic log buffer.
 */
export function clearDiagnosticLogs() {
  memoryLogBuffer.length = 0;
  if (typeof window !== 'undefined') {
    window.__AYUSWAR_DIAG_LOGS__ = [];
  }
}
