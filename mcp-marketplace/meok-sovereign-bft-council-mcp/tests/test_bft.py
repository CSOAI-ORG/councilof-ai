"""Tests for meok-sovereign-bft-council-mcp (12-around-1 BFT voting)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_bft_test_")
os.environ["SOV_BFT_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_bft_council_mcp import (
    bft_thresholds, bft_propose, bft_vote, bft_ratify, bft_status,
    THRESHOLDS, COUNCIL_MEMBERS, PROTOCOL, VERSION,
)


def test_thresholds_canonical():
    r = bft_thresholds()
    assert "thresholds" in r
    assert "fast" in r["thresholds"]
    assert r["thresholds"]["fast"]["voters"] == 3
    assert r["thresholds"]["balanced"]["voters"] == 5
    assert r["thresholds"]["secure"]["voters"] == 7


def test_thresholds_eat12_tuned():
    """Per EAT-12: council size 3 is best for fast mode."""
    assert THRESHOLDS["fast"]["voters"] == 3
    assert THRESHOLDS["fast"]["quorum"] == 2


def test_12_council_members():
    assert len(COUNCIL_MEMBERS) == 12
    assert "dragon" in COUNCIL_MEMBERS


def test_propose_basic():
    r = bft_propose("Deploy sovereign-globe-mcp", "Ship meok-sovereign-globe to PyPI")
    assert r["status"] == "PENDING"
    assert r["bft_mode"] == "balanced"
    assert r["voters_required"] == 5
    assert r["quorum_required"] == 3


def test_propose_fast_mode():
    r = bft_propose("Quick patch", "Apply patch", bft_mode="fast")
    assert r["voters_required"] == 3
    assert r["quorum_required"] == 2


def test_propose_secure_mode():
    r = bft_propose("Charter amendment", "Modify Charter Art. 7", bft_mode="secure")
    assert r["voters_required"] == 7
    assert r["quorum_required"] == 5


def test_propose_care_floor_impact():
    r = bft_propose("Care floor change", "Lower care floor from 6.5 to 6.0",
                    care_floor_impact=True)
    assert r["care_floor_impact"] is True


def test_vote_valid():
    p = bft_propose("Test", "Test")
    pid = p["proposal_id"]
    r = bft_vote(pid, "dragon", "for")
    assert r["votes_for"] == 1


def test_vote_three_for_ratified_fast():
    """3 votes for in fast mode = ratified (quorum=2)."""
    p = bft_propose("Quick patch", "Apply patch", bft_mode="fast")
    pid = p["proposal_id"]
    bft_vote(pid, "dragon", "for")
    bft_vote(pid, "scribe", "for")
    r = bft_ratify(pid)
    assert r["ratified"] is True


def test_vote_balanced_three_ratified():
    """3 votes for in balanced mode = ratified (quorum=3)."""
    p = bft_propose("Balanced action", "Ship it", bft_mode="balanced")
    pid = p["proposal_id"]
    bft_vote(pid, "dragon", "for")
    bft_vote(pid, "scribe", "for")
    bft_vote(pid, "shield", "for")
    r = bft_ratify(pid)
    assert r["ratified"] is True


def test_vote_secure_five_ratified():
    """5 votes for in secure mode = ratified (quorum=5)."""
    p = bft_propose("Charter change", "Modify", bft_mode="secure")
    pid = p["proposal_id"]
    for v in ["dragon", "scribe", "shield", "lex", "owl"]:
        bft_vote(pid, v, "for")
    r = bft_ratify(pid)
    assert r["ratified"] is True


def test_vote_against_2_against():
    """2 votes against in fast mode = not rejected (need >12-2=10)."""
    p = bft_propose("Test", "Test", bft_mode="fast")
    pid = p["proposal_id"]
    bft_vote(pid, "dragon", "against")
    bft_vote(pid, "scribe", "against")
    r = bft_ratify(pid)
    assert r["ratified"] is False
    assert r["status"] == "PENDING"


def test_vote_unknown_voter():
    p = bft_propose("Test", "Test")
    r = bft_vote(p["proposal_id"], "hacker", "for")
    assert "error" in r


def test_vote_unknown_proposal():
    r = bft_vote("nonexistent", "dragon", "for")
    assert "error" in r


def test_vote_invalid_choice():
    p = bft_propose("Test", "Test")
    r = bft_vote(p["proposal_id"], "dragon", "maybe")
    assert "error" in r


def test_status_returns_full():
    p = bft_propose("Test", "Test")
    pid = p["proposal_id"]
    bft_vote(pid, "dragon", "for")
    s = bft_status(pid)
    assert s["status"] == "PENDING"
    assert len(s["votes"]) == 1


def test_status_unknown():
    r = bft_status("nonexistent")
    assert "error" in r


def test_no_external_deps():
    import meok_sovereign_bft_council_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    r1 = bft_thresholds()
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    p = bft_propose("Test", "Test")
    assert "kid" in p and "sig" in p and "ts" in p
    pid = p["proposal_id"]
    r2 = bft_vote(pid, "dragon", "for")
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = bft_ratify(pid)
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = bft_status(pid)
    assert "kid" in r4 and "sig" in r4 and "ts" in r4


def test_change_vote():
    """Voter can change their vote."""
    p = bft_propose("Test", "Test")
    pid = p["proposal_id"]
    bft_vote(pid, "dragon", "for")
    bft_vote(pid, "dragon", "against")  # change
    r = bft_status(pid)
    assert r["votes_for"] == 0
    assert r["votes_against"] == 1


def test_eat_12_doctrine():
    """Smaller councils vote better (EAT-11 ORNITH)."""
    # Documented in the threshold module
    assert THRESHOLDS["fast"]["voters"] < THRESHOLDS["balanced"]["voters"]
    assert THRESHOLDS["balanced"]["voters"] < THRESHOLDS["secure"]["voters"]
    # But all 3 modes are valid for different stakes
    for mode, t in THRESHOLDS.items():
        assert t["voters"] > 0
        assert t["quorum"] > 0
        assert t["quorum"] <= t["voters"]


def test_protocol_version():
    r = bft_thresholds()
    assert r["protocol"] == PROTOCOL
    assert r["version"] == VERSION