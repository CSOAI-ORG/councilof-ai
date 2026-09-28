#!/usr/bin/env python3
"""Build a public, source-linked simulation index from a checked import."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


SOURCE_URL = "https://councilof.ai/j-space/events.json"


def canonical_hash(value: dict) -> str:
    body = json.dumps(value, sort_keys=True, separators=(",", ":"), default=str).encode()
    return hashlib.sha256(body).hexdigest()


def build(source_path: Path, snapshot_path: Path, cards_path: Path) -> dict:
    source_bytes = source_path.read_bytes()
    source = json.loads(source_bytes)
    imported = json.loads(snapshot_path.read_bytes())
    cards = json.loads(cards_path.read_bytes())
    source_events = source["events"]
    imported_events = imported["events"]
    if source.get("n_events") != len(source_events) or len(source_events) != len(imported_events):
        raise ValueError("source/import event counts differ")

    previous = None
    public_events = []
    by_import_id = {}
    for index, (original, event) in enumerate(zip(source_events, imported_events)):
        payload = event["payload"]
        if (
            original.get("id") != payload.get("upstream_id")
            or original.get("axis") != payload.get("axis")
            or original.get("intent") != payload.get("intent")
            or original.get("epoch") != payload.get("upstream_epoch")
            or bool(original.get("signed")) != payload.get("upstream_signed_flag")
        ):
            raise ValueError(f"source/import mismatch at row {index}")
        body = {key: value for key, value in event.items() if key != "event_hash"}
        if event["prev_hash"] != previous or canonical_hash(body) != event["event_hash"]:
            raise ValueError(f"invalid import hash chain at row {index}")
        previous = event["event_hash"]
        by_import_id[event["event_id"]] = (index, original, event)
        public_events.append(
            {
                "source_index": index,
                "source_id": original["id"],
                "axis": original.get("axis"),
                "intent": original.get("intent") or "",
                "source_epoch": original.get("epoch"),
            }
        )

    snap = imported["snapshot"]
    if snap["event_count"] != len(imported_events) or snap["head_hash"] != previous:
        raise ValueError("snapshot does not match its import hash chain")
    if snap.get("metadata", {}).get("upstream_signature_verification") != "not-performed-by-importer":
        raise ValueError("unexpected signature-verification status")

    public_cards = []
    for card in cards:
        ids = card["evidence_event_ids"]
        if len(ids) != 1 or ids[0] not in by_import_id:
            raise ValueError("card does not resolve to an imported event")
        index, original, event = by_import_id[ids[0]]
        if card["metadata"].get("event_hash") != event["event_hash"]:
            raise ValueError("card event hash does not match the import")
        if "signature was not verified" not in card["disclosure"]:
            raise ValueError("card has no explicit upstream-signature limitation")
        public_cards.append(
            {
                "source_index": index,
                "source_id": original["id"],
                "axis": original.get("axis"),
                "title": card["title"].replace("SOV World / J-Space", "Council World"),
                "hook": card["hook"],
                "disclosure": card["disclosure"],
            }
        )

    return {
        "schema": "csoai.simulation-observatory/1",
        "source": {
            "url": SOURCE_URL,
            "sha256": hashlib.sha256(source_bytes).hexdigest(),
            "generated_at": source["generated_at"],
            "event_count": len(source_events),
        },
        "import": {
            "event_count": len(imported_events),
            "head_hash": previous,
            "hash_chain": "checked",
            "upstream_signature_verification": "not-performed",
        },
        "events": public_events,
        "cards": public_cards,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--snapshot", type=Path, required=True)
    parser.add_argument("--cards", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = build(args.source, args.snapshot, args.cards)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(
        f"source={result['source']['event_count']} "
        f"import={result['import']['event_count']} "
        f"linked_cards={len(result['cards'])} "
        f"source_sha256={result['source']['sha256']}"
    )


if __name__ == "__main__":
    main()
