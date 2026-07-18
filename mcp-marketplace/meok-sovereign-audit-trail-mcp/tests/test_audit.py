"""Tests for meok-sovereign-audit-trail-mcp (regulator-grade audit log)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_at_test_")
os.environ["SOV_AT_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_audit_trail_mcp import (
    audit_log, audit_get, audit_replay, audit_chain, audit_export,
    _LOG,
)


def reset_log():
    _LOG.clear()


def test_log_basic():
    reset_log()
    r = audit_log("dragon", "audit_eu_ai_act", {"code": "test"})
    assert r["actor"] == "dragon"
    assert r["action"] == "audit_eu_ai_act"
    assert "hash" in r
    assert "sig" in r


def test_log_chained():
    reset_log()
    e1 = audit_log("dragon", "test1")
    e2 = audit_log("scribe", "test2")
    assert e2["prev_hash"] == e1["hash"]


def test_get_existing():
    reset_log()
    e = audit_log("dragon", "test")
    r = audit_get(e["entry_id"])
    assert r["actor"] == "dragon"


def test_get_unknown():
    reset_log()
    r = audit_get("nonexistent")
    assert "error" in r


def test_replay_all():
    reset_log()
    for i in range(5):
        audit_log("dragon", f"test_{i}")
    r = audit_replay(limit=10)
    assert r["replayed"] == 5


def test_replay_with_start_id():
    reset_log()
    e1 = audit_log("dragon", "first")
    e2 = audit_log("scribe", "second")
    e3 = audit_log("lex", "third")
    r = audit_replay(start_id=e2["entry_id"])
    assert r["replayed"] == 2  # second + third


def test_replay_limit():
    reset_log()
    for i in range(10):
        audit_log("dragon", f"test_{i}")
    r = audit_replay(limit=3)
    assert r["replayed"] == 3


def test_chain_empty():
    reset_log()
    r = audit_chain()
    assert r["length"] == 0
    assert r["verified"] is True


def test_chain_grows():
    reset_log()
    audit_log("a", "x")
    audit_log("b", "y")
    r = audit_chain()
    assert r["length"] == 2
    assert r["head_actor"] == "b"
    assert r["verified"] is True


def test_export_json():
    reset_log()
    for i in range(3):
        audit_log("dragon", f"test_{i}")
    r = audit_export(format="json")
    assert r["format"] == "json"
    assert r["count"] == 3


def test_export_csv():
    reset_log()
    audit_log("dragon", "test", {"x": 1})
    r = audit_export(format="csv")
    assert r["format"] == "csv"
    assert "actor" in r["data"]


def test_export_parquet():
    reset_log()
    audit_log("dragon", "test")
    r = audit_export(format="parquet")
    assert r["format"] == "parquet"
    assert "stub" in r["data"].lower()


def test_export_unknown_format():
    r = audit_export(format="xml")
    assert "error" in r


def test_no_external_deps():
    import meok_sovereign_audit_trail_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_log()
    r1 = audit_log("dragon", "test")
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = audit_get(r1["entry_id"])
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = audit_replay()
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = audit_chain()
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = audit_export()
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_integrity_verified():
    """Chain integrity should be verified when prev_hash matches hash."""
    reset_log()
    audit_log("a", "x")
    audit_log("b", "y")
    audit_log("c", "z")
    r = audit_chain()
    assert r["verified"] is True


def test_full_lifecycle():
    """Log 5 entries, replay them, export as CSV."""
    reset_log()
    actions = [("dragon", "audit"), ("scribe", "compliance"), ("shield", "safety"),
               ("builder", "deploy"), ("owl", "research")]
    for actor, action in actions:
        audit_log(actor, action, {"ts": "now"})
    r = audit_replay()
    assert r["replayed"] == 5
    e = audit_export(format="json")
    assert e["count"] == 5


def test_persistence():
    """Entries should be persisted to disk."""
    import meok_sovereign_audit_trail_mcp as t_mod
    reset_log()
    audit_log("dragon", "test_persist", {"x": 1})
    assert t_mod.LOG_PATH.parent.exists()