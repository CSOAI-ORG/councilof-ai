"""Recreate fresh MEOK synthetic episodes from immutable source pins."""
from pathlib import Path
from urllib.request import urlopen
import hashlib,json,random,sys
ROOT=Path(__file__).resolve().parent
PIN="4070aa6d3140ba10226677840f4873fbedd2467e"
FILES={
"packages/world-rehearsal/rehearsal/__init__.py":"9c08276349fae33dffae1c319b972c2929b0dbc1de2257556c87554f8df0d72f",
"packages/world-rehearsal/rehearsal/engine.py":"e2d7c0a12a3b395ed2d181d5567cfcad8b14c86df115e671550e55f1bd1b4c80",
"packages/world-rehearsal/rehearsal/dependencies.py":"2d008254db99f2169c232f610c111cd3b5d2d77e7a486b09c654c331de93bf90",
"packages/world-rehearsal/third_party/earth_scale/tempo.py":"ccf24d96ee7c38c7edfeb7d40a7b8a7b703280081b513d489ec24555e02d957b",
"packages/world-rehearsal/third_party/swarmchat/__init__.py":"1a6f05e5dd1a6593d6bcf9d12bf7cd16ebf20bbd988c22b66b9e971b156db369",
"packages/evidence-fabric/event.py":"144c6a36d462e21283ab9b34a6469bb32c75021da56133813d5a848412270533",
"packages/world-rehearsal/LICENSE":"d1c9de1ba9d7b4cdb5b2ba02270b92522a40be9a947864a2bb4311bc93f58fa9",
"packages/world-rehearsal/NOTICE":"7ec2552f23361fab1fd70d4039b3aad852ff3c19bebc058e1ab3777d9d6536a9",
}
for rel,want in FILES.items():
    url=f"https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/{PIN}/{rel}"
    with urlopen(url,timeout=30) as response:data=response.read(300001)
    got=hashlib.sha256(data).hexdigest()
    if got!=want:raise RuntimeError(f"SOURCE_HASH_MISMATCH {rel}: {got}")
    path=ROOT/"source"/rel;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
(ROOT/"source-lock.json").write_text(json.dumps({"repository":"CSOAI-ORG/councilof-ai","revision":PIN,"files_sha256":FILES},indent=2)+"\n")
sys.path.insert(0,str(ROOT/"source/packages/world-rehearsal"))
from rehearsal.engine import simulate
rows=[]
for i in range(320):
    episode=1000+i
    split="train" if i<200 else "validation" if i<250 else "test"
    rng=random.Random(980000+episode)
    cfg={"seed":100000+episode,"population":rng.randrange(16,97),"rounds":8,
         "intervention":"evidence-aware" if episode%2 else "baseline",
         "revocation_tick":rng.randrange(0,10),"permit_expires_tick":rng.randrange(0,10)}
    sim=simulate(cfg);n=cfg["population"];counts=[0,0,0]
    for node in sim["sampled_nodes"]:counts[node["profile"]]+=1
    if len(sim["sampled_nodes"])!=n:raise RuntimeError("PROFILE_SAMPLE_NOT_COMPLETE")
    profiles=[v/n for v in counts]
    previous=[0.,0.,0.,1.];previous2=previous[:]
    for frame in sim["frames"]:
        tick=frame["tick"]
        revoked=float(tick>=cfg["revocation_tick"])
        expiry=(cfg["permit_expires_tick"]-tick)/8
        aware=float(cfg["intervention"]=="evidence-aware")
        partial=previous+previous2+[revoked,expiry,aware,tick/8]
        privileged=previous+profiles+[revoked,expiry,aware,tick/8]
        target=[v/n for v in frame["counts"]]+[frame["undecided"]/n]
        rows.append({"episode":episode,"split":split,"tick":tick,"features":partial,
                     "privileged_features":privileged,"target":target,
                     "source_scenario_id":sim["scenario_id"]})
        previous2,previous=previous,target
data="".join(json.dumps(x,sort_keys=True,separators=(",",":"))+"\n" for x in rows).encode()
digest=hashlib.sha256(data).hexdigest()
expected="9621dada0461be5eb2142207178659b84ccec78a1ed865218738a2488b897982"
if digest!=expected:raise RuntimeError(f"FRESH_EPISODE_REPRODUCIBILITY_MISMATCH {digest}")
(ROOT/"episodes-internal.jsonl").write_bytes(data)
print(json.dumps({"state":"FRESH_EPISODES_REPRODUCED","episodes":320,"rows":len(rows),
"episode_ids":[1000,1319],"split_rows":{"train":1600,"validation":400,"test":560},
"internal_sha256":digest,"source_files_verified":len(FILES),
"public_v1_dataset_excludes_privileged_features":True},separators=(",",":")),flush=True)