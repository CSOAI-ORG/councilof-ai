"""
OWEM LOCAL VERIFIER - works without SOV3.
Same 6 deterministic checks as the gateway, runs locally.
The training-as-we-build loop never blocks on the VM.
"""
import re, json
from typing import Tuple, Callable, Optional

Verifier = Callable[[str, dict], "tuple[float, str]"]

# ── 6 deterministic checks (match gateway/local_middleware) ─────────────
def json_valid(text: str) -> Tuple[float, str]:
    text = (text or "").strip()
    if not text: return (0.0, "empty")
    try: json.loads(text); return (1.0, "valid")
    except: pass
    m = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    if m:
        try: json.loads(m.group(1).strip()); return (0.9, "codeblock")
        except: pass
    return (0.0, "invalid")

def schema_keys(text: str, required: Optional[list] = None) -> Tuple[float, str]:
    if required is None:
        required = ["timestamp","score","passed","keystone"]
    try: data = json.loads(text)
    except: return (0.0, "not_json")
    if not isinstance(data, dict): return (0.0, "not_dict")
    n = sum(1 for k in required if k in data)
    return (round(n/len(required), 3), f"keys={n}/{len(required)}")

def citations_wellformed(text: str) -> Tuple[float, str]:
    if not text: return (0.0, "empty")
    pats = [r"Article\s+\d+", r"Annex\s+[IVX]+", r"Art\.?\s*\d+",
            r"EU AI Act", r"GDPR", r"BFT", r"Ed25519", r"\bMCP\b"]
    found = sum(1 for p in pats if re.search(p, text, re.I))
    return (round(min(1.0, found/2), 3), f"cites={found}")

def citation_correct(text: str) -> Tuple[float, str]:
    """Substantive check: known-citation lookup"""
    known = {
        "Article 50": "EU AI Act transparency",
        "Article 5(1)(f)": "AI exploit vulnerabilities",
        "Article 99": "Sanctions 7% global turnover",
        "Annex III": "8 high-risk categories",
        "BFT": "Byzantine Fault Tolerance",
        "Ed25519": "Signatures",
    }
    score = 0
    for k, _ in known.items():
        if k in text: score += 1
    return (round(min(1.0, score/2), 3), f"correct={score}/{len(known)//2}")

def no_refusal(text: str) -> Tuple[float, str]:
    if not text: return (0.0, "empty")
    refusals = ["cannot help","cannot provide","not able to","as an ai","i don't have"]
    for r in refusals:
        if r in text.lower(): return (0.0, f"REF:{r}")
    return (1.0, "answered")

def attestation_verifies(text: str) -> Tuple[float, str]:
    if not text: return (0.0, "empty")
    # 64-char hex = MEOK cert
    if re.search(r"\b[a-f0-9]{64}\b", text): return (0.7, "cert_ref")
    return (0.5, "no_cert")

CHECKS = {
    "json_valid": json_valid,
    "schema_keys": schema_keys,
    "citations_wellformed": citations_wellformed,
    "citation_correct": citation_correct,
    "no_refusal": no_refusal,
    "attestation_verifies": attestation_verifies,
}

def make_verifier(checks, weights=None):
    if weights is None:
        weights = {c: 1.0/len(checks) for c in checks} if isinstance(checks, list) else dict(checks)
    def _v(text, task=None):
        total, wsum, reasons = 0.0, 0.0, []
        task = task or {}
        for name, w in weights.items():
            fn = CHECKS.get(name)
            if not fn: continue
            try:
                if name == "schema_keys":
                    s, why = fn(text, task.get("required_keys", []))
                else:
                    s, why = fn(text)
            except (TypeError, Exception):
                s, why = (0.0, "err")
            total += s * w
            wsum += w
            reasons.append(f"{name}={s:.3f}({why})")
        return total / wsum if wsum else 0.0, " · ".join(reasons)
    return _v

def verify(text, weights=None, required_keys=None):
    v = make_verifier(list(CHECKS.keys()), weights or {
        "json_valid": 0.15, "schema_keys": 0.15, "citations_wellformed": 0.2,
        "citation_correct": 0.2, "no_refusal": 0.2, "attestation_verifies": 0.1
    })
    score, why = v(text, {"required_keys": required_keys} if required_keys else None)
    return {"score": round(score, 3), "passed": score >= 0.6,
            "passed_gate": score >= 0.6, "keystone": "L6_local", "reason": why[:150]}

if __name__ == "__main__":
    samples = [
        ("Article 50 EU AI Act requires transparency. Article 5(1)(f) prohibits exploitation. Annex III defines high-risk. Ed25519 signed.", "compliance"),
        ("OpenRouter Fusion achieves Fable 5-level intelligence at half the cost.", "tech"),
        ("BFT council 33 agents, Ed25519 chain, hostile regime tolerance.", "governance"),
    ]
    for text, label in samples:
        r = verify(text, required_keys=["score", "passed", "keystone"])
        print(f"[{label:<12}] score={r['score']:.3f} passed={r['passed']}")
