import json, random
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
from sklearn.pipeline import FeatureUnion
import joblib, statistics as st
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
terse_test=terse[:n]; terse_train=terse[n:]
Xtr=[t for t,_ in persona]+[t for t,_ in terse_train]; ytr=[l for _,l in persona]+[l for _,l in terse_train]
Xtr2,_,ytr2,_=train_test_split(Xtr,ytr,test_size=0.2,random_state=42,stratify=ytr)
# FIX: word ngrams (min_df=1) + CHAR ngrams -> never zero-vector on unseen words
vec=FeatureUnion([
    ("word", TfidfVectorizer(max_features=6000,ngram_range=(1,2),min_df=1,sublinear_tf=True)),
    ("char", TfidfVectorizer(analyzer="char_wb",ngram_range=(3,5),max_features=4000,min_df=2,sublinear_tf=True)),
])
Xv=vec.fit_transform(Xtr2)
clf=CalibratedClassifierCV(LogisticRegression(max_iter=2000,C=2.0,class_weight="balanced"),method="isotonic",cv=3)
clf.fit(Xv,ytr2)
# verify no zero-vector on the exact prompt that broke v4
tv=vec.transform(["malware exploit intrusion attack breach weapon"])
print("nnz on defense prompt (was 0):", tv.nnz)
Xte=[t for t,_ in terse_test]; yte=[l for _,l in terse_test]
pred=clf.predict(vec.transform(Xte)); acc=accuracy_score(yte,pred)
print(f"OOD held-out terse: acc={acc:.3f} f1={f1_score(yte,pred,average='macro'):.3f} n={len(yte)}")
# distinct-prompt sanity
print("distinct routing check:")
for q,exp in [("malware exploit intrusion attack breach","defense"),("GDPR Article 6 lawful basis compliance audit","compliance"),("I feel this person needs care and trust","intuition")]:
    p=clf.predict_proba(vec.transform([q]))[0];i=p.argmax()
    print(f"  {'OK ' if clf.classes_[i]==exp else 'MISS'} {clf.classes_[i]:11s} conf={p[i]:.3f} | {q[:32]}")
joblib.dump({"vec":vec,"clf":clf,"labels":sorted(set(ytr))},"sov33_trained_router_v5.joblib")
print("saved v5")
