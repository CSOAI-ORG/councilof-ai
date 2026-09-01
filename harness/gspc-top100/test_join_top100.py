"""Drive join_model on the real frozen census + real signed-card model tags.

Fails if two Hub ids share a card id, or if a MEASURED join's card.model is a
size/suffix mismatch of the Hub id (exact colon/dash identity only).
"""
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

from join_top100 import identity_key, index_cards_by_identity, join_model
from verify_card import did_card_pubkey_bytes, verify_signed_card

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
FROZEN = HERE / "frozen-top100.json"
CARDS = ROOT / "public" / "signed" / "cards"


def _valid_card_rows() -> list[dict]:
    import urllib.request

    req = urllib.request.Request(
        "https://csoai.org/.well-known/did.json",
        headers={"User-Agent": "csoai-join-test"},
    )
    did = json.loads(urllib.request.urlopen(req, timeout=20).read())
    pub = did_card_pubkey_bytes(did)
    rows = []
    for fp in sorted(CARDS.glob("*.json")):
        blob = fp.read_bytes()
        verdict, reason = verify_signed_card(blob, pub)
        wrap = json.loads(blob)
        body = wrap.get("body") if isinstance(wrap.get("body"), dict) else {}
        rows.append(
            {
                "id": wrap.get("id"),
                "verdict": verdict,
                "reason": reason,
                "model": body.get("model"),
                "axis": body.get("axis"),
            }
        )
    valid = [r for r in rows if r["verdict"] == "VALID" and r.get("model") and r.get("id")]
    assert valid, "need VALID cards with model tags"
    return valid


def test_join_model_exact_identity_no_shared_card_ids() -> None:
    frozen = json.loads(FROZEN.read_text(encoding="utf-8"))
    models = frozen["models"]
    assert len(models) == frozen["sample_size"]
    cards = _valid_card_rows()
    by_key = index_cards_by_identity(cards)

    measured: dict[str, list[str]] = {}
    card_owners: dict[str, str] = {}
    for row in models:
        mid = row["model_id"]
        hits = join_model(mid, by_key)
        for h in hits:
            assert h["verdict"] == "VALID"
            assert identity_key(h["model"]) == identity_key(mid), (
                f"size/suffix mismatch: hub={mid!r} card.model={h['model']!r}"
            )
            cid = h["id"]
            owner = card_owners.get(cid)
            if owner is not None and owner != mid:
                raise AssertionError(
                    f"card {cid} joined to both {owner!r} and {mid!r}"
                )
            card_owners[cid] = mid
            measured.setdefault(mid, []).append(cid)

    # Invariant: distinct Hub ids never share a card id.
    inverted: dict[str, set[str]] = defaultdict(set)
    for mid, cids in measured.items():
        for cid in cids:
            inverted[cid].add(mid)
    shared = {cid: ids for cid, ids in inverted.items() if len(ids) > 1}
    assert not shared, f"shared card_ids across Hub ids: {shared}"


if __name__ == "__main__":
    test_join_model_exact_identity_no_shared_card_ids()
    print("PASS join_model exact identity on frozen-top100 + real VALID cards")
