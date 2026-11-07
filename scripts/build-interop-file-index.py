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

THE INDEX DOES NOT INDEX ITSELF. The corpus root's own file-index.json is excluded from the
measurement. If the index listed its own previous bytes, its digest would be a function of the
file it is replacing: the artefact could never be reproduced from the tree, never be checked
against the tree, and every rebuild would change one row for no reason. The exclusion used to
live in the CALLER (scripts/rebuild-interop-file-index.py deleted the previous output before
running this builder), which meant the builder as documented could NOT reproduce the published
index: run it on a checked-out tree and it produced one extra row -- a self-row -- and a
different file. MEASURED 2026-11-07: the committed artefact was a 16,327-row measurement whose
16,327 digests all matched the bytes on disk, while the builder over the same corpus produced
16,328 rows. The exclusion now lives here, where the measurement is taken.

--check. The producer can also CHECK the committed index against the corpus instead of writing
it. It compares the rows and the counts and ignores as_of and source_commit, which move on every
build by design; it reports which paths were added, removed or changed and exits non-zero on
drift. The builder's own USAGE note already says "regenerate and commit the index in the SAME
pull request that changes the corpus" -- nothing enforced it, and MEASURED 2026-11-07 the
published index had drifted from the live corpus on 153 of 3,091 page-served rows plus the
mirror-served OTS manifest. A stated rule with no enforcement is a wish.
"""
import hashlib, json, os, sys, time

ROOT = sys.argv[1] if len(sys.argv) > 1 else "public/interop"
OUT = sys.argv[2] if len(sys.argv) > 2 else "public/interop/file-index.json"
EXCLUSIONS = sys.argv[3] if len(sys.argv) > 3 else "scripts/deploy-exclusions.json"
SOURCE_COMMIT = sys.argv[4] if len(sys.argv) > 4 else None
CHECK = "--check" in sys.argv

# USAGE (from the repository root)
#   python3 scripts/build-interop-file-index.py [public/interop] [public/interop/file-index.json] [scripts/deploy-exclusions.json] [source-commit]
#   python3 scripts/build-interop-file-index.py --check [public/interop] [public/interop/file-index.json] [scripts/deploy-exclusions.json]
# Regenerate and commit the index in the SAME pull request that changes the corpus. The index is a
# measurement of the tree, so a pull request that adds interop files without regenerating it leaves
# the published index behind the corpus — the same failure the OTS manifest had. `--check` is that
# rule made executable: it fails when the committed index and the corpus disagree.

# The corpus root's own index file is the previous measurement of this measurement.
SELF_NAME = "file-index.json"

mirror_dirs = []
if not os.path.exists(EXCLUSIONS):
    # FAIL CLOSED. The `served` label is the one thing this index must not get wrong: a row
    # labelled "pages" tells an agent the site build serves it, when in fact a 302 to the
    # mirror does. A missing exclusions manifest used to leave mirror_dirs empty, so EVERY
    # row was labelled "pages" and the index was written, silently and wrongly. Measured
    # 2026-11-07 while proving this fix: passing a non-existent manifest produced an index
    # with by_served {pages: 16327} instead of {pages: 3089, hf-mirror: 13238}.
    print(f"FAIL: no exclusions manifest at {EXCLUSIONS}. The index labels every path with how "
          f"it is served, and that label comes from this file. Refusing to write an index "
          f"whose served labels would all be wrong.", file=sys.stderr)
    sys.exit(2)
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
skipped_self = 0
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames.sort()
    for fn in sorted(filenames):
        full = os.path.join(dirpath, fn)
        if os.path.islink(full) or not os.path.isfile(full):
            continue
        if fn == SELF_NAME and os.path.abspath(dirpath) == os.path.abspath(ROOT):
            skipped_self += 1
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

counts = {"files": len(rows), "bytes": total, "by_served": by_served}

if CHECK:
    if not os.path.exists(OUT):
        print(f"FAIL: no index at {OUT}; regenerate it with this builder", file=sys.stderr)
        sys.exit(1)
    with open(OUT, "r", encoding="utf-8") as f:
        published = json.load(f)
    want = {r["path"]: r for r in rows}
    have = {r["path"]: r for r in published.get("files", [])}
    added = sorted(set(want) - set(have))
    removed = sorted(set(have) - set(want))
    changed = sorted(p for p in set(want) & set(have)
                     if want[p]["sha256"] != have[p]["sha256"]
                     or want[p]["bytes"] != have[p]["bytes"]
                     or want[p]["served"] != have[p]["served"])
    counts_differ = published.get("counts") != counts
    print(f"check: corpus {len(rows)} rows, published {len(have)} rows, "
          f"added {len(added)} removed {len(removed)} changed {len(changed)}, "
          f"counts {'differ' if counts_differ else 'match'}")
    for label, group in (("added", added), ("removed", removed), ("changed", changed)):
        for path in group[:20]:
            print(f"  {label}: {path}")
        if len(group) > 20:
            print(f"  ... and {len(group) - 20} more {label}")
    if added or removed or changed or counts_differ:
        print("FAIL: the published index does not describe this corpus. "
              "Regenerate it in this same pull request.", file=sys.stderr)
        sys.exit(1)
    print("OK: the published index describes this corpus.")
    sys.exit(0)

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
    "counts": counts,
    "files": rows,
}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(doc, f, indent=1)
    f.write("\n")
print(f"DONE files={len(rows)} bytes={total} out={OUT} size={os.path.getsize(OUT)} "
      f"self-excluded={skipped_self}", flush=True)
