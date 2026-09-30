#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
# consumer-records-trigger.sh [DATE] -- lane L2 (2026-09-30), oracle-micro-2, cron 20 9 * * *.
# Installed at ~/lanes/consumer-records/trigger.sh; canon copy in scripts/pod-loops/.
#   1. build pod: consumer-records-daily.sh --prepare DATE -> UNCHANGED (exit 3, nothing else happens) or an unsigned set
#   2. here: sign every record with ~/lanes/measurement-signing/sign_record.py (POST /api/board-sign, pod caller token
#      from ~/.secrets, never printed or sent anywhere else; local verify + 3 altered-preimage controls; OTS stamp)
#   3. build pod: consumer-records-daily.sh --tar-stdin DATE -> commit, producer/recompute/page tests, full build gates,
#      ONE land: merge on staging master; auto-land deploys. Nothing publishes if any step fails.
# One line per run to ~/lanes/logs/consumer-records.log; the pod's own result line is read back on the next run.
set -uo pipefail
D=${1:-$(date -u +%F)}
LOG=$HOME/lanes/logs/consumer-records.log; W=$HOME/lanes/consumer-records/work/$D
. $HOME/fleet/build-pod.env || { echo "$(date -u +%FT%TZ) FAILED ~/fleet/build-pod.env unreadable" >> "$LOG"; exit 1; }
SSH="ssh -o BatchMode=yes -o ConnectTimeout=20 -i $HOME/.ssh/fleet_runpod_ed25519 -p $BUILD_POD_PORT $BUILD_POD_HOST"
ts() { date -u +%FT%TZ; }
fail() { echo "$(ts) rc=1 job=consumer-records date=$D state=FAILED step=$1 ${2:-}" >> "$LOG"; exit 1; }
prev=$($SSH "grep -E ' (PUBLISHED|UNCHANGED|FAILED|LANDED|GATED-NOT-LANDED) ' /workspace/staging/logs/consumer-records.log 2>/dev/null | tail -1" 2>/dev/null)
echo "$(ts) job=consumer-records pod-last-result: ${prev:-none}" >> "$LOG"
rm -rf "$W"; mkdir -p "$W" || fail mkdir
$SSH "bash /workspace/ci/consumer-records-daily.sh --prepare $D" > "$W/unsigned.tgz" 2> "$W/prepare.err"; rc=$?
if [ $rc -eq 3 ]; then echo "$(ts) rc=0 job=consumer-records date=$D state=UNCHANGED $(tail -1 $W/prepare.err)" >> "$LOG"; rm -rf "$W"; exit 0; fi
[ $rc -eq 0 ] && [ -s "$W/unsigned.tgz" ] || fail prepare "rc=$rc $(tail -1 $W/prepare.err)"
tar xzf "$W/unsigned.tgz" -C "$W" || fail untar
S="$W/disclosure-completeness-$D"; [ -f "$S/set.json" ] || fail untar "no set.json"
for rj in "$S"/*/record.json; do
  slug=$(basename "$(dirname "$rj")")
  out=$(python3 $HOME/lanes/measurement-signing/sign_record.py "$rj" --artifact-path "/interop/disclosure-completeness-$D/$slug/record.json" \
        --extra "$(dirname "$rj")/sign-extra.json" 2>&1) || fail sign "$slug: $(echo "$out" | tail -1)"
  echo "$out" | grep -q '"result": "VERIFIES"' || fail sign "$slug: local verification did not return VERIFIES"
  rm -f "$(dirname "$rj")/sign-extra.json"
  sleep 2
done
( cd "$S" && python3 verify.py > "$W/verify.log" 2>&1 ) || fail verify "$(tail -2 $W/verify.log | tr '\n' ' ')"
out=$(tar czf - -C "$W" "disclosure-completeness-$D" | $SSH "bash /workspace/ci/consumer-records-daily.sh --tar-stdin $D" 2>&1) || fail ship "$(echo "$out" | tail -1)"
echo "$(ts) rc=0 job=consumer-records date=$D state=SHIPPED records=$(ls -1d $S/*/record.json | wc -l) pod: $out" >> "$LOG"
rm -f "$W/unsigned.tgz"
