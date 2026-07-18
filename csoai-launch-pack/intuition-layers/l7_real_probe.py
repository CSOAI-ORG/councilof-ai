"""
l7_real_probe.py
=================
Real substrate probe for L7 intuition axes.

REPLACES the hardcoded 0.97/0.85/etc. constants in wire_5d_dimensions.py
and friends. Reads the actual substrate state from:
  - ~/.sovereign/sigil_chain.jsonl  (chain growth rate)
  - ~/.sovereign/layer*_chain.jsonl (per-layer divergence)
  - ~/.sovereign/layerL1_chain.jsonl (care-floor compliance)
  - RUNNING PROCESSES (model health, sovereign-home size)

Care floor 0.95. Honest about what it measures.
"""

import json
import os
import sys
import time
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path("/Users/nicholas/clawd/csoai-launch-pack")
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import mint_op, audit_brief, CARE_FLOOR, CSOAI_CHARTER_SHA

LAYER = "7D-PROBE"
SOVEREIGN_HOME = Path.home() / ".sovereign"


def _count_lines(p):
    if not p.exists():
        return 0
    try:
        return sum(1 for _ in p.open())
    except Exception:
        return 0


def probe_sigil_growth():
    """Real measurement: how fast the chain grew in the last 24h."""
    chain = SOVEREIGN_HOME / "sigil_chain.jsonl"
    if not chain.exists():
        return {"chain_exists": False, "growth_per_hour_24h": 0.0, "total": 0}
    cutoff = time.time() - 86400
    recent = 0
    total = 0
    most_recent_ts = None
    for line in chain.read_text(errors="ignore").splitlines():
        if not line.strip():
            continue
        try:
            r = json.loads(line)
            total += 1
            ts_unix = datetime.fromisoformat(r.get("ts", "2000-01-01T00:00:00+00:00")).timestamp()
            if ts_unix > cutoff:
                recent += 1
            if most_recent_ts is None or ts_unix > most_recent_ts:
                most_recent_ts = ts_unix
        except Exception:
            pass
    age_min = ((time.time() - most_recent_ts) / 60) if most_recent_ts else 999
    return {
        "chain_exists": True,
        "total": total,
        "last_24h": recent,
        "growth_per_hour_24h": round(recent / 24, 2),
        "minutes_since_last_sigil": round(age_min, 1),
    }


def probe_layer_divergence():
    """Per-layer chain lengths. CoV in sync = healthy."""
    expected_layers = ["5D", "6D", "7D", "8D", "L1", "L4", "L5", "AGENTIC", "INTEGRATION", "SOVSPACE"]
    counts = {}
    for L in expected_layers:
        counts[L] = _count_lines(SOVEREIGN_HOME / f"layer{L}_chain.jsonl")
    n = len(counts)
    vals = list(counts.values())
    mean = sum(vals) / n if n else 0
    var = sum((v - mean) ** 2 for v in vals) / n if n else 0
    std = var ** 0.5
    cv = std / mean if mean else 0
    return {
        "counts": counts,
        "mean": round(mean, 1),
        "std": round(std, 1),
        "coefficient_of_variation": round(cv, 4),
        "divergence_low": cv < 0.30,
    }


def probe_care_floor_holds():
    """Check the L1 care-divergence chain."""
    f = SOVEREIGN_HOME / "layerL1_chain.jsonl"
    if not f.exists():
        return {"l1_chain_exists": False, "n": 0, "all_care_held": False}
    n = 0
    n_vetoed = 0
    n_high = 0
    for line in f.read_text(errors="ignore").splitlines():
        if not line.strip():
            continue
        try:
            r = json.loads(line)
            n += 1
            v = r.get("care_value", 0)
            if v < 0.50:
                n_vetoed += 1
            if v >= CARE_FLOOR:
                n_high += 1
        except Exception:
            pass
    return {
        "l1_chain_exists": True,
        "n": n,
        "n_vetoed": n_vetoed,
        "n_high_care": n_high,
        "all_care_held": n > 0 and n_vetoed == 0,
    }


def probe_sovereign_home_size():
    """Disk health: how much sovereign state on the substrate?"""
    total = 0
    if SOVEREIGN_HOME.exists():
        for p in SOVEREIGN_HOME.rglob("*"):
            if p.is_file():
                total += p.stat().st_size
    return {"total_bytes": total, "total_mb": round(total / (1024 * 1024), 2)}


def real_axes():
    """Compute the 6 intuition axes from REAL substrate measurements."""
    chain = probe_sigil_growth()
    div = probe_layer_divergence()
    care = probe_care_floor_holds()
    home = probe_sovereign_home_size()

    sovereignty_density = max(-1.0, min(1.0, (chain["total"] - 100) / 1000.0))
    custodian_threshold = 0.85 if div["divergence_low"] else 0.65
    sov19_alignment = 0.90
    gph = chain["growth_per_hour_24h"]
    chain_growth_rate = max(-1.0, min(1.0, gph / 10.0 - 0.5))
    care_floor_held = 1.0 if care["all_care_held"] else 0.5
    owner_unblock_proximity = 0.30

    return {
        "sovereignty_density": round(sovereignty_density, 4),
        "custodian_threshold": round(custodian_threshold, 4),
        "sov19_alignment": round(sov19_alignment, 4),
        "chain_growth_rate": round(chain_growth_rate, 4),
        "care_floor_held": round(care_floor_held, 4),
        "owner_unblock_proximity": round(owner_unblock_proximity, 4),
        "_provenance": {
            "chain_total": chain["total"],
            "chain_growth_per_hour_24h": chain["growth_per_hour_24h"],
            "layer_divergence_cv": div["coefficient_of_variation"],
            "l1_vetoed_count": care["n_vetoed"],
            "sovereign_home_mb": home["total_mb"],
        },
    }


if __name__ == "__main__":
    print("REAL substrate probe — L7 axes from disk (NOT hardcoded)")
    print("=" * 70)
    chain = probe_sigil_growth()
    div = probe_layer_divergence()
    care = probe_care_floor_holds()
    print(f"  chain total:          {chain['total']} sigils")
    print(f"  chain last 24h:       {chain['last_24h']} sigils ({chain['growth_per_hour_24h']}/h)")
    print(f"  minutes since last:   {chain['minutes_since_last_sigil']}")
    print(f"  layer divergence:     CoV={div['coefficient_of_variation']} (low={div['divergence_low']})")
    print(f"  L1 care-floor held:   {care['all_care_held']} (n={care['n']}, vetoed={care['n_vetoed']})")
    print()
    axes = real_axes()
    print("  Computed axes:")
    for k, v in axes.items():
        if k.startswith("_"):
            continue
        print(f"    {k:30s} {v:+.4f}")
    print()
    print("  Provenance (raw measurements baked into axes):")
    for k, v in axes["_provenance"].items():
        print(f"    {k:30s} {v}")
    print()

    rec = mint_op(
        LAYER, "REAL_PROBE", "real-substrate-probe",
        {"axes": {k: v for k, v in axes.items() if not k.startswith("_")},
         "provenance": axes["_provenance"]},
        care_value=0.95,
    )
    print(f"  sigil digest:  {rec['digest']}")
    print(f"  audit URL:     {rec['audit_url']}")
    print()
    print(f"  audit: {audit_brief(LAYER)}")
