import React from 'react';
import { MStateStyles, StateAnalyzing } from './MStateAnimations.jsx';
import { useApp } from '../context/AppContext';
import { mt } from './mobileTranslations';

export default function MYamnetTags({ audio }) {
  const { selectedLanguage } = useApp();
  const t = key => mt(key, selectedLanguage);
  const [task, setTask] = React.useState('unspecified');
  const [result, setResult] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const worker = React.useRef(null);
  const timer = React.useRef(null);
  React.useEffect(() => { setResult(null); setBusy(false); return () => { clearTimeout(timer.current); worker.current?.terminate(); worker.current = null; }; }, [audio]);
  const run = () => {
    if (!audio?.samples || busy) return;
    setBusy(true); setResult(null);
    const count = Math.min(Math.floor(audio.samples.length * 16000 / audio.sampleRate), 80000);
    const samples = new Float32Array(Math.max(15600, count));
    for (let i = 0; i < count; i++) {
      const pos = i * audio.sampleRate / 16000;
      const a = Math.floor(pos); const fraction = pos - a;
      samples[i] = Math.max(-1, Math.min(1, audio.samples[a] * (1 - fraction) + (audio.samples[Math.min(a + 1, audio.samples.length - 1)] || 0) * fraction));
    }
    if (!worker.current) worker.current = new Worker(new URL('./yamnet.worker.js', import.meta.url), { type: 'module' });
    const timeout = timer.current = setTimeout(() => {
      worker.current?.terminate(); worker.current = null; setBusy(false);
      setResult({ ok: false, message: 'Local analysis exceeded 60 seconds. Your audio measurements are unaffected.' });
    }, 60000);
    worker.current.onmessage = ({data}) => { clearTimeout(timeout); setBusy(false); setResult({...data, task}); };
    worker.current.onerror = () => { clearTimeout(timeout); setBusy(false); setResult({ok:false,message:'Local model could not run on this device. No replacement tags were invented.'}); worker.current?.terminate(); worker.current = null; };
    worker.current.postMessage({ samples }, [samples.buffer]);
  };
  return <section className="m-yamnet-panel">
    <MStateStyles />
    <span className="m-clin-label">Local model · YAMNet v1</span>
    <h2 className="m-steps-title">Explore sound-event hints</h2>
    <p>Google YAMNet predicts audio-event tags, not diseases. Scores are raw model outputs, not probabilities. Vowels and breathing can receive unrelated tags. Your selected task is kept separate.</p>
    <label className="m-record-language">What did you record?<select value={task} disabled={busy} onChange={e=>{setTask(e.target.value);setResult(null);}}><option value="unspecified">Select the recorded task</option><option value="sustained-vowel">Sustained vowel</option><option value="speech">Speech / counting</option><option value="cough">Cough</option><option value="breathing">Breathing</option><option value="other">Other sound</option></select></label>
    <button className="m-btn m-btn-primary" onClick={run} disabled={busy || !audio || task === 'unspecified'}>{busy ? 'Running local model...' : 'Analyze sound-event hints'}</button>
    {busy && <StateAnalyzing eyebrow={t('Acoustic analysis')} title={t('Analysing audio...')} hint={t('On-device model run; raw event scores, no diagnostic inference')} />}
    <p className="m-yamnet-note">Runs on this device in a separate worker. First 5 seconds only; bundled model, no audio upload. Initial load and slower phones may take longer.</p>
    {result && <div role="status" className="m-yamnet-result">{result.ok ? <><b>Uncertain event hints</b><p>Recorded task: {result.task}. Do not treat these tags as a confirmed classification.</p>{result.top.map((tag,i)=><div className="m-yamnet-tag" key={i}><span>{typeof tag.label === 'string' ? tag.label : tag.label?.display_name || 'Unknown'}</span><code>{tag.score.toFixed(3)}</code></div>)}<small>Raw scores · {result.elapsedMs}ms including model load if needed · {result.backend} · {result.samples / 16000}s input. No diagnostic inference.</small></> : <p>{result.message}</p>}</div>}
    <a href="/models/yamnet-v1/LICENSE" target="_blank" rel="noreferrer">Apache 2.0 model license</a>
  </section>;
}
