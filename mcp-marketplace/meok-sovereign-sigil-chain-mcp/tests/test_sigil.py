"""Tests for meok-sovereign-sigil-chain-mcp (Ed25519 every hop)."""
import os, tempfile
import sys
_TEST_DIR = tempfile.mkdtemp(prefix="sov_sigil_test_")
os.environ["SOV_SIGIL_KEY"] = os.path.join(_TEST_DIR, "key.pem")
# Reset state for each test
import importlib
import meok_sovereign_sigil_chain_mcp as sigil_mod
from meok_sovereign_sigil_chain_mcp import (
    sigil_emit, sigil_verify, sigil_chain, sigil_anchor, sigil_history,
)


def reset_chain():
    """Reset the in-memory chain between tests."""
    sigil_mod._CHAIN.clear()


def test_emit_basic():
    r = sigil_emit("dragon", "audit_eu_ai_act", {"code": "test"})
    assert "kid" in r
    assert "sig" in r
    assert "ts" in r
    assert r["actor"] == "dragon"
    assert r["hop_index"] == 1


def test_emit_chain_grows():
    reset_chain()
    sigil_emit("a", "test", {})
    sigil_emit("b", "test", {})
    r = sigil_chain()
    assert r["chain_length"] == 2


def test_emit_prev_hash_links():
    s1 = sigil_emit("a", "test", {})
    s2 = sigil_emit("b", "test", {})
    assert s2["prev_hash"] == s1["hash"]


def test_verify_valid_sigil():
    s = sigil_emit("dragon", "audit", {"x": 1})
    r = sigil_verify(s["kid"], s["sig"], {
        "protocol": s["protocol"], "version": s["version"],
        "actor": s["actor"], "action": s["action"],
        "payload": s["payload"], "hop_index": s["hop_index"],
    })
    assert r["valid"] is True


def test_verify_invalid_sigil():
    s = sigil_emit("dragon", "audit", {"x": 1})
    r = sigil_verify(s["kid"], "wrong_sig", {
        "protocol": s["protocol"], "actor": s["actor"],
        "action": s["action"], "payload": s["payload"],
        "hop_index": s["hop_index"],
    })
    assert r["valid"] is False


def test_chain_state():
    reset_chain()
    sigil_emit("a", "x", {})
    sigil_emit("b", "y", {})
    r = sigil_chain()
    assert r["chain_length"] == 2
    assert r["head_actor"] == "b"
    assert r["head_action"] == "y"
    assert r["verified"] is True


def test_chain_anchored():
    r = sigil_chain()
    assert r["anchored"] == "bitcoin"


def test_anchor_basic():
    r = sigil_anchor("hello world")
    assert "bitcoin_tx_id" in r
    assert r["bitcoin_tx_id"].startswith("0x")
    assert "data_hash" in r


def test_history_all():
    reset_chain()
    sigil_emit("a", "x", {})
    sigil_emit("b", "y", {})
    r = sigil_history()
    assert r["count"] == 2


def test_history_filtered_by_actor():
    sigil_emit("dragon", "audit", {})
    sigil_emit("scribe", "audit", {})
    sigil_emit("dragon", "deploy", {})
    r = sigil_history(actor="dragon")
    assert all(m["actor"] == "dragon" for m in r["matches"])


def test_history_filtered_by_action():
    sigil_emit("a", "audit", {})
    sigil_emit("a", "deploy", {})
    r = sigil_history(action="audit")
    assert all(m["action"] == "audit" for m in r["matches"])


def test_history_limit():
    for i in range(10):
        sigil_emit("a", f"test_{i}", {})
    r = sigil_history(limit=3)
    assert r["count"] <= 3


def test_no_external_deps():
    import meok_sovereign_sigil_chain_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    s = sigil_emit("a", "x", {})
    assert "kid" in s and "sig" in s and "ts" in s and "hash" in s
    c = sigil_chain()
    assert "kid" in c and "sig" in c and "ts" in c
    a = sigil_anchor("data")
    assert "kid" in a and "sig" in a and "ts" in a
    h = sigil_history()
    assert "kid" in h and "sig" in h and "ts" in h


def test_every_emit_gets_hash():
    s = sigil_emit("a", "x", {"v": 1})
    assert len(s["hash"]) == 64
    assert len(s["prev_hash"]) == 64
    assert s["hash"] != s["prev_hash"]


def test_doctrine():
    r = sigil_anchor("test")
    assert "Real impl broadcasts to Bitcoin mainnet" in r["doctrine"]


def test_chain_limit():
    for i in range(5):
        sigil_emit("a", f"x_{i}", {})
    r = sigil_chain(limit=3)
    assert len(r["recent"]) <= 3


def test_sigil_with_complex_payload():
    payload = {"nested": {"deep": {"value": [1, 2, 3]}}}
    s = sigil_emit("a", "test", payload)
    assert s["payload"]["nested"]["deep"]["value"] == [1, 2, 3]