/**
 * clinicalEvidenceVerifier.js
 * Clinical Evidence Engine — Layer C: Deterministic Evidence Verification.
 *
 * Every check is deterministic code over the unchanged source strings.
 * A verifier never asks a model whether evidence is supported.
 * Fail closed: anything missing, corrupted or unverifiable is not SUPPORTED.
 *
 * Status semantics:
 * - SUPPORTED: quote is a verbatim span of the referenced utterance at the
 *   stated offsets, speaker rules hold, no contradiction detected.
 *   (Source-supported is NOT clinically confirmed.)
 * - AMBIGUOUS: grounded in source, but the same surface evidence conflicts
 *   with another candidate or the quote is not uniquely interpretable.
 * - UNSUPPORTED: quote not found / claim not grounded in the source.
 * - CONFLICTING: two candidates assert incompatible values for the same
 *   normalized concept.
 * - INVALID_SOURCE: referenced utterance missing, offsets corrupted, or
 *   speaker attribution impossible.
 */

import { SPEAKER, ENTITY_TYPE, VERIFICATION_STATUS } from './clinicalEvidenceTypes.js';

const NEGATION_MARKERS = [
  'లేదు', 'కాదు', 'వద్దు', // Telugu: no/not/don't want
  'नहीं', 'ना',           // Hindi: no/not
  ' no ', ' not ', 'never', 'without'
];

/**
 * Verify one candidate against the session registry.
 * Returns a NEW record (input is frozen) with verificationStatus + notes.
 */
export function verifyCandidate(session, candidate) {
  const notes = [];
  const fail = (status, why) => Object.freeze({
    ...candidate, verificationStatus: status, verificationNotes: [why, ...notes]
  });

  const utterance = session.utterances.find(u => u.utteranceId === candidate.utteranceId);
  if (!utterance) return fail(VERIFICATION_STATUS.INVALID_SOURCE, 'referenced utterance not in registry');

  // Offset + substring equality against the unchanged original.
  const span = utterance.text.substring(candidate.startOffset, candidate.endOffset);
  if (span !== candidate.sourceQuote) {
    return fail(VERIFICATION_STATUS.INVALID_SOURCE, 'offsets do not reproduce the quote from the original string');
  }
  if (utterance.text.indexOf(candidate.sourceQuote) === -1) {
    return fail(VERIFICATION_STATUS.UNSUPPORTED, 'quote not present in source utterance');
  }

  // Speaker attribution rules.
  if (candidate.entityType === ENTITY_TYPE.MEDICATION_INSTRUCTION && utterance.speaker !== SPEAKER.DOCTOR) {
    return fail(VERIFICATION_STATUS.INVALID_SOURCE, 'medication instruction attributed to a non-doctor utterance');
  }

  // Negation window: negation marker within 40 chars on either side of the
  // span (Telugu/Hindi negation often FOLLOWS the noun: "అలర్జీ లేదు").
  const lo = Math.max(0, candidate.startOffset - 40);
  const hi = Math.min(utterance.text.length, candidate.endOffset + 40);
  const window = (utterance.text.slice(lo, candidate.startOffset) + ' ' + utterance.text.slice(candidate.endOffset, hi)).toLowerCase();
  const negated = NEGATION_MARKERS.some(m => window.includes(m.toLowerCase()));
  if (negated) notes.push('negation marker near span; treat as absent/ruled-out context');

  // Contradiction: same normalized concept, incompatible other candidate.
  const siblings = (session.evidence || []).filter(e =>
    e.evidenceId !== candidate.evidenceId &&
    e.normalizedConcept && candidate.normalizedConcept &&
    e.normalizedConcept === candidate.normalizedConcept &&
    e.sourceQuote !== candidate.sourceQuote
  );
  if (siblings.length > 0) {
    return fail(VERIFICATION_STATUS.CONFLICTING, `conflicts with ${siblings.map(s => s.evidenceId).join(', ')}`);
  }

  // Ambiguity: identical quote appears in more than one utterance with
  // different speakers (attribution could flip meaning).
  const elsewhere = session.utterances.filter(u =>
    u.utteranceId !== utterance.utteranceId &&
    u.speaker !== utterance.speaker &&
    u.text.includes(candidate.sourceQuote)
  );
  if (elsewhere.length > 0) {
    return fail(VERIFICATION_STATUS.AMBIGUOUS, 'same quote appears under a different speaker elsewhere');
  }

  return Object.freeze({
    ...candidate,
    verificationStatus: VERIFICATION_STATUS.SUPPORTED,
    verificationNotes: notes,
    isNegatedContext: negated || undefined
  });
}

/**
 * Verify a whole candidate set. Mutates nothing; returns { verified, counts }.
 * Candidates are verified SEQUENTIALLY and each already-verified candidate in
 * the same batch joins the comparison set for the next one, so two conflicting
 * claims inside one batch can never both come out SUPPORTED. The first
 * candidate in batch order wins deterministically; later conflicting ones are
 * CONFLICTING. (The pre-fix batch implementation compared only against
 * session.evidence, which the caller populates after verification, letting
 * same-batch conflicts through.)
 */
export function verifyEvidence(session, candidates) {
  const verified = [];
  for (const c of candidates) {
    verified.push(verifyCandidate({ ...session, evidence: [...(session.evidence || []), ...verified] }, c));
  }
  // Set-level conflict resolution: batch order must never settle truth. If
  // any candidate came out CONFLICTING, every other same-concept candidate
  // with a different quote is part of the same conflict set and is downgraded
  // too. A concept with a conflict is unresolvable by this engine; nothing in
  // the set may reach export as SUPPORTED.
  const conflictConcepts = new Set(
    verified.filter(v => v.verificationStatus === VERIFICATION_STATUS.CONFLICTING).map(v => v.normalizedConcept)
  );
  const resolved = verified.map(v => {
    if (v.verificationStatus !== VERIFICATION_STATUS.SUPPORTED) return v;
    if (!v.normalizedConcept || !conflictConcepts.has(v.normalizedConcept)) return v;
    const others = verified.filter(o =>
      o.evidenceId !== v.evidenceId && o.normalizedConcept === v.normalizedConcept && o.sourceQuote !== v.sourceQuote
    );
    if (others.length === 0) return v;
    return Object.freeze({
      ...v,
      verificationStatus: VERIFICATION_STATUS.CONFLICTING,
      verificationNotes: [...(v.verificationNotes || []), `part of unresolved conflict set on "${v.normalizedConcept}" with ${others.map(o => o.evidenceId).join(', ')}`]
    });
  });
  const counts = {};
  for (const v of resolved) counts[v.verificationStatus] = (counts[v.verificationStatus] || 0) + 1;
  return { verified: resolved, counts };
}
