#!/usr/bin/env python3
"""test_thin_firewall.py — verify the THIN/TEMPLATE/specimen guard in the publisher.

G1.3 THIN FIREWALL. Proves that make_card() refuses to sign a card whose
subject or tags contain "thin", "template", or "specimen". This is the
CI-visible canary: if the guard is removed, this test fails.
"""
from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Import make_card from the publisher
from importlib import import_module

pub = import_module("publish_public_root")

NOW = "2026-09-15T00:00:00Z"


def _base_leaf(**overrides):
    leaf = {
        "surface": "public.notice",
        "subject": "Normal subject",
        "as_of": NOW,
        "source_urls": ["https://example.com"],
        "payload": {"kind": "test/0.1", "status": "TEST"},
        "unmeasured": [],
        "tags": [],
    }
    leaf.update(overrides)
    return leaf


def test_normal_card_signs():
    """A normal card should be created without error."""
    card = pub.make_card(_base_leaf(), None, will_sign=True)
    assert card["sha256"] is not None


def test_thin_subject_rejected():
    """A card with 'thin' in the subject must be rejected when signing."""
    try:
        pub.make_card(
            _base_leaf(subject="This is a THIN measurement card"),
            None,
            will_sign=True,
        )
        assert False, "should have raised ValueError"
    except ValueError as e:
        assert "THIN FIREWALL" in str(e)


def test_template_subject_rejected():
    """A card with 'template' in the subject must be rejected when signing."""
    try:
        pub.make_card(
            _base_leaf(subject="Template card for testing"),
            None,
            will_sign=True,
        )
        assert False, "should have raised ValueError"
    except ValueError as e:
        assert "THIN FIREWALL" in str(e)


def test_specimen_subject_rejected():
    """A card with 'specimen' in the subject must be rejected when signing."""
    try:
        pub.make_card(
            _base_leaf(subject="Specimen output"),
            None,
            will_sign=True,
        )
        assert False, "should have raised ValueError"
    except ValueError as e:
        assert "THIN FIREWALL" in str(e)


def test_thin_tag_rejected():
    """A card with a 'thin' tag must be rejected when signing."""
    try:
        pub.make_card(
            _base_leaf(tags=["thin", "test"]),
            None,
            will_sign=True,
        )
        assert False, "should have raised ValueError"
    except ValueError as e:
        assert "THIN FIREWALL" in str(e)


def test_template_tag_rejected():
    """A card with a 'template' tag must be rejected when signing."""
    try:
        pub.make_card(
            _base_leaf(tags=["template:rlusd"]),
            None,
            will_sign=True,
        )
        assert False, "should have raised ValueError"
    except ValueError as e:
        assert "THIN FIREWALL" in str(e)


def test_thin_not_rejected_when_unsigned():
    """A THIN card is fine when NOT being signed (will_sign=False)."""
    card = pub.make_card(
        _base_leaf(subject="THIN specimen template"),
        None,
        will_sign=False,
    )
    assert card["sha256"] is not None


def main() -> int:
    tests = [
        test_normal_card_signs,
        test_thin_subject_rejected,
        test_template_subject_rejected,
        test_specimen_subject_rejected,
        test_thin_tag_rejected,
        test_template_tag_rejected,
        test_thin_not_rejected_when_unsigned,
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
    print(f"\nAll {len(tests)} tests passed — THIN FIREWALL is active")
    return 0


if __name__ == "__main__":
    sys.exit(main())
