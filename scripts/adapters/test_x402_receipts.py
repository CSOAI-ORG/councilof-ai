"""The receipts.v1 adapter: what a leaf carries, and — the load-bearing half — what it must not.

Run: python3 -m pytest scripts/adapters/test_x402_receipts.py -q
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from adapters.x402_receipts import (  # noqa: E402
    CAP,
    KIND,
    SURFACE,
    canonical_bytes,
    collect,
    leaf_from_record,
    sha256_hex,
)

# The golden receipt from functions/api/_x402_receipt.test.ts — the same bytes on both sides.
GOLDEN_JWS = (
    "eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDp3ZWI6Y3NvYWkub3JnI2JvYXJkLWF0dGVzdGF0aW9uLTEifQ."
    "eyJpc3N1ZWRBdCI6MTc1NzE0NTU3NSwibmV0d29yayI6ImVpcDE1NTo4NDUzIiwicGF5ZXIiOiIweDRkQjdBQUZiZTc5N2EzOUNkNkNjNEU3YWE2NGQ5NzBGN0Y2RTAyQjciLCJyZXNvdXJjZVVybCI6Imh0dHBzOi8vY291bmNpbG9mLmFpL2FwaS9yZXF1ZXN0LWF0dGVzdGF0aW9uIiwidHJhbnNhY3Rpb24iOiIweGFjNDkyNDFiMWU2NWFiNTk0MmU1YTg0ZmY0OGRhZjUyYjhkZTJkZDk5ZDNhYzIzMTAzZDE4NTc4ODIxYjFjOTEiLCJ2ZXJzaW9uIjoxfQ."
    "zZCv-ELt4I6qFnQ8CIKop_Bnn9zUHUN54tFiFfyATtsLGclNN-znIlIIp30oQBcVPtw13eFHrutJYPpYkt58Dw"
)
PAYER = "0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7"
TX = "0xac49241b1e65ab5942e5a84ff48daf52b8de2dd99d3ac23103d18578821b1c91"


def record(**over):
    rec = {
        "schema": "csoai.x402.receipt-record/0.1",
        "receipt": {"format": "jws", "signature": GOLDEN_JWS},
        "kid": "did:web:csoai.org#board-attestation-1",
        "alg": "EdDSA",
        "payload": {
            "version": 1,
            "network": "eip155:8453",
            "resourceUrl": "https://councilof.ai/api/request-attestation",
            "payer": PAYER,
            "issuedAt": 1757145575,
            "transaction": TX,
        },
        "resource": "https://councilof.ai/api/request-attestation?subject=csoai",
        "amount_atomic": "20000",
        "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "zero_value": False,
        "self": True,
        "settled_tx_key": f"settled:tx:{TX}",
        "settlement_recorded": True,
        "issued_at": "2026-09-06T05:59:35.000Z",
    }
    rec.update(over)
    return rec


def test_a_good_record_becomes_one_receipts_v1_leaf():
    leaf, why = leaf_from_record(record())
    assert leaf is not None, why
    assert leaf["surface"] == SURFACE
    assert leaf["payload"]["kind"] == KIND
    assert leaf["payload"]["receipt_jws_sha256"] == sha256_hex(GOLDEN_JWS)


def test_THE_PRIVACY_INVARIANT_no_payer_and_no_jws_anywhere_in_the_leaf():
    """If this test ever goes green with the payer in it, the root has published every buyer."""
    leaf, _ = leaf_from_record(record())
    blob = json.dumps(leaf, ensure_ascii=False)
    assert PAYER not in blob
    assert PAYER.lower() not in blob.lower()
    assert GOLDEN_JWS not in blob
    assert GOLDEN_JWS[:40] not in blob
    # and what IS there is a commitment a buyer can reproduce from their own copy
    assert leaf["payload"]["payer_hash"] == sha256_hex(PAYER.lower())


def test_the_transaction_is_published_because_the_chain_already_has_it():
    leaf, _ = leaf_from_record(record())
    assert leaf["payload"]["transaction"] == TX


def test_a_privacy_minimal_receipt_with_no_transaction_still_makes_a_leaf():
    r = record()
    del r["payload"]["transaction"]
    leaf, why = leaf_from_record(r)
    assert leaf is not None, why
    assert "transaction" not in leaf["payload"]


def test_self_and_zero_value_ride_on_the_leaf_so_a_count_is_never_revenue():
    leaf, _ = leaf_from_record(record(self=True, zero_value=True))
    assert leaf["payload"]["self"] is True
    assert leaf["payload"]["zero_value"] is True
    assert any("revenue" in s for s in leaf["payload"]["not_attested"])


def test_self_unjudged_is_null_never_guessed_as_false():
    leaf, _ = leaf_from_record(record(self=None))
    assert leaf["payload"]["self"] is None


def test_it_refuses_rather_than_inventing():
    assert leaf_from_record({"schema": "something.else"})[0] is None
    assert leaf_from_record(record(receipt={"format": "eip712", "signature": "0xabc"}))[0] is None
    r = record()
    r["payload"]["payer"] = "not-an-address"
    assert leaf_from_record(r)[0] is None
    r = record()
    r["payload"]["resourceUrl"] = "http://insecure.example/x"
    assert leaf_from_record(r)[0] is None
    r = record()
    r["payload"]["transaction"] = "0xnothex"
    assert leaf_from_record(r)[0] is None


def test_the_leaf_fits_the_3kb_card_cap_with_room_to_spare():
    leaf, _ = leaf_from_record(record())
    assert len(canonical_bytes(leaf["payload"])) <= CAP


def test_collect_on_a_tree_with_no_kv_and_no_mirrors_says_so_and_yields_nothing(tmp_path):
    out = collect(tmp_path)
    assert out["leaves"] == []
    assert out["sidecar"]["kv"] == "unconfigured"
    assert out["sidecar"]["n_skipped"] == 0


def test_a_mirror_written_by_mirror_is_readable_by_read_mirrors(tmp_path):
    """The round trip, asserted. The first version of mirror() spread the record OVER its own
    marker key, so every file it wrote was skipped on the way back in and no landed leaf kept
    landing. A writer and a reader that disagree about one key is not a thing review catches."""
    from adapters.x402_receipts import mirror, read_mirrors

    assert mirror(tmp_path, [record()]) == 1
    assert len(read_mirrors(tmp_path)) == 1


def test_collect_reads_mirrors_when_kv_is_dark(tmp_path):
    d = tmp_path / "public" / "interop" / "x402-receipts"
    d.mkdir(parents=True)
    (d / f"{sha256_hex(GOLDEN_JWS)}.json").write_text(
        json.dumps({**record(), "mirror_schema": "csoai.x402-receipt-mirror/0.1"}), encoding="utf-8"
    )
    out = collect(tmp_path)
    assert out["sidecar"]["n_mirrors"] == 1
    assert len(out["leaves"]) == 1
    assert out["sidecar"]["n_self"] == 1
