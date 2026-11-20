#!/usr/bin/env python3
"""
AyuSwar AI - FLEURS-format evaluation ingestion + WER/CER runner.

Reuses the existing stdlib metric engine (benchmarks/stt_metrics.py); this
script only adds reproducible ingestion of a FLEURS-format split TSV and a
filename-keyed hypothesis file, matched-pair accounting, and per-gender
breakdowns. It downloads nothing and calls no model.

Reference TSV: the raw FLEURS per-language format documented in
docs/EVAL-DATA-PLAN.md (7 tab-separated fields observed in te_in/test.tsv):
  1 utterance-group id (sentence key; NOT a speaker id)
  2 wav filename
  3 raw transcription (punctuated)
  4 normalized transcription
  5 character-tokenized transcription
  6 audio sample count
  7 gender label (MALE/FEMALE)

Hypothesis file: `wav filename<TAB>hypothesis` per line (UTF-8). Matching is
by exact filename; unmatched references and hypotheses are counted and
listed, never silently dropped.

Split discipline (docs/EVAL-DATA-PLAN.md): test splits are for final
reported metrics only; dev for iteration. This tool does not enforce
policy; it records the split it was given in its output.

Output: JSON on stdout with self-describing fields (dataset path, split,
model label, date, counts, corpus and per-gender WER/CER). No number from
this tool is a model-quality claim without the exposure context the plan
requires.

Usage:
  python3 benchmarks/fleurs_eval.py --refs eval-data/fleurs/te_in/test.tsv \
      --hyps hyps.tsv --model my-stt --split test [--ref-column raw|normalized]
"""

import argparse
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import stt_metrics


def load_fleurs_refs(path, ref_column):
    """Parse the raw 7-field FLEURS TSV. Returns list of dicts."""
    col = 2 if ref_column == 'raw' else 3  # 0-based: field 3 or 4
    refs = []
    with open(path, encoding='utf-8') as f:
        for lineno, line in enumerate(f, 1):
            line = line.rstrip('\n')
            if not line:
                continue
            parts = line.split('\t')
            if len(parts) != 7:
                raise ValueError(
                    f'{path}:{lineno}: expected 7 tab-separated fields, got {len(parts)}')
            refs.append({
                'group_id': parts[0],
                'file': parts[1],
                'reference': parts[col],
                'gender': parts[6],
                'line': lineno,
            })
    return refs


def load_hyps(path):
    """filename<TAB>hypothesis per line. Duplicates are an error."""
    hyps = {}
    with open(path, encoding='utf-8') as f:
        for lineno, line in enumerate(f, 1):
            line = line.rstrip('\n')
            if not line:
                continue
            parts = line.split('\t', 1)
            if len(parts) != 2:
                raise ValueError(
                    f'{path}:{lineno}: expected "filename<TAB>hypothesis"')
            name, hyp = parts
            if name in hyps:
                raise ValueError(f'{path}:{lineno}: duplicate hypothesis for {name}')
            hyps[name] = hyp
    return hyps


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--refs', required=True, help='FLEURS-format reference TSV')
    ap.add_argument('--hyps', required=True, help='filename<TAB>hypothesis file')
    ap.add_argument('--model', required=True, help='label for the system under test')
    ap.add_argument('--split', required=True, choices=['dev', 'test', 'train'],
                    help='recorded in output; plan rules apply to test')
    ap.add_argument('--ref-column', default='raw', choices=['raw', 'normalized'])
    args = ap.parse_args()

    refs = load_fleurs_refs(args.refs, args.ref_column)
    hyps = load_hyps(args.hyps)

    matched, unmatched_refs = [], []
    for r in refs:
        if r['file'] in hyps:
            matched.append((r, hyps[r['file']]))
        else:
            unmatched_refs.append(r['file'])
    ref_files = {r['file'] for r in refs}
    unmatched_hyps = sorted(f for f in hyps if f not in ref_files)

    def score(pairs):
        return {
            'n': len(pairs),
            'wer': stt_metrics.wer([r['reference'] for r, _ in pairs],
                                   [h for _, h in pairs]) if pairs else None,
            'cer': stt_metrics.cer([r['reference'] for r, _ in pairs],
                                   [h for _, h in pairs]) if pairs else None,
        }

    genders = sorted({r['gender'] for r, _ in matched})
    out = {
        'tool': 'benchmarks/fleurs_eval.py (stdlib stt_metrics)',
        'date': datetime.date.today().isoformat(),
        'model': args.model,
        'split': args.split,
        'ref_column': args.ref_column,
        'refs_path': args.refs,
        'hyps_path': args.hyps,
        'references_total': len(refs),
        'hypotheses_total': len(hyps),
        'matched': len(matched),
        'unmatched_references': unmatched_refs,
        'unmatched_hypotheses': unmatched_hyps,
        'corpus': score(matched),
        'per_gender': {
            g: score([(r, h) for r, h in matched if r['gender'] == g])
            for g in genders
        },
    }
    print(json.dumps(out, ensure_ascii=False, indent=2))

    if unmatched_refs or unmatched_hyps:
        print('warning: unmatched pairs exist; metrics cover matched pairs only',
              file=sys.stderr)
    return 0


if __name__ == '__main__':
    sys.exit(main())
