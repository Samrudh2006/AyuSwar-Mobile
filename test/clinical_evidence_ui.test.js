/**
 * clinical_evidence_ui.test.js
 * Evidence Engine UI components — deterministic server-render checks.
 * JSX components are bundled on the fly with the repo's own rolldown
 * (no new dependency), written to git-ignored temp files so bare imports
 * (react, lucide-react) resolve from node_modules, then rendered with
 * react-dom/server. Verifies statuses, source quotes, synthetic labels,
 * honest absence of timestamps and review affordances.
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { rolldown } from 'rolldown';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SPEAKER, SOURCE_TYPE, VERIFICATION_STATUS, createSourceUtterance, createEvidenceCandidate, ENTITY_TYPE, EXTRACTION_METHOD } from '../src/services/clinicalEvidenceTypes.js';

const results = [];
const record = async (name, fn) => {
  try { await fn(); results.push({ name, ok: true }); }
  catch (err) { results.push({ name, ok: false, err }); }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const TMP = resolve('test/.tmp-evidence-ui');
async function loadComponent(entry, out) {
  mkdirSync(TMP, { recursive: true });
  // Externalize react so the component shares the TEST's react copy
  // (duplicate react copies break lucide's context hooks). lucide-react has
  // a native ESM build, so it externalizes cleanly as an import.
  const b = await rolldown({
    input: entry,
    external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/server', 'lucide-react'],
    platform: 'node'
  });
  const { output } = await b.generate({ format: 'esm' });
  const file = resolve(TMP, out);
  writeFileSync(file, output[0].code);
  return (await import(file)).default;
}

const utt = createSourceUtterance({
  sessionId: 'ui1', sequence: 0, speaker: SPEAKER.PATIENT, language: 'Telugu',
  text: 'నాకు మూడు రోజుల నుండి జ్వరం ఉంది.', sourceType: SOURCE_TYPE.SCRIPTED_DEMO
});
const ev = createEvidenceCandidate({
  evidenceId: 'ev_ui1_1', utteranceId: utt.utteranceId, entityType: ENTITY_TYPE.SYMPTOM,
  originalText: utt.text, sourceQuote: 'జ్వరం', startOffset: utt.text.indexOf('జ్వరం'),
  endOffset: utt.text.indexOf('జ్వరం') + 'జ్వరం'.length, language: 'Telugu',
  extractionMethod: EXTRACTION_METHOD.DETERMINISTIC_FALLBACK
});

let Card, Timeline;

await record('jsx components bundle with repo rolldown', async () => {
  Card = await loadComponent('src/components/ClinicalEvidenceCard.jsx', 'Card.mjs');
  Timeline = await loadComponent('src/components/ClinicalEvidenceTimeline.jsx', 'Timeline.mjs');
  assert(typeof Card === 'function' && typeof Timeline === 'function', 'components loadable');
});

await record('card renders status, quote, fallback + synthetic labels', async () => {
  const html = renderToString(React.createElement(Card, {
    record: { ...ev, verificationStatus: VERIFICATION_STATUS.SUPPORTED, verificationNotes: [] }
  }));
  assert(html.includes('Supported by source'), 'status label');
  assert(html.includes('జ్వరం'), 'telugu quote rendered');
  assert(html.includes('deterministic fallback (not live model)'), 'fallback honesty label');
  assert(html.includes('synthetic demo'), 'synthetic label');
  assert(html.includes('not clinically confirmed'), 'no-confirmation caveat');
});

await record('card hides actions after review', async () => {
  const html = renderToString(React.createElement(Card, {
    record: { ...ev, verificationStatus: VERIFICATION_STATUS.SUPPORTED, clinicianStatus: 'APPROVED', verificationNotes: [] },
    onReview: () => {}
  }));
  assert(!html.includes('Approve</button>'), 'no approve action after approval');
  assert(html.includes('Approved (demo review)'), 'demo review label');
});

await record('unsupported card shows failure status and no actions', async () => {
  const html = renderToString(React.createElement(Card, {
    record: { ...ev, verificationStatus: VERIFICATION_STATUS.UNSUPPORTED, verificationNotes: ['quote not present'] },
    onReview: () => {}
  }));
  assert(html.includes('Unsupported'), 'unsupported label');
  assert(!html.includes('Approve</button>'), 'no actions on unsupported');
});

await record('timeline highlights span and labels scripted demo, no fake timestamps', async () => {
  const html = renderToString(React.createElement(Timeline, {
    utterances: [utt],
    evidence: [{ ...ev, verificationStatus: VERIFICATION_STATUS.SUPPORTED }]
  }));
  assert(html.includes('<mark'), 'span highlighted');
  assert(html.includes('synthetic demo'), 'demo badge');
  assert(html.includes('no recorded timestamps'), 'honest timestamp absence');
});

await record('timeline renders multi-speaker labels', async () => {
  const utt2 = createSourceUtterance({
    sessionId: 'ui1', sequence: 1, speaker: SPEAKER.DOCTOR, language: 'English',
    text: 'Take rest for three days.', sourceType: SOURCE_TYPE.SCRIPTED_DEMO
  });
  const html = renderToString(React.createElement(Timeline, { utterances: [utt, utt2], evidence: [] }));
  assert(html.includes('Patient') && html.includes('Doctor'), 'speaker labels');
});

const failed = results.filter(r => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.ok ? '' : ' :: ' + (r.err?.message || r.err)}`);
console.log(`\nclinical_evidence_ui: ${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
