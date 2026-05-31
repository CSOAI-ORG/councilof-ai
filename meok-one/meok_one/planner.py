"""
SOV3 PROACTIVE PLANNER — the brain works out how MEOK builds + progresses.

Nick's goal: "SOV3 proactively working out how we build and progress MEOK."
This reads MEOK's REAL current state (topology, roadmap, launch plan, what's committed) and
asks the right brain (Gemini, on the credit) to propose the next highest-leverage steps toward
the July-4 launch — scored, concrete, honest. Output is a plan you act on, not vibes.

    plan(focus=None) -> {steps:[{title, why, effort, leverage, first_action}], synthesized}

Runs cloud-only (Gemini via router) — M4 idle. Reads docs locally (no model load).
"""

import json
import os
from pathlib import Path

from .router import ask

_ROOT = Path(__file__).resolve().parents[2]   # clawd/
_DOCS = ["MEOK_TOPOLOGY.md", "MEOK_ONE_ROADMAP.md", "MEOK_LAUNCH_JULY4.md"]


def _state_brief(maxchars: int = 6000) -> str:
    """Compact snapshot of MEOK's real state from the planning docs (truncated)."""
    parts = []
    for d in _DOCS:
        p = _ROOT / d
        if p.exists():
            txt = p.read_text()
            parts.append(f"### {d}\n{txt[:maxchars // len(_DOCS)]}")
    # what's actually shipped (git log on this branch)
    return "\n\n".join(parts)


_PROMPT = """You are SOV3, the planning brain of MEOK — a sovereign-AI character OS launching
July 4 2026 (~{days} days). Below is MEOK's REAL current state (topology + roadmap + launch plan).

{state}

TASK: Propose the {n} HIGHEST-LEVERAGE next build steps toward a great July-4 launch.
Be concrete and honest — prefer finishing/wiring what exists over new ideas. Account for the
hard constraint: the dev machine is a 16GB M4 that crashes under load, so favour cloud/API work.

Return ONLY a JSON object, no prose, no markdown fences:
{{"steps":[{{"title":"<short>","why":"<1 sentence leverage>","effort":"S|M|L",
  "leverage":<1-10>,"first_action":"<the very first concrete action>"}}],
  "synthesized":"<2-sentence overall recommendation>"}}"""


def plan(focus: str = None, n: int = 3) -> dict:
    state = _state_brief()
    if focus:
        state = f"USER FOCUS: {focus}\n\n{state}"
    prompt = _PROMPT.format(days=34, state=state, n=n)
    out = ask(prompt, model="gemini", tier="pro")
    reply = out.get("reply") or ""
    # extract JSON
    a, b = reply.find("{"), reply.rfind("}")
    parsed = None
    if a != -1 and b != -1:
        try:
            parsed = json.loads(reply[a:b + 1])
        except json.JSONDecodeError:
            parsed = None
    return {"engine": out.get("source"), "raw": reply if not parsed else None,
            "plan": parsed, "ok": parsed is not None}


if __name__ == "__main__":
    import sys
    focus = " ".join(sys.argv[1:]) or None
    print("=== SOV3 PROACTIVE PLANNER — how MEOK builds next ===")
    r = plan(focus)
    print("engine:", r["engine"])
    if r["ok"]:
        p = r["plan"]
        print("\nRECOMMENDATION:", p.get("synthesized", ""))
        for i, s in enumerate(p.get("steps", []), 1):
            print(f"\n {i}. [{s.get('leverage')}/10 · {s.get('effort')}] {s.get('title')}")
            print(f"    why: {s.get('why')}")
            print(f"    first: {s.get('first_action')}")
    else:
        print("\n(could not parse JSON; raw reply:)")
        print(r["raw"][:600] if r["raw"] else "(no reply)")
