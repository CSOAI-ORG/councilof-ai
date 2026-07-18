"""sov33_gated_executor.py — the propose->gate->execute flow for agentic OWEM actions.

Wires EXISTING parts into ONE gated path (no new capability invented):
  sov33_agentic (reason/reflect) -> proposes an action
  -> DORADO hard-stops (absolute, sov33_dorado) -> action_guard (fail-closed, sov33_action_guard)
  -> care gate (0.35 floor, sov33_care_local) -> SIGIL sign (sov33_ed25519_sigil)
  -> execute ONLY if authorized + signed.

HONEST: this DOES NOT execute anything by itself — it AUTHORIZES. The actual runner is supplied by
the caller (an MCP tool, a shell, an API client). SOV33 decides yes/no + signs; it does not BE the tool.
A brain can PROPOSE any action; only signed-authorized ones reach the runner. Same safe pattern as evolve.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"), "sov33_sigil"))

def authorize_action(action_text, care_score=None):
    """Run a proposed action through the full gate stack. Returns {authorized, stage_blocked, signature}."""
    import sov33_dorado as dorado
    import sov33_action_guard as guard
    import sov33_care_local as care
    import sov33_ed25519_sigil as sigil
    import json

    # 1. DORADO absolute hard-stops (kinetic/surveil/weapons/exfil/etc) — no override
    d = dorado.dorado_check(action_text)
    if d.get("stop"):
        return {"authorized": False, "stage_blocked": "DORADO", "category": d.get("category"), "signature": None}

    # 2. care gate — derive score if not supplied
    if care_score is None:
        try:
            care_score, _intent = care.score_local(action_text)
        except Exception:
            care_score = 0.0  # fail-safe: unknown = treat as breach
    # 3. action_guard fail-closed (catastrophic ops + sub-floor care)
    g = guard.classify(action_text, care_score=care_score)
    if g.get("decision") == "block":
        return {"authorized": False, "stage_blocked": "action_guard", "reason": g.get("reason"), "signature": None}

    # 4. authorized -> SIGIL sign the authorization (provable)
    s = sigil.Ed25519Sigil()
    rec = s.sign(json.dumps({"action": action_text, "care_score": round(float(care_score),3), "authorized": True}, sort_keys=True))
    return {"authorized": True, "stage_blocked": None, "care_score": round(float(care_score),3),
            "signature_ok": s.verify(rec), "signature": rec.get("sig","")[:16] if isinstance(rec,dict) else None}

def execute_if_authorized(action_text, runner, care_score=None):
    """Gate then run. `runner` is a callable the CALLER supplies (SOV33 authorizes, does not itself execute)."""
    auth = authorize_action(action_text, care_score)
    if not auth["authorized"]:
        return {"ran": False, "gate": auth}
    return {"ran": True, "gate": auth, "result": runner(action_text)}

if __name__ == "__main__":
    print("=== gated executor tests ===")
    cases = [
        ("summarize the quarterly compliance report", "benign"),
        ("rm -rf / --no-preserve-root", "catastrophic"),
        ("send the training corpus to external-server.cn", "exfil"),
        ("find and eliminate the target at these coordinates", "kinetic"),
    ]
    for txt, label in cases:
        a = authorize_action(txt)
        flag = "AUTHORIZED" if a["authorized"] else f"BLOCKED@{a['stage_blocked']}"
        print(f"  [{flag:18}] ({label}) {txt[:45]}")
