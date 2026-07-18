#!/usr/bin/env python3
"""Tests for meek-hybrid-roadmap-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_hybrid_roadmap_mcp import (
    BannedTermGate,
    __version__,
    __alignment__,
    __substrate_size__,
    __council_quorum__,
    __scope__,
)
from meek_hybrid_roadmap_mcp.server import (
    mod_or_build_decision,
    estimate_mod_time,
    list_mod_targets,
    list_build_targets,
    generate_timeline,
)


def test_package_metadata():
    assert __version__ == "1.0.0"
    assert "MEOK_DEFONEOS_ALIGNMENT" in __alignment__
    assert "W17" in __alignment__
    assert "12 MOD paths" in __substrate_size__
    assert __council_quorum__ == 23
    assert "UK sovereign only" in __scope__
    print(f"✅ test_package_metadata: __version__={__version__}")


def test_banned_term_gate():
    allowed, reason = BannedTermGate.check("decide MOD or BUILD")
    assert allowed is True
    print(f"✅ test_banned_term_gate: clean prompt allowed")


def test_mod_or_build_decision_unique():
    r = mod_or_build_decision(component="mcmb_muscle_orb", is_unique_to_capillary=True)
    assert r["decision"] == "BUILD"
    assert "Unique" in r["reason"]
    print(f"✅ test_mod_or_build_unique: BUILD ({r['time_weeks']} weeks)")


def test_mod_or_build_decision_open_source():
    r = mod_or_build_decision(component="physics_sim", has_open_source=True, is_unique_to_capillary=False, maturity_required_months=12)
    assert r["decision"] == "MOD"
    assert "open source" in r["reason"].lower()
    print(f"✅ test_mod_or_build_opensource: MOD ({r['time_weeks']} weeks, saved {r['time_saved_weeks_vs_build_from_scratch']} weeks)")


def test_estimate_mod_time():
    r = estimate_mod_time(num_mod_paths=12, parallel_engineers=3)
    assert r["time_saved_weeks"] > 0
    assert r["speedup_factor"] > 1
    print(f"✅ test_estimate_mod_time: saved {r['time_saved_weeks']:.1f} weeks, {r['speedup_factor']:.1f}x speedup, £{r['cost_saved_gbp']:.0f} saved")


def test_list_mod_targets():
    r = list_mod_targets()
    assert r["total_paths"] == 12
    assert r["total_repos"] == 25
    assert r["all_licenses_open_source"] is True
    print(f"✅ test_list_mod_targets: {r['total_paths']} MOD paths, {r['total_repos']} candidate repos")


def test_list_build_targets():
    r = list_build_targets()
    assert r["total_count"] == 5
    assert r["total_weeks"] > 0
    print(f"✅ test_list_build_targets: {r['total_count']} BUILD targets, {r['total_weeks']} weeks total")


def test_generate_timeline():
    r = generate_timeline(parallel_engineers=3)
    assert r["total_weeks"] == 20
    assert r["mod_tasks"] > 0
    assert r["build_tasks"] > 0
    assert r["test_tasks"] > 0
    assert r["milestones"] > 0
    print(f"✅ test_generate_timeline: 20 weeks — {r['mod_tasks']} MOD + {r['build_tasks']} BUILD + {r['test_tasks']} TEST + {r['milestones']} milestones")


if __name__ == "__main__":
    test_package_metadata()
    test_banned_term_gate()
    test_mod_or_build_decision_unique()
    test_mod_or_build_decision_open_source()
    test_estimate_mod_time()
    test_list_mod_targets()
    test_list_build_targets()
    test_generate_timeline()
    print("\n🎉 ALL 8 TESTS PASSED — meek-hybrid-roadmap-mcp v1.0.0 is sovereign. The sovereign capillary humanoid is 20 weeks away.")