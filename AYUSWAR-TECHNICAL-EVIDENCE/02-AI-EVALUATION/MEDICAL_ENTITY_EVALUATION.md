# Medical entity evaluation

Not yet implemented as a metric. There is no labelled medical-term list, no
medical-entity recall computation, and no dosage-extraction accuracy number.
This file exists so evaluators see the gap explicitly instead of an implied
result.

What does exist today: deterministic source-span verification of extracted
candidates (phase 40-44 tests) and measured plain WER/CER on FLEURS
([WER_CER_REPORT.md](WER_CER_REPORT.md)). Neither is a medical-entity metric.

Next usable work: labelled medical-term list per language, recall computation
in the benchmark harness, Tenglish/code-switch corpus, clean-vs-noisy delta.
