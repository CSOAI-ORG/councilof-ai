#!/usr/bin/env python3
"""Fetch every published file back with NO credentials and compare it to the local bytes.

    python3 verify_published.py --bundle <dir> --repo csoai/gspc-estate [--also <dir>:<repo>]

A push is not a publication until a stranger can read the result. This uses the anonymous
resolve URL — no token, no huggingface_hub, no session — and compares sha256. Any mismatch,
any 401, any 404 is a failure and is named.
"""
from __future__ import annotations
import argparse, hashlib, json, pathlib, sys, urllib.error, urllib.request

UA = {"User-Agent": "csoai-estate-readback/1.0"}


def check(local: pathlib.Path, repo: str, rel: str):
    url = f"https://huggingface.co/datasets/{repo}/resolve/main/{rel}"
    want = hashlib.sha256(local.read_bytes()).hexdigest()
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180) as r:
            got = hashlib.sha256(r.read()).hexdigest()
    except urllib.error.HTTPError as e:
        return {"path": rel, "state": f"HTTP_{e.code}", "url": url, "sha256_local": want}
    except Exception as e:
        return {"path": rel, "state": f"{type(e).__name__}", "url": url, "sha256_local": want}
    return {"path": rel, "state": "BYTES_MATCH" if got == want else "BYTES_DIFFER",
            "url": url, "sha256_local": want, "sha256_remote": got}


def one(root: pathlib.Path, repo: str):
    import concurrent.futures as cf
    # readback.jsonl is this check's own output; it is written after the upload and is
    # never part of the published set, so scanning it would report a 404 about ourselves.
    rows = [check(f, repo, str(f.relative_to(root)))
            for f in sorted(root.rglob("*"))
            if f.is_file() and f.name != "readback.jsonl"]
    ok = sum(1 for r in rows if r["state"] == "BYTES_MATCH")
    print(f"\n{repo}: {ok}/{len(rows)} files read back anonymously with matching bytes")
    for r in rows:
        if r["state"] != "BYTES_MATCH":
            print(f"  {r['state']:14s} {r['path']}")
    (root / "readback.jsonl").write_text(
        "".join(json.dumps(r, sort_keys=True) + "\n" for r in rows), encoding="utf-8")
    return ok, len(rows)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--bundle", required=True)
    ap.add_argument("--repo", required=True)
    ap.add_argument("--also", action="append", default=[])
    a = ap.parse_args()
    pairs = [(pathlib.Path(a.bundle), a.repo)]
    for spec in a.also:
        d, _, r = spec.rpartition(":")
        pairs.append((pathlib.Path(d), r))
    bad = 0
    for root, repo in pairs:
        ok, tot = one(root, repo)
        bad += tot - ok
    print(f"\n{'ANONYMOUS READ-BACK CLEAN' if not bad else f'{bad} FILE(S) DID NOT READ BACK'}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
