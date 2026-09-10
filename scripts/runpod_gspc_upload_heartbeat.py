#!/usr/bin/env python3
"""One bounded upload attempt for the existing pod scheduler; never a worker loop.

Runs at most once per six hours, uses one explicit private-intake credential file,
and records attempts on the persistent volume. A shared lock survives the parent
if its uploader child remains alive. Raw command output and credentials are never
stored in receipts or printed. Scheduling/recovery belongs to pod-loops.
"""
from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import math
import os
import re
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

REPO = "csoai/runpod-gspc-intake"
SCHEMA = "csoai.runpod-upload-heartbeat/0.1"


def timestamp(epoch: float) -> str:
    return datetime.fromtimestamp(epoch, timezone.utc).isoformat().replace("+00:00", "Z")


def write_receipt(path: Path, receipt: dict) -> None:
    descriptor, temporary = tempfile.mkstemp(prefix=".receipt-", dir=path.parent)
    try:
        with os.fdopen(descriptor, "w") as stream:
            json.dump(receipt, stream, sort_keys=True, indent=2)
            stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
    finally:
        Path(temporary).unlink(missing_ok=True)


def output_facts(stream) -> tuple[str, dict | None]:
    stream.seek(0)
    checksum = hashlib.sha256()
    counts = None
    for line in stream:
        checksum.update(line)
        match = re.fullmatch(
            rb"pod-push: complete runs (\d+) \xc2\xb7 (?:pushed|planned) (\d+) \xc2\xb7 "
            rb"already upstream (\d+) \xc2\xb7 partial skipped (\d+)(?: \xc2\xb7 DRY RUN)?\s*", line,
        )
        if match:
            counts = dict(zip(("complete_runs", "pushed_or_planned", "already_upstream", "partial_skipped"),
                              (int(value) for value in match.groups())))
            if counts["complete_runs"] != counts["pushed_or_planned"] + counts["already_upstream"]:
                counts = None
        empty = re.fullmatch(rb"nothing complete to push \((\d+) partial\)\s*", line)
        if empty:
            counts = {"complete_runs": 0, "pushed_or_planned": 0,
                      "already_upstream": 0, "partial_skipped": int(empty[1])}
    return checksum.hexdigest(), counts


def run_once(args: argparse.Namespace, *, clock: Callable[[], float] = time.time,
             runner: Callable = subprocess.run) -> int:
    args.state_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    lock_path = args.state_dir / "upload.lock"
    with lock_path.open("a+") as lock:
        try:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return 0
        latest = args.state_dir / ("dry-run-latest.json" if args.dry_run else "latest.json")
        started = clock()
        if latest.exists() and not args.now and not args.dry_run:
            previous = json.loads(latest.read_text())
            due = previous.get("next_due_epoch")
            if (previous.get("schema") != SCHEMA or isinstance(due, bool)
                    or not isinstance(due, (int, float)) or not math.isfinite(due)):
                raise ValueError("invalid prior upload receipt")
            if started < previous["next_due_epoch"]:
                return 0
        if not args.uploader.is_file():
            raise ValueError("uploader is missing")
        # Refuse an old per-file uploader when deployment accidentally updates
        # only the scheduler. These names describe the reviewed atomic interface.
        source = args.uploader.read_bytes()
        if any(marker not in source for marker in (
            b"def private_head(", b"def freeze_runs(", b"parent_commit=revision", b'"--token-file"',
        )):
            raise ValueError("uploader lacks the atomic private-intake contract")
        receipt = {"schema": SCHEMA, "state": "RUNNING", "repo": REPO,
                   "started_at": timestamp(started), "started_epoch": started,
                   "next_due_epoch": started + args.interval_seconds,
                   "uploader_sha256": hashlib.sha256(source).hexdigest(), "dry_run": args.dry_run}
        write_receipt(latest, receipt)
        command = [sys.executable, str(args.uploader), "--root", str(args.root), "--repo", REPO,
                   "--token-file", str(args.token_file)]
        if args.dry_run:
            command.append("--dry-run")
        with tempfile.TemporaryFile() as stdout, tempfile.TemporaryFile() as stderr:
            try:
                result = runner(command, stdout=stdout, stderr=stderr,
                                timeout=args.timeout_seconds, check=False, pass_fds=(lock.fileno(),))
                code = result.returncode
                state = "SUCCESS" if code == 0 else "FAILED"
            except subprocess.TimeoutExpired:
                code, state = 124, "TIMEOUT"
            except OSError:
                code, state = 127, "FAILED_TO_START"
            stdout_hash, counts = output_facts(stdout)
            stderr_hash, _ = output_facts(stderr)
        if code == 0 and counts is None:
            # A zero process exit is not proof that a bundle was durably copied.
            code, state = 65, "UNCONFIRMED_OUTPUT"
        elif code == 0 and counts["complete_runs"] == 0:
            state = "NO_COMPLETE_RUNS"
        finished = clock()
        receipt.update(state=state, finished_at=timestamp(finished), exit_code=code,
                       duration_seconds=max(0, finished - started), stdout_sha256=stdout_hash,
                       stderr_sha256=stderr_hash, counts=counts)
        history = args.state_dir / "history"
        history.mkdir(exist_ok=True, mode=0o700)
        attempt_name = f"{'dry-' if args.dry_run else ''}{int(started * 1000000)}-{os.getpid()}.json"
        write_receipt(history / attempt_name, receipt)
        write_receipt(latest, receipt)
        print(f"runpod-upload {state} exit={code} complete_runs={counts['complete_runs'] if counts else 'unknown'}")
        return 0 if code == 0 else 1


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("/workspace/gspc-24x7"))
    parser.add_argument("--state-dir", type=Path, default=Path("/workspace/lanes/state/runpod-upload"))
    parser.add_argument("--uploader", type=Path, default=Path(__file__).with_name("runpod_gspc_push_to_hf.py"))
    parser.add_argument("--token-file", type=Path,
                        default=Path("/workspace/lanes/.secrets/runpod-intake-hf-token"))
    parser.add_argument("--interval-seconds", type=int, default=21600)
    parser.add_argument("--timeout-seconds", type=int, default=1200)
    parser.add_argument("--now", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)
    if args.interval_seconds < 300 or not 1 <= args.timeout_seconds <= 3600:
        parser.error("interval must be at least five minutes; timeout must be 1–3600 seconds")
    try:
        return run_once(args)
    except Exception:
        print("runpod-upload REFUSED: scheduler state or uploader could not be checked", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
