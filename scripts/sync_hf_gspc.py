#!/usr/bin/env python3
"""Synchronise the two canonical GSPC Hugging Face surfaces without re-signing.

The two inputs are intentionally separate:

* ``--shell`` copies four committed git blobs from ``spaces/gspc-board`` to the
  root of the ONE canonical Hugging Face Space.
* ``--root`` fetches the already-signed production ``root.json``, verifies its
  Merkle tree and Ed25519 signature, then copies those exact bytes to the
  public-root mirror dataset.

This script never builds a board, regenerates a root, edits a signature, updates
dataset cards, or touches the superseded ``gspc-live-board`` Space.  A changed
target is written in one Hugging Face commit and every byte is read back from
both the immutable commit and ``main`` before success is reported.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Mapping, Protocol


REPO_ROOT = Path(__file__).resolve().parents[1]
SHELL_REPO_ID = "csoai/gspc-board"
ROOT_REPO_ID = "csoai/gspc-boards"
ROOT_PATH = "public-root/root.json"
PRODUCTION_ROOT_URL = "https://councilof.ai/root.json"
DID_URL = "https://councilof.ai/.well-known/did.json"
SHELL_FILES = (
    "spaces/gspc-board/README.md",
    "spaces/gspc-board/index.html",
    "spaces/gspc-board/style.css",
    "spaces/gspc-board/table.js",
)
USER_AGENT = "csoai-hf-gspc-sync/1 (+https://github.com/CSOAI-ORG/councilof-ai)"


class SyncRefused(RuntimeError):
    """The candidate could not be proven safe to publish."""


class Hub(Protocol):
    def read(self, repo_id: str, repo_type: str, path: str, revision: str = "main") -> bytes | None: ...

    def commit(
        self,
        repo_id: str,
        repo_type: str,
        files: Mapping[str, bytes],
        message: str,
    ) -> str: ...


def digest(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def fetch_bytes(url: str, timeout: int = 30) -> bytes:
    separator = "&" if "?" in url else "?"
    cache_busted = f"{url}{separator}sync_read={time.time_ns()}"
    request = urllib.request.Request(
        cache_busted,
        headers={"Accept": "application/json", "Cache-Control": "no-cache", "User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        if response.status != 200:
            raise SyncRefused(f"HTTP {response.status} from {url}")
        return response.read()


def git_blob(repo_root: Path, path: str) -> bytes:
    result = subprocess.run(
        ["git", "show", f"HEAD:{path}"],
        cwd=repo_root,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        reason = result.stderr.decode("utf-8", errors="replace").strip()
        raise SyncRefused(f"{path} is not a committed HEAD blob: {reason}")
    return result.stdout


def committed_shell(repo_root: Path = REPO_ROOT) -> tuple[dict[str, bytes], str]:
    files = {path.removeprefix("spaces/gspc-board/"): git_blob(repo_root, path) for path in SHELL_FILES}
    result = subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=repo_root, capture_output=True, text=True, check=False
    )
    if result.returncode != 0 or len(result.stdout.strip()) != 40:
        raise SyncRefused("could not resolve the source commit")
    return files, result.stdout.strip()


def verified_production_root(fetch: Callable[[str], bytes] = fetch_bytes) -> tuple[bytes, str]:
    """Return unchanged production bytes only after the existing verifier accepts them."""
    root_bytes = fetch(PRODUCTION_ROOT_URL)
    did_bytes = fetch(DID_URL)
    try:
        root = json.loads(root_bytes)
        did = json.loads(did_bytes)
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise SyncRefused(f"production root or DID is not JSON: {error}") from error
    if not isinstance(root, dict) or not isinstance(did, dict):
        raise SyncRefused("production root and DID must both be JSON objects")

    # Reuse the release reader.  It verifies leaf count, Merkle recomputation,
    # signer DID and Ed25519 over the documented canonical preimage.
    from watch_public_root import did_public_key, validate_root

    try:
        identity = validate_root(root, did_public_key(did))
    except (KeyError, TypeError, ValueError) as error:
        raise SyncRefused(f"production root failed cryptographic validation: {error}") from error
    return root_bytes, identity


@dataclass(frozen=True)
class SyncResult:
    state: str
    repo_id: str
    revision: str
    changed: tuple[str, ...]
    sha256: dict[str, str]


def _readback(
    hub: Hub,
    repo_id: str,
    repo_type: str,
    desired: Mapping[str, bytes],
    revision: str,
    *,
    attempts: int = 5,
    sleep: Callable[[float], None] = time.sleep,
) -> None:
    mismatch: list[str] = []
    for attempt in range(attempts):
        mismatch = []
        for path, expected in desired.items():
            observed = hub.read(repo_id, repo_type, path, revision)
            if observed != expected:
                mismatch.append(
                    f"{path}: expected {digest(expected)}, got {digest(observed) if observed is not None else 'MISSING'}"
                )
        if not mismatch:
            return
        if attempt + 1 < attempts:
            sleep(float(2**attempt))
    raise SyncRefused(f"post-publish readback mismatch at {repo_id}@{revision}: " + "; ".join(mismatch))


def sync_exact(
    hub: Hub,
    repo_id: str,
    repo_type: str,
    desired: Mapping[str, bytes],
    message: str,
    *,
    dry_run: bool = False,
    readback_sleep: Callable[[float], None] = time.sleep,
) -> SyncResult:
    changed = tuple(
        path for path, payload in desired.items() if hub.read(repo_id, repo_type, path, "main") != payload
    )
    hashes = {path: digest(payload) for path, payload in desired.items()}
    if not changed:
        return SyncResult("UNCHANGED", repo_id, "main", (), hashes)
    if dry_run:
        return SyncResult("DRY_RUN", repo_id, "main", changed, hashes)

    revision = hub.commit(repo_id, repo_type, {path: desired[path] for path in changed}, message)
    if not revision or revision == "main":
        raise SyncRefused("Hugging Face did not return an immutable commit revision")
    _readback(hub, repo_id, repo_type, desired, revision, sleep=readback_sleep)
    _readback(hub, repo_id, repo_type, desired, "main", sleep=readback_sleep)
    return SyncResult("PUBLISHED", repo_id, revision, changed, hashes)


class HuggingFaceHub:
    def __init__(self, token: str | None):
        self.token = (token or "").strip()

    @staticmethod
    def _raw_url(repo_id: str, repo_type: str, path: str, revision: str) -> str:
        prefix = "spaces" if repo_type == "space" else "datasets"
        quoted_revision = urllib.parse.quote(revision, safe="")
        quoted_path = urllib.parse.quote(path, safe="/")
        return f"https://huggingface.co/{prefix}/{repo_id}/resolve/{quoted_revision}/{quoted_path}"

    def read(self, repo_id: str, repo_type: str, path: str, revision: str = "main") -> bytes | None:
        try:
            return fetch_bytes(self._raw_url(repo_id, repo_type, path, revision))
        except urllib.error.HTTPError as error:
            if error.code == 404:
                return None
            raise

    def commit(
        self,
        repo_id: str,
        repo_type: str,
        files: Mapping[str, bytes],
        message: str,
    ) -> str:
        if not self.token:
            raise SyncRefused("HF_TOKEN is empty; refusing an unauthenticated publish")
        try:
            from huggingface_hub import CommitOperationAdd, HfApi
        except ImportError as error:
            raise SyncRefused("huggingface_hub is not installed") from error
        operations = [
            CommitOperationAdd(path_in_repo=path, path_or_fileobj=payload) for path, payload in files.items()
        ]
        info = HfApi(token=self.token).create_commit(
            repo_id=repo_id,
            repo_type=repo_type,
            revision="main",
            operations=operations,
            commit_message=message,
        )
        revision = str(getattr(info, "oid", "") or "")
        if not revision:
            raise SyncRefused("Hugging Face commit response carried no oid")
        return revision


def print_result(result: SyncResult) -> None:
    print(
        json.dumps(
            {
                "state": result.state,
                "repo": result.repo_id,
                "revision": result.revision,
                "changed": list(result.changed),
                "sha256": result.sha256,
            },
            sort_keys=True,
        )
    )


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--shell", action="store_true", help="sync the four committed canonical Space shell files")
    mode.add_argument("--root", action="store_true", help="sync verified production root bytes")
    parser.add_argument("--dry-run", action="store_true", help="compare and report without creating a Hub commit")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    hub = HuggingFaceHub(os.environ.get("HF_TOKEN"))
    if args.shell:
        files, source_revision = committed_shell()
        result = sync_exact(
            hub,
            SHELL_REPO_ID,
            "space",
            files,
            f"Sync canonical Space shell from councilof-ai {source_revision[:12]}",
            dry_run=args.dry_run,
        )
    else:
        root_bytes, signed_identity = verified_production_root()
        result = sync_exact(
            hub,
            ROOT_REPO_ID,
            "dataset",
            {ROOT_PATH: root_bytes},
            f"Sync verified Council public root {digest(root_bytes)[:12]} ({signed_identity[:12]})",
            dry_run=args.dry_run,
        )
        if result.state == "PUBLISHED":
            # Validate the exact bytes once more after both immutable and main
            # readbacks have passed. No normalisation or reserialisation occurs.
            observed = hub.read(ROOT_REPO_ID, "dataset", ROOT_PATH, result.revision)
            if observed != root_bytes:
                raise SyncRefused("verified root changed during post-publish readback")
    print_result(result)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SyncRefused as error:
        print(f"REFUSED: {error}", file=sys.stderr)
        raise SystemExit(2)
