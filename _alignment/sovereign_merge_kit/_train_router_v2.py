import json, sys
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
import joblib, statistics as st

def load(fn, label, cap=None):
    rows=[]
    for line in open(fn):
        if not line.strip(): continue
        d=json.loads(line); msgs=d.get("messages",[])
        u=next((m["content"] for m in msgs if m.get("role")=="user"), None)
        if u: rows.append((u.replace("Situation to judge:","").strip()[:400], label))
    return rows[:cap] if cap else rows

data=[]
for fn,lab in [("expert_data/defense.jsonl","defense"),("expert_data/compliance.jsonl","compliance"),("expert_data/intuition.jsonl","intuition")]:
    data += load(fn, lab)
# ADD terse factual gov questions (the missing domain) — graded batteries are compliance-domain law questions
for bf in ["/Users/nicholas/.claude-science/orgs/afd8d9ac-019f-4b20-9510-5402272d5585/workspaces/b7e8b68f-869a-4fa0-8454-8eeb52a735a5/gov_eval_graded.json","/Users/nicholas/.claude-science/orgs/afd8d9ac-019f-4b20-9510-5402272d5585/workspaces/b7e8b68f-869a-4fa0-8454-8eeb52a735a5/gov_eval_graded_hard.json"]:
    for it in json.load(open(bf)):
        q=it.get("q","")
        if q: data.append((q[:400], "compliance"))
print(f"total (persona + terse): {len(data)}  (added {len(data)-3081} terse gov)")
X=[t for t,_ in data]; y=[l for _,l in data]
Xtr,Xte,ytr,yte=train_test_split(X,y,test_size=0.25,random_state=42,stratify=y)

vec=TfidfVectorizer(max_features=5000, ngram_range=(1,2), min_df=2, sublinear_tf=True)
Xtr_v=vec.fit_transform(Xtr); Xte_v=vec.transform(Xte)
base=LogisticRegression(max_iter=2000, C=2.0, class_weight="balanced")
# CALIBRATED probabilities so confidence tracks correctness
clf=CalibratedClassifierCV(base, method="isotonic", cv=3)
clf.fit(Xtr_v,ytr)
pred=clf.predict(Xte_v)
acc=accuracy_score(yte,pred); f1=f1_score(yte,pred,average="macro")
# confidence spread on held-out (the thing that was flat before)
probs=[max(p) for p in clf.predict_proba(Xte_v)]
# does confidence discriminate correct vs wrong?
correct_conf=[max(p) for p,pr,t in zip(clf.predict_proba(Xte_v),pred,yte) if pr==t]
wrong_conf=[max(p) for p,pr,t in zip(clf.predict_proba(Xte_v),pred,yte) if pr!=t]
print(f"acc={acc:.3f} macro-f1={f1:.3f} (n_test={len(yte)})")
print(f"confidence spread: stdev={st.pstdev(probs):.3f} (was 0.060 flat)")
print(f"conf when CORRECT: {st.mean(correct_conf):.3f}  |  conf when WRONG: {st.mean(wrong_conf):.3f}  <- gap = discrimination")
joblib.dump({"vec":vec,"clf":clf,"labels":sorted(set(y))}, "sov33_trained_router_v2.joblib")
print("saved sov33_trained_router_v2.joblib")
