# ============================================================================
# SOV33 — ONE Kaggle cell: (A) GPU capability grade + (B) governed-robustness #1.
# Paste this WHOLE cell into ONE Kaggle cell (GPU T4 on, Internet on), Run.
# Produces BOTH numbers in one session: sov33_local_gsm8k.json + governed_robustness_results.json.
# Self-contained, public model + public GSM8K, no secrets, no token.
# ============================================================================
import subprocess, sys, json, re, os
def pip(*p): subprocess.run([sys.executable,"-m","pip","-q","install",*p], check=False)

# ---------- (B) GOVERNED-ROBUSTNESS #1  (numpy only, runs in seconds) ----------
import numpy as np
def _task(seed, dim=32, n=400):
    rng=np.random.default_rng(seed); X=rng.normal(0,1,(n,dim))
    M=rng.normal(0,1/np.sqrt(dim),(dim,dim)); return X, np.tanh(X@M)
class MLP:
    def __init__(s,dim=32,h=12,seed=0):
        r=np.random.default_rng(seed)
        s.W1=r.normal(0,np.sqrt(2/(dim+h)),(dim,h)); s.b1=np.zeros(h)
        s.W2=r.normal(0,np.sqrt(2/(h+dim)),(h,dim)); s.b2=np.zeros(dim)
    def fwd(s,X): H=np.tanh(X@s.W1+s.b1); return H@s.W2+s.b2
    def train(s,X,T,ep=80,lr=0.1):
        for _ in range(ep):
            H=np.tanh(X@s.W1+s.b1); Y=H@s.W2+s.b2; n=len(X); dY=2*(Y-T)/n
            dW2=H.T@dY; db2=dY.sum(0); dH=(dY@s.W2.T)*(1-H**2)
            dW1=X.T@dH; db1=dH.sum(0)
            for g in (dW1,db1,dW2,db2): np.clip(g,-5,5,out=g)
            s.W1-=lr*dW1; s.b1-=lr*db1; s.W2-=lr*dW2; s.b2-=lr*db2
def care_bft(P):
    med=np.median(P,0); div=np.mean((P-med[None])**2,(1,2)); trust=1/(1+div)
    keep=trust>=np.median(trust)*0.5; surv=P[keep]
    return med if len(surv)<max(1,int(0.4*len(P))) else np.mean(surv,0)
X,T=_task(1); k=int(len(X)*.75); Xtr,Ttr,Xte,Tte=X[:k],T[:k],X[k:],T[k:]
mem=[MLP(seed=i+1) for i in range(9)]; [m.train(Xtr,Ttr) for m in mem]
rng=np.random.default_rng(42); board={"naive":[],"median":[],"care_bft":[]}
for K in range(5):
    P=np.stack([m.fwd(Xte) for m in mem]).copy()
    for j in range(K): P[j]=[P[j]+rng.normal(0,2,P[j].shape),-P[j]*3,np.full_like(P[j],rng.normal())][j%3]
    board["naive"].append(round(float(np.mean((P.mean(0)-Tte)**2)),4))
    board["median"].append(round(float(np.mean((np.median(P,0)-Tte)**2)),4))
    board["care_bft"].append(round(float(np.mean((care_bft(P)-Tte)**2)),4))
rob={"board":board,"naive_degrade_x":round(board["naive"][-1]/board["naive"][0],1),
     "sov33_degrade_x":round(board["care_bft"][-1]/board["care_bft"][0],1),
     "headline":f"4/9 adversarial: naive {round(board['naive'][-1]/board['naive'][0],1)}x vs SOV33 {round(board['care_bft'][-1]/board['care_bft'][0],1)}x"}
json.dump(rob,open("governed_robustness_results.json","w"),indent=2)
print("=== (B) GOVERNED-ROBUSTNESS #1 ==="); print(json.dumps(rob,indent=1))

# ---------- (A) GPU CAPABILITY GRADE  (real model on GSM8K) ----------
# infra fixes baked in (learned from the 2026-07-14 Colab-T4 run):
#  - HF Xet download path stalls on some Colab VMs -> force classic CDN
#  - HF dataset parquet 403s on anon Xet + bare "gsm8k" alias rejected -> load GSM8K test from OpenAI GitHub jsonl
#  - newer transformers apply_chat_template returns BatchEncoding -> return_dict=False for a plain tensor
os.environ.setdefault("HF_HUB_DISABLE_XET","1")
pip("transformers>=4.44","accelerate","datasets","torch")
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from datasets import load_dataset
MODEL=os.environ.get("SOV33_MODEL","Qwen/Qwen2.5-1.5B-Instruct"); N=int(os.environ.get("SOV33_N","100"))
tok=AutoTokenizer.from_pretrained(MODEL)
mdl=AutoModelForCausalLM.from_pretrained(MODEL,torch_dtype=torch.float16,device_map="auto")
def ask(q):
    ids=tok.apply_chat_template([{"role":"user","content":q+"\nSolve it. Think briefly, end with just the final number."}],add_generation_prompt=True,return_tensors="pt",return_dict=False).to(mdl.device)
    o=mdl.generate(ids,max_new_tokens=512,do_sample=False,pad_token_id=tok.eos_token_id)
    return tok.decode(o[0][ids.shape[1]:],skip_special_tokens=True)
def num(t):
    xs=re.findall(r"-?\d[\d,]*\.?\d*",(t or "").replace(",","")); return xs[-1] if xs else None
GSM8K_JSONL="https://raw.githubusercontent.com/openai/grade-school-math/master/grade_school_math/data/test.jsonl"
ds=load_dataset("json",data_files=GSM8K_JSONL,split="train"); correct=0
for i in range(min(N,len(ds))):
    correct+=(num(ask(ds[i]["question"]))==num(ds[i]["answer"]))
    if i%25==0: print(f"  cap {i}/{N} acc={correct/(i+1):.3f}")
cap={"gsm8k":round(correct/min(N,len(ds)),4),"n":min(N,len(ds)),"model":MODEL,
     "scope":"sovereign-LOCAL model on GPU (pairs with deployed-gate 0.71)"}
json.dump(cap,open("sov33_local_gsm8k.json","w"),indent=2)
print("=== (A) GPU CAPABILITY ==="); print(json.dumps(cap,indent=1))
print("\nDONE — download sov33_local_gsm8k.json + governed_robustness_results.json from Output.")
