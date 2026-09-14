#!/bin/bash
# Every ten minutes: turn paid commissions for already-installed Ollama models
# into byte-pinned jobs for the existing 24x7 worker. This does not download,
# grade, sign, anchor, publish or settle anything. The worker rescans its direct
# job directory each cycle, so an admitted job joins the existing serial queue.
#
# The jobs directory is read from the RUNNING worker's private state
# ($WORKER_STATE_DIR/health.json config_dir, valid only while its pid is alive and
# holds worker.lock). WORKER_JOBS_DIR is an explicit fallback used only when that
# does not resolve. Neither resolving is a HALT before the feed is fetched: a
# hard-coded release default once pointed at jobs-21ff8f50 while the worker
# scanned jobs-091a616a, so an admitted job would have landed where no worker reads.
#
# Every path defaults to the production pod layout; the overrides exist so the
# script can be exercised end to end against a throwaway workspace.
set -u
. "$(dirname "$0")/lib.sh"
[ "${1:-}" = "--now" ] || stamp commission-dispatch 10min || exit 0

# Serialize dispatch with the reviewed-control checkout refresh. The refresh
# holds this lock across its own explicit dispatch and sets the marker below;
# ordinary scheduler invocations refuse rather than read a half-updated tree.
if [ "${CSOAI_REVIEWED_CONTROL_HELD:-}" != "1" ]; then
  exec 9>"$STATE/runpod-reviewed-control.lock"
  if ! flock -n 9; then
    log commission-dispatch "HALT reviewed control update active"
    exit 75
  fi
fi

WORKSPACE_ROOT=${WORKSPACE_ROOT:-/workspace}
CONTROL_REPO=${CONTROL_REPO:-$WORKSPACE_ROOT/council-of-ai}
WORKER_STATE_DIR=${WORKER_STATE_DIR:-$WORKSPACE_ROOT/gspc-worker/state}
QUEUE_URL=${COMMISSION_QUEUE_URL:-https://councilof.ai/api/commission-queue}
OLLAMA_URL=${OLLAMA_URL:-http://127.0.0.1:11434}
DISPATCH_PY="$CONTROL_REPO/scripts/runpod_commission_dispatch.py"
FEED="$STATE/commission-feed.json"
REPORT="$OUT/commission-dispatch-latest.json"

if [ ! -r "$DISPATCH_PY" ] || [ ! -r "$CONTROL_REPO/scripts/generate_runpod_gspc_playlist.py" ]; then
  log commission-dispatch "HALT control repo scripts absent: $CONTROL_REPO"
  exit 2
fi

fallback=()
[ -n "${WORKER_JOBS_DIR:-}" ] && fallback=(--jobs-dir "$WORKER_JOBS_DIR")
resolved=$(PYTHONPATH="$CONTROL_REPO/scripts" python3 "$DISPATCH_PY" --resolve-jobs-dir \
  --worker-state-dir "$WORKER_STATE_DIR" ${fallback[@]+"${fallback[@]}"} 2>>"$LOGS/commission-dispatch.run.log")
rc=$?
if [ "$rc" -ne 0 ]; then
  log commission-dispatch "HALT worker jobs dir unresolved rc=$rc: ${resolved:-no resolver output} (restart the worker on a release that records config_dir, or set WORKER_JOBS_DIR)"
  exit 2
fi
jobs_source=${resolved%%$'\t'*}
WORKER_JOBS=${resolved#*$'\t'}

if ! curl -fsS -m 30 "$QUEUE_URL" -o "$FEED.tmp"; then
  rm -f "$FEED.tmp"
  log commission-dispatch "UNCHECKABLE commission feed unavailable"
  exit 1
fi
mv "$FEED.tmp" "$FEED"

PYTHONPATH="$CONTROL_REPO/scripts" python3 "$DISPATCH_PY" \
  --input "$FEED" \
  --workspace-root "$WORKSPACE_ROOT" \
  --bank-dir "$WORKSPACE_ROOT/banks-all" \
  --model-manifest-root "$WORKSPACE_ROOT/ollama-models/manifests" \
  --jobs-dir "$WORKER_JOBS" \
  --output-root "$WORKSPACE_ROOT/gspc-24x7" \
  --ollama-url "$OLLAMA_URL" \
  --source-revision "$(git -C "$CONTROL_REPO" rev-parse HEAD)" \
  --report "$REPORT" >>"$LOGS/commission-dispatch.run.log" 2>&1
rc=$?
if [ "$rc" -ne 0 ]; then
  log commission-dispatch "HALT dispatcher rc=$rc; see commission-dispatch.run.log"
  exit "$rc"
fi

summary=$(python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print("admitted=%d refused=%d created=%d existing=%d" % (len(d["admitted"]),len(d["refused"]),d["created"],d["already_present"]))' "$REPORT" 2>/dev/null)
log commission-dispatch "${summary:-HALT unreadable report} jobs_dir_source=$jobs_source"
