/**
 * recordingConsent.js — AyuSwar AI explicit recording consent gate
 *
 * The rural-PHC requirements call for a consent screen before the first
 * recording. This module is the durable record of that consent:
 * grantRecordingConsent() is called only from the consent screen's explicit
 * affirmative action, and consultation recording must go through
 * assertRecordingConsent() before opening the microphone.
 *
 * The record is local to the device and names the consent text version so a
 * wording change can require re-consent. Demo synthetic flows keep working:
 * scripted/sample transcript paths do not record audio and need no consent.
 */

const CONSENT_STORAGE_KEY = 'ayuswar_recording_consent_v1';
export const CONSENT_TEXT_VERSION = '2026-11-20.initial';

export function getRecordingConsent(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.granted === true && parsed.version === CONSENT_TEXT_VERSION) {
      return parsed;
    }
    return null; // older wording -> re-consent required
  } catch {
    return null;
  }
}

export function grantRecordingConsent(storage = globalThis.localStorage) {
  const record = {
    granted: true,
    version: CONSENT_TEXT_VERSION,
    grantedAt: new Date().toISOString(),
    scope: 'microphone recording for synthetic demo consultations on this device'
  };
  storage?.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  return record;
}

export function revokeRecordingConsent(storage = globalThis.localStorage) {
  storage?.removeItem(CONSENT_STORAGE_KEY);
}

export class RecordingConsentRequiredError extends Error {
  constructor() {
    super('Recording consent has not been granted on this device.');
    this.name = 'RecordingConsentRequiredError';
  }
}

export function assertRecordingConsent(storage = globalThis.localStorage) {
  if (!getRecordingConsent(storage)) {
    throw new RecordingConsentRequiredError();
  }
  return true;
}
