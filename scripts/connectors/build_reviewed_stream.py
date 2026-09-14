#!/usr/bin/env python3
"""Materialize deterministic envelopes for reviewed public evidence artifacts."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from mirror_envelope import build_envelope, encode_jsonl, sha256_bytes

REPO = Path(__file__).resolve().parents[2]


def _utc(value: str) -> str:
    return value[:-6] + "Z" if value.endswith("+00:00") else value


def build_rows() -> list[dict]:
    specs = (
        (
            REPO / "public/root.json",
            "https://councilof.ai/root.json",
            "measurement-root",
            "gspc-root",
            "gspc.root-manifest",
            "as_of",
        ),
        (
            REPO / "public/signed/card_index.json",
            "https://councilof.ai/signed/card_index.json",
            "signed-card-index",
            "gspc-card-index",
            "gspc.signed-card-index",
            "packaged_at",
        ),
    )
    rows = []
    for path, uri, subject_kind, subject_id, measurement_kind, timestamp_key in specs:
        payload = path.read_bytes()
        document = json.loads(payload)
        timestamp = _utc(document.get(timestamp_key)) if isinstance(document.get(timestamp_key), str) else None
        if not isinstance(timestamp, str):
            raise ValueError(f"{path}: missing {timestamp_key}")
        digest = sha256_bytes(payload)
        rows.append(
            build_envelope(
                source_platform="councilofai",
                source_uri=uri,
                source_revision=f"sha256:{digest}",
                subject_kind=subject_kind,
                subject_id=subject_id,
                measurement_kind=measurement_kind,
                artifact_uri=uri,
                artifact_payload=payload,
                artifact_media_type="application/json",
                timestamp=timestamp,
                license_id="MIT",
                provenance_uri=uri,
                lifecycle_state="published",
            )
        )
    return rows


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=REPO / "public/mirrors/reviewed-stream.jsonl")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    payload = encode_jsonl(build_rows())
    if args.check:
        if not args.output.is_file() or args.output.read_bytes() != payload:
            raise SystemExit(f"STALE {args.output}")
        print(f"PASS {args.output} exact bytes")
        return
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(payload)
    print(f"WROTE {args.output} rows=2 bytes={len(payload)}")


if __name__ == "__main__":
    main()
