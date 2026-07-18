#!/usr/bin/env python3
"""
layer0_federation.py — route a task across the WHOLE Layer-0 stack (not just MCPs).

Loads the unified protocol catalog (layer0_protocol_catalog.json) and resolves an
intent to the right protocol layer — MCP federation, bridges, A2A, x402, SIGIL,
OSCAL, council, passport. This is the code behind "SOV3 federates all of Layer 0
by lazy discovery": catalog → match → (the caller then discovers/calls/caches).

  resolve("govern a COBOL payment")   → {layer: Legacy bridges, ...}
  resolve("pay per call")             → {layer: x402 payments, ...}
  route(intents)                      → batched resolution
"""
import os, json, re

CATALOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "layer0_protocol_catalog.json")

# intent keyword → protocol-layer name (matches the catalog's "protocol" field)
_ROUTES = [
    (r"cobol|sap|hl7|scada|legacy|mainframe|bridge|swift|iso ?20022|payment file", "Legacy bridges"),
    (r"agent.?to.?agent|a2a|identity|did|policy|firewall|prompt.?inject|handoff|orchestrat|rate.?limit|residency", "A2A substrate"),
    (r"pay|x402|402|settle|usdc|on.?chain|mica|invoice", "x402 payments"),
    (r"sign|attest|sigil|hash.?chain|tamper|verify", "SIGIL attestation"),
    (r"oscal|fedramp|rfc.?0024|ssp|machine.?readable package", "OSCAL / FedRAMP"),
    (r"vote|council|ratify|byzantine|bft|quorum|proposal", "BFT council"),
    (r"passport|credential|art.?50|compliance credential", "Compliance Passport"),
    (r"tool|mcp|server|capability|fleet", "MCP federation"),
]


def _catalog():
    try:
        return json.load(open(CATALOG))
    except Exception:
        return {"layers": []}


def _layer(name):
    for l in _catalog().get("layers", []):
        if l.get("protocol") == name:
            return l
    return None


def resolve(intent):
    """Resolve a free-text intent to the Layer-0 protocol that handles it."""
    t = (intent or "").lower()
    for pat, name in _ROUTES:
        if re.search(pat, t):
            l = _layer(name) or {"protocol": name}
            return {"intent": intent, "layer": name, "via": l.get("via", ""),
                    "what": l.get("what", ""), "signed": l.get("signed", "SIGIL")}
    # default: the MCP federation (the broadest tool surface)
    l = _layer("MCP federation") or {}
    return {"intent": intent, "layer": "MCP federation", "via": l.get("via", ""),
            "what": l.get("what", ""), "signed": "SIGIL", "note": "default route"}


def route(intents):
    return [resolve(i) for i in intents]


def layers():
    return [l["protocol"] for l in _catalog().get("layers", [])]


if __name__ == "__main__":
    print("Layer-0 protocol layers:", layers())
    for i in ["govern a COBOL payment", "pay per API call", "ratify this finding",
              "issue an agent identity", "sign the audit", "generate a FedRAMP package", "call a weather tool"]:
        r = resolve(i)
        print(f"  '{i}'  → {r['layer']}  (signed: {r['signed']})")
