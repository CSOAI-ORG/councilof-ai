#!/usr/bin/env python3
"""Fail-closed, bounded fetching of the authenticated HF mill staging snapshot.

Downloads are data, never executable code. Missing/private/inaccessible repos fail;
HTTP 404 is never misreported as an empty set of measurement cards.
"""
from __future__ import annotations

import os
import shutil
import time
from pathlib import Path
from typing import Callable

RETRY_HTTP_STATUSES = frozenset({408, 425, 429, 499, 500, 502, 503, 504})


def status_code(exc: Exception) -> int | None:
    value = getattr(getattr(exc, "response", None), "status_code", None)
    return value if isinstance(value, int) else None


def is_transient(exc: Exception) -> bool:
    status = status_code(exc)
    if status is not None:
        return status in RETRY_HTTP_STATUSES
    if isinstance(exc, (TimeoutError, ConnectionError)):
        return True
    try:
        import httpx
    except ImportError:
        return False
    return isinstance(exc, httpx.TransportError)


def fetch_snapshot(
    fetch: Callable,
    *,
    repo_id: str,
    token: str,
    attempts: int = 4,
    sleep: Callable[[float], None] = time.sleep,
) -> Path:
    if not token:
        raise ValueError("HF_TOKEN is required for the private mill staging dataset")
    if attempts < 1:
        raise ValueError("attempts must be positive")
    for index in range(attempts):
        try:
            return Path(fetch(
                repo_id=repo_id,
                repo_type="dataset",
                token=token,
                max_workers=4,
                etag_timeout=20,
            ))
        except Exception as exc:
            if not is_transient(exc) or index == attempts - 1:
                raise
            delay = min(3 * (3 ** index), 27)
            # Never print the exception message: CDN URLs or auth context may be sensitive.
            kind = f"HTTP {status_code(exc)}" if status_code(exc) is not None else type(exc).__name__
            print(
                f"HF staging snapshot transient {kind}; attempt {index + 1}/{attempts}, "
                f"retrying in {delay}s",
                flush=True,
            )
            sleep(delay)
    raise AssertionError("unreachable")


def stage_snapshot(source: Path, destination: Path) -> tuple[int, int]:
    source = source.resolve(strict=True)
    if not source.is_dir():
        raise ValueError("HF snapshot path is not a directory")
    destination.mkdir(parents=True, exist_ok=True)
    # Hugging Face snapshot cache symlinks into a sibling content-addressed
    # "blobs" directory. Allow ONLY that cache, not arbitrary host files.
    blob_root = (source.parents[1] / "blobs").resolve() if source.parent.name == "snapshots" else None
    cards = evidence = 0
    for file in sorted(source.rglob("*")):
        if file.is_symlink():
            resolved = file.resolve(strict=True)
            if blob_root is None or not resolved.is_relative_to(blob_root) or not resolved.is_file():
                raise ValueError("Snapshot symlink leaves the verified Hugging Face blob cache")
        if not file.is_file():
            continue
        relative = file.relative_to(source)
        if ".git" in relative.parts or file.name == ".gitattributes":
            continue
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(file, target)
        if file.name.startswith("unsigned-"):
            cards += 1
        elif file.name.startswith("items-"):
            evidence += 1
    return cards, evidence


def main() -> int:
    token = os.environ.get("HF_TOKEN", "")
    if not token:
        raise SystemExit("HF_TOKEN absent — cannot authenticate to private mill staging; not zero cards")
    from huggingface_hub import snapshot_download

    source = fetch_snapshot(snapshot_download, repo_id="csoai/mill-jobs-staging", token=token)
    cards, evidence = stage_snapshot(source, Path("staged"))
    print(f"pulled {cards} staged card(s) and {evidence} evidence bundle(s) from authenticated staging")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
