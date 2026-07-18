"""Tests for meok-sovereign-scenario-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_scn_")
os.environ["SOV_SCN_KEY"] = _TEST + "/k.pem"
from meok_sovereign_scenario_mcp import (
    scenario_run, scenario_list, scenario_step, scenario_status, scenario_history,
    _ACTIVE, SCENARIOS,
)


def reset():
    _ACTIVE.clear()


def test_10_scenarios():
    assert len(SCENARIOS) == 10


def test_scenario_list():
    r = scenario_list()
    assert r["total"] == 10


def test_scenario_run_basic():
    reset()
    r = scenario_run("drone_rescue", "London, UK")
    assert r["status"] == "started"
    assert r["scenario"]["name"] == "Drone Rescue"
    assert r["location"] == "London, UK"


def test_scenario_run_invalid():
    reset()
    r = scenario_run("fake_scenario")
    assert "error" in r


def test_scenario_run_increments():
    reset()
    scenario_run("fire_response")
    scenario_run("flood_evacuation")
    assert len(_ACTIVE) == 2


def test_scenario_step():
    reset()
    run = scenario_run("drone_rescue")
    r = scenario_step(run["run_id"])
    assert r["step"]["step_n"] == 1
    assert r["status"] == "active"


def test_scenario_step_invalid_run():
    reset()
    r = scenario_step("fake-run-id")
    assert "error" in r


def test_scenario_step_completes_at_5():
    reset()
    run = scenario_run("drone_rescue")
    for i in range(5):
        scenario_step(run["run_id"])
    r = scenario_status(run["run_id"])
    assert r["status"] == "completed"
    assert r["step"] == 5


def test_scenario_status():
    reset()
    run = scenario_run("fire_response")
    r = scenario_status(run["run_id"])
    assert r["scenario_id"] == "fire_response"


def test_scenario_status_invalid():
    reset()
    r = scenario_status("fake-id")
    assert "error" in r


def test_scenario_history_empty():
    reset()
    r = scenario_history()
    assert r["total_completed"] == 0


def test_scenario_history_with_data():
    reset()
    run = scenario_run("drone_rescue")
    for i in range(6):
        scenario_step(run["run_id"])
    r = scenario_history()
    assert r["total_completed"] == 1


def test_all_scenarios_have_required():
    """Each scenario has name, description, actors, sensors, doctrine."""
    for s in SCENARIOS:
        assert "name" in s
        assert "description" in s
        assert "actors" in s
        assert "sensors" in s
        assert "doctrine" in s


def test_all_scenarios_mention_abundance():
    """All scenarios have 'future of abundance' doctrine."""
    for s in SCENARIOS:
        assert "abundance" in s["doctrine"]


def test_no_external_deps():
    import meok_sovereign_scenario_mcp as m
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src


def test_signed_outputs():
    reset()
    for r in [scenario_run("drone_rescue"), scenario_list(),
              scenario_status("x"), scenario_history()]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_workflow():
    """List → Run → Step → Status → History."""
    reset()
    l = scenario_list()
    assert l["total"] == 10
    run = scenario_run("medical_emergency", "London")
    assert run["status"] == "started"
    s1 = scenario_step(run["run_id"])
    assert s1["step"]["step_n"] == 1
    s2 = scenario_step(run["run_id"])
    assert s2["step"]["step_n"] == 2
    st = scenario_status(run["run_id"])
    assert st["step"] == 2
    h = scenario_history()
    assert h["total_active"] == 1
    assert h["total_completed"] == 0
