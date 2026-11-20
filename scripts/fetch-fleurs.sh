#!/usr/bin/env bash
# fetch-fleurs.sh - download FLEURS te_in/hi_in evaluation data locally.
#
# Default: dev + test splits only (evaluation pipeline inputs).
# --include-train additionally fetches the train splits (only when a
# fine-tuning task has been explicitly decided; test data is never used
# for training - see docs/EVAL-DATA-PLAN.md).
#
# FLEURS is CC-BY-4.0 (https://huggingface.co/datasets/google/fleurs).
# Attribution requirements are in NOTICE and docs/EVAL-DATA-PLAN.md.
# Data lands in eval-data/fleurs/ which is git-ignored; nothing is committed.

set -euo pipefail

DEST="$(cd "$(dirname "$0")/.." && pwd)/eval-data/fleurs"
BASE="https://huggingface.co/datasets/google/fleurs/resolve/main/data"
LANGS="te_in hi_in"

INCLUDE_TRAIN=0
if [ "${1:-}" = "--include-train" ]; then INCLUDE_TRAIN=1; fi

sha_for() {
  # $1 = lang, $2 = split -> expected sha256 (HF LFS oid, verified 2026-11-20)
  case "$1/$2" in
    te_in/dev)   echo 2ac52fa35be22b05ad041e2a2a443d10f4ef59449db07fe42cd644eb81ed7123 ;;
    te_in/test)  echo 65d764ab4c3e9531eb61ffea4d0a78832d520f238ef0f339a7871f19c1653fd8 ;;
    hi_in/dev)   echo 9adbca6d6fc70e40c121910941bcd7c8906eee60b402b6d21b4bd160e20030c7 ;;
    hi_in/test)  echo 47c238b9cf7016ba596639bb3038b0c89dc6e85759f16d09c4f58c6dfa25c65f ;;
    *) echo "" ;;
  esac
}

fetch() { # $1 url, $2 dest, $3 expected sha256 (empty = skip check)
  mkdir -p "$(dirname "$2")"
  if [ -f "$2" ]; then echo "already present: $2"; return; fi
  echo "downloading $1"
  curl -fSL --retry 3 -o "$2.part" "$1"
  if [ -n "$3" ]; then
    actual=$(sha256sum "$2.part" | cut -d' ' -f1)
    if [ "$actual" != "$3" ]; then
      echo "CHECKSUM MISMATCH for $2: got $actual, expected $3" >&2
      rm -f "$2.part"; exit 1
    fi
  fi
  mv "$2.part" "$2"
}

SPLITS="dev test"
[ "$INCLUDE_TRAIN" = "1" ] && SPLITS="dev test train"

for lang in $LANGS; do
  for split in $SPLITS; do
    fetch "$BASE/$lang/$split.tsv" "$DEST/$lang/$split.tsv" ""
    fetch "$BASE/$lang/audio/$split.tar.gz" "$DEST/$lang/audio/$split.tar.gz" "$(sha_for "$lang" "$split")"
  done
done

echo
echo "Done. Extract with: tar -xzf eval-data/fleurs/<lang>/audio/<split>.tar.gz -C eval-data/fleurs/<lang>/audio/"
echo "Reminder: test splits are for final reported metrics only (docs/EVAL-DATA-PLAN.md)."
