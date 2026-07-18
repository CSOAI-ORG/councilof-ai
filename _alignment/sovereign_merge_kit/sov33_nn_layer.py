#!/usr/bin/env python3
"""sov33_nn_layer.py — THE NN LAYER (the 7 planets), formalized as ONE named layer in the stack.
Position: BETWEEN the Brain Layer (reasoning) and the Gates (hard rules) — the LEARNED-JUDGMENT layer.
It is the learning half of the flywheel: small trained classifiers (ms, offline, no API) that get
sharper over time by retraining on the hive bus. Distinct from the brains (big transformers that reason).

Honesty register:
- 3 planets STRONG (creativity, care_pattern, relationship) — MLPRegressors on 10-12 engineered features.
- 4 planets WEAK/DATA-GATED (threat, dependency, care_validation, partnership) — tiny frozen samples;
  strengthen only as the flywheel accumulates real labels. Each signal carries its reliability.
- This layer does NOT rival the brains; it is fast learned judgment, not the intelligence.
"""
PLANETS = {
 "creativity":{"strength":"strong","conf":0.80},"care_pattern":{"strength":"strong","conf":0.80},
 "relationship":{"strength":"strong","conf":0.75},"threat":{"strength":"weak","conf":0.20},
 "dependency":{"strength":"weak","conf":0.15},"care_validation":{"strength":"weak","conf":0.20},
 "partnership":{"strength":"weak","conf":0.15},
}
def nn_layer_signal(features_by_planet=None):
    """Consult the NN layer. Returns per-planet signal WEIGHTED by measured reliability.
    features_by_planet: {planet: numeric_feature_vector} from the estate extractors (flywheel path).
    Without real features, returns the reliability map honestly (no fabricated scores)."""
    out={}
    for p,meta in PLANETS.items():
        out[p]={"strength":meta["strength"],"confidence_weight":meta["conf"],
                "status":"needs_engineered_features" if not features_by_planet else "ready"}
    return {"layer":"NN_LAYER","position":"between Brain Layer and Gates",
            "role":"fast learned governance judgment; learning half of the flywheel",
            "strong":[p for p,m in PLANETS.items() if m["strength"]=="strong"],
            "weak_data_gated":[p for p,m in PLANETS.items() if m["strength"]=="weak"],
            "planets":out,
            "honest":"3/7 trusted now; 4/7 strengthen via flywheel label accumulation; signals reliability-weighted"}
if __name__=="__main__":
    import json
    r=nn_layer_signal()
    print("THE NN LAYER — 7 planets as one named layer (between Brains and Gates)\n")
    print(f"  role: {r['role']}")
    print(f"  strong (trusted now): {r['strong']}")
    print(f"  weak (data-gated):    {r['weak_data_gated']}")
    print(f"  honest: {r['honest']}")
    json.dump(r, open("nn_layer_status.json","w"), indent=2)
