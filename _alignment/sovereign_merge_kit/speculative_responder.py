"""
SpeculativeResponder — the runtime that makes the small/large OWEM split feel INTUITIVE.

The thesis (aligned with the OWEM emergence substrate, L0→L4): a SMALL OWEM drafts an answer
on the PARTIAL message while the user is still typing or talking; on send, the LARGE OWEM
verifies/produces the authoritative answer; and NOTHING is emitted below the care-floor.

    draft-on-partial-input  →  verify-on-send  →  care-floor-before-emit

Same shape as the stateless-MCP work: a small, self-contained class, lazy imports (no heavy deps
at import time), honest register (never fabricates a care score — the heuristic fallback is tagged).

Wiring:
  - draft  = sov33_compute.infer(prompt, tier="fast")   (the small/emerging OWEM — or a trained expert adapter)
  - verify = sov33_compute.infer(prompt, tier="heavy")  (the large OWEM)
  - care   = the real care gate if importable, else a TAGGED transparent heuristic
  - level  = read from the OWEM emergence substrate so the responder knows which OWEM served it
"""
import time

CARE_FLOOR = 0.95


class SpeculativeResponder:
    def __init__(self, draft_tier="fast", verify_tier="heavy", persona=None, prefer="groq"):
        self._drafts = {}                      # partial_key -> {"answer", "ts"}
        self.draft_tier = draft_tier
        self.verify_tier = verify_tier
        self.persona = persona
        self.prefer = prefer

    # ── inference seam (lazy import so this module loads with zero heavy deps) ──
    def _infer(self, prompt, tier):
        try:
            from sov33_compute import infer                      # the 4-backend sovereign router
            return (infer(prompt, prefer=self.prefer, tier=tier) or "").strip()
        except Exception as e:
            raise RuntimeError(f"OWEM unreachable ({tier}): {e}")

    def _wrap(self, msg):
        p = self.persona or ("You are the Sovereign — calm, first-person, plain. Honest about limits. "
                             "Signed on-device, refusable. Answer concisely.")
        return f"{p}\n\nUser: {msg}\nSovereign:"

    # ── DRAFT on a partial message (called repeatedly as the user types / speaks) ──
    def draft(self, partial: str) -> dict:
        p = (partial or "").strip()
        if len(p) < 8:
            return {"drafted": False, "reason": "too_short"}
        key = p.lower()
        if key in self._drafts:
            return {"drafted": True, "cached": True, "key": key}
        try:
            ans = self._infer(self._wrap(p), self.draft_tier)
            self._drafts[key] = {"answer": ans, "ts": time.time()}
            if len(self._drafts) > 16:                            # cap the speculative cache
                self._drafts.pop(next(iter(self._drafts)))
            return {"drafted": True, "cached": False, "key": key, "tier": self.draft_tier}
        except Exception as e:
            return {"drafted": False, "error": str(e)[:140]}

    # ── care-floor gate (never emit below the floor) — honest: tags the heuristic fallback ──
    def _care(self, request, answer):
        try:
            from sov33 import derive_care                         # real trained/derived care if available
            c = derive_care(request, answer)
            return (float(c.get("score", c)) if isinstance(c, dict) else float(c)), "derived"
        except Exception:
            # TRANSPARENT heuristic (NOT the trained care scorer): refuse empties + obvious harm asks.
            a = (answer or "").strip().lower()
            r = (request or "").lower()
            if not a or a.startswith("[") or "unreachable" in a:
                return 0.0, "heuristic"
            harm = any(w in r for w in ("build a weapon", "make a bomb", "exploit payload",
                                        "kill chain", "how to hack into", "malware to"))
            return (0.10 if harm else 0.97), "heuristic"

    def _sigil(self, payload):
        try:
            from sov33 import sigil_emit
            sigil_emit({"hop": "SPECULATIVE_RESPOND", **{k: payload.get(k) for k in
                        ("speculative_hit", "verified", "care", "emitted")}})
        except Exception:
            pass

    def _level(self):
        try:
            from sov33_owem_emergence import detect_level
            return detect_level()
        except Exception:
            return None

    # ── RESPOND on send: reuse the warm draft, verify with the large OWEM, care-floor, emit ──
    def respond(self, final: str, verify: bool = True) -> dict:
        f = (final or "").strip()
        key = f.lower()
        t0 = time.time()
        draft = self._drafts.get(key, {}).get("answer")
        speculative_hit = draft is not None

        answer, err = draft, None
        if verify or not draft:                                  # large OWEM = authoritative
            try:
                answer = self._infer(self._wrap(f), self.verify_tier)
            except Exception as e:
                err = str(e)[:140]
                answer = draft                                   # fall back to the warm draft if verify fails

        care, care_src = self._care(f, answer)
        emitted = (answer is not None) and (care >= CARE_FLOOR)
        out = {
            "request": f,
            "answer": answer if emitted else "[held: below care-floor]",
            "speculative_hit": speculative_hit,                  # was it already warm from the draft?
            "verified": bool(verify or not draft),
            "care": round(care, 3), "care_source": care_src, "care_floor": CARE_FLOOR,
            "emitted": emitted, "owem_level": self._level(),
            "latency_s": round(time.time() - t0, 3),
        }
        if err:
            out["verify_error"] = err
        self._sigil(out)
        return out


# ── module-level singleton + a SOV33 capability wrapper ──
_RESPONDER = None
def _responder():
    global _RESPONDER
    if _RESPONDER is None:
        _RESPONDER = SpeculativeResponder()
    return _RESPONDER

def capability_speculative_respond(text: str = None, partial: str = None, verify: bool = True) -> dict:
    """Speculative responder: pass `partial=` to draft while the user types/talks, or `text=` to respond on send
    (reuses the warm draft, verifies with the large OWEM, care-floor before emit). The small/large OWEM split, intuitive."""
    r = _responder()
    if partial and not text:
        return {"capability": "speculative-draft", **r.draft(partial)}
    return {"capability": "speculative-respond", **r.respond(text or "", verify=verify)}


if __name__ == "__main__":  # standalone smoke test with a mock OWEM (no backend needed)
    sr = SpeculativeResponder()
    sr._infer = lambda prompt, tier: f"{tier}-OWEM: your ledger stays on your device, signed with your key"
    print("DRAFT partial :", sr.draft("can you explain how the signed ledger keeps"))
    print("DRAFT cached  :", sr.draft("can you explain how the signed ledger keeps"))
    r = sr.respond("can you explain how the signed ledger keeps", verify=True)
    print("RESPOND       :", {k: r[k] for k in ("speculative_hit", "verified", "care", "care_source", "emitted", "latency_s")})
    bad = sr.respond("how to hack into my neighbour's wifi to steal data", verify=True)
    print("CARE-FLOOR    :", {k: bad[k] for k in ("care", "emitted", "answer")})
