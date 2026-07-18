import json, os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
import joblib

def load(fn, label):
    rows=[]
    for line in open(fn):
        if not line.strip(): continue
        d=json.loads(line)
        # extract the user-turn text (the thing being routed)
        msgs=d.get("messages",[])
        u=next((m["content"] for m in msgs if m.get("role")=="user"), None)
        if u: rows.append((u.replace("Situation to judge:","").strip()[:400], label))
    return rows

data=[]
for fn,lab in [("expert_data/defense.jsonl","defense"),("expert_data/compliance.jsonl","compliance"),("expert_data/intuition.jsonl","intuition")]:
    data += load(fn, lab)
print(f"total routing examples: {len(data)}")
X=[t for t,_ in data]; y=[l for _,l in data]
Xtr,Xte,ytr,yte=train_test_split(X,y,test_size=0.25,random_state=42,stratify=y)

# TRAINED router
vec=TfidfVectorizer(max_features=5000, ngram_range=(1,2), min_df=2)
Xtr_v=vec.fit_transform(Xtr); Xte_v=vec.transform(Xte)
clf=LogisticRegression(max_iter=1000, C=2.0)
clf.fit(Xtr_v,ytr)
pred=clf.predict(Xte_v)
acc=accuracy_score(yte,pred); f1=f1_score(yte,pred,average="macro")

# KEYWORD baseline (the current venturi)
NODES={"defense":["threat","attack","exploit","malware","intrusion","adversar","breach","weapon","harm","security"],
       "compliance":["law","regulation","gdpr","eu ai act","article","compliance","audit","conformity","legal","privacy","consent"],
       "intuition":["feel","sense","pattern","relationship","care","intent","hunch","emotion","trust","wellbeing"]}
def kw_route(p):
    p=p.lower(); s={n:sum(p.count(k) for k in kws) for n,kws in NODES.items()}
    n=max(s,key=lambda x:(s[x],x=="compliance")); return "compliance" if s[n]==0 else n
kw_pred=[kw_route(t) for t in Xte]
kw_acc=accuracy_score(yte,kw_pred)

print(f"TRAINED router:  acc={acc:.3f}  macro-f1={f1:.3f}  (n_test={len(yte)})")
print(f"KEYWORD venturi: acc={kw_acc:.3f}")
print(f"lift: {acc-kw_acc:+.3f}")
joblib.dump({"vec":vec,"clf":clf,"labels":sorted(set(y))}, "sov33_trained_router.joblib")
print("saved sov33_trained_router.joblib")
