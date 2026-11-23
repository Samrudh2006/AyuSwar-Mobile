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

// Indic negation markers: substring match (existing contract).
const NEGATION_MARKERS_INDIC = [
  'లేదు', 'కాదు', 'వద్దు', // Telugu: no/not/don't want
  'లేదండి', 'కాదండి',        // Telugu polite forms (not substrings of the bare markers above)
  'नहीं', 'ना'             // Hindi: no/not
];
// English negation: word-boundary match so "another", "notable" or
// "whenever" never false-positive, with straight AND curly apostrophe
// contractions (don't / don’t). This is marker coverage, not full
// negation semantics: double negation, sarcasm, hedging and cross-sentence
// scope are OUT OF SCOPE and remain documented limits.
const NEGATION_ENGLISH = /\b(no|not|never|without|cannot|denies|denied|deny|refuses?|refused|avoids?)\b|\b(don|doesn|didn|won|can|couldn|shouldn|isn|aren|wasn|weren|hasn|haven|hadn)['’]t\b/i;
// Temporal cues: the engine NEVER assigns current use. A mention near a
// cessation/past cue is labelled HISTORICAL; everything else stays
// explicitly UNKNOWN. Cue matching is heuristic, not tense parsing.
// English-only: Indic cessation cues are not implemented, so Telugu/Hindi
// mentions keep UNKNOWN (with sourceContext preserved). "No longer" is
// deliberately NOT here: it matches the negation rule first, so such
// mentions are held from export entirely rather than exported HISTORICAL.
const TEMPORAL_HISTORICAL_ENGLISH = /\b(stopped|stops|quit|previously|yesterday|took|formerly)\b|\bused to\b|\blast (week|month|year)\b/i;

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

  // Shared boundary positions for the question and negation scope rules.
  // Sentence breaks end a statement; clause breaks (, ; :) and the
  // contrastive conjunction "but" bound how far a FOLLOWING question mark
  // or negation marker can reach back to this span.
  const SENTENCE_BREAKS = ['.', '!', '?', '\u0964'];
  const text = utterance.text;
  const beforeSpan = text.slice(0, candidate.startOffset);
  const afterSpan = text.slice(candidate.endOffset);
  const sentenceStart = Math.max(...SENTENCE_BREAKS.map(c => beforeSpan.lastIndexOf(c))) + 1;
  const sentenceEndRel = SENTENCE_BREAKS.map(c => afterSpan.indexOf(c)).filter(i => i !== -1)
    .reduce((min, i) => Math.min(min, i), Infinity);
  const sentenceEndChar = sentenceEndRel === Infinity ? '' : afterSpan.charAt(sentenceEndRel);
  // English interrogative openings: wh-words, auxiliary inversions and
  // "any ...". English-only BY DESIGN: Indic questions keep the stricter
  // whole-sentence treatment below and are never released by clause rules.
  const INTERROGATIVE_OPEN = /^\s*(?:what|when|where|which|who|whom|whose|why|how|any|do|does|did|is|are|was|were|am|can|could|will|would|shall|should|have|has|had|may|might|must)\b/i;

  // A span inside a question is not a finding ("Do you have a fever?").
  // The question check is clause-aware: an affirmed clause that only SHARES
  // a sentence with a later, separate question stays a finding
  // ("I have a fever, do you know why?" - the fever is affirmed; only
  // "do you know why?" is the question). A span whose sentence ends in "?"
  // is still held when the sentence opens interrogatively (every span is
  // part of the question), when the span's own clause reaches the question
  // mark, or when the trailing clause holding the "?" is not itself
  // interrogative (tag questions such as "You have a fever, right?" stay
  // held). Anything unresolvable fails closed.
  {
    if (candidate.sourceQuote.includes('?')) {
      return fail(VERIFICATION_STATUS.AMBIGUOUS, 'span is inside a question, not a finding');
    }
    if (sentenceEndChar === '?') {
      const sentence = text.slice(sentenceStart, candidate.endOffset + sentenceEndRel);
      const clauseBreakRel = afterSpan.slice(0, sentenceEndRel).search(/[,;:]/);
      if (
        INTERROGATIVE_OPEN.test(sentence) ||
        clauseBreakRel === -1 ||
        !INTERROGATIVE_OPEN.test(afterSpan.slice(clauseBreakRel + 1, sentenceEndRel))
      ) {
        return fail(VERIFICATION_STATUS.AMBIGUOUS, 'span is inside a question, not a finding');
      }
      notes.push('question mark belongs to a later separate interrogative clause; affirmed clause treated as a finding');
    }
  }

  // Negation scope: a marker negates the span only when it can govern it.
  // - A marker BEFORE the span applies across the same sentence (up to 40
  //   chars back): commas do not break forward scope, so "No fever, cough
  //   or cold" still holds the whole list, but a sentence break does, so
  //   "I have a cough. No fever." no longer holds the affirmed cough.
  // - A marker AFTER the span applies only within the same clause, bounded
  //   by , ; : a sentence break or "but": "headache but without fever"
  //   holds fever while the affirmed headache stays exportable, and Telugu
  //   post-noun negation ("అలర్జీ లేదు") sits in the same clause.
  // Documented remaining limits (fail closed): double negation, sarcasm,
  // hedging; a contrastive "but" does NOT reset forward scope, so
  //   "no cough but fever" still holds fever; Indic clause detection uses
  // the same punctuation set without language-specific conjunctions.
  const preWindow = beforeSpan.slice(Math.max(sentenceStart, beforeSpan.length - 40));
  let postLimit = afterSpan.length;
  const clauseBreakPost = afterSpan.search(/[,;:.!?\u0964]/);
  if (clauseBreakPost !== -1) postLimit = Math.min(postLimit, clauseBreakPost);
  const butMatch = /\bbut\b/i.exec(afterSpan);
  if (butMatch && butMatch.index < postLimit) postLimit = butMatch.index;
  const postWindow = afterSpan.slice(0, Math.min(postLimit, 40));
  const window = (preWindow + ' ' + postWindow).toLowerCase();
  // Legacy full-context window (40 chars on both sides, crossing sentence
  // and clause breaks). Kept for two purposes: the temporal cue scan below
  // (a HISTORICAL label is metadata, it never gates export, so its heuristic
  // window is deliberately unchanged) and the transparency note recording a
  // marker that was seen but lies outside the span's grammatical scope.
  const legacyWindow = (beforeSpan.slice(Math.max(0, beforeSpan.length - 40)) + ' ' + afterSpan.slice(0, 40)).toLowerCase();
  // Short Hindi marker 'ना' is also a substring of unrelated words (e.g. खाना),
  // so it must match as a whole token; the other markers keep substring matching.
  // Substring matching does NOT cover polite suffixed forms such as లేదండి
  // (the bare marker ends in a different vowel sign), so those are listed
  // explicitly in NEGATION_MARKERS_INDIC.
  const WHOLE_TOKEN = new Set(['ना']);
  const containsNegationMarker = text => NEGATION_MARKERS_INDIC.some(m => WHOLE_TOKEN.has(m)
    ? new RegExp('(?<![\\p{L}\\p{N}\\p{M}])' + m + '(?![\\p{L}\\p{N}\\p{M}])', 'u').test(text)
    : text.includes(m.toLowerCase())) || NEGATION_ENGLISH.test(text);
  const negatedContext = containsNegationMarker(window);
  const negatedQuote = containsNegationMarker(candidate.sourceQuote.toLowerCase());
  const negated = negatedContext || negatedQuote;
  if (negatedContext) notes.push('negation marker near span; treat as absent/ruled-out context');
  if (negatedQuote) notes.push('negation marker in source quote; treat as absent/ruled-out context');
  if (!negatedContext && containsNegationMarker(legacyWindow)) {
    notes.push('negation marker present outside span scope (different sentence/clause); not treated as negated context');
  }
  const temporalStatus = TEMPORAL_HISTORICAL_ENGLISH.test(legacyWindow) ? 'HISTORICAL' : 'UNKNOWN';

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

  // Materialization uses the first exact occurrence. A repeated quote cannot
  // establish which occurrence was intended, even with valid source offsets.
  if (utterance.text.indexOf(candidate.sourceQuote) !== utterance.text.lastIndexOf(candidate.sourceQuote)) {
    return fail(VERIFICATION_STATUS.AMBIGUOUS, 'source quote has multiple occurrences; intended occurrence is ambiguous');
  }

  return Object.freeze({
    ...candidate,
    verificationStatus: VERIFICATION_STATUS.SUPPORTED,
    verificationNotes: notes,
    isNegatedContext: negated || undefined,
    // Engine never assigns CURRENT: UNKNOWN unless a cessation/past cue
    // marks the mention HISTORICAL. Reviewer supplies clinical temporality.
    temporalStatus
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
