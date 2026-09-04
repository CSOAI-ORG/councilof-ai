#!/usr/bin/env python3
"""Regression test: a dry-run plan is never represented as an OTS proof."""

from __future__ import annotations

import importlib.util
import hashlib
from pathlib import Path


SCRIPT = Path(__file__).with_name("csoai-layer0-ceremony.py")
SPEC = importlib.util.spec_from_file_location("layer0_ceremony", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def test_ots_plan_is_explicitly_unstamped() -> None:
    digest = "ab" * 32
    plan = MODULE.ots_plan(digest)
    assert plan == {
        "digest": digest,
        "status": "NOT_STAMPED",
        "proof_path": None,
        "reason": (
            "This ceremony is a dry-run. Use the authorised root witness workflow "
            "to create a parseable detached OpenTimestamps proof."
        ),
    }


def test_script_does_not_write_placeholder_ots() -> None:
    source = SCRIPT.read_text(encoding="utf-8")
    assert "OTS PENDING" not in source
    assert "ots_pending_path.write_text" not in source
    assert '"expected_eas_uid"' not in source
    assert '"expected_rekor_entry"' not in source
    assert 'layer0_path.write_text' not in source
    assert 'Oracle (live)' not in source


def test_merkle_rule_matches_public_root_v1() -> None:
    leaves = [hashlib.sha256(value).hexdigest() for value in (b"A", b"B", b"C")]
    left = hashlib.sha256(bytes.fromhex(leaves[0]) + bytes.fromhex(leaves[1])).digest()
    right_leaf = bytes.fromhex(leaves[2])
    right = hashlib.sha256(right_leaf + right_leaf).digest()
    expected = hashlib.sha256(left + right).hexdigest()
    assert MODULE.build_merkle_root(leaves) == expected
    assert MODULE.build_merkle_root([]) == hashlib.sha256(b"").hexdigest()


if __name__ == "__main__":
    test_ots_plan_is_explicitly_unstamped()
    test_script_does_not_write_placeholder_ots()
    test_merkle_rule_matches_public_root_v1()
    print("layer0 ceremony fail-closed OTS test: PASS")
