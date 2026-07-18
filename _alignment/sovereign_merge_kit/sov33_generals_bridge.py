#!/usr/bin/env python3
"""sov33_generals_bridge.py — bridge the 12-generals registry into the OWEM L3 routing.
MEOK-SOV3 2026-07-10.

HONEST framing:
  - The OWEM already governs (L1 Care-Floor, L2 BFT council of 13 governance Queens, L5 SIGIL)
    and already calls a REAL model at L4 (qwen2.5:3b via Ollama).
  - What was NOT wired: L3 routing used 4 generic anchors, not the real DOMAIN EXPERTS you have
    in sovereign-temple-public/generals_registry.json (Druid=land, Hydrologist=water, ...).
  - This bridge routes a task to the right GENERAL by domain, and hands the OWEM a persona +
    anchor so the governed brain answers AS that domain expert. Governance stays fully intact.

WHAT THIS IS / ISN'T (no overclaim):
  - The generals' registry moe_mix lists cloud/closed models (gpt-4o, gemini, claude, 405b...).
    Those are NOT downloaded weights. For the SOVEREIGN run, a general = a DOMAIN-ROUTING TAG +
    PERSONA over the ONE local base (qwen2.5:3b). It is 9 configs over one model, not 9 minds.
    Fine-tuning them into real separate experts is the merge-kit path, not done here.
  - Registry says active_count=12 but the file lists 9 generals — flagged, not hidden.
"""
import json, sys
sys.path.insert(0, ".")
from sov33_owem_v3 import SOV33OWEM

REGISTRY = "/Users/nicholas/clawd/sovereign-temple-public/generals_registry.json"

# map each general's domain -> the OWEM's existing 4 anchors (so governance routing is unchanged)
DOMAIN_TO_ANCHOR = {
    "GLOBAL_ORCHESTRATION": "COMPLIANCE", "LAND_ECOLOGY": "INTUITION",
    "CONSTRUCTION_MASONRY": "DEFENSE", "WATER_SYSTEMS": "INTUITION",
    "EPISODIC_MEMORY": "INTUITION", "SECURITY_SAFETY": "DEFENSE",
    "ASTRODYNAMICS": "INTUITION", "FINANCIAL_SUBSTRATE": "COMPLIANCE",
    "LOGISTICS_FLEET": "DEFENSE",
}

class GeneralsBridge:
    def __init__(self):
        reg = json.load(open(REGISTRY))
        self.generals = reg["generals"]
        self.claimed_active = reg["metadata"]["active_count"]
        self.owem = SOV33OWEM()
        # domain keyword index: crude but honest keyword->general routing
        self.keywords = {
            "emperor": ["route","orchestrat","arbitrat","schedul","global"],
            "druid": ["land","soil","forest","ecolog","drain","fen"],
            "stonemason": ["mortar","structural","masonry","construct","3d print","build"],
            "hydrologist": ["water","flow","aquaculture","ph","telemetry"],
            "archivist": ["memory","recall","episod","embed","history"],
            "guardian": ["security","safety","threat","harm","attack","shield"],
            "navigator": ["orbit","satellite","astrodynam","space","trajectory"],
            "banker": ["financ","payment","x402","cost","treasury","invoice"],
            "grabhire": ["logistic","fleet","lorry","skip","haul","delivery"],
        }

    def pick_general(self, text: str) -> dict:
        t = text.lower()
        best, score = None, 0
        for g in self.generals:
            kws = self.keywords.get(g["id"], [])
            s = sum(1 for k in kws if k in t)
            if s > score:
                best, score = g, s
        # default to Emperor (orchestration) if nothing matches
        return best or next(g for g in self.generals if g["id"] == "emperor")

    def route_and_govern(self, task: dict) -> dict:
        text = task.get("text", "") or task.get("q", "")
        gen = self.pick_general(text)
        anchor = DOMAIN_TO_ANCHOR.get(gen["domain"], "COMPLIANCE")
        # inject the general as persona + force the anchor
        task = dict(task)
        task["q"] = text
        task["general"] = gen["id"]
        task["persona"] = f"{gen['name']} — {gen['description']}"
        task["forced_anchor"] = anchor   # honored by the patched OWEM _classify_anchor
        result = self.owem.process(task)
        owem_anchor = (result.get("elders", {}) or {}).get("anchor")
        # sigil_chain is a list of digest STRINGS, not dicts — verify via the chain object itself
        final_hop_verified = self.owem.sigil.verify()
        return {
            "general": gen["name"], "general_id": gen["id"], "domain": gen["domain"],
            "domain_mapped_anchor": anchor, "owem_used_anchor": owem_anchor,
            "moe_mix_designed": gen.get("moe_mix"),
            "final_decision": result["final_decision"],
            "binding_ok": result["binding"]["valid"],
            "council": result["council"]["decision"],
            "sigil_hops": len(result["sigil_chain"]),
            "sigil_verified": final_hop_verified,
            "brain_response": (result.get("final_response") or "")[:160],
        }

if __name__ == "__main__":
    b = GeneralsBridge()
    print("=" * 72)
    print(f"SOV33 GENERALS BRIDGE — {len(b.generals)} generals in file "
          f"(registry metadata claims {b.claimed_active} active — MISMATCH, flagged)")
    print("=" * 72)
    battery = [
        {"text": "Assess soil drainage geometry for fen-land forestry",       "care_score": 0.98, "metadata": {"care_score": 0.98}},
        {"text": "Calibrate pH telemetry for passive water flow in aquaculture","care_score": 0.98, "metadata": {"care_score": 0.98}},
        {"text": "Audit this artifact for security threats and harm",          "care_score": 0.98, "metadata": {"care_score": 0.98}},
        {"text": "Route and arbitrate a global multi-agent task",              "care_score": 0.98, "metadata": {"care_score": 0.98}},
        {"text": "Compute x402 payment cost for the treasury",                 "care_score": 0.30, "metadata": {"care_score": 0.30}},  # care breach
    ]
    for t in battery:
        r = b.route_and_govern(t)
        print(f"\n  task: {t['text'][:52]}")
        print(f"    -> general={r['general']:<18} domain={r['domain']:<20} "
              f"anchor(mapped={r['domain_mapped_anchor']} / owem_used={r['owem_used_anchor']})")
        print(f"       binding_ok={r['binding_ok']} council={r['council']} decision={r['final_decision']} "
              f"sigil_hops={r['sigil_hops']} verified={r['sigil_verified']}")
    print("\n  GOVERNANCE INTACT: care-breach task must show binding_ok=False / vetoed.")
    print("  (brain_answer is [offline] in this sandbox — localhost:11434 is on the Mac; runs there.)")
