#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Frozen neural features: prospective replay, interventions and fidelity.
Research-only synthetic oracle; no production authority or new GSPC score."""
import hashlib,json,pathlib,random,tempfile
import numpy as np
import sovos_neural_stitch as lab
import sovos_fused_readout as fused
import sovos_fresh_rehearsal as fresh

ROOT=pathlib.Path(__file__).resolve().parent
REGIMES=(("nominal",16,97),("small",4,16),("large",97,121))
N_TRAIN=64
N_TEST=96
N_CAL=48

def episode_rows(simulate,domain,lo,hi,start,n):
    rows=[]
    for ep in range(start,start+n):
        rng=random.Random(980000+ep)
        cfg={"seed":100000+ep,"population":rng.randrange(lo,hi),"rounds":8,
             "revocation_tick":rng.randrange(0,10),"permit_expires_tick":rng.randrange(0,10)}
        for mode in ("baseline","evidence-aware"):
            s=simulate({**cfg,"intervention":mode})
            prev=[0.,0.,0.,1.];prev2=prev[:]
            for frame in s["frames"]:
                t=frame["tick"];p=cfg["population"]
                target=[v/p for v in frame["counts"]]+[frame["undecided"]/p]
                x=prev+prev2+[float(t>=cfg["revocation_tick"]),(cfg["permit_expires_tick"]-t)/8,float(mode=="evidence-aware"),t/8]
                rows.append({"domain":domain,"episode":ep,"mode":mode,"tick":t,"features":x,"target":target})
                prev2,prev=prev,target
    return rows
def matrices(rows,model):
    x=np.asarray([r["features"] for r in rows]);y=np.asarray([r["target"] for r in rows])
    return x,y,fused.latent(x,model)
def pred(h,w,x):return lab.constrain(lab.apply(h,w),x)
def summarize(p,y,x):
    assert np.isfinite(p).all() and (p>=0).all() and np.allclose(p.sum(1),1)
    assert np.array_equal(p[x[:,9]<=0],x[x[:,9]<=0,:4])
    return lab.metric(p,y,x)
def anchored_fit(h,y,w,lam=4.):
    a=np.column_stack((h,np.ones(len(h))))
    return np.linalg.solve(a.T@a+lam*np.eye(a.shape[1]),a.T@y+lam*w)
def effect(p,y,x):
    # Compare matched baseline/evidence-aware trajectories on the same seed.
    # Inputs include previous oracle states; this is conditional forecasting,
    # not an intervention on the underlying real world.
    p=p.reshape(-1,2,8,4);y=y.reshape(-1,2,8,4)
    dp=p[:,1]-p[:,0];dy=y[:,1]-y[:,0]
    mask=np.max(np.abs(dy),axis=-1)>1e-12
    return {"effect_mae":float(np.abs(dp-dy).mean()),
            "nonzero_effect_steps":int(mask.sum()),
            "nonzero_effect_mae":float(np.abs(dp[mask]-dy[mask]).mean()) if mask.any() else None,
            "zero_effect_false_change_rate":float(np.mean(np.max(np.abs(dp[~mask]),axis=-1)>.05)) if (~mask).any() else None}
def main():
    raw=(ROOT/"sovos-fused-readout-candidate-20261125.json").read_bytes()
    if hashlib.sha256(raw).hexdigest()!=fresh.CANDIDATE_SHA:raise ValueError("candidate hash")
    w0=fused.validate_candidate(json.loads(raw));model=json.loads(lab.get("weights.json"))
    x0,y0,_=lab.split(lab.get("train.jsonl"),"train");h0=fused.latent(x0,model)
    # Training, calibration and test are distinct episode banks, with fixed seeds.
    with tempfile.TemporaryDirectory(prefix="sovos-continual-oracle-") as d:
        sim=fresh.install_oracle(pathlib.Path(d))
        train={k:episode_rows(sim,k,lo,hi,30000+i*1000,N_TRAIN) for i,(k,lo,hi) in enumerate(REGIMES)}
        cal={k:episode_rows(sim,k,lo,hi,34000+i*1000,N_CAL) for i,(k,lo,hi) in enumerate(REGIMES)}
        # Fit all stage candidates before generating the final test.
        tm={k:matrices(v,model) for k,v in train.items()}
        rng=np.random.default_rng(6025)
        # A fixed original-memory sample, identical across stages.
        keep=rng.choice(len(h0),size=256,replace=False)
        history=[(h0[keep],y0[keep])]
        full=[(h0,y0)]
        candidates={"frozen":w0}
        stage={}
        prev=w0
        for k in ("small","large"):
            _,y,h=tm[k]
            naive=lab.ridge(h,y)
            replay=lab.ridge(np.concatenate([h]+[a for a,b in history]),np.concatenate([y]+[b for a,b in history]))
            anchored=anchored_fit(h,y,prev)
            full.append((h,y))
            joint=lab.ridge(np.concatenate([a for a,b in full]),np.concatenate([b for a,b in full]))
            stage[k]={"frozen":w0,"latest_only":naive,"bounded_replay":replay,"anchored":anchored,"joint_history":joint}
            ix=rng.choice(len(h),size=256,replace=False)
            history.append((h[ix],y[ix]));prev=anchored
        # Calibration uses only distinct cases and never changes candidate weights.
        cm={k:matrices(v,model) for k,v in cal.items()}
        # Ensemble disagreement is an uncertainty proxy, not a confidence guarantee.
        def disagreement(x,h):
            ps=[lab.constrain(lab.head(a,m),x) for a,m in zip(np.split(h,[16,48],axis=1),model["ensemble"])]
            return np.std(ps,axis=0).max(1)
        cal_scores=np.concatenate([disagreement(x,h)[x[:,9]>0] for x,y,h in cm.values()])
        thresholds={str(c):float(np.quantile(cal_scores,c)) for c in (.5,.8,.95)}
        test={k:episode_rows(sim,k,lo,hi,38000+i*1000,N_TEST) for i,(k,lo,hi) in enumerate(REGIMES)}
    ids=lambda bank:{r["episode"] for rows in bank.values() for r in rows}
    assert not (ids(train)&ids(cal) or ids(train)&ids(test) or ids(cal)&ids(test))
    assert len(ids(test))==3*N_TEST
    out={"state":"SYNTHETIC_CONTINUAL_RESEARCH","candidate_sha256":fresh.CANDIDATE_SHA,
         "oracle_revision":fresh.PIN,"numpy":np.__version__,"new_gspc_measurement":False,
         "authorises_execution":False,"train_rows":sum(map(len,train.values())),
         "calibration_rows":sum(map(len,cal.values())),"test_rows":sum(map(len,test.values())),
         "banks_sha256":{n:hashlib.sha256(fused.canonical(b)).hexdigest() for n,b in (("train",train),("cal",cal),("test",test))},
         "stages":{},"intervention":{},"ablation":{},"uncertainty":{},"compression":{}}
    for s,cs in stage.items():
        out["stages"][s]={}
        for k,rows in test.items():
            x,y,h=matrices(rows,model)
            out["stages"][s][k]={n:summarize(pred(h,w,x),y,x) for n,w in cs.items()}
    mean=h0.mean(0)
    for k,rows in test.items():
        x,y,h=matrices(rows,model)
        base=pred(h,w0,x)
        out["intervention"][k]={"frozen":effect(base,y,x),"zero_effect_control":effect(np.repeat(base.reshape(-1,2,8,4)[:,:1],2,axis=1).reshape(base.shape),y,x)}
        out["ablation"][k]={"original":summarize(base,y,x)}
        for i,(a,b) in enumerate(((0,16),(16,48),(48,80))):
            z=h.copy();z[:,a:b]=mean[a:b]
            out["ablation"][k]["mean_replace_member_"+str(i)]=summarize(pred(z,w0,x),y,x)
            z=h.copy();z[:,a:b]=h[np.random.default_rng(6025+i).permutation(len(h)),a:b]
            out["ablation"][k]["shuffle_member_"+str(i)]=summarize(pred(z,w0,x),y,x)
        out["compression"][k]={}
        for kind in ("fp32","fp16","int8","int4"):
            pieces=[lab.packed_roundtrip(a,kind,t) for a,t in zip(np.split(h,[16,48],axis=1),np.split(h0,[16,48],axis=1))]
            p=pred(np.concatenate([v[0] for v in pieces],axis=1),w0,x)
            out["compression"][k][kind]={"bytes":sum(v[1] for v in pieces),"max_delta":float(np.abs(p-base).max()),**summarize(p,y,x)}
        score=disagreement(x,h);active=x[:,9]>0
        e=np.abs(base-y).max(1)
        out["uncertainty"][k]={"active_rows":int(active.sum()),"full_active_mae":float(np.abs(base[active]-y[active]).mean()),"thresholds":{}}
        for c,t in thresholds.items():
            accept=active&(score<=t)
            out["uncertainty"][k]["thresholds"][c]={"threshold":t,"coverage":float(accept.sum()/active.sum()),
                "mae":float(np.abs(base[accept]-y[accept]).mean()) if accept.any() else None,
                "worst_component_error":float(e[accept].max()) if accept.any() else None}
    out["controls"]={"frozen_candidate_verified":True,"source_pins":True,"disjoint_banks":True,"expiry_and_simplex":True,
         "test_used_for_fit":False,"independent_organisation":False}
    print("CONTINUAL_RESULT "+json.dumps(out,sort_keys=True,allow_nan=False))
if __name__=="__main__":main()
