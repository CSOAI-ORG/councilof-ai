#!/usr/bin/env bash
# prerender-run.sh — run scripts/prerender.mjs so that it isolates itself from every other
# lane on this machine.
#
# WHY THIS EXISTS. The wrapper lanes used before 2026-08-26 cleaned up like this:
#
#     lsof -tiTCP:4400 -sTCP:LISTEN | xargs -r kill -9
#     pkill -f "chrome-headless-shell"
#
# Both lines are machine-wide. `pkill -f chrome-headless-shell` kills EVERY headless browser on
# the box, whatever port it was bound to and whichever run launched it; the lsof line kills
# whoever holds 4400 even when this run never used 4400. On 2026-08-26 two lanes prerendered at
# once and the second died at 143 of 582 routes with 439 "Target page, context or browser has
# been closed" — the other lane's cleanup had killed its browser.
#
# WHAT THIS DOES INSTEAD. prerender.mjs writes its node pid, its browser pid and the port it
# actually bound to a per-run state file. Cleanup here kills only those pids, and only touches
# the port this run used — and then only if the process holding it descends from this run.
# Nothing outside this run's own process tree is ever signalled.
#
#   bash scripts/prerender-run.sh --dist dist/client --wait 900 --min 350
#
# Every argument is passed straight through to prerender.mjs. Omit --port and the run takes a
# free OS-assigned port, so concurrent lanes never contend at all.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_DIR="$(mktemp -d "${TMPDIR:-/tmp}/prerender-run.XXXXXX")"
STATE="$RUN_DIR/run.json"
NODE_PID=""

# Read one field out of the run-state file. Absent file or field yields "".
state_field() {
  [ -f "$STATE" ] || return 0
  node -e '
    const fs = require("node:fs");
    try {
      const v = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))[process.argv[2]];
      if (v !== null && v !== undefined) process.stdout.write(String(v));
    } catch {}
  ' "$STATE" "$1" 2>/dev/null
}

alive() { [ -n "${1:-}" ] && kill -0 "$1" 2>/dev/null; }

# True when $1 is $2 or a descendant of it. This is the guard that keeps every kill scoped to
# this run: a pid we did not start is never signalled, no matter what it is holding.
descends_from() {
  local pid="${1:-}" root="${2:-}" hops=0
  [ -n "$pid" ] && [ -n "$root" ] || return 1
  while [ -n "$pid" ] && [ "$pid" != "0" ] && [ "$pid" != "1" ] && [ "$hops" -lt 24 ]; do
    [ "$pid" = "$root" ] && return 0
    pid="$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ')"
    hops=$((hops + 1))
  done
  return 1
}

# TERM, then KILL only if it is still there. Never a pattern match, always a pid.
stop_pid() {
  local pid="${1:-}" label="${2:-process}" i
  alive "$pid" || return 0
  echo "prerender-run: stopping orphan $label pid $pid" >&2
  kill -TERM "$pid" 2>/dev/null
  for i in 1 2 3 4 5 6 7 8 9 10; do
    alive "$pid" || return 0
    sleep 0.5
  done
  kill -KILL "$pid" 2>/dev/null
}

cleanup() {
  local browser_pid port holder
  browser_pid="$(state_field browserPid)"
  port="$(state_field port)"

  # 1. This run's node process (it owns the HTTP server).
  stop_pid "$NODE_PID" "prerender node"
  # 2. This run's browser, by the pid prerender.mjs reported — not by process name.
  stop_pid "$browser_pid" "browser"
  # 3. This run's port, and only if the listener is ours. A foreign process on that port is
  #    left alone: it belongs to another lane and is none of our business.
  if [ -n "$port" ] && command -v lsof >/dev/null 2>&1; then
    for holder in $(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null); do
      if descends_from "$holder" "$NODE_PID"; then
        stop_pid "$holder" "listener on port $port"
      else
        echo "prerender-run: port $port held by pid $holder outside this run — leaving it alone" >&2
      fi
    done
  fi
  rm -rf "$RUN_DIR"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

cd "$REPO_ROOT" || exit 1
node scripts/prerender.mjs --run-state "$STATE" "$@" &
NODE_PID=$!
wait "$NODE_PID"
STATUS=$?
NODE_PID=""   # exited on its own; cleanup has nothing of its to stop
exit "$STATUS"
