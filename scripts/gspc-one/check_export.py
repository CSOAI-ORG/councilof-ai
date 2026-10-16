#!/usr/bin/env python3
import json, sys
d = json.load(open(sys.argv[1], encoding="utf-8"))
UNSIGNED_CLASSES = {"ai-lab", "measurer-harness-org", "mcp-server", "agent", "ai-company", "harness"}
bad = [r for r in d["rows"] if r["lane"] not in ("signed", "unsigned", "hosted-api")
       or (r["subject_class"] in UNSIGNED_CLASSES and r["lane"] != "unsigned")
       or r["subject_class"] in ("humanoid-lab", "interpretability-group")
       or (r["lane"] == "hosted-api" and r.get("signed"))
       or not r.get("group")]
if any("certif" in json.dumps(r).lower() for r in d["rows"]): bad.append("forbidden word")
if bad: print("FAIL", len(bad), bad[:3]); sys.exit(1)
print("ok", len(d["rows"]), "rows")
