"""Bounded 3KB reaction record for SovSpace/JSpace/DREAM/Evolve.

The card is a compact deterministic projection of a source event and its frozen
reaction simulation. It is a RECORD, never model weights, never causal proof,
and never execution or promotion authority.
"""
from __future__ import annotations

import hashlib
import json
from typing import Any

MAX_CARD_BYTES = 3 * 1024
FORBIDDEN_PUBLIC_PHRASES = (
    "newton",
    "third law",
    "equal and opposite",
    "conservation of",
    "proven causal",
    "proven downstream",
    "proven effect",
)


def _canon(value: Any) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode()


def _id(value: Any) -> str:
    return hashlib.sha256(_canon(value)).hexdigest()


def _jspace_coordinate(seed: str) -> dict[str, Any]:
    """Deterministic 8x8x8 coordination slot; not a measured semantic score."""
    raw = bytes.fromhex(hashlib.sha256(seed.encode()).hexdigest())
    return {
        "x": raw[0] % 8,
        "y": raw[1] % 8,
        "z": raw[2] % 8,
        "board": "JSPACE_8X8X8",
        "meaning": "COORDINATION_PROJECTION_NOT_MEASUREMENT",
    }


def build_3kb_reaction_card(
    event: dict[str, Any],
    simulation: dict[str, Any],
    dependents: list[str],
) -> dict[str, Any]:
    event_id = str(simulation.get("event_id") or event.get("event_id") or _id(event)[:16])
    simulation_id = str(simulation.get("content_id") or "")
    dep_rows = sorted(set(str(x) for x in dependents))
    dep_digest = _id(dep_rows)
    classes = sorted({
        str(row.get("reaction_class"))
        for row in (simulation.get("branches") or [])
        if row.get("reaction_class")
    })
    horizons = sorted({
        str(row.get("horizon"))
        for row in (simulation.get("branches") or [])
        if row.get("horizon")
    })

    body = {
        "schema": "csoai.3kb-reaction-card/0.1",
        "record_kind": "SOVSPACE_REACTION_RECORD",
        "source": {
            "event_id": event_id,
            "subject_id": event.get("subject_id"),
            "change_state": event.get("change_state"),
            "source_content_id": event.get("current_content_id"),
        },
        "sovspace": {
            "dependency_count": len(dep_rows),
            "dependency_digest": dep_digest,
            "history_rule": "APPEND_ONLY_REACTION_AND_LATER_CALIBRATION",
        },
        "reaction": {
            "simulation_content_id": simulation_id,
            "branch_count": simulation.get("branch_count"),
            "classes": classes,
            "horizons": horizons,
            "counter_reaction_present": "COUNTER_REACTION" in classes,
            "regime_break_present": "REGIME_BREAK" in classes,
            "claim_state": "SYNTHETIC_HYPOTHESES_ONLY",
        },
        "jspace": _jspace_coordinate(event_id + ":" + simulation_id),
        "dream": {
            "mode": "OFFLINE_COUNTERFACTUAL",
            "frozen_at": simulation.get("frozen_at"),
            "state": "FROZEN_FOR_LATER_COMPARISON",
        },
        "evolve": {
            "state": "HOLD_FOR_PROVENANCE_BOUND_OBSERVATION",
            "may_train_production": False,
            "may_promote_claim": False,
            "may_mutate_constitution": False,
        },
        "claim_maintenance": {
            "state": "REGISTER_DEPENDENCY_CHANGE",
            "remeasure_rule": "DIRECT_DEPENDENCIES_ONLY",
        },
        "authority": {
            "execute_external_effect": False,
            "settle_payment": False,
            "sign_or_anchor": False,
            "self_measure": False,
            "self_promote": False,
        },
        "note": (
            "Compact 3KB record of an observed trigger and frozen synthetic reaction set. "
            "The full simulation stays separate; later observed outcomes require provenance "
            "before calibration, training candidacy, measurement or promotion."
        ),
    }
    body["content_id"] = _id(body)
    size = len(_canon(body))
    if size > MAX_CARD_BYTES:
        raise ValueError(f"3KB reaction card exceeds {MAX_CARD_BYTES} bytes: {size}")
    return body


def validate_3kb_reaction_card(card: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if card.get("schema") != "csoai.3kb-reaction-card/0.1":
        errors.append("wrong schema")
    claimed = card.get("content_id")
    body = {k: v for k, v in card.items() if k != "content_id"}
    if claimed != _id(body):
        errors.append("content id mismatch")
    if len(_canon(card)) > MAX_CARD_BYTES:
        errors.append("card exceeds 3KB")
    reaction = card.get("reaction") or {}
    if reaction.get("claim_state") != "SYNTHETIC_HYPOTHESES_ONLY":
        errors.append("synthetic boundary lost")
    if reaction.get("counter_reaction_present") is not True:
        errors.append("counter-reaction missing")
    if reaction.get("regime_break_present") is not True:
        errors.append("regime-break missing")
    evolve = card.get("evolve") or {}
    for key in ("may_train_production", "may_promote_claim", "may_mutate_constitution"):
        if evolve.get(key) is not False:
            errors.append("evolve authority leak: " + key)
    auth = card.get("authority") or {}
    for key in (
        "execute_external_effect",
        "settle_payment",
        "sign_or_anchor",
        "self_measure",
        "self_promote",
    ):
        if auth.get(key) is not False:
            errors.append("authority leak: " + key)
    js = card.get("jspace") or {}
    if not all(isinstance(js.get(k), int) and 0 <= js[k] < 8 for k in ("x", "y", "z")):
        errors.append("invalid JSpace coordinate")
    rendered = _canon(card).decode().lower()
    for phrase in FORBIDDEN_PUBLIC_PHRASES:
        if phrase in rendered:
            errors.append("forbidden public rigor phrase: " + phrase)
    return errors
