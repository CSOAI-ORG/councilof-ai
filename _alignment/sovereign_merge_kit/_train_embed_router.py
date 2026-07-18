import json, random, numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
random.seed(42); np.random.seed(42)

def load(fn,l):
    r=[]
    for line in open(fn):
        if not line.strip():continue
        d=json.loads(line);u=next((m["content"] for m in d.get("messages",[]) if m.get("role")=="user"),None)
        if u:r.append((u.replace("Situation to judge:","").strip()[:400],l))
    return r
persona=[]
for fn,l in [("expert_data/defense.jsonl","defense"),("expert_data/compliance.jsonl","compliance"),("expert_data/intuition.jsonl","intuition")]:
    persona+=[(t[:400],l) for t,l in load(fn,l)]
terse=[(d["q"],d["node"]) for d in json.load(open("terse_queries.json"))]
random.shuffle(terse); n=int(len(terse)*0.30)
terse_test=terse[:n]; terse_train=terse[n:]
train=persona+terse_train
Xtr=[t for t,_ in train]; ytr=[l for _,l in train]

print("loading embedding model (all-MiniLM-L6-v2, 22M, fast)...", flush=True)
model=SentenceTransformer("all-MiniLM-L6-v2")   # small, 384-dim, downloads once
E=model.encode(Xtr, normalize_embeddings=True, batch_size=64, show_progress_bar=False)

# CENTROIDS per node (the Supra pattern: embed -> cosine to node centroid)
labels=sorted(set(ytr))
cent={l: E[[i for i,y in enumerate(ytr) if y==l]].mean(0) for l in labels}
cent={l:v/np.linalg.norm(v) for l,v in cent.items()}
C=np.vstack([cent[l] for l in labels])

def route(texts):
    e=model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    sims=e@C.T                    # cosine (already normalized)
    idx=sims.argmax(1)
    # softmax over sims for a real confidence
    ex=np.exp(sims*10); probs=ex/ex.sum(1,keepdims=True)
    return [labels[i] for i in idx], [float(probs[k,idx[k]]) for k in range(len(texts))]

# OOD test on genuinely held-out terse
Xte=[t for t,_ in terse_test]; yte=[l for _,l in terse_test]
pred,conf=route(Xte)
print(f"OOD held-out terse: acc={accuracy_score(yte,pred):.3f} f1={f1_score(yte,pred,average='macro'):.3f} n={len(yte)}", flush=True)
# distinct-prompt sanity (the ones that broke TF-IDF)
print("distinct routing (the cases TF-IDF failed):")
tests=[("malware exploit intrusion attack breach","defense"),("GDPR Article 6 lawful basis compliance audit","compliance"),("I feel this person needs care and trust","intuition"),("data subject access request deadline","compliance"),("adversarial prompt injection detected","defense")]
pr,cf=route([q for q,_ in tests]); ok=0
for (q,exp),p,c in zip(tests,pr,cf):
    hit=p==exp; ok+=hit; print(f"  {'OK ' if hit else 'MISS'} {p:11s} conf={c:.3f} exp={exp:11s} | {q[:32]}")
print(f"distinct routing: {ok}/{len(tests)}")
import joblib
joblib.dump({"centroids":cent,"labels":labels,"model_name":"all-MiniLM-L6-v2"},"sov33_embed_router.joblib")
print("saved sov33_embed_router.joblib", flush=True)
