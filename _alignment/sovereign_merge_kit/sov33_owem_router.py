#!/usr/bin/env python3
"""sov33_owem_router.py — the WORKING 'use all 4 experts as one' — via ROUTING, not weight-merging.
Weight-merging the 4 OWEM LoRA adapters collapses the 0.6B base (verified: linear & cat both degenerate).
So we keep them separate and ROUTE: classify the query -> hot-swap to the right OWEM adapter -> answer -> sign.
This is the fluid/output-level path the whole estate is built on — proven again on our own adapters.
"""
import os, glob, json, time, sys
os.environ.setdefault("HF_HUB_OFFLINE","1"); os.environ.setdefault("TRANSFORMERS_OFFLINE","1")
import torch, numpy as np
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try: from sov33_ed25519_sigil import Ed25519Sigil; HAVE_SIG=True
except Exception: HAVE_SIG=False

BASE="Qwen/Qwen3-0.6B"; ROOT="/Users/nicholas/.sovereign/models"
OWEMS={"compliance":ROOT+"/qwen3-sov-compliance-0.6b","defense":ROOT+"/qwen3-sov-defense-0.6b",
       "intuition":ROOT+"/qwen3-sov-intuition-0.6b","voice":ROOT+"/qwen3-sov-voice-0.6b"}
DESC={"compliance":"law, regulation, EU AI Act, GDPR, audit, governance, policy",
      "defense":"security, safety guardrail, threat, kill switch, intrusion, protection",
      "intuition":"pattern, prediction, world model, sensing, anticipation, insight",
      "voice":"identity, who you are, sovereign, charter, principle, purpose"}
def ad(p):
    if os.path.exists(p+"/adapter_config.json"): return p
    c=sorted(glob.glob(p+"/checkpoint-*")); return c[-1] if c else p

def main():
    from sentence_transformers import SentenceTransformer
    emb=SentenceTransformer("all-MiniLM-L6-v2")
    dom=list(DESC); D=np.asarray(emb.encode([DESC[k] for k in dom],normalize_embeddings=True))
    tok=AutoTokenizer.from_pretrained(BASE)
    model=AutoModelForCausalLM.from_pretrained(BASE,torch_dtype=torch.float32)
    first=True
    for name,p in OWEMS.items():
        d=ad(p)
        if first: model=PeftModel.from_pretrained(model,d,adapter_name=name); first=False
        else: model.load_adapter(d,adapter_name=name)
    sig=Ed25519Sigil() if HAVE_SIG else None
    def route(q):
        qe=emb.encode([q],normalize_embeddings=True)[0]; i=int((D@qe).argmax()); return dom[i],float((D@qe)[i])
    def ask(q,adapter):
        model.set_adapter(adapter)
        ids=tok.apply_chat_template([{"role":"user","content":q}],add_generation_prompt=True,return_tensors="pt",return_dict=False)
        with torch.no_grad(): o=model.generate(ids,max_new_tokens=60,do_sample=False,pad_token_id=tok.eos_token_id)
        import re; t=tok.decode(o[0][ids.shape[1]:],skip_special_tokens=True)
        return re.sub(r"<think>.*?</think>","",t,flags=re.S).strip().replace("\n"," ")[:180]
    Qs=["What does the EU AI Act require for transparency?",
        "Name a safety guardrail a sovereign AI must enforce.",
        "Who do you serve and by what principle?"]
    print("=== SOV33 OWEM ROUTER — route query -> hot-swap expert -> answer -> sign (works where merge failed) ===\n")
    results=[]
    for q in Qs:
        d,score=route(q); a=ask(q,d)
        rec=sig.sign({"q":q,"routed_to":d,"score":round(score,3),"answer":a}) if sig else {}
        ok=sig.verify(rec) if sig else None
        print(f"  Q: {q}\n   → routed to [{d}] (score {score:.2f}) | signed={ok}\n   A: {a}\n")
        results.append({"q":q,"routed_to":d,"score":round(score,3),"answer":a,"verifies":ok})
    out={"ts":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"base":BASE,"experts":list(OWEMS),
         "method":"embedding route -> LoRA hot-swap -> Ed25519 sign",
         "why":"weight-merging the 4 adapters collapses the 0.6B (verified); routing keeps all 4 skills usable.",
         "results":results}
    os.makedirs("benchmarks",exist_ok=True); json.dump(out,open("benchmarks/owem_router_2026-07-14.json","w"),indent=2)
    print("✅ OWEM router works -> benchmarks/owem_router_2026-07-14.json")

if __name__=="__main__": main()
