import json, joblib, statistics as st
from sklearn.model_selection import train_test_split

def load(fn,label):
    r=[]
    for line in open(fn):
        if not line.strip(): continue
        d=json.loads(line); u=next((m["content"] for m in d.get("messages",[]) if m.get("role")=="user"),None)
        if u: r.append((u.replace("Situation to judge:","").strip()[:400],label))
    return r
data=[]
for fn,l in [("expert_data/defense.jsonl","defense"),("expert_data/compliance.jsonl","compliance"),("expert_data/intuition.jsonl","intuition")]:
    data+=load(fn,l)
X=[t for t,_ in data]; y=[l for _,l in data]
_,Xte,_,yte=train_test_split(X,y,test_size=0.25,random_state=42,stratify=y)
m=joblib.load("sov33_trained_router_v2.joblib")
P=m["clf"].predict_proba(m["vec"].transform(Xte)); pred=m["clf"].predict(m["vec"].transform(Xte))
conf=[max(p) for p in P]; correct=[int(pr==t) for pr,t in zip(pred,yte)]

# RELIABILITY: bucket by confidence, measure actual accuracy per bucket
print("=== RELIABILITY CURVE (does higher confidence = higher accuracy?) ===")
buckets=[(0.0,0.4),(0.4,0.6),(0.6,0.8),(0.8,1.01)]
for lo,hi in buckets:
    idx=[i for i,c in enumerate(conf) if lo<=c<hi]
    if idx:
        acc=sum(correct[i] for i in idx)/len(idx)
        print(f"  conf [{lo:.1f}-{hi:.1f}): n={len(idx):3d}  actual_acc={acc:.3f}")

# CONFIDENCE-ROUTING SIM: if we ESCALATE (defer) the lowest-confidence X%, how much does accuracy rise?
print("\n=== CONFIDENCE-ROUTING: accuracy on the kept (confident) items ===")
order=sorted(range(len(conf)), key=lambda i:conf[i])
for frac in [0.0,0.1,0.2,0.3]:
    n_defer=int(len(conf)*frac); keep=order[n_defer:]
    acc=sum(correct[i] for i in keep)/len(keep) if keep else 0
    print(f"  defer lowest {int(frac*100):2d}%: kept {len(keep)}  accuracy={acc:.3f}")
print("\n^ if accuracy RISES as we defer low-confidence items, confidence-routing WORKS (escalate the unsure ones)")
