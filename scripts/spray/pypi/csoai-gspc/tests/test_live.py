"""Tests that run against the published bytes. No fixtures, no mocks, no our-word-for-it."""
import json

from csoai_gspc import (INVALID, UNCHECKABLE, VALID, card_id, check_totals, fetch_board,
                        fetch_card, pinned_key, preimage, verify_card)

DOCUMENTED_KEY = "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38"
A_REAL_CARD = "acf6bf0356123632758bf6c98c83d81c7a8392c3b111b311317c516cc65133a4"


def test_pinned_key_is_the_documented_one():
    assert pinned_key() == DOCUMENTED_KEY


def test_totals_are_derived_not_typed():
    r = check_totals(fetch_board())
    assert r["agree"], r


def test_preimage_rule_reproduces_the_published_id():
    card = fetch_card(A_REAL_CARD)
    assert card_id(card["body"]) == card["id"]
    assert preimage(card["body"]) == json.dumps(
        card["body"], sort_keys=True, separators=(",", ":"), ensure_ascii=True
    ).encode("utf-8")


def test_a_real_card_verifies():
    v = verify_card(fetch_card(A_REAL_CARD), DOCUMENTED_KEY)
    assert v.state == VALID, v
    assert bool(v) is True


def test_one_altered_character_is_loud():
    card = fetch_card(A_REAL_CARD)
    card["body"]["axis"] = card["body"]["axis"] + "x"
    v = verify_card(card, DOCUMENTED_KEY)
    assert v.state == INVALID, v
    assert bool(v) is False


def test_a_substituted_key_is_loud():
    card = fetch_card(A_REAL_CARD)
    card["pubkey"] = "00" * 32
    assert verify_card(card, DOCUMENTED_KEY).state == INVALID


def test_unknown_algorithm_is_uncheckable_not_invalid():
    card = fetch_card(A_REAL_CARD)
    card["alg"] = "ML-DSA-65"
    v = verify_card(card, DOCUMENTED_KEY)
    assert v.state == UNCHECKABLE, v
    assert bool(v) is False   # UNCHECKABLE is never a pass
