#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
# publish-trigger.sh -- lane owm-autopublish-20260930, oracle-micro-2, cron 55 2-23/3 * * * (6 min after the :49 OWM
# cycle, 25 min before each auto-land tick at 20 */3). Streams the cycle's PUBLIC snapshot to the build pod's
# /workspace/ci/owm-publish.sh, which decides with fleet/owm/publish_candidate.py, commits, gates and lands one
# `land:` merge; auto-land deploys it. This host signs, commits and deploys nothing. One line per run to
# ~/lanes/logs/owm-publish.log, with the pod's previous result read back (this run's is still gating).
set -uo pipefail
LOG=$HOME/lanes/logs/owm-publish.log
SRC=${OWM_PUBLIC_SNAPSHOT:-$HOME/lanes/state/owm/public/latest.json}
ts() { date -u +%FT%TZ; }
fail() { echo "$(ts) rc=1 job=owm-publish state=FAILED step=$1 ${2:-}" >> "$LOG"; exit 1; }
. $HOME/fleet/build-pod.env || fail env "~/fleet/build-pod.env unreadable"   # the ONE build-pod address
SSH="ssh -o BatchMode=yes -o ConnectTimeout=20 -i ${BUILD_POD_KEY:-$HOME/.ssh/fleet_runpod_ed25519} -p $BUILD_POD_PORT $BUILD_POD_HOST"
[ -s "$SRC" ] || fail source "no $SRC (OWM cycle not run?)"
age=$(( $(date +%s) - $(stat -c %Y "$SRC") ))
[ "$age" -le 3600 ] || fail source "$SRC is ${age}s old (OWM cycle stalled; not publishing a stale candidate)"
prev=$($SSH "grep -E ' (PUBLISHED|UNCHANGED|FAILED|LANDED|GATED-NOT-LANDED) ' /workspace/staging/logs/owm-publish.log 2>/dev/null | tail -1" 2>/dev/null)
out=$($SSH "OWM_MAX_INTERVAL_S=${OWM_MAX_INTERVAL_S:-7200} bash /workspace/ci/owm-publish.sh --stdin" < "$SRC" 2>&1) || fail ship "$(echo "$out" | tail -1)"
case "$prev" in *" FAILED "*) rcl=1 ;; *) rcl=0 ;; esac
echo "$(ts) rc=$rcl job=owm-publish state=SHIPPED age_s=$age pod: $out | previous: ${prev:-none}" >> "$LOG"
