#!/usr/bin/env python3
"""coverage_expander.py — ASI-Evolve: finds measurement gaps.

Analyzes which axes/domains have cards, finds under-covered areas.
Proposes what to mine next.
"""
from __future__ import annotations
import json, os, sys
from pathlib import Path
from collections import Counter, defaultdict
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/coverage_expander_state.json")

DOMAIN_TARGETS = {
    "ai_model": 50,
    "ai_company": 20,
    "ai_safety": 15,
    "mcp_server": 25,
    "a2a_agent": 20,
    "x402_endpoint": 15,
    "stablecoin": 100,
    "defi_protocol": 30,
    "iso_standard": 15,
    "uk_regulator": 15,
    "eu_regulator": 15,
    "us_regulator": 10,
    "asia_regulator": 10,
    "regulator_global": 10,
    "bank": 30,
    "compute_provider": 10,
}

def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"runs": 0, "by_domain": {}, "by_axis": {}, "gaps": [], "coverage_pct": {}}

def save_state(s):
    STATE.write_text(json.dumps(s, indent=2))

def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"ASI-Evolve coverage expander: {metrics.get('total_cards', 0)} cards across {metrics.get('domain_count', 0)} domains, {metrics.get('gap_count', 0)} gaps.",
        "measurement_not_certification": True,
        "permissionless": True,
        "auto_churn": True,
    }
    fname = MEAS_DIR / f"coverage-{subject.replace('/', '-').replace(':', '-').replace('.', '-')[:60]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname

def analyze():
    by_domain = Counter()
    by_axis = Counter()
    total = 0
    for fname in os.listdir(MEAS_DIR):
        if not fname.endswith(".json") or fname.startswith("coverage-"):
            continue
        try:
            with open(os.path.join(MEAS_DIR, fname)) as f:
                card = json.load(f)
            kind = card.get("kind", "")
            domain = kind.split(".")[1] if "." in kind and len(kind.split(".")) > 1 else "other"
            by_domain[domain] += 1
            metrics = card.get("metrics", {})
            for k, v in metrics.items():
                if isinstance(v, (int, float)):
                    by_axis[k[:30]] += 1
            total += 1
        except Exception:
            pass
    gaps = []
    coverage_pct = {}
    for domain, target in DOMAIN_TARGETS.items():
        actual = by_domain.get(domain, 0)
        pct = min(100, 100 * actual / target) if target > 0 else 0
        coverage_pct[domain] = {"target": target, "actual": actual, "pct": round(pct, 1)}
        if actual < target * 0.5:
            gaps.append({"domain": domain, "gap": target - actual, "priority": "P1" if target > 50 else "P2"})
    return total, dict(by_domain), dict(by_axis), gaps, coverage_pct

def main():
    state = load_state()
    state["runs"] += 1
    print(f"[{NOW()}] coverage_expander starting — run #{state['runs']}")
    total, domains, axes, gaps, pct = analyze()
    state["by_domain"] = domains
    state["by_axis"] = axes
    state["gaps"] = gaps[:20]
    state["coverage_pct"] = pct
    save_state(state)
    write_card(
        f"coverage-{NOW().replace(':', '').replace('-', '')[:13]}",
        "measurement.coverage.gaps",
        {
            "total_cards": total,
            "domain_count": len(domains),
            "gap_count": len(gaps),
            "by_domain": domains,
            "by_axis": axes,
            "coverage_pct": pct,
            "top_gaps": gaps[:10],
            "miner_version": "asi-evolve-2",
            "note": "Coverage gaps identified. ASI-Evolve proposes where to mine next.",
        },
    )
    print(f"[{NOW()}] coverage_expander done: {total} cards, {len(gaps)} gaps")
    return 0

if __name__ == "__main__":
    sys.exit(main())
