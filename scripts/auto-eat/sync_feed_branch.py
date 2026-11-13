#!/usr/bin/env python3
"""Safely connect a legacy, unrelated auto-eat feed history to current master.

The feed branch owns only public/interop/auto-eat/** and
scripts/auto-eat/STATUS.md. Its historical tree may contain a stale snapshot of
the rest of the repository. This migration composes current master plus those
feed-owned paths, then creates a two-parent commit (feed first, master second).
That preserves a normal fast-forward push to the feed branch without carrying
stale code or force-pushing.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Optional

OWNED_PREFIXES = ("public/interop/auto-eat/", "scripts/auto-eat/STATUS.md")
FEED_DIR = "public/interop/auto-eat"


class SyncError(RuntimeError):
    pass


def git(repo: Path, *args: str, env: Optional[dict] = None, input_data: Optional[bytes] = None) -> bytes:
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)
    p = subprocess.run(
        ["git", "-C", str(repo), *args],
        input=input_data,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=merged_env,
    )
    if p.returncode:
        raise SyncError(p.stderr.decode("utf-8", "replace").strip() or f"git {' '.join(args)} failed")
    return p.stdout


def text(repo: Path, *args: str) -> str:
    return git(repo, *args).decode("utf-8").strip()


def sync(repo: Path, branch: str, master_ref: str) -> str:
    root = Path(text(repo, "rev-parse", "--show-toplevel"))
    if root != repo.resolve():
        repo = root
    current = text(repo, "branch", "--show-current")
    if current != branch:
        raise SyncError(f"wrong checked-out branch: expected {branch}, got {current or 'detached'}")
    feed_head = text(repo, "rev-parse", "HEAD")
    branch_head = text(repo, "rev-parse", f"refs/heads/{branch}")
    master_head = text(repo, "rev-parse", master_ref)
    if feed_head != branch_head:
        raise SyncError("HEAD does not match the local feed branch ref")
    if git(repo, "status", "--porcelain"):
        raise SyncError("working tree/index must be clean before feed ancestry migration")
    if subprocess.run(
        ["git", "-C", str(repo), "merge-base", feed_head, master_head],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    ).returncode == 0:
        return f"ALREADY_RELATED branch={branch} master={master_head}"

    raw = git(repo, "ls-tree", "-r", "-z", "--full-tree", feed_head, "--", FEED_DIR, "scripts/auto-eat/STATUS.md")
    entries: list[tuple[str, str, str]] = []
    for record in raw.split(b"\0"):
        if not record:
            continue
        meta, path_b = record.split(b"\t", 1)
        mode_b, kind_b, oid_b = meta.split(b" ", 2)
        path = path_b.decode("utf-8")
        if kind_b != b"blob":
            raise SyncError(f"unexpected non-blob feed entry: {path}")
        if not any(path.startswith(prefix) for prefix in OWNED_PREFIXES):
            raise SyncError(f"feed entry outside owned paths: {path}")
        if any(ch in path for ch in (",", "\t", "\n", "\r")):
            raise SyncError(f"unsafe feed path: {path}")
        entries.append((mode_b.decode("ascii"), oid_b.decode("ascii"), path))
    required = {p for _, _, p in entries}
    if f"{FEED_DIR}/cards-compact.json" not in required or "scripts/auto-eat/STATUS.md" not in required:
        raise SyncError("feed snapshot is missing cards-compact.json or STATUS.md")
    if f"{FEED_DIR}/queue.jsonl" not in required:
        raise SyncError("feed snapshot is missing the frozen queue.jsonl")

    with tempfile.TemporaryDirectory(prefix="auto-eat-feed-index-") as tmp:
        index_path = str(Path(tmp) / "index")
        index_env = {"GIT_INDEX_FILE": index_path}
        git(repo, "read-tree", master_head, env=index_env)
        # Overlay the feed's actual entries over master. Do NOT remove
        # master-only EAT evidence files: other writers may have produced them
        # since the legacy feed diverged and this keeper does not own deletions.
        for mode, oid, path in entries:
            git(repo, "update-index", "--add", "--cacheinfo", f"{mode},{oid},{path}", env=index_env)
        tree = git(repo, "write-tree", env=index_env).decode("ascii").strip()

    changed = git(repo, "diff", "--name-only", master_head, tree).decode("utf-8").splitlines()
    unexpected = [p for p in changed if not any(p.startswith(prefix) for prefix in OWNED_PREFIXES)]
    if unexpected:
        raise SyncError(f"composed tree changes non-feed paths: {unexpected[:10]}")

    message = (
        "auto-eat: connect legacy feed history to master while preserving feed-owned state\n\n"
        "Tree = current master overlaid with only the actual feed entries under "
        "public/interop/auto-eat/** and scripts/auto-eat/STATUS.md. Master-only "
        "evidence is retained. Feed remains "
        "first parent so the update is a normal fast-forward; master is second parent."
    )
    commit = git(
        repo, "-c", "user.name=csoai-auto-eat",
        "-c", "user.email=board@csoai.org",
        "-c", "commit.gpgsign=false",
        "commit-tree", tree, "-p", feed_head, "-p", master_head, "-m", message,
    ).decode("ascii").strip()
    git(repo, "update-ref", f"refs/heads/{branch}", commit, feed_head)
    git(repo, "reset", "--hard", commit)
    if git(repo, "status", "--porcelain"):
        raise SyncError("working tree is not clean after migration reset")
    if text(repo, "rev-parse", f"{branch}^1") != feed_head:
        raise SyncError("feed branch is not first parent; fast-forward safety failed")
    if text(repo, "rev-parse", f"{branch}^2") != master_head:
        raise SyncError("current master is not second parent")
    return (
        f"SYNCED_UNRELATED_FEED branch={branch} commit={commit} "
        f"feed_parent={feed_head} master_parent={master_head} "
        f"preserved_entries={len(entries)} changed_paths={len(changed)}"
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--branch", required=True)
    ap.add_argument("--master", default="origin/master")
    args = ap.parse_args()
    try:
        repo = Path(text(Path.cwd(), "rev-parse", "--show-toplevel"))
        print(sync(repo, args.branch, args.master))
        return 0
    except SyncError as exc:
        print(f"feed ancestry sync REFUSED: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
