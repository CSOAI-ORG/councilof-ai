#!/usr/bin/env python3
"""Guard the existing GSPC spray's Kaggle writer against duplicate versions.

Candidate for the existing M4 mirror tick. This file does not install a schedule.
The actual publisher remains scripts/spray/gspc-spray.py --kaggle.
"""

from __future__ import annotations

import argparse
import fcntl
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from urllib.request import Request, urlopen
import zipfile
from datetime import datetime, timezone

BOARD = "https://councilof.ai/api/gspc"
KAGGLE = "https://www.kaggle.com/api/v1/datasets"
DATASET = "nicktempleman/csoai-gspc-living-board"
DEFAULT_SOURCE = Path("/Users/nicholas/.csoai/kaggle-publisher-source")
DEFAULT_STATE = Path.home() / ".csoai" / "kaggle-refresh-state"
MAX_DOWNLOAD = 10 * 1024 * 1024


def fetch(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": "csoai-kaggle-refresh/1 (+https://councilof.ai)"})
    with urlopen(request, timeout=60) as response:
        data = response.read(MAX_DOWNLOAD + 1)
    if len(data) > MAX_DOWNLOAD:
        raise ValueError("public response exceeds the bounded download size")
    return data


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def board_from_archive(data: bytes) -> bytes:
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        names = archive.namelist()
        matches = [name for name in names if Path(name).name == "board.json"]
        if len(matches) != 1:
            raise ValueError("Kaggle archive must carry exactly one board.json")
        return archive.read(matches[0])


def versions(metadata: dict) -> tuple[int, int]:
    current = metadata.get("currentVersionNumber")
    ready = [row.get("versionNumber") for row in metadata.get("versions", [])
             if isinstance(row, dict) and row.get("status") == "Ready"
             and type(row.get("versionNumber")) is int]
    if type(current) is not int or not ready:
        raise ValueError("Kaggle has no current version or no Ready version")
    return current, max(ready)


def decision(live: str, latest: str, default: str, current_version: int, ready_version: int) -> str:
    if current_version != ready_version:
        return "WAITING_KAGGLE_POINTER"
    if latest == live and default != live:
        return "WAITING_KAGGLE_DEFAULT"
    if latest == live and default == live:
        return "UNCHANGED"
    return "SPRAY_REQUIRED"


def observe() -> dict:
    live = sha(fetch(BOARD))
    meta = json.loads(fetch(f"{KAGGLE}/view/{DATASET}"))
    current, ready = versions(meta)
    latest = sha(board_from_archive(fetch(
        f"{KAGGLE}/download/{DATASET}?datasetVersionNumber={ready}")))
    default = sha(board_from_archive(fetch(f"{KAGGLE}/download/{DATASET}")))
    return {"live_board_sha256": live, "kaggle_current_version": current,
            "kaggle_latest_ready_version": ready, "kaggle_latest_board_sha256": latest,
            "kaggle_default_board_sha256": default,
            "decision": decision(live, latest, default, current, ready)}


def committed_source(source: Path) -> str:
    rel = "scripts/spray/gspc-spray.py"
    path = source / rel
    if not path.is_file():
        raise ValueError("the dedicated checkout lacks the existing GSPC spray")
    head = subprocess.run(["git", "-C", str(source), "rev-parse", "HEAD"],
                          capture_output=True, text=True, check=True).stdout.strip()
    for args in (["diff", "--quiet", "HEAD", "--", "scripts/spray"],
                 ["ls-files", "--error-unmatch", rel]):
        subprocess.run(["git", "-C", str(source), *args],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    return head


def save_receipt(state: Path, record: dict) -> None:
    state.mkdir(parents=True, exist_ok=True)
    record["observed_at"] = datetime.now(timezone.utc).isoformat()
    fd, temp = tempfile.mkstemp(prefix="kaggle-refresh-", dir=state)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as output:
            json.dump(record, output, indent=2, sort_keys=True)
            output.write("\n")
        os.replace(temp, state / "latest.json")
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--state", type=Path, default=DEFAULT_STATE)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    args.state.mkdir(parents=True, exist_ok=True)
    lock_path = args.state / "writer.lock"
    with lock_path.open("a+") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print("LOCKED: an existing Kaggle refresh holds the writer lock")
            return 75
        record: dict = {"kind": "csoai.kaggle-refresh-guard/1", "dataset": DATASET}
        try:
            record["source_commit"] = committed_source(args.source)
            record.update(observe())
            if record["decision"] == "SPRAY_REQUIRED" and args.dry_run:
                record["decision"] = "DRY_RUN_SPRAY_REQUIRED"
            if record["decision"] == "SPRAY_REQUIRED" and not args.dry_run:
                # The existing spray builds a snapshot in /tmp. Refuse the write when
                # the M4 disk is close to full; a half-built snapshot is not a release.
                if shutil.disk_usage(tempfile.gettempdir()).free < 1024 * 1024 * 1024:
                    record["decision"] = "BLOCKED_LOW_DISK"
                    save_receipt(args.state, record)
                    print("BLOCKED_LOW_DISK: at least 1 GiB free is required", file=sys.stderr)
                    return 2
                report = args.state / "spray-report.json"
                report.unlink(missing_ok=True)
                result = subprocess.run(
                    [sys.executable, "scripts/spray/gspc-spray.py", "--kaggle", "--report", str(report)],
                    cwd=args.source, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                    timeout=1800, check=False)
                record["spray_exit_code"] = result.returncode
                if report.is_file():
                    try:
                        rows = json.loads(report.read_text()).get("results", [])
                        record["spray_status"] = next((r.get("status") for r in rows
                                                        if r.get("surface") == "kaggle"), None)
                    except (OSError, ValueError):
                        record["spray_status"] = None
                record.update(observe())
                if result.returncode or record.get("spray_status") not in {"PUBLISHED", "UNCHANGED"}:
                    record["decision"] = "SPRAY_NEEDS_REVIEW"
            save_receipt(args.state, record)
            print(record["decision"], "live_sha256=" + record["live_board_sha256"],
                  "ready_version=" + str(record["kaggle_latest_ready_version"]))
            return 2 if record["decision"] in {"SPRAY_REQUIRED", "SPRAY_NEEDS_REVIEW"} and not args.dry_run else 0
        except Exception as error:  # fail closed; do not print exception text that could include a URL token
            record["decision"] = "ERROR"
            record["error_type"] = type(error).__name__
            save_receipt(args.state, record)
            print("ERROR: Kaggle refresh did not publish; see receipt error type", file=sys.stderr)
            return 2


if __name__ == "__main__":
    raise SystemExit(main())
