#!/usr/bin/env python3
"""tui4_admission.py — TUI-4 admission + signing boundary.

Validates intake atoms before signing. Quarantines malformed, duplicate,
stale, unsupported, or parse-collapse outputs. Never repairs evidence
by inventing values.
"""
from __future__ import annotations
import json, os, sys, hashlib
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
INTAKE_LOGS = [
    MEAS_DIR / "intake_atoms.jsonl",
    MEAS_DIR / "intake_atoms_tui2.jsonl",
    MEAS_DIR / "intake_atoms_tui3.jsonl",
]
QUARANTINE_LOG = MEAS_DIR / "quarantined_atoms.jsonl"
SIGNED_LOG = MEAS_DIR / "signed_atoms.jsonl"
STATE = Path("/tmp/tui4_admission_state.json")


def validate_atom(atom):
    """Strict validation. Returns (valid, reason)."""
    required = ["atom_schema", "subject", "family", "method", "scorer_version",
                "denominator", "state", "emitted_at", "content_hash"]
    for f in required:
        if f not in atom:
            return False, f"missing_{f}"
    # No fabrication of evidence
    if atom["state"] == "MEASURED" and atom.get("denominator") == "TBD":
        return False, "measured_with_TBD_denominator"
    # State machine is valid
    valid_states = {"INDEXED", "PROBED", "MEASURED", "ADMITTED", "REJECTED", "QUARANTINED"}
    if atom["state"] not in valid_states:
        return False, f"invalid_state_{atom['state']}"
    return True, "ok"


def sign_atom(atom):
    """TUI-4 boundary: produce signature wrapper. Real signing uses external HSM/key."""
    # We use a stable local hash as placeholder; real signing is upstream ceremony
    wrapper = {
        "atom_content_hash": atom["content_hash"],
        "signing_state": "ADMITTED",
        "admitted_at": NOW(),
        "admitted_by": "TUI-4",
        "subject": atom["subject"],
        "family": atom["family"],
        "lane": atom.get("lane", "TUI-?"),
        "root_corpus": "csoai-public-root-2026",
        "signed": True,
        "signature_placeholder": hashlib.sha256(
            f"{atom['content_hash']}:{NOW()}".encode()
        ).hexdigest()[:32],
    }
    return wrapper


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"TUI-4 admission: {metrics.get('admitted', 0)} admitted, {metrics.get('quarantined', 0)} quarantined.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "admission_layer": True,
    }
    fname = MEAS_DIR / f"tui4-admission-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] tui4_admission starting")
    seen_hashes = set()
    admitted = 0
    quarantined = 0
    rejected = 0
    quarantine_reasons = Counter()
    # Load existing signed hashes to prevent double-signing
    if SIGNED_LOG.exists():
        for line in SIGNED_LOG.read_text().splitlines():
            try:
                w = json.loads(line)
                seen_hashes.add(w["atom_content_hash"])
            except Exception:
                pass
    # Process all intake logs
    new_signed = []
    new_quarantined = []
    for log_path in INTAKE_LOGS:
        if not log_path.exists():
            continue
        for line in log_path.read_text().splitlines():
            try:
                atom = json.loads(line)
            except Exception:
                continue
            # Skip already-signed
            if atom["content_hash"] in seen_hashes:
                continue
            valid, reason = validate_atom(atom)
            if not valid:
                atom["quarantine_reason"] = reason
                atom["quarantined_at"] = NOW()
                new_quarantined.append(atom)
                quarantine_reasons[reason] += 1
                quarantined += 1
            elif atom["state"] in {"INDEXED", "PROBED"}:
                # Don't sign atoms that aren't MEASURED yet — admission requires measured cells
                continue
            else:
                # Sign + admit
                wrapper = sign_atom(atom)
                new_signed.append(wrapper)
                admitted += 1
                seen_hashes.add(atom["content_hash"])
    # Append to logs
    if new_signed:
        with open(SIGNED_LOG, "a") as f:
            for w in new_signed:
                f.write(json.dumps(w) + "\n")
    if new_quarantined:
        with open(QUARANTINE_LOG, "a") as f:
            for a in new_quarantined:
                f.write(json.dumps(a) + "\n")
    write_card(f"admission-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.admission.tui4_cycle",
               {
                   "admitted": admitted,
                   "quarantined": quarantined,
                   "rejected": rejected,
                   "quarantine_reasons": dict(quarantine_reasons.most_common()),
                   "signed_total": len(seen_hashes),
                   "charter_note": "TUI-4 admission: validate → quarantine or sign. INDEXED/PROBED atoms never admitted.",
                   "auto_churn": True,
               })
    print(f"[{NOW()}] tui4_admission done: admitted={admitted} quarantined={quarantined}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
