"""Tests for meok-sovereign-compliance-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_cmp_")
os.environ["SOV_CMP_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_compliance_mcp" in sys.modules:
        del sys.modules["meok_sovereign_compliance_mcp"]
    import meok_sovereign_compliance_mcp as m
    importlib.reload(m)
    return m

def test_check_eu():
    m = get_fresh()
    r = m.compliance_check("eu-ai-act")
    assert r["result"]["framework"] == "EU AI Act"
    assert r["result"]["score"] >= 0

def test_check_unknown():
    m = get_fresh()
    r = m.compliance_check("nope")
    assert "error" in r

def test_check_sovereign():
    m = get_fresh()
    r = m.compliance_check("csoai-care-floor")
    assert r["result"]["score"] == 16  # 100% of 16

def test_check_all():
    m = get_fresh()
    r = m.compliance_check_all()
    assert r["total_frameworks"] == 30
    assert r["average_compliance_rate"] > 0

def test_audit():
    m = get_fresh()
    r = m.compliance_audit()
    assert r["frameworks_audited"] == 30
    assert r["audit_id"].startswith("audit-")

def test_evidence():
    m = get_fresh()
    r = m.compliance_evidence()
    assert r["total"] >= 8

def test_status():
    m = get_fresh()
    r = m.compliance_status()
    assert r["total_frameworks"] == 30
    assert len(r["regions"]) >= 4

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.compliance_check("eu-ai-act"), m.compliance_check_all(),
              m.compliance_audit(), m.compliance_evidence(),
              m.compliance_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Check → Check all → Audit → Evidence → Status."""
    m = get_fresh()
    r1 = m.compliance_check("eu-ai-act")
    assert r1["result"]["framework"] == "EU AI Act"
    r2 = m.compliance_check_all()
    assert r2["total_frameworks"] == 30
    r3 = m.compliance_audit()
    assert r3["frameworks_audited"] == 30
    r4 = m.compliance_evidence()
    assert r4["total"] >= 8
    s = m.compliance_status()
    assert s["total_frameworks"] == 30

def test_30_frameworks():
    m = get_fresh()
    assert len(m.FRAMEWORKS) == 30

def test_5_categories():
    m = get_fresh()
    categories = set(f["category"] for f in m.FRAMEWORKS)
    assert len(categories) >= 5
