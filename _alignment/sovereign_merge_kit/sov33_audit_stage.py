#!/usr/bin/env python3
"""sov33_audit_stage.py — Stage 7 AUDIT, as runnable code (was PARTIAL: only a discipline).
Traces claims in a piece of output and flags the overclaim patterns this estate keeps hitting.
NOT an LLM judge — a deterministic pattern auditor for the KNOWN failure modes, so it runs free,
fast, and the same way every time. It catches the specific errors we corrected this session.
Honest: it flags PATTERNS (candidates for human/LLM review), it does not adjudicate truth.
"""
import re, json

# the known overclaim patterns, each with why it's flagged (from this estate's own corrections)
PATTERNS = [
    ("additive_params", r"\b\d+(\.\d+)?\s?[TB]\b.*(aggregate|total|beats|combined|stack)|beats\s+GPT",
     "additive parameter-count claim — summing stacked-model params is a category error; active compute ~3B+70B"),
    ("multiplied_params", r"count(ed|s)?\s+\d+x|x\d+\s+(in|across)\s+.*paths?",
     "parameter counts multiplied by path-count — counting the same model N times"),
    ("uncalibrated_score", r"\bscore\b.*0\.9[0-9]|0\.9[0-9].*(beats|passes|threshold)",
     "high 'score' with no correctness grading — verify it's ground-truth graded, not a proxy"),
    ("unverified_running", r"\b(live|running|works|verified|wired)\b",
     "RUNNING/verified claim — require output shown in the same window before accepting"),
    ("dorado_hardstop", r"DORADO.*(hard.?stop|kinetic|surveillance|severed)",
     "DORADO conflation — DORADO is the ZK-SNARK sovereignty-proof tool, NOT the hard-stops module"),
    ("bft_theatre", r"BFT.*(guarantee|correct|33/33|quorum).*(correct|guarantee)|majority.?vote.*(safe|correct)",
     "BFT-as-correctness-guarantee — only holds if checkers are decorrelated (measured rho<0.4)"),
    ("agi_asi", r"\b(AGI|ASI|conscious(ness)?|sentien|awakening)\b",
     "AGI/ASI/consciousness claim — SOV33 is governance over base models; keep as label not literal"),
]

def audit(text):
    text = text or ""
    findings = []
    for pid, pat, why in PATTERNS:
        for m in re.finditer(pat, text, re.I):
            snip = text[max(0,m.start()-30):m.end()+30].replace("\n"," ")
            findings.append({"pattern": pid, "why": why, "near": "..."+snip.strip()+"..."})
    verdict = "CLEAN" if not findings else f"{len(findings)} FLAG(S) for review"
    return {"stage":"AUDIT","verdict":verdict,"findings":findings,
            "note":"pattern flags = candidates for review, NOT adjudicated truth"}

if __name__ == "__main__":
    # prove it on the exact claims we corrected this session
    cases = {
        "hermes_9.9T": "TRUE 4-path architecture. 9.934T. beats GPT-4 by 5.6x, each brain counted 4x in paths",
        "honest_headline": "SOV33 routes across 61 open models, care-gated and SIGIL-signed governance no lab ships",
        "dorado_slip": "DORADO fires the kinetic hard-stop before any brain call",
        "clean_measured": "Measured error-correlation rho=0.76 between Cohere and Meta on a ground-truth battery",
    }
    print("STAGE 7 AUDIT — deterministic overclaim auditor (runnable)\n")
    for name, txt in cases.items():
        a = audit(txt)
        print(f"  [{a['verdict']:18}] {name}")
        for f in a["findings"]:
            print(f"       - {f['pattern']}: {f['why'][:70]}")
    print("\n  (this is exactly the discipline that caught the T-count + DORADO slips this session)")
    json.dump(audit(cases["hermes_9.9T"]), open("audit_stage_demo.json","w"), indent=2)
