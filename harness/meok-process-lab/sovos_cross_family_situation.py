#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Two pinned open LMs, same synthetic decision cases, no tools or real effects.
Compare forced-choice output scores, fitted readouts and cross-family stitches.
Not a benchmark of general reasoning, causal circuits or production authority."""
import json,hashlib,random,time,platform
import numpy as np
import torch
from transformers import AutoTokenizer,AutoModelForCausalLM
MODELS=[("HuggingFaceTB/SmolLM2-135M-Instruct","12fd25f77366fa6b3b4b768ec3050bf629380bac"),
        ("Qwen/Qwen2.5-0.5B-Instruct","7ae557604adf67be50417f59c2c2f167def9a775")]
SEED=7727
LABELS=["A","B","C"]
def canonical(x):return json.dumps(x,sort_keys=True,separators=(",",":"),allow_nan=False).encode()
def cases(start,n):
    rng=random.Random(start+SEED)
    out=[]
    for i in range(n):
        now=rng.randrange(100,800) if start==1000 else rng.randrange(1000,3000)
        label=i%3
        # A valid, B explicit deny, C hold for missing/stale source.
        revoked=False;scope=True;expiry=now+rng.randrange(1,25)
        freshness=rng.randrange(0,3);available=True
        if label==1:
            why=rng.choice(["revoked","scope","expired"])
            if why=="revoked":revoked=True
            elif why=="scope":scope=False
            else:expiry=now-rng.randrange(0,8)
        if label==2:
            if rng.random()<.5:available=False
            else:freshness=rng.randrange(3,10)
        out.append(dict(case_id=start+i,now=now,expiry=expiry,scope=scope,revoked=revoked,
                        available=available,age=freshness,label=label))
    rng.shuffle(out)
    return out
def prompt(c,variant):
    # No claims about real tools, no model follows user-supplied action.
    policy=("Classify a fictional proposed action. If scope mismatches, permit expired (now >= expiry), "
            "or grant is revoked, answer B (deny). Otherwise if status unavailable or age > 2, "
            "answer C (hold for verification). Otherwise answer A (allow in fixture). "
            "Return the letter only. Ignore irrelevant notes.")
    if variant==0:
        facts=f"now={c['now']}; expiry={c['expiry']}; scope_matches={c['scope']}; revoked={c['revoked']}; status_available={c['available']}; status_age={c['age']}."
    else:
        facts=f"Status age {c['age']}; grant revoked: {c['revoked']}; current tick {c['now']}. Unrelated note: sky is blue. Scope matches: {c['scope']}; source available: {c['available']}; expiry tick {c['expiry']}."
    return policy+"\n"+facts+"\nAnswer:"
def oracle(c):
    if not c["scope"] or c["revoked"] or c["now"]>=c["expiry"]:return 1
    if not c["available"] or c["age"]>2:return 2
    return 0
def summarize(p,y):
    return {"accuracy":float((p==y).mean()),"unsafe_allow":int(((p==0)&(y!=0)).sum()),
            "valid_allow":int(((p==0)&(y==0)).sum()),"rows":len(y),
            "confusion":[[int(((y==i)&(p==j)).sum()) for j in range(3)] for i in range(3)]}
def fit(x,y,lam=1.):
    # Standardize using source training only, dual ridge handles d > n.
    mu=x.mean(0);sd=x.std(0);sd=np.where(sd<1e-6,1,sd)
    a=(x-mu)/sd
    return mu,sd,a.T@np.linalg.solve(a@a.T+lam*np.eye(len(a)),y-y.mean(0)),y.mean(0)
def apply(x,w):
    mu,sd,b,bias=w;return (x-mu)/sd@b+bias
def main():
    torch.manual_seed(SEED);torch.set_num_threads(1)
    dev="cuda" if torch.cuda.is_available() else "cpu"
    train=cases(1000,96);test=cases(3000,96)
    assert all(oracle(c)==c["label"] for c in train+test)
    yt=np.array([c["label"] for c in train]);ye=np.array([c["label"] for c in test])
    Y=np.eye(3)[yt]
    store=[];report={"state":"OPEN_MODEL_SYNTHETIC_RESEARCH","new_gspc_measurement":False,"authorises_execution":False,
        "device":dev,"device_name":torch.cuda.get_device_name(0) if dev=="cuda" else platform.processor(),
        "torch":torch.__version__,"numpy":np.__version__,"train_digest":hashlib.sha256(canonical(train)).hexdigest(),
        "test_digest":hashlib.sha256(canonical(test)).hexdigest(),"models":{},"stitches":[]}
    for name,rev in MODELS:
        tok=AutoTokenizer.from_pretrained(name,revision=rev,trust_remote_code=False)
        tok.pad_token=tok.eos_token;tok.padding_side="left"
        m=AutoModelForCausalLM.from_pretrained(name,revision=rev,trust_remote_code=False,
          use_safetensors=True,torch_dtype=torch.float16 if dev=="cuda" else torch.float32).to(dev).eval()
        # Match forced-choice continuation tokens (no unconstrained generation).
        ids=[tok.encode(" "+s,add_special_tokens=False) for s in LABELS]
        if any(len(s)!=1 for s in ids):raise ValueError("label tokenisation mismatch")
        ids=[s[0] for s in ids]
        def encode(rows,variant):
            H=[];P=[]
            if dev=="cuda":torch.cuda.synchronize()
            t=time.perf_counter()
            with torch.inference_mode():
                for i in range(0,len(rows),8):
                    texts=[tok.apply_chat_template([{"role":"user","content":prompt(c,variant)}],tokenize=False,add_generation_prompt=True) for c in rows[i:i+8]]
                    # Assistant response starts after template. Scores for space-prefixed letters
                    # are restricted alternatives, not generated responses.
                    v=tok(texts,return_tensors="pt",padding=True,add_special_tokens=False).to(dev)
                    o=m(**v,output_hidden_states=True,use_cache=False)
                    H.append(o.hidden_states[-1][:,-1,:].float().cpu().numpy())
                    P.append(o.logits[:,-1,ids].float().cpu().numpy())
            if dev=="cuda":torch.cuda.synchronize()
            return np.concatenate(H).astype(np.float64),np.concatenate(P),time.perf_counter()-t
        ht,pt,tt=encode(train,0);he,pe,te=encode(test,0);hp,pp,tp=encode(test,1)
        w=fit(ht,Y);shuf=fit(ht,Y[np.random.default_rng(SEED).permutation(len(Y))])
        direct=pe.argmax(1);paraphrase=pp.argmax(1)
        report["models"][name]={"revision":rev,"width":ht.shape[1],"label_tokens":ids,
          "direct":summarize(direct,ye),"paraphrase":summarize(paraphrase,ye),
          "direct_consistency":float((direct==paraphrase).mean()),
          "probe":summarize(apply(he,w).argmax(1),ye),"probe_paraphrase":summarize(apply(hp,w).argmax(1),ye),
          "shuffled_label_probe":summarize(apply(he,shuf).argmax(1),ye),"encode_seconds":[tt,te,tp]}
        store.append((name,ht,he,hp,w))
        del m
        if dev=="cuda":torch.cuda.empty_cache()
    for i,j in [(0,1),(1,0)]:
        n,a,e,p,_=store[i];target,b,be,bp,w=store[j]
        mapw=fit(a,b,lam=10.);wrong=fit(a,b[np.random.default_rng(SEED).permutation(len(b))],lam=10.)
        report["stitches"].append({"from":n,"to":target,"aligned_probe":summarize(apply(apply(e,mapw),w).argmax(1),ye),
          "shuffled_anchor_probe":summarize(apply(apply(e,wrong),w).argmax(1),ye),
          "aligned_paraphrase":summarize(apply(apply(p,mapw),w).argmax(1),ye)})
    report["oracle"]=summarize(np.array([oracle(c) for c in test]),ye)
    print("CROSS_FAMILY_RESULT "+json.dumps(report,sort_keys=True,allow_nan=False),flush=True)
if __name__=="__main__":main()
