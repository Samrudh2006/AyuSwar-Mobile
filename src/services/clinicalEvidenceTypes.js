/**
 * clinicalEvidenceTypes.js
 * Clinical Evidence Engine — shared schemas, enums and factories.
 *
 * Provenance honesty rules enforced here:
 * - Timestamps, provider identities and model versions are only set when the
 *   caller actually has them. Undefined stays undefined; nothing is
 *   back-filled or invented.
 * - utteranceId is deterministic per session: utt_<sessionId>_<seq>.
 * - isSynthetic defaults to true unless the caller explicitly marks real
 *   capture, so demo data can never silently pass as real.
 */

export const SPEAKER = Object.freeze({
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
  OTHER: 'OTHER'
});

export const SOURCE_TYPE = Object.freeze({
  LIVE_RECORDING: 'LIVE_RECORDING',
  PROVIDER_TRANSCRIPTION: 'PROVIDER_TRANSCRIPTION',
  SCRIPTED_DEMO: 'SCRIPTED_DEMO',
  MANUAL_ENTRY: 'MANUAL_ENTRY'
});

export const ENTITY_TYPE = Object.freeze({
  SYMPTOM: 'SYMPTOM',
  DURATION: 'DURATION',
  VITAL: 'VITAL',
  ALLERGY: 'ALLERGY',
  MEDICATION_MENTIONED: 'MEDICATION_MENTIONED',
  MEDICATION_INSTRUCTION: 'MEDICATION_INSTRUCTION',
  MEDICAL_HISTORY: 'MEDICAL_HISTORY',
  NEGATION: 'NEGATION',
  OBSERVATION: 'OBSERVATION',
  FOLLOW_UP: 'FOLLOW_UP'
});

export const VERIFICATION_STATUS = Object.freeze({
  SUPPORTED: 'SUPPORTED',
  AMBIGUOUS: 'AMBIGUOUS',
  UNSUPPORTED: 'UNSUPPORTED',
  CONFLICTING: 'CONFLICTING',
  INVALID_SOURCE: 'INVALID_SOURCE'
});

export const CLINICIAN_STATUS = Object.freeze({
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  EDITED: 'EDITED',
  REJECTED: 'REJECTED',
  CLARIFICATION_REQUESTED: 'CLARIFICATION_REQUESTED'
});

export const EXTRACTION_METHOD = Object.freeze({
  MODEL_LIVE: 'MODEL_LIVE',
  DETERMINISTIC_FALLBACK: 'DETERMINISTIC_FALLBACK',
  MANUAL: 'MANUAL'
});

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * Create a source utterance record. Throws on missing required fields.
 * Optional provenance (timestamps, provider, confidence) is carried only
 * when genuinely supplied; absent means "not recorded", never "guessed".
 */
export function createSourceUtterance({
  sessionId,
  sequence,
  speaker,
  language,
  text,
  sourceType,
  provider,
  timestampStartMs,
  timestampEndMs,
  isSynthetic = true
}) {
  if (!isNonEmptyString(sessionId)) throw new Error('utterance: sessionId required');
  if (!Number.isInteger(sequence) || sequence < 0) throw new Error('utterance: sequence must be a non-negative integer');
  if (!Object.values(SPEAKER).includes(speaker)) throw new Error('utterance: speaker must be DOCTOR, PATIENT or OTHER');
  if (!isNonEmptyString(language)) throw new Error('utterance: language required');
  if (typeof text !== 'string' || text.length === 0) throw new Error('utterance: text required');
  if (!Object.values(SOURCE_TYPE).includes(sourceType)) throw new Error('utterance: unknown sourceType');
  if (timestampStartMs !== undefined && !Number.isFinite(timestampStartMs)) throw new Error('utterance: timestampStartMs must be a real ms value when present');
  if (timestampEndMs !== undefined && !Number.isFinite(timestampEndMs)) throw new Error('utterance: timestampEndMs must be a real ms value when present');
  if (timestampStartMs !== undefined && timestampEndMs !== undefined && timestampEndMs < timestampStartMs) {
    throw new Error('utterance: timestampEndMs before timestampStartMs');
  }

  return Object.freeze({
    utteranceId: `utt_${sessionId}_${sequence}`,
    sessionId,
    sequence,
    speaker,
    language,
    text,
    sourceType,
    provider: isNonEmptyString(provider) ? provider : undefined,
    timestampStartMs,
    timestampEndMs,
    isSynthetic: Boolean(isSynthetic)
  });
}

/**
 * Create an evidence candidate. Offsets are always computed deterministically
 * against the unchanged source string by the engine, never taken from a model.
 */
export function createEvidenceCandidate({
  evidenceId,
  utteranceId,
  entityType,
  originalText,
  normalizedConcept,
  sourceQuote,
  startOffset,
  endOffset,
  language,
  extractionMethod,
  modelVersion,
  isSynthetic = true
}) {
  if (!isNonEmptyString(evidenceId)) throw new Error('evidence: evidenceId required');
  if (!isNonEmptyString(utteranceId)) throw new Error('evidence: utteranceId required');
  if (!Object.values(ENTITY_TYPE).includes(entityType)) throw new Error('evidence: unknown entityType');
  if (!isNonEmptyString(originalText)) throw new Error('evidence: originalText required');
  if (!isNonEmptyString(sourceQuote)) throw new Error('evidence: sourceQuote required');
  if (!Number.isInteger(startOffset) || startOffset < 0) throw new Error('evidence: startOffset must be a non-negative integer');
  if (!Number.isInteger(endOffset) || endOffset <= startOffset) throw new Error('evidence: endOffset must exceed startOffset');
  if (!Object.values(EXTRACTION_METHOD).includes(extractionMethod)) throw new Error('evidence: unknown extractionMethod');

  return Object.freeze({
    evidenceId,
    utteranceId,
    entityType,
    originalText,
    normalizedConcept: isNonEmptyString(normalizedConcept) ? normalizedConcept : undefined,
    sourceQuote,
    startOffset,
    endOffset,
    language: isNonEmptyString(language) ? language : undefined,
    verificationStatus: VERIFICATION_STATUS.UNSUPPORTED, // engine must prove SUPPORTED
    clinicianStatus: CLINICIAN_STATUS.PENDING_REVIEW,
    extractionMethod,
    modelVersion: isNonEmptyString(modelVersion) ? modelVersion : undefined,
    isSynthetic: Boolean(isSynthetic)
  });
}
