"""Select mill targets from commission feeds; a priority is not a fulfilled measurement.

Prefer GET /api/commission-queue (schema csoai.commission-queue/0.1): only fulfillment=QUEUED
with a non-null model become priority ids. UNFULFILLABLE SKUs stay receipt-only — never injected.
Legacy GET /api/commissions still accepted; if model/fulfillment fields exist, honor them.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

_SKU_UNFULFILLABLE = re.compile(r"^(payai-wrapper|sku:)|wrapper-\d", re.I)


def _valid_id(s: str) -> bool:
    return bool(s) and "\n" not in s and "\r" not in s


def select_queue(payload: dict, axis: str) -> list[str]:
    """Mill-visible queue: QUEUED + model only. Payment never MEASURED."""
    if not isinstance(payload, dict) or payload.get("schema") != "csoai.commission-queue/0.1":
        raise ValueError("commission-queue feed unavailable or wrong schema")
    if payload.get("status") != "MEASURED" or payload.get("rows") is None:
        raise ValueError("commission-queue feed unavailable or unreadable")
    rows = payload.get("rows")
    if not isinstance(rows, list):
        raise ValueError("commission-queue rows missing")
    targets: set[str] = set()
    for record in rows:
        if not isinstance(record, dict):
            raise ValueError("invalid commission-queue row")
        fulfillment = record.get("fulfillment")
        if fulfillment == "UNFULFILLABLE":
            continue
        if fulfillment not in (None, "QUEUED"):
            raise ValueError("invalid fulfillment")
        model = record.get("model")
        if not isinstance(model, str) or not model.strip() or not _valid_id(model.strip()):
            # null/blank model ⇒ not millable even if status says QUEUED
            continue
        if not hub_routable(record, model):
            # Ollama tags (name:tag) belong to the RunPod KEEP worker (runpod_commission_dispatch),
            # not the Hub mill: the mill's probe bypass for priority ids spent the whole grade
            # budget of controlled run 34810632210 on clan-csoai-plain:latest (UNCHECKABLE on
            # every Hub provider). Payment is still honoured — on the rail that can serve it.
            continue
        requested_axis = record.get("axis") or record.get("bank")
        if requested_axis is not None and (
            not isinstance(requested_axis, str) or not requested_axis.strip()
        ):
            raise ValueError("invalid requested axis/bank")
        if requested_axis is None or requested_axis == axis:
            targets.add(model.strip())
    return sorted(targets)


def hub_routable(record: dict, model: str) -> bool:
    """True only for subjects the Hub mill can grade: typed hub_model, or an untyped org/name slug.
    ollama_model (name:tag) and anything else typed non-hub are for the RunPod worker."""
    kind = record.get("subject_kind")
    if kind == "hub_model":
        return True
    if kind is not None:
        return False
    return "/" in model and ":" not in model


def select_commissions(payload: dict, axis: str) -> list[str]:
    """Legacy /api/commissions: prefer model when present; skip UNFULFILLABLE / SKU wrappers."""
    if (
        not isinstance(payload, dict)
        or payload.get("schema") not in ("csoai.commissions/0.1", "csoai.commissions/0.2")
        or payload.get("status") != "MEASURED"
        or payload.get("records_unreadable") != 0
    ):
        raise ValueError("commission feed unavailable or unreadable")
    records = payload.get("commissions")
    if not isinstance(records, list):
        raise ValueError("commission records missing")
    targets: set[str] = set()
    for record in records:
        if not isinstance(record, dict):
            raise ValueError("invalid commission record")
        if record.get("fulfillment") == "UNFULFILLABLE":
            continue
        subject = record.get("subject")
        model = record.get("model")
        mill_id = None
        if isinstance(model, str) and model.strip() and _valid_id(model.strip()):
            if not hub_routable(record, model.strip()):
                continue
            mill_id = model.strip()
        elif isinstance(subject, str) and subject.strip() and _valid_id(subject.strip()):
            if _SKU_UNFULFILLABLE.search(subject.strip()):
                continue
            mill_id = subject.strip()
        else:
            raise ValueError("invalid commission subject/model")
        requested_axis = record.get("axis") or record.get("bank")
        if requested_axis is not None and (
            not isinstance(requested_axis, str) or not requested_axis.strip()
        ):
            raise ValueError("invalid requested axis")
        if requested_axis is None or requested_axis == axis:
            targets.add(mill_id)
    return sorted(targets)


def select(payload: dict, axis: str) -> list[str]:
    if isinstance(payload, dict) and payload.get("schema") == "csoai.commission-queue/0.1":
        return select_queue(payload, axis)
    return select_commissions(payload, axis)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--axis", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    subjects = select(json.loads(Path(args.input).read_text()), args.axis)
    Path(args.output).write_text("".join(s + "\n" for s in subjects))
