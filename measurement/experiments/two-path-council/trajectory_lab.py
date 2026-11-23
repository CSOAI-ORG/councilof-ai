#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Synthetic MEOK trajectory-control experiment: sequential, correlated faults,
detection and rollback. NOT live intervention, Newtonian mechanics or model eval.

Assume per-step success q, path length L. Independent clean success is q**L.
A simulated error may be independently detected and then recovered; this only
reduces an escaped-error metric, it does NOT retroactively make the attempt clean.
A beta-distributed session success rate introduces shared condition correlation.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import random

SCHEMA = "csoai.meok-trajectory-control-research/0.1"


def wilson(k, n, z=1.95996398454):
    if n <= 0 or not 0 <= k <= n:
        raise ValueError("invalid n / number of successes")
    p = k / n
    c = 1 + z*z/n
    mid = (p + z*z/(2*n))/c
    half = z*math.sqrt((p*(1-p)+z*z/(4*n))/n)/c
    return [round(max(0, mid-half), 5), round(min(1, mid+half), 5)]


def run(*, n=10000, q=0.97, rho=0.2, detect=0.8, recover=0.95,
        lengths=(1,2,4,8,16,32), seed=20261122):
    if n < 30 or not (0 < q < 1) or not (0 <= rho < 1):
        raise ValueError("minimum 30 trajectories, q in (0,1), rho in [0,1)")
    if not (0 <= detect <= 1 and 0 <= recover <= 1):
        raise ValueError("invalid detect/recover probabilities")
    if not lengths or any(not isinstance(l, int) or l < 1 for l in lengths):
        raise ValueError("lengths must be positive integers")
    if len(set(lengths)) != len(lengths):
        raise ValueError("duplicate trajectory lengths")
    rng = random.Random(seed)
    summaries = []
    for l in lengths:
        for mode in ("independent", "shared_session"):
            clean = safe = caught_recovered = any_fail = 0
            escaped_total = 0
            fault_hist = {str(i):0 for i in range(l+1)}
            for _ in range(n):
                if mode == "shared_session" and rho:
                    concentration = 1/rho-1
                    p_session = rng.betavariate(q*concentration, (1-q)*concentration)
                else:
                    p_session = q
                failed = escaped = 0
                caught = 0
                for _ in range(l):
                    if rng.random() >= p_session:
                        failed += 1
                        if rng.random() < detect and rng.random() < recover:
                            caught += 1
                        else:
                            escaped += 1
                fault_hist[str(failed)] += 1
                clean += int(failed == 0)
                safe += int(escaped == 0)
                caught_recovered += caught
                escaped_total += escaped
                any_fail += int(failed > 0)
            expected = q**l if mode == "independent" else None
            expected_safe = (q+(1-q)*detect*recover)**l if mode == "independent" else None
            summaries.append({
                "mode": mode, "length":l, "n_trajectories":n,
                "clean_first_pass":round(clean/n,5),
                "clean_first_pass_ci95_wilson":wilson(clean,n),
                "no_escaped_faults":round(safe/n,5),
                "no_escaped_faults_ci95_wilson":wilson(safe,n),
                "at_least_one_fault":round(any_fail/n,5),
                "tail_three_or_more_faults":round(sum(v for k,v in fault_hist.items() if int(k)>=3)/n,5),
                "total_escaped_faults":escaped_total,
                "total_detected_and_recovered_faults":caught_recovered,
                "analytic_clean_independent":round(expected,5) if expected is not None else None,
                "analytic_no_escape_independent":round(expected_safe,5) if expected_safe is not None else None,
            })
    result = {
        "schema":SCHEMA, "evidence_state":"SYNTHETIC", "not_live_agent":True,
        "not_physics":True, "not_measured_model_fault_rate":True,
        "parameters":{"n":n, "q":q, "rho":rho, "detect":detect,
                      "recover":recover,"lengths":list(lengths),"seed":seed},
        "results":summaries,
        "limitations":[
            "Per-step success and detection probabilities are assumed, not observed",
            "A detected and rolled-back error is not first-pass success",
            "Recovery here means a simulated contained effect, not a real rollback receipt",
            "Session beta-mixture creates correlation but is not a validated agent error mechanism",
            "No deployment or authority change is performed",
        ],
    }
    result["receipt_sha256"]=hashlib.sha256(json.dumps(result,sort_keys=True,separators=(",",":")).encode()).hexdigest()
    return result


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--n",type=int,default=10000)
    p.add_argument("--q",type=float,default=.97)
    p.add_argument("--rho",type=float,default=.2)
    p.add_argument("--detect",type=float,default=.8)
    p.add_argument("--recover",type=float,default=.95)
    p.add_argument("--seed",type=int,default=20261122)
    a=p.parse_args()
    print(json.dumps(run(n=a.n,q=a.q,rho=a.rho,detect=a.detect,
                         recover=a.recover,seed=a.seed),indent=2,sort_keys=True))


if __name__=="__main__":
    main()
