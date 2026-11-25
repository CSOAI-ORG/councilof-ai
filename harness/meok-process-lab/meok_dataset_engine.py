#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Bounded dataset intake for the existing MEOK process lab.
Research-only. No model training, board changes, signatures or automatic admission.
"""
import hashlib,json,math,pathlib,unittest
import sovos_neural_stitch as lab

LIMIT=2_000_000
SPLITS=("train","validation","test")
def sha(b):return hashlib.sha256(b).hexdigest()
def unique(pairs):
    d={}
    for k,v in pairs:
        if k in d:raise ValueError("duplicate JSON key")
        d[k]=v
    return d
def bad_constant(s):raise ValueError("nonfinite JSON")
def decode(line):return json.loads(line,object_pairs_hook=unique,parse_constant=bad_constant)
def vector(v,n):
    return isinstance(v,list) and len(v)==n and all(type(x) in (int,float) and math.isfinite(x) for x in v)
def simplex(v):
    return all(0<=x<=1 for x in v) and abs(sum(v)-1)<=1e-8
def scan(raw,split,expected):
    if split not in SPLITS or len(raw)>LIMIT or sha(raw)!=expected:raise ValueError("artifact pin or scope")
    seen=set();groups=set();rows=0;label_conflicts=0;patterns={}
    for line in raw.splitlines():
        if not line.strip():raise ValueError("blank row")
        x=decode(line)
        if not isinstance(x,dict) or x.get("split")!=split:raise ValueError("split")
        ep,t=x.get("episode"),x.get("tick")
        if type(ep)!=int or type(t)!=int or ep<0 or not 0<=t<8:raise ValueError("episode or tick")
        if (ep,t) in seen:raise ValueError("duplicate identity")
        seen.add((ep,t));groups.add(ep)
        f,y=x.get("features"),x.get("target")
        if not vector(f,12) or not vector(y,4) or not simplex(f[:4]) or not simplex(f[4:8]) or not simplex(y):raise ValueError("shape or proportion")
        if f[8] not in (0,1) or f[10] not in (0,1) or f[9] not in tuple(i/8 for i in range(-7,10)) or f[11]!=t/8:raise ValueError("control domain")
        # Identical features can have different labels in partially observed
        # stochastic processes. Report ambiguity, never silently discard it.
        k=tuple(f);v=tuple(y)
        if k in patterns and v not in patterns[k]:label_conflicts+=1
        patterns.setdefault(k,set()).add(v)
        rows+=1
    if not rows or len(seen)!=8*len(groups):raise ValueError("incomplete episode")
    return {"rows":rows,"episodes":len(groups),"sha256":expected,"unique_feature_vectors":len(patterns),
            "additional_distinct_targets_for_seen_features":label_conflicts},groups
def qualify(files,pins):
    if set(files)!=set(SPLITS) or set(pins)!=set(SPLITS):raise ValueError("split set")
    reports={};groups={}
    for s in SPLITS:reports[s],groups[s]=scan(files[s],s,pins[s])
    if any(groups[a]&groups[b] for i,a in enumerate(SPLITS) for b in SPLITS[i+1:]):raise ValueError("episode leakage")
    return reports
def training_bytes(files,pins,role):
    # Caller cannot relabel a pinned evaluation artifact as training. No
    # generic arbitrary dataset rights grant is implemented.
    if role!="train" or pins!= {s:lab.PINS[s+".jsonl"] for s in SPLITS}:raise ValueError("training scope")
    qualify(files,pins)
    return files["train"]
def main():
    files={s:lab.get(s+".jsonl") for s in SPLITS}
    pins={s:lab.PINS[s+".jsonl"] for s in SPLITS}
    reports=qualify(files,pins)
    assert training_bytes(files,pins,"train")==files["train"]
    controls=[]
    def reject(name,fn):
        try:fn()
        except ValueError:controls.append(name)
        else:raise AssertionError(name)
    reject("changed_bytes",lambda:scan(files["train"]+b" ", "train",pins["train"]))
    reject("test_as_training",lambda:training_bytes(files,pins,"test"))
    reject("wrong_split",lambda:scan(files["test"],"train",pins["test"]))
    reject("wrong_pin_map",lambda:training_bytes(files,{**pins,"train":pins["test"]},"train"))
    reject("duplicate_json_key",lambda:decode(b'{"split":"train","split":"test"}'))
    reject("nonfinite",lambda:decode(b'{"x":NaN}'))
    rows=[decode(l) for l in files["train"].splitlines()]
    def altered(change):
        rr=[dict(r) for r in rows];change(rr)
        return b"\n".join(json.dumps(r,allow_nan=False).encode() for r in rr)+b"\n"
    for name,change in (("duplicate_row",lambda r:r.append(r[0])),
        ("missing_tick",lambda r:r.pop()),("invalid_proportion",lambda r:r[0].update(target=[1,1,1,1])),
        ("invalid_control",lambda r:r[0].update(features=r[0]["features"][:11]+[2]))):
        b=altered(change);reject(name,lambda b=b:scan(b,"train",sha(b)))
    # Deliberate group overlap even with internally consistent split labels.
    evalrows=[decode(l) for l in files["test"].splitlines()]
    group=evalrows[0]["episode"];target_group=rows[0]["episode"]
    for r in evalrows:
        if r["episode"]==group:r["episode"]=target_group
    b=b"\n".join(json.dumps(r).encode() for r in evalrows)+b"\n"
    reject("cross_split_episode",lambda:qualify({**files,"test":b},{**pins,"test":sha(b)}))
    print("DATA_ENGINE_RESULT "+json.dumps({"state":"PINNED_DATASET_INTAKE_RESEARCH","dataset_revision":lab.DATA.split("/resolve/")[1].strip("/"),
      "splits":reports,"negative_controls":controls,"train_only_bytes_returned":len(files["train"]),
      "new_gspc_measurement":False,"authorises_execution":False,"rights_scope":"existing synthetic MEOK lab dataset only; no general rights grant"},sort_keys=True))
if __name__=="__main__":main()
