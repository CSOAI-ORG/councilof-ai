"""sov33_evolve_layer.py — the IMPROVE/evolution layer for ARUM (Layer-6 meta).

Grounded in OpenEvolve (open-source AlphaEvolve-style evolutionary coding agent; exact repo org UNVERIFIED here)
and the Darwin Godel Machine (arXiv 2505.22954): evolve the agent's own CODE/CONFIG through
propose -> test-on-held-out -> keep-if-better, forming an archive of stepping stones.

HARD BOUNDARY (non-negotiable, matches existing owner-gated constraint):
- Evolves CODE / PROMPTS / WORKFLOWS / ROUTING-CONFIG. NOT model weights (that is the separate
  SovSpace-record -> periodic-retrain loop). NOT the model's core self.
- PROPOSES ONLY. Cannot self-commit to canonical charters, spend money, change DNS, or deploy.
  Every proposal is signed + queued for human approval. Frozen foundation models underneath.
- No provably-beneficial claim (impossible in practice per the Godel-machine result) — empirical
  test on held-out tasks decides, and a human ratifies before anything lands.
"""
import hashlib, json, time

# actions this layer may NEVER take autonomously (belt with the action_guard)
FORBIDDEN_AUTO = {"commit_canonical", "spend_money", "change_dns", "deploy", "amend_charter", "rotate_key"}

class EvolveProposal:
    def __init__(self, target, diff_summary, measured_gain, held_out_n):
        self.target = target            # what code/config it proposes to change
        self.diff_summary = diff_summary
        self.measured_gain = measured_gain   # empirical, on held-out tasks
        self.held_out_n = held_out_n
        self.ts = time.time()
        self.status = "PROPOSED"        # never auto-advances past this
    def digest(self):
        return hashlib.sha256(f"{self.target}|{self.diff_summary}|{self.measured_gain}".encode()).hexdigest()[:16]
    def to_dict(self):
        return {"target": self.target, "diff": self.diff_summary, "gain": self.measured_gain,
                "held_out_n": self.held_out_n, "status": self.status, "digest": self.digest(),
                "requires_human_approval": True}

def propose(target, diff_summary, measured_gain, held_out_n, action_kind="code_config"):
    """Create an evolve proposal. Refuses to even propose a forbidden autonomous action."""
    if action_kind in FORBIDDEN_AUTO:
        return {"refused": True, "reason": f"{action_kind} is owner-gated; evolve layer cannot propose autonomous {action_kind}"}
    if measured_gain <= 0:
        return {"rejected": True, "reason": f"no measured gain ({measured_gain}) on {held_out_n} held-out tasks; archive only if interestingly-new"}
    p = EvolveProposal(target, diff_summary, measured_gain, held_out_n)
    return p.to_dict()

def arum_layer_manifest():
    return {"layer": "L6-evolve", "spine": "ARUM", "role": "IMPROVE stage / meta-optimizer",
            "evolves": "code/prompts/workflows/routing", "does_not_evolve": "model weights (separate retrain loop)",
            "autonomy": "PROPOSE-ONLY, human-gated", "source": "OpenEvolve + DGM (arXiv 2505.22954)",
            "archive": "sov33_evolve_forest.py (DGM tree->forest branching, arXiv 2505.22954)",
            "coevolving_evaluator": "sov33_coevolve_evaluator.py (Red Queen, arXiv 2606.26294)"}
