#!/bin/sh
# eval-CI runner (J32). Two halves, one real gate:
#   1. check_bank.py  — REAL. Fails on a silent frozen-bank edit. Non-negotiable.
#   2. emit_delta.py  — emits a QUEUED eval.delta card. The delta SHAPE is real; the delta
#                       NUMBER is UNCHECKABLE in CI (no GPU model run here). Not laptop-signed.
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
AXIS="${1:-gspc-axis}"

echo "== eval-CI bank gate =="
python3 "$HERE/check_bank.py"          # exits non-zero on a silent edit -> fails the PR

echo "== eval-CI delta card (QUEUED, number UNCHECKABLE without a run) =="
python3 "$HERE/emit_delta.py" --axis "$AXIS" --write

echo "Delta card is QUEUED for GHA #card-attestation-1. NO_LAPTOP_SIGN."
