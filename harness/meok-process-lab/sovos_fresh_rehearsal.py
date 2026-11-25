#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Fresh synthetic simulator cases against a frozen SOVOS candidate.
No real-world effects, independent reviewer, GSPC measurement or model promotion."""
import hashlib,json,pathlib,random,sys,tempfile,urllib.request
import numpy as np
import sovos_neural_stitch as lab
import sovos_fused_readout as fused
ROOT=pathlib.Path(__file__).resolve().parent
CANDIDATE_SHA="d4567ac50bfea446b992ba6c6a9cf81bf9cbb40c1c8c316344081dd90dc13594"
PIN="4070aa6d3140ba10226677840f4873fbedd2467e"
FILES={
"packages/world-rehearsal/rehearsal/__init__.py":"9c08276349fae33dffae1c319b972c2929b0dbc1de2257556c87554f8df0d72f",
"packages/world-rehearsal/rehearsal/engine.py":"e2d7c0a12a3b395ed2d181d5567cfcad8b14c86df115e671550e55f1bd1b4c80",
"packages/world-rehearsal/rehearsal/dependencies.py":"2d008254db99f2169c232f610c111cd3b5d2d77e7a486b09c654c331de93bf90",
"packages/world-rehearsal/third_party/earth_scale/tempo.py":"ccf24d96ee7c38c7edfeb7d40a7b8a7b703280081b513d489ec24555e02d957b",
"packages/world-rehearsal/third_party/swarmchat/__init__.py":"1a6f05e5dd1a6593d6bcf9d12bf7cd16ebf20bbd988c22b66b9e971b156db369",
"packages/evidence-fabric/event.py":"144c6a36d462e21283ab9b34a6469bb32c75021da56133813d5a848412270533",
"packages/world-rehearsal/LICENSE":"d1c9de1ba9d7b4cdb5b2ba02270b92522a40be9a947864a2bb4311bc93f58fa9",
"packages/world-rehearsal/NOTICE":"7ec2552f23361fab1fd70d4039b3aad852ff3c19bebc058e1ab3777d9d6536a9"}
def install_oracle(root):
    for rel,want in FILES.items():
        with urllib.request.urlopen(f"https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/{PIN}/{rel}",timeout=15) as r:raw=r.read(300001)
        if len(raw)>300000 or hashlib.sha256(raw).hexdigest()!=want:raise ValueError("oracle source mismatch "+rel)
        p=root/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(raw)
    sys.path.insert(0,str(root/"packages/world-rehearsal"))
    from rehearsal.engine import simulate
    return simulate
def generate(simulate):
    rows=[]
    for cohort,low,high,start in (("nominal",16,97,20000),("shift_small",4,16,21000),("shift_large",97,121,22000)):
        for episode in range(start,start+128):
            rng=random.Random(980000+episode)
            cfg={"seed":100000+episode,"population":rng.randrange(low,high),"rounds":8,
                 "revocation_tick":rng.randrange(0,10),"permit_expires_tick":rng.randrange(0,10)}
            for mode in ("baseline","evidence-aware"):
                s=simulate({**cfg,"intervention":mode});previous=[0.,0.,0.,1.];previous2=previous[:]
                for f in s["frames"]:
                    t=f["tick"];n=cfg["population"];target=[v/n for v in f["counts"]]+[f["undecided"]/n]
                    x=previous+previous2+[float(t>=cfg["revocation_tick"]),(cfg["permit_expires_tick"]-t)/8,float(mode=="evidence-aware"),t/8]
                    rows.append({"cohort":cohort,"episode":episode,"mode":mode,"tick":t,"features":x,"target":target})
                    previous2,previous=previous,target
    return rows
def main():
    raw=(ROOT/"sovos-fused-readout-candidate-20261125.json").read_bytes()
    if hashlib.sha256(raw).hexdigest()!=CANDIDATE_SHA:raise ValueError("candidate mismatch")
    doc=json.loads(raw);w=fused.validate_candidate(doc);model=json.loads(lab.get("weights.json"))
    # Train 3D projections/readouts only on original train activations BEFORE
    # generating new labels. Random projection is a capacity-matched control.
    tx,ty,_=lab.split(lab.get("train.jsonl"),"train")
    th=fused.latent(tx,model);center=th.mean(0);_,sing,vt=np.linalg.svd(th-center,full_matrices=False)
    pca=vt[:3].T
    rng=np.random.default_rng(20261125);q,_=np.linalg.qr(rng.normal(size=(80,3)))
    pca_w=lab.ridge((th-center)@pca,ty);rand_w=lab.ridge((th-center)@q,ty)
    raw_w=lab.ridge(tx,ty)
    with tempfile.TemporaryDirectory(prefix="sovos-oracle-") as d:rows=generate(install_oracle(pathlib.Path(d)))
    assert len(rows)==6144
    assert len({(r["cohort"],r["episode"],r["mode"],r["tick"]) for r in rows})==len(rows)
    assert all(r["episode"]>=20000 for r in rows)
    x=np.asarray([r["features"] for r in rows]);y=np.asarray([r["target"] for r in rows])
    def preds(a):
        h=fused.latent(a,model)
        parts=np.split(h,[16,48],axis=1)
        baseline=lab.constrain(np.mean([lab.head(p,m) for p,m in zip(parts,model["ensemble"])],axis=0),a)
        return {"ensemble":baseline,"fused":lab.constrain(lab.apply(h,w),a),
          "pca3":lab.constrain(lab.apply((h-center)@pca,pca_w),a),
          "random3":lab.constrain(lab.apply((h-center)@q,rand_w),a),
          "raw_ridge":lab.constrain(lab.apply(a,raw_w),a),"persistence":a[:,:4]}
    observed=preds(x)
    # Closed-loop rollout substitutes predictions for previous observed states.
    # Control inputs stay oracle-known; neither model sees future target values.
    rollout={}
    for name in ("ensemble","fused","pca3"):
        p=np.zeros_like(y)
        for start in range(0,len(rows),8):
            last=np.array([0.,0.,0.,1.]);last2=last.copy()
            for j in range(start,start+8):
                f=x[j].copy();f[:4]=last;f[4:8]=last2
                a=preds(f[None,:])[name][0];p[j]=a;last2,last=last,a
        rollout[name]=p
    out={"state":"FROZEN_CANDIDATE_FRESH_SYNTHETIC_REPLAY","candidate_sha256":CANDIDATE_SHA,
      "oracle_revision":PIN,"oracle_file_hashes":FILES,"rows":len(rows),"episode_pairs":384,
      "dataset_sha256":hashlib.sha256(fused.canonical(rows)).hexdigest(),"numpy":np.__version__,
      "pca3_train_variance_fraction":float(np.sum(sing[:3]**2)/np.sum(sing**2)),
      "new_gspc_measurement":False,"authorises_execution":False,"cohorts":{}}
    for cohort in ("nominal","shift_small","shift_large"):
        ix=np.asarray([r["cohort"]==cohort for r in rows])
        m={name:lab.metric(p[ix],y[ix],x[ix]) for name,p in observed.items()}
        rr={name:lab.metric(p[ix],y[ix],x[ix]) for name,p in rollout.items()}
        # Cluster paired confidence interval at the matched episode seed level.
        delta=(np.abs(observed["ensemble"][ix]-y[ix])-np.abs(observed["fused"][ix]-y[ix])).reshape(128,16,4).mean((1,2))
        boot=np.random.default_rng(1729).choice(delta,size=(2000,len(delta)),replace=True).mean(1)
        out["cohorts"][cohort]={"teacher_forced":m,"rollout":rr,"paired_mae_improvement_ci95":[float(v) for v in np.quantile(boot,[.025,.975])]}
    for p in [*observed.values(),*rollout.values()]:
        if not np.isfinite(p).all() or not np.allclose(p.sum(1),1) or np.any(p<0):raise ValueError("constraint failure")
    # Teacher-forced expiration must preserve observed prior; rollout must preserve predicted prior.
    assert all(np.array_equal(p[x[:,9]<=0],x[x[:,9]<=0,:4]) for p in observed.values())
    for p in rollout.values():
        for j,r in enumerate(rows):
            if x[j,9]<=0:
                prior=np.array([0.,0.,0.,1.]) if r["tick"]==0 else p[j-1]
                assert np.array_equal(p[j],prior)
    out["controls"]={"fresh_episode_ids":True,"frozen_candidate":True,"oracle_pins":True,
      "teacher_forced_expiry":True,"closed_loop_expiry":True,"simplex":True}
    print("FRESH_RESULT "+json.dumps(out,sort_keys=True,allow_nan=False))
if __name__=="__main__":main()
