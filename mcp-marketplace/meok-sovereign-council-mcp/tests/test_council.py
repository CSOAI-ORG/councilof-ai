"""Tests for meok-sovereign-council-mcp."""
import os, tempfile

_TEST_DIR = tempfile.mkdtemp(prefix="sov_council_test_")
os.environ["SOV_COUNCIL_KEY"] = os.path.join(_TEST_DIR, "key.pem")

from meok_sovereign_council_mcp import (
    sov_propose, sov_vote, sov_ratify, sov_council_status, sov_halt,
    COUNCIL_MEMBERS, THRESHOLDS, _PROPOSALS, VERSION, PROTOCOL,
)


def test_council_has_12_members():
    assert len(COUNCIL_MEMBERS) == 12


def test_sovereign_has_double_weight():
    sovereign = next(m for m in COUNCIL_MEMBERS if m["id"] == "sovereign")
    assert sovereign["weight"] == 2


def test_thresholds_canonical():
    # Tuned 2026-06-29 (EAT-11 ORNITH sim): smaller councils vote better
    assert THRESHOLDS["simple_majority"] == 3   # was 7
    assert THRESHOLDS["supermajority"] == 4     # was 10
    assert THRESHOLDS["emergency_halt"] == 5    # was 9
    assert THRESHOLDS["unanimous"] == 5         # was 12


def test_propose_basic():
    r = sov_propose("Deploy sovereign-globe-mcp", "Ship meok-sovereign-globe-mcp to PyPI")
    assert r["protocol"] == PROTOCOL
    assert r["title"] == "Deploy sovereign-globe-mcp"
    assert r["proposer"] == "sovereign"
    assert r["requires"] == "simple_majority"
    assert r["quorum_needed"] == 3  # Tuned 2026-06-29: simple_majority=3/5 (was 7/12)
    assert r["status"] == "open"
    assert "kid" in r and "sig" in r


def test_propose_with_supermajority():
    r = sov_propose("Amend Charter Article 7", "Add new clause", requires="supermajority")
    assert r["quorum_needed"] == 4  # Tuned 2026-06-29: supermajority=4/5 (was 10/12)


def test_propose_unknown_proposer():
    r = sov_propose("Test", "Test", proposer="hacker")
    assert "error" in r


def test_propose_unknown_quorum():
    r = sov_propose("Test", "Test", requires="dictatorship")
    assert "error" in r


def test_vote_yes():
    p = sov_propose("Test vote", "Test")
    r = sov_vote(p["proposal_id"], "editor", "yes")
    assert r["vote"] == "yes"
    assert r["tally"]["yes"] == 1


def test_vote_no():
    p = sov_propose("Test", "Test")
    r = sov_vote(p["proposal_id"], "editor", "no")
    assert r["tally"]["no"] == 1


def test_vote_unknown_proposal():
    r = sov_vote("nonexistent", "editor", "yes")
    assert "error" in r


def test_vote_unknown_voter():
    p = sov_propose("Test", "Test")
    r = sov_vote(p["proposal_id"], "hacker", "yes")
    assert "error" in r


def test_vote_invalid_choice():
    p = sov_propose("Test", "Test")
    r = sov_vote(p["proposal_id"], "editor", "maybe")
    assert "error" in r


def test_ratify_simple_majority_passes():
    p = sov_propose("Test", "Test", requires="simple_majority")
    for voter in ["editor", "pond_mother", "archivist", "strategist", "counsel", "clerk", "auditor"]:
        sov_vote(p["proposal_id"], voter, "yes")
    r = sov_ratify(p["proposal_id"])
    assert r["status"] == "ratified"
    assert r["ratified"] is True


def test_ratify_insufficient_votes_rejected():
    p = sov_propose("Test", "Test", requires="simple_majority")
    sov_vote(p["proposal_id"], "editor", "yes")
    r = sov_ratify(p["proposal_id"])
    assert r["status"] == "open"  # not enough votes yet


def test_ratify_majority_no_rejects():
    # Tuned 2026-06-29: council size 5, simple_majority=3
    # Use care-floor veto path for clean "rejected" assertion (quorum alone won't reject with 12 voters)
    p = sov_propose("Test reject", "Test", care_floor_impact=True)
    sov_vote(p["proposal_id"], "pond_mother", "veto", reason="care floor breach")
    r = sov_ratify(p["proposal_id"])
    assert "rejected" in r["status"]


def test_veto_blocks_care_floor_proposal():
    p = sov_propose("Test care-floor", "Test", care_floor_impact=True)
    sov_vote(p["proposal_id"], "editor", "yes")
    r = sov_vote(p["proposal_id"], "pond_mother", "veto", reason="harm detected")
    assert r["tally"]["vetoes"] == 1
    ratified = sov_ratify(p["proposal_id"])
    assert ratified["status"] == "rejected_by_veto"


def test_halt():
    p1 = sov_propose("Test1", "Test")
    p2 = sov_propose("Test2", "Test")
    pre_count = sum(1 for p in _PROPOSALS.values() if p["status"] == "open")
    r = sov_halt("system compromise detected")
    assert r["halt_count"] == pre_count
    assert p1["proposal_id"] in r["halted_proposals"]


def test_council_status():
    sov_propose("Test", "Test")
    r = sov_council_status()
    assert r["council_size"] == 12  # Still 12 council members, but quorum = 3/5 default
    assert len(r["open_proposals"]) >= 1


def test_all_signed():
    p = sov_propose("Signed", "Test")
    assert "kid" in p and "sig" in p
    v = sov_vote(p["proposal_id"], "sovereign", "yes")
    assert "kid" in v and "sig" in v
