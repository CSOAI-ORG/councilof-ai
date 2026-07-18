"""meok-sovereign-feedback-mcp — Sovereign Feedback (NPS + CSAT + feature requests).

Capture end-user feedback with Charter Article 0 binding.
Track NPS, CSAT, feature requests, support tickets.
5 tools:
  1. feedback_submit      - submit feedback
  2. feedback_nps         - calculate NPS score
  3. feedback_features    - list feature requests
  4. feedback_summary     - aggregate summary
  5. feedback_status      - feedback system status
"""
from __future__ import annotations
import json, hashlib, random, string
from datetime import datetime, timezone

PROTOCOL = "sovereign-feedback/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

_FEEDBACK = []
_REQUESTS = {}


def _sign(p):
    b = json.dumps(p, sort_keys=True, default=str)
    p["kid"] = "fdb-" + hashlib.sha256(b.encode()).hexdigest()[:16]
    p["sig"] = hashlib.sha256((p["kid"] + b).encode()).hexdigest()[:16]
    p["ts"] = datetime.now(timezone.utc).isoformat()
    return p


def _gen_id(prefix):
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def feedback_submit(email: str = "", nps_score: int = 0, csat_score: int = 0, comment: str = ""):
    if not email:
        return _sign({"error": "email required"})
    if not (0 <= nps_score <= 10):
        return _sign({"error": "nps_score must be 0-10"})
    if csat_score and not (1 <= csat_score <= 5):
        return _sign({"error": "csat_score must be 1-5"})
    fb_id = _gen_id("fb")
    entry = {
        "id": fb_id, "email": email.lower(), "nps": nps_score, "csat": csat_score, "comment": comment,
        "category": "promoter" if nps_score >= 9 else "passive" if nps_score >= 7 else "detractor",
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    _FEEDBACK.append(entry)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "feedback_id": fb_id, "category": entry["category"],
        "doctrine": f"Feedback captured: {entry['category']} (NPS {nps_score}). Care Floor 0.95. Sovereign.",
    })


def feedback_nps():
    if not _FEEDBACK:
        return _sign({"protocol": PROTOCOL, "version": VERSION, "nps": 0, "promoters": 0, "passives": 0, "detractors": 0, "total": 0, "doctrine": "No feedback yet. Sovereign."})
    promoters = sum(1 for f in _FEEDBACK if f["nps"] >= 9)
    detractors = sum(1 for f in _FEEDBACK if f["nps"] <= 6)
    passives = len(_FEEDBACK) - promoters - detractors
    nps = ((promoters - detractors) / len(_FEEDBACK)) * 100
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "nps": round(nps, 2), "promoters": promoters, "passives": passives, "detractors": detractors, "total": len(_FEEDBACK),
        "doctrine": f"NPS = {nps:.1f}. Sovereign.",
    })


def feedback_features():
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "requests": list(_REQUESTS.values()), "total": len(_REQUESTS),
        "doctrine": f"Feature requests: {len(_REQUESTS)}. Sovereign.",
    })


def feedback_summary():
    if not _FEEDBACK:
        return _sign({"protocol": PROTOCOL, "version": VERSION, "total": 0, "avg_nps": 0, "avg_csat": 0, "doctrine": "No feedback yet. Sovereign."})
    avg_nps = sum(f["nps"] for f in _FEEDBACK) / len(_FEEDBACK)
    avg_csat = sum(f["csat"] for f in _FEEDBACK if f["csat"]) / max(1, sum(1 for f in _FEEDBACK if f["csat"]))
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "total": len(_FEEDBACK), "avg_nps": round(avg_nps, 2), "avg_csat": round(avg_csat, 2),
        "doctrine": f"Feedback summary: {len(_FEEDBACK)} entries, avg NPS {avg_nps:.1f}. Sovereign.",
    })


def feedback_status():
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "total_feedback": len(_FEEDBACK), "total_feature_requests": len(_REQUESTS),
        "doctrine": f"Sovereign feedback: {len(_FEEDBACK)} entries, {len(_REQUESTS)} feature requests. Sovereign.",
    })
