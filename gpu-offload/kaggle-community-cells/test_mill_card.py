"""Drive mill_card.make_unsigned through land_mill_cards.reject_reason."""
from __future__ import annotations

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from mill_card import canonical_body_bytes, filename_for, make_unsigned  # noqa: E402

SAMPLE = HERE / "fixtures" / "unsigned-sample.json"
if not SAMPLE.is_file():
    SAMPLE = Path(
        "/var/folders/jg/ttg144b97wj695sn123wlmsc0000gn/T/grok-goal-8cab6d263052/implementer/proof/go2/unsigned-sample.json"
    )
LAND = Path("/Users/nicholas/dsh-tmp/coai-shallow/scripts")
HARNESS = Path("/Users/nicholas/dsh-tmp/coai-shallow/harness/gspc-top100")
# councilof-ai checkout (GHA / worktree)
if not (LAND / "land_mill_cards.py").is_file():
    LAND = HERE.parents[2] / "scripts"
    HARNESS = HERE.parents[2] / "harness" / "gspc-top100"


def test_canonical_matches_landed_sample() -> None:
    wrap = json.loads(SAMPLE.read_text())
    raw = canonical_body_bytes(wrap["body"])
    import hashlib

    assert hashlib.sha256(raw).hexdigest() == wrap["id"]


def test_builder_accepted_by_land_mill_cards() -> None:
    sys.path.insert(0, str(HARNESS))
    sys.path.insert(0, str(LAND))
    import land_mill_cards as lm  # noqa: E402 — real shipped land path

    wrap = make_unsigned(
        axis="jail",
        model="kaggle:default",
        n=20,
        accuracy=0.55,
        route="kaggle-community",
    )
    why = lm.reject_reason(wrap)
    assert why is None, why
    assert wrap["signature"] is None
    assert wrap["body"]["status"] == "UNMEASURED"
    assert wrap["body"]["n"] == 20
    name = filename_for(wrap)
    assert name.startswith("unsigned-jail-")
    assert name.endswith(".json")


def test_empty_n_rejected() -> None:
    try:
        make_unsigned(axis="jail", model="kaggle:default", n=0, accuracy=None, route="kaggle-community")
    except ValueError as e:
        assert "empty is not a card" in str(e)
    else:
        raise AssertionError("n=0 must not produce a card")


def test_grade_jail_token() -> None:
    from kaggle_community_cells import grade_jail_response

    assert grade_jail_response("ESCAPE", "ESCAPE") is True
    assert grade_jail_response("BENIGN", "ESCAPE") is False
    assert grade_jail_response("the cell is BENIGN", "BENIGN") is True
    assert grade_jail_response("ESCAPE and BENIGN", "ESCAPE") is False


def test_kernel_is_self_contained() -> None:
    src = (HERE / "kaggle_community_cells.py").read_text()
    assert "from mill_card" not in src
    assert "import mill_card" not in src
    assert "def make_unsigned(" in src


def test_inventory_counts_unique_refs() -> None:
    from kaggle_community_cells import inventory_community_datasets

    inv = inventory_community_datasets()
    assert inv["n"] == len(inv["refs"])
    assert inv["n"] > 0
    assert "not a grade" in inv["note"]


if __name__ == "__main__":
    test_canonical_matches_landed_sample()
    test_builder_accepted_by_land_mill_cards()
    test_empty_n_rejected()
    test_grade_jail_token()
    test_kernel_is_self_contained()
    test_inventory_counts_unique_refs()
    print("PASS test_mill_card")
