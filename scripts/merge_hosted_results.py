#!/usr/bin/env python3
"""Merge shard hosted_s*.json rows into the Hub results file (one row per pair).
usage: merge_hosted_results.py <results.json> <shard dir>"""
import json
import sys
from pathlib import Path

res_p, shard_dir = Path(sys.argv[1]), Path(sys.argv[2])
res = json.loads(res_p.read_text()) if res_p.exists() else {
    "kind": "csoai.hosted-api-results/0.1", "label": "hosted-api, unsigned, not comparable",
    "writes_board": False, "rows": {}}
for f in sorted(shard_dir.rglob("hosted_s*.json")):
    for row in json.loads(f.read_text()).get("rows") or []:
        if row.get("status") == "INCOMPLETE" and row["pair"] in res["rows"]:
            continue  # first graded run is the record; never overwrite with partial
        if res["rows"].get(row["pair"], {}).get("status") in ("hosted-api-pass", "hosted-api-gate-fail"):
            continue  # first graded run is the record; repeats are not stitched
        res["rows"][row["pair"]] = row
st = [r["status"] for r in res["rows"].values()]
res["n_pass"] = st.count("hosted-api-pass")
res["n_gate_fail"] = st.count("hosted-api-gate-fail")
res["n_incomplete"] = st.count("INCOMPLETE")
res_p.write_text(json.dumps(res, indent=2) + "\n")
print(json.dumps({k: res[k] for k in ("n_pass", "n_gate_fail", "n_incomplete")}))
