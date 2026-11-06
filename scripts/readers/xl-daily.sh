#!/bin/bash
# xl-daily — the cross-ledger daily loop (lane xl-loop-20260926). Measurement only: CSOAI never issues, wraps,
# trades or custodies anything and never ranks issuers.
#   universe (keyless value sources, selection only) -> top 20% -> read every issuer-listed deployment on the
#   evidence ladder -> issuer-claim parity -> record -> sign (board key) -> verify + 3 tamper controls ->
#   OTS stamp (pending; the flywheel's daily ots-upgrade upgrades it) -> changes vs yesterday by NAME ->
#   institutional-evidence-links -> NEW dated files on HF csoai/cross-ledger-supply (refuses overwrite).
# Writes only under /evac-bulk/xl-daily (records) and ~/lanes/logs/xl-daily.log (one line per run).
# Code: ~/lanes/xl-loop-20260926/scripts/readers/cross_ledger_xl.py (branch lane/xl-loop-20260926).
set -uo pipefail
LOG=$HOME/lanes/logs/xl-daily.log
ROOT=/evac-bulk/xl-daily
CODE=$HOME/lanes/xl-loop-20260926
D=$(date -u +%F)
ts() { date -u +%Y-%m-%dT%H:%M:%SZ; }
FREE_ROOT=$(df -Pk / | awk 'NR==2{print int($4/1024)}')
FREE_BULK=$(df -Pk /evac-bulk 2>/dev/null | awk 'NR==2{print int($4/1024)}'); FREE_BULK=${FREE_BULK:-0}
if [ "$FREE_ROOT" -lt 1536 ] || [ "$FREE_BULK" -lt 2048 ]; then
  echo "$(ts) FAILED_DISK_FLOOR job=xl-daily root=${FREE_ROOT}M bulk=${FREE_BULK}M (floor root>=1536M bulk>=2048M); skipped, nothing run" >> "$LOG"
  exit 1
fi
if [ -s "$ROOT/$D/xl-daily-$D.json" ]; then
  echo "$(ts) rc=0 state=ALREADY_DONE date=$D (a day's record is never overwritten)" >> "$LOG"; exit 0
fi
mkdir -p "$ROOT/$D" "$ROOT/.tmp" "$ROOT/.hf"
cd "$CODE" || { echo "$(ts) rc=2 state=NO_CHECKOUT $CODE" >> "$LOG"; exit 2; }
export PYTHONDONTWRITEBYTECODE=1 TMPDIR=$ROOT/.tmp HF_HOME=$ROOT/.hf
nice -n 10 timeout 5400 python3 scripts/readers/cross_ledger_xl.py run --out "$ROOT/$D" --prev-root "$ROOT" --date "$D" --mode cron \
  > "$ROOT/$D/run.log" 2>&1
rc=$?
gzip -f -9 "$ROOT/$D/run.log"
SUM=$(python3 - "$ROOT/$D" "$D" <<'PY' 2>/dev/null
import json, sys, pathlib, hashlib
d = pathlib.Path(sys.argv[1]); day = sys.argv[2]
f = d / f"xl-daily-{day}.json"
if not f.exists():
    print("record=NONE"); sys.exit()
j = json.loads(f.read_text())
pub = json.loads((d / f"publish-{day}.json").read_text()) if (d / f"publish-{day}.json").exists() else {}
ots = json.loads((d / f"xl-daily-{day}.ots.json").read_text()).get("state") if (d / f"xl-daily-{day}.ots.json").exists() else "NONE"
k = {}
for x in j["deployments"]:
    k[x["evidence_kind"]] = k.get(x["evidence_kind"], 0) + 1
print(f"sha256={hashlib.sha256(f.read_bytes()).hexdigest()[:16]} deployments={len(j['deployments'])} kinds={k} "
      f"signed={(d / f'xl-daily-{day}.signed.json').exists()} ots={ots} publish={pub.get('state', 'NONE')} commit={str(pub.get('commit'))[:12]}")
PY
)
echo "$(ts) rc=$rc date=$D $SUM" >> "$LOG"
exit $rc
