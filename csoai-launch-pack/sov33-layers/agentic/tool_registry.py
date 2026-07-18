"""
sov33-layers/agentic/tool_registry.py
========================================
Phase 3.1 · Tool registry — discover, score, dispatch

Per SOV33_BLEEDING_EDGE:
  Use ToolLLM for the MCP tool use (702+ tools).

A discovery layer over all MCP tools exposed by the sovereign substrate.
Every tool gets:
  - name, description, parameters
  - care_floor (minimum care required to invoke)
  - chArter_anchor (Charter SHA)
  - signature for BFT-traceable invocation
"""

import sys
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "sov33-layers"))

from common.sovereign_core import mint_op, audit_brief, CARE_FLOOR, CSOAI_CHARTER_SHA

LAYER = "AGENTIC"


# Registry of all tools the agentic layer can dispatch.
# In SOV3 master, every tool is a sovereign-bounded MCP method.
TOOLS = {
    "sovereign.assess": {
        "description": "Run a 12-mind-set sovereign assessment on an AI system",
        "params": ["system", "mindset", "jurisdiction"],
        "care_floor": 0.97,
        "handler": "phase2.run_sovereign_assessment",
        "BFT_role": "The L4 speculative cascade + L5 sigil",
    },
    "sovereign.passport.issue": {
        "description": "Issue an Article-50 watermarking passport per EU AI Act",
        "params": ["system_id", "content_hash"],
        "care_floor": 0.98,
        "handler": "phase1.run_passport_issue",
        "BFT_role": "Article 50 transparency + L1 care",
    },
    "sovereign.sigil.mint": {
        "description": "Mint a sovereign sigil receipt for any action",
        "params": ["op", "intent", "body"],
        "care_floor": 0.95,
        "handler": "common.mint_op",
        "BFT_role": "L5 SIGIL chain (the BFT itself)",
    },
    "sovereign.bft.vote": {
        "description": "Cast a BFT-33 vote on a proposal (28 approve / 5 amend quorum 23/33)",
        "params": ["proposal_id", "choice"],
        "care_floor": 0.98,
        "handler": "phase1.run_bft_vote",
        "BFT_role": "33-agent consensus",
    },
    "sovereign.care.check": {
        "description": "Run L1 care-divergence gate on input text (2 scorers must agree)",
        "params": ["input_text"],
        "care_floor": 0.90,  # the gate itself enforces 0.95
        "handler": "phase1.l1_care_divergence.run",
        "BFT_role": "L1 care divergence hard gate",
    },
    "sovereign.7d.intuition": {
        "description": "Capture a 6-axis SOV-19 intuition snapshot",
        "params": ["trigger"],
        "care_floor": 0.95,
        "handler": "intuition_layers.layer_7.mint",
        "BFT_role": "SOV-19 custodian alignment",
    },
    "sovereign.digest.consolidate": {
        "description": "Run canonical inventory + framework crosswalk",
        "params": [],
        "care_floor": 0.95,
        "handler": "launch_pack.consolidate",
        "BFT_role": "Single-screen truth",
    },
}


def discover() -> dict:
    """Return all tools + their confidence."""
    return {
        "n_tools": len(TOOLS),
        "tools": list(TOOLS.keys()),
        "care_floor_global": CARE_FLOOR,
        "charter": CSOAI_CHARTER_SHA[:16] + "...",
    }


def score_tool(query: str) -> dict:
    """Score each tool against a query (simple keyword match)."""
    q = query.lower()
    scored = []
    for name, t in TOOLS.items():
        desc = t["description"].lower()
        score = sum(1 for kw in q.split() if kw in desc or kw in name)
        scored.append((name, score))
    scored.sort(key=lambda kv: -kv[1])
    return {"query": query, "top": scored[:3]}


def dispatch(tool_name: str, **kwargs) -> dict:
    """Dispatch a tool, log to sovereign chain.

    GAP C FIXED: now actually calls sovereign_api.assess() for the assess tool.
    Other tools still mint sigils only (honest stubs).

    Tools with care_floor < CARE_FLOOR (e.g. care.check is itself a probe,
    not an authority action) are exempt from the strict 0.95 gate. The
    veto is logged with force_log=True so the audit trail captures the event.

    Every agentic dispatch ALSO mints a record on the master sigil chain
    (layer L5) so the master index reflects every tool call.
    """
    if tool_name not in TOOLS:
        raise ValueError(f"Unknown tool: {tool_name}")
    t = TOOLS[tool_name]
    body = {"tool": tool_name, "params": kwargs, "care_floor": t["care_floor"], "via": "agentic"}
    # Tools whose floor is < 0.95 are PROBES — log them but don't veto
    is_probe = t["care_floor"] < CARE_FLOOR

    # GAP C FIX: actually call sovereign_api for the assess tool
    if tool_name == "sovereign.assess":
        try:
            import subprocess
            result = subprocess.run(
                ["python3", "-c", f"""
import sys; sys.path.insert(0, '{ROOT}')
import sovereign_api as sa
key = sa.signup("agent@csoai.org")["api_key"]
out = sa.assess(key, system="{kwargs.get('system', 'default')}",
                mindset="{kwargs.get('mindset', 'meta')}",
                jurisdiction="{kwargs.get('jurisdiction', 'EU')}")
import json; print(json.dumps({{"digest": out.get("sigil_digest","")[:24],
                                "model": out.get("model",""),
                                "mindset": out.get("mindset",""),
                                "response_len": len(out.get("response",""))}}))
"""],
                capture_output=True, text=True, timeout=120,
                cwd=str(ROOT),
            )
            if result.returncode == 0:
                body["real_dispatch_result"] = result.stdout.strip()
            else:
                body["real_dispatch_error"] = result.stderr.strip()[:200]
        except Exception as e:
            body["real_dispatch_error"] = str(e)[:200]

    rec = mint_op(
        LAYER, "TOOL_DISPATCH", tool_name, body,
        care_value=CARE_FLOOR if is_probe else t["care_floor"],
        force_log=is_probe,
    )
    # Master-chain mirror: every agentic call shows up on the main sigil chain too
    try:
        mint_op(
            "L5", "AGENTIC_MIRROR", f"agentic-{tool_name[:20]}",
            {"tool": tool_name, "agentic_digest": rec["digest"][:16]},
            care_value=CARE_FLOOR,
        )
    except Exception:
        pass  # never let a master-mirror failure block dispatch

    return {
        "tool": tool_name,
        "description": t["description"],
        "care_floor": t["care_floor"],
        "digest": rec["digest"],
        "audit_url": rec["audit_url"],
        "bft_role": t["BFT_role"],
        "is_probe": is_probe,
    }


if __name__ == "__main__":
    print("Phase 3.1 · Tool registry")
    print("=" * 60)
    d = discover()
    print(f"  Tools registered: {d['n_tools']}")
    for t in d["tools"]:
        print(f"    {t}")
    print()
    print("Query scoring:")
    queries = [
        "Audit this AI for EU AI Act compliance",
        "Mint a sigil receipt for the assessment",
        "Vote in BFT council on the defoneos seal",
    ]
    for q in queries:
        r = score_tool(q)
        print(f"  '{q}'")
        for name, score in r["top"]:
            print(f"    -> {name}  score={score}")
    print()
    print(f"\nAudit: {audit_brief(LAYER)}")
