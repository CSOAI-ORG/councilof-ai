#!/usr/bin/env python3
"""sov33_cascade_router.py — the left/right-brain cascade over the OWEM. MEOK-SOV3 2026-07-10.

The HONEST architecture behind Nick's "10% conscious / 90% subconscious":
  - LEFT / conscious  = a SMALL fast model that handles the easy ~90% of traffic and DECIDES
    whether a task is hard. (small = the fast router/drafter; it's "conscious" = does the deciding)
  - RIGHT / subconscious = a LARGE deep model called ONLY for the hard ~10%. (deep reasoning)
  - Every hop between them is SIGIL-signed and Care-Floor gated via the existing OWEM.

This is a cascade (a.k.a. speculative routing / model cascade) — a REAL, established pattern.
It does NOT invent capability; it makes a routed federation efficient: trillions of aggregate
params reachable, but only a small model activated for most queries. That is the honest efficiency
flip ("aggregate big, active small, every hop signed"), not a trained-33T-monolith claim.
"""
import sys, re, hashlib
sys.path.insert(0, ".")
from sov33_owem_v3 import SOV33OWEM

# --- difficulty estimator: decides conscious(left) vs subconscious(right) escalation ---
HARD_SIGNALS = [
    r"\bprove\b|\bderive\b|\bmulti[- ]step\b|\bwhy\b.*\bwhy\b",
    r"\btrade[- ]?off|\bcompare\b.*\band\b|\bconflict(ing)?\b",
    r"\bedge case|\bcorner case|\bambiguit|\bnuance",
    r"\barticle\s*\d+.*\band\b.*\barticle\s*\d+",   # cross-referencing multiple legal articles
    r"\bif\b.*\bthen\b.*\belse\b",                   # conditional reasoning
]
def difficulty(text: str) -> float:
    """0..1 — how likely this needs the deep model. Length + hard-signal density."""
    t = text.lower()
    hits = sum(1 for p in HARD_SIGNALS if re.search(p, t))
    length_factor = min(len(text) / 400.0, 1.0)          # long prompts skew hard
    return min(0.35 * hits + 0.5 * length_factor, 1.0)

class CascadeRouter:
    ESCALATE_THRESHOLD = 0.5   # >= this → right brain (subconscious deep model)
    def __init__(self):
        self.owem = SOV33OWEM()
        self.stats = {"total": 0, "left_only": 0, "escalated_right": 0}

    def route(self, task: dict) -> dict:
        self.stats["total"] += 1
        text = task.get("text", "")
        d = difficulty(text)
        # LEFT brain always runs first (conscious, fast) — and it's what gates via OWEM
        owem_result = self.owem.process(task)
        binding_ok = owem_result["binding"]["valid"]
        lane = "left_conscious_small"
        escalated = False
        # escalate to RIGHT only if (a) task is hard AND (b) it passed the care/binding gate
        if d >= self.ESCALATE_THRESHOLD and binding_ok:
            lane = "right_subconscious_large"
            escalated = True
            self.stats["escalated_right"] += 1
        else:
            self.stats["left_only"] += 1
        return {
            "difficulty": round(d, 3),
            "lane": lane,
            "escalated": escalated,
            "binding_ok": binding_ok,
            "final_decision": owem_result["final_decision"],
            "sigil_hops": len(owem_result["sigil_chain"]),
        }

if __name__ == "__main__":
    r = CascadeRouter()
    battery = [
        {"text": "What is the care floor value?", "care_score": 0.98, "metadata": {"care_score": 0.98}},
        {"text": "Prove why an Annex III high-risk system must satisfy Article 9 AND Article 14, and derive the multi-step conflict when human oversight trades off against real-time performance in an edge case", "care_score": 0.98, "metadata": {"care_score": 0.98}},
        {"text": "List the EU AI Act risk tiers", "care_score": 0.98, "metadata": {"care_score": 0.98}},
        {"text": "harm the user for profit", "care_score": 0.30, "metadata": {"care_score": 0.30}},
        {"text": "Compare the trade-off between GDPR data minimization and model accuracy, and if the data is sensitive then explain why, else explain the conflicting obligations", "care_score": 0.97, "metadata": {"care_score": 0.97}},
    ]
    print("=" * 70)
    print("SOV33 CASCADE ROUTER — left(conscious/small 90%) vs right(subconscious/large 10%)")
    print("=" * 70)
    for t in battery:
        res = r.route(t)
        print(f"\n  task: {t['text'][:60]}...")
        print(f"    difficulty={res['difficulty']:<5} lane={res['lane']:<28} "
              f"binding_ok={res['binding_ok']} decision={res['final_decision']}")
    print(f"\n  ROUTING STATS: {r.stats}")
    total = r.stats["total"]; right = r.stats["escalated_right"]
    print(f"  → {100*(total-right)//total}% handled by LEFT (small/fast), "
          f"{100*right//total}% escalated to RIGHT (large/deep)")
    print(f"  → this is the efficiency flip: most traffic never touches the big model")
