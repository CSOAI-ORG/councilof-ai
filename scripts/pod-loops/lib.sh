#!/bin/bash
# Shared shell for the pod loops. Sourced, never executed.
# Layout (all under /workspace, the persistent volume; nothing under /opt is touched):
#   /workspace/lanes/loops/   the scripts (this dir)
#   /workspace/lanes/logs/    one log per loop, one line per run, UTC-stamped
#   /workspace/lanes/out/     outputs (snapshots, jsonl, summaries); never deleted by any loop
#   /workspace/lanes/state/   idempotence stamps and "last seen" values
#   /workspace/lanes/.secrets/hf_token   the ONLY place a loop reads an HF token from (owner-placed, 0600)
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

# HF token: read from the one file, else from a NON-EMPTY $HF_TOKEN. Never echoed.
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
