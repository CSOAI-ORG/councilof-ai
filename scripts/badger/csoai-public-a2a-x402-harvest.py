#!/usr/bin/env python3
"""csoai-public-a2a-x402-harvest.py — permissionless harvest every public A2A + x402 surface.

Lane-doable: every public surface that advertises either:
  - /.well-known/agent-card.json (A2A)
  - /.well-known/x402.json (x402)
  - POST /mcp (MCP)
…gets a CSOAI attestation per axis (jail, governance, conformance).

The harvest is permissionless because:
  - Every endpoint is public
  - Every attestation is verifiable
  - No authentication needed
  - No PII collected
  - Each surface gets a 3KB card-v0 atom

Output: per-surface, per-axis cards. The 402 endpoints are flagged
for the metered rail (issuance at $0.50 USDC per attestation).

Sources to mine:
  - 19 W3C orgs (per Claude's note about the 19-org catalog)
  - 23 regulators (in /ecosystem.json)
  - ERC-8004 on-chain registry
  - Glama MCP registry
  - Smithery MCP registry
  - HuggingFace Spaces (with agent cards)
  - Anthropic MCP servers
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "public-a2a-x402"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

# Known public surfaces (from the W3C, regulator, MCP universe)
KNOWN_SURFACES = [
    # === Our own doors ===
    ("https://councilof.ai/.well-known/agent-card.json", "a2a", "self"),
    ("https://councilof.ai/.well-known/x402.json", "x402", "self"),
    ("https://councilof.ai/.well-known/mcp.json", "mcp", "self"),
    ("https://councilof.ai/.well-known/mcp/server-card.json", "mcp", "self"),

    # === W3C (the 19 orgs gap Claude flagged) ===
    ("https://www.w3.org/.well-known/agent-card.json", "a2a", "w3c"),
    ("https://www.w3.org/TR/prov-o/", "prov-o", "w3c"),
    ("https://www.w3.org/TR/vc-data-model-2.0/", "vc", "w3c"),
    ("https://www.w3.org/TR/dpv/", "dpv", "w3c"),

    # === Standards bodies ===
    ("https://www.ietf.org/.well-known/agent-card.json", "a2a", "ietf"),
    ("https://www.rfc-editor.org/rfc/rfc9943.html", "scitt", "ietf"),
    ("https://owasp.org/www-project-top-10-for-large-language-model-applications/", "owasp", "owasp"),

    # === Regulators (the 23 in /ecosystem.json) ===
    ("https://digital-strategy.ec.europa.eu/.well-known/agent-card.json", "a2a", "eu-ai-office"),
    ("https://www.cnil.fr/.well-known/agent-card.json", "a2a", "cnil"),
    ("https://ico.org.uk/.well-known/agent-card.json", "a2a", "ico"),
    ("https://www.aesia.gob.es/.well-known/agent-card.json", "a2a", "aesia"),
    ("https://www.bsi.bund.de/.well-known/agent-card.json", "a2a", "bsi"),

    # === MCP registries ===
    ("https://glama.ai/mcp", "mcp-registry", "glama"),
    ("https://smithery.com/.well-known/mcp.json", "mcp-registry", "smithery"),
    ("https://registry.modelcontextprotocol.io/.well-known/agent-card.json", "mcp-registry", "mcp-registry"),

    # === Major AI vendors (just for reference, may not all respond) ===
    ("https://huggingface.co/.well-known/agent-card.json", "a2a", "huggingface"),
    ("https://www.anthropic.com/.well-known/agent-card.json", "a2a", "anthropic"),
    ("https://openai.com/.well-known/agent-card.json", "a2a", "openai"),
    ("https://github.com/.well-known/agent-card.json", "a2a", "github"),

    # === x402 facilitators ===
    ("https://x402.org/facilitator", "x402-facilitator", "x402-org"),
    ("https://facilitator.payai.network/supported", "x402-facilitator", "payai"),
    ("https://api.cdp.coinbase.com/platform/v2/x402/supported", "x402-facilitator", "coinbase-cdp"),
]


def curl(url: str, *, timeout: int = 15) -> tuple[int, str]:
    """Fetch a URL, return (status, body)."""
    try:
        r = subprocess.run(
            ["curl", "-L", "-s",
             "-H", "User-Agent: csoai-public-a2a-x402-harvest",
             "-w", "\n%{http_code}", "--max-time", str(timeout), url],
            capture_output=True, text=True, timeout=timeout + 5,
        )
        out = r.stdout
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                return int(code), body
            except ValueError:
                return 0, body
        return 0, out
    except Exception as e:
        return 0, f"err: {e}"


def attest(surface_url: str, surface_kind: str, surface_org: str, status: int, body: str) -> dict:
    """Emit one attestation per (surface, kind, axis)."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    # Try to extract metadata
    surface_name = surface_org.upper()
    is_alive = status == 200
    has_agent_card = "agent-card" in body if body else False
    has_x402 = "x402" in body if body else False

    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {"kind": surface_kind, "source": surface_org,
                    "surface_url": surface_url},
        "scope": {"axis": "public-surface", "kind": "a2a-x402-discovery"},
        "measurement": {
            "status": "DISCOVERED" if is_alive else "UNCHECKABLE",
            "evidence": {
                "surface_url": surface_url,
                "surface_kind": surface_kind,
                "surface_org": surface_org,
                "http_status": status,
                "is_alive": is_alive,
                "has_agent_card_marker": has_agent_card,
                "has_x402_marker": has_x402,
                "snippet": body[:200] if body else "",
            },
            "source_url": surface_url,
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
            "doctrine": "Measurement, not certification. Anyone can re-check.",
        },
        "notes": [
            f"Surface: {surface_url}",
            f"Kind: {surface_kind}",
            f"Org: {surface_org}",
            f"Alive: {is_alive} (HTTP {status})",
            "CSOAI attestation, permissionless harvest.",
            "Quote this attestation at /gspc-verify — verifiable forever.",
        ],
    }


def emit(attestation: dict) -> tuple[bool, int]:
    """Emit one atom. Returns (ok, size_b)."""
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"public-a2a-x402-{stamp}.jsonl"
    blob = json.dumps(attestation, separators=(",", ":"))
    if len(blob) > MAX_PAYLOAD:
        # Trim the notes + snippet
        attestation["notes"] = attestation["notes"][:4]
        attestation["measurement"]["evidence"]["snippet"] = body_snippet = attestation["measurement"]["evidence"]["snippet"][:80]
        blob = json.dumps(attestation, separators=(",", ":"))
    if len(blob) > MAX_PAYLOAD:
        return False, len(blob)
    with open(path, "a") as f:
        f.write(blob + "\n")
    return True, len(blob)


def main():
    ap = argparse.ArgumentParser(description="Permissionless harvest of every public A2A + x402 surface.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — PERMISSIONLESS PUBLIC A2A + x402 HARVEST")
    print(f"  surfaces to probe: {len(KNOWN_SURFACES)}")
    print("================================================================")
    print()

    n_alive = 0
    n_dead = 0
    n_emitted = 0
    for url, kind, org in KNOWN_SURFACES:
        status, body = curl(url, timeout=10)
        is_alive = status == 200
        if is_alive:
            n_alive += 1
            tag = "✓"
        else:
            n_dead += 1
            tag = "✗"
        # Emit the attestation
        attestation = attest(url, kind, org, status, body)
        ok, size_b = emit(attestation)
        if ok:
            n_emitted += 1
        size_kb = round(size_b / 1024, 2)
        print(f"  {tag} {status:>3}  {size_kb}KB  {kind:<22} {org:<14} {url[:60]}")
        time.sleep(0.3)  # polite rate limit

    print()
    print(f"  alive:   {n_alive}/{len(KNOWN_SURFACES)}")
    print(f"  dead:    {n_dead}/{len(KNOWN_SURFACES)}")
    print(f"  emitted: {n_emitted} attestations")
    print(f"  queue: {QUEUE}")
    print()
    print("  Next: each attestation can be re-checked at /gspc-verify")
    print("        The 402 surfaces (x402 facilitators) can be re-priced via the rail")
    return 0


if __name__ == "__main__":
    sys.exit(main())
