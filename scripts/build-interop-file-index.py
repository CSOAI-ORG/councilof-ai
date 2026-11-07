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
  retired-bytes         a retired .invalid record that is NOT mirror-served. The estate's own
                        Function (functions/interop/[[path]].ts) answers these itself, from
                        the retired-bytes archive, with
                        x-evidence-state: retired-or-invalid-historical-bytes.
  retired-bytes-absent  (reserved: the membership-specific variant. Not emitted, because the
                        archive is a deploy-time artefact and naming it here would make the
                        index stale on every deploy.)

A .invalid path under a MIRROR-SERVED prefix is hf-mirror, not retired-bytes: since PR #4010
the Function DEFERS for those, so the request reaches public/_redirects, is 302'd to the
mirror, and the bytes served are the canonical tree bytes. The Function's own
MIRROR_SERVED_PREFIXES decides that, and the selftest proves it agrees with the exclusions.
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

AND THE EDGE REWRITES SOME HTML IN TRANSIT, so a row can be published honestly and still not be
hash-matchable by a reader. Cloudflare rewrites an href="http:// link to https:// and replaces an
href="mailto:" link with an obfuscated address that is RANDOMISED PER REQUEST. MEASURED
2026-11-07 on the live site: 52 of the 53 HTML rows under /interop/ are byte-stable across two
consecutive fetches and their published digests match the served bytes exactly; ONE row is not,
and three consecutive fetches of it returned three different digests. Every row therefore carries
`served_bytes`, which says whether the bytes the site serves are the bytes the estate published —
and a row the edge rewrites says so rather than promising a match it cannot keep.

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

# THE EDGE REWRITES HTML IN TRANSIT. Cloudflare applies two transforms to HTML served from this
# zone, and both change the bytes a reader fetches without changing the bytes the estate
# published:
#
#   https-rewrite      an href="http://..." link is served as href="https://..."
#   email-obfuscation  an href="mailto:..." link is served as a <span class="__cf_email__">
#                      whose obfuscated address is RANDOMISED PER REQUEST
#
# MEASURED 2026-11-07 on the live site, over the 53 HTML rows under /interop/: 52 rows are
# byte-stable across two consecutive fetches and their published digests match the served bytes
# exactly. ONE row is not -- /interop/stablecoin-deep-2026-09/mirrors/129.html, whose markup
# carries 18 href="http://" links and 2 href="mailto:" links. The site served 1,423,000 B
# against the published 1,422,708 B (+292 B: 6 links rewritten http->https, both mailto links
# obfuscated), and three consecutive fetches of that path returned THREE different digests.
#
# So a row the edge touches cannot be verified by hashing the served bytes, and an obfuscated
# row never can be -- the served bytes differ on every fetch. The index says that per row
# instead of promising a match it cannot keep.
#
# The triggers are read from the PUBLISHED MARKUP, because that is what the edge sees. The
# injected launcher carries neither trigger (measured: 0 occurrences), so a row's trigger set is
# the same whether the bytes are the tree's or the built file's.
EDGE_HTTP_LINK_RE = re.compile(rb'href="http://')
EDGE_MAILTO_LINK_RE = re.compile(rb'href="mailto:')


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


def mirror_routed_paths(man):
    """The paths the exclusions manifest routes to the mirror.

    BOTH kinds count. A `dir` entry routes everything under it; a `file` entry routes that ONE
    file. MEASURED 2026-11-07: two files were routed by public/_redirects with their own 302
    rules (interop/effect-binding-server-probe-2026-09-22.json and ...-2026-09-30.json, whose
    exclusion notes say "served via 302 from HF"), but the producer only collected `kind == "dir"`
    entries, so it labelled them "pages" — the wrong served state for files the BUILD DROPS from
    dist/client. Their `.signed.json` companions stay on-site and are correctly "pages".
    """
    dirs, files = [], []
    for e in man.get("entries", []):
        if e.get("kind") in ("dir", "file") and not e.get("mirror_only"):
            (dirs if e.get("kind") == "dir" else files).append(e["path"].strip("/"))
    return dirs, files


def function_mirror_prefixes():
    """The mirror-served prefixes the estate's Function DEFERS to the redirect chain for.

    Read out of functions/interop/[[path]].ts (MIRROR_SERVED_PREFIXES, added by PR #4010).
    It is the authority for what actually serves a .invalid path: for these prefixes the
    Function steps aside and the public/_redirects 302 takes the request to the Hugging Face
    mirror, so the path is served and fetchable. For every other .invalid path the Function
    answers itself, from the retired-bytes archive.
    """
    if not os.path.exists(FUNCTION_SOURCE):
        return None
    with open(FUNCTION_SOURCE, "r", encoding="utf-8") as f:
        source = f.read()
    m = re.search(r"MIRROR_SERVED_PREFIXES\s*=\s*\[(.*?)\]", source, re.S)
    if not m:
        return None
    return re.findall(r'"([^"]+)"', m.group(1))


def edge_transforms(data):
    """The Cloudflare edge transforms this markup carries, as a set of names.

    WHY THIS IS READ FROM THE BYTES. Both transforms act on an href attribute, so the markup
    that carries them is exactly the markup the edge rewrites. An empty set means the edge
    leaves these bytes alone.

    A mailto inside a script is NOT a trigger: `window.open('mailto:x@y')` is not an href, and
    MEASURED 2026-11-07 the edge left such a link alone (the page's served bytes matched its
    published digest exactly).
    """
    found = set()
    if EDGE_HTTP_LINK_RE.search(data):
        found.add("https-rewrite")
    if EDGE_MAILTO_LINK_RE.search(data):
        found.add("email-obfuscation")
    return found


def served_bytes_state(transforms):
    """What this row says about the bytes the site serves for it.

    as-published                 the served bytes are the bytes the estate published
    edge-transformed             the edge rewrites the markup, so the served bytes differ from
                                 the published bytes — reproducibly
    edge-transformed-per-request the edge rewrites the markup AND the rewrite is randomised per
                                 request, so the served bytes differ on every fetch and no digest
                                 of them can be reproduced by anyone, including us

    The sha256 in the row stays the digest of the PUBLISHED bytes in every case. That is what
    the estate published, and it is the only thing about these bytes that does not change.
    """
    if not transforms:
        return "as-published", None
    names = ", ".join(sorted(transforms))
    if "email-obfuscation" in transforms:
        return ("edge-transformed-per-request",
                "the edge rewrites this markup (%s) and the rewrite is randomised per request, "
                "so the bytes served differ on every fetch and no digest of them can be "
                "reproduced; the sha256 here is of the bytes the estate published" % names)
    return ("edge-transformed",
            "the edge rewrites this markup in transit (%s), so the bytes served are not the "
            "bytes published here; the sha256 here is of the bytes the estate published" % names)


def served_html_digests(tree, served_root):
    """The bytes the injector WOULD write for each HTML file, from the injector's own transform.

    WHY. The build injects a workspace-launcher script into every HTML page it serves, so the
    served bytes of an HTML file are NOT the tree's bytes. MEASURED 2026-11-07: with the
    committed tree standing in for the built one, 23 published rows differ by exactly +63 bytes.

    So a measurement that cannot reach the built tree must not compare tree bytes to published
    digests and call it drift. It asks THE INJECTOR ITSELF (scripts/surface/served-html-digests.mjs
    imports scripts/inject-workspace-launcher.mjs and calls its exported injectLauncher) what it
    would write. One rule, one place — the estate's own principle that the claim lives in two
    places: the artefact and the generator that emits it.

    The injector has TWO rules, not one: it adds the launcher to a page, and it REFUSES to touch
    a frozen interop mirror capture. A helper that asks only for the transform therefore publishes
    a digest the site does not serve for every mirror capture. MEASURED 2026-11-07: with the
    transform alone, the fallback disagreed with the served bytes on 29 of the 53 HTML rows under
    public/interop — every one of them a mirror capture — by exactly the launcher's size, and
    matched on every other HTML file. The helper now asks the injector for both rules, so the two
    forms of this measurement AGREE: with a built tree and without one, the same check gives the
    same answer (measured 2026-11-07: 53 of 53 rows agree, 0 disagree). The injector is the only
    place either rule is written, so it is the only place they are read from.

    Returns {} when node or the helper is unavailable — the caller then treats those digests as
    UNCHECKABLE rather than different.
    """
    if served_root and os.path.isdir(served_root):
        return {}
    helper = os.path.join(REPO, "scripts", "surface", "served-html-digests.mjs")
    if not os.path.exists(helper):
        return {}
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
        out = tmp.name
    try:
        r = subprocess.run(["node", helper, tree, out], cwd=REPO, capture_output=True, timeout=120)
        if r.returncode != 0:
            return {}
        with open(out, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}
    finally:
        try:
            os.unlink(out)
        except OSError:
            pass


def head_commit(cwd=REPO):
    """The commit whose tree this run measured, or None if git cannot say.

    The index NAMES the commit its digests were taken from, so the name must be a commit of
    this tree. Measured 2026-11-07: the drift reporter tells lanes to repair the index with
    `python3 scripts/build-interop-file-index.py public/interop public/interop/file-index.json
    scripts/deploy-exclusions.json` — with no commit — and that run wrote `"source_commit":
    null`. A published index whose pointer is null names NO tree at all, so the verification
    instruction in its own how_to_verify ("the digest is of the bytes at THIS index's
    source_commit") cannot be carried out by anyone. The name is therefore never left empty:
    a run that measures the tree at HEAD names HEAD.
    """
    r = subprocess.run(["git", "rev-parse", "HEAD"], cwd=cwd, capture_output=True, check=False)
    if r.returncode != 0:
        return None
    return r.stdout.decode("utf-8", "replace").strip() or None


def commit_resolves_locally(sha, cwd=REPO):
    """Is `sha` a commit this repository holds? True / False / None (cannot tell).

    Three states, never collapsed, for the reason the estate's own pin gate states it: "not an
    ancestor" is a finding about the tree and "cannot answer" is an unprovable state, and
    collapsing them would let a gate pass on ignorance. A truncated store answers 128 for a
    commit it does not hold, which is an absence of evidence, not evidence of absence.
    """
    if not isinstance(sha, str) or not re.fullmatch(r"[0-9a-f]{40}", sha):
        return False
    r = subprocess.run(["git", "cat-file", "-e", f"{sha}^{{commit}}"], cwd=cwd,
                       capture_output=True, check=False)
    if r.returncode == 0:
        return True
    if r.returncode == 128:
        return None
    return False


def _remote_can_serve(sha, cwd=REPO):
    """Ask the remote for one commit, the way a reader would. True / False / None."""
    try:
        r = subprocess.run(
            ["git", "fetch", "--dry-run", "--depth=1", "--no-tags", "origin", sha],
            cwd=cwd, capture_output=True, check=False,
        )
    except OSError:
        return None
    if r.returncode == 0:
        return True
    err = r.stderr.decode("utf-8", "replace")
    # The remote's own words for "I do not have that commit". Anything else — no network, no
    # origin, a git that cannot run — stops the QUESTION being answered, which is not the same
    # as the answer being no.
    if "not our ref" in err or "couldn't find remote ref" in err:
        return False
    return None


def pointer_verdict(sha, cwd=REPO, ask=None):
    """FOLLOWS / DEAD / UNPROVABLE — can a reader fetch the commit this index names?

    The index's own how_to_verify tells the reader: "the digest is of the bytes at THIS index's
    source_commit", and to fetch that commit and compare. So the pointer is only true if a
    reader CAN fetch it. Measured 2026-11-07 on the published index: it named
    99f8456e9308ba2a8d746e02b8d1d25563542146, and the remote answered "upload-pack: not our
    ref" for it — that commit was never pushed, so the published verification instruction could
    not be carried out by anyone. Nothing noticed, because the check compared the ROWS and the
    rows were fine: a check that reports ALIGNED on a wrong answer.

    The question is asked of the REMOTE, because the remote is what a reader fetches from, and
    because a local store cannot tell "never pushed" from "not fetched here".
    """
    if not isinstance(sha, str) or not re.fullmatch(r"[0-9a-f]{40}", sha):
        return ("UNPROVABLE", "the source_commit is not a 40-hex commit id")
    answer = _remote_can_serve(sha, cwd) if ask is None else ask(sha)
    if answer is True:
        return ("FOLLOWS", "the remote can serve that commit")
    if answer is False:
        return ("DEAD", "the remote does not have that commit")
    return ("UNPROVABLE", "the remote could not be asked")


def row_counts(published_rows, corpus_rows):
    """(added, removed, changed) — the three numbers the drift reporter publishes.

    added:    in the corpus, not named in the published index.
    removed:  named in the published index, not in the corpus.
    changed:  named by both, with a digest that no longer matches.
    """
    pub = {r.get("path"): r for r in published_rows if isinstance(r, dict)}
    cor = {r.get("path"): r for r in corpus_rows if isinstance(r, dict)}
    added = len(set(cor) - set(pub))
    removed = len(set(pub) - set(cor))
    changed = 0
    for path, row in cor.items():
        other = pub.get(path)
        if other is not None and rows_differ([other], [row]):
            changed += 1
    return added, removed, changed


def differing_rows(a, b):
    """The paths that disagree, named. A gate that says "something differs" without saying
    WHAT is a gate that sends the reader hunting; the estate's own pattern is to name the path."""
    out = []
    if len(a) != len(b):
        return [f"<row count {len(a)} vs {len(b)}>"]
    by_path_b = {r.get("path"): r for r in b}
    for x in a:
        y = by_path_b.get(x.get("path"))
        if y is None:
            out.append(f"{x.get('path')} (not in the other set)")
            continue
        if rows_differ([x], [y]):
            out.append(x.get("path"))
    return out


def rows_differ(a, b):
    """Do the two row sets disagree?

    A path and its served state are ALWAYS comparable. Its DIGEST is comparable only when the
    served bytes were available — the build injects a launcher script into the HTML it serves
    (+63 bytes), so a digest taken over the tree's bytes can never match the served bytes for
    those rows. Measured 2026-11-07: with the committed tree standing in for the built one, 23
    rows differ, every one of them HTML, every one of them exactly +63 bytes. A digest that
    cannot be compared faithfully is UNCHECKABLE, not drift — so it is skipped, and counted
    separately, rather than reported as a difference.
    """
    if len(a) != len(b):
        return True
    for x, y in zip(a, b):
        if x.get("path") != y.get("path") or x.get("served") != y.get("served"):
            return True
        if bool(x.get("retired")) != bool(y.get("retired")):
            return True
        if x.get("_digest_comparable", True) and y.get("_digest_comparable", True):
            for k in ("bytes", "sha256"):
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
    # A check that only compares digests may pass while MISLABELLING the served state, and the
    # served state is the promise a reader reads ("the path is real and fetchable"). So a
    # row whose served state differs must be a difference even when its bytes do not.
    mislabelled = [{"path": "/interop/a.json", "bytes": 1, "sha256": "0" * 64, "served": "pages"}]
    mislabelled[0]["served"] = "hf-mirror"
    check("a row whose SERVED STATE differs is a difference", rows_differ(clean, mislabelled))
    check("the served state is compared, not just the digest",
          rows_differ([{"path": "/x", "bytes": 1, "sha256": "a", "served": "pages"}],
                      [{"path": "/x", "bytes": 1, "sha256": "a", "served": "retired-bytes"}]))

    # 3. the served-tree path must be rebuilt under the PUBLIC path, not the tree-relative one.
    #    The tree root is public/interop and the served root is dist/client, so the served file
    #    for interop/x/y.html is dist/client/interop/x/y.html. Getting this wrong silently
    #    falls back to the tree's bytes for every pages row, which is the +63-byte drift again.
    check("the served path is rebuilt under the public path",
          served_path("dist/client", "interop/x/y.html") == os.path.join("dist/client", "interop/x/y.html"))
    check("the served path is NOT the tree-relative path",
          served_path("dist/client", "interop/x/y.html") != os.path.join("dist/client", "x/y.html"))

    # 4. the Function's own mirror-served list and the exclusions must agree, or the index
    #    and the site will disagree about what serves a .invalid path.
    fn = function_mirror_prefixes()
    check("the Function's MIRROR_SERVED_PREFIXES is readable", fn is not None)
    if fn:
        try:
            with open("scripts/deploy-exclusions.json", "r", encoding="utf-8") as f:
                man = json.load(f)
            excl = sorted(e["path"].strip("/") + "/" for e in man.get("entries", [])
                          if e.get("kind") == "dir" and not e.get("mirror_only")
                          and e["path"].strip("/").startswith("interop/"))
            # The Function names them as absolute URL prefixes; the exclusions as repo-relative
            # paths. Same directories, one leading slash apart — so compare them normalised.
            fn_norm = sorted(p.lstrip("/") for p in fn)
            check("the Function's mirror prefixes agree with the exclusions",
                  fn_norm == excl, f"function={fn_norm} exclusions={excl}")
        except Exception as e:
            check("the exclusions are readable", False, str(e)[:80])

    # 5. the producer must FAIL CLOSED without its routing source. Measured 2026-11-07 by the
    #    catalogue lane: with the exclusions manifest missing, mirror_dirs stays empty and EVERY
    #    row is labelled "pages" -- the whole index mislabelled, run still successful. Their
    #    measurement: {pages: 16327} instead of {pages: 3089, hf-mirror: 13238}.
    import subprocess as _sp
    rc = _sp.run([sys.executable, os.path.abspath(__file__), "public/interop",
                   "/tmp/index-selftest-should-not-exist.json",
                   "scripts/definitely-not-a-real-exclusions.json", "--check"],
                  cwd=REPO, capture_output=True).returncode
    check("a missing exclusions manifest fails closed (exit 2), not open", rc == 2, f"rc={rc}")
    rc2out = _sp.run([sys.executable, os.path.abspath(__file__), "public/interop",
                    "public/interop/file-index.json",
                    "scripts/deploy-exclusions.json", "--served-root", DEFAULT_SERVED_ROOT, "--check"],
                   cwd=REPO, capture_output=True)
    rc2 = rc2out.returncode
    check("with the manifest present the check runs (rc 0 = matches, 1 = stale)", rc2 in (0, 1), f"rc={rc2}")

    # 6. the routing rule must cover BOTH exclusion kinds: a `file` entry routes that ONE file
    #    through a 302, and two of them were being labelled "pages".
    try:
        with open("scripts/deploy-exclusions.json", "r", encoding="utf-8") as f:
            man = json.load(f)
        dirs, files = mirror_routed_paths(man)
        under = [f for f in files if f.startswith("interop/")]
        check("file-kind exclusions under interop/ are routed to the mirror", len(under) > 0,
              f"files={files}")
        check("dir-kind exclusions are still routed", len([d for d in dirs if d.startswith("interop/")]) > 0)
    except Exception as e:
        check("the exclusions are readable", False, str(e)[:80])

    # 7. a retired record must be MARKED retired, and a mislabelled retirement is a difference.
    #    "Retired" is not "unreachable": after PR #4010 the 1,898 /interop/ots/**.invalid paths
    #    answer 200 from the mirror, so a reader must be able to see both facts.
    marked = [{"path": "/interop/ots/x.ots.invalid", "bytes": 1, "sha256": "a", "served": "hf-mirror",
               "retired": True}]
    unmarked = [{"path": "/interop/ots/x.ots.invalid", "bytes": 1, "sha256": "a", "served": "hf-mirror"}]
    check("a mislabelled retirement is a difference", rows_differ(marked, unmarked))
    check("a wrongly-marked retirement is a difference", rows_differ(unmarked, marked))
    check("two identically-marked retirements agree", not rows_differ(marked, list(marked)))

    # 8. the index cannot contain its own digest, and it must not index a build artefact.
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

    # 9. the EDGE rewrites some HTML in transit, and a row the edge touches must say so.
    #    MEASURED 2026-11-07 on the live site, over the 53 HTML rows under /interop/: 52 are
    #    byte-stable across two fetches and their published digests match the served bytes
    #    exactly. ONE row is not -- /interop/stablecoin-deep-2026-09/mirrors/129.html -- because
    #    its markup carries href="http:// and href="mailto: links. Three consecutive fetches of
    #    that path returned three different digests, so a reader hashing it can never match, and
    #    an index that promised they could would be promising something false.
    check("markup with no href trigger carries no transform", edge_transforms(b"<a href='/x'>x</a>") == set())
    check("an http:// link is an https-rewrite trigger",
          edge_transforms(b'<a href="http://example.org/">x</a>') == {"https-rewrite"})
    check("a mailto: link is an email-obfuscation trigger",
          edge_transforms(b'<a href="mailto:a@b.example">x</a>') == {"email-obfuscation"})
    # A mailto inside a SCRIPT is not an href, and the edge left such a link alone (MEASURED
    # 2026-11-07: that page's served bytes matched its published digest exactly).
    check("a mailto inside a script is NOT a trigger",
          edge_transforms(b"<script>window.open('mailto:a@b.example')</script>") == set())
    check("a file name with an @ is NOT a trigger",
          edge_transforms(b'<img src="/assets/FT_logo_pos_RGB@2x.png">') == set())
    check("clean markup is as-published", served_bytes_state(set())[0] == "as-published")
    check("an https-rewrite alone is edge-transformed, not per-request",
          served_bytes_state({"https-rewrite"})[0] == "edge-transformed")
    check("an email-obfuscation is per-request",
          served_bytes_state({"email-obfuscation"})[0] == "edge-transformed-per-request")
    check("every state carries a note when it is not as-published",
          all(served_bytes_state(t)[1] for t in (set(), {"https-rewrite"}, {"email-obfuscation"})
              if t))
    check("as-published carries no note", served_bytes_state(set())[1] is None)
    # The rule must hold against the REAL corpus, not only against fixtures.
    real = os.path.join(REPO, "public", "interop", "stablecoin-deep-2026-09", "mirrors", "129.html")
    if os.path.exists(real):
        with open(real, "rb") as f:
            t = edge_transforms(f.read())
        check("the measured row is marked per-request",
              "email-obfuscation" in t and "https-rewrite" in t, f"transforms={sorted(t)}")
    else:
        check("the measured row is present to check", False, real)

    # 10. THE POINTER. The index names the commit its digests were measured from, and its own
    #     how_to_verify tells the reader to fetch that commit and compare, so the pointer is
    #     only true if a reader CAN fetch it. Measured 2026-11-07 on the published index: it
    #     named 99f8456e9308ba2a8d746e02b8d1d25563542146, and the remote answers "upload-pack:
    #     not our ref" for it — that commit was never pushed, so the published verification
    #     instruction could not be carried out by anyone. Nothing noticed, because the check
    #     compared the ROWS and the rows were fine: ALIGNED on a wrong answer.
    #     The verdict is asked of the REMOTE, because the remote is what a reader fetches from,
    #     and it has THREE states that are never collapsed: "the remote does not have it" is a
    #     finding, "the remote could not be asked" is an absence of evidence.
    check("a pointer the remote can serve FOLLOWS",
          pointer_verdict("a" * 40, ask=lambda s: True)[0] == "FOLLOWS")
    check("a pointer the remote does not have is DEAD",
          pointer_verdict("b" * 40, ask=lambda s: False)[0] == "DEAD")
    check("a pointer the remote could not be asked about is UNPROVABLE, not DEAD",
          pointer_verdict("c" * 40, ask=lambda s: None)[0] == "UNPROVABLE")
    check("a source_commit that is not a commit id at all is UNPROVABLE, not DEAD",
          pointer_verdict("not-a-sha", ask=lambda s: False)[0] == "UNPROVABLE")
    check("a null pointer — what the drift reporter's own repair command wrote — is UNPROVABLE",
          pointer_verdict(None, ask=lambda s: False)[0] == "UNPROVABLE")

    # 11. The producer REFUSES to write a pointer it cannot confirm, and it refuses BEFORE it
    #     measures a corpus. The run is a subprocess, so what is asserted is the real exit code.
    import subprocess as _sp2
    rc3 = _sp2.run([sys.executable, os.path.abspath(__file__), "public/interop",
                    "/tmp/index-selftest-pointer.json",
                    "scripts/deploy-exclusions.json", "0" * 40],
                   cwd=REPO, capture_output=True).returncode
    check("the producer refuses to write a pointer that names no commit this repository holds (exit 2)",
          rc3 == 2, f"rc={rc3}")
    # The CONTROL. Without it the refusal could be a blanket refusal — the case would pass for
    # the wrong reason, and a producer that refuses EVERY pointer is not a gate either.
    check("the producer's own pointer (HEAD) is a commit this repository holds",
          commit_resolves_locally(head_commit()) is True)

    # 12. The check prints the summary line the drift reporter parses. The reporter landed in
    #     #4019 WITH the workflow, and the producer was never taught the contract, so the
    #     reporter's state has been "unknown" ever since — an instrument that cannot measure.
    check("the check prints the summary line the drift reporter parses",
          b"check: corpus " in rc2out.stdout,
          rc2out.stdout.decode("utf-8", "replace")[-160:].replace("\n", " | "))

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

    # The index names the commit its digests were measured from. A run that names no commit
    # measures the tree at HEAD, so it says so rather than writing a null pointer (measured
    # 2026-11-07: the drift reporter's own repair command wrote `"source_commit": null`).
    if not source_commit:
        source_commit = head_commit()

    # A POINTER MUST NAME A COMMIT THIS REPOSITORY HOLDS, and the producer refuses to write
    # one it cannot confirm — before it spends a minute measuring a corpus. Measured 2026-11-07:
    # the published index named 99f8456e9308ba2a8d746e02b8d1d25563542146, a commit that was
    # never pushed, and the remote answers "upload-pack: not our ref" for it: a published
    # promise no reader could carry out. A rebuild must not be able to reopen that hole.
    if not check_mode:
        resolves = commit_resolves_locally(source_commit)
        if resolves is not True:
            print(f"build-interop-file-index: the source_commit does not name a commit this repository "
                  f"holds ({source_commit!r}).")
            if resolves is False:
                print("  It is not a commit id at all.")
            else:
                print("  This repository cannot confirm that the commit exists. A truncated store answers")
                print("  the same way as a missing commit, and the two are DIFFERENT verdicts — but either")
                print("  way this pointer cannot be confirmed, so the producer will not publish it.")
            print("  The index names the commit its digests were measured from, so a name that resolves to")
            print("  nothing publishes a verification instruction nobody can follow.")
            print("  Fix: name a commit this tree holds — `git rev-parse HEAD`.")
            sys.exit(2)

    # --- the mirror-served directories -----------------------------------------------------------
    # FAIL CLOSED. Measured 2026-11-07 by the catalogue lane, with a reproduction: if the
    # exclusions manifest is MISSING or mis-pathed, mirror_dirs stays empty and EVERY row is
    # labelled "pages" — the whole index mislabelled, with the run still succeeding. Their
    # measurement: by_served came out {pages: 16327} instead of {pages: 3089, hf-mirror: 13238}.
    # The served label is the one thing this index must not get wrong, so a missing routing
    # source is an absence of evidence, not a reason to label everything one way.
    mirror_dirs = []
    mirror_files = []
    if not os.path.exists(exclusions):
        print(f"build-interop-file-index: the exclusions manifest is MISSING ({exclusions}).")
        print("  Without it every path would be labelled 'pages' — which is the one thing this")
        print("  index must not get wrong. This is an absence of evidence, not a measurement.")
        sys.exit(2)
    try:
        with open(exclusions, "r", encoding="utf-8") as f:
            man = json.load(f)
    except Exception as e:
        print(f"build-interop-file-index: the exclusions manifest is UNREADABLE ({e}).")
        sys.exit(2)
    mirror_dirs, mirror_files = mirror_routed_paths(man)
    mirror_prefixes = [d for d in mirror_dirs if d.startswith("interop/")]
    if not mirror_prefixes and not [f for f in mirror_files if f.startswith("interop/")]:
        print("build-interop-file-index: the exclusions manifest names NO mirror-served")
        print("  path under interop/, so no path could be routed to the mirror.")
        print("  That is an absence of evidence about the routing, not a measurement of it.")
        sys.exit(2)
    print("mirror-served dirs:", mirror_dirs, "-> matching this corpus:", mirror_prefixes, flush=True)
    if mirror_files:
        print("mirror-served files:", [f for f in mirror_files if f.startswith("interop/")], flush=True)

    # The Function's own list of the prefixes it DEFERS for. It decides what serves a .invalid
    # path, so it is the authority for that classification; the selftest proves it agrees with
    # the exclusions this file already routes by.
    fn_prefixes = function_mirror_prefixes()
    if fn_prefixes is None:
        print("build-interop-file-index: the Function's MIRROR_SERVED_PREFIXES is UNREADABLE.")
        print("  Without it the index cannot say what serves a retired .invalid path.")
        sys.exit(2)
    print("the Function defers for:", fn_prefixes, flush=True)

    html_digests = served_html_digests(tree, served_root)
    if html_digests:
        print(f"served HTML digests from the injector's own transform: {len(html_digests)}", flush=True)

    rows = []
    total = 0
    served_from_build = 0
    digests_not_comparable = 0
    served_from_injector = 0
    served_from_tree = 0
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
            # The Function intercepts every .invalid path. For the mirror-served prefixes it
            # DEFERS (PR #4010), so the request reaches public/_redirects, is 302'd to the
            # mirror, and the bytes served are the canonical tree bytes. For every other
            # .invalid path the Function answers itself, from the retired-bytes archive.
            if any(public_rel.startswith(p.lstrip("/")) for p in fn_prefixes):
                served = "hf-mirror"
            else:
                served = "retired-bytes"
        elif (any(public_rel == d or public_rel.startswith(d + "/") for d in mirror_prefixes)
              or public_rel in mirror_files):
            served = "hf-mirror"
        else:
            served = "pages"
            # The served bytes are the BUILT bytes: the build injects a launcher script into
            # the HTML it serves, so the tree's bytes are not what a reader fetches.
            # The built tree is dist/client/<the same public path>, and the tree root here is
            # public/interop, so the public path is what has to be rebuilt under the served
            # root — not the tree-relative path.
            built = served_path(served_root, public_rel)
            digest_comparable = False
            if os.path.exists(built) and os.path.isfile(built):
                try:
                    n, h = sha256_file(built)
                    served_from_build += 1
                    digest_comparable = True
                except Exception:
                    pass
            elif html_digests.get(sub):
                # What the injector would write, asked of the injector itself.
                info = html_digests[sub]
                n, h = info["bytes"], info["sha256"]
                digest_comparable = True
                served_from_injector += 1
            elif not public_rel.endswith(".html"):
                # The build's only rewrite of a file under /interop/ is the injector's, and that
                # touches HTML only (MEASURED 2026-11-07: a build modified three tracked files and
                # none of them under /interop/). So for a non-HTML file the tree's bytes ARE the
                # served bytes, and the digest is comparable without a build.
                digest_comparable = True
                served_from_tree += 1
            else:
                # No served copy and no injector digest: the digest is UNCHECKABLE here, not
                # different.
                digests_not_comparable += 1

        row = {"path": "/" + public_rel, "bytes": n, "sha256": h, "served": served}
        if served == "pages":
            row["_digest_comparable"] = digest_comparable
        # WHAT THE SITE SERVES, AS AGAINST WHAT THE ESTATE PUBLISHED. The edge rewrites some
        # HTML in transit, so a row can be published honestly and still not be hash-matchable by
        # a reader. The row says so instead of promising a match it cannot keep. The field is on
        # EVERY row, because a field that is sometimes absent is a field whose absence has to be
        # interpreted. Only pages-served HTML can carry a trigger: the mirror is another host,
        # and the archive serves JSON.
        transforms = set()
        if served == "pages" and public_rel.endswith(".html"):
            try:
                with open(full, "rb") as f:
                    transforms = edge_transforms(f.read())
            except OSError:
                transforms = set()
        sb_state, sb_note = served_bytes_state(transforms)
        row["served_bytes"] = sb_state
        if sb_note:
            row["served_bytes_note"] = sb_note
        if INVALID_PATH_RE.match(public_rel):
            # A retired record is HISTORICAL evidence, not current proof — whatever serves it.
            # The estate's Function marks these with x-evidence-state:
            # retired-or-invalid-historical-bytes, and the index must say the same thing: being
            # RETIRED is not the same as being UNREACHABLE. Measured 2026-11-07: after PR #4010
            # the 1,898 /interop/ots/**.invalid paths answer 200 from the mirror. A reader told
            # only that they are "retired" must also be able to see that they are served.
            row["retired"] = True
        if served == "retired-bytes":
            row["served_note"] = ("retired record; served from the estate's retired-bytes archive "
                                  "when that archive holds these exact bytes, and 404 by design "
                                  "when it does not")
        rows.append(row)
        total += n

    rows.sort(key=lambda r: r["path"])
    by_served = {}
    by_served_bytes = {}
    for r in rows:
        by_served[r["served"]] = by_served.get(r["served"], 0) + 1
        by_served_bytes[r["served_bytes"]] = by_served_bytes.get(r["served_bytes"], 0) + 1

    doc = {
        "schema": "csoai.interop-file-index/0.2",
        "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source_commit": source_commit,
        "what_this_is": ("Every file the estate's committed tree publishes under /interop/, with its "
                         "size, its sha256 and how it is served. Built by reading the tree, so it is a "
                         "measurement, not a list of intentions. Three served states occur, because "
                         "there are three — a path routed to the mirror is not the same path as one the "
                         "estate serves from its retired-bytes archive, and a fourth state "
                         "(retired-bytes-absent) is reserved for a retired record the archive does "
                         "not hold, which is not emitted because the archive is a deploy-time "
                         "artefact and naming its membership here would make this index stale on "
                         "every deploy."),
        "how_to_verify": ("sha256 is the digest of the file's bytes as published. Fetch the path and "
                          "hash it; on a row whose served_bytes reads 'as-published', a match means "
                          "you hold what the estate published. Three things to know when it does not "
                          "match: the digest is of the bytes at THIS index's source_commit, and the "
                          "live site serves the bytes of the currently DEPLOYED commit, so the two "
                          "agree once that commit is deployed; for pages-served HTML the digest is "
                          "over the BUILT file, which carries the workspace-launcher script the build "
                          "injects; and the EDGE rewrites some HTML in transit, so on a row whose "
                          "served_bytes reads 'edge-transformed' or 'edge-transformed-per-request' the "
                          "bytes the site serves are NOT the bytes published here, and on a "
                          "'per-request' row they differ on every fetch, so no digest of them can be "
                          "reproduced by anyone, including us. A row whose served state is "
                          "hf-mirror is a different case again: the bytes come from the "
                          "HuggingFace evidence mirror, which is a SEPARATE HOST whose membership "
                          "this index does not record, so the row's digest is checkable only while "
                          "the mirror still holds the file. For retired-bytes paths the digest is "
                          "of the canonical bytes, which the archive copies verbatim."),
        "retired": ("A retired record is HISTORICAL evidence of a past measurement, never current "
                    "proof. The estate's server marks these with the response header "
                    "x-evidence-state: retired-or-invalid-historical-bytes. BEING RETIRED IS NOT THE "
                    "SAME AS BEING UNREACHABLE: a retired path that is served answers 200 and its "
                    "bytes verify against the sha256 below; a retired path that is not served answers "
                    "404. The `served` field says which."),
        "served_legend": {
            "pages": "served by the site build",
            "hf-mirror": ("routed by a 302 redirect to the HuggingFace evidence mirror "
                          "(scripts/deploy-exclusions.json); the sha256 is of the canonical tree bytes, "
                          "which are the bytes the mirror holds. THE MIRROR IS A SEPARATE HOST AND ITS "
                          "MEMBERSHIP IS NOT RECORDED HERE, so this row's claim is true UNDER THE "
                          "CONDITION THAT THE MIRROR STILL HOLDS THE FILE. MEASURED 2026-11-07: all "
                          "five mirror classes (mill-cards-signed, mill-cards-unsigned, mill-evidence, "
                          "the file-kind exclusions and the ots/*.invalid records) resolved ANONYMOUSLY "
                          "with HTTP 200 and an exact digest match. If the mirror ever stops holding a "
                          "path, the reader gets HUGGINGFACE's 'Entry not found' — a 404 and a 15-byte "
                          "body from the mirror, NOT from this site — so a mismatch on one of these rows "
                          "is a statement about the mirror's membership until it is shown otherwise"),
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
        "served_bytes_legend": {
            "as-published": ("the bytes the site serves for this path are the bytes the estate "
                             "published here; the sha256 is checkable against a fetch"),
            "edge-transformed": ("the edge rewrites this markup in transit, so the bytes the site "
                                 "serves are NOT the bytes published here; the sha256 is of the "
                                 "published bytes and will not match a fetch"),
            "edge-transformed-per-request": ("the edge rewrites this markup and the rewrite is "
                                             "randomised per request, so the bytes the site serves "
                                             "differ on EVERY fetch; no digest of them can be "
                                             "reproduced, by a reader or by the estate"),
        },
        "counts": {"files": len(rows), "bytes": total, "by_served": by_served,
                   "by_served_bytes": by_served_bytes,
                   "digests_taken_from_the_built_tree": served_from_build,
                   "digests_taken_from_the_injectors_transform": served_from_injector,
                   "digests_taken_from_the_tree_bytes": served_from_tree,
                   "digests_not_comparable_no_built_tree": digests_not_comparable,
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
        published_files = current.get("files", [])
        added, removed, changed = row_counts(published_files, rows)
        pointer = current.get("source_commit")
        verdict, why = pointer_verdict(pointer)

        # THE SUMMARY LINE. .github/workflows/interop-index-drift.yml parses this line for the
        # numbers it publishes, and it has been parsing a line NO producer ever printed: the
        # reporter landed in #4019 with the workflow, and the producer was never taught the
        # contract, so the reporter's state has been "unknown" ever since — an instrument that
        # cannot measure, reporting that it cannot measure, instead of the drift.
        print(f"check: corpus {len(rows)} rows, published {len(published_files)} rows, "
              f"added {added} removed {removed} changed {changed}, pointer {verdict}")

        drift = differing_rows(published_files, rows)
        if drift:
            print(f"build-interop-file-index: the committed index is STALE — {len(drift)} row(s) differ:")
            for p in drift[:12]:
                print(f"  {p}")
            if len(drift) > 12:
                print(f"  ... and {len(drift) - 12} more")
            print("  Fix: python3 scripts/build-interop-file-index.py "
                  "public/interop public/interop/file-index.json scripts/deploy-exclusions.json <commit> "
                  "--served-root dist/client")
            sys.exit(1)

        # THE POINTER. The rows can be right and the index still publish a promise no reader can
        # keep: the index names the commit its digests were measured from, and its own
        # how_to_verify tells the reader to fetch that commit and compare. Measured 2026-11-07:
        # the published index named 99f8456e9308ba2a8d746e02b8d1d25563542146, which the remote
        # answers "not our ref" for. The rows were fine, so the check said the index matched —
        # ALIGNED on a wrong answer. A dead pointer is a finding; an UNPROVABLE one (the remote
        # could not be asked) is an absence of evidence, and is not.
        if verdict == "DEAD":
            print(f"build-interop-file-index: the published index names a commit the remote does NOT have "
                  f"({pointer}).")
            print(f"  {why}. Its own how_to_verify tells the reader to fetch that commit and compare, so a")
            print("  pointer nobody can fetch publishes a promise that cannot be kept.")
            print("  Fix: re-measure the index naming a commit the remote can serve —")
            print("        python3 scripts/build-interop-file-index.py public/interop "
                  "public/interop/file-index.json \\")
            print("          scripts/deploy-exclusions.json $(git rev-parse HEAD)")
            sys.exit(1)

        print(f"build-interop-file-index: the committed index matches ({len(rows)} rows).")
        print(f"  · source_commit {pointer}: {verdict} — {why}")
        if digests_not_comparable:
            print(f"  · {digests_not_comparable} row(s) could NOT have their digest compared: no built tree at "
                  f"{served_root}. The build rewrites that HTML (it injects the launcher script), so the "
                  f"tree's bytes are not what a reader fetches. UNCHECKABLE is not drift.")
        return

    for r in rows:
        r.pop("_digest_comparable", None)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=1)
        f.write("\n")
    print(f"DONE files={len(rows)} bytes={total} by_served={by_served} "
          f"digests_from_build={served_from_build} out={out} size={os.path.getsize(out)}", flush=True)


if __name__ == "__main__":
    main()
