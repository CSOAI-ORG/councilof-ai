#!/usr/bin/env python3
"""G5.1 product_block schema validation.

Tests that:
1. card-v0.json and card-v1.json accept product_block as optional
2. product_block rejects literal prices (price_ref is a lookup key, not a number)
3. tier is constrained to free/proof/feed
4. existing cards without product_block still validate
5. a canary card WITH product_block validates
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    import jsonschema
except ImportError:
    print("SKIP: jsonschema not installed", file=sys.stderr)
    sys.exit(0)

ROOT = Path(__file__).resolve().parents[1]


def load_schema(name: str) -> dict:
    return json.loads((ROOT / "public" / "schema" / name).read_text())


def validate(schema: dict, instance: dict) -> list[str]:
    errors = []
    try:
        jsonschema.validate(instance=instance, schema=schema)
    except jsonschema.ValidationError as e:
        errors.append(e.message)
    return errors


def test_product_block_optional():
    """Existing cards without product_block must still validate."""
    schema = load_schema("card-v0.json")
    card = {
        "schema": "https://councilof.ai/schema/card-v0.json",
        "surface": "gspc.behavioural",
        "subject": "test-subject",
        "as_of": "2026-09-15T00:00:00Z",
        "source_urls": ["https://example.com"],
        "payload": {"axis": "test"},
        "sha256": "a" * 64,
        "unmeasured": [],
    }
    errors = validate(schema, card)
    assert not errors, f"card without product_block should validate: {errors}"
    print("PASS: product_block is optional")


def test_product_block_valid():
    """A card with a valid product_block must validate."""
    schema = load_schema("card-v0.json")
    card = {
        "schema": "https://councilof.ai/schema/card-v0.json",
        "surface": "gspc.behavioural",
        "subject": "test-subject",
        "as_of": "2026-09-15T00:00:00Z",
        "source_urls": ["https://example.com"],
        "payload": {"axis": "test"},
        "sha256": "a" * 64,
        "unmeasured": [],
        "product_block": {
            "sku": "issuance",
            "tier": "free",
            "free_fields": ["total", "staleness_days", "axis", "status"],
            "paid_fields": ["per_chain_splits", "gap_bps"],
            "price_ref": "issuance:reserve",
            "anchors": ["ots:proof.json"],
        },
    }
    errors = validate(schema, card)
    assert not errors, f"valid product_block should pass: {errors}"
    print("PASS: valid product_block accepted")


def test_product_block_rejects_literal_price():
    """product_block must NOT contain a literal price — price_ref is a lookup key."""
    schema = load_schema("card-v0.json")
    card = {
        "schema": "https://councilof.ai/schema/card-v0.json",
        "surface": "gspc.behavioural",
        "subject": "test-subject",
        "as_of": "2026-09-15T00:00:00Z",
        "source_urls": ["https://example.com"],
        "payload": {"axis": "test"},
        "sha256": "a" * 64,
        "unmeasured": [],
        "product_block": {
            "tier": "proof",
            "price_usd": 0.05,
        },
    }
    errors = validate(schema, card)
    assert errors, f"product_block with extra field (price_usd) should fail: no error"
    print("PASS: product_block rejects unknown fields (price_usd is not in the schema)")


def test_product_block_tier_constraint():
    """tier must be one of free/proof/feed."""
    schema = load_schema("card-v0.json")
    card = {
        "schema": "https://councilof.ai/schema/card-v0.json",
        "surface": "gspc.behavioural",
        "subject": "test-subject",
        "as_of": "2026-09-15T00:00:00Z",
        "source_urls": ["https://example.com"],
        "payload": {"axis": "test"},
        "sha256": "a" * 64,
        "unmeasured": [],
        "product_block": {
            "tier": "premium",
        },
    }
    errors = validate(schema, card)
    assert errors, f"tier='premium' should fail validation: no error"
    print("PASS: tier constrained to free/proof/feed")


def test_card_v1_product_block():
    """card-v1.json also accepts product_block."""
    schema = load_schema("card-v1.json")
    card = {
        "schema": "https://councilof.ai/schema/card-v1.json",
        "surface": "gspc.behavioural",
        "subject": "test-subject",
        "as_of": "2026-09-15T00:00:00Z",
        "source_urls": ["https://example.com"],
        "payload": {"axis": "test"},
        "sha256": "a" * 64,
        "unmeasured": [],
        "digest_covers": "all",
        "sig_covers": "all",
        "product_block": {
            "tier": "free",
            "free_fields": ["total", "staleness_days"],
        },
    }
    errors = validate(schema, card)
    assert not errors, f"card-v1 with product_block should validate: {errors}"
    print("PASS: card-v1 accepts product_block")


if __name__ == "__main__":
    test_product_block_optional()
    test_product_block_valid()
    test_product_block_rejects_literal_price()
    test_product_block_tier_constraint()
    test_card_v1_product_block()
    print("\nAll product_block tests passed.")
