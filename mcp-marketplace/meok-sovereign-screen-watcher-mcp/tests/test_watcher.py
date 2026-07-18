"""Tests for meok-sovereign-screen-watcher-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_wd_")
os.environ["SOV_WDH_KEY"] = _TEST + "/k.pem"
from meok_sovereign_screen_watcher_mcp import (
    watcher_observe, watcher_detect_blockers, watcher_suggest_action, watcher_learn, watcher_status,
    _OBSERVATIONS, _LEARNED,
)


def reset():
    _OBSERVATIONS.clear()
    _LEARNED.clear()


def test_observe_basic():
    reset()
    r = watcher_observe("https://example.com/screen.png", "user is on home page")
    assert r["observation"]["screenshot_url"] == "https://example.com/screen.png"
    assert r["observation"]["description"] == "user is on home page"


def test_observe_accumulates():
    reset()
    watcher_observe()
    watcher_observe()
    assert len(_OBSERVATIONS) == 2


def test_detect_blockers_empty():
    reset()
    r = watcher_detect_blockers()
    assert r["total_windows"] == 0


def test_detect_blockers_with_popup():
    reset()
    r = watcher_detect_blockers("ad-popup, settings, navigation")
    assert r["total_windows"] == 3
    assert any(b["window"] == "ad-popup" for b in r["blockers"])
    assert any(b["action"] == "close" for b in r["blockers"])


def test_detect_blockers_with_sidebar():
    reset()
    r = watcher_detect_blockers("sidebar-toolbar, help-panel")
    assert any(b["action"] == "minimize" for b in r["blockers"])


def test_suggest_action_general():
    reset()
    r = watcher_suggest_action("general")
    assert "suggestion" in r


def test_suggest_action_tour():
    reset()
    r = watcher_suggest_action("tour")
    assert "next layer" in r["suggestion"].lower()


def test_suggest_action_demo():
    reset()
    r = watcher_suggest_action("demo")
    assert "demo" in r["suggestion"].lower() or "tour" in r["suggestion"].lower()


def test_suggest_action_explore():
    reset()
    r = watcher_suggest_action("explore")
    assert "hive" in r["suggestion"].lower() or "globe" in r["suggestion"].lower()


def test_suggest_action_learn():
    reset()
    r = watcher_suggest_action("learn")
    assert "fork" in r["suggestion"].lower() or "doctrine" in r["suggestion"].lower()


def test_learn_basic():
    reset()
    r = watcher_learn("clicked hive marker", "explore mode")
    assert r["pattern"]["action"] == "clicked hive marker"
    assert r["total_patterns"] == 1


def test_learn_empty():
    reset()
    r = watcher_learn("")
    assert "error" in r


def test_learn_accumulates():
    reset()
    watcher_learn("a", "x")
    watcher_learn("b", "y")
    assert len(_LEARNED) == 2


def test_status_initial():
    reset()
    r = watcher_status()
    assert r["total_observations"] == 0
    assert r["total_learned"] == 0
    assert r["watcher_status"] == "active"


def test_status_with_data():
    reset()
    watcher_observe()
    watcher_learn("a", "x")
    r = watcher_status()
    assert r["total_observations"] == 1
    assert r["total_learned"] == 1


def test_no_external_deps():
    import meok_sovereign_screen_watcher_mcp as m
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src


def test_signed_outputs():
    reset()
    for r in [watcher_observe(), watcher_detect_blockers(),
              watcher_suggest_action(), watcher_learn("x"), watcher_status()]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_workflow():
    """Observe → Detect → Suggest → Learn → Status."""
    reset()
    o = watcher_observe("url", "user on tour")
    assert o["total_observations"] == 1
    d = watcher_detect_blockers("ad-popup, sidebar")
    assert d["total_windows"] == 2
    s = watcher_suggest_action("tour")
    assert "suggestion" in s
    l = watcher_learn("clicked Next", "tour mode")
    assert l["total_patterns"] == 1
    st = watcher_status()
    assert st["total_observations"] == 1
    assert st["total_learned"] == 1
