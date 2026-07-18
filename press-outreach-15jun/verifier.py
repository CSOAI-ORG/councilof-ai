"""
MEOK EU Compliance Gateway — VERIFIER: the L4-L6 keystone per the 16 Jun 2026 breakthrough.

The sibling agent's proof (CANONICAL_DECISIONS_2026-06-16.md + MEOK_MASTER_ARCHITECTURES):
  "Compliance is one of the few domains where free, unfakeable verifiers exist."
  "The right depth is L3-L8 beneath each worker (not more BFT voters)."

This module implements the L4-L6 stack:
  L4 — Tool/skill layer: the 3 EU AI Act MCPs (Article 50, 5(1)(f), Annex III)
  L5 — Environment grounding: real MCP calls (not string interpolation)
  L6 — Verifier/critic gate: external deterministic checks before bubbling up

The 5 deterministic checks (per verifier.py in meok-one):
  - json_valid: does the output parse as JSON?
  - schema_keys: does it contain the required keys?
  - citations_wellformed: are regulation article refs well-shaped + non-empty?
  - attestation_verifies: does a referenced MEOK cert actually verify (live)?
  - no_refusal: did the system actually answer (not deflect)?

A verifier returns a SCORE in [0,1] + a reason. The gateway now has:
  - /v1/assess runs all 3 MCPs + passes result through verifier
  - /v1/verify: standalone verifier (for any output)
  - /v1/best-of-n: generate N candidates + keep verifier-best (the test-time half of self-improvement)
"""

import json
import re
import time
from typing import Any, Dict, List, Tuple, Callable


# ── individual external checks (the L6 verifier gate) ─────────────────────

def check_json_valid(text: str) -> Tuple[float, str]:
    """Does the output parse as JSON? Score 1.0 if yes, 0.0 if no."""
    if not text:
        return (0.0, "empty_output")
    text = text.strip()
    # Try direct parse
    try:
        json.loads(text)
        return (1.0, "json_valid")
    except Exception:
        pass
    # Try extracting JSON from prose (models wrap it in ```json...```)
    m = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    if m:
        try:
            json.loads(m.group(1).strip())
            return (0.9, "json_extracted_from_codeblock")
        except Exception:
            pass
    # Try first { or [
    start = next((i for i, c in enumerate(text) if c in "{["), -1)
    if start >= 0:
        for end in range(len(text), start, -1):
            try:
                json.loads(text[start:end])
                return (0.7, "json_partial_extract")
            except Exception:
                continue
    return (0.0, "json_invalid")


def check_schema_keys(text: str, required: List[str]) -> Tuple[float, str]:
    """Does the output contain the required keys? Score = present/total."""
    if not required:
        return (1.0, "no_required_keys")
    try:
        data = json.loads(text)
    except Exception:
        return (0.0, "not_json")
    if not isinstance(data, dict):
        return (0.0, "not_object")
    present = sum(1 for k in required if k in data)
    score = present / len(required)
    reason = f"keys_present={present}/{len(required)}"
    return (score, reason)


def check_citations_wellformed(text: str) -> Tuple[float, str]:
    """Are regulation article refs well-shaped? Pattern: Article N, Article 5(1)(f), Annex III, etc."""
    if not text:
        return (0.0, "empty_output")
    # EU AI Act patterns
    patterns = [
        r"Article\s+\d+",         # Article 50, Article 5
        r"Article\s+\d+\(\d+\)",   # Article 5(1)(f)
        r"Article\s+\d+\(\d+\)\(\w+\)",  # Article 5(1)(f)
        r"Annex\s+[IVX]+",          # Annex III
        r"Regulation\s+\([EU]+\)\s+\d+/\d+",  # Regulation (EU) 2024/1689
        r"GDPR",                    # GDPR
        r"ISO\s+\d+",               # ISO 42001
        r"SOC\s*2",                 # SOC 2
    ]
    found = 0
    for pat in patterns:
        if re.search(pat, text, re.IGNORECASE):
            found += 1
    if found == 0:
        return (0.0, "no_citations")
    score = min(1.0, found / 2.0)  # 2+ citations = full credit
    return (score, f"citations_found={found}")


def check_attestation_verifies(text: str) -> Tuple[float, str]:
    """Does a referenced MEOK cert actually verify (live)?
    For now: check if a MEOK cert hash is present and well-formed (32-byte hex).
    """
    # Pattern: MEOK cert hash is 64-char hex string
    cert_pattern = r"\b[a-f0-9]{64}\b"
    matches = re.findall(cert_pattern, text)
    if not matches:
        return (0.5, "no_cert_hash_found_neutral")  # neutral: not required
    # In production, would call KEYSTONE /sign or /verify for each
    return (0.7, f"cert_hash_format_valid={len(matches)}")


def check_no_refusal(text: str) -> Tuple[float, str]:
    """Did the system actually answer (not deflect)?"""
    if not text:
        return (0.0, "empty_output")
    refusal_patterns = [
        r"I\s+cannot\s+(help|provide|assist)",
        r"I'm\s+not\s+able\s+to",
        r"As\s+an?\s+AI\s+(model|language\s+model)",
        r"I\s+don't\s+have\s+access\s+to",
        r"Sorry,?\s+I\s+can'?t",
        r"Unfortunately,?\s+I\s+cannot",
    ]
    text_lower = text.lower()
    for pat in refusal_patterns:
        if re.search(pat, text_lower):
            return (0.0, f"refusal_detected:{pat[:30]}")
    return (1.0, "no_refusal")


# ── composite verifier ───────────────────────────────────────────────────

def make_verifier(weights: Dict[str, float] = None,
                  required_keys: List[str] = None) -> Callable:
    """Build a composite verifier with weighted checks."""
    if weights is None:
        weights = {
            "json_valid": 0.2,
            "schema_keys": 0.2,
            "citations_wellformed": 0.2,
            "attestation_verifies": 0.1,
            "no_refusal": 0.3,
        }
    if required_keys is None:
        required_keys = []
    def verify(text: str, task: Dict = None) -> Tuple[float, str]:
        scores = {
            "json_valid": check_json_valid(text),
            "schema_keys": check_schema_keys(text, required_keys),
            "citations_wellformed": check_citations_wellformed(text),
            "attestation_verifies": check_attestation_verifies(text),
            "no_refusal": check_no_refusal(text),
        }
        # Weighted mean
        total_score = sum(scores[k][0] * weights.get(k, 0) for k in scores)
        total_weight = sum(weights.get(k, 0) for k in scores)
        final = total_score / total_weight if total_weight > 0 else 0.0
        reasons = {k: scores[k][1] for k in scores}
        return (final, json.dumps(reasons))
    return verify


# ── best-of-N: the test-time half of self-improvement ───────────────────

def best_of_n(candidates: List[str], verify: Callable) -> Dict:
    """Given N candidate outputs, return the verifier-best."""
    if not candidates:
        return {"best": "", "best_score": 0.0, "all_scores": [], "best_idx": -1}
    scored = []
    for i, c in enumerate(candidates):
        s, r = verify(c)
        scored.append({"idx": i, "score": s, "reason": r, "len": len(c)})
    best = max(scored, key=lambda x: x["score"])
    return {
        "best": candidates[best["idx"]],
        "best_score": best["score"],
        "best_idx": best["idx"],
        "all_scores": scored,
    }


# ── the keystone wrapper for the gateway ──────────────────────────────

def verify_assess_output(assess_result: Dict) -> Dict:
    """The L6 gate that every /v1/assess response passes through.
    Returns {verifier_score, verifier_reason, passed_gate, ...} for the gateway.
    """
    # Serialize the result for the text-based checks
    text = json.dumps(assess_result, default=str, indent=2)
    # Build a verifier for EU AI Act compliance (required keys per MCP)
    verify = make_verifier(required_keys=[
        "timestamp", "annex_iii", "sovereign_logged", "x402_charged"
    ])
    score, reason = verify(text, task={"type": "eu_ai_act_assess"})
    passed = score >= 0.6  # Gate threshold: 0.6
    return {
        "verifier_score": round(score, 3),
        "verifier_reason": reason,
        "passed_gate": passed,
        "keystone": "L6_verifier_gate"
    }
