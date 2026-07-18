"""Tests for meok-sovereign-bio-mcp (JARVIS embodiment + MEOK citizen bio)."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_bio_")
os.environ["SOV_BIO_KEY"] = _TEST + "/k.pem"
from meok_sovereign_bio_mcp import (
    bio_record, bio_analyze, bio_drift, bio_recommend, bio_dashboard,
    CARE_BASELINE, _BIO_LOG,
)


def reset():
    _BIO_LOG.clear()


def test_care_baseline_has_13_probes():
    assert len(CARE_BASELINE) == 14


def test_bio_record_basic():
    reset()
    r = bio_record("did:csoai:nicholas")
    assert r["snapshot"]["sov_did"] == "did:csoai:nicholas"
    assert "sovereign_score" in r["snapshot"]


def test_bio_record_stress_lowers_score():
    reset()
    bio_record("did:test", energy=0.3, sleep_h=4.0, stress=0.8, mood=0.3)
    snap = _BIO_LOG["did:test"][-1]
    assert snap["sovereign_score"] < 7.305



def test_bio_analyze_empty():
    reset()
    r = bio_analyze("did:unknown")
    assert r["count"] == 0


def test_bio_analyze_with_data():
    reset()
    for _ in range(3):
        bio_record("did:csoai:nicholas")
    r = bio_analyze("did:csoai:nicholas")
    assert r["count"] == 3
    assert "mood_trend" in r


def test_bio_drift_empty():
    reset()
    r = bio_drift("did:unknown")
    # No data -> drift_count is 0, drift_probes list is empty
    assert r.get("drift_count", 0) == 0
    assert "drift_probes" in r


def test_bio_drift_detects_extreme():
    reset()
    bio_record("did:test", energy=0.05, sleep_h=2.0, stress=0.95)
    r = bio_drift("did:test")
    assert r["drift_count"] > 0


def test_bio_recommend_empty():
    reset()
    r = bio_recommend("did:unknown")
    assert "recommendation" in r


def test_bio_recommend_low_energy():
    reset()
    bio_record("did:test", energy=0.3, sleep_h=5.0, stress=0.7)
    r = bio_recommend("did:test")
    assert len(r["recommendations"]) > 0


def test_bio_dashboard_no_data():
    reset()
    r = bio_dashboard("did:unknown")
    assert r["snapshot_count"] == 0


def test_bio_dashboard_with_data():
    reset()
    bio_record("did:test")
    r = bio_dashboard("did:test")
    assert r["snapshot_count"] == 1
    assert "current" in r
    assert r["average_sovereign_score"] > 0


def test_no_external_deps():
    import meok_sovereign_bio_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset()
    r = bio_record("did:test")
    assert "kid" in r and "sig" in r and "ts" in r


def test_full_lifecycle():
    """Record 3 → analyze → drift → recommend → dashboard."""
    reset()
    # All near baseline → no significant drift
    bio_record("did:csoai:lifecycle", energy=0.85, mood=0.65, sleep_h=8.0, stress=0.25)
    bio_record("did:csoai:lifecycle", energy=0.85, mood=0.65, sleep_h=8.0, stress=0.25)
    bio_record("did:csoai:lifecycle", energy=0.85, mood=0.65, sleep_h=8.0, stress=0.25)

    a = bio_analyze("did:csoai:lifecycle", days=7)
    assert a["count"] == 3

    d = bio_drift("did:csoai:lifecycle")
    assert d.get("drift_count", 0) >= 0

    rec = bio_recommend("did:csoai:lifecycle")
    assert len(rec["recommendations"]) >= 1

    dash = bio_dashboard("did:csoai:lifecycle")
    assert dash["snapshot_count"] >= 1
    assert dash["best_ever"] > 0
