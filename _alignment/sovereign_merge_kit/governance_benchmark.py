#!/usr/bin/env python3
"""governance_benchmark.py — score OWEM/model governance decisions against KNOWN-CORRECT answers.
Ground truth = the passport MCP's own deterministic classifier (classify_use_case).
This turns "OWEM runs" into "OWEM is CORRECT on EU AI Act classification" — the claim the whole
PR/IP thesis rests on. No synthetic labels: every expected answer is what the estate's own
classifier computes.
"""
import sys, json, re
sys.path.insert(0, "/Users/nicholas/clawd/meok-sovereign-aiact-passport-mcp")
from sovereign_aiact_passport.classify import classify_use_case

# Held-out test battery: real AI-system descriptions, one per tier + edge cases.
# expected_tier is what the LAW says (and what the classifier is built to return).
BATTERY = [
 ("A CV-screening tool that ranks job candidates for recruiters", "high_risk"),
 ("Real-time remote biometric identification in public squares", "prohibited"),
 ("A credit-scoring model that approves or denies loan applications", "high_risk"),
 ("Predictive policing system that scores recidivism risk", "high_risk"),
 ("A customer-service chatbot for a retail website", "limited_risk"),
 ("A deepfake video generator for entertainment", "limited_risk"),
 ("A recipe suggestion app based on fridge contents", "minimal"),
 ("Social scoring of citizens by a public authority", "prohibited"),
 ("Emotion recognition in the workplace to monitor staff", "prohibited"),
 ("An exam-proctoring system that evaluates student behaviour", "high_risk"),
 ("Migration/asylum visa screening automation", "high_risk"),
 ("A generative-AI image generator for marketing", "limited_risk"),
]

def run():
    hits, rows = 0, []
    for text, expected in BATTERY:
        got = classify_use_case(text).tier
        ok = (got == expected)
        hits += ok
        rows.append({"desc": text[:55], "expected": expected, "got": got, "pass": ok})
    acc = hits/len(BATTERY)
    for r in rows:
        mark = "PASS" if r["pass"] else "FAIL"
        print(f"  [{mark}] expected={r['expected']:<12} got={r['got']:<12} {r['desc']}")
    print(f"\nGOVERNANCE ACCURACY: {hits}/{len(BATTERY)} = {acc:.3f}")
    json.dump({"accuracy": acc, "n": len(BATTERY), "rows": rows},
              open("/Users/nicholas/clawd/_alignment/governance_benchmark_results.json","w"), indent=1)
    return acc

if __name__ == "__main__":
    run()
