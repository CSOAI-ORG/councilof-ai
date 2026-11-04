#!/usr/bin/env python3
"""build-interop-index.py — a machine-readable index of the estate's interop corpus.

WHY. public/interop/ publishes 16,317 files and /interop/ names 15 of them — 0.09 % discoverable.
The corpus is complete; the index is not. An agent that reads llms.txt, the agent card or the MCP
manifest has no machine-readable way to learn what the corpus contains, so it guesses paths or
gives up. This is the front-to-back defect in the agent journey.

WHAT IT IS. One JSON file listing every path in the corpus with its size, its sha256 and how it is
served. The sha256 is the point: a reader can verify that what they fetched is what the estate
published, which is the same standard the OTS manifest and the card corpus are held to.

HOW IT IS SERVED. Four directories under public/interop leave the Pages build and are served by a
302 to the HuggingFace mirror (scripts/deploy-exclusions.json). Those paths are still real, fetchable
URLs; the index says which are which, so an agent does not treat a 302 as a dead door.

NO ABSOLUTE URLS. Paths are relative to the site root and the host is never written into a
published JSON — the estate's own link-gate requires that, and this file is built to satisfy it by
construction rather than by a later correction.
"""
import hashlib, json, os, sys, time

ROOT = sys.argv[1] if len(sys.argv) > 1 else "public/interop"
OUT = sys.argv[2] if len(sys.argv) > 2 else "public/interop/file-index.json"
EXCLUSIONS = sys.argv[3] if len(sys.argv) > 3 else "scripts/deploy-exclusions.json"
SOURCE_COMMIT = sys.argv[4] if len(sys.argv) > 4 else None

# USAGE (from the repository root)
#   python3 scripts/build-interop-file-index.py [public/interop] [public/interop/file-index.json] [scripts/deploy-exclusions.json] [source-commit]
# Regenerate and commit the index in the SAME pull request that changes the corpus. The index is a
# measurement of the tree, so a pull request that adds interop files without regenerating it leaves
# the published index behind the corpus — the same failure the OTS manifest had.

mirror_dirs = []
if os.path.exists(EXCLUSIONS):
    with open(EXCLUSIONS, "r", encoding="utf-8") as f:
        man = json.load(f)
    for e in man.get("entries", []):
        if e.get("kind") == "dir" and not e.get("mirror_only"):
            mirror_dirs.append(e["path"].strip("/"))
# The exclusion paths are relative to public/; this corpus is public/interop, so a mirror directory
# is one that lives under interop/. Getting this wrong would label a 302-served file as
# "pages" — a false statement about how a door behaves, which is the one thing this index must not do.
mirror_prefixes = [d for d in mirror_dirs if d.startswith("interop/")]
print("mirror-served dirs:", mirror_dirs, "-> matching this corpus:", mirror_prefixes, flush=True)

rows = []
total = 0
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames.sort()
    for fn in sorted(filenames):
        full = os.path.join(dirpath, fn)
        if os.path.islink(full) or not os.path.isfile(full):
            continue
        rel = os.path.relpath(full, ROOT)                 # e.g. ots/manifest.json  (ROOT is public/interop)
        public_rel = "interop/" + rel.replace(os.sep, "/")
        try:
            h = hashlib.sha256()
            n = 0
            with open(full, "rb") as fh:
                while True:
                    b = fh.read(1 << 20)
                    if not b:
                        break
                    n += len(b)
                    h.update(b)
        except Exception:
            continue
        served = "hf-mirror" if any(public_rel == d or public_rel.startswith(d + "/") for d in mirror_prefixes) else "pages"
        rows.append({"path": "/" + public_rel, "bytes": n, "sha256": h.hexdigest(), "served": served})
        total += n

rows.sort(key=lambda r: r["path"])
by_served = {}
for r in rows:
    by_served[r["served"]] = by_served.get(r["served"], 0) + 1

doc = {
    "schema": "csoai.interop-file-index/0.1",
    "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "source_commit": SOURCE_COMMIT,
    "what_this_is": ("Every file the estate publishes under /interop/, with its size, its sha256 and "
                     "how it is served. Built by reading the committed tree, so it is a measurement, "
                     "not a list of intentions."),
    "how_to_verify": ("sha256 is the digest of the file's bytes as published. Fetch the path and hash "
                      "it; a match means you hold what the estate published."),
    "served_legend": {
        "pages": "served by the site build",
        "hf-mirror": "served by a 302 redirect to the HuggingFace evidence mirror (scripts/deploy-exclusions.json); the path is real and fetchable",
    },
    "counts": {"files": len(rows), "bytes": total, "by_served": by_served},
    "files": rows,
}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(doc, f, indent=1)
    f.write("\n")
print(f"DONE files={len(rows)} bytes={total} out={OUT} size={os.path.getsize(OUT)}", flush=True)
