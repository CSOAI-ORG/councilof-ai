#!/bin/bash
# Every 10 minutes: is the GSPC worker alive (process + GET :8888/health), is the GGUF mill alive,
# are the two ollama daemons listening. Restarts ONLY the GSPC worker, and only when
# (a) no worker process exists and (b) /workspace has >= 20 GB free (README-LANES disk rule; the
# worker's own low-water mark is 4 GiB and it died of ENOSPC at 08:12Z on 6 Sep while the mill was
# pulling models). The mill is NOT restarted here: it is launched by hand by another lane with
# explicit shard arguments (gguf-mill-driver2.py <release> <shard> <shards>) and the lanes runbook
# has no restart recipe for it — a dead mill is logged as ALERT for a human.
# Liveness is read from `ps -eo pid,args` with a bracketed pattern, never `pgrep -f` (self-match trap).
set -u
. "$(dirname "$0")/lib.sh"
[ "${1:-}" = "--now" ] || stamp watchdog 10min || exit 0

WORKER_REL=${WORKER_REL:-21ff8f50}
WORKER_PY=/workspace/gspc-worker/releases/$WORKER_REL/scripts/runpod_gspc_worker.py
WORKER_JOBS=/workspace/gspc-worker/jobs-$WORKER_REL
WORKER_STATE=/workspace/gspc-worker/state
WORKER_LOG=/workspace/gspc-worker/worker-$WORKER_REL.log
MIN_FREE_GB=20

# The 24x7 worker is the one with --forever (and the :8888 listener). The GGUF mill spawns the SAME
# script per cell as `runpod_gspc_worker.py --config <cell> ...` (no --forever): those are mill cells,
# counted separately, and on 6 Sep they made a dead 24x7 worker read as alive until this was split.
w_pids=$(pids_of "[r]unpod_gspc_worker.py .*--forever" | tr '\n' ',' | sed 's/,$//')
m_cells=$(pids_of "[r]unpod_gspc_worker.py --config " | grep -v -- --forever | wc -l | tr -d ' ')
m_pids=$(pids_of "[g]guf-mill-driver2.py" | tr '\n' ',' | sed 's/,$//')
h_code=$(curl -s -m 5 -o /tmp/wd-health.json -w '%{http_code}' http://127.0.0.1:8888/health 2>/dev/null); h_code=${h_code:-000}
h_state=$(python3 -c 'import json;d=json.load(open("/tmp/wd-health.json"));print(d.get("state"),d.get("detail_code"),d.get("job"))' 2>/dev/null | tr ' ' '/')
o11434=$(ss -ltn 2>/dev/null | grep -q ':11434 ' && echo up || echo DOWN)
o11500=$(ss -ltn 2>/dev/null | grep -q ':11500 ' && echo up || echo down)
free=$(disk_free_gb /workspace)
gpu=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits 2>/dev/null | head -1)

line="worker_pids=${w_pids:-NONE} health=$h_code ${h_state:-} mill_pids=${m_pids:-NONE} mill_cells=$m_cells ollama11434=$o11434 ollama11500=$o11500 free_gb=$free gpu_mib=${gpu:-?}"
log watchdog "$line"

if [ -z "$w_pids" ]; then
  if [ "$free" -lt "$MIN_FREE_GB" ]; then
    log watchdog "ALERT worker DEAD; NOT restarted: /workspace free ${free}G < ${MIN_FREE_GB}G (mill pulls are filling the disk)"
  else
    # Ollama on :11434 is the worker's ollama_url (job configs); without it every run is a transport error.
    if [ "$o11434" != up ]; then
      log watchdog "ALERT worker DEAD; NOT restarted: ollama :11434 is not listening"
    else
      cd /workspace/gspc-worker && nohup python3 "$WORKER_PY" --config-dir "$WORKER_JOBS" --state-dir "$WORKER_STATE" \
        --forever --health-bind 0.0.0.0 --health-port 8888 >> "$WORKER_LOG" 2>&1 &
      sleep 8
      new=$(pids_of "[r]unpod_gspc_worker.py .*--forever" | tr '\n' ',' | sed 's/,$//')
      hc=$(curl -s -m 5 -o /dev/null -w '%{http_code}' http://127.0.0.1:8888/health 2>/dev/null); hc=${hc:-000}
      log watchdog "RESTARTED worker release=$WORKER_REL pids=${new:-NONE} health=$hc (last log line: $(tail -1 "$WORKER_LOG" | cut -c1-160))"
    fi
  fi
elif [ "$h_code" != 200 ]; then
  log watchdog "ALERT worker process alive but health=$h_code state=${h_state:-?} (503 = error/low-disk state; not restarted)"
fi
[ -z "$m_pids" ] && log watchdog "ALERT mill DEAD (no gguf-mill-driver2.py); not restarted by design — see header"
[ "$o11434" != up ] && log watchdog "ALERT ollama :11434 DOWN"
exit 0
