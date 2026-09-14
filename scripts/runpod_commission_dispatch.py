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

import generate_runpod_gspc_playlist as playlist


SCHEMA = "csoai.runpod-commission-dispatch/0.1"


def _commission_cells(feed: dict[str, Any]) -> tuple[list[dict[str, str]], list[dict[str, Any]]]:
    if (
        feed.get("schema") not in {"csoai.commissions/0.1", "csoai.commissions/0.2"}
        or feed.get("status") != "MEASURED"
        or feed.get("records_unreadable") != 0
        or not isinstance(feed.get("commissions"), list)
    ):
        raise playlist.GenerationError("commission feed unavailable or unreadable")

    known_axes = {axis for axis, _ in playlist.AXES}
    cells: dict[tuple[str, str], dict[str, str]] = {}
    refused: list[dict[str, Any]] = []
    for record in feed["commissions"]:
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
        if fulfillment == "UNFULFILLABLE":
            refused.append({"receipt_sha": receipt, "subject": subject, "axis": axis, "reason": "UNFULFILLABLE"})
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
    result.add_argument("--input", type=Path, required=True)
    result.add_argument("--bank-dir", type=Path, required=True)
    result.add_argument("--workspace-root", type=Path, default=Path("/workspace"))
    result.add_argument("--model-manifest-root", type=Path, required=True)
    result.add_argument("--jobs-dir", type=Path, required=True)
    result.add_argument("--output-root", type=Path, required=True)
    result.add_argument("--ollama-url", default="http://127.0.0.1:11434")
    result.add_argument("--interval-seconds", type=int, default=86_400)
    result.add_argument("--disk-low-water-bytes", type=int, default=4 * 1024**3)
    result.add_argument("--request-timeout-seconds", type=int, default=180)
    result.add_argument("--max-tokens", type=int, default=64)
    result.add_argument("--report", type=Path)
    result.add_argument("--dry-run", action="store_true")
    return result


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    try:
        feed = json.loads(args.input.read_text(encoding="utf-8"))
        writes, report = build_dispatch(feed, args)
        created, existing = (0, 0) if args.dry_run else materialize(writes)
    except (OSError, json.JSONDecodeError, playlist.GenerationError) as error:
        print(f"HALT: {error}")
        return 2
    report["created"] = created
    report["already_present"] = existing
    report["dry_run"] = args.dry_run
    output = json.dumps(report, indent=2, sort_keys=True) + "\n"
    if args.report:
        args.report.write_text(output, encoding="utf-8")
    print(output, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
