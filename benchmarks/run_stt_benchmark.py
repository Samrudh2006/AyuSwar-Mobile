#!/usr/bin/env python3
"""
AyuSwar AI — Indic STT Benchmark Evaluation Suite
Evaluates Word Error Rate (WER), Character Error Rate (CER), and Medical-Term Accuracy (MTA).
Compares Browser WebSpeech Recognition vs. Gnani Prisma v3 Indic STT across 50 OPD Sentences.

Runs with the Python standard library only (csv + stt_metrics Levenshtein).
If jiwer is installed it is used instead and any divergence from the stdlib
implementation beyond rounding noise is reported, so both paths stay honest.

Breakdowns are reported per fixture language group (te / hi / mix) as well as
corpus-wide. All fixture sentences are synthetic; see data/ayuswar_50_eval_refs.csv.
"""

import csv
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stt_metrics

try:
    import jiwer
except ImportError:
    jiwer = None

norm = stt_metrics.norm

LANG_LABELS = {"te": "Telugu", "hi": "Hindi", "mix": "Code-Mixed"}


def load_csv(path):
    with open(path, newline="", encoding="utf-8") as fh:
        return list(csv.DictReader(fh))


def calculate_wer_cer(refs, hyps, hyp_col="browser_stt"):
    """Corpus-level WER & CER plus per-sentence metrics."""
    hyp_by_id = {row["id"]: norm(row.get(hyp_col, "")) for row in hyps}
    rows = [(row["id"], row["ref_n"], hyp_by_id.get(row["id"], "")) for row in refs]
    rt = [r for _, r, _ in rows]
    ht = [h for _, _, h in rows]

    w = stt_metrics.wer(rt, ht)
    c = stt_metrics.cer(rt, ht)
    if jiwer is not None:
        jw, jc = jiwer.wer(rt, ht), jiwer.cer(rt, ht)
        if abs(jw - w) > 0.005 or abs(jc - c) > 0.005:
            print(f"  [!] jiwer/stdlib divergence: wer {jw:.4f} vs {w:.4f}, cer {jc:.4f} vs {c:.4f}")
        w, c = jw, jc

    per_sentence = [
        {
            "id": i,
            "wer": stt_metrics.sentence_wer(a, b),
            "cer": stt_metrics.sentence_cer(a, b),
            "ref": a,
            "hyp": b,
        }
        for i, a, b in rows
    ]
    return w, c, per_sentence


def calculate_term_accuracy(refs, hyps, hyp_col="browser_stt"):
    """
    Computes a fixture text-match statistic, not a clinical safety measure.
    Matches listed aliases as substrings in supplied hypotheses. This does not
    invoke the application normalizer, check negation/dose correctness, run an
    acoustic recognizer, or establish clinical entity/intent preservation.
    """
    hyp_by_id = {row["id"]: norm(row.get(hyp_col, "")) for row in hyps}
    total = 0
    hit = 0
    missed = []

    for row in refs:
        terms = [t.strip() for t in str(row["medical_terms"]).split(";") if t.strip()]
        for t in terms:
            aliases = [norm(a) for a in t.split("|")]
            total += 1
            sentence_hyp = hyp_by_id.get(row["id"], "")
            if any(a and a in sentence_hyp for a in aliases):
                hit += 1
            else:
                missed.append({"id": row["id"], "term": t, "hyp": sentence_hyp})

    acc = hit / total if total else 0.0
    return hit, total, acc, missed


def print_language_breakdown(refs, hyps, hyp_col):
    """Per-language-group WER/CER over the fixture's lang column."""
    hyp_by_id = {row["id"]: row.get(hyp_col, "") for row in hyps}
    groups = {}
    for row in refs:
        groups.setdefault(row.get("lang") or "?", []).append(
            (row["ref_n"], hyp_by_id.get(row["id"], ""))
        )
    print("  Per-language breakdown:")
    for lang in sorted(groups):
        pairs = groups[lang]
        rt = [p[0] for p in pairs]
        ht = [p[1] for p in pairs]
        label = LANG_LABELS.get(lang, lang)
        print(
            f"    - {label:<10} n={len(pairs):>2}  "
            f"WER {stt_metrics.wer(rt, ht)*100:5.1f}%  CER {stt_metrics.cer(rt, ht)*100:5.1f}%"
        )


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    refs_path = os.path.join(base_dir, "data", "ayuswar_50_eval_refs.csv")
    hyps_arg = sys.argv[1] if len(sys.argv) > 1 else None
    if hyps_arg and os.path.exists(hyps_arg):
        hyps_path = hyps_arg
    else:
        sample_path = os.path.join(base_dir, "data", "ayuswar_50_eval_hyps_sample.csv")
        template_path = os.path.join(base_dir, "data", "ayuswar_50_eval_hyps_template.csv")
        hyps_path = sample_path if os.path.exists(sample_path) else template_path

    if not os.path.exists(refs_path):
        print(f"Error: References file not found at {refs_path}")
        return 1

    refs = load_csv(refs_path)
    hyps = load_csv(hyps_path)

    # Apply Sarthak normalization
    REF_COL = "reference_native"
    for row in refs:
        row["ref_n"] = norm(row[REF_COL])

    engine = "jiwer" if jiwer is not None else "stdlib (stt_metrics)"
    print("======================================================================")
    print("AYUSWAR AI — INDIC STT BENCHMARK EVALUATION (50 OPD SENTENCES)")
    print("Languages: Telugu (opd_01-20), Hindi (opd_21-35), Code-Mixed (opd_36-50)")
    print(f"Metric engine: {engine}")
    print("======================================================================")

    for col in ["browser_stt", "gnani_prisma"]:
        if col == "gnani_prisma" and not os.environ.get("GNANI_API_KEY"):
            print(f"\n--- {col.upper()} RESULTS ---")
            print("  • Status                    : NOT RUN (Local environment without GNANI_API_KEY)")
            print("  • Production Proxy          : /api/gnani/stt (Deployed on Vercel with serverless keys)")
            print("  • Evaluation Invariant      : Raw results omitted locally to avoid unverified synthetic zero-error bias.")
            continue

        if col not in hyps[0] or all(not (row.get(col) or "").strip() for row in hyps):
            print(f"\n[i] {col}: Transcripts column empty or not populated yet. (Skip)")
            continue

        w, c, per = calculate_wer_cer(refs, hyps, col)
        hit, total, acc, missed = calculate_term_accuracy(refs, hyps, col)

        print(f"\n--- {col.upper()} RESULTS ---")
        print(f"  • Word Error Rate (WER)     : {w:.3f} ({w*100:.1f}%)")
        print(f"  • Character Error Rate (CER): {c:.3f} ({c*100:.1f}%)")
        print(f"  • Medical-Term Accuracy     : {hit}/{total} ({acc:.1%})")
        print_language_breakdown(refs, hyps, col)

        out_csv = os.path.join(base_dir, f"ayuswar_stt_results_{col}.csv")
        with open(out_csv, "w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=["id", "wer", "cer", "ref", "hyp"])
            writer.writeheader()
            writer.writerows(per)
        print(f"  • Saved per-sentence audit to: {out_csv}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
