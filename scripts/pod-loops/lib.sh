#!/bin/bash
# Shared shell for the pod loops. Sourced, never executed.
# Layout (a LANES root; the pod's is /workspace/lanes, the persistent volume; nothing under /opt is touched):
#   $LANES/loops/   the scripts (this dir)
#   $LANES/logs/    one log per loop, one line per run, UTC-stamped
#   $LANES/out/     outputs (snapshots, jsonl, summaries); never deleted by any loop
#   $LANES/state/   idempotence stamps and "last seen" values
#   $LANES/.secrets/hf_token   legacy public-loop upload token (owner-placed, 0600)
# The private-intake heartbeat does not call hf_token_present(). Its uploader
# exclusively opens $LANES/.secrets/runpod-intake-hf-token.
#
# 3 Nov 2026: LANES used to default to /workspace/lanes whatever the host was. On a host
# that keeps its lanes under $HOME and has no /workspace volume, every run wrote its
# outputs to a path nobody reads and reported zero rows — a misconfiguration that looked
# like an empty measurement. Detect the root instead of assuming it, and refuse to run
# when there is none. An explicit LANES=... is still honoured as given.
if [ -z "${LANES:-}" ]; then
  if [ -d /workspace/lanes ]; then
    LANES=/workspace/lanes
  elif [ -d "$HOME/lanes" ]; then
    LANES="$HOME/lanes"
  else
    echo "lib.sh: LANES is unset and no lanes root was found (looked for /workspace/lanes and \$HOME/lanes)." >&2
    echo "lib.sh: set LANES=/path/to/lanes and re-run. Nothing was written." >&2
    exit 78
  fi
fi
# EXPORTED, so every child process inherits the resolved root. It was not: the loops that
# publish call scripts/pod-loops/hf_upload.py, which had its own /workspace/lanes default,
# and on a host without that volume the upload died on a permission error after the rows
# were already written — the run looked published and was not.
export LANES
LOOPS=$LANES/loops
LOGS=$LANES/logs
OUT=$LANES/out
STATE=$LANES/state
REPO=$LANES/councilof-ai
# $REPO is a SPARSE clone of the bare repo (/workspace/git/councilof-ai.git). This is the set it must carry,
# in one place. Before 2026-09-25 it held scripts/grants scripts/hf scripts/census harness/gspc-top100;
# cross-ledger.sh adds scripts/readers + scripts/adapters (the reader imports scripts.adapters) and
# hitl-probe-weekly.sh adds scripts/hitl. A loop that needs a path calls repo_sparse_ensure before reading it.
REPO_SPARSE="scripts/grants scripts/hf scripts/census harness/gspc-top100 scripts/readers scripts/adapters scripts/hitl"
mkdir -p "$LOGS" "$OUT" "$STATE"

now() { date -u +%Y-%m-%dT%H:%M:%SZ; }
today() { date -u +%Y-%m-%d; }

# log <logfile-basename> <line...>  -> appends "<ts> <line>" to $LOGS/<name>.log and echoes it
log() { local f="$LOGS/$1.log"; shift; local line="$(now) $*"; echo "$line" >> "$f"; echo "$line"; }

# stamp <key> [period]  -> 0 if this period's stamp is absent (and writes it), 1 if already done.
# period "day" (default) = once per UTC date; "hour" = once per UTC hour; "10min" = once per 10-min slot.
stamp() {
  local key=$1 period=${2:-day} slot
  case $period in
    day)   slot=$(date -u +%Y-%m-%d) ;;
    hour)  slot=$(date -u +%Y-%m-%dT%H) ;;
    10min) slot=$(date -u +%Y-%m-%dT%H)$(( 10#$(date -u +%M) / 10 )) ;;
  esac
  local f="$STATE/$key.stamp"
  if [ -f "$f" ] && [ "$(cat "$f")" = "$slot" ]; then return 1; fi
  echo "$slot" > "$f"; return 0
}

# Legacy public-loop HF token: read from its file, else a NON-EMPTY $HF_TOKEN. Never echoed.
# The pod's own doc (docs/operations/RUNPOD-POD-TO-HF-PUSH.md) records that HF_TOKEN was once
# exported EMPTY here, so an empty string is treated as absent.
hf_token_present() {
  if [ -s "$LANES/.secrets/hf_token" ]; then export HF_TOKEN="$(tr -d '[:space:]' < "$LANES/.secrets/hf_token")"; fi
  [ -n "${HF_TOKEN:-}" ]
}

# process liveness without the pgrep self-match trap: the bracket makes the pattern not match itself.
alive() { ps -eo pid,args | grep -v grep | grep -q -- "$1"; }
pids_of() { ps -eo pid,args | grep -v grep | grep -- "$1" | awk '{print $1}'; }

disk_free_gb() { df -BG --output=avail "$1" | tail -1 | tr -dc '0-9'; }

# repo_sparse_ensure [path...] -> adds each path (default: all of $REPO_SPARSE) that $REPO's sparse set lacks.
# Never removes a path and never touches a clone that is not sparse (a full clone already has everything).
repo_sparse_ensure() {
  [ -d "$REPO/.git" ] || { echo "repo_sparse_ensure: $REPO is not a clone"; return 1; }
  [ "$(git -C "$REPO" config --get core.sparseCheckout)" = "true" ] || return 0
  local have p missing=""
  have=$(git -C "$REPO" sparse-checkout list 2>/dev/null)
  for p in ${*:-$REPO_SPARSE}; do printf '%s\n' "$have" | grep -qxF "$p" || missing="$missing $p"; done
  [ -z "$missing" ] || git -C "$REPO" sparse-checkout add $missing
}

# Third-party Python packages for the loops live on /workspace so a container wipe cannot remove them
# (25 Sep 2026: huggingface_hub et al. vanished with /root). List: requirements-pod.txt; lock: /workspace/tools/pylib.lock
# That path is pod-shaped. A host without it keeps its own site-packages, so the path is added only
# when it is there — prepending a directory that does not exist would only shadow nothing and hide it.
if [ -d /workspace/tools/pylib ]; then
  export PYTHONPATH=/workspace/tools/pylib${PYTHONPATH:+:$PYTHONPATH}
fi
