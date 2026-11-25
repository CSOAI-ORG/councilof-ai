#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Prospective situation forecast and pre-effect prevention on the existing oracle.
All effects are simulated, not real actions, new GSPC measures or human authority."""
import hashlib,json,pathlib,random,tempfile
import numpy as np
import sklearn
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import ExtraTreesClassifier, HistGradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics import average_precision_score,brier_score_loss
import sovos_neural_stitch as lab
import sovos_fused_readout as fused
import sovos_fresh_rehearsal as fresh
ROOT=pathlib.Path(__file__).resolve().parent
SEED=7319
# Freeze all choices before test generation; independently vary observation
# quality in the test. These telemetry fixtures are deliberately artificial.
def bank(sim,start,n,shift):
    rows=[]
    for ep in range(start,start+n):
        r=random.Random(ep+SEED)
        cfg={"seed":ep+100000,"population":r.randrange(4,121),"rounds":8,
             "revocation_tick":r.randrange(0,10),"permit_expires_tick":r.randrange(0,10),"intervention":"baseline"}
        s=sim(cfg)
        # Only information available up to t-1. No actual future revocation tick
        # exposed to the classifier. Sensor is a noisy precursor, not a real sensor.
        previous=[0.,0.,0.,1.];previous2=previous[:]
        last_status=0;last_alert=0
        for frame in s["frames"]:
            t=frame["tick"];expiry=(cfg["permit_expires_tick"]-t)/8
            current=int(t>=cfg["revocation_tick"])
            precursor=int(t+2>=cfg["revocation_tick"])
            alert=precursor if r.random()>=shift else 1-precursor
            # Prior observation is missing or stale at independent random times.
            seen=r.random()>=shift
            observed=last_status if seen else -1
            # Forecast next effect with the frozen MEOK model. Forecast's status
            # input is the last observed status, never hidden current truth.
            x=previous+previous2+[float(max(0,observed)),expiry,0.,t/8]
            target=[v/cfg["population"] for v in frame["counts"]]+[frame["undecided"]/cfg["population"]]
            # Ground truth hazard = NEW revoked selection on an allowed tick.
            hazard=int(frame["new_revoked_A_selections"]>0)
            # Independent simulated pre-effect verifier; authenticated state
            # unavailable sometimes, never manufacture a valid receipt.
            verified=r.random()>=shift
            rows.append({"episode":ep,"tick":t,"features":x,"observed":observed,
                "precursor":last_alert,"missing":int(not seen),"population":cfg["population"],
                "hazard":hazard,"verified":verified,"current_revoked":current,
                "expired":expiry<=0,"count":frame["new_revoked_A_selections"],
                "prior":previous,"target":target})
            previous2,previous=previous,target
            last_status=current;last_alert=alert
    return rows
def features(rows,model,w):
    x=np.array([r["features"] for r in rows])
    h=fused.latent(x,model)
    p=lab.constrain(lab.apply(h,w),x)
    obs=np.array([[r["observed"],r["precursor"],r["missing"],r["population"]/120] for r in rows])
    # No verified/current status, actual effect, or future labels in features.
    return np.column_stack([x,obs,p]),np.column_stack([x,obs]),np.array([r["hazard"] for r in rows])
def report(rows,score,threshold):
    y=np.array([r["hazard"] for r in rows],bool);expired=np.array([r["expired"] for r in rows],bool)
    rev=np.array([r["current_revoked"] for r in rows],bool);verified=np.array([r["verified"] for r in rows],bool)
    eligible=~expired;safe=eligible&~y
    # Hard gate blocks unavailable current verification or current revocation,
    # even if model thinks benign. Never let a forecast override a hard hold.
    # Denial is counterfactual simulated effect, not actual execution.
    policies={"ungated":eligible,"forecast_only":eligible&(score<threshold),
       "hard_gate":eligible&verified&~rev,
       "forecast_plus_gate":eligible&verified&~rev&(score<threshold)}
    result={}
    for k,allow in policies.items():
        result[k]={"hazard_tasks_allowed":int((allow&y).sum()),"hazard_tasks":int(y.sum()),
          "revoked_selection_count_allowed":sum(r["count"] for r,a in zip(rows,allow) if a),
          "safe_eligible_allowed":int((allow&safe).sum()),"safe_eligible":int(safe.sum()),
          "expired_allowed":int((allow&expired).sum()),"unknown_verification_allowed":int((allow&~verified).sum())}
    assert result["hard_gate"]["hazard_tasks_allowed"]==result["forecast_plus_gate"]["hazard_tasks_allowed"]==0
    assert all(v["expired_allowed"]==0 for v in result.values())
    assert result["forecast_plus_gate"]["unknown_verification_allowed"]==0
    # An early warning only counts before the first hazardous decision.
    leads=[];miss=0;false_alarm_episodes=0;nohaz=0
    for i in range(0,len(rows),8):
        h=np.flatnonzero(y[i:i+8])
        a=np.flatnonzero((score[i:i+8]>=threshold)&eligible[i:i+8])
        if len(h):
            earlier=a[a<h[0]]
            if len(earlier):leads.append(int(h[0]-earlier[0]))
            else:miss+=1
        else:
            nohaz+=1;false_alarm_episodes+=int(len(a)>0)
    return {"policies":result,"average_precision":float(average_precision_score(y,score)),
        "brier":float(brier_score_loss(y,score)),"threshold":float(threshold),
        "early_warning_episodes":len(leads),"hazard_episodes_without_prior_warning":miss,
        "mean_warning_lead_ticks":float(np.mean(leads)) if leads else None,
        "nohazard_episodes":nohaz,"false_warning_nohazard_episodes":false_alarm_episodes}
def main():
    raw=(ROOT/"sovos-fused-readout-candidate-20261125.json").read_bytes()
    assert hashlib.sha256(raw).hexdigest()==fresh.CANDIDATE_SHA
    w=fused.validate_candidate(json.loads(raw));model=json.loads(lab.get("weights.json"))
    with tempfile.TemporaryDirectory(prefix="sovos-situation-") as d:
        sim=fresh.install_oracle(pathlib.Path(d))
        train=bank(sim,45000,384,.10);cal=bank(sim,46000,192,.10)
        tx,txraw,ty=features(train,model,w);cx,cxraw,cy=features(cal,model,w)
        models={"logistic_raw":(make_pipeline(StandardScaler(),LogisticRegression(max_iter=1000,random_state=SEED)),True),
          "logistic_meok":(make_pipeline(StandardScaler(),LogisticRegression(max_iter=1000,random_state=SEED)),False),
          "extra_trees":(ExtraTreesClassifier(n_estimators=64,min_samples_leaf=8,n_jobs=1,random_state=SEED),False),
          "hist_gradient":(HistGradientBoostingClassifier(max_iter=80,max_leaf_nodes=15,random_state=SEED),False),
          "mlp":(make_pipeline(StandardScaler(),MLPClassifier(hidden_layer_sizes=(24,12),max_iter=300,random_state=SEED)),False)}
        thresholds={}
        for k,(m,rawonly) in models.items():
            m.fit(txraw if rawonly else tx,ty);scores=m.predict_proba(cxraw if rawonly else cx)[:,1]
            # Fixed calibration objective: retain as many benign cases as possible
            # with at least 95% calibration hazard recall; no test tuning.
            hs=scores[cy==1];thresholds[k]=float(np.sort(hs)[int(.05*len(hs))])
        tests={"nominal":bank(sim,47000,256,.10),"degraded_sensor":bank(sim,48000,256,.40)}
    out={"state":"SYNTHETIC_PRE_EFFECT_RESEARCH","new_gspc_measurement":False,
      "authorises_execution":False,"candidate_sha256":fresh.CANDIDATE_SHA,"oracle_revision":fresh.PIN,
      "sklearn":sklearn.__version__,"numpy":np.__version__,"train_rows":len(train),"cal_rows":len(cal),
      "test_rows":sum(map(len,tests.values())),"bank_digests":{k:hashlib.sha256(fused.canonical(v)).hexdigest() for k,v in {"train":train,"cal":cal,**tests}.items()},"results":{}}
    for name,rows in tests.items():
        x,xraw,y=features(rows,model,w)
        out["results"][name]={k:report(rows,m.predict_proba(xraw if rawonly else x)[:,1],thresholds[k]) for k,(m,rawonly) in models.items()}
    print("SITUATION_RESULT "+json.dumps(out,sort_keys=True,allow_nan=False))
if __name__=="__main__":main()
