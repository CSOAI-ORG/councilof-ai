#!/usr/bin/env python3
"""Materialize paid Ollama commissions as pinned RunPod worker jobs.

This is a routing adapter, not a grader.  It consumes the public commission
feed, admits only models that the local Ollama daemon reports as installed,
and reuses ``generate_runpod_gspc_playlist.py`` to bind the exact model
manifest and frozen bank bytes.  It never downloads a model, signs a card,
settles a payment, or overwrites an existing job.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from typing import Any
from datetime import datetime, timezone

import generate_runpod_gspc_playlist as playlist


SCHEMA = "csoai.runpod-commission-dispatch/0.1"
WORKER_SCHEMA = "csoai.runpod-gspc-worker/0.1"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _commission_cells(feed: dict[str, Any]) -> tuple[list[dict[str, str]], list[dict[str, Any]]]:
    schema = feed.get("schema")
    if schema == "csoai.commission-queue/0.1":
        records = feed.get("rows")
    elif schema in {"csoai.commissions/0.1", "csoai.commissions/0.2"}:
        records = feed.get("commissions")
    else:
        records = None
    if (
        feed.get("status") != "MEASURED"
        or feed.get("records_unreadable") != 0
        or not isinstance(records, list)
    ):
        raise playlist.GenerationError("commission feed unavailable or unreadable")

    known_axes = {axis for axis, _ in playlist.AXES}
    cells: dict[tuple[str, str], dict[str, str]] = {}
    refused: list[dict[str, Any]] = []
    for record in records:
        if not isinstance(record, dict):
            raise playlist.GenerationError("invalid commission record")
        subject = record.get("subject")
        model = record.get("model")
        fulfillment = record.get("fulfillment")
        receipt = record.get("receipt_sha")
        axis = record.get("axis")
        if not isinstance(subject, str) or not subject.strip() or "\n" in subject or "\r" in subject:
            raise playlist.GenerationError("invalid commission subject")
        if not isinstance(receipt, str) or len(receipt) != 64 or any(c not in "0123456789abcdef" for c in receipt):
            raise playlist.GenerationError("invalid commission receipt sha")
        if schema == "csoai.commission-queue/0.1" and (
            record.get("status") != "QUEUED" or fulfillment != "QUEUED"
        ):
            continue
        if fulfillment == "UNFULFILLABLE":
            refused.append({"receipt_sha": receipt, "subject": subject, "axis": axis, "reason": "UNFULFILLABLE"})
            continue
        if fulfillment == "RETRIEVABLE":
            continue
        if fulfillment not in (None, "QUEUED"):
            raise playlist.GenerationError("invalid commission fulfillment")
        mill_subject = model.strip() if isinstance(model, str) and model.strip() else subject.strip()
        if "\n" in mill_subject or "\r" in mill_subject:
            raise playlist.GenerationError("invalid commission model")
        if axis is not None and axis not in known_axes:
            refused.append({"receipt_sha": receipt, "subject": subject, "axis": axis, "reason": "UNSUPPORTED_AXIS"})
            continue
        requested_axes = [axis] if axis else sorted(known_axes)
        for requested_axis in requested_axes:
            key = (mill_subject, requested_axis)
            cells.setdefault(
                key,
                {"subject": mill_subject, "axis": requested_axis, "first_receipt_sha": receipt},
            )
    return [cells[key] for key in sorted(cells)], refused


def build_dispatch(
    feed: dict[str, Any],
    args: argparse.Namespace,
    installed: dict[str, str] | None = None,
) -> tuple[list[tuple[Path, bytes]], dict[str, Any]]:
    cells, refused = _commission_cells(feed)
    installed = installed if installed is not None else playlist.ollama_digests(args.ollama_url)
    installed_subjects = sorted({cell["subject"] for cell in cells if cell["subject"] in installed})
    for subject in sorted({cell["subject"] for cell in cells} - set(installed_subjects)):
        receipts = sorted({cell["first_receipt_sha"] for cell in cells if cell["subject"] == subject})
        refused.append({"receipt_sha": receipts[0], "subject": subject, "axis": None, "reason": "MODEL_NOT_INSTALLED"})

    generated: dict[tuple[str, str], dict[str, Any]] = {}
    if installed_subjects:
        generation_args = argparse.Namespace(**vars(args))
        generation_args.models = installed_subjects
        for _path, config in playlist.build_configs(generation_args, installed):
            generated[(config["model"], config["axis"])] = config

    writes: list[tuple[Path, bytes]] = []
    admitted: list[dict[str, Any]] = []
    for cell in cells:
        key = (cell["subject"], cell["axis"])
        config = generated.get(key)
        if config is None:
            continue
        identity = hashlib.sha256(f"{key[0]}\0{key[1]}".encode()).hexdigest()[:20]
        path = args.jobs_dir / f"commission-{identity}.json"
        payload = playlist.canonical_bytes(config) + b"\n"
        admitted.append({**cell, "job": path.name, "config_sha256": hashlib.sha256(payload).hexdigest()})
        writes.append((path, payload))

    report = {
        "schema": SCHEMA,
        "admitted": admitted,
        "refused": sorted(refused, key=lambda row: (str(row.get("subject")), str(row.get("axis")))),
        "meaning": "Routing only. A job is not a run, measurement, signature, root inclusion or delivery.",
    }
    return writes, report


def _pid_running(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return True
    return True


def resolve_jobs_dir(worker_state_dir: Path | None, fallback: Path | None) -> tuple[str, Path]:
    """The directory the running --forever worker actually scans.

    First choice is the worker's own private state (health.json config_dir), accepted
    only while the pid it recorded is alive and still holds worker.lock. The explicit
    fallback is used only when that does not resolve. Neither resolving is a HALT:
    a job written anywhere else is a job no worker reads (2026-09-14: the loop
    defaulted to jobs-21ff8f50 while the worker scanned jobs-091a616a).
    """
    reasons: list[str] = []
    if worker_state_dir is not None:
        state: Any = None
        try:
            state = json.loads((worker_state_dir / "health.json").read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError, json.JSONDecodeError):
            reasons.append("worker state unreadable")
        if state is not None:
            config_dir = state.get("config_dir") if isinstance(state, dict) else None
            pid = state.get("pid") if isinstance(state, dict) else None
            lock_pid: int | None = None
            try:
                lock_pid = int((worker_state_dir / "worker.lock").read_text(encoding="utf-8").strip())
            except (OSError, UnicodeDecodeError, ValueError):
                lock_pid = None
            if not isinstance(state, dict) or state.get("schema") != WORKER_SCHEMA:
                reasons.append("worker state has an unexpected schema")
            elif not isinstance(config_dir, str) or not config_dir:
                reasons.append("worker state records no config_dir (worker predates it or runs --config)")
            elif isinstance(pid, bool) or not isinstance(pid, int) or pid <= 0 or not _pid_running(pid):
                reasons.append("worker state pid is not running")
            elif lock_pid != pid:
                reasons.append("worker.lock is held by a different pid than the state records")
            else:
                candidate = Path(config_dir)
                if candidate.is_absolute() and not candidate.is_symlink() and candidate.is_dir():
                    return "worker-state", candidate
                reasons.append("worker config_dir is not an existing directory")
    if fallback is not None:
        if fallback.is_absolute() and not fallback.is_symlink() and fallback.is_dir():
            return "explicit", fallback
        reasons.append("explicit jobs dir is not an existing absolute directory")
    if not reasons:
        reasons.append("no worker state dir and no explicit jobs dir")
    raise playlist.GenerationError("worker jobs directory unresolved: " + "; ".join(reasons))


def materialize(writes: list[tuple[Path, bytes]]) -> tuple[int, int]:
    created = existing = 0
    for path, payload in writes:
        if path.exists():
            if path.is_symlink() or not path.is_file() or path.read_bytes() != payload:
                raise playlist.GenerationError(f"existing commission job conflicts: {path.name}")
            existing += 1
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        created += 1
    return created, existing


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    result.add_argument("--input", type=Path)
    result.add_argument("--bank-dir", type=Path)
    result.add_argument("--workspace-root", type=Path, default=Path("/workspace"))
    result.add_argument("--model-manifest-root", type=Path)
    result.add_argument(
        "--worker-state-dir",
        type=Path,
        help="the running worker's --state-dir; its config_dir is the jobs directory",
    )
    result.add_argument(
        "--jobs-dir",
        type=Path,
        help="explicit jobs directory; with --worker-state-dir it is only the fallback",
    )
    result.add_argument(
        "--resolve-jobs-dir",
        action="store_true",
        help="print '<source>\\t<jobs dir>' and exit; HALT (rc 2) when unresolved",
    )
    result.add_argument("--output-root", type=Path)
    result.add_argument("--ollama-url", default="http://127.0.0.1:11434")
    result.add_argument("--interval-seconds", type=int, default=86_400)
    result.add_argument("--disk-low-water-bytes", type=int, default=4 * 1024**3)
    result.add_argument("--request-timeout-seconds", type=int, default=180)
    result.add_argument("--max-tokens", type=int, default=64)
    result.add_argument("--report", type=Path)
    result.add_argument("--source-revision")
    result.add_argument("--dry-run", action="store_true")
    return result


def main(argv: list[str] | None = None) -> int:
    cli = parser()
    args = cli.parse_args(argv)
    if args.resolve_jobs_dir:
        try:
            source, jobs_dir = resolve_jobs_dir(args.worker_state_dir, args.jobs_dir)
        except playlist.GenerationError as error:
            print(f"HALT: {error}")
            return 2
        print(f"{source}\t{jobs_dir}")
        return 0
    missing = [
        flag
        for flag, value in (
            ("--input", args.input),
            ("--bank-dir", args.bank_dir),
            ("--model-manifest-root", args.model_manifest_root),
            ("--output-root", args.output_root),
        )
        if value is None
    ]
    if args.worker_state_dir is None and args.jobs_dir is None:
        missing.append("--jobs-dir or --worker-state-dir")
    if missing:
        cli.error("the following arguments are required: " + ", ".join(missing))
    try:
        if args.worker_state_dir is not None:
            _source, args.jobs_dir = resolve_jobs_dir(args.worker_state_dir, args.jobs_dir)
        revision = None
        if args.source_revision:
            revision = args.source_revision.strip().lower()
            if len(revision) != 40 or any(c not in "0123456789abcdef" for c in revision):
                raise playlist.GenerationError("source revision must be a 40-character git SHA")
        feed = json.loads(args.input.read_text(encoding="utf-8"))
        writes, report = build_dispatch(feed, args)
        created, existing = (0, 0) if args.dry_run else materialize(writes)
    except (OSError, json.JSONDecodeError, playlist.GenerationError) as error:
        print(f"HALT: {error}")
        return 2
    report["created"] = created
    report["already_present"] = existing
    report["dry_run"] = args.dry_run
    report["queue_schema"] = feed.get("schema")
    report["last_run"] = utc_now()
    if revision:
        report["source_revision"] = revision
    output = json.dumps(report, indent=2, sort_keys=True) + "\n"
    if args.report:
        args.report.write_text(output, encoding="utf-8")
    print(output, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
