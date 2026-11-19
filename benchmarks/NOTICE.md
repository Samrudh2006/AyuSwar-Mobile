# AyuSwar AI Benchmark Dataset & Methodology Notice

> **STATUS: UNVERIFIED - TEMPLATE / REFERENCE FIXTURE OUTPUT, NOT A LIVE PIPELINE MEASUREMENT**

### Methodology & Provenance Note
- The benchmark CSV files in this directory (`ayuswar_stt_results_gnani_prisma.csv`, `ayuswar_stt_results_browser_stt.csv`, `data/ayuswar_50_eval_refs.csv`) represent evaluation harness test fixtures and synthetic ground-truth reference sentences.
- Several rows currently display `wer: 0.0, cer: 0.0` where hypothesis text mirrors the reference fixture.
- **These numbers are unverified template output, not live measured acoustic runs.**
- `run_stt_benchmark.py` reads reference and hypothesis CSV files. It does not capture audio or call an STT service. Live acoustic evaluation requires separately collected, provenance-recorded recognizer outputs, then scoring those hypotheses.
- Alias matching in that scorer is a text statistic, separate from the application normalizer, which preserves recognized text. Neither the fixture scores nor alias matches establish medication correctness, entity/intent preservation or absence of clinical harm.
