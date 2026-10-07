"""Tests for MEOK Sovereign Database.

Hermetic: the DB and the SIGIL key file live in a fresh temp dir, and any
MEOK_SIGIL_SECRET in the environment is ignored, so no test reads a real key
or writes to ~/.config.
"""
import ast
import hashlib
import hmac
import json
import os
import sqlite3
import stat
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
_TMP = Path(tempfile.mkdtemp(prefix="meok_sovereign_test_"))

# Set the env BEFORE importing the module (DB_PATH is read at import).
os.environ["MEOK_DB_PATH"] = str(_TMP / "sovereign.db")
os.environ["MEOK_SIGIL_KEY_FILE"] = str(_TMP / "sigil.key")
os.environ.pop("MEOK_SIGIL_SECRET", None)

sys.path.insert(0, str(HERE))
import sovereign_db as sdb  # noqa: E402


def test_13_tables():
    """All 13 tables must exist."""
    tables = ["ichars", "queens", "temples", "regulations", "sigil_chain", "audit_log",
              "charter_titles", "charter_signatures", "framework_coverage",
              "queen_votes", "csoai_sbt", "pii_pseudonyms", "x402_invoices", "mcp_federation"]
    conn = sdb.get_db()
    cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    found = [r["name"] for r in cur.fetchall()]
    for t in tables:
        assert t in found, f"missing table {t}"


def test_create_ichar():
    """Create a new i-character."""
    ichar_id = sdb.create_ichar("Test User", "sovereign", "queen-king", 21, {"O": 0.5, "C": 0.5, "E": 0.5, "A": 0.5, "N": 0.5})
    assert ichar_id.startswith("ich-")
    assert len(ichar_id) > 16
    ichar = sdb.get_ichar(ichar_id)
    assert ichar["name"] == "Test User"
    assert ichar["archetype"] == "sovereign"
    assert ichar["queen_id"] == "queen-king"
    assert ichar["arcana_lens"] == 21
    assert "ocean" in ichar


def test_list_ichars():
    """List i-characters."""
    sdb.create_ichar("List Test", "guardian", "queen-watch", 16, {"O": 0.5})
    ichars = sdb.list_ichars(limit=10)
    assert len(ichars) >= 2
    assert all("id" in i for i in ichars)


def test_create_queen():
    """Create a queen."""
    qid = sdb.create_queen("Test Queen", "Tester", 0, "Test motto", {"O": 0.5}, veto=True)
    assert qid.startswith("queen-")
    queens = sdb.list_queens()
    assert any(q["name"] == "Test Queen" for q in queens)


def test_create_temple():
    """Create a temple."""
    tid = sdb.create_temple("TT", "Test Temple", "Nowhere", 0.0, 0.0, "queen-king")
    assert tid.startswith("temple-")
    temples = sdb.list_temples()
    assert any(t["code"] == "TT" for t in temples)


def test_add_regulation():
    """Add a regulation to a temple."""
    tid = sdb.create_temple("RR", "Reg Temple", "Nowhere", 0.0, 0.0)
    rid = sdb.add_regulation(tid, "TEST-ACT", "Test Act", "Test desc", 2024, "Test")
    assert rid.startswith("reg-")
    regs = sdb.list_regulations(tid)
    assert any(r["code"] == "TEST-ACT" for r in regs)


def test_add_charter():
    """Add a charter."""
    cid = sdb.add_charter("Test Charter", "Test Tier", "ratified")
    assert cid.startswith("charter-")


def test_sign_charter():
    """Sign a charter (BFT 9/13)."""
    cid = sdb.add_charter("BFT Test", "Test", "ratified")
    sigil = sdb.sign_charter(cid, "queen-king")
    assert len(sigil) == 32


def test_cast_vote():
    """Cast a queen vote."""
    sigil = sdb.cast_vote("queen-king", "prop-1", "for")
    assert len(sigil) == 32


def test_issue_sbt():
    """Issue a POAI safety SBT."""
    sbt_id = sdb.issue_sbt("abc123hash", "Safety attestation", "meok")
    assert sbt_id.startswith("sbt-")


def test_pseudonymize():
    """Generate a pseudonym."""
    p = sdb.pseudonymize("user@meok.ai")
    assert p.startswith("pseud-")
    # Same real_id should return same pseudonym
    p2 = sdb.pseudonymize("user@meok.ai")
    assert p == p2


def test_create_invoice():
    """Create an x402 invoice."""
    inv = sdb.create_invoice("caller-1", "council-chat", 0.011)
    assert inv.startswith("x402-")
    assert "x402-" in inv


def test_register_mcp():
    """Register an MCP server."""
    mcp_id = sdb.register_mcp("test-mcp", 5)
    assert mcp_id.startswith("mcp-")


def test_add_framework_coverage():
    """Add framework coverage."""
    sigil = sdb.add_framework_coverage("EU AI Act", "Art 5", "MEOK OS")
    assert len(sigil) == 32


def test_verify_sigil_chain():
    """Verify the SIGIL chain integrity."""
    assert sdb.verify_sigil_chain() is True


def test_get_stats():
    """Get database stats."""
    stats = sdb.get_stats()
    assert "ichars" in stats
    assert "queens" in stats
    assert "temples" in stats
    assert "sigil_chain_verified" in stats


def test_sigils_unique():
    """Each ichar gets a unique SIGIL hash."""
    ids = [sdb.create_ichar(f"User {i}", "sovereign", "queen-king", 21, {"O": 0.5}) for i in range(3)]
    sigils = set()
    for i in ids:
        ichar = sdb.get_ichar(i)
        sigils.add(ichar["sigil_hash"])
    assert len(sigils) == 3


def test_ocean_json_serialized():
    """OCEAN personality serialized as JSON."""
    ichar_id = sdb.create_ichar("Ocean Test", "creator", "queen-arcana", 6, {"O": 0.9, "C": 0.3, "E": 0.7, "A": 0.8, "N": 0.4})
    ichar = sdb.get_ichar(ichar_id)
    assert ichar["ocean"]["O"] == 0.9
    assert ichar["ocean"]["C"] == 0.3


# === SIGIL key: no secret in source; env key, else a local key file ===

def _reads_sigil_secret(node) -> bool:
    return (isinstance(node, ast.Call) and node.args
            and isinstance(node.args[0], ast.Constant)
            and node.args[0].value == "MEOK_SIGIL_SECRET")


def test_no_default_secret_in_source():
    """MEOK_SIGIL_SECRET is read with no fallback value and no key literal sits in source."""
    src = (HERE / "sovereign_db.py").read_text(encoding="utf-8")
    assert "SIGIL_SECRET =" not in src
    tree = ast.parse(src)
    reads = [n for n in ast.walk(tree) if _reads_sigil_secret(n)]
    assert reads, "MEOK_SIGIL_SECRET is no longer read at all"
    for call in reads:
        assert len(call.args) == 1 and not call.keywords, \
            f"line {call.lineno}: MEOK_SIGIL_SECRET read with a fallback value"
    for node in ast.walk(tree):  # nor `os.environ.get(...) or "literal"`
        if isinstance(node, ast.BoolOp) and isinstance(node.op, ast.Or) \
                and any(_reads_sigil_secret(v) for v in node.values):
            assert not any(isinstance(v, ast.Constant) for v in node.values), \
                f"line {node.lineno}: MEOK_SIGIL_SECRET falls back to a literal"


def test_key_file_created_0600_and_random(monkeypatch, tmp_path):
    kf = tmp_path / "sub" / "sigil.key"
    monkeypatch.setenv("MEOK_SIGIL_KEY_FILE", str(kf))
    monkeypatch.delenv("MEOK_SIGIL_SECRET", raising=False)
    assert not kf.exists()
    first = sdb.sign({"a": 1})
    assert stat.S_IMODE(kf.stat().st_mode) == 0o600
    key = kf.read_bytes().strip()
    assert len(key) == 64 and int(key, 16) >= 0  # 32 random bytes, hex-encoded
    assert sdb.sign({"a": 1}) == first  # stable once the file exists
    other = tmp_path / "other.key"
    monkeypatch.setenv("MEOK_SIGIL_KEY_FILE", str(other))
    sdb.sign({"a": 1})
    assert other.read_bytes().strip() != key  # a new file gets a new random key


def test_env_key_overrides_key_file(monkeypatch, tmp_path):
    kf = tmp_path / "sigil.key"
    monkeypatch.setenv("MEOK_SIGIL_KEY_FILE", str(kf))
    monkeypatch.setenv("MEOK_SIGIL_SECRET", "env-key-a")
    a = sdb.sign({"a": 1})
    assert not kf.exists()  # env key used; no key file written
    monkeypatch.setenv("MEOK_SIGIL_SECRET", "env-key-b")
    assert sdb.sign({"a": 1}) != a


def test_empty_key_file_refused(monkeypatch, tmp_path):
    kf = tmp_path / "sigil.key"
    kf.write_bytes(b"\n")
    monkeypatch.setenv("MEOK_SIGIL_KEY_FILE", str(kf))
    monkeypatch.delenv("MEOK_SIGIL_SECRET", raising=False)
    with pytest.raises(ValueError):
        sdb.sign({"a": 1})


def test_sigil_is_hmac_sha256_truncated_to_128_bits(monkeypatch):
    monkeypatch.setenv("MEOK_SIGIL_SECRET", "k")
    payload = {"b": 2, "a": 1}
    full = hmac.new(b"k", json.dumps(payload, sort_keys=True).encode(), hashlib.sha256).hexdigest()
    assert sdb.sign(payload) == full[:32]  # 32 hex chars = 128 bits


def test_sigil_from_another_key_does_not_verify(monkeypatch):
    """A SIGIL made under another key (e.g. the old in-source default) is unsigned here."""
    monkeypatch.setenv("MEOK_SIGIL_SECRET", "old-key")
    payload = {"x": 1}
    old = sdb.sign(payload)
    assert sdb.verify(payload, old) is True
    monkeypatch.setenv("MEOK_SIGIL_SECRET", "new-key")
    assert sdb.verify(payload, old) is False
    assert sdb.verify(payload, None) is False


# === SIGIL chain: links are recomputed under the current key ===

def _fresh_db(monkeypatch, tmp_path, key):
    monkeypatch.setattr(sdb, "DB_PATH", str(tmp_path / "chain.db"))
    monkeypatch.setenv("MEOK_SIGIL_SECRET", key)


def test_chain_written_under_another_key_not_verified(monkeypatch, tmp_path):
    _fresh_db(monkeypatch, tmp_path, "old-key")
    sdb.create_queen("Q", "Role", 1, "motto", {"O": 0.5})
    sdb.cast_vote("queen-q", "prop-1", "for")
    assert sdb.verify_sigil_chain() is True
    monkeypatch.setenv("MEOK_SIGIL_SECRET", "new-key")
    assert sdb.verify_sigil_chain() is False
    assert sdb.get_stats()["sigil_chain_verified"] is False


def test_chain_tamper_detected(monkeypatch, tmp_path):
    _fresh_db(monkeypatch, tmp_path, "k")
    sdb.create_queen("Q", "Role", 1, "motto", {"O": 0.5})
    assert sdb.verify_sigil_chain() is True
    conn = sqlite3.connect(sdb.DB_PATH)
    conn.execute("UPDATE sigil_chain SET payload_json = ? WHERE id = 1", (json.dumps({"name": "forged"}),))
    conn.commit()
    conn.close()
    assert sdb.verify_sigil_chain() is False


def test_pre_migration_chain_rows_not_verified(monkeypatch, tmp_path):
    """A DB from before the sigil column: its links cannot be recomputed, so they never verify."""
    _fresh_db(monkeypatch, tmp_path, "k")
    conn = sqlite3.connect(sdb.DB_PATH)
    conn.execute("""CREATE TABLE sigil_chain (id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hash TEXT NOT NULL UNIQUE, prev_hash TEXT NOT NULL, action TEXT NOT NULL,
                    payload_json TEXT NOT NULL, ts REAL NOT NULL)""")
    conn.execute("INSERT INTO sigil_chain (hash, prev_hash, action, payload_json, ts) VALUES (?, ?, ?, ?, ?)",
                 ("a" * 32, "0" * 32, "create_queen", "{}", 0.0))
    conn.commit()
    conn.close()
    assert sdb.verify_sigil_chain() is False
    conn = sqlite3.connect(sdb.DB_PATH)
    cols = [r[1] for r in conn.execute("PRAGMA table_info(sigil_chain)")]
    conn.close()
    assert "sigil" in cols  # migrated in place
    # New links chain onto the legacy one; the chain as a whole stays unverified.
    sdb.create_queen("Q", "Role", 1, "motto", {"O": 0.5})
    assert sdb.verify_sigil_chain() is False


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))
