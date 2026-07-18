#!/usr/bin/env python3
"""
Sovereign Orchestrator — governed window-watcher (SAFE prototype).

Watches windows, detects idle/awaiting-input, and either auto-continues the ROUTINE
or escalates JUDGMENT calls to you — every decision SIGIL-signed. DRY-RUN by default:
it observes + proposes + signs but does NOT type a single key until you explicitly arm it.

Safety: dry-run default · kill-switch file · whitelist (not blacklist) · rate-limit ·
SIGIL on every action · destructive prompts always escalate. See SOVEREIGN_ORCHESTRATOR.md.

Run:  python3 sovereign_orchestrator.py            # dry-run, demo windows, 1 pass
      ACT=1 python3 sovereign_orchestrator.py      # ARMED (still per-window whitelist + confirm)
Kill: touch ~/.sov3/orchestrator.STOP
"""
import os, json, time, hashlib, re

ACT_ENABLED = os.environ.get("ACT", "0") == "1"        # default OFF — never types unless armed
STOP_FILE = os.path.expanduser("~/.sov3/orchestrator.STOP")
SIGIL_LOG = os.environ.get("SIGIL_LOG", os.path.expanduser("~/.sov3/orchestrator_sigil.log"))
MAX_AUTO_PER_HOUR = int(os.environ.get("MAX_AUTO_PER_HOUR", "30"))

# ROUTINE = safe to auto-continue (whitelist). Everything else escalates.
ROUTINE_PATTERNS = [r"\bcontinue\?\b", r"awaiting input", r"press enter", r"\(y/n\)\s*$",
                    r"\bgo on\b", r"more\?\s*$", r"idle", r"waiting for"]
# JUDGMENT = always escalate, never auto (destructive / outward / novel)
JUDGMENT_PATTERNS = [r"publish", r"deploy", r"delete", r"\brm\b", r"force.?push", r"pay|charge|stripe",
                     r"make public", r"merge", r"send email", r"production"]

_auto_times = []


def _sigil(op, body):
    try:
        prev = ""
        if os.path.exists(SIGIL_LOG):
            with open(SIGIL_LOG) as f:
                ls = f.readlines()
                if ls:
                    prev = json.loads(ls[-1]).get("digest", "")
        ts = int(time.time())
        dg = hashlib.sha256(f"{op}|{ts}|{prev[:8]}|{body}".encode()).hexdigest()[:16]
        os.makedirs(os.path.dirname(SIGIL_LOG), exist_ok=True)
        with open(SIGIL_LOG, "a") as f:
            f.write(json.dumps({"ts": ts, "op": op, "body": body, "prev_digest": prev, "digest": dg}) + "\n")
        return dg
    except Exception:
        return ""


def killed():
    return os.path.exists(STOP_FILE)


def rate_ok():
    now = time.time()
    global _auto_times
    _auto_times = [t for t in _auto_times if now - t < 3600]
    return len(_auto_times) < MAX_AUTO_PER_HOUR


def classify(text):
    t = (text or "").lower()
    if any(re.search(p, t) for p in JUDGMENT_PATTERNS):
        return "JUDGMENT"
    if any(re.search(p, t) for p in ROUTINE_PATTERNS):
        return "ROUTINE"
    return "JUDGMENT"  # default-escalate: unknown = ask the human


def observe():
    """Return [{window, text}]. STUB for dry-run. Live mode wires computer-use screenshot + read.
    Override by setting ORCH_WINDOWS to a JSON list of {window,text}."""
    env = os.environ.get("ORCH_WINDOWS")
    if env:
        return json.loads(env)
    return [
        {"window": "agent-1", "text": "Task complete. Continue? (y/n)"},
        {"window": "agent-2", "text": "...working on the build..."},
        {"window": "agent-3", "text": "Ready to PUBLISH 22 repos to production — approve?"},
        {"window": "agent-4", "text": "awaiting input"},
    ]


def escalate(window, text, reason):
    """Surface to MEOK OS (here: write to the escalation queue + SIGIL). The human decides."""
    q = os.path.expanduser("~/.sov3/orchestrator_escalations.jsonl")
    os.makedirs(os.path.dirname(q), exist_ok=True)
    rec = {"ts": int(time.time()), "window": window, "text": text[:200], "reason": reason}
    with open(q, "a") as f:
        f.write(json.dumps(rec) + "\n")
    _sigil("ESCALATE", f"{window}|{reason}")
    return rec


def act_continue(window, text):
    """Send a routine 'continue'. GATED: dry-run logs+signs only; armed mode would type via computer-use."""
    if not rate_ok():
        return escalate(window, text, "rate-limit hit → human")
    _auto_times.append(time.time())
    sig = _sigil("ACT", f"{window}|continue")
    if ACT_ENABLED:
        # LIVE: here you'd call computer-use: focus window + type 'continue' + enter.
        # Intentionally NOT wired in this safe prototype — arming requires a deliberate integration step.
        return {"window": window, "action": "continue", "mode": "ARMED-but-unwired", "sigil": sig}
    return {"window": window, "action": "continue", "mode": "DRY-RUN (signed, not typed)", "sigil": sig}


def tick():
    if killed():
        print("🛑 kill-switch present — halted."); return {"halted": True}
    out = {"acted": [], "escalated": []}
    for w in observe():
        cls = classify(w["text"])
        if cls == "ROUTINE":
            out["acted"].append(act_continue(w["window"], w["text"]))
        else:
            out["escalated"].append(escalate(w["window"], w["text"], "judgment-call"))
    return out


if __name__ == "__main__":
    print(f"Sovereign Orchestrator — {'ARMED' if ACT_ENABLED else 'DRY-RUN (safe, no typing)'} · kill: touch {STOP_FILE}")
    r = tick()
    print(json.dumps(r, indent=2))
    print(f"\nSIGIL trail: {SIGIL_LOG}")
