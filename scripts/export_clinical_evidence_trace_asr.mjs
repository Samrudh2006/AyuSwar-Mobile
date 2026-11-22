#!/usr/bin/env node
// Evidence trace from the REAL local ASR path over SYNTHETIC TTS audio.
//
// What this is:
//   - utterance text produced by the local ONNX CTC ASR (AI4Bharat Telugu
//     IndicConformer int8, sha256-pinned in src/services/localVoice/localAsrManifest.js)
//     running on synthetic gnani TTS prescription clips committed in public/audio/
//   - the clinical evidence engine's verification/review/export flow over
//     those genuine ASR transcripts
//
// What this is NOT:
//   - not a model-live extraction run. The app's model route is the
//     server-side /api/groq/chat proxy on the web deployment (frozen; key is
//     server-side; no direct key authorized). Extraction here is the
//     explicitly labelled deterministic fallback over ASR transcripts.
//   - not patient data: inputs are synthetic TTS clips; isSynthetic stays true.
//   - not audio-timestamped evidence: CTC frame alignment is an estimate and
//     is not emitted as clinical timing; timestamp fields stay absent.
//
// ASR inference math mirrors benchmarks/fleurs_local_asr.mjs (validated
// benchmark runner): preprocessor.onnx -> model -> argmax CTC collapse over
// the model vocab, blank id = last vocab index.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import * as ort from 'onnxruntime-node';
import { createEvidenceSession, registerUtterance, extractEvidence } from '../src/services/clinicalEvidenceEngine.js';
import { verifyEvidence } from '../src/services/clinicalEvidenceVerifier.js';
import { applyReviewAction, selectApprovedForExport } from '../src/services/clinicalEvidencePersistence.js';
import { SPEAKER, SOURCE_TYPE } from '../src/services/clinicalEvidenceTypes.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(root, process.argv[2] || 'AYUSWAR-TECHNICAL-EVIDENCE/03-CLINICAL-SAFETY');
const MODEL_DIR = process.env.AYUSWAR_TE_MODEL_DIR || '/tmp/asr-te';

const INPUTS = [
  { repoPath: 'public/audio/gnani_telugu_rx_respiratory.wav', speaker: SPEAKER.DOCTOR, language: 'Telugu', role: 'clinical' },
  { repoPath: 'public/audio/gnani_telugu_rx_narayana_rao.wav', speaker: SPEAKER.DOCTOR, language: 'Telugu', role: 'clinical' },
  { repoPath: 'public/audio/gnani_lang_te.wav', speaker: SPEAKER.DOCTOR, language: 'Telugu', role: 'prescription-instruction clip containing no fallback-lexicon terms; illustrates documented fail-closed silence (zero candidates expected from the fallback extractor)' }
];

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const pin = (rel) => sha256(readFileSync(path.join(root, rel)));

function decodeWav(buf) { // same minimal RIFF decoder as benchmarks/fleurs_local_asr.mjs
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (dv.getUint32(0, false) !== 0x52494646 || dv.getUint32(8, false) !== 0x57415645) throw new Error('not a RIFF/WAVE file');
  let pos = 12, fmt = null, data = null;
  while (pos + 8 <= buf.length) {
    const id = dv.getUint32(pos, false), size = dv.getUint32(pos + 4, true);
    if (id === 0x666d7420) fmt = { format: dv.getUint16(pos + 8, true), channels: dv.getUint16(pos + 10, true), sampleRate: dv.getUint32(pos + 12, true), bits: dv.getUint16(pos + 22, true) };
    else if (id === 0x64617461) data = { offset: pos + 8, length: size };
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

async function transcribe(pre, model, vocab, pcm) { // same math as benchmarks/fleurs_local_asr.mjs
  const T = (type, dataArr, dims) => new ort.Tensor(type, dataArr, dims);
  const features = await pre.run({ waveforms: T('float32', pcm, [1, pcm.length]), waveforms_lens: T('int64', BigInt64Array.of(BigInt(pcm.length)), [1]) });
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

const vocab = (readFileSync(path.join(MODEL_DIR, 'vocab.txt'), 'utf8')).trim().split('\n')
  .reduce((acc, line) => { const i = line.lastIndexOf(' '); acc[Number(line.slice(i + 1))] = line.slice(0, i); return acc; }, []);

const opts = { executionProviders: ['cpu'], intraOpNumThreads: 2, interOpNumThreads: 1 };
const pre = await ort.InferenceSession.create(path.join(MODEL_DIR, 'preprocessor.onnx'), opts);
const model = await ort.InferenceSession.create(path.join(MODEL_DIR, 'model.matmul-int8.onnx'), opts);

const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const dirty = !!execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root, encoding: 'utf8' }).trim();

const tmp = path.join(os.tmpdir(), `asr-trace-${Date.now()}`);
mkdirSync(tmp, { recursive: true });

const session = createEvidenceSession('sess_asr_synthetic_tts_1');
const inputs = [];
for (const spec of INPUTS) {
  const srcAbs = path.join(root, spec.repoPath);
  const srcBuf = readFileSync(srcAbs);
  const rec = { repoPath: spec.repoPath, role: spec.role, speaker: spec.speaker, language: spec.language, sourceSha256: sha256(srcBuf), failure: null };
  try {
    const dst = path.join(tmp, path.basename(spec.repoPath, '.wav') + '.16k.wav');
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', srcAbs, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', dst]);
    rec.decodeCommand = `ffmpeg -i ${spec.repoPath} -ar 16000 -ac 1 -c:a pcm_s16le <derived 16 kHz mono wav>`;
    const dstBuf = readFileSync(dst);
    rec.derived16kSha256 = sha256(dstBuf);
    const pcm = decodeWav(dstBuf);
    rec.durationSecAt16k = Math.round((pcm.length / 16000) * 1000) / 1000;
    rec.transcriptRaw = await transcribe(pre, model, vocab, pcm);
    if (!rec.transcriptRaw) {
      rec.failure = { stage: 'asr', message: 'empty transcript from local ASR' };
    } else {
      registerUtterance(session, { speaker: spec.speaker, language: spec.language, text: rec.transcriptRaw, sourceType: SOURCE_TYPE.SCRIPTED_DEMO });
    }
  } catch (err) {
    rec.failure = { stage: rec.failure?.stage || 'decode-or-asr', message: String(err.message || err) };
  }
  inputs.push(rec);
}

const registered = session.utterances.length;
if (registered === 0) throw new Error('no utterances registered from ASR output - investigate before exporting');

const extraction = await extractEvidence(session, { allowFallback: true }); // no callModel: labelled fallback, never presented as a model run
const { verified, counts } = verifyEvidence(session, extraction.candidates);
const reviewed = verified.map(v => v.verificationStatus === 'SUPPORTED'
  ? applyReviewAction(v, { type: 'APPROVE' }, { identity: 'evidence-export-script', isDemo: true }, 'export demo: mark supported ASR-trace candidates as reviewed')
  : v);
const approvedForExport = selectApprovedForExport(reviewed);

const trace = {
  scope: 'Real local-ASR path over synthetic TTS clips: utterance text is genuine output of the sha256-pinned local ONNX Telugu ASR on in-repo synthetic gnani TTS audio. Extraction is the explicitly labelled deterministic fallback (NOT a live model run - no authorized model route exists from this environment). Reviewer is a DEMO reviewer. No patient data, no real consultations, no audio timestamps.',
  generatedAt: new Date().toISOString(),
  revision,
  trackedWorkingTreeDirty: dirty,
  transcriptSource: 'LOCAL_ONNX_ASR',
  extractionMethod: extraction.method,
  extractionStatus: extraction.status,
  fallbackReason: extraction.fallbackReason,
  modelRoute: 'UNAVAILABLE - the app routes model extraction through the server-side /api/groq/chat proxy on the frozen web deployment (server-held key, client key storage disabled); no direct key or other authorized free route exists from this environment. This trace therefore does not exercise MODEL_LIVE extraction and does not claim to.',
  audioTimestamps: 'not available - CTC frame alignment is an estimate and is not emitted as clinical timing; timestamp fields absent, never invented',
  asrProvenance: {
    modelDir: MODEL_DIR,
    modelFile: 'model.matmul-int8.onnx',
    modelSha256: sha256(readFileSync(path.join(MODEL_DIR, 'model.matmul-int8.onnx'))),
    preprocessorSha256: sha256(readFileSync(path.join(MODEL_DIR, 'preprocessor.onnx'))),
    vocabSha256: sha256(readFileSync(path.join(MODEL_DIR, 'vocab.txt'))),
    manifestPin: 'src/services/localVoice/localAsrManifest.js (AI4Bharat Telugu IndicConformer, OpenVoiceOS conversion, repo int8 derivative)',
    runtime: `onnxruntime-node ${JSON.parse(readFileSync(path.join(root, 'node_modules/onnxruntime-node/package.json'), 'utf8')).version}`,
    decode: 'greedy argmax CTC collapse, blank = last vocab id; same math as benchmarks/fleurs_local_asr.mjs'
  },
  inputs,
  session: { sessionId: session.sessionId, utterances: session.utterances },
  rejected: extraction.rejected,
  verificationCounts: counts,
  evidence: reviewed,
  approvedForExport,
  relatedArtifacts: {
    fixtureTrace: 'CLINICAL_EVIDENCE_TRACE.json (6 evidence records over 6 scripted fixture utterances - SUPPORTED:4, AMBIGUOUS:2, 2 approved-for-export - deterministic fallback, generated at revision 9248d7c; separate record, not overwritten by this file)'
  }
};
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, 'CLINICAL_EVIDENCE_TRACE_ASR.json'), JSON.stringify(trace, null, 2) + '\n');
console.log(`ASR trace exported: ${inputs.length} inputs (${inputs.filter(i => i.failure).length} failed), ${registered} utterances, ${reviewed.length} evidence records (${JSON.stringify(counts)}), ${approvedForExport.length} approved-for-export, method ${extraction.method}`);
