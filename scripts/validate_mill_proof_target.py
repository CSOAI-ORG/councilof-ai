#!/usr/bin/env python3
"""Fail-closed preflight for one exact Hub-model mill proof."""
from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "harness" / "gspc-top100"))
from mill_hub_queue import GEN_TAGS, HF_PROVIDER_SUFFIX, load_dead_slugs, load_queue  # noqa: E402

MODEL = re.compile(r"^[A-Za-z0-9._-]+/[A-Za-z0-9._-]+$")
REVISION = re.compile(r"^[0-9a-f]{40,64}$")
MILL_PROVIDERS = {suffix[1:] for suffix in HF_PROVIDER_SUFFIX}
LIVE_TASKS = {"conversational", "text-generation"}


def fetch_metadata(model: str) -> dict:
    query = urllib.parse.urlencode([("expand[]", "sha"), ("expand[]", "inferenceProviderMapping")])
    url = f"https://huggingface.co/api/models/{urllib.parse.quote(model, safe='/')}?{query}"
    request = urllib.request.Request(url, headers={"User-Agent": "csoai-mill-proof-preflight/0.1"})
    with urllib.request.urlopen(request, timeout=30) as response:
        value = json.loads(response.read())
    if not isinstance(value, dict):
        raise ValueError("model metadata is not an object")
    return value


def inflight_cells(path: Path | None) -> set[tuple[str, str]]:
    if path is None or not path.is_file():
        return set()
    cells = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        if isinstance(row, dict) and row.get("id") and row.get("axis"):
            cells.add((str(row["id"]), str(row["axis"])))
    return cells


def validate_target(model: str, axis: str, queue: Path, dead: Path | None,
                    inflight: Path | None = None, fetch=None) -> dict:
    if not MODEL.fullmatch(model):
        raise ValueError("model must be one exact Hugging Face repository id (owner/name)")
    matches = [row for row in load_queue(queue) if row.get("id") == model]
    if len(matches) != 1:
        raise ValueError("exact model is not one unique queue member")
    row = matches[0]
    if row.get("pipeline_tag") not in GEN_TAGS:
        raise ValueError("queue member is not a generative model")
    cell = (row.get("measured_axes") or {}).get(axis) or {}
    if str(cell.get("status") or "").upper() == "MEASURED" and cell.get("card_id"):
        raise ValueError("exact model-axis cell is already measured in the fetched queue")
    if model in load_dead_slugs(dead, max_age_days=14):
        raise ValueError("exact model is in the current dead-slug window")
    if (model, axis) in inflight_cells(inflight):
        raise ValueError("exact model-axis cell is already in flight")

    metadata = (fetch or fetch_metadata)(model)
    if metadata.get("id") != model:
        raise ValueError("model metadata canonical id differs from the requested id")
    revision = str(metadata.get("sha") or "")
    if not REVISION.fullmatch(revision):
        raise ValueError("immutable model revision unavailable")
    mapping = metadata.get("inferenceProviderMapping")
    if not isinstance(mapping, dict):
        raise ValueError("inference provider mapping unavailable")
    live = sorted(
        provider for provider, info in mapping.items()
        if provider in MILL_PROVIDERS and isinstance(info, dict)
        and str(info.get("status") or "live") == "live"
        and str(info.get("task") or "") in LIVE_TASKS
    )
    if not live:
        raise ValueError("no live provider mapping used by this mill")
    return {
        "schema": "csoai.mill-proof-target/0.1",
        "checked_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "model": model,
        "axis": axis,
        "queue_rank": row.get("rank"),
        "model_hf_revision": revision,
        "live_mill_providers": live,
        "eligible": True,
    }


def write(path: Path, raw: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(raw, encoding="utf-8")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", required=True)
    parser.add_argument("--axis", required=True)
    parser.add_argument("--queue", type=Path, required=True)
    parser.add_argument("--dead", type=Path)
    parser.add_argument("--inflight", type=Path)
    parser.add_argument("--only-out", type=Path, required=True)
    parser.add_argument("--revision-pins-out", type=Path, required=True)
    parser.add_argument("--receipt-out", type=Path, required=True)
    args = parser.parse_args(argv)
    receipt = validate_target(args.model, args.axis, args.queue, args.dead, args.inflight)
    write(args.only_out, args.model + "\n")
    write(args.revision_pins_out, json.dumps({args.model: receipt["model_hf_revision"]}, sort_keys=True) + "\n")
    write(args.receipt_out, json.dumps(receipt, indent=2, sort_keys=True) + "\n")
    print(json.dumps(receipt, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
