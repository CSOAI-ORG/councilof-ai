#!/bin/bash
# nsite-spray (Oracle) - migrated from Mac LaunchAgent com.csoai.nsite-spray by lane automation-runpod-20260928.
# Read-only: public GETs of the canonical board/DID/governance + 8 estate apexes (spray report) and a
# prohibited-claim watch over the same apexes (live_claim_watch.py). Writes only this dir and one log line.
# Publishes nothing, sends nothing. Output: latest.json, status.json, claim-watch.json; log ~/lanes/logs/nsite-spray.log
set -u
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$HOME/lanes/logs/nsite-spray.log"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
SPRAY_RC=0; CLAIM_RC=0
/usr/bin/python3 "$BASE/gspc_site_spray.py" --config "$BASE/config.json" --out "$BASE/latest.json.tmp" > "$BASE/latest.stdout.txt" 2> "$BASE/latest.stderr.txt" || SPRAY_RC=$?
[ -s "$BASE/latest.json.tmp" ] && mv -f "$BASE/latest.json.tmp" "$BASE/latest.json"
/usr/bin/python3 "$BASE/live_claim_watch.py" --once --state "$BASE/claim-watch.json" > "$BASE/claim-watch.latest.txt" 2> "$BASE/claim-watch.stderr.txt" || CLAIM_RC=$?
printf '{"schema":"csoai.nsite-loop-status/0.1","ran_at":"%s","host":"oracle-micro-2","spray_exit":%s,"claim_watch_exit":%s}\n' "$NOW" "$SPRAY_RC" "$CLAIM_RC" > "$BASE/status.json"
SUM=$(/usr/bin/python3 - "$BASE/latest.json" "$BASE/claim-watch.latest.txt" <<'PY'
import json,sys,re
try:
    d=json.load(open(sys.argv[1]))
    s="blockers=%d warnings=%d sites=%d axis_slots=%s board_http=%s operational=%s" % (len(d.get("blockers",[])),len(d.get("warnings",[])),len(d.get("sites",[])),d.get("canonical",{}).get("axis_slots_state"),d.get("canonical",{}).get("board_http"),d.get("operational"))
except Exception as e:
    s="spray_report=UNREADABLE(%s)" % type(e).__name__
try:
    t=open(sys.argv[2]).read()
    ok=len(re.findall(r"\[OK\s*\]",t)); tr="no_transitions" if "no transitions" in t else "TRANSITIONS"
    s+=" claim_ok=%d/%d %s" % (ok,len(re.findall(r"\[\w+\s*\]\s+https?://",t)),tr)
except Exception as e:
    s+=" claim_watch=UNREADABLE"
print(s)
PY
)
RC=0; { [ "$SPRAY_RC" -ne 0 ] || [ "$CLAIM_RC" -ne 0 ]; } && RC=1
echo "$NOW rc=$RC spray_exit=$SPRAY_RC claim_watch_exit=$CLAIM_RC $SUM" >> "$LOG"
exit $RC
