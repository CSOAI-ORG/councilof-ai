"""Evidence-bound learning contract for OOWM / Evolve.

Synthetic DREAM branches can be context, never target truth. Only later observed,
provenance-bound outcomes can become training candidates.
"""
from __future__ import annotations

import hashlib
import json
from typing import Any

def _id(value: Any) -> str:
    return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(",",":")).encode()).hexdigest()

def training_candidate(simulation: dict[str, Any], calibration: dict[str, Any]) -> dict[str, Any]:
    matching_simulation=(
        bool(simulation.get("content_id"))
        and calibration.get("simulation_content_id")==simulation.get("content_id")
    )
    # Calibration is caller-supplied. Without an independent verifier for its
    # observation and receipt, even a matching ID and a true flag are not enough.
    eligible=False
    observed=calibration.get("observed") or {}
    body={
        "schema":"csoai.training-candidate/0.1",
        "simulation_content_id":simulation.get("content_id"),
        "calibration_content_id":calibration.get("content_id"),
        "state":"ELIGIBLE_FOR_FROZEN_EVAL" if eligible else "HOLD_PENDING_EVIDENCE_VERIFICATION",
        "target_source":"OBSERVED_OUTCOME_ONLY" if eligible else None,
        "observed_timestamp":observed.get("timestamp"),
        "observed_provenance":observed.get("provenance"),
        "synthetic_branches_role":"CONTEXT_OR_HYPOTHESES_ONLY",
        "may_train_production":False,
        "may_change_gspc":False,
        "training_hold":"INDEPENDENT_SOURCE_VERIFICATION_REQUIRED" if matching_simulation else "CALIBRATION_MISMATCH",
    }
    body["content_id"]=_id(body)
    return body

def build_learning_contract() -> dict[str, Any]:
    body={
        "schema":"csoai.learning-contract/0.1",
        "pipeline":[
            "frozen simulation",
            "later provenance-bound observation",
            "calibration record",
            "training candidate",
            "frozen train/validation/holdout split",
            "candidate model/router/policy",
            "Harness X evaluation",
            "independent critic/reproduction where applicable",
            "GSPC evidence admission",
            "explicit promotion gate",
        ],
        "anti_leakage":[
            "do not train on holdout answers",
            "do not promote on the same examples used to distill",
            "do not turn synthetic DREAM probabilities into labels",
            "preserve failed predictions and regressions",
            "dataset/fixture/version hashes must travel with results",
        ],
        "legacy_asi_evolve":{
            "state":"ENGINE_PRESENT_NEEDS_PROVENANCE_HOLDOUT_BINDING",
            "use":"eval/distill/train worker behind this contract",
            "not_allowed":"self-promotion from its own benchmark success",
        },
        "project_label":"ASI Evolve",
        "claim_boundary":"The project label does not assert that the system is ASI.",
    }
    body["content_id"]=_id(body)
    return body
