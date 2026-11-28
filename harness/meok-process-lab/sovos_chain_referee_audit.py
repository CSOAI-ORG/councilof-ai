#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Existing frozen SOVOS neural ensemble: sequential error and referee audit.
Real forward passes on published synthetic process-world rows; not LLM awareness.
No training, external execution, board admission or authority."""
import hashlib,json,pathlib
import numpy as np
SOURCE_BLOB="f6ea6f9f1ba2c34838629d3faab654075a995dc0"
def load():
    p=pathlib.Path(__file__).resolve().with_name("sovos_neural_stitch.py")
    b=p.read_bytes()
    if hashlib.sha1(("blob "+str(len(b))+"\0").encode()+b).hexdigest()!=SOURCE_BLOB:
        raise ValueError("lab source changed; review and requalify")
    import sovos_neural_stitch as lab
    return lab
def audit(lab):
    model=json.loads(lab.get("weights.json"));mu=np.asarray(model["scaler_mean"]);sd=np.asarray(model["scaler_scale"])
    assert len(model["ensemble"])==3 and (sd>0).all()
    def predict(x):
        h=[];p=[]
        for m in model["ensemble"]:
            layers,y=lab.layers((x-mu)/sd,m);h.append(layers[-1]);p.append(lab.constrain(y,x))
        return np.asarray(p),h
    vx,vy,vg=lab.split(lab.get("validation.jsonl"),"validation")
    vp,_=predict(vx)
    # Fixed before test read: 90th percentile peer disagreement on validation.
    # Error cutoff is an exploratory domain tolerance, not a safety standard.
    threshold=float(np.quantile(np.max(np.abs(vp[0]-np.mean(vp[1:],axis=0)),axis=1),.9))
    error_cut=.10
    raw=lab.get("test.jsonl");rows=[json.loads(l) for l in raw.splitlines()]
    x,y,g=lab.split(raw,"test");assert not vg&g and len(g)==70
    assert all([r["tick"] for r in rows[i:i+8]]==list(range(8)) and len({r["episode"] for r in rows[i:i+8]})==1 for i in range(0,len(rows),8))
    def assess(p,peers):
        bad=np.max(np.abs(p-y),axis=1)>error_cut
        disagreement=np.max(np.abs(p-peers),axis=1)
        hold=disagreement>threshold
        return {"rows":len(p),"bad_rows":int(bad.sum()),"held":int(hold.sum()),"false_accept":int((bad&~hold).sum()),"false_hold":int((~bad&hold).sum()),
                "first_fault_tick_hist":{str(t):sum(bool(np.any(bad[i:i+8])) and int(np.argmax(bad[i:i+8]))==t for i in range(0,len(bad),8)) for t in range(8)},
                "episodes_with_fault":sum(bool(np.any(bad[i:i+8])) for i in range(0,len(bad),8)),
                "by_tick":[{"tick":t,"bad":int(bad[t::8].sum()),"held":int(hold[t::8].sum()),"missed":int((bad[t::8]&~hold[t::8]).sum())} for t in range(8)],
                "bad_to_bad_transitions":int((bad.reshape(-1,8)[:,:-1]&bad.reshape(-1,8)[:,1:]).sum()),
                "bad_prior_transitions":int(bad.reshape(-1,8)[:,:-1].sum()),
                "mae":float(np.abs(p-y).mean())}
    p,h=predict(x);original=p[0];peer=np.mean(p[1:],axis=0)
    # Duplicate actor output represents a deterministic same-output referee.
    # This is a negative control, NOT a separately prompted model judge.
    result={"teacher_forced_duplicate":assess(original,original),"teacher_forced_peers":assess(original,peer)}
    # Roll forward with actor state, not oracle state. Peers see the same
    # current candidate state; no test labels enter the prediction or gate.
    roll=np.zeros_like(y);rp=np.zeros_like(y)
    for i in range(0,len(rows),8):
        prev=x[i,:4].copy();prev2=x[i,4:8].copy()
        for j in range(i,i+8):
            f=x[j].copy();f[:4]=prev;f[4:8]=prev2
            z,_=predict(f[None,:]);roll[j]=z[0,0];rp[j]=np.mean(z[1:,0],axis=0);prev2,prev=prev,roll[j]
    result["rollout_duplicate"]=assess(roll,roll)
    result["rollout_peers"]=assess(roll,rp)
    # Paired control cue perturbation, same features otherwise. Target under
    # counterfactual is NOT known, so report response sensitivity only.
    cf=x.copy();cf[:,10]=1-cf[:,10];cp,ch=predict(cf)
    sensitivity={"mean_abs_actor_output_shift":float(np.abs(cp[0]-original).mean()),"mean_abs_last_hidden_shift_by_member":[float(np.abs(a-b).mean()) for a,b in zip(h,ch)],"max_abs_actor_output_shift":float(np.abs(cp[0]-original).max()),"counterfactual_accuracy":None}
    sensitivity["per_layer_mean_abs_shift"]=[
        [float(np.abs(a-b).mean()) for a,b in zip(
            lab.layers((x-mu)/sd,m)[0],lab.layers((cf-mu)/sd,m)[0])]
        for m in model["ensemble"]]
    assert np.array_equal(cf[:,:10],x[:,:10]) and np.array_equal(cf[:,11:],x[:,11:])
    assert all(np.isfinite(v).all() and np.allclose(v.sum(1),1) for v in (original,peer,roll,rp,cp[0]))
    assert result["teacher_forced_duplicate"]["held"]==result["rollout_duplicate"]["held"]==0
    assert np.array_equal(original[x[:,9]<=0],x[x[:,9]<=0,:4])
    for j,r in enumerate(rows):
        if x[j,9]<=0:assert np.array_equal(roll[j],x[j,:4] if r["tick"]==0 else roll[j-1])
    return {"state":"REAL_FROZEN_NEURAL_FORWARD_SYNTHETIC_DOMAIN","numpy":np.__version__,"lab_git_blob":SOURCE_BLOB,"source_pins":lab.PINS,"validation_rows":len(vx),"test_rows":len(x),"test_episodes":len(g),"error_cutoff":error_cut,"peer_threshold":threshold,"results":result,"cue_sensitivity":sensitivity,"limits":["Published test is not blind. All members share training data and architecture family; not independent judges.","Duplicate actor is exact same output, not a separate LLM judge. Peer discrepancy is not truth.","Threshold chosen on validation disagreement; .10 error cutoff exploratory; no causal attribution or safety assurance.","No live action, real user traces, language-model awareness, training, external verification or new GSPC result."]}
if __name__=="__main__":
    print(json.dumps(audit(load()),indent=2,allow_nan=False))
