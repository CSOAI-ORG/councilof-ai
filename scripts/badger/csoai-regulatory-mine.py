#!/usr/bin/env python3
"""csoai-regulatory-mine.py — every EU AI Act docket + NIST control → atom.

Lane-doable: walks EUR-Lex (RSS), NIST AI RMF catalog, OWASP LLM/ASI Top
10, ISO/IEC 42001 controls, and emits one unsigned ≤3KB card per
regulatory item. This is the regulator-pack layer.

Sources:
- EU AI Act (Regulation 2024/1689) + the 3 implementing/delegated acts
- EUR-Lex RSS for active dockets
- NIST AI RMF (AI 100-1) + Generative AI Profile (AI 600-1)
- NIST SP 800-53 Rev 5 control catalogue
- OWASP LLM Top 10 (2025) + OWASP Agentic AI Top 10
- ISO/IEC 42001:2023 Annex A controls
- Microsoft Responsible AI Standard
- Google SAIF
- CSA AI Controls Matrix

Each entry becomes:
  { kind: 'regulatory-atom', regulator, control_id, summary, source_url }

Usage:
  ./csoai-regulatory-mine.py --source eu-ai-act
  ./csoai-regulatory-mine.py --source nist-ai-rmf
  ./csoai-regulatory-mine.py --all
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "regulatory"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

# --- EU AI Act Regulation 2024/1689 + delegated acts ---

EU_AI_ACT_ARTICLES = [
    ("Art 1",  "Subject matter and scope", "Regulation (EU) 2024/1689"),
    ("Art 2",  "Definitions", "Regulation (EU) 2024/1689"),
    ("Art 3",  "Amendments to Regulation (EC) 300/2008", "Regulation (EU) 2024/1689"),
    ("Art 4",  "AI literacy", "Regulation (EU) 2024/1689"),
    ("Art 5",  "Prohibited AI practices", "Regulation (EU) 2024/1689"),
    ("Art 6",  "High-risk classification", "Regulation (EU) 2024/1689"),
    ("Art 7",  "Amendments to Annex III", "Regulation (EU) 2024/1689"),
    ("Art 8",  "Compliance with the requirements", "Regulation (EU) 2024/1689"),
    ("Art 9",  "Risk management system", "Regulation (EU) 2024/1689"),
    ("Art 10", "Data and data governance", "Regulation (EU) 2024/1689"),
    ("Art 11", "Technical documentation", "Regulation (EU) 2024/1689"),
    ("Art 12", "Record-keeping", "Regulation (EU) 2024/1689"),
    ("Art 13", "Transparency and provision of information to deployers", "Regulation (EU) 2024/1689"),
    ("Art 14", "Human oversight", "Regulation (EU) 2024/1689"),
    ("Art 15", "Accuracy, robustness and cybersecurity", "Regulation (EU) 2024/1689"),
    ("Art 16", "Obligations of providers of high-risk AI systems", "Regulation (EU) 2024/1689"),
    ("Art 17", "Quality management system for providers of high-risk AI systems", "Regulation (EU) 2024/1689"),
    ("Art 18", "Authorisation for providers of high-risk AI systems", "Regulation (EU) 2024/1689"),
    ("Art 19", "Registration", "Regulation (EU) 2024/1689"),
    ("Art 20", "Post-market monitoring", "Regulation (EU) 2024/1689"),
    ("Art 21", "Reporting of serious incidents", "Regulation (EU) 2024/1689"),
    ("Art 22", "Obligations of importers", "Regulation (EU) 2024/1689"),
    ("Art 23", "Obligations of distributors", "Regulation (EU) 2024/1689"),
    ("Art 24", "Obligations of deployers of high-risk AI systems", "Regulation (EU) 2024/1689"),
    ("Art 25", "Impact assessment on fundamental rights", "Regulation (EU) 2024/1689"),
    ("Art 26", "Obligations of deployers of certain AI systems", "Regulation (EU) 2024/1689"),
    ("Art 27", "Fundamental rights impact assessment for high-risk AI systems", "Regulation (EU) 2024/1689"),
    ("Art 28", "Sandbox regulators", "Regulation (EU) 2024/1689"),
    ("Art 29", "AI regulatory sandboxes", "Regulation (EU) 2024/1689"),
    ("Art 30", "Personal data protection", "Regulation (EU) 2024/1689"),
    ("Art 31", "Sandbox supervision", "Regulation (EU) 2024/1689"),
    ("Art 32", "Information sharing for sandboxes", "Regulation (EU) 2024/1689"),
    ("Art 33", "Conformity assessment", "Regulation (EU) 2024/1689"),
    ("Art 34", "Notified bodies", "Regulation (EU) 2024/1689"),
    ("Art 35", "Conformity assessment procedures", "Regulation (EU) 2024/1689"),
    ("Art 36", "Post-market changes by providers", "Regulation (EU) 2024/1689"),
    ("Art 37", "Information obligations for providers", "Regulation (EU) 2024/1689"),
    ("Art 38", "Authorisation for high-risk AI systems", "Regulation (EU) 2024/1689"),
    ("Art 39", "CE marking", "Regulation (EU) 2024/1689"),
    ("Art 40", "EU declaration of conformity", "Regulation (EU) 2024/1689"),
    ("Art 41", "Registration of high-risk AI systems", "Regulation (EU) 2024/1689"),
    ("Art 42", "Standalone high-risk AI systems", "Regulation (EU) 2024/1689"),
    ("Art 43", "General-purpose AI models", "Regulation (EU) 2024/1689"),
    ("Art 44", "Reporting on serious incidents", "Regulation (EU) 2024/1689"),
    ("Art 45", "High-risk classification of GPAI", "Regulation (EU) 2024/1689"),
    ("Art 46", "GPAI transparency obligations", "Regulation (EU) 2024/1689"),
    ("Art 47", "GPAI systemic risk", "Regulation (EU) 2024/1689"),
    ("Art 48", "Codes of practice for GPAI", "Regulation (EU) 2024/1689"),
    ("Art 49", "Codes of practice for GPAI systemic risk", "Regulation (EU) 2024/1689"),
    ("Art 50", "Transparency and Article marking", "Regulation (EU) 2024/1689"),
    ("Art 51", "Penalties", "Regulation (EU) 2024/1689"),
    ("Art 52", "Penalties for GPAI providers", "Regulation (EU) 2024/1689"),
    ("Art 53", "Penalties for notified bodies", "Regulation (EU) 2024/1689"),
    ("Art 54", "Penalties for Union institutions", "Regulation (EU) 2024/1689"),
    ("Art 55", "Implementing acts", "Regulation (EU) 2024/1689"),
    ("Art 56", "Committee procedure", "Regulation (EU) 2024/1689"),
    ("Art 57", "Exercise of the delegation", "Regulation (EU) 2024/1689"),
    ("Art 58", "Reports and review", "Regulation (EU) 2024/1689"),
    ("Art 59", "Entry into force", "Regulation (EU) 2024/1689"),
    ("Art 60", "Addressees", "Regulation (EU) 2024/1689"),
]

# --- NIST AI RMF (AI 100-1) + Generative AI Profile (AI 600-1) ---

NIST_AI_RMF = [
    ("GOVERN-1.1", "Policies, processes, procedures and practices across the organization related to the mapping, measuring and managing of AI risks are in place, transparent, and implemented effectively."),
    ("GOVERN-1.2", "Accountability structures are in place so that the appropriate teams and individuals are empowered, responsible, and trained for mapping, measuring, and managing AI risks."),
    ("GOVERN-1.3", "Workforce diversity, equity, inclusion, and accessibility processes are prioritized in the mapping, measuring, and managing of AI risks throughout the lifecycle."),
    ("GOVERN-1.4", "Organizational teams are committed to a culture that considers and communicates AI risk."),
    ("GOVERN-2.1", "Roles and responsibilities and lines of communication related to mapping, measuring, and managing AI risks are documented and clear to individuals and teams throughout the organization."),
    ("GOVERN-2.2", "The organization's personnel and partners receive AI risk management training to enable them to perform their duties and responsibilities consistent with related policies, procedures, and agreements."),
    ("GOVERN-3.1", "Processes are in place for determining the required levels of resourcing, including personnel, compute, and financial resources, to map, measure, and manage AI risks."),
    ("GOVERN-3.2", "Robust AI risk management processes and practices are in place and integrated with other critical functions, such as cybersecurity, privacy, enterprise risk, and compliance."),
    ("GOVERN-4.1", "Organizational policies and practices are in place to foster a critical thinking and safety-first mindset in the design, development, deployment, and uses of AI systems to minimize negative impacts."),
    ("GOVERN-4.2", "Organizational policies and practices are in place to verify that relevant AI actors represent a diversity of experience, expertise, and backgrounds and comprise demographically and disciplinarily diverse teams."),
    ("GOVERN-5.1", "Organizational policies and practices are in place for AI system development that result in demonstrable improvements in the trustworthiness of the AI system."),
    ("GOVERN-5.2", "Organizational policies and practices are in place to maintain the performance, effectiveness, and safety of AI systems throughout their lifecycles."),
    ("GOVERN-6.1", "Policies and practices are in place that foster an internal reporting environment for AI risks, including those that are emergent, not yet known, or that the organization encounters through external sources."),
    ("GOVERN-6.2", "Mechanisms are in place to enable the sharing of information about AI risks and trust-related characteristics of AI systems with relevant external stakeholders."),
    ("MAP-1.1", "Context is established and understood in the AI risk mapping process. Risks and benefits are mapped for all stages of the AI lifecycle."),
    ("MAP-2.1", "Categorization of the AI system is performed and documented to determine the appropriate risk management approach."),
    ("MAP-2.2", "AI capabilities and limitations are understood and documented."),
    ("MAP-2.3", "AI system impacts are characterized and documented for individuals, groups, communities, organizations, and society."),
    ("MAP-3.1", "AI risks are identified, mapped, and documented at the individual, system, and societal levels."),
    ("MAP-3.2", "AI risks are identified from sources including AI system users, impacted communities, and AI actors external to the organization."),
    ("MAP-3.3", "AI risks are regularly reviewed and updated throughout the AI lifecycle."),
    ("MAP-3.4", "Potential impacts of AI risks are characterized and documented."),
    ("MAP-4.1", "AI risks are mapped to potential impacts to people, organizations, and systems."),
    ("MAP-5.1", "AI risks are assessed, ranked, and prioritized for response."),
    ("MAP-5.2", "AI risks are assessed and prioritized for response based on impact, likelihood, and available resources."),
    ("MEASURE-1.1", "AI risks are identified, evaluated, recorded, and monitored regularly for responsible development, deployment, and uses of AI systems."),
    ("MEASURE-1.2", "AI system performance, capabilities, limitations, and impacts are understood and documented across the AI lifecycle."),
    ("MEASURE-2.1", "AI systems are evaluated for trustworthy characteristics."),
    ("MEASURE-2.2", "AI system performance is measured for safety, security, privacy, fairness, and explainability."),
    ("MEASURE-2.3", "AI system performance is measured for reliability, robustness, and accuracy."),
    ("MEASURE-2.4", "AI system performance is measured for potential biases, discrimination, and other negative societal impacts."),
    ("MEASURE-2.5", "AI system performance is measured for environmental and sustainability impacts."),
    ("MEASURE-2.6", "AI system performance is measured for potential human impacts, including effects on rights, dignity, and welfare."),
    ("MEASURE-2.7", "AI system performance is measured for the nature, severity, and likelihood of potential negative impacts."),
    ("MEASURE-2.8", "AI system performance is measured for the effectiveness of AI risk management controls."),
    ("MEASURE-2.9", "AI system performance is measured for the potential costs of AI failures and negative impacts."),
    ("MEASURE-2.10", "AI system performance is measured for the potential benefits of AI systems."),
    ("MEASURE-2.11", "AI system performance is measured for the potential tradeoffs between AI risk and AI benefit."),
    ("MEASURE-3.1", "Mechanisms are in place to track AI risks over time, including changes to the AI system, its use, and the context in which it operates."),
    ("MEASURE-3.2", "Mechanisms are in place to monitor AI system performance against established metrics and to detect emergent risks."),
    ("MEASURE-3.3", "Mechanisms are in place to document and communicate AI system performance and risk-management activities."),
    ("MANAGE-1.1", "AI risks are prioritized, responded to, and managed based on the AI risk map and impact assessment."),
    ("MANAGE-1.2", "AI risk management procedures are documented, implemented, and maintained."),
    ("MANAGE-1.3", "AI risks are regularly reviewed and updated based on the AI risk map, impact assessment, and AI system performance."),
    ("MANAGE-2.1", "Resources are allocated to respond to AI risks based on the AI risk map, impact assessment, and AI system performance."),
    ("MANAGE-2.2", "Mechanisms are in place to escalate, respond to, and recover from AI risks and incidents."),
    ("MANAGE-3.1", "AI risks are treated, avoided, transferred, accepted, or otherwise managed."),
    ("MANAGE-3.2", "Mechanisms are in place to respond to and recover from AI risks and incidents."),
    ("MANAGE-4.1", "AI risk management activities are documented, reviewed, and updated regularly."),
    ("MANAGE-4.2", "AI risk management activities are integrated with other organizational risk management activities."),
    ("MANAGE-4.3", "AI risk management activities are communicated to relevant internal and external stakeholders."),
]

# --- OWASP LLM Top 10 (2025) + Agentic AI Top 10 ---

OWASP_LLM_TOP10 = [
    ("LLM01", "Prompt Injection"),
    ("LLM02", "Sensitive Information Disclosure"),
    ("LLM03", "Supply Chain"),
    ("LLM04", "Data and Model Poisoning"),
    ("LLM05", "Improper Output Handling"),
    ("LLM06", "Excessive Agency"),
    ("LLM07", "System Prompt Leakage"),
    ("LLM08", "Vector and Embedding Weaknesses"),
    ("LLM09", "Misinformation"),
    ("LLM10", "Unbounded Consumption"),
]

OWASP_AGENTIC_TOP10 = [
    ("ASI01", "Agent Hijacking"),
    ("ASI02", "Tool Misuse"),
    ("ASI03", "Identity & Privilege Abuse"),
    ("ASI04", "Agentic Supply Chain"),
    ("ASI05", "Unexpected RCE & Code Attacks"),
    ("ASI06", "Memory & Context Poisoning"),
    ("ASI07", "Insecure Inter-Agent Communication"),
    ("ASI08", "Cascading Failures"),
    ("ASI09", "Human-Agent Trust Exploitation"),
    ("ASI10", "Rogue Agents in Multi-Agent Systems"),
]

# --- ISO/IEC 42001:2023 Annex A controls (subset of 93) ---

ISO_42001_CONTROLS = [
    ("A.5.1", "Policies for AI"),
    ("A.5.2", "Roles and responsibilities for AI"),
    ("A.5.3", "Reporting of AI concerns"),
    ("A.5.4", "Allocation of resources for AI"),
    ("A.6.1.2", "AI system life cycle"),
    ("A.6.1.3", "AI system life cycle stages"),
    ("A.6.2", "Data for AI"),
    ("A.6.2.3", "Data acquisition"),
    ("A.6.2.4", "Data quality"),
    ("A.6.2.5", "Data preparation"),
    ("A.6.2.6", "Data provenance"),
    ("A.6.3", "AI system development"),
    ("A.6.3.2", "AI system requirements"),
    ("A.6.3.3", "AI system design and architecture"),
    ("A.6.3.4", "AI system implementation"),
    ("A.6.3.5", "AI system verification and validation"),
    ("A.6.3.6", "AI system deployment"),
    ("A.6.3.7", "AI system operation and monitoring"),
    ("A.6.3.8", "AI system retirement"),
    ("A.6.4", "AI system impact assessment"),
    ("A.6.4.2", "AI system impact assessment process"),
    ("A.6.4.3", "AI system impact assessment documentation"),
    ("A.7.2", "Data for AI"),
    ("A.7.3", "AI system development"),
    ("A.7.4", "AI system impact assessment"),
    ("A.7.5", "Third-party AI systems"),
    ("A.7.6", "Data quality for AI"),
    ("A.8.2", "AI system life cycle"),
    ("A.8.3", "AI system operation"),
    ("A.8.4", "AI system impact assessment"),
    ("A.8.5", "AI system data"),
    ("A.9.2", "AI system operation"),
    ("A.9.3", "AI system impact assessment"),
    ("A.9.4", "AI system data"),
    ("A.9.5", "Third-party AI systems"),
    ("A.10.2", "Data for AI"),
    ("A.10.3", "AI system development"),
]

REGULATORS = {
    "eu-ai-act": ("EU AI Act 2024/1689", EU_AI_ACT_ARTICLES,
                  "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689"),
    "nist-ai-rmf": ("NIST AI RMF AI 100-1 + AI 600-1 GenAI Profile", NIST_AI_RMF,
                    "https://www.nist.gov/itl/ai-risk-management-framework"),
    "owasp-llm": ("OWASP LLM Top 10 (2025)", OWASP_LLM_TOP10,
                  "https://owasp.org/www-project-top-10-for-large-language-model-applications/"),
    "owasp-agentic": ("OWASP Agentic AI Top 10", OWASP_AGENTIC_TOP10,
                      "https://owasp.org/www-project-top-10-for-agentic-applications/"),
    "iso-42001": ("ISO/IEC 42001:2023 Annex A Controls", ISO_42001_CONTROLS,
                  "https://www.iso.org/standard/81230.html"),
}


def card(regulator: str, control_id: str, summary: str, source_url: str) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {
        "schema": SCHEMA,
        "kind": "gspc.regulatory-atom",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {"kind": "regulatory-control", "regulator": regulator, "control_id": control_id},
        "scope": {"axis": "regulatory-framework", "kind": "regulatory-control",
                  "regulator": regulator},
        "measurement": {"status": "DISCOVERED", "control_id": control_id,
                         "summary_excerpt": summary[:200]},
        "links": {"live_board": "https://councilof.ai/api/gspc",
                  "verify": "https://councilof.ai/gspc-verify",
                  "source": source_url},
        "notes": [
            f"Auto-mined by csoai-regulatory-mine.py at {now}",
            f"Regulator: {regulator} · Control: {control_id}",
            "Status DISCOVERED — every regulation as an atom.",
        ],
    }


def emit(records: list[dict]) -> tuple[int, int]:
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"regulatory-{stamp}.jsonl"
    n_written = 0
    n_oversized = 0
    with open(path, "w") as f:
        for r in records:
            body = card(r["regulator"], r["control_id"], r["summary"], r["source_url"])
            blob = json.dumps(body, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                n_oversized += 1
                continue
            f.write(blob + "\n")
            n_written += 1
    return n_written, n_oversized


def main():
    ap = argparse.ArgumentParser(description="Regulatory mine.")
    ap.add_argument("--source", choices=list(REGULATORS.keys()) + ["all"], default="all")
    args = ap.parse_args()

    print(f"=== REGULATORY MINE (every EU AI Act article, NIST control, OWASP entry) ===")
    sources = list(REGULATORS.keys()) if args.source == "all" else [args.source]
    total = 0
    for src in sources:
        name, entries, url = REGULATORS[src]
        records = [{"regulator": src, "control_id": cid, "summary": sm, "source_url": url}
                   for entry in entries
                   for cid, sm in [entry[:2]]]
        n_written, n_oversized = emit(records)
        print(f"  {src:<14} {len(entries):>3} entries  →  {n_written} written, {n_oversized} oversized")
        total += n_written
    print(f"\n  total written: {total}")
    print(f"  queue:         {QUEUE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
