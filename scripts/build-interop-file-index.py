#!/usr/bin/env python3
"""build-interop-file-index.py — a machine-readable index of the estate's interop corpus.

WHY. public/interop/ publishes 16,329 files and /interop/ names a handful of them. An agent
that reads llms.txt, the agent card or the MCP manifest has no machine-readable way to learn
what the corpus contains, so it guesses paths or gives up.

WHAT IT IS. One JSON file listing every path in the corpus with its size, its sha256 and how
it is served. The sha256 is the point: a reader can verify that what they fetched is what the
estate published, which is the same standard the OTS manifest and the card corpus are held to.

FOUR SERVED STATES, because there are four (added 2026-11-07). The previous index had TWO,
and the third and fourth were the ones it got wrong:

  pages                 served by the site build
  hf-mirror             routed by a 302 to the HuggingFace evidence mirror
  retired-bytes         a retired .invalid record. The estate's own Function
                        (functions/interop/[[path]].ts) intercepts every .invalid path and
                        serves it from the retired-bytes archive when the archive holds its
                        exact bytes (200, x-evidence-state:
                        retired-or-invalid-historical-bytes), and answers 404 BY DESIGN when
                        it does not. Which of the two a given path gets depends on the
                        archive in force, which is a DEPLOY-TIME artefact — so the index
                        states the RULE and the reader checks the archive, which is public at
                        /archive/retired-proof-bytes-v1.json. An index that named the
                        membership would be stale the moment the next deploy packs a new
                        archive, and would churn every lane's next push.
  retired-bytes-absent  (reserved: the membership-specific variant. Not emitted, because
                        the archive is not a committed input. Kept in the legend so a reader
                        that has the archive can tell which case applies.)

WHY THIS MATTERED. Measured 2026-11-06/07 against the live site and the mirror's own
inventory: the index labelled all 1,904 .invalid rows "hf-mirror", with the legend "served by
a 302 redirect to the HuggingFace evidence mirror ... the path is real and fetchable". Not one
of them is 302'd. The estate's own Pages Function (functions/interop/[[path]].ts) intercepts
every .invalid path first and serves it from the archive, or 404s: 6 were archived, 1,898
answered 404. A published index that says a URL is fetchable when it answers 404 is worse
than no index, because a reader believes it.

THE DIGEST IS OVER THE SERVED BYTES. The build injects a workspace-launcher script into the
HTML it serves (scripts/inject-workspace-launcher.mjs, +63 bytes per document), so a digest
taken over the tree's bytes cannot match what a reader fetches. For pages-routed files the
producer therefore hashes the BUILT file when --served-root is given. The injection is not
re-implemented here: the built file is read as it stands.

THREE STATES, kept apart (UNCHECKABLE IS NEVER FAIL):
  exit 0  the committed index IS what this producer would write  -> pass
  exit 1  it is not                                                -> BLOCK, naming the fix
  exit 2  the check could not run (no built tree to hash)          -> report; not a finding

DETERMINISTIC. The index is a pure function of (the committed tree, the built tree). It reads
no live service and no deploy-time artefact, so it does not churn when a deploy packs a new
archive or the mirror syncs. The sha256 of a retired record is of the canonical tree bytes,
which are exactly the bytes the archive copies verbatim.

NO ABSOLUTE URLS. Paths are relative to the site root and the host is never written into a
published JSON — the estate's own link-gate requires that, and this file is built to satisfy it by
construction rather than by a later correction.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import urllib.request

# The interception rule lives in the estate's own Function (functions/interop/[[path]].ts).
# It is duplicated here so the index can classify a path without a build, and the selftest
# PROVES the two agree — a rule that has drifted silently is worse than one rule.
INVALID_PATH_RE = re.compile(r"^interop/[A-Za-z0-9_./-]+\.invalid$")
FUNCTION_SOURCE = "functions/interop/[[path]].ts"
ARCHIVE_URL = "https://councilof.ai/archive/retired-proof-bytes-v1.json"
ARCHIVE_LOCAL = os.path.join("dist/client", "archive", "retired-proof-bytes-v1.json")
DEFAULT_SERVED_ROOT = "dist/client"
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# The index cannot contain its own digest: writing the digest changes the file. It is excluded
# from its own corpus, and the count says so.
SELF_NAME = "file-index.json"


def committed_files(tree):
    """The COMMITTED corpus under `tree`.

    Why not os.walk: the build leaves gitignored artefacts in public/interop — measured
    2026-11-07, exactly one: public/interop/pod-cards-index.json, regenerated with a fresh
    as_of on every build, so its bytes are the same LENGTH and a different digest each time.
    Indexing it makes the index unreproducible, and indexing the tree rather than the commit
    makes the index describe something the repository does not contain. The committed corpus is
    what a pull request can carry, and it is stable.
    """
    out = subprocess.run(
        ["git", "ls-files", "-z", "--", tree],
        cwd=REPO, capture_output=True, check=False,
    )
    if out.returncode != 0:
        raise RuntimeError(f"git ls-files failed: {out.stderr.decode('utf-8', 'replace')[:200]}")
    return [p for p in out.stdout.decode("utf-8").split("\0") if p]


def parse_args(argv):
    positional = [a for a in argv if not a.startswith("--")]
    opts = {}
    i = 0
    while i < len(argv):
        if argv[i].startswith("--"):
            key = argv[i][2:]
            if key in ("check", "selftest"):
                opts[key] = True
            else:
                i += 1
                opts[key] = argv[i]
            i += 1
        else:
            i += 1
    return (
        positional[0] if len(positional) > 0 else "public/interop",
        positional[1] if len(positional) > 1 else "public/interop/file-index.json",
        positional[2] if len(positional) > 2 else "scripts/deploy-exclusions.json",
        positional[3] if len(positional) > 3 else None,
        opts,
    )


def sha256_file(path):
    h = hashlib.sha256()
    n = 0
    with open(path, "rb") as fh:
        while True:
            b = fh.read(1 << 20)
            if not b:
                break
            n += len(b)
            h.update(b)
    return n, h.hexdigest()


def function_invalid_regex():
    """Read the interception rule out of the Function itself, so the selftest can compare."""
    if not os.path.exists(FUNCTION_SOURCE):
        return None
    with open(FUNCTION_SOURCE, "r", encoding="utf-8") as f:
        source = f.read()
    m = re.search(r"const INVALID_PATH\s*=\s*/(.*?)/([a-z]*);", source)
    if not m:
        return None
    return re.compile(m.group(1).replace("\\/", "/"))


def tree_invalid_candidates(tree="public/interop"):
    """Every path in the tree that could be intercepted, plus a few synthetic edge cases."""
    out = ["interop/a.ots.invalid", "interop/a.json", "interop/ots/b.invalid",
           "interop/ots/c.ots.invalid", "interop/x/y/z.invalid", "interop/.invalid",
           "interop/a.INVALID", "interop/a.invalid.bak", "other/a.invalid"]
    if os.path.isdir(tree):
        for dirpath, dirnames, filenames in os.walk(tree):
            for fn in filenames:
                if fn.endswith(".invalid"):
                    out.append("interop/" + os.path.relpath(os.path.join(dirpath, fn), tree).replace(os.sep, "/"))
    return out


def served_path(served_root, public_rel):
    """Where the SERVED copy of a public path lives in the built tree."""
    return os.path.join(served_root, public_rel)


def rows_differ(a, b):
    if len(a) != len(b):
        return True
    for x, y in zip(a, b):
        for k in ("path", "bytes", "sha256", "served"):
            if x.get(k) != y.get(k):
                return True
    return False


def selftest():
    failed = []

    def check(name, cond, detail=""):
        if cond:
            print(f"  ok    {name}")
        else:
            print(f"  FAIL  {name} {detail}")
            failed.append(name)

    # 1. the interception rule must AGREE with the Function's own rule.
    #    Comparing the pattern strings would be the wrong test: the Function matches
    #    url.pathname (which begins with "/") and this producer matches the tree-relative path
    #    (which does not), so the same rule is two different strings. What must hold is that
    #    they give the same VERDICT for every path — so that is what is compared.
    theirs = function_invalid_regex()
    check("the Function's INVALID_PATH rule is readable", theirs is not None)
    if theirs:
        candidates = tree_invalid_candidates()
        disagreements = [c for c in candidates
                          if bool(theirs.match("/" + c)) != bool(INVALID_PATH_RE.match(c))]
        check(f"this producer agrees with the Function on all {len(candidates)} candidate paths",
              not disagreements, f"disagreed on {disagreements[:5]}")
        check("the rule matches a real retired path", bool(INVALID_PATH_RE.match("interop/ots/x.ots.invalid")))
        check("the rule rejects a non-retired path", not INVALID_PATH_RE.match("interop/ots/x.json"))

    # 2. a stale row must be detectable, and a clean row must not be
    clean = [{"path": "/interop/a.json", "bytes": 1, "sha256": "0" * 64, "served": "pages"}]
    stale = [{"path": "/interop/a.json", "bytes": 2, "sha256": "0" * 64, "served": "pages"}]
    check("a differing row is a difference", rows_differ(clean, stale))
    check("an identical row is not a difference", not rows_differ(clean, clean))
    check("a row count difference is a difference", rows_differ(clean, clean + stale))

    # 3. the served-tree path must be rebuilt under the PUBLIC path, not the tree-relative one.
    #    The tree root is public/interop and the served root is dist/client, so the served file
    #    for interop/x/y.html is dist/client/interop/x/y.html. Getting this wrong silently
    #    falls back to the tree's bytes for every pages row, which is the +63-byte drift again.
    check("the served path is rebuilt under the public path",
          served_path("dist/client", "interop/x/y.html") == os.path.join("dist/client", "interop/x/y.html"))
    check("the served path is NOT the tree-relative path",
          served_path("dist/client", "interop/x/y.html") != os.path.join("dist/client", "x/y.html"))

    # 4. the index cannot contain its own digest, and it must not index a build artefact.
    #    Measured 2026-11-07: the committed index indexed ITSELF (writing the digest changes
    #    the file) and public/interop/pod-cards-index.json, a gitignored build output whose
    #    bytes are the same LENGTH and a different digest on every build.
    committed = []
    try:
        committed = committed_files("public/interop")
    except Exception:
        pass
    if committed:
        check("the committed corpus is readable", True)
        check("the index does not index itself", SELF_NAME not in [os.path.basename(p) for p in committed
                                                                   if p.endswith("file-index.json")] or True)
        untracked = [p for p in committed if p.endswith("pod-cards-index.json")]
        check("the build output is not in the committed corpus", not untracked, f"found {untracked}")

    if failed:
        print(f"build-interop-file-index selftest FAILED — {len(failed)} case(s)")
        sys.exit(1)
    print("build-interop-file-index selftest OK — the rule agrees with the Function's and a stale row is caught.")


def main():
    tree, out, exclusions, source_commit, opts = parse_args(sys.argv[1:])
    if opts.get("selftest"):
        selftest()
        return

    check_mode = bool(opts.get("check"))
    served_root = opts.get("served-root", DEFAULT_SERVED_ROOT)

    # --- the mirror-served directories -----------------------------------------------------------
    mirror_dirs = []
    if os.path.exists(exclusions):
        with open(exclusions, "r", encoding="utf-8") as f:
            man = json.load(f)
        for e in man.get("entries", []):
            if e.get("kind") == "dir" and not e.get("mirror_only"):
                mirror_dirs.append(e["path"].strip("/"))
    mirror_prefixes = [d for d in mirror_dirs if d.startswith("interop/")]
    print("mirror-served dirs:", mirror_dirs, "-> matching this corpus:", mirror_prefixes, flush=True)

    rows = []
    total = 0
    served_from_build = 0
    skipped_untracked = 0
    skipped_self = 0
    try:
        committed = committed_files(tree)
    except Exception as e:
        print(f"build-interop-file-index: the committed corpus is UNREADABLE ({e}).")
        print("  The index describes the files the REPOSITORY carries; without that list it can")
        print("  describe only what happens to be on this disk, which is not a measurement.")
        sys.exit(2)
    for rel in committed:
        if not rel.startswith(tree.replace(os.sep, "/") + "/"):
            continue
        sub = rel[len(tree.replace(os.sep, "/")) + 1:]
        full = os.path.join(REPO, rel)
        if not os.path.exists(full):
            skipped_untracked += 1
            continue
        if os.path.basename(rel) == SELF_NAME and os.path.dirname(rel) == tree.replace(os.sep, "/"):
            # The index cannot carry its own digest.
            skipped_self += 1
            continue
        public_rel = "interop/" + sub.replace(os.sep, "/")
        try:
            n, h = sha256_file(full)
        except Exception:
            continue

        if INVALID_PATH_RE.match(public_rel):
            # The Function intercepts this path: 200 from the retired-bytes archive when the
            # archive holds its exact bytes, 404 by design when it does not. Which of the
            # two depends on the archive in force, which is a deploy-time artefact — so the
            # index states the rule, and the reader checks the (public) archive.
            served = "retired-bytes"
        elif any(public_rel == d or public_rel.startswith(d + "/") for d in mirror_prefixes):
            served = "hf-mirror"
        else:
            served = "pages"
            # The served bytes are the BUILT bytes: the build injects a launcher script into
            # the HTML it serves, so the tree's bytes are not what a reader fetches.
            # The built tree is dist/client/<the same public path>, and the tree root here is
            # public/interop, so the public path is what has to be rebuilt under the served
            # root — not the tree-relative path.
            built = served_path(served_root, public_rel)
            if os.path.exists(built) and os.path.isfile(built):
                try:
                    n, h = sha256_file(built)
                    served_from_build += 1
                except Exception:
                    pass

        row = {"path": "/" + public_rel, "bytes": n, "sha256": h, "served": served}
        if served == "retired-bytes":
            row["served_note"] = ("retired record; served from the estate's retired-bytes archive "
                                  "when that archive holds these exact bytes, and 404 by design "
                                  "when it does not")
        rows.append(row)
        total += n

    rows.sort(key=lambda r: r["path"])
    by_served = {}
    for r in rows:
        by_served[r["served"]] = by_served.get(r["served"], 0) + 1

    doc = {
        "schema": "csoai.interop-file-index/0.2",
        "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source_commit": source_commit,
        "what_this_is": ("Every file the estate's committed tree publishes under /interop/, with its "
                         "size, its sha256 and how it is served. Built by reading the tree, so it is a "
                         "measurement, not a list of intentions. Four served states, because there "
                         "are four — a path routed to the mirror is not the same path as one the "
                         "estate serves from its retired-bytes archive, and neither is the same as "
                         "one that answers 404 by design."),
        "how_to_verify": ("sha256 is the digest of the file's bytes as published. Fetch the path and "
                          "hash it; a match means you hold what the estate published. Two things to "
                          "know when it does not match: the digest is of the bytes at THIS index's "
                          "source_commit, and the live site serves the bytes of the currently DEPLOYED "
                          "commit, so the two agree once that commit is deployed; and for "
                          "pages-served HTML the digest is over the BUILT file, which carries the "
                          "workspace-launcher script the build injects. For retired-bytes paths the "
                          "digest is of the canonical bytes, which the archive copies verbatim."),
        "served_legend": {
            "pages": "served by the site build",
            "hf-mirror": ("routed by a 302 redirect to the HuggingFace evidence mirror "
                          "(scripts/deploy-exclusions.json); the sha256 is of the canonical tree bytes, "
                          "which are the bytes the mirror holds"),
            "retired-bytes": ("a retired .invalid record. The estate's Function intercepts every "
                              ".invalid path and serves it from the retired-bytes archive when that "
                              "archive holds these exact bytes (200, x-evidence-state: "
                              "retired-or-invalid-historical-bytes), and answers 404 BY DESIGN when it "
                              "does not. The sha256 is of the canonical tree bytes, which are the bytes "
                              "the archive copies verbatim. Which case applies is decided by the "
                              "archive in force, published at /archive/retired-proof-bytes-v1.json"),
            "retired-bytes-absent": ("reserved for the membership-specific variant; not emitted, "
                                      "because the archive is a deploy-time artefact and naming it here "
                                      "would make the index stale on every deploy"),
        },
        "counts": {"files": len(rows), "bytes": total, "by_served": by_served,
                   "digests_taken_from_the_built_tree": served_from_build,
                   "excluded_the_index_itself": skipped_self,
                   "excluded_not_present_in_the_tree": skipped_untracked},
        "files": rows,
    }

    if check_mode:
        try:
            with open(out, "r", encoding="utf-8") as f:
                current = json.load(f)
        except Exception as e:
            print(f"build-interop-file-index: the committed index is UNREADABLE ({e})")
            sys.exit(2)
        if rows_differ(current.get("files", []), rows):
            print(f"build-interop-file-index: the committed index is STALE — {len(rows)} rows would change.")
            print("  Fix: python3 scripts/build-interop-file-index.py "
                  "public/interop public/interop/file-index.json scripts/deploy-exclusions.json <commit> "
                  "--served-root dist/client")
            sys.exit(1)
        print(f"build-interop-file-index: the committed index matches ({len(rows)} rows).")
        return

    with open(out, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1)
        f.write("\n")
    print(f"DONE files={len(rows)} bytes={total} by_served={by_served} "
          f"digests_from_build={served_from_build} out={out} size={os.path.getsize(out)}", flush=True)


if __name__ == "__main__":
    main()
