#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""CSOAI 12-around-1 classical information-path experiment.

A deterministic scorer compares twelve votes to a grader-side truth label.
NOT quantum mechanics, Byzantine consensus, external verifier approval, or
independent human authority. Private grader-side rows must not be published.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
from collections import defaultdict
from pathlib import Path

ARMS = ("blind_hidden", "blind_objective", "answer_hidden", "answer_objective")
SCHEMA = "csoai.gspc-two-path-council/0.1"
N_VOTERS = 12


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def digest(value):
    return hashlib.sha256(canonical(value)).hexdigest()


def validate(rows, min_tasks=30):
    """Reject mixed banks, bad votes, unpaired designs and inconsistent truth."""
    if not isinstance(rows, list) or not rows:
        raise ValueError("empty experiment")
    seen = set()
    by_task = defaultdict(dict)
    bank = None
    for row in rows:
        required = {"task_id", "arm", "bank_commitment", "truth", "votes"}
        if not isinstance(row, dict) or set(row) != required:
            raise ValueError("row schema invalid")
        task, arm, current_bank = row["task_id"], row["arm"], row["bank_commitment"]
        if not isinstance(task, str) or not task or arm not in ARMS:
            raise ValueError("invalid task or arm")
        if not isinstance(current_bank, str) or len(current_bank) != 64 or any(c not in "0123456789abcdef" for c in current_bank):
            raise ValueError("bank_commitment must be sha256 hexadecimal")
        if bank is None:
            bank = current_bank
        if current_bank != bank:
            raise ValueError("multiple banks cannot be pooled")
        if (task, arm) in seen:
            raise ValueError("duplicate task/arm")
        seen.add((task, arm))
        truth, votes = row["truth"], row["votes"]
        if truth not in ("0", "1") or not isinstance(votes, list) or len(votes) != N_VOTERS:
            raise ValueError("truth must be 0 or 1; exactly 12 votes required")
        ids = set()
        for vote in votes:
            if not isinstance(vote, dict) or set(vote) != {"agent_id", "answer"}:
                raise ValueError("vote schema invalid")
            agent, answer = vote["agent_id"], vote["answer"]
            if not isinstance(agent, str) or not agent or agent in ids or answer not in ("0", "1"):
                raise ValueError("duplicate agent or invalid answer")
            ids.add(agent)
        by_task[task][arm] = row
    if len(by_task) < min_tasks:
        raise ValueError("insufficient unique paired tasks; minimum 30")
    for task, arms in by_task.items():
        if set(arms) != set(ARMS):
            raise ValueError(f"incomplete paired arms for task {task}")
        if len({r["truth"] for r in arms.values()}) != 1:
            raise ValueError("ground truth differs between paired arms")
        rosters = {tuple(sorted(v["agent_id"] for v in r["votes"])) for r in arms.values()}
        if len(rosters) != 1:
            raise ValueError("voter roster differs between paired arms")
    return by_task, bank


def decision(row):
    ones = sum(v["answer"] == "1" for v in row["votes"])
    return None if ones == 6 else ("1" if ones > 6 else "0")


def correlation(x, y):
    n = len(x)
    mx, my = sum(x)/n, sum(y)/n
    vx = sum((z-mx)**2 for z in x)
    vy = sum((z-my)**2 for z in y)
    if vx == 0 or vy == 0:
        return None
    return sum((a-mx)*(b-my) for a, b in zip(x, y))/math.sqrt(vx*vy)


def bootstrap_effects(scores, samples=1000, seed=20261122):
    """Paired per-task percentile bootstrap; no independent-vote fiction."""
    if samples < 40:
        raise ValueError("at least 40 bootstrap samples required")
    rng = random.Random(seed)
    n = len(scores)
    effects = {
        "answer_exposure": lambda s: ((s[2]+s[3])-(s[0]+s[1]))/2,
        "objective_disclosure": lambda s: ((s[1]+s[3])-(s[0]+s[2]))/2,
        "interaction": lambda s: s[3]-s[2]-s[1]+s[0],
    }
    result = {}
    for name, fx in effects.items():
        estimate = sum(fx(s) for s in scores)/n
        estimates = sorted(sum(fx(scores[rng.randrange(n)]) for _ in range(n))/n for _ in range(samples))
        result[name] = {"estimate": round(estimate, 5),
                        "ci95": [round(estimates[int(.025*samples)], 5),
                                 round(estimates[int(.975*samples)-1], 5)]}
    return result


def analyse(rows, *, origin="unverified_input", bootstrap=1000):
    tasks, bank = validate(rows)
    names = sorted(tasks)
    result = {}
    for arm in ARMS:
        current = [tasks[t][arm] for t in names]
        votes = [[int(v["answer"] == r["truth"]) for v in sorted(r["votes"], key=lambda v: v["agent_id"])] for r in current]
        decisions = [decision(r) for r in current]
        n = len(current)
        ties = sum(v is None for v in decisions)
        pair_corr = [correlation([v[i] for v in votes], [v[j] for v in votes])
                     for i in range(12) for j in range(i+1, 12)]
        valid_corr = [v for v in pair_corr if v is not None]
        rho = sum(valid_corr)/len(valid_corr) if valid_corr else None
        # Negative tiny estimates can occur from sampling noise. Cap the
        # variance-equivalent effective sample size at the actual 12 voters.
        effective = min(12.0, 12/(1+11*rho)) if rho is not None and (1+11*rho)>0 else None
        result[arm] = {
            "n_tasks": n, "tie_abstentions": ties,
            "council_accuracy_all_tasks": round(sum(d is not None and d == r["truth"] for d, r in zip(decisions,current))/n,5),
            "council_coverage": round((n-ties)/n,5),
            "individual_accuracy_mean": round(sum(map(sum, votes))/(12*n),5),
            "observed_mean_pairwise_correctness_correlation": round(rho,5) if rho is not None else None,
            "effective_voters_variance_approx": round(effective,3) if effective is not None else None,
        }
    paired = [[int((d := decision(tasks[t][a])) is not None and d == tasks[t][a]["truth"]) for a in ARMS]
              for t in names]
    return {
        "schema": SCHEMA,
        "experiment_type": "CLASSICAL_AGGREGATION_INFORMATION_INTERVENTION",
        "evidence_state": "SYNTHETIC" if origin == "synthetic" else "UNVERIFIED_OFFLINE_GRADING",
        "not_quantum": True, "not_bft_consensus": True,
        "independent_referee_established": False,
        "bank_commitment": bank, "n_unique_paired_tasks": len(names),
        "voters_per_task": 12, "referee": "deterministic_local_truth_comparison",
        "by_arm": result, "effects": bootstrap_effects(paired, bootstrap),
        "does_not_establish": [
            "External model behaviour when synthetic",
            "Independent verifier or production authority",
            "Benchmark validity or clean training data",
            "Causal attribution without controlled randomisation and independent held-out items",
        ],
    }


def simulate(n_tasks=2000, rho=0.0, seed=20261122):
    """Beta-binomial correlated-voter synthetic fixture. Not a model call."""
    if n_tasks < 30 or not (0 <= rho < 1):
        raise ValueError("n_tasks >= 30 and 0 <= rho < 1")
    rng = random.Random(seed)
    bank = hashlib.sha256(f"SYNTHETIC-ONLY-v1:{seed}".encode()).hexdigest()
    rows = []
    for i in range(n_tasks):
        truth = str(rng.randrange(2))
        if rho:
            concentration = 1/rho - 1
            latent = rng.betavariate(.66*concentration, (1-.66)*concentration)
        else:
            latent = .66
        uniforms = [rng.random() for _ in range(12)]
        for arm in ARMS:
            # Hypothetical and disclosed generative parameters, NOT measured AI effects.
            prob = max(0., min(1., latent + (.10 if arm.startswith("answer") else 0)
                               + (.03 if arm.endswith("objective") else 0)))
            votes = [{"agent_id": f"agent-{k:02d}",
                      "answer": truth if u < prob else str(1-int(truth))}
                     for k, u in enumerate(uniforms)]
            rows.append({"task_id": f"synthetic-{i:05d}", "arm": arm,
                         "bank_commitment": bank, "truth": truth, "votes": votes})
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="PRIVATE grader-side JSONL; do not publish")
    parser.add_argument("--tasks", type=int, default=2000)
    parser.add_argument("--rho", type=float, default=0.)
    parser.add_argument("--seed", type=int, default=20261122)
    parser.add_argument("--bootstrap", type=int, default=1000)
    args = parser.parse_args()
    if args.input:
        rows = [json.loads(line) for line in args.input.read_text().splitlines() if line.strip()]
        report = analyse(rows, bootstrap=args.bootstrap)
    else:
        report = analyse(simulate(args.tasks, args.rho, args.seed), origin="synthetic",
                         bootstrap=args.bootstrap)
        report["simulation_parameters"] = {
            "seed": args.seed, "rho": args.rho, "single_voter_baseline_p": .66,
            "hypothetical_answer_exposure_gain": .10,
            "hypothetical_objective_disclosure_gain": .03,
        }
    report["receipt_sha256"] = digest(report)
    print(json.dumps(report, sort_keys=True, indent=2))


if __name__ == "__main__":
    main()
