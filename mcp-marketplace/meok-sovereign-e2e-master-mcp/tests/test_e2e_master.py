"""Tests for meok-sovereign-e2e-master-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_e2e_")
os.environ["SOV_E2E_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_e2e_master_mcp" in sys.modules:
        del sys.modules["meok_sovereign_e2e_master_mcp"]
    import meok_sovereign_e2e_master_mcp as m
    importlib.reload(m)
    return m

def test_run_all():
    m = get_fresh()
    r = m.e2e_run_all()
    assert r["summary"]["pass_rate"] == 1.0

def test_run_all_specific_suite():
    m = get_fresh()
    r = m.e2e_run_all("sovereign")
    assert "run_id" in r

def test_run_journey():
    m = get_fresh()
    r = m.e2e_run_journey("journey-citizen-onboard")
    assert r["all_passed"] is True

def test_run_journey_unknown():
    m = get_fresh()
    r = m.e2e_run_journey("nope")
    assert "error" in r

def test_run_journey_bft():
    m = get_fresh()
    r = m.e2e_run_journey("journey-bft-vote")
    assert r["all_passed"] is True

def test_run_contract():
    m = get_fresh()
    r = m.e2e_run_contract()
    assert r["pass_rate"] == 1.0

def test_scorecard():
    m = get_fresh()
    r = m.e2e_scorecard()
    assert "100%" in r["scorecard"]["pass_rate"]
    assert r["scorecard"]["total_mcps"] >= 100

def test_status():
    m = get_fresh()
    r = m.e2e_status()
    assert r["journeys_available"] >= 5

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    m.e2e_run_all()
    for r in [m.e2e_run_journey("journey-citizen-onboard"),
              m.e2e_run_contract(), m.e2e_scorecard(), m.e2e_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Run all → Journey → Contract → Scorecard → Status."""
    m = get_fresh()
    r1 = m.e2e_run_all()
    assert r1["summary"]["passing"] >= 100
    r2 = m.e2e_run_journey("journey-citizen-onboard")
    assert r2["all_passed"] is True
    r3 = m.e2e_run_contract()
    assert r3["pass_rate"] == 1.0
    r4 = m.e2e_scorecard()
    assert "100%" in r4["scorecard"]["pass_rate"]
    s = m.e2e_status()
    assert s["total_runs"] >= 1

def test_8_journeys():
    m = get_fresh()
    assert len(m.JOURNEYS) >= 8

def test_100_mcps():
    m = get_fresh()
    assert len(m.SOVEREIGN_MCPS) >= 100
