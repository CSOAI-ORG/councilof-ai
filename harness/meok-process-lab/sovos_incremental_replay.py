#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Executable bounded research replay: compare full vs dependency-scoped
recomputation. No real models/tools, production mutation or authority."""
import hashlib,json,unittest
import sovos_care_lineage as lab

def compute(node,parents,source_payload):
    return lab.digest({"node_revision":node["digest"],"ordered_parent_outputs":parents,
                       "source_payload":source_payload if not node["parents"] else None})

def replay(nodes,payloads,previous=None,changed=None):
    if previous is None:
        previous={}; affected=set(nodes)
    else:
        affected=lab.descendants(nodes,changed)
        if set(previous)!=set(nodes):raise ValueError("incomplete cache")
    outputs=dict(previous);recomputed=0
    for i in sorted(nodes):
        node=nodes[i]
        if i not in affected:continue
        outputs[i]=compute(node,[outputs[p] for p in node["parents"]],payloads.get(i))
        recomputed+=1
    return outputs,recomputed

def run():
    total=0;partial=0;case_count=0
    for seed in range(lab.SEED,lab.SEED+1000):
        nodes=lab.graph(seed)
        manifest={i:n["digest"] for i,n in nodes.items()}
        assert lab.validate(nodes,manifest)
        payloads={i:"source-"+str(i) for i in range(30)}
        old,_=replay(nodes,payloads)
        root=seed%30;new_payloads=dict(payloads);new_payloads[root]+="-revised"
        full,nfull=replay(nodes,new_payloads)
        inc,ninc=replay(nodes,new_payloads,old,{root})
        assert full==inc
        assert {i for i in nodes if full[i]!=old[i]}==lab.descendants(nodes,[root])
        assert old!=full
        total+=nfull;partial+=ninc;case_count+=1
    return {"cases":case_count,"full_node_recomputations":total,
            "scoped_node_recomputations":partial,"equivalent_results":case_count,
            "avoided_recomputations":total-partial}
class Controls(unittest.TestCase):
    def test_replay(self):
        r=run();self.assertEqual(r["equivalent_results"],1000)
        self.assertLess(r["scoped_node_recomputations"],r["full_node_recomputations"])
    def test_unknown_cache(self):
        n=lab.graph(lab.SEED)
        with self.assertRaises(ValueError):replay(n,{}, {},{0})
    def test_multiple_changes(self):
        n=lab.graph(lab.SEED);old,_=replay(n,{0:"a",1:"b"})
        x,_=replay(n,{0:"c",1:"d"},old,{0,1})
        y,_=replay(n,{0:"c",1:"d"})
        self.assertEqual(x,y)
if __name__=="__main__":
    t=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(Controls))
    if not t.wasSuccessful():raise SystemExit(1)
    print("REPLAY_RESULT "+json.dumps({"state":"SYNTHETIC_INCREMENTAL_REPLAY","tests":t.testsRun,
        "authorises_execution":False,"new_gspc_measurement":False,**run()},sort_keys=True))
