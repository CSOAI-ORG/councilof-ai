#!/usr/bin/env python3
"""Fetch one consistent Micro2 DESIGN export into a versioned local snapshot.

The exporter replaces three files independently. Never combine a manifest from
one city cycle with a delta or latest row from another.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
from datetime import datetime, timedelta, timezone

REMOTE_HOST = "oracle-mirror"
REMOTE_DIR = "/home/ubuntu/sov-town/exports/sov-world"
FILES = ("manifest.json", "delta.jsonl", "latest.json")


def validate_bundle(files: dict[str, bytes]) -> dict:
    if set(files) != set(FILES):
        raise ValueError("bundle must contain manifest, delta and latest exactly")
    manifest = json.loads(files["manifest.json"])
    latest = json.loads(files["latest.json"])
    delta = files["delta.jsonl"]
    digest = hashlib.sha256(delta).hexdigest()
    if manifest.get("delta_sha256") != digest:
        raise ValueError("delta SHA-256 differs from manifest")
    rows = [json.loads(line) for line in delta.splitlines() if line.strip()]
    if len(rows) != manifest.get("rows") or not rows:
        raise ValueError("delta row count differs from manifest")
    if rows[-1] != latest or latest != manifest.get("latest"):
        raise ValueError("latest row differs between delta, latest and manifest")
    if manifest.get("label") != "DESIGN" or any(row.get("label") != "DESIGN" for row in rows):
        raise ValueError("expected DESIGN-labelled simulation rows only")
    if manifest.get("city") != "sov-town" or any(row.get("city") != "sov-town" for row in rows):
        raise ValueError("city differs within export")
    datetime.fromisoformat(manifest["generated_at"].replace("Z", "+00:00"))
    return {
        "schema": "csoai.micro2-import-receipt/1",
        "kind": "DESIGN simulation",
        "source_generated_at": manifest["generated_at"],
        "source_delta_sha256": digest,
        "rows": len(rows),
        "last_tick": latest["tick"],
        "latest_source_time_ms": latest["time"],
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "verification": "delta digest, row count, latest row, city and DESIGN label checked",
    }


def check_freshness(receipt: dict, max_age_minutes: int, now: datetime | None = None) -> None:
    now = now or datetime.now(timezone.utc)
    generated = datetime.fromisoformat(receipt["source_generated_at"].replace("Z", "+00:00"))
    if generated.tzinfo is None:
        raise ValueError("source timestamp lacks a timezone")
    age = now - generated
    if age > timedelta(minutes=max_age_minutes) or age < timedelta(minutes=-5):
        raise ValueError(f"source freshness outside -5 to {max_age_minutes} minutes: {age}")


def fetch_once() -> dict[str, bytes]:
    result = subprocess.run(
        [
            "ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8",
            REMOTE_HOST, "tar", "-C", REMOTE_DIR, "-cf", "-", *FILES,
        ],
        check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=25,
    )
    files: dict[str, bytes] = {}
    with tarfile.open(fileobj=io.BytesIO(result.stdout), mode="r:") as bundle:
        for member in bundle:
            if member.name not in FILES or not member.isfile() or member.size > 2_000_000:
                raise ValueError("unexpected or oversized tar member")
            if member.name in files:
                raise ValueError("duplicate tar member")
            stream = bundle.extractfile(member)
            if stream is None:
                raise ValueError("tar member could not be read")
            files[member.name] = stream.read()
    return files


def save_bundle(output_root: Path, files: dict[str, bytes], receipt: dict) -> Path:
    output_root.mkdir(parents=True, exist_ok=True)
    stamp = receipt["source_generated_at"].replace("-", "").replace(":", "").replace("+00:00", "Z")
    final = output_root / f"{stamp}-{receipt['source_delta_sha256'][:12]}"
    if not final.exists():
        pending = Path(tempfile.mkdtemp(prefix=".pending-", dir=output_root))
        try:
            for name in FILES:
                (pending / name).write_bytes(files[name])
            (pending / "import-receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
            os.replace(pending, final)
        finally:
            if pending.exists():
                for path in pending.iterdir():
                    path.unlink()
                pending.rmdir()
    link = output_root / "latest"
    temp_link = output_root / ".latest-new"
    if temp_link.is_symlink():
        temp_link.unlink()
    temp_link.symlink_to(final.name)
    os.replace(temp_link, link)
    return final


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output-root", type=Path,
        default=Path("/workspace/lanes/out/sov-world-micro2"),
    )
    parser.add_argument("--attempts", type=int, default=3)
    parser.add_argument("--max-age-minutes", type=int, default=30)
    args = parser.parse_args()
    if args.attempts < 1 or args.attempts > 10:
        parser.error("--attempts must be between 1 and 10")
    if args.max_age_minutes < 1:
        parser.error("--max-age-minutes must be positive")
    last_error: Exception | None = None
    for _ in range(args.attempts):
        try:
            files = fetch_once()
            receipt = validate_bundle(files)
            check_freshness(receipt, args.max_age_minutes)
            directory = save_bundle(args.output_root, files, receipt)
            print(json.dumps({"status": "verified", "directory": str(directory), **receipt}))
            return
        except (ValueError, json.JSONDecodeError, subprocess.SubprocessError, OSError) as error:
            last_error = error
    raise SystemExit(f"no consistent bundle after {args.attempts} attempts: {last_error}")


if __name__ == "__main__":
    main()
