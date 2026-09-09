#!/usr/bin/env python3
"""Copy complete unsigned pod runs to private HF intake, additively and atomically.

Each commit contains whole run bundles (at most 300 files / 50 MiB). Local bytes
are frozen before any network write. Existing remote files must match those
bytes exactly, including when completing a previous partial upload. A commit is
guarded by the checked remote revision, so a concurrent writer forces a fresh
invocation instead of overwriting evidence. This copies candidates, not grades
or signatures; the separate intake verifier still decides admission.
"""
from __future__ import annotations

import argparse
import os
import stat
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

REPO = "csoai/runpod-gspc-intake"
REQUIRED = ("card-unsigned.json", "items.jsonl", "run.json")
MAX_COMMIT_FILES = 300
MAX_COMMIT_BYTES = 50 * 1024 * 1024
CHUNK_BYTES = 1024 * 1024


class IntakeError(Exception):
    """An actionable message composed locally, without remote exception text."""


@dataclass(frozen=True)
class FrozenFile:
    path: Path
    size: int


@dataclass(frozen=True)
class FrozenRun:
    relative: str
    files: dict[str, FrozenFile]


def complete_runs(root: Path) -> list[Path]:
    """Find nonempty triples. Snapshotting also checks for in-flight writes."""
    out = []
    for card in sorted(root.rglob("card-unsigned.json")):
        directory = card.parent
        if all((directory / name).is_file() and (directory / name).stat().st_size > 0
               for name in REQUIRED):
            out.append(directory)
    return out


def file_version(info: os.stat_result) -> tuple[int, int, int, int, int]:
    return (info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns, info.st_ctime_ns)


def freeze_runs(root: Path, runs: list[Path], staging: Path) -> list[FrozenRun]:
    """Read each triple once into private staging; never upload live worker paths."""
    frozen = []
    for index, directory in enumerate(runs):
        relative = directory.relative_to(root.parent).as_posix()
        if not directory.resolve().is_relative_to(root.resolve()):
            raise IntakeError(f"run escapes the intake root: {relative}")
        before = {name: (directory / name).lstat() for name in REQUIRED}
        if any(not stat.S_ISREG(info.st_mode) or info.st_size <= 0
               for info in before.values()):
            raise IntakeError(f"run contains an empty or nonregular file: {relative}")
        target = staging / str(index)
        target.mkdir()
        files = {}
        for name in REQUIRED:
            destination = target / name
            with (directory / name).open("rb") as source, destination.open("wb") as sink:
                if file_version(os.fstat(source.fileno())) != file_version(before[name]):
                    raise IntakeError(f"run changed while snapshotting: {relative}")
                while chunk := source.read(CHUNK_BYTES):
                    sink.write(chunk)
                if file_version(os.fstat(source.fileno())) != file_version(before[name]):
                    raise IntakeError(f"run changed while snapshotting: {relative}")
            files[name] = FrozenFile(destination, destination.stat().st_size)
        if any(file_version((directory / name).lstat()) != file_version(before[name])
               for name in REQUIRED):
            raise IntakeError(f"run changed while snapshotting: {relative}")
        frozen.append(FrozenRun(relative, files))
    return frozen


def equal_bytes(left: Path, right: Path) -> bool:
    """Compare content, not file names, cached metadata, or claimed digests."""
    with left.open("rb") as a, right.open("rb") as b:
        while True:
            chunk_a, chunk_b = a.read(CHUNK_BYTES), b.read(CHUNK_BYTES)
            if chunk_a != chunk_b:
                return False
            if not chunk_a:
                return True


def private_head(api: Any, repo: str) -> str:
    info = api.repo_info(repo_id=repo, repo_type="dataset", revision="main")
    if info.private is not True:
        raise IntakeError("destination dataset is not private; stopped before the next write")
    if not isinstance(info.sha, str) or not info.sha:
        raise IntakeError("destination has no immutable revision; stopped before the next write")
    return info.sha


def credential_sources() -> list[tuple[str, str]]:
    sources = [
        ("HF_TOKEN", (os.environ.get("HF_TOKEN") or "").strip()),
        ("HUGGINGFACE_TOKEN", (os.environ.get("HUGGINGFACE_TOKEN") or "").strip()),
    ]
    cached = Path.home() / ".cache" / "huggingface" / "token"
    try:
        sources.append(("cached Hugging Face token", cached.read_text(encoding="utf-8").strip()))
    except OSError:
        pass
    return sources


def connect(repo: str, api_class: Any) -> tuple[Any, str, set[str]]:
    # Prove credentials against the actual private repo. Never print exception
    # text: SDK errors may contain headers, URLs, or credentials.
    tried = []
    for name, token in credential_sources():
        if not token:
            tried.append(f"{name}: empty/unset")
            continue
        try:
            candidate = api_class(token=token)
            revision = private_head(candidate, repo)
            upstream = set(candidate.list_repo_files(
                repo_id=repo, repo_type="dataset", revision=revision,
            ))
        except IntakeError:
            raise
        except Exception:  # noqa: BLE001 - credential fallback, sanitized below
            tried.append(f"{name}: repo access failed")
            continue
        print(f"auth: {name} can read private intake ({len(upstream)} files upstream)")
        return candidate, revision, upstream
    raise IntakeError("no credential could read the private intake. " + "; ".join(tried))


def push_runs(
    api: Any, repo: str, revision: str, upstream: set[str], runs: list[FrozenRun],
    operation_class: Any, *, dry_run: bool = False,
) -> tuple[int, int]:
    """Preflight every conflict before committing any bounded, complete bundles."""
    planned: list[list[tuple[str, FrozenFile]]] = []
    skipped = 0
    for run in runs:
        missing = []
        for name in REQUIRED:
            key = f"{run.relative}/{name}"
            local = run.files[name]
            if key in upstream:
                remote = api.hf_hub_download(
                    repo_id=repo, repo_type="dataset", filename=key, revision=revision,
                )
                if not equal_bytes(local.path, Path(remote)):
                    raise IntakeError(f"upstream byte conflict: {key}; no upload performed")
            else:
                missing.append((key, local))
        if missing:
            if sum(file.size for _, file in missing) > MAX_COMMIT_BYTES:
                raise IntakeError(f"run exceeds the atomic commit byte limit: {run.relative}")
            planned.append(missing)
        else:
            skipped += 1

    batches: list[list[list[tuple[str, FrozenFile]]]] = []
    batch: list[list[tuple[str, FrozenFile]]] = []
    count = size = 0
    for bundle in planned:
        bundle_size = sum(file.size for _, file in bundle)
        if batch and (count + len(bundle) > MAX_COMMIT_FILES or size + bundle_size > MAX_COMMIT_BYTES):
            batches.append(batch)
            batch, count, size = [], 0, 0
        batch.append(bundle)
        count += len(bundle)
        size += bundle_size
    if batch:
        batches.append(batch)

    for batch in batches:
        files = [(key, file) for bundle in batch for key, file in bundle]
        if dry_run:
            print(f"WOULD COMMIT {len(batch)} complete runs / {len(files)} new files")
            continue
        # Recheck privacy before each write; CAS closes the head-check/write race.
        if private_head(api, repo) != revision:
            raise IntakeError("upstream changed since preflight; rerun to compare the new bytes")
        result = api.create_commit(
            repo_id=repo, repo_type="dataset", revision="main", parent_commit=revision,
            create_pr=False,
            operations=[operation_class(path_in_repo=key, path_or_fileobj=str(file.path))
                        for key, file in files],
            commit_message=f"pod intake: {len(batch)} complete unsigned runs",
        )
        if not isinstance(result.oid, str) or not result.oid:
            raise IntakeError("commit response has no revision; verify upstream before retrying")
        revision = result.oid
        print(f"COMMITTED {len(batch)} complete runs / {len(files)} new files")
    return len(planned), skipped


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="/workspace/gspc-24x7")
    ap.add_argument("--repo", default=REPO)
    ap.add_argument("--dry-run", action="store_true", help="compare and list commits; never upload")
    args = ap.parse_args()
    root = Path(args.root).absolute()
    if not root.is_dir():
        print("UNCHECKABLE: intake root is not a directory", file=sys.stderr)
        return 2
    try:
        from huggingface_hub import CommitOperationAdd, HfApi
    except ImportError:
        print("UNCHECKABLE: huggingface_hub is not installed", file=sys.stderr)
        return 2
    try:
        runs = complete_runs(root)
        partial = len(list(root.rglob("card-unsigned.json"))) - len(runs)
        if not runs:
            print(f"nothing complete to push ({partial} partial)")
            return 0
        with tempfile.TemporaryDirectory(prefix="runpod-intake-") as temporary:
            frozen = freeze_runs(root, runs, Path(temporary))
            api, revision, upstream = connect(args.repo, HfApi)
            pushed, skipped = push_runs(
                api, args.repo, revision, upstream, frozen, CommitOperationAdd,
                dry_run=args.dry_run,
            )
        print(
            f"pod-push: complete runs {len(runs)} · {'planned' if args.dry_run else 'pushed'} {pushed} · "
            f"already upstream {skipped} · partial skipped {partial}"
            + (" · DRY RUN" if args.dry_run else "")
        )
        return 0
    except IntakeError as error:
        print(f"UNCHECKABLE: {error}", file=sys.stderr)
    except Exception:  # noqa: BLE001 - fail closed without leaking SDK response data
        print("UNCHECKABLE: snapshot or Hub operation failed; no automatic retry. "
              "Recheck access and upstream state before rerunning.", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
