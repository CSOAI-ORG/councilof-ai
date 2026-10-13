#!/usr/bin/env python3
"""Read-only OOWM -> RAS/SovSpace reaction bridge.

Joins current OOWM routing to the synthetic reaction/DREAM layer.
No signing, settlement, GSPC admission or external execution occurs here.
"""
from __future__ import annotations

import hashlib
import json
import os
import urllib.request
from typing import Any

OOWM_URL=os.environ.get("OOWM_URL","http://127.0.0.1:19000")
RAS_URL=os.environ.get("RAS_URL","http://127.0.0.1:18788")

def _post(base: str, path: str, body: dict[str, Any]) -> dict[str, Any]:
    req=urllib.request.Request(base+path,data=json.dumps(body).encode(),
        headers={"Content-Type":"application/json"})
    return json.loads(urllib.request.urlopen(req,timeout=8).read().decode())

def _id(value: Any) -> str:
    return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(",",":")).encode()).hexdigest()

def reaction_cycle(question: str, event: dict[str, Any], dependents: list[str]) -> dict[str, Any]:
    route=_post(OOWM_URL,"/oowm/chat",{"question":question})
    simulation=_post(RAS_URL,"/simulate",{"event":event,"dependents":dependents})
    dream=_post(RAS_URL,"/evolve/dream",{"event":event,"dependents":dependents})
    out={
        "schema":"csoai.oowm-ras-reaction-cycle/0.1",
        "oowm_route":route,
        "sovspace_dependents":sorted(set(dependents)),
        "reaction_simulation":simulation,
        "dream":dream,
        "execution_authority":False,
        "measurement_authority":False,
        "promotion_authority":False,
        "next":"bind later real observations -> calibrate -> proposal -> Harness X -> GSPC",
    }
    out["content_id"]=_id(out)
    return out

def propose(source: str, target: str, rationale: str, evidence_ids: list[str]) -> dict[str, Any]:
    return _post(RAS_URL,"/evolve/propose",{
        "source":source,"target":target,"rationale":rationale,"evidence_ids":evidence_ids})

if __name__=="__main__":
    import sys
    if len(sys.argv)>1 and sys.argv[1]=="selftest":
        out=reaction_cycle(
            "effect binding provenance custody disclosure",
            {"event_id":"selftest-source-change","observed_facts":["public source changed"]},
            ["claim:source-integrity","claim:delivery-binding"],
        )
        print(json.dumps({
            "schema":out["schema"],
            "matched_axes":out["oowm_route"].get("matched_axes"),
            "branches":out["reaction_simulation"].get("branch_count"),
            "dream_mode":out["dream"].get("mode"),
            "execution_authority":out["execution_authority"],
            "content_id":out["content_id"],
        },indent=2))
    else:
        print("usage: oowm_ras_bridge.py selftest")
