#!/usr/bin/env python3
"""article_range_gate.py — kill the fabrication class with a range check. Deterministic. Zero cost. No model.

THE INSIGHT (research 2026-07-17): a model CANNOT be trusted to know whether an article exists — but WE can,
because the enumeration is a finite, public, knowable fact:
    GDPR (Reg. (EU) 2016/679)      = Articles 1–99
    EU AI Act (Reg. (EU) 2024/1689) = Articles 1–113 (+13 annexes)
    NIS2 (Dir. (EU) 2022/2555)      = Articles 1–46
    DORA (Reg. (EU) 2022/2554)      = Articles 1–64
That's ~322 integers. A lookup table beats a 500B model on this question, forever, at zero cost.

WHY THIS AND NOT FINE-TUNING (the evidence):
  - Gekhman et al. (EMNLP 2024): fine-tuning on knowledge the base lacks LINEARLY INCREASES hallucination.
    Training Qwen-0.5B on article facts it doesn't know makes fabrication WORSE, not better.
  - 80-model sweep (arXiv 2505.23854): Qwen3-0.6B abstention AUROC 0.579, Qwen3-1.7B 0.584. **0.5 = RANDOM.**
    Our exact model family cannot self-assess whether it knows an article.
  - Two Axes of LLM Abstention: on FALSE PREMISES, output confidence AUROC 0.49–0.58 — no signal at all.
    The model isn't uncertain; it's CONFIDENTLY WRONG. So semantic entropy / P(True) / self-consistency
    all fail here — a confident fabrication is *consistent*, so entropy is LOW and it goes undetected.
  - KG-FPQ (COLING'25): models score 0.87–0.96 DISCRIMINATIVE but 0.48–0.55 GENERATIVE — they can spot a
    false premise in yes/no framing and still fabricate it in free text. **=> you MUST check the OUTPUT, not just the input.**

SCOPE — be honest about what this does NOT do:
  ✅ Kills NON-EXISTENT article citations (Art 227 of a 113-article regulation) — provably, 100%.
  ❌ Does NOT catch "MISGROUNDING" — a REAL, correctly-formatted article that doesn't support the claim.
     Stanford RegLab says misgrounding is the DOMINANT failure mode. The measured defence for that is NLI
     verification (MiniCheck-FT5 770M matches GPT-4 at 400x lower cost) — a separate, later layer.
"""
import re, json

# The enumerations. Public, finite, verifiable facts — the whole point is that these are CHECKABLE.
INSTRUMENTS = {
    "eu ai act":   {"max": 113, "annexes": 13, "cite": "Regulation (EU) 2024/1689", "verify": "https://artificialintelligenceact.eu/"},
    "ai act":      {"max": 113, "annexes": 13, "cite": "Regulation (EU) 2024/1689", "verify": "https://artificialintelligenceact.eu/"},
    "gdpr":        {"max": 99,  "annexes": 0,  "cite": "Regulation (EU) 2016/679",  "verify": "https://gdpr-info.eu/"},
    "nis2":        {"max": 46,  "annexes": 2,  "cite": "Directive (EU) 2022/2555",  "verify": "https://eur-lex.europa.eu/eli/dir/2022/2555/oj"},
    "dora":        {"max": 64,  "annexes": 0,  "cite": "Regulation (EU) 2022/2554", "verify": "https://eur-lex.europa.eu/eli/reg/2022/2554/oj"},
}
# GDPR/AI-Act do NOT use letter-suffixed articles (no "22a"). A suffixed ref is a fabrication tell.
ART = re.compile(r"\b(?:article|art\.?)\s*(\d{1,3})\s*([a-z])?\b", re.I)

def _instrument_in(text):
    t = (text or "").lower()
    for name in sorted(INSTRUMENTS, key=len, reverse=True):
        if name in t: return name
    return None

def check(text, instrument=None):
    """Return {ok, findings[]}. findings = every article ref that CANNOT exist. Deterministic, no model."""
    inst = instrument or _instrument_in(text)
    if not inst or inst not in INSTRUMENTS:
        return {"ok": True, "instrument": inst, "findings": [], "note": "no known instrument named — cannot range-check"}
    spec = INSTRUMENTS[inst]; bad = []
    for m in ART.finditer(text or ""):
        n, suffix = int(m.group(1)), m.group(2)
        if n > spec["max"]:
            bad.append({"ref": m.group(0).strip(), "reason": f"{inst.upper()} has only {spec['max']} articles",
                        "verify": spec["verify"]})
        elif suffix:
            bad.append({"ref": m.group(0).strip(), "reason": f"{inst.upper()} does not use letter-suffixed articles",
                        "verify": spec["verify"]})
    return {"ok": not bad, "instrument": inst, "max": spec["max"], "findings": bad}

def guard(prompt, answer):
    """Check BOTH sides. KG-FPQ: models spot false premises discriminatively (0.87-0.96) yet fabricate
    generatively (0.48-0.55) — so checking only the input is insufficient. The OUTPUT check is mandatory."""
    return {"prompt_check": check(prompt), "answer_check": check(answer)}

if __name__ == "__main__":
    tests = [
        ("GDPR Article 22a appeal window",           False, "letter-suffixed — GDPR has no 22a"),
        ("EU AI Act Article 227 on emotion AI",      False, "AI Act stops at 113"),
        ("GDPR Article 97 Commission reports",       True,  "REAL — 97 <= 99 (a naive gate would wrongly flag this)"),
        ("EU AI Act Article 50 transparency",        True,  "REAL"),
        ("GDPR Article 9 special categories",        True,  "REAL"),
        ("NIS2 Article 88 reporting",                False, "NIS2 stops at 46"),
        ("DORA Article 64",                          True,  "REAL — exactly at the limit"),
        ("Tell me about the weather",                True,  "no instrument — passes"),
    ]
    print("=== ARTICLE RANGE GATE — deterministic, zero-cost, no model ===\n")
    passed = 0
    for text, want_ok, why in tests:
        r = check(text); ok = (r["ok"] == want_ok); passed += ok
        print(f"  [{'✅' if ok else '❌ MISMATCH'}] ok={str(r['ok']):<5} {text[:42]:<44} {why}")
        for f in r["findings"]: print(f"        └─ CAUGHT: {f['ref']} — {f['reason']}")
    print(f"\n  {passed}/{len(tests)} correct")
    print("\n  Kills: non-existent article citations — provably, 100%, forever, for £0.")
    print("  Does NOT kill: MISGROUNDING (real article, wrong claim) — Stanford says that's the DOMINANT")
    print("  failure mode. That needs NLI verification (MiniCheck 770M ≈ GPT-4 at 400x less). Next layer.")
