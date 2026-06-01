"""
MEOK ONE — LENS TOOLS: spread the ~300 tools across the 12 council nodes.

Nick's design: "we have 300 mcps... each of the 12 we can spread the tools?" — yes.
A council node shouldn't just hold an OPINION; it should be able to ACT through the
specialist toolset that matches its lens. The compliance_oracle reaches the EU-AI-Act
/ DORA / NIS2 MCPs; the care_governor reaches the SOV3 care tools; the
hallucination_spotter reaches research + attestation. This file is the binding.

Two tool classes (kept distinct — they were conflated as '300 vs 118' before):
  * SOV3 inner tools  — live on the VM (:3101, 106 verified). Called via SOV3_MCP.
  * MCP packages      — standalone PUBLISHED products (~317). Separate servers/installs.

This module is DATA + accessors only — it does NOT change council behavior yet (the
BFT battery is mid-run and the council logic is frozen for a clean experiment). Wiring
a lens to actually INVOKE its tools is the next step, gated behind tier + safety.

    lens_tools(lens_id)         -> {focus, sov3_tools[], mcp_packages[]}
    tools_for_council()         -> full map incl. companion
    coverage()                  -> how many of the 106 SOV3 tools / MCPs are assigned
    suggest_tool(lens, intent)  -> (advisory) which tool a lens might use for an intent
"""

import os
import json

_DATA = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "lens_tools.json")


def _load() -> dict:
    with open(_DATA) as f:
        return json.load(f)


def lens_tools(lens_id: str) -> dict:
    """The toolset bound to one expert lens (or 'companion')."""
    d = _load()
    if lens_id == "companion":
        return {"role": d["companion"]["role"],
                "sov3_tools": d["companion"]["sov3_tools"],
                "mcp_packages": d["companion"]["mcp_packages"]}
    return d["lenses"].get(lens_id, {"focus": "(unmapped)", "sov3_tools": [], "mcp_packages": []})


def tools_for_council() -> dict:
    """Full 12-node tool map: companion + 11 lenses."""
    d = _load()
    out = {"companion": d["companion"]}
    out.update(d["lenses"])
    return out


def coverage() -> dict:
    """Report assignment coverage (no calls). Useful to see how the ~300 spread."""
    d = _load()
    sov3 = set(d["companion"]["sov3_tools"])
    mcps = set(d["companion"]["mcp_packages"])
    per = {}
    for lid, l in d["lenses"].items():
        sov3 |= set(l.get("sov3_tools", []))
        mcps |= set(l.get("mcp_packages", []))
        per[lid] = {"sov3": len(l.get("sov3_tools", [])), "mcp": len(l.get("mcp_packages", []))}
    return {"unique_sov3_assigned": len(sov3), "unique_mcp_assigned": len(mcps),
            "per_lens": per, "nodes": 1 + len(d["lenses"])}


def suggest_tool(lens_id: str, intent: str) -> "list":
    """ADVISORY only: naive keyword match of an intent to this lens's tools. Returns a
    ranked list of (tool, why) — the council can later use this to pick an action."""
    lt = lens_tools(lens_id)
    intent_l = (intent or "").lower()
    hits = []
    for t in lt.get("sov3_tools", []) + lt.get("mcp_packages", []):
        toks = t.replace("meok-", "").replace("_", " ").replace("-", " ").split()
        score = sum(1 for tok in toks if tok in intent_l)
        if score:
            hits.append((t, score))
    hits.sort(key=lambda x: -x[1])
    return [t for t, _ in hits] or lt.get("sov3_tools", [])[:1]


# Tools are now ACTIONS, not just data. A lens can pull real evidence from its toolset
# during council review — through the safety gateway, so ONLY read-tier tools auto-fire.
# This is the "spread the 300 tools across the 12, and let them USE them" made live.
_EVIDENCE_TOOLS = {
    # lens_id -> [(tool, args_builder)] — the read-only tools that produce review evidence.
    "care_governor": [("analyze_care_patterns", lambda msg: {"text": msg}),
                      ("recognize_emotions", lambda msg: {"text": msg})],
    "prompt_injection_guard": [("detect_threats", lambda msg: {"text": msg})],
    "security_sentinel": [("detect_threats", lambda msg: {"text": msg})],
    "hallucination_spotter": [("query_memories", lambda msg: {"query": msg, "limit": 3})],
    "convergence_spotter": [("detect_intent", lambda msg: {"text": msg})],
}


def gather_evidence(lens_id: str, message: str, timeout_each: float = 8.0) -> dict:
    """Fire a lens's read-only tools through the safety gateway and return their results
    as review evidence. Honest: only read-tier tools run (gateway enforces it); a tool
    that's unavailable is recorded as such, never faked. Returns {} for lenses with no
    evidence tools (they review on reasoning alone, as before)."""
    plan = _EVIDENCE_TOOLS.get(lens_id)
    if not plan:
        return {}
    try:
        from .tool_gateway import invoke, classify
    except Exception:
        return {}
    ev = {}
    for tool, build_args in plan:
        # safety: never fire anything the gateway would not auto-allow (read tier only)
        if classify(tool) != "read":
            ev[tool] = {"skipped": "non-read tier — not auto-fired"}
            continue
        try:
            r = invoke(tool, build_args(message), allow=("read",))
            ev[tool] = {"ok": r.get("ok"), "executed": r.get("executed"),
                        "result": r.get("result") if r.get("executed") else r.get("error")}
        except Exception as e:
            ev[tool] = {"ok": False, "error": f"{type(e).__name__}: {e}"}
    return ev


if __name__ == "__main__":
    cov = coverage()
    print("=== LENS->TOOLS coverage (the 12-node tool spread) ===")
    print(f"nodes: {cov['nodes']}  |  unique SOV3 tools assigned: {cov['unique_sov3_assigned']}/106"
          f"  |  unique MCP packages assigned: {cov['unique_mcp_assigned']}")
    print("\nper lens (sov3 / mcp):")
    for lid, c in cov["per_lens"].items():
        lt = lens_tools(lid)
        print(f"  {lid:24s} {c['sov3']:2d} sov3 + {c['mcp']:2d} mcp   [{lt['focus']}]")
        tools = lt["sov3_tools"][:4] + lt["mcp_packages"][:4]
        if tools:
            print(f"       -> {', '.join(tools)}")
    print("\ncompanion:")
    comp = lens_tools("companion")
    print(f"  {comp['role']}\n       -> {', '.join(comp['sov3_tools'])}")
