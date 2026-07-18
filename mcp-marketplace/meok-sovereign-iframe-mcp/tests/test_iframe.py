"""Tests for meok-sovereign-iframe-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_ifr_")
os.environ["SOV_IFR_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_iframe_mcp" in sys.modules:
        del sys.modules["meok_sovereign_iframe_mcp"]
    import meok_sovereign_iframe_mcp as m
    importlib.reload(m)
    return m

def test_open_basic():
    m = get_fresh()
    r = m.iframe_open("https://example.com", title="Example")
    assert r["window"]["url"] == "https://example.com"
    assert r["total_windows"] == 1

def test_open_no_url():
    m = get_fresh()
    r = m.iframe_open("")
    assert "error" in r

def test_open_default_title():
    m = get_fresh()
    r = m.iframe_open("https://example.com/foo/bar")
    assert r["window"]["title"] == "bar"

def test_close():
    m = get_fresh()
    r = m.iframe_open("https://example.com")
    win_id = r["window"]["window_id"]
    r2 = m.iframe_close(win_id)
    assert r2["closed"] == win_id
    assert r2["total_windows"] == 0

def test_close_invalid():
    m = get_fresh()
    r = m.iframe_close("nope")
    assert "error" in r

def test_resize():
    m = get_fresh()
    r = m.iframe_open("https://example.com")
    win_id = r["window"]["window_id"]
    r2 = m.iframe_resize(win_id, x=50, y=50, w=800, h=600)
    assert r2["window"]["w"] == 800

def test_resize_invalid():
    m = get_fresh()
    r = m.iframe_resize("nope")
    assert "error" in r

def test_list():
    m = get_fresh()
    m.iframe_open("https://a.com", title="A")
    m.iframe_open("https://b.com", title="B")
    r = m.iframe_list()
    assert r["total"] == 2

def test_msg():
    m = get_fresh()
    r = m.iframe_open("https://a.com")
    win_id = r["window"]["window_id"]
    r2 = m.iframe_msg(win_id, msg_type="care_floor_check", payload='{"floor":0.95}')
    assert r2["message"]["msg_type"] == "care_floor_check"

def test_msg_invalid_window():
    m = get_fresh()
    r = m.iframe_msg("nope")
    assert "error" in r

def test_signed_outputs():
    m = get_fresh()
    r = m.iframe_open("https://example.com")
    assert "kid" in r and "sig" in r and "ts" in r

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_browser_call_present():
    m = get_fresh()
    r = m.iframe_open("https://example.com")
    assert "iframe.open" in r["browser_call"]

def test_full_workflow():
    m = get_fresh()
    r1 = m.iframe_open("https://cesium.com", title="Cesium 3D")
    win_id = r1["window"]["window_id"]
    r2 = m.iframe_resize(win_id, x=10, y=10, w=1000, h=700)
    assert r2["window"]["w"] == 1000
    r3 = m.iframe_msg(win_id, payload='{"action":"fly_to","lat":51.5,"lng":-0.13}')
    assert r3["message"]["payload"] != "{}"
    r4 = m.iframe_close(win_id)
    assert r4["total_windows"] == 0
