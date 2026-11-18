// AyuSwar — structuredAnswerService: deterministic intent -> typed answer blocks.
// Feeds StructuredAnswer.jsx with allowlisted, schema-checked blocks grounded in the
// app's own datasets (PMBJP formulary, vernacular dictionary). No model-generated UI,
// no network calls, no external URLs. Returns null when plain text is the right answer.
import { PMBJP_FORMULARY_DATABASE } from '../data/pmbjpFormulary.js';

const CAP = (s, n = 180) => (typeof s === 'string' ? (s.length > n ? s.slice(0, n - 1) + '…' : s) : '');

const EMERGENCY_RE = /\b(emergency|accident|cpr|heart attack|cardiac arrest|not breathing|unconscious|bleeding|stroke|seizure|choking)\b|అత్యవసర|గుండెపోటు|స్ప్రహ లేదు|ఊపిరి పీల్చుకోలేక/i;
const MEDICINE_RE = /\b(tablet|medicine|medicines|drug|dosage|jan ?aushadhi|generic|pharmacy|price of)\b|మందు|మందులు|ఔషధ/i;
const PORTAL_RE = /\b(appointment|portal|register|token|opd|report|prescription)\b|అపాయింట్‌మెంట్|రిపోర్ట్/i;

function findFormularyEntries(q) {
  const lower = q.toLowerCase();
  const hits = [];
  for (const e of PMBJP_FORMULARY_DATABASE) {
    const name = (e.genericName || '').toLowerCase();
    const brand = (e.popularBrand || '').toLowerCase();
    const first = name.split(' ')[0];
    if ((first.length > 3 && lower.includes(first)) || (brand && brand.split(/[\s/]+/).some(t => t.length > 3 && lower.includes(t)))) {
      hits.push(e);
      if (hits.length >= 3) break;
    }
  }
  return hits;
}

/**
 * Returns { summary: string, blocks: Block[] } or null when no structured intent matches.
 * Blocks: {type:'card'|'steps'|'tabs'|'note'|'action', ...} - rendered by StructuredAnswer.jsx.
 */
export function mapQueryToStructuredAnswer(queryText) {
  const q = CAP(queryText, 400);
  if (!q) return null;

  // 1. Emergency -> guided steps + Sanjivani entry. Simulation-safe wording.
  if (EMERGENCY_RE.test(q)) {
    return {
      summary: 'This may be an emergency. Call 112 or 108 first; then follow guided steps in Sanjivani.',
      blocks: [
        {
          type: 'steps',
          title: 'First actions',
          items: [
            'Call 112 or 108 immediately if this is real.',
            'Open Sanjivani voice guidance and describe what happened.',
            'Follow on-screen steps; CPR pacing is available if needed.'
          ]
        },
        { type: 'action', route: '/sanjivani', label: 'Open Sanjivani 108' },
        { type: 'note', body: 'Prototype simulation. No ambulance is dispatched by this app.' }
      ]
    };
  }

  // 2. Medicine queries -> formulary cards from the shared PMBJP dataset.
  if (MEDICINE_RE.test(q)) {
    const hits = findFormularyEntries(q);
    if (hits.length > 0) {
      return {
        summary: `Found ${hits.length} matching Jan Aushadhi entr${hits.length === 1 ? 'y' : 'ies'} in the formulary.`,
        blocks: [
          { type: 'note', body: 'Reference listing from the app\'s bundled formulary (static, bundled with the app) - not a live price check and not medical advice. Confirm price, dose and suitability with a doctor or pharmacist.' },
          ...hits.map(e => ({
            type: 'card',
            title: CAP(e.genericName, 80),
            rows: [
              ['Same-salt brand examples', CAP(e.popularBrand, 60)],
              ['Price / MRP', 'Not shown: no live or verified price source in this prototype']
            ]
          })),
          { type: 'action', route: '/scanner', label: 'Scan a strip' }
        ]
      };
    }
  }

  // 3. Portal / appointment / report navigation.
  // Symptom-to-concept or urgency classification was intentionally removed from live
  // queries: mapping a live symptom term to a canned concept or urgency label is not a
  // supported clinical assessment in this prototype.
  if (PORTAL_RE.test(q)) {
    return {
      summary: 'You can use the app portals for this.',
      blocks: [
        {
          type: 'card',
          title: 'Where to go',
          rows: [
            ['Patient', 'Appointments, reports, prescriptions'],
            ['Doctor', 'Consultations, scribe, clinical tools']
          ]
        },
        { type: 'action', route: '/patient-portal', label: 'Open patient portal' }
      ]
    };
  }

  return null;
}

const esc = (v) => JSON.stringify(String(v));

/** Convert deterministic mapper blocks into OpenUI Lang source rendered by the official @openuidev/react-lang Renderer. */
export function blocksToOpenUILang(summary, blocks) {
  const stmts = [];
  const refs = [];
  let n = 0;
  for (const b of blocks || []) {
    n += 1;
    const id = `b${n}`;
    if (b.type === 'card') {
      const rows = (b.rows || []).map(([k, v]) => `{ key: ${esc(k)}, value: ${esc(v)} }`).join(', ');
      stmts.push(`${id} = InfoCard(title: ${esc(b.title || '')}, rows: [${rows}])`);
      refs.push(id);
    } else if (b.type === 'steps') {
      const items = (b.items || []).map(esc).join(', ');
      stmts.push(`${id} = StepsList(title: ${esc(b.title || '')}, items: [${items}])`);
      refs.push(id);
    } else if (b.type === 'note') {
      stmts.push(`${id} = NoteText(body: ${esc(b.body || '')})`);
      refs.push(id);
    } else if (b.type === 'action') {
      stmts.push(`${id} = OpenScreen(label: ${esc(b.label || 'Open')}, route: ${esc(b.route)})`);
      refs.push(id);
    }
  }
  return [`root = Answer(${esc(summary)}, [${refs.join(', ')}])`, ...stmts].join('\n');
}
