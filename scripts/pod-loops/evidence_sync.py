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


HF_MAX_FILES_PER_DIR = 10000


def dir_of(relative):
    """Validate a literal repository-relative path; do not normalise traversal away."""
    if not isinstance(relative, str) or not relative or relative.startswith('/') or '\\' in relative:
        raise ValueError('Expected a repository-relative path')
    parts = relative.split('/')
    if any(p in ('', '.', '..') or any(ord(c) < 32 for c in p) for p in parts):
        raise ValueError('Unsafe or ambiguous repository path')
    return '/'.join(parts[:-1])


def plan_by_directory(rels, tree, files):
    """Plan against the observed full mirror inventory; replacements add no files.

    A plan grants no permission to prune or migrate old URLs. Readback must still
    establish whether accepted commits actually produced the expected bytes.
    """
    if len(rels) != len(set(rels)):
        raise ValueError('Duplicate selected file')
    counts = {}
    for relative in tree:
        directory = dir_of(relative)
        counts[directory] = counts.get(directory, 0) + 1
    groups = {}
    for relative in rels:
        directory = dir_of(relative)
        if relative not in files:
            raise ValueError('Selected file absent from build')
        groups.setdefault(directory, []).append(relative)
    # The ORPHANS: the mirror holds files this build does not have. They are not
    # selected, so they are never written, and a plan grants no permission to
    # prune them — so they accumulate. MEASURED 6 Nov 2026: the mirror held
    # 9,920 files in interop/mill-cards-unsigned and 9,795 in interop/mill-evidence
    # where the build holds 3,656 and 4,472; 14,127 of them are orphans whose
    # admission evidence this tree does not hold. They consumed the budget the
    # build's own files needed: adding 1,270 files to 9,920 is 11,190, over the
    # 10,000 limit, so the directory was not written at all and the legitimate
    # files were never published. The orphan count is what makes that visible.
    orphan_counts = {}
    for relative in tree:
        if relative in files:
            continue
        directory = dir_of(relative)
        orphan_counts[directory] = orphan_counts.get(directory, 0) + 1
    plan = []
    for directory, selected in sorted(groups.items()):
        selected = sorted(selected)
        before = counts.get(directory, 0)
        new = sum(relative not in tree for relative in selected)
        after = before + new
        plan.append({'directory': directory, 'files': selected,
                     'mirror_files_before': before, 'new_files': new,
                     'mirror_files_after': after, 'over_limit': after > HF_MAX_FILES_PER_DIR,
                     'orphan_files': orphan_counts.get(directory, 0)})
    return plan


def commit_grouped(rels, files, token, message, plan):
    """Separate directory failures; never continue after denied authorization.

    SYNCED here means commit() returned, not independent readback. main() records
    actual verified bytes before reporting an overall success. Response bodies and
    credential values are deliberately excluded from these public-safe summaries.
    """
    if len(rels) != len(set(rels)):
        raise ValueError('Duplicate selected file')
    actual = {}
    for relative in rels:
        directory = dir_of(relative)
        if relative not in files:
            raise ValueError('Selected file absent from build')
        actual.setdefault(directory, []).append(relative)
    if len(plan) != len(actual) or {p.get('directory') for p in plan} != set(actual):
        raise ValueError('Plan does not cover selected directories exactly')
    for row in plan:
        if sorted(row.get('files', [])) != sorted(actual[row['directory']]):
            raise ValueError('Plan file set differs')
        for field in ('mirror_files_before', 'new_files', 'mirror_files_after', 'orphan_files'):
            if type(row.get(field)) is not int or row[field] < 0:
                raise ValueError('Plan count must be a nonnegative integer')
        if row['new_files'] > len(row['files']) or row['mirror_files_before'] + row['new_files'] != row['mirror_files_after']:
            raise ValueError('Inconsistent plan counts')
        if type(row.get('over_limit')) is not bool or row['over_limit'] != (row['mirror_files_after'] > HF_MAX_FILES_PER_DIR):
            raise ValueError('Inconsistent limit classification')
    outcomes = {}
    stopped = False
    for row in sorted(plan, key=lambda x: x['directory']):
        directory = row['directory']
        common = {'selected_files': len(row['files']), 'mirror_files_after': row['mirror_files_after'],
                  'orphan_files': row.get('orphan_files', 0), 'readback_verified': False}
        if stopped:
            outcomes[directory] = {**common, 'state': 'NOT_ATTEMPTED', 'detail': 'Earlier authorization or rate-limit refusal; no alternate route attempted'}
        elif row['over_limit']:
            outcomes[directory] = {**common, 'state': 'OVER_DIRECTORY_LIMIT', 'detail': f"{row['mirror_files_after']} files would exceed the {HF_MAX_FILES_PER_DIR} file limit; no deletion or write attempted"}
        else:
            try:
                commit(row['files'], files, token, message)
                outcomes[directory] = {**common, 'state': 'SYNCED', 'detail': 'Commit returned; exact remote and anonymous readback still required'}
            except (SystemExit, urllib.error.URLError, TimeoutError) as error:
                # Do not copy the server body, a URL, or the supplied token into a receipt.
                code = re.search(r'HTTP (\d{3})', str(error))
                status = int(code.group(1)) if code else None
                stopped = status in (401, 403, 429)
                outcomes[directory] = {**common, 'state': 'REJECTED', 'http_status': status,
                    'detail': 'Commit did not complete; readback is needed to determine any partial effect'}
    return outcomes


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--public-dir", default="public")
    ap.add_argument("--manifest", default="scripts/deploy-exclusions.json")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--probe", type=int, default=12)
    ap.add_argument("--message", default="sync from the councilof.ai build")
    ap.add_argument("--receipt")
    a = ap.parse_args()
    if a.probe < 1:
        ap.error("--probe must be positive; anonymous verification cannot be disabled")
    manifest = json.loads(Path(a.manifest).read_text())
    files = local_files(Path(a.public_dir), manifest)
    prefixes = {rel.split("/")[0] for rel in files}
    token = os.environ.get("HF_TOKEN") if a.apply else None
    tree = remote_tree(prefixes, token)
    d = diff(files, tree)
    # The ORPHANS the mirror holds and this build does not. A plan grants no
    # permission to prune them, so they accumulate and they consume the
    # per-directory budget the build's own files need. Naming the count is what
    # turns that from an invisible drift into a measured one.
    orphan_total = len(set(tree) - set(files))
    print(f"evidence-sync: {len(files)} local files under {sorted(prefixes)}; dataset holds {len(tree)}; differing {len(d)}; orphans (mirror holds, build does not) {orphan_total}")
    rec = {"schema": "csoai.evidence-sync/1", "dataset": REPO, "local": len(files), "remote": len(tree), "differing_before": len(d), "orphan_files": orphan_total}
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
        plan = plan_by_directory(d, tree, files)
        outcomes = commit_grouped(d, files, token, a.message, plan)
        rec['directories'] = outcomes
        try:
            tree = remote_tree(prefixes, token)
            left = diff(files, tree)
        except (SystemExit, OSError, ValueError):
            rec.update(state='READBACK_UNAVAILABLE', uploaded=None)
            _w(a.receipt, rec)
            raise SystemExit(6)
        left_set = set(left)
        verified = [relative for relative in d if relative not in left_set]
        for row in plan:
            pending = sum(relative in left_set for relative in row['files'])
            outcomes[row['directory']]['remaining_files'] = pending
            outcomes[row['directory']]['readback_verified'] = pending == 0
        rec.update(verified_matching=len(verified), remaining=len(left))
        # Verify a member of every successful directory, not only a prefix sample.
        sample = []
        for row in plan:
            matching = [relative for relative in row['files'] if relative not in left_set]
            if matching:
                sample.append(matching[0])
        sample.extend(relative for relative in verified[:a.probe] if relative not in sample)
        try:
            bad = anon_probe(files, sample, len(sample))
        except OSError:
            rec.update(state='ANON_READBACK_FAILED', uploaded=None)
            _w(a.receipt, rec)
            raise SystemExit(7)
        rec['anon_readback_ok'] = len(sample) - len(bad)
        if bad:
            rec.update(state='ANON_READBACK_FAILED', uploaded=None)
            _w(a.receipt, rec)
            raise SystemExit(7)
        if left:
            rec.update(state='PARTIAL_SYNC' if verified else 'UPLOAD_INCOMPLETE', uploaded=None)
            _w(a.receipt, rec)
            print(f"✗ evidence-sync: {len(verified)} selected files match; {len(left)} remain; publication remains incomplete")
            raise SystemExit(6)
        if any(row['state'] != 'SYNCED' for row in outcomes.values()):
            # Another writer or a lost response may explain matching bytes. Do not
            # claim this invocation uploaded or successfully owned that operation.
            rec.update(state='READBACK_MATCH_COMMIT_UNCERTAIN', uploaded=None)
            _w(a.receipt, rec)
            raise SystemExit(6)
        rec.update(state='IN_SYNC', uploaded=len(d))
        _w(a.receipt, rec)
        print(f"✓ evidence-sync: all {len(d)} selected files verified; {len(sample)} anonymous readbacks")
        return
    sample = d if d else random.sample(sorted(files), min(a.probe, len(files)))
    try:
        bad = anon_probe(files, sample, a.probe)
    except OSError:
        rec.update(state='ANON_READBACK_FAILED', uploaded=None)
        _w(a.receipt, rec)
        raise SystemExit(7)
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
