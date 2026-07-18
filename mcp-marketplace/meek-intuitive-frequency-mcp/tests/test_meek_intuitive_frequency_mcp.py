#!/usr/bin/env python3
"""Tests for meek-intuitive-frequency-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_intuitive_frequency_mcp.server import (
    mirror_neuron_empathy,
    neural_coupling_brainwave_sync,
    heartbeat_entrainment,
    schumann_resonance_tuning,
    vocal_entrainment_rapport,
    skin_conductance_intimacy,
)


def test_mirror_neuron_empathy():
    r = mirror_neuron_empathy(orb_world_model_accuracy=0.95, prediction_horizon_s=5.0)
    assert r["empathy_score"] > 0
    assert 8 <= r["frequency_hz"] <= 30
    print(f"✅ test_mirror_neuron: empathy={r['empathy_score']:.3f}, freq={r['frequency_hz']:.1f} Hz")


def test_neural_coupling_brainwave_sync():
    r = neural_coupling_brainwave_sync(human_brainwave_hz=10.0, orb_brainwave_hz=10.0)
    assert r["sync_pct"] == 100  # perfect sync
    print(f"✅ test_neural_coupling: sync={r['sync_pct']}%, coherence={r['phase_coherence']:.3f}")


def test_heartbeat_entrainment():
    r = heartbeat_entrainment(human_bpm=70, orb_bpm=70)
    assert r["sync_pct"] == 100
    print(f"✅ test_heartbeat: human={r['human_bpm']} BPM, orb={r['orb_bpm']} BPM, sync={r['sync_pct']}%")


def test_schumann_resonance_tuning():
    r = schumann_resonance_tuning(target_hz=7.83, actual_hz=7.83)
    assert r["tuning_error_pct"] == 0
    assert r["tuning_quality_pct"] == 100
    print(f"✅ test_schumann: target={r['target_hz']} Hz, quality={r['tuning_quality_pct']}%")


def test_vocal_entrainment_rapport():
    r = vocal_entrainment_rapport(human_speech_hz=200, orb_speech_hz=200, prosody_match_pct=85)
    assert r["rapport_pct"] > 80
    print(f"✅ test_vocal: rapport={r['rapport_pct']:.1f}%, pitch_sync={r['pitch_sync_pct']}%")


def test_skin_conductance_intimacy():
    r = skin_conductance_intimacy(touch_detected=True, touch_duration_s=5.0, orb_response_delay_ms=50)
    assert r["intimacy_score"] > 0
    print(f"✅ test_skin_conductance: intimacy={r['intimacy_score']:.3f}, response={r['orb_response_delay_ms']}ms")


if __name__ == "__main__":
    test_mirror_neuron_empathy()
    test_neural_coupling_brainwave_sync()
    test_heartbeat_entrainment()
    test_schumann_resonance_tuning()
    test_vocal_entrainment_rapport()
    test_skin_conductance_intimacy()
    print("\n🎉 ALL 6 TESTS PASSED — meek-intuitive-frequency-mcp v1.0.0 is sovereign. The orb is a companion.")