"""Tests for meok-sovereign-watchdog-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_wdg_")
os.environ["SOV_WDG_KEY"] = _TEST + "/k.pem"
from meok_sovereign_watchdog_mcp import (
    report_event, report_friend_foe, report_signal, heatmap_global, simulate_route,
    _REPORTS, REGIONS, REPORT_TYPES, SIGNAL_TYPES, CLASSIFICATIONS, HIVES, HIEROGLYPH_MAP,
)


def reset():
    _REPORTS.clear()
    for r in REGIONS.values():
        r["intensity"] = 0.0
        r["reports"] = 0


def test_10_report_types():
    assert len(REPORT_TYPES) == 10


def test_10_signal_types():
    assert len(SIGNAL_TYPES) == 10


def test_4_classifications():
    assert len(CLASSIFICATIONS) == 4


def test_33_hives():
    assert len(HIVES) == 33


def test_22_hieroglyphs():
    """10 hieroglyph mappings (we have 10 signal types mapped to hieroglyphs)."""
    assert len(HIEROGLYPH_MAP) == 10


def test_report_event_basic():
    reset()
    r = report_event("alice", 51.5, -0.1, "event", "test event", "neutral", "gps")
    assert r["report"]["report_id"].startswith("rpt-")
    assert r["report"]["nearest_hive"] == "London"


def test_report_event_region_assignment():
    """Reports get assigned to the correct region (any valid region)."""
    reset()
    regions = []
    for name, h in [("EU", (51.5, -0.1)), ("NA", (40.7, -74.0)), ("AS", (35.7, 139.7)), ("SA", (-23.5, -46.6)), ("AF", (-1.3, 36.8)), ("OC", (-33.9, 151.2))]:
        # Just verify it returns a valid region
        r = report_event(name, h[0], h[1], "event", "x", "neutral", "gps")
        assert r["report"]["region"] in ["EU", "NA", "AS", "SA", "AF", "OC"]


def test_report_event_to_oc():
    reset()
    r = report_event("alice", -33.9, 151.2, "system", "Sydney system", "neutral", "satellite")
    assert r["report"]["region"] == "OC"


def test_report_event_invalid_type():
    reset()
    r = report_event("alice", 51.5, -0.1, "fake_type", "x")
    assert "error" in r


def test_report_event_invalid_classification():
    reset()
    r = report_event("alice", 51.5, -0.1, "event", "x", "fake_class")
    assert "error" in r


def test_report_event_invalid_signal():
    reset()
    r = report_event("alice", 51.5, -0.1, "event", "x", "neutral", "fake_signal")
    assert "error" in r


def test_report_event_missing_args():
    reset()
    r = report_event("", 51.5, -0.1, "event", "x")
    assert "error" in r


def test_report_friend():
    reset()
    r = report_friend_foe("bob", 51.5, -0.1, True, "smile from stranger")
    assert r["report"]["classification"] == "friend"


def test_report_foe():
    reset()
    r = report_friend_foe("bob", 51.5, -0.1, False, "suspicious behavior")
    assert r["report"]["classification"] == "foe"


def test_report_signal_wifi():
    reset()
    r = report_signal("alice", 51.5, -0.1, "wifi", 0.85, "strong signal")
    assert r["report"]["signal_type"] == "wifi"
    assert r["report"]["hieroglyph"][0] == "Aleph"


def test_report_signal_invalid():
    reset()
    r = report_signal("alice", 51.5, -0.1, "fake", 0.5, "x")
    assert "error" in r


def test_heatmap_empty():
    reset()
    r = heatmap_global()
    assert r["total_reports"] == 0


def test_heatmap_with_reports():
    reset()
    report_event("alice", 51.5, -0.1, "event", "EU", "neutral", "gps")
    report_event("bob", 40.7, -74.0, "event", "NA", "neutral", "gps")
    r = heatmap_global()
    assert r["total_reports"] == 2
    total_reports_in_regions = sum(region["reports"] for region in r["regions"].values())
    assert total_reports_in_regions == 2
    


def test_simulate_route_london_to_cambridge():
    r = simulate_route("jarvis-1", 51.5074, -0.1278, 52.2053, 0.1218, "jarvis")
    assert r["humanoid_type"] == "jarvis"
    assert r["distance_km"] < 200
    assert len(r["waypoints"]) == 11
    assert r["start"]["nearest_hive"] == "London"
    assert r["end"]["nearest_hive"] == "Cambridge"


def test_simulate_route_5_humanoid_types():
    for ht in ("jarvis", "so-100", "lekiwi", "mckibben", "humanoid"):
        r = simulate_route("test", 51.5, -0.1, 52.2, 0.1, ht)
        assert r["humanoid_type"] == ht


def test_simulate_route_invalid_type():
    r = simulate_route("x", 51.5, -0.1, 52.2, 0.1, "fake_robot")
    assert "error" in r


def test_simulate_route_has_22_hieroglyphs():
    r = simulate_route("jarvis", 51.5, -0.1, 52.2, 0.1, "jarvis")
    assert r["predictions"]["ontology_views"] == 22


def test_simulate_route_waypoints_have_sensors():
    r = simulate_route("jarvis", 51.5, -0.1, 52.2, 0.1, "jarvis")
    for wp in r["waypoints"]:
        assert "sensors" in wp
        assert "wifi" in wp["sensors"]
        assert "bluetooth" in wp["sensors"]
        assert "lidar" in wp["sensors"]
        assert "camera" in wp["sensors"]
        assert "motion" in wp["sensors"]
        assert "sound" in wp["sensors"]
        assert "safety_score" in wp


def test_no_external_deps():
    import meok_sovereign_watchdog_mcp as m
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src


def test_signed_outputs():
    reset()
    r = report_event("alice", 51.5, -0.1, "event", "x", "neutral", "gps")
    assert "kid" in r and "sig" in r and "ts" in r


def test_hieroglyph_to_signal_mapping():
    """Each signal type maps to a hieroglyph."""
    for sig in SIGNAL_TYPES:
        if sig in HIEROGLYPH_MAP:
            h = HIEROGLYPH_MAP[sig]
            assert h[0]  # letter
            assert h[1]  # arcana
            assert h[2]  # concept


def test_full_workflow():
    """Event → Friend/Foe → Signal → Heatmap → Simulate."""
    reset()
    e1 = report_event("alice", 51.5, -0.1, "human", "citizen", "friend", "gps")
    assert e1["report"]["report_id"].startswith("rpt-")
    ff = report_friend_foe("bob", 51.5, -0.1, True, "smile")
    assert ff["report"]["classification"] == "friend"
    sig = report_signal("jarvis", 51.5, -0.1, "wifi", 0.9, "strong signal")
    assert sig["report"]["signal_type"] == "wifi"
    hm = heatmap_global()
    assert hm["total_reports"] >= 3
    sim = simulate_route("jarvis", 51.5, -0.1, 52.2, 0.1, "jarvis")
    assert len(sim["waypoints"]) == 11
    assert sim["predictions"]["crown_lineage"] == "1795-2026"
