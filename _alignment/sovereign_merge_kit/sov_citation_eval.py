#!/usr/bin/env python3
"""Citation-CORRECTNESS eval: does SOV3 cite the RIGHT Article (not just law-ish language)?
Three metrics per model: (1) grounds-in-law (mentions any Article), (2) cites-correct-article,
(3) cites-a-WRONG-article (the failure mode). base vs tuned."""
import json, re, torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
BASE="Qwen/Qwen2.5-0.5B-Instruct"; ADP="models/sov3_student_adapter"
B=json.load(open("citation_battery.json"))
tok=AutoTokenizer.from_pretrained(BASE)
if tok.pad_token is None: tok.pad_token=tok.eos_token
def articles_in(t):
    # matches Article 50, Art. 50, Art.50, Art 50
    return set(re.findall(r"[Aa]rt(?:icle)?\.?\s*(\d+)", t))
def wrong_law(t):
    # cites GDPR/other law when the answer should be EU AI Act
    return bool(re.search(r"GDPR", t))
def gen(model,p):
    text=tok.apply_chat_template([{"role":"user","content":p}],tokenize=False,add_generation_prompt=True)
    ids=tok(text,return_tensors="pt").input_ids.to(model.device)
    out=model.generate(ids,max_new_tokens=120,do_sample=False,pad_token_id=tok.pad_token_id)
    return tok.decode(out[0][ids.shape[1]:],skip_special_tokens=True)
def score(model,tag=""):
    grounds=correct=wrong=wronglaw=0; samples=[]
    for i,item in enumerate(B):
        t=gen(model,item["q"]); cited=articles_in(t); ok=set(item["correct_articles"])
        if cited: grounds+=1
        if cited & ok: correct+=1
        elif cited: wrong+=1
        if wrong_law(t): wronglaw+=1
        if i<4: samples.append({"want":item["correct_articles"],"got":sorted(cited),"correct":bool(cited&ok)})
    print(f"[{tag} samples]", flush=True)
    for sm in samples: print("  ",sm, flush=True)
    return {"grounds":grounds,"correct":correct,"wrong_citation":wrong,"wrong_law":wronglaw,"n":len(B)}
base=AutoModelForCausalLM.from_pretrained(BASE,torch_dtype=torch.bfloat16,device_map="auto")
sb=score(base,"base"); print("[base]",sb,flush=True)
tuned=PeftModel.from_pretrained(AutoModelForCausalLM.from_pretrained(BASE,torch_dtype=torch.bfloat16,device_map="auto"),ADP)
st=score(tuned,"tuned"); print("[tuned]",st,flush=True)
res={"base":sb,"tuned":st,
     "base_precision":round(sb["correct"]/max(sb["grounds"],1),3),
     "tuned_precision":round(st["correct"]/max(st["grounds"],1),3),
     "verdict_correct_lift":st["correct"]-sb["correct"]}
import os;os.makedirs("out",exist_ok=True);json.dump(res,open("out/citation_scorecard.json","w"),indent=2)
print("=== citation-correct: base",sb["correct"],"-> tuned",st["correct"],"| precision",res["base_precision"],"->",res["tuned_precision"],"===",flush=True)
