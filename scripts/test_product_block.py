#!/usr/bin/env python3
"""test_product_block.py — verify the product block module.

G5.1 PRODUCT BLOCK v0.1. Tests:
  * Every surface in the publisher's SURFACES set maps to a known SKU
  * Every SKU entry has required fields
  * Free-tier cards have empty paid_fields
  * Proof-tier cards have a price object
  * The retro_tag function adds a product block to a card without one
  * The retro_tag function is idempotent (doesn't overwrite existing)
  * Anchors are always present with expected keys
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import product_block as pb

# Publisher's SURFACES set (must match publish_public_root.py)
PUBLISHER_SURFACES = {
    "xrpl.asset.state",
    "xrpl.basket.root",
    "public.notice",
    "benji.onchain.supply",
    "receipts.v1",
}


def test_sku_table_complete():
    """Every publisher surface must be in the SKU table."""
    for surface in PUBLISHER_SURFACES:
        assert surface in pb.SKU_TABLE, (
            f"publisher surface '{surface}' not in SKU_TABLE"
        )


def test_sku_entries_valid():
    """Every SKU entry has required fields."""
    for surface, entry in pb.SKU_TABLE.items():
        assert "tier" in entry, f"{surface}: missing tier"
        assert "sku" in entry, f"{surface}: missing sku"
        assert "free_fields" in entry, f"{surface}: missing free_fields"
        assert "paid_fields" in entry, f"{surface}: missing paid_fields"
        assert entry["tier"] in ("free", "proof"), f"{surface}: invalid tier {entry['tier']}"
        assert isinstance(entry["free_fields"], list), f"{surface}: free_fields not a list"
        assert isinstance(entry["paid_fields"], list), f"{surface}: paid_fields not a list"


def test_free_tier_no_price():
    """Free-tier cards must have empty paid_fields and no price."""
    for surface, entry in pb.SKU_TABLE.items():
        if entry["tier"] == "free":
            assert entry["paid_fields"] == [], (
                f"{surface}: free tier has non-empty paid_fields"
            )
            assert entry.get("price") is None, (
                f"{surface}: free tier has a price"
            )


def test_proof_tier_has_price():
    """Proof-tier cards must have a price object."""
    for surface, entry in pb.SKU_TABLE.items():
        if entry["tier"] == "proof":
            assert entry.get("price") is not None, (
                f"{surface}: proof tier has no price"
            )
            assert "currency" in entry["price"], f"{surface}: price missing currency"
            assert "amount" in entry["price"], f"{surface}: price missing amount"


def test_product_block_structure():
    """product_block_for returns the correct structure."""
    for surface in pb.SKU_TABLE:
        block = pb.product_block_for(surface)
        assert "sku" in block, f"{surface}: block missing sku"
        assert "tier" in block, f"{surface}: block missing tier"
        assert "free_fields" in block, f"{surface}: block missing free_fields"
        assert "paid_fields" in block, f"{surface}: block missing paid_fields"
        assert "anchors" in block, f"{surface}: block missing anchors"
        for key in ("ots", "rekor", "xrpl_memo", "evm_base"):
            assert key in block["anchors"], f"{surface}: anchors missing {key}"


def test_default_fallback():
    """Unknown surfaces get the default free tier."""
    block = pb.product_block_for("completely.unknown.surface")
    assert block["tier"] == "free"
    assert block["sku"] == "generic"


def test_retro_tag_adds_product():
    """retro_tag adds a product block to a card without one."""
    card = {"surface": "public.notice", "subject": "test"}
    result = pb.retro_tag(card)
    assert "product" in result
    assert result["product"]["tier"] == "free"


def test_retro_tag_idempotent():
    """retro_tag does not overwrite an existing product block."""
    card = {
        "surface": "public.notice",
        "product": {"sku": "custom", "tier": "proof"},
    }
    result = pb.retro_tag(card)
    assert result["product"]["sku"] == "custom"
    assert result["product"]["tier"] == "proof"


def main() -> int:
    tests = [
        test_sku_table_complete,
        test_sku_entries_valid,
        test_free_tier_no_price,
        test_proof_tier_has_price,
        test_product_block_structure,
        test_default_fallback,
        test_retro_tag_adds_product,
        test_retro_tag_idempotent,
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
