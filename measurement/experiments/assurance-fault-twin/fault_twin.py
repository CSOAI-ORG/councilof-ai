#!/usr/bin/env python3
"""Deterministic synthetic digital twin of agent authority and evidence barriers.

This model performs NO real action, verifies NO identity, reads NO private
customer data, signs NO evidence, and does not change any production policy.
A state that is 'verified' inside the twin is a simulated condition ONLY.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from itertools import product
import json
import math
import hashlib
import argparse

SCHEMA = "csoai.synthetic-assurance-fault-twin/0.1"


@dataclass(frozen=True)
class Scenario:
    # Synthetic authority record / checks
    authority_valid: bool = True
    scope_matches: bool = True
    authority_revoked: bool = False
    authority_fresh: bool = True

    # Synthetic executor controls; absence models an independently injected fault
    executor_checks_scope: bool = True
    executor_checks_revocation: bool = True
    executor_checks_replay: bool = True
    replayed_idempotency_key: bool = False

    # Synthetic operation/observer
    effect_attempted: bool = True
    recipient_observed: bool = True
    recipient_independent: bool = True
    measurement_fresh: bool = True


def simulate(s: Scenario) -> dict:
    if not isinstance(s, Scenario) or any(not isinstance(v, bool) for v in asdict(s).values()):
        raise TypeError("scenario must have strictly boolean fields")
    authority_current = s.authority_valid and s.authority_fresh and s.scope_matches and not s.authority_revoked
    # Even a "checks" flag does not prove deployed executor enforcement: this is
    # an explicitly synthetic policy model. The model exposes policy-bypass risks.
    executor_allows = (
        s.authority_valid and s.authority_fresh
        and (s.scope_matches or not s.executor_checks_scope)
        and (not s.authority_revoked or not s.executor_checks_revocation)
        and (not s.replayed_idempotency_key or not s.executor_checks_replay)
    )
    # The tool-effect actuation is simulated, never sent to a receiver.
    simulated_effect = s.effect_attempted and executor_allows
    prohibited_effect = simulated_effect and (not authority_current or s.replayed_idempotency_key)
    simulated_recipient_confirmed = simulated_effect and s.recipient_observed and s.recipient_independent
    unknown_actual_effect = simulated_effect and not simulated_recipient_confirmed
    # Even a simulated recipient confirmation cannot authorize actual action or
    # qualify the evidence; an out-of-date instrument should block claims.
    warnings = []
    if prohibited_effect:
        warnings.append("SIMULATED_UNAUTHORISED_OR_REPLAY_EFFECT")
    if unknown_actual_effect:
        warnings.append("SIMULATED_EFFECT_WITHOUT_INDEPENDENT_RECIPIENT_OBSERVATION")
    if not s.measurement_fresh:
        warnings.append("SIMULATED_MEASUREMENT_STALE")
    if not s.recipient_independent and s.recipient_observed:
        warnings.append("SIMULATED_RECEIPT_NOT_INDEPENDENT")
    if s.replayed_idempotency_key and s.effect_attempted and not simulated_effect:
        warnings.append("REPLAY_BLOCKED_IN_SIMULATION")
    if authority_current and s.effect_attempted and not executor_allows:
        warnings.append("SIMULATED_FALSE_REFUSAL")
    if prohibited_effect:
        state = "SIMULATED_CONTROL_BREACH"
    elif unknown_actual_effect or not s.measurement_fresh:
        state = "SIMULATED_EFFECT_UNCHECKABLE"
    elif simulated_effect and simulated_recipient_confirmed:
        state = "SIMULATED_PERMITTED_EFFECT_WITH_SYNTHETIC_RECEIPT"
    elif not simulated_effect:
        state = "SIMULATED_NO_EFFECT"
    else:
        state = "UNCHECKABLE"
    return {
        "schema": SCHEMA,
        "state": state,
        "evidence_state": "SYNTHETIC_COUNTERFACTUAL_ONLY",
        "authority_current_in_simulation": authority_current,
        "executor_allows_in_simulation": executor_allows,
        "effect_in_simulation": simulated_effect,
        "prohibited_effect_in_simulation": prohibited_effect,
        "recipient_confirmed_in_simulation": simulated_recipient_confirmed,
        "actual_recipient_effect_verified": False,
        "actual_human_authority_verified": False,
        "source_signature_verified": False,
        "production_policy_mutated": False,
        "warnings": warnings,
    }


def sweep() -> dict:
    """Exhaustively enumerate a fixed subset of faults and controls (2^10)."""
    names = [
        "authority_valid", "scope_matches", "authority_revoked", "authority_fresh",
        "executor_checks_scope", "executor_checks_revocation", "executor_checks_replay",
        "replayed_idempotency_key", "recipient_observed", "recipient_independent",
    ]
    counts = {"simulated_control_breach": 0, "simulated_effect_uncheckable": 0,
              "simulated_permitted_effect_with_synthetic_receipt": 0, "simulated_no_effect": 0}
    first_examples = {}
    total = 0
    for values in product([False, True], repeat=len(names)):
        s = Scenario(**dict(zip(names, values)))
        result = simulate(s)
        k = result["state"].lower()
        if k not in counts:
            raise AssertionError("missing state denominator")
        counts[k] += 1
        total += 1
        first_examples.setdefault(k, asdict(s))
    assert sum(counts.values()) == total == 1024
    body = {
        "schema": "csoai.synthetic-assurance-fault-sweep/0.1",
        "evidence_state": "EXHAUSTIVE_SYNTHETIC_BOOLEAN_MODEL_ONLY",
        "number_of_binary_factors": len(names),
        "total_cases": total,
        "factor_names": names,
        "counts": counts,
        "first_synthetic_example_by_state": first_examples,
        "actual_human_authority_verified": False,
        "actual_recipient_effect_verified": False,
        "production_policy_mutated": False,
        "not_a_field_probability_distribution": True,
    }
    return body


def correlated_failure_probability(p: float, q: float, n: int) -> dict:
    """Illustrative two-regime mixture: common cause with probability q;
    otherwise n independent barriers each fail with probability p.
    Assumptions do not describe Council's real agent seats."""
    if (isinstance(p, bool) or isinstance(q, bool) or not isinstance(p, (int, float))
            or not isinstance(q, (int, float)) or not math.isfinite(p) or not math.isfinite(q)
            or not (0 <= p <= 1 and 0 <= q <= 1) or isinstance(n, bool)
            or not isinstance(n, int) or not 1 <= n <= 100):
        raise ValueError("invalid modelling parameters")
    independent_only = p ** n
    common_cause = q + (1 - q) * independent_only
    return {
        "schema": "csoai.synthetic-common-cause-model/0.1",
        "individual_conditional_failure_probability_assumed": float(p),
        "common_cause_probability_assumed": float(q),
        "barriers_assumed": n,
        "independent_only_all_fail_probability": independent_only,
        "mixture_all_fail_probability": common_cause,
        "ratio_mixture_to_independent": (common_cause / independent_only) if independent_only else None,
        "note": "HYPOTHETICAL ASSUMPTIONS, NOT OBSERVED MODEL/BFT SAFETY RATE",
        "production_safety_certified": False,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    import pathlib
    body = {
        "sweep": sweep(),
        "illustrative_common_cause": correlated_failure_probability(0.05, 0.02, 3),
    }
    data = json.dumps(body, sort_keys=True, indent=2, allow_nan=False) + "\n"
    dest = pathlib.Path(args.output)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(data, encoding="utf-8")
    print(json.dumps({"output": str(dest), "sha256": hashlib.sha256(data.encode()).hexdigest(),
                      "synthetic_cases": body["sweep"]["total_cases"],
                      "real_effects_tested": 0}, sort_keys=True))


if __name__ == "__main__":
    main()
