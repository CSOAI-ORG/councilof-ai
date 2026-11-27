#!/usr/bin/env python3
"""Project nine local artifact slots into Council Space's dated snapshot.

No network, signatures, admissions, user ledgers or external writes. This is a
derived presentation, not an evidence-event or decision store. Supply real
inputs with --bench-dir or BENCH_RESULTS_DIR. Missing inputs stay visible.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent
DEFAULT_OUT = HERE / "public" / "flywheel-snapshot.json"
SCHEMA = "csoai.flywheel-snapshot/0.2"
MAX_INPUT_BYTES = 2_000_000
# Stable IDs preserve the existing galaxy contract. Rows describe input
# artifacts and never establish a running service or a board score.
SOURCES = (
    ("find-besT", "Model comparison", "care", "find_besT_2026-07-30.json"),
    ("n-eff", "Roster diversity", "continuity", "n_eff_diversity_scan.json"),
    ("provbench", "Provenance benchmark", "provenance", "provbench-canonical-bound.json"),
    ("defbench", "Safety benchmark", "safety", "defbench.json"),
    ("govbench", "Governance benchmark", "governance", "system_analysis.json"),
    ("pqcbench", "Signing-chain benchmark", "continuity", "pqcbench.json"),
    ("flywheel-daily", "Daily comparison", "care", "flywheel_daily_latest.json"),
    ("honey-pipe", "Learning library", "care", "sov_kb.json"),
    ("production-ready", "Evidence packet", "care", "production_ready.json"),
)


def parse_time(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.astimezone(timezone.utc) if parsed.tzinfo else None
    except ValueError:
        return None


def number(value: Any) -> bool:
    return (type(value) is int and abs(value) <= 1e308) or (type(value) is float and math.isfinite(value))


def count(value: Any) -> bool:
    return type(value) is int and value >= 0


def metric(source_id: str, data: dict | list) -> str:
    """Allowlisted aggregates only; never copy arbitrary source text."""
    if source_id == "honey-pipe":
        entries = data if isinstance(data, list) else data.get("entries")
        return f"{len(entries)} stored entries" if isinstance(entries, list) else "Entry count not recorded"
    if not isinstance(data, dict):
        return "Metric not recorded"
    if source_id == "find-besT":
        results = data.get("results", data.get("per_model", []))
        rows = results.values() if isinstance(results, dict) else results if isinstance(results, list) else []
        values = [r["composite"] for r in rows if isinstance(r, dict) and number(r.get("composite"))]
        return f"Largest source-reported composite: {max(values):.4f}" if values else "Composite not recorded"
    if source_id == "n-eff" and number(data.get("n_eff")) and data["n_eff"] >= 0:
        gate = data.get("gate_passed")
        suffix = ("passed" if gate else "failed") if type(gate) is bool else None
        return f"Source-reported n_eff: {data['n_eff']:g}" + (f"; source gate {suffix}" if suffix else "")
    if source_id == "defbench":
        stats = data.get("battery_stats", {})
        if isinstance(stats, dict) and count(stats.get("total")):
            return f"Source-reported items: {stats['total']}"
    if source_id == "provbench":
        canonical = data.get("canonical", {})
        upper = canonical.get("rule_of_three_upper") if isinstance(canonical, dict) else None
        if number(upper) and 0 <= upper <= 1:
            return f"Source-reported rule-of-three upper: {upper * 100:g}%"
    if source_id == "production-ready":
        return "Packet present; signature verification not run"
    return "Metric not recorded"


def measured_time(data: dict | list) -> datetime | None:
    # Build time and file mtime cannot establish measurement time.
    if not isinstance(data, dict):
        return None
    for key in ("measured_at", "run_at"):
        if key in data:
            return parse_time(data[key])
    return None


def reject_constant(_: str) -> None:
    raise ValueError("nonfinite")


def read_source(root: Path, filename: str) -> tuple[Any, str, str | None]:
    path = root / filename
    try:
        if not path.resolve().is_relative_to(root.resolve()):
            return None, "OUTSIDE_ROOT", None
        if path.exists() and not path.is_file():
            return None, "UNREADABLE", None
        with path.open("rb") as handle:
            raw = handle.read(MAX_INPUT_BYTES + 1)
        if len(raw) > MAX_INPUT_BYTES:
            return None, "TOO_LARGE", None
        digest = hashlib.sha256(raw).hexdigest()
        data = json.loads(raw, parse_constant=reject_constant)
        if not isinstance(data, dict) and not (filename == "sov_kb.json" and isinstance(data, list)):
            return None, "INVALID_SHAPE", digest
        return data, "AVAILABLE", digest
    except FileNotFoundError:
        return None, "MISSING", None
    except (json.JSONDecodeError, UnicodeDecodeError, ValueError):
        return None, "INVALID_JSON", None
    except OSError:
        return None, "UNREADABLE", None


def build_snapshot(root: Path, as_of: datetime, max_age_days: int = 14) -> dict:
    if as_of.tzinfo is None or max_age_days < 1:
        raise ValueError("timezone-aware as_of and positive max_age_days required")
    as_of = as_of.astimezone(timezone.utc)
    planets = []
    for source_id, name, axis, filename in SOURCES:
        data, source_status, digest = read_source(root, filename)
        measured_at = measured_time(data) if data is not None else None
        if source_status != "AVAILABLE":
            freshness = "UNAVAILABLE"
        elif measured_at is None:
            freshness = "UNKNOWN_TIME"
        elif measured_at > as_of:
            freshness = "FUTURE_DATED"
        elif as_of - measured_at > timedelta(days=max_age_days):
            freshness = "STALE"
        else:
            freshness = "WITHIN_WINDOW"
        row = {
            "id": source_id, "name": name, "axis": axis, "phase": "water",
            "description": "Local artifact metadata; source-reported values; verification and independent admission not established.",
            "metric": metric(source_id, data) if data is not None else "Input not available to this build",
            "source_status": source_status, "source_sha256": digest,
            "freshness": freshness, "signature_verified": False, "admitted": False,
        }
        if measured_at is not None:
            row["last_run_iso"] = measured_at.isoformat()
        planets.append(row)
    return {
        "schema": SCHEMA, "generated_at": as_of.isoformat(),
        "scope": "Nine named local artifact slots only; input availability is not fleet health or global coverage.",
        "freshness_window_days": max_age_days,
        "n_planets": len(planets), "planets": planets,
        "n_citizens": None, "citizens": [],
        "citizen_count_state": "NOT_MEASURED",
        "limitations": [
            "Snapshot build time is not measurement time. Only measured_at or run_at establishes a source-reported run time.",
            "No signature verification, independent admission, human acceptance, customer adoption or revenue check runs here.",
            "No user ledger is read or exported. Missing inputs are not zero results.",
            "Source digests bind the input bytes only; they do not establish truth or authority.",
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bench-dir", type=Path, default=Path(os.environ.get("BENCH_RESULTS_DIR", HERE / "benchmark-results")))
    parser.add_argument("--output", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--as-of", help="Timezone-aware build time for reproducible previews")
    parser.add_argument("--max-age-days", type=int, default=14)
    args = parser.parse_args()
    now = parse_time(args.as_of) if args.as_of else datetime.now(timezone.utc)
    if now is None or args.max_age_days < 1:
        parser.error("--as-of must include a timezone; --max-age-days must be positive")
    snapshot = build_snapshot(args.bench_dir, now, args.max_age_days)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(snapshot, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    available = sum(p["source_status"] == "AVAILABLE" for p in snapshot["planets"])
    print(f"snapshot: {available}/{len(SOURCES)} inputs available; signature verification not run")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
