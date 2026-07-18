"""Tests for meok-sovereign-x402-payment-mcp."""
import os, tempfile, hashlib

_TEST_DIR = tempfile.mkdtemp(prefix="sov_x402_test_")
os.environ["SOV_X402_KEY"] = os.path.join(_TEST_DIR, "key.pem")

from meok_sovereign_x402_payment_mcp import (
    x402_challenge, x402_verify_payment, x402_settle, x402_price_list,
    DEFAULT_PRICING, VERSION, PROTOCOL,
)


def test_price_list_basic():
    pl = x402_price_list()
    assert pl["protocol"] == PROTOCOL
    assert pl["currency"] == "USDC"
    assert len(pl["tools"]) > 5
    # All tool names should be valid
    names = [t["tool"] for t in pl["tools"]]
    assert "sov_create_passport" in names
    assert "sov_incident_killswitch" in names  # free


def test_killswitch_is_free():
    pl = x402_price_list()
    killswitch = next(t for t in pl["tools"] if t["tool"] == "sov_incident_killswitch")
    assert killswitch["price_usdc_micro"] == 0


def test_challenge_basic():
    c = x402_challenge("sov_create_passport", payer_did="did:csoai:agent-1")
    assert c["protocol"] == PROTOCOL
    assert c["tool"] == "sov_create_passport"
    assert c["price_usdc_micro"] == 100_000
    assert c["price_usdc"] == 0.1
    assert c["currency"] == "USDC"
    assert c["payer_did"] == "did:csoai:agent-1"
    assert c["http_status"] == 402
    assert "kid" in c and "sig" in c
    assert c["payment_required_url"].startswith("https://proofof.ai/x402/")


def test_challenge_unknown_tool():
    c = x402_challenge("sov_nonexistent", payer_did="did:csoai:agent-1")
    assert "error" in c
    assert "known_tools" in c


def test_settle_creates_receipt():
    c = x402_challenge("sov_create_receipt", payer_did="did:csoai:agent-1")
    r = x402_settle(c, tx_hash="0xabc123")
    assert r["status"] == "paid"
    assert r["challenge_id"] == c["challenge_id"]
    assert r["tx_hash"] == "0xabc123"
    assert "kid" in r and "sig" in r


def test_settle_with_bft_council():
    c = x402_challenge("sov_attest", payer_did="did:csoai:agent-1")
    r = x402_settle(c, tx_hash="0xdef456", bft_council_id="council-12of1")
    assert r["bft_council_id"] == "council-12of1"


def test_verify_payment_valid():
    c = x402_challenge("sov_create_passport", payer_did="did:csoai:agent-1")
    r = x402_settle(c, tx_hash="0xabc")
    v = x402_verify_payment(r, expected_tool="sov_create_passport", expected_payer="did:csoai:agent-1")
    assert v["valid"] is True
    assert v["errors"] == []


def test_verify_payment_tool_mismatch():
    c = x402_challenge("sov_create_passport", payer_did="did:csoai:agent-1")
    r = x402_settle(c, tx_hash="0xabc")
    v = x402_verify_payment(r, expected_tool="sov_verify_passport", expected_payer="did:csoai:agent-1")
    assert v["valid"] is False
    assert any("tool mismatch" in e for e in v["errors"])


def test_verify_payment_payer_mismatch():
    c = x402_challenge("sov_create_passport", payer_did="did:csoai:agent-1")
    r = x402_settle(c, tx_hash="0xabc")
    v = x402_verify_payment(r, expected_tool="sov_create_passport", expected_payer="did:csoai:attacker")
    assert v["valid"] is False
    assert any("payer mismatch" in e for e in v["errors"])


def test_all_tools_priced():
    pl = x402_price_list()
    for t in pl["tools"]:
        assert t["price_usdc_micro"] >= 0
        assert t["price_usdc"] == t["price_usdc_micro"] / 1_000_000


def test_challenge_id_unique_per_call():
    c1 = x402_challenge("sov_create_passport", payer_did="did:csoai:a")
    c2 = x402_challenge("sov_create_passport", payer_did="did:csoai:b")
    assert c1["challenge_id"] != c2["challenge_id"]


def test_challenge_includes_payment_url():
    c = x402_challenge("sov_create_passport", payer_did="did:csoai:agent-1")
    assert "payment_required_url" in c
    assert "proofof.ai" in c["payment_required_url"]
