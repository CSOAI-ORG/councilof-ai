#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Export/replay a research-only SOVOS outcome readout on pinned MEOK members.
No production dispatch, new GSPC measurement, or independent test admission."""
import argparse, hashlib, json, pathlib
import numpy as np
import sovos_neural_stitch as lab

def canonical(value):
    return (json.dumps(value,sort_keys=True,separators=(",",":"),allow_nan=False)+"\n").encode()
def digest(raw):return hashlib.sha256(raw).hexdigest()
def latent(x,model):
    mu=np.asarray(model["scaler_mean"]);sd=np.asarray(model["scaler_scale"])
    if x.ndim!=2 or x.shape[1]!=12 or not np.isfinite(x).all():raise ValueError("invalid features")
    if (sd<=0).any():raise ValueError("invalid scale")
    return np.concatenate([lab.layers((x-mu)/sd,m)[0][-1] for m in model["ensemble"]],axis=1)
def validate_candidate(doc):
    if doc.get("schema")!="csoai.sovos-fused-readout-research/0.1" or doc.get("model_sha256")!=lab.PINS["weights.json"] or doc.get("train_sha256")!=lab.PINS["train.jsonl"]:raise ValueError("source binding")
    if doc.get("authorises_execution") is not False or doc.get("gspc_admitted") is not False or doc.get("published_test_not_blind") is not True:raise ValueError("authority boundary")
    if doc.get("hidden_widths")!=[16,32,32] or doc.get("ridge_lambda")!=.1:raise ValueError("wrong latent contract")
    w=np.asarray(doc["readout"],dtype=np.float64)
    if w.shape!=(81,4) or not np.isfinite(w).all():raise ValueError("bad coefficients")
    return w
def predict(raw_model,doc,features):
    if digest(raw_model)!=lab.PINS["weights.json"]:raise ValueError("wrong model bytes")
    if not isinstance(features,list) or len(features)!=12 or any(type(v) not in (int,float) for v in features):raise ValueError("bad feature type")
    x=np.asarray([features],dtype=np.float64)
    if not np.isfinite(x).all():raise ValueError("nonfinite features")
    for state in (x[0,:4],x[0,4:8]):
        if (state<0).any() or (state>1).any() or not np.isclose(state.sum(),1,atol=1e-8):raise ValueError("invalid state proportions")
    if x[0,8] not in (0,1) or x[0,10] not in (0,1) or not -1<=x[0,9]<=1 or not 0<=x[0,11]<=1:raise ValueError("invalid control features")
    p=lab.constrain(lab.apply(latent(x,json.loads(raw_model)),validate_candidate(doc)),x)[0]
    return {"state":"MODEL_PREDICTION_NOT_OBSERVED","prediction":p.tolist(),"authorises_execution":False,"gspc_admitted":False}
def export():
    raw=lab.get("weights.json");model=json.loads(raw)
    x,y,_=lab.split(lab.get("train.jsonl"),"train")
    w=lab.ridge(latent(x,model),y)
    return {"schema":"csoai.sovos-fused-readout-research/0.1","model_sha256":lab.PINS["weights.json"],
            "train_sha256":lab.PINS["train.jsonl"],"hidden_widths":[16,32,32],"ridge_lambda":.1,
            "readout":np.round(w,12).tolist(),"authorises_execution":False,"gspc_admitted":False,
            "published_test_not_blind":True}
def qualify(doc):
    raw=lab.get("weights.json");model=json.loads(raw)
    results={}
    for n in ("validation","test"):
        x,y,_=lab.split(lab.get(n+".jsonl"),n)
        result=lab.constrain(lab.apply(latent(x,model),validate_candidate(doc)),x)
        results[n]=lab.metric(result,y,x)
        assert np.allclose(result.sum(1),1) and np.all(result>=0)
        assert np.array_equal(result[x[:,9]<=0],x[x[:,9]<=0,:4])
        # Real public rows exercise the portable single-row path.
        for i in (0, len(x)//2,len(x)-1):
            p=predict(raw,doc,x[i].tolist())
            assert p["authorises_execution"] is False and np.allclose(p["prediction"],result[i],atol=1e-11)
    assert abs(results["test"]["mae"]-.01413459478539891)<1e-9
    good=lab.split(lab.get("test.jsonl"),"test")[0][0].tolist()
    invalid=[(b"wrong",doc,good),(raw,{**doc,"authorises_execution":True},good),
             (raw,{**doc,"train_sha256":"0"*64},good),(raw,{**doc,"readout":[[0]*4]},good),
             (raw,doc,[True]+good[1:]),(raw,doc,[float("nan")]+good[1:]),(raw,doc,[2]+good[1:])]
    for args in invalid:
        try:predict(*args)
        except ValueError:pass
        else:raise AssertionError("invalid candidate or request escaped")
    return {"state":"RESEARCH_CANDIDATE_REPLAYED","metrics":results,"negative_controls":len(invalid),
            "candidate_sha256":digest(canonical(doc)),"candidate_bytes":len(canonical(doc)),
            "new_gspc_measurement":False,"authorises_execution":False}
if __name__=="__main__":
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--export",type=pathlib.Path)
    p.add_argument("--verify",type=pathlib.Path)
    args=p.parse_args()
    if bool(args.export)==bool(args.verify):p.error("select one")
    if args.export:
        doc=export(); result=qualify(doc)
        with args.export.open("xb") as f:f.write(canonical(doc))
    else:
        data=args.verify.read_bytes();doc=json.loads(data);result=qualify(doc)
        if data!=canonical(doc):raise ValueError("noncanonical candidate")
    print("READOUT_RESULT "+json.dumps(result,sort_keys=True))
