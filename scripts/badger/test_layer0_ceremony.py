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


def test_every_writer_of_the_ceremony_emits_its_own_disclaimer() -> None:
    """The honesty boundary must live in the PRODUCER, not only in the committed JSON.

    scripts/evidence-integrity-gate.mjs blocks the deploy unless
    public/interop/layer0-ceremony.json carries status == "DISCOVERY_POINTER" and
    claim_boundary.is_a_receipt / .is_a_bitcoin_anchor == false. Those fields were once
    hand-added to the JSON while no generator emitted them, so every regeneration silently
    stripped the file's own disclaimer. That fired on 2026-09-05: a run at 04:31 rebuilt the
    ceremony without them and the deploy failed with "Layer 0 discovery path presents itself
    as a receipt or Bitcoin anchor".

    This test bites: with the emission removed from csoai-pqc-and-ots.py it fails, which is
    exactly the state master was in when the deploy broke.
    """
    here = Path(__file__).parent
    # A writer that BUILDS the document from scratch must state the boundary itself. A writer
    # that reads-and-updates (json.loads then mutate) preserves whatever is already there.
    for name in ("csoai-pqc-and-ots.py",):
        text = (here / name).read_text()
        assert "csoai.layer0-ceremony/0.1" in text, f"{name} no longer writes the ceremony"
        assert '"status": "DISCOVERY_POINTER"' in text, (
            f"{name} rebuilds layer0-ceremony.json without status=DISCOVERY_POINTER; "
            "every run of it will strip the disclaimer and block the deploy"
        )
        assert '"is_a_receipt": False' in text, f"{name} omits claim_boundary.is_a_receipt"
        assert '"is_a_bitcoin_anchor": False' in text, (
            f"{name} omits claim_boundary.is_a_bitcoin_anchor"
        )


def test_the_served_ceremony_still_carries_the_boundary() -> None:
    """And the artifact currently in the deploy tree must satisfy the gate's exact conditions."""
    import json

    doc = json.loads(
        (Path(__file__).parents[2] / "public" / "interop" / "layer0-ceremony.json").read_text()
    )
    assert doc.get("status") == "DISCOVERY_POINTER"
    assert doc.get("claim_boundary", {}).get("is_a_receipt") is False
    assert doc.get("claim_boundary", {}).get("is_a_bitcoin_anchor") is False
