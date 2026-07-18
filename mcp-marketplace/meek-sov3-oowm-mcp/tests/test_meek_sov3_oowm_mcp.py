#!/usr/bin/env python3
"""Tests for meek-sov3-oowm-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_sov3_oowm_mcp.server import (
    oowm_predict,
    oowm_traibgle_vote,
    oowm_update_priors,
    oowm_flag_retrain,
    oowm_score_history,
    oowm_status,
)


def test_oowm_predict():
    r = oowm_predict(prediction="test_prediction", confidence=0.85)
    assert r["confidence"] == 0.85
    assert "Mamba-2" in r["source"]
    print(f"✅ test_predict: {r['prediction']}, conf={r['confidence']}")


def test_oowm_traibgle_vote():
    r = oowm_traibgle_vote(good_voters=25, bad_voters=3, neutral_voters=5)
    assert r["verdict"] == "APPROVED"
    # (25 - 3) / 37 = 0.595
    assert 0.5 < r["traibgle_score"] < 0.7
    print(f"✅ test_traibgle_vote: score={r['traibgle_score']:.3f}, verdict={r['verdict']}")


def test_oowm_update_priors():
    r = oowm_update_priors(traibgle_score=0.75)
    assert r["mamba_ssd_updated"] is True
    print(f"✅ test_update_priors: mamba_ssd_updated={r['mamba_ssd_updated']}")


def test_oowm_flag_retrain():
    r = oowm_flag_retrain(traibgle_score=-0.85)
    assert r["vqe_retrain_queued"] is True
    print(f"✅ test_flag_retrain: vqe_retrain_queued={r['vqe_retrain_queued']}")


def test_oowm_score_history():
    r = oowm_score_history(num_predictions=1000)
    assert r["good_pct"] > 0.7
    assert r["net_traibgle_score"] > 0.6
    print(f"✅ test_score_history: {r['num_predictions']} predictions, net_traibgle={r['net_traibgle_score']:.3f}")


def test_oowm_status():
    r = oowm_status()
    assert "SOV3 OOWM" in r["architecture"]
    assert "Mamba-2" in r["central_sovereign"]
    assert r["verdict"] == "SOV3 OOWM IS THE SOVEREIGN WORLD MODEL WITH TRAIBGLE VOTING"
    print(f"✅ test_status: {r['verdict']}")


if __name__ == "__main__":
    test_oowm_predict()
    test_oowm_traibgle_vote()
    test_oowm_update_priors()
    test_oowm_flag_retrain()
    test_oowm_score_history()
    test_oowm_status()
    print("\n🎉 ALL 6 TESTS PASSED — meek-sov3-oowm-mcp v1.0.0 is sovereign. The SOV3 OOWM has Traibgle voting.")