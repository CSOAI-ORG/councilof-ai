"""Tests for meok-sovereign-roadmap-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_road_")
os.environ["SOV_ROAD_KEY"] = _TEST + "/k.pem"
from meok_sovereign_roadmap_mcp import (
    roadmap_get, roadmap_advance, roadmap_milestone, roadmap_kpi, roadmap_full,
    _STATE, PHASES,
)


def reset():
    _STATE["current_phase"] = 1
    _STATE["milestones_complete"] = []
    _STATE["kpis"] = {}


def test_12_phases():
    assert len(PHASES) == 12


def test_phase_names():
    names = [p["name"] for p in PHASES]
    assert "Birth" in names
    assert "Maturity" in names


def test_roadmap_get_initial():
    reset()
    r = roadmap_get()
    assert r["current_phase"]["id"] == 1
    assert r["current_phase"]["name"] == "Birth"


def test_roadmap_progress_pct():
    reset()
    r = roadmap_get()
    assert r["progress_pct"] == 0.0


def test_roadmap_advance():
    reset()
    r = roadmap_advance()
    assert r["new_phase"] == 2
    assert r["completed"] == "Birth"
    assert r["bft_required"] is True


def test_roadmap_advance_to_max():
    reset()
    for _ in range(15):  # Try to advance past max
        roadmap_advance()
    r = roadmap_get()
    assert r["current_phase"]["id"] == 12


def test_roadmap_milestone():
    reset()
    r = roadmap_milestone("First commit")
    assert r["milestone"] == "First commit"
    assert r["total_milestones"] == 1


def test_roadmap_milestone_empty():
    reset()
    r = roadmap_milestone("")
    assert "error" in r


def test_roadmap_kpi():
    reset()
    r = roadmap_kpi()
    assert r["current_phase"] == 1
    assert r["milestones_count"] == 0


def test_roadmap_full():
    reset()
    r = roadmap_full()
    assert r["total_phases"] == 12
    assert len(r["phases"]) == 12


def test_no_external_deps():
    import meok_sovereign_roadmap_mcp as m
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src


def test_signed_outputs():
    reset()
    for r in [roadmap_get(), roadmap_advance(), roadmap_milestone("x"),
              roadmap_kpi(), roadmap_full()]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_all_phases_have_id():
    for p in PHASES:
        assert "id" in p
        assert "name" in p
        assert "milestone" in p


def test_phase_progression():
    reset()
    # Walk through all 12 phases
    for i in range(1, 13):
        r = roadmap_get()
        assert r["current_phase"]["id"] == i
        if i < 12:
            roadmap_advance()


def test_milestones_accumulate():
    reset()
    roadmap_milestone("A")
    roadmap_milestone("B")
    roadmap_milestone("C")
    r = roadmap_kpi()
    assert r["milestones_count"] == 3


def test_full_workflow():
    """Get → Advance → Milestone → KPI → Full."""
    reset()
    g = roadmap_get()
    assert g["current_phase"]["id"] == 1
    a = roadmap_advance()
    assert a["new_phase"] == 2
    m = roadmap_milestone("Phase 1 done")
    assert m["milestone"] == "Phase 1 done"
    k = roadmap_kpi()
    assert k["milestones_count"] == 2  # advance + milestone
    f = roadmap_full()
    assert f["total_phases"] == 12
    assert len(f["milestones_complete"]) == 2  # 1 advance + 1 milestone


def test_phase_kpis_match_names():
    for p in PHASES:
        assert "kpi" in p
        assert "=" in p["kpi"]


def test_birth_phase_is_first():
    assert PHASES[0]["name"] == "Birth"
    assert PHASES[0]["month"] == 1


def test_maturity_phase_is_last():
    assert PHASES[-1]["name"] == "Maturity"
    assert PHASES[-1]["month"] == 12
    assert PHASES[-1]["kpi"] == "composite=10.0"
