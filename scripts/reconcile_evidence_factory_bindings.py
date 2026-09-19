#!/usr/bin/env python3
"""Resolve legacy goal/axis references without promoting plans to measurements.

This offline projection reads a pinned board response and a harness definition.
It never changes the board, runs an adapter, or treats an array position as an ID.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def identifier(value: object) -> str:
    if not isinstance(value, str) or not re.fullmatch(r"[a-z0-9][a-z0-9_-]*", value):
        raise ValueError(f"invalid identifier: {value!r}")
    return value


def unique(values: list[str], label: str) -> None:
    if len(values) != len(set(values)):
        raise ValueError(f"duplicate {label}")


def reconcile(definition: dict, board: dict, sources: dict) -> dict:
    axes = board.get("axes")
    legacy = definition.get("declared_axes")
    if not isinstance(axes, list) or not axes:
        raise ValueError("board axes must be a nonempty array")
    if not isinstance(legacy, list) or not legacy:
        raise ValueError("definition declared_axes must be a nonempty array")
    board_ids = [identifier(a.get("axis")) for a in axes]
    legacy_ids = [identifier(a.get("axis")) for a in legacy]
    unique(board_ids, "board axis")
    unique(legacy_ids, "definition dimension")
    declared = [identifier(g) for g in definition.get("goal_objects", [])]
    unique(declared, "declared goal")
    mapping = definition.get("axis_to_goal_mapping", {})
    unknown_dimensions = sorted(set(mapping) - set(legacy_ids))
    if unknown_dimensions:
        raise ValueError(f"mappings reference absent dimensions: {unknown_dimensions}")

    references: dict[str, list[str]] = {g: [] for g in declared}
    def add_refs(values: list, location: str) -> None:
        if not isinstance(values, list):
            raise ValueError(f"goal references must be an array: {location}")
        for value in values:
            references.setdefault(identifier(value), []).append(location)
    for index, item in enumerate(definition.get("sources_bound_to_harness", [])):
        add_refs(item.get("goal_objects", []), f"sources_bound_to_harness/{index}")
    for dimension, goals in mapping.items():
        add_refs(goals, f"axis_to_goal_mapping/{dimension}")
    for group, goals in definition.get("binding_to_harness", {}).items():
        add_refs(goals, f"binding_to_harness/{group}")

    board_by_id = dict(zip(board_ids, axes))
    unresolved = sorted(set(references) - set(declared))
    goal_registry = [{
        "id": f"goal:{name}", "name": name,
        "definition_state": "DECLARED" if name in declared else "REFERENCED_NOT_DEFINED",
        "referenced_by": sorted(set(locations)),
        "execution_state": "NOT_ESTABLISHED",
    } for name, locations in sorted(references.items())]
    dimensions = []
    collisions = []
    for item in legacy:
        name = item["axis"]
        is_board = name in board_by_id
        goals = mapping.get(name, [])
        row = {
            "id": f"board:{name}" if is_board else f"research:{name}",
            "name": name,
            "kind": "BOARD_REFERENCE" if is_board else "RESEARCH_DIMENSION",
            "historical_definition_position": item.get("slot"),
            "board_axis_id": name if is_board else None,
            "board_status_observed": board_by_id[name].get("status") if is_board else None,
            "goal_ids": [f"goal:{g}" for g in goals],
            "binding_state": "UNRESOLVED_GOAL_DEFINITION" if set(goals) & set(unresolved) else "REFERENCE_ONLY",
            "execution_state": "NOT_ESTABLISHED_BY_MAPPING",
        }
        slot = item.get("slot")
        if isinstance(slot, int) and not isinstance(slot, bool) and 1 <= slot <= len(board_ids):
            occupying = board_ids[slot - 1]
            if occupying != name:
                collisions.append({"historical_position": slot, "definition_dimension": name,
                                   "board_axis_at_that_position": occupying,
                                   "resolution": "USE_NAMESPACED_ID_NEVER_POSITION"})
        dimensions.append(row)

    return {
        "schema": "csoai.evidence-factory-bindings/1",
        "state": "RECONCILED_REFERENCES_WITH_EXPLICIT_GAPS",
        "sources": sources,
        "rules": [
            "Namespaced IDs are identities; historical positions are context only.",
            "Referenced but undefined goals remain blocked for automated interpretation.",
            "Board statuses are observations copied from the pinned response, not new measurements.",
            "Research dimensions never become board slots or measurements through this projection.",
            "No permission, execution, signing, root inclusion, legal conclusion or publication is inferred.",
        ],
        "summary": {
            "board_axes_observed": len(board_ids),
            "definition_dimensions": len(legacy_ids),
            "research_dimensions": sum(d["kind"] == "RESEARCH_DIMENSION" for d in dimensions),
            "declared_goals": len(declared),
            "referenced_undefined_goals": len(unresolved),
            "historical_position_mismatches": len(collisions),
            "new_measurements": 0,
        },
        "goals": goal_registry,
        "dimensions": dimensions,
        "board_axes_without_definition_mapping": [
            {"id": f"board:{name}", "axis": name, "binding_state": "NO_MAPPING_DEFINED"}
            for name in board_ids if name not in mapping
        ],
        "historical_position_mismatches": collisions,
        "unresolved_goal_ids": [f"goal:{g}" for g in unresolved],
        "automatic_execution_authorized": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--definition", type=Path, required=True)
    parser.add_argument("--board", type=Path, required=True)
    parser.add_argument("--board-receipt", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        definition_bytes, board_bytes = args.definition.read_bytes(), args.board.read_bytes()
        receipt = json.loads(args.board_receipt.read_text())
        if receipt.get("raw_sha256") != digest(board_bytes) or receipt.get("http_status") != 200:
            raise ValueError("board receipt does not bind a successful response")
        if not receipt.get("source_url") or not receipt.get("fetched_at"):
            raise ValueError("board receipt requires source URL and fetch time")
        result = reconcile(json.loads(definition_bytes), json.loads(board_bytes), {
            "definition": {"filename": args.definition.name, "sha256": digest(definition_bytes)},
            "board": receipt,
        })
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
    except (ValueError, OSError, KeyError, TypeError) as exc:
        parser.exit(2, f"REFUSING: {exc}\n")
    print(json.dumps(result["summary"], sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
