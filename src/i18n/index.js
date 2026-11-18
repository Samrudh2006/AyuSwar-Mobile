/**
 * AyuSwar AI — Unified i18n Translation & Localization Engine
 */

import { TRANSLATIONS } from './translations.js';
import { normalizeLocale, formatLocalizedDate, formatLocalizedNumber, formatLocalizedCurrency, getLocalizedServerError } from './formatters.js';

export { TRANSLATIONS, normalizeLocale, formatLocalizedDate, formatLocalizedNumber, formatLocalizedCurrency, getLocalizedServerError };

/**
 * Translate a key into the specified locale, with parameter interpolation
 * Fallback priority: specified locale -> en-IN -> raw key
 */
export function translate(key, locale = 'en-IN', params = {}) {
  const norm = normalizeLocale(locale);
  const dict = TRANSLATIONS[norm] || TRANSLATIONS['en-IN'];
  let text = dict[key] || TRANSLATIONS['en-IN']?.[key] || key;

  if (params && typeof params === 'object') {
    Object.keys(params).forEach((p) => {
      text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
    });
  }

  return text;
}

/**
 * Verification utility: checks translation completeness across all locales
 */
export function auditTranslationCompleteness() {
  const baseKeys = Object.keys(TRANSLATIONS['en-IN']);
  const locales = Object.keys(TRANSLATIONS);
  const report = {};

  for (const loc of locales) {
    const locKeys = Object.keys(TRANSLATIONS[loc]);
    const missing = baseKeys.filter(k => !locKeys.includes(k) || !TRANSLATIONS[loc][k]);
    report[loc] = {
      totalKeys: locKeys.length,
      expectedKeys: baseKeys.length,
      missingCount: missing.length,
      missingKeys: missing,
      isComplete: missing.length === 0
    };
  }

  return report;
}
