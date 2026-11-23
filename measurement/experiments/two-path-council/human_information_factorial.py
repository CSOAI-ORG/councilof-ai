#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Human-information x model-policy x period factorial research grader.

No human subject or model is contacted. CLI is SYNTHETIC-ONLY. Grader-side
private rows can be evaluated by an authorised laboratory, but do not acquire
independent truth, human authority, or user outcomes from this score.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import random
from collections import defaultdict

SCHEMA="csoai.him-meok-factorial-research/0.1"
HUMAN=("none","irrelevant","task_relevant")
POLICY=("frozen","proposed_update")
EPOCH=(0,1)


def sha(v):
    return hashlib.sha256(json.dumps(v,sort_keys=True,separators=(",",":")).encode()).hexdigest()


def validate(rows,min_tasks=30):
    if not isinstance(rows,list) or not rows:
        raise ValueError("missing rows")
    bytask=defaultdict(dict)
    bank=rev=None
    for r in rows:
        keys={"task_id","human_condition","policy_condition","epoch","model_revision","bank_sha256","correct"}
        if not isinstance(r,dict) or set(r)!=keys:
            raise ValueError("untrusted/extra fields: no personal identifiers permitted")
        task,human,policy,epoch=r["task_id"],r["human_condition"],r["policy_condition"],r["epoch"]
        if not isinstance(task,str) or not task or len(task)>128 or human not in HUMAN or policy not in POLICY or type(epoch) is not int or epoch not in EPOCH or type(r["correct"]) is not bool:
            raise ValueError("invalid experimental row")
        if (not isinstance(r["bank_sha256"],str) or len(r["bank_sha256"])!=64 or
            any(c not in "0123456789abcdef" for c in r["bank_sha256"])):
            raise ValueError("missing exact bank commitment")
        if not isinstance(r["model_revision"],str) or not r["model_revision"]:
            raise ValueError("pinned base model revision required")
        if bank is None:
            bank=r["bank_sha256"];rev=r["model_revision"]
        if (r["bank_sha256"],r["model_revision"])!=(bank,rev):
            raise ValueError("mixed bank or base model revisions")
        cell=(human,policy,epoch)
        if cell in bytask[task]:
            raise ValueError("duplicate task x condition x epoch")
        bytask[task][cell]=r["correct"]
    if len(bytask)<min_tasks:
        raise ValueError("too few distinct matched tasks")
    expected={(h,p,e) for h in HUMAN for p in POLICY for e in EPOCH}
    for task,conditions in bytask.items():
        if set(conditions)!=expected:
            raise ValueError("unmatched factorial tasks; no imputation")
    return bytask,bank,rev


def analyse(rows, *,synthetic=False):
    bytask,bank,rev=validate(rows)
    tasks=sorted(bytask)
    n=len(tasks)
    accuracy={}
    for h in HUMAN:
        for p in POLICY:
            for e in EPOCH:
                k=f"{h}|{p}|{e}"
                accuracy[k]=round(sum(bytask[t][(h,p,e)] for t in tasks)/n,5)
    def d(t,h,p,e):
        return float(bytask[t][(h,p,e)])
    def average(values):
        return round(sum(values)/n,5)
    effects={
        "human_relevant_vs_none_frozen_at_t0":
            average([d(t,"task_relevant","frozen",0)-d(t,"none","frozen",0) for t in tasks]),
        "irrelevant_presence_vs_none_frozen_at_t0":
            average([d(t,"irrelevant","frozen",0)-d(t,"none","frozen",0) for t in tasks]),
        "policy_update_minus_frozen_at_t1_no_human":
            average([d(t,"none","proposed_update",1)-d(t,"none","frozen",1) for t in tasks]),
        "human_policy_interaction_at_t1":
            average([d(t,"task_relevant","proposed_update",1)-d(t,"none","proposed_update",1)
                      -d(t,"task_relevant","frozen",1)+d(t,"none","frozen",1) for t in tasks]),
        "incremental_human_effect_t1_minus_t0_frozen":
            average([d(t,"task_relevant","frozen",1)-d(t,"none","frozen",1)
                      -d(t,"task_relevant","frozen",0)+d(t,"none","frozen",0) for t in tasks]),
    }
    output={
       "schema":SCHEMA,
       "evidence_state":"SYNTHETIC" if synthetic else "UNVERIFIED_GRADER_SIDE",
       "n_matched_tasks":n,
       "n_conditions_per_task":len(HUMAN)*len(POLICY)*len(EPOCH),
       "n_grade_observations":len(rows),
       "bank_sha256":bank,
       "base_model_revision":rev,
       "accuracy_by_condition":accuracy,
       "paired_effects":effects,
       "human_authority_established":False,
       "actual_end_user_outcome_measured":False,
       "model_weight_change_verified":False,
       "consciousness_inferred":False,
       "reasons_not_to_infer_causality":[
         "The grader cannot verify treatment randomisation or secret answer custody",
         "Human-like conditions are labels; actual consenting humans and real model responses not supplied",
         "A proposed policy update is not training, model weight change or verified adaptation",
         "Individual work quality and end-user impact require independent consequence receipts",
         "Repeated task use may contaminate conditions unless clean model resets and counterbalancing are documented",
       ],
    }
    output["report_sha256"]=sha(output)
    return output


def simulate(n=500,seed=20261122):
    if n<30 or n>100000:
        raise ValueError("invalid task count")
    rng=random.Random(seed)
    bank=hashlib.sha256(f"FACTORIAL-SYNTHETIC-{seed}".encode()).hexdigest()
    rows=[]
    # Correlated potential outcomes on identical tasks, with explicitly
    # ASSUMED information and policy gains. Not measured human/model behaviour.
    for i in range(n):
        task=f"synthetic-task-{i:06d}"
        for epoch in EPOCH:
            threshold=rng.random()
            for human in HUMAN:
                for policy in POLICY:
                    p=.6 + (.015 if human=="irrelevant" else .12 if human=="task_relevant" else 0)
                    if epoch==1 and policy=="proposed_update":
                        p+=.08
                        if human=="task_relevant":
                            p+=.04
                    rows.append({"task_id":task,"human_condition":human,
                                 "policy_condition":policy,"epoch":epoch,
                                 "model_revision":"SIMULATED-NO-WEIGHTS",
                                 "bank_sha256":bank,"correct":threshold<p})
    return rows


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--demo",action="store_true")
    p.add_argument("--tasks",type=int,default=500)
    p.add_argument("--seed",type=int,default=20261122)
    a=p.parse_args()
    if not a.demo:
        p.error("only synthetic demonstration available via CLI")
    result=analyse(simulate(a.tasks,a.seed),synthetic=True)
    result["simulation_assumptions"]={"baseline_success":.6,
       "human_relevant_increment":.12,"irrelevant_human_increment":.015,
       "policy_update_t1_increment":.08,"relevant_human_x_policy_t1":.04}
    result.pop("report_sha256")
    result["report_sha256"]=sha(result)
    print(json.dumps(result,indent=2,sort_keys=True))


if __name__=="__main__":
    main()
