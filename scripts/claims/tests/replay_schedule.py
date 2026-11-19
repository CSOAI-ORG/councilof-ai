#!/usr/bin/env python3
"""Synthetic periodic-maintenance replay, not observed savings or production proof.

Identical worlds, scripted check outcomes, cost limits, mandatory ordering and
exploration reserve are used for all strategies. Only discretionary due ordering
differs. Source retry/recheck boundary behavior is covered separately by unit tests.
"""
from datetime import datetime, timedelta, timezone
from fractions import Fraction
import importlib.util
import json
from pathlib import Path
import random

SPEC = importlib.util.spec_from_file_location("scheduler", Path(__file__).parents[1] / "recheck_schedule.py")
scheduler = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(scheduler)
START = datetime(2026, 11, 1, tzinfo=timezone.utc)
STEPS, POPULATION, BUDGET, MAX_ITEMS = 48, 20, 12, 6
SEEDS = (7, 11, 23)
STRATEGIES = ("bounded_advice", "oldest_first", "round_robin")


def stamp(value):
    return value.isoformat().replace("+00:00", "Z")


def baseline(advice, strategy, cursor):
    """Reuse production classification and constraints, change due ordering only."""
    eligible_reasons = {"MANDATORY", "EXPLORATION", "DUE_PRIORITY", "EXPLORATION_SPARE_CAPACITY",
                        "BUDGET_OR_ITEM_LIMIT", "UNFUNDED_MANDATORY"}
    eligible = [i for i in advice["items"] if i["decision_reason"] in eligible_reasons]
    chosen, remaining = [], advice["budget_units"]
    def ref(item):
        return item["work_key"]["claim_ref"]
    def score(item):
        return Fraction(**item["ordering_score"])
    def choose(items, limit=MAX_ITEMS):
        nonlocal remaining
        count = 0
        for item in items:
            if len(chosen) >= MAX_ITEMS or count >= limit:
                break
            if ref(item) in chosen or item["estimated_cost_units"] > remaining:
                continue
            remaining -= item["estimated_cost_units"]
            chosen.append(ref(item))
            count += 1
    choose(sorted((i for i in eligible if i["mandatory"]), key=lambda i: (
        not i["deadline_due"], scheduler.instant(i["deadline_at"], "deadline_at") if i["deadline_at"] else datetime.max.replace(tzinfo=timezone.utc),
        -i["waiting_seconds"], -score(i), ref(i))))
    unknown = sorted((i for i in eligible if not i["mandatory"] and i["freshness_state"] == "UNKNOWN"),
                     key=lambda i: (-i["waiting_seconds"], ref(i)))
    choose(unknown, 1)
    due = [i for i in eligible if i["freshness_state"] != "UNKNOWN"]
    if strategy == "oldest_first":
        due.sort(key=lambda i: (-(i["age_seconds"] or 0), -i["waiting_seconds"], ref(i)))
    else:
        due.sort(key=lambda i: ((int(ref(i)[1:]) - cursor) % POPULATION, ref(i)))
    choose(due)
    choose(unknown)
    return chosen, advice["budget_units"] - remaining


def replay(seed, strategy):
    rng = random.Random(seed)
    specs = [{"cost": rng.randint(1, 4), "max_age_hours": rng.randint(3, 12),
              "impact": rng.randint(1, 5), "initial_age_hours": rng.randint(1, 12)} for _ in range(POPULATION)]
    # This world is generated once per seed, independent of strategy or selection.
    changes = [[rng.random() < 0.08 for _ in specs] for _ in range(STEPS)]
    successes = [[rng.random() >= 0.10 for _ in specs] for _ in range(STEPS)]
    version, captured = [0] * POPULATION, [None if i < 4 else 0 for i in range(POPULATION)]
    last = [None if i < 4 else START - timedelta(hours=s["initial_age_hours"]) for i, s in enumerate(specs)]
    pending = [None] * POPULATION
    rows = [{"event_seq": i, "observed_at": stamp(START), "subject_sealed_id": "0123456789abcdef",
             "claim_ref": f"c{i}", "reaction_state": "NO_CHANGE", "receipt_state": None,
             "counter_reaction": {"required": False}} for i in range(POPULATION)]
    projection = {"schema": scheduler.REACTION_SCHEMA, "since_exclusive": -1,
                  "source_verification": "VERIFIES", "n_events": POPULATION,
                  "by_state": {"NO_CHANGE": POPULATION}, "n_counter_reaction_required": 0, "reactions": rows}
    metrics = {"spent_cost_units": 0, "selected_checks": 0, "scripted_successes": 0,
               "scripted_failures": 0, "hidden_weighted_stale_claim_steps": 0,
               "unknown_claim_steps": 0, "missed_policy_deadline_claim_steps": 0,
               "max_wait_hours": 0}
    cursor = 0
    for tick in range(STEPS):
        now = START + timedelta(hours=tick)
        claims = []
        for i, spec in enumerate(specs):
            version[i] += int(changes[tick][i])
            due = last[i] is None or (now - last[i]).total_seconds() >= spec["max_age_hours"] * 3600
            pending[i] = (pending[i] or now) if due else None
            claims.append({"subject_sealed_id": "0123456789abcdef", "claim_ref": f"c{i}",
                           "method_version": "synthetic-periodic/1", "provider_id": "offline-fixture",
                           "estimated_cost_units": spec["cost"], "max_age_seconds": spec["max_age_hours"] * 3600,
                           "impact_weight": spec["impact"], "last_success_at": stamp(last[i]) if last[i] else None,
                           "first_pending_at": stamp(pending[i]) if pending[i] else None,
                           "deadline_at": stamp((last[i] or START) + timedelta(hours=2 * spec["max_age_hours"]))})
        policy = {"claims": claims, "budget_units": BUDGET, "max_items": MAX_ITEMS,
                  "exploration_slots": 1, "max_wait_seconds": 8 * 3600,
                  "allowed_provider_ids": ["offline-fixture"]}
        advice = scheduler.build_schedule(projection, policy, stamp(now))
        if strategy == "bounded_advice":
            chosen = [key["claim_ref"] for key in advice["selected_order"]]
            spent = advice["spent_cost_units"]
        else:
            chosen, spent = baseline(advice, strategy, cursor)
        assert spent <= BUDGET and len(chosen) <= MAX_ITEMS
        if chosen:
            cursor = (int(chosen[-1][1:]) + 1) % POPULATION
        metrics["spent_cost_units"] += spent
        metrics["selected_checks"] += len(chosen)
        for ref in chosen:
            i = int(ref[1:])
            if successes[tick][i]:
                # Only this synthetic simulator records success in its next input.
                last[i], captured[i], pending[i] = now, version[i], None
                metrics["scripted_successes"] += 1
            else:
                metrics["scripted_failures"] += 1
        for i, spec in enumerate(specs):
            metrics["hidden_weighted_stale_claim_steps"] += spec["impact"] * int(captured[i] != version[i])
            metrics["unknown_claim_steps"] += int(captured[i] is None)
            deadline = (last[i] or START) + timedelta(hours=2 * spec["max_age_hours"])
            metrics["missed_policy_deadline_claim_steps"] += int(deadline <= now)
            if pending[i]:
                metrics["max_wait_hours"] = max(metrics["max_wait_hours"], int((now - pending[i]).total_seconds() // 3600))
    return {"seed": seed, "strategy": strategy, **metrics}


def compare():
    runs = [replay(seed, strategy) for seed in SEEDS for strategy in STRATEGIES]
    totals = {}
    for strategy in STRATEGIES:
        grouped = [run for run in runs if run["strategy"] == strategy]
        totals[strategy] = {key: (max(r[key] for r in grouped) if key == "max_wait_hours" else sum(r[key] for r in grouped))
                            for key in grouped[0] if key not in ("seed", "strategy")}
    return {"evidence_kind": "SYNTHETIC_OFFLINE_REPLAY", "seeds": SEEDS,
            "steps_per_seed": STEPS, "claims_per_seed": POPULATION,
            "step_hours": 1, "budget_units_per_step": BUDGET, "max_items_per_step": MAX_ITEMS,
            "world_change_probability_per_claim_step": 0.08, "scripted_check_failure_probability": 0.10,
            "common_policy": "same mandatory ordering, exploration reserve and hard limits; discretionary due order differs",
            "boundaries": ["Invented worlds and caller weights, not observed source changes, costs, risk or savings.",
                           "Only the simulator creates successful checks; scheduling advice never marks a claim fresh.",
                           "Periodic NO_CHANGE input only; reaction/retry semantics are tested separately.",
                           "No calibrated VOI, monetary return, adoption, novelty or production-superiority claim."],
            "totals": totals, "runs": runs}


if __name__ == "__main__":
    print(json.dumps(compare(), indent=2, sort_keys=True))
