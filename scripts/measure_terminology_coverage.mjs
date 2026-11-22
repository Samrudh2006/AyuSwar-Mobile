#!/usr/bin/env node
/**
 * measure_terminology_coverage.mjs — terminology MATCH COVERAGE for
 * medication entities extracted by the real deterministic fallback
 * extractor over the SYNTHETIC clinical fixtures, resolved against the
 * public NLM RxNorm REST API (free, no key).
 *
 * This is NOT entity precision/recall: there is no gold-standard
 * annotation and no error-analysis denominator. It answers only: of the
 * medication terms the extractor emitted, how many resolve in RxNorm.
 * Synthetic fixtures and public drug names only - never real patient
 * records. Fails loudly when the API is unreachable.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import {
  createEvidenceSession, registerUtterance, extractWithFallback
} from '../src/services/clinicalEvidenceEngine.js';
import {
  SYNTHETIC_UTTERANCE_INPUTS, CODE_MIXED_UTTERANCE
} from '../src/data/clinicalEvidenceFixtures.js';

const RXNAV = 'https://rxnav.nlm.nih.gov/REST';
const root = process.cwd();
const outDir = path.join(root, 'AYUSWAR-TECHNICAL-EVIDENCE', '02-AI-EVALUATION');
mkdirSync(outDir, { recursive: true });

const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0;

const session = createEvidenceSession('terminology-coverage-measurement');
for (const input of [...SYNTHETIC_UTTERANCE_INPUTS, CODE_MIXED_UTTERANCE]) {
  registerUtterance(session, input);
}
const out = extractWithFallback(session);

const medicationCandidates = out.candidates.filter((c) => c.entityType.startsWith('MEDICATION'));
const otherTypes = {};
for (const c of out.candidates) {
  if (!c.entityType.startsWith('MEDICATION')) {
    otherTypes[c.entityType] = (otherTypes[c.entityType] || 0) + 1;
  }
}

const terms = [...new Set(medicationCandidates.map((c) => c.normalizedConcept))];

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RxNorm API HTTP ${res.status} for ${url}`);
  return res.json();
}

const perTerm = [];
for (const term of terms) {
  const exactUrl = `${RXNAV}/rxcui.json?name=${encodeURIComponent(term)}&search=0`;
  const exact = await getJson(exactUrl);
  const exactIds = exact.idGroup && exact.idGroup.rxnormId ? exact.idGroup.rxnormId : [];
  let approx = [];
  let approxUrl = null;
  if (exactIds.length === 0) {
    approxUrl = `${RXNAV}/approximateTerm.json?term=${encodeURIComponent(term)}&maxEntries=3`;
    const approxRes = await getJson(approxUrl);
    approx = ((approxRes.approximateGroup && approxRes.approximateGroup.candidate) || [])
      .map((c) => ({ rxcui: c.rxcui, name: c.name, score: c.score }));
  }
  perTerm.push({
    term,
    sourceQuotes: [...new Set(medicationCandidates.filter((c) => c.normalizedConcept === term).map((c) => c.sourceQuote))],
    exactMatchRxCUI: exactIds,
    approximateCandidates: approx,
    queries: approxUrl ? [exactUrl, approxUrl] : [exactUrl]
  });
}

const resolved = perTerm.filter((t) => t.exactMatchRxCUI.length > 0).length;
const report = {
  scope: 'Terminology MATCH COVERAGE for extractor-emitted medication terms against RxNorm. NOT entity precision/recall: no gold-standard annotation, no error-analysis denominator. Synthetic fixtures and public drug names only.',
  generatedAt: new Date().toISOString(),
  revision,
  trackedWorkingTreeDirty: dirty,
  extractor: 'DETERMINISTIC_FALLBACK (explicitly labelled; no model)',
  fixtures: ['SYNTHETIC_UTTERANCE_INPUTS', 'CODE_MIXED_UTTERANCE'],
  terminologyService: { name: 'NLM RxNorm REST API', base: RXNAV, access: 'free, no API key', coverage: 'US drug terminology, English names' },
  medicationTermsEmitted: terms.length,
  exactResolved: resolved,
  matchCoverage: terms.length ? resolved / terms.length : null,
  perTerm,
  outOfScopeExtractedTypes: {
    note: 'Extracted non-medication entities are not looked up: RxNorm is a drug terminology and cannot resolve symptoms/history/durations. A clinical terminology (SNOMED CT/LOINC) would be needed for those; SNOMED CT requires a license/account and was not used.',
    counts: otherTypes
  },
  caveats: [
    'RxNorm is US-centric English drug terminology; brand names and Indian-market formulations are under-represented.',
    'Telugu-script drug forms reach RxNorm only through the extractor lexicon normalization map; unmapped transliterations would fail closed (no match, no guess).',
    'A resolved term means the STRING exists in RxNorm, not that the extracted mention is clinically correct in context.'
  ]
};

writeFileSync(path.join(outDir, 'TERMINOLOGY_COVERAGE.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`medication terms: ${terms.length}, exact-resolved: ${resolved}, coverage: ${report.matchCoverage}`);
for (const t of perTerm) {
  console.log(`  ${t.term}: exact=${t.exactMatchRxCUI.join(',') || 'none'} approx=${t.approximateCandidates.map((a) => a.name).slice(0, 2).join('; ') || '-'}`);
}
