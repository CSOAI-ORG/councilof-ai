#!/bin/bash
# Shared shell for the pod loops. Sourced, never executed.
# Layout (all under /workspace, the persistent volume; nothing under /opt is touched):
#   /workspace/lanes/loops/   the scripts (this dir)
#   /workspace/lanes/logs/    one log per loop, one line per run, UTC-stamped
#   /workspace/lanes/out/     outputs (snapshots, jsonl, summaries); never deleted by any loop
#   /workspace/lanes/state/   idempotence stamps and "last seen" values
#   /workspace/lanes/.secrets/hf_token   legacy public-loop upload token (owner-placed, 0600)
# The private-intake heartbeat does not call hf_token_present(). Its uploader
# exclusively opens /workspace/lanes/.secrets/runpod-intake-hf-token.
LANES=${LANES:-/workspace/lanes}
LOOPS=$LANES/loops
LOGS=$LANES/logs
OUT=$LANES/out
STATE=$LANES/state
REPO=$LANES/councilof-ai
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

# ---- pod chain (land → sign → root → ots; scripts land.sh sign.sh root.sh ots.sh) -----------
# chain_repo  -> the checkout the chain reads and writes (CHAIN_REPO overrides $REPO).
chain_repo() { echo "${CHAIN_REPO:-$REPO}"; }
# chain_dry   -> 0 (true) when DRY_RUN=1: print what would run, write nothing, stamp nothing.
chain_dry() { [ "${DRY_RUN:-0}" = "1" ]; }
# chain_log <stage> <inputs_count> <outputs_count> <sha256-of-outputs-list> <cmd...>
#   ONE line per run in $LOGS/chain.log: "<utc> <stage> <in> <out> <sha> <cmd>". The sha is
#   chain_tools.py new's digest over the "sha256  path" lines this run produced (content-
#   bound), so two machines producing identical bytes log identical digests. A dry run logs
#   stage "<stage>[dry]" with "-" for the sha. A stage with nothing to do still logs: no line
#   in chain.log means the stage never ran (silent-no-op doctrine).
chain_log() {
  local stage=$1 nin=$2 nout=$3 sha=$4; shift 4
  local line="$(now) $stage $nin $nout $sha $*"
  echo "$line" >> "$LOGS/chain.log"; echo "$line"
}
# chain_slot <name> [--now]  -> proceed (0) or already done this UTC hour (1). --now and
#   DRY_RUN bypass the stamp; the scheduler passes --now because it stamps before spawning.
chain_slot() {
  local name=$1 flag=${2:-}
  if chain_dry || [ "$flag" = "--now" ]; then return 0; fi
  stamp "chain-$name" hour
}
# chain_tools.py sits beside THIS file (the repo's scripts/pod-loops or the pod's $LOOPS install).
CHAIN_TOOLS=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/chain_tools.py
