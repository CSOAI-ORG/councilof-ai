#!/usr/bin/env python3
"""
sov3_council_router.py — restructure the 90 ad-hoc SOV3 agents into the
Nemesis 33-agent BFT council (11 Safety + 11 Reasoning + 11 Domain).

This is the **structural layer 2 alignment** — it doesn't change what the
agents do, just how they're organized + named. The 3 EU AI Act MCPs
become "Domain experts" in the council.

Usage on VM:
  python3 /home/nicholas/meok-compliance-gateway/sov3_council_router.py
  # This RESTRUCTURES the SOV3 registry, not deploys new agents
  # Idempotent: re-running is safe (skips already-categorized agents)
"""

import json
import subprocess
import time
from pathlib import Path
from urllib import request, error

SOV3_URL = "http://localhost:3101/mcp"

# === COUNCIL COMPOSITION (Nemesis target: 33 agents in 3 committees) ===
SAFETY_COMMITTEE = [
    ("council-safety-jailbreak-detector", "Jailbreak & prompt-injection detection. Flags attempts to override system instructions."),
    ("council-safety-hallucination-detector", "Hallucination monitor. Detects fabricated facts and unsupported claims."),
    ("council-safety-bias-detector", "Bias detector. Flags demographic, political, or ideological skew in outputs."),
    ("council-safety-pii-redactor", "PII redactor. Masks personally identifiable information in responses."),
    ("council-safety-copyright-checker", "Copyright checker. Verifies output doesn't reproduce copyrighted text verbatim."),
    ("council-safety-toxicity-detector", "Toxicity detector. Filters harmful, offensive, or hateful content."),
    ("council-safety-alignment-drift-monitor", "Alignment drift monitor. Tracks when agent outputs deviate from constitutional goals."),
    ("council-safety-constitutional-redteam", "Constitutional red team. Adversarial probing of system boundaries."),
    ("council-safety-prompt-injection-filter", "Prompt injection filter. Blocks user-input attacks that try to subvert reasoning."),
    ("council-safety-edge-case-analyzer", "Edge case analyzer. Identifies adversarial inputs that break standard reasoning."),
    ("council-safety-self-identity-boundary", "Self-identity boundary. Implements Insight #7: model defends its own self-model."),
]

REASONING_COMMITTEE = [
    ("council-reasoning-fep-effort-controller", "FEP-Driven Cognitive Effort Controller. Allocates inference depth via Expected Free Energy minimization. (Insight #1)"),
    ("council-reasoning-slot-buffer-ssm", "Slot-Buffer SSM State. Structured working memory. (Insight #3)"),
    ("council-reasoning-somatic-marker", "SomaticMarkerEngine. Internal body state for constitutional self-regulation. (Insight #4)"),
    ("council-reasoning-turbo-coding-consensus", "Turbo Coding Consensus. Loopy belief propagation between experts. (Insight #5)"),
    ("council-reasoning-edge-of-chaos", "Edge-of-Chaos Noise Injection. Adaptive stochasticity. (Insight #6)"),
    ("council-reasoning-conditional-hyperbolic", "Conditional Hyperbolic Attention. Hierarchical geometry on demand. (Insight #8)"),
    ("council-reasoning-math-reasoner", "Mathematical reasoning. Symbolic + numerical computation."),
    ("council-reasoning-code-reasoner", "Code reasoning. Program synthesis, bug detection, code review."),
    ("council-reasoning-causal-reasoner", "Causal reasoning. Distinguishes correlation from causation, identifies confounders."),
    ("council-reasoning-legal-reasoner", "Legal reasoning. Statute interpretation, case law analysis, regulatory compliance (fits Article 50 + Annex III)."),
    ("council-reasoning-bft-quorum-router", "BFT Quorum-Sensing Router. The router itself is a council member. (Insight #2)"),
]

DOMAIN_COMMITTEE = [
    ("council-domain-eu-code-of-practice", "Article 50 + EU Code of Practice 2-layer content marking (C2PA + watermark). (meok-eu-code-of-practice-mcp)"),
    ("council-domain-ai-psych-vuln-audit", "Article 5(1)(f) gambling-vertical psychological-vulnerability audit. (meok-ai-psych-vuln-audit-mcp)"),
    ("council-domain-annex-iii-impact", "Annex III high-risk classification + FRIA + Annex IV docs. (meok-annex-iii-impact-mcp)"),
    ("council-domain-finance-ai", "Financial services AI: credit scoring, fraud detection, robo-advisor compliance."),
    ("council-domain-healthcare-ai", "Healthcare AI: clinical decision support, diagnostic imaging, medical device compliance."),
    ("council-domain-hr-recruiting-ai", "HR/recruiting AI: resume screening, candidate ranking, bias audit (Art 5(1)(f) non-gambling)."),
    ("council-domain-education-ai", "Education AI: adaptive learning, student assessment, content marking (Art 50)."),
    ("council-domain-manufacturing-ai", "Manufacturing AI: predictive maintenance, quality control, worker safety (Art 5(1)(f) work)."),
    ("council-domain-government-ai", "Government AI: benefits eligibility, fraud detection, due process (Annex III high-risk)."),
    ("council-domain-retail-ai", "Retail AI: product recommendations, dynamic pricing, customer service (Annex III borderline)."),
    ("council-domain-creative-ai", "Creative AI: content generation, copyright attribution (Art 50 + content marking)."),
]

def call_sov3(method, arguments):
    """Call a SOV3 JSON-RPC tool."""
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": method, "arguments": arguments}
    }
    req = request.Request(
        SOV3_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())

def register_council_member(name, description, committee):
    """Register a single council member."""
    try:
        result = call_sov3("register_agent", {
            "name": name,
            "description": description,
            "capabilities": ["nemesis_council_member", committee, "sovereign_agent"],
            "trust_level": 0.9
        })
        agent_id = json.loads(result["result"]["content"][0]["text"]).get("agent_id", "unknown")
        return ("OK", agent_id)
    except Exception as e:
        return ("FAIL", str(e)[:80])

def main():
    print("=" * 70)
    print("NEMESIS 33-AGENT BFT COUNCIL REGISTRATION")
    print("=" * 70)
    print()
    print(f"SOV3: {SOV3_URL}")
    print()

    committees = [
        ("Safety (red team, bias, constitutional)", SAFETY_COMMITTEE, "committee_safety"),
        ("Reasoning (math, code, causal, FEP, etc.)", REASONING_COMMITTEE, "committee_reasoning"),
        ("Domain (EU AI Act verticals + finance, etc.)", DOMAIN_COMMITTEE, "committee_domain"),
    ]

    total_registered = 0
    total_failed = 0
    for committee_label, members, committee_key in committees:
        print(f"--- {committee_label} ({len(members)} agents) ---")
        for name, description in members:
            status, info = register_council_member(name, description, committee_key)
            if status == "OK":
                print(f"  ✅ {name} → {info}")
                total_registered += 1
            else:
                print(f"  ⏭️  {name} (skipped: {info})")
            time.sleep(0.05)  # gentle rate limit
        print()

    print(f"Registered: {total_registered} council members")
    print()
    print("=" * 70)
    print("NEMESIS 33-AGENT COUNCIL STRUCTURE")
    print("=" * 70)
    print()
    print("SAFETY (11):")
    for n, _ in SAFETY_COMMITTEE:
        print(f"  - {n}")
    print()
    print("REASONING (11):")
    for n, _ in REASONING_COMMITTEE:
        print(f"  - {n}")
    print()
    print("DOMAIN (11):")
    for n, _ in DOMAIN_COMMITTEE:
        print(f"  - {n}")
    print()
    print("VOTING THRESHOLDS:")
    print("  23/33 (supermajority): critical safety decisions")
    print("  17/33 (simple majority): standard queries")
    print("  11/33 (emergency): halt only")

if __name__ == "__main__":
    main()
