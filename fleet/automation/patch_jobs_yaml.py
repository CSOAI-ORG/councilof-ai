#!/usr/bin/env python3
"""patch_jobs_yaml.py IN OUT -- lane automation-runpod-20260928: record the two Mac jobs moved to Oracle in the
fleet-supervisor inventory (JSON subset of YAML; header comment lines preserved; idempotent)."""
import json, sys

src, dst = sys.argv[1], sys.argv[2]
lines = open(src).read().splitlines(True)
hdr = "".join(l for l in lines if l.lstrip().startswith("#"))
d = json.loads("".join(l for l in lines if not l.lstrip().startswith("#")))
ids = {j["id"]: j for j in d["jobs"]}
MOVED = "moved to Oracle 2026-09-28 by lane automation-runpod-20260928 (Mac plist bootout + moved to ~/Library/LaunchAgents/_disabled_automation_runpod_20260928/, .bak kept)"
for mac_id, new_id in (("mac-nsite-spray", "nsite-spray"), ("mac-watchdog-audit", "watchdog-audit")):
    if mac_id in ids:
        j = ids[mac_id]
        j["health"] = {"type": "disabled", "why": MOVED + "; see job " + new_id}
        j["note"] = "MIGRATED -> " + new_id
NEW = [
    {"id": "nsite-spray", "host": "oracle-micro-2", "schedule": "28 * * * *",
     "command": "flock -n /tmp/nsite-spray.lock env FLOOR_ROOT_M=512 $HOME/lanes/bin/disk-floor.sh nsite-spray $HOME/lanes/logs/nsite-spray.log bash $HOME/lanes/automation-runpod-20260928/nsite-spray/run.sh",
     "health": {"type": "log_last_line", "path": "~/lanes/logs/nsite-spray.log", "max_age_s": 10800, "must_contain": "rc=0"},
     "supervise": "observe", "cron_match": "automation-runpod-20260928/nsite-spray/run.sh", "max_runtime_s": 900,
     "outputs": ["~/lanes/automation-runpod-20260928/nsite-spray/latest.json", "~/lanes/automation-runpod-20260928/nsite-spray/status.json",
                 "~/lanes/automation-runpod-20260928/nsite-spray/claim-watch.json", "~/lanes/logs/nsite-spray.log"],
     "failover": [], "class": "measurement",
     "note": "was Mac com.csoai.nsite-spray (hourly). Read-only GETs: canonical board/DID/governance + 8 estate apexes spray report, prohibited-claim watch. Publishes nothing."},
    {"id": "watchdog-audit", "host": "oracle-micro-2", "schedule": "13,43 * * * *",
     "command": "flock -n /tmp/watchdog-audit.lock env FLOOR_ROOT_M=512 $HOME/lanes/bin/disk-floor.sh watchdog-audit $HOME/lanes/logs/watchdog-audit.log bash $HOME/lanes/automation-runpod-20260928/watchdog-audit/run.sh",
     "health": {"type": "log_last_line", "path": "~/lanes/logs/watchdog-audit.log", "max_age_s": 7200, "must_contain": "rc=0"},
     "supervise": "observe", "cron_match": "automation-runpod-20260928/watchdog-audit/run.sh", "max_runtime_s": 300,
     "outputs": ["~/lanes/automation-runpod-20260928/watchdog-audit/state/latest.json", "~/lanes/logs/watchdog-audit.log"],
     "failover": [], "class": "measurement",
     "note": "was Mac ai.csoai.watchdog-audit (every 5 min; 30 min here, Oracle / is 93%). 4 unauthenticated GETs + read-only runpodctl pod get; receipts accumulate ~110 KB/day under state/ (retention = owner call)."},
]
for n in NEW:
    if n["id"] in ids:
        ids[n["id"]].clear(); ids[n["id"]].update(n)
    else:
        d["jobs"].append(n)
open(dst, "w").write(hdr + json.dumps(d, indent=1, ensure_ascii=False) + "\n")
print("jobs:", len(d["jobs"]))
