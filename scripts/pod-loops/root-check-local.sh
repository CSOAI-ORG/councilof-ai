#!/bin/bash
# Hourly root self-check. Exactly two requests against councilof.ai per run.
# Records as_of, card_count, merkle_root of the live root and the witness pointer's drift.status,
# appends ONE line to logs/root-check.log, and an extra ALERT line only when something changed
# since the previous run (state/root-check.last). Idempotent per UTC hour via stamp().
set -u
. "$(dirname "$0")/lib.sh"
[ "${1:-}" = "--now" ] || stamp root-check hour || exit 0

T=$(mktemp -d)
root_code=$(curl -s -m 30 -o "$T/root.json" -w '%{http_code}' -A csoai-pod-root-check/0.1 https://councilof.ai/root.json)
ptr_code=$(curl -s -m 30 -o "$T/ptr.json" -w '%{http_code}' -A csoai-pod-root-check/0.1 https://councilof.ai/interop/root-witness-pointer.json)

read -r as_of count root sha < <(python3 - "$T/root.json" "$root_code" <<'PY'
import hashlib, json, sys
p, code = sys.argv[1], sys.argv[2]
try:
    b = open(p, "rb").read(); d = json.loads(b)
    print(d.get("as_of"), d.get("card_count"), d.get("merkle_root"), hashlib.sha256(b).hexdigest())
except Exception as e:
    print("UNREADABLE", "UNREADABLE", "UNREADABLE", f"http={code}:{type(e).__name__}")
PY
)
read -r ptr_as_of drift checked ptr_count < <(python3 - "$T/ptr.json" "$ptr_code" <<'PY'
import json, sys
p, code = sys.argv[1], sys.argv[2]
try:
    d = json.load(open(p)); dr = d.get("drift") or {}
    print(d.get("as_of"), dr.get("status"), dr.get("checked_at"), (d.get("live_root") or {}).get("card_count"))
except Exception as e:
    print("UNREADABLE", "UNREADABLE", "UNREADABLE", f"http={code}:{type(e).__name__}")
PY
)
rm -rf "$T"

# drift= is the pointer's own self-report at its checked_at; pointer_cards vs cards is our independent
# read — a pointer written before a newer root was published is stale, not lying, and shows up here.
cur="root_as_of=$as_of cards=$count merkle=${root:0:16} root_sha=${sha:0:16} pointer_as_of=$ptr_as_of drift=$drift pointer_cards=$ptr_count"
log root-check "http=$root_code/$ptr_code $cur"

last="$STATE/root-check.last"
if [ -f "$last" ] && [ "$(cat "$last")" != "$cur" ]; then
  log root-check "ALERT changed: was [$(cat "$last")] now [$cur]"
fi
echo "$cur" > "$last"
