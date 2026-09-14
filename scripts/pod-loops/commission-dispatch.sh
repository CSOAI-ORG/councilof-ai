#!/bin/bash
# Every ten minutes: turn paid commissions for already-installed Ollama models
# into byte-pinned jobs for the existing 24x7 worker. This does not download,
# grade, sign, anchor, publish or settle anything. The worker rescans its direct
# job directory each cycle, so an admitted job joins the existing serial queue.
set -u
. "$(dirname "$0")/lib.sh"
[ "${1:-}" = "--now" ] || stamp commission-dispatch 10min || exit 0

WORKER_REL=${WORKER_REL:-21ff8f50}
WORKER_JOBS=/workspace/gspc-worker/jobs-$WORKER_REL
CONTROL_REPO=/workspace/council-of-ai
FEED="$STATE/commission-feed.json"
REPORT="$OUT/commission-dispatch-latest.json"

if [ ! -d "$WORKER_JOBS" ] || [ ! -r "$CONTROL_REPO/scripts/generate_runpod_gspc_playlist.py" ]; then
  log commission-dispatch "HALT worker release/jobs absent release=$WORKER_REL"
  exit 2
fi
if ! curl -fsS -m 30 https://councilof.ai/api/commission-queue -o "$FEED.tmp"; then
  rm -f "$FEED.tmp"
  log commission-dispatch "UNCHECKABLE commission feed unavailable"
  exit 1
fi
mv "$FEED.tmp" "$FEED"

PYTHONPATH="$CONTROL_REPO/scripts" python3 "$CONTROL_REPO/scripts/runpod_commission_dispatch.py" \
  --input "$FEED" \
  --workspace-root /workspace \
  --bank-dir /workspace/banks-all \
  --model-manifest-root /workspace/ollama-models/manifests \
  --jobs-dir "$WORKER_JOBS" \
  --output-root /workspace/gspc-24x7 \
  --source-revision "$(git -C "$CONTROL_REPO" rev-parse HEAD)" \
  --report "$REPORT" >>"$LOGS/commission-dispatch.run.log" 2>&1
rc=$?
if [ "$rc" -ne 0 ]; then
  log commission-dispatch "HALT dispatcher rc=$rc; see commission-dispatch.run.log"
  exit "$rc"
fi

summary=$(python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); print("admitted=%d refused=%d created=%d existing=%d" % (len(d["admitted"]),len(d["refused"]),d["created"],d["already_present"]))' "$REPORT" 2>/dev/null)
log commission-dispatch "${summary:-HALT unreadable report}"
