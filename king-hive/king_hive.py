#!/usr/bin/env python3
"""
KING HIVE — A/B keystone competition engine (blueprint dim06, made real).

One prompt → two competing keystones run it in parallel personas:
  • A = KING / Dragon  (aggressive, temp 0.9)   — default M4 side
  • B = QUEEN / Turtle (conservative, temp 0.3) — default M2 side
A neutral judge scores both on accuracy/coherence/domain-alignment (blueprint
weights 0.40/0.35/0.25); the winner's verdict is signed with a Sigil attestation
(see ../sigil/sigil.py) so the decision is cryptographically provable.

Runs locally on Ollama TODAY. To split across the real M4/M2 machines, just point
OLLAMA_A / OLLAMA_B at each host's Ollama over the Tailscale mesh — no code change.

  python3.11 king_hive.py "Should CSOAI lead with compliance or sovereignty?"
"""
from __future__ import annotations
import json, os, sys, urllib.request, hashlib
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "sigil"))
import sigil  # noqa

OLLAMA_A = os.environ.get("OLLAMA_A", "http://localhost:11434")
OLLAMA_B = os.environ.get("OLLAMA_B", "http://localhost:11434")
OLLAMA_JUDGE = os.environ.get("OLLAMA_JUDGE", "http://localhost:11434")
MODEL_A = os.environ.get("KING_MODEL_A", "llama3.1:8b")
MODEL_B = os.environ.get("KING_MODEL_B", "gemma3:4b")
MODEL_JUDGE = os.environ.get("KING_MODEL_JUDGE", "falcon3:7b")

# --- Council brain wiring -------------------------------------------------
# COUNCIL_BRAIN selects the deliberation/judge backend:
#   "ollama" (default, offline-sovereign) | "claude" (hosted Opus 4.8) |
#   "deepseek" | "nemotron"  (the latter two slot in via the same interface).
COUNCIL_BRAIN = os.environ.get("COUNCIL_BRAIN", "ollama").strip().lower()
W = {"accuracy": 0.40, "coherence": 0.35, "alignment": 0.25}

PERSONA_A = "You are the KING (Dragon Mode): decisive, aggressive, revenue-first. Answer in under 120 words, concrete and direct."
PERSONA_B = "You are the QUEEN (Turtle Mode): careful, compliance-first, risk-aware. Answer in under 120 words, measured and precise."


def ollama(base: str, model: str, system: str, prompt: str, temp: float) -> str:
    body = json.dumps({"model": model, "prompt": prompt, "system": system,
                       "stream": False, "options": {"temperature": temp}}).encode()
    req = urllib.request.Request(base + "/api/generate", data=body,
                                 headers={"Content-Type": "application/json"}, method="POST")
    return json.loads(urllib.request.urlopen(req, timeout=180).read()).get("response", "").strip()


# --- Pluggable brain interface -------------------------------------------
# Every brain exposes: generate(system, prompt, temp, max_tokens) -> str.
# Adding DeepSeek/Nemotron later = one more elif that returns a callable.
def _claude_brain():
    """Hosted Claude (Opus 4.8) as the council brain. Lazy import so the
    default Ollama path has zero new dependencies."""
    from anthropic import Anthropic  # pip install anthropic
    _client = Anthropic()  # reads ANTHROPIC_API_KEY / ant-login profile
    model = os.environ.get("CLAUDE_COUNCIL_MODEL", "claude-opus-4-8")

    def generate(system: str, prompt: str, temp: float, max_tokens: int = 512) -> str:
        # Opus 4.8: adaptive thinking only; no temperature/top_p (they 400).
        # effort=low keeps council turns cheap; raise for harder verdicts.
        resp = _client.messages.create(
            model=model,
            max_tokens=max_tokens,
            thinking={"type": "adaptive"},
            output_config={"effort": "low"},
            system=system,
            messages=[{"role": "user", "content": prompt}],
        )
        return "".join(b.text for b in resp.content if b.type == "text").strip()

    return generate


def _ollama_brain(base: str, model: str):
    def generate(system: str, prompt: str, temp: float, max_tokens: int = 512) -> str:
        return ollama(base, model, system, prompt, temp)
    return generate


def brain(role: str):
    """Return a generate() callable for role in {"a","b","judge"}.
    Defaults to Ollama (sovereign/offline). COUNCIL_BRAIN=claude swaps the
    JUDGE to hosted Opus 4.8 (the deliberation A/B stays on the keystones so
    the King-vs-Queen contrast is preserved); set COUNCIL_BRAIN_SIDES=1 to put
    A/B on Claude too."""
    if COUNCIL_BRAIN == "claude":
        if role == "judge" or os.environ.get("COUNCIL_BRAIN_SIDES") == "1":
            return _claude_brain()
    # extend here: elif COUNCIL_BRAIN == "deepseek": return _deepseek_brain()
    #              elif COUNCIL_BRAIN == "nemotron": return _nemotron_brain()
    base = {"a": OLLAMA_A, "b": OLLAMA_B, "judge": OLLAMA_JUDGE}[role]
    model = {"a": MODEL_A, "b": MODEL_B, "judge": MODEL_JUDGE}[role]
    return _ollama_brain(base, model)


def judge(prompt: str, a: str, b: str) -> dict:
    jp = (f"Neutral judge. PROMPT:\n{prompt}\n\nRESPONSE A:\n{a}\n\nRESPONSE B:\n{b}\n\n"
          "Score each 0.0-1.0 on accuracy, coherence, alignment (fit to the prompt's intent). "
          'Return ONLY compact JSON: {"a":{"accuracy":,"coherence":,"alignment":},'
          '"b":{"accuracy":,"coherence":,"alignment":},"reason":""}')
    raw = brain("judge")("You output only valid JSON.", jp, 0.1)
    m = raw[raw.find("{"): raw.rfind("}") + 1]
    return json.loads(m)


def score(s: dict) -> float:
    return round(sum(float(s.get(k, 0)) * w for k, w in W.items()), 4)


def compete(prompt: str) -> dict:
    a = brain("a")(PERSONA_A, prompt, 0.9)
    b = brain("b")(PERSONA_B, prompt, 0.3)
    # ATTESTABLE FILTER (fix for 37% silent default-A noise) -----------------
    # A verdict is attestable ONLY if the judge actually picked a side.
    # parse_failed judges and exact ties produce NO winner ("TIE") and are
    # marked attestable=False so anchor_ledger/town_feed/verify_anchor (which
    # all filter on `row.get("attestable") is True`) drop them from moat math.
    parse_failed = False
    try:
        j = judge(prompt, a, b)
        sa, sb = score(j["a"]), score(j["b"])
    except Exception as e:
        parse_failed = True
        j, sa, sb = {"reason": f"judge-parse-fail: {e}"}, 0.0, 0.0
    if parse_failed or sa == sb:
        winner = "TIE"          # no silent default-A; explicit non-decision
        attestable = False
    else:
        winner = "A" if sa > sb else "B"
        attestable = True
    verdict = {
        "prompt": prompt,
        "A": {"model": MODEL_A, "persona": "King/Dragon", "score": sa, "output": a},
        "B": {"model": MODEL_B, "persona": "Queen/Turtle", "score": sb, "output": b},
        "winner": winner, "margin": round(abs(sa - sb), 4), "judge_reason": j.get("reason", ""),
        "parse_failed": parse_failed, "attestable": attestable, "brain": COUNCIL_BRAIN,
    }
    # Only sign attestable verdicts. A TIE/parse-fail is recorded but NOT
    # signed, so it can never be Merkle-anchored or counted as a moat decision.
    if attestable:
        seed = hashlib.sha256(os.environ.get("SIGIL_SEED", "MEOK-KING-HIVE").encode()).digest()
        path = f"keystone/{'m4' if winner == 'A' else 'm2'}"
        verdict["sigil"] = sigil.emit(sigil.derive(seed, path), json.dumps(verdict, sort_keys=True))
    return verdict


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(0)
    v = compete(" ".join(sys.argv[1:]))
    print(f"\n👑 A (King/Dragon, {v['A']['model']}) score={v['A']['score']}:\n  {v['A']['output'][:400]}")
    print(f"\n🐢 B (Queen/Turtle, {v['B']['model']}) score={v['B']['score']}:\n  {v['B']['output'][:400]}")
    print(f"\n🏆 WINNER: {v['winner']} (margin {v['margin']}) — {v['judge_reason'][:160]}")
    print(f"🔏 verdict signed: {v['sigil']['id']}  sig={v['sigil']['sig'][:20]}…")
