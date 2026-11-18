/**
 * AyuSwar AI — Localized Formatting Utilities
 * Handles locale-aware formatting for dates, numbers, currency, and server error codes.
 */

import { TRANSLATIONS } from './translations.js';

/**
 * Maps standard BCP 47 language tags
 */
export function normalizeLocale(locale) {
  if (!locale || typeof locale !== 'string') return 'en-IN';
  if (TRANSLATIONS[locale]) return locale;
  const lower = locale.toLowerCase().trim();
  if (lower.startsWith('te') || lower.includes('telugu') || lower.includes('తెలుగు')) return 'te-IN';
  if (lower.startsWith('hi') || lower.includes('hindi') || lower.includes('हिन्दी') || lower.includes('हिंदी')) return 'hi-IN';
  if (lower.startsWith('ta') || lower.includes('tamil') || lower.includes('தமிழ்')) return 'ta-IN';
  if (lower.startsWith('kn') || lower.includes('kannada') || lower.includes('ಕನ್ನಡ')) return 'kn-IN';
  if (lower.startsWith('mr') || lower.includes('marathi') || lower.includes('मराठी')) return 'mr-IN';
  if (lower.startsWith('en') || lower.includes('english')) return 'en-IN';
  const prefix = lower.split('-')[0];
  const match = Object.keys(TRANSLATIONS).find(k => k.startsWith(prefix));
  return match || 'en-IN';
}

/**
 * Format a Date object or timestamp string using the user's active locale
 */
export function formatLocalizedDate(dateInput, locale = 'en-IN', options = {}) {
  try {
    const norm = normalizeLocale(locale);
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput || '');
    
    const defaultOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...options
    };
    
    return new Intl.DateTimeFormat(norm, defaultOptions).format(date);
  } catch (err) {
    return String(dateInput || '');
  }
}

/**
 * Format numbers with locale-aware digit groupings and numerals
 */
export function formatLocalizedNumber(numInput, locale = 'en-IN', options = {}) {
  try {
    const norm = normalizeLocale(locale);
    const num = Number(numInput);
    if (isNaN(num)) return String(numInput ?? '');
    return new Intl.NumberFormat(norm, options).format(num);
  } catch {
    return String(numInput ?? '');
  }
}

/**
 * Format currency amounts in INR (₹)
 */
export function formatLocalizedCurrency(amountInput, locale = 'en-IN') {
  try {
    const norm = normalizeLocale(locale);
    const num = Number(amountInput);
    if (isNaN(num)) return `₹${amountInput}`;
    return new Intl.NumberFormat(norm, {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  } catch {
    return `₹${amountInput}`;
  }
}

/**
 * Translate a server error code or status to a safe user-facing message
 */
export function getLocalizedServerError(codeOrStatus, locale = 'en-IN') {
  const norm = normalizeLocale(locale);
  const dict = TRANSLATIONS[norm] || TRANSLATIONS['en-IN'];
  
  if (codeOrStatus === 429 || codeOrStatus === 'RATE_LIMITED') {
    return dict['errors.rateLimit'] || 'Rate limit exceeded. Please wait a moment.';
  }
  if (codeOrStatus === 401 || codeOrStatus === 403 || codeOrStatus === 'UNAUTHORIZED') {
    return dict['errors.unauthorized'] || 'Authentication required.';
  }
  if (codeOrStatus === 413 || codeOrStatus === 'PAYLOAD_TOO_LARGE') {
    return dict['errors.payloadTooLarge'] || 'Payload too large.';
  }
  if (codeOrStatus === 502 || codeOrStatus === 503 || codeOrStatus === 'UPSTREAM_FAILED') {
    return dict['errors.upstreamService'] || 'Service temporarily unavailable. Offline mode active.';
  }
  if (codeOrStatus === 'NETWORK_ERROR') {
    return dict['errors.network'] || 'Network connection issue.';
  }
  
  return dict['errors.generic'] || 'An unexpected condition occurred.';
}
