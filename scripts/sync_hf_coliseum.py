#!/usr/bin/env python3
"""Publish the already-built Coliseum mirror; never compile or deploy Council OS.

The protected master deployment is the producer. Its successful workflow_run
supplies the immutable artifact, source SHA and run ID to the existing HF writer.
--verify-only is offline; --check-access checks the current target grant without
writing anything. No credentials or browser session content enter this artifact.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import sys
import time
from urllib.parse import quote
from urllib.request import urlopen

REPO = "csoai/council-coliseum"
HOST = "https://csoai-council-coliseum.static.hf.space"
MANIFEST = "coliseum-manifest.json"
RECEIPT = "coliseum-release.json"
SCHEMA = "csoai.coliseum-mirror/0.1"
MAX_BYTES = 25 * 1024 * 1024
MAX_FILES = 512


class Refused(RuntimeError):
    pass


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def safe_path(name: str) -> bool:
    if not isinstance(name, str) or not name or "\\" in name:
        return False
    path = PurePosixPath(name)
    if path.is_absolute() or ".." in path.parts or str(path) != name:
        return False
    return name in {"index.html", "README.md", "LICENSE"} or (
        name.startswith("assets/") and
        re.fullmatch(r"[A-Za-z0-9_./-]+", name) is not None and
        all(not part.startswith(".") for part in path.parts)
    )


def load_artifact(root: Path, expected_sha: str) -> dict[str, bytes]:
    if not re.fullmatch(r"[0-9a-f]{40}", expected_sha or ""):
        raise Refused("expected source must be a complete Git commit SHA")
    if not root.is_dir() or root.is_symlink():
        raise Refused("artifact directory is missing or is a symlink")
    paths = list(root.rglob("*"))
    if any(path.is_symlink() for path in paths):
        raise Refused("artifact contains a symlink")
    leaves = [path for path in paths if path.is_file()]
    if len(leaves) > MAX_FILES or sum(p.stat().st_size for p in leaves) > MAX_BYTES:
        raise Refused("artifact exceeds its bounded file or byte limit")
    manifest_path = root / MANIFEST
    if not manifest_path.is_file() or manifest_path.stat().st_size > 128 * 1024:
        raise Refused("mirror manifest missing or too large")
    manifest_bytes = manifest_path.read_bytes()
    try:
        manifest = json.loads(manifest_bytes)
    except (UnicodeDecodeError, ValueError) as error:
        raise Refused("invalid manifest JSON") from error
    if not isinstance(manifest, dict) or manifest.get("schema") != SCHEMA:
        raise Refused("unsupported mirror manifest")
    if manifest.get("source_commit") != expected_sha:
        raise Refused("artifact source does not match the successful deployment")
    hashes = manifest.get("files")
    if not isinstance(hashes, dict) or not {"index.html", "README.md", "LICENSE"} <= hashes.keys():
        raise Refused("manifest lacks the entry, README or license")
    if any(not safe_path(name) or not isinstance(value, str) or
           re.fullmatch(r"[0-9a-f]{64}", value) is None for name, value in hashes.items()):
        raise Refused("invalid manifest path or digest")
    actual_names = {p.relative_to(root).as_posix() for p in leaves}
    if actual_names != set(hashes) | {MANIFEST}:
        raise Refused("artifact contains missing or unlisted files")
    files = {}
    for name, expected_digest in hashes.items():
        data = (root / name).read_bytes()
        if digest(data) != expected_digest:
            raise Refused("artifact digest mismatch: " + name)
        files[name] = data
    files[MANIFEST] = manifest_bytes
    return files


# Public platform additions observed on this exact static Space, 7 Nov 2026.
# The creator ID is public metadata (api/users/<id>/overview), not a credential.
# Construct one exact allowed served variant; never strip or reserialize HTML.
HF_STATIC_ENV = b'<script>window.huggingface={variables:{"SPACE_CREATOR_USER_ID":"69195dca8cf74d90adb364a6"}};</script>'
HF_STATIC_SOCIAL = (
    b'<meta property="og:title" content="Council Coliseum">'
    b'<meta property="og:image" content="https://cdn-thumbnails.huggingface.co/social-thumbnails/spaces/csoai/council-coliseum.png">'
    b'<meta name="twitter:card" content="summary_large_image">'
    b'<meta name="twitter:image" content="https://cdn-thumbnails.huggingface.co/social-thumbnails/spaces/csoai/council-coliseum.png">'
)


def hosted_index_matches(actual: bytes, expected: bytes) -> bool:
    if actual == expected:
        return True
    if not isinstance(actual, bytes) or expected.count(b"<head>") != 1 or expected.count(b"</head>") != 1:
        return False
    start = expected.index(b"<head>") + len(b"<head>")
    end = expected.index(b"</head>")
    if start > end:
        return False
    served = expected[:start] + HF_STATIC_ENV + expected[start:end] + HF_STATIC_SOCIAL + expected[end:]
    return actual == served


def verify_readback(hub, files, revision, attempts=6, sleep=time.sleep):
    stage = revision if revision in ("main", "live") else "immutable"
    failure = "no files checked"
    for attempt in range(attempts):
        matched = True
        for name, expected in files.items():
            try:
                actual = hub.read(name, revision)
            except Exception as error:
                status = getattr(error, "code", None)
                detail = type(error).__name__ + (" status=" + str(status) if type(status) is int else "")
                failure = "path=" + name + " read-error=" + detail
                matched = False
                break
            exact = actual == expected
            if revision == "live" and name == "index.html":
                exact = hosted_index_matches(actual, expected)
            if not exact:
                observed = digest(actual) if isinstance(actual, bytes) else "missing-or-nonbytes"
                failure = "path=" + name + " expected_sha256=" + digest(expected) + " actual_sha256=" + observed
                matched = False
                break
        if matched:
            return
        if attempt + 1 < attempts:
            sleep(5)
    raise Refused("HF readback failed: stage=" + stage + " " + failure)


def publish(hub, files: dict[str, bytes], source_sha: str, run_id: int,
            sleep=time.sleep) -> dict:
    if run_id < 1:
        raise Refused("a successful upstream deployment run ID is required")
    # A public read, organization role or stored token is not a write grant.
    hub.check_write()
    parent = hub.head()
    previous = hub.read(RECEIPT, parent)
    if previous is not None:
        try:
            previous = json.loads(previous)
            previous_run = previous["upstream_run_id"]
            previous_sha = previous["source_commit"]
            if type(previous_run) is not int or not isinstance(previous_sha, str):
                raise ValueError("invalid receipt fields")
        except (ValueError, KeyError, TypeError) as error:
            raise Refused("existing release receipt is malformed") from error
        if previous_run > run_id or (previous_run == run_id and previous_sha != source_sha):
            raise Refused("refusing an older or conflicting deployment")
    receipt = json.dumps({
        "schema": "csoai.coliseum-release/0.1",
        "source_commit": source_sha,
        "upstream_run_id": run_id,
        "artifact_manifest_sha256": digest(files[MANIFEST]),
        "repo": REPO,
        "claim_boundary": "Browser-local practice; no native R3 execution, learning admission or board score.",
    }, sort_keys=True, indent=2).encode() + b"\n"
    desired = {**files, RECEIPT: receipt}
    changed = {name: data for name, data in desired.items() if hub.read(name, parent) != data}
    # Parent lease rejects another publisher's update. Existing unique files and
    # earlier content-addressed assets are preserved, never bulk-deleted.
    revision = hub.commit(changed, parent) if changed else parent
    verify_readback(hub, desired, revision, sleep=sleep)
    verify_readback(hub, desired, "main", sleep=sleep)
    # Verify the hosted page and its asset closure, not just Hub repository bytes.
    verify_readback(hub, {name: data for name, data in files.items()
                          if name == "index.html" or name == MANIFEST or name.startswith("assets/")},
                    "live", sleep=sleep)
    return {"state": "PUBLISHED_AND_VERIFIED" if changed else "UNCHANGED_AND_VERIFIED",
            "repo": REPO, "revision": revision, "source_commit": source_sha,
            "upstream_run_id": run_id, "files": len(files),
            "artifact_manifest_sha256": digest(files[MANIFEST])}


class HuggingFace:
    def __init__(self, token: str):
        if not token:
            raise Refused("HF_TOKEN is empty")
        from huggingface_hub import HfApi
        self.api = HfApi(token=token)

    def check_write(self):
        self.api.auth_check(repo_id=REPO, repo_type="space", write=True)

    def head(self):
        return self.api.repo_info(repo_id=REPO, repo_type="space").sha

    def read(self, name, revision):
        if revision == "live":
            url = HOST + "/" + quote(name, safe="/")
        else:
            url = ("https://huggingface.co/spaces/" + REPO + "/resolve/" +
                   quote(revision, safe="") + "/" + quote(name, safe="/"))
        from urllib.error import HTTPError
        try:
            with urlopen(url, timeout=20) as response:
                data = response.read(MAX_BYTES + 1)
                if len(data) > MAX_BYTES:
                    raise Refused("oversize readback")
                return data
        except HTTPError as error:
            if error.code == 404:
                return None
            raise

    def commit(self, changed, parent):
        from huggingface_hub import CommitOperationAdd
        info = self.api.create_commit(
            repo_id=REPO, repo_type="space", revision="main",
            parent_commit=parent,
            commit_message="Mirror Coliseum from successful Council deployment",
            operations=[CommitOperationAdd(path_in_repo=name, path_or_fileobj=data)
                        for name, data in sorted(changed.items())])
        return info.oid


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--artifact", type=Path)
    parser.add_argument("--expected-sha")
    parser.add_argument("--upstream-run-id", type=int, default=0)
    parser.add_argument("--copy-assets-existing-allowance", action="store_true",
                        help="Only when the existing storage allowance is qualified for no new charge")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--verify-only", action="store_true")
    mode.add_argument("--check-access", action="store_true")
    args = parser.parse_args(argv)
    try:
        if args.check_access:
            HuggingFace(os.environ.get("HF_TOKEN", "")).check_write()
            result = {"state": "WRITE_ACCESS_VERIFIED", "repo": REPO}
        else:
            if args.artifact is None:
                raise Refused("--artifact is required")
            files = load_artifact(args.artifact, args.expected_sha)
            if args.verify_only:
                result = {"state": "ARTIFACT_VERIFIED", "source_commit": args.expected_sha,
                          "files": len(files), "artifact_manifest_sha256": digest(files[MANIFEST])}
            else:
                hub = HuggingFace(os.environ.get("HF_TOKEN", ""))
                result = publish(hub, files, args.expected_sha, args.upstream_run_id)
                try:
                    result["asset_bucket"] = copy_coliseum_assets_to_bucket(
                        hub.api, files,
                        no_new_charge_confirmed=args.copy_assets_existing_allowance)
                except Exception as error:
                    result["asset_bucket"] = {
                        "state": "refused", "bucket": COLISEUM_BUCKET,
                        "reason": type(error).__name__,
                        "claim_boundary": "Space published; bucket copy/readback not completed.",
                    }
                    print(json.dumps(result, sort_keys=True))
                    return 2
        print(json.dumps(result, sort_keys=True))
        return 0
    except Exception as error:
        # Never echo credential-bearing library request details.
        message = str(error) if isinstance(error, Refused) else type(error).__name__
        print(json.dumps({"state": "REFUSED", "reason": message}), file=sys.stderr)
        return 2


# Integrate into the EXISTING publisher after its verified_files/offline manifest checks.
# No new script/service/writer. Caller must record this separate outcome.
import hashlib
import re
from urllib.parse import quote
from urllib.request import Request, urlopen

COLISEUM_BUCKET = "csoai/csoai-catalogue"

def copy_coliseum_assets_to_bucket(api, verified_files, *, no_new_charge_confirmed=False,
                                   read_public=None):
    """Copy exact public build assets under content-addressed keys.

    Requires the existing sole release writer. Hub batch writes lack conditional
    create: this is preflight + recheck + readback, NOT an atomic append guarantee.
    Never sends delete/copy or changes bucket visibility/credentials.
    """
    if not no_new_charge_confirmed:
        return {"state": "held", "reason": "existing storage allowance/cost not qualified",
                "bucket": COLISEUM_BUCKET, "objects": []}
    assets = {}
    for name, data in verified_files.items():
        if not name.startswith("assets/"):
            continue
        if (not isinstance(data, bytes) or
            not re.fullmatch(r"assets/[A-Za-z0-9_./-]+", name) or
            any(part in ("", ".", "..") for part in name.split("/"))):
            raise ValueError("Invalid public build asset")
        digest = hashlib.sha256(data).hexdigest()
        remote = "games/coliseum/" + digest + "/" + name.rsplit("/", 1)[-1]
        assets[remote] = (name, data, digest)
    if not assets or len(assets) > 512 or sum(len(v[1]) for v in assets.values()) > 25 * 1024 * 1024:
        raise ValueError("Bucket copy exceeds verified artifact limits")

    def resolve(remote, size):
        url = "https://huggingface.co/buckets/" + COLISEUM_BUCKET + "/resolve/" + quote(remote, safe="")
        if read_public is not None:
            result = read_public(url, size + 1)
        else:
            request = Request(url, headers={"Accept-Encoding": "identity"})
            with urlopen(request, timeout=20) as response:
                result = response.read(size + 1)
        if len(result) > size:
            raise ValueError("Bucket response exceeds expected public asset size")
        return result

    def check_existing(paths):
        allowed = set(paths)
        observed = list(api.get_bucket_paths_info(COLISEUM_BUCKET, paths))
        seen = set()
        for item in observed:
            remote = item.path
            if remote not in allowed or remote in seen:
                raise ValueError("Unexpected bucket path metadata")
            seen.add(remote)
            _, data, digest = assets[remote]
            if item.size != len(data):
                raise ValueError("Content-addressed bucket path conflicts")
            actual = resolve(remote, len(data))
            if actual != data or hashlib.sha256(actual).hexdigest() != digest:
                raise ValueError("Content-addressed bucket bytes conflict")
        return seen

    # Refuse ANY existing conflict before any mutation.
    existing = check_existing(list(assets))
    receipts = []
    for remote, (name, data, digest) in sorted(assets.items()):
        status = "existing-exact"
        if remote not in existing:
            # Recheck immediately before sole-writer add. No transactional claim.
            if remote not in check_existing([remote]):
                api.batch_bucket_files(COLISEUM_BUCKET, add=[(data, remote)])
                status = "added"
        actual = resolve(remote, len(data))
        if actual != data or hashlib.sha256(actual).hexdigest() != digest:
            raise ValueError("Bucket public readback failed")
        receipts.append({"source_path": name, "path": remote, "sha256": digest,
                         "bytes": len(data), "state": status})
    return {"state": "verified", "bucket": COLISEUM_BUCKET, "objects": receipts,
            "consistency": "single-writer preflight, recheck and exact public readback; not transactional"}


if __name__ == "__main__":
    sys.exit(main())
