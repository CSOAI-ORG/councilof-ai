"""Tests for meok-sovereign-backup-mcp (snapshot + restore + delta)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_bak_test_")
os.environ["SOV_BAK_KEY"] = os.path.join(_TEST_DIR, "key.pem")
import meok_sovereign_backup_mcp as b_mod
from meok_sovereign_backup_mcp import (
    backup_snapshot, backup_list, backup_restore,
    backup_delta, backup_status,
)


def reset_state():
    b_mod._SNAPSHOTS.clear()
    b_mod._RESTORE_APPROVALS.clear()


def test_snapshot_basic():
    reset_state()
    r = backup_snapshot("test", {"key": "value"})
    assert r["name"] == "test"
    assert r["data"] == {"key": "value"}


def test_snapshot_default_data():
    reset_state()
    r = backup_snapshot("empty")
    assert r["data"] == {}


def test_snapshot_data_hash():
    reset_state()
    r = backup_snapshot("test", {"key": "value"})
    assert r["data_hash"] != ""


def test_list_snapshots():
    reset_state()
    backup_snapshot("snap1", {"a": 1})
    backup_snapshot("snap2", {"b": 2})
    r = backup_list()
    assert r["count"] == 2


def test_list_empty():
    reset_state()
    r = backup_list()
    assert r["count"] == 0


def test_restore_3_voters():
    reset_state()
    snap = backup_snapshot("restore_test", {"key": "value"})
    sid = snap["snapshot_id"]
    r1 = backup_restore(sid, "scribe")
    assert r1["restored"] is False
    r2 = backup_restore(sid, "shield")
    assert r2["restored"] is False
    r3 = backup_restore(sid, "lex")
    assert r3["restored"] is True
    assert r3["data"]["key"] == "value"


def test_restore_unknown_snapshot():
    r = backup_restore("nonexistent", "scribe")
    assert "error" in r


def test_delta_basic():
    reset_state()
    a = backup_snapshot("a", {"k1": 1, "k2": 2})
    b = backup_snapshot("b", {"k1": 1, "k3": 3})
    r = backup_delta(a["snapshot_id"], b["snapshot_id"])
    assert r["added_count"] == 1
    assert r["removed_count"] == 1


def test_delta_changed_keys():
    reset_state()
    a = backup_snapshot("a", {"k1": 1, "k2": 2})
    b = backup_snapshot("b", {"k1": 1, "k2": 99})
    r = backup_delta(a["snapshot_id"], b["snapshot_id"])
    assert r["changed_count"] == 1
    assert r["changed"]["k2"]["old"] == 2
    assert r["changed"]["k2"]["new"] == 99


def test_delta_unknown_snapshot():
    reset_state()
    a = backup_snapshot("a", {})
    r = backup_delta(a["snapshot_id"], "nonexistent")
    assert "error" in r


def test_status_summary():
    reset_state()
    backup_snapshot("snap1", {"a": 1, "b": 2})
    backup_snapshot("snap2", {"c": 3})
    r = backup_status()
    assert r["total_snapshots"] == 2


def test_no_external_deps():
    import meok_sovereign_backup_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_state()
    r1 = backup_snapshot("test", {})
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = backup_list()
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = backup_restore(r1["snapshot_id"], "a")
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = backup_delta(r1["snapshot_id"], r1["snapshot_id"])
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = backup_status()
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_full_lifecycle():
    """Snapshot → delta → restore."""
    reset_state()
    a = backup_snapshot("v1", {"config": "old", "feature": True})
    b = backup_snapshot("v2", {"config": "new", "feature": True})
    r = backup_delta(a["snapshot_id"], b["snapshot_id"])
    assert r["changed_count"] == 1
    backup_restore(b["snapshot_id"], "scribe")
    backup_restore(b["snapshot_id"], "shield")
    r3 = backup_restore(b["snapshot_id"], "lex")
    assert r3["restored"] is True
    assert r3["data"]["config"] == "new"