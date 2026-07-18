"""
sovereign_witness_mvp.py — Pillar 4 (THE 4th pillar): SOVEREIGN WITNESS.
The public-audit trail + the verifiable SIGIL browser tool.

Beyond the 3 MVP pillars, the Sovereign Witness is the legal-philosophical
foundation: every sovereign action has a public witness that can be
verified in any browser. The Witness is the public record.

Author: M4 (the engineering lane). MIT license. MEOK Labs.
"""
import os
import sys
import json
import time
import hashlib
import argparse
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, '/Users/nicholas/clawd')
sys.path.insert(0, '/Users/nicholas/clawd/csoai-os/mcp')


TOOLS = [
    {
        "name": "sovereign_witness_attest",
        "description": "A sovereign consumer + the substrate attest to an event. Returns the public witness record + the SIGIL proof + the OSCAL verification URL.",
        "input_schema": {
            "type": "object",
            "properties": {
                "actor": {"type": "string", "description": "DID or sovereign ID (witness)"},
                "subject": {"type": "string", "description": "DID or sovereign ID (subject)"},
                "event": {"type": "string", "description": "Event type (i_character_create, mcp_invoke, bft_vote, watchdog_report, etc.)"},
                "payload": {"type": "object", "description": "Event payload"},
                "include_sigil": {"type": "boolean", "default": True},
                "include_oscal": {"type": "boolean", "default": True},
            },
            "required": ["actor", "subject", "event", "payload"],
        },
    },
    {
        "name": "sovereign_witness_verify",
        "description": "Verify a sovereign witness attestation. Returns verification status + provenance + audit trail.",
        "input_schema": {
            "type": "object",
            "properties": {
                "witness_id": {"type": "string", "description": "Witness ID to verify"},
            },
            "required": ["witness_id"],
        },
    },
    {
        "name": "sovereign_witness_audit_trail",
        "description": "Get the audit trail for a sovereign consumer. Returns all witness records.",
        "input_schema": {
            "type": "object",
            "properties": {
                "actor": {"type": "string", "description": "DID or sovereign ID"},
                "since": {"type": "string", "description": "ISO 8601 timestamp"},
                "event_type": {"type": "string"},
            },
            "required": ["actor"],
        },
    },
]


class SovereignWitness:
    """The Sovereign Witness — public audit trail + verifiable SIGIL browser tool."""

    def __init__(self):
        self.witnesses = {}  # witness_id → witness record
        self.audit_trail = {}  # actor → [witness_ids]

    def attest(self, params: dict) -> dict:
        """Attest to an event. The Witness records the event."""
        witness_id = f"wit-{int(time.time())}-{hashlib.sha256(json.dumps(params, sort_keys=True).encode()).hexdigest()[:8]}"
        ts = datetime.now(timezone.utc).isoformat()
        witness = {
            "witness_id": witness_id,
            "ts": ts,
            "actor": params.get("actor"),
            "subject": params.get("subject"),
            "event": params.get("event"),
            "payload": params.get("payload", {}),
            "include_sigil": params.get("include_sigil", True),
            "include_oscal": params.get("include_oscal", True),
        }
        # Compute SIGIL hash
        h = hashlib.sha256()
        h.update(json.dumps(witness, sort_keys=True).encode())
        witness["sigil"] = h.hexdigest()
        # OSCAL reference
        witness["oscal"] = {
            "canonical_sha256": "a4f31a715a1ca92039ecf06949679700393d6bc265725f6e9bad0f97def76039",
            "verification_url": "https://csoai.org/csoai-os/oscal-verifier.html",
        }
        self.witnesses[witness_id] = witness
        # Append to audit trail
        actor = params.get("actor")
        if actor not in self.audit_trail:
            self.audit_trail[actor] = []
        self.audit_trail[actor].append(witness_id)
        return witness

    def verify(self, params: dict) -> dict:
        """Verify a witness attestation."""
        witness_id = params.get("witness_id")
        if witness_id not in self.witnesses:
            return {"verified": False, "error": "Witness not found"}
        w = self.witnesses[witness_id]
        # Re-compute the sigil hash
        new_w = {k: v for k, v in w.items() if k != "sigil" and k != "oscal"}
        new_h = hashlib.sha256(json.dumps(new_w, sort_keys=True).encode()).hexdigest()
        verified = new_h == w.get("sigil", "")
        return {
            "verified": verified,
            "witness_id": witness_id,
            "ts": w["ts"],
            "actor": w["actor"],
            "subject": w["subject"],
            "event": w["event"],
            "sigil_verifies": verified,
            "oscal_canonical": w.get("oscal", {}).get("canonical_sha256", ""),
        }

    def audit_trail_for(self, params: dict) -> dict:
        """Get the audit trail for an actor."""
        actor = params.get("actor")
        since = params.get("since")
        since_dt = None
        if since:
            try:
                since_dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
            except Exception:
                pass
        trail = []
        for wid in self.audit_trail.get(actor, []):
            w = self.witnesses[wid]
            if since_dt:
                w_dt = datetime.fromisoformat(w["ts"].replace("Z", "+00:00"))
                if w_dt < since_dt:
                    continue
            trail.append(w)
        return {
            "actor": actor,
            "since": since,
            "witness_count": len(trail),
            "witnesses": trail,
        }


def main():
    parser = argparse.ArgumentParser(description="Sovereign Witness MVP")
    parser.add_argument("--tools", action="store_true", help="List MCP tools")
    parser.add_argument("--demo", action="store_true", help="Run a demo")
    args = parser.parse_args()

    if args.tools:
        print(json.dumps({"server": "sovereign_witness", "version": "0.1.0", "tools": TOOLS}, indent=2))
        return

    witness = SovereignWitness()
    if args.demo:
        # 4 demo attestations
        print("=== sovereign_witness_attest #1 (i_character_create) ===")
        print(json.dumps(witness.attest({
            "actor": "did:csoai:csoai-org-001",
            "subject": "did:csoai:sarah-001",
            "event": "i_character_create",
            "payload": {"name": "Sarah Jones", "archetype": "Healer", "bft_tier": "Gold"},
        }), indent=2))
        print("\n=== sovereign_witness_attest #2 (mcp_invoke) ===")
        print(json.dumps(witness.attest({
            "actor": "did:csoai:sarah-001",
            "subject": "did:csoai:cobol-bridge-mcp",
            "event": "mcp_invoke",
            "payload": {"tool": "read_cobol", "params": {"filename": "/legacy/system.cbl"}},
        }), indent=2))
        print("\n=== sovereign_witness_attest #3 (bft_vote) ===")
        print(json.dumps(witness.attest({
            "actor": "did:csoai:sarah-001",
            "subject": "did:csoai:csoai-council",
            "event": "bft_vote",
            "payload": {"proposal_id": "prop-12345", "choice": "for"},
        }), indent=2))
        print("\n=== sovereign_witness_attest #4 (watchdog_report) ===")
        print(json.dumps(witness.attest({
            "actor": "did:csoai:sarah-001",
            "subject": "https://csoai.org/watchdog",
            "event": "watchdog_report",
            "payload": {"signal_type": "noise", "severity": "high", "lat": 51.5074, "lon": -0.1278},
        }), indent=2))
        # Verify one
        wid_to_verify = list(witness.witnesses.keys())[0]
        print(f"\n=== sovereign_witness_verify ({wid_to_verify}) ===")
        print(json.dumps(witness.verify({"witness_id": wid_to_verify}), indent=2))
        # Audit trail
        print("\n=== sovereign_witness_audit_trail (did:csoai:sarah-001) ===")
        print(json.dumps(witness.audit_trail_for({"actor": "did:csoai:sarah-001"}), indent=2))
    else:
        print("Usage: --tools OR --demo")


if __name__ == '__main__':
    main()