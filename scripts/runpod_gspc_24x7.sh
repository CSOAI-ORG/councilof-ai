#!/usr/bin/env bash
set -euo pipefail

worker_source="${1:-/workspace/gspc-worker/jobs}"
repo_dir="${CSOAI_REPO_DIR:-/workspace/council-of-ai}"

if [[ ! -r "$worker_source" ]]; then
  echo "HALT: unreadable worker config or playlist: $worker_source" >&2
  exit 2
fi

if [[ ! -r "$repo_dir/scripts/runpod_gspc_worker.py" ]]; then
  echo "HALT: worker not found under CSOAI_REPO_DIR: $repo_dir" >&2
  exit 2
fi

if [[ -d "$worker_source" ]]; then
  source_args=(--config-dir "$worker_source" --state-dir /workspace/gspc-worker/state)
else
  source_args=(--config "$worker_source")
fi

exec python3 "$repo_dir/scripts/runpod_gspc_worker.py" \
  "${source_args[@]}" \
  --forever \
  --health-bind 0.0.0.0 \
  --health-port 8888
