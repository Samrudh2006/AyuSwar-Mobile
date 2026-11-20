#!/usr/bin/env python3
"""
AyuSwar AI - dependency-free STT metrics (WER / CER).

Standard-library fallback for run_stt_benchmark.py so the evaluation runs on
any machine (no jiwer / pandas install). WER is a Levenshtein distance over
whitespace-tokenized, normalized words; CER is the same over characters.
Normalization matches run_stt_benchmark.norm: Unicode NFC, lowercase, and
punctuation/symbol categories replaced by spaces (Indic matras preserved).

Corpus WER/CER are micro-averaged (total edit distance over total reference
length), matching jiwer.wer/jiwer.cer on sentence lists.
"""

import unicodedata


def norm(s):
    """Unicode NFC + lowercase; punctuation/symbols become spaces; collapse."""
    s = unicodedata.normalize("NFC", str(s)).lower()
    s = "".join(" " if unicodedata.category(c)[0] in "PS" else c for c in s)
    return " ".join(s.split())


def _levenshtein(a, b):
    """Edit distance between two sequences, O(min(len)) memory."""
    if len(a) < len(b):
        a, b = b, a
    previous = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        current = [i]
        for j, cb in enumerate(b, 1):
            current.append(
                min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (ca != cb))
            )
        previous = current
    return previous[-1]


def error_rate(refs, hyps, unit):
    """Micro-averaged error rate. unit='word' -> WER, 'char' -> CER."""
    total_dist = 0
    total_len = 0
    for r, h in zip(refs, hyps):
        if unit == "word":
            ru, hu = norm(r).split(), norm(h).split()
        else:
            # characters including spaces, matching jiwer.cer on pre-normalized text
            ru, hu = list(norm(r)), list(norm(h))
        total_dist += _levenshtein(ru, hu)
        total_len += len(ru)
    if total_len == 0:
        return 0.0
    return total_dist / total_len


def wer(refs, hyps):
    return error_rate(refs, hyps, "word")


def cer(refs, hyps):
    return error_rate(refs, hyps, "char")


def sentence_wer(ref, hyp):
    if not norm(hyp):
        return 1.0
    r, h = norm(ref).split(), norm(hyp).split()
    return _levenshtein(r, h) / len(r) if r else 0.0


def sentence_cer(ref, hyp):
    if not norm(hyp):
        return 1.0
    r = list(norm(ref))
    h = list(norm(hyp))
    return _levenshtein(r, h) / len(r) if r else 0.0
