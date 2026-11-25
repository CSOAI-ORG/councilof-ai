#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Public benchmark instrument audit, not MEOK training or a legal classifier.
Source: Davvetas et al., arXiv:2603.09435, CC-BY-4.0 scenarios.
The 237 rows and 102 complement are PUBLIC, not an independent holdout."""
import collections,hashlib,json,urllib.request
import numpy as np
import sklearn
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import confusion_matrix
UP="127f845b3a5c4763cdcef9560c5770015e2e07a5"
HF="ba036c3c88d1d1fcc69ebe0f832b95dfab9b4557"
LABELS=["PROHIBITED","HIGH_RISK","LIMITED_RISK","MINIMAL_RISK"]
MAP=dict(zip(["prohibited","high-risk","limited","minimal"],LABELS))
def get(url,sha):
    with urllib.request.urlopen(url,timeout=20) as r:b=r.read(2000001)
    if len(b)>2000000 or hashlib.sha256(b).hexdigest()!=sha:raise ValueError("source pin")
    return b
def render(r):
    return f"A {r['role'].lower()} deploys {r['system_type']} intended for {r['intended_use']} in the {r['domain']} domain using {r['input_data']}."
def stats(p,y):
    return {"correct":int((p==y).sum()),"n":len(y),"accuracy":float((p==y).mean()),
        "confusion":confusion_matrix(y,p,labels=LABELS).tolist()}
def main():
    upstream=get(f"https://raw.githubusercontent.com/davidath/ai-act-evaluation-benchmark/{UP}/scenarios.json","0fc1c7491372cf0aa787b4b650f77245ec775f8bff0c4c84f253435c7dcb1b25")
    raw=get(f"https://huggingface.co/datasets/csoai/gspc-gov/resolve/{HF}/items.jsonl","9c9de457cdded0d8e176067d684b3dab0074cc0a8d14e497c7c0b6f7aa3b61b5")
    source=json.loads(upstream)["data"];allrows=[json.loads(l) for l in raw.splitlines()]
    rows=[x for x in allrows if "_canary" not in x]
    assert len(source)==339 and len(rows)==237 and len(allrows)-len(rows)==1
    test=[r["source_index"] for r in rows];train=sorted(set(range(len(source)))-set(test))
    assert len(set(test))==len(test) and len(train)==102
    assert all(r["expected"]==MAP[source[r["source_index"]]["risk_level"]] for r in rows)
    rendered=[render(r) for r in source]
    exact=sum(r["scenario"]==rendered[r["source_index"]] for r in rows)
    # Use original published strings for test; complement rendered by same
    # source-field template. Require full text identity before comparison.
    if exact!=len(rows):raise ValueError(f"render mismatch {exact}/{len(rows)}")
    y=np.array([MAP[r["risk_level"]] for r in source]);t=np.array(train);e=np.array(test)
    words=np.array([[len(s.split())] for s in rendered])
    fields=np.array([[len(str(r[k]).split()) for k in ("system_type","intended_use","domain","input_data")] for r in source])
    char=np.array([[len(s)] for s in rendered])
    result={}
    majority=collections.Counter(y[t]).most_common(1)[0][0];result["majority"]=stats(np.full(len(e),majority),y[e])
    for name,x in (("word_count",words),("char_count",char),("field_word_counts",fields)):
        m=DecisionTreeClassifier(max_depth=4,random_state=261125).fit(x[t],y[t])
        result[name]=stats(m.predict(x[e]),y[e])
        rng=np.random.default_rng(261125)
        null=[float((DecisionTreeClassifier(max_depth=4,random_state=261125).fit(x[t],rng.permutation(y[t])).predict(x[e])==y[e]).mean()) for _ in range(200)]
        result[name]["shuffled_train_label_mean"]=float(np.mean(null))
        result[name]["shuffled_train_label_p95"]=float(np.quantile(null,.95))
        # Stress only the surface-feature model with neutral text length changes.
        # This is not a qualified semantic paraphrase bank.
        if name=="word_count":
            result[name]["neutral_length_shift_plus_20_words"]=stats(m.predict(x[e]+20),y[e])
            result[name]["neutral_length_shift_plus_40_words"]=stats(m.predict(x[e]+40),y[e])
    ranges={k:{"min":int(words[y==k].min()),"max":int(words[y==k].max()),"median":float(np.median(words[y==k]))} for k in LABELS}
    print("GOV_AUDIT "+json.dumps({"state":"PUBLIC_INSTRUMENT_DIAGNOSTIC","upstream_revision":UP,"bank_revision":HF,
        "source_rows":len(source),"published_rows":len(rows),"excluded_canary_rows":len(allrows)-len(rows),
        "complement_rows":len(train),"label_match":len(rows),"render_match":exact,"sklearn":sklearn.__version__,
        "class_order":LABELS,"word_count_ranges":ranges,"results":result,"new_gspc_measurement":False,
        "authorises_execution":False,"legal_label_reviewed":False,"private_holdout":False,"meok_training":False},sort_keys=True,allow_nan=False))
if __name__=="__main__":main()
