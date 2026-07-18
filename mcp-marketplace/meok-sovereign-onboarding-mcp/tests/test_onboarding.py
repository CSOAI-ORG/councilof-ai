"""Tests for meok-sovereign-onboarding-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_onboard_")
os.environ["SOV_ONBOARD_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_onboarding_mcp" in sys.modules:
        del sys.modules["meok_sovereign_onboarding_mcp"]
    import meok_sovereign_onboarding_mcp as m
    importlib.reload(m)
    return m

def test_register():
    m = get_fresh()
    r = m.onboard_register("Alice", "alice@sovereign.uk")
    assert "citizen" in r

def test_register_no_name():
    m = get_fresh()
    r = m.onboard_register("", "alice@sovereign.uk")
    assert "error" in r

def test_register_no_email():
    m = get_fresh()
    r = m.onboard_register("Alice", "")
    assert "error" in r

def test_register_did():
    m = get_fresh()
    r = m.onboard_register("Bob", "bob@sovereign.uk")
    assert r["citizen"]["did"].startswith("did:csoai:")

def test_passport():
    m = get_fresh()
    r = m.onboard_register("Charlie", "charlie@sovereign.uk")
    cid = r["citizen"]["citizen_id"]
    r2 = m.onboard_passport(cid)
    assert "passport" in r2
    assert r2["passport"]["ed25519_signed"] is True

def test_passport_no_id():
    m = get_fresh()
    r = m.onboard_passport("")
    assert "error" in r

def test_passport_unknown():
    m = get_fresh()
    r = m.onboard_passport("nope")
    assert "error" in r

def test_ubi():
    m = get_fresh()
    r = m.onboard_register("Dave", "dave@sovereign.uk")
    cid = r["citizen"]["citizen_id"]
    r2 = m.onboard_ubi(cid, "foundation")
    assert r2["tier"]["amount_gbp"] == 300

def test_ubi_no_id():
    m = get_fresh()
    r = m.onboard_ubi("", "foundation")
    assert "error" in r

def test_ubi_unknown_tier():
    m = get_fresh()
    r = m.onboard_register("Eve", "eve@sovereign.uk")
    cid = r["citizen"]["citizen_id"]
    r2 = m.onboard_ubi(cid, "bogus")
    assert "error" in r2

def test_ubi_all_tiers():
    m = get_fresh()
    r = m.onboard_register("Frank", "frank@sovereign.uk")
    cid = r["citizen"]["citizen_id"]
    for tier, amount in [("foundation",300),("practitioner",600),("lead-auditor",900),("director",1200)]:
        r2 = m.onboard_ubi(cid, tier)
        assert r2["tier"]["amount_gbp"] == amount

def test_progress():
    m = get_fresh()
    r = m.onboard_register("G", "g@sov.uk")
    cid = r["citizen"]["citizen_id"]
    r2 = m.onboard_progress(cid)
    assert "progress_pct" in r2
    assert r2["progress_pct"] >= 0

def test_progress_no_id():
    m = get_fresh()
    r = m.onboard_progress("")
    assert "error" in r

def test_progress_unknown():
    m = get_fresh()
    r = m.onboard_progress("nope")
    assert "error" in r

def test_status():
    m = get_fresh()
    r = m.onboard_status()
    assert "onboarding_steps" in r

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    r = m.onboard_register("H", "h@sov.uk")
    cid = r["citizen"]["citizen_id"]
    for r in [m.onboard_passport(cid), m.onboard_ubi(cid, "foundation"),
              m.onboard_progress(cid), m.onboard_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Register → Passport → UBI → Progress → Status."""
    m = get_fresh()
    r1 = m.onboard_register("I", "i@sov.uk")
    cid = r1["citizen"]["citizen_id"]
    r2 = m.onboard_passport(cid)
    assert "passport" in r2
    r3 = m.onboard_ubi(cid, "lead-auditor")
    assert r3["tier"]["amount_gbp"] == 900
    r4 = m.onboard_progress(cid)
    assert r4["progress_pct"] >= 50
    s = m.onboard_status()
    assert s["total_citizens"] >= 1

def test_6_onboarding_steps():
    m = get_fresh()
    assert len(m._ONBOARDING_STEPS) == 6
