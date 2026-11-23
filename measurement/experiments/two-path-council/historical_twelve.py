#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Retrospective 12-voter panels constructed from existing PUBLIC GSPC rows.

No real-time agent calls; selected models did NOT form a historical BFT council.
Outputs are descriptive only and cannot be called blind, new or independent.
"""
from __future__ import annotations

import hashlib
import json
import math
import statistics
from collections import Counter, defaultdict

from audit_public_fact_ontology import DEFAULT_REV, fetch, jsonl, corr

SCHEMA = "csoai.gspc-historical-12-voter-panel/0.1"


def analyse(measurements, items):
    original = {(r["axis"], r["item_id"]): r for r in items}
    rows_by_key = defaultdict(list)
    for r in measurements:
        if (type(r.get("ok")) is bool and isinstance(r.get("model"), str) and r["model"]
                and isinstance(r.get("observed"), str) and r["observed"]
                and (r.get("axis"), r.get("item_id")) in original):
            rows_by_key[(r["axis"], r["model"], r["item_id"])].append(r)
    # Retain only unambiguous single observations. Never select "best of N".
    unique = {k: v[0] for k, v in rows_by_key.items() if len(v) == 1}
    by_model = defaultdict(dict)
    for (axis,model,item),r in unique.items():
        bank_item = original[(axis,item)]
        if r["expected"] != bank_item["expected"]:
            continue
        if r["ok"] != (r["observed"] == r["expected"]):
            continue
        by_model[(axis,model)][item] = r
    axes = sorted({a for a,m in by_model})
    result = {}
    for axis in axes:
        # Choice rule intentionally ignores accuracy. Recomputing with a
        # better-scoring roster would require a separate selection sample.
        candidates = [(model, data) for (a,model),data in by_model.items()
                      if a == axis and len(data)>=30]
        candidates.sort(key=lambda t: (-len(t[1]), t[0]))
        roster = candidates[:12]
        if len(roster)<12:
            continue
        shared = set.intersection(*(set(d) for _,d in roster))
        if len(shared)<30:
            continue
        ordered = sorted(shared)
        individual = []
        votes_correct = []
        covered = 0
        correct = 0
        for item_id in ordered:
            rows=[d[item_id] for m,d in roster]
            expected = original[(axis,item_id)]["expected"]
            counts=Counter(r["observed"] for r in rows)
            winner,n = counts.most_common(1)[0]
            if n>=7:
                covered+=1
                correct+=int(winner==expected)
            votes_correct.append([int(r["ok"]) for r in rows])
            individual.extend(int(r["ok"]) for r in rows)
        cors=[corr([v[i] for v in votes_correct],[v[j] for v in votes_correct])
              for i in range(12) for j in range(i+1,12)]
        defined=[c for c in cors if c is not None]
        report={
            "roster_rule":"12 eligible identifiers by descending unique row count then lexicographic model ID; no score selection",
            "roster_model_ids":[model for model,d in roster],
            "roster_sha256":hashlib.sha256(json.dumps([m for m,d in roster],separators=(",",":")).encode()).hexdigest(),
            "n_paired_public_items":len(ordered),
            "n_distinct_model_ids":12,
            "model_vote_accuracy_mean":round(statistics.mean(individual),5),
            "majority_accuracy_all_items":round(correct/len(ordered),5),
            "majority_coverage":round(covered/len(ordered),5),
            "majority_abstentions":len(ordered)-covered,
            "mean_pairwise_correctness_correlation":round(statistics.mean(defined),5) if defined else None,
            "pairwise_correlation_defined":len(defined),
        }
        result[axis]=report
    return {"schema":SCHEMA,"evidence_state":"RETROSPECTIVE_PUBLIC_REUSE",
            "not_real_time":True,"not_new_model_inference":True,"not_blind":True,
            "not_bft_consensus":True,"not_independent_referee":True,
            "axis_panels":result,
            "limitations":[
                "Public historical model outputs were retrospectively assembled into twelve-voter groups",
                "Models were not recruited, synchronised or authenticated as one council",
                "Every panel uses at least thirty shared public items; no held-out claims",
                "The scorer is same-author deterministic code; no external review",
                "Pairwise errors are dependent across agents and repeated public tasks",
                "No evidence about privileged answer or evaluation-objective exposure",
            ]}


def main():
    measurements=jsonl(fetch(DEFAULT_REV,"gspc_measurements.jsonl"))
    items=jsonl(fetch(DEFAULT_REV,"gspc_items.jsonl"))
    result=analyse(measurements,items)
    result["source_revision"]=DEFAULT_REV
    result["receipt_sha256"]=hashlib.sha256(json.dumps(result,sort_keys=True,separators=(",",":")).encode()).hexdigest()
    print(json.dumps(result,indent=2,sort_keys=True))


if __name__=="__main__":
    main()
