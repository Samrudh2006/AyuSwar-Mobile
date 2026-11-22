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

Full scorer output for each row: `benchmarks/results/2026-11-22-fleurs-*.json`.

Execution notes: CPU-only onnxruntime-node, int8 quantized Conformer CTC,
greedy argmax decode, 0 transcription failures across all runs; every reference
matched a hypothesis (no dropped pairs). hi_in test split was not yet run at
this date; dev splits are iteration data per docs/EVAL-DATA-PLAN.md, the te_in
test number is the final reported figure for that model. FLEURS is read-speech
news/web text, not code-mixed clinical speech; these numbers do not transfer to
consultation audio.

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
