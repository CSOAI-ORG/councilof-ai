#!/bin/bash
# pod-loops-drift-check.sh — the pod is the running system; scripts/pod-loops/ only describes it.
#
# WHY THIS EXISTS. scripts/pod-loops/ was a hand-maintained mirror of /workspace/lanes/loops/ and
# by 2026-09-23 it had drifted in both directions without anyone noticing: 40 installed loops were
# absent from it, 8 more differed byte-for-byte, and its scheduler.sh still carried a CHAIN_ENABLED
# block claiming the :15/:35/:45 slots that durability-mirror, arena-hourly and trust-chain now
# hold. A reinstall from the repo copy would have switched thirteen running loops off, and a loop
# that does not run leaves no log line, so nobody would have seen it. A mirror nothing checks is
# not a mirror; it is a second, wrong answer. This is the check.
#
# WHAT IT ASSERTS
#   1. every file installed at $LOOPS has the same sha256 in scripts/pod-loops/
#   2. every file in scripts/pod-loops/ is installed at $LOOPS, or is declared in the manifest's
#      repo_only map with a reason (chain_tools.py is read from the repo clone by mill-hourly.sh,
#      never installed as a loop)
#   3. every script scheduler.sh actually dispatches appears in the schedule table of
#      docs/operations/POD-LOOPS.md — the doc is a producer of this claim and drifted furthest
#      (it listed 9 of the 25 registered jobs)
#   4. the generated manifest itself matches the live pod; a stale manifest IS drift
#
# FAIL CLOSED. If the pod cannot be read, this exits 2 UNCHECKABLE. It never reports a pod it did
# not reach as agreeing. File MODE is deliberately not compared: the repo keeps 0644 and the
# scheduler invokes every owned shell through `bash`, so mode is an install property, not content.
#
#   bash scripts/pod-loops-drift-check.sh            # check; 0 agree, 1 drift, 2 unreachable
#   bash scripts/pod-loops-drift-check.sh --write    # regenerate scripts/pod-loops/INSTALLED.json
#
# POD_HOST overrides the ssh host (default rp-3090-now). On the pod itself $LOOPS is read directly.
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
MIRROR=$ROOT/scripts/pod-loops
MANIFEST=$MIRROR/INSTALLED.json
DOC=$ROOT/docs/operations/POD-LOOPS.md
LOOPS=${POD_LOOPS_DIR:-/workspace/lanes/loops}
POD_HOST=${POD_HOST:-rp-3090-now}
WRITE=0; [ "${1:-}" = "--write" ] && WRITE=1

# The listing the pod itself produces: "<sha256>  <name>" per installed file, backups excluded.
# Backups are the pod's own *.bak-* / *.pre-* snapshots; they are not installed code.
LIST_CMD='cd '"$LOOPS"' 2>/dev/null || exit 9; for f in $(ls -p | grep -v / | grep -vE "\.bak|\.pre-"); do printf "%s  %s\n" "$(sha256sum "$f" | cut -d" " -f1)" "$f"; done'

if [ -d "$LOOPS" ]; then
  LIVE=$(bash -c "$LIST_CMD" 2>/dev/null); rc=$?; via=local
else
  LIVE=$(ssh -o BatchMode=yes -o ConnectTimeout=20 "$POD_HOST" "$LIST_CMD" 2>/dev/null); rc=$?; via=ssh:$POD_HOST
fi
if [ $rc -ne 0 ] || [ -z "$LIVE" ]; then
  echo "UNCHECKABLE pod-loops-drift via=$via rc=$rc — $LOOPS not readable; NOT reporting agreement"
  exit 2
fi

if [ "$WRITE" = "1" ]; then
  printf '%s\n' "$LIVE" | python3 "$MIRROR/../pod_loops_manifest.py" --write "$MANIFEST" --via "$via" || exit 1
  echo "WROTE $MANIFEST from $via ($(printf '%s\n' "$LIVE" | wc -l | tr -d ' ') installed files)"
  exit 0
fi

printf '%s\n' "$LIVE" | python3 "$MIRROR/../pod_loops_manifest.py" \
  --check "$MANIFEST" --mirror "$MIRROR" --doc "$DOC" --via "$via"
