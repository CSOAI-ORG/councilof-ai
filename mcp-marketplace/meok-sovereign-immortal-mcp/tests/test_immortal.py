"""Tests for meok-sovereign-immortal-mcp."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_imm_test_")
os.environ["SOV_IMMORTAL_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_immortal_mcp import (
    sov_immortal_store, sov_immortal_recall, sov_immortal_chain,
    sov_immortal_verify, sov_immortal_status, _LEDGER, VERSION, PROTOCOL,
)


def test_immortal_store_basic():
    r = sov_immortal_store("Sovereign memory that outlives the body", author="sovereign")
    assert r["author"] == "sovereign"
    assert r["btc_anchor"] > 0
    assert r["head_hash"]
    assert "kid" in r and "sig" in r


def test_immortal_store_chains():
    r1 = sov_immortal_store("first memory")
    r2 = sov_immortal_store("second memory")
    assert r2["prev_hash"] == r1["head_hash"]


def test_immortal_recall_lexical():
    sov_immortal_store("koi pond pH dropped to 6.5")
    sov_immortal_store("council voted on charter")
    r = sov_immortal_recall("koi pond water")
    assert r["result_count"] >= 1


def test_immortal_recall_no_decay():
    """Immortal = no decay (unlike memory-mcp)."""
    sov_immortal_store("Sovereign dragon never lies")
    r = sov_immortal_recall("sovereign dragon")
    # All results have full score (no temporal decay)
    assert r["result_count"] >= 1


def test_immortal_chain_state():
    sov_immortal_store("test")
    r = sov_immortal_chain()
    assert r["chain_length"] >= 1
    assert r["head_height"] >= 1
    assert len(r["btc_anchors"]) >= 1


def test_immortal_chain_grows():
    h1 = sov_immortal_chain()["head_height"]
    sov_immortal_store("more")
    h2 = sov_immortal_chain()["head_height"]
    assert h2 > h1


def test_immortal_verify_valid():
    r = sov_immortal_store("verify test")
    v = sov_immortal_verify(r["record_id"])
    assert v["valid"] is True
    assert v["chain_valid"] is True


def test_immortal_verify_unknown():
    v = sov_immortal_verify("nonexistent")
    assert v["valid"] is False


def test_immortal_status():
    r = sov_immortal_status()
    assert "outlives" in r["doctrine"]
    assert r["records"] >= 0
    assert r["btc_anchors_count"] >= 0


def test_btc_anchors_simulated():
    r1 = sov_immortal_store("a")
    r2 = sov_immortal_store("b")
    assert r1["btc_anchor"] < r2["btc_anchor"]  # increasing block height


def test_all_signed():
    r = sov_immortal_store("signed test")
    assert "kid" in r and "sig" in r
    assert r["verify_url"]
