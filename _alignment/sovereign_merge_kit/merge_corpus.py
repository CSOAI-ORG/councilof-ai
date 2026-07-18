#!/usr/bin/env python3
"""merge_corpus.py — normalize every local expert_data/*.jsonl (instruction/response, messages, prompt/completion)
into ONE deduped instruction/response corpus for training. No download; runs anywhere. -> expert_data/merged_corpus.jsonl"""
import glob, json, hashlib, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "expert_data"))
seen=set(); out=[]
for fp in glob.glob("*.jsonl"):
    if fp=="merged_corpus.jsonl": continue
    for l in open(fp):
        try: d=json.loads(l)
        except: continue
        i=r=None
        if d.get("instruction") and d.get("response"): i,r=d["instruction"],d["response"]
        elif isinstance(d.get("messages"),list):
            u=a=None
            for m in d["messages"]:
                if m.get("role")=="user" and not u: u=m.get("content")
                if m.get("role")=="assistant": a=m.get("content")
            if u and a: i,r=u,a
        elif d.get("prompt") and d.get("completion"): i,r=d["prompt"],d["completion"]
        if i and r and len(str(i))>4 and len(str(r))>4:
            k=hashlib.sha1(str(i).lower()[:120].encode()).hexdigest()
            if k in seen: continue
            seen.add(k); out.append({"instruction":str(i)[:2000],"response":str(r)[:2000]})
open("merged_corpus.jsonl","w").write("\n".join(json.dumps(o) for o in out)+"\n")
print(f"merged {len(out)} rows -> expert_data/merged_corpus.jsonl")
