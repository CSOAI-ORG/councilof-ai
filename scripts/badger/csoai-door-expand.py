#!/usr/bin/env python3
"""csoai-door-expand.py — discover + open more doors we haven't shipped yet.

Lane-doable: enumerates the open standards + ecosystems we could publish
a discovery doc for, and stages one unsigned atom per door.

Doors (open standards + ecosystems we can plug into):
  1. IETF SCITT — Supply Chain Integrity, Transparency and Trust (RFC 9943)
  2. W3C VC — Verifiable Credentials Data Model 2.0
  3. W3C DPV — Data Privacy Vocabulary
  4. NIST AI RMF — AI Risk Management Framework
  5. ISO/IEC 42001 — AI Management System
  6. OWASP LLM Top 10 — LLM security
  7. OWASP Agentic Top 10 — AI agent security
  8. EU AI Act — Regulation 2024/1689
  9. UK AI Bill — UK AI regulation (proposed)
  10. G7 Hiroshima AI Process — international AI governance
  11. ISO/IEC 27001 — Information Security Management
  12. SOC 2 — Trust Services Criteria
  13. PCI-DSS — Payment Card Industry Data Security Standard
  14. HIPAA — Health Insurance Portability and Accountability Act
  15. GDPR — General Data Protection Regulation
  16. CCPA — California Consumer Privacy Act
  17. EU Data Act — Regulation 2023/2854
  18. EU CRA — Cyber Resilience Act
  19. NIST CSF 2.0 — Cybersecurity Framework
  20. NIST SSDF — Secure Software Development Framework
  21. CWE — Common Weakness Enumeration
  22. CVE — Common Vulnerabilities and Exposures
  23. ATT&CK — MITRE Adversarial Tactics
  24. ENS — Esquema Nacional de Seguridad (Spain)
  25. TISAX — Trusted Information Security Assessment Exchange (Germany automotive)
  26. UK Cyber Essentials
  27. Australia PSPF — Protective Security Policy Framework
  28. Singapore MAS TRM — Technology Risk Management
  29. HKMA — Hong Kong Monetary Authority AI guidance
  30. Japan AI Guidelines — METI AI Governance Guidelines v1.0
  31. China Generative AI Measures — Cyberspace Administration of China
  32. NIST AI 600-1 — Generative AI Profile
  33. ISO/IEC 23894 — AI Risk Management
  34. ISO/IEC 42001 — AI Management System
  35. ETSI EN 303 645 — Cyber Security for Consumer IoT
  36. IEEE 7000 series — Ethically Aligned Design
  37. ASIS SPC.1 — Organizational Resilience
  38. AICPA SOC 2 — Trust Services Criteria
  39. Cloud Controls Matrix — CSA CCM
  40. ISO/IEC 27018 — PII in Public Clouds
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "door-expand"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

DOORS = [
    # standard, kind, description, url
    ("IETF SCITT", "supply-chain-transparency", "RFC 9943 — An Architecture for Trustworthy and Transparent Digital Supply Chains", "https://www.rfc-editor.org/rfc/rfc9943.html"),
    ("W3C VC", "verifiable-credentials", "W3C Verifiable Credentials Data Model 2.0", "https://www.w3.org/TR/vc-data-model-2.0/"),
    ("W3C DPV", "data-privacy-vocabulary", "W3C Data Privacy Vocabulary", "https://w3c.github.io/dpv/"),
    ("NIST AI RMF", "ai-risk-management", "NIST AI Risk Management Framework 1.0 + Generative AI Profile", "https://www.nist.gov/itl/ai-risk-management-framework"),
    ("ISO/IEC 42001", "ai-management-system", "ISO/IEC 42001:2023 AI Management System", "https://www.iso.org/standard/81230.html"),
    ("OWASP LLM Top 10", "llm-security", "OWASP Top 10 for LLM Applications 2025", "https://owasp.org/www-project-top-10-for-large-language-model-applications/"),
    ("OWASP Agentic Top 10", "agentic-security", "OWASP Top 10 for Agentic AI Applications 2026", "https://owasp.org/"),
    ("EU AI Act", "ai-regulation", "EU Regulation 2024/1689 laying down harmonised rules on AI", "https://eur-lex.europa.eu/eli/reg/2024/1689/oj"),
    ("UK AI Bill", "ai-regulation-uk", "UK AI (Regulation) Bill — proposed 2024-2025", "https://bills.parliament.uk/"),
    ("G7 Hiroshima AI Process", "ai-governance-international", "G7 Hiroshima AI Process Code of Conduct", "https://www.soumu.go.jp/hiroshimaaiprocess/"),
    ("ISO/IEC 27001", "isms", "ISO/IEC 27001:2022 Information Security Management", "https://www.iso.org/standard/27001"),
    ("SOC 2", "trust-services", "AICPA SOC 2 Trust Services Criteria", "https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2"),
    ("PCI-DSS", "payment-security", "PCI-DSS v4.0 Payment Card Industry Data Security Standard", "https://www.pcisecuritystandards.org/"),
    ("HIPAA", "health-privacy", "HIPAA — Health Insurance Portability and Accountability Act", "https://www.hhs.gov/hipaa/"),
    ("GDPR", "data-protection", "EU Regulation 2016/679 General Data Protection Regulation", "https://gdpr-info.eu/"),
    ("CCPA", "data-protection-us", "California Consumer Privacy Act", "https://oag.ca.gov/privacy/ccpa"),
    ("EU Data Act", "data-sharing", "EU Regulation 2023/2854 Data Act", "https://eur-lex.europa.eu/eli/reg/2023/2854/oj"),
    ("EU CRA", "cyber-resilience", "EU Regulation 2024/2847 Cyber Resilience Act", "https://eur-lex.europa.eu/eli/reg/2024/2847/oj"),
    ("NIST CSF 2.0", "cybersecurity-framework", "NIST Cybersecurity Framework 2.0", "https://www.nist.gov/cyberframework"),
    ("NIST SSDF", "secure-development", "NIST SP 800-218 Secure Software Development Framework", "https://csrc.nist.gov/Projects/ssdf"),
    ("CWE", "weakness-enumeration", "MITRE Common Weakness Enumeration", "https://cwe.mitre.org/"),
    ("CVE", "vulnerability-enumeration", "MITRE Common Vulnerabilities and Exposures", "https://cve.mitre.org/"),
    ("MITRE ATT&CK", "threat-intelligence", "MITRE ATT&CK Enterprise Matrix", "https://attack.mitre.org/"),
    ("ENS", "national-security-spain", "Spain Esquema Nacional de Seguridad", "https://ens.ccn.cni.es/"),
    ("TISAX", "automotive-security", "TISAX Trusted Information Security Assessment Exchange", "https://www.enx.com/tisax/"),
    ("UK Cyber Essentials", "cyber-essentials-uk", "UK Cyber Essentials + Plus", "https://www.ncsc.gov.uk/cyberessentials/"),
    ("Australia PSPF", "protective-security-au", "Australian Protective Security Policy Framework", "https://www.protectivesecurity.gov.au/"),
    ("MAS TRM", "tech-risk-sg", "Singapore MAS Technology Risk Management Guidelines", "https://www.mas.gov.sg/regulation/guidelines/technology-risk-management-guidelines"),
    ("HKMA", "banking-ai-hk", "Hong Kong Monetary Authority AI guidance", "https://www.hkma.gov.hk/"),
    ("METI AI Guidelines", "ai-governance-jp", "Japan METI AI Governance Guidelines v1.0", "https://www.meti.go.jp/english/policy/mono_info_service/ai_governance/"),
    ("China GenAI Measures", "genai-regulation-cn", "Cyberspace Administration of China Generative AI Measures", "http://www.cac.gov.cn/"),
    ("NIST AI 600-1", "genai-profile", "NIST AI 600-1 Generative AI Profile", "https://www.nist.gov/itl/ai-risk-management-framework"),
    ("ISO/IEC 23894", "ai-risk-iso", "ISO/IEC 23894:2023 AI Risk Management", "https://www.iso.org/standard/77304.html"),
    ("ETSI EN 303 645", "iot-cyber", "ETSI EN 303 645 Cyber Security for Consumer IoT", "https://www.etsi.org/deliver/etsi_en/303600_303699/303645/"),
    ("IEEE 7000", "ethical-design", "IEEE 7000-series Model Process for Addressing Ethical Concerns", "https://standards.ieee.org/ieee/7000/7097/"),
    ("ASIS SPC.1", "resilience", "ASIS SPC.1-2009 Organizational Resilience", "https://www.asisonline.org/"),
    ("ISO/IEC 27018", "pii-cloud", "ISO/IEC 27018 PII in Public Clouds", "https://www.iso.org/standard/76559.html"),
    ("CSA CCM", "cloud-controls", "Cloud Security Alliance Cloud Controls Matrix v4", "https://cloudsecurityalliance.org/research/cloud-controls-matrix/"),
    ("FedRAMP marketplace", "fedramp", "FedRAMP marketplace — AI listings", "https://marketplace.fedramp.gov/"),
    ("IL5 / DoD CMMC", "defense-contractor", "DoD CMMC 2.0 + IL5 cloud", "https://dodcio.defense.gov/CMMC/"),
]


def card(standard: str, kind: str, description: str, url: str) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {"kind": "compliance-standard", "source": standard},
        "scope": {"axis": "regulatory-framework", "kind": kind},
        "measurement": {
            "status": "DISCOVERED",
            "evidence": {
                "standard": standard,
                "kind": kind,
                "description": description[:200],
            },
            "source_url": url,
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
            "door_discovery": "https://councilof.ai/.well-known/" + standard.lower().replace(" ", "-").replace("/", "-").replace("—", "-") + ".json",
        },
        "notes": [
            f"Standard: {standard}",
            f"Description: {description[:150]}",
            "Door expansion: every standard we can publish a discovery doc for.",
            "Status: DISCOVERED — the standard exists, our measurement is staged.",
        ],
    }


def emit():
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"door-expand-{stamp}.jsonl"
    n_written = 0
    n_oversized = 0
    with open(path, "w") as f:
        for standard, kind, description, url in DOORS:
            body = card(standard, kind, description, url)
            blob = json.dumps(body, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                # Trim the description
                body["measurement"]["evidence"]["description"] = description[:80]
                blob = json.dumps(body, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                n_oversized += 1
                continue
            f.write(blob + "\n")
            n_written += 1
    return path, n_written, n_oversized


def main():
    ap = argparse.ArgumentParser(description="Discover more open doors.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — DOOR EXPANSION")
    print(f"  {len(DOORS)} standards + ecosystems to publish a discovery doc for")
    print("================================================================")
    print()
    for i, (standard, kind, desc, url) in enumerate(DOORS, 1):
        print(f"  {i:>3}. {standard:<25} {kind:<25} {desc[:60]}")
    print()
    path, n_written, n_oversized = emit()
    print(f"  wrote {n_written} atoms ({n_oversized} oversized)")
    print(f"  queue: {path}")
    print()
    print("  Next: build the discovery doc generators, ship one per door")
    return 0


if __name__ == "__main__":
    sys.exit(main())
