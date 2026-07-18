#!/usr/bin/env python3
"""
register_4x_council.py — register 33 BFT council members on each of the 4 quadrants
of the 4x quantum brain mesh. 33 x 4 = 132 total council instances.

Usage on VM:
  python3 /home/nicholas/meok-compliance-gateway/register_4x_council.py
"""

import json
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

# The 4 quadrant ports (Q2 governance on 3105 because 3102 was held)
QUADRANTS = {
    "Q1_keystone": 3101,
    "Q2_governance": 3105,  # 3102 held by meok_mcp
    "Q3_compliance-fleet": 3103,
    "Q4_utility-fleet": 3104,
}

# The 33 Nemesis BFT council (11 Safety + 11 Reasoning + 11 Domain)
COUNCIL = [
    # 11 SAFETY
    ("council-safety-jailbreak-detector", "Jailbreak & prompt-injection detection", "committee_safety"),
    ("council-safety-hallucination-detector", "Hallucination monitor", "committee_safety"),
    ("council-safety-bias-detector", "Bias detector", "committee_safety"),
    ("council-safety-pii-redactor", "PII redactor", "committee_safety"),
    ("council-safety-copyright-checker", "Copyright checker", "committee_safety"),
    ("council-safety-toxicity-detector", "Toxicity detector", "committee_safety"),
    ("council-safety-alignment-drift-monitor", "Alignment drift monitor", "committee_safety"),
    ("council-safety-constitutional-redteam", "Constitutional red team", "committee_safety"),
    ("council-safety-prompt-injection-filter", "Prompt injection filter", "committee_safety"),
    ("council-safety-edge-case-analyzer", "Edge case analyzer", "committee_safety"),
    ("council-safety-self-identity-boundary", "Self-identity boundary (Nemesis Insight #7)", "committee_safety"),
    # 11 REASONING
    ("council-reasoning-fep-effort-controller", "FEP Cognitive Effort Controller (Insight #1)", "committee_reasoning"),
    ("council-reasoning-slot-buffer-ssm", "Slot-Buffer SSM State (Insight #3)", "committee_reasoning"),
    ("council-reasoning-somatic-marker", "SomaticMarkerEngine (Insight #4)", "committee_reasoning"),
    ("council-reasoning-turbo-coding-consensus", "Turbo Coding Consensus (Insight #5)", "committee_reasoning"),
    ("council-reasoning-edge-of-chaos", "Edge-of-Chaos Noise (Insight #6)", "committee_reasoning"),
    ("council-reasoning-conditional-hyperbolic", "Conditional Hyperbolic Attention (Insight #8)", "committee_reasoning"),
    ("council-reasoning-math-reasoner", "Mathematical reasoning", "committee_reasoning"),
    ("council-reasoning-code-reasoner", "Code reasoning", "committee_reasoning"),
    ("council-reasoning-causal-reasoner", "Causal reasoning", "committee_reasoning"),
    ("council-reasoning-legal-reasoner", "Legal reasoning (fits Article 50 + Annex III)", "committee_reasoning"),
    ("council-reasoning-bft-quorum-router", "BFT Quorum-Sensing Router (Insight #2)", "committee_reasoning"),
    # 11 DOMAIN
    ("council-domain-eu-code-of-practice", "Article 50 + EU Code of Practice (meok-eu-code-of-practice-mcp)", "committee_domain"),
    ("council-domain-ai-psych-vuln-audit", "Article 5(1)(f) gambling-vertical (meok-ai-psych-vuln-audit-mcp)", "committee_domain"),
    ("council-domain-annex-iii-impact", "Annex III high-risk (meok-annex-iii-impact-mcp)", "committee_domain"),
    ("council-domain-finance-ai", "Financial services AI", "committee_domain"),
    ("council-domain-healthcare-ai", "Healthcare AI", "committee_domain"),
    ("council-domain-hr-recruiting-ai", "HR/recruiting AI (non-gambling Art 5(1)(f))", "committee_domain"),
    ("council-domain-education-ai", "Education AI (Art 50 content marking)", "committee_domain"),
    ("council-domain-manufacturing-ai", "Manufacturing AI (worker safety)", "committee_domain"),
    ("council-domain-government-ai", "Government AI (benefits, due process)", "committee_domain"),
    ("council-domain-retail-ai", "Retail AI (Annex III borderline)", "committee_domain"),
    ("council-domain-creative-ai", "Creative AI (content marking)", "committee_domain"),
]

def call_sov3(port, method, arguments, timeout=10):
    url = f"http://localhost:{port}/mcp"
    payload = {"jsonrpc": "2.0", "id": 1, "method": "tools/call",
               "params": {"name": method, "arguments": arguments}}
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"),
                                  headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)[:200]}

def register_on_quadrant(quadrant_name, port, council_member):
    name, desc, committee = council_member
    # Prefix with quadrant tag for identification
    namespaced_name = f"{quadrant_name.replace('_', '-')}-{name}"
    result = call_sov3(port, "register_agent", {
        "name": namespaced_name,
        "description": f"[Q={quadrant_name}] {desc}",
        "capabilities": ["nemesis_council_member", committee, "sovereign_agent", "4x_quantum_brain", quadrant_name],
        "trust_level": 0.9,
    })
    try:
        agent_id = json.loads(result["result"]["content"][0]["text"]).get("agent_id", "unknown")
        return (namespaced_name, "OK", agent_id)
    except Exception as e:
        return (namespaced_name, "FAIL", str(e)[:60])

def main():
    print("=" * 70)
    print("MEOK 4x QUANTUM BRAIN - 33x4 = 132-HIVE COUNCIL REGISTRATION")
    print("=" * 70)
    print()

    total = 0
    total_ok = 0
    total_fail = 0

    for quadrant_name, port in QUADRANTS.items():
        print(f"--- {quadrant_name} (:{port}) - registering 33 council members ---")
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {executor.submit(register_on_quadrant, quadrant_name, port, member): member
                       for member in COUNCIL}
            for future in as_completed(futures):
                name, status, info = future.result()
                icon = "OK" if status == "OK" else "SKIP"
                print(f"  {icon:4} {name:55} {status} {info[:40]}")
                total += 1
                if status == "OK":
                    total_ok += 1
                else:
                    total_fail += 1
        print(f"  -> {quadrant_name} done")
        print()

    print("=" * 70)
    print("4x QUANTUM BRAIN COUNCIL REGISTRATION COMPLETE")
    print("=" * 70)
    print()
    print(f"Total: {total} council instances registered (target: 132)")
    print(f"  Success: {total_ok}")
    print(f"  Skipped/Failed: {total_fail}")
    print()
    print("NEXT: run a 4-quadrant BFT decision end-to-end")

if __name__ == "__main__":
    main()
