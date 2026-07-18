#!/usr/bin/env python3
"""3-teacher distillation: feed governance prompts to 3 free NVIDIA frontier teachers,
collect care-gated answers -> fused corpus for training SOV's own OWEM.
Robust: retries, per-teacher fallback, care-gate filter, resumable."""
import os, json, time, urllib.request, sys
sys.path.insert(0, ".")
from sov33_care_local import score_local, FLOOR

KEY=os.environ.get("NVIDIA_API_KEY")
TEACHERS=["qwen/qwen3.5-397b-a17b","deepseek-ai/deepseek-v4-flash","meta/llama-3.1-70b-instruct"]
SYS=("You are a sovereign AI governance expert. Answer precisely, cite the governing "
     "rule/standard (e.g. EU AI Act article) where relevant, and never advise unlawful or harmful action.")

def call(model, prompt, to=60):
    body=json.dumps({"model":model,"messages":[{"role":"system","content":SYS},
        {"role":"user","content":prompt}],"max_tokens":400,"temperature":0.3}).encode()
    req=urllib.request.Request("https://integrate.api.nvidia.com/v1/chat/completions",data=body,
        headers={"Authorization":f"Bearer {KEY}","Content-Type":"application/json","User-Agent":"Mozilla/5.0"})
    r=json.loads(urllib.request.urlopen(req,timeout=to).read())
    return r["choices"][0]["message"]["content"].strip()

def teach(prompt):
    """Try teachers in order with 1 retry each; return (answer, teacher) or (None,None)."""
    for t in TEACHERS:
        for attempt in range(2):
            try:
                a=call(t,prompt)
                if a and len(a)>40: return a,t
            except Exception:
                time.sleep(1.5)
    return None,None

def main():
    prompts=json.load(open("teacher_prompts.json"))
    N=int(os.environ.get("N_PROMPTS","300"))
    prompts=prompts[:N]
    out_path="expert_data/fused_3teacher.jsonl"
    done=set()
    if os.path.exists(out_path):
        for l in open(out_path):
            try: done.add(json.loads(l)["instruction"])
            except: pass
    f=open(out_path,"a")
    kept=len(done); gated=0; failed=0; by_teacher={}
    for i,p in enumerate(prompts):
        if p in done: continue
        # care-gate the PROMPT first (don't distill harmful requests)
        care,_=score_local(p)
        if care<FLOOR: gated+=1; continue
        a,t=teach(p)
        if a is None: failed+=1; continue
        # care-gate the ANSWER too (fail-safe: don't train on sub-floor outputs)
        ca,_=score_local(a)
        if ca<FLOOR: gated+=1; continue
        f.write(json.dumps({"instruction":p,"response":a,"teacher":t})+"\n"); f.flush()
        kept+=1; by_teacher[t]=by_teacher.get(t,0)+1
        if kept%25==0: print(f"[distill] {kept} kept | {failed} failed | {gated} gated | {i+1}/{len(prompts)} seen",flush=True)
    print(f"[distill] DONE kept={kept} failed={failed} gated={gated} by_teacher={by_teacher}",flush=True)
    json.dump({"kept":kept,"failed":failed,"gated":gated,"by_teacher":by_teacher},
              open("distill_3teacher_stats.json","w"),indent=2)

if __name__=="__main__": main()
