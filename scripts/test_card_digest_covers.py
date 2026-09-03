"""The leaf digest must cover the whole card, not just its payload.

Until 2026-09-03 `make_card` did `digest = payload_sha256(leaf["payload"])`, so
these fields sat OUTSIDE the merkle tree entirely:

    subject · source_urls · as_of · did · surface · tags · unmeasured

Demonstrated against the real code before the fix:

    subject honest   : "Qwen/Qwen3-30B governance run"
    subject tampered : "TOTALLY DIFFERENT CLAIM"
    source  tampered : "https://evil.example/fake"
    leaf digest      : e52f814957f02a0aef7de67ca93250f9…   IDENTICAL

A card's claim text and its evidence URL could both be rewritten and the leaf,
the merkle root and the inclusion proof would all still verify. For a body whose
product is "follow the link and check", the link was the thing not covered.

card-v1 binds every field a relying party reads. card-v0 cards already inside a
published root keep their payload-only rule — they are superseded, never edited.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from publish_public_root import (  # noqa: E402
    CARD_SCHEMA,
    DIGEST_EXCLUDES,
    make_card,
    payload_sha256,
)

BASE = {
    "surface": "public.notice",
    "as_of": "2026-09-03T00:00:00Z",
    "payload": {"axis": "governance", "status": "MEASURED", "n": 237},
    "subject": "Qwen/Qwen3-30B governance run",
    "source_urls": ["https://councilof.ai/signed/cards/abc.json"],
    "tags": [],
    "unmeasured": [],
}


def test_rewriting_the_subject_changes_the_digest():
    honest = make_card(BASE, "sig")
    tampered = make_card(dict(BASE, subject="TOTALLY DIFFERENT CLAIM"), "sig")
    assert honest["sha256"] != tampered["sha256"], "subject is not covered by the digest"


def test_rewriting_the_evidence_url_changes_the_digest():
    honest = make_card(BASE, "sig")
    tampered = make_card(dict(BASE, source_urls=["https://evil.example/fake"]), "sig")
    assert honest["sha256"] != tampered["sha256"], "source_urls is not covered by the digest"


def test_the_v0_hole_is_real_and_is_why_this_exists():
    # payload alone is identical across both — this is what v0 hashed
    tampered = dict(BASE, subject="TOTALLY DIFFERENT CLAIM",
                    source_urls=["https://evil.example/fake"])
    assert payload_sha256(BASE["payload"]) == payload_sha256(tampered["payload"])


def test_card_declares_what_its_digest_covers():
    card = make_card(BASE, "sig")
    assert card["digest_covers"] == "whole-card-except-sha256-and-sig_ed25519"
    assert card["schema"] == CARD_SCHEMA
    assert CARD_SCHEMA.endswith("card-v1.json"), "v1 is the schema that binds the whole card"


def test_digest_excludes_only_itself_and_the_signature():
    # a field cannot be inside its own hash; nothing else may be excluded
    assert set(DIGEST_EXCLUDES) == {"sha256", "sig_ed25519"}
