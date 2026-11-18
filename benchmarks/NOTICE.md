# AyuSwar AI Benchmark Dataset & Methodology Notice

> **STATUS: UNVERIFIED - TEMPLATE / REFERENCE FIXTURE OUTPUT, NOT A LIVE PIPELINE MEASUREMENT**

### Methodology & Provenance Note
- The benchmark CSV files in this directory (`ayuswar_stt_results_gnani_prisma.csv`, `ayuswar_stt_results_browser_stt.csv`, `data/ayuswar_50_eval_refs.csv`) represent evaluation harness test fixtures and synthetic ground-truth reference sentences.
- Several rows currently display `wer: 0.0, cer: 0.0` where hypothesis text mirrors the reference fixture.
- **These numbers are unverified template output, not live measured acoustic runs.**
- Live empirical measurements require executing `python run_stt_benchmark.py` against live audio input streams through configured STT credentials.
