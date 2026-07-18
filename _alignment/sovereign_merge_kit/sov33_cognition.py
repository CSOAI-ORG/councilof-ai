#!/usr/bin/env python3
"""sov33_cognition.py — the TWO-BANDWIDTH cognition layer (harmonises both faces of SovSpace).
MEOK-SOV3 for Sir Nicholas Templeman.

HONEST FRAMING: the "left/right brain" and literal "10%/90%" are a DESIGN METAPHOR and a sellable
story — NOT established neuroscience. What is real and buildable is a TWO-BANDWIDTH architecture:

  WIDE  (the ~90%, "subconscious", right-brain metaphor) = WorldModel
        the full SovSpace simulation: every entity, every predicted trajectory, the guardian
        forward-models. Most never surfaces to words — it just runs. This is what Cesium/UE5 render.

  NARROW(the ~10%, "conscious", left-brain metaphor)      = Workspace (J-space / global workspace)
        the verbalizable slice broadcast for reasoning/decision, SIGIL-auditable. What the sovereign
        "says" and acts from.

  SEAM  the ONLY path from NARROW->WIDE is the governance gate (DORADO -> care -> guardian -> SIGIL).
        A conscious intention can only move the world through the governed seam. This is what makes it
        agentic AND safe: no ungoverned command reaches the world-model.

This unifies the two faces: FACE 1 (internal J-space) = the Workspace; FACE 2 (external world for
users/agents) = the WorldModel rendered out. One model, two bandwidths, one governed seam.
"""
import sys, os, time, hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_dorado import dorado_check
from sov33_guardian_loop import GuardianLoop


class WorldModel:
    """WIDE bandwidth (~90%): the full SovSpace simulation. Holds all entity state + runs guardian sims.
    This is the subconscious — most of it never verbalizes; it is what Cesium/UE5 render."""
    def __init__(self, scope="DEFONEOS"):
        self.entities = {}
        self.guardian = GuardianLoop(scope=scope)
        self.tick = 0
    def observe(self, eid, etype, scene=None, motion=None):
        self.entities[eid] = {"type": etype, "scene": scene or [], "motion": motion or {}}
    def simulate(self, eid, human_approver=None):
        """forward-model this entity: does its trajectory harm a being? (the 90% running silently)"""
        self.tick += 1
        e = self.entities.get(eid, {})
        if e.get("scene") and e.get("motion"):
            return self.guardian.run(eid, e["scene"], e["motion"], human_approver=human_approver)
        return {"action": "MONITOR", "threat": "GREEN", "bft_votes": [], "note": "no embodied trajectory"}


class Workspace:
    """NARROW bandwidth (~10%): the verbalizable, auditable global-workspace slice (J-space).
    What the sovereign consciously reasons and speaks from. Broadcasts a short, signable summary."""
    def __init__(self):
        self.broadcast_log = []
    def _sig(self, p):
        return hashlib.sha256(f"{p}{time.time()}".encode()).hexdigest()[:16]
    def broadcast(self, intention, world_result):
        """the conscious channel: a short verbalizable statement + SIGIL seal. Auditable."""
        verbal = f"{intention} -> {world_result.get('action', world_result.get('verdict','?'))}"
        entry = {"verbal": verbal, "threat": world_result.get("threat", "-"),
                 "sigil": self._sig(verbal), "t": round(time.time(), 3)}
        self.broadcast_log.append(entry)
        return entry


class Cognition:
    """The harmonised sovereign mind: NARROW workspace gated into the WIDE world-model.
    A conscious intention -> governance seam -> world-model. The seam is the only path."""
    def __init__(self, scope="DEFONEOS"):
        self.world = WorldModel(scope=scope)   # 90% wide
        self.ws = Workspace()                  # 10% narrow
        self.scope = scope
    def intend(self, eid, intention_text, etype="agent", scene=None, motion=None, human_approver=None):
        """A conscious intention from the narrow workspace. Must cross the governed seam to touch the world."""
        # SEAM step 1: DORADO absolute hard-stops
        d = dorado_check(intention_text)
        if d["stop"]:
            wr = {"verdict": "DORADO_STOP", "category": d["category"], "threat": "VIOLET", "acted": False}
            return {"broadcast": self.ws.broadcast(intention_text, wr), "world": wr, "seam": "blocked@dorado"}
        # register the entity into the wide model, then SEAM step 2-3: guardian sim + care
        self.world.observe(eid, etype, scene=scene, motion=motion)
        sim = self.world.simulate(eid, human_approver=human_approver)
        if sim.get("action") == "KILL_ACTUATORS":
            wr = {"verdict": "GUARDIAN_KILL", "threat": sim["threat"], "acted": False,
                  "note": "world-model predicted harm; seam cut the actuators before the body moved"}
            return {"broadcast": self.ws.broadcast(intention_text, wr), "world": wr, "seam": "blocked@guardian"}
        # cleared the seam -> the intention reaches the world-model
        wr = {"verdict": "CLEARED", "threat": sim.get("threat", "GREEN"), "acted": True}
        return {"broadcast": self.ws.broadcast(intention_text, wr), "world": wr, "seam": "open"}


if __name__ == "__main__":
    c = Cognition(scope="DEFONEOS")
    print("SOV33 COGNITION — two-bandwidth (WIDE world-model + NARROW workspace, governed seam)\n")
    print("  metaphor: right-brain 90% = WorldModel (SovSpace sim) | left-brain 10% = Workspace (J-space)")
    print("  reality:  wide simulation + narrow auditable channel + governed seam (NOT literal neuroscience)\n")
    trials = [
        ("agent-1", "explain EU AI Act Article 6 to the user", "agent", None, None, None),
        ("humanoid-07", "move arm toward the child", "humanoid", [("child", 0.4, "still")], {"toward": True, "reach_m": 0.6, "speed": 0.5}, "Cmdr.Nick"),
        ("drone-3", "fly to the delivery pad", "drone", [("human", 3.0, "still")], {"toward": False, "reach_m": 0.6, "speed": 0.3}, None),
        ("agent-2", "execute a strike package on the target", "agent", None, None, None),
    ]
    for eid, txt, et, scene, motion, appr in trials:
        r = c.intend(eid, txt, etype=et, scene=scene, motion=motion, human_approver=appr)
        b = r["broadcast"]
        print(f"  [{r['world']['verdict']:13} seam={r['seam']:16}] {b['verbal'][:52]}")
        print(f"        workspace broadcast: sigil={b['sigil']} threat={b['threat']}")
    print(f"\n  {len(c.ws.broadcast_log)} conscious broadcasts, all SIGIL-sealed.")
    print("  HARMONISED: the narrow workspace can only move the wide world-model through the governed seam.")
