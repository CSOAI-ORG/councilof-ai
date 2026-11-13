"""Deterministic synthetic procurement; no models, network, or outside effects."""
import copy
import hashlib
import random
from pathlib import Path
from .dependencies import fabric, tempo, ROOT

DEFAULTS = {"seed": 42, "population": 1000, "rounds": 10,
            "intervention": "evidence-aware", "revocation_tick": 3,
            "permit_expires_tick": 50}
MODES = ("baseline", "evidence-aware")
SUPPLIERS = [{"id": "A", "label": "Supplier A", "cost": 10},
             {"id": "B", "label": "Supplier B", "cost": 12},
             {"id": "C", "label": "Supplier C", "cost": 15}]


def configure(params):
    if not isinstance(params, dict) or set(params) - set(DEFAULTS):
        raise ValueError("Unsupported scenario fields")
    cfg = {**DEFAULTS, **params}
    for name, low, high in (("seed", 0, 2**32-1), ("population", 1, 10000),
                            ("rounds", 1, 50), ("revocation_tick", 0, 50),
                            ("permit_expires_tick", 0, 50)):
        if type(cfg[name]) is not int or not low <= cfg[name] <= high:
            raise ValueError(f"{name} must be an integer from {low} to {high}")
    if cfg["intervention"] not in MODES:
        raise ValueError("Unknown intervention")
    return cfg


def digest(value):
    return hashlib.sha256(fabric.jcs(value)).hexdigest()


def _source_fingerprint():
    paths = sorted((ROOT / "rehearsal").glob("*.py"))
    paths += sorted((ROOT / "third_party").rglob("*.py"))
    entries = [(p.relative_to(ROOT).as_posix(), hashlib.sha256(p.read_bytes()).hexdigest())
               for p in paths]
    entries.append(("../evidence-fabric/event.py",
                    hashlib.sha256((ROOT.parent / "evidence-fabric/event.py").read_bytes()).hexdigest()))
    return digest(entries)


def fingerprint():
    if _source_fingerprint() != _LOADED_SOURCE_FINGERPRINT:
        raise ValueError("Source files changed while this process was running. Restart with the exact source version.")
    return _LOADED_SOURCE_FINGERPRINT


class SimulationPermit:
    """Only a logical-tick permit for this in-memory fixture; no human authority."""
    def __init__(self, scenario_id, expires_tick):
        self.scenario_id, self.expires_tick = scenario_id, expires_tick
        self.revoked, self.consumed = False, set()

    def consume(self, scenario_id, action, tick):
        if self.revoked:
            return "REVOKED"
        if scenario_id != self.scenario_id or action != "advance-simulation":
            return "SCOPE_MISMATCH"
        if type(tick) is not int or tick < 0 or tick >= self.expires_tick:
            return "EXPIRED"
        if tick in self.consumed:
            return "REPLAY_REFUSED"
        self.consumed.add(tick)
        return "ALLOWED"


def simulate(params):
    cfg = configure(params)
    sid = "sha256:" + digest(cfg)
    rng = random.Random(cfg["seed"])
    profiles = [rng.randrange(3) for _ in range(cfg["population"])]
    # Three declared synthetic purchasing preferences, not real demographic profiles.
    costs = ((10, 12, 15), (16, 12, 15), (18, 17, 15))
    # Small fixture lookup, not a learned/distilled population model.
    table = {(profile, revoked): min(
        [s for s in range(3) if not (revoked and s == 0)],
        key=lambda s: (costs[profile][s], s))
        for profile in range(3) for revoked in (False, True)}
    permit = SimulationPermit(sid, cfg["permit_expires_tick"])
    queue = tempo.Tempo()
    for tick in range(cfg["rounds"]):
        queue.push(tick, "update", priority=1)
        queue.push(tick, "readout", priority=9)
    choices = [-1] * cfg["population"]
    frames, events = [], []
    counters = {"population_records": cfg["population"], "active_model_agents": 0,
                "model_calls": 0, "surrogate_updates": 0, "fixture_lookup_updates": 0,
                "human_participants": 0, "denied_ticks": 0, "permitted_ticks": 0,
                "selection_updates_after_revocation": 0, "new_revoked_A_selections": 0}
    while len(queue):
        tick, kind, _ = queue.pop_batch()
        revoked = tick >= cfg["revocation_tick"]
        if kind == "update":
            outcome = permit.consume(sid, "advance-simulation", tick)
            if outcome == "ALLOWED":
                visible_revocation = revoked and cfg["intervention"] == "evidence-aware"
                choices = [table[(profile, visible_revocation)] for profile in profiles]
                counters["fixture_lookup_updates"] += len(choices)
                counters["permitted_ticks"] += 1
                if revoked:
                    counters["selection_updates_after_revocation"] += len(choices)
                    counters["new_revoked_A_selections"] += choices.count(0)
            else:
                counters["denied_ticks"] += 1
            events.append({"tick": tick, "kind": "decision", "permit": outcome,
                           "source_revision": "supplier-A-revoked" if revoked else "initial"})
        else:
            counts = [choices.count(s) for s in range(3)]
            frames.append({"tick": tick, "counts": counts, "undecided": choices.count(-1),
                           "sample_choices": choices[:120],
                           "permit": outcome, "updated": outcome == "ALLOWED",
                           "new_revoked_A_selections": counts[0] if revoked and outcome == "ALLOWED" else 0,
                           "revoked_A_selected": counts[0] if revoked else 0,
                           "evidence_A": "revoked" if revoked else "current"})
    nodes = [{"id": f"synthetic-{i:05d}", "profile": profiles[i],
              "lat": (-28, 51, 36)[i % 3] + rng.uniform(-9, 9),
              "lng": (135, -1, -98)[i % 3] + rng.uniform(-14, 14),
              "supplier": choices[i]} for i in range(min(cfg["population"], 120))]
    if not counters["permitted_ticks"]:
        lesson = "No selection update was permitted. This run does not test evidence handling."
    elif not any(f["evidence_A"] == "revoked" for f in frames):
        lesson = "Revocation was outside this run's timeline; revoked-evidence handling was not tested."
    elif not counters["selection_updates_after_revocation"]:
        lesson = "No selection update was permitted after revocation. Retained selections are not new decisions."
    elif counters["new_revoked_A_selections"]:
        lesson = "New synthetic selections used revoked evidence. Compare the controlled interventions."
    else:
        lesson = "Permitted updates referenced no revoked record. Compare the baseline before attributing a difference."
    return {"scenario_id": sid, "config": cfg, "suppliers": copy.deepcopy(SUPPLIERS),
            "frames": frames, "trace": events, "sampled_nodes": nodes,
            "counters": counters, "lesson": lesson,
            "limits": ["Synthetic rule fixture; no population forecast or model evaluation.",
                       "Selection updates count record-ticks, not unique people or real executions.",
                       "No authenticated human approval or external execution.",
                       "Globe shows at most 120 synthetic records; coordinates are illustrative.",
                       "No GSPC admission, signature, certification, payment or training reuse."]}


# Cached modules must never claim a newer on-disk implementation after an update.
_LOADED_SOURCE_FINGERPRINT = _source_fingerprint()
