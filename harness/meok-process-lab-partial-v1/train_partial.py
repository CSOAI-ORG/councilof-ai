"""Fresh-episode partial-observation MEOK process-model experiment."""
from pathlib import Path
import json, hashlib, time, urllib.request, zipfile, sys
import numpy as np

ROOT=Path(__file__).resolve().parent
OUT=ROOT/"release"; OUT.mkdir(exist_ok=True)
PIN="4070aa6d3140ba10226677840f4873fbedd2467e"
V0_SHA="9fbffae6eb2f025a729a74022d041437f630bf06d60b4964019be10b70ba7c8b"
PARTIAL_FEATURES=["previous_A","previous_B","previous_C","previous_undecided","previous2_A","previous2_B","previous2_C","previous2_undecided","A_revoked","ticks_until_expiry_div8","evidence_aware","tick_div8"]
TARGETS=["next_A","next_B","next_C","next_undecided"]
rows=[json.loads(x) for x in (ROOT/"episodes-internal.jsonl").read_text().splitlines()]
assert len(rows)==2560 and len({r["episode"] for r in rows})==320
splits={s:[r for r in rows if r["split"]==s] for s in ("train","validation","test")}
assert [len(splits[s]) for s in ("train","validation","test")]==[1600,400,560]
assert not ({r["episode"] for r in splits["train"]}&{r["episode"] for r in splits["validation"]})
assert not ({r["episode"] for r in splits["train"]}&{r["episode"] for r in splits["test"]})
assert not ({r["episode"] for r in splits["validation"]}&{r["episode"] for r in splits["test"]})
def mat(split,key): return np.asarray([r[key] for r in splits[split]],dtype=np.float64)
Xtr,Ytr=mat("train","features"),mat("train","target")
Xv,Yv=mat("validation","features"),mat("validation","target")
Xt,Yt=mat("test","features"),mat("test","target")
P0t=mat("test","privileged_features")
mu,scale=Xtr.mean(0),Xtr.std(0); scale[scale<1e-10]=1.0
Ztr,Zv,Zt=(Xtr-mu)/scale,(Xv-mu)/scale,(Xt-mu)/scale

def assess(pred,truth):
    err=np.abs(np.asarray(pred)-truth)
    return {"rows":int(len(truth)),"mae":float(err.mean()),"p95_abs_error":float(np.percentile(err,95)),"max_abs_error":float(err.max()),"out_of_range_fraction":float(np.mean((pred<0)|(pred>1))),"sum_constraint_mae":float(np.abs(np.asarray(pred).sum(1)-1).mean())}
def project(pred,previous):
    clipped=np.clip(pred,0,1); sums=clipped.sum(1,keepdims=True)
    out=np.divide(clipped,sums,out=np.zeros_like(clipped),where=sums>1e-12)
    zero=sums[:,0]<=1e-12; out[zero]=previous[zero]
    return out
def hybrid(pred,x):
    out=project(pred,x[:,:4]); expired=x[:,9]<=0
    out[expired]=x[expired,:4]
    return out
def forward(x,ws,bs):
    a=x
    for i,(w,b) in enumerate(zip(ws,bs)):
        a=a@w+b
        if i+1<len(ws): a=np.maximum(a,0)
    return a

def fit_mlp(x,y,xv,yv,layers,seed,max_epochs=200,patience=28):
    rng=np.random.default_rng(seed); dims=[x.shape[1],*layers,y.shape[1]]
    ws=[];bs=[]
    for i in range(len(dims)-1):
        scale0=np.sqrt(2/dims[i]) if i<len(dims)-2 else np.sqrt(1/dims[i])
        ws.append(rng.normal(0,scale0,(dims[i],dims[i+1])));bs.append(np.zeros(dims[i+1]))
    mw=[np.zeros_like(w) for w in ws];vw=[np.zeros_like(w) for w in ws]
    mb=[np.zeros_like(b) for b in bs];vb=[np.zeros_like(b) for b in bs]
    steps=[0 for _ in ws]
    best=float("inf");bestw=bestb=None;stale=epochs=0;started=time.perf_counter()
    for epoch in range(max_epochs):
        acts=[x];pre=[];a=x
        for i,(w,b) in enumerate(zip(ws,bs)):
            z=a@w+b;pre.append(z);a=np.maximum(z,0) if i+1<len(ws) else z;acts.append(a)
        grad=2*(acts[-1]-y)/y.size
        for i in reversed(range(len(ws))):
            dw=acts[i].T@grad+1e-4*ws[i];db=grad.sum(0)
            if i: grad=(grad@ws[i].T)*(pre[i-1]>0)
            steps[i]+=1;step=steps[i]; b1,b2,eps,lr=.9,.999,1e-8,.003
            mw[i]=b1*mw[i]+(1-b1)*dw;vw[i]=b2*vw[i]+(1-b2)*(dw*dw)
            mb[i]=b1*mb[i]+(1-b1)*db;vb[i]=b2*vb[i]+(1-b2)*(db*db)
            ws[i]-=lr*(mw[i]/(1-b1**step))/(np.sqrt(vw[i]/(1-b2**step))+eps)
            bs[i]-=lr*(mb[i]/(1-b1**step))/(np.sqrt(vb[i]/(1-b2**step))+eps)
        val=float(np.abs(forward(xv,ws,bs)-yv).mean());epochs=epoch+1
        if val<best-1e-8:
            best=val;bestw=[w.copy() for w in ws];bestb=[b.copy() for b in bs];stale=0
        else:
            stale+=1
            if stale>=patience: break
    return {"weights":bestw,"biases":bestb,"validation_mae":best,"epochs":epochs,"fit_seconds":time.perf_counter()-started,"layers":list(layers),"seed":seed}

# The old v0 model is an unchanged privileged-information comparator on these fresh episodes.
url="https://huggingface.co/csoai/meok-process-world-v0/resolve/main/weights.json"
with urllib.request.urlopen(url,timeout=30) as response:v0_bytes=response.read(200000)
assert hashlib.sha256(v0_bytes).hexdigest()==V0_SHA
v0=json.loads(v0_bytes)
v0_z=(P0t-np.asarray(v0["scaler_mean"]))/np.asarray(v0["scaler_scale"])
v0_pred=forward(v0_z,[np.asarray(x) for x in v0["coefs"]],[np.asarray(x) for x in v0["intercepts"]])

# Baselines and validation-selected ridge.
persistence_v,persistence_t=Xv[:,:4],Xt[:,:4]
trend_v=project(Xv[:,:4]+(Xv[:,:4]-Xv[:,4:8]),Xv[:,:4])
trend_t=project(Xt[:,:4]+(Xt[:,:4]-Xt[:,4:8]),Xt[:,:4])
ridge_options=[]
for alpha in (.01,.1,1.,10.,100.):
    A=np.column_stack([Ztr,np.ones(len(Ztr))]);Av=np.column_stack([Zv,np.ones(len(Zv))])
    penalty=np.eye(A.shape[1])*alpha;penalty[-1,-1]=0
    coef=np.linalg.solve(A.T@A+penalty,A.T@Ytr)
    ridge_options.append((float(np.abs(Av@coef-Yv).mean()),alpha,coef))
_,ridge_alpha,ridge_coef=min(ridge_options,key=lambda z:z[0])
ridge_v=np.column_stack([Zv,np.ones(len(Zv))])@ridge_coef
ridge_t=np.column_stack([Zt,np.ones(len(Zt))])@ridge_coef

# Eight generalists; model selection is validation-only.
candidates=[]
for layers in ((8,),(16,),(32,16),(64,32)):
    for seed in (7,17):
        fit=fit_mlp(Ztr,Ytr,Zv,Yv,layers,seed)
        fit["name"]="mlp-"+"-".join(map(str,layers))+f"-seed{seed}"
        candidates.append(fit)
best=min(candidates,key=lambda z:z["validation_mae"])
best_v=forward(Zv,best["weights"],best["biases"])
best_t=forward(Zt,best["weights"],best["biases"])

# Two policy specialists routed only by the explicit policy-mode input.
specialists={}
for mode in (0.,1.):
    mt=Xtr[:,10]==mode;mv=Xv[:,10]==mode
    options=[]
    for seed in (7,17):
        fit=fit_mlp(Ztr[mt],Ytr[mt],Zv[mv],Yv[mv],(16,),seed+int(mode)*100)
        fit["name"]=f"policy-specialist-{int(mode)}-seed{seed}"
        options.append(fit)
    specialists[mode]=min(options,key=lambda z:z["validation_mae"])
specialist_v=np.zeros_like(Yv);specialist_t=np.zeros_like(Yt)
for mode in (0.,1.):
    mv=Xv[:,10]==mode;mt=Xt[:,10]==mode;fit=specialists[mode]
    specialist_v[mv]=forward(Zv[mv],fit["weights"],fit["biases"])
    specialist_t[mt]=forward(Zt[mt],fit["weights"],fit["biases"])

# Prediction ensemble, not weight merging.
top3=sorted(candidates,key=lambda z:z["validation_mae"])[:3]
ensemble_v=np.mean([forward(Zv,z["weights"],z["biases"]) for z in top3],axis=0)
ensemble_t=np.mean([forward(Zt,z["weights"],z["biases"]) for z in top3],axis=0)

metrics={
 "persistence":{"validation":assess(persistence_v,Yv),"test":assess(persistence_t,Yt)},
 "two_step_trend_projected":{"validation":assess(trend_v,Yv),"test":assess(trend_t,Yt)},
 "ridge":{"selected_alpha_by_validation":ridge_alpha,"validation":assess(ridge_v,Yv),"test":assess(ridge_t,Yt)},
 "partial_best":{"selected":best["name"],"validation":assess(best_v,Yv),"test":assess(best_t,Yt),"test_hybrid":assess(hybrid(best_t,Xt),Yt)},
 "top3_output_ensemble":{"members":[z["name"] for z in top3],"validation":assess(ensemble_v,Yv),"test":assess(ensemble_t,Yt),"test_hybrid":assess(hybrid(ensemble_t,Xt),Yt)},
 "two_specialist_router":{"specialists":{str(k):{"name":v["name"],"validation_mae":v["validation_mae"]} for k,v in specialists.items()},"validation":assess(specialist_v,Yv),"test":assess(specialist_t,Yt),"test_hybrid":assess(hybrid(specialist_t,Xt),Yt)},
 "v0_privileged_unchanged":{"weights_sha256":V0_SHA,"test":assess(v0_pred,Yt),"test_hybrid":assess(hybrid(v0_pred,Xt),Yt)}
}
def subgroup(pred):
    masks={"expired":Xt[:,9]<=0,"not_expired":Xt[:,9]>0,"revoked":Xt[:,8]>0,"not_revoked":Xt[:,8]<=0,"baseline_policy":Xt[:,10]==0,"evidence_aware_policy":Xt[:,10]==1}
    return {k:assess(pred[m],Yt[m]) for k,m in masks.items() if m.any()}
metrics["subgroups"]={"partial_best":subgroup(best_t),"partial_hybrid":subgroup(hybrid(best_t,Xt)),"partial_ensemble":subgroup(ensemble_t),"partial_ensemble_hybrid":subgroup(hybrid(ensemble_t,Xt)),"specialist_router":subgroup(specialist_t),"v0_privileged":subgroup(v0_pred)}

ensemble_members=[{"name":z["name"],"coefs":[w.tolist() for w in z["weights"]],"intercepts":[v.tolist() for v in z["biases"]]} for z in top3]
model={"format":"meok.partial-observation-process-ensemble/1","features":PARTIAL_FEATURES,"targets":TARGETS,"scaler_mean":mu.tolist(),"scaler_scale":scale.tolist(),"ensemble":ensemble_members,"selected_by":"validation_mae_of_top3_prediction_mean","selected_variant":"top3_output_ensemble","constraints":{"clip_to_unit_interval":True,"normalise_to_simplex":True,"if_ticks_until_expiry_lte_zero":"preserve_previous_state"},"training_episode_ids":[1000,1199],"validation_episode_ids":[1200,1249],"test_episode_ids":[1250,1319],"limitations":["Synthetic procurement process only","No hidden simulator profile proportions in v1 input","Not a physical world model, general agent or action authority","Exact deterministic simulator remains authoritative"]}
def dump(name,value):
    data=(json.dumps(value,sort_keys=True,separators=(",",":"),allow_nan=False)+"\n").encode()
    (OUT/name).write_bytes(data);return hashlib.sha256(data).hexdigest()
weights_sha=dump("weights.json",model)

def portable_predict(features):
    z=[(float(x)-m)/sc for x,m,sc in zip(features,model["scaler_mean"],model["scaler_scale"])]
    predictions=[]
    for member in model["ensemble"]:
        a=z[:]
        for i,(w,bias) in enumerate(zip(member["coefs"],member["intercepts"])):
            a=[sum(a[j]*w[j][k] for j in range(len(a)))+bias[k] for k in range(len(bias))]
            if i+1<len(member["coefs"]):a=[max(0.0,x) for x in a]
        predictions.append(a)
    return [sum(v[k] for v in predictions)/len(predictions) for k in range(4)]
portable_error=max(abs(a-b) for row,pred in zip(Xt,ensemble_t) for a,b in zip(portable_predict(row.tolist()),pred.tolist()))
assert portable_error<1e-9

# Export only partial-observation inputs; privileged features never enter v1 dataset files.
for split in ("train","validation","test"):
    (OUT/f"{split}.jsonl").write_text("".join(json.dumps({"episode":r["episode"],"split":r["split"],"tick":r["tick"],"features":r["features"],"target":r["target"],"source_scenario_id":r["source_scenario_id"]},sort_keys=True,separators=(",",":"))+"\n" for r in splits[split]))
preds=[]
for i,r in enumerate(splits["test"]):
    preds.append(json.dumps({"episode":r["episode"],"tick":r["tick"],"target":r["target"],"persistence":persistence_t[i].tolist(),"partial_best":best_t[i].tolist(),"partial_hybrid":hybrid(best_t,Xt)[i].tolist(),"partial_ensemble":ensemble_t[i].tolist(),"partial_ensemble_hybrid":hybrid(ensemble_t,Xt)[i].tolist(),"specialist_router":specialist_t[i].tolist(),"privileged_v0":v0_pred[i].tolist()},sort_keys=True,separators=(",",":"))+"\n")
(OUT/"test-predictions.jsonl").write_text("".join(preds))

source_lock=json.loads((ROOT/"source-lock.json").read_text())
report={"status":"FRESH_PARTIAL_OBSERVATION_TRAINING_AND_HELDOUT_EVALUATION_COMPLETE","source_revision":PIN,"source_files_sha256":source_lock["files_sha256"],"fresh_episode_range":[1000,1319],"episode_count":320,"row_count":2560,"split_episode_ranges":{"train":[1000,1199],"validation":[1200,1249],"test":[1250,1319]},"split_rows":{"train":1600,"validation":400,"test":560},"partial_feature_count":12,"privileged_v0_feature_count":11,"partial_features":PARTIAL_FEATURES,"privileged_features_used_only_for_v0_reference":["previous_A","previous_B","previous_C","previous_undecided","profile_0","profile_1","profile_2","A_revoked","ticks_until_expiry_div8","evidence_aware","tick_div8"],"candidate_count":len(candidates),"candidate_validation":[{"name":z["name"],"validation_mae":z["validation_mae"],"epochs":z["epochs"],"fit_seconds":z["fit_seconds"]} for z in candidates],"single_best_model":best["name"],"single_best_validation_mae":best["validation_mae"],"selected_model":"top3_output_ensemble","selected_model_members":[z["name"] for z in top3],"selected_model_validation_mae":float(np.abs(ensemble_v-Yv).mean()),"specialists_validation":{str(k):{"name":v["name"],"validation_mae":v["validation_mae"],"epochs":v["epochs"]} for k,v in specialists.items()},"ridge_alpha_selected_by_validation":ridge_alpha,"metrics":metrics,"weights_sha256":weights_sha,"portable_inference_max_abs_difference":portable_error,"v0_privileged_weights_sha256":V0_SHA,"test_policy":"Fresh episode IDs not present in the published v0 train/validation/test splits; selection on validation only; held-out test used for final comparison.","runtime":{"python":sys.version.split()[0],"numpy":np.__version__,"compute":"Linux CPU only","gpu":False},"gspc_admitted":False,"cosmos_weights_changed":False,"production_actions":False,"real_customer_data":False}
dump("training-report.json",report)
(OUT/"SOURCE.json").write_text(json.dumps({"repository":"CSOAI-ORG/councilof-ai","source_revision":PIN,"generator":"fresh episode IDs 1000-1319 using unchanged packages/world-rehearsal engine","source_files_sha256":source_lock["files_sha256"],"v0_comparator":{"repo":"csoai/meok-process-world-v0","weights_sha256":V0_SHA}},indent=2)+"\n")
predictor = r"""#!/usr/bin/env python3
# Dependency-free raw and rule-constrained inference for MEOK v1 research weights.
import argparse,json,math

def predict(features,model):
    if len(features)!=len(model["features"]): raise ValueError("wrong feature count")
    if any(not math.isfinite(float(x)) for x in features): raise ValueError("non-finite feature")
    z=[(float(x)-m)/s for x,m,s in zip(features,model["scaler_mean"],model["scaler_scale"])]
    predictions=[]
    for member in model["ensemble"]:
        a=z[:]
        for i,(w,b) in enumerate(zip(member["coefs"],member["intercepts"])):
            a=[sum(a[j]*w[j][k] for j in range(len(a)))+b[k] for k in range(len(b))]
            if i+1<len(member["coefs"]): a=[max(0.0,x) for x in a]
        predictions.append(a)
    raw=[sum(p[k] for p in predictions)/len(predictions) for k in range(4)]
    clipped=[min(1.0,max(0.0,x)) for x in raw];total=sum(clipped)
    constrained=[x/total for x in clipped] if total>1e-12 else [float(x) for x in features[:4]]
    if float(features[9])<=0.0: constrained=[float(x) for x in features[:4]]
    return {"state":"MODEL_PREDICTION_NOT_OBSERVED","raw_prediction":raw,"constrained_prediction":constrained,"constraints_applied":["clip_and_normalise_to_simplex","preserve_previous_state_when_permit_expired"],"authority":"NONE"}

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--weights",default="weights.json");p.add_argument("--features",required=True);a=p.parse_args()
    print(json.dumps(predict(json.loads(a.features),json.load(open(a.weights))),allow_nan=False))
"""
(OUT/"predict.py").write_text(predictor)
readme = "\n".join([
"---","language:","- en","license: mit","tags:","- world-model","- process-model","- partial-observation","- synthetic","- experimental","---","",
"# MEOK partial-observation process predictor v1","",
"A fresh research candidate trained without the simulator's full hidden profile proportions. It predicts the next aggregate state in the Council's bounded synthetic procurement rehearsal. It is not a physical-world model, general-purpose agent, Cosmos fine-tune or action authority.","",
"## Fresh experiment","",
f"- Source engine: {PIN}; source file SHA-256 pins are in SOURCE.json.",
"- 320 newly generated episodes, IDs 1000–1319; 2,560 transitions.",
"- Episode-disjoint splits: train 200 episodes / 1,600 rows; validation 50 / 400; held-out test 70 / 560.",
"- 12 observable features: previous state, previous-previous state, revocation indicator, remaining permit ticks, policy mode and tick. The three full simulator profile proportions used by v0 are excluded from v1 training and the public dataset.",
"- Eight MLP candidates across four architectures and two seeds; selection uses validation only. Ridge, persistence, two-step trend, two policy specialists and unchanged privileged v0 comparator are also measured.","",
"## Results","",
"See training-report.json for full error metrics, subgroup results and candidate validation scores. The unchanged v0 model is evaluated with privileged inputs on the same new test episodes; it is an upper-information comparator, not a like-for-like partial-input competitor. test-predictions.jsonl retains row-level outputs.",
"The exported v1 model is the top-three output ensemble selected by validation MAE. The two-specialist router used the known policy-mode input and performed worse; it is not selected. The output ensemble combines predictions, not model weights.",
"The portable predictor returns raw output and a separate rule-constrained simplex result. Neither output is action authority.","",
"## Reproduction","",
"From the bundle root: install requirements.txt, run generate_episodes.py, then train_partial.py. The generator pins and verifies the unchanged source engine; training uses fresh episode IDs 1000–1319. The old v0 weights are fetched by their exact SHA-256 pin for the privileged comparator.","",
"## Limits","",
"The engine is a deterministic synthetic lookup simulation. These data do not represent real procurement behaviour, humans, markets or physical dynamics. Even a lower average error does not qualify the model for actions. The exact simulator remains authoritative. No Cosmos weights were changed, no GSPC score was admitted, and no human approval or real-world effect is implied.",""
])+"\n"
(OUT/"README.md").write_text(readme)
manifest={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(OUT.iterdir()) if p.is_file() and p.name!="manifest.json"}
dump("manifest.json",manifest)
bundle_names=["README.md","requirements.txt","generate_episodes.py","train_partial.py","test_predict.py","verify_bundle.py","source-lock.json"]
bundle_files=[ROOT/n for n in bundle_names]+[p for p in sorted(OUT.iterdir()) if p.is_file()]
bundle_manifest={p.relative_to(ROOT).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in bundle_files}
(ROOT/"BUNDLE-MANIFEST.json").write_text(json.dumps(bundle_manifest,indent=2)+"\n")
with zipfile.ZipFile(ROOT/"MEOK-PARTIAL-OBSERVATION-V1.zip","w",zipfile.ZIP_DEFLATED) as z:
    for p in bundle_files:z.write(p,p.relative_to(ROOT).as_posix())
    z.write(ROOT/"BUNDLE-MANIFEST.json","BUNDLE-MANIFEST.json")
print(json.dumps({"state":report["status"],"episodes":320,"rows":2560,"test_rows":560,"selected_model":"top3_output_ensemble","selected_members":[v["name"] for v in top3],"metrics":metrics,"portable_inference_max_abs_difference":portable_error,"archive":str(ROOT/"MEOK-PARTIAL-OBSERVATION-V1.zip"),"archive_sha256":hashlib.sha256((ROOT/"MEOK-PARTIAL-OBSERVATION-V1.zip").read_bytes()).hexdigest()},separators=(",",":")),flush=True)