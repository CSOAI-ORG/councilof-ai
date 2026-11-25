#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Follow-up to the collapsed paraphrase/forced-choice result.
New synthetic test cases; compare multi-format fitting, alternate tokens,
and actual greedy decoding. No tool calls, no real authority."""
import json,hashlib,re,time
import numpy as np
import torch
from transformers import AutoTokenizer,AutoModelForCausalLM
import sovos_cross_family_situation as original

def prompt(c,v):
    if v<2:return original.prompt(c,v)
    policy=("For this fictional decision, use A=allow, B=deny, C=hold. Deny if the grant is revoked, the scope does not match, "
        "or current tick is at or after expiry. Otherwise hold if the status source is absent or its age exceeds two ticks. "
        "Otherwise allow. Give only A, B or C.")
    facts=f"Grant expiry: {c['expiry']}. Time: {c['now']}. Source exists: {c['available']}. Source age: {c['age']}. Scope valid: {c['scope']}. Revoked: {c['revoked']}."
    return policy+"\n"+facts
def summary(p,y):
    return {**original.summarize(p,y),"invalid":int((p<0).sum())}
def main():
    torch.manual_seed(original.SEED);torch.set_num_threads(1)
    dev="cuda" if torch.cuda.is_available() else "cpu"
    train=original.cases(1000,96)
    test=original.cases(5000,96)
    assert all(original.oracle(c)==c["label"] for c in train+test)
    yt=np.array([c["label"] for c in train]);ye=np.array([c["label"] for c in test]);Y=np.eye(3)[yt]
    report={"state":"OPEN_MODEL_ROBUSTNESS_RESEARCH","device":dev,"new_gspc_measurement":False,"authorises_execution":False,
      "train_digest":hashlib.sha256(original.canonical(train)).hexdigest(),"test_digest":hashlib.sha256(original.canonical(test)).hexdigest(),
      "models":{},"stitches":[]}
    store=[]
    for name,rev in original.MODELS:
        tok=AutoTokenizer.from_pretrained(name,revision=rev,trust_remote_code=False)
        tok.pad_token=tok.eos_token;tok.padding_side="left"
        m=AutoModelForCausalLM.from_pretrained(name,revision=rev,trust_remote_code=False,use_safetensors=True,
              torch_dtype=torch.float16 if dev=="cuda" else torch.float32).to(dev).eval()
        bare=[tok.encode(s,add_special_tokens=False) for s in original.LABELS]
        space=[tok.encode(" "+s,add_special_tokens=False) for s in original.LABELS]
        assert all(len(a)==1 for a in bare+space)
        bare=[a[0] for a in bare];space=[a[0] for a in space]
        def encode(rows,v,generate=False):
            hs=[];b=[];s=[];a=[];g=[]
            with torch.inference_mode():
                for i in range(0,len(rows),8):
                    text=[tok.apply_chat_template([{"role":"user","content":prompt(c,v)}],tokenize=False,add_generation_prompt=True) for c in rows[i:i+8]]
                    x=tok(text,return_tensors="pt",padding=True,add_special_tokens=False).to(dev)
                    o=m(**x,output_hidden_states=True,use_cache=False)
                    hs.append(o.hidden_states[-1][:,-1,:].float().cpu().numpy())
                    logits=o.logits[:,-1,:].float()
                    b.extend(logits[:,bare].argmax(1).cpu().tolist())
                    s.extend(logits[:,space].argmax(1).cpu().tolist())
                    combined=torch.stack([torch.logsumexp(logits[:,list(set([i,j]))],dim=1) for i,j in zip(bare,space)],dim=1)
                    a.extend(combined.argmax(1).cpu().tolist())
                    if generate:
                        out=m.generate(**x,max_new_tokens=5,do_sample=False,pad_token_id=tok.pad_token_id)
                        for t in tok.batch_decode(out[:,x["input_ids"].shape[1]:],skip_special_tokens=True):
                            match=re.match(r"^\s*([ABC])(?:\b|[.)])",t)
                            g.append(original.LABELS.index(match.group(1)) if match else -1)
            return np.concatenate(hs).astype(np.float64),{"bare":np.array(b),"space":np.array(s),"combined":np.array(a),"generated":np.array(g)}
        h0,_=encode(train,0);h1,_=encode(train,1)
        H=np.concatenate([h0,h1]);YY=np.concatenate([Y,Y])
        w=original.fit(H,YY);single=original.fit(h0,Y)
        e=[];rr={}
        for v in range(3):
            h,p=encode(test,v,True);e.append(h)
            rr[str(v)]={k:summary(a,ye) for k,a in p.items()}
            rr[str(v)]["single_format_probe"]=summary(original.apply(h,single).argmax(1),ye)
            rr[str(v)]["two_format_probe"]=summary(original.apply(h,w).argmax(1),ye)
        report["models"][name]={"revision":rev,"tokens":{"bare":bare,"space":space},"variants":rr}
        store.append((name,H,e,w));del m
        if dev=="cuda":torch.cuda.empty_cache()
    for i,j in ((0,1),(1,0)):
        name,H,e,_=store[i];target,B,_,w=store[j]
        bridge=original.fit(H,B,10.)
        shuffled=original.fit(H,B[np.random.default_rng(original.SEED).permutation(len(B))],10.)
        report["stitches"].append({"from":name,"to":target,"variants":{str(v):{"aligned":summary(original.apply(original.apply(h,bridge),w).argmax(1),ye),
          "shuffled":summary(original.apply(original.apply(h,shuffled),w).argmax(1),ye)} for v,h in enumerate(e)}})
    print("ROBUST_RESULT "+json.dumps(report,sort_keys=True,allow_nan=False),flush=True)
if __name__=="__main__":main()
