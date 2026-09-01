"""Drive verify_signed_card on a real committed signed card + live DID."""
from __future__ import annotations

import json
import urllib.request
from pathlib import Path

from verify_card import did_card_pubkey_bytes, verify_signed_card

CARDS = Path(__file__).resolve().parents[2] / "public" / "signed" / "cards"


def test_live_did_and_repo_card_is_valid() -> None:
    req = urllib.request.Request(
        "https://csoai.org/.well-known/did.json",
        headers={"User-Agent": "csoai-verify-intern"},
    )
    did = json.loads(urllib.request.urlopen(req, timeout=20).read())
    pub = did_card_pubkey_bytes(did)
    cards = sorted(p for p in CARDS.glob("*.json") if p.name != "index.html")
    assert cards, "public/signed/cards missing from checkout"
    blob = cards[0].read_bytes()
    verdict, reason = verify_signed_card(blob, pub)
    assert verdict in ("VALID", "INVALID", "UNCHECKABLE")
    # this repo's signed atoms are the intern path; a broken DID/card must fail
    assert verdict == "VALID", reason


if __name__ == "__main__":
    test_live_did_and_repo_card_is_valid()
    print("PASS verify_signed_card on real public/signed/cards atom + live DID")
