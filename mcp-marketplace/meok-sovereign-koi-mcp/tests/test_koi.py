"""Tests for meok-sovereign-koi-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_koi_")
os.environ["SOV_KOI_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_koi_mcp" in sys.modules:
        del sys.modules["meok_sovereign_koi_mcp"]
    import meok_sovereign_koi_mcp as m
    importlib.reload(m)
    return m

def test_swim_basic():
    m = get_fresh()
    r = m.koi_swim()
    assert r["stroke_n"] == 1
    assert r["form"] == "koi"

def test_swim_increments():
    m = get_fresh()
    m.koi_swim()
    m.koi_swim()
    m.koi_swim()
    r = m.koi_swim()
    assert r["stroke_n"] == 4

def test_swim_action_intent():
    m = get_fresh()
    r = m.koi_swim(action="learn", intent="understand sovereignty")
    assert r["action"] == "learn"
    assert r["intent"] == "understand sovereignty"

def test_status_initial():
    m = get_fresh()
    r = m.koi_status()
    assert r["form"] == "koi"
    assert r["strokes"] == 0

def test_status_after_swim():
    m = get_fresh()
    m.koi_swim()
    m.koi_swim()
    r = m.koi_status()
    assert r["strokes"] == 2
    assert r["year"] == 2

def test_evolve_to_dragon_at_1000():
    m = get_fresh()
    for _ in range(1000):
        m.koi_swim()
    s = m.koi_status()
    assert s["form"] == "dragon"
    assert s["composite"] == 10.0

def test_evolve_before_1000():
    m = get_fresh()
    r = m.koi_evolve("dragon")
    assert "error" in r

def test_evolve_after_1000():
    m = get_fresh()
    for _ in range(1000):
        m.koi_swim()
    r = m.koi_evolve("dragon")
    assert r["form"] == "dragon"

def test_teach_basic():
    m = get_fresh()
    r = m.koi_teach("Care Floor is non-negotiable")
    assert r["total_lessons"] == 1

def test_teach_no_lesson():
    m = get_fresh()
    r = m.koi_teach("")
    assert "error" in r

def test_teach_multiple():
    m = get_fresh()
    m.koi_teach("a")
    m.koi_teach("b")
    m.koi_teach("c")
    r = m.koi_teach("d")
    assert r["total_lessons"] == 4

def test_manifest():
    m = get_fresh()
    r = m.koi_manifest("Govern the AI economy", world_action="govern")
    assert r["intent"] == "Govern the AI economy"

def test_manifest_no_intent():
    m = get_fresh()
    r = m.koi_manifest("")
    assert "error" in r

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.koi_swim(), m.koi_status(), m.koi_evolve("koi"), m.koi_teach("x"), m.koi_manifest("x")]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Swim → Teach → Manifest → Status."""
    m = get_fresh()
    r1 = m.koi_swim(action="learn")
    assert r1["stroke_n"] == 1
    r2 = m.koi_teach("SIGIL chain is sovereign")
    assert r2["total_lessons"] == 1
    r3 = m.koi_manifest("Govern 33 hives", world_action="govern")
    assert r3["intent"] == "Govern 33 hives"
    r4 = m.koi_status()
    assert r4["lessons_learned"] == 1
