#!/usr/bin/env python3
"""Publish the repository of record to Hugging Face: browsable source a stranger can READ,
plus a full-history bundle a stranger can RESTORE. Public, and proved with no token.

This does two jobs that are easy to confuse, so it never uses one word for both:

  source/<tree>   a DATED SNAPSHOT of the tracked working tree at one commit. Browsable in
                  the Hub file viewer, readable by anyone, no account. This is what the MCP
                  registry's source links should point at: 325 of our 354 registry entries
                  carry a GitHub link that is a 404 to anyone not signed in as us, because
                  the GitHub organisation is anonymously invisible. A correct link to an
                  invisible destination is still a dead end.

  bundles/*.bundle  a FULL-HISTORY `git bundle`: every commit, tree, blob and ref, byte
                  identical, restorable with one `git clone`. This is the durability copy.

Neither is a live git mirror, and this script never calls either one that.

MEASURED 2026-09-22, not assumed. `git push` of refs/heads/master to a Hugging Face dataset
repo was rejected by the pre-receive hook:

    remote: Your push was rejected because it contains files larger than 10 MiB.
    remote: Offending files:
    remote:   - public/videos/architecture-of-measurement.mp4 (ref: refs/heads/master)
    remote:   - public/interop/agent-interop-canonical-2026-09/canonical-register.jsonl
    ! [remote rejected] master -> master (pre-receive hook declined)

15 blobs in this history exceed 10 MiB; the largest is 34,236,775 bytes. The only way to
make that push succeed is to rewrite the history onto git-lfs, which changes every commit
sha from the first offending commit onwards and breaks the signatures that hang off those
bytes. The estate's rule is that signed bytes are never edited. So: snapshot and bundle,
uploaded through the HTTP commit API, which DOES place large files in LFS automatically --
that is the whole difference between the route that works and the route that is refused.

VERIFICATION IS ANONYMOUS. The upload's return value proves nothing about what an outside
reader can reach, so every check here is re-read from the public CDN with no token at all.
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request

REPO_ID = "csoai/councilof-ai-source"
SRC = os.environ.get("SRC_REPO", "/workspace/git/councilof-ai.git")
OUT = os.environ.get("DUR_OUT", "/workspace/lanes/out/durability")
TMP = os.environ.get("DUR_TMP", "/workspace/lanes/tmp")
TOKEN_FILE = os.environ.get("HF_TOKEN_FILE", "/workspace/lanes/.secrets/hf_token")
MIN_FREE_GB = int(os.environ.get("DUR_MIN_FREE_GB", "4"))

GITATTRIBUTES_LINE = "*.bundle filter=lfs diff=lfs merge=lfs -text\n"

MARKER = "<!-- csoai-durability-source-2026-09-22 -->"
MARKER_END = "<!-- /csoai-durability-source-2026-09-22 -->"

# The sentence that stops being true the moment this repository carries the source.
FALSE_SENTENCE = "A pointer repository. It holds no corpus of its own:"
TRUE_SENTENCE = (
    "This repository carries the **source of councilof.ai** -- a dated, browsable snapshot of the "
    "tracked tree under `source/`, and a full-history `git bundle` under `bundles/` -- alongside its "
    "original pointer files:"
)


def sh(*args: str) -> str:
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout.strip()


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def free_gb(path: str) -> int:
    st = os.statvfs(path)
    return int(st.f_bavail * st.f_frsize / (1024 ** 3))


def anon_get(url: str, rng: str | None = None, timeout: int = 120):
    """Read from the public CDN with NO Authorization header. This is the only check that
    says anything about what a stranger can reach."""
    req = urllib.request.Request(url, method="GET")
    req.add_header("User-Agent", "csoai-durability-anon-readback/1")
    if rng:
        req.add_header("Range", rng)
    return urllib.request.urlopen(req, timeout=timeout)


def body(readme: str, date: str, tip: str, count: int, refs: int,
         files: int, tree_bytes: int, bundle_name: str, bundle_sha: str,
         bundle_bytes: int) -> str:
    block = f"""{MARKER}
## The source itself: browsable snapshot + full-history bundle

Added 2026-09-22. Before that this repository held seven pointer rows and no code, while
the estate's own registry entries linked to a GitHub organisation that is **anonymously
invisible** -- the links were correct and the destination was a 404 to everyone who was not
signed in as us. This is the public source location that replaces them.

Two things live here, and they are not the same thing:

| path | what it is | how current |
|---|---|---|
| `source/` | a **dated snapshot** of the tracked working tree at one commit -- browsable in the Hub file viewer, readable with no account | as of `{date}` |
| `bundles/{bundle_name}` | a **full-history `git bundle`**: every commit, tree, blob and ref, byte-identical | as of `{date}` |

Neither is a live git mirror, and nothing here calls them one. Hugging Face's pre-receive
hook refuses any push containing a file over 10 MiB, and this history contains 15 such
blobs (largest 34,236,775 bytes). Making a `git push` succeed would mean rewriting those
commits onto git-lfs, which changes every downstream commit sha and breaks the signatures
that hang off those bytes. So this repository carries dated artifacts instead, and
`SNAPSHOT.json` records exactly which commit each one was cut from.

### Read the source

Browse `source/` above, or fetch one file with no account and no token:

```bash
curl -L https://huggingface.co/datasets/{REPO_ID}/resolve/main/source/README.md
```

### Restore the entire repository, history and all, in one command

```bash
curl -L -o {bundle_name} \\
  https://huggingface.co/datasets/{REPO_ID}/resolve/main/bundles/{bundle_name}
git bundle verify {bundle_name}      # offline integrity check first
git clone {bundle_name} councilof-ai
```

### What this snapshot is

| | |
|---|---|
| commit (`master`) | `{tip}` |
| commits in history | {count} |
| refs in the bundle | {refs} |
| tracked files in `source/` | {files} |
| tracked bytes | {tree_bytes} |
| bundle size | {bundle_bytes} bytes |
| bundle sha256 | `{bundle_sha}` |
| cut at | {date} |

Check the date before you trust the contents. A snapshot is as current as the day it was
cut and no more; live copies are kept elsewhere.

**Licence differs by artifact:** the `councilof-ai` repository is MIT, the published
packages are Apache-2.0, and the data is CC-BY-4.0. Name the artifact, never "the licence".
{MARKER_END}"""

    if MARKER in readme:
        head = readme.split(MARKER)[0]
        tail = readme.split(MARKER_END)[-1] if MARKER_END in readme else ""
        readme = head + block + tail
    else:
        readme = readme.rstrip() + "\n\n" + block + "\n"

    if FALSE_SENTENCE in readme:
        readme = readme.replace(FALSE_SENTENCE, TRUE_SENTENCE, 1)
    return readme


def run_anon_checks(bundle_name: str, bundle_sha: str, bundle_bytes: int) -> dict:
    """Every check here is made with NO Authorization header, because the question is not
    "did our upload succeed" but "can a stranger read this". Those are different questions
    and only the second one matters for a source link in a public registry."""
    # ------------------------------------------------ 3. ANONYMOUS read-back, no token
    checks: dict[str, object] = {}

    # (a) is it public at all, to someone with no credential?
    try:
        info = json.loads(anon_get(f"https://huggingface.co/api/datasets/{REPO_ID}").read().decode())
        checks["public"] = (info.get("private") is False)
    except Exception as e:  # noqa: BLE001
        checks["public"] = False
        checks["public_error"] = str(e)

    # (b) can a stranger read a source file, and are the bytes ours?
    src_url = f"https://huggingface.co/datasets/{REPO_ID}/resolve/main/source/README.md"
    try:
        got = anon_get(src_url).read()
        ours = subprocess.run(["git", "-C", SRC, "show", "master:README.md"],
                              capture_output=True).stdout
        checks["source_readable_anon"] = True
        checks["source_bytes_match_git"] = (hashlib.sha256(got).hexdigest()
                                            == hashlib.sha256(ours).hexdigest())
    except Exception as e:  # noqa: BLE001
        checks["source_readable_anon"] = False
        checks["source_bytes_match_git"] = False
        checks["source_error"] = str(e)

    # (c) is the bundle the bytes we made?
    #
    # NOT from the resolve URL's headers. That URL 302s to a Xet CDN object, and the CDN's
    # ETag is the Xet content hash, NOT the git-lfs sha256 -- the first run of this check
    # read the redirected response and reported a mismatch (3153a0b0... vs our 771ac1e4...)
    # for a file that was byte-perfect. The canonical digest is the LFS POINTER, which
    # /raw/ serves as three lines of text: version, `oid sha256:<hex>`, `size <n>`. That is
    # what git-lfs itself verifies against, it costs a few hundred bytes, and it cannot be
    # confused with a storage-layer hash.
    b_url = f"https://huggingface.co/datasets/{REPO_ID}/resolve/main/bundles/{bundle_name}"
    p_url = f"https://huggingface.co/datasets/{REPO_ID}/raw/main/bundles/{bundle_name}"
    try:
        ptr = anon_get(p_url).read().decode()
        remote_sha = ""
        remote_len = ""
        for ln in ptr.splitlines():
            if ln.startswith("oid sha256:"):
                remote_sha = ln.split("oid sha256:", 1)[1].strip()
            elif ln.startswith("size "):
                remote_len = ln.split("size ", 1)[1].strip()
        checks["bundle_sha256_from_hf"] = remote_sha
        checks["bundle_sha256_matches"] = (remote_sha == bundle_sha)
        checks["bundle_bytes_match"] = (str(remote_len) == str(bundle_bytes))
    except Exception as e:  # noqa: BLE001
        checks["bundle_sha256_matches"] = False
        checks["bundle_bytes_match"] = False
        checks["bundle_pointer_error"] = str(e)
    # and separately: can a stranger actually pull the object, and is it a git bundle?
    try:
        r = anon_get(b_url, rng="bytes=0-15")
        head = r.read()
        checks["bundle_readable_anon"] = True
        checks["bundle_magic_ok"] = head.startswith(b"# v2 git bundle") or head.startswith(b"# v3 git bundle")
    except Exception as e:  # noqa: BLE001
        checks["bundle_readable_anon"] = False
        checks["bundle_magic_ok"] = False
        checks["bundle_error"] = str(e)

    verified = bool(checks.get("public") and checks.get("source_readable_anon")
                    and checks.get("source_bytes_match_git")
                    and checks.get("bundle_sha256_matches")
                    and checks.get("bundle_bytes_match")
                    and checks.get("bundle_magic_ok"))
    return checks


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--now", action="store_true")
    ap.add_argument("--keep", action="store_true")
    ap.add_argument("--verify-only", action="store_true",
                    help="re-run the anonymous checks against what is already published, "
                         "without cutting or uploading anything")
    args = ap.parse_args()

    os.makedirs(OUT, exist_ok=True)
    os.makedirs(TMP, exist_ok=True)

    if args.verify_only:
        sp = os.path.join(OUT, "hf-bundle-latest.json")
        if not os.path.exists(sp):
            print(f"[result] FAIL nothing published yet ({sp} absent)")
            return 1
        st = json.load(open(sp))
        bn = os.path.basename(st["file"])
        checks = run_anon_checks(bn, st["sha256"], st["bytes"])
        ok = bool(checks.get("public") and checks.get("source_readable_anon")
                  and checks.get("source_bytes_match_git")
                  and checks.get("bundle_sha256_matches")
                  and checks.get("bundle_bytes_match")
                  and checks.get("bundle_magic_ok"))
        st["anonymous_readback"] = checks
        st["verified"] = ok
        st["verified_at"] = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        with open(sp, "w") as f:
            json.dump(st, f, indent=2)
        print(f"[result] {'VERIFIED' if ok else 'UNVERIFIED'} {REPO_ID} (verify-only) "
              f"tip={st['tip'][:12]} n={st['commit_count']} source_files={st.get('source_files')} "
              f"public={checks.get('public')} anon_source_ok={checks.get('source_bytes_match_git')} "
              f"anon_bundle_sha_ok={checks.get('bundle_sha256_matches')}")
        return 0 if ok else 1

    if not os.path.exists(TOKEN_FILE):
        print(f"[result] SKIP no HF token at {TOKEN_FILE}; nothing published")
        return 0
    token = open(TOKEN_FILE).read().strip()

    fg = free_gb(TMP)
    if fg < MIN_FREE_GB:
        print(f"[result] SKIP only {fg}G free at {TMP} (need {MIN_FREE_GB}G); nothing published")
        return 0

    date = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    tip = sh("git", "-C", SRC, "rev-parse", "master")
    count = int(sh("git", "-C", SRC, "rev-list", "--count", "master"))
    refs = len(sh("git", "-C", SRC, "for-each-ref", "--format=%(refname)").splitlines())

    bundle_name = f"councilof-ai-{date}.bundle"
    bundle_path = os.path.join(TMP, bundle_name)
    tree_dir = os.path.join(TMP, f"source-{date}")

    # ---------------------------------------------------------------- 1. the bundle
    if os.path.exists(bundle_path):
        os.remove(bundle_path)
    print(f"[info] bundling {tip[:12]} n={count} refs={refs}")
    subprocess.run(["git", "-C", SRC, "bundle", "create", bundle_path, "--all"],
                   check=True, capture_output=True, text=True)
    # `git bundle verify` needs a repository to resolve prerequisites against. Running it
    # from a cwd that is not one fails with "need a repository to verify a bundle" -- which
    # is exactly what the first run of this script did, and why it reported FAIL instead of
    # uploading something unverified.
    v = subprocess.run(["git", "-C", SRC, "bundle", "verify", bundle_path],
                       capture_output=True, text=True)
    if v.returncode != 0:
        print(f"[result] FAIL git bundle verify rc={v.returncode}: {v.stderr.strip()[:200]}")
        return 1
    if "complete history" not in (v.stdout + v.stderr):
        print(f"[result] FAIL bundle does not record a complete history: {v.stdout.strip()[:200]}")
        return 1
    bundle_bytes = os.path.getsize(bundle_path)
    bundle_sha = sha256_file(bundle_path)

    # ------------------------------------------------------- 2. the browsable snapshot
    if os.path.exists(tree_dir):
        shutil.rmtree(tree_dir)
    os.makedirs(tree_dir)
    print("[info] extracting tracked tree at master")
    p1 = subprocess.Popen(["git", "-C", SRC, "archive", "--format=tar", "master"],
                          stdout=subprocess.PIPE)
    p2 = subprocess.Popen(["tar", "-x", "-C", tree_dir], stdin=p1.stdout)
    p1.stdout.close()
    p2.communicate()
    if p2.returncode != 0:
        print(f"[result] FAIL extracting tree rc={p2.returncode}")
        return 1
    files = sum(len(fs) for _, _, fs in os.walk(tree_dir))
    tree_bytes = sum(os.path.getsize(os.path.join(r, f))
                     for r, _, fs in os.walk(tree_dir) for f in fs)
    print(f"[info] tree: {files} files, {tree_bytes} bytes")

    from huggingface_hub import HfApi
    api = HfApi(token=token)

    # .gitattributes first, so the bundle is stored as an LFS object rather than refused
    ga = ""
    try:
        ga = anon_get(f"https://huggingface.co/datasets/{REPO_ID}/raw/main/.gitattributes").read().decode()
    except Exception:  # noqa: BLE001
        ga = ""
    if "*.bundle" not in ga:
        ga_path = os.path.join(TMP, ".gitattributes")
        with open(ga_path, "w") as f:
            f.write(ga.rstrip("\n") + "\n" + GITATTRIBUTES_LINE if ga else GITATTRIBUTES_LINE)
        api.upload_file(path_or_fileobj=ga_path, path_in_repo=".gitattributes",
                        repo_id=REPO_ID, repo_type="dataset",
                        commit_message="durability: track *.bundle with LFS")
        os.remove(ga_path)

    print("[info] uploading source/ ...")
    api.upload_folder(folder_path=tree_dir, path_in_repo="source",
                      repo_id=REPO_ID, repo_type="dataset",
                      delete_patterns="**",            # prune files deleted upstream
                      commit_message=f"source snapshot {date} at {tip[:12]} ({files} files)")

    print("[info] uploading bundle ...")
    api.upload_file(path_or_fileobj=bundle_path, path_in_repo=f"bundles/{bundle_name}",
                    repo_id=REPO_ID, repo_type="dataset",
                    commit_message=f"full-history bundle {date} ({count} commits)")

    snap = {
        "as_of": stamp,
        "repo": REPO_ID,
        "public_url": f"https://huggingface.co/datasets/{REPO_ID}",
        "master_tip": tip,
        "commit_count": count,
        "ref_count": refs,
        "source_snapshot": {
            "path": "source/",
            "kind": "dated snapshot of the tracked working tree -- browsable, NOT a live mirror",
            "files": files,
            "bytes": tree_bytes,
        },
        "full_history_bundle": {
            "path": f"bundles/{bundle_name}",
            "kind": "full git history: every commit, tree, blob and ref, byte-identical",
            "bytes": bundle_bytes,
            "sha256": bundle_sha,
            "restore": f"git clone {bundle_name} councilof-ai",
        },
        "why_not_a_git_mirror": (
            "Hugging Face's pre-receive hook rejects any push containing a file over 10 MiB. "
            "This history has 15 such blobs (largest 34236775 bytes). Rewriting them onto "
            "git-lfs would change commit shas and break the signatures over those bytes."
        ),
    }
    snap_path = os.path.join(TMP, "SNAPSHOT.json")
    with open(snap_path, "w") as f:
        json.dump(snap, f, indent=2)
    api.upload_file(path_or_fileobj=snap_path, path_in_repo="SNAPSHOT.json",
                    repo_id=REPO_ID, repo_type="dataset",
                    commit_message=f"durability: SNAPSHOT.json {date}")
    os.remove(snap_path)

    # README: additive. Every existing marker block is left exactly as it is; only the one
    # sentence that this upload makes false is corrected.
    try:
        cur = anon_get(f"https://huggingface.co/datasets/{REPO_ID}/raw/main/README.md").read().decode()
    except Exception as e:  # noqa: BLE001
        cur = ""
        print(f"[warn] could not read README: {e}")
    if cur:
        new = body(cur, date, tip, count, refs, files, tree_bytes,
                   bundle_name, bundle_sha, bundle_bytes)
        if new != cur:
            rp = os.path.join(TMP, "README.md")
            with open(rp, "w") as f:
                f.write(new)
            api.upload_file(path_or_fileobj=rp, path_in_repo="README.md",
                            repo_id=REPO_ID, repo_type="dataset",
                            commit_message=f"durability: describe source/ and bundles/ ({date})")
            os.remove(rp)

    checks = run_anon_checks(bundle_name, bundle_sha, bundle_bytes)

    state = {
        "as_of": stamp,
        "kind": ("dated browsable source snapshot + dated full-history git bundle "
                 "(NOT a live git mirror)"),
        "repo": REPO_ID,
        "public_url": f"https://huggingface.co/datasets/{REPO_ID}",
        "source_url": src_url,
        "bundle_url": b_url,
        "file": f"bundles/{bundle_name}",
        "tip": tip,
        "commit_count": count,
        "ref_count": refs,
        "source_files": files,
        "source_bytes": tree_bytes,
        "bytes": bundle_bytes,
        "sha256": bundle_sha,
        "anonymous_readback": checks,
        "verified": verified,
        "restore": f"curl -L -o {bundle_name} {b_url} && git clone {bundle_name} councilof-ai",
    }
    with open(os.path.join(OUT, "hf-bundle-latest.json"), "w") as f:
        json.dump(state, f, indent=2)
    with open(os.path.join(OUT, "hf-bundle-history.jsonl"), "a") as f:
        f.write(json.dumps(state) + "\n")

    if not args.keep:
        for p in (bundle_path,):
            if os.path.exists(p):
                os.remove(p)
        shutil.rmtree(tree_dir, ignore_errors=True)

    verdict = "VERIFIED" if verified else "UNVERIFIED"
    print(f"[result] {verdict} {REPO_ID} tip={tip[:12]} n={count} "
          f"source_files={files} bundle_bytes={bundle_bytes} "
          f"public={checks.get('public')} anon_source_ok={checks.get('source_bytes_match_git')} "
          f"anon_bundle_sha_ok={checks.get('bundle_sha256_matches')}")
    return 0 if verified else 1


if __name__ == "__main__":
    sys.exit(main())
