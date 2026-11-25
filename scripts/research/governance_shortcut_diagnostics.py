#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Read-only instrument diagnostic of the public frozen GovBench.
No MEOK training, deployed model, legal label validation or new GSPC score.
Upstream CC BY 4.0: Davvetas, Papademas, Ziouvelou, Karkaletsis,
AI Act Evaluation Benchmark, arXiv:2603.09435. No source rows redistributed."""
import collections,hashlib,json,unicodedata,urllib.request
import numpy as np
import sklearn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import make_pipeline
from sklearn.metrics import accuracy_score,balanced_accuracy_score,confusion_matrix
UPSTREAM="https://raw.githubusercontent.com/davidath/ai-act-evaluation-benchmark/127f845b3a5c4763cdcef9560c5770015e2e07a5/scenarios.json"
BANK="https://huggingface.co/datasets/csoai/gspc-gov/resolve/ba036c3c88d1d1fcc69ebe0f832b95dfab9b4557/items.jsonl"
PINS=["0fc1c7491372cf0aa787b4b650f77245ec775f8bff0c4c84f253435c7dcb1b25","9c9de457cdded0d8e176067d684b3dab0074cc0a8d14e497c7c0b6f7aa3b61b5"]
LABEL={"high-risk":"HIGH_RISK","minimal":"MINIMAL_RISK","limited":"LIMITED_RISK","prohibited":"PROHIBITED"}
def get(url,pin):
    with urllib.request.urlopen(url,timeout=20) as r:b=r.read(2000001)
    if len(b)>2000000 or hashlib.sha256(b).hexdigest()!=pin:raise ValueError("source pin")
    return b
def norm(s):return " ".join(unicodedata.normalize("NFKC",s).casefold().replace("‑","-").split())
def main():
    source=json.loads(get(UPSTREAM,PINS[0]));raw=[json.loads(l) for l in get(BANK,PINS[1]).splitlines()]
    assert len(raw)==238 and sum("_canary" in r for r in raw)==1
    rows=[r for r in raw if "_canary" not in r];up=source["data"];assert len(up)==339
    idx=[r["source_index"] for r in rows];assert len(set(idx))==len(idx)==237
    chosen=[up[i] for i in idx]
    assert all(r["expected"]==LABEL[s["risk_level"]] for r,s in zip(rows,chosen))
    for r,s in zip(rows,chosen):
        assert all(norm(s[k]) in norm(r["scenario"]) for k in ("system_type","intended_use","input_data","domain"))
    y=np.array([r["expected"] for r in rows]);groups=np.array([norm(s["domain"]) for s in chosen])
    labels=sorted(set(y));folds=list(GroupKFold(n_splits=5).split(rows,y,groups))
    for tr,te in folds:assert not set(groups[tr])&set(groups[te])
    variants={"scenario":[r["scenario"] for r in rows],
      "system_type_only":[s["system_type"] for s in chosen],
      "domain_only":[s["domain"] for s in chosen],
      "input_data_only":[s["input_data"] for s in chosen],
      "intended_use_only":[s["intended_use"] for s in chosen],
      "role_only":[s["role"] for s in chosen]}
    def summarize(p):
        return {"correct":int((p==y).sum()),"n":len(y),"accuracy":float(accuracy_score(y,p)),
                "balanced_accuracy":float(balanced_accuracy_score(y,p)),
                "confusion":confusion_matrix(y,p,labels=labels).tolist()}
    def predict(text,shuffle=False):
        text=np.array(text);p=np.empty(len(y),dtype=y.dtype)
        for i,(tr,te) in enumerate(folds):
            yy=y[tr]
            if shuffle:yy=np.random.default_rng(812+i).permutation(yy)
            model=make_pipeline(TfidfVectorizer(ngram_range=(1,2),sublinear_tf=True),LogisticRegression(max_iter=1000,random_state=812))
            model.fit(text[tr],yy);p[te]=model.predict(text[te])
        return summarize(p)
    baseline=np.empty(len(y),dtype=y.dtype)
    for tr,te in folds:baseline[te]=collections.Counter(y[tr]).most_common(1)[0][0]
    out={"state":"PUBLIC_BANK_INSTRUMENT_DIAGNOSTIC","source_pins":PINS,"n":len(y),
      "upstream_rows":len(up),"label_binding":len(y),"scenario_binding":len(y),"canary_excluded":True,
      "domain_groups":len(set(groups)),"labels":labels,"label_counts":dict(collections.Counter(y)),
      "folds":[{"train":len(tr),"test":len(te),"test_domains":len(set(groups[te]))} for tr,te in folds],
      "majority":summarize(baseline),"variants":{k:predict(v) for k,v in variants.items()},
      "shuffled_label_control":predict(variants["scenario"],True),
      "sklearn":sklearn.__version__,"numpy":np.__version__,"trained_model_retained":False,
      "new_gspc_measurement":False,"authorises_execution":False}
    print("GOV_DIAGNOSTIC "+json.dumps(out,sort_keys=True,allow_nan=False))
if __name__=="__main__":main()
