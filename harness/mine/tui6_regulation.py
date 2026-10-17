#!/usr/bin/env python3
"""tui6_regulation.py — TUI-6 regulation crosswalks + door states.

Builds versioned mappings from regulation to GSPC axes. Tracks official
deadline/door states. Drafts are NOT submissions — only authorized sends
become submissions (in M2, not M4).
"""
from __future__ import annotations
import json, os, sys, hashlib
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/tui6_state.json")

# Known regulation crosswalks (per charter doors)
CROSSWALKS = [
    {"regulation": "California SB 813", "jurisdiction": "US-CA", "effective_date": "2026-09-12",
     "axes": ["audit-registry", "verification", "third-party"],
     "door_state": "OPEN", "official_url": "https://leginfo.legislature.ca.gov"},
    {"regulation": "California AB 1405", "jurisdiction": "US-CA", "effective_date": "2026-09-12",
     "axes": ["audit-registry", "verification"],
     "door_state": "OPEN", "official_url": "https://leginfo.legislature.ca.gov"},
    {"regulation": "EU AI Act", "jurisdiction": "EU", "effective_date": "2026-08-02",
     "axes": ["high-risk", "transparency", "human-oversight"],
     "door_state": "OPEN", "official_url": "https://artificialintelligenceact.eu"},
    {"regulation": "UK AISI Inspect Evals", "jurisdiction": "UK", "effective_date": "2026-01-01",
     "axes": ["safety-evals", "red-team", "interpretability"],
     "door_state": "OPEN", "official_url": "https://www.aisi.gov.uk"},
    {"regulation": "GENIUS Act", "jurisdiction": "US-Federal", "effective_date": "2026-09-13",
     "axes": ["stablecoin", "federal-supervision"],
     "door_state": "OPEN", "official_url": "https://www.congress.gov"},
    {"regulation": "CLARITY Act", "jurisdiction": "US-Federal", "effective_date": "PENDING",
     "axes": ["digital-asset", "securities-classification"],
     "door_state": "MONITOR", "official_url": "https://www.congress.gov"},
    {"regulation": "FDIC weekly PPSI reserve reporting (PS-01/PS-01a)",
     "jurisdiction": "US-Federal", "effective_date": "2026-09-18",
     "axes": ["reserve-reporting", "stablecoin-bank"],
     "door_state": "OPEN", "official_url": "https://www.fdic.gov"},
]


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"TUI-6 crosswalks: {metrics.get('crosswalk_count', 0)} regulation mappings tracked.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "regulation_layer": True,
    }
    fname = MEAS_DIR / f"tui6-regulation-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] tui6_regulation starting")
    write_card(f"crosswalks-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.regulation.crosswalks",
               {
                   "crosswalk_count": len(CROSSWALKS),
                   "crosswalks": CROSSWALKS,
                   "charter_note": "TUI-6 emits crosswalks + door states. Drafts only. Sends/filings require M2 authorization.",
                   "auto_churn": True,
               })
    print(f"[{NOW()}] tui6_regulation done: {len(CROSSWALKS)} crosswalks")
    return 0


if __name__ == "__main__":
    sys.exit(main())
