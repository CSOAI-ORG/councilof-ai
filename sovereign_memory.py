#!/usr/bin/env python3
"""
Sovereign Memory — the learning + proactive layer for the orchestrator.

This is the "big key": sov doesn't just react (auto-continue / escalate) — it
REMEMBERS what it observes + what you decide, LEARNS your patterns, and PROACTIVELY
proposes how to help next. Proposals are surfaced to you (governed) — never auto-run.

Feeds: per_feature_queen + SOV3 /telemetry (same learning loop the OS already uses).
Stores: ~/.sov3/orchestrator_memory.jsonl   (append-only, replayable)
"""
import os, json, time
from collections import Counter, defaultdict

MEM = os.path.expanduser("~/.sov3/orchestrator_memory.jsonl")
SOV3_TELEMETRY = os.environ.get("SOV3_TELEMETRY", "http://127.0.0.1:3101/telemetry")


def remember(window, observation, decision, outcome=""):
    """Record an observation→decision→outcome. This is sov *learning from watching you*."""
    os.makedirs(os.path.dirname(MEM), exist_ok=True)
    rec = {"ts": int(time.time()), "window": window, "obs": (observation or "")[:160],
           "decision": decision, "outcome": outcome}
    with open(MEM, "a") as f:
        f.write(json.dumps(rec) + "\n")
    # best-effort: feed the same SOV3 learning loop the OS uses (non-blocking, never breaks)
    try:
        import urllib.request
        body = json.dumps({"feature": f"orchestrator:{window}", "action": decision, "meta": rec}).encode()
        urllib.request.urlopen(urllib.request.Request(SOV3_TELEMETRY, data=body,
                               headers={"Content-Type": "application/json"}), timeout=2)
    except Exception:
        pass
    return rec


def _load():
    if not os.path.exists(MEM):
        return []
    out = []
    for line in open(MEM):
        line = line.strip()
        if line:
            try: out.append(json.loads(line))
            except Exception: pass
    return out


def learn():
    """Derive patterns from memory: per-window common states, decisions, your approval tendencies."""
    mem = _load()
    by_window = defaultdict(lambda: {"states": Counter(), "decisions": Counter(), "n": 0})
    for r in mem:
        w = by_window[r["window"]]
        w["states"][r["obs"][:40]] += 1
        w["decisions"][r["decision"]] += 1
        w["n"] += 1
    profile = {}
    for win, d in by_window.items():
        approvals = d["decisions"].get("approved", 0) + d["decisions"].get("ROUTINE", 0)
        total_dec = sum(d["decisions"].values()) or 1
        profile[win] = {
            "observations": d["n"],
            "top_state": d["states"].most_common(1)[0][0] if d["states"] else "",
            "auto_rate": round(approvals / total_dec, 2),
            "common_decision": d["decisions"].most_common(1)[0][0] if d["decisions"] else "",
        }
    return profile


def propose_help(current_states):
    """PROACTIVE: given what's on screen now + what sov has learned, suggest how to help.
    Returns proposals for the human (governed) — does NOT act. current_states: [{window, text}]."""
    profile = learn()
    proposals = []
    for s in current_states:
        win, text = s["window"], (s.get("text") or "").lower()
        p = profile.get(win, {})
        # 1) recurring routine the human almost always approves → offer to pre-handle it
        if p.get("auto_rate", 0) >= 0.7 and p.get("observations", 0) >= 3:
            proposals.append({"window": win, "kind": "offer-autopilot",
                              "why": f"you've auto-continued {win} {int(p['auto_rate']*100)}% of {p['observations']} times",
                              "suggest": f"arm {win} for routine auto-continue (still escalates judgment calls)?"})
        # 2) a judgment state that recurs → pre-stage the work so approval is one click
        if any(k in text for k in ("publish", "deploy", "merge")) and p.get("observations", 0) >= 2:
            proposals.append({"window": win, "kind": "pre-stage",
                              "why": f"{win} reaches this gate repeatedly",
                              "suggest": f"pre-run the checks for '{text[:40]}' so your approval is one click?"})
        # 3) idle + nothing learned yet → just flag, keep watching (sov is still learning)
        if not p and any(k in text for k in ("idle", "awaiting", "continue?")):
            proposals.append({"window": win, "kind": "watch",
                              "why": "no pattern yet — learning", "suggest": f"watching {win} to learn your rhythm"})
    return proposals


if __name__ == "__main__":
    # demo: seed a little memory, then show learning + proactive proposals
    if not _load():
        for _ in range(4):
            remember("agent-1", "Task complete. Continue? (y/n)", "ROUTINE")
        remember("agent-3", "Ready to PUBLISH to production — approve?", "approved")
        remember("agent-3", "Ready to PUBLISH to production — approve?", "approved")
    print("=== learned profile ===")
    print(json.dumps(learn(), indent=2))
    print("\n=== proactive proposals (governed — surfaced, not run) ===")
    now = [{"window": "agent-1", "text": "Continue? (y/n)"},
           {"window": "agent-3", "text": "Ready to PUBLISH to production — approve?"}]
    print(json.dumps(propose_help(now), indent=2))
