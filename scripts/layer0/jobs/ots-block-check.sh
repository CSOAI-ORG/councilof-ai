#!/usr/bin/env bash
# STAGED (not installed). Weekly Mon 06:20Z on the build pod (network-light).
# Every Bitcoin attestation in the repository's public proofs against the block header at its height,
# as two public explorers report it. Not a Bitcoin node; says so in its output.
. "$(dirname "$0")/_common.sh"
l0_floor
l0_canon public/interop scripts
cd "$L0_CANON"
nice -n 10 python3 scripts/ots_block_check.py --dir public/interop --dir public/interop/ots \
  --out "$L0_STATE/ots-block-check-$L0_DAY.json"
ln -sf "ots-block-check-$L0_DAY.json" "$L0_STATE/ots-block-check-latest.json"
