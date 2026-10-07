#!/usr/bin/env python3
"""Supplement: deep repos classified not-mcp read only a README - pull up to 3
actual source files from their tree (raw fetch, no API quota) and re-classify."""
from __future__ import annotations

import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, "/Users/nicholas/.hermes/cache/scratch")
sys.path.insert(0, "/Users/nicholas/clawd")
import gh_census as gc  # noqa: E402

SCRATCH = "/Users/nicholas/.hermes/cache/scratch"
OUT = "/Users/nicholas/clawd/MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl"
SRC_EXT = (".py", ".ts", ".js", ".mjs", ".go", ".rs", ".rb")
BAD = ("test", "tests", "docs/", "example", "vendor/", "node_modules", "site-packages")

recs = {r["repo"]: r for r in (json.loads(l) for l in open(OUT))}
branch = {c["name"]: c["branch"] for c in json.load(open(f"{SCRATCH}/cands.json"))}

targets = [name for name, r in recs.items() if r["era"] == "not-mcp" and r["depth"] == "deep"]
print("deep not-mcp to re-probe:", len(targets))

jobs = []
for name in targets:
    try:
        tree = json.load(open(f"{SCRATCH}/trees/{name}.json"))
    except Exception:
        continue
    fetched = gc.load_cached(name)
    cands = []
    for p in tree:
        low = p.lower()
        if not low.endswith(SRC_EXT):
            continue
        if any(b in low for b in BAD):
            continue
        if p in fetched:
            continue
        score = 0
        if "mcp" in low:
            score += 5
        if os.path.basename(low) in ("server.py", "main.py", "app.py", "index.ts", "index.js", "cli.py"):
            score += 3
        score -= p.count("/")
        cands.append((score, p))
    cands.sort(key=lambda t: (-t[0], t[1]))
    for _, p in cands[:3]:
        jobs.append((name, branch[name], p))

print("supplemental fetch jobs:", len(jobs))
results = list(ThreadPoolExecutor(max_workers=10).map(gc.curl, jobs))
merged: dict[str, dict[str, str]] = {}
codes: dict[str, int] = {}
for repo, path, text, code in results:
    codes[code] = codes.get(code, 0) + 1
    if text is not None:
        merged.setdefault(repo, {})[path] = text
for repo, files in merged.items():
    cur = gc.load_cached(repo)
    cur.update(files)
    gc.save_cached(repo, cur)
print("fetched:", sum(len(v) for v in merged.values()), "status:", codes)

# re-classify every deep repo (cheap: reads the cache only) and refresh records
changed = []
for name, r in recs.items():
    if r["depth"] != "deep":
        continue
    files = gc.load_cached(name)
    sig, evidence, read = gc.classify_repo(files)
    era, migration = gc.mwa.classify(sig)
    if era is None:
        era, migration = ("unreadable", "n/a") if not read else ("not-mcp", "n/a")
    source_ev = [e for e in evidence if not e.lower().startswith("readme")]
    new = dict(r, era=era, migration=migration, signals=sig, evidence=evidence,
               files_read=len(read),
               evidence_kind="source" if source_ev else ("docs" if evidence else "none"))
    if (new["era"], new["migration"], tuple(new["signals"])) != (r["era"], r["migration"], tuple(r["signals"])):
        changed.append((name, r["era"], era, r["migration"], migration))
    recs[name] = new

with open(OUT, "w", encoding="utf-8") as fh:
    for name in sorted(recs):
        fh.write(json.dumps(recs[name], sort_keys=True) + "\n")
print("changed:", len(changed))
for c in changed[:20]:
    print("  ", c)
