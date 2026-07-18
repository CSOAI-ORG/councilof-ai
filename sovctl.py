#!/usr/bin/env python3
"""
sovctl — the Sovereign Orchestrator cockpit (real, working control surface).

The human-in-loop console: see what sov wants to do, approve/deny, see what it's
learned, and hit the kill-switch. Reads the live queues the orchestrator writes;
every decision feeds memory (so sov learns from your calls). Governed by design.

  sovctl status     — pending escalations + proactive proposals
  sovctl learn      — what sov has learned about your windows
  sovctl approve W  — approve window W's pending action (records → memory)
  sovctl deny W     — deny it (records → memory)
  sovctl stop       — arm the kill-switch (halts all orchestrator action)
  sovctl start      — clear the kill-switch
  sovctl tick       — run one governed observe pass now (dry-run)
"""
import os, sys, json, time

ESC = os.path.expanduser("~/.sov3/orchestrator_escalations.jsonl")
STOP = os.path.expanduser("~/.sov3/orchestrator.STOP")


def _load(path):
    if not os.path.exists(path):
        return []
    out = []
    for line in open(path):
        line = line.strip()
        if line:
            try: out.append(json.loads(line))
            except Exception: pass
    return out


def _pending():
    # escalations not yet decided (decision file marks them resolved)
    decided = {d["window"] + "|" + str(d["ts"]) for d in _load(ESC + ".decided")}
    return [e for e in _load(ESC) if e["window"] + "|" + str(e["ts"]) not in decided]


def status():
    killed = os.path.exists(STOP)
    print(f"🐉 Sovereign Orchestrator — {'🛑 STOPPED (kill-switch armed)' if killed else '🟢 watching'}")
    pend = _pending()
    print(f"\n── {len(pend)} pending escalation(s) (need your call) ──")
    for e in pend[-10:]:
        print(f"  [{e['window']}] {e.get('reason','')}: {e['text'][:70]}")
    try:
        import sovereign_memory as mem
        cur = [{"window": e["window"], "text": e["text"]} for e in pend]
        props = mem.propose_help(cur) if cur else []
        if props:
            print(f"\n── {len(props)} proactive proposal(s) (sov working out how to help) ──")
            for p in props:
                print(f"  💡 [{p['window']}] {p['suggest']}  ({p['why']})")
    except Exception:
        pass
    print(f"\n  approve/deny: sovctl approve <window> | sovctl deny <window>")


def decide(window, verdict):
    pend = [e for e in _pending() if e["window"] == window]
    if not pend:
        print(f"no pending escalation for {window}"); return
    e = pend[-1]
    with open(ESC + ".decided", "a") as f:
        f.write(json.dumps({**e, "verdict": verdict, "decided_ts": int(time.time())}) + "\n")
    try:
        import sovereign_memory as mem
        mem.remember(window, e["text"], "approved" if verdict == "approve" else "denied")
    except Exception:
        pass
    print(f"✅ {verdict}ed {window} — recorded to memory (sov learns from this)")


def learn():
    try:
        import sovereign_memory as mem
        prof = mem.learn()
        if not prof:
            print("nothing learned yet — sov is still watching."); return
        print("🧠 What sov has learned:")
        for win, p in prof.items():
            print(f"  [{win}] {p['observations']} obs · auto-rate {int(p['auto_rate']*100)}% · usually '{p['common_decision']}'")
    except Exception as e:
        print("learn error:", e)


def stop():
    os.makedirs(os.path.dirname(STOP), exist_ok=True)
    open(STOP, "w").write(str(int(time.time())))
    print("🛑 kill-switch ARMED — orchestrator halted.")


def start():
    try: os.remove(STOP); print("🟢 kill-switch cleared — orchestrator watching.")
    except OSError: print("🟢 already running.")


def tick():
    try:
        import sovereign_orchestrator as o
        print(json.dumps(o.tick(), indent=2))
    except Exception as e:
        print("tick error:", e)


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    arg = sys.argv[2] if len(sys.argv) > 2 else None
    {"status": status, "learn": learn, "stop": stop, "start": start, "tick": tick,
     "approve": lambda: decide(arg, "approve"), "deny": lambda: decide(arg, "deny"),
     }.get(cmd, status)()
