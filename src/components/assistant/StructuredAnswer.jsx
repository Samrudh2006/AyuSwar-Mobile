// AyuSwar — StructuredAnswer: allowlisted interactive answer blocks for the floating assistant.
// Answers can render as tappable structured components (cards/steps/tabs) instead of a
// text wall. Renderer accepts ONLY typed blocks from structuredAnswerService — never
// model-generated markup, no external URLs, actions are in-app routes from a fixed allowlist.
import React from 'react';
import { useNavigate } from 'react-router-dom';

const INTERNAL_ROUTES = new Set([
  '/sanjivani', '/emergency', '/emergency/handover', '/scanner', '/audio-rx',
  '/acoustic-lab', '/clinical-console', '/doctor-portal', '/patient-portal', '/solutions'
]);

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 },
  card: {
    background: '#FDFBF6', border: '1px solid #E4DCCB', borderRadius: 12,
    padding: '10px 12px', fontSize: 12.5, color: '#081C24', lineHeight: 1.5
  },
  cardTitle: { fontWeight: 700, fontSize: 13, color: '#14401F', marginBottom: 4 },
  row: { display: 'flex', justifyContent: 'space-between', gap: 8, padding: '3px 0', borderTop: '1px dashed #EAE2D0' },
  rowKey: { color: '#486770', fontSize: 11.5 },
  rowVal: { fontWeight: 600, fontSize: 12, textAlign: 'right' },
  step: { display: 'flex', gap: 9, alignItems: 'flex-start', padding: '4px 0' },
  stepNum: {
    width: 20, height: 20, borderRadius: '50%', flex: '0 0 auto', marginTop: 1,
    background: '#F5E8E6', color: '#B3352C', fontSize: 11, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  tabs: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
  tab: {
    fontSize: 11.5, fontWeight: 700, padding: '5px 11px', borderRadius: 999,
    border: '1px solid #D0DFE2', background: '#fff', color: '#0F4C5C', cursor: 'pointer'
  },
  tabActive: { background: '#14401F', color: '#FBF7EC', borderColor: 'transparent' },
  action: {
    display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 10,
    border: 'none', background: '#14401F', color: '#FBF7EC', cursor: 'pointer'
  },
  note: { fontSize: 10.5, color: '#8A7B63', lineHeight: 1.45 }
};

function CardBlock({ block }) {
  return (
    <div style={S.card}>
      {block.title ? <div style={S.cardTitle}>{block.title}</div> : null}
      {block.body ? <div>{block.body}</div> : null}
      {(block.rows || []).map((r, i) => (
        <div key={i} style={S.row}><span style={S.rowKey}>{r[0]}</span><span style={S.rowVal}>{r[1]}</span></div>
      ))}
    </div>
  );
}

function StepsBlock({ block }) {
  return (
    <div style={S.card}>
      {block.title ? <div style={S.cardTitle}>{block.title}</div> : null}
      {(block.items || []).map((it, i) => (
        <div key={i} style={S.step}><span style={S.stepNum}>{i + 1}</span><span>{it}</span></div>
      ))}
    </div>
  );
}

function TabsBlock({ block }) {
  const [active, setActive] = React.useState(0);
  const tabs = block.tabs || [];
  const cur = tabs[Math.min(active, tabs.length - 1)] || { label: '', body: '' };
  return (
    <div style={S.card}>
      {block.title ? <div style={S.cardTitle}>{block.title}</div> : null}
      <div style={S.tabs}>
        {tabs.map((t, i) => (
          <button key={i} style={{ ...S.tab, ...(i === active ? S.tabActive : {}) }} onClick={() => setActive(i)}>
            {t.label}
          </button>
        ))}
      </div>
      <div>{cur.body}</div>
    </div>
  );
}

export default function StructuredAnswer({ blocks }) {
  const navigate = useNavigate();
  if (!Array.isArray(blocks) || blocks.length === 0) return null;
  return (
    <div style={S.wrap}>
      {blocks.map((block, i) => {
        if (!block || typeof block.type !== 'string') return null;
        switch (block.type) {
          case 'card': return <CardBlock key={i} block={block} />;
          case 'steps': return <StepsBlock key={i} block={block} />;
          case 'tabs': return <TabsBlock key={i} block={block} />;
          case 'note': return <div key={i} style={S.note}>{block.body}</div>;
          case 'action': {
            if (!INTERNAL_ROUTES.has(block.route)) return null;
            return (
              <button key={i} style={S.action} onClick={() => navigate(block.route)}>
                {block.label} →
              </button>
            );
          }
          default: return null;
        }
      })}
    </div>
  );
}
