#!/usr/bin/env bash
# Convenience runner — picks the venv that has Playwright when the system
# python3 doesn't. The Makefile targets above also work.
set -euo pipefail
cd "$(dirname "$0")"

SYSTEM_PY=$(command -v python3 || true)
VENV_PY="/Users/nicholas/dmtcartransport-website/.venv/bin/python3"

if [[ -n "${VENV_PY}" && -x "${VENV_PY}" ]] && "${VENV_PY}" -c "import playwright" 2>/dev/null; then
  PY="${VENV_PY}"
else
  if "${SYSTEM_PY}" -c "import playwright" 2>/dev/null; then
    PY="${SYSTEM_PY}"
  else
    echo "✗ Playwright not found in either venv. Run: make install" >&2
    exit 1
  fi
fi

echo "↪ Using python: ${PY}"
exec "${PY}" -m pytest "$@"
