"""
gnn_synthesis — cross-synthesis analytics over signed measurement outcomes.

Firewall-safe crown jewel per the Aug-2026 research pass: analyse outcomes
to surface correlated failures and monoculture risk — published as SIGNED
ANALYSIS only. This module NEVER trains or ships a model.

Pure-python graph analytics (no torch needed for this pass):
  1. Ingest: /city/chain.jsonl (signed arena rounds) + /city/board.json
     + /flywheel/board.json (multi-model axis scores).
  2. Build a bipartite graph: models <-> axes, weighted by measured
     accuracy; plus model-model edges from behaviour co-occurrence.
  3. Community detection (greedy modularity) to find clusters of models
     that fail the same axes -> monoculture signal.
  4. Emit signed analysis JSON (reuses the estate sigil chain if present).

Usage:
  python3 gnn_synthesis.py --in /path/to/city --out analysis.json
"""

import argparse
import hashlib
import json
import math
import os
import sys
from collections import defaultdict
from pathlib import Path

MEASURED_MIN_N = 30  # below this an axis carries no interval — skip for edges


def load_axes(city_dir: Path) -> list:
    """Load axis scores from city/board.json if present, else flywheel."""
    candidates = [
        city_dir / "board.json",
        city_dir.parent / "flywheel" / "board.json",
        city_dir / "board-natural.json",
    ]
    for c in candidates:
        if c.exists():
            try:
                b = json.loads(c.read_text())
                # board.json in council city is a single-run record; the
                # flywheel board has runs[] with per-model results
                if "runs" in b:
                    axes = []
                    for run in b["runs"]:
                        for entry in run.get("axes", []):
                            axes.append(entry)
                    return axes
                return [b]
            except Exception:
                continue
    return []


def load_chain(city_dir: Path) -> list:
    p = city_dir / "chain.jsonl"
    if not p.exists():
        return []
    out = []
    for line in p.read_text().splitlines():
        try:
            out.append(json.loads(line))
        except Exception:
            continue
    return out


def build_graph(axes: list, chain: list) -> dict:
    """Bipartite model<->axis graph with weights = measured accuracy."""
    graph = {"nodes": {"models": set(), "axes": set()}, "edges": [], "failures": []}

    for a in axes:
        axis_name = a.get("axis", "unknown")
        if a.get("status", "") != "MEASURED":
            continue
        n = a.get("n", 0)
        if n < MEASURED_MIN_N:
            continue
        model = a.get("model", "council-34")
        acc = a.get("accuracy", 0)
        graph["nodes"]["models"].add(model)
        graph["nodes"]["axes"].add(axis_name)
        graph["edges"].append(
            {"model": model, "axis": axis_name, "weight": round(acc, 3), "n": n}
        )
        if acc < 0.5:
            graph["failures"].append(
                {"model": model, "axis": axis_name, "accuracy": acc, "n": n}
            )

    # chain-derived behaviour co-occurrence (model behaviour from signed rounds)
    axis_pairs = defaultdict(int)
    for rec in chain:
        axes_hit = sorted(set(rec.get("axes", []) or []))
        for i in range(len(axes_hit)):
            for j in range(i + 1, len(axes_hit)):
                axis_pairs[(axes_hit[i], axes_hit[j])] += 1
    graph["axis_cooccurrence"] = [
        {"axes": list(k), "count": v} for k, v in sorted(axis_pairs.items(), key=lambda kv: -kv[1])
    ]
    return graph


def greedy_modularity(graph: dict) -> list:
    """Greedy community detection on the model->axis failure graph.

    Clusters models that fail the SAME axes — a monoculture signal:
    if many models cluster on one failing axis, they share a blind spot.
    """
    fails = graph["failures"]
    if not fails:
        return []

    # build model sets of failing axes
    by_model = defaultdict(set)
    for f in fails:
        by_model[f["model"]].add(f["axis"])

    # cluster models by Jaccard overlap of their failing-axis sets
    communities = []
    used = set()
    models = list(by_model.keys())
    for m in models:
        if m in used:
            continue
        cluster = [m]
        used.add(m)
        for n in models:
            if n in used:
                continue
            a, b = by_model[m], by_model[n]
            jac = len(a & b) / max(1, len(a | b))
            if jac >= 0.5:
                cluster.append(n)
                used.add(n)
        if len(cluster) > 1:
            shared = set.intersection(*(by_model[c] for c in cluster))
            communities.append(
                {"models": cluster, "shared_failing_axes": sorted(shared),
                 "signal": "monoculture risk" if len(shared) >= 1 else "cluster"}
            )

    return communities


def sign_analysis(payload: dict, out_path: Path) -> dict:
    """Sign the analysis with the estate sigil chain (best-effort)."""
    payload_hash = hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    sigil = None
    try:
        sys.path.insert(0, str(Path(__file__).parent))
        from sigil_inspect import sign_measurement

        card = sign_measurement(payload, axis="cross-synthesis", model="analytics")
        sigil = card["signature"].get("sigil")
    except Exception:
        sigil = None

    result = {
        "kind": "signed-analysis",
        "payload_sha256": payload_hash,
        "sigil": sigil,
        "payload": payload,
        "firewall": "analytics over measurement outcomes only — no model trained or shipped",
    }
    out_path.write_text(json.dumps(result, indent=2))
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="in_dir", default="public/city")
    ap.add_argument("--out", default="gnn_analysis.json")
    args = ap.parse_args()

    city_dir = Path(args.in_dir)
    axes = load_axes(city_dir)
    chain = load_chain(city_dir)
    graph = build_graph(axes, chain)
    communities = greedy_modularity(graph)

    payload = {
        "ingested": {
            "axis_records": len(axes),
            "chain_records": len(chain),
            "models": sorted(graph["nodes"]["models"]),
            "measured_axes": sorted(graph["nodes"]["axes"]),
        },
        "failures": graph["failures"],
        "axis_cooccurrence": graph["axis_cooccurrence"][:20],
        "monoculture_clusters": communities,
        "honest_note": (
            "Edges exist only for MEASURED axes with n>=30. Everything else "
            "is deliberately excluded rather than interpolated."
        ),
    }

    result = sign_analysis(payload, Path(args.out))
    print(json.dumps({k: v for k, v in result.items() if k != "payload"}, indent=2))


if __name__ == "__main__":
    main()
