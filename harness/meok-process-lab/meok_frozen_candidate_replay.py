#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Frozen nonlinear MEOK candidate: fresh replay, drift and observation refresh.
Research only; no GSPC admission, actual effect, deployment or training."""
import copy,hashlib,json,pathlib,tempfile
import numpy as np
import sovos_neural_stitch as lab
import sovos_fused_readout as fused
import sovos_fresh_rehearsal as fresh
import sovos_continual_intervention as continual
ROOT=pathlib.Path(__file__).resolve().parent
PIN="e60247e5aafb4d0740821dacd392209bac09e083f3aab065ef5fae3ae7db1b51"
def validate(doc):
    if hashlib.sha256(fused.canonical(doc)).hexdigest()!=PIN:raise ValueError("candidate pin")
    if doc.get("schema")!="csoai.meok-nonlinear-research/0.1" or doc.get("train_sha256")!=lab.PINS["train.jsonl"] or doc.get("source_model_sha256")!=lab.PINS["weights.json"]:raise ValueError("source binding")
    if doc.get("authorises_execution") is not False or doc.get("new_gspc_measurement") is not False:raise ValueError("authority")
    if set(doc["candidate"])!={"raw_mlp","latent_mlp"}:raise ValueError("model set")
    out={}
    for name,d in doc["candidate"].items():
        n=12 if name=="raw_mlp" else 80
        a=[np.asarray(z,dtype=float) for z in [d["mean"],d["scale"],*d["coefs"],*d["intercepts"]]]
        if [z.shape for z in a]!=[(n,),(n,),(n,24),(24,4),(24,),(4,)] or not all(np.isfinite(z).all() for z in a) or (a[1]<=0).any():raise ValueError("shape or scale")
        out[name]=a
    return out
def check_features(x):
    if x.ndim!=2 or x.shape[1]!=12 or not len(x) or not np.isfinite(x).all():raise ValueError("features")
    for a in (x[:,:4],x[:,4:8]):
        if (a<0).any() or (a>1).any() or not np.allclose(a.sum(1),1,atol=1e-8,rtol=0):raise ValueError("simplex")
    if not np.isin(x[:,8],[0,1]).all() or not np.isin(x[:,10],[0,1]).all() or not np.isin(x[:,9],np.arange(-7,10)/8).all() or not np.isin(x[:,11],np.arange(8)/8).all():raise ValueError("controls")
def forward(a,w):
    mu,sd,w1,w2,b1,b2=w
    return np.maximum((a-mu)/sd@w1+b1,0)@w2+b2
def metrics(p,y,x,prior=None):
    assert np.isfinite(p).all() and (p>=0).all() and np.allclose(p.sum(1),1)
    prior=x[:,:4] if prior is None else prior
    assert np.array_equal(p[x[:,9]<=0],prior[x[:,9]<=0])
    return {**lab.metric(p,y,x),**continual.effect(p,y,x)}
def main():
    doc=json.loads((ROOT/"meok-nonlinear-candidate-local-20261125.json").read_bytes())["result"]["candidate"]
    weights=validate(doc)
    raw=(ROOT/"sovos-fused-readout-candidate-20261125.json").read_bytes()
    assert hashlib.sha256(raw).hexdigest()==fresh.CANDIDATE_SHA
    w=fused.validate_candidate(json.loads(raw));model=json.loads(lab.get("weights.json"))
    controls=[]
    for k,alter in (("mutated_weight",lambda d:d["candidate"]["raw_mlp"]["coefs"][0][0].__setitem__(0,99.)),("authority_flag",lambda d:d.update(authorises_execution=True)),("training_pin",lambda d:d.update(train_sha256="0"*64))):
        c=copy.deepcopy(doc);alter(c)
        try:validate(c)
        except ValueError:controls.append(k)
        else:raise AssertionError(k)
    def predict(name,x):
        check_features(x)
        if name=="raw_mlp":p=forward(x,weights[name])
        else:
            h=fused.latent(x,model)
            p=lab.apply(h,w) if name=="frozen_ridge" else forward(h,weights[name])
        if not np.isfinite(p).all():raise ValueError("nonfinite output")
        return lab.constrain(p,x)
    good=np.array([[0,0,0,1,0,0,0,1,0,1,0,0]],dtype=float)
    for k,alter in (("bad_shape",lambda a:a[:,:11]),("nan",lambda a:np.where(a==1,np.nan,a)),("bad_simplex",lambda a:a+1),("bad_control",lambda a:np.column_stack([a[:,:11],np.full(len(a),.99)]))):
        try:predict("raw_mlp",alter(good))
        except ValueError:controls.append(k)
        else:raise AssertionError(k)
    with tempfile.TemporaryDirectory(prefix="meok-candidate-replay-") as d:
        sim=fresh.install_oracle(pathlib.Path(d))
        bank={name:continual.episode_rows(sim,name,lo,hi,60000+i*1000,128) for i,(name,lo,hi) in enumerate(continual.REGIMES)}
    result={};names=("frozen_ridge","raw_mlp","latent_mlp")
    for name,rows in bank.items():
        x=np.asarray([r["features"] for r in rows]);y=np.asarray([r["target"] for r in rows])
        assert len(rows)==2048 and len({(r["episode"],r["mode"],r["tick"]) for r in rows})==len(rows)
        xx=x.reshape(-1,8,12);yy=y.reshape(-1,8,4)
        assert np.array_equal(xx[:,:,11],np.broadcast_to(np.arange(8)/8,xx.shape[:2]))
        out={}
        for n in names:
            teacher=predict(n,x);out[n]={"teacher":metrics(teacher,y,x)}
            for cadence in (0,2,4):
                p=np.zeros_like(yy);pri=np.zeros_like(yy);last=xx[:,0,:4].copy();last2=last.copy()
                for t in range(8):
                    # Refresh only prior states from already observed ticks,
                    # never the target at the tick being forecast.
                    if cadence and t and t%cadence==0:
                        last=xx[:,t,:4].copy();last2=xx[:,t,4:8].copy()
                    f=xx[:,t].copy();f[:,:4]=last;f[:,4:8]=last2
                    pri[:,t]=last;p[:,t]=predict(n,f);last2,last=last,p[:,t]
                out[n]["closed_loop" if cadence==0 else "refresh_"+str(cadence)]=metrics(p.reshape(-1,4),y,x,pri.reshape(-1,4))
        base=predict("frozen_ridge",x);cand=predict("raw_mlp",x)
        delta=(np.abs(base-y)-np.abs(cand-y)).reshape(128,16,4).mean((1,2))
        ci=np.quantile(np.random.default_rng(261125).choice(delta,(2000,128),replace=True).mean(1),[.025,.975])
        result[name]={"models":out,"paired_teacher_mae_gain_ci95":ci.tolist()}
    # Conservative predeclared research screen: no worse mean or worst
    # in ANY domain/cadence, positive teacher gain interval. Not admission.
    comparisons=[]
    for domain,r in result.items():
        for cadence in ("teacher","closed_loop","refresh_2","refresh_4"):
            a=r["models"]["raw_mlp"][cadence];b=r["models"]["frozen_ridge"][cadence]
            comparisons.append({"domain":domain,"cadence":cadence,"mean_no_regression":a["mae"]<=b["mae"],"worst_no_regression":a["worst"]<=b["worst"]})
    passed=all(r["mean_no_regression"] and r["worst_no_regression"] for r in comparisons) and all(r["paired_teacher_mae_gain_ci95"][0]>0 for r in result.values())
    print("QUAL_RESULT "+json.dumps({"state":"FROZEN_CANDIDATE_REPLAY","candidate_sha256":PIN,"oracle_revision":fresh.PIN,
        "test_rows":sum(map(len,bank.values())),"bank_sha256":hashlib.sha256(fused.canonical(bank)).hexdigest(),"numpy":np.__version__,
        "controls":controls,"results":result,"comparisons":comparisons,"research_screen_passed":passed,
        "authorises_execution":False,"new_gspc_measurement":False},sort_keys=True,allow_nan=False))
if __name__=="__main__":main()
