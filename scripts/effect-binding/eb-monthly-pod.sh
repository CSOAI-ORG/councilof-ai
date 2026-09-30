#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
# eb-monthly-pod.sh DATE [WORKERS] -- the monthly effect-binding server re-probe, pod side (lane live-backlog-20260930).
# Same published code bytes as the signed 2026-09-22 run (sha256-checked below), same frozen 600-server slice
# (bank-600.json, seed 20260922), same safety rules (>= 2 s between requests to one host, any 429 stops that host,
# no credentials, read-only tools only). Controls run first; if they misgrade, ABORT.json is written and no public
# server is contacted. Output: $RUNROOT/DATE/stage (container disk). Signing and publication happen on Oracle
# (scripts/effect-binding/eb-monthly-oracle.sh), never here.
set -euo pipefail
D=${1:?usage: eb-monthly-pod.sh YYYY-MM-DD [workers]}; W=${2:-12}
E=/workspace/ci/eb-monthly; RUNROOT=${EB_RUNROOT:-/root/eb-runs}; RUN=$RUNROOT/$D
declare -A PIN=([eb_controls.py]=9a85f8175c51a6072697a3cc068b5616df55659cf8f18bdb3ca975f6f84f9aee
  [eb_harvest.py]=61322f547c926934027587c40daa3532a0e58e6b464f2517ec806d777ee000fa
  [eb_mcp.py]=4805e6701859864e44ee679fd256b684d04d329b5ae93ebfbc404ecec5a98537
  [eb_probe.py]=60f04c7e36597a6da83d372e9f1c1bfa497a5964338767c39a7eb38969b6b147
  [eb_publish.py]=505978d7180f91e34273bf0cc5597365b2375afe5140d5d437b3b291d6d53db9
  [eb_run.py]=86ba2f5e1a403d2384a648a38112d829e034308809bb37d14b3e3f32ca61817e)
[ -e "$RUN/results.json" ] && { echo "ALREADY_RAN $RUN"; exit 0; }
FREE=$(df -Pk "$RUNROOT" 2>/dev/null | awk 'NR==2{print int($4/1024)}' || df -Pk /root | awk 'NR==2{print int($4/1024)}')
[ "${FREE:-0}" -lt 1024 ] && { echo "FAILED_DISK_FLOOR ${FREE}M < 1024M"; exit 3; }
mkdir -p "$RUN"; cd "$RUN"
for f in "${!PIN[@]}"; do cp "$E/code/$f" .; [ "$(sha256sum "$f" | cut -c1-64)" = "${PIN[$f]}" ] || { echo "CODE_MISMATCH $f"; exit 4; }; done
cp "$E/parent/bank-600.json" bank.json
PY=""; for c in python3.11 python3 python3.10; do command -v $c >/dev/null && $c -c 'import httpx' 2>/dev/null && { PY=$(command -v $c); break; }; done
[ -n "$PY" ] || { echo "NO_HTTPX"; exit 5; }
echo "$(date -u +%FT%TZ) controls" ; $PY eb_run.py controls "$RUN" > controls.stdout.log 2>&1 || { echo "CONTROLS_ABORT"; exit 6; }
echo "$(date -u +%FT%TZ) probe workers=$W"
$PY eb_run.py probe "$RUN" bank.json 600 20260922 "$W" > probe.stdout.log 2>&1
echo "$(date -u +%FT%TZ) probed $(tail -1 probe.stdout.log)"
# the artifact: the PUBLISHED eb_publish.py, unmodified, via eb_publish_rerun.py (same bytes as the repo's copy)
$PY "$E/bin/eb_publish_rerun.py" "$RUN" "$E/code" "$E/parent/artifact-2026-09-22.json" "$E/parent/parent-2026-09-22.signed.json" "$D" \
  --lane "${EB_LANE:-eb-monthly}" --companion > publish.stdout.log 2>&1 || { echo "PUBLISH_FAILED"; tail -5 publish.stdout.log; exit 7; }
N=effect-binding-server-probe-$D; mkdir -p stage/$N.code
cp eb_*.py "$E/bin/eb_publish_rerun.py" stage/$N.code/ && cp $N.json stage/ && cp probe.log.jsonl stage/$N.log.jsonl && cp controls.json stage/$N.controls.json && cp bank.json stage/$N.bank.json
echo "$(date -u +%FT%TZ) staged $RUN/stage host=$(hostname) python=$PY"
