#!/usr/bin/env node
// Serialize a genuine engine run (synthetic fixtures only) to CLINICAL_EVIDENCE_TRACE.json.
// Extraction here is the deterministic fallback lexicon (no model), labelled as such.
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEvidenceSession, registerUtterance, extractWithFallback } from '../src/services/clinicalEvidenceEngine.js';
import { verifyEvidence } from '../src/services/clinicalEvidenceVerifier.js';
import { applyReviewAction, selectApprovedForExport } from '../src/services/clinicalEvidencePersistence.js';
import { SYNTHETIC_SESSION_ID, SYNTHETIC_UTTERANCE_INPUTS } from '../src/data/clinicalEvidenceFixtures.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(root, process.argv[2] || 'AYUSWAR-TECHNICAL-EVIDENCE/03-CLINICAL-SAFETY');
const session = createEvidenceSession(SYNTHETIC_SESSION_ID);
SYNTHETIC_UTTERANCE_INPUTS.forEach(i => registerUtterance(session, i));
const extracted = extractWithFallback(session);
const { verified, counts } = verifyEvidence(session, extracted.candidates);
if (verified.length === 0) throw new Error('fallback lexicon produced no candidates on its own fixtures - investigate before exporting');
const reviewed = verified.map(v => v.verificationStatus === 'SUPPORTED'
  ? applyReviewAction(v, { type: 'APPROVE' }, { identity: 'evidence-export-script', isDemo: true }, 'export demo: mark supported synthetic candidates as reviewed')
  : v);
const approvedForExport = selectApprovedForExport(reviewed);
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const trace = {
  scope: 'One genuine engine run over scripted synthetic fixtures using the deterministic fallback extractor (no model, no audio). Reviewer is a DEMO reviewer; nothing here is a real clinical sign-off, real patient data or audio-timestamped evidence.',
  generatedAt: new Date().toISOString(), revision,
  trackedWorkingTreeDirty: !!execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root, encoding: 'utf8' }).trim(),
  extractionMethod: 'DETERMINISTIC_FALLBACK',
  audioTimestamps: 'not available - the ASR pipeline does not emit per-utterance timestamps; fields absent, never invented',
  session: { sessionId: session.sessionId, utterances: session.utterances },
  rejected: extracted.rejected,
  verificationCounts: counts,
  evidence: reviewed,
  approvedForExport
};
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, 'CLINICAL_EVIDENCE_TRACE.json'), JSON.stringify(trace, null, 2) + '\n');
console.log(`trace exported: ${reviewed.length} evidence records (${JSON.stringify(counts)}), ${approvedForExport.length} approved-for-export, fallback extractor on synthetic fixtures`);
