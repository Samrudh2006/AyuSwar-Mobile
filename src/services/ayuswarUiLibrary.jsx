// AyuSwar — official OpenUI component library (@openuidev/react-lang, MIT).
// The ONLY UI a model (or the deterministic mapper) is allowed to render in the
// floating assistant: strict Zod schemas, in-app navigation actions only via the
// controlled onAction handler in FloatingAssistant. No toolProvider, no gateway.
import React from 'react';
import { defineComponent, createLibrary, useTriggerAction } from '@openuidev/react-lang';
import { z } from 'zod/v4';

const S = {
  card: {
    background: '#FDFBF6', border: '1px solid #E4DCCB', borderRadius: 12,
    padding: '10px 12px', fontSize: 12.5, color: '#081C24', lineHeight: 1.5,
    display: 'flex', flexDirection: 'column', gap: 6
  },
  cardTitle: { fontWeight: 700, fontSize: 13, color: '#14401F' },
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
  action: {
    display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    fontSize: 12, fontWeight: 700, padding: '8px 14px', borderRadius: 10,
    border: 'none', background: '#14401F', color: '#FBF7EC', cursor: 'pointer'
  },
  note: { fontSize: 10.5, color: '#8A7B63', lineHeight: 1.45 }
};

const InfoCard = defineComponent({
  name: 'InfoCard',
  description: 'A titled card with optional body text and key-value rows',
  props: z.object({
    title: z.string().max(120).describe('Card heading'),
    body: z.string().max(600).optional().describe('Paragraph text'),
    rows: z.array(z.object({ key: z.string().max(60), value: z.string().max(120) })).max(8).optional()
      .describe('Key-value fact rows')
  }),
  component: ({ props }) => (
    <div style={S.card}>
      {props.title ? <div style={S.cardTitle}>{props.title}</div> : null}
      {props.body ? <div>{props.body}</div> : null}
      {(props.rows || []).map((r, i) => (
        <div key={i} style={S.row}><span style={S.rowKey}>{r.key}</span><span style={S.rowVal}>{r.value}</span></div>
      ))}
    </div>
  )
});

const StepsList = defineComponent({
  name: 'StepsList',
  description: 'Numbered action steps for procedures or guidance',
  props: z.object({
    title: z.string().max(120).optional(),
    items: z.array(z.string().max(240)).min(1).max(8).describe('Step texts in order')
  }),
  component: ({ props }) => (
    <div style={S.card}>
      {props.title ? <div style={S.cardTitle}>{props.title}</div> : null}
      {(props.items || []).map((it, i) => (
        <div key={i} style={S.step}><span style={S.stepNum}>{i + 1}</span><span>{it}</span></div>
      ))}
    </div>
  )
});

const NoteText = defineComponent({
  name: 'NoteText',
  description: 'Small safety/disclaimer note, e.g. simulation or not-medical-advice labels',
  props: z.object({
    body: z.string().max(300)
  }),
  component: ({ props }) => <div style={S.note}>{props.body}</div>
});

const OpenScreen = defineComponent({
  name: 'OpenScreen',
  description: 'Button that opens an in-app screen. Only routes from the allowlist are honored.',
  props: z.object({
    label: z.string().max(60),
    route: z.enum(['/sanjivani', '/emergency', '/emergency/handover', '/scanner', '/audio-rx',
      '/acoustic-lab', '/clinical-console', '/doctor-portal', '/patient-portal', '/solutions'])
      .describe('In-app route to open')
  }),
  component: ({ props }) => {
    // Trigger through the controlled action channel; FloatingAssistant validates again.
    const trigger = useTriggerAction();
    return (
      <button style={S.action} onClick={() => trigger(props.label, undefined, { type: 'open_screen', params: { route: props.route } })}>
        {props.label} →
      </button>
    );
  }
});

const Answer = defineComponent({
  name: 'Answer',
  description: 'Root answer container holding a short summary and structured blocks',
  props: z.object({
    text: z.string().max(1200).describe('Short spoken-style summary of the answer'),
    blocks: z.array(z.any()).max(6).optional().describe('Structured blocks: InfoCard, StepsList, NoteText or OpenScreen references')
  }),
  component: ({ props, renderNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontWeight: 600 }}>{props.text}</div>
      {(props.blocks || []).map((b, i) => (
        <React.Fragment key={i}>{renderNode(b)}</React.Fragment>
      ))}
    </div>
  )
});

export const ayuswarUiLibrary = createLibrary({
  components: [Answer, InfoCard, StepsList, NoteText, OpenScreen],
  root: 'Answer'
});

export const ayuswarUiSystemPrompt = ayuswarUiLibrary.prompt({
  preamble: 'You are the AyuSwar health assistant. Answer in OpenUI Lang only.',
  additionalRules: [
    'Always call root = Answer(...) with a short summary text.',
    'Use InfoCard, StepsList, NoteText and OpenScreen only when they genuinely help; text alone is fine.',
    'Always add a NoteText with a safety disclaimer for medical-sounding answers: this is a synthetic-data prototype, not medical advice.',
    'For emergencies always include steps to call 112 or 108 first and an OpenScreen to /sanjivani.',
    'Never invent medicine prices or clinical claims.'
  ]
});
