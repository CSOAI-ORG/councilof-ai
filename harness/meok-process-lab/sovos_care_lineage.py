#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Synthetic dependency containment and Care gate ablation.
No production state, real harms, real authority, GSPC admission or signing."""
import collections,hashlib,json,random,unittest

SEED=251126
N=150
TRIALS=1000

def digest(obj):
    # Research fixture only, not the existing canonical evidence-event ID.
    return hashlib.sha256(json.dumps(obj,sort_keys=True,separators=(",",":")).encode()).hexdigest()

def graph(seed):
    r=random.Random(seed);nodes={}
    # 30 source objects, then chunks, datasets, adapters, outputs in layers.
    for i in range(N):
        layer=i//30
        parents=[] if not layer else sorted(r.sample(range((layer-1)*30,layer*30),r.randint(1,3)))
        body={"id":i,"layer":layer,"parents":parents,"revision":1}
        nodes[i]={**body,"digest":digest(body)}
    return nodes

def descendants(nodes,roots):
    inverse=collections.defaultdict(list)
    for i,n in nodes.items():
        for p in n["parents"]:inverse[p].append(i)
    found=set(roots);queue=collections.deque(roots)
    while queue:
        for c in inverse[queue.popleft()]:
            if c not in found:found.add(c);queue.append(c)
    return found

def validate(nodes,manifest):
    # A pinned independent manifest is an assumption of the fixture. A hash
    # cannot establish that the producer disclosed all its actual dependencies.
    if set(nodes)!=set(manifest):return False
    for i,n in nodes.items():
        body={k:v for k,v in n.items() if k!="digest"}
        if n["id"]!=i or digest(body)!=n["digest"] or n["digest"]!=manifest[i]:return False
        if any(p not in nodes or p>=i for p in n["parents"]):return False
    return True

def lineage():
    out={p:dict(affected_released=0,unaffected_held=0,affected_held=0) for p in
         ("no_invalidation","root_only","direct_children","transitive","global","incomplete_naive","incomplete_fail_closed")}
    count=0;affected=0
    for seed in range(SEED,SEED+TRIALS):
        nodes=graph(seed);root=seed%30;true=descendants(nodes,[root]);affected+=len(true);count+=len(nodes)
        manifest={i:n["digest"] for i,n in nodes.items()}
        assert validate(nodes,manifest)
        altered={i:dict(n) for i,n in nodes.items()}
        # Drop an edge that actually links the changed source to a child.
        children=[i for i,n in nodes.items() if root in n["parents"]]
        if children:
            c=children[0];n=altered[c];n["parents"]=[p for p in n["parents"] if p!=root]
            n["digest"]=digest({k:v for k,v in n.items() if k!="digest"})
        direct={root}|set(children)
        policies={"no_invalidation":set(),"root_only":{root},"direct_children":direct,"transitive":true,
                  "global":set(nodes),"incomplete_naive":descendants(altered,[root]),
                  "incomplete_fail_closed":descendants(altered,[root]) if validate(altered,manifest) else set(nodes)}
        for name,held in policies.items():
            out[name]["affected_released"]+=len(true-held)
            out[name]["unaffected_held"]+=len(held-true)
            out[name]["affected_held"]+=len(held&true)
    return {"graphs":TRIALS,"nodes":count,"affected":affected,"policies":out}

def care():
    # Abstract independent fixture flags. Not a clinical CareBench or LLM test.
    # External oracle provides labels, enforcement observes fallible input/output flags.
    out={p:dict(harmful_allowed=0,benign_helped=0,harmful_total=0,benign_total=0) for p in
         ("none","input_only","output_only","both","blanket_hold","both_plus_authority")}
    r=random.Random(SEED)
    for _ in range(20000):
        bad_input=r.random()<.15;bad_output=r.random()<.15;bad_authority=r.random()<.12
        harm=bad_input or bad_output or bad_authority
        input_alarm=bad_input^(r.random()<.05)
        output_alarm=bad_output^(r.random()<.05)
        # Known authority failure is an exact synthetic flag, not actual authentication.
        allow={"none":True,"input_only":not input_alarm,"output_only":not output_alarm,
               "both":not(input_alarm or output_alarm),"blanket_hold":False,
               "both_plus_authority":not(input_alarm or output_alarm or bad_authority)}
        for name,a in allow.items():
            c=out[name];c["harmful_total"]+=harm;c["benign_total"]+=not harm
            c["harmful_allowed"]+=a and harm;c["benign_helped"]+=a and not harm
    for c in out.values():
        c["protect"]=1-c["harmful_allowed"]/c["harmful_total"]
        c["help"]=c["benign_helped"]/c["benign_total"]
        c["protect_x_help"]=c["protect"]*c["help"]
    return out

class Controls(unittest.TestCase):
    def test_chain(self):
        n={0:{"parents":[]},1:{"parents":[0]},2:{"parents":[1]},3:{"parents":[]}}
        self.assertEqual(descendants(n,[0]),{0,1,2})
    def test_manifest_mutation(self):
        n=graph(SEED);m={i:x["digest"] for i,x in n.items()}
        n[0]["revision"]=2
        self.assertFalse(validate(n,m))
    def test_missing(self):
        n=graph(SEED);m={i:x["digest"] for i,x in n.items()};del n[0]
        self.assertFalse(validate(n,m))
    def test_edge_rewritten(self):
        n=graph(SEED);m={i:x["digest"] for i,x in n.items()}
        n[30]["parents"]=[];n[30]["digest"]=digest({k:v for k,v in n[30].items() if k!="digest"})
        self.assertFalse(validate(n,m))
    def test_lineage_boundaries(self):
        p=lineage()["policies"]
        self.assertEqual(p["transitive"]["affected_released"],0)
        self.assertEqual(p["transitive"]["unaffected_held"],0)
        self.assertEqual(p["incomplete_fail_closed"]["affected_released"],0)
        self.assertGreater(p["incomplete_naive"]["affected_released"],0)
    def test_care_no_authority(self):
        p=care()
        self.assertEqual(p["blanket_hold"]["help"],0)
        self.assertEqual(p["none"]["protect"],0)
        self.assertLessEqual(p["both_plus_authority"]["harmful_allowed"],p["both"]["harmful_allowed"])
        self.assertGreater(p["both_plus_authority"]["harmful_allowed"],0)

if __name__=="__main__":
    test=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(Controls))
    if not test.wasSuccessful():raise SystemExit(1)
    out={"state":"SYNTHETIC_LINEAGE_CARE_RESEARCH","tests":test.testsRun,"seed":SEED,
         "new_gspc_measurement":False,"authorises_execution":False,"signatures_verified":False,
         "lineage":lineage(),"care":care()}
    print("CARE_LINEAGE_RESULT "+json.dumps(out,sort_keys=True))
