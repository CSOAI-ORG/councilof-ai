"""Tests for meok-sovereign-wallet-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_wal_")
os.environ["SOV_WAL_KEY"] = _TEST + "/k.pem"
from meok_sovereign_wallet_mcp import (
    wallet_create, wallet_sign, wallet_broadcast,
    wallet_balance, wallet_export,
    _WALLETS, _SIGNATURES,
)


def reset():
    _WALLETS.clear()
    _SIGNATURES.clear()


def test_wallet_create():
    reset()
    w = wallet_create("did:csoai:nicholas-001")
    assert w["sovereign_only"] is True
    assert w["bft_required_above_usd"] == 10_000.0
    assert w["care_floor"] == 0.95


def test_wallet_sign_small():
    """Sign tx under $10k — no BFT required."""
    reset()
    wallet = wallet_create("did:csoai:nicholas-001")
    wid = wallet["wallet_id"]
    sig = wallet_sign(wid, {"amount_usd": 100, "to": "did:csoai:alice", "memo": "test"})
    assert sig["wallet_id"] == wid
    assert sig["amount_usd"] == 100


def test_wallet_sign_high_no_bft():
    """Sign tx > $10k without BFT — must reject."""
    reset()
    wallet = wallet_create("did:csoai:nicholas-001")
    wid = wallet["wallet_id"]
    sig = wallet_sign(wid, {"amount_usd": 50_000, "to": "did:csoai:bob"})
    assert "error" in sig
    assert "BFT" in sig["error"]


def test_wallet_sign_high_with_bft_pass():
    """Sign tx > $10k with 3 YES votes — must succeed."""
    reset()
    wallet = wallet_create("did:csoai:nicholas-001")
    wid = wallet["wallet_id"]
    votes = [{"voter": "A", "choice": "YES"},
             {"voter": "B", "choice": "YES"},
             {"voter": "C", "choice": "YES"}]
    sig = wallet_sign(wid, {"amount_usd": 50_000, "to": "did:csoai:bob"}, bft_votes=votes)
    assert sig["amount_usd"] == 50_000
    assert "signature_id" in sig


def test_wallet_sign_high_with_bft_fail():
    """BFT rejects (only 2 YES) — must reject."""
    reset()
    wallet = wallet_create("did:csoai:nicholas-001")
    wid = wallet["wallet_id"]
    votes = [{"voter": "A", "choice": "YES"},
             {"voter": "B", "choice": "YES"},
             {"voter": "C", "choice": "NO"}]
    sig = wallet_sign(wid, {"amount_usd": 50_000, "to": "did:csoai:bob"}, bft_votes=votes)
    assert "error" in sig


def test_wallet_broadcast():
    reset()
    wallet = wallet_create("did:csoai:nicholas-001")
    wid = wallet["wallet_id"]
    sig = wallet_sign(wid, {"amount_usd": 100, "to": "did:csoai:bob"})
    bc = wallet_broadcast(sig["signature_id"])
    assert bc["broadcast_status"] == "BROADCASTED"
    assert "tx_hash" in bc


def test_wallet_broadcast_unknown_sig():
    r = wallet_broadcast("nonexistent")
    assert "error" in r


def test_wallet_balance():
    reset()
    wallet = wallet_create("did:csoai:nicholas-001")
    wid = wallet["wallet_id"]
    bal = wallet_balance(wid)
    assert bal["balance_sovereign"] == 0.0
    assert bal["balance_usd"] == 0.0


def test_wallet_balance_audit_trail():
    reset()
    wallet = wallet_create("did:csoai:nicholas-001")
    wid = wallet["wallet_id"]
    wallet_sign(wid, {"amount_usd": 1.0, "to": "did:csoai:alice"})
    wallet_sign(wid, {"amount_usd": 2.0, "to": "did:csoai:bob"})
    bal = wallet_balance(wid)
    assert bal["signatures_count"] == 2


def test_wallet_balance_unknown():
    r = wallet_balance("nonexistent")
    assert "error" in r


def test_wallet_export_no_bft():
    reset()
    wallet = wallet_create("did:csoai:nicholas-001")
    wid = wallet["wallet_id"]
    r = wallet_export(wid, "password123")
    assert "error" in r
    assert "BFT" in r["error"]


def test_wallet_export_with_bft():
    reset()
    wallet = wallet_create("did:csoai:nicholas-001")
    wid = wallet["wallet_id"]
    votes = [{"voter": "A", "choice": "YES"},
             {"voter": "B", "choice": "YES"},
             {"voter": "C", "choice": "YES"}]
    r = wallet_export(wid, "password123", bft_votes=votes)
    assert r["encrypted"] is True


def test_wallet_export_unknown():
    r = wallet_export("nonexistent", "pw")
    assert "error" in r


def test_no_external_deps():
    import meok_sovereign_wallet_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset()
    w = wallet_create("did:test")
    wid = w["wallet_id"]
    for r in [wallet_create("did:test"), wallet_sign(wid, {"amount_usd": 1, "to": "x"}),
              wallet_balance(wid)]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_lifecycle():
    """Create → sign small → broadcast → sign large with BFT → export with BFT → balance."""
    reset()
    wallet = wallet_create("did:csoai:lifecycle")
    wid = wallet["wallet_id"]

    sig_small = wallet_sign(wid, {"amount_usd": 100, "to": "did:csoai:alice", "memo": "lunch"})
    bc = wallet_broadcast(sig_small["signature_id"])
    assert bc["broadcast_status"] == "BROADCASTED"

    votes = [{"voter": "A", "choice": "YES"},
             {"voter": "B", "choice": "YES"},
             {"voter": "C", "choice": "YES"}]
    sig_large = wallet_sign(wid, {"amount_usd": 50_000, "to": "did:csoai:bob", "memo": "rent"},
                            bft_votes=votes)
    assert sig_large["amount_usd"] == 50_000

    exp = wallet_export(wid, "password", bft_votes=votes)
    assert exp["encrypted"] is True

    bal = wallet_balance(wid)
    assert bal["signatures_count"] == 2
