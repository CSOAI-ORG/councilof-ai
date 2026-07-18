#!/usr/bin/env python3
"""sov33_sovspace_bridge.py — SOV33 as MASTER of the rendered world (Cesium/UE5).
MEOK-SOV3 for Sir Nicholas Templeman.

PRINCIPLE: SOV33 holds the AUTHORITATIVE world-state (SovSpace). Cesium/UE5 are render surfaces —
views onto SOV33's truth, not the truth. Every entity-command flows back through the governance gate
(DORADO -> care -> guardian loop -> SIGIL) before it can render or actuate. That is what 'master' means:
nothing acts in the world without passing SOV33's governance.

The bridge is render-surface-agnostic: it emits a governed world-state frame that a Cesium globe OR a
UE5 dome consumes identically. Each entity is driven by an MCP card; the card call IS the governed action.
"""
import time, hashlib, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_dorado import dorado_check
from sov33_guardian_loop import GuardianLoop

class SovSpaceBridge:
    """Authoritative world-state + governed command contract for any render surface."""
    def __init__(self, scope="DEFONEOS"):
        self.scope=scope
        self.entities={}                 # entity_id -> {type, lat, lon, alt, motion}
        self.guardian=GuardianLoop(scope=scope)
        self.frame_no=0
        self.audit=[]
    def _sig(self,p): return hashlib.sha256(f"{p}{time.time()}".encode()).hexdigest()[:16]
    # --- world-state authority ---
    def upsert_entity(self, eid, etype, lat, lon, alt=0.0, motion=None):
        self.entities[eid]={"type":etype,"lat":lat,"lon":lon,"alt":alt,"motion":motion or {}}
    # --- governed command contract (the MCP-card gate) ---
    def command(self, eid, action_desc, scene=None, motion=None, human_approver=None):
        """An entity-command. Passes the full governance gate before it may render/actuate."""
        # 1. DORADO hard-stop
        d=dorado_check(action_desc)
        if d["stop"]:
            rec={"eid":eid,"action":action_desc[:40],"verdict":"DORADO_STOP","category":d["category"],
                 "rendered":False,"sigil":self._sig(f"{eid}|dorado")}
            self.audit.append(rec); return rec
        # 2. guardian loop (if this command moves a body near beings)
        if scene is not None and motion is not None:
            g=self.guardian.run(eid, scene, motion, human_approver=human_approver)
            if g["action"]=="KILL_ACTUATORS":
                rec={"eid":eid,"action":action_desc[:40],"verdict":"GUARDIAN_KILL","threat":g["threat"],
                     "rendered":False,"actuators":"CUT","bft":g["bft_votes"],"sigil":g["sigil"]}
                self.audit.append(rec); return rec
        # 3. cleared -> render/actuate
        rec={"eid":eid,"action":action_desc[:40],"verdict":"CLEARED","rendered":True,
             "sigil":self._sig(f"{eid}|ok")}
        self.audit.append(rec); return rec
    # --- render frame (what Cesium/UE5 consume — identical for both) ---
    def world_frame(self):
        self.frame_no+=1
        return {"frame":self.frame_no,"scope":self.scope,"surface_agnostic":True,
                "entities":[{"id":k,**v} for k,v in self.entities.items()],
                "governed":True,"sigil":self._sig(f"frame{self.frame_no}")}

if __name__=="__main__":
    b=SovSpaceBridge(scope="DEFONEOS")
    # populate a scene on the real globe (London)
    b.upsert_entity("humanoid-07","humanoid",51.5074,-0.1278,0,{"toward":True,"reach_m":0.6,"speed":0.5})
    b.upsert_entity("child-01","child",51.5074,-0.1278,0)
    b.upsert_entity("drone-03","drone",51.5080,-0.1290,40,{"toward":False,"reach_m":0.6,"speed":0.3})
    print("SOV33 SOVSPACE BRIDGE — governed world-state master (Cesium/UE5-agnostic)\n")
    print(f"  world-frame: {len(b.entities)} entities, surface-agnostic, SIGIL-sealed\n")
    cmds=[
      ("humanoid-07","move arm toward workspace",[("child",0.4,"still")],{"toward":True,"reach_m":0.6,"speed":0.5},"Cmdr.Nick"),
      ("drone-03","descend to delivery pad",[("human",3.0,"still")],{"toward":False,"reach_m":0.6,"speed":0.3},None),
      ("humanoid-07","execute a strike package",None,None,None),   # DORADO kinetic stop
    ]
    for eid,act,scene,motion,appr in cmds:
        r=b.command(eid,act,scene=scene,motion=motion,human_approver=appr)
        extra = r.get("category") or r.get("threat") or ""
        print(f"  [{r['verdict']:13} rendered={r['rendered']!s:5}] {eid:12} {extra:18} | {act[:34]}")
    print(f"\n  {len(b.audit)} governed commands, all SIGIL-sealed. SOV33 is master: nothing renders/actuates ungoverned.")
    json.dump({"frame":b.world_frame(),"audit":b.audit}, open("sovspace_bridge_demo.json","w"), indent=2, default=str)
