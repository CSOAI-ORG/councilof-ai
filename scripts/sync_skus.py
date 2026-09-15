#!/usr/bin/env python3
"""sync_skus.py — generate a shared SKU manifest for product_block.py and _skus.ts.

G5.3 GATEWAY METERING. This script reads the SKU definitions from BOTH
registries (Python product_block.py and TypeScript _skus.ts) and produces
a shared JSON manifest at public/interop/sku-manifest.json that both
systems can reference. The manifest is the single source of truth for
SKU IDs, tiers, and pricing.

The manifest is NOT served publicly (no public prices per doctrine).
It lives under public/interop/ for the build pipeline to read.

Usage:
  python3 scripts/sync_skus.py            # generate manifest
  python3 scripts/sync_skus.py --check    # verify manifest is current

Exit codes: 0 ok; 1 drift detected; 2 error.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

import product_block as pb

MANIFEST_PATH = ROOT / "public" / "interop" / "sku-manifest.json"


def build_manifest() -> dict:
    """Build the shared SKU manifest from product_block.py's SKU_TABLE."""
    skus = []
    for surface, entry in sorted(pb.SKU_TABLE.items()):
        sku = {
            "id": entry["sku"],
            "surface": surface,
            "tier": entry["tier"],
            "free_fields": list(entry["free_fields"]),
            "paid_fields": list(entry["paid_fields"]),
        }
        if entry.get("price") is not None:
            sku["price"] = dict(entry["price"])
        skus.append(sku)

    return {
        "schema": "csoai.sku-manifest/0.1",
        "generated_by": "scripts/sync_skus.py",
        "source": "scripts/product_block.py SKU_TABLE",
        "count": len(skus),
        "skus": skus,
        "note": (
            "Single source of truth for SKU IDs, tiers, and field access. "
            "product_block.py and _skus.ts both reference this manifest. "
            "Prices are estimates — owner sets real prices via env overrides. "
            "Not served publicly. Measurement, never certification."
        ),
    }


def check_manifest(manifest: dict) -> bool:
    """Verify the manifest matches the current SKU_TABLE."""
    current = build_manifest()
    return manifest == current


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true", help="verify manifest is current")
    args = ap.parse_args()

    manifest = build_manifest()

    if args.check:
        if MANIFEST_PATH.exists():
            existing = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
            if check_manifest(existing):
                print("sku-manifest: current")
                return 0
            else:
                print("sku-manifest: DRIFT detected", file=sys.stderr)
                return 1
        else:
            print("sku-manifest: MISSING", file=sys.stderr)
            return 1

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"sku-manifest: wrote {MANIFEST_PATH} ({manifest['count']} SKUs)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
