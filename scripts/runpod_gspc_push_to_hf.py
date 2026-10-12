#!/usr/bin/env python3
"""Copy unsigned pod evidence to private HF intake atomically.

Each commit contains whole run bundles (at most 300 files / 50 MiB). Local bytes
are frozen before any network write. Existing remote files must match those
bytes exactly, including when completing a previous partial upload. A commit is
guarded by the checked remote revision, so a concurrent writer forces a fresh
invocation instead of overwriting evidence. Current per-pod snapshots retain
producer gates and incomplete or held evidence; only their latest pointer can
change. This transports evidence, not admission, grades or signatures.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from concurrent.futures import ThreadPoolExecutor
import os
import re
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
MAX_VERIFY_WORKERS = 4


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
    latest: tuple[str, FrozenFile] | None = None
    source_versions: tuple[tuple[Path, tuple | None], ...] = ()


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


CURRENT_SCHEMA = "csoai.runpod-current-intake/0.1"
CURRENT_FILES = (*REQUIRED, "gate.json", "HUMAN_RELEASE.json")


def canonical_json(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode() + b"\n"


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def current_identity(relative: str) -> str:
    if not isinstance(relative, str):
        raise IntakeError("invalid current-run source identity")
    parts = relative.split("/")
    if (len(parts) != 6 or parts[1] != "gspc" or parts[4] != "runs"
            or any(not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*", part) for part in parts)):
        raise IntakeError("invalid current-run source identity")
    return digest(relative.encode())


def current_root_available(root: Path) -> bool:
    try:
        if root.is_symlink() or not root.is_dir():
            return False
        # Path.glob may silently skip permission errors. Prove that the configured
        # collection root can actually be listed before reporting its scope.
        with os.scandir(root) as entries:
            list(entries)
        return True
    except OSError:
        return False


def freeze_current_runs(root: Path, staging: Path) -> list[FrozenRun]:
    """Retain current evidence, including held/incomplete runs, with an atomic latest pointer.

    The source path identifies a run; timestamps never select its gate. A later
    missing or rejected gate must replace that run's pointer as well.
    """
    frozen = []
    if not current_root_available(root):
        raise IntakeError("current-run root cannot be listed safely")
    for index, directory in enumerate(sorted(root.glob("*/gspc/*/*/runs/*"))):
        relative = directory.relative_to(root).as_posix()
        identity = current_identity(relative)
        if (not directory.is_dir() or any(part.is_symlink() for part in (directory, *directory.parents) if part != root.parent)
                or not directory.resolve().is_relative_to(root.resolve())):
            raise IntakeError("unsafe current-run source directory")
        target = staging / f"current-{index}"
        target.mkdir()
        before = {name: (directory / name).lstat() if (directory / name).exists()
                  or (directory / name).is_symlink() else None for name in CURRENT_FILES}
        files, hashes = {}, {}
        for name, info in before.items():
            if info is None:
                continue
            if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1:
                raise IntakeError("unsafe current-run source file")
            destination = target / name
            with (directory / name).open("rb") as source, destination.open("xb") as sink:
                if file_version(os.fstat(source.fileno())) != file_version(info):
                    raise IntakeError("current run changed while snapshotting")
                shutil.copyfileobj(source, sink, CHUNK_BYTES)
                if file_version(os.fstat(source.fileno())) != file_version(info):
                    raise IntakeError("current run changed while snapshotting")
            files[name] = FrozenFile(destination, info.st_size)
            hashes[name] = digest(destination.read_bytes())
        for name, info in before.items():
            path = directory / name
            now = path.lstat() if path.exists() or path.is_symlink() else None
            if (now is None) != (info is None) or (info is not None and file_version(now) != file_version(info)):
                raise IntakeError("current run changed while snapshotting")
        manifest = {"schema": CURRENT_SCHEMA, "source_relative": relative, "files": hashes}
        snapshot = digest(canonical_json(manifest))
        destination = f"current-runs/snapshots/{identity}/{snapshot}/{directory.name}"
        manifest.update(snapshot_sha256=snapshot, snapshot_relative=destination)
        manifest_path = target / "source.json"
        manifest_path.write_bytes(canonical_json(manifest))
        metadata = FrozenFile(manifest_path, manifest_path.stat().st_size)
        files["source.json"] = metadata
        frozen.append(FrozenRun(destination, files, (f"current-runs/latest/{identity}.json", metadata),
                                tuple((directory / name, file_version(info) if info is not None else None)
                                      for name, info in before.items())))
    return frozen


def checked_current_snapshot(intake: Path, pointer: Path) -> tuple[dict, Path]:
    raw = pointer.read_bytes()
    manifest = json.loads(raw)
    if not isinstance(manifest, dict) or set(manifest) != {
            "schema", "source_relative", "files", "snapshot_sha256", "snapshot_relative"}:
        raise IntakeError("invalid current-run pointer")
    if canonical_json(manifest) != raw:
        raise IntakeError("current-run pointer is not canonical")
    identity = current_identity(manifest["source_relative"])
    hashes = manifest["files"]
    base = {key: manifest[key] for key in ("schema", "source_relative", "files")}
    snapshot = digest(canonical_json(base))
    expected = f"current-runs/snapshots/{identity}/{snapshot}/{manifest['source_relative'].split('/')[-1]}"
    if (manifest["schema"] != CURRENT_SCHEMA or pointer.name != identity + ".json"
            or manifest["snapshot_sha256"] != snapshot or manifest["snapshot_relative"] != expected
            or not isinstance(hashes, dict) or not set(hashes) <= set(CURRENT_FILES)
            or any(not isinstance(value, str) or not re.fullmatch(r"[0-9a-f]{64}", value) for value in hashes.values())):
        raise IntakeError("current-run pointer identity does not match snapshot")
    directory = intake / expected
    if directory.is_symlink() or not directory.resolve().is_relative_to(intake.resolve()):
        raise IntakeError("unsafe current-run snapshot")
    if {p.name for p in directory.iterdir()} != set(hashes) | {"source.json"}:
        raise IntakeError("current-run snapshot has missing or extra files")
    for name in (*hashes, "source.json"):
        path = directory / name
        info = path.lstat()
        if not stat.S_ISREG(info.st_mode) or path.is_symlink():
            raise IntakeError("unsafe current-run snapshot file")
        data = path.read_bytes()
        if (name == "source.json" and data != raw) or (name != "source.json" and digest(data) != hashes[name]):
            raise IntakeError("current-run snapshot byte mismatch")
    return manifest, directory


def current_gate(manifest: dict, directory: Path) -> tuple[bool, str, dict | None]:
    """Gate eligibility is separate from the unchanged independent verifier."""
    if any(name not in manifest["files"] or not (directory / name).stat().st_size for name in REQUIRED):
        return False, "INCOMPLETE", None
    try:
        gate = json.loads((directory / "gate.json").read_bytes())
        run = json.loads((directory / "run.json").read_bytes())
    except (OSError, ValueError):
        return False, "MISSING_OR_INVALID_GATE", None
    parts = manifest["source_relative"].split("/")
    if (not isinstance(gate, dict) or not isinstance(run, dict)
            or gate.get("schema") != "csoai.churn-gate/0.3"
            or gate.get("run_id") != run.get("run_id") or gate.get("run_id") != parts[-1]
            or gate.get("axis") != run.get("axis") or gate.get("axis") != parts[3]
            or gate.get("model") != run.get("model_transport")
            or gate.get("signed") is not False or gate.get("writes_board") is not False):
        return False, "UNRECOGNISED_OR_MISMATCHED_GATE", gate
    if any(key in gate and type(gate[key]) is not bool for key in ("human_hold", "human_released")):
        return False, "UNRECOGNISED_OR_MISMATCHED_GATE", gate
    # Exact-label gates carry instrument_sha256; variant gates carry instrument_hash.
    # Compare the identities the producer actually supplies without inventing fields.
    if (not any(key in gate for key in ("instrument_sha256", "instrument_hash"))
            or any(key in gate and gate[key] != run.get(key) for key in ("instrument_sha256", "instrument_hash"))
            or type(gate.get("complete")) is not bool or gate.get("complete") != run.get("complete")
            or ("num_parallel" in gate and (type(gate["num_parallel"]) is not int
                                            or gate["num_parallel"] != run.get("num_parallel")))):
        return False, "UNRECOGNISED_OR_MISMATCHED_GATE", gate
    if gate.get("gate") != "CARD_CANDIDATE_UNSIGNED" or gate.get("stands") is not True:
        return False, "HELD_OR_REJECTED", gate
    if gate.get("human_hold") and (gate.get("human_released") is not True or "HUMAN_RELEASE.json" not in manifest["files"]):
        return False, "HUMAN_HOLD", gate
    return True, "CANDIDATE_UNSIGNED", gate


def review_current_runs(intake: Path, provenance: Path) -> None:
    """Validate the pinned latest snapshots for review, never for signing/staging.

    The owner bridge does not yet consume producer holds. Even a matching
    candidate gate is therefore explicitly blocked from the legacy intake.
    """
    if provenance.exists():
        raise IntakeError("current-run review destination must be fresh")
    provenance.mkdir(parents=True)
    decisions = []
    for pointer in sorted((intake / "current-runs/latest").glob("*.json")):
        if pointer.is_symlink():
            raise IntakeError("unsafe current-run pointer")
        manifest, directory = checked_current_snapshot(intake, pointer)
        candidate, reason, _ = current_gate(manifest, directory)
        decisions.append({"source_identity_sha256": pointer.stem,
                          "snapshot_sha256": manifest["snapshot_sha256"],
                          "producer_state": reason,
                          "signing_staging": "BLOCKED_OWNER_PRODUCER_HOLD_INTEGRATION"})
    receipt = {"schema": CURRENT_SCHEMA, "state": "REVIEWED_TRANSPORT_ONLY",
               "signing_staging": "BLOCKED_OWNER_PRODUCER_HOLD_INTEGRATION",
               "counts": {"latest_snapshots": len(decisions),
                          "matching_producer_candidates": sum(d["producer_state"] == "CANDIDATE_UNSIGNED" for d in decisions)},
               "decisions": decisions}
    (provenance / "decisions.json").write_bytes(canonical_json(receipt))
    print(f"current-intake: retained snapshots {len(decisions)}; signing/staging BLOCKED pending owner producer-hold integration")


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


def credential_sources(token_file: Path | None = None) -> list[tuple[str, str]]:
    if token_file is not None:
        # Scheduled jobs use one explicitly provisioned, private credential.
        # Never substitute an account-wide environment/cache token if it fails.
        descriptor = None
        try:
            descriptor = os.open(token_file, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
            info = os.fstat(descriptor)
            if (not stat.S_ISREG(info.st_mode) or info.st_uid != os.geteuid()
                    or stat.S_IMODE(info.st_mode) & 0o077 or not 1 <= info.st_size <= 4096):
                raise IntakeError("intake credential file must be owner-only, regular and nonempty")
            with os.fdopen(descriptor, "rb") as handle:
                descriptor = None
                raw = handle.read(4097)
            if len(raw) > 4096:
                raise IntakeError("intake credential file exceeds the size limit")
            token = raw.decode("ascii").strip()
            if not re.fullmatch(r"hf_[A-Za-z0-9]{16,200}", token):
                raise IntakeError("intake credential file has an invalid token format")
            return [("explicit private-intake credential file", token)]
        except IntakeError:
            raise
        except (OSError, UnicodeError):
            raise IntakeError("explicit intake credential file could not be read; no fallback used") from None
        finally:
            if descriptor is not None:
                os.close(descriptor)
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


def connect(repo: str, api_class: Any, token_file: Path | None = None) -> tuple[Any, str, set[str]]:
    # Prove credentials against the actual private repo. Never print exception
    # text: SDK errors may contain headers, URLs, or credentials.
    tried = []
    for name, token in credential_sources(token_file):
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


def verify_upstream_bytes(
    api: Any, repo: str, revision: str, checks: list[tuple[str, FrozenFile]],
) -> None:
    """Byte-compare every upstream file at one immutable revision before writes.

    Four downloads at most run together; each batch must finish successfully
    before another starts. Errors and conflicts fail closed before any commit.
    """
    def check(item: tuple[str, FrozenFile]) -> None:
        key, local = item
        remote = api.hf_hub_download(
            repo_id=repo, repo_type="dataset", filename=key, revision=revision,
        )
        if not equal_bytes(local.path, Path(remote)):
            raise IntakeError(f"upstream byte conflict: {key}; no upload performed")

    with ThreadPoolExecutor(max_workers=MAX_VERIFY_WORKERS) as pool:
        for start in range(0, len(checks), MAX_VERIFY_WORKERS):
            futures = [pool.submit(check, item)
                       for item in checks[start:start + MAX_VERIFY_WORKERS]]
            for future in futures:
                future.result()


def push_runs(
    api: Any, repo: str, revision: str, upstream: set[str], runs: list[FrozenRun],
    operation_class: Any, *, dry_run: bool = False,
) -> tuple[int, int]:
    """Preflight every conflict before committing any bounded, complete bundles."""
    planned: list[list[tuple[str, FrozenFile]]] = []
    upstream_checks: list[tuple[str, FrozenFile]] = []
    skipped = 0
    for run in runs:
        missing = []
        for name in run.files:
            key = f"{run.relative}/{name}"
            local = run.files[name]
            if key in upstream:
                upstream_checks.append((key, local))
            else:
                missing.append((key, local))
        if run.latest is not None:
            key, local = run.latest
            same = key in upstream and equal_bytes(local.path, Path(api.hf_hub_download(
                repo_id=repo, repo_type="dataset", filename=key, revision=revision)))
            if not same:
                # This sole mutable pointer and its whole immutable snapshot share a CAS commit.
                missing.append((key, local))
        if missing:
            if sum(file.size for _, file in missing) > MAX_COMMIT_BYTES:
                raise IntakeError(f"run exceeds the atomic commit byte limit: {run.relative}")
            planned.append(missing)
        else:
            skipped += 1

    verify_upstream_bytes(api, repo, revision, upstream_checks)

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

    unit = "closed bundles" if any(run.latest is not None for run in runs) else "complete runs"
    for batch in batches:
        files = [(key, file) for bundle in batch for key, file in bundle]
        if dry_run:
            print(f"WOULD COMMIT {len(batch)} {unit} / {len(files)} new files")
            continue
        # A latest pointer must not outlive a newer local hold while network checks run.
        for run in runs:
            for path, version in run.source_versions:
                now = path.lstat() if path.exists() or path.is_symlink() else None
                if (file_version(now) if now is not None else None) != version:
                    raise IntakeError("current run changed after snapshot; no stale pointer update")
        # Recheck privacy before each write; CAS closes the head-check/write race.
        if private_head(api, repo) != revision:
            raise IntakeError("upstream changed since preflight; rerun to compare the new bytes")
        result = api.create_commit(
            repo_id=repo, repo_type="dataset", revision="main", parent_commit=revision,
            create_pr=False,
            operations=[operation_class(path_in_repo=key, path_or_fileobj=str(file.path))
                        for key, file in files],
            commit_message=f"pod intake: {len(batch)} closed evidence bundles",
        )
        if not isinstance(result.oid, str) or not result.oid:
            raise IntakeError("commit response has no revision; verify upstream before retrying")
        revision = result.oid
        print(f"COMMITTED {len(batch)} {unit} / {len(files)} new files")
    return len(planned), skipped


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="/workspace/gspc-24x7")
    ap.add_argument("--current-root", type=Path, help="also retain current per-pod GSPC runs and gates")
    ap.add_argument("--review-current", type=Path, help="offline: validate pinned latest source/gate snapshots")
    ap.add_argument("--review-out", type=Path)
    ap.add_argument("--repo", default=REPO)
    ap.add_argument("--token-file", type=Path,
                    help="use only this owner-only private-intake credential; never fall back")
    ap.add_argument("--dry-run", action="store_true", help="compare and list commits; never upload")
    args = ap.parse_args()
    if args.review_current is not None:
        review_was_present = args.review_out is not None and args.review_out.exists()
        try:
            if args.review_out is None:
                raise IntakeError("offline review requires its explicit destination")
            review_current_runs(args.review_current, args.review_out)
            return 0
        except (IntakeError, OSError, ValueError, TypeError) as error:
            if args.review_out is not None and not review_was_present:
                args.review_out.mkdir(parents=True, exist_ok=True)
                receipt = {"schema": CURRENT_SCHEMA, "state": "UNCHECKABLE",
                           "reason": "SOURCE_METADATA_UNCHECKABLE",
                           "signing_staging": "BLOCKED_OWNER_PRODUCER_HOLD_INTEGRATION",
                           "counts": None, "decisions": []}
                (args.review_out / "decisions.json").write_bytes(canonical_json(receipt))
            print(f"UNCHECKABLE: current-run source metadata could not be checked ({type(error).__name__})", file=sys.stderr)
            return 2
    root = Path(args.root).absolute()
    current_available = args.current_root is not None and current_root_available(args.current_root)
    if args.current_root is not None:
        print("current-collection: " + ("AVAILABLE" if current_available else "UNAVAILABLE"))
    if not root.is_dir() and not current_available:
        print("UNCHECKABLE: intake root is not a directory", file=sys.stderr)
        return 2
    try:
        from huggingface_hub import CommitOperationAdd, HfApi
    except ImportError:
        print("UNCHECKABLE: huggingface_hub is not installed", file=sys.stderr)
        return 2
    try:
        runs = complete_runs(root) if root.is_dir() else []
        partial = len(list(root.rglob("card-unsigned.json"))) - len(runs)
        if not runs and args.current_root is None:
            print(f"nothing complete to push ({partial} partial)")
            return 0
        with tempfile.TemporaryDirectory(prefix="runpod-intake-") as temporary:
            # Pin the remote head BEFORE observing current source. A delayed older
            # invocation cannot adopt a newer writer's head and rewind its pointer.
            api, revision, upstream = connect(args.repo, HfApi, args.token_file)
            frozen = freeze_runs(root, runs, Path(temporary))
            if current_available:
                frozen.extend(freeze_current_runs(args.current_root.absolute(), Path(temporary)))
            if not frozen:
                print(f"nothing complete to push ({partial} partial)")
                return 0
            pushed, skipped = push_runs(
                api, args.repo, revision, upstream, frozen, CommitOperationAdd,
                dry_run=args.dry_run,
            )
        print(
            f"pod-push: closed bundles {len(frozen)} · {'planned' if args.dry_run else 'pushed'} {pushed} · "
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
