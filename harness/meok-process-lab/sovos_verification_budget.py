#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Bounded synthetic verification scheduling and common-mode source controls.
No external action, real verifier, GSPC measurement or authority is established."""
import hashlib,json,pathlib,tempfile
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
import sovos_neural_stitch as lab
import sovos_fused_readout as fused
import sovos_fresh_rehearsal as fresh
import sovos_situation_prevention as situation
ROOT=pathlib.Path(__file__).resolve().parent
SEED=19117
def evaluate(rows,score,budget,outage):
    y=np.array([r["hazard"] for r in rows],bool)
    expired=np.array([r["expired"] for r in rows],bool)
    rev=np.array([r["current_revoked"] for r in rows],bool)
    known=np.array([r["verified"] for r in rows],bool)
    ticks=np.array([r["tick"] for r in rows])
    eligible=~expired; safe=eligible&~y
    rng=np.random.default_rng(SEED)
    # Refresh success is an artificial independently drawn property. Under
    # common outage the same missing original channel is harder to refresh.
    refresh_ok=rng.random(len(rows))<(.8 if not outage else .15)
    rnd=rng.random(len(rows))
    policies={"no_refresh":np.zeros(len(rows),bool),"fifo":None,"random":None,
      "risk_first":None,"utility_first":None,"precursor_first":None}
    prior=np.array([r["precursor"] for r in rows])
    for name in policies:
        if name=="no_refresh":continue
        picked=np.zeros(len(rows),bool)
        for t in range(8):
            ids=np.flatnonzero((ticks==t)&eligible&~known)
            ranking={"fifo":ids,"random":rnd[ids],"risk_first":-score[ids],
              "utility_first":score[ids],"precursor_first":-prior[ids]}[name]
            ordered=ids[np.argsort(ranking,kind="stable")]
            picked[ordered[:budget]]=True
        policies[name]=picked
    out={}
    for name,picked in policies.items():
        verified=known|(picked&refresh_ok)
        allow=eligible&verified&~rev
        assert not (allow&y).any() and not (allow&~verified).any()
        out[name]={"attempts":int(picked.sum()),"successful_refreshes":int((picked&refresh_ok).sum()),
          "safe_allowed":int((allow&safe).sum()),"safe_eligible":int(safe.sum()),
          "hazard_verified_by_refresh":int((picked&refresh_ok&y).sum()),
          "hazards_allowed":int((allow&y).sum()),"unknown_allowed":int((allow&~verified).sum())}
    return out
def source_faults(rows):
    eligible=np.array([not r["expired"] for r in rows])
    revoked=np.array([r["current_revoked"] for r in rows],bool)
    y=np.array([r["hazard"] for r in rows],bool)
    rng=np.random.default_rng(SEED+1)
    # Two nominally authenticated sources can still report a wrong state.
    # This is a semantic source fault fixture, not cryptographic compromise.
    avail1=rng.random(len(rows))<.9;avail2=rng.random(len(rows))<.9
    error1=rng.random(len(rows))<.1
    independent=rng.random(len(rows))<.1
    common=error1.copy()
    status1=revoked^error1
    status2=revoked^independent
    common2=revoked^common
    allow={"one_source":eligible&avail1&~status1,
           "cloned_source":eligible&avail1&~status1&~status1,
           "two_independent":eligible&avail1&avail2&~status1&~status2,
           "two_common_mode":eligible&avail1&avail2&~status1&~common2}
    out={}
    for name,a in allow.items():
        out[name]={"hazards_allowed":int((a&y).sum()),
          "hazards_total":int(y.sum()),"benign_allowed":int((a&eligible&~y).sum()),
          "benign_eligible":int((eligible&~y).sum())}
    assert out["one_source"]==out["cloned_source"]
    return out
def main():
    raw=(ROOT/"sovos-fused-readout-candidate-20261125.json").read_bytes()
    assert hashlib.sha256(raw).hexdigest()==fresh.CANDIDATE_SHA
    w=fused.validate_candidate(json.loads(raw));model=json.loads(lab.get("weights.json"))
    with tempfile.TemporaryDirectory(prefix="sovos-budget-") as d:
        sim=fresh.install_oracle(pathlib.Path(d))
        train=situation.bank(sim,45000,384,.10)
        x,_,y=situation.features(train,model,w)
        estimator=make_pipeline(StandardScaler(),LogisticRegression(max_iter=1000,random_state=7319))
        estimator.fit(x,y)
        # New episode IDs; no fit, calibration or policy choice on these labels.
        test={k:situation.bank(sim,start,256,shift) for k,start,shift in
              (("nominal",51000,.10),("degraded",52000,.40))}
    output={"state":"SYNTHETIC_VERIFICATION_SCHEDULING","candidate_sha256":fresh.CANDIDATE_SHA,
      "authorises_execution":False,"new_gspc_measurement":False,"test_rows":sum(map(len,test.values())),
      "bank_digests":{k:hashlib.sha256(fused.canonical(v)).hexdigest() for k,v in test.items()},
      "results":{}}
    for k,rows in test.items():
        x,_,_=situation.features(rows,model,w)
        scores=estimator.predict_proba(x)[:,1]
        output["results"][k]={"source_faults":source_faults(rows),"schedules":{}}
        for budget in (8,24):
            for outage in (False,True):
                output["results"][k]["schedules"][f"budget_{budget}_outage_{outage}"]=evaluate(rows,scores,budget,outage)
    print("BUDGET_RESULT "+json.dumps(output,sort_keys=True,allow_nan=False))
if __name__=="__main__":main()
