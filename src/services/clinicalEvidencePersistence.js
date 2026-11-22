/**
 * clinicalEvidencePersistence.js
 * Clinical Evidence Engine — Layer D support: opt-in persistence and
 * clinician review actions with correction history.
 *
 * Rules enforced:
 * - Persistence is OPT-IN and synthetic/demo sessions only by default.
 *   Real (non-synthetic) sessions are never written to localStorage unless
 *   the caller explicitly overrides with a documented consent basis.
 * - The original extraction is always preserved; edits append history.
 * - Every review action records reviewer identity, a REAL review timestamp
 *   (Date.now at action time) and a reason.
 * - A demo reviewer is labelled DEMO and can never produce a real clinical
 *   sign-off; isRealSignOff is only set by an authenticated reviewer path
 *   that does not exist yet, so it is always false today.
 * - Prescriptions/diagnoses are never auto-approved: MEDICATION_INSTRUCTION
 *   and diagnosis-like content require explicit human action and even then
 *   remain "source-supported", not clinically confirmed.
 */

import { CLINICIAN_STATUS, ENTITY_TYPE } from './clinicalEvidenceTypes.js';

const STORAGE_KEY = 'ayuswar_clinical_evidence_v1';

const defaultStorage = () => {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch { /* node */ }
  return null;
};

/**
 * Save a session's verified evidence. Opt-in: requires opts.allowPersist.
 * Real sessions additionally require opts.consentBasis (a non-empty string
 * describing the documented basis); without it the write is refused.
 */
export function persistEvidenceSession(session, verified, opts = {}) {
  const storage = opts.storage || defaultStorage();
  if (!opts.allowPersist) return { saved: false, reason: 'persistence is opt-in' };
  if (!storage) return { saved: false, reason: 'no storage available' };
  const allSynthetic = session.utterances.every(u => u.isSynthetic);
  if (!allSynthetic && !opts.consentBasis) {
    return { saved: false, reason: 'real session data requires a documented consent basis; none supplied' };
  }
  try {
    const existing = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
    existing[session.sessionId] = {
      sessionId: session.sessionId,
      savedAtMs: Date.now(),
      synthetic: allSynthetic,
      utterances: session.utterances,
      evidence: verified
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return { saved: true };
  } catch (err) {
    return { saved: false, reason: `storage write failed: ${err.message}` };
  }
}

export function loadEvidenceSession(sessionId, opts = {}) {
  const storage = opts.storage || defaultStorage();
  if (!storage) return null;
  try {
    const existing = JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
    return existing[sessionId] || null;
  } catch {
    return null;
  }
}

/**
 * Apply a clinician review action to one evidence record.
 * Returns a NEW record; the original extraction stays intact under
 * originalExtraction on first edit and in history snapshots.
 *
 * reviewer: { identity: string, isDemo?: boolean } — identity is required;
 * a demo reviewer is recorded as DEMO:<identity> and can never set
 * isRealSignOff.
 */
export function applyReviewAction(record, action, reviewer, reason) {
  if (!reviewer || typeof reviewer.identity !== 'string' || !reviewer.identity.trim()) {
    throw new Error('review: reviewer identity required');
  }
  if (typeof reason !== 'string' || !reason.trim()) {
    throw new Error('review: reason required');
  }
  const reviewerId = reviewer.isDemo ? `DEMO:${reviewer.identity.trim()}` : reviewer.identity.trim();
  const at = Date.now();

  let nextStatus;
  switch (action.type) {
    case 'APPROVE': nextStatus = CLINICIAN_STATUS.APPROVED; break;
    case 'REJECT': nextStatus = CLINICIAN_STATUS.REJECTED; break;
    case 'REQUEST_CLARIFICATION': nextStatus = CLINICIAN_STATUS.CLARIFICATION_REQUESTED; break;
    case 'EDIT': {
      if (typeof action.editedText !== 'string' || !action.editedText.trim()) {
        throw new Error('review: editedText required for EDIT');
      }
      nextStatus = CLINICIAN_STATUS.EDITED;
      break;
    }
    default: throw new Error('review: unknown action');
  }

  const historyEntry = Object.freeze({
    action: action.type,
    reviewerIdentity: reviewerId,
    reviewTimestampMs: at,
    reason: reason.trim(),
    previousStatus: record.clinicianStatus,
    previousText: record.displayText || record.sourceQuote,
    editedText: action.type === 'EDIT' ? action.editedText.trim() : undefined
  });

  return Object.freeze({
    ...record,
    clinicianStatus: nextStatus,
    displayText: action.type === 'EDIT' ? action.editedText.trim() : (record.displayText || record.sourceQuote),
    originalExtraction: record.originalExtraction || {
      sourceQuote: record.sourceQuote,
      normalizedConcept: record.normalizedConcept,
      startOffset: record.startOffset,
      endOffset: record.endOffset
    },
    reviewHistory: [...(record.reviewHistory || []), historyEntry],
    isRealSignOff: false // no authenticated clinician path exists yet
  });
}

/**
 * Export gate: only approved/edited AND source-supported evidence may enter
 * verified downstream output. Medication instructions additionally require
 * a human APPROVE/EDIT (never auto) and remain marked source-supported only.
 */
export function selectApprovedForExport(verifiedRecords) {
  return verifiedRecords.filter(r =>
    r.verificationStatus === 'SUPPORTED' &&
    (r.clinicianStatus === CLINICIAN_STATUS.APPROVED || r.clinicianStatus === CLINICIAN_STATUS.EDITED) &&
    // A negated finding (e.g. "no penicillin allergy") is never exported as a
    // positive claim, even if a reviewer approved the extraction. Negated
    // context belongs in the review record, not in downstream positive fields.
    !r.isNegatedContext
  ).map(r => Object.freeze({
    ...r,
    exportNote: r.entityType === ENTITY_TYPE.MEDICATION_INSTRUCTION
      ? 'source-supported instruction reviewed by a human; not an autonomous prescription'
      : 'source-supported; not clinically confirmed'
  }));
}
