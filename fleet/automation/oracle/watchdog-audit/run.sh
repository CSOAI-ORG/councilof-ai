#!/bin/bash
# watchdog-audit (Oracle) - migrated from Mac LaunchAgent ai.csoai.watchdog-audit by lane automation-runpod-20260928.
# Audit-only: 4 unauthenticated public GETs on councilof.ai + one read-only `runpodctl pod get` of the 3090 pod.
# No ssh, signing, deploy, restart, publish or payment. Receipts: ./state/<stamp>-audit-watchdog.json + ./state/latest.json
# Log: ~/lanes/logs/watchdog-audit.log (one line per run). Cadence cut from 5 min (Mac) to 30 min (Oracle disk is 93%).
set -u
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$HOME/lanes/logs/watchdog-audit.log"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
RC=0
CSOAI_WATCHDOG_STATE_DIR="$BASE/state" CSOAI_RUNPODCTL="$HOME/bin/runpodctl" /usr/bin/python3 "$BASE/csoai-watchdog-audit.py" > "$BASE/last.stdout.txt" 2> "$BASE/last.stderr.txt" || RC=$?
SUM=$(/usr/bin/python3 - "$BASE/state/latest.json" <<'PY'
import json,sys
try:
    d=json.load(open(sys.argv[1]))
    eps=d.get("public_endpoint_checks",[])
    ok=sum(1 for e in eps if e.get("state")=="ok")
    rp=d.get("runpod_control_plane",{}) or {}
    print("observed_at=%s endpoints_ok=%d/%d runpod=%s/%s" % (d.get("observed_at"),ok,len(eps),rp.get("state") or rp.get("error","-")[:40] if isinstance(rp,dict) else "-",rp.get("desired_status","-")))
except Exception as e:
    print("receipt=UNREADABLE(%s)" % type(e).__name__)
PY
)
echo "$NOW rc=$RC $SUM" >> "$LOG"
exit $RC
