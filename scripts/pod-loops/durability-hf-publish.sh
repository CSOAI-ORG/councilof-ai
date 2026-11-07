#!/bin/bash
# durability-hf-publish.sh -- weekly: publish the repository of record to Hugging Face as
# something an outside reader can actually open.
#
# Two artifacts, two different jobs, never one word for both:
#   source/          a DATED SNAPSHOT of the tracked tree -- browsable, no account needed.
#                    This exists because 325 of the estate's 354 MCP-registry entries carry a
#                    GitHub source link that is a 404 to anyone not signed in as us: the
#                    GitHub organisation is anonymously invisible, so the links are correct
#                    and the destination is a dead end. A public source location we control
#                    is the only thing that fixes that; republishing the same link cannot.
#   bundles/*.bundle a DATED FULL-HISTORY git bundle -- every commit, restorable with one
#                    `git clone`. This is the durability copy.
#
# Hugging Face cannot hold this repository as a git remote at all: its pre-receive hook
# refuses any push containing a file over 10 MiB and this history has 15 of them (measured
# 2026-09-22; the rejection is quoted in durability_hf_publish.py). Nothing here calls
# either artifact a mirror.
#
# Weekly, not daily, and that is a choice with a reason: the bundle is ~500 MB and Hugging
# Face keeps every version. Oracle and the owner's laptop are the copies that track the tip;
# this is the offsite, publicly readable one, and the receipt always states how stale it is.
#
# Every check in the run is ANONYMOUS -- no token -- because the upload's return value says
# nothing about what a stranger can reach.
#
# The scheduler owns the stamp. This script takes --now and never stamps itself.
# One receipt line per run, including the runs that skip.
set -u
. "$(dirname "$0")/lib.sh"

LOG=durability-hf-publish
PY="$LOOPS/durability_hf_publish.py"

[ "${1:-}" = "--now" ] || { log $LOG "SKIP not invoked with --now (the scheduler owns the stamp)"; exit 0; }

exec 9>"$STATE/$LOG.lock"
flock -n 9 || { log $LOG "SKIP another run holds the lock"; exit 0; }

[ -f "$PY" ] || { log $LOG "SKIP publisher absent at $PY -- nothing uploaded"; exit 0; }

o=$(DUR_OUT="$OUT/durability" DUR_TMP="$LANES/tmp" python3 "$PY" --now 2>&1)
rc=$?
echo "$o" >> "$LOGS/$LOG.detail.log"
line=$(printf '%s\n' "$o" | grep -m1 '^\[result\]')
[ -n "$line" ] || line="no [result] line; exit $rc; see $LOGS/$LOG.detail.log"
log $LOG "rc=$rc $line"
exit 0
