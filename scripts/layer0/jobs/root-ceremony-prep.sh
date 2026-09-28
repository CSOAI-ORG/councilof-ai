#!/usr/bin/env bash
# STAGED (not installed). Daily 06:00Z on the build pod ONCE PORTED (Phase 0/3/4 of the root ceremony).
# Today the candidate builder lives only in the Mac's ~/_alignment/layer0-root-ceremony-20260925 and
# hard-codes Mac paths (build_candidate.py lines 16, 19, 21; test_candidate.py line 26), so it can
# only root the dirty shared checkout the runbook forbids. This job FAILS CLOSED until the three
# scripts are in the repository under scripts/layer0/ceremony/ and take --repo.
. "$(dirname "$0")/_common.sh"
l0_canon scripts
cd "$L0_CANON"
for f in build_candidate.py test_candidate.py refresh_delta.py; do
  [ -f "scripts/layer0/ceremony/$f" ] || { echo "NEEDS_PORT: scripts/layer0/ceremony/$f absent on canon $L0_SHA"; exit 2; }
done
out="$L0_STATE/root-ceremony-prep-$L0_DAY"; mkdir -p "$out"
python3 scripts/layer0/ceremony/build_candidate.py --repo "$L0_CANON" --out "$out"
python3 scripts/layer0/ceremony/test_candidate.py --build "$out"
python3 scripts/layer0/ceremony/refresh_delta.py --build "$out"
