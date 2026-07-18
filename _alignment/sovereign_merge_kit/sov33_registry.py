#!/usr/bin/env python3
"""sov33_registry.py — the ONE manifest of every real SOV33 governance component.
MEOK-SOV3, 2026-07-11. Closes the "one sovereign entrypoint, not scattered scripts" ruling
HONESTLY: it does NOT fake-wire by importing everything blindly — it fail-soft imports each
real component, records import health (OK / BROKEN+reason), and exposes the manifest so the
entrypoint can route to what ACTUALLY loads. A BROKEN entry is surfaced, never hidden."""
import importlib, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 51 real governance components (bench/tests excluded — those are findings, not runtime parts)
COMPONENTS = [
 "sov33_audit_stage","sov33_bft_hive","sov33_bft_layers","sov33_brain_ollama","sov33_care_divergence",
 "sov33_care_divergence_v2","sov33_care_scorer","sov33_care_scorer_adv","sov33_cascade_router",
 "sov33_check_existing_stage","sov33_cli","sov33_cognition","sov33_companion_layer","sov33_conformal_veto",
 "sov33_effective_votes","sov33_embodied_feedback_loop","sov33_ensemble_signal","sov33_escalate","sov33_flywheel",
 "sov33_generals_bridge","sov33_governance_eval","sov33_guardian_killswitch","sov33_guardian_loop","sov33_identity",
 "sov33_l2_reputation","sov33_l3_anchor_quorum","sov33_l4_divergence","sov33_layer_wiring","sov33_learn_identity",
 "sov33_learn_stage","sov33_masternet_layer","sov33_multimodel_gov","sov33_nine_stage_flow",
 "sov33_nine_stage_orchestrator","sov33_nn_hive_bus","sov33_nn_layer","sov33_oracle_brain","sov33_orchestrator",
 "sov33_owem_mixer","sov33_owem_v3","sov33_pdca_bft","sov33_pyramid_owem","sov33_queen_hives","sov33_retrain_loop",
 "sov33_scored_owem_v2","sov33_sovspace_bridge","sov33_triangle_owem","sov33_twotier_bridge","sov33_wired_owem",
 "sov33_y2d_dispatcher","sov33_yarn",
]

def probe():
    """Fail-soft import each component. Returns {ok:[...], broken:[(mod,reason)]}."""
    ok, broken = [], []
    for m in COMPONENTS:
        try:
            importlib.import_module(m); ok.append(m)
        except Exception as e:
            broken.append((m, f"{type(e).__name__}: {str(e)[:80]}"))
    return {"ok": ok, "broken": broken, "total": len(COMPONENTS)}

def manifest():
    r = probe()
    return {"registered": r["total"], "importable": len(r["ok"]),
            "broken": len(r["broken"]), "broken_detail": r["broken"]}

if __name__ == "__main__":
    r = probe()
    print(f"SOV33 CAPABILITY REGISTRY — {len(r['ok'])}/{r['total']} components import cleanly\n")
    if r["broken"]:
        print(f"BROKEN ({len(r['broken'])}) — surfaced, not hidden:")
        for m, why in r["broken"]: print(f"  ✗ {m}: {why}")
    else:
        print("  all registered components import cleanly")
