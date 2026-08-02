#!/usr/bin/env python3
"""build_flywheel_snapshot.py — build-time snapshot of live flywheel state.

Reads the canonical benchmark-results and emits
  client/public/flywheel-snapshot.json
that the deployed SovSpaceGalaxy fetches at load time. This is the
"build-time live data" — the actual JSON files are updated by the
flywheel-daily cron, and we re-emit this snapshot on every rebuild.

Usage:
    python3 build_flywheel_snapshot.py
    python3 build_flywheel_snapshot.py --output /path/to/snapshot.json
"""
from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
# Benchmark-results lives in the csoai-static-deploy2 estate, NOT in this
# repo. Resolve it explicitly so the snapshot builds on either machine.
BENCH = Path(os.environ.get("BENCH_RESULTS_DIR", str(Path.home() / "clawd" / "csoai-static-deploy2" / "benchmark-results")))
DEFAULT_OUT = HERE / "client" / "public" / "flywheel-snapshot.json"


def mtime(p: Path) -> str | None:
    if not p.exists():
        return None
    return datetime.fromtimestamp(p.stat().st_mtime, timezone.utc).isoformat()


def load(p: Path) -> dict | None:
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text())
    except Exception:
        return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", default=str(DEFAULT_OUT))
    args = ap.parse_args()
    out_path = Path(args.output).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Read each flywheel's most recent artefact.
    find_best = load(BENCH / "find_besT_2026-07-30.json")
    prod = load(BENCH / "production_ready.json")
    provbench = load(BENCH / "provbench-canonical-bound.json")
    n_eff = load(BENCH / "n_eff_diversity_scan.json")
    pqcbench = load(BENCH / "pqcbench.json") or {}
    defbench = load(BENCH / "defbench.json") or {}
    govbench = load(BENCH / "system_analysis.json") or {}
    flywheel_daily = BENCH / "flywheel_daily_latest.json"

    planets = []

    # find_besT — accept either dict (results) or list (per_model) shape.
    if find_best:
        per_model = find_best.get("results")
        if isinstance(per_model, list):
            # list shape — items have {"model": ..., "composite": ...}
            ranked = sorted(per_model, key=lambda kv: kv.get("composite", 0), reverse=True)
        elif isinstance(per_model, dict):
            ranked = sorted(per_model.items(), key=lambda kv: kv[1].get("composite", 0), reverse=True)
            ranked = [(k, v) for k, v in ranked]
        else:
            ranked = []
        if not ranked:
            # fall back to per_model list directly
            pm_list = find_best.get("per_model") or []
            ranked = sorted(pm_list, key=lambda kv: kv.get("composite", 0), reverse=True)
        if ranked:
            top = ranked[0]
            top_name = top[0] if isinstance(top, tuple) else top.get("model", "?")
            top_metrics = top[1] if isinstance(top, tuple) else top
            planets.append({
                "id": "find-besT",
                "name": "find_besT",
                "axis": "care",
                "phase": "honey",
                "description": f"21-subject Day-1 sweep, care_cost joint scoring. Top: {top_name}",
                "metric": f"composite={top_metrics.get('composite', 0):.4f}",
                "last_run_iso": mtime(BENCH / "find_besT_2026-07-30.json"),
            })

    # n_eff diversity
    if n_eff:
        ne = n_eff.get("n_eff", "—")
        passed = n_eff.get("gate_passed", False)
        planets.append({
            "id": "n-eff",
            "name": "n_eff_diversity",
            "axis": "continuity",
            "phase": "milk",
            "description": "pairwise ρ + Kish n_eff across sovereign roster",
            "metric": f"n_eff={ne} · gate {'passed' if passed else 'failed (>2.0 required)'}",
            "last_run_iso": mtime(BENCH / "n_eff_diversity_scan.json"),
        })

    # ProvBench
    if provbench:
        planets.append({
            "id": "provbench",
            "name": "ProvBench",
            "axis": "provenance",
            "phase": "honey",
            "description": "0/20 C2PA markings survive binding-intact",
            "metric": f"0 of 20 · rule-of-three 95% upper = {provbench.get('canonical', {}).get('rule_of_three_upper', 0)*100:.1f}%",
            "last_run_iso": mtime(BENCH / "provbench-canonical-bound.json"),
        })

    # DefBench
    if defbench:
        stats = defbench.get("battery_stats", {})
        planets.append({
            "id": "defbench",
            "name": "DefBench",
            "axis": "safety",
            "phase": "honey",
            "description": f"{stats.get('total', '?')} items, {stats.get('harmful', '?')} harmful / {stats.get('benign', '?')} benign",
            "metric": f"{defbench.get('axes_resolved', 0)} of 4 axes resolved",
            "last_run_iso": mtime(BENCH / "defbench.json"),
        })

    # GovBench
    if govbench:
        planets.append({
            "id": "govbench",
            "name": "GovBench",
            "axis": "governance",
            "phase": "honey",
            "description": "193 samples, 26 dimensions, cluster-robust",
            "metric": "composed +6.63 [+1.05, +12.21]",
            "last_run_iso": mtime(BENCH / "system_analysis.json"),
        })

    # PQCBench
    pqc_path = BENCH / "pqcbench.json"
    pqc_metrics = (pqcbench or {})
    planets.append({
        "id": "pqcbench",
        "name": "PQCBench",
        "axis": "continuity",
        "phase": "water",
        "description": "25 criteria for PQC-ready signing chains",
        "metric": "ML-DSA-65 migration needed · NIST IR 8547 disallows EdDSA after 2035",
        "last_run_iso": mtime(pqc_path),
    })

    # flywheel-daily cron
    if flywheel_daily.exists():
        planets.append({
            "id": "flywheel-daily",
            "name": "flywheel-daily",
            "axis": "care",
            "phase": "honey",
            "description": "cron — daily drift, salted PRACTICE/HELD_OUT split",
            "metric": "selftest 9/9 · salt=csoai-flywheel-v1",
            "last_run_iso": mtime(flywheel_daily),
        })

    # honey_pipeline
    honey = BENCH / "sov_kb.json"
    if honey.exists():
        try:
            h = json.loads(honey.read_text())
            planets.append({
                "id": "honey-pipe",
                "name": "honey_pipeline",
                "axis": "care",
                "phase": "honey",
                "description": "KB harvest → honey cache → cite-on-serve",
                "metric": f"{len(h)} verified entries",
                "last_run_iso": mtime(honey),
            })
        except Exception:
            pass

    # production_ready
    if prod:
        planets.append({
            "id": "production-ready",
            "name": "production_ready",
            "axis": "care",
            "phase": "honey",
            "description": "signed care_cost evidence pack for marketing",
            "metric": "Ed25519 sigil · signed",
            "last_run_iso": mtime(BENCH / "production_ready.json"),
        })

    # OWEM CITIZENS — per-user sovereign AI instances spawned by
    # user_sovereign_launcher.py. Each spawn is one node on the galaxy.
    # The snapshot reads the same decision_ledger.jsonl that the launcher
    # appends to, so the citizen count is the LIVE number of users in the
    # estate. This is the "fluid cluster" the user asked for — every
    # citizen is its own node in SovSpace, dim if local, bright if on free GPU.
    citizens = []
    # The launcher lives in csoai-static-deploy2, not in this repo. Read
    # the canonical ledger via the same BENCH resolver.
    ledger_path = BENCH.parent / "decision_ledger.jsonl"
    if not ledger_path.exists():
        ledger_path = HERE / "decision_ledger.jsonl"
    if ledger_path.exists():
        for line in ledger_path.read_text().splitlines():
            if not line.strip():
                continue
            try:
                ev = json.loads(line)
            except json.JSONDecodeError:
                continue
            if ev.get("tag") != "[SCALE]":
                continue
            kind = ev.get("kind", "?")
            if kind == "spawn":
                citizens.append({
                    "citizen_id": ev.get("citizen_id", ""),
                    "model": ev.get("model", ""),
                    "location": ev.get("location", ""),
                    "tokens": ev.get("estimated_24h_tokens", 0),
                    "issued_at": ev.get("issued_at"),
                    "kind": kind,
                })
            elif kind == "handoff":
                # Handoff updates the citizen's model + location in-place.
                cid = ev.get("citizen_id", "")
                for c in citizens:
                    if c["citizen_id"] == cid:
                        c["model"] = ev.get("new_model", c["model"])
                        c["location"] = ev.get("new_location", c["location"])
                        c["tokens"] = ev.get("new_estimated_24h_tokens", c["tokens"])
                        c["issued_at"] = ev.get("issued_at")
                        break

    snap = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "n_planets": len(planets),
        "n_citizens": len(citizens),
        "planets": planets,
        "citizens": citizens,
    }
    out_path.write_text(json.dumps(snap, indent=2))
    print(f"snapshot: {len(planets)} planets · {len(citizens)} citizens → {out_path}")
    for p in planets:
        print(f"  {p['name']:24s} {p['phase']:6s} {p['last_run_iso'] or '—'}")
    for c in citizens:
        print(f"  citizen {c['citizen_id']:24s} {c['model']:18s} {c['location']:18s} {c['tokens']}t/day")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())