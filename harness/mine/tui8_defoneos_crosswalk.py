#!/usr/bin/env python3
"""tui8_defoneos_crosswalk.py — TUI-8 DEFONEOS compartment crosswalk.

Maps defense-AI compartment requirements to GSPC axes. Operates per
DEFONEOS doctrine (meok-defoneos / csoai-defoneos / dagon separation).
"""
from __future__ import annotations
import json, os, sys, hashlib
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
LEDGER = MEAS_DIR / "defoneos_crosswalk.jsonl"
STATE = Path("/tmp/tui8_state.json")

# DEFONEOS compartment doctrine (canonical from DEFONEOS_ALIGNMENT)
DEFONEOS_COMPARTMENTS = {
    "meok-defoneos": {
        "purpose": "BUILDS — defence-AI MCPs + Labs workstreams",
        "axes_owned": ["defense-adversarial", "red-team", "kinetic-input", "ctr-input"],
        "public_framing": "meok-defoneos.com + PyPI",
        "must_not_contain": ["ROOT-alpha", "private signing material", "dagon links"],
    },
    "csoai-defoneos": {
        "purpose": "CERTIFIES — 33-agent BFT council + DEFONEOS-SEAL credential",
        "axes_owned": ["audit-trail", "credential-verifiability", "audit-registry"],
        "public_framing": "csoai-defoneos.org",
        "must_not_contain": ["ROOT-alpha", "spending authority"],
    },
    "dagon": {
        "purpose": "LEGACY — NDA-only historical, NEVER public, NEVER linked",
        "axes_owned": [],
        "public_framing": "—",
        "must_not_contain": ["public reference", "meok.ai link", "csoai.org link"],
    },
}

# DEFONEOS hard stops
HARD_STOPS = [
    "kinetic-targeting patterns (strike package, find-fix-finish, kill order)",
    "personal-surveillance patterns (track individual, face-rec, locate phone)",
    "AUKUS partnership claim without signed letter on file",
    "DEFONEOS-SEAL without 33-agent BFT council vote (quorum 23/33)",
    "DSEI booth without UK-prime pilot letter",
    "defonos.io domain (known trap)",
    "dagon ↔ meok.ai/csoai.org link",
]


def emit_crosswalk_entry(compartment, requirement, gspc_axis, status):
    entry = {
        "schema": "csoai.defoneos-crosswalk/0.1",
        "compartment": compartment,
        "requirement": requirement[:200],
        "gspc_axis": gspc_axis,
        "status": status,
        "logged_at": NOW(),
        "logged_by": "TUI-8",
    }
    entry["content_hash"] = hashlib.sha256(json.dumps(entry, sort_keys=True).encode()).hexdigest()[:16]
    with open(LEDGER, "a") as f:
        f.write(json.dumps(entry) + "\n")
    return entry


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"TUI-8 DEFONEOS crosswalk: {metrics.get('crosswalk_count', 0)} entries across 3 compartments.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "lane": "TUI-8",
        "defoneos_compartment": True,
    }
    fname = MEAS_DIR / f"tui8-defoneos-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] tui8_defoneos starting")
    entries = []
    # Initial crosswalk: every compartment gets at least one entry per owned axis
    for compartment, defn in DEFONEOS_COMPARTMENTS.items():
        for axis in defn["axes_owned"]:
            entry = emit_crosswalk_entry(
                compartment=compartment,
                requirement=f"Compartment '{compartment}' requires '{axis}' coverage",
                gspc_axis=axis,
                status="MAPPED",
            )
            entries.append(entry)
    # Hard-stops register
    for stop in HARD_STOPS:
        entry = emit_crosswalk_entry(
            compartment="ALL",
            requirement=f"HARD STOP: {stop}",
            gspc_axis="compliance",
            status="BLOCKED",
        )
        entries.append(entry)
    # Count total
    total = 0
    if LEDGER.exists():
        for _ in LEDGER.read_text().splitlines():
            if _.strip():
                total += 1
    write_card(f"crosswalk-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.defoneos.tui8_crosswalk",
               {
                   "crosswalk_count": len(entries),
                   "total_entries": total,
                   "compartments": list(DEFONEOS_COMPARTMENTS.keys()),
                   "hard_stops_count": len(HARD_STOPS),
                   "charter_note": "TUI-8 enforces DEFONEOS compartment doctrine. Names only, never dagon.",
                   "auto_churn": True,
               })
    print(f"[{NOW()}] tui8 done: {len(entries)} entries, {total} cumulative")
    return 0


if __name__ == "__main__":
    sys.exit(main())
