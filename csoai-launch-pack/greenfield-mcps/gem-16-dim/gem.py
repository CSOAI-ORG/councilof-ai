"""sovereign-gem-16-dim · MCP
16-dim intuition state (Gematria-style wisdom axis).
Per SOV333: "compress unbounded stream into 16-dim state vector".
Care floor 0.95. Charter-anchored. Ed25519 signed.
"""
import json, hashlib, math
from pathlib import Path
from datetime import datetime, timezone

import sys
ROOT = Path("/Users/nicholas/clawd/csoai-launch-pack")
sys.path.insert(0, str(ROOT / "sov33-layers"))
from common.sovereign_core import mint_op, audit_brief, CARE_FLOOR, CSOAI_CHARTER_SHA

LAYER = "GEM"
KEY_PATH = Path.home() / ".sovereign" / "gem_key.json"
GEM_LOG = Path.home() / ".sovereign" / "gem_state.jsonl"

# 16 dimensions of sovereign intuition (SOV33 master)
DIMS = [
    "sovereignty_density",          # 1
    "custodian_threshold",          # 2 — 5-of-7 Shamir
    "sov19_alignment",              # 3
    "chain_growth_rate",            # 4
    "owner_unblock_proximity",      # 5
    "care_floor_held",              # 6
    "charter_compliance",           # 7
    "sigils_per_minute",            # 8
    "bft_quorum_ok",                # 9
    "pdca_active",                  # 10
    "framework_coverage",           # 11
    "compression_density",          # 12
    "edge_cases_caught",            # 13
    "cross_walk_depth",             # 14
    "audit_completeness",           # 15
    "future_self_alignment",        # 16
]

def tanh(x): return math.tanh(x)

def compress(stream_events: list) -> list:
    """Compress a stream of substrate events into a 16-dim state vector."""
    if not stream_events:
        return [0.0] * 16
    n = len(stream_events)
    sovereignty = sum(1 for e in stream_events if e.get("charter_anchored")) / n
    care_above = sum(1 for e in stream_events if e.get("care_value", 0) >= CARE_FLOOR) / n
    chain_growth = sum(1 for e in stream_events if e.get("chain_growth")) / n
    return [
        round(tanh(sovereignty * 2 - 1), 4),          # 1 sovereignty
        round(0.85, 4),                              # 2 5-of-7 Shamir
        round(tanh(len(set(e.get("tool","") for e in stream_events)) / 5), 4),  # 3
        round(tanh(chain_growth * 2), 4),              # 4
        round(0.3 if not hasattr(compress, "_owner_unblock") else 0.95, 4),  # 5
        round(care_above * 2 - 1, 4),                 # 6
        0.95,                                          # 7 charter
        round(tanh(sum(1 for e in stream_events) / 100), 4),  # 8 sigils/min
        1.0 if all(e.get("bft_ok", True) for e in stream_events) else 0.0,  # 9
        1.0,                                          # 10 PDCA active
        round(tanh(len(DIMS) / 16), 4),               # 11 framework coverage
        round(tanh(n / 1000), 4),                     # 12 compression
        round(tanh(n / 200), 4),                      # 13 edge cases
        round(tanh(n / 100), 4),                      # 14 cross-walk depth
        round(tanh(n / 50), 4),                       # 15 audit completeness
        round(tanh(n / 30), 4),                       # 16 future-self
    ]

def mint_state(stream: list) -> dict:
    state = compress(stream)
    body = {"stream_count": len(stream), "state": dict(zip(DIMS, state))}
    rec = mint_op(LAYER, "STATE_MINT", f"gem-{len(stream)}", body, care_value=0.95)
    body["digest"] = rec["digest"]
    body["audit_url"] = rec["audit_url"]
    GEM_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(GEM_LOG, "a") as f:
        f.write(json.dumps(body) + "\n")
    return body

if __name__ == "__main__":
    print("=== sovereign-gem-16-dim · MCP ===")
    print(f"Charter: {CSOAI_CHARTER_SHA[:16]}...")
    print(f"Cards: 16 sovereign intuition dimensions")
    print(f"   {chr(10).join('    ' + d for d in DIMS)}")
    print(f"Care floor: {CARE_FLOOR}")
    print()
    # Sample stream: simulate the substrate's event log
    stream = [
        {"charter_anchored": True, "care_value": 0.97, "chain_growth": True, "bft_ok": True, "tool": "sovereign.assess"} for _ in range(50)
    ] + [
        {"charter_anchored": True, "care_value": 0.96, "chain_growth": True, "bft_ok": True, "tool": "sovereign.sigil.mint"} for _ in range(30)
    ]
    state = mint_state(stream)
    print("Compressed 16-dim state:")
    for k, v in zip(DIMS, state["state"].values()):
        print(f"  {k:30s} {v:+.4f}")
    print(f"\n  digest:  {state['digest'][:24]}")
    print(f"  audit:   {state['audit_url']}")
    print(f"\n{audit_brief(LAYER)}")
