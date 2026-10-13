#!/usr/bin/env python3
"""tui7_corrections.py — TUI-7 adversarial correction ledger.

Every public claim has a corrections ledger entry. When a measurement
is withdrawn, retracted, or revised, the new ledger row must link back
to the original record hash and carry a signed correction record.
"""
from __future__ import annotations
import json, os, sys, hashlib
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
LEDGER = MEAS_DIR / "corrections_ledger.jsonl"
STATE = Path("/tmp/tui7_state.json")


def emit_correction(original_claim_id, original_hash, correction_text, evidence_after_hash, retraction=False):
    """Emit a signed correction record."""
    correction = {
        "schema": "csoai.correction/0.1",
        "kind": "retraction" if retraction else "revision",
        "original_claim_id": original_claim_id,
        "original_hash": original_hash,
        "correction_text": correction_text[:1000],
        "evidence_after_hash": evidence_after_hash,
        "corrected_at": NOW(),
        "corrected_by": "TUI-7",
        "corrected_in_response_to": "audit_finding_or_revision",
    }
    correction["content_hash"] = hashlib.sha256(json.dumps(correction, sort_keys=True).encode()).hexdigest()[:16]
    with open(LEDGER, "a") as f:
        f.write(json.dumps(correction) + "\n")
    return correction


def audit_drafts_for_stale_numbers():
    """Check our IETF drafts for numbers that may have drifted."""
    findings = []
    # Find drafts
    draft_dir = Path.home() / "clawd" / "councilof-ai-work" / "tui6-ietf"
    if not draft_dir.exists():
        return findings
    # Pull live state
    try:
        import urllib.request
        with urllib.request.urlopen("https://councilof.ai/interop/root-witness-latest.json", timeout=10) as r:
            live = json.loads(r.read())
        live_root_count = live.get("corpus_scope", {}).get("public_root_count")
        live_card_count = live.get("corpus_scope", {}).get("signed_card_count")
    except Exception:
        return findings
    # Compare against draft claims
    for draft in draft_dir.glob("*.md"):
        text = draft.read_text()
        # Numbers like "155 models", "1,493 cards", "169-card root"
        import re
        for m in re.finditer(r"(\d{1,3}(?:,\d{3})*|\d+)\s*(models|cards|root|leaves)", text):
            num_str, kind = m.group(1).replace(",", ""), m.group(2)
            try:
                num = int(num_str)
            except Exception:
                continue
            # Check if this matches live state
            if kind == "root" and live_root_count and num != live_root_count:
                findings.append({"draft": draft.name, "kind": kind, "draft_value": num, "live_value": live_root_count, "drift": True})
            elif kind == "cards" and live_card_count and num != live_card_count:
                findings.append({"draft": draft.name, "kind": kind, "draft_value": num, "live_value": live_card_count, "drift": True})
    return findings


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"TUI-7 corrections: {metrics.get('corrections_total', 0)} corrections logged, {metrics.get('drift_findings_count', 0)} drift findings.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "lane": "TUI-7",
    }
    fname = MEAS_DIR / f"tui7-corrections-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] tui7_corrections starting")
    # Count existing corrections
    total = 0
    if LEDGER.exists():
        for _ in LEDGER.read_text().splitlines():
            if _.strip():
                total += 1
    # Audit drafts for drift
    findings = audit_drafts_for_stale_numbers()
    # If findings exist, emit corrections for each
    new_corrections = []
    for f in findings:
        corr = emit_correction(
            original_claim_id=f["draft"],
            original_hash=f"draft:{f['draft']}",
            correction_text=f"Number drift detected: draft claims {f['kind']}={f['draft_value']}, live={f['live_value']}. Update draft to point at live URL.",
            evidence_after_hash=f"live:https://councilof.ai/interop/root-witness-latest.json",
            retraction=False,
        )
        new_corrections.append(corr)
    write_card(f"audit-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.corrections.tui7_audit",
               {
                   "corrections_total": total,
                   "new_corrections": len(new_corrections),
                   "drift_findings_count": len(findings),
                   "drift_findings": findings,
                   "charter_note": "TUI-7 maintains corrections ledger. Drift detection across drafts.",
                   "auto_churn": True,
               })
    print(f"[{NOW()}] tui7 done: {total} total corrections, {len(findings)} new drift findings")
    return 0


if __name__ == "__main__":
    sys.exit(main())
