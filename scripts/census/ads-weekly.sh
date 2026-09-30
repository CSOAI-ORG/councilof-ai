#!/usr/bin/env bash
# Weekly agent-directory snapshot + parity. STAGED: not scheduled until fleet/owm/staged/ads-agent-directory.json is enabled.
# Runs on the lanes pod. Public, unauthenticated reads only; never calls a tool; never authenticates.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="${ADS_ROOT:-/workspace/lanes/ads-weekly}"
mkdir -p "$ROOT"
free_kb=$(df -Pk "$ROOT" | awk 'NR==2{print $4}')
if [ "${free_kb:-0}" -lt 2097152 ]; then echo "SKIP: under 2 GB free at $ROOT"; exit 0; fi
D="$ROOT/$(date -u +%F)"
mkdir -p "$D"
PY="${PY:-python3.11}"
"$PY" "$HERE/ads-snapshot.py" "$D/snapshot"
"$PY" "$HERE/ads-parity.py" plan     --snapshot "$D/snapshot" --out "$D/parity"
"$PY" "$HERE/ads-parity.py" probe    --out "$D/parity"
"$PY" "$HERE/ads-parity.py" collect  --snapshot "$D/snapshot" --out "$D/parity"
"$PY" "$HERE/ads-parity.py" packages --out "$D/parity"
"$PY" "$HERE/ads-parity.py" compare  --snapshot "$D/snapshot" --out "$D/parity"
if [ -n "${OWM_HOST:-}" ]; then scp -q "$D/snapshot/MANIFEST.json" "$D/parity/aggregate.json" "$OWM_HOST:lanes/state/ads/"; fi
echo "DONE $D"
