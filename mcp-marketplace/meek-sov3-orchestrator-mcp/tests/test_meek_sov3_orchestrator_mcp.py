#!/usr/bin/env python3
"""Tests for meek-sov3-orchestrator-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_sov3_orchestrator_mcp.server import (
    sov3_brain_status,
    sov3_orchestrate_orbs,
    sov3_bft_council_vote,
    sov3_sigil_sign_command,
    sov3_mamba_world_model_predict,
)


def test_sov3_brain_status():
    r = sov3_brain_status()
    assert r["status"] == "ONLINE"
    assert "Mamba-2" in r["architecture"]
    assert r["knowledge_base_size_docs"] >= 30
    print(f"✅ test_sov3_brain_status: ONLINE, {r['throughput_tokens_per_sec']} tok/s")


def test_sov3_orchestrate_orbs():
    r = sov3_orchestrate_orbs(num_orbs=5005, sync_interval_ms=100)
    assert r["total_commands_per_sec"] > 0
    assert r["verdict"] in ("SYNCHRONIZED", "BOTTLENECK")
    print(f"✅ test_sov3_orchestrate: {r['total_commands_per_sec']:.0f} cmds/sec, {r['verdict']}")


def test_sov3_bft_council_vote():
    r = sov3_bft_council_vote(proposal="actuate_muscle_group", votes_for=25, votes_against=5)
    assert r["verdict"] == "APPROVED"
    assert r["quorum_required"] == 23
    print(f"✅ test_sov3_bft_council: {r['verdict']} ({r['consensus_pct']*100:.1f}% consensus)")


def test_sov3_sigil_sign_command():
    r = sov3_sigil_sign_command(command="actuate_muscle_group", orb_id="muscle_001")
    assert r["signature"] is not None
    assert len(r["signature"]) >= 64
    print(f"✅ test_sov3_sigil_sign: signed ({len(r['signature'])} chars)")


def test_sov3_mamba_world_model_predict():
    r = sov3_mamba_world_model_predict(current_state="standing_neutral", sequence_length=1000)
    assert r["inference_time_ms"] > 0
    assert "Mamba-2" in r["architecture"]
    print(f"✅ test_sov3_mamba_predict: {r['inference_time_ms']}ms inference")


if __name__ == "__main__":
    test_sov3_brain_status()
    test_sov3_orchestrate_orbs()
    test_sov3_bft_council_vote()
    test_sov3_sigil_sign_command()
    test_sov3_mamba_world_model_predict()
    print("\n🎉 ALL 5 TESTS PASSED — meek-sov3-orchestrator-mcp v1.0.0 is sovereign.")