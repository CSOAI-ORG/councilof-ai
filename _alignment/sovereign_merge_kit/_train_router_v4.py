import json, random
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
import joblib, statistics as st
random.seed(42)

def load(fn,label):
    r=[]
    for line in open(fn):
        if not line.strip(): continue
        d=json.loads(line); u=next((m["content"] for m in d.get("messages",[]) if m.get("role")=="user"),None)
        if u: r.append((u.replace("Situation to judge:","").strip()[:400],label))
    return r

# persona corpora (long)
persona=[]
for fn,l in [("expert_data/defense.jsonl","defense"),("expert_data/compliance.jsonl","compliance"),("expert_data/intuition.jsonl","intuition")]:
    persona += [(t[:400],l) for t,l in load(fn,l)]

# terse queries (NEW) — SPLIT FIRST so the OOD test set is never trained on (no contamination)
terse=[(d["q"],d["node"]) for d in json.load(open("terse_queries.json"))]
random.shuffle(terse)
n_hold=int(len(terse)*0.30)
terse_test=terse[:n_hold]       # HELD OUT — never seen in training
terse_train=terse[n_hold:]

Xtr = [t for t,_ in persona] + [t for t,_ in terse_train]
ytr = [l for _,l in persona] + [l for _,l in terse_train]
# internal val split from training for accuracy report
Xtr2,Xval,ytr2,yval = train_test_split(Xtr,ytr,test_size=0.2,random_state=42,stratify=ytr)

vec=TfidfVectorizer(max_features=6000, ngram_range=(1,2), min_df=2, sublinear_tf=True)
Xv=vec.fit_transform(Xtr2)
base=LogisticRegression(max_iter=2000, C=2.0, class_weight="balanced")
clf=CalibratedClassifierCV(base, method="isotonic", cv=3); clf.fit(Xv,ytr2)

val_acc=accuracy_score(yval, clf.predict(vec.transform(Xval)))
print(f"in-domain val acc: {val_acc:.3f}")

# THE HONEST OOD TEST — held-out terse queries never trained on
Xte=[t for t,_ in terse_test]; yte=[l for _,l in terse_test]
pred=clf.predict(vec.transform(Xte))
ood_acc=accuracy_score(yte,pred); ood_f1=f1_score(yte,pred,average="macro")
probs=[max(p) for p in clf.predict_proba(vec.transform(Xte))]
cc=[max(p) for p,pr,t in zip(clf.predict_proba(vec.transform(Xte)),pred,yte) if pr==t]
wc=[max(p) for p,pr,t in zip(clf.predict_proba(vec.transform(Xte)),pred,yte) if pr!=t]
print(f"OOD (held-out terse, NEVER trained): acc={ood_acc:.3f} f1={ood_f1:.3f} n={len(yte)}")
print(f"  conf stdev={st.pstdev(probs):.3f}  correct_conf={st.mean(cc) if cc else 0:.3f}  wrong_conf={st.mean(wc) if wc else 0:.3f}")
joblib.dump({"vec":vec,"clf":clf,"labels":sorted(set(ytr))}, "sov33_trained_router_v4.joblib")
print("saved v4")
