#!/usr/bin/env python3
"""evidence_sync.py: keep the public HF dataset behind the councilof.ai redirects byte-equal to the build.

WHY (28 Sep 2026, owner-approved): cards/ and proofs/ leave the Pages upload (20,000-file cap). Their
URLs 302 to https://huggingface.co/datasets/csoai/councilof-ai-evidence/resolve/main/<path>, per
scripts/deploy-exclusions.json and scripts/generate-redirects.mjs. Every root republish rewrites the
wrappers and proofs of its leaves. If the dataset is not updated before the deploy, /api/proof and MCP
get_card serve inclusion paths into the PREVIOUS root. From 22 to 28 Sep the old mirror trailed the
repository by 80 proofs, which is how that happened.

WHAT: for every entry in scripts/deploy-exclusions.json, compare the git blob sha1 of each local file
under public/ with the blob id the HF tree API reports for the same path.
  (default)  check only. Exit 3 when anything differs, so the deploy is held rather than serving stale bytes.
  --apply    upload the differing files (HF_TOKEN from the environment, never from disk or argv), after a
             secret regex pass over exactly those files. Then re-list, require zero differences, and
             read a sample back ANONYMOUSLY, comparing sha256.
Files on the dataset that the build does not hold are left alone, because the dataset only grows.
Stdlib only: the pod venv has no huggingface_hub.
"""
import argparse, base64, hashlib, json, os, random, re, sys, time, urllib.request, urllib.error
from pathlib import Path

REPO = "csoai/councilof-ai-evidence"
API = "https://huggingface.co/api/datasets/" + REPO
RESOLVE = "https://huggingface.co/datasets/" + REPO + "/resolve/main/"
UA = "csoai-evidence-sync/1.0 (+https://councilof.ai)"
SECRET_RULES = {
    "private-key-block": r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
    "hf-token": r"\bhf_[A-Za-z0-9]{30,}\b",
    "github-token": r"\b(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b",
    "aws-key": r"\b(AKIA|ASIA)[A-Z0-9]{16}\b",
    "llm-key": r"\bsk-(ant-|proj-)?[A-Za-z0-9_-]{32,}\b",
    "stripe": r"\b(sk|rk)_(live|test)_[A-Za-z0-9]{16,}\b",
    "slack": r"\bxox[abpors]-[A-Za-z0-9-]{10,}\b",
    "google-api": r"\bAIza[0-9A-Za-z_-]{35}\b",
    "jwt": r"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b",
    "password-kv": r"(?i)\"?(password|passwd|secret|api[_-]?key|access[_-]?token|private[_-]?key)\"?\s*[:=]\s*\"[^\"\s]{8,}\"",
    "url-credentials": r"[a-z][a-z0-9+.-]*://[^/\s:@\"]+:[^/\s@\"]{6,}@",
    "pkcs8-ed25519": r"MC4CAQAwBQYDK2VwBCIEI[A-Za-z0-9+/=]{20,}",
}


def req(url, data=None, headers=None, method=None, token=None, timeout=60):
    h = {"User-Agent": UA, **(headers or {})}
    if token:
        h["Authorization"] = "Bearer " + token
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=h, method=method), timeout=timeout) as r:
                return r.status, dict(r.headers), r.read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < 4:
                time.sleep(2 ** attempt * 3); continue
            return e.code, dict(e.headers), e.read()
        except (urllib.error.URLError, TimeoutError):
            if attempt < 4:
                time.sleep(2 ** attempt * 3); continue
            raise


def git_blob_sha(b: bytes) -> str:
    return hashlib.sha1(b"blob %d\0" % len(b) + b).hexdigest()


def local_files(public: Path, manifest: dict) -> dict:
    out = {}
    for e in manifest["entries"]:
        p = public / e["path"]
        if e["kind"] == "dir":
            if not p.is_dir():
                continue
            for f in sorted(p.rglob("*")):
                if f.is_file() and not any(part.startswith(".") for part in f.relative_to(public).parts):
                    out[f.relative_to(public).as_posix()] = f
        elif p.is_file():
            out[e["path"]] = p
    return out


def remote_tree(prefixes, token=None) -> dict:
    """path -> (blob oid, lfs sha256 or None). Follows the Link: rel=next cursor."""
    tree = {}
    for pre in sorted(prefixes):
        url = f"{API}/tree/main/{pre}?recursive=true&expand=false"
        while url:
            st, hd, body = req(url, token=token)
            if st == 404:
                break
            if st != 200:
                raise SystemExit(f"evidence-sync: tree listing {pre} HTTP {st}")
            for e in json.loads(body):
                if e.get("type") == "file":
                    tree[e["path"]] = (e.get("oid"), (e.get("lfs") or {}).get("oid"))
            m = re.search(r'<([^>]+)>;\s*rel="next"', hd.get("Link", "") or hd.get("link", ""))
            url = m.group(1) if m else None
    return tree


def diff(files: dict, tree: dict):
    out = []
    for rel, p in files.items():
        b = p.read_bytes()
        have = tree.get(rel)
        if have is None:
            out.append(rel); continue
        oid, lfs = have
        if lfs:
            if lfs != hashlib.sha256(b).hexdigest():
                out.append(rel)
        elif oid != git_blob_sha(b):
            out.append(rel)
    return out


def secret_scan(files: dict, rels) -> list:
    rx = {k: re.compile(v) for k, v in SECRET_RULES.items()}
    hits = []
    for rel in rels:
        s = files[rel].read_bytes().decode("utf-8", "replace")
        for k, r in rx.items():
            if r.search(s):
                hits.append(f"{rel}: {k}")   # file + rule only, never the matched text
    return hits


def commit(rels, files, token, message):
    for i in range(0, len(rels), 500):
        chunk = rels[i:i + 500]
        # preupload decides regular vs LFS; this path uploads only regular files and refuses anything else
        pre = {"files": [{"path": r, "size": files[r].stat().st_size,
                          "sample": base64.b64encode(files[r].read_bytes()[:512]).decode()} for r in chunk]}
        st, _, body = req(f"{API}/preupload/main", data=json.dumps(pre).encode(),
                          headers={"Content-Type": "application/json"}, method="POST", token=token)
        if st != 200:
            raise SystemExit(f"evidence-sync: preupload HTTP {st}: {body[:200]!r}")
        lfs = [f["path"] for f in json.loads(body).get("files", []) if f.get("uploadMode") != "regular"]
        if lfs:
            raise SystemExit(f"evidence-sync: {len(lfs)} file(s) need LFS upload, not supported here: {lfs[:3]}")
        lines = [json.dumps({"key": "header", "value": {"summary": f"{message} ({i + 1}-{i + len(chunk)} of {len(rels)})", "description": ""}})]
        for r in chunk:
            lines.append(json.dumps({"key": "file", "value": {"path": r, "encoding": "base64",
                                                              "content": base64.b64encode(files[r].read_bytes()).decode()}}))
        st, _, body = req(f"{API}/commit/main", data=("\n".join(lines) + "\n").encode(),
                          headers={"Content-Type": "application/x-ndjson"}, method="POST", token=token, timeout=300)
        if st != 200:
            raise SystemExit(f"evidence-sync: commit HTTP {st}: {body[:300]!r}")
        print(f"  committed {len(chunk)} file(s): {json.loads(body).get('commitOid', '?')[:12]}")


def anon_probe(files: dict, rels, n: int):
    bad = []
    for rel in rels[:n]:
        st, _, body = req(RESOLVE + rel)          # no token: what a stranger gets
        if st != 200 or hashlib.sha256(body).hexdigest() != hashlib.sha256(files[rel].read_bytes()).hexdigest():
            bad.append(f"{rel} HTTP {st}")
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--public-dir", default="public")
    ap.add_argument("--manifest", default="scripts/deploy-exclusions.json")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--probe", type=int, default=12)
    ap.add_argument("--message", default="sync from the councilof.ai build")
    ap.add_argument("--receipt")
    a = ap.parse_args()
    manifest = json.loads(Path(a.manifest).read_text())
    files = local_files(Path(a.public_dir), manifest)
    prefixes = {rel.split("/")[0] for rel in files}
    token = os.environ.get("HF_TOKEN") if a.apply else None
    tree = remote_tree(prefixes, token)
    d = diff(files, tree)
    print(f"evidence-sync: {len(files)} local files under {sorted(prefixes)}; dataset holds {len(tree)}; differing {len(d)}")
    rec = {"schema": "csoai.evidence-sync/1", "dataset": REPO, "local": len(files), "remote": len(tree), "differing_before": len(d)}
    if d and not a.apply:
        print(f"✗ evidence-sync: {REPO} trails this build by {len(d)} file(s), e.g. {d[:3]}; the redirects would serve stale bytes")
        rec["state"] = "TRAILING"; _w(a.receipt, rec); sys.exit(3)
    if d:
        if not token:
            print("✗ evidence-sync: --apply needs HF_TOKEN in the environment"); rec["state"] = "NO_TOKEN"; _w(a.receipt, rec); sys.exit(4)
        hits = secret_scan(files, d)
        if hits:
            print(f"✗ evidence-sync: secret pattern in {len(hits)} file(s); nothing uploaded: {hits[:5]}")
            rec["state"] = "SECRET_SCAN_FAILED"; _w(a.receipt, rec); sys.exit(5)
        print(f"  secret scan: {len(d)} file(s), 0 hits")
        commit(d, files, token, a.message)
        tree = remote_tree(prefixes, token)
        left = diff(files, tree)
        if left:
            print(f"✗ evidence-sync: {len(left)} file(s) still differ after upload: {left[:3]}"); rec["state"] = "UPLOAD_INCOMPLETE"; _w(a.receipt, rec); sys.exit(6)
    sample = d if d else random.sample(sorted(files), min(a.probe, len(files)))
    bad = anon_probe(files, sample, a.probe)
    if bad:
        print(f"✗ evidence-sync: anonymous read-back failed for {len(bad)}: {bad[:3]}"); rec["state"] = "ANON_READBACK_FAILED"; _w(a.receipt, rec); sys.exit(7)
    rec.update(state="IN_SYNC", uploaded=len(d), anon_readback_ok=min(a.probe, len(sample)))
    _w(a.receipt, rec)
    print(f"✓ evidence-sync: {REPO} == build ({len(files)} files; uploaded {len(d)}; anonymous sha256 read-back {min(a.probe, len(sample))}/{min(a.probe, len(sample))})")


def _w(p, rec):
    if p:
        rec["at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        Path(p).write_text(json.dumps(rec, indent=2) + "\n")


if __name__ == "__main__":
    main()
