# AyuSwar AI: Historical Benchmark Fixtures and Verification Limits

## Measured FLEURS results, local offline ONNX ASR (2026-11-22)

These are actual dated Node executions of the repo's offline ASR models against
FLEURS reference audio, produced by `benchmarks/fleurs_local_asr.mjs` (no network
calls) and scored by `benchmarks/fleurs_eval.py` (`--ref-column normalized`,
stdlib `stt_metrics`). They measure the **local offline fallback models only**.
They are NOT numbers for the in-app browser runner (which currently shows an
idle 0/28 state until a run is executed there), NOT Web Speech API quality, NOT
any cloud provider's quality, and NOT clinical validation.

| Model | Split | n (matched) | Corpus WER | Corpus CER | WER F / M | CER F / M |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| local-onnx-conformer-ctc-int8-te (`/tmp/asr-te/model.matmul-int8.onnx`, sha256-pinned) | te_in dev | 311 / 311 | 22.11% | 6.70% | 20.49% / 22.62% | 5.36% / 7.11% |
| local-onnx-conformer-ctc-int8-te | te_in test | 472 / 472 | 23.46% | 7.93% | 21.45% / 24.16% | 6.51% / 8.43% |
| local-onnx-conformer-ctc-hi (pilot `asr-hi.onnx`) | hi_in dev | 239 / 239 | 11.87% | 4.84% | 14.08% / 9.89% | 6.12% / 3.71% |
| local-onnx-conformer-ctc-hi (pilot `asr-hi.onnx`) | hi_in test | 418 / 418 | 11.19% | 4.68% | 12.07% / 10.26% | 5.25% / 4.08% |

Full scorer output for each row: `benchmarks/results/2026-11-22-fleurs-*.json`.

Execution notes: CPU-only onnxruntime-node, int8 quantized Conformer CTC,
greedy argmax decode, 0 transcription failures across all runs; every reference
matched a hypothesis (no dropped pairs). Dev splits are iteration data per
docs/EVAL-DATA-PLAN.md; the test rows are the final reported figures. FLEURS is read-speech
news/web text, not code-mixed clinical speech; these numbers do not transfer to
consultation audio.

### Controlled-noise delta (2026-11-22, babble, n=120 subset)

Synthetic corruption of real read speech (MS-SNSD babble, MIT; seeded
mixing, whole-clip RMS SNR scaling; same seeded n=120 te_in test subset at
every level; seed 20261122): clean 25.86% WER / 10.43% CER; SNR 20 dB
26.40% / 10.72%; SNR 10 dB 28.60% / 11.47%; SNR 5 dB 33.99% / 14.35%.
Same offline benchmark runner and scorer; 0 failures. Full record:
`benchmarks/results/2026-11-22-noisy-te_in-test-sub120/` and
`AYUSWAR-TECHNICAL-EVIDENCE/02-AI-EVALUATION/NOISY_ASR_REPORT.md`. Not
recorded clinical noise, not the capture path, not the full test set.

### Runner scope: benchmark numbers are NOT shipping app-path quality

`benchmarks/fleurs_local_asr.mjs` is an UNCAPPED benchmark runner: it feeds
each full clip to the model regardless of duration. The shipping in-app offline
worker caps input at 15 seconds (pilot `LocalAsrPilot` duration guard), so
shipping-path accuracy on real captures is a separate, unmeasured question.
These numbers describe the model under benchmark conditions only.

### Model provenance and replay

| File | sha256 | Source |
| :--- | :--- | :--- |
| te model `model.matmul-int8.onnx` | `a67b8aa4840fd78934f6246e626c183f9a07773fa910e3012349a6081fbeb1aa` | EXACT match of the pin in `src/services/localVoice/localAsrManifest.js` (AI4Bharat Telugu IndicConformer, OpenVoiceOS conversion, repo int8 derivative) |
| te preprocessor `preprocessor.onnx` | `1566e840c72d032dfb31166b924d96fe2a6c8a6c29393da8e83c19d99de0eb76` | manifest pin (onnx-asr 0.12.0 nemo80_conv) |
| te vocab `vocab.txt` | `dc0b7bbb9eca8d3c8aebf1eb86e3144c90d692b4008cf5a32d46437b942b23ac` | manifest pin (OpenVoiceOS) |
| hi model `asr-hi.onnx` | `03e527a067eb467cf9cee7bc8c8f57862198c9eef0068ffd7e23770ec85fc9e7` | local pilot file, copied from the pilot's OpenVoiceOS AI4Bharat IndicConformer Hindi download (nemo-conformer-ctc, matmul-int8); upstream repo pin NOT yet recorded in-repo - treat as pilot-grade provenance |
| hi preprocessor | `1566e840c72d032dfb31166b924d96fe2a6c8a6c29393da8e83c19d99de0eb76` | same onnx-asr preprocessor as te |

Hypothesis TSVs are committed next to the scorer JSON so every figure is
independently recomputable:

| Hypotheses | sha256 |
| :--- | :--- |
| `benchmarks/results/2026-11-22-fleurs-te_in-dev.hyps.tsv` | `120731a962858ba4d1627bad4da52abe3d550599e705652fa513746566bea96e` |
| `benchmarks/results/2026-11-22-fleurs-te_in-test.hyps.tsv` | `ce1aeecf36c425352b92d3e30d0f35abc07303f8387920fd9feadb11bcbc9ca1` |
| `benchmarks/results/2026-11-22-fleurs-hi_in-dev.hyps.tsv` | `92da6530a7301be9013a81602b415c6bb33c70a64f7db822226dc6065a3243fd` |
| `benchmarks/results/2026-11-22-fleurs-hi_in-test.hyps.tsv` | `f6f99803a96b72693715bd33fcd9f6fd4205a822c959b793f7ceb680b096d8dd` |

Replay (no model run needed):

```
python3 benchmarks/fleurs_eval.py --refs eval-data/fleurs/te_in/dev.tsv \
  --hyps benchmarks/results/2026-11-22-fleurs-te_in-dev.hyps.tsv \
  --model local-onnx-conformer-ctc-int8-te --split dev --ref-column normalized
python3 benchmarks/fleurs_eval.py --refs eval-data/fleurs/te_in/test.tsv \
  --hyps benchmarks/results/2026-11-22-fleurs-te_in-test.hyps.tsv \
  --model local-onnx-conformer-ctc-int8-te --split test --ref-column normalized
python3 benchmarks/fleurs_eval.py --refs eval-data/fleurs/hi_in/dev.tsv \
  --hyps benchmarks/results/2026-11-22-fleurs-hi_in-dev.hyps.tsv \
  --model local-onnx-conformer-ctc-int8-hi --split dev --ref-column normalized
python3 benchmarks/fleurs_eval.py --refs eval-data/fleurs/hi_in/test.tsv \
  --hyps benchmarks/results/2026-11-22-fleurs-hi_in-test.hyps.tsv \
  --model local-onnx-conformer-ctc-int8-hi --split test --ref-column normalized
```

## Current verification status

The former results narrative in this file conflicts with [NOTICE.md](NOTICE.md), which identifies the CSVs as unverified template/reference fixtures. The earlier execution labels and aggregate metrics are withdrawn as evidence of current application or recognizer performance. No replacement accuracy, latency, dosage-clarity or safety metric is asserted here.

`normalizeCodeMixedClinicalText` preserves the text supplied to it. It does not apply the historical drug/diagnostic alias lexicon, infer medicine strengths, or establish that clinical entities or intent survived recognition. The lexicon remains inert data in the current source. Caller-side whitespace trimming and sentence segmentation are separate from this safeguard.

The previous claims of complete entity/medication preservation and absence of clinical harm were unsupported. Neither word/character error rates nor alias text matches establish clinical safety. Real audio, recognizer provenance, medication/strength/negation errors and qualified clinical review would need separate evaluation. Native-device behavior and live provider availability are not established by these fixtures.

## Historical Telugu fixture examples, not live evaluation results

The following table is retained only as a record of illustrative reference/hypothesis pairs and their historical annotations. Its listed WER values and term annotations have not been revalidated in this correction. They must not be cited as measured recognition accuracy, semantic equivalence or clinical validation.

| Sentence ID | Reference Clinical Utterance | Recognized Transcript (Web Speech API) | Sentence WER | Historical fixture annotation (unvalidated) |
| :--- | :--- | :--- | :---: | :--- |
| `opd_01` | నాకు నిన్న రాత్రి నుండి fever ఉంది doctor గారు | నాకు నిన్న రాత్రి నుండి fever ఉంది doctor గారు | 0.0% | `fever` (Preserved (unvalidated)) |
| `opd_02` | ముక్కు కారుతూ తలనొప్పిగా ఉంది paracetamol వేసుకున్నాను | ముక్కు కారుతూ తలనొప్పిగా ఉంది paracetamol వేసుకున్నాను | 0.0% | `paracetamol` (Preserved (unvalidated)) |
| `opd_03` | నా BP కొద్దిగా ఎక్కువగా ఉందని చెప్పారు | నా bp కొద్దిగా ఎక్కువగా ఉందని చెప్పారు | 0.0% | `BP` (Preserved (unvalidated)) |
| `opd_04` | నాకు sugar ఉంది insulin injection వేసుకుంటాను | నాకు sugar ఉంది ఇన్సులిన్ ఇంజెక్షన్ వేసుకుంటాను | 33.3% | `sugar` (Preserved), `insulin` (Phonetic Vernacular (unvalidated)) |
| `opd_05` | కడుపులో మంటగా ఉంది acidity అనుకుంటున్నాను | కడుపులో మంటగా ఉంది ఎసిడిటీ అనుకుంటున్నాను | 20.0% | `acidity` (Phonetic Vernacular (unvalidated)) |
| `opd_06` | గొంతు నొప్పిగా ఉంది రాత్రిపూట cough ఎక్కువగా ఉంటుంది | గొంతు నొప్పిగా ఉంది రాత్రిపూట దగ్గు ఎక్కువగా ఉంటుంది | 14.3% | `cough` (Semantic Telugu Equivalent (unvalidated)) |
| `opd_07` | ఛాతీలో ఒత్తిడిగా ఉంది ECG చేయించుకోవాలా | ఛాతీలో ఒత్తిడిగా ఉంది ecg చేయించుకోవాలా | 0.0% | `ECG` (Preserved (unvalidated)) |
| `opd_08` | నాకు asthma ఉంది inhaler వాడుతున్నాను | నాకు ఆస్తమా ఉంది inhaler వాడుతున్నాను | 20.0% | `asthma` (Phonetic Vernacular (unvalidated)), `inhaler` (Preserved (unvalidated)) |
| `opd_09` | మోకాళ్ల నొప్పిగా ఉంది calcium tablets రాసివ్వండి | మోకాళ్ల నొప్పిగా ఉంది calcium tablets రాసివ్వండి | 0.0% | `calcium` (Preserved (unvalidated)) |
| `opd_10` | పిల్లలకు vomiting అవుతోంది ORS ఇవ్వొచ్చా | పిల్లలకు vomiting అవుతోంది ors ఇవ్వొచ్చా | 0.0% | `vomiting` (Preserved (unvalidated)), `ORS` (Preserved (unvalidated)) |
| `opd_11` | fever తగ్గడం లేదు blood test చేయమంటారా | fever తగ్గడం లేదు blood test చేయమంటారా | 0.0% | `fever` (Preserved (unvalidated)), `blood test` (Preserved (unvalidated)) |
| `opd_12` | కంటి చూపు తగ్గింది sugar వల్లనని అన్నారు | కంటి చూపు తగ్గింది sugar వల్లనని అన్నారు | 0.0% | `sugar` (Preserved (unvalidated)) |
| `opd_13` | కళ్లు ఎర్రగా ఉన్నాయి eye drops వాడాలా | కళ్లు ఎర్రగా ఉన్నాయి ఐ డ్రాప్స్ వాడాలా | 33.3% | `eye drops` (Phonetic Vernacular (unvalidated)) |
| `opd_14` | గుండె గుబులుగా ఉంది thyroid test చేయించాను | గుండె గుబులుగా ఉంది థైరాయిడ్ టెస్ట్ చేయించాను | 33.3% | `thyroid` (Phonetic Vernacular (unvalidated)) |
| `opd_15` | వాంతులు అవుతున్నాయి typhoid test చేయమన్నారు | వాంతులు అవుతున్నాయి typhoid test చేయమన్నారు | 0.0% | `typhoid` (Preserved (unvalidated)) |
| `opd_16` | నాకు migraine ఉంది వెలుతురు చూస్తే తలనొప్పి పెరుగుతుంది | నాకు మైగ్రేన్ ఉంది వెలుతురు చూస్తే తలనొప్పి పెరుగుతుంది | 14.3% | `migraine` (Phonetic Vernacular (unvalidated)) |
| `opd_17` | vitamin D లోపం ఉందని report లో వచ్చింది | vitamin d లోపం ఉందని report లో వచ్చింది | 0.0% | `vitamin D` (Preserved (unvalidated)) |
| `opd_18` | గ్యాస్ సమస్యగా ఉంది endoscopy చేయించుకోవాలా | గ్యాస్ సమస్యగా ఉంది endoscopy చేయించుకోవాలా | 0.0% | `endoscopy` (Preserved (unvalidated)) |
| `opd_19` | చర్మంపై దద్దుర్లు వచ్చాయి allergy అనుకుంటున్నాను | చర్మంపై దద్దుర్లు వచ్చాయి allergy అనుకుంటున్నాను | 0.0% | `allergy` (Preserved (unvalidated)) |
| `opd_20` | దంతం నొప్పిస్తోంది antibiotics రాయండి | దంతం నొప్పిస్తోంది antibiotics రాయండి | 0.0% | `antibiotics` (Preserved (unvalidated)) |

## What the scoring script does

`run_stt_benchmark.py` reads CSV references and hypotheses and calculates text-comparison statistics. Its alias check looks for listed alias substrings in hypothesis text. It does not call `normalizeCodeMixedClinicalText`, capture audio, run recognition, check prescribing correctness or establish patient outcomes. Supplying credentials does not turn CSV scoring into an acoustic run.

To score an explicitly supplied hypothesis CSV:

```bash
python benchmarks/run_stt_benchmark.py /path/to/recorded-hypotheses.csv
```

Without that argument, the script may use bundled sample/template hypotheses. Its computed outputs are statistics for the supplied files, not proof of a live pipeline. Record audio provenance, recognizer/version/configuration, collection conditions and reference-review method separately before reporting empirical results.

The bundled audio and clinical-reasoning scripts are development harnesses. The former playback timings, dosage-clarity percentages, field-survival claims and provider execution/deployment assertions in this document are not retained as verified current results. No new audio, provider, device or clinical evaluation was performed for this documentation correction.
