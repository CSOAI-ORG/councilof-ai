"""Evolve: bounded recursive-improvement proposal loop.

'DREAM' explores counterfactuals offline. 'RSI' here means recursively proposing
and testing improvements. It is not a claim of AGI/ASI, and it cannot directly
modify production, GSPC law, signer policy, or the Constitutional Charter.
"""
from __future__ import annotations

import hashlib
import json
from typing import Any

from .reaction_sim import simulate_reactions

PROTECTED = {
    "constitutional_charter",
    "gspc_admission_rules",
    "signer_authority",
    "root_writer",
    "settlement_authority",
}

def _id(value: Any) -> str:
    return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(",",":")).encode()).hexdigest()
def dream(event: dict[str, Any], dependents: list[str], *, frozen_at: str | None = None) -> dict[str, Any]:
    sim=simulate_reactions(event,dependents,frozen_at=frozen_at)
    return {
        "schema":"csoai.evolve-dream/0.1",
        "mode":"OFFLINE_COUNTERFACTUAL",
        "simulation":sim,
        "may_execute":False,
        "may_promote_claims":False,
        "may_modify_constitution":False,
    }

def propose_improvement(source: str, target: str, rationale: str, evidence_ids: list[str]) -> dict[str, Any]:
    state="PROPOSAL_ONLY"
    blockers=[]
    if target in PROTECTED:
        blockers.append("PROTECTED_TARGET_REQUIRES_EXPLICIT_OWNER_GOVERNANCE")
    proposal={
        "schema":"csoai.evolve-proposal/0.1",
        "source":source,
        "target":target,
        "rationale":rationale,
        "evidence_ids":sorted(set(evidence_ids)),
        "state":state,
        "blockers":blockers,
        "required_before_promotion":[
            "frozen baseline",
            "bounded test",
            "independent critic/reproduction where applicable",
            "measured improvement",
            "no regression on constitutional invariants",
            "explicit authority for consequential promotion",
        ],
    }
    proposal["content_id"]=_id(proposal)
    return proposal

def promotion_decision(proposal: dict[str, Any], evaluation: dict[str, Any]) -> dict[str, Any]:
    measured=evaluation.get("measured") is True
    improved=evaluation.get("improved") is True
    invariant_pass=evaluation.get("constitutional_invariants_pass") is True
    authorised=evaluation.get("promotion_authorised") is True
    protected=proposal.get("target") in PROTECTED
    # These are caller-supplied assertions, not a verified frozen evaluation
    # receipt or an admission decision. This contract must never self-promote.
    asserted_ready=measured and improved and invariant_pass and authorised and not protected
    return {
        "schema":"csoai.evolve-promotion/0.1",
        "proposal_id":proposal.get("content_id"),
        "decision":"HOLD",
        "review_state":"AWAIT_VERIFIED_EVALUATION_AND_ADMISSION" if asserted_ready else "ASSERTED_GATES_INCOMPLETE",
        "measured":measured,
        "improved":improved,
        "constitutional_invariants_pass":invariant_pass,
        "promotion_authorised":authorised,
        "protected_target":protected,
        "note":"ASI is not inferred from iterative improvement; this is bounded measured optimization.",
    }

def build_evolve_contract() -> dict[str, Any]:
    body={
        "schema":"csoai.evolve-contract/0.1",
        "modes":{
            "DREAM":"offline counterfactual generation over SovSpace dependencies",
            "CALIBRATE":"bind later observations to prior frozen scenarios",
            "RSI":"propose -> test -> critic -> measure -> gated promotion",
            "EVOLVE":"repeat only after measured improvement; regressions remain evidence",
        },
        "protected_targets":sorted(PROTECTED),
        "autonomous_allowed":[
            "read public evidence",
            "generate synthetic scenarios",
            "run local/sandbox tests",
            "compare against frozen baseline",
            "write proposals and calibration records",
        ],
        "explicit_authority_required":[
            "production mutation",
            "constitutional amendment",
            "GSPC admission-rule change",
            "signing/root publication",
            "payment settlement",
            "external consequential action",
        ],
        "claim_boundary":"This is bounded recursive optimisation infrastructure, not evidence of AGI or ASI.",
    }
    body["content_id"]=_id(body)
    return body
