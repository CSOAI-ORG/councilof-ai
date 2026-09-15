#!/usr/bin/env python3
"""Demo: koi lineage measurement card generator.

Produces a sample unsigned card-v1 structure for a koi fish lineage observation.
This is a STRUCTURAL DEMO — not a real measurement, not signed, not in the public root.

The card follows the councilof.ai card-v1 schema:
  https://councilof.ai/schema/card-v1.json

Uses only stdlib. No fabricated lineage data — the demo card records that it is
a demo and names no real fish.

Usage:
    python scripts/adapters/koi_lineage_demo.py --demo
    python scripts/adapters/koi_lineage_demo.py --demo --format compact
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from typing import Any

CARD_SCHEMA = "https://councilof.ai/schema/card-v1.json"
DID = "did:web:csoai.org#board-attestation-1"

# The card-v1 surface enum does not include a koi-lineage surface.
# A real vertical would register its surface in the schema; for the demo
# we use public.notice (the general-purpose surface) and declare the
# hypothetical surface name in the payload.
DEMO_SURFACE = "public.notice"


def canonical_bytes(obj: Any) -> bytes:
    """Canonical JSON: UTF-8, sorted keys, compact separators, ensure_ascii=false."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


DIGEST_EXCLUDES = ("sha256", "sig_ed25519")


def card_sha256(card: dict) -> str:
    """Whole-card digest excluding sha256 and sig_ed25519 (card-v1 rule)."""
    body = {k: v for k, v in card.items() if k not in DIGEST_EXCLUDES}
    return sha256_hex(canonical_bytes(body))


def make_demo_lineage_card() -> dict:
    """Build a sample koi lineage measurement card.

    This card is:
    - UNSIGNED (sig_ed25519 is None — a laptop cannot sign with the board key)
    - NOT in the public root (would need publish_public_root.py)
    - NOT MEASURED (it is a structural demo)
    - Uses public.notice as surface (the koi-lineage surface is not yet registered)

    The card records that it is a demo and names no real fish.
    """
    as_of = now_iso()

    payload = {
        "kind": "demo.koi-lineage/0.1",
        "status": "DEMO",
        "vertical_surface": "koi.lineage",
        "vertical_surface_note": (
            "Hypothetical surface name. Not yet in the card-v1 enum. "
            "Would need schema registration to become a real surface."
        ),
        "observation": {
            "type": "lineage-record",
            "fish_id": "DEMO-KOI-001",
            "variety": "Kohaku",
            "claimed_parentage": {
                "sire": "DEMO-SIRE-001 (unverified claim)",
                "dam": "DEMO-DAM-001 (unverified claim)",
            },
            "parentage_note": (
                "Parentage is a CLAIM recorded here, not a verified fact. "
                "Verification requires breeder records, DNA evidence, or "
                "independent attestation — none of which are present in this demo."
            ),
            "growth_mm": None,
            "growth_note": "No real measurement data. This field would hold timestamped length/weight observations.",
            "pattern_notes": None,
            "pattern_note": "No real pattern data. This field would hold photographic evidence of pattern development.",
        },
        "evidence": {
            "photos": [],
            "breeder_records": [],
            "show_results": [],
            "note": (
                "No evidence attached to this demo card. A real lineage card "
                "would carry source_urls pointing to breeder catalogues, "
                "show results, and photographic evidence."
            ),
        },
        "note": (
            "DEMO card. Not a real measurement. Not signed. Not in the public root. "
            "Demonstrates how a koi lineage observation would be structured as a "
            "card-v1 measurement card on councilof.ai infrastructure. "
            "No real fish, no real lineage data."
        ),
    }

    # unmeasured declares what this card does NOT cover
    unmeasured = [
        "sig_ed25519 (unsigned demo — laptop cannot use board key)",
        "parentage verification (claims only, no DNA or breeder attestation)",
        "growth measurements (no data collected)",
        "pattern documentation (no photos attached)",
        "show results (no records attached)",
        "surface registration (koi.lineage not in card-v1 enum)",
    ]

    card: dict[str, Any] = {
        "as_of": as_of,
        "did": DID,
        "digest_covers": "whole-card-except-sha256-and-sig_ed25519",
        "sig_covers": (
            "compact envelope {did,schema,surface,as_of,sha256}; sha256 is the "
            "whole-card digest, so the signature binds subject, source_urls, tags, "
            "unmeasured and payload through it"
        ),
        "payload": payload,
        "schema": CARD_SCHEMA,
        "sha256": None,
        "sig_ed25519": None,
        "source_urls": [
            "https://councilof.ai/schema/card-v1.json",
            "https://councilof.ai/verticals/koikeeper/llms.txt",
        ],
        "subject": "DEMO koi lineage card: Kohaku DEMO-KOI-001 (structural demo, not a real measurement)",
        "surface": DEMO_SURFACE,
        "tags": [
            "demo",
            "vertical:koikeeper",
            "koi-lineage",
            "not-measured",
            "not-signed",
        ],
        "unmeasured": unmeasured,
    }

    # Compute sha256 LAST over the finished card (excluding sha256 and sig_ed25519)
    card["sha256"] = card_sha256(card)
    return card


def make_demo_fishkeeper_card() -> dict:
    """Build a sample fishkeeper (aquarium) measurement card.

    Same constraints as the koi card: UNSIGNED, NOT in the root, NOT MEASURED.
    """
    as_of = now_iso()

    payload = {
        "kind": "demo.fishkeeper/0.1",
        "status": "DEMO",
        "vertical_surface": "fishkeeper.observation",
        "vertical_surface_note": (
            "Hypothetical surface name. Not yet in the card-v1 enum."
        ),
        "observation": {
            "type": "water-quality",
            "tank_id": "DEMO-TANK-01",
            "parameters": {
                "ph": None,
                "temperature_c": None,
                "ammonia_ppm": None,
                "nitrite_ppm": None,
                "nitrate_ppm": None,
            },
            "parameters_note": (
                "No real sensor data. These fields would hold timestamped "
                "water-quality readings from test kits or IoT sensors."
            ),
            "fish_observations": [],
            "fish_note": (
                "No real fish health observations. This field would record "
                "behaviour notes, feeding response, colour changes."
            ),
        },
        "evidence": {
            "sensor_logs": [],
            "photos": [],
            "test_kit_results": [],
            "note": "No evidence attached to this demo card.",
        },
        "note": (
            "DEMO card. Not a real measurement. Not signed. Not in the public root. "
            "Demonstrates how aquarium water-quality observations would be structured "
            "as a card-v1 measurement card. No real tank, no real data."
        ),
    }

    unmeasured = [
        "sig_ed25519 (unsigned demo — laptop cannot use board key)",
        "water quality readings (no sensor data collected)",
        "fish health observations (no fish observed)",
        "surface registration (fishkeeper.observation not in card-v1 enum)",
    ]

    card: dict[str, Any] = {
        "as_of": as_of,
        "did": DID,
        "digest_covers": "whole-card-except-sha256-and-sig_ed25519",
        "sig_covers": (
            "compact envelope {did,schema,surface,as_of,sha256}; sha256 is the "
            "whole-card digest, so the signature binds subject, source_urls, tags, "
            "unmeasured and payload through it"
        ),
        "payload": payload,
        "schema": CARD_SCHEMA,
        "sha256": None,
        "sig_ed25519": None,
        "source_urls": [
            "https://councilof.ai/schema/card-v1.json",
            "https://councilof.ai/verticals/fishkeeper/llms.txt",
        ],
        "subject": "DEMO fishkeeper card: Tank DEMO-TANK-01 water quality (structural demo, not a real measurement)",
        "surface": DEMO_SURFACE,
        "tags": [
            "demo",
            "vertical:fishkeeper",
            "water-quality",
            "not-measured",
            "not-signed",
        ],
        "unmeasured": unmeasured,
    }

    card["sha256"] = card_sha256(card)
    return card


def print_card(card: dict, *, compact: bool = False) -> None:
    """Print card as JSON."""
    if compact:
        print(json.dumps(card, sort_keys=True, separators=(",", ":"), ensure_ascii=False))
    else:
        print(json.dumps(card, indent=2, ensure_ascii=False))


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Demo koi lineage / fishkeeper measurement card generator"
    )
    ap.add_argument(
        "--demo",
        action="store_true",
        help="Generate demo cards and print to stdout",
    )
    ap.add_argument(
        "--vertical",
        choices=["koikeeper", "fishkeeper", "both"],
        default="both",
        help="Which vertical demo to generate (default: both)",
    )
    ap.add_argument(
        "--format",
        choices=["pretty", "compact"],
        default="pretty",
        help="JSON output format (default: pretty)",
    )
    args = ap.parse_args()

    if not args.demo:
        ap.print_help()
        print("\nError: --demo flag is required. This script only generates demo output.", file=sys.stderr)
        return 1

    compact = args.format == "compact"

    print("#" * 72)
    print("# KOI LINEAGE / FISHKEEPER DEMO CARD GENERATOR")
    print("#")
    print("# This output is a STRUCTURAL DEMO.")
    print("# - NOT signed (sig_ed25519 is null; laptop cannot use board key)")
    print("# - NOT in the public root (needs publish_public_root.py)")
    print("# - NOT MEASURED (no real observation was made)")
    print("# - Uses public.notice surface (vertical surfaces not yet registered)")
    print("# - No real fish, no real data, no real lineage")
    print("#" * 72)
    print()

    cards = []

    if args.vertical in ("koikeeper", "both"):
        koi_card = make_demo_lineage_card()
        cards.append(("koikeeper", koi_card))
        print("=" * 40)
        print("KOIKEEPER DEMO CARD")
        print("=" * 40)
        print()
        print_card(koi_card, compact=compact)
        print()

    if args.vertical in ("fishkeeper", "both"):
        fish_card = make_demo_fishkeeper_card()
        cards.append(("fishkeeper", fish_card))
        print("=" * 40)
        print("FISHKEEPER DEMO CARD")
        print("=" * 40)
        print()
        print_card(fish_card, compact=compact)
        print()

    # Summary
    print("#" * 72)
    print("# SUMMARY")
    print(f"# Generated {len(cards)} demo card(s)")
    for name, card in cards:
        print(f"#   {name}: sha256={card['sha256'][:16]}... surface={card['surface']}")
    print("#")
    print("# To become real measurements, these cards would need:")
    print("#   1. A registered surface in the card-v1 schema enum")
    print("#   2. Real observation data in the payload")
    print("#   3. Signing by did:web:csoai.org#board-attestation-1")
    print("#   4. Commitment to the Merkle root via publish_public_root.py")
    print("#")
    print("# Measurement, not certification.")
    print("#" * 72)

    return 0


if __name__ == "__main__":
    sys.exit(main())
