"""Tests for meok-sovereign-e2e-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_e2e_")
os.environ["SOV_E2E_KEY"] = _TEST + "/k.pem"
from meok_sovereign_e2e_mcp import (
    audit_run, audit_mcp, audit_page, audit_doctrine, audit_history,
    _AUDITS, DOCTRINE_ELEMENTS, LAYERS, LICENSE,
)


def reset():
    _AUDITS.clear()


def test_21_doctrine_elements():
    assert len(DOCTRINE_ELEMENTS) == 21


def test_8_layers():
    assert len(LAYERS) == 8


def test_license():
    assert "MIT" in LICENSE and "CC0" in LICENSE


def test_audit_run_basic():
    reset()
    r = audit_run()
    assert r["audit"]["score"] >= 7.0
    assert r["audit"]["pass"] is True
    assert r["audit"]["results"]["mcp_count"] == 79


def test_audit_run_increments():
    reset()
    audit_run()
    audit_run()
    assert len(_AUDITS) == 2


def test_audit_run_composite():
    reset()
    r = audit_run()
    assert r["audit"]["results"]["sovereign_composite"] == 7.305


def test_audit_run_crown_lineage():
    reset()
    r = audit_run()
    assert r["audit"]["results"]["crown_lineage"] == "1795-2026"


def test_audit_mcp_valid():
    reset()
    r = audit_mcp("meok-sovereign-passport-mcp")
    assert r["score"] > 0
    assert r["pass"] is True


def test_audit_mcp_invalid():
    reset()
    r = audit_mcp("not-sovereign")
    assert "error" in r


def test_audit_mcp_empty():
    reset()
    r = audit_mcp("")
    assert "error" in r


def test_audit_mcp_checks():
    reset()
    r = audit_mcp("meok-sovereign-wallet-mcp")
    assert r["checks"]["exists"] is True
    assert r["checks"]["has_tests"] is True
    assert r["checks"]["no_external_deps"] is True


def test_audit_page_valid():
    reset()
    r = audit_page("world.html")
    assert r["score"] > 0


def test_audit_page_invalid():
    reset()
    r = audit_page("/world.html")
    assert "error" in r


def test_audit_page_checks():
    reset()
    r = audit_page("hub.html")
    assert r["checks"]["has_nav"] is True
    assert r["checks"]["has_launch_date"] is True
    assert r["checks"]["has_crown_lineage"] is True


def test_audit_doctrine():
    r = audit_doctrine()
    assert r["total"] == 21
    assert r["all_present"] is True


def test_audit_doctrine_first():
    r = audit_doctrine()
    assert "Defend" in r["elements"][0]


def test_audit_history_empty():
    reset()
    r = audit_history()
    assert r["total_audits"] == 0


def test_audit_history_with_entries():
    reset()
    audit_run()
    audit_run()
    r = audit_history()
    assert r["total_audits"] == 2


def test_audit_history_limit():
    reset()
    for _ in range(5):
        audit_run()
    r = audit_history(limit=3)
    assert len(r["recent"]) == 3


def test_no_external_deps():
    import meok_sovereign_e2e_mcp as m
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src


def test_signed_outputs():
    reset()
    for r in [audit_run(), audit_mcp("meok-sovereign-passport-mcp"),
              audit_page("world.html"), audit_doctrine()]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_doctrine_elements_contain_sovereign():
    all_text = " ".join(DOCTRINE_ELEMENTS)
    assert "Defend" in all_text
    assert "Care Floor 0.95" in all_text
    assert "BFT 12-around-1" in all_text
    assert "SIGIL" in all_text
    assert "Crown" in all_text or "1795" in all_text


def test_layers_eaten():
    expected = ["Atoms", "Primitives", "Composites", "Aggregates",
                "Applications", "Orchestration", "Presentation", "Distribution"]
    for layer_name in expected:
        assert any(layer_name in l for l in LAYERS), f"Missing layer: {layer_name}"


def test_full_workflow():
    reset()
    d = audit_doctrine()
    assert d["total"] == 21
    r = audit_run()
    assert r["audit"]["pass"] is True
    m = audit_mcp("meok-sovereign-passport-mcp")
    assert m["score"] > 0
    p = audit_page("world.html")
    assert p["score"] > 0
    h = audit_history()
    assert h["total_audits"] >= 1


def test_79_mcp_count_in_audit():
    reset()
    r = audit_run()
    assert r["audit"]["results"]["mcp_count"] == 79
