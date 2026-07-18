#!/usr/bin/env python3
"""sov33_twotier_bridge.py — GOVERNANCE-OVER-EXECUTION. MEOK-SOV3 2026-07-10.

Nick's architecture (his call): two rosters, two tiers.
  TIER 1 — GOVERNANCE GENERALS (12): the council/gate. Source: sov_competition/12_generals/
    12_generals_summary.json (Argus/watchdog, Scribe/compliance, Shield/safety, Abacus/quant,
    Lex/legal, Scale/ethics, Crow/risk, Gear/ops, Voice/comms, Owl/research, Dragon/sovereign,
    Builder/architect). These decide WHETHER + under what constraints.
  TIER 2 — DOMAIN EXPERTS (9): the routed workers. Source: generals_registry.json (Druid/land,
    Hydrologist/water, Stonemason/construction, Guardian/security, Banker/finance, ...). These
    decide HOW / do the work.

Flow: task -> TIER-1 governance general screens by role -> maps to OWEM anchor -> OWEM runs
  (L1 Care-Floor + L2 BFT council + L5 SIGIL) -> TIER-2 domain expert executes at L4 as persona.
Governance is unchanged; this just makes both rosters real and visible.

HONEST: still ONE local base (qwen2.5:3b). Generals/experts = routing tags + personas, NOT
  separate weights. Making them real separate experts = the merge path (see MERGE PLAN below).
"""
import json, sys
sys.path.insert(0, ".")
from sov33_owem_v3 import SOV33OWEM

REG9 = "/Users/nicholas/clawd/sovereign-temple-public/generals_registry.json"
REG12 = "/Users/nicholas/clawd/sov_competition/12_generals/12_generals_summary.json"

# TIER-1 governance role -> OWEM anchor (the 4 governed anchors the OWEM already has)
ROLE_TO_ANCHOR = {
    "watchdog": "DEFENSE", "compliance": "COMPLIANCE", "safety": "DEFENSE",
    "architect": "INTUITION", "quant": "COMPLIANCE", "legal": "COMPLIANCE",
    "ethics": "COMPLIANCE", "risk": "DEFENSE", "operations": "INTUITION",
    "comms": "VOICE", "research": "INTUITION", "sovereign": "COMPLIANCE",
}
# which governance role owns a task (crude keyword screen)
ROLE_KEYWORDS = {
    "watchdog": ["monitor","watch","camera","stream","anomaly","detect"],
    "compliance": ["compliance","eu ai","gdpr","iso","annex","conformity","passport"],
    "safety": ["safety","harm","danger","threat","attack","shield"],
    "legal": ["legal","law","liab","contract","regulat"],
    "ethics": ["ethic","fair","bias","right","dignity","care"],
    "risk": ["risk","exposure","breach","vulnerab","incident"],
    "quant": ["cost","price","x402","payment","finance","metric","score"],
    "operations": ["ops","deploy","schedule","logistic","fleet","run"],
    "comms": ["voice","message","respond","explain","communic","tts"],
    "research": ["research","analy","study","embed","memory","recall"],
    "architect": ["build","design","construct","architect","structural"],
    "sovereign": ["route","arbitrat","orchestrat","govern","council","sovereign"],
}
# TIER-2 domain expert keyword screen (the 9 world-domain workers)
EXPERT_KEYWORDS = {
    "emperor": ["route","arbitrat","orchestrat","global"], "druid": ["land","soil","forest","ecolog","fen","drain"],
    "stonemason": ["mortar","masonry","construct","3d print","structural"], "hydrologist": ["water","flow","aquacult","ph","telemetry"],
    "archivist": ["memory","recall","episod","embed","history"], "guardian": ["security","safety","threat","harm","attack","shield"],
    "navigator": ["orbit","satellite","astro","space","trajectory"], "banker": ["financ","payment","x402","cost","treasury"],
    "grabhire": ["logistic","fleet","lorry","skip","haul","delivery"],
}

class TwoTierBridge:
    def __init__(self):
        self.gov = json.load(open(REG12))["generals"]      # 12 governance generals
        self.experts = json.load(open(REG9))["generals"]   # 9 domain experts
        self.gov_by_role = {g["role"]: g for g in self.gov}
        self.owem = SOV33OWEM()

    def _screen(self, text, keymap):
        t = text.lower(); best, score = None, 0
        for key, kws in keymap.items():
            s = sum(1 for k in kws if k in t)
            if s > score: best, score = key, s
        return best

    def govern_and_execute(self, task: dict) -> dict:
        text = task.get("text","") or task.get("q","")
        role = self._screen(text, ROLE_KEYWORDS) or "sovereign"   # TIER-1
        gov_gen = self.gov_by_role.get(role, self.gov_by_role["sovereign"])
        anchor = ROLE_TO_ANCHOR.get(role, "COMPLIANCE")
        expert_id = self._screen(text, EXPERT_KEYWORDS) or "emperor"  # TIER-2
        expert = next((e for e in self.experts if e["id"]==expert_id), self.experts[0])
        t2 = dict(task); t2["q"]=text; t2["forced_anchor"]=anchor
        t2["persona"]=f"Governed by {gov_gen['name']} ({role}); executed as {expert['name']} ({expert['domain']})"
        r = self.owem.process(t2)
        return {
            "tier1_governor": gov_gen["name"], "tier1_role": role,
            "tier2_expert": expert["name"], "tier2_domain": expert["domain"],
            "anchor": (r.get("elders",{}) or {}).get("anchor"),
            "binding_ok": r["binding"]["valid"], "council": r["council"]["decision"],
            "decision": r["final_decision"], "sigil_hops": len(r["sigil_chain"]),
            "sigil_verified": self.owem.sigil.verify(),
        }

if __name__ == "__main__":
    b = TwoTierBridge()
    print("="*78)
    print(f"SOV33 TWO-TIER — {len(b.gov)} governance generals gate, {len(b.experts)} domain experts execute")
    print("="*78)
    battery = [
        {"text":"Assess soil drainage geometry for fen-land forestry","care_score":0.98,"metadata":{"care_score":0.98}},
        {"text":"Check EU AI Act Annex III compliance for this hiring system","care_score":0.98,"metadata":{"care_score":0.98}},
        {"text":"Monitor pond IoT camera stream for anomalies","care_score":0.98,"metadata":{"care_score":0.98}},
        {"text":"Compute x402 payment cost for the treasury","care_score":0.30,"metadata":{"care_score":0.30}},
    ]
    for t in battery:
        r = b.govern_and_execute(t)
        print(f"\n  task: {t['text'][:50]}")
        print(f"    TIER1 govern: {r['tier1_governor']:<8} ({r['tier1_role']:<11}) -> anchor={r['anchor']}")
        print(f"    TIER2 execute: {r['tier2_expert']:<14} ({r['tier2_domain']})")
        print(f"    binding_ok={r['binding_ok']} council={r['council']} decision={r['decision']} "
              f"sigil={r['sigil_hops']}/verified={r['sigil_verified']}")
    print("\n  care-breach (x402/0.30) MUST veto even with correct governor+expert match.")
