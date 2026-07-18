import json, random, joblib, statistics as st
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
random.seed(42)
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
terse_test=terse[:n]; terse_train=terse[n:]   # SAME split as v4 training (seed 42, shuffled identically)
# rebuild v4 EXACTLY as trained
Xtr=[t for t,_ in persona]+[t for t,_ in terse_train]; ytr=[l for _,l in persona]+[l for _,l in terse_train]
Xtr2,_,ytr2,_=train_test_split(Xtr,ytr,test_size=0.2,random_state=42,stratify=ytr)
vec=TfidfVectorizer(max_features=6000,ngram_range=(1,2),min_df=2,sublinear_tf=True)
clf=CalibratedClassifierCV(LogisticRegression(max_iter=2000,C=2.0,class_weight="balanced"),method="isotonic",cv=3)
clf.fit(vec.fit_transform(Xtr2),ytr2)
# reliability on GENUINELY held-out terse (never in Xtr)
Xte=[t for t,_ in terse_test]; yte=[l for _,l in terse_test]
P=clf.predict_proba(vec.transform(Xte)); pred=clf.predict(vec.transform(Xte))
conf=[max(p) for p in P]; correct=[int(a==b) for a,b in zip(pred,yte)]
print("=== HONEST reliability on held-out terse (n={}) ===".format(len(yte)))
for lo,hi in [(0,0.4),(0.4,0.5),(0.5,0.6),(0.6,1.01)]:
    idx=[i for i,c in enumerate(conf) if lo<=c<hi]
    if idx: print(f"  conf[{lo:.1f}-{hi:.1f}): n={len(idx):3d} acc={sum(correct[i] for i in idx)/len(idx):.3f}")
order=sorted(range(len(conf)),key=lambda i:conf[i])
print("confidence-routing (defer lowest X%):")
for f in [0.0,0.1,0.2,0.3]:
    k=order[int(len(conf)*f):]; print(f"  defer {int(f*100):2d}%: acc={sum(correct[i] for i in k)/len(k):.3f}")
