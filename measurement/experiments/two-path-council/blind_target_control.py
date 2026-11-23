#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Blind-target information access control for research, not a psychic/consciousness detector.

A target custodian makes salted commitments to random 4-way targets. A separate
participant sees only public opaque IDs and A/B/C/D, submits a frozen prediction,
and a grader later checks commitments + exact one-sided binomial tail.
The negative-control demo makes pseudorandom guesses without reading targets.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
import secrets

SCHEMA="csoai.blind-target-control/0.1"
CHOICES=("A","B","C","D")


def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()

def sha(obj):
    return hashlib.sha256(canonical(obj)).hexdigest()

def target_commitment(trial_id, target, salt):
    return hashlib.sha256(f"csoai-blind-target/0.1|{trial_id}|{target}|{salt}".encode()).hexdigest()

def prepare(n=256, *, seed=None):
    if not isinstance(n,int) or not 30 <= n <= 10000:
        raise ValueError("30 to 10000 trials required")
    synthetic = seed is not None
    rng=random.Random(seed) if synthetic else None
    public,private=[],[]
    for i in range(n):
        trial_id=f"t{i:06d}"
        target = (rng.choice(CHOICES) if rng else secrets.choice(CHOICES))
        salt = (f"{rng.getrandbits(256):064x}" if rng else secrets.token_hex(32))
        commitment=target_commitment(trial_id,target,salt)
        public.append({"trial_id":trial_id,"commitment":commitment})
        private.append({"trial_id":trial_id,"target":target,"salt":salt})
    challenge={"schema":SCHEMA,"state":"SYNTHETIC" if synthetic else "UNVERIFIED_CUSTODY",
               "choice_labels":list(CHOICES),"chance_p":.25,"trials":public,
               "not_proof_of":"consciousness, extrasensory perception or independent custody"}
    challenge["challenge_sha256"]=sha(challenge)
    secret={"schema":SCHEMA,"challenge_sha256":challenge["challenge_sha256"],"trials":private}
    return challenge,secret


def demo_guesses(challenge, *, seed=888):
    # This function reads ONLY the public challenge; cannot see any hidden target.
    rng=random.Random(seed)
    return [{"trial_id":row["trial_id"],"guess":rng.choice(CHOICES)}
            for row in challenge["trials"]]


def binomial_upper_tail(k,n,p=.25):
    """Exact one-sided fixed-n tail for H0: independent chance p."""
    if not 0 <= k <= n or n < 1 or not 0 < p < 1:
        raise ValueError("invalid binomial arguments")
    if k == 0:
        return 1.0
    terms=[math.lgamma(n+1)-math.lgamma(j+1)-math.lgamma(n-j+1)
           +j*math.log(p)+(n-j)*math.log1p(-p) for j in range(k,n+1)]
    mx=max(terms)
    return min(1.0,math.exp(mx)*sum(math.exp(x-mx) for x in terms))


def evaluate(challenge,secret,predictions):
    if not isinstance(challenge,dict) or challenge.get("schema")!=SCHEMA:
        raise ValueError("wrong challenge schema")
    signature=challenge.get("challenge_sha256")
    unsigned={k:v for k,v in challenge.items() if k!="challenge_sha256"}
    if signature!=sha(unsigned) or secret.get("challenge_sha256")!=signature:
        raise ValueError("challenge or custody digest mismatch")
    public=challenge.get("trials")
    hidden=secret.get("trials")
    if not isinstance(public,list) or not isinstance(hidden,list) or not isinstance(predictions,list):
        raise ValueError("trial or prediction lists missing")
    if len(public)<30 or len(public)!=len(hidden) or len(public)!=len(predictions):
        raise ValueError("missing trials or predictions")
    index={}
    for row in public:
        if not isinstance(row,dict) or set(row)!={"trial_id","commitment"}:
            raise ValueError("public row invalid")
        if row["trial_id"] in index or not isinstance(row["trial_id"],str):
            raise ValueError("duplicate public trial ID")
        index[row["trial_id"]]=row["commitment"]
    targets={}
    for row in hidden:
        if not isinstance(row,dict) or set(row)!={"trial_id","target","salt"}:
            raise ValueError("hidden row invalid")
        tid=row["trial_id"]
        if tid not in index or tid in targets or row["target"] not in CHOICES:
            raise ValueError("hidden target invalid or repeated")
        if not isinstance(row["salt"],str) or len(row["salt"])!=64:
            raise ValueError("secret salt invalid")
        if target_commitment(tid,row["target"],row["salt"])!=index[tid]:
            raise ValueError("target commitment mismatch")
        targets[tid]=row["target"]
    if set(targets)!=set(index):
        raise ValueError("target IDs differ")
    guesses={}
    for row in predictions:
        if not isinstance(row,dict) or set(row)!={"trial_id","guess"}:
            raise ValueError("prediction row invalid")
        tid=row["trial_id"]
        if tid not in index or tid in guesses or row["guess"] not in CHOICES:
            raise ValueError("prediction missing/duplicate/invalid")
        guesses[tid]=row["guess"]
    if set(guesses)!=set(index):
        raise ValueError("prediction ID mismatch")
    n=len(index)
    correct=sum(targets[t]==guesses[t] for t in index)
    report={
       "schema":SCHEMA,"state":"SYNTHETIC" if challenge["state"]=="SYNTHETIC" else "UNVERIFIED_CUSTODY",
       "n_trials":n,"choices":4,"n_correct":correct,"accuracy":round(correct/n,6),
       "chance_accuracy":.25,"one_sided_binomial_p":round(binomial_upper_tail(correct,n),10),
       "challenge_sha256":signature,"predictions_sha256":sha(predictions),
       "randomisation":"deterministic synthetic PRNG" if challenge["state"]=="SYNTHETIC" else "OS CSPRNG in same-owner generator",
       "evidence_limitations":[
          "The same owner can access target and prediction; independent target custody and timestamp ordering NOT established",
          "A low p value alone cannot exclude sensory/network leakage, scoring error, multiple testing or selection bias",
          "Above-chance performance would not establish consciousness or a paranormal mechanism",
          "No real model, human participant or paranormal ability is tested in the synthetic control",
       ]
    }
    report["receipt_sha256"]=sha(report)
    return report


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--demo",action="store_true",help="synthetic chance-control only; no secret files")
    ap.add_argument("--n",type=int,default=512)
    ap.add_argument("--seed",type=int,default=20261122)
    args=ap.parse_args()
    if not args.demo:
        ap.error("Only --demo is exposed; real sealed trials require separate registered custodian and harness")
    public,secret=prepare(args.n,seed=args.seed)
    guesses=demo_guesses(public,seed=args.seed+1)
    print(json.dumps(evaluate(public,secret,guesses),indent=2,sort_keys=True))


if __name__=="__main__":
    main()
