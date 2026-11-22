const fields = [['subjective', 'Subjective'], ['objective', 'Objective'], ['assessment', 'Assessment'], ['plan', 'Plan'], ['bestMatterVernacular', 'Reviewed voice summary']];
export function draftSummary(soap) {
  return 'AyuSwar synthetic practice draft - not a prescription or clinical record.\n\n' + fields.map(([key, label]) => `${label}:\n${soap?.[key] || 'Not documented'}`).join('\n\n');
}
export function buildDraftBundle(soap, turns, sourceMode) {
  // A research collection, not a claimed ABDM prescription/document profile.
  // No invented patient IDs, diagnoses, medicines, doses or signatures.
  return {
    resourceType: 'Bundle', type: 'collection', timestamp: new Date().toISOString(),
    meta: { tag: [{ system: 'urn:ayuswar:prototype', code: 'synthetic-research-draft', display: 'Synthetic practice only; not ABDM validated' }] },
    entry: [{
      // R4: collection-bundle entries must carry a fullUrl identity.
      fullUrl: `urn:uuid:${crypto.randomUUID()}`,
      resource: {
      // dom-6 best practice: every resource carries a generated narrative.
      text: { status: 'generated', div: '<div xmlns="http://www.w3.org/1999/xhtml">AyuSwar synthetic practice draft - not a prescription or clinical record.</div>' },
      resourceType: 'QuestionnaireResponse', status: 'completed',
      item: [
        { linkId: 'source-mode', text: 'Input source', answer: [{ valueString: sourceMode === 'mic' ? 'Recorded practice audio transcript' : 'Explicit scripted sample transcript' }] },
        { linkId: 'source-transcript', text: 'Source transcript', answer: [{ valueString: turns.map(t => `${t.speaker}: ${t.text}`).join('\n') }] },
        ...fields.map(([key, label]) => ({ linkId: key, text: label, answer: [{ valueString: soap?.[key] || 'Not documented' }] }))
      ]
    } }]
  };
}
