#!/bin/bash
# runpod-pod-keepalive.sh — keep the estate's RunPod pods up, and say why when it cannot.
#
# WHY (2026-10-30). The estate's compute lane is three RunPod CPU pods, all created with
# gpuCount 0 on purpose: scripts/ops/resume-3090.sh refuses to start Ollama on a CPU-only pod
# because "serving the models on CPU would be an instrument change". So the CPU pods are not a
# degraded GPU pod - they are the compute lane as designed. What they DO need is to be RUNNING,
# and nothing in the estate was checking that.
#
# Two rules this script follows, both learned from the substrate incident:
#
#   1. DESIRED IS NOT ACTUAL. `desiredStatus` says what we asked RunPod for; `runtimeStatus`
#      says what the container is actually doing. A pod can be desired RUNNING while its
#      runtimeStatus is "stopped" or "terminated". The keepalive reads runtimeStatus, and
#      reports the disagreement (DRIFTED) rather than trusting either field alone.
#   2. A POD THAT IS "RUNNING" BUT NOT SERVING IS NOT HEALTHY. The container can be up while
#      the volume under it is losing every write (the 29-30 Oct incident). So the keepalive also
#      probes the pod's own service endpoint and reports SERVING_DEGRADED for a pod whose
#      container is up but whose service does not answer.
#
# It never starts a pod it was not told to manage, never prints a credential, and never acts
# without checking the balance first: the estate's floor is MIN_BALANCE (5), because a pod that
# cannot be paid for is a pod that cannot be started.
#
# Usage:
#   runpod-pod-keepalive.sh --once        # one pass, then exit
#   runpod-pod-keepalive.sh --dry-run     # report what it would do, change nothing
#   runpod-pod-keepalive.sh               # loop every INTERVAL seconds (for launchd)
#
# Env:
#   RUNPOD_PODS   space-separated pod names or ids to manage (default: the estate's three)
#   MIN_BALANCE   refuse to start below this balance (default: 5, the estate's floor)
#   RUNPOD_POD_HEALTH  "name=url,name=url" - per-pod service endpoints that ARE reachable
#                      from here. Pods without an entry are reported UNPROBED, never DEGRADED.
#   LOG           log file (default: $HOME/.csoai/runpod-keepalive.log)

set -uo pipefail

INTERVAL=${INTERVAL:-300}
MIN_BALANCE=${MIN_BALANCE:-5}
HEALTH_URL=${HEALTH_URL:-http://127.0.0.1:15430/api/v1/bases?limit=1}
LOG=${LOG:-$HOME/.csoai/runpod-keepalive.log}
RUNPOD_PODS=${RUNPOD_PODS:-"meok-him-production-20261027 council-os-benchmark-live-20261027 csoai-build-cpu-writer-20261001"}
ONCE=0
DRY=0
for a in "$@"; do
  case "$a" in
    --once) ONCE=1 ;;
    --dry-run) DRY=1 ;;
    *) echo "unknown argument: $a" >&2; exit 64 ;;
  esac
done

mkdir -p "$(dirname "$LOG")" 2>/dev/null
log() { echo "$(date -u +%FT%TZ) $*" >> "$LOG" 2>/dev/null; echo "$*"; }
have_runpodctl() { command -v runpodctl >/dev/null 2>&1; }

balance() {
  have_runpodctl || { echo 0; return; }
  runpodctl user 2>/dev/null | python3 -c 'import json,sys
try: print(json.load(sys.stdin).get("clientBalance",0))
except Exception: print(0)'
}

# service_answers <url> - is the pod's own service answering?
#
# Only a pod whose address is REACHABLE from here can be probed. The estate's pods are remote:
# the main one is reached through the M4's ssh tunnel on 127.0.0.1:15430, and the others have no
# route from the operator's machine at all. Probing a name that does not resolve and then
# reporting DEGRADED would be a false accusation - the same failure mode as calling 102 valid
# OTS proofs "invalid" because a parser was missing. So: probe only where a route exists, and
# report the pod's service as UNPROBED where it does not. A state you did not measure is not a
# state you may publish.
#
# RUNPOD_POD_HEALTH="name=url,name=url" - one entry per pod that can be probed.
health_url_for() {
  local pod=$1 entry name url
  for entry in ${RUNPOD_POD_HEALTH:-}; do
    name=${entry%%=*}
    url=${entry#*=}
    [ "$name" = "$pod" ] && { printf '%s' "$url"; return 0; }
  done
  return 1
}

service_answers() {
  local url=$1
  [ -n "$url" ] || return 2
  curl -s -m 12 -o /dev/null -w '%{http_code}' "$url" 2>/dev/null | grep -q '^200$'
}

rows_file=$(mktemp -t runpod-keepalive-rows)
trap 'rm -f "$rows_file"' EXIT

collect_rows() {
  have_runpodctl || { log "runpodctl not found - nothing to do"; return 0; }
  local pods_json bal
  pods_json=$(runpodctl pod list --all 2>/dev/null)
  if [ -z "$pods_json" ]; then
    log "runpodctl pod list returned nothing - skipping this pass (fail closed, nothing changed)"
    return 0
  fi
  bal=$(balance)
  RUNPOD_PODS="$RUNPOD_PODS" BAL="$bal" MIN_BALANCE="$MIN_BALANCE" python3 -c '
import json, os, sys
want = [w for w in os.environ.get("RUNPOD_PODS", "").split() if w]
bal = os.environ.get("BAL", "0") or "0"
try:
    pods = json.load(sys.stdin)
except Exception as exc:
    print("PARSE_ERROR\t%s" % exc, file=sys.stderr); sys.exit(0)
for p in pods:
    name = p.get("name") or ""
    pid = p.get("id") or ""
    if want and not any(w == name or w == pid for w in want):
        continue
    print("ROW\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s" % (
        pid, name, p.get("runtimeStatus") or "unknown",
        p.get("desiredStatus") or "?", p.get("uptimeSeconds") or 0,
        p.get("costPerHr"), bal, p.get("imageName") or ""))
' <<< "$pods_json" > "$rows_file"
  [ -s "$rows_file" ] || log "no managed pods matched RUNPOD_PODS=\"$RUNPOD_PODS\" - nothing to do"
}

act_on_rows() {
  local tag pid name rt ds up cost bal image
  while IFS=$'\t' read -r tag pid name rt ds up cost bal image; do
    [ "$tag" = "ROW" ] || continue
    if [ "$rt" = "running" ]; then
      local health="UNPROBED" hurl
      if hurl=$(health_url_for "$name"); then
        if service_answers "$hurl"; then health="SERVING"; else health="SERVING_DEGRADED"; fi
      fi
      log "OK      $name ($pid) runtimeStatus=running health=$health uptime=${up}s cost=${cost}perhr balance=$bal"
      continue
    fi
    if [ "$ds" = "RUNNING" ]; then
      log "DRIFTED $name ($pid) desiredStatus=RUNNING but runtimeStatus=$rt - the container is not what we asked for"
    else
      log "STOPPED $name ($pid) runtimeStatus=$rt desiredStatus=$ds"
    fi
    if [ "$DRY" = "1" ]; then
      log "DRY-RUN would start $name ($pid) if balance >= $MIN_BALANCE (balance=$bal)"
      continue
    fi
    if awk "BEGIN{exit !($bal < $MIN_BALANCE)}"; then
      log "SKIP    $name - balance $bal is below the floor $MIN_BALANCE; a pod that cannot be paid for cannot be started"
      continue
    fi
    log "START   $name ($pid) - runtimeStatus=$rt, balance=$bal"
    out=$(runpodctl pod start "$pid" 2>&1)
    if [ $? -eq 0 ]; then
      log "STARTED $name ($pid) - $(printf '%s' "$out" | head -2 | tr '\n' ' ')"
    else
      log "FAILED  $name ($pid) - $(printf '%s' "$out" | grep -iE 'gpu|balance|error' | head -3 | tr '\n' ' ')"
      case "$out" in
        *"not enough free GPUs"*)
          log "        The host's GPU was re-let while the pod was stopped. There is NO scripted zero-GPU resume: the runpodctl key is REST-only and GraphQL answers 401, so the console choice is a human act." ;;
      esac
    fi
  done < "$rows_file"
}

one_pass() {
  collect_rows
  act_on_rows
}

if [ "$ONCE" = "1" ] || [ "$DRY" = "1" ]; then
  one_pass
  exit 0
fi

log "keepalive started (interval=${INTERVAL}s, floor=\$$MIN_BALANCE, pods: $RUNPOD_PODS)"
while true; do
  one_pass
  sleep "$INTERVAL"
done
