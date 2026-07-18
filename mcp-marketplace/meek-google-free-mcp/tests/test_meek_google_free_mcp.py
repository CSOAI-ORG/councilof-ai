#!/usr/bin/env python3
"""Tests for meek-google-free-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_google_free_mcp.server import (
    google_colab_session,
    gemini_free_inference,
    dm_control_rl_train,
    mediapipe_perception,
    coral_edge_tpu_inference,
)


def test_google_colab_session():
    r = google_colab_session(gpu_type="T4", session_hours=12.0, num_sessions=30)
    assert r["total_hours"] == 360
    assert r["cost_per_hour_usd"] == 0.0
    assert r["within_free_tier"] is True
    print(f"✅ test_colab_session: {r['total_hours']}h total, ${r['total_cost_usd']}, within free tier")


def test_gemini_free_inference():
    r = gemini_free_inference(prompt="Predict orb state", max_tokens=100)
    assert r["cost_per_call_usd"] == 0.0
    assert "Gemini" in r["engine"]
    print(f"✅ test_gemini_free: ${r['cost_per_call_usd']}, model={r['model']}")


def test_dm_control_rl_train():
    r = dm_control_rl_train(domain="humanoid", task="walk", algorithm="PPO", total_timesteps=100000)
    assert r["cost_usd"] == 0.0
    assert r["training_time_hours"] > 0
    print(f"✅ test_dm_control: {r['training_time_hours']:.1f}h training, ${r['cost_usd']}")


def test_mediapipe_perception():
    r = mediapipe_perception(input_type="video_stream", model="blaze_face", on_device=True)
    assert r["fps"] > 0
    assert r["latency_ms"] > 0
    print(f"✅ test_mediapipe: {r['fps']} fps, {r['latency_ms']:.1f}ms latency")


def test_coral_edge_tpu_inference():
    r = coral_edge_tpu_inference(model="mamba-130m-quantized", inference_rate_hz=100.0)
    assert r["tops"] == 4.0
    assert r["power_w"] == 2.0
    assert r["efficiency_inf_per_watt"] == 50.0
    print(f"✅ test_coral_tpu: {r['throughput_inferences_per_sec']} inf/s, {r['efficiency_inf_per_watt']} inf/W")


if __name__ == "__main__":
    test_google_colab_session()
    test_gemini_free_inference()
    test_dm_control_rl_train()
    test_mediapipe_perception()
    test_coral_edge_tpu_inference()
    print("\n🎉 ALL 5 TESTS PASSED — meek-google-free-mcp v1.0.0 is sovereign. $0 compute path.")