#!/bin/bash
# busabase-instance.sh — start, stop or check ONE Busabase 0.95.1 instance, loopback only.
# Written 13 Oct 2026 by the Claude worker on lane busabase-cutover-prep (main Claude session, M4).
#
#   busabase-instance.sh start  <instance-dir> <port>     start in the background, print the pid
#   busabase-instance.sh ready  <instance-dir> [seconds]  wait until GET /api/v1/bases answers 200
#   busabase-instance.sh status <instance-dir>            print RUNNING or STOPPED, pid, listener
#   busabase-instance.sh stop   <instance-dir>            SIGTERM by pidfile, wait, confirm the port is closed
#
# <instance-dir> holds everything that belongs to one store:
#   data/pgdata  data/storage     the store (PGlite database + uploaded files)
#   run/pid  run/port  run/WRITER.lock
#   logs/server.log
#   isolated/{home,config,cache,tmp}
#
# Environment (all optional):
#   BUSABASE_RUNTIME    directory that holds package/bin/busabase.mjs   (default /opt/busabase/runtime-0.95.1)
#   BUSABASE_NODE       node binary, sha256-pinned below                (default /opt/busabase/node-v22.23.3/bin/node)
#   BUSABASE_USER_NAME  display name of the local user                  (default "Busabase local")
#   BUSABASE_MIN_HEADROOM_MB  refuse to start below this memory headroom (default 900)
#
# Fences, enforced here and not by convention:
#   - The bind address is 127.0.0.1. There is no flag to change it. Busabase has no login.
#   - One writer per store: a flock on run/WRITER.lock is held for the life of the server process.
#   - The port must be free. This script never stops a process it did not start (stop checks the pid's environment).
#   - It refuses any instance-dir inside another agent's folder (/root/CODEX_BUSABASE_LIBRARY_20261012).
#   - It never uses pkill or killall.
# Run it as the unprivileged busabase user (uid 15429) for the primary:
#   setpriv --reuid=15429 --regid=15429 --clear-groups -- busabase-instance.sh start <instance-dir> <port>
set -u
PINNED_VERSION=0.95.1
PINNED_NODE_SHA=fde6a4bf8d0562f7751d1a2d6cb9b417c4cfe107bbcb0aa3e9a24e125e348f48
FORBIDDEN_PREFIX=/root/CODEX_BUSABASE_LIBRARY_20261012
RUNTIME=${BUSABASE_RUNTIME:-/opt/busabase/runtime-0.95.1}
NODE=${BUSABASE_NODE:-/opt/busabase/node-v22.23.3/bin/node}
NAME=${BUSABASE_USER_NAME:-Busabase local}
MIN_HEADROOM_MB=${BUSABASE_MIN_HEADROOM_MB:-900}

die() { echo "REFUSED: $*" >&2; exit 2; }

cmd=${1:-}; I=${2:-}
[ -n "$cmd" ] && [ -n "$I" ] || { sed -n '2,10p' "$0"; exit 2; }
case "$I" in /*) ;; *) die "instance-dir must be an absolute path" ;; esac
I=$(readlink -m "$I")
case "$I/" in "$FORBIDDEN_PREFIX"/*) die "that folder belongs to another agent" ;; esac

pid_of() { [ -s "$I/run/pid" ] && cat "$I/run/pid" || true; }
# A pid is ours only if it is alive AND its environment names this instance's data dir.
is_ours() {
  local p=$1
  [ -n "$p" ] && [ -r "/proc/$p/environ" ] || return 1
  tr '\0' '\n' < "/proc/$p/environ" | grep -qx "BUSABASE_DATA_DIR=$I/data"
}
port_listening() { ss -ltnH "sport = :$1" 2>/dev/null | grep -q .; }
headroom_mb() {
  # cgroup v2: limit minus memory that cannot be reclaimed (anonymous + unreclaimable slab + shared).
  local max anon slab shm
  max=$(cat /sys/fs/cgroup/memory.max 2>/dev/null || echo max)
  if [ "$max" != max ]; then
    anon=$(awk '$1=="anon"{print $2}' /sys/fs/cgroup/memory.stat 2>/dev/null)
    slab=$(awk '$1=="slab_unreclaimable"{print $2}' /sys/fs/cgroup/memory.stat 2>/dev/null)
    shm=$(awk '$1=="shmem"{print $2}' /sys/fs/cgroup/memory.stat 2>/dev/null)
    echo $(( (max - anon - slab - shm) / 1048576 ))
    return
  fi
  # cgroup v1 (added 2026-11-03). These pods run cgroup v1, where /sys/fs/cgroup/memory.max
  # does NOT exist. The previous code fell through to 999999 MB here, so MIN_HEADROOM_MB never
  # fired and the fence was INERT on exactly the platform that needed it. v1 splits anonymous
  # memory into active_anon + inactive_anon; slab_unreclaimable and shmem live in the same
  # file. The formula is the v2 one.
  local v1lim
  v1lim=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo "")
  if [ -n "$v1lim" ]; then
    anon=$(( $(awk '$1=="active_anon"{print $2}' /sys/fs/cgroup/memory/memory.stat 2>/dev/null) \
           + $(awk '$1=="inactive_anon"{print $2}' /sys/fs/cgroup/memory/memory.stat 2>/dev/null) ))
    slab=$(awk '$1=="slab_unreclaimable"{print $2}' /sys/fs/cgroup/memory/memory.stat 2>/dev/null)
    shm=$(awk '$1=="shmem"{print $2}' /sys/fs/cgroup/memory/memory.stat 2>/dev/null)
    echo $(( (v1lim - anon - slab - shm) / 1048576 ))
    return
  fi
  # No usable memory controller at all. Report UNMEASURABLE rather than claim 999999 MB of
  # headroom that was never measured: an unmeasured headroom is not a headroom.
  echo UNMEASURABLE
}

case "$cmd" in
  start)
    PORT=${3:-}
    [[ "$PORT" =~ ^[0-9]+$ ]] && [ "$PORT" -ge 1024 ] && [ "$PORT" -le 65535 ] || die "port must be a number from 1024 to 65535"
    [ -d "$I/data/pgdata" ] || die "no store at $I/data/pgdata (restore a snapshot first; this script never creates an empty store)"
    [ -f "$RUNTIME/package/bin/busabase.mjs" ] || die "no runtime at $RUNTIME/package"
    grep -q "\"version\": \"$PINNED_VERSION\"" "$RUNTIME/package/package.json" || die "runtime is not busabase $PINNED_VERSION"
    [ -x "$NODE" ] || die "no node binary at $NODE"
    [ "$(sha256sum "$NODE" | cut -d' ' -f1)" = "$PINNED_NODE_SHA" ] || die "node binary does not match the pinned sha256"
    port_listening "$PORT" && die "port $PORT is already in use"
    p=$(pid_of); is_ours "$p" && die "this instance is already running as pid $p"
    h=$(headroom_mb)
    if [ "$h" = UNMEASURABLE ]; then
      echo "WARN memory headroom UNMEASURABLE (no usable cgroup memory controller) — MIN_HEADROOM_MB cannot fire here; the pod supervisor is the net" >&2
    else
      [ "$h" -ge "$MIN_HEADROOM_MB" ] || die "memory headroom ${h} MB is below ${MIN_HEADROOM_MB} MB"
    fi
    mkdir -p "$I/run" "$I/logs" "$I/isolated/home" "$I/isolated/config" "$I/isolated/cache" "$I/isolated/tmp" "$I/data/storage" || die "cannot create run folders"
    chmod 700 "$I" "$I/run" "$I/logs" "$I/isolated" 2>/dev/null
    exec 9>"$I/run/WRITER.lock" || die "cannot open the writer lock"
    flock -n 9 || die "the store already has a writer (run/WRITER.lock is held)"
    echo "$PORT" > "$I/run/port"
    {
      echo "---- start $(date -u +%FT%TZ) port $PORT data $I/data runtime $RUNTIME headroom_mb $h uid $(id -u)"
    } >> "$I/logs/server.log"
    # fd 9 (the lock) is inherited by the server, so the lock lives exactly as long as the server does.
    setsid nohup /usr/bin/env -i PATH=/usr/bin:/bin LANG=C LC_ALL=C TZ=UTC HOME="$I/isolated/home" \
      NODE_ENV=production VERSION=$PINNED_VERSION HOSTNAME=127.0.0.1 PORT="$PORT" \
      BUSABASE_DATA_DIR="$I/data" PG_DATABASE_URL="pglite://$I/data/pgdata" \
      STORAGE_URL="local:$I/data/storage?base_url=/api/storage&upload_url=/api/storage/upload" \
      BUSABASE_NO_UPDATE_CHECK=1 NEXT_TELEMETRY_DISABLED=1 BUSABASE_LOCAL_USER_NAME="$NAME" \
      NODE_OPTIONS=--max-old-space-size=512 XDG_CONFIG_HOME="$I/isolated/config" XDG_CACHE_HOME="$I/isolated/cache" \
      TMPDIR="$I/isolated/tmp" \
      "$NODE" "$RUNTIME/package/bin/busabase.mjs" server --host 127.0.0.1 --port "$PORT" --data "$I/data" \
      >> "$I/logs/server.log" 2>&1 < /dev/null &
    p=$!
    echo "$p" > "$I/run/pid"
    sleep 1
    is_ours "$p" || { echo "FAILED: the server process did not stay up; see $I/logs/server.log" >&2; exit 1; }
    echo "STARTED pid $p port $PORT"
    ;;
  ready)
    WAIT=${3:-120}; PORT=$(cat "$I/run/port" 2>/dev/null) || die "no run/port"
    for ((i = 0; i < WAIT; i++)); do
      p=$(pid_of); is_ours "$p" || { echo "FAILED: server exited while starting; see $I/logs/server.log" >&2; exit 1; }
      code=$(curl -s -o /dev/null -m 5 -w '%{http_code}' "http://127.0.0.1:$PORT/api/v1/bases" 2>/dev/null)
      [ "$code" = 200 ] && { echo "READY after ${i}s on 127.0.0.1:$PORT"; exit 0; }
      sleep 1
    done
    echo "FAILED: not ready after ${WAIT}s" >&2; exit 1
    ;;
  status)
    p=$(pid_of); PORT=$(cat "$I/run/port" 2>/dev/null || echo "?")
    if is_ours "$p"; then
      echo "RUNNING pid $p port $PORT rss_kb $(awk '/VmRSS/{print $2}' /proc/$p/status)"
      ss -ltnH "sport = :$PORT" 2>/dev/null
    else
      echo "STOPPED (port $PORT listening: $(port_listening "$PORT" && echo yes || echo no))"
    fi
    ;;
  stop)
    p=$(pid_of); PORT=$(cat "$I/run/port" 2>/dev/null || echo "")
    if ! is_ours "$p"; then echo "STOPPED already (no live process owns $I/data)"; exit 0; fi
    kill -TERM "$p"
    for ((i = 0; i < 40; i++)); do [ -d "/proc/$p" ] || break; sleep 1; done
    forced=no
    if [ -d "/proc/$p" ]; then kill -KILL "$p"; forced=yes; sleep 2; fi
    [ -d "/proc/$p" ] && { echo "FAILED: pid $p is still alive" >&2; exit 1; }
    echo "---- stop $(date -u +%FT%TZ) pid $p waited ${i}s forced $forced" >> "$I/logs/server.log"
    if [ -n "$PORT" ] && port_listening "$PORT"; then echo "FAILED: port $PORT still listening" >&2; exit 1; fi
    echo "STOPPED pid $p after ${i}s (SIGKILL used: $forced); port $PORT closed"
    ;;
  *) sed -n '2,10p' "$0"; exit 2 ;;
esac
