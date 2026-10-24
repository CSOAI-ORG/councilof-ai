#!/usr/bin/env python3
"""tui3_intake.py — TUI-3 agent-protocol + x402 conformance atoms.

Emits unsigned intake atoms for MCP/A2A/x402/AG-UI/AP2/ERC-8004.
PROBED is not MEASURED — we mark state accordingly.
"""
from __future__ import annotations
import json, os, sys, hashlib, urllib.request, subprocess
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
INTAKE_LOG = MEAS_DIR / "intake_atoms_tui3.jsonl"
STATE = Path("/tmp/tui3_intake_state.json")


def emit_atom(subject, family, version, method, scorer_version, denominator, state="INDEXED", source_revision=None):
    atom = {
        "atom_schema": "csoai.intake-atom/0.1",
        "atom_kind": "intake-atom",
        "lane": "TUI-3",
        "subject": subject,
        "family": family,
        "version": version,
        "method": method,
        "scorer_version": scorer_version,
        "denominator": denominator,
        "source_revision": source_revision or NOW(),
        "state": state,
        "emitted_at": NOW(),
        "emitted_by": "TUI-3",
        "unsigned": True,
        "notes": "PROBED ≠ MEASURED. Conformance grading requires explicit denominators.",
    }
    atom["content_hash"] = hashlib.sha256(json.dumps(atom, sort_keys=True).encode()).hexdigest()[:16]
    with open(INTAKE_LOG, "a") as f:
        f.write(json.dumps(atom) + "\n")
    return atom


def probe_x402_url(url):
    """Probe a x402 door — does it return 402?"""
    try:
        out = subprocess.check_output(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
             "-A", "CSOAI csoai-council@csoai.org", url],
            timeout=15
        )
        return int(out.strip())
    except Exception:
        return None


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"TUI-3 intake atoms: {metrics.get('atoms_emitted', 0)} atoms, {metrics.get('probed_count', 0)} probed.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "intake_atom_layer": True,
    }
    fname = MEAS_DIR / f"tui3-intake-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] tui3_intake starting")
    atoms = []
    # CSOAI's own 9 x402 doors (per charter)
    csoai_doors = [
        ("x402-card-board", "https://councilof.ai/.well-known/x402.json"),
        ("x402-receipt", "https://councilof.ai/api/x402/receipt"),
        ("x402-verify", "https://councilof.ai/api/x402/verify"),
        ("x402-lookup", "https://councilof.ai/api/x402/lookup"),
        ("x402-trust", "https://councilof.ai/api/x402/trust"),
        ("x402-axis", "https://councilof.ai/api/x402/axis"),
        ("x402-card-detail", "https://councilof.ai/api/x402/card"),
        ("x402-root", "https://councilof.ai/api/x402/root"),
        ("x402-rwa", "https://councilof.ai/api/x402/rwa"),
    ]
    for name, url in csoai_doors:
        code = probe_x402_url(url)
        state = "PROBED" if code in (200, 308, 400, 402) else "INDEXED"
        atom = emit_atom(
            subject=name, family="x402", version="csoai-v1",
            method="http_probe", scorer_version="gspc-axis-x402-conformance",
            denominator="explicit_http_status",
            state=state,
        )
        atom["probe_status"] = code
        atoms.append(atom)
    # MCP servers (sample)
    mcp_servers = [
        "anthropic/mcp-server-filesystem",
        "openai/mcp-server-python",
        "modelcontextprotocol/server-git",
        "modelcontextprotocol/server-postgres",
    ]
    for srv in mcp_servers:
        atom = emit_atom(
            subject=srv, family="mcp-server", version="registry-current",
            method="registry_probe", scorer_version="gspc-axis-mcp-conformance",
            denominator="TBD", state="INDEXED",
        )
        atoms.append(atom)
    # A2A endpoints (sample)
    a2a_agents = [
        "csoai-a2a-card-issuer",
        "csoai-a2a-receipt-signer",
        "defoneos-a2a-policy-engine",
    ]
    for a in a2a_agents:
        atom = emit_atom(
            subject=a, family="a2a-agent", version="TBD",
            method="endpoint_probe", scorer_version="gspc-axis-a2a-conformance",
            denominator="TBD", state="INDEXED",
        )
        atoms.append(atom)
    by_family = Counter(a["family"] for a in atoms)
    by_state = Counter(a["state"] for a in atoms)
    probed_count = sum(1 for a in atoms if a["state"] == "PROBED")
    write_card(f"emitted-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.intake_atom.tui3_emission",
               {
                   "atoms_emitted": len(atoms),
                   "probed_count": probed_count,
                   "by_family": dict(by_family.most_common()),
                   "by_state": dict(by_state.most_common()),
                   "charter_note": "TUI-3 emits INDEXED/PROBED atoms. MEASURED requires conformance denominators.",
                   "auto_churn": True,
               })
    print(f"[{NOW()}] tui3_intake done: {len(atoms)} atoms, by_family={dict(by_family)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
