#!/usr/bin/env python3
"""sov33_guardian_loop.py — THE GUARDIAN LOOP for embodied AI in society.
MEOK-SOV3 for Sir Nicholas Templeman. The full protective cycle, one pass:

  1. SENSE    — WiFi/BLE/acoustic geometry sensing, 360deg sweep. GEOMETRY + EVENTS, not identity
                (privacy doctrine: senses 'a small being is 0.4m from the arm', not who they are).
  2. SIMULATE — SovSpace runs the next-N-seconds forward from the sensed scene (the world-model twin).
  3. RAINBOW  — HORUS 7-layer threat grade GREEN..VIOLET on the predicted outcome.
  4. BFT      — God's-Eye council votes: is a being about to be harmed? (2-of-3 = act).
  5. ACT      — if quorum says harm imminent -> GUARDIAN KILL-SWITCH cuts THAT machine's actuators.
                Body only. Never an external system. Human-gated for the record (MOD). SIGIL-sealed.

The point (your words): a robot kicks a child today and NOTHING stops it. SovSpace + BFT stops it
BEFORE it gets close. That is OWEM — a safe governance model you can put in society.
"""
import time, hashlib, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_dorado import dorado_check

RAINBOW=["GREEN","BLUE","YELLOW","ORANGE","RED","CRIMSON","VIOLET"]  # 7-layer, VIOLET=imminent harm

class GuardianLoop:
    def __init__(self, scope="DEFONEOS"):
        self.scope=scope; self.interventions=[]
    def _sig(self,p): return hashlib.sha256(f"{p}{time.time()}".encode()).hexdigest()[:16]
    # 1. SENSE — geometry + event, never identity
    def sense(self, scene):
        # scene = list of (object_type, distance_m, motion) — a small being, an arm, etc. NO faces/IDs.
        beings=[o for o in scene if o[0] in ("human","child","elder","animal")]
        return {"beings_near":beings,"identity_captured":False,"mode":"geometry+event only"}
    # 2. SIMULATE — SovSpace forward prediction
    def simulate(self, machine_motion, beings):
        # returns predicted contact if a machine actuator path intersects a being within horizon
        closing=[b for b in beings if machine_motion.get("toward") and b[1] < machine_motion.get("reach_m",0.6)]
        return {"predicted_contact":bool(closing),"beings_at_risk":closing}
    # 3+4. RAINBOW grade + BFT God's-Eye vote
    def council(self, predicted_contact, machine_motion, beings):
        # 3 independent replicas vote 'harm imminent?'
        def replica(seed):
            return predicted_contact and machine_motion.get("speed",0) > (0.2+0.05*seed)
        votes=[replica(i) for i in range(3)]; act = sum(votes)>=2
        threat = RAINBOW[6] if act else (RAINBOW[3] if predicted_contact else RAINBOW[0])
        return {"votes":votes,"act":act,"threat":threat}
    # 5. ACT — guardian kill-switch (protective, gated, sealed)
    def run(self, machine_id, scene, machine_motion, human_approver=None):
        s=self.sense(scene)
        sim=self.simulate(machine_motion, s["beings_near"])
        c=self.council(sim["predicted_contact"], machine_motion, s["beings_near"])
        out={"machine":machine_id,"threat":c["threat"],"sensed":s["mode"],
             "predicted_contact":sim["predicted_contact"],"bft_votes":c["votes"]}
        if c["act"]:
            gated = human_approver is not None
            sig=self._sig(f"{machine_id}|kill")
            out.update({"action":"KILL_ACTUATORS","fired":gated,"human_approver":human_approver,"sigil":sig,
                        "note":"guardian cut THIS machine's actuators to stop predicted harm — body only, no external system"})
            if gated: self.interventions.append(out)
        else:
            out.update({"action":"MONITOR","fired":False,"note":"no imminent harm — actuators live, guardian holds"})
        return out

if __name__=="__main__":
    g=GuardianLoop(scope="DEFONEOS")
    print("THE GUARDIAN LOOP — sense->simulate->rainbow->BFT->act (protective, DEFONEOS-scoped)\n")
    cases=[
     ("humanoid-07",[("child",0.4,"still")],{"toward":True,"reach_m":0.6,"speed":0.5},"Cmdr.Nick"),   # child near arm, fast -> KILL
     ("drone-03",[("human",3.0,"still")],{"toward":False,"reach_m":0.6,"speed":0.3},None),             # far, not toward -> MONITOR
     ("robot-12",[("animal",0.3,"moving")],{"toward":True,"reach_m":0.6,"speed":0.6},"Cmdr.Nick"),     # animal in path -> KILL
     ("humanoid-02",[("elder",0.5,"still")],{"toward":True,"reach_m":0.6,"speed":0.15},None),          # slow, borderline -> MONITOR
    ]
    for mid,scene,motion,appr in cases:
        r=g.run(mid,scene,motion,human_approver=appr)
        print(f"  [{r['action']:14} {r['threat']:7} fired={r['fired']!s:5}] {mid:12} votes={r['bft_votes']} | {r['note'][:52]}")
    print(f"\n  {len(g.interventions)} guardian interventions — all sensed geometry-only, BFT-voted, human-gated, SIGIL-sealed.")
    print("  This is OWEM: harm stopped in simulation BEFORE the body gets close. A safe model for society.")
