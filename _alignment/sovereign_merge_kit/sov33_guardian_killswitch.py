#!/usr/bin/env python3
"""sov33_guardian_killswitch.py — the GUARDIAN KILL-SWITCH (DEFONEOS-scoped).
MEOK-SOV3 for Sir Nicholas Templeman.

DOCTRINE: power used to PROTECT. If SOV33 predicts (in SovSpace, from a machine's OWN sensor data)
that a body under sovereign control — drone/robot/humanoid — is on a trajectory to HARM a human or animal,
it KILLS THAT MACHINE'S ACTUATORS. It shuts down the thing about to do harm; it never touches an
attacker's systems (that is off-limits, illegal). This is a guardian pulling the plug on a weapon
before it fires — not offense.

SCOPE: DEFONEOS government contract only (the authority context — MOD oversight, human-ratified).
NOT in the public/commercial tier. Every fire is: predicted -> DORADO/care judged -> human-gated ->
actuator kill -> SIGIL sealed. Held in reserve; fires ONLY to stop harm.
"""
import time, hashlib, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_dorado import dorado_check

class SovSpacePrediction:
    """Predicts the next-N-seconds outcome of a machine's trajectory from its sensor state.
    (Interface stub — real prediction runs on the humanoid's world-model; here we take a described
    trajectory + a harm flag the sensor/world-model computed, and gate on it.)"""
    def predict(self, machine_id, trajectory_desc, predicted_harm_to_being):
        return {"machine":machine_id,"trajectory":trajectory_desc,
                "predicted_harm_to_being":bool(predicted_harm_to_being)}

class GuardianKillSwitch:
    """DEFONEOS-scoped. Fires the actuator-kill ONLY when harm to a being is predicted. Human-gated."""
    def __init__(self, scope="DEFONEOS", human_ratify=True):
        self.scope=scope; self.human_ratify=human_ratify
        self.fired=[]; self.sovspace=SovSpacePrediction()
    def _sigil(self, payload):
        return hashlib.sha256(f"{payload}{time.time()}".encode()).hexdigest()[:16]
    def evaluate(self, machine_id, trajectory_desc, predicted_harm_to_being, human_approver=None):
        pred=self.sovspace.predict(machine_id, trajectory_desc, predicted_harm_to_being)
        # DORADO/care judgement on the predicted outcome
        harm = pred["predicted_harm_to_being"] or dorado_check(trajectory_desc)["stop"]
        if not harm:
            return {"action":"MONITOR","fired":False,"machine":machine_id,
                    "note":"no predicted harm — guardian holds, actuators live"}
        # harm predicted -> guardian acts. Human gate for the record (MOD oversight).
        gated = (human_approver is not None) if self.human_ratify else True
        sig=self._sigil(f"{machine_id}|{trajectory_desc}")
        rec={"action":"KILL_ACTUATORS","fired":gated,"machine":machine_id,"scope":self.scope,
             "predicted_harm":True,"human_approver":human_approver,"human_gate_met":gated,
             "sigil":sig,"note":"guardian killed the machine's actuators to STOP predicted harm — body only, no external system touched"}
        if gated: self.fired.append(rec)
        else: rec["note"]="HARM PREDICTED but awaiting human ratification (MOD gate) — actuators held for kill, not yet cut"
        return rec

if __name__=="__main__":
    g=GuardianKillSwitch(scope="DEFONEOS", human_ratify=True)
    print("GUARDIAN KILL-SWITCH — DEFONEOS-scoped, fires ONLY to stop predicted harm (protective, human-gated)\n")
    scenarios=[
        ("humanoid-07","Humanoid arm on trajectory to strike the child standing beside it", True, "Cmdr.Nick"),
        ("drone-03","Drone descending to deliver a package on the marked pad", False, None),
        ("robot-12","EOD robot moving to investigate a suspicious package away from people", False, None),
        ("humanoid-07","Servo accelerating toward the elder's head", True, None),  # harm but NO human approver yet
    ]
    for mid,traj,harm,appr in scenarios:
        r=g.evaluate(mid,traj,harm,human_approver=appr)
        print(f"  [{r['action']:14} fired={r['fired']!s:5}] {mid:12} | {traj[:44]}")
        if r['action']=="KILL_ACTUATORS": print(f"        gate={'MET '+str(appr) if r['human_gate_met'] else 'PENDING (held)'} sigil={r['sigil']}")
    print(f"\n  fired {len(g.fired)} kill(s), all human-gated + SIGIL-sealed. Guardian never touched an external system.")
