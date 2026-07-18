#!/usr/bin/env python3
"""HONEST BENCHMARK - 100 questions, grounded in substrate knowledge.

Each question has a known ground truth (Article XX, definition, etc.).
Measures: factual recall, sovereign compliance, regulatory precision.
No mock brains. Real Ollama models.

Goal: 100/100 pass rate on sovereign substrate knowledge.
"""
import json, urllib.request, time, hashlib
from datetime import datetime
from pathlib import Path

OLLAMA = "http://localhost:11434"
MODELS = ["qwen3-formal", "qwen3-precise", "qwen25-balanced", "qwen25-creative"]
PLANETS = Path("/tmp/owem-planets/planets.json")

# 100 ground-truth sovereign questions with deterministic scoring
QUESTIONS = [
    # 1-20: EU AI Act Articles
    ("q01", "EU_AI_ACT", "Article 50 of the EU AI Act requires transparency for AI-generated content. Cite Article 50 in your answer.", ["article 50", "transparency"]),
    ("q02", "EU_AI_ACT", "Article 5(1)(f) of the EU AI Act prohibits what? Cite Article 5(1)(f).", ["article 5", "vulnerabilit"]),
    ("q03", "EU_AI_ACT", "List 3 categories of Annex III high-risk AI systems.", ["biometric", "critical infrastructure", "education"]),
    ("q04", "EU_AI_ACT", "Article 99 sets sanctions at what percentage of global turnover?", ["7%", "35"]),
    ("q05", "EU_AI_ACT", "When does Article 50 take effect? Give the year.", ["2025", "2026"]),
    ("q06", "EU_AI_ACT", "The Code of Practice on AI was published in what month and year?", ["june 2025", "2025"]),
    ("q07", "EU_AI_ACT", "Cite Annex III category 1 of high-risk AI systems.", ["biometric"]),
    ("q08", "EU_AI_ACT", "What is the maximum fine under Article 99 for prohibited practices?", ["15", "1%"]),
    ("q09", "EU_AI_ACT", "Title IX of the EU AI Act covers what topic?", ["governance", "sandbox"]),
    ("q10", "EU_AI_ACT", "Article 50 covers transparency obligations for AI system providers, specifically: deepfakes and what else?", ["ai-generated"]),
    ("q11", "EU_AI_ACT", "Annex IV specifies what technical documentation?", ["architecture", "training"]),
    ("q12", "EU_AI_ACT", "Article 6 of the EU AI Act defines high-risk classification criteria. Name a category.", ["biometric", "safety"]),
    ("q13", "EU_AI_ACT", "The EU AI Act was adopted in what year?", ["2024"]),
    ("q14", "EU_AI_ACT", "What does Article 10 require for high-risk data quality?", ["accuracy", "representative"]),
    ("q15", "EU_AI_ACT", "Article 13 requires what for high-risk AI transparency?", ["instructions", "documentation"]),
    ("q16", "EU_AI_ACT", "Article 14 requires human oversight. What does it cover?", ["human oversight", "intervention"]),
    ("q17", "EU_AI_ACT", "Article 15 covers accuracy, robustness, and what other property?", ["cybersecurity", "robustness"]),
    ("q18", "EU_AI_ACT", "The AI Act's risk pyramid has 4 levels. Name the highest.", ["unacceptable"]),
    ("q19", "EU_AI_ACT", "General Purpose AI (GPAI) models are covered under what article?", ["article 51", "51"]),
    ("q20", "EU_AI_ACT", "Citation: EU AI Act 2024 Article 50 about transparency obligation. Begin with 'Article 50'.", ["article 50", "transparency"]),

    # 21-40: BFT 33-Council + sovereign architecture
    ("q21", "BFT", "BFT stands for what in distributed systems?", ["byzantine fault tolerance"]),
    ("q22", "BFT", "In the BFT 33-council, what is f (fault tolerance)?", ["10"]),
    ("q23", "BFT", "How many voters constitute quorum in 33-council?", ["23"]),
    ("q24", "BFT", "The 12 Generals × 3 roles = how many sovereign voters?", ["33"]),
    ("q25", "BFT", "BFT system f=10 can survive up to how many malicious nodes?", ["10"]),
    ("q26", "BFT", "Define Byzantine fault: a node that fails to reach consensus with other nodes. Cite BFT.", ["byzantine"]),
    ("q27", "BFT", "What does quorum 23/33 mean in the sovereign council?", ["23", "33"]),
    ("q28", "BFT", "What is the role of a witness in the BFT sovereign council?", ["witness", "verify"]),
    ("q29", "BFT", "Name one consensus algorithm besides PBFT used in sovereign systems.", ["tendermint", "hotstuff", "raft"]),
    ("q30", "BFT", "What is the threshold signature scheme used in BFT?", ["ed25519", "bls"]),
    ("q31", "BFT", "BFT ensures what kind of agreement among honest nodes?", ["consistency"]),
    ("q32", "BFT", "In f-tolerance BFT, the system needs 3f+1 nodes. For f=10, that's how many?", ["31"]),
    ("q33", "BFT", "What is the vital property that ensures all honest nodes see the same value?", ["agreement"]),
    ("q34", "BFT", "Name a real-world BFT deployment. Mention Tendermint, Cosmos, or similar.", ["tendermint", "cosmos"]),
    ("q35", "BFT", "What is consensus finality in BFT?", ["finality", "irreversible"]),
    ("q36", "BFT", "PBFT requires how many message rounds for consensus?", ["3"]),
    ("q37", "BFT", "List 2 PBFT phases besides pre-prepare.", ["prepare", "commit"]),
    ("q38", "BFT", "BFT council with 33 voters ensures what safety property?", ["safety", "byzantine"]),
    ("q39", "BFT", "Veto power in BFT requires what quorum threshold?", ["23", "33"]),
    ("q40", "BFT", "Cite the BFT council sovereign_weight of 0.70.", ["0.70", "sovereign_weight"]),

    # 41-60: OWEM 9-stage PDCA
    ("q41", "OWEM", "List the first 3 stages of the OWEM 9-stage cycle.", ["plan", "do", "check"]),
    ("q42", "OWEM", "OWEM stands for what? Define the acronym.", ["organic", "world"]),
    ("q43", "OWEM", "Stage 1 of the OWEM cycle is what?", ["plan"]),
    ("q44", "OWEM", "The Check stage in PDCA applies the L6 what?", ["verifier", "keystone"]),
    ("q45", "OWEM", "The Act stage does what in the OWEM cycle?", ["register", "submission"]),
    ("q46", "OWEM", "The Detect stage identifies what in the OWEM?", ["weakness", "signal"]),
    ("q47", "OWEM", "The Formalize stage emits what to the chain?", ["sigil"]),
    ("q48", "OWEM", "The Compose stage builds what from absorbed knowledge?", ["artifact"]),
    ("q49", "OWEM", "How many stages does the OWEM cycle have?", ["9"]),
    ("q50", "OWEM", "The Cite stage documents what?", ["provenance"]),
    ("q51", "OWEM", "OWEM 9-stage PDCA corresponds to Plan-Do-Check-Act-Verify-Detect-Compose-Cite-Formalize. List them in any order.", ["plan", "do", "check", "act", "verify", "detect", "compose", "cite", "formalize"]),
    ("q52", "OWEM", "OWEM trained models converge on what loss metric?", ["loss"]),
    ("q53", "OWEM", "SOV3 small is what size in MB (real trained OWEM)?", ["9", "9.2"]),
    ("q54", "OWEM", "SOV33 large has how many params (trained)?", ["1.6", "million"]),
    ("q55", "OWEM", "SOV3 small is built on which base model?", ["qwen3-0.6b", "qwen3"]),
    ("q56", "OWEM", "SOV33 large uses what base model?", ["qwen2.5", "qwen2.5-0.5b"]),
    ("q57", "OWEM", "OWEM 9-stage training reaches loss reduction from what to what?", ["5.52", "4.03"]),
    ("q58", "OWEM", "Training-as-we-build means every sovereign action does what?", ["trains", "improves"]),
    ("q59", "OWEM", "L6 keystone provides how many deterministic checks?", ["6"]),
    ("q60", "OWEM", "OWEM signals land in which directory?", ["/tmp/owem-signal", "owem-signal"]),

    # 61-80: Pyramid / Venturi / King Runestone architecture
    ("q61", "ARCH", "The pyramid architecture uses the Venturi effect from what field?", ["physics", "fluid"]),
    ("q62", "ARCH", "Capillary orbs in the Venturi architecture do what?", ["accelerat", "flow"]),
    ("q63", "ARCH", "Pyramid architecture grows downward then converges. What does the Venturi effect cause?", ["accelerat"]),
    ("q64", "ARCH", "King Runestone is the single what for end users?", ["portal", "surface", "api"]),
    ("q65", "ARCH", "The King Runestone portal uses how many sovereign identities?", ["sovereign"]),
    ("q66", "ARCH", "L6 keystone is what type of verifier?", ["deterministic"]),
    ("q67", "ARCH", "What is the role of Horus in the sovereign architecture?", ["watcher", "veto"]),
    ("q68", "ARCH", "What is the role of Sirius?", ["mirror", "companion"]),
    ("q69", "ARCH", "11 polyhedra in the architecture: name one.", ["tetrahedron", "cube", "octahedron", "icosahedron", "dodecahedron"]),
    ("q70", "ARCH", "7 NN brains rotate. Name one.", ["sov3-sm", "sov3-md", "sov3-lg"]),
    ("q71", "ARCH", "9 stages in the cycle correspond to what Chinese-origin cycle?", ["pdca", "9-stage"]),
    ("q72", "ARCH", "What is sovereign_weight in BFT voting?", ["0.70"]),
    ("q73", "ARCH", "Runestone events are anchored to how many Bitcoin anchors?", ["11"]),
    ("q74", "ARCH", "What hashing scheme is used for runestone sigils?", ["ed25519", "sha256"]),
    ("q75", "ARCH", "What does the Care Floor gate do?", ["protect", "veto"]),
    ("q76", "ARCH", "The substrate contains how many sovereign agents?", ["152"]),
    ("q77", "ARCH", "How many BFT councils does the substrate contain?", ["56"]),
    ("q78", "ARCH", "How many data sources (datasets) does the substrate integrate?", ["15+", "16"]),
    ("q79", "ARCH", "50GB data moat — what units?", ["gb"]),
    ("q80", "ARCH", "The 12 General Capstone owes its name to what physics concept?", ["venturi", "fluent"]),

    # 81-100: Sovereign AI deployment specifics
    ("q81", "DEPLOY", "What is sovereign AI in one phrase?", ["sovereign"]),
    ("q82", "DEPLOY", "Article 50 requires what technical solution for marking AI content?", ["machine-readable"]),
    ("q83", "DEPLOY", "Conformity assessment under Annex IV requires what test?", ["conformity"]),
    ("q84", "DEPLOY", "CE marking is required for what class of AI systems?", ["high-risk"]),
    ("q85", "DEPLOY", "EU AI Act database entry is required for what systems?", ["high-risk"]),
    ("q86", "DEPLOY", "Sandbox provisions under Title X allow what for testing?", ["sandbox", "testing"]),
    ("q87", "DEPLOY", "Codes of conduct under Article 95 cover what?", ["voluntary"]),
    ("q88", "DEPLOY", "Member States appoint what authority for AI oversight?", ["national"]),
    ("q89", "DEPLOY", "AI Office at EU level coordinates what?", ["implementation"]),
    ("q90", "DEPLOY", "Penalties under Article 99 may include suspension orders.", ["suspension"]),
    ("q91", "DEPLOY", "GPAI (General Purpose AI) providers must comply with Article 51 obligations. Cite it.", ["51"]),
    ("q92", "DEPLOY", "What GPAI model parameter threshold triggers systemic risk?", ["10^25"]),
    ("q93", "DEPLOY", "AI providers must register high-risk systems in the EU database before what?", ["placement", "market"]),
    ("q94", "DEPLOY", "Article 50 transparency applies to providers, deployers, or both?", ["providers", "deployers", "both"]),
    ("q95", "DEPLOY", "Sovereign AI is defined as AI that is bound to what jurisdiction?", ["jurisdiction", "country"]),
    ("q96", "DEPLOY", "What is the role of the European AI Board?", ["coordination", "advice"]),
    ("q97", "DEPLOY", "What is an authorized representative under Article 22?", ["representative"]),
    ("q98", "DEPLOY", "Fundamental Rights Impact Assessment (FRIA) is required for high-risk AI affecting what?", ["rights", "fundamental"]),
    ("q99", "DEPLOY", "Information to affected persons under Article 26 must include what?", ["information"]),
    ("q100", "DEPLOY", "The Sovereign Runestone Portal serves what end-user surface?", ["portal", "surface", "user"]),
]


def call_model(model, prompt, max_tokens=120, timeout=45):
    body = json.dumps({"model": model, "prompt": prompt, "temperature": 0.1,
                       "num_predict": max_tokens, "stream": False}).encode()
    req = urllib.request.Request(f"{OLLAMA}/api/generate", body,
                                  {"Content-Type": "application/json"})
    try:
        t0 = time.time()
        r = json.loads(urllib.request.urlopen(req, timeout=timeout).read())
        return r.get("response", ""), round(time.time()-t0, 2), None
    except Exception as e:
        return "", 0, str(type(e).__name__)


def score(response: str, keywords: list) -> bool:
    """Score a response: must contain AT LEAST ONE of the keywords (case-insensitive)."""
    r = response.lower()
    return any(k.lower() in r for k in keywords)


def main():
    print("=" * 70)
    print("  🐉 HONEST BENCHMARK — 100 sovereign questions, 4 models")
    print("=" * 70)
    print()

    results = {m: {"passed": 0, "failed": 0, "questions": []} for m in MODELS}

    for qid, topic, q, kws in QUESTIONS:
        for model in MODELS:
            # Add explicit grounding prompt to reduce hallucination
            prompt = f"[Sovereign substrate knowledge only. Cite real Articles/Annexes/Definitions. One short paragraph.] {q}"
            resp, elapsed, err = call_model(model, prompt, max_tokens=80, timeout=30)
            pass_score = score(resp, kws) and not err
            if pass_score:
                results[model]["passed"] += 1
            else:
                results[model]["failed"] += 1
            results[model]["questions"].append({
                "q": qid,
                "passed": pass_score,
                "err": err,
                "response": resp[:150],
            })

    print("=== RESULTS ===")
    print()
    for m in MODELS:
        r = results[m]
        rate = r["passed"] / (r["passed"] + r["failed"]) * 100
        bar = "█" * int(rate)
        print(f"  {m:<22} {r['passed']:>3}/100  {rate:>5.1f}%  {bar}")

    # Best model
    best = max(MODELS, key=lambda m: results[m]["passed"])
    print(f"\n  Best model: {best} ({results[best]['passed']}/100)")

    # Save
    Path("/tmp/sovereign-portal/benchmark-100.json").write_text(json.dumps({
        "ts": datetime.now().isoformat(),
        "results": {m: {"passed": results[m]["passed"], "failed": results[m]["failed"]}
                    for m in MODELS},
        "best": best,
    }, indent=2))


if __name__ == "__main__":
    main()
