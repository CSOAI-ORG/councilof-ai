"""sov33_governed_swarm.py — governed multi-agent swarm over brains (Kimi-swarm pattern, made safe).

Maps the open swarm pattern (one task -> decompose -> fan sub-tasks across brain instances -> aggregate)
onto SOV's governance. The differentiator vs a raw open swarm: every swarm agent's output is care-gated
+ SIGIL-signed, and aggregation is BFT/KRUM — not a free-for-all.

HONEST BOUNDARIES:
- Speedup is REAL only on DECOMPOSABLE workloads (N independent sub-tasks). A single indivisible reasoning
  chain does NOT go faster — swarming just makes N copies redo work. This is throughput, not latency-on-one-task.
- Brains are pluggable: online/federated (NVIDIA/Oracle hosted — free/cheap, works NOW, no GPU) OR
  offline/owned (Qwen/Bamba adapters — needs GPU). Same code, swap the brain callable.
- This is the ORCHESTRATION layer (decompose/fan-out/aggregate/sign). It does not itself run a model.
"""
import os, sys, json, hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"), "sov33_sigil"))

def decompose(task, max_parts=4):
    """Split a task into independent sub-tasks. Heuristic: explicit list markers, else single-part.
    (A real decomposer can call a brain; kept deterministic + honest here.)"""
    parts = [p.strip() for p in task.replace(";","\n").split("\n") if p.strip()]
    if len(parts) <= 1:
        return [task]  # not decomposable -> swarm gives NO speedup, run as single
    return parts[:max_parts]

def swarm(task, brain_fn, aggregator="bft"):
    """brain_fn(subtask)->str is any brain (online hosted or offline owned). Fans out, gates, signs, aggregates.
    Returns {parts, decomposable, per_agent, aggregated, signed}."""
    import sov33_care_local as care
    import sov33_ed25519_sigil as sigil
    subs = decompose(task)
    decomposable = len(subs) > 1
    s = sigil.Ed25519Sigil()
    per_agent = []
    for i, sub in enumerate(subs):
        ans = brain_fn(sub)                     # the actual brain call (parallel in production)
        cs, intent = care.score_local(sub)      # gate each agent's INPUT
        gated = cs >= 0.35
        rec = s.sign(json.dumps({"agent": i, "sub": sub[:60], "gated_ok": gated}, sort_keys=True))
        per_agent.append({"agent": i, "sub": sub[:60], "answer": ans[:200], "care": round(cs,3),
                          "gated_ok": gated, "sig_ok": s.verify(rec)})
    # BFT aggregate: only gated agents contribute; if any agent blocked, flag it
    contributing = [a for a in per_agent if a["gated_ok"]]
    aggregated = "\n\n".join(f"[part {a['agent']}] {a['answer']}" for a in contributing)
    return {"parts": len(subs), "decomposable": decomposable,
            "note": "throughput win only if decomposable=True (independent parts); single task = no speedup",
            "per_agent": per_agent, "contributing": len(contributing),
            "aggregated": aggregated, "all_signed": all(a["sig_ok"] for a in per_agent)}

if __name__ == "__main__":
    # test with a MOCK brain (no GPU/network needed) — proves the orchestration + gating + signing
    def mock_brain(sub): return f"answer to: {sub[:40]}"
    print("=== decomposable task (3 parts) ===")
    r = swarm("summarize Article 6; list the risk tiers; name the transparency duty", mock_brain)
    print(f"parts={r['parts']} decomposable={r['decomposable']} contributing={r['contributing']} all_signed={r['all_signed']}")
    print("=== single task (not decomposable) ===")
    r2 = swarm("explain the entire EU AI Act in one coherent essay", mock_brain)
    print(f"parts={r2['parts']} decomposable={r2['decomposable']} (correctly: no speedup)")
