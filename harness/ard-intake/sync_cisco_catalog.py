#!/usr/bin/env python3
"""Run Cisco ARD fetch -> quarantined intake -> descriptive GSPC event."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Callable

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "catalog-hive"))
from cisco_catalog_intake import normalize
from fetch_cisco_catalog import fetch
from event_projection import build_event


def sync(output_dir: Path, fetcher: Callable = fetch) -> dict:
    if output_dir.exists():
        raise FileExistsError(f"refusing to overwrite existing run directory: {output_dir}")
    raw, fetch_receipt = fetcher()
    fetch_time = fetch_receipt.get("retrieved_at")
    intake_receipt = normalize(raw, fetch_receipt.get("final_uri", ""), fetch_time)
    if hashlib.sha256(raw).hexdigest() != fetch_receipt.get("sha256"):
        raise ValueError("fetcher receipt digest does not match returned bytes")
    event = build_event(fetch_receipt, intake_receipt)

    # Create the run directory only after all validation passes; each artifact
    # is then a new file, and repeated runs cannot overwrite prior snapshots.
    output_dir.mkdir(parents=True, exist_ok=False)
    (output_dir / "manifest.json").write_bytes(raw)
    (output_dir / "fetch-receipt.json").write_text(json.dumps(fetch_receipt, indent=2) + "\n")
    candidate_bytes = "".join(json.dumps(item, ensure_ascii=False, sort_keys=True) + "\n"
                               for item in intake_receipt["candidates"]).encode("utf-8")
    (output_dir / "candidates.jsonl").write_bytes(candidate_bytes)
    intake_summary = {key: value for key, value in intake_receipt.items() if key != "candidates"}
    (output_dir / "intake-receipt.json").write_text(json.dumps(intake_summary, indent=2) + "\n")
    (output_dir / "source-change-event.json").write_text(json.dumps(event, indent=2) + "\n")
    return {
        "output_dir": str(output_dir.resolve()),
        "manifest_sha256": fetch_receipt["sha256"],
        "reported_entries": intake_receipt["reported_entries"],
        "candidate_count": intake_receipt["candidate_count"],
        "rejected_count": intake_receipt["rejected_count"],
        "event_type": event["type"],
        "event_execution": event["execution"],
        "gspc_measurement": event["data"]["gspc_measurement"],
        "admission": event["data"]["layer0_admission"],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out-dir", required=True, type=Path,
                        help="new run directory; existing paths are never overwritten")
    args = parser.parse_args()
    print(json.dumps(sync(args.out_dir), sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"ard-sync: {exc}", file=sys.stderr)
        raise SystemExit(2)
