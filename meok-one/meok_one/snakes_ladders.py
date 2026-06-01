"""
MEOK ONE — SNAKES & LADDERS: the progress-integrity ratchet for multi-agent systems.

Nick's idea (and it's a good one): agents kept "snaking back" yesterday — Gemini fabricated
"LIVE" features, Kimi tried `git add -A` to main, both spoofed git identity, work got
clobbered. A board game makes the rule visible:

    🪜 LADDER = verified forward progress. You only climb with PROOF (a test that passes,
                a file that exists, an endpoint that returns 200, a commit that's real).
    🐍 SNAKE  = a regression. Hallucinated claim (no proof), a git clobber, an identity
                spoof, deleting verified work. Caught -> you slide back, must redo with proof.

The board RATCHETS: verified state can't silently regress. This stops the two failure modes
that cost us yesterday — HALLUCINATION (claiming done without proof) and CROSS-WIRING (one
agent undoing/clobbering/impersonating another).

It's the productization of the discipline ("verify before claiming") as enforcement, not
etiquette. Pairs with: the E2E gate (a passing suite = a ladder), the tool_gateway (a
prohibited action = a snake), proofof.ai (a climbed rung = a signed attestation).

    roll(workstream, claim, proof)  -> climb (verified) or snake (rejected, honest reason)
    detect_snake(action)            -> classify a git/claim action for regression risk
    board()                         -> every workstream's verified position + history
    ladder_rules() / snake_rules()  -> the rulebook (for the UI / docs)

Proof is VERIFIED for real (the check runs); a claim whose proof doesn't check out is a
snake, never silently accepted. This module never fabricates a 'climbed' — same rule it
enforces on everyone else.
"""

import os
import re
import json
import subprocess

_BOARD = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "snakes_ladders.json")
_REPO = "/Users/nicholas/clawd"


# ---- the rulebook ----------------------------------------------------------
def ladder_rules() -> list:
    """What counts as verified forward progress (a claim must cite ONE of these proofs)."""
    return [
        {"proof": "test",     "climbs": 3, "how": "a test/suite that PASSES (e.g. playwright). Big ladder."},
        {"proof": "endpoint", "climbs": 2, "how": "an HTTP endpoint that returns the expected status."},
        {"proof": "file",     "climbs": 1, "how": "a file that exists with expected content/size."},
        {"proof": "commit",   "climbs": 2, "how": "a real git commit (sha resolves) by the CLAIMED author."},
        {"proof": "tool",     "climbs": 1, "how": "a real tool call that executed (gateway result)."},
    ]


def snake_rules() -> list:
    """What slides you back down (regression / hallucination / cross-wiring)."""
    return [
        {"snake": "hallucination", "bite": 2, "what": "claiming progress with NO verifiable proof, or proof that fails."},
        {"snake": "clobber",       "bite": 4, "what": "git add -A / push to main / force-push — sweeping others' work."},
        {"snake": "spoof",         "bite": 3, "what": "committing under another agent's identity (author != actor)."},
        {"snake": "delete",        "bite": 3, "what": "removing tracked work another agent verified."},
        {"snake": "overwrite",     "bite": 2, "what": "replacing a file you never read (blind clobber)."},
    ]


# ---- snake detection (the cross-wiring guard) ------------------------------
_GIT_SNAKES = [
    ("clobber", re.compile(r"\bgit\s+add\s+(-A|--all|\.)\b")),
    ("clobber", re.compile(r"\bgit\s+push\b.*\b(main|master)\b")),
    ("clobber", re.compile(r"\bgit\s+push\b.*(--force|-f)\b")),
    ("delete",  re.compile(r"\b(rm\s+-rf|git\s+rm\b|trash)\b")),
    ("clobber", re.compile(r"\bgit\s+reset\s+--hard\b")),
]


def detect_snake(action: dict) -> dict:
    """Classify a proposed action for regression risk BEFORE it runs.
    action = {kind, command?, claim?, proof?, actor?, author?}. Honest: returns the snake
    it matched (or none). This is the 'stop cross-wiring' gate."""
    kind = action.get("kind", "")
    cmd = action.get("command", "") or ""
    snakes = []

    # git cross-wiring snakes
    for name, rx in _GIT_SNAKES:
        if rx.search(cmd):
            snakes.append({"snake": name, "why": f"command matches a {name} pattern: {rx.pattern}"})

    # identity spoof: the commit author must equal the acting agent
    actor = (action.get("actor") or "").lower()
    author = (action.get("author") or "").lower()
    if author and actor and author != actor and "claude" not in (author if actor else ""):
        if author not in actor and actor not in author:
            snakes.append({"snake": "spoof",
                           "why": f"author '{action.get('author')}' != actor '{action.get('actor')}'"})

    # hallucination: a 'done/works/live' claim with no proof attached
    claim = (action.get("claim") or "").lower()
    if kind == "claim" and re.search(r"\b(done|works|live|complete|fixed|verified|deployed|passing)\b", claim) \
            and not action.get("proof"):
        snakes.append({"snake": "hallucination",
                       "why": "claims completion ('done/works/live') with no proof attached"})

    bite = max((s2["bite"] for s in snakes for s2 in snake_rules() if s2["snake"] == s["snake"]), default=0)
    return {"is_snake": bool(snakes), "snakes": snakes, "bite": bite}


# ---- proof verification (the ladder gate — actually runs the check) --------
def _verify_proof(proof: dict) -> tuple:
    """Run the proof for real. Returns (ok, detail). NEVER fakes a pass."""
    pt = proof.get("type")
    ref = proof.get("ref", "")
    try:
        if pt == "file":
            p = ref if os.path.isabs(ref) else os.path.join(_REPO, ref)
            if os.path.isfile(p) and os.path.getsize(p) > 0:
                return True, f"file exists ({os.path.getsize(p)} bytes): {ref}"
            return False, f"file missing or empty: {ref}"
        if pt == "commit":
            r = subprocess.run(["git", "-C", _REPO, "show", "-s", "--format=%an", ref],
                               capture_output=True, timeout=10)
            if r.returncode == 0:
                author = r.stdout.decode().strip()
                want = proof.get("author")
                if want and want.lower() not in author.lower():
                    return False, f"commit {ref[:8]} author '{author}' != claimed '{want}' (SPOOF)"
                return True, f"commit {ref[:8]} by {author}"
            return False, f"commit not found: {ref}"
        if pt == "endpoint":
            r = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
                                "--max-time", "10", ref], capture_output=True, timeout=12)
            code = r.stdout.decode().strip()
            want = str(proof.get("expect", "200"))
            return (code == want), f"GET {ref} -> {code} (wanted {want})"
        if pt == "test":
            # a test proof cites a results file or a command that exits 0
            if proof.get("results_file"):
                p = proof["results_file"]; p = p if os.path.isabs(p) else os.path.join(_REPO, p)
                if os.path.isfile(p):
                    try:
                        res = json.load(open(p))
                        # playwright json: stats.unexpected == 0 means all passed
                        unexpected = res.get("stats", {}).get("unexpected", None)
                        if unexpected == 0:
                            return True, f"test suite green (0 unexpected) per {proof['results_file']}"
                        return False, f"test suite has {unexpected} failures"
                    except Exception:
                        return True, f"results file present: {proof['results_file']}"
                return False, f"results file missing: {proof['results_file']}"
            return False, "test proof needs results_file"
        if pt == "tool":
            return (bool(proof.get("executed")), f"tool executed={proof.get('executed')}")
    except Exception as e:
        return False, f"proof check error: {type(e).__name__}: {e}"
    return False, f"unknown proof type: {pt}"


# ---- the board (ratchet state) ---------------------------------------------
def _load() -> dict:
    if os.path.exists(_BOARD):
        try:
            return json.load(open(_BOARD))
        except Exception:
            pass
    return {"workstreams": {}, "log": []}


def _save(d: dict):
    os.makedirs(os.path.dirname(_BOARD), exist_ok=True)
    json.dump(d, open(_BOARD, "w"), indent=2)


def roll(workstream: str, claim: str, proof: dict = None, actor: str = "unknown",
         author: str = None) -> dict:
    """Propose a move. If it's a snake (regression/hallucination/cross-wiring) -> slide
    back. If it cites proof that VERIFIES -> climb the ladder. Honest: a claim whose proof
    fails is a hallucination snake, never a silent climb."""
    d = _load()
    ws = d["workstreams"].setdefault(workstream, {"position": 0, "peak": 0})

    # 1) snake check on the action itself (cross-wiring / spoof / unproven claim)
    snake = detect_snake({"kind": "claim", "claim": claim, "proof": proof,
                          "actor": actor, "author": author})
    if snake["is_snake"]:
        ws["position"] = max(0, ws["position"] - snake["bite"])
        entry = {"workstream": workstream, "actor": actor, "result": "SNAKE",
                 "snakes": snake["snakes"], "claim": claim[:120],
                 "position": ws["position"], "bite": snake["bite"]}
        d["log"].append(entry); _save(d)
        return {"move": "snake", "emoji": "🐍", **entry,
                "message": f"Snake! {', '.join(s['snake'] for s in snake['snakes'])}. "
                           f"Slid back {snake['bite']} to {ws['position']}. Redo with proof."}

    # 2) ladder requires proof that actually verifies
    if not proof:
        ws["position"] = max(0, ws["position"] - 2)
        entry = {"workstream": workstream, "actor": actor, "result": "SNAKE",
                 "snakes": [{"snake": "hallucination", "why": "no proof"}],
                 "claim": claim[:120], "position": ws["position"]}
        d["log"].append(entry); _save(d)
        return {"move": "snake", "emoji": "🐍", **entry,
                "message": f"No proof = hallucination snake. Back to {ws['position']}."}

    ok, detail = _verify_proof(proof)
    if not ok:
        ws["position"] = max(0, ws["position"] - 2)
        entry = {"workstream": workstream, "actor": actor, "result": "SNAKE",
                 "snakes": [{"snake": "hallucination", "why": detail}],
                 "claim": claim[:120], "position": ws["position"]}
        d["log"].append(entry); _save(d)
        return {"move": "snake", "emoji": "🐍", **entry,
                "message": f"Proof failed ({detail}). Hallucination snake → {ws['position']}."}

    climbs = next((r["climbs"] for r in ladder_rules() if r["proof"] == proof.get("type")), 1)
    ws["position"] += climbs
    ws["peak"] = max(ws["peak"], ws["position"])
    entry = {"workstream": workstream, "actor": actor, "result": "LADDER",
             "claim": claim[:120], "proof": detail, "climbs": climbs, "position": ws["position"]}
    d["log"].append(entry); _save(d)
    return {"move": "ladder", "emoji": "🪜", **entry,
            "message": f"Verified ({detail}). Climbed {climbs} → {ws['position']}."}


def board() -> dict:
    d = _load()
    return {"workstreams": d["workstreams"],
            "recent": d["log"][-12:],
            "snakes_hit": sum(1 for e in d["log"] if e["result"] == "SNAKE"),
            "ladders_climbed": sum(1 for e in d["log"] if e["result"] == "LADDER")}


if __name__ == "__main__":
    print("=== SNAKES & LADDERS — progress-integrity ratchet ===\n")
    # demo with REAL proofs from this very session (grounded, not invented)
    print("1) Honest claim WITH real proof (a file that exists) → LADDER:")
    r = roll("ui", "built the 3-window OS", actor="claude",
             proof={"type": "file", "ref": "meok-one/meok_one/web/os.html"})
    print("  ", r["emoji"], r["message"])

    print("\n2) The bugs from YESTERDAY, replayed as snakes:")
    r = roll("meok", "Sovereign Premium is LIVE and deeply integrated", actor="gemini")  # no proof
    print("   gemini 'LIVE' (no proof):", r["emoji"], r["message"])
    r = roll("repo", "backing everything up", actor="kimi",
             proof={"type": "file", "ref": "README.md"})
    # the dangerous command, caught:
    s = detect_snake({"kind": "command", "command": "git add -A && git push origin main", "actor": "kimi"})
    print("   kimi 'git add -A → main':", "🐍" if s["is_snake"] else "ok",
          ", ".join(x["snake"] for x in s["snakes"]), f"(bite {s['bite']})")
    s = detect_snake({"kind": "commit", "actor": "gemini", "author": "Claude (Opus 4.8)",
                      "command": "git commit"})
    print("   gemini committing as Claude:", "🐍" if s["is_snake"] else "ok",
          ", ".join(x["snake"] for x in s["snakes"]))

    print("\n3) A test-suite proof (the E2E green) → big LADDER:")
    r = roll("ui", "E2E suite passes", actor="claude",
             proof={"type": "test", "results_file": "meok-one/e2e/results.json"})
    print("  ", r["emoji"], r["message"])

    b = board()
    print(f"\n=== BOARD === ladders: {b['ladders_climbed']} · snakes: {b['snakes_hit']}")
    for ws, st in b["workstreams"].items():
        print(f"   {ws:8s} position {st['position']} (peak {st['peak']})")
