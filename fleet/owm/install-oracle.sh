#!/bin/bash
# fleet/owm/install-oracle.sh - install the OWM cycle on the scheduler host. Idempotent.
#   bash install-oracle.sh            copy files + register in ~/fleet/sv/jobs.yaml (observe); cron line NOT added
#   OWM_ENABLE=1 bash install-oracle.sh   ... and add the crontab block between its owm:begin/end markers
# Backs up crontab and jobs.yaml first (never deletes a backup). Run from the directory holding these files.
set -euo pipefail
SRC=$(cd "$(dirname "$0")" && pwd)
DST=$HOME/lanes/reaction-orchestrator-20260928
TS=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$DST" "$HOME/lanes/logs" "$HOME/lanes/state/owm"
install -m 0644 "$SRC/owm-registry.json" "$DST/owm-registry.json"
install -m 0755 "$SRC/owm.py" "$DST/owm.py"
python3 - "$SRC/jobs-yaml-entry.json" "$HOME/fleet/sv/jobs.yaml" "$TS" <<'PY'
import json, shutil, sys
entry_p, jobs_p, ts = sys.argv[1:4]
entry = json.load(open(entry_p))
text = open(jobs_p).read()
head = [l for l in text.splitlines() if l.lstrip().startswith("#")]
body = json.loads("\n".join(l for l in text.splitlines() if not l.lstrip().startswith("#")))
if any(j.get("id") == entry["id"] for j in body["jobs"]):
    print("jobs.yaml: %s already registered" % entry["id"]); sys.exit(0)
shutil.copy2(jobs_p, jobs_p + ".bak-%s-owm" % ts)
body["jobs"].append(entry)
with open(jobs_p + ".tmp", "w") as f:
    f.write("\n".join(head) + "\n" + json.dumps(body, indent=1, ensure_ascii=False) + "\n")
json.loads("\n".join(l for l in open(jobs_p + ".tmp").read().splitlines() if not l.lstrip().startswith("#")))
import os; os.replace(jobs_p + ".tmp", jobs_p)
print("jobs.yaml: registered %s (observe)" % entry["id"])
PY
if [ "${OWM_ENABLE:-0}" = "1" ]; then
  if crontab -l | grep -q '^# owm:begin'; then
    echo "crontab: owm block already present"
  else
    crontab -l > "$HOME/fleet/crontab.before.$TS-owm"
    { crontab -l; cat "$SRC/crontab.txt"; } | crontab -
    echo "crontab: owm block added (backup ~/fleet/crontab.before.$TS-owm)"
  fi
else
  echo "crontab: not enabled (OWM_ENABLE=1 to add the owm block)"
fi
