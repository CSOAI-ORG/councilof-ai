#!/bin/bash
# busabase-substrate-watchdog.sh — keep the estate's Busabase substrate serving, and be honest
# about WHY it is not serving.
#
# WHY THIS EXISTS (2026-10-28). The pod's RunPod network volume (mfs#euro-3, mounted at
# /workspace, fuse) began losing every written byte: a file created and read back immediately
# came back EMPTY, at 1 KB and at 1 MB, while pod-local /opt and /root were fine. The
# csoai-primary writer (port 15430) could not start, because its 9.4 GB pglite data dir lives
# on that volume. The store's DATA was still perfectly readable - only writes were lost.
#
# The old watchdog could not see this, for three reasons:
#
#   1. Its LIVENESS test was "is the pid alive and is its cmdline next-server". A wedged,
#      spinning server satisfies that test, so the watchdog logged "writer active; waiting" for
#      five hours and never restarted it.
#   2. Its evidence lived ON THE VOLUME IT WAS WATCHING. When the volume failed, the health
#      files and the log entries that recorded the failure were written into the void. The log
#      went SILENT at 08:50 - which looked like "nothing is wrong".
#   3. It diagnosed "port down" when the truth was "this filesystem cannot keep a byte". The
#      remedy is completely different: restart the writer vs. escalate to the volume provider.
#
# So this watchdog does three things the old one did not:
#   - probes the FILESYSTEM the store writes to, separately from the port
#   - treats "a writer is alive but not serving" as a restart condition after a bounded number
#     of consecutive failures
#   - writes its health record to POD-LOCAL disk, never to the volume it is watching
#
# Usage:  busabase-substrate-watchdog.sh [--once]
# Env:    BUSABASE_ROOT (default /workspace/busabase)
#         HEALTH_DIR     (default /opt/busabase/health - POD-LOCAL by design)
#         MIN_HEADROOM_MB, NOT_SERVING_TOLERANCE (default 3 checks)

set -uo pipefail

B=${BUSABASE_ROOT:-/workspace/busabase}
HEALTH=${HEALTH_DIR:-/opt/busabase/health}
LOG=$HEALTH/watchdog.log
TOLERANCE=${NOT_SERVING_TOLERANCE:-3}
ONCE=0
[ "${1:-}" = "--once" ] && ONCE=1

mkdir -p "$HEALTH" 2>/dev/null || { echo "cannot write health dir $HEALTH" >&2; exit 1; }

log() { echo "$(date -u +%FT%TZ) $*" >> "$LOG" 2>/dev/null; }

# Can this filesystem keep a byte? Writes that silently produce empty files are the failure
# mode this probe exists to catch: a port can be open and a pid alive while the store is
# unable to persist anything.
# The probe MUST write into the directory being watched. Writing it into the health dir would
# test the health filesystem and always answer "writable" - which is how a broken volume gets
# reported as healthy.
fs_can_write() {
  local d=$1 probe out
  probe="$d/.fsprobe.$$"
  out=$( { printf 'probe' > "$probe" 2>/dev/null && cat "$probe" 2>/dev/null; } )
  rm -f "$probe" 2>/dev/null
  [ "$out" = "probe" ]
}

# Is the store SERVING? A pid that is alive is not evidence; a 200 is.
store_answers() {
  local p=$1
  [ "$(curl -s -m 10 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$p/api/v1/bases" 2>/dev/null)" = "200" ]
}

instance_pid() { [ -s "$1/run/pid" ] && cat "$1/run/pid" || true; }

check_store() {
  local inst=$1 port=$2 label=$3
  local c a pid fs
  c=$(curl -s -m 10 -o /dev/null -w '%{http_code}' "http://127.0.0.1:$port/api/v1/bases" 2>/dev/null)
  a=$(instance_pid "$inst")
  fs=unknown
  if fs_can_write "$inst"; then fs=writable; else fs=WRITE_LOST; fi

  echo "$(date -u +%FT%TZ) $label port=$port http=$c pid=${a:-none} fs=$fs" \
    > "$HEALTH/health-$port.txt" 2>/dev/null

  if [ "$c" = "200" ]; then
    rm -f "$HEALTH/not-serving-$port" 2>/dev/null
    return 0
  fi

  # The filesystem is the headline when it is broken: no amount of restarting the writer will
  # help, and the operator needs to know it is a volume fault, not an app fault.
  if [ "$fs" = "WRITE_LOST" ]; then
    log "$label port=$port http=$c FILESYSTEM_CANNOT_KEEP_A_BYTE (the volume under $inst is losing writes) - not restarting the writer; a restart cannot succeed until the volume recovers"
    return 2
  fi

  # A pid that is alive but not serving is a WEDGED writer. Count consecutive failures and
  # restart it. The old watchdog waited forever on exactly this.
  local n=0
  [ -f "$HEALTH/not-serving-$port" ] && n=$(cat "$HEALTH/not-serving-$port" 2>/dev/null || echo 0)
  n=$((n + 1))
  echo "$n" > "$HEALTH/not-serving-$port" 2>/dev/null

  if [ "$n" -lt "$TOLERANCE" ]; then
    log "$label port=$port http=$c writer alive (pid ${a:-none}) but NOT SERVING - $n/$TOLERANCE"
    return 1
  fi

  log "$label port=$port http=$c writer alive (pid ${a:-none}) but NOT SERVING for $n checks - restarting it"
  rm -f "$HEALTH/not-serving-$port" 2>/dev/null
  # The estate's own stop verb checks that the pid owns this instance's data dir before it
  # signals it, and never uses pkill/killall.
  if [ -x "$B/bin/busabase-instance.sh" ]; then
    (cd /tmp && setpriv --reuid=15429 --regid=15429 --clear-groups -- \
      "$B/bin/busabase-instance.sh" stop "$inst" </dev/null >> "$LOG" 2>&1)
    (cd /tmp && setpriv --reuid=15429 --regid=15429 --clear-groups -- \
      "$B/bin/busabase-instance.sh" start "$inst" "$port" </dev/null >> "$LOG" 2>&1)
    log "$label port=$port restart attempted; it will answer when the store is ready"
  else
    log "$label port=$port restart skipped: $B/bin/busabase-instance.sh not found"
  fi
  return 1
}

run_checks() {
  check_store "$B/primary" 15429 primary
  check_store "$B/csoai-primary" 15430 csoai-primary
}

if [ "$ONCE" = "1" ]; then
  run_checks
  exit 0
fi

exec 8>"$HEALTH/watchdog.lock" 2>/dev/null || exit 1
flock -n 8 || exit 0
log "substrate watchdog started (health on POD-LOCAL $HEALTH, not on the watched volume)"
while true; do
  run_checks
  sleep 60
done
