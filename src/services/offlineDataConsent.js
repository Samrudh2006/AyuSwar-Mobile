/**
 * offlineDataConsent.js — AyuSwar AI consent for on-device clinical data
 *
 * Two separate, explicit, revocable grants (never implied by login):
 *
 * 1. OFFLINE-DATA consent: required before any clinical record (encounter,
 *    vitals, prescription, audio metadata) is persisted to the on-device
 *    encrypted offline queue/cache. Fail-closed: without it, writes throw
 *    OfflineDataConsentRequiredError and nothing is stored.
 *
 * 2. BACKGROUND-SYNC approval: required before the network-recovery listener
 *    may flush the queue to the backend. Logging in never grants this; only
 *    an explicit user action does. Without it the listener only announces
 *    that pending records exist so the UI can ask.
 *
 * Records carry the consent-text version; a wording change re-asks.
 */

const DATA_KEY = 'ayuswar_offline_data_consent_v1';
const SYNC_KEY = 'ayuswar_background_sync_approval_v1';
export const OFFLINE_DATA_CONSENT_VERSION = '2026-11-20.initial';
export const BACKGROUND_SYNC_APPROVAL_VERSION = '2026-11-20.initial';

const read = (key, version, storage) => {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.granted === true && parsed.version === version ? parsed : null;
  } catch {
    return null;
  }
};

export function getOfflineDataConsent(storage = globalThis.localStorage) {
  return read(DATA_KEY, OFFLINE_DATA_CONSENT_VERSION, storage);
}

export function grantOfflineDataConsent(storage = globalThis.localStorage) {
  const record = {
    granted: true,
    version: OFFLINE_DATA_CONSENT_VERSION,
    grantedAt: new Date().toISOString(),
    scope: 'encrypted on-device queue/cache of synthetic demo clinical records; upload only after explicit approval'
  };
  storage?.setItem(DATA_KEY, JSON.stringify(record));
  return record;
}

export function revokeOfflineDataConsent(storage = globalThis.localStorage) {
  storage?.removeItem(DATA_KEY);
}

export class OfflineDataConsentRequiredError extends Error {
  constructor() {
    super('On-device clinical storage consent has not been granted on this device.');
    this.name = 'OfflineDataConsentRequiredError';
  }
}

export function assertOfflineDataConsent(storage = globalThis.localStorage) {
  if (!getOfflineDataConsent(storage)) throw new OfflineDataConsentRequiredError();
  return true;
}

export function isBackgroundSyncApproved(storage = globalThis.localStorage) {
  return Boolean(read(SYNC_KEY, BACKGROUND_SYNC_APPROVAL_VERSION, storage));
}

export function approveBackgroundSync(storage = globalThis.localStorage) {
  const record = {
    granted: true,
    version: BACKGROUND_SYNC_APPROVAL_VERSION,
    grantedAt: new Date().toISOString(),
    scope: 'upload of queued synthetic demo records when connectivity returns; revocable any time'
  };
  storage?.setItem(SYNC_KEY, JSON.stringify(record));
  return record;
}

export function revokeBackgroundSync(storage = globalThis.localStorage) {
  storage?.removeItem(SYNC_KEY);
}
