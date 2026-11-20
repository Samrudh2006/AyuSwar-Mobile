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
#
# Every artifact (TSV and audio) is pinned to an exact Hugging Face
# dataset revision and verified against a pinned SHA-256, both below.
# Existing files are re-verified on every run; a corrupt or stale file
# is re-downloaded, never silently skipped.

set -euo pipefail

# Exact dataset revision pinned on 2026-11-20 (HF repo commit sha).
REV="70bb2e84b976b7e960aa89f1c648e09c59f894dd"
BASE="https://huggingface.co/datasets/google/fleurs/resolve/$REV/data"
DEST="$(cd "$(dirname "$0")/.." && pwd)/eval-data/fleurs"
LANGS="te_in hi_in"

INCLUDE_TRAIN=0
if [ "${1:-}" = "--include-train" ]; then INCLUDE_TRAIN=1; fi

tsv_sha_for() { # $1 = lang, $2 = split -> content sha256 (verified 2026-11-20 at REV above)
  case "$1/$2" in
    te_in/dev)   echo fbedc2a5b7e394ff5a6e8c269f616017d2ac9a247ffa707c10efaa08132a0630 ;;
    te_in/test)  echo 81313da935e3e1d45b69080ec29e5cb1b1b872a06d52ed05ebfc9d218565417e ;;
    te_in/train) echo c86def3365609f93e3a660cbe76aa2adefda346fbb399e6a4eec633fbc1528d3 ;;
    hi_in/dev)   echo cea87c57a37a0d38ed0afce30e68a35ad7b3945414648430fee09a54ca7b72ba ;;
    hi_in/test)  echo 889e82e2875490f9533ff59ab67326fcfa01cf828fc4412758aaaa1f442a729f ;;
    hi_in/train) echo fa15b11ca73fd4e8ccb6403f58cde3ac5bbdf27d9654799b3c85c26375489c78 ;;
    *) echo "" ;;
  esac
}

audio_sha_for() { # $1 = lang, $2 = split -> HF LFS oid (sha256), captured 2026-11-20 at REV above
  case "$1/$2" in
    te_in/dev)   echo 2ac52fa35be22b05ad041e2a2a443d10f4ef59449db07fe42cd644eb81ed7123 ;;
    te_in/test)  echo 65d764ab4c3e9531eb61ffea4d0a78832d520f238ef0f339a7871f19c1653fd8 ;;
    te_in/train) echo 6098b3d50ae7b49f9ddaac9b3f84aa7a36701ef196859a34b9b85cc9111a09f1 ;;
    hi_in/dev)   echo 9adbca6d6fc70e40c121910941bcd7c8906eee60b402b6d21b4bd160e20030c7 ;;
    hi_in/test)  echo 47c238b9cf7016ba596639bb3038b0c89dc6e85759f16d09c4f58c6dfa25c65f ;;
    hi_in/train) echo bb6f52bfb27ca91c54539480111163eb9245305008cfe0526c6f4af3bfdd04e9 ;;
    *) echo "" ;;
  esac
}

fetch() { # $1 url, $2 dest, $3 expected sha256 (required)
  local url="$1" dest="$2" expected="$3"
  [ -z "$expected" ] && { echo "no pinned sha256 for $dest; refusing to fetch unverified" >&2; exit 1; }
  mkdir -p "$(dirname "$dest")"
  if [ -f "$dest" ]; then
    actual=$(sha256sum "$dest" | cut -d' ' -f1)
    if [ "$actual" = "$expected" ]; then
      echo "verified existing: $dest"
      return
    fi
    echo "existing file failed verification (got $actual); re-downloading: $dest" >&2
    rm -f "$dest"
  fi
  echo "downloading $url"
  curl -fSL --retry 3 -o "$dest.part" "$url"
  actual=$(sha256sum "$dest.part" | cut -d' ' -f1)
  if [ "$actual" != "$expected" ]; then
    echo "CHECKSUM MISMATCH for $dest: got $actual, expected $expected" >&2
    rm -f "$dest.part"; exit 1
  fi
  mv "$dest.part" "$dest"
}

SPLITS="dev test"
[ "$INCLUDE_TRAIN" = "1" ] && SPLITS="dev test train"

for lang in $LANGS; do
  for split in $SPLITS; do
    fetch "$BASE/$lang/$split.tsv" "$DEST/$lang/$split.tsv" "$(tsv_sha_for "$lang" "$split")"
    fetch "$BASE/$lang/audio/$split.tar.gz" "$DEST/$lang/audio/$split.tar.gz" "$(audio_sha_for "$lang" "$split")"
  done
done

echo
echo "Done. Extract with: tar -xzf eval-data/fleurs/<lang>/audio/<split>.tar.gz -C eval-data/fleurs/<lang>/audio/"
echo "Reminder: test splits are for final reported metrics only (docs/EVAL-DATA-PLAN.md)."
