/**
 * offlineSimulationQueue.js — AyuSwar AI rural zero-network simulation queue
 *
 * Extracted from DoctorPortal so the consent-gated write path is unit-testable
 * and NEVER throws unhandled: the caller always gets a structured result and
 * can render a reachable consent prompt instead of a stuck silent flow.
 */

import { clinicalOfflineStorage } from './clinicalOfflineStorage.js';
import { OfflineDataConsentRequiredError } from './offlineDataConsent.js';

export function buildSampleRuralEncounters(now = Date.now()) {
  return [
    {
      id: `ENC_RURAL_${now}_1`,
      token: 'OPD-101',
      patientName: 'Narayana Rao',
      age: 68,
      gender: 'Male',
      chiefComplaint: 'గుండెల్లో మంట, దడ (Chest tightness & palpitations)',
      diagnosis: 'Sample presentation: palpitations/chest discomfort (clinician review required)',
      prescription: 'Sample medication text only; no dose or substitution recommendation',
      timestamp: now
    },
    {
      id: `ENC_RURAL_${now}_2`,
      token: 'OPD-102',
      patientName: 'Lakshmi Devi',
      age: 54,
      gender: 'Female',
      chiefComplaint: 'కాళ్ల వాపు, నిద్రలేమి (T2DM Review, peripheral tingling)',
      diagnosis: 'Sample presentation: diabetes review with tingling (clinician review required)',
      prescription: 'Sample medication text only; no dose or substitution recommendation',
      timestamp: now + 1000
    },
    {
      id: `ENC_RURAL_${now}_3`,
      token: 'OPD-103',
      patientName: 'Venkat Ramana',
      age: 47,
      gender: 'Male',
      chiefComplaint: 'దగ్గు, ఆయాసం (Severe nocturnal wheezing)',
      diagnosis: 'Sample presentation: nocturnal wheeze (clinician review required)',
      prescription: 'Sample medication text only; no dose recommendation',
      timestamp: now + 2000
    }
  ];
}

/**
 * Queue the three sample encounters. Returns:
 *   { ok: true, count }                        - all three queued
 *   { ok: false, reason: 'CONSENT_REQUIRED' }  - no offline-data consent; caller MUST prompt
 *   { ok: false, reason: 'WRITE_FAILED' }      - storage failure
 * Never throws.
 */
export async function queueSampleRuralEncounters() {
  try {
    for (const enc of buildSampleRuralEncounters()) {
      await clinicalOfflineStorage.saveEncounter(enc);
    }
    const count = await clinicalOfflineStorage.getPendingCount();
    return { ok: true, count };
  } catch (err) {
    if (err instanceof OfflineDataConsentRequiredError || err?.name === 'OfflineDataConsentRequiredError') {
      return { ok: false, reason: 'CONSENT_REQUIRED' };
    }
    return { ok: false, reason: 'WRITE_FAILED' };
  }
}
