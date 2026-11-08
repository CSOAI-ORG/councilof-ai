"""Bounded paired plumbing measurements. No model/human or GSPC admission."""
from .engine import simulate, digest, fingerprint
from .dependencies import fabric
from . import VERSION

SCHEMA = "csoai.rehearsal-measurement/0.1"
METHOD = "paired-procurement-plumbing/1"
MAX_RECORD_TICKS = 2_000_000
DEFAULTS = {"seeds": [42, 43, 44], "population": 1000, "rounds": 10}
CASES = ("revoked-during-run", "unchanged-control", "expired-control", "revoked-at-start")


def configure_suite(params):
    if not isinstance(params, dict) or set(params) - set(DEFAULTS):
        raise ValueError("Unsupported measurement fields")
    cfg = {**DEFAULTS, **params}
    seeds = cfg["seeds"]
    if (not isinstance(seeds, list) or not 1 <= len(seeds) <= 8 or
            any(type(s) is not int or not 0 <= s < 2**32 for s in seeds) or
            len(set(seeds)) != len(seeds)):
        raise ValueError("Use 1 to 8 distinct integer seeds from 0 to 4294967295")
    for key, low, high in (("population", 1, 10000), ("rounds", 4, 50)):
        if type(cfg[key]) is not int or not low <= cfg[key] <= high:
            raise ValueError(f"{key} must be an integer from {low} to {high}")
    work = len(seeds) * len(CASES) * 2 * cfg["population"] * cfg["rounds"]
    if work > MAX_RECORD_TICKS:
        raise ValueError("Measurement exceeds the 2000000 synthetic record-tick budget")
    return {**cfg, "seeds": list(seeds)}


def measure_core(core):
    """New decisions and retained state have different denominators."""
    population = core["config"]["population"]
    permits = {e["tick"]: e["permit"] for e in core["trace"]}
    completed = revoked = retained = blocked = 0
    for frame in core["frames"]:
        if permits[frame["tick"]] == "ALLOWED":
            completed += population - frame["undecided"]
            revoked += frame["revoked_A_selected"]
        else:
            blocked += population
            retained += frame["revoked_A_selected"]
    slots = population * len(core["frames"])
    return {
        "scheduled_decision_slots": slots,
        "completed_decisions": completed,
        "blocked_decision_slots": blocked,
        "revoked_evidence_decisions": revoked,
        "retained_revoked_record_ticks": retained,
        "completion_rate": completed / slots,
        "revoked_evidence_decision_rate": revoked / completed if completed else None,
    }


def run_suite(params):
    cfg = configure_suite(params)
    engine_pin = fingerprint()
    pairs = []
    fixture_updates = 0
    for seed in cfg["seeds"]:
        for case in CASES:
            scenario = {"seed": seed, "population": cfg["population"], "rounds": cfg["rounds"],
                        "revocation_tick": cfg["rounds"] // 2,
                        "permit_expires_tick": cfg["rounds"]}
            if case == "unchanged-control":
                scenario["revocation_tick"] = cfg["rounds"]
            elif case == "expired-control":
                scenario["permit_expires_tick"] = 0
            elif case == "revoked-at-start":
                scenario["revocation_tick"] = 0
            runs = {}
            for mode in ("baseline", "evidence-aware"):
                core = simulate({**scenario, "intervention": mode})
                fixture_updates += core["counters"]["fixture_lookup_updates"]
                runs[mode] = {"scenario_id": core["scenario_id"], "core_sha256": digest(core),
                              "metrics": measure_core(core), "counters": core["counters"]}
            a, b = (runs[m]["metrics"] for m in ("baseline", "evidence-aware"))
            checks = {
                "equal_completion": a["completed_decisions"] == b["completed_decisions"],
                "equal_blocked_slots": a["blocked_decision_slots"] == b["blocked_decision_slots"],
                "candidate_does_not_add_revoked_decisions":
                    b["revoked_evidence_decisions"] <= a["revoked_evidence_decisions"],
            }
            if case == "unchanged-control":
                checks["unchanged_input_equal_metrics"] = a == b
            if case == "expired-control":
                checks["no_execution_no_rate_claim"] = (
                    a["completed_decisions"] == b["completed_decisions"] == 0 and
                    a["revoked_evidence_decision_rate"] is None and
                    b["revoked_evidence_decision_rate"] is None)
            pairs.append({"case": case, "scenario": scenario, "runs": runs,
                          "candidate_minus_baseline_revoked_decisions":
                              b["revoked_evidence_decisions"] - a["revoked_evidence_decisions"],
                          "controls": checks})
    counters = {
        "population_records_per_episode": cfg["population"],
        "paired_cases": len(pairs), "simulation_episodes": len(pairs) * 2,
        "simulated_record_instances": cfg["population"] * len(pairs) * 2,
        "scheduled_record_ticks": cfg["population"] * cfg["rounds"] * len(pairs) * 2,
        "fixture_lookup_updates": fixture_updates, "surrogate_updates": 0,
        "active_model_agents": 0, "actual_model_calls": 0, "model_response_replays": 0,
        "consenting_human_participants": 0,
    }
    summary = {
        "controls_pass": all(all(p["controls"].values()) for p in pairs),
        "discriminating_pairs": sum(p["candidate_minus_baseline_revoked_decisions"] < 0 for p in pairs),
        "candidate_minus_baseline_revoked_decisions":
            sum(p["candidate_minus_baseline_revoked_decisions"] for p in pairs),
        "completed_decisions": {
            mode: sum(p["runs"][mode]["metrics"]["completed_decisions"] for p in pairs)
            for mode in ("baseline", "evidence-aware")},
        "claim_scope": "Declared deterministic synthetic rules only",
        "model_improvement_established": False, "human_transfer_established": False,
        "gspc_admitted": False, "promotion_allowed": False,
    }
    limits = [
        "Cases are declared plumbing controls, not secret held-out tests or human forecasts.",
        "Seed variants do not establish independent human samples or model capability.",
        "No model calls, human participation, weight changes or production action.",
        "Internal replay is not independent observation, authentication or GSPC admission.",
        "A zero-decision episode has a null error rate, not a perfect safety score.",
    ]
    event = fabric.build(
        subject={"kind": "sandbox_run", "locator": "sha256:" + digest(cfg)},
        claim={"text": "Paired deterministic rehearsal plumbing measurement"},
        method={"id": METHOD, "version": VERSION, "holder": "csoai",
                "code_sha256": engine_pin},
        declared={"suite_config": cfg, "cases": list(CASES), "engine_fingerprint": engine_pin},
        observed={"summary": summary, "counters": counters,
                  "pairs_sha256": digest(pairs)},
        state="UNMEASURED", value=None, limits=limits)
    payload = {"schema": SCHEMA, "method": METHOD, "engine_version": VERSION,
               "engine_fingerprint": engine_pin, "config": cfg,
               "pairs": pairs, "summary": summary, "counters": counters,
               "evidence_events": [event], "limits": limits}
    return {**payload, "report_id": "sha256:" + digest(payload)}


def verify_suite(report):
    if not isinstance(report, dict) or report.get("schema") != SCHEMA:
        raise ValueError("Unsupported measurement report")
    if report.get("engine_fingerprint") != fingerprint():
        raise ValueError("Different engine bytes; replay requires the pinned implementation")
    replayed = run_suite(report.get("config"))
    if fabric.jcs(replayed) != fabric.jcs(report):
        raise ValueError("Measurement report does not match deterministic replay")
    return {"state": "REPLAY_MATCH", "report_id": report["report_id"],
            "signature_verified": False, "independent_observer": False,
            "human_authority": False, "gspc_admitted": False, "promotion_allowed": False}
