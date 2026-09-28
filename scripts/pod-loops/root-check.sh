#!/bin/bash
# root-check.sh -- hourly root self-check. MOVED to Oracle (sov33-owem-micro2) 2026-09-22.
#
# The check itself is two GETs against councilof.ai and nothing else: no repo checkout, no GPU,
# no signing key, no secret. The pod holds the only GPU, runs every measurement and sits at ~10 GB
# free, so the two GETs now run on the 2-core Oracle box and this script only collects the receipt.
# Moving it also gives the check a second vantage point: councilof.ai is now read from a different
# network, so a pod-side outage no longer takes the root check down with it.
#
# Receipts land exactly where they always did: ONE line in logs/root-check.log, ALERT on change,
# state/root-check.last. Every line now carries via=oracle or via=pod-fallback so the log says
# which machine actually made the request.
#
# FAIL-OPEN BY DESIGN. If Oracle is unreachable, or its receipt is older than MAXAGE, the original
# pod-side probe (root-check-local.sh, byte-identical to what ran here before) runs instead. The
# estate never silently loses the check because a second machine went away.
set -u
. "$(dirname "$0")/lib.sh"
[ "${1:-}" = "--now" ] || stamp root-check hour || exit 0

MAXAGE=${ROOT_CHECK_MAXAGE:-9000}   # 2.5 h: one missed hourly slot is tolerated, two is not
LOCAL="$LOOPS/root-check-local.sh"

rec=$(ssh -o BatchMode=yes -o ConnectTimeout=15 oracle-mirror \
        'cat $HOME/lanes/out/root-check-latest.json' 2>/dev/null)

parsed=""
if [ -n "$rec" ]; then
  parsed=$(printf '%s' "$rec" | python3 "$LOOPS/root_check_collect.py" "$MAXAGE" 2>/dev/null)
fi

if [ -z "$parsed" ]; then
  log root-check "via=pod-fallback oracle receipt absent/stale/unreadable -- probing from the pod"
  exec bash "$LOCAL" --now
fi

# parsed is: <ran_on> <age_s> <http> <cur...>
ran_on=$(printf '%s' "$parsed" | awk '{print $1}')
age=$(printf '%s' "$parsed" | awk '{print $2}')
http=$(printf '%s' "$parsed" | awk '{print $3}')
cur=$(printf '%s' "$parsed" | cut -d' ' -f4-)

log root-check "via=oracle ran_on=$ran_on age=${age}s http=$http $cur"

last="$STATE/root-check.last"
if [ -f "$last" ] && [ "$(cat "$last")" != "$cur" ]; then
  log root-check "ALERT changed: was [$(cat "$last")] now [$cur]"
fi
echo "$cur" > "$last"
