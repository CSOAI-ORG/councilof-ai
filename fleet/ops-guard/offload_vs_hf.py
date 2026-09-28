#!/usr/bin/env python3
"""offload_vs_hf.py -- read-only (ops-guard lane, 28 Sep): how many bytes under /workspace/offload/<root> already sit
inside a private HF csoai/pod-archive-* tar, by file. HF side: each archive's MANIFEST.tsv (size, mtime, path).
Pod side: the offload sha256 manifests (paths). A pod file counts as held on HF when some HF manifest row has the same
last-3 path components AND the same byte size (stat'd here). Name+size, not content hash: an upper-bound-ish match,
reported as such. Moves nothing, writes only the JSON named in argv[1]."""
import collections, glob, json, os, sys
BASE = "/workspace/offload"
LANE = "/workspace/lanes/ops-guard-20260928"
hf = collections.defaultdict(set)  # tail3 -> {(size, archive)}
hf_rows = {}
for f in sorted(glob.glob(LANE + "/hf-pod-archive-*.MANIFEST.tsv")):
    arch = os.path.basename(f)[len("hf-pod-archive-"):-len(".MANIFEST.tsv")]
    n = 0
    for ln in open(f, errors="replace"):
        p = ln.rstrip("\n").split("\t")
        if len(p) != 3 or not p[0].isdigit():
            continue
        tail = "/".join(p[2].split("/")[-3:])
        hf[tail].add((int(p[0]), arch)); n += 1
    hf_rows[arch] = n
res = collections.Counter(); files = collections.Counter(); scanned = collections.Counter(); scanned_b = collections.Counter()
stat_fail = 0
for m in sorted(glob.glob(BASE + "/*.sha256")):
    root = os.path.basename(m)[:-len(".sha256")]
    for ln in open(m, errors="replace"):
        parts = ln.rstrip("\n").split("  ", 1)
        if len(parts) != 2 or len(parts[0]) != 64:
            continue
        rel = parts[1][2:] if parts[1].startswith("./") else parts[1]
        top = rel.split("/")[0]
        scanned[(root, top)] += 1
        tail = "/".join(rel.split("/")[-3:])
        cand = hf.get(tail)
        if not cand:
            continue
        try:
            sz = os.path.getsize(os.path.join(BASE, root, rel))
        except OSError:
            stat_fail += 1; continue
        hit = sorted(a for (s, a) in cand if s == sz)
        if hit:
            res[(root, top, hit[0])] += sz; files[(root, top, hit[0])] += 1
out = {"method": "pod offload file counted as held on HF when an HF pod-archive MANIFEST row has the same last-3 path "
                 "components and the same size; name+size match, not a content hash",
       "hf_manifest_rows": hf_rows, "stat_fail": stat_fail,
       "matched": sorted(([r, t, a, b, files[(r, t, a)]] for (r, t, a), b in res.items()), key=lambda x: -x[3]),
       "matched_total_bytes": sum(res.values()),
       "files_scanned_by_root": {r: sum(v for (rr, _), v in scanned.items() if rr == r) for r in {k[0] for k in scanned}}}
json.dump(out, open(sys.argv[1], "w"), indent=1)
print("matched_GiB", round(out["matched_total_bytes"] / 2**30, 2), "stat_fail", stat_fail)
for row in out["matched"][:25]:
    print(round(row[3] / 2**30, 3), row[0], row[1], "->", row[2], row[4], "files")
