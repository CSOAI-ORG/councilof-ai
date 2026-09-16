#!/usr/bin/env python3
"""test_sync_skus.py — verify SKU manifest synchronization.

Tests:
  * Manifest generation
  * SKU count matches product_block SKU_TABLE
  * All required fields present
  * --check mode works
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import product_block as pb
from sync_skus import build_manifest, check_manifest


def test_manifest_sku_count():
    """Manifest has same number of SKUs as product_block."""
    manifest = build_manifest()
    assert manifest["count"] == len(pb.SKU_TABLE)


def test_manifest_schema():
    """Manifest has required top-level fields."""
    manifest = build_manifest()
    assert manifest["schema"] == "csoai.sku-manifest/0.1"
    assert "generated_by" in manifest
    assert "skus" in manifest
    assert "note" in manifest


def test_manifest_sku_fields():
    """Each SKU in manifest has required fields."""
    manifest = build_manifest()
    for sku in manifest["skus"]:
        assert "id" in sku, f"SKU missing id: {sku}"
        assert "surface" in sku, f"SKU missing surface: {sku}"
        assert "tier" in sku, f"SKU missing tier: {sku}"
        assert "free_fields" in sku, f"SKU missing free_fields: {sku}"
        assert "paid_fields" in sku, f"SKU missing paid_fields: {sku}"
        assert sku["tier"] in ("free", "proof"), f"Invalid tier: {sku['tier']}"


def test_manifest_matches_table():
    """Manifest SKUs match product_block SKU_TABLE entries."""
    manifest = build_manifest()
    for sku in manifest["skus"]:
        surface = sku["surface"]
        assert surface in pb.SKU_TABLE, f"Surface {surface} not in SKU_TABLE"
        entry = pb.SKU_TABLE[surface]
        assert sku["id"] == entry["sku"], f"SKU id mismatch for {surface}"
        assert sku["tier"] == entry["tier"], f"Tier mismatch for {surface}"


def test_check_manifest_identical():
    """check_manifest returns True for identical manifests."""
    manifest = build_manifest()
    assert check_manifest(manifest) is True


def test_check_manifest_different():
    """check_manifest returns False for different manifests."""
    manifest = build_manifest()
    modified = {**manifest, "count": manifest["count"] + 1}
    assert check_manifest(modified) is False


def main() -> int:
    tests = [
        test_manifest_sku_count,
        test_manifest_schema,
        test_manifest_sku_fields,
        test_manifest_matches_table,
        test_check_manifest_identical,
        test_check_manifest_different,
    ]
    fails = []
    for test in tests:
        try:
            test()
            print(f"  PASS {test.__name__}")
        except AssertionError as e:
            print(f"  FAIL {test.__name__}: {e}")
            fails.append(test.__name__)
        except Exception as e:
            print(f"  ERROR {test.__name__}: {type(e).__name__}: {e}")
            fails.append(test.__name__)
    if fails:
        print(f"\n{len(fails)} FAILED: {', '.join(fails)}")
        return 1
    print(f"\nAll {len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
