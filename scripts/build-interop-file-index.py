#!/usr/bin/env python3
"""build-interop-file-index.py — a machine-readable index of the estate's interop corpus.

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

TWO RULES THIS BUILDER ENFORCES, BOTH LEARNED THE HARD WAY (2026-11-07).

1. THE INDEX DOES NOT LIST ITSELF, AND MUST NOT. A file cannot contain its own sha256: hashing the
   published file gives a digest that depends on the digest, which has no fixed point. The earlier
   builder walked its own output, so the row it wrote for /interop/file-index.json carried the
   PREVIOUS file's digest — a reader who fetched the index and hashed it got a MISMATCH, on the one
   path where the promise "sha256 is the digest of the file's bytes as published" is easiest to
   check. The output is therefore excluded from the rows, and the document says so. Excluding it
   also makes a refresh convergent: changing only the index changes no row, so a rebuild of an
   unchanged corpus reproduces the same measurement.

2. THE EXCLUSIONS FILE IS MANDATORY, NOT OPTIONAL. The `served` label is a claim about how a door
   behaves, and the one thing this index must not do is state a false one. When
   scripts/deploy-exclusions.json was missing or unreadable, the builder silently fell back to
   labelling EVERY file "pages" — including the 13,238 that are served by a 302 to the evidence
   mirror — and printed no warning. A missing input file is now a hard failure, and the only way to
   build without one is to ask for it by name (--no-exclusions).
"""
import hashlib, json, os, subprocess, sys, time

# USAGE (from the repository root)
#   python3 scripts/build-interop-file-index.py [public/interop] [public/interop/file-index.json] [scripts/deploy-exclusions.json] [source-commit]
#   python3 scripts/build-interop-file-index.py --check [public/interop] [scripts/deploy-exclusions.json]
#   python3 scripts/build-interop-file-index.py --no-exclusions ...        (build with every file labelled "pages")
#
# --check compares a fresh build against the committed index and exits 1 when the MEASUREMENT
# differs. It compares the rows only: as_of and source_commit move on every run, so comparing them
# would report a difference when nothing about the corpus moved.
#
# Regenerate and commit the index in the SAME pull request that changes the corpus. The index is a
# measurement of the tree, so a pull request that adds interop files without regenerating it leaves
# the published index behind the corpus — the same failure the OTS manifest had. The corpus moves
# every day (the daily intake, x402-trust, catalog-trust and hf-census rounds all publish into it),
# so .github/workflows/interop-index-refresh.yml re-measures it on a schedule and lands the result
# the same way the other snapshot rounds do.

argv = sys.argv[1:]
CHECK = "--check" in argv
NO_EXCLUSIONS = "--no-exclusions" in argv
argv = [a for a in argv if not a.startswith("--")]

ROOT = argv[0] if len(argv) > 0 else "public/interop"
EXCLUSIONS = "scripts/deploy-exclusions.json"
OUT = None
SOURCE_COMMIT = None
if CHECK:
    EXCLUSIONS = argv[1] if len(argv) > 1 else EXCLUSIONS
else:
    OUT = argv[1] if len(argv) > 1 else "public/interop/file-index.json"
    EXCLUSIONS = argv[2] if len(argv) > 2 else EXCLUSIONS
    SOURCE_COMMIT = argv[3] if len(argv) > 3 else None


def die(msg, code=2):
    print(f"HALT: {msg}", file=sys.stderr)
    sys.exit(code)


if not os.path.isdir(ROOT):
    die(f"the corpus directory {ROOT} does not exist — nothing to measure")

# The exclusions file decides how each door behaves. If it cannot be read, every file would be
# labelled "pages", which is FALSE for the mirror-served directories. Fail instead of publishing a
# false claim; --no-exclusions is the explicit way to ask for the degraded build.
mirror_dirs = []
mirror_prefixes = []
if NO_EXCLUSIONS:
    print("exclusions: SKIPPED by request (--no-exclusions) — every file will be labelled 'pages'",
          flush=True)
else:
    if not os.path.exists(EXCLUSIONS):
        die(f"the exclusions file {EXCLUSIONS} is missing.\n"
            f"       Without it this builder cannot know which directories are served by a 302 to\n"
            f"       the evidence mirror, and every file would be labelled 'pages' — a false claim\n"
            f"       about how a door behaves. Pass --no-exclusions only if that is what you want.")
    try:
        with open(EXCLUSIONS, "r", encoding="utf-8") as f:
            man = json.load(f)
    except Exception as e:
        die(f"the exclusions file {EXCLUSIONS} could not be read as JSON ({e}).\n"
            f"       Same consequence as a missing file: every path would be labelled 'pages'.")
    for e in man.get("entries", []):
        if e.get("kind") == "dir" and not e.get("mirror_only"):
            mirror_dirs.append(e["path"].strip("/"))
    # The exclusion paths are relative to public/; this corpus is public/interop, so a mirror directory
    # is one that lives under interop/. Getting this wrong would label a 302-served file as
    # "pages" — a false statement about how a door behaves, which is the one thing this index must not do.
    mirror_prefixes = [d for d in mirror_dirs if d.startswith("interop/")]
    if mirror_dirs and not mirror_prefixes:
        die(f"{EXCLUSIONS} lists {mirror_dirs} but none of them is under interop/.\n"
            f"       That cannot be right for this corpus, and building anyway would label every\n"
            f"       file 'pages'.")
    print("mirror-served dirs:", mirror_dirs, "-> matching this corpus:", mirror_prefixes, flush=True)

# The output is EXCLUDED from the rows: a file cannot carry its own digest, and a row that claimed
# one would be wrong the moment it was written. The corpus's own index is excluded for the same
# reason, so the rule holds however the output path is chosen. See rule 1 in the docstring.
OUT_ABS = os.path.abspath(OUT) if OUT else None
SELF_ABS = os.path.abspath(os.path.join(ROOT, "file-index.json"))

rows = []
total = 0
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames.sort()
    for fn in sorted(filenames):
        full = os.path.join(dirpath, fn)
        if os.path.islink(full) or not os.path.isfile(full):
            continue
        if os.path.abspath(full) in (OUT_ABS, SELF_ABS):
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

if CHECK:
    idx_path = os.path.join(ROOT, "file-index.json")
    if not os.path.isfile(idx_path):
        die(f"{idx_path} does not exist — there is nothing to compare against")
    try:
        with open(idx_path, "r", encoding="utf-8") as f:
            committed = json.load(f)
    except Exception as e:
        die(f"{idx_path} could not be read as JSON ({e})")
    old = {r["path"]: r for r in committed.get("files", [])}
    new = {r["path"]: r for r in rows}
    added = sorted(set(new) - set(old))
    removed = sorted(set(old) - set(new))
    changed = sorted(p for p in set(old) & set(new)
                      if (old[p]["sha256"], old[p]["bytes"], old[p]["served"])
                      != (new[p]["sha256"], new[p]["bytes"], new[p]["served"]))
    if not (added or removed or changed):
        print(f"OK: the published index matches the corpus ({len(rows)} files, "
              f"{by_served.get('pages', 0)} pages / {by_served.get('hf-mirror', 0)} hf-mirror)")
        sys.exit(0)
    print(f"DRIFT: the published index does not match the corpus.", file=sys.stderr)
    for p in added:
        print(f"  not in the index  {p}", file=sys.stderr)
    for p in removed:
        print(f"  gone from the tree {p}", file=sys.stderr)
    for p in changed:
        print(f"  bytes changed     {p}  {old[p]['sha256'][:12]} -> {new[p]['sha256'][:12]}"
              f"  ({old[p]['served']} -> {new[p]['served']})", file=sys.stderr)
    print(f"  {len(added)} added, {len(removed)} removed, {len(changed)} changed", file=sys.stderr)
    sys.exit(1)

if SOURCE_COMMIT is None:
    # Name the commit this measurement was taken from, when there is one to name.
    try:
        SOURCE_COMMIT = subprocess.run(["git", "-C", ROOT, "rev-parse", "HEAD"],
                                       capture_output=True, text=True, check=True).stdout.strip() or None
    except Exception:
        SOURCE_COMMIT = None

doc = {
    "schema": "csoai.interop-file-index/0.1",
    "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "source_commit": SOURCE_COMMIT,
    "what_this_is": ("Every file the estate publishes under /interop/, with its size, its sha256 and "
                     "how it is served. Built by reading the committed tree, so it is a measurement, "
                     "not a list of intentions. The index does not list itself: a file cannot carry "
                     "its own digest, so a row claiming one would be wrong the moment it was written."),
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
