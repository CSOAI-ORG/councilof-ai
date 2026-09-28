#!/bin/bash
# harness-x-parity.sh — daily on the pod: every LIVE Layer 0 channel against the single source.
#
# STAGED 2026-09-28 (lane harness-x-20260928): registered in the repository's scheduler.sh at 08:15Z;
# it runs only once scheduler.sh and this file are installed under /workspace/lanes/loops.
#
#   declaration  council-os/distribution.json#published_channels — the three PyPI adapters, the
#                csoai-gspc client, npm csoai-gspc-mcp / @csoai/*, the HF MCP Space, both MCP Registry
#                names, the councilof.ai door and its well-known descriptors, and the rendered-only
#                targets (reported UNCHECKABLE until they are listed).
#   check        python3 scripts/harness-x/parity_live.py --out out/harness-x-parity/<UTC date>.json
#                Per channel: CONSISTENT, INCONSISTENT (every disagreement quotes source AND live), or
#                UNCHECKABLE (unreadable or unpublished — never counted as agreement). Same version with
#                different bytes is INCONSISTENT: PyPI and npm refuse the re-upload, so the source must move.
#   install      Sundays also --install: each package installed from the public registry into a fresh
#                venv / npm cache under a new temp dir and run against the live board, holding
#                /workspace/locks/heavy.lock (the build pod is 2 vCPU / 4 GB).
#   receipt      ONE RESULT line per run in logs/harness-x-parity.log. "all consistent" is a line too:
#                a loop with no log line never ran.
#
# It never publishes, submits, authenticates or holds a token: GETs, plus read-only MCP initialize,
# tools/list and one call of the free board_totals reader.
#
# THE STAMP IS THE SCHEDULER'S. It passes --now and owns the day stamp on its own line; with --now this
# script must not stamp itself (a second write finds the first and the run exits having measured nothing).
# Run by hand WITHOUT --now, it stamps, so a duplicate hand run is a no-op.
set -u
. "$(dirname "$0")/lib.sh"
exec 6>"$STATE/harness-x-parity.lock"
flock -n 6 || { log harness-x-parity "SKIP previous run still holds the lock"; exit 0; }
if [ "${1:-}" = "--now" ]; then shift; else stamp harness-x-parity || exit 0; fi

CLONE=${HXP_CLONE:-/workspace/ci/harness-x-parity}
BARE=${HXP_BARE:-/workspace/git/councilof-ai.git}
REF=${HXP_REF:-origin/master}
OUTD="$OUT/harness-x-parity"
mkdir -p "$OUTD"
export PATH=/workspace/tools/node/bin:$PATH

# One clone per purpose, sparse: the shared checkouts on this pod get reset --hard under whoever uses them.
if [ ! -d "$CLONE/.git" ]; then
  git clone -q --no-checkout "$BARE" "$CLONE" || { log harness-x-parity "FAIL could not clone $BARE"; exit 1; }
  # git 2.34 here: "set --cone" would take --cone as a PATH; init --cone first, then set.
  git -C "$CLONE" sparse-checkout init --cone && git -C "$CLONE" sparse-checkout set council-os distribution scripts/harness-x scripts/spray/pypi/csoai-gspc \
    mcp/gspc-server functions/mcp packages/layer0-js public/.well-known \
    || { log harness-x-parity "FAIL sparse-checkout"; exit 1; }
fi
git -C "$CLONE" fetch -q origin || { log harness-x-parity "FAIL fetch origin"; exit 1; }
git -C "$CLONE" checkout -q --detach "$REF" || { log harness-x-parity "FAIL checkout $REF"; exit 1; }
HEAD=$(git -C "$CLONE" rev-parse --short HEAD)

REPORT="$OUTD/$(today).json"
ARGS=(--out "$REPORT")
MODE=live
if [ "$(date -u +%u)" = "7" ] || [ "${HXP_INSTALL:-0}" = "1" ]; then
  INST=$(mktemp -d "${TMPDIR:-/tmp}/harness-x-parity-install.XXXXXX") || { log harness-x-parity "FAIL mktemp"; exit 1; }
  ARGS+=(--install "$INST")
  MODE="live+install($INST)"
  mkdir -p /workspace/locks
  RUN=(flock /workspace/locks/heavy.lock timeout 3000 python3 "$CLONE/scripts/harness-x/parity_live.py" "${ARGS[@]}")
else
  RUN=(timeout 900 python3 "$CLONE/scripts/harness-x/parity_live.py" "${ARGS[@]}")
fi

"${RUN[@]}" >"$OUTD/$(today).txt" 2>&1
rc=$?
LAST=$(grep '^RESULT harness-x-parity' "$OUTD/$(today).txt" | tail -1)
if [ -n "$LAST" ]; then
  log harness-x-parity "$LAST head=$HEAD mode=$MODE rc=$rc report=$REPORT"
else
  log harness-x-parity "FAIL no RESULT line (rc=$rc) head=$HEAD mode=$MODE; see $OUTD/$(today).txt"
fi
# rc 1 = at least one channel INCONSISTENT: a finding, recorded above, not a crash of this loop.
[ "$rc" -le 1 ] || exit "$rc"
exit 0
