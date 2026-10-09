"""Tests for MEOK Sovereign Database."""
import sys
import os
import subprocess
from pathlib import Path

# Use a test DB
os.environ["MEOK_DB_PATH"] = "/tmp/test_meok_sovereign.db"
if os.path.exists("/tmp/test_meok_sovereign.db"):
    os.remove("/tmp/test_meok_sovereign.db")

sys.path.insert(0, "/Users/nicholas/clawd/meok-backend")
import sovereign_db as sdb


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


if __name__ == "__main__":
    sys.exit(subprocess.call([sys.executable, "-m", "pytest", __file__, "-v"]))
