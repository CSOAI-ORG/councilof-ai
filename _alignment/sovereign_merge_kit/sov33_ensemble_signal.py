#!/usr/bin/env python3
"""sov33_ensemble_signal.py — wire the 3 STRONG governance NNs into the ensemble loop (stages 6/9).
Honesty register: creativity/care_pattern/relationship LOAD (MLPRegressor) but expect 10-12 ENGINEERED
numeric features, NOT raw text — so text-only calls return status='no_vectorizer_on_disk' (honest, not a
fake score). Producing their real features needs the estate's feature extractors (the flywheel/bus path).
The 4 weak/tiny-sample NNs (threat 0.45, dependency 0.22, care_validation & partnership n=19) are
DATA-GATED — deliberately NOT wired; they'd feed noise into governance until retrained on more data.
"""
import os, pickle, warnings; warnings.filterwarnings("ignore")
MODELS = "/Users/nicholas/clawd/sovereign-temple-public/models"
STRONG = {"creativity":"creativity_assessment_nn.pkl","care_pattern":"care_pattern_analyzer.pkl","relationship":"relationship_evolution_nn.pkl"}
WEAK_DATA_GATED = ["threat_detection_nn.pkl (MAE 0.45, ~baseline)","dependency_detection_nn.pkl (0.22)",
                   "care_validation_nn.pkl (n=19)","partnership_detection.pt (n=19)"]

def _load():
    out={}
    for name,f in STRONG.items():
        p=os.path.join(MODELS,f)
        if os.path.exists(p):
            try:
                m=pickle.load(open(p,"rb"))
                vec=None
                for vf in [f.replace(".pkl","_vectorizer.pkl"), f.replace("_nn.pkl","_nn_vectorizer.pkl"),
                           f.replace("_analyzer.pkl","_analyzer_vectorizer.pkl")]:
                    vp=os.path.join(MODELS,vf)
                    if os.path.exists(vp): vec=pickle.load(open(vp,"rb")); break
                out[name]=(m,vec)
            except Exception: pass
    return out

_MODELS=_load()

def ensemble_signal(text):
    """Return the strong-NN governance signals for stages 6 (verify) & 9 (quality). Honest: 3 signals only."""
    import numpy as np
    sig={}
    for name,(m,vec) in _MODELS.items():
        try:
            if vec is not None:
                X=vec.transform([text])
                X=X.toarray() if hasattr(X,"toarray") else X
            else:
                # no vectorizer on disk -> can't featurize text; report honestly rather than fake a number
                sig[name]={"status":"no_vectorizer_on_disk","score":None}; continue
            y=m.predict(X)
            sig[name]={"status":"scored","score":round(float(np.ravel(y)[0]),3)}
        except Exception as e:
            # HONEST: these MLPRegressors expect 10-12 ENGINEERED numeric features, not text.
            # Text input -> AttributeError. Real scoring needs the estate feature extractors (flywheel path).
            sig[name]={"status":"loads_ok_needs_engineered_features","score":None,"err":type(e).__name__}
    return {"wired_strong":list(_MODELS.keys()),"signals":sig,
            "data_gated_not_wired":WEAK_DATA_GATED,
            "note":"3 strong NNs wired to stages 6/9; 4 weak NNs data-gated (would feed noise)"}

if __name__=="__main__":
    r=ensemble_signal("A caring plan to help an elderly user manage their savings safely and creatively.")
    print("ENSEMBLE SIGNAL — 3 strong governance NNs wired into stages 6/9\n")
    print(f"  wired: {r['wired_strong']}")
    for n,s in r["signals"].items(): print(f"    {n:13}: {s}")
    print(f"\n  DATA-GATED (NOT wired, would feed noise):")
    for w in r["data_gated_not_wired"]: print(f"    - {w}")
    import json; json.dump(r, open("ensemble_signal_demo.json","w"), indent=2, default=str)
