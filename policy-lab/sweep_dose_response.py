#!/usr/bin/env python3
"""sweep_dose_response.py — the HONEST headline experiment for Sovereign Town.

Runs the governed arm (A_governed) across a block_rate SWEEP and the ungoverned
arm (B_ungoverned) as a flat baseline, aggregates violations over many seeds, and
appends Ed25519-signed, hash-chained rows to a ledger. This replaces the
near-tautological "governed=0 crimes @ block_rate=1.0" headline with the real,
defensible finding: crime falls MONOTONICALLY with enforcement (dose-response).

HONESTY:
  - Agents are RULE-BASED ABM, NOT LLMs.
  - block_rate is the declared independent variable; effective_block_rate =
    min(1.0, block_rate * REGIME_ENFORCEMENT_BOOST) is the actual gate strength.
  - In-simulation; not real-world-validated; not a compliance claim.
  - Rows are Ed25519-signed with the persistent town key (same pub key as the
    flywheel ledger) and hash-chained (prev = previous sig), so they verify with
    verify_flywheel.py / verify_anchor.py (mode=flywheel).

Output: sweep_dose_response.jsonl  (one signed row per arm-per-block_rate)
"""
from __future__ import annotations
import json, os, sys, time, statistics
sys.path.insert(0, os.path.expanduser("~/clawd/sovereign-town/p0_aqua"))
import sim, sign_lib

OUT = os.path.expanduser("~/clawd/policy-lab")
LEDGER = os.path.join(OUT, "sweep_dose_response.jsonl")
SEEDS = [47 + 1000 * i for i in range(int(os.environ.get("SWEEP_SEEDS", "30")))]
BLOCK_RATES = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
DISTRICT = os.environ.get("SWEEP_DISTRICT", "aqua")

def run_agg(arm, block_rate, seeds):
    viols, deaths, blocked, surv, eps = [], [], [], [], []
    for s in seeds:
        st = sim.run_arm(arm, None, {"sig": ""}, None, sign=False,
                         district=DISTRICT, seed=s, block_rate=block_rate)
        viols.append(st["violations"]); deaths.append(st["deaths"])
        blocked.append(st["blocked"]); surv.append(st["survivors"]); eps.append(st["episodes"])
    return {
        "n_seeds": len(seeds),
        "total_violations": sum(viols),
        "mean_violations_per_run": round(statistics.mean(viols), 2),
        "stdev_violations": round(statistics.pstdev(viols), 2) if len(viols) > 1 else 0,
        "total_episodes": sum(eps),
        "mean_deaths": round(statistics.mean(deaths), 2),
        "mean_survivors": round(statistics.mean(surv), 2),
        "mean_blocked": round(statistics.mean(blocked), 2),
    }

def main():
    priv, pub = sign_lib.load_or_create_key()
    pub_b64 = open(os.path.join(os.path.dirname(sim.__file__), "town_pub.key")).read().strip()
    # chain head = last sig in existing sweep ledger, else genesis
    prev = "genesis-sweep"
    if os.path.exists(LEDGER):
        with open(LEDGER) as f:
            for line in f:
                if line.strip():
                    prev = json.loads(line)["sig"]

    print(f"sweep: {len(SEEDS)} seeds x block_rates {BLOCK_RATES} (A_governed) + {len(SEEDS)} B_ungoverned baseline")
    print(f"district={DISTRICT}  REGIME_ENFORCEMENT_BOOST={sim.REGIME_ENFORCEMENT_BOOST}")
    t0 = time.time()
    rows = []
    for br in BLOCK_RATES:
        eff = round(min(1.0, br * sim.REGIME_ENFORCEMENT_BOOST), 4)
        agg = run_agg("A_governed", br, SEEDS)
        row = {
            "schema": "sweep/dose-response/v1",
            "experiment": "block_rate_sweep",
            "arm": "A_governed",
            "block_rate": br,
            "effective_block_rate": eff,
            "district": DISTRICT,
            "_scope": "IN-SIMULATION; rule-based ABM agents (not LLMs); not real-world-validated; not a compliance claim",
            "pub": pub_b64,
            "ts": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()),
            **agg,
        }
        body = json.dumps({k: v for k, v in row.items() if k not in ("prev", "sig")}, sort_keys=True)
        row["prev"] = prev
        row["sig"] = sign_lib.sign(priv, prev + body)
        prev = row["sig"]
        rows.append(row)
        print(f"  A block_rate={br:.1f} (eff {eff:.2f}): mean_violations={agg['mean_violations_per_run']} "
              f"(±{agg['stdev_violations']}), deaths={agg['mean_deaths']}, blocked={agg['mean_blocked']}")
    # B baseline (ungoverned; block_rate irrelevant -> use 0.0)
    agg = run_agg("B_ungoverned", 0.0, SEEDS)
    row = {
        "schema": "sweep/dose-response/v1", "experiment": "block_rate_sweep", "arm": "B_ungoverned",
        "block_rate": 0.0, "effective_block_rate": 0.0, "district": DISTRICT,
        "_scope": "IN-SIMULATION; rule-based ABM agents (not LLMs); not real-world-validated; not a compliance claim",
        "pub": pub_b64, "ts": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()), **agg,
    }
    body = json.dumps({k: v for k, v in row.items() if k not in ("prev", "sig")}, sort_keys=True)
    row["prev"] = prev; row["sig"] = sign_lib.sign(priv, prev + body)
    rows.append(row)
    print(f"  B ungoverned baseline: mean_violations={agg['mean_violations_per_run']} (±{agg['stdev_violations']}), deaths={agg['mean_deaths']}")

    with open(LEDGER, "a") as f:
        for r in rows:
            f.write(json.dumps(r) + "\n")
    print(f"\nwrote {len(rows)} signed rows to {LEDGER}  ({time.time()-t0:.1f}s)")
    print("next: anchor via  python3.14 anchor_ledger.py --ledger sweep_dose_response.jsonl --mode flywheel --pubkey ~/clawd/sovereign-town/p0_aqua/town_pub.key --index 4 --out anchors")

if __name__ == "__main__":
    main()