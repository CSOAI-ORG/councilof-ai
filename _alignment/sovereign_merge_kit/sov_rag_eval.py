#!/usr/bin/env python3
"""RAG citation eval: retrieve the right EU AI Act article FIRST, inject it, then answer.
Measures (a) retrieval accuracy (does TF-IDF find the correct article), (b) cited-correct after RAG.
Compares to the no-RAG tuned baseline (0/20 correct)."""
import json, re, torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
BASE="Qwen/Qwen2.5-0.5B-Instruct"; ADP="models/sov3_student_adapter"
B=json.load(open("citation_battery.json")); IDX=json.load(open("eu_ai_act_articles.json"))
# build TF-IDF retriever over article title+text
docs=[a["title"]+". "+a["text"] for a in IDX]; nums=[a["article"] for a in IDX]
vec=TfidfVectorizer(stop_words="english"); M=vec.fit_transform(docs)
def retrieve(q,k=1):
    sims=cosine_similarity(vec.transform([q]),M)[0]
    top=sims.argsort()[::-1][:k]
    return [(nums[i],IDX[i]["title"],IDX[i]["text"]) for i in top]
def articles_in(t): return set(re.findall(r"[Aa]rt(?:icle)?\.?\s*(\d+)", t))
tok=AutoTokenizer.from_pretrained(BASE)
if tok.pad_token is None: tok.pad_token=tok.eos_token
def gen(model,q,ctx):
    prompt=f"Use ONLY this EU AI Act reference to answer and cite the article:\n{ctx}\n\nQuestion: {q}\nAnswer (cite the article number):"
    text=tok.apply_chat_template([{"role":"user","content":prompt}],tokenize=False,add_generation_prompt=True)
    ids=tok(text,return_tensors="pt").input_ids.to(model.device)
    out=model.generate(ids,max_new_tokens=120,do_sample=False,pad_token_id=tok.pad_token_id)
    return tok.decode(out[0][ids.shape[1]:],skip_special_tokens=True)
# retrieval accuracy (model-free): does top-1 retrieval return a correct article?
retr_hit=sum(1 for it in B if retrieve(it["q"],1)[0][0] in set(it["correct_articles"]))
print(f"[retrieval] top-1 correct: {retr_hit}/{len(B)}",flush=True)
# RAG generation: inject top-1 article, measure cited-correct
tuned=PeftModel.from_pretrained(AutoModelForCausalLM.from_pretrained(BASE,torch_dtype=torch.bfloat16,device_map="auto"),ADP)
rag_correct=0; samples=[]
for i,it in enumerate(B):
    r=retrieve(it["q"],1)[0]; ctx=f"Article {r[0]} — {r[1]}: {r[2]}"
    t=gen(tuned,it["q"],ctx); cited=articles_in(t); ok=set(it["correct_articles"])
    if cited & ok: rag_correct+=1
    if i<4: samples.append({"want":it["correct_articles"],"retrieved":r[0],"cited":sorted(cited),"ok":bool(cited&ok)})
print("[rag samples]",flush=True)
for s in samples: print("  ",s,flush=True)
res={"retrieval_top1_correct":retr_hit,"rag_cited_correct":rag_correct,"n":len(B),
     "baseline_norag_correct":0,"retrieval_acc":round(retr_hit/len(B),3),"rag_cite_acc":round(rag_correct/len(B),3)}
import os;os.makedirs("out",exist_ok=True);json.dump(res,open("out/rag_scorecard.json","w"),indent=2)
print(f"=== RAG: retrieval {retr_hit}/{len(B)} correct | model-cites-correct-after-RAG {rag_correct}/{len(B)} (was 0/20 no-RAG) ===",flush=True)
