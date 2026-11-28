#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Bounded prior-state refresh in the existing synthetic process world.
Real frozen neural inference; no actual deployment, authority or human participants."""
import hashlib,json,pathlib,tempfile,random,collections
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parent
PINS={"sovos_neural_stitch.py":"f6ea6f9f1ba2c34838629d3faab654075a995dc0","sovos_fused_readout.py":"5d6e9e4fab3bcaec4fabece423f60412e675f482","sovos_fresh_rehearsal.py":"7fc53993e283af7f1089314d36059789ad65e335","sovos_continual_intervention.py":"75f9fd0adff2bb4c40584272639857d7006b65aa"}
for name,want in PINS.items():
    b=(ROOT/name).read_bytes()
    if hashlib.sha1(("blob "+str(len(b))+"\0").encode()+b).hexdigest()!=want:raise ValueError("source drift "+name)
import sovos_neural_stitch as lab
import sovos_fresh_rehearsal as fresh
import sovos_continual_intervention as continual
def canon(x):return (json.dumps(x,sort_keys=True,separators=(",",":"),allow_nan=False)+"\n").encode()
def digest(b):return hashlib.sha256(b).hexdigest()
def main(out,protocol='original'):
    out.mkdir(exist_ok=False)
    plan={"schema":"private-sovos-prior-refresh/0.1","model":lab.PINS["weights.json"],"source_blobs":PINS,
      "oracle_revision":fresh.PIN,"validation_sha":lab.PINS["validation.jsonl"],
      "cohorts":[[k,lo,hi,76000+i*1000,48] for i,(k,lo,hi) in enumerate(continual.REGIMES)],
      "arms":["unassisted","peer_budget2","periodic_budget2","random_budget2","peer_missing_witness","all_prior_reference"],
      "threshold":"90th percentile max component actor vs mean of peers on published validation",
      "error_cutoff":.10,"budget":2,"budget_counts":"refresh requests including unavailable witnesses","periodic_ticks":[2,5],"random_seed":20261127,
      "primary":"paired mean absolute error and fraction of above-tolerance rows; cluster on matched seed across modes",
      "limits":"New simulator seeds, same published oracle and model; not new real-world cases. A refresh reads only previous simulated states; no current target enters prediction."}
    if protocol=="equal-budget":
        # Follow-up protocol fixed after the original experiment, before new seed generation.
        plan.update({"schema":"private-sovos-prior-refresh/0.2",
                     "protocol":"equal-budget","cohorts":[[k,lo,hi,79000+i*1000,48] for i,(k,lo,hi) in enumerate(continual.REGIMES)],
                     "arms":["unassisted","periodic_budget2","random_budget2","hybrid_budget2","deadline_budget2"],
                     "hybrid_rule":"one check in ticks 1–3 and one in 4–6; first disagreement above calibrated threshold or force at deadline",
                     "deadline_ticks":[3,6],
                     "primary":"hybrid minus periodic MAE, paired by seed; other comparisons exploratory",
                     "source_original_blob":"3a3e7954ce8ff22fb6b69a24ea453d3ec55d72ed"})
    elif protocol!="original":
        raise ValueError("unsupported protocol")
    (out/"plan.json").write_bytes(canon(plan))
    model=json.loads(lab.get("weights.json"));mu=np.asarray(model["scaler_mean"]);sd=np.asarray(model["scaler_scale"])
    def predict(x):
        return np.array([lab.constrain(lab.layers((x-mu)/sd,m)[1],x) for m in model["ensemble"]])
    vx,vy,_=lab.split(lab.get("validation.jsonl"),"validation")
    vp=predict(vx);threshold=float(np.quantile(np.max(np.abs(vp[0]-vp[1:].mean(0)),axis=1),.9))
    (out/"threshold.json").write_bytes(canon({"threshold":threshold,"plan_sha256":digest(canon(plan))}))
    print("FROZEN",digest(canon(plan)),threshold,flush=True)
    with tempfile.TemporaryDirectory(prefix="sovos-refresh-oracle-") as tmp:
        sim=fresh.install_oracle(pathlib.Path(tmp))
        rows=[r for k,lo,hi,start,n in plan["cohorts"] for r in continual.episode_rows(sim,k,lo,hi,start,n)]
    groups=collections.defaultdict(list)
    for r in rows:groups[r["domain"],r["episode"],r["mode"]].append(r)
    assert len(groups)==288 and len(rows)==2304
    receipts=[]
    for (domain,ep,mode),seq in groups.items():
        assert [r["tick"] for r in seq]==list(range(8))
        x=np.array([r["features"] for r in seq]);y=np.array([r["target"] for r in seq])
        # Verify supplied history represents previous outputs of the simulator.
        assert np.array_equal(x[1:,:4],y[:-1]) and np.array_equal(x[2:,4:8],y[:-2])
        for arm in plan["arms"]:
            last=x[0,:4].copy();last2=x[0,4:8].copy();used=0;missing=0;rs=[];random_ticks=set(random.Random(plan["random_seed"]+ep).sample(range(1,8),2))
            for j in range(8):
                f=x[j].copy();f[:4]=last;f[4:8]=last2
                ps=predict(f[None,:])[:,0];pre=ps[0];disc=float(np.max(np.abs(pre-ps[1:].mean(0))))
                request=j>0 and ((arm.startswith("peer_") and used+missing<2 and disc>threshold) or (arm=="periodic_budget2" and j in (2,5)) or (arm=="random_budget2" and j in random_ticks) or arm=="all_prior_reference")
                if arm=="deadline_budget2":
                    request=j in (3,6)
                elif arm=="hybrid_budget2":
                    # Never exceed one observation in each three-tick window.
                    request=((1<=j<=3 and used==0 and (disc>threshold or j==3))
                             or (4<=j<=6 and used==1 and (disc>threshold or j==6)))
                applied=False
                # Missing witness arm attempts a refresh but never obtains the prior observation.
                if request and arm=="peer_missing_witness":missing+=1
                elif request:
                    f[:8]=x[j,:8] # strictly previous states, no current target
                    used+=1;applied=True
                p=predict(f[None,:])[0,0] if applied else pre
                # On expiry, the selected previous state is preserved.
                assert np.isfinite(p).all() and np.all(p>=0) and np.isclose(p.sum(),1)
                if f[9]<=0:assert np.array_equal(p,f[:4])
                last2,last=f[:4].copy(),p.copy()
                rs.append({"tick":j,"requested":request,"applied":applied,"disagreement":disc,"mae":float(np.abs(p-y[j]).mean()),"bad":bool(np.max(np.abs(p-y[j]))>.1),"pre_bad":bool(np.max(np.abs(pre-y[j]))>.1)})
            assert used+missing<= (7 if arm=="all_prior_reference" else 2)
            if arm in ("hybrid_budget2","deadline_budget2","periodic_budget2","random_budget2"):assert used==2
            receipts.append({"domain":domain,"episode":ep,"mode":mode,"arm":arm,"refreshes":used,"missing":missing,"steps":rs})
    by={(r["domain"],r["episode"],r["mode"],r["arm"]):r for r in receipts}
    if "peer_missing_witness" in plan["arms"]:
        for key in groups:
            a=by[(*key,"unassisted")];b=by[(*key,"peer_missing_witness")]
            assert [s["mae"] for s in a["steps"]]==[s["mae"] for s in b["steps"]]
            assert not b["refreshes"]
    summary={}
    for arm in plan["arms"]:
        r=[r for r in receipts if r["arm"]==arm];s=[s for z in r for s in z["steps"]]
        errors=np.array([v["mae"] for v in s]);base=np.array([s["mae"] for z in r for s in by[(z["domain"],z["episode"],z["mode"],"unassisted")]["steps"]])
        paired=collections.defaultdict(list)
        for i,z in enumerate(r):paired[(z["domain"],z["episode"])].extend((base-errors)[i*8:i*8+8])
        # 144 independent seed groups within this deterministic simulator, not 2304 independent observations.
        delta=np.array([np.mean(v) for v in paired.values()])
        boot=np.random.default_rng(1729).choice(delta,(2000,len(delta)),replace=True).mean(1)
        summary[arm]={"mae":float(errors.mean()),"above_tolerance":sum(v["bad"] for v in s),"episodes_with_error":sum(any(v["bad"] for v in z["steps"]) for z in r),
          "refreshes":sum(z["refreshes"] for z in r),"missing_requests":sum(z["missing"] for z in r),
          "refresh_pre_error":sum(v["applied"] and v["pre_bad"] for v in s),"refresh_pre_within_tolerance":sum(v["applied"] and not v["pre_bad"] for v in s),
          "improvement_vs_unassisted_cluster_bootstrap95":[float(v) for v in np.quantile(boot,[.025,.975])],
          "bad_by_tick":[sum(z["steps"][j]["bad"] for z in r) for j in range(8)],
          "by_cohort":{k:{"mae":float(np.mean([v["mae"] for z in r if z["domain"]==k for v in z["steps"]])),"above_tolerance":sum(v["bad"] for z in r if z["domain"]==k for v in z["steps"]),"refreshes":sum(z["refreshes"] for z in r if z["domain"]==k)} for k,_,_,_,_ in plan["cohorts"]}}
    if protocol=="equal-budget":
        # Predeclared primary: positive delta = hybrid worse, negative = better.
        deltas=collections.defaultdict(list)
        for key in groups:
            a=by[(*key,"hybrid_budget2")];b=by[(*key,"periodic_budget2")]
            deltas[key[:2]].extend([u["mae"]-v["mae"] for u,v in zip(a["steps"],b["steps"])])
        dv=np.array([np.mean(v) for v in deltas.values()])
        boot=np.random.default_rng(1729).choice(dv,(2000,len(dv)),replace=True).mean(1)
        primary={"hybrid_minus_periodic_mae":float(dv.mean()),"cluster_bootstrap95":[float(v) for v in np.quantile(boot,[.025,.975])]}
    else:
        primary=None
    raw=canon(receipts);(out/"receipts.json").write_bytes(raw)
    report={"state":"FROZEN_NEURAL_REPLAY_SYNTHETIC_ORACLE","plan_sha256":digest(canon(plan)),"threshold":threshold,"seed_groups":144,"paired_mode_episodes":288,"rows_per_arm":2304,"bank_sha256":digest(canon(rows)),"receipt_sha256":digest(raw),"summary":summary,"primary_followup":primary,"limits":["Same synthetic oracle; no empirical world intervention or external reviewer.","Observed prior states available only by simulator assumption. Reference arm uses all prior states and is not a budget-matched comparator.","Missing witness control leaves predictions unchanged, not authorization to execute.","No training, GSPC admission, payment, production authority or model promotion."]}
    (out/"report.json").write_bytes(canon(report));print(json.dumps(report,indent=2),flush=True)
if __name__=="__main__":
    import argparse
    p=argparse.ArgumentParser();p.add_argument("--out",type=pathlib.Path,required=True);p.add_argument("--protocol",choices=("original","equal-budget"),default="original");a=p.parse_args();main(a.out,a.protocol)
