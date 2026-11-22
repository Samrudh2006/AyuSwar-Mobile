#!/usr/bin/env node
/**
 * benchmarks/fleurs_local_asr.mjs
 *
 * Transcribes a FLEURS-format split with a LOCAL ONNX CTC ASR model
 * (no network calls) and writes a filename-keyed hypothesis TSV for
 * benchmarks/fleurs_eval.py.
 *
 * The inference math mirrors the validated pilot core
 * (LocalAsrPilot in the local voice pilot): preprocessor.onnx ->
 * model -> argmax CTC collapse over the model's own vocab, with the
 * blank id taken as the last vocab index. Unlike the pilot, this
 * runner does not cap clip duration (FLEURS clips exceed 15s).
 *
 * Requirements: onnxruntime-node must be resolvable from the repo
 * (e.g. `npm i -D onnxruntime-node`). It is a dev-only benchmark
 * dependency; nothing here ships in the app bundle.
 *
 * Usage:
 *   node benchmarks/fleurs_local_asr.mjs \
 *     --refs eval-data/fleurs/te_in/dev.tsv \
 *     --audio-dir eval-data/fleurs/te_in/audio/dev \
 *     --model-dir /path/to/models --model-file model.matmul-int8.onnx \
 *     --vocab vocab.txt --out hyps-te-dev.tsv [--limit N]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import * as ort from 'onnxruntime-node';

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 2) out[argv[i].replace(/^--/, '')] = argv[i + 1];
  for (const k of ['refs', 'audio-dir', 'model-dir', 'model-file', 'vocab', 'out']) {
    if (!out[k]) { console.error(`missing --${k}`); process.exit(2); }
  }
  return out;
}

function parseVocab(text) {
  const out = [];
  for (const line of text.trim().split('\n')) {
    const split = line.lastIndexOf(' ');
    out[Number(line.slice(split + 1))] = line.slice(0, split);
  }
  return out;
}

/** Minimal RIFF/WAVE decoder: mono (or first channel), int16 or float32 PCM. */
function decodeWav(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (dv.getUint32(0, false) !== 0x52494646 || dv.getUint32(8, false) !== 0x57415645) {
    throw new Error('not a RIFF/WAVE file');
  }
  let pos = 12, fmt = null, data = null;
  while (pos + 8 <= buf.length) {
    const id = dv.getUint32(pos, false), size = dv.getUint32(pos + 4, true);
    if (id === 0x666d7420) {
      fmt = {
        format: dv.getUint16(pos + 8, true),
        channels: dv.getUint16(pos + 10, true),
        sampleRate: dv.getUint32(pos + 12, true),
        bits: dv.getUint16(pos + 22, true)
      };
    } else if (id === 0x64617461) {
      data = { offset: pos + 8, length: size };
    }
    pos += 8 + size + (size % 2);
  }
  if (!fmt || !data) throw new Error('missing fmt or data chunk');
  if (fmt.sampleRate !== 16000) throw new Error(`expected 16 kHz, got ${fmt.sampleRate}`);
  const frames = Math.floor(data.length / (fmt.bits / 8) / fmt.channels);
  const pcm = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    const off = data.offset + i * fmt.channels * (fmt.bits / 8);
    if (fmt.format === 3 && fmt.bits === 32) pcm[i] = dv.getFloat32(off, true);
    else if (fmt.format === 1 && fmt.bits === 16) pcm[i] = dv.getInt16(off, true) / 32768;
    else throw new Error(`unsupported wav format=${fmt.format} bits=${fmt.bits}`);
  }
  return pcm;
}

async function transcribe(pre, model, vocab, pcm) {
  const T = (type, dataArr, dims) => new ort.Tensor(type, dataArr, dims);
  const features = await pre.run({
    waveforms: T('float32', pcm, [1, pcm.length]),
    waveforms_lens: T('int64', BigInt64Array.of(BigInt(pcm.length)), [1])
  });
  const r = await model.run({ audio_signal: features.features, length: features.features_lens });
  const logits = r.logprobs.data;
  const V = r.logprobs.dims[2];
  const blank = vocab.length - 1;
  const frames = Math.min(r.logprobs.dims[1], Math.floor((Number(features.features_lens.data[0]) - 1) / 4) + 1);
  let prev = -1, text = '';
  for (let t = 0; t < frames; t++) {
    let best = 0;
    for (let v = 1; v < V; v++) if (logits[t * V + v] > logits[t * V + best]) best = v;
    if (best !== blank && best !== prev) text += vocab[best] ?? '';
    prev = best;
  }
  return text.replaceAll('▁', ' ').trim();
}

const args = parseArgs(process.argv);
const opts = { executionProviders: ['cpu'], intraOpNumThreads: 2, interOpNumThreads: 1 };
const t0 = performance.now();
const pre = await ort.InferenceSession.create(path.join(args['model-dir'], 'preprocessor.onnx'), opts);
const model = await ort.InferenceSession.create(path.join(args['model-dir'], args['model-file']), opts);
const vocab = parseVocab(await fs.readFile(path.join(args['model-dir'], args.vocab), 'utf8'));
console.error(`models loaded in ${Math.round(performance.now() - t0)}ms (${args['model-file']})`);

const lines = (await fs.readFile(args.refs, 'utf8')).split('\n').filter(l => l.trim());
const offset = args.offset ? Number(args.offset) : 0;
const limit = args.limit ? Number(args.limit) : Infinity;
const outLines = [];
let done = 0, failed = 0;
const start = performance.now();
for (let li = offset; li < lines.length; li++) {
  if (done >= limit) break;
  const wav = lines[li].split('\t')[1];
  try {
    const pcm = decodeWav(await fs.readFile(path.join(args['audio-dir'], wav)));
    const hyp = await transcribe(pre, model, vocab, pcm);
    outLines.push(`${wav}\t${hyp}`);
  } catch (err) {
    failed++;
    console.error(`FAILED ${wav}: ${err.message}`);
    outLines.push(`${wav}\t`);
  }
  done++;
  if (done % 25 === 0) {
    const rate = done / ((performance.now() - start) / 1000);
    console.error(`progress ${done}/${Math.min(lines.length - offset, limit)} (${rate.toFixed(1)} files/s, ${failed} failed)`);
  }
}
await fs.writeFile(args.out, outLines.join('\n') + '\n', 'utf8');
console.error(`wrote ${outLines.length} hypotheses to ${args.out}; ${failed} failures; total ${(performance.now() - start).toFixed(0)}ms`);
