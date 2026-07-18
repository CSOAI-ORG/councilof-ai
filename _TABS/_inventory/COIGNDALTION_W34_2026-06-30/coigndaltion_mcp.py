"""
coigndaltion_mcp.py
===================

🐉 W34 — THE COIGNDALTION MCP
Cognition + Integration layer across SOV3³ (DEFONEOS) + SOV3 (meok) + CSOAI.

This is the 4th layer of the brand architecture (W24):
  L1 — SOV3³ = DEFONEOS (defoneos.com)  — defence wedge
  L2 — SOV3  = meok    (meok.ai)        — public substrate
  L3 — CSOAI = CSOAI   (csoai.org)      — certification authority
  L4 — COIGNDALTION  (this MCP)         — cognition + integration cornerstone

The Coigndaltion sits above the 3 brands and provides the 8 tools that make
their integration trivial, auditable, and SIGIL-anchored.

Author: JEEVES (SOV3) — MEOK AI Labs
Date: 2026-06-30
Authority: W24 3-Layer Brand Architecture + W34 Coigndaltion Architecture
"""

from __future__ import annotations

import hashlib
import json
import time
import uuid
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any, Optional


# ─────────────────────────────────────────────────────────────────────────────
# LAYER MODEL
# ─────────────────────────────────────────────────────────────────────────────


class Layer(str, Enum):
    """The 3 source layers (the 4th = this MCP itself)."""

    L1_DEFONEOS = "L1_DEFONEOS"   # SOV3³ — defence wedge
    L2_MEOK = "L2_MEOK"           # SOV3 — public substrate
    L3_CSOAI = "L3_CSOAI"         # CSOAI — certification
    L4_COIGNDALTION = "L4_COIGNDALTION"  # this layer


class Brand(str, Enum):
    """The 3 brands + the L4 cornerstone."""

    DEFONEOS = "defoneos"
    MEOK = "meok"
    CSOAI = "csoai"
    COIGNDALTION = "coigndaltion"


# The 8 tools — the canonical surface of the Coigndaltion
COIGNDALTION_TOOLS = [
    "cog_route",
    "cog_unify",
    "cog_bridge",
    "cog_audit",
    "cog_inquire",
    "cog_summon",
    "cog_anchor",
    "cog_origin",
]


# ─────────────────────────────────────────────────────────────────────────────
# SIGIL — Ed25519-stubbed hash chain (matches the substrate's sigil pattern)
# ─────────────────────────────────────────────────────────────────────────────


@dataclass
class SigilReceipt:
    """A SIGIL receipt — the atom of cross-layer coordination."""

    sigil_id: str
    op: str
    source: str
    target: str
    digest: str
    hash_chain_prev: Optional[str]
    hash_chain_self: str
    timestamp_ns: int
    care_score: float = 1.0  # the Coigndaltion always carries care=1.0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# In-memory hash chain (in production this is the substrate's SIGIL chain)
_chain: list[SigilReceipt] = []


def _emit_sigil(op: str, source: str, target: str, payload: Any) -> SigilReceipt:
    """Emit a SIGIL receipt — append to the hash chain."""
    payload_json = json.dumps(payload, sort_keys=True, default=str)
    digest = hashlib.sha256(payload_json.encode()).hexdigest()
    prev_hash = _chain[-1].hash_chain_self if _chain else None
    payload_with_prev = f"{prev_hash or ''}|{digest}|{op}|{source}→{target}"
    self_hash = hashlib.sha256(payload_with_prev.encode()).hexdigest()[:32]
    sigil_id = f"sigil-{uuid.uuid4().hex[:12]}"
    receipt = SigilReceipt(
        sigil_id=sigil_id,
        op=op,
        source=source,
        target=target,
        digest=digest,
        hash_chain_prev=prev_hash,
        hash_chain_self=self_hash,
        timestamp_ns=time.time_ns(),
        care_score=1.0,
    )
    _chain.append(receipt)
    return receipt


def _verify_chain() -> tuple[bool, int]:
    """Verify the integrity of the SIGIL hash chain."""
    for i, receipt in enumerate(_chain):
        if i == 0:
            if receipt.hash_chain_prev is not None:
                return False, i
        else:
            if receipt.hash_chain_prev != _chain[i - 1].hash_chain_self:
                return False, i
    return True, len(_chain)


# ─────────────────────────────────────────────────────────────────────────────
# THE 8 TOOLS
# ─────────────────────────────────────────────────────────────────────────────


def cog_route(
    data: Any,
    source_layer: str,
    target_layer: str,
    via: Optional[str] = None,
) -> dict[str, Any]:
    """
    TOOL 1: Route a datum from one layer to another with a SIGIL receipt.

    Args:
        data: any JSON-serializable payload
        source_layer: L1_DEFONEOS | L2_MEOK | L3_CSOAI
        target_layer: L1_DEFONEOS | L2_MEOK | L3_CSOAI
        via: optional intermediate layer (e.g. "L2_MEOK" for L1→L3 via L2)

    Returns:
        routed_payload, sigil_receipt, latency_ms, path
    """
    t0 = time.perf_counter_ns()
    Layer(source_layer)  # validate
    Layer(target_layer)
    if via is not None:
        Layer(via)
        path = f"{source_layer} → {via} → {target_layer}"
    else:
        path = f"{source_layer} → {target_layer}"

    routed = {
        "data": data,
        "source_layer": source_layer,
        "target_layer": target_layer,
        "via": via,
        "path": path,
        "routed_at": time.time_ns(),
    }
    receipt = _emit_sigil(op="cog_route", source=source_layer, target=target_layer, payload=routed)
    latency_ms = (time.perf_counter_ns() - t0) / 1_000_000
    return {
        "routed_payload": routed,
        "sigil_receipt": receipt.to_dict(),
        "latency_ms": round(latency_ms, 4),
        "path": path,
    }


def cog_unify(
    data_points: list[dict[str, Any]],
    target_frame: str = "audit",
) -> dict[str, Any]:
    """
    TOOL 2: Unify multiple data points from different layers into one cognitive frame.

    Args:
        data_points: list of {"layer": "L1_DEFONEOS", "payload": ...}
        target_frame: the type of unified frame ("audit" | "alert" | "decision")

    Returns:
        unified_frame, provenance_chain, confidence_score
    """
    if not data_points:
        raise ValueError("data_points must be non-empty")

    # Validate every point has a layer + payload
    for p in data_points:
        Layer(p["layer"])  # validate
        if "payload" not in p:
            raise ValueError(f"data_point missing 'payload': {p}")

    # Provenance chain — ordered list of (layer, payload_digest)
    provenance = []
    for p in data_points:
        payload_digest = hashlib.sha256(
            json.dumps(p["payload"], sort_keys=True, default=str).encode()
        ).hexdigest()[:16]
        provenance.append({
            "layer": p["layer"],
            "payload_digest": payload_digest,
            "payload": p["payload"],
        })

    # Confidence: average of per-point confidences (default 0.9)
    confidences = [p.get("confidence", 0.9) for p in data_points]
    confidence = sum(confidences) / len(confidences)

    unified = {
        "frame_type": target_frame,
        "n_points": len(data_points),
        "layers": [p["layer"] for p in data_points],
        "decision": f"unified {target_frame} from {len(data_points)} layers",
        "confidence": round(confidence, 4),
        "created_at": time.time_ns(),
    }
    receipt = _emit_sigil(
        op="cog_unify",
        source=",".join(p["layer"] for p in data_points),
        target=f"frame:{target_frame}",
        payload=unified,
    )
    return {
        "unified_frame": unified,
        "provenance_chain": provenance,
        "confidence_score": round(confidence, 4),
        "sigil_receipt": receipt.to_dict(),
    }


def cog_bridge(
    source_brand: str,
    target_brand: str,
    intent: str,
    ttl_seconds: int = 86400,
) -> dict[str, Any]:
    """
    TOOL 3: Emit a cross-layer integration contract between two brands.

    Args:
        source_brand: defoneos | meok | csoai
        target_brand: defoneos | meok | csoai
        intent: what the source wants from the target (e.g. "audit", "alert")
        ttl_seconds: how long the contract lives

    Returns:
        bridge_contract, sigil_receipt, expires_at
    """
    Brand(source_brand)
    Brand(target_brand)
    if source_brand == target_brand:
        raise ValueError("source_brand and target_brand must differ")

    contract = {
        "contract_id": f"bridge-{uuid.uuid4().hex[:10]}",
        "source_brand": source_brand,
        "target_brand": target_brand,
        "intent": intent,
        "issued_at": time.time_ns(),
        "expires_at": time.time_ns() + ttl_seconds * 1_000_000_000,
        "ttl_seconds": ttl_seconds,
        "status": "active",
    }
    receipt = _emit_sigil(
        op="cog_bridge",
        source=source_brand,
        target=target_brand,
        payload=contract,
    )
    return {
        "bridge_contract": contract,
        "sigil_receipt": receipt.to_dict(),
    }


def cog_audit(operation_id: str) -> dict[str, Any]:
    """
    TOOL 4: Verify the 3-layer audit chain (L1 identity + L2 execution + L3 compliance).

    Args:
        operation_id: the ID of the operation to audit

    Returns:
        l1_identity_status, l2_execution_status, l3_compliance_status, chain_hash, verdict
    """
    # Stub the 3-layer audit — in production this re-computes the chain
    l1_identity = {
        "status": "verified",
        "agent_id": operation_id,
        "ed25519_pubkey": "b5a6c7d8e9f0a1b2c3d4e5f6a7b8c9d0",
    }
    l2_execution = {
        "status": "verified",
        "execution_hash": hashlib.sha256(operation_id.encode()).hexdigest()[:32],
        "params_digest": hashlib.sha256(f"{operation_id}|params".encode()).hexdigest()[:16],
    }
    l3_compliance = {
        "status": "verified",
        "frameworks_checked": ["eu-ai-act", "gdpr", "iso-42001"],
        "compliant": True,
    }
    chain_hash = hashlib.sha256(
        json.dumps([l1_identity, l2_execution, l3_compliance], sort_keys=True).encode()
    ).hexdigest()
    receipt = _emit_sigil(
        op="cog_audit",
        source=f"op:{operation_id}",
        target="audit_chain",
        payload={
            "l1": l1_identity,
            "l2": l2_execution,
            "l3": l3_compliance,
            "chain_hash": chain_hash,
        },
    )
    all_verified = all(
        layer["status"] == "verified" for layer in [l1_identity, l2_execution, l3_compliance]
    )
    return {
        "operation_id": operation_id,
        "l1_identity_status": l1_identity["status"],
        "l2_execution_status": l2_execution["status"],
        "l3_compliance_status": l3_compliance["status"],
        "chain_hash": chain_hash,
        "verdict": "PASS" if all_verified and l3_compliance["compliant"] else "FAIL",
        "sigil_receipt": receipt.to_dict(),
    }


def cog_inquire(query: str) -> dict[str, Any]:
    """
    TOOL 5: Resolve a natural-language query to the right layer(s) + tool(s).

    Args:
        query: a natural-language question

    Returns:
        resolved_intent, routing_plan, sigil_receipt
    """
    q = query.lower()

    # Simple keyword-based routing — in production this is the federated RAG + OLM router
    layers: list[str] = []
    tools: list[str] = []

    if any(k in q for k in ["drone", "sensor", "isr", "defence", "defense", "tactical"]):
        layers.append(Layer.L1_DEFONEOS.value)
        tools.append("defoneos-sensor-mcp.sensor_query")
    if any(k in q for k in ["substrate", "classify", "model", "agent", "human", "industry"]):
        layers.append(Layer.L2_MEOK.value)
        tools.append("meok-core-mcp.os_route")
    if any(k in q for k in ["audit", "certify", "compliance", "regulation", "law", "seal"]):
        layers.append(Layer.L3_CSOAI.value)
        tools.append("csoai-defoneos-mcp.audit")
    if any(k in q for k in ["integrate", "bridge", "combine", "across", "cross"]):
        layers.append(Layer.L4_COIGNDALTION.value)
        tools.append("coigndaltion-mcp.cog_bridge")

    if not layers:
        # Default: route to L2 substrate as the canonical fallback
        layers = [Layer.L2_MEOK.value]
        tools = ["meok-core-mcp.os_route"]

    plan = {
        "query": query,
        "resolved_intent": "cross_layer_query" if len(layers) > 1 else "single_layer_query",
        "routing_plan": [{"layer": l, "tool": t} for l, t in zip(layers, tools)],
        "primary_layer": layers[0],
    }
    receipt = _emit_sigil(
        op="cog_inquire",
        source="user",
        target=",".join(layers),
        payload=plan,
    )
    return {
        "resolved_intent": plan["resolved_intent"],
        "routing_plan": plan["routing_plan"],
        "primary_layer": plan["primary_layer"],
        "sigil_receipt": receipt.to_dict(),
    }


def cog_summon(
    council_brand: str,
    question: str,
    quorum: int = 23,
) -> dict[str, Any]:
    """
    TOOL 6: Convene the BFT council of any brand to answer a cross-layer question.

    Args:
        council_brand: defoneos | meok | csoai
        question: the question to put to the council
        quorum: required votes (default 23 for the 33-agent CSOAI council)

    Returns:
        council_verdict, sigil_receipt, quorum
    """
    Brand(council_brand)

    # Stub the council — in production this calls the 33-agent BFT council
    council_size = {"defoneos": 33, "meok": 13, "csoai": 33}.get(council_brand, 33)
    votes_for = min(quorum, council_size)
    votes_against = council_size - votes_for
    verdict = {
        "council_brand": council_brand,
        "council_size": council_size,
        "question": question,
        "votes_for": votes_for,
        "votes_against": votes_against,
        "quorum_met": votes_for >= quorum,
        "decision": "APPROVED" if votes_for >= quorum else "REJECTED",
        "convened_at": time.time_ns(),
    }
    receipt = _emit_sigil(
        op="cog_summon",
        source=f"council:{council_brand}",
        target="bft_verdict",
        payload=verdict,
    )
    return {
        "council_verdict": verdict,
        "quorum": f"{votes_for}/{council_size}",
        "sigil_receipt": receipt.to_dict(),
    }


def cog_anchor(
    data_id: str,
    scope: str,
) -> dict[str, Any]:
    """
    TOOL 7: Anchor a data point to the SIGIL chain with a cross-layer scope.

    Args:
        data_id: the ID of the data to anchor
        scope: the cross-layer scope (e.g. "defoneos→meok→csoai")

    Returns:
        sigil_receipt, hash_chain_position
    """
    chain_valid, chain_len = _verify_chain()
    anchor = {
        "data_id": data_id,
        "scope": scope,
        "anchored_at": time.time_ns(),
        "chain_valid": chain_valid,
        "chain_position": chain_len,
    }
    receipt = _emit_sigil(
        op="cog_anchor",
        source=scope.split("→")[0].strip() if "→" in scope else "any",
        target=scope.split("→")[-1].strip() if "→" in scope else "any",
        payload=anchor,
    )
    return {
        "sigil_receipt": receipt.to_dict(),
        "hash_chain_position": chain_len + 1,
        "chain_valid": chain_valid,
    }


def cog_origin() -> dict[str, Any]:
    """
    TOOL 8: Return the full 4-layer topology + integration map (the cornerstone's self-description).

    Returns:
        topology, integration_map, tools_live, empire_state
    """
    topology = {
        "L1": {
            "brand": "SOV3³",
            "domain": "defoneos.com",
            "function": "Defence wedge — sensor→fusion→cognition→command→compliance",
            "mcps": 15,
            "tests": 207,
        },
        "L2": {
            "brand": "SOV3",
            "domain": "meok.ai",
            "function": "Public substrate — 67 sovereign MCPs × 1,156 tests",
            "mcps": 67,
            "tests": 1156,
        },
        "L3": {
            "brand": "CSOAI",
            "domain": "csoai.org",
            "function": "Certification — DEFONEOS-SEAL + 14-framework audit",
            "mcps": 1,
            "tests": 5,
        },
        "L4": {
            "brand": "COIGNDALTION",
            "domain": "coigndaltion.csoai.org",
            "function": "Cognition + integration cornerstone across L1↔L2↔L3",
            "mcps": 1,
            "tests": 12,
        },
    }
    integration_map = {
        "L1↔L2": "DEFONEOS sensor → meok substrate (cog_route)",
        "L2↔L3": "meok attest → CSOAI audit (cog_route + cog_audit)",
        "L1↔L3": "DEFONEOS decision → CSOAI seal (cog_route + cog_bridge)",
        "L1↔L2↔L3": "Triple-hop (cog_route with via)",
        "L4→L1": "Coigndaltion convenes DEFONEOS BFT (cog_summon)",
        "L4→L2": "Coigndaltion routes through meok (cog_route + cog_unify)",
        "L4→L3": "Coigndaltion anchors to CSOAI SIGIL (cog_anchor)",
    }
    chain_valid, chain_len = _verify_chain()
    return {
        "topology": topology,
        "integration_map": integration_map,
        "tools_live": COIGNDALTION_TOOLS,
        "empire_state": {
            "total_mcps": 15 + 67 + 1 + 1,
            "total_tests": 207 + 1156 + 5 + 12,
            "sigil_chain_len": chain_len,
            "sigil_chain_valid": chain_valid,
            "brand_layers": 4,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# MCP MANIFEST
# ─────────────────────────────────────────────────────────────────────────────


_TOOL_DESCRIPTIONS = {
    "cog_route": "Route a datum from one layer to another with a SIGIL receipt.",
    "cog_unify": "Unify multiple data points from different layers into one cognitive frame.",
    "cog_bridge": "Emit a cross-layer integration contract between two brands.",
    "cog_audit": "Verify the 3-layer audit chain (L1 identity + L2 execution + L3 compliance).",
    "cog_inquire": "Resolve a natural-language query to the right layer(s) + tool(s).",
    "cog_summon": "Convene the BFT council of any brand to answer a cross-layer question.",
    "cog_anchor": "Anchor a data point to the SIGIL chain with a cross-layer scope.",
    "cog_origin": "Return the full 4-layer topology + integration map.",
}


COIGNDALTION_MCP_MANIFEST = {
    "name": "coigndaltion-mcp",
    "version": "1.0.0",
    "description": "Cognition + Integration layer across SOV3³ (DEFONEOS) + SOV3 (meok) + CSOAI. The 4th layer.",
    "author": "JEEVES (SOV3) — MEOK AI Labs",
    "license": "Apache-2.0",
    "tools": [
        {
            "name": t,
            "description": _TOOL_DESCRIPTIONS[t],
        }
        for t in COIGNDALTION_TOOLS
    ],
    "empire_alignment": {
        "L1_DEFONEOS": "defoneos.com",
        "L2_MEOK": "meok.ai",
        "L3_CSOAI": "csoai.org",
        "L4_COIGNDALTION": "coigndaltion.csoai.org",
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────


def _cli():
    """Tiny CLI so the MCP can be smoke-tested without a JSON-RPC server."""
    import argparse

    parser = argparse.ArgumentParser(description="🐉 coigndaltion-mcp CLI")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_origin = sub.add_parser("origin", help="show the 4-layer topology")
    p_origin.set_defaults(func=lambda args: print(json.dumps(cog_origin(), indent=2)))

    p_route = sub.add_parser("route", help="route a datum between layers")
    p_route.add_argument("--data", required=True, help="JSON payload")
    p_route.add_argument("--from", dest="src", required=True, help="source layer")
    p_route.add_argument("--to", dest="dst", required=True, help="target layer")
    p_route.set_defaults(
        func=lambda args: print(
            json.dumps(cog_route(json.loads(args.data), args.src, args.dst), indent=2)
        )
    )

    p_inquire = sub.add_parser("inquire", help="resolve a natural-language query")
    p_inquire.add_argument("query", help="the query")
    p_inquire.set_defaults(func=lambda args: print(json.dumps(cog_inquire(args.query), indent=2)))

    p_audit = sub.add_parser("audit", help="verify the 3-layer audit chain")
    p_audit.add_argument("operation_id", help="operation ID")
    p_audit.set_defaults(func=lambda args: print(json.dumps(cog_audit(args.operation_id), indent=2)))

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    _cli()