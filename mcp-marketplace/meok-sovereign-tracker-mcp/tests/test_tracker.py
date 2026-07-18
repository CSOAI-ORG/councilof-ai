"""Tests for meok-sovereign-tracker-mcp (PR + issue tracker)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_track_test_")
os.environ["SOV_TRACK_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_tracker_mcp import (
    tracker_create_issue, tracker_create_pr, tracker_merge_pr,
    tracker_list, tracker_status,
    _ISSUES, _PRS, CONTRIBUTORS,
)


def reset_state():
    _ISSUES.clear()
    _PRS.clear()


def test_12_contributors():
    assert len(CONTRIBUTORS) == 12
    assert "dragon" in CONTRIBUTORS


def test_create_issue_basic():
    reset_state()
    r = tracker_create_issue("Test issue", "Test description")
    assert r["title"] == "Test issue"
    assert r["status"] == "OPEN"


def test_create_issue_with_assignee():
    reset_state()
    r = tracker_create_issue("Test", "Desc", assignee="dragon")
    assert r["assignee"] == "dragon"


def test_create_issue_invalid_assignee():
    reset_state()
    r = tracker_create_issue("Test", "Desc", assignee="hacker")
    assert "error" in r


def test_create_issue_with_labels():
    reset_state()
    r = tracker_create_issue("Test", "Desc", labels=["bug", "p1"])
    assert "bug" in r["labels"]
    assert "p1" in r["labels"]


def test_create_pr_basic():
    reset_state()
    r = tracker_create_pr("Add new feature", "Body", base="main", head="feature", author="scribe")
    assert r["title"] == "Add new feature"
    assert r["status"] == "OPEN"
    assert r["author"] == "scribe"


def test_create_pr_invalid_author():
    reset_state()
    r = tracker_create_pr("T", "B", base="main", head="feat", author="hacker")
    assert "error" in r


def test_merge_pr_3_approvals():
    reset_state()
    pr = tracker_create_pr("T", "B", base="main", head="f", author="dragon")
    pid = pr["pr_id"]
    tracker_merge_pr(pid, "scribe")
    r2 = tracker_merge_pr(pid, "shield")
    r3 = tracker_merge_pr(pid, "lex")
    assert r3["status"] == "MERGED"
    assert r3["approvals"] == 3


def test_merge_pr_2_approvals_pending():
    reset_state()
    pr = tracker_create_pr("T", "B", base="main", head="f", author="dragon")
    pid = pr["pr_id"]
    tracker_merge_pr(pid, "scribe")
    r = tracker_merge_pr(pid, "shield")
    assert r["status"] == "OPEN"


def test_merge_unknown_pr():
    r = tracker_merge_pr("nonexistent", "dragon")
    assert "error" in r


def test_list_issues():
    reset_state()
    tracker_create_issue("I1", "D1")
    tracker_create_issue("I2", "D2")
    r = tracker_list(kind="issues")
    assert r["count"] == 2


def test_list_prs():
    reset_state()
    tracker_create_pr("P1", "B1", base="main", head="f1", author="dragon")
    r = tracker_list(kind="prs")
    assert r["count"] == 1


def test_list_filtered_by_status():
    reset_state()
    tracker_create_issue("Open one", "D")
    i2 = tracker_create_issue("Closed one", "D")
    _ISSUES[i2["issue_id"]]["status"] = "CLOSED"
    r = tracker_list(kind="issues", status="OPEN")
    assert r["count"] == 1


def test_status_summary():
    reset_state()
    tracker_create_issue("I1", "D1")
    tracker_create_pr("P1", "B", base="main", head="f", author="dragon")
    r = tracker_status()
    assert r["issues"]["total"] == 1
    assert r["prs"]["total"] == 1
    assert r["contributors"] == 12


def test_no_external_deps():
    import meok_sovereign_tracker_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_state()
    r1 = tracker_create_issue("I", "D")
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = tracker_create_pr("P", "B", base="main", head="f", author="dragon")
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = tracker_merge_pr(r2["pr_id"], "scribe")
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = tracker_list()
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = tracker_status()
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_full_lifecycle():
    """Create issue → assign → create PR → merge → verify."""
    reset_state()
    i = tracker_create_issue("Add Mamba-2 support", "Implement 16-dim Mamba-2 state", assignee="dragon")
    iid = i["issue_id"]
    p = tracker_create_pr("Mamba-2 16-dim state", "Implements " + iid,
                          base="main", head="mamba2", author="dragon")
    pid = p["pr_id"]
    # Merge needs 3 approvals
    tracker_merge_pr(pid, "scribe")
    tracker_merge_pr(pid, "shield")
    r = tracker_merge_pr(pid, "lex")
    assert r["status"] == "MERGED"


def test_bft_3_voters_required():
    """Per EAT-12: PR merge needs 3-voter BFT (fast mode)."""
    reset_state()
    pr = tracker_create_pr("Test BFT", "B", base="main", head="f", author="dragon")
    pid = pr["pr_id"]
    # 1 vote
    r1 = tracker_merge_pr(pid, "scribe")
    assert r1["approvals"] == 1
    assert r1["status"] == "OPEN"
    # 2 votes
    r2 = tracker_merge_pr(pid, "shield")
    assert r2["approvals"] == 2
    assert r2["status"] == "OPEN"
    # 3 votes → MERGED
    r3 = tracker_merge_pr(pid, "lex")
    assert r3["approvals"] == 3
    assert r3["status"] == "MERGED"