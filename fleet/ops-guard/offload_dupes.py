#!/usr/bin/env python3
"""offload_dupes.py -- read-only: duplicate bytes across the offload sha256 manifests (ops-guard lane, 28 Sep).
Reads /workspace/offload/*.sha256 (sha256  ./relpath, relative to /workspace/offload/<name>/), stats one copy of each
duplicated hash for its size, and totals the bytes that a second copy occupies, by (manifest, top dir) pair.
Also totals node_modules / .git / model-weight bytes per manifest (regenerable or held elsewhere). Moves nothing."""
import collections, json, os, sys
BASE = "/workspace/offload"
mans = sorted(f for f in os.listdir(BASE) if f.endswith(".sha256"))
by_hash = collections.defaultdict(list)
rows = 0
for m in mans:
    root = m[:-len(".sha256")]
    for ln in open(os.path.join(BASE, m), errors="replace"):
        parts = ln.rstrip("\n").split("  ", 1)
        if len(parts) != 2 or len(parts[0]) != 64:
            continue
        rel = parts[1][2:] if parts[1].startswith("./") else parts[1]
        by_hash[parts[0]].append((root, rel))
        rows += 1
dup_pairs = collections.Counter()
dup_bytes_total = 0
stat_fail = 0
stats = 0
size_cache = {}
for hsh, locs in by_hash.items():
    if len(locs) < 2:
        continue
    root, rel = locs[0]
    try:
        sz = os.path.getsize(os.path.join(BASE, root, rel)); stats += 1
    except OSError:
        stat_fail += 1
        continue
    if sz == 0:
        continue
    keep = locs[0]
    for (r2, rel2) in locs[1:]:
        k = "%s/%s  ==  %s/%s" % (keep[0], keep[1].split("/")[0], r2, rel2.split("/")[0])
        dup_pairs[k] += sz
        dup_bytes_total += sz
cls = collections.Counter()
for hsh, locs in by_hash.items():
    for root, rel in locs:
        seg = rel.split("/")
        tag = "node_modules" if "node_modules" in seg else (".git" if ".git" in seg else None)
        if tag:
            cls[(root, tag)] += 1
out = {"manifests": mans, "rows": rows, "unique_hashes": len(by_hash), "dup_hashes": sum(1 for l in by_hash.values() if len(l) > 1),
       "dup_bytes_total": dup_bytes_total, "stats": stats, "stat_fail": stat_fail,
       "top_dup_pairs": [(k, v) for k, v in dup_pairs.most_common(40)],
       "file_counts_regenerable": {"%s:%s" % k: v for k, v in cls.items()}}
json.dump(out, open(sys.argv[1], "w"), indent=1)
print("rows", rows, "dup_bytes_total_GiB", round(dup_bytes_total / 2**30, 2), "stats", stats, "stat_fail", stat_fail)
