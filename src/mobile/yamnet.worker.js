import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu';
import { loadGraphModel } from '@tensorflow/tfjs-converter';
let modelPromise;
let labelsPromise;
self.onmessage = async ({ data }) => {
  const started = performance.now();
  let input; let outputs; let average;
  try {
    await tf.setBackend('cpu');
    await tf.ready();
    if (!modelPromise) modelPromise = loadGraphModel('/models/yamnet-v1/model.json').catch(e => { modelPromise = null; throw e; });
    if (!labelsPromise) labelsPromise = fetch('/models/yamnet-v1/labels.json').then(r => { if (!r.ok) throw new Error('Model labels unavailable'); return r.json(); });
    const [model, labels] = await Promise.all([modelPromise, labelsPromise]);
    input = tf.tensor1d(data.samples, 'float32');
    outputs = await model.executeAsync(input);
    const tensors = Array.isArray(outputs) ? outputs : [outputs];
    const scores = tensors.find(t => t.shape[t.shape.length - 1] === 521);
    if (!scores) throw new Error('Expected 521-label score output missing');
    average = tf.mean(scores, 0);
    const raw = await average.data();
    const top = Array.from(raw, (score, index) => ({ label: labels[index], score })).sort((a,b) => b.score - a.score).slice(0,3);
    self.postMessage({ ok: true, top, elapsedMs: Math.round(performance.now() - started), samples: data.samples.length, backend: tf.getBackend() });
  } catch (error) {
    self.postMessage({ ok: false, message: 'Local sound-event analysis is unavailable. Audio measurements remain usable.', detail: String(error.message).slice(0,180) });
  } finally {
    input?.dispose(); average?.dispose();
    if (outputs) (Array.isArray(outputs) ? outputs : [outputs]).forEach(t => t.dispose());
  }
};
