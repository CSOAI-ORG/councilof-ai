#!/usr/bin/env bash
# STAGED (not installed). Weekly Mon 06:30Z on the build pod. 29 requests to the estate's own hosts.
# Repeats the latest surface ceremony's probe list and records what moved since its as_of.
. "$(dirname "$0")/_common.sh"
l0_floor
l0_canon public/interop scripts
cd "$L0_CANON"
cer=$(ls public/interop/layer0-ceremony-20*.json | sort | tail -1)
python3 scripts/layer0/surface_reprobe.py --ceremony "$cer" --out "$L0_STATE/surface-reprobe-$L0_DAY.json"
ln -sf "surface-reprobe-$L0_DAY.json" "$L0_STATE/surface-reprobe-latest.json"
