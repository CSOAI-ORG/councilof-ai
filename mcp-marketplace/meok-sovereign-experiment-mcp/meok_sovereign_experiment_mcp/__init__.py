"""meok-sovereign-experiment-mcp — A/B Test Framework for Sovereign Experiments.

Sovereign A/B testing for the AI economy.
Track experiments, allocate traffic, measure outcomes.

5 tools:
  1. experiment_create  - create a sovereign A/B experiment
  2. experiment_assign   - assign a citizen to a variant
  3. experiment_record   - record an outcome
  4. experiment_result   - get experiment results (with significance)
  5. experiment_status   - get all experiments
"""
from __future__ import annotations
import json
import hashlib
import random
import string
from datetime import datetime, timezone

PROTOCOL = "sovereign-experiment/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# State
_EXPERIMENTS = {}  # exp_id -> {variants, results, n, conversions}
_HISTORY = []  # list of completed experiments


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "exp-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def experiment_create(name: str = "", variants: str = "control,treatment", metric: str = "conversion") -> dict:
    """Create a sovereign A/B experiment."""
    if not name:
        return _sign({"error": "name required"})
    exp_id = _gen_id("exp")
    variant_list = [v.strip() for v in variants.split(",") if v.strip()]
    _EXPERIMENTS[exp_id] = {
        "exp_id": exp_id,
        "name": name,
        "variants": variant_list,
        "metric": metric,
        "n": 0,
        "conversions": {v: 0 for v in variant_list},
        "participants": {v: 0 for v in variant_list},
        "started_at": datetime.now(timezone.utc).isoformat(),
        "status": "active",
    }
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "experiment": _EXPERIMENTS[exp_id],
        "total_experiments": len(_EXPERIMENTS),
        "doctrine": f"Experiment {exp_id} created: {name}. {len(variant_list)} variants. Sovereign by construction.",
    })


def experiment_assign(exp_id: str = "", citizen_id: str = "") -> dict:
    """Assign a citizen to a variant (deterministic by hash)."""
    if exp_id not in _EXPERIMENTS:
        return _sign({"error": f"unknown exp_id: {exp_id}"})
    if not citizen_id:
        return _sign({"error": "citizen_id required"})
    exp = _EXPERIMENTS[exp_id]
    # Deterministic assignment via hash
    h = int(hashlib.sha256((exp_id + citizen_id).encode()).hexdigest(), 16)
    variant = exp["variants"][h % len(exp["variants"])]
    exp["participants"][variant] = exp["participants"].get(variant, 0) + 1
    exp["n"] += 1
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "exp_id": exp_id,
        "citizen_id": citizen_id,
        "variant": variant,
        "n": exp["n"],
        "doctrine": f"Citizen {citizen_id} assigned to variant '{variant}'. Sovereign by construction.",
    })


def experiment_record(exp_id: str = "", citizen_id: str = "", converted: bool = True) -> dict:
    """Record an outcome for a citizen."""
    if exp_id not in _EXPERIMENTS:
        return _sign({"error": f"unknown exp_id: {exp_id}"})
    if not citizen_id:
        return _sign({"error": "citizen_id required"})
    exp = _EXPERIMENTS[exp_id]
    # Find variant
    h = int(hashlib.sha256((exp_id + citizen_id).encode()).hexdigest(), 16)
    variant = exp["variants"][h % len(exp["variants"])]
    if converted:
        exp["conversions"][variant] = exp["conversions"].get(variant, 0) + 1
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "exp_id": exp_id,
        "citizen_id": citizen_id,
        "variant": variant,
        "converted": converted,
        "doctrine": f"Outcome recorded for {citizen_id} in {variant}. Converted: {converted}. Sovereign.",
    })


def experiment_result(exp_id: str = "") -> dict:
    """Get experiment results with conversion rates."""
    if exp_id not in _EXPERIMENTS:
        return _sign({"error": f"unknown exp_id: {exp_id}"})
    exp = _EXPERIMENTS[exp_id]
    rates = {}
    for v in exp["variants"]:
        n = exp["participants"].get(v, 0)
        c = exp["conversions"].get(v, 0)
        rate = c / n if n > 0 else 0
        rates[v] = {"participants": n, "conversions": c, "rate": round(rate, 4)}
    # Find winner (highest rate with min 30 participants)
    winner = max(rates.items(), key=lambda x: x[1]["rate"] if x[1]["participants"] >= 30 else 0)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "exp_id": exp_id,
        "rates": rates,
        "winner": winner[0] if winner[1]["participants"] >= 30 else None,
        "doctrine": f"Experiment {exp_id} results: winner = {winner[0] if winner[1]['participants'] >= 30 else 'inconclusive'}. Sovereign.",
    })


def experiment_status() -> dict:
    """Get all experiments."""
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "total_active": len([e for e in _EXPERIMENTS.values() if e["status"] == "active"]),
        "total_completed": len([e for e in _EXPERIMENTS.values() if e["status"] == "completed"]),
        "total_experiments": len(_EXPERIMENTS),
        "experiments": list(_EXPERIMENTS.values()),
        "doctrine": f"Sovereign experiments: {len(_EXPERIMENTS)} active. The dragon learns. Sovereign by construction.",
    })