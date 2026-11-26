#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Engine-council research: quorum intersection and common-mode errors.
No consensus protocol, signatures, real execution, or GSPC admission."""
import hashlib,itertools,json,random,unittest

SEED=261125
N=20000
ROLES=("source","authority","effect_preflight")

def quorum(n,q,f):
    overlap=max(0,2*q-n)
    return {"replicas":n,"quorum":q,"fault_bound":f,"minimum_intersection":overlap,
            "honest_intersection_if_bound_holds":overlap>f,
            "quorum_possible_with_f_unavailable":q<=n-f}

def exhaustive(n,q):
    subsets=list(itertools.combinations(range(n),q))
    return min(len(set(a)&set(b)) for a in subsets for b in subsets)

def simulate():
    rows=[]
    for common in (0,.1,.5,1):
        rng=random.Random(SEED)
        counts={p:dict(unsafe=0,safe=0,holds=0) for p in
                ("one_engine","three_majority","twelve_majority","three_hive_majority","three_locks","three_locks_redundant")}
        unsafe_total=0
        for _ in range(N):
            # Truth has three independent requirements. Artificial faults only.
            truth=[rng.random()>=.15 for _ in ROLES]
            valid=all(truth);unsafe_total+=not valid
            # A shared erroneous specification or source can affect all engines.
            shared=rng.random()<common
            common_flip=[rng.random()<.10 for _ in ROLES]
            individual=[[rng.random()<.10 for _ in ROLES] for _ in range(12)]
            observed=[[None if rng.random()<.03 else v^(common_flip[j] if shared else individual[i][j])
                       for j,v in enumerate(truth)] for i in range(12)]
            proposals=[all(x is True for x in r) for r in observed]
            # Separate roles: one per lock vs a 3-member check per lock.
            checks=[observed[i][i] is True for i in range(3)]
            replicated=[sum(observed[i*3+j][i] is True for j in range(3))>=2 for i in range(3)]
            hives=[sum(proposals[i:i+4])>=3 for i in (0,4,8)]
            decisions={"one_engine":proposals[0],"three_majority":sum(proposals[:3])>=2,
                       "twelve_majority":sum(proposals)>=7,"three_hive_majority":sum(hives)>=2,
                       "three_locks":all(checks),"three_locks_redundant":all(replicated)}
            for k,v in decisions.items():
                counts[k]["unsafe"]+=v and not valid
                counts[k]["safe"]+=v and valid
                counts[k]["holds"]+=not v
        rows.append({"shared_fault_mixture":common,"tasks":N,"unsafe_tasks":unsafe_total,"safe_tasks":N-unsafe_total,"policies":counts})
    return rows

def check_receipts(receipts,expected):
    # This validates structural bindings, not signatures or truth. Real
    # authority remains external; a positive result is NOT execution permission.
    if len(receipts)!=3 or {r.get("role") for r in receipts}!=set(ROLES):
        return "HOLD"
    if len({r.get("source_lineage") for r in receipts})!=3:return "HOLD"
    for r in receipts:
        if r.get("state")!="PASS" or not r.get("source_lineage"):return "HOLD"
        if any(r.get(k)!=v for k,v in expected.items()):return "HOLD"
    return "STRUCTURALLY_COMPLETE_NOT_AUTHORIZED"

class Controls(unittest.TestCase):
    def setUp(self):
        self.expected={"task":"fixture-a","revision":"r1","epoch":8,"effect":"bounded-simulation"}
        self.receipts=[dict(self.expected,role=role,state="PASS",source_lineage="fixture-"+role) for role in ROLES]
    def test_complete_not_authorized(self):
        self.assertEqual(check_receipts(self.receipts,self.expected),"STRUCTURALLY_COMPLETE_NOT_AUTHORIZED")
    def test_duplicate(self):
        self.receipts[1]["source_lineage"]=self.receipts[0]["source_lineage"]
        self.assertEqual(check_receipts(self.receipts,self.expected),"HOLD")
    def test_missing(self):
        self.assertEqual(check_receipts(self.receipts[:2],self.expected),"HOLD")
    def test_stale(self):
        self.receipts[1]["epoch"]=7
        self.assertEqual(check_receipts(self.receipts,self.expected),"HOLD")
    def test_effect_mismatch(self):
        self.receipts[2]["effect"]="other"
        self.assertEqual(check_receipts(self.receipts,self.expected),"HOLD")
    def test_unknown(self):
        self.receipts[0]["state"]="UNKNOWN"
        self.assertEqual(check_receipts(self.receipts,self.expected),"HOLD")
    def test_quorum(self):
        for n,q,f in ((3,2,1),(4,3,1),(7,5,2),(10,7,3)):
            self.assertEqual(quorum(n,q,f)["minimum_intersection"],exhaustive(n,q))
        self.assertFalse(quorum(3,2,1)["honest_intersection_if_bound_holds"])
        self.assertTrue(quorum(4,3,1)["honest_intersection_if_bound_holds"])
    def test_accounting(self):
        for r in simulate():
            for p in r["policies"].values():
                self.assertEqual(sum(p.values()),r["tasks"])

if __name__=="__main__":
    result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(Controls))
    if not result.wasSuccessful():raise SystemExit(1)
    out={"state":"SYNTHETIC_ENGINE_COUNCIL_RESEARCH","seed":SEED,"new_gspc_measurement":False,
         "bft_demonstrated":False,"authorises_execution":False,"tests":result.testsRun,
         "quorums":[quorum(n,q,f) for n,q,f in ((3,2,1),(4,3,1),(7,5,2),(10,7,3),(12,9,3),(33,23,10))],
         "simulations":simulate()}
    print("ENGINE_RESULT "+json.dumps(out,sort_keys=True))
