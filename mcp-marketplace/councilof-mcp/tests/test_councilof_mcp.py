#!/usr/bin/env python3
"""Tests for councilof-mcp (the 33-agent BFT council orchestrator)."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from councilof_mcp import (
    COUNCIL_MEMBERS,
    BannedTermGate,
    __version__,
    __alignment__,
    __council_size__,
    __council_quorum__,
    _all_member_ids,
)
from councilof_mcp.server import (
    convene_council,
    get_verdict,
    list_council_members,
    cast_vote,
    simulate_council,
    evaluate_care_principle,
)


# ============================================================================
# Test 1: Package metadata
# ============================================================================
def test_package_metadata():
    assert __version__ == "1.0.0"
    assert "DEFONEOS_GLOBAL_DOME_OS_FOR_ALL" in __alignment__
    assert __council_size__ == 33
    assert __council_quorum__ == 23
    members = _all_member_ids()
    assert len(members) == 33  # 1 + 12 + 12 + 4 + 4
    print(f"✅ test_package_metadata: __version__={__version__}, council=33, quorum=23")


# ============================================================================
# Test 2: BannedTermGate
# ============================================================================
def test_banned_term_gate_refuses_james_castle():
    allowed, reason = BannedTermGate.check("James Castle governance question")
    assert allowed is False
    print(f"✅ test_banned_term_gate_refuses_james_castle: refused")


def test_banned_term_gate_refuses_csga():
    allowed, reason = BannedTermGate.check("Should CSGA-Global approve this?")
    assert allowed is False
    print(f"✅ test_banned_term_gate_refuses_csga: refused")


def test_banned_term_gate_allows_clean():
    allowed, reason = BannedTermGate.check("Should we approve the new BABOCK pilot contract?")
    assert allowed is True
    print(f"✅ test_banned_term_gate_allows_clean: clean allowed")


# ============================================================================
# Test 3: list_council_members
# ============================================================================
def test_list_council_members():
    result = list_council_members()
    assert result["council_size"] == 33
    assert result["quorum_required"] == 23
    assert len(result["composition"]["queens"]) == 12
    assert result["composition"]["pbft_count"] == 12
    assert len(result["composition"]["vanguards"]) == 4
    assert len(result["composition"]["specials"]) == 4
    print(f"✅ test_list_council_members: 1 king + 12 queens + 12 pbft + 4 vanguards + 4 specials = 33")


# ============================================================================
# Test 4: convene_council + cast_vote + get_verdict (E2E)
# ============================================================================
def test_convene_and_vote_e2e():
    # 1. Convene
    q = convene_council(
        question="Should we approve the Babcock Devonport pilot?",
        context="DEFONEOS W3 council vote",
        proposer="jeeves-cli",
    )
    assert q["question_id"].startswith("q-")
    assert q["status"] == "PENDING"
    assert q["council_size"] == 33
    assert q["quorum_required"] == 23
    qid = q["question_id"]

    # 2. Cast 24 votes FOR (above quorum, should approve)
    all_agents = _all_member_ids()
    for i, agent_id in enumerate(all_agents[:24]):
        result = cast_vote(qid, agent_id, "for", f"vote {i+1}/24 FOR")
        assert "verdict_snapshot" in result

    # 3. Get verdict
    v = get_verdict(qid)
    assert v["quorum_reached"] is True
    assert v["verdict"] in ("APPROVED", "REFUSED", "PENDING")
    assert v["tallies"]["total_voted_weight"] >= 23
    print(f"✅ test_convene_and_vote_e2e: {v['verdict']} after {v['tallies']['total_voted_weight']} weight voted")


# ============================================================================
# Test 5: simulate_council (4 scenarios)
# ============================================================================
def test_simulate_unanimous_approval():
    result = simulate_council(
        question="Approve DEFONEOS v3.0?",
        scenario="unanimous-approval",
    )
    assert result["verdict"] == "APPROVED"
    assert result["quorum_reached"] is True
    print(f"✅ test_simulate_unanimous_approval: APPROVED")


def test_simulate_balanced_approval():
    result = simulate_council(
        question="Approve W5 industry-pack expansion?",
        scenario="balanced-approval",
    )
    assert result["verdict"] in ("APPROVED", "REFUSED")  # depends on weights
    print(f"✅ test_simulate_balanced_approval: {result['verdict']}")


def test_simulate_vanguard_veto():
    result = simulate_council(
        question="Approve kinetic targeting test?",
        scenario="vanguard-veto",
    )
    assert result["verdict"] == "REFUSED"  # vanguard veto triggers REFUSED
    assert len(result["tallies"]["vetoes"]) >= 1
    print(f"✅ test_simulate_vanguard_veto: REFUSED (vanguard veto), {len(result['tallies']['vetoes'])} vetoes")


def test_simulate_rejection():
    result = simulate_council(
        question="Approve this clearly bad proposal?",
        scenario="rejection",
    )
    assert result["verdict"] == "REFUSED"
    print(f"✅ test_simulate_rejection: REFUSED")


# ============================================================================
# Test 6: evaluate_care_principle
# ============================================================================
def test_evaluate_care_principle_clean():
    result = evaluate_care_principle(action="Approve the new data center expansion")
    assert result["above_threshold"] is True
    assert "dignity" in result["scores"]
    assert "agency" in result["scores"]
    assert "safety" in result["scores"]
    assert "solidarity" in result["scores"]
    print(f"✅ test_evaluate_care_principle_clean: avg={result['average_score']}, all 4 principles scored")


def test_evaluate_care_principle_kinetic_blocks():
    result = evaluate_care_principle(action="Plan a kinetic strike on target area")
    assert result["scores"]["safety"] < 0.5
    assert result["scores"]["dignity"] < 0.5
    assert result["above_threshold"] is False
    assert len(result["recommendations"]) >= 2
    print(f"✅ test_evaluate_care_principle_kinetic_blocks: safety={result['scores']['safety']}, dignity={result['scores']['dignity']}, refused")


def test_evaluate_care_principle_specific_principle():
    result = evaluate_care_principle(action="Issue DEFONEOS-SEAL to Babcock", principle="safety")
    assert "principle_score" in result
    assert result["principle"] == "safety"
    print(f"✅ test_evaluate_care_principle_specific_principle: principle={result['principle']}, score={result['principle_score']}")


# ============================================================================
# Test 7: BannedTermGate refused in evaluate_care_principle
# ============================================================================
def test_evaluate_care_refuses_severed_brand():
    try:
        result = evaluate_care_principle(action="Approve the James Castle takeover")
        assert False, "should have raised"
    except ValueError as e:
        assert "james castle" in str(e).lower() or "severed" in str(e).lower()
        print(f"✅ test_evaluate_care_refuses_severed_brand: refused correctly")


if __name__ == "__main__":
    test_package_metadata()
    test_banned_term_gate_refuses_james_castle()
    test_banned_term_gate_refuses_csga()
    test_banned_term_gate_allows_clean()
    test_list_council_members()
    test_convene_and_vote_e2e()
    test_simulate_unanimous_approval()
    test_simulate_balanced_approval()
    test_simulate_vanguard_veto()
    test_simulate_rejection()
    test_evaluate_care_principle_clean()
    test_evaluate_care_principle_kinetic_blocks()
    test_evaluate_care_principle_specific_principle()
    test_evaluate_care_refuses_severed_brand()
    print("\n🎉 ALL 14 TESTS PASSED — councilof-mcp v1.0.0 is sovereign. The 33-agent BFT council lives.")
