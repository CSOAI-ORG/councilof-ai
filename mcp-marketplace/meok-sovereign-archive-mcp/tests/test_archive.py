"""Tests for meok-sovereign-archive-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_arc_")
os.environ["SOV_ARC_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_archive_mcp" in sys.modules:
        del sys.modules["meok_sovereign_archive_mcp"]
    import meok_sovereign_archive_mcp as m
    importlib.reload(m)
    return m

def test_record_basic():
    m = get_fresh()
    r = m.archive_record("sovereign", "First sovereign event", year=2026)
    assert r["event_type"] == "sovereign"
    assert r["total_events"] == 1

def test_record_no_content():
    m = get_fresh()
    r = m.archive_record("sovereign", "")
    assert "error" in r

def test_record_increments():
    m = get_fresh()
    m.archive_record("a", "event 1")
    m.archive_record("b", "event 2")
    m.archive_record("c", "event 3")
    s = m.archive_status()
    assert s["total_events"] == 3

def test_query_no_query():
    m = get_fresh()
    m.archive_record("sovereign", "x")
    r = m.archive_query()
    assert len(r["results"]) >= 1

def test_query_with_term():
    m = get_fresh()
    m.archive_record("sovereign", "SIGIL audit complete")
    m.archive_record("audit", "Other event")
    r = m.archive_query("sigil")
    assert r["total_matches"] >= 1

def test_lineage_default():
    m = get_fresh()
    r = m.archive_lineage()
    assert len(r["lineage"]) >= 10  # at least 10 lineage events

def test_lineage_range():
    m = get_fresh()
    r = m.archive_lineage(2000, 2030)
    assert all(2000 <= e["year"] <= 2030 for e in r["lineage"])

def test_verify():
    m = get_fresh()
    m.archive_record("x", "y")
    r = m.archive_verify()
    assert r["integrity"] == "100% verified"

def test_status_initial():
    m = get_fresh()
    r = m.archive_status()
    assert r["lineage_span"] == "1795-3025"
    assert r["total_events"] == 0

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.archive_record("x", "y"), m.archive_query(), m.archive_lineage(),
              m.archive_verify(), m.archive_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Record → Query → Lineage → Verify → Status."""
    m = get_fresh()
    r1 = m.archive_record("sovereign", "First sovereign action", year=2026)
    assert r1["event_type"] == "sovereign"
    r2 = m.archive_query("sovereign")
    assert r2["total_matches"] >= 1
    r3 = m.archive_lineage(2024, 2026)
    assert len(r3["lineage"]) >= 3
    r4 = m.archive_verify()
    assert r4["integrity"] == "100% verified"
    s = m.archive_status()
    assert s["total_events"] == 1
    assert s["lineage_span"] == "1795-3025"

def test_crown_lineage_real():
    """Crown lineage 1795-2026 must include real events."""
    m = get_fresh()
    r = m.archive_lineage(1795, 2026)
    events = r["lineage"]
    # Must include 2024 (sovereign substrate v1.0)
    assert any(e["year"] == 2024 for e in events)
    # Must include 2026 (CSOAI)
    assert any(e["year"] == 2026 and "CSOAI" in e["event"] for e in events)

def test_13_lineage_events():
    """13 canonical lineage events."""
    m = get_fresh()
    assert len(m.CROWN_LINEAGE) >= 13
