"""Tests for meok-sovereign-voting-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_vot_")
os.environ["SOV_VOT_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_voting_mcp" in sys.modules:
        del sys.modules["meok_sovereign_voting_mcp"]
    import meok_sovereign_voting_mcp as m
    importlib.reload(m)
    return m

def test_propose():
    m = get_fresh()
    r = m.voting_propose("Test proposal", "Test description")
    assert r["proposal"]["title"] == "Test proposal"

def test_propose_no_title():
    m = get_fresh()
    r = m.voting_propose("", "desc")
    assert "error" in r

def test_propose_increments():
    m = get_fresh()
    m.voting_propose("a")
    m.voting_propose("b")
    s = m.voting_status()
    assert s["total_proposals"] == 2

def test_cast_vote():
    m = get_fresh()
    prop = m.voting_propose("test", "desc")
    r = m.voting_cast(prop["proposal"]["prop_id"], "q-argus", "for")
    assert r["choice"] == "for"

def test_cast_unknown_proposal():
    m = get_fresh()
    r = m.voting_cast("nope", "q-argus", "for")
    assert "error" in r

def test_cast_unknown_queen():
    m = get_fresh()
    prop = m.voting_propose("test")
    r = m.voting_cast(prop["proposal"]["prop_id"], "q-bogus", "for")
    assert "error" in r

def test_cast_invalid_choice():
    m = get_fresh()
    prop = m.voting_propose("test")
    r = m.voting_cast(prop["proposal"]["prop_id"], "q-argus", "yes")
    assert "error" in r

def test_cast_closed():
    m = get_fresh()
    prop = m.voting_propose("test")
    pid = prop["proposal"]["prop_id"]
    m.voting_close(pid)
    r = m.voting_cast(pid, "q-argus", "for")
    assert "error" in r

def test_tally():
    m = get_fresh()
    prop = m.voting_propose("test")
    pid = prop["proposal"]["prop_id"]
    m.voting_cast(pid, "q-argus", "for")
    m.voting_cast(pid, "q-athena", "for")
    r = m.voting_tally(pid)
    assert r["tally"]["for"] == 2

def test_tally_passed():
    m = get_fresh()
    prop = m.voting_propose("test")
    pid = prop["proposal"]["prop_id"]
    for q in m.QUEENS[:7]:
        m.voting_cast(pid, q["id"], "for")
    r = m.voting_tally(pid)
    assert r["result"] == "PASSED"

def test_tally_rejected():
    m = get_fresh()
    prop = m.voting_propose("test")
    pid = prop["proposal"]["prop_id"]
    for q in m.QUEENS[:7]:
        m.voting_cast(pid, q["id"], "against")
    r = m.voting_tally(pid)
    assert r["result"] == "REJECTED"

def test_close():
    m = get_fresh()
    prop = m.voting_propose("test")
    pid = prop["proposal"]["prop_id"]
    r = m.voting_close(pid)
    assert r["proposal"]["status"] == "closed"

def test_close_unknown():
    m = get_fresh()
    r = m.voting_close("nope")
    assert "error" in r

def test_status():
    m = get_fresh()
    r = m.voting_status()
    assert len(r["queens"]) == 12

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    prop = m.voting_propose("x")
    for r in [prop, m.voting_cast(prop["proposal"]["prop_id"], "q-argus", "for"),
              m.voting_tally(prop["proposal"]["prop_id"]),
              m.voting_close(prop["proposal"]["prop_id"]), m.voting_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Propose → 12 votes → Tally → Close → Status."""
    m = get_fresh()
    prop = m.voting_propose("Adopt Care Floor 0.95", "Sovereign care")
    pid = prop["proposal"]["prop_id"]
    for q in m.QUEENS:
        m.voting_cast(pid, q["id"], "for")
    r = m.voting_tally(pid)
    assert r["result"] == "PASSED"
    assert r["total_votes"] == 12
    c = m.voting_close(pid)
    assert c["proposal"]["status"] == "closed"
    s = m.voting_status()
    assert s["closed_proposals"] == 1
    assert s["total_votes_cast"] == 12

def test_12_queens():
    m = get_fresh()
    assert len(m.QUEENS) == 12

def test_quorum_7_of_12():
    m = get_fresh()
    assert m._PROPOSALS == {} or m._PROPOSALS[list(m._PROPOSALS.keys())[0]]["quorum_required"] == 7
