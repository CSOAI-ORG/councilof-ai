"""The Layer 0 liveness atom must pass the staged-leaf intake unchanged, and be a read, not a rating."""
from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parents[1]))

import layer0_liveness_reader as r  # noqa: E402
from scripts.adapters import staged_leaves  # noqa: E402


def _reading():
    return {
        "did_json_http": 200, "did_key_present": True, "root_http": 200, "root_card_count": 297,
        "root_as_of": "2026-09-14T01:03:07Z", "root_merkle_prefix": "2d29b18c00000000", "pointer_http": 200,
        "pointer_match": True, "rekor_state": "WITNESSED", "ots_state": "STAMPED_PENDING_BITCOIN",
    }


def test_atom_passes_the_staged_leaf_intake_and_is_probed():
    atom = r.build_atom(_reading(), "PASS", "2026-09-14T03:00:00Z")
    assert staged_leaves._check(atom) is None, staged_leaves._check(atom)
    assert atom["payload"]["state"] == "PROBED"
    assert atom["payload"]["kind"] == "csoai.layer0.liveness/0.1"
    assert len(r.canonical_bytes(atom)) <= 3072


def test_sha256_binds_the_payload_and_changes_with_it():
    a = r.build_atom(_reading(), "PASS", "2026-09-14T03:00:00Z")
    b = r.build_atom({**_reading(), "ots_state": "CONFIRMED_BITCOIN"}, "PASS", "2026-09-14T03:00:00Z")
    assert a["sha256"] != b["sha256"]
    assert a["sha256"] == staged_leaves.hashlib.sha256(staged_leaves.canonical_bytes(a["payload"])).hexdigest()


def test_no_verdict_words_and_gate_is_recorded_not_asserted():
    atom = r.build_atom(_reading(), "FAIL", "2026-09-14T03:00:00Z")
    assert staged_leaves._check(atom) is None
    assert atom["payload"]["release_gate"] == "FAIL"
    assert "certif" not in r.canonical_bytes(atom).decode().lower()
