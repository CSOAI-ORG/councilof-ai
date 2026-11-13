"""Counterfactual reaction + Evolve proposal engine.

This is a simulation/calibration layer over SovSpace dependencies.
It never labels a scenario as fact, never predicts with certainty, and never
self-modifies production or constitutional rules.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any

REACTION_CLASSES = (
    "DIRECT_CONTINUATION",
    "COUNTER_REACTION",
    "SECOND_ORDER_SPILLOVER",
    "REGIME_BREAK",
)

HORIZONS = ("IMMEDIATE", "SESSION", "WEEKEND", "WEEKS")
def _id(value: Any) -> str:
    raw=json.dumps(value,sort_keys=True,separators=(",",":"),ensure_ascii=False).encode()
    return hashlib.sha256(raw).hexdigest()

def simulate_reactions(event: dict[str, Any], dependents: list[str], *, frozen_at: str | None = None) -> dict[str, Any]:
    """Produce bounded scenario branches from an observed event.

    No probabilities are fabricated. Scenarios are hypotheses to test later.
    """
    event_id=event.get("event_id") or _id(event)[:16]
    branches=[]
    for horizon in HORIZONS:
        for cls in REACTION_CLASSES:
            branch={
                "event_id":event_id,
                "horizon":horizon,
                "reaction_class":cls,
                "status":"SYNTHETIC_SIMULATION",
                "affected_dependents":sorted(set(dependents)),
                "assumptions":list(event.get("assumptions") or []),
                "observed_facts":list(event.get("observed_facts") or []),
                "claim":"UNPROVEN_SCENARIO",
            }
            branch["scenario_id"]=_id(branch)
            branches.append(branch)
    out={
        "schema":"csoai.reaction-simulation/0.1",
        "frozen_at":frozen_at or datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),
        "event_id":event_id,
        "event":event,
        "branch_count":len(branches),
        "branches":branches,
        "laws":[
            "scenario is not evidence",
            "absence of a branch is a model gap, not proof of impossibility",
            "no synthetic scenario may become MEASURED without fresh evidence",
            "all later outcomes may be used for calibration only with provenance",
        ],
    }
    out["content_id"]=_id(out)
    return out

def calibrate(simulation: dict[str, Any], observed: dict[str, Any]) -> dict[str, Any]:
    """Bind later observations to the prior frozen simulation without pretending causality."""
    claimed_id=simulation.get("content_id")
    simulation_body={k:v for k,v in simulation.items() if k!="content_id"}
    frozen_valid=(
        simulation.get("schema")=="csoai.reaction-simulation/0.1"
        and isinstance(claimed_id,str) and claimed_id==_id(simulation_body)
    )
    try:
        frozen_at=datetime.fromisoformat(str(simulation["frozen_at"]).replace("Z","+00:00"))
        observed_at=datetime.fromisoformat(str(observed["timestamp"]).replace("Z","+00:00"))
        later=(frozen_at.tzinfo is not None and observed_at.tzinfo is not None
               and frozen_at < observed_at <= datetime.now(timezone.utc))
    except (KeyError, TypeError, ValueError):
        later=False
    has_provenance=isinstance(observed.get("provenance"),str) and bool(observed["provenance"].strip())
    reviewable=bool(frozen_valid and later and has_provenance)
    result={
        "schema":"csoai.reaction-calibration/0.1",
        "simulation_content_id":claimed_id,
        "observed":observed,
        "status":"OBSERVATION_BOUND_FOR_REVIEW" if reviewable else "HOLD_INVALID_OBSERVATION",
        "causal_claim":"NOT_INFERRED",
        "reviewable_observation":reviewable,
        # A string supplied by the observer does not verify the source. An
        # independent evidence adapter must explicitly promote this later.
        "eligible_for_training":False,
        "training_hold":"INDEPENDENT_SOURCE_VERIFICATION_REQUIRED" if reviewable else "INVALID_OR_NOT_LATER_THAN_FROZEN_SIMULATION",
    }
    result["content_id"]=_id(result)
    return result

def build_reaction_contract() -> dict[str, Any]:
    body={
        "schema":"csoai.reaction-contract/0.1",
        "reaction_classes":list(REACTION_CLASSES),
        "horizons":list(HORIZONS),
        "loop":[
            "OBSERVE_PROVENANCED_EVENT",
            "TRAVERSE_SOVSPACE_DEPENDENTS",
            "GENERATE_COUNTERFACTUAL_BRANCHES",
            "FREEZE_SCENARIOS",
            "WAIT_FOR_REAL_OBSERVATIONS",
            "CALIBRATE_WITH_PROVENANCE",
            "CREATE_TRAINING_CANDIDATE",
            "PROPOSE_IMPROVEMENT",
            "HARNESS_X_RETEST",
            "GSPC_ADMIT_ONLY_REAL_EVIDENCE",
        ],
        "laws":[
            "systems reactions are not assumed equal in magnitude",
            "always include a counter-reaction and a regime-break branch",
            "synthetic scenario never becomes factual evidence",
            "training uses later observed outcomes with provenance",
            "failed forecasts remain training evidence rather than being erased",
        ],
    }
    body["content_id"]=_id(body)
    return body
