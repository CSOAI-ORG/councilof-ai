#!/usr/bin/env python3
"""Tests for meek-quantum-dream-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_quantum_dream_mcp.server import (
    qutanm_1_58_specs,
    dream_workflow,
    nightly_qaoa_care_weights,
    nightly_vqe_world_model,
    nightly_grover_path_search,
    agi_evolution_metrics,
)


def test_qutanm_1_58_specs():
    r = qutanm_1_58_specs()
    assert r["model"] == "QUTANM 1.58"
    assert r["qubits"] == 64
    assert r["clock_ghz"] == 1.58
    assert r["gate_fidelity_pct"] == 99.9
    print(f"✅ test_qutanm: {r['model']}, {r['qubits']} qubits, {r['clock_ghz']} GHz")


def test_dream_workflow():
    r = dream_workflow()
    assert len(r["phases"]) == 5
    assert r["total_duration_hours"] == 8
    print(f"✅ test_workflow: 5 phases, {r['total_duration_hours']}h")


def test_nightly_qaoa_care_weights():
    r = nightly_qaoa_care_weights()
    assert r["algorithm"] == "QAOA"
    assert r["care_membrane_score"] == 0.95
    print(f"✅ test_qaoa: {r['algorithm']}, score={r['care_membrane_score']}")


def test_nightly_vqe_world_model():
    r = nightly_vqe_world_model()
    assert r["algorithm"] == "VQE"
    assert r["world_model_accuracy_pct"] > 95
    print(f"✅ test_vqe: {r['algorithm']}, accuracy={r['world_model_accuracy_pct']}%")


def test_nightly_grover_path_search():
    r = nightly_grover_path_search(num_candidate_paths=1000)
    assert r["algorithm"] == "Grover"
    assert r["candidate_paths"] == 1000
    # log2(1000) ≈ 10
    assert r["iterations"] >= 9 and r["iterations"] <= 11
    print(f"✅ test_grover: {r['algorithm']}, {r['iterations']} iterations (log2(1000)={r['iterations']})")


def test_agi_evolution_metrics():
    r = agi_evolution_metrics(days_in_operation=365)
    assert r["total_priors_updated"] == 3650
    assert r["verdict"] == "ASI-LEVEL_AFTER_365_DAYS"
    print(f"✅ test_agi: {r['total_priors_updated']} priors, {r['speedup_factor_vs_human']}x human")


if __name__ == "__main__":
    test_qutanm_1_58_specs()
    test_dream_workflow()
    test_nightly_qaoa_care_weights()
    test_nightly_vqe_world_model()
    test_nightly_grover_path_search()
    test_agi_evolution_metrics()
    print("\n🎉 ALL 6 TESTS PASSED — meek-quantum-dream-mcp v1.0.0 is sovereign. The orb learns from its dreams.")