#!/bin/bash
# SOV3 — FOREGROUND launcher for the launchd keeper (com.meok.sov3-keeper).
# Same env setup as run-local.sh, but EXECs the server in the foreground so launchd
# owns the process and can KeepAlive it across crashes/reboots. Do NOT background here.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
export PORT="${PORT:-3101}"

# PostgreSQL (memory store)
if ! pg_isready -q 2>/dev/null; then
  brew services start postgresql@15 2>/dev/null || brew services start postgresql 2>/dev/null || true
  sleep 2
fi

# Python (prefer venv)
PYTHON="$SCRIPT_DIR/.venv/bin/python"
[[ -x "$PYTHON" ]] || PYTHON="python3"

# .env
if [[ -f "$ENV_FILE" ]]; then
  set -a; source "$ENV_FILE"; set +a
else
  export PORT=3101
  export POSTGRES_DSN="postgresql://sovereign:sovereign@localhost:5432/sovereign_memory"
  export APP_ENV=development
fi

# Keystone secret overlay (sovereign source of truth; additive, non-fatal if absent)
KEYSTONE="${KEYSTONE_BIN:-$HOME/clawd/keystone/keystone}"
if [[ -x "$KEYSTONE" ]]; then
  while IFS= read -r _kn; do
    [ -n "$_kn" ] || continue
    _kv="$("$KEYSTONE" get "$_kn" 2>/dev/null)" && [ -n "$_kv" ] && export "$_kn=$_kv" || true
  done < <("$KEYSTONE" list 2>/dev/null | awk '/^[[:space:]]+[A-Z]/{print $1}') || true
  unset _kv 2>/dev/null || true
fi

cd "$SCRIPT_DIR"
unset MallocStackLogging 2>/dev/null || true
export PYTHONPATH="$SCRIPT_DIR${PYTHONPATH:+:$PYTHONPATH}"
# FOREGROUND exec — launchd tracks THIS pid and restarts it if it dies.
exec "$PYTHON" sovereign-mcp-server.py
