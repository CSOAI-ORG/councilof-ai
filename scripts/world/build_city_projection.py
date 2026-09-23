#!/usr/bin/env python3
"""Create a public DESIGN-only projection from a verified Micro2 bundle."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from pull_verified_micro2_bundle import FILES, validate_bundle

ROW_FIELDS = (
    "tick", "time", "city_time", "population",
    "residential", "commercial", "industrial", "powered",
)


def build(bundle_dir: Path) -> dict:
    files = {name: (bundle_dir / name).read_bytes() for name in FILES}
    receipt = validate_bundle(files)
    rows = [json.loads(line) for line in files["delta.jsonl"].splitlines() if line.strip()]
    for index, row in enumerate(rows):
        for field in ROW_FIELDS:
            expected_type = bool if field == "powered" else int
            if type(row.get(field)) is not expected_type:
                raise ValueError(f"row {index}: invalid {field}")
    public_rows = [
        {("source_time_ms" if field == "time" else field): row[field] for field in ROW_FIELDS}
        for row in rows
    ]
    return {
        "schema": "csoai.simulation-city-snapshot/1",
        "kind": "dated DESIGN simulation projection",
        "source": {
            "city": "sov-town",
            "generated_at": receipt["source_generated_at"],
            "delta_sha256": receipt["source_delta_sha256"],
            "manifest_sha256": hashlib.sha256(files["manifest.json"]).hexdigest(),
            "rows_checked": receipt["rows"],
            "verification": "source delta digest, row count and latest row matched on ingestion",
            "full_raw_export_public": False,
        },
        "limitations": [
            "Simulation data only; not a real city, compliance result or certification.",
            "This is a dated snapshot, not a continuously served live feed.",
            "The raw export contains other simulation fields that are omitted from this projection.",
        ],
        "latest": public_rows[-1],
        "rows": public_rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--bundle-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = build(args.bundle_dir)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(
        f"DESIGN snapshot rows={len(result['rows'])} "
        f"source_generated_at={result['source']['generated_at']} "
        f"source_delta_sha256={result['source']['delta_sha256']}"
    )


if __name__ == "__main__":
    main()
