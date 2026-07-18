import json, re, random
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
        if u: r.append((u.replace("Situation to judge:","").strip(),label))
    return r

def terse_aug(text):
    """Make a SHORT paraphrase: keep the most salient content words (mimics real terse prompts)."""
    words=re.findall(r"[a-zA-Z][a-zA-Z\-]+", text.lower())
    # keep distinctive words (len>3), cap ~8 — mimics a terse query
    kw=[w for w in words if len(w)>3][:12]
    if len(kw)<3: return None
    random.shuffle(kw)
    return " ".join(kw[:8])

data=[]
for fn,l in [("expert_data/defense.jsonl","defense"),("expert_data/compliance.jsonl","compliance"),("expert_data/intuition.jsonl","intuition")]:
    for t,lab in load(fn,l):
        data.append((t[:400],lab))
        a=terse_aug(t)                       # ADD a terse variant of each -> OOD robustness
        if a: data.append((a,lab))
# + the graded batteries (real terse gov questions)
for bf in ["/Users/nicholas/.claude-science/orgs/afd8d9ac-019f-4b20-9510-5402272d5585/workspaces/b7e8b68f-869a-4fa0-8454-8eeb52a735a5/gov_eval_graded.json","/Users/nicholas/.claude-science/orgs/afd8d9ac-019f-4b20-9510-5402272d5585/workspaces/b7e8b68f-869a-4fa0-8454-8eeb52a735a5/gov_eval_graded_hard.json"]:
    for it in json.load(open(bf)):
        q=it.get("q","");
        if q: data.append((q[:400],"compliance"))
print(f"total (persona + terse-aug + gov): {len(data)}")
X=[t for t,_ in data]; y=[l for _,l in data]
Xtr,Xte,ytr,yte=train_test_split(X,y,test_size=0.25,random_state=42,stratify=y)
vec=TfidfVectorizer(max_features=6000, ngram_range=(1,2), min_df=2, sublinear_tf=True)
Xtr_v=vec.fit_transform(Xtr); Xte_v=vec.transform(Xte)
base=LogisticRegression(max_iter=2000, C=2.0, class_weight="balanced")
clf=CalibratedClassifierCV(base, method="isotonic", cv=3)
clf.fit(Xtr_v,ytr); pred=clf.predict(Xte_v)
print(f"acc={accuracy_score(yte,pred):.3f} f1={f1_score(yte,pred,average='macro'):.3f} (n_test={len(yte)})")
joblib.dump({"vec":vec,"clf":clf,"labels":sorted(set(y))}, "sov33_trained_router_v3.joblib")

# OOD TEST: the exact ad-hoc terse prompts that broke v2
m={"vec":vec,"clf":clf}
tests=[("adversarial malware exploit injection attack","defense"),
       ("Does this comply with GDPR Article 6 lawful basis","compliance"),
       ("I sense this user is struggling needs care","intuition"),
       ("threat breach detected block it","defense"),
       ("data subject access request deadline","compliance")]
print("\n=== OOD terse-prompt routing (the cases that broke v2) ===")
ok=0
for q,exp in tests:
    p=clf.predict_proba(vec.transform([q]))[0]; i=p.argmax(); node=clf.classes_[i]
    hit = node==exp; ok+=hit
    print(f"  {'OK ' if hit else 'MISS'} {node:11s} conf={p[i]:.3f} exp={exp:11s} | {q[:34]}")
print(f"OOD routing: {ok}/{len(tests)} correct")
