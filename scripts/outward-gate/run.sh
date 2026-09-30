#!/bin/bash
# Daily outward quality gate (lane outward-gate-20260926). Measures only; sends and publishes nothing.
# Cron (Oracle, 06:40Z) wraps this in ~/lanes/bin/disk-floor.sh, so it never starts below the floor
# (root >= 1536M, /evac-bulk >= 2048M). Output: /evac-bulk/outward-gate/<date>/{scorecard.json,SCORECARD.md}
# Health: ~/fleet/outward_gate.json (last_success, summary) for the fleet supervisor.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
D=$(date -u +%Y-%m-%d)
OUT=/evac-bulk/outward-gate/$D
mkdir -p "$OUT"
echo "$(date -u +%FT%TZ) start out=$OUT"
timeout 3h nice -n 15 python3 "$HERE/outward_gate.py" run --artifacts all --out "$OUT" --date "$D" > "$OUT/run.log" 2>&1
rc=$?
if [ $rc -eq 0 ] && [ -s "$OUT/scorecard.json" ]; then
  python3 - "$OUT" <<'EOF'
import json, sys, os, datetime
out = sys.argv[1]
d = json.load(open(os.path.join(out, "scorecard.json")))
state = {"job": "outward-gate", "last_success": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
         "out": out, "summary": d["summary"]}
p = os.path.expanduser("~/fleet/outward_gate.json")
tmp = p + ".tmp"
json.dump(state, open(tmp, "w"), indent=1)
os.replace(tmp, p)
print("ok", d["summary"]["at_100"], "of", d["summary"]["artifacts"], "at 100%")
EOF
else
  echo "$(date -u +%FT%TZ) FAILED rc=$rc (see $OUT/run.log)"
fi
# retention: keep 21 daily outputs
ls -1d /evac-bulk/outward-gate/20??-??-?? 2>/dev/null | sort | head -n -21 | xargs -r rm -rf
echo "$(date -u +%FT%TZ) end rc=$rc"
exit $rc
