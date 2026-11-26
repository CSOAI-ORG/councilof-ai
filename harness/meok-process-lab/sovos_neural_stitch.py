#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Read-only research: actual published MEOK neural weights, activation
quantization, cross-member stitching and a new fitted ridge outcome head.
Public synthetic episode splits, not independent blind GSPC evidence."""
import argparse, hashlib, json, pathlib, struct, urllib.request, zlib
import numpy as np

MODEL="https://huggingface.co/csoai/meok-process-world-partial-v1/resolve/71bfaa0a109638cdc7d090a4cdaea75e2b7593a1/"
DATA="https://huggingface.co/datasets/csoai/meok-process-world-partial-transitions-v1/resolve/8e3f2986992377019bdf4dcbd062414fed2c76b4/"
PINS={"weights.json":"c30e043aa08ca9bd3752fd913851f1b5e8092acce87ff60cdb8dc25454db5965",
"train.jsonl":"b97907598847b7ef61919208ec479984bb82c90c3eb125c897de889feb90e286",
"validation.jsonl":"1691625837204bd7c1cec386a8196c7f01dacc5530b3733e7c64cf7f3408fe8e",
"test.jsonl":"191c6f0ec609d8e0a99f0a8d6c8368e606b32b1129cbbe4f607b59dc2e9f84dc"}
LIMIT=2_000_000
def get(name):
    with urllib.request.urlopen((MODEL if name=="weights.json" else DATA)+name,timeout=20) as r:
        raw=r.read(LIMIT+1)
    if len(raw)>LIMIT or hashlib.sha256(raw).hexdigest()!=PINS[name]:
        raise ValueError("pinned artifact mismatch: "+name)
    return raw
def split(raw,name):
    rows=[json.loads(x) for x in raw.splitlines() if x]
    if not rows or any(r["split"]!=name for r in rows): raise ValueError("split mismatch")
    keys={(r["episode"],r["tick"]) for r in rows}
    if len(keys)!=len(rows): raise ValueError("duplicate row")
    x=np.asarray([r["features"] for r in rows],dtype=np.float64)
    y=np.asarray([r["target"] for r in rows],dtype=np.float64)
    if x.shape!=(len(rows),12) or y.shape!=(len(rows),4) or not np.isfinite(x).all() or not np.isfinite(y).all(): raise ValueError("bad data")
    if not np.allclose(y.sum(1),1) or (y<0).any(): raise ValueError("bad target")
    return x,y,{r["episode"] for r in rows}
def layers(x,m):
    a=x; h=[]
    for i,(w,b) in enumerate(zip(m["coefs"],m["intercepts"])):
        a=a@np.asarray(w)+np.asarray(b)
        if i+1<len(m["coefs"]):
            a=np.maximum(a,0);h.append(a)
    return h,a
def head(h,m):return h@np.asarray(m["coefs"][-1])+np.asarray(m["intercepts"][-1])
def constrain(y,x):
    p=np.clip(y,0,1);den=p.sum(1,keepdims=True)
    p=np.divide(p,den,out=x[:,:4].copy(),where=den>1e-12)
    p[x[:,9]<=0]=x[x[:,9]<=0,:4]
    return p
def metric(p,y,x):
    if not np.isfinite(p).all() or p.shape!=y.shape:raise ValueError("bad prediction")
    a=np.abs(p-y);active=x[:,9]>0
    return {"mae":float(a.mean()),"active_mae":float(a[active].mean()),"worst":float(a.max()),"p99":float(np.quantile(a,.99)),
            "rows":len(x),"active_rows":int(active.sum())}
def ridge(h,y,lam=.1):
    a=np.column_stack((h,np.ones(len(h))))
    reg=np.eye(a.shape[1])*lam;reg[-1,-1]=0
    return np.linalg.solve(a.T@a+reg,a.T@y)
def apply(h,w):return np.column_stack((h,np.ones(len(h))))@w
def packed_roundtrip(a,kind,train):
    if kind=="fp32":
        b=a.astype("<f4").tobytes();return np.frombuffer(b,dtype="<f4").reshape(a.shape).astype(float),len(b),len(zlib.compress(b))
    if kind=="fp16":
        b=a.astype("<f2").tobytes();return np.frombuffer(b,dtype="<f2").reshape(a.shape).astype(float),len(b),len(zlib.compress(b))
    bound=127 if kind=="int8" else 7
    scale=float(np.max(np.abs(train)))/bound or 1.0
    # One scale per member/layer, learned on training activations ONLY.
    q=np.rint(np.clip(a/scale,-bound,bound)).astype(np.int8)
    if kind=="int8":
        b=q.tobytes();d=np.frombuffer(b,dtype=np.int8).reshape(a.shape)
    else:
        flat=(q.ravel()+8).astype(np.uint8);n=len(flat)
        if n%2:flat=np.append(flat,0).astype(np.uint8)
        b=((flat[::2]<<4)|flat[1::2]).tobytes()
        u=np.frombuffer(b,dtype=np.uint8);out=np.empty(len(u)*2,dtype=np.uint8);out[::2]=u>>4;out[1::2]=u&15
        d=(out[:n].astype(np.int16)-8).reshape(a.shape)
    payload=struct.pack("<d",scale)+b
    return d.astype(float)*scale,len(payload),len(zlib.compress(payload))
def main():
    raw={n:get(n) for n in PINS};model=json.loads(raw["weights.json"]);members=model["ensemble"]
    assert len(members)==3
    sets={n:split(raw[n+".jsonl"],n) for n in ("train","validation","test")}
    assert [len(sets[n][0]) for n in sets]==[1600,400,560]
    assert not (sets["train"][2]&sets["test"][2] or sets["train"][2]&sets["validation"][2] or sets["test"][2]&sets["validation"][2])
    mu=np.asarray(model["scaler_mean"]);sd=np.asarray(model["scaler_scale"])
    assert np.isfinite(sd).all() and (sd>0).all()
    h={};p={}
    for n,(x,y,_) in sets.items():
        pairs=[layers((x-mu)/sd,m) for m in members]
        h[n]=[v[0][-1] for v in pairs];p[n]=[v[1] for v in pairs]
    # Fit only train. No test-based selection; every candidate retained.
    w=ridge(np.concatenate(h["train"],axis=1),sets["train"][1])
    raww=ridge(sets["train"][0],sets["train"][1])
    rng=np.random.default_rng(20261125)
    stitched=[]
    for a in range(3):
        for b in range(3):
            if a==b:continue
            wa=ridge(h["train"][a],h["train"][b]);wb=ridge(h["train"][a],h["train"][b][rng.permutation(len(h["train"][b]))])
            stitched.append((a,b,wa,wb))
    output={"state":"REAL_TRAINED_WEIGHTS_SYNTHETIC_DOMAIN_EXPLORATORY","source_pins":PINS,
        "model_revision":MODEL.split("/resolve/")[1].strip("/"),"dataset_revision":DATA.split("/resolve/")[1].strip("/"),"numpy":np.__version__,
        "source_urls":[MODEL,DATA],"new_fit":"ridge on original train split only; no neural weight update",
        "published_test_not_blind":True,"new_gspc_measurement":False,"authorises_execution":False,
        "hidden_widths":[a.shape[1] for a in h["train"]],"splits":{}}
    for n in ("validation","test"):
        x,y,_=sets[n]; base=constrain(np.mean(p[n],axis=0),x)
        result={"baseline_ensemble":metric(base,y,x),"persistence":metric(x[:,:4],y,x),
          "fused_hidden_ridge":metric(constrain(apply(np.concatenate(h[n],axis=1),w),x),y,x),
          "raw_input_ridge":metric(constrain(apply(x,raww),x),y,x),"compression":{},"stitches":[]}
        for i in range(3):result["member_"+str(i)]=metric(constrain(p[n][i],x),y,x)
        for kind in ("fp32","fp16","int8","int4"):
            dec=[packed_roundtrip(a,kind,t) for a,t in zip(h[n],h["train"])]
            pred=constrain(np.mean([head(d[0],m) for d,m in zip(dec,members)],axis=0),x)
            result["compression"][kind]={"bytes":sum(d[1] for d in dec),"zlib_bytes":sum(d[2] for d in dec),
              "raw_fp64_bytes":sum(a.nbytes for a in h[n]),"max_delta_from_original":float(np.abs(pred-base).max()),**metric(pred,y,x)}
        for a,b,wa,wb in stitched:
            aligned=constrain(head(apply(h[n][a],wa),members[b]),x)
            shuffled=constrain(head(apply(h[n][a],wb),members[b]),x)
            reference=constrain(p[n][b],x)
            result["stitches"].append({"from":a,"to":b,"aligned":metric(aligned,y,x),"shuffled_pair_control":metric(shuffled,y,x),
              "target_member":metric(reference,y,x),"aligned_mean_delta_from_target":float(np.abs(aligned-reference).mean()),
              "shuffled_mean_delta_from_target":float(np.abs(shuffled-reference).mean())})
        output["splits"][n]=result
    # Replay the published reference value as an instrument check, not a new result.
    assert abs(output["splits"]["test"]["baseline_ensemble"]["mae"]-.0188549)<.000001
    # Packing exactness negative/positive checks and geometry provenance.
    q=np.asarray([[-7.,-1.,0.,7.,2.]])
    d,size,_=packed_roundtrip(q,"int4",q)
    assert np.array_equal(q,d) and size==11
    output["controls"]={"episode_disjoint":True,"published_baseline_replayed":True,"int4_odd_length_roundtrip":True}
    print("SOVOS_RESULT "+json.dumps(output,sort_keys=True,allow_nan=False))
if __name__=="__main__":main()
