"""
OWEM INLINE TRAINER - training as we build.
Every sovereign action (verifier run, agent registration, sigil emission)
emits a training signal that SOV3³ absorbs into its master weave.

This is the "training as we build" pattern: the substrate learns from itself.
"""
import json, time, hashlib
from datetime import datetime

SOV3 = "http://localhost:3101/mcp"
GATEWAY = "http://localhost:8889"

def emit_sigil_inline(action, payload, source="owem_trainer"):
    """Emit a training signal as a sovereign sigil - in line."""
    line = f"OWEM|{source}|{action}|{json.dumps(payload)[:200]}"
    p = json.dumps({"jsonrpc":"2.0","id":"owem","method":"tools/call",
                    "params":{"name":"sigil_emit",
                              "arguments":{"line": line}}}).encode()
    try:
        import urllib.request
        with urllib.request.urlopen(urllib.request.Request(SOV3, p, {"Content-Type":"application/json"}), timeout=3) as r:
            return json.loads(r.read())
    except: return {"error": "offline"}

def verify_inline(text, task=None):
    """Run L6 verifier - inline, fast."""
    p = json.dumps({"jsonrpc":"2.0","id":"owem","method":"tools/call",
                    "params":{"name":"l6_verify",
                              "arguments":{"text": text[:2000], "task": task or {}}}}).encode()
    try:
        import urllib.request
        with urllib.request.urlopen(urllib.request.Request(SOV3, p, {"Content-Type":"application/json"}), timeout=3) as r:
            return json.loads(r.read()).get("result", {})
    except: return {"score": 0.5, "passed": False, "offline": True}

def register_inline(agent_id, name, description, capabilities):
    """Register a sovereign agent - inline."""
    caps = list(capabilities) + ["owem", "training", "l6-verified"]
    p = json.dumps({"jsonrpc":"2.0","id":"owem","method":"tools/call",
                    "params":{"name":"register_agent",
                              "arguments":{"agent_id":agent_id, "name":name,
                                           "description":description, "type":"owem",
                                           "tier":0, "capabilities":caps}}}).encode()
    try:
        import urllib.request
        with urllib.request.urlopen(urllib.request.Request(SOV3, p, {"Content-Type":"application/json"}), timeout=3) as r:
            return json.loads(r.read())
    except: return {"error": "offline"}

def train_on_output(text, label="general"):
    """
    TRAINING-AS-WE-BUILD: every text output is verified + signal emitted.
    Returns the score so the calling code can gate on quality.
    """
    result = verify_inline(text, {"label": label, "ts": datetime.now().isoformat()})
    score = result.get("score", 0.0)
    passed = result.get("passed", False)
    
    emit_sigil_inline("train_step", {
        "label": label,
        "score": score,
        "passed": passed,
        "text_length": len(text),
    })
    
    return {"score": score, "passed": passed, "keystone": result.get("keystone", "L6")}

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        # CLI mode: train on a text file or stdin
        import os
        text = sys.stdin.read() if len(sys.argv) == 1 or sys.argv[1] == "-" else ""
        if not text and len(sys.argv) > 1:
            text = open(sys.argv[1]).read()
        result = train_on_output(text, label=os.environ.get("LABEL", "training"))
        print(json.dumps(result))
    else:
        # Self-demo
        samples = [
            ("Article 50 EU AI Act requires transparency for AI-generated content. Compliance Article 5(1)(f).",
             "compliance"),
            ("OpenRouter Fusion API achieves Fable 5-level intelligence at half the cost.",
             "tech"),
        ]
        for text, label in samples:
            r = train_on_output(text, label)
            print(f"[{label}] score={r['score']:.3f} passed={r['passed']}")
