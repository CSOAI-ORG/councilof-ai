#!/usr/bin/env python3
"""Refresh ONLY the xl-daily entry in ~/fleet/sv/jobs.yaml (JSON content). Re-reads the file at the moment
of editing, touches no other entry, keeps key order, writes atomically, and refuses if the file changed
between read and write."""
import hashlib, json, os, pathlib, sys

P = pathlib.Path(os.path.expanduser("~/fleet/sv/jobs.yaml"))
raw = P.read_bytes()
h0 = hashlib.sha256(raw).hexdigest()
doc = json.loads(raw)
jobs = doc["jobs"] if isinstance(doc, dict) and "jobs" in doc else doc
idx = [i for i, j in enumerate(jobs) if j.get("id") == "xl-daily"]
new = {
    "id": "xl-daily",
    "host": "oracle-micro-2",
    "schedule": "20 4 * * *",
    "command": "flock -n /tmp/xl-daily.lock bash $HOME/lanes/xl-daily.sh",
    "health": {"type": "log_last_line", "path": "~/lanes/logs/xl-daily.log", "max_age_s": 97200, "must_contain": "rc=0"},
    "supervise": "active",
    "cron_match": "lanes/xl-daily.sh",
    "max_runtime_s": 5400,
    "not_before": "2026-09-27T06:00:00Z",
    "outputs": ["/evac-bulk/xl-daily/<date>/xl-daily-<date>.json", "/evac-bulk/xl-daily/<date>/xl-daily-<date>.signed.json",
                "/evac-bulk/xl-daily/institutional-evidence-links.json"],
    "failover": [],
    "note": ("cross-ledger daily loop, top 20% of tokenised assets by value (lane xl-loop-20260926): signed + OTS, "
             "changes by name, NEW dated files to HF csoai/cross-ledger-supply. Skips with FAILED_DISK_FLOOR below "
             "root 1536M / bulk 2048M. Not portable yet (needs the lane checkout)."),
    "class": "measurement",
}
if len(idx) > 1:
    sys.exit("REFUSED: more than one xl-daily entry")
if idx:
    old = jobs[idx[0]]
    for k in old:
        if k not in new:
            new[k] = old[k]   # keep any field another agent added
    jobs[idx[0]] = new
else:
    jobs.append(new)
# textual splice: replace only the xl-daily object's bytes; every other byte of the file is kept
text = raw.decode()
if idx:
    pos = text.index('"id": "xl-daily"')
    start = text.rindex("{", 0, pos)
    _, end = json.JSONDecoder().raw_decode(text, start)
    line_start = text.rindex("\n", 0, start) + 1
    pad = text[line_start:start]
    body = json.dumps(new, indent=1, ensure_ascii=False).replace("\n", "\n" + pad)
    out_text = text[:start] + body + text[end:]
else:
    sys.exit("REFUSED: no xl-daily entry to refresh (adding one is not this script's job)")
chk = json.loads(out_text)
cj = chk["jobs"] if isinstance(chk, dict) and "jobs" in chk else chk
orig = json.loads(raw); oj = orig["jobs"] if isinstance(orig, dict) and "jobs" in orig else orig
if [j for j in cj if j.get("id") != "xl-daily"] != [j for j in oj if j.get("id") != "xl-daily"]:
    sys.exit("REFUSED: splice would change another entry")
if hashlib.sha256(P.read_bytes()).hexdigest() != h0:
    sys.exit("REFUSED: jobs.yaml changed while editing; re-run")
tmp = P.with_name(P.name + ".xl-tmp")
tmp.write_text(out_text)
os.replace(tmp, P)
print("refreshed xl-daily entry only; other entries byte-identical in content:", len(cj), "jobs")
