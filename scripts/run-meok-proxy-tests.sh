#!/usr/bin/env bash
# Run the MEOK MCP → SOV3 proxy-path suite (16 tests).
# Used by .githooks/pre-commit, .githooks/pre-push, and CI.
# Exit non-zero on any failure so commits/pushes cannot land a regression.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PY="${MEOK_TEST_PYTHON:-}"
if [[ -z "$PY" ]]; then
  for cand in /opt/homebrew/bin/python3.11 python3.11 python3; do
    if command -v "$cand" >/dev/null 2>&1 && "$cand" -c 'import pytest,fastapi' 2>/dev/null; then
      PY="$cand"
      break
    fi
  done
fi
if [[ -z "$PY" ]]; then
  echo "run-meok-proxy-tests: no Python with pytest+fastapi found" >&2
  exit 1
fi

export PYTHONPATH="$ROOT${PYTHONPATH:+:$PYTHONPATH}"
# Third-party pytest plugins (ddtrace/langsmith) can stall hooks/CI — disable autoload.
export PYTEST_DISABLE_PLUGIN_AUTOLOAD=1

# Live tests read MEOK_MASTER_API_KEY from the environment.
# Without it (or without :3102) they skip; unit tests still gate the commit.
if [[ "${MEOK_TEST_UNIT_ONLY:-0}" == "1" ]]; then
  exec "$PY" -m pytest meok/mcp/tests/test_proxy_path.py -q -k 'not Live'
else
  exec "$PY" -m pytest meok/mcp/tests/test_proxy_path.py -q
fi
