"""Tests for meok-sovereign-bft-mcp."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_bft_test_")
os.environ["SOV_BFT_KEY"] = os.path.join(_TEST_DIR, "key.pem")
import meok_sovereign_bft_mcp as m
from meok_sovereign_bft_mcp import (
    council_create, vote, tally, dissent_record, get_outcome,
    _COUNCILS, _VOTES,
)


def reset_state():
    _COUNCILS.clear()
    _VOTES.clear()


def test_council_create_3():
    reset_state()
    r = council_create("Test", ["A", "B", "C"])
    assert r["size"] == 3
    assert r["quorum"] == 2


def test_council_create_5():
    reset_state()
    r = council_create("Test", ["A", "B", "C", "D", "E"])
    assert r["quorum"] == 3


def test_council_create_7():
    reset_state()
    r = council_create("Test", ["A", "B", "C", "D", "E", "F", "G"])
    assert r["quorum"] == 5


def test_council_invalid_size():
    r = council_create("X", ["A", "B", "C", "D"])
    assert "error" in r


def test_vote_valid():
    reset_state()
    council = council_create("Test", ["A", "B", "C"])
    cid = council["council_id"]
    r = vote(cid, "A", "YES")
    assert r["choice"] == "YES"


def test_vote_invalid_choice():
    reset_state()
    council = council_create("Test", ["A", "B", "C"])
    cid = council["council_id"]
    r = vote(cid, "A", "MAYBE")
    assert "error" in r


def test_vote_invalid_voter():
    reset_state()
    council = council_create("Test", ["A", "B", "C"])
    cid = council["council_id"]
    r = vote(cid, "X", "YES")
    assert "error" in r


def test_tally_pass_2_3():
    reset_state()
    council = council_create("Test", ["A", "B", "C"])
    cid = council["council_id"]
    vote(cid, "A", "YES")
    vote(cid, "B", "YES")
    vote(cid, "C", "NO")
    r = tally(cid)
    assert r["outcome"] == "PASSED"


def test_tally_reject():
    reset_state()
    council = council_create("Test", ["A", "B", "C"])
    cid = council["council_id"]
    vote(cid, "A", "YES")
    vote(cid, "B", "NO")
    vote(cid, "C", "NO")
    r = tally(cid)
    assert r["outcome"] == "REJECTED"


def test_tally_abstain():
    reset_state()
    council = council_create("Test", ["A", "B", "C"])
    cid = council["council_id"]
    vote(cid, "A", "YES")
    vote(cid, "B", "ABSTAIN")
    vote(cid, "C", "ABSTAIN")
    r = tally(cid)
    assert r["outcome"] == "REJECTED"


def test_tally_5_quorum_3():
    reset_state()
    council = council_create("5-vote", ["A", "B", "C", "D", "E"])
    cid = council["council_id"]
    vote(cid, "A", "YES")
    vote(cid, "B", "YES")
    vote(cid, "C", "YES")
    vote(cid, "D", "NO")
    vote(cid, "E", "NO")
    r = tally(cid)
    assert r["outcome"] == "PASSED"


def test_tally_7_quorum_5():
    reset_state()
    council = council_create("7-vote", ["A", "B", "C", "D", "E", "F", "G"])
    cid = council["council_id"]
    for v in "ABCDE":
        vote(cid, v, "YES")
    vote(cid, "F", "NO")
    vote(cid, "G", "NO")
    r = tally(cid)
    assert r["outcome"] == "PASSED"


def test_dissent_record():
    reset_state()
    council = council_create("Test", ["A", "B", "C"])
    cid = council["council_id"]
    r = dissent_record(cid, "B", "I vote NO because...")
    assert r["voter"] == "B"


def test_get_outcome():
    reset_state()
    council = council_create("Test", ["A", "B", "C"])
    cid = council["council_id"]
    vote(cid, "A", "YES")
    vote(cid, "B", "YES")
    tally(cid)
    r = get_outcome(cid)
    assert r["status"] == "RATIFIED"


def test_no_external_deps():
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_state()
    council = council_create("Test", ["A", "B", "C"])
    cid = council["council_id"]
    vote(cid, "A", "YES")
    for r in [council, get_outcome(cid), tally(cid)]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_lifecycle():
    reset_state()
    council = council_create("Charter Amend", ["Argus", "Scribe", "Shield", "Builder", "Abacus"])
    cid = council["council_id"]
    vote(cid, "Argus", "YES")
    vote(cid, "Scribe", "YES")
    vote(cid, "Shield", "YES")
    vote(cid, "Builder", "NO")
    vote(cid, "Abacus", "ABSTAIN")
    r = tally(cid)
    assert r["outcome"] == "PASSED"
    dissent_record(cid, "Builder", "Need more care floor probes")
    outcome = get_outcome(cid)
    assert outcome["status"] == "RATIFIED"
