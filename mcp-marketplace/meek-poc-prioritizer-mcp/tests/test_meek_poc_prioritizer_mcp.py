#!/usr/bin/env python3
"""Tests for meek-poc-prioritizer-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_poc_prioritizer_mcp.server import (
    top_findings,
    cheapest_bootstrap,
    poc_roadmap,
    tools_kit,
    cost_calculator,
    feasibility_scorer,
)


def test_top_findings():
    r = top_findings()
    assert r["total_count"] == 10
    assert r["zero_cost_count"] == 3
    print(f"✅ test_top_findings: {r['total_count']} findings, {r['zero_cost_count']} zero-cost")


def test_cheapest_bootstrap():
    r = cheapest_bootstrap()
    assert r["zero_cost_poc"] is True
    assert len(r["phases"]) == 7
    assert r["phases"][0]["cost_gbp"] == 0
    print(f"✅ test_cheapest_bootstrap: {len(r['phases'])} phases, $0 first")


def test_poc_roadmap():
    r = poc_roadmap()
    assert "phase_0_$0" in r
    assert "phase_6_£126,625" in r
    print(f"✅ test_poc_roadmap: 7 phases (Phase 0 $0 → Phase 6 £126K)")


def test_tools_kit():
    r = tools_kit()
    assert len(r["tools"]) == 10
    assert r["total_toolkit_cost_gbp"] == 253
    print(f"✅ test_tools_kit: 10 tools, £{r['total_toolkit_cost_gbp']} total")


def test_cost_calculator():
    r = cost_calculator(num_orbs=1, prototype=True)
    assert r["total_cost_gbp"] == 201 + 6757
    print(f"✅ test_cost_calculator: 1 orb = £{r['total_cost_gbp']}")


def test_feasibility_scorer():
    r = feasibility_scorer(impact=10, feasibility=10, cost_gbp=0)
    assert r["verdict"] == "HIGH_PRIORITY"
    print(f"✅ test_feasibility_scorer: score={r['score']}, verdict={r['verdict']}")


if __name__ == "__main__":
    test_top_findings()
    test_cheapest_bootstrap()
    test_poc_roadmap()
    test_tools_kit()
    test_cost_calculator()
    test_feasibility_scorer()
    print("\n🎉 ALL 6 TESTS PASSED — meek-poc-prioritizer-mcp v1.0.0 is sovereign. The TOP 10 + CHEAPEST bootstrap.")