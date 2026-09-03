#!/usr/bin/env python3
"""csoai-door-docs.py — generate discovery docs for every open door.

Lane-doable: for each of the 40 standards in csoai-door-expand.py,
generate a public/.well-known/<standard-slug>.json discovery doc with:
  - schema: csoai.door/<standard>
  - publisher: CSOAI Ltd
  - trust_anchor: did:web:csoai.org
  - door: the public-facing endpoint for that standard
  - canonical_artefact: the canonical-form attestation
  - verify_endpoint: /gspc-verify
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
DOORS = [
    ("IETF SCITT", "supply-chain-transparency", "RFC 9943 — An Architecture for Trustworthy and Transparent Digital Supply Chains", "https://www.rfc-editor.org/rfc/rfc9943.html", "scitt"),
    ("W3C VC", "verifiable-credentials", "W3C Verifiable Credentials Data Model 2.0", "https://www.w3.org/TR/vc-data-model-2.0/", "vc"),
    ("W3C DPV", "data-privacy-vocabulary", "W3C Data Privacy Vocabulary", "https://w3c.github.io/dpv/", "dpv"),
    ("NIST AI RMF", "ai-risk-management", "NIST AI Risk Management Framework 1.0 + Generative AI Profile", "https://www.nist.gov/itl/ai-risk-management-framework", "nist-ai-rmf"),
    ("ISO/IEC 42001", "ai-management-system", "ISO/IEC 42001:2023 AI Management System", "https://www.iso.org/standard/81230.html", "iso-42001"),
    ("OWASP LLM Top 10", "llm-security", "OWASP Top 10 for LLM Applications 2025", "https://owasp.org/www-project-top-10-for-large-language-model-applications/", "owasp-llm"),
    ("OWASP Agentic Top 10", "agentic-security", "OWASP Top 10 for Agentic AI Applications 2026", "https://owasp.org/", "owasp-agentic"),
    ("EU AI Act", "ai-regulation", "EU Regulation 2024/1689 laying down harmonised rules on AI", "https://eur-lex.europa.eu/eli/reg/2024/1689/oj", "eu-ai-act"),
    ("UK AI Bill", "ai-regulation-uk", "UK AI (Regulation) Bill — proposed 2024-2025", "https://bills.parliament.uk/", "uk-ai-bill"),
    ("G7 Hiroshima AI Process", "ai-governance-international", "G7 Hiroshima AI Process Code of Conduct", "https://www.soumu.go.jp/hiroshimaaiprocess/", "g7-hiroshima"),
    ("ISO/IEC 27001", "isms", "ISO/IEC 27001:2022 Information Security Management", "https://www.iso.org/standard/27001", "iso-27001"),
    ("SOC 2", "trust-services", "AICPA SOC 2 Trust Services Criteria", "https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2", "soc2"),
    ("PCI-DSS", "payment-security", "PCI-DSS v4.0 Payment Card Industry Data Security Standard", "https://www.pcisecuritystandards.org/", "pci-dss"),
    ("HIPAA", "health-privacy", "HIPAA — Health Insurance Portability and Accountability Act", "https://www.hhs.gov/hipaa/", "hipaa"),
    ("GDPR", "data-protection", "EU Regulation 2016/679 General Data Protection Regulation", "https://gdpr-info.eu/", "gdpr"),
    ("CCPA", "data-protection-us", "California Consumer Privacy Act", "https://oag.ca.gov/privacy/ccpa", "ccpa"),
    ("EU Data Act", "data-sharing", "EU Regulation 2023/2854 Data Act", "https://eur-lex.europa.eu/eli/reg/2023/2854/oj", "eu-data-act"),
    ("EU CRA", "cyber-resilience", "EU Regulation 2024/2847 Cyber Resilience Act", "https://eur-lex.europa.eu/eli/reg/2024/2847/oj", "eu-cra"),
    ("NIST CSF 2.0", "cybersecurity-framework", "NIST Cybersecurity Framework 2.0", "https://www.nist.gov/cyberframework", "nist-csf"),
    ("NIST SSDF", "secure-development", "NIST SP 800-218 Secure Software Development Framework", "https://csrc.nist.gov/Projects/ssdf", "nist-ssdf"),
    ("CWE", "weakness-enumeration", "MITRE Common Weakness Enumeration", "https://cwe.mitre.org/", "cwe"),
    ("CVE", "vulnerability-enumeration", "MITRE Common Vulnerabilities and Exposures", "https://cve.mitre.org/", "cve"),
    ("MITRE ATT&CK", "threat-intelligence", "MITRE ATT&CK Enterprise Matrix", "https://attack.mitre.org/", "mitre-attack"),
    ("ENS", "national-security-spain", "Spain Esquema Nacional de Seguridad", "https://ens.ccn.cni.es/", "ens"),
    ("TISAX", "automotive-security", "TISAX Trusted Information Security Assessment Exchange", "https://www.enx.com/tisax/", "tisax"),
    ("UK Cyber Essentials", "cyber-essentials-uk", "UK Cyber Essentials + Plus", "https://www.ncsc.gov.uk/cyberessentials/", "cyber-essentials"),
    ("Australia PSPF", "protective-security-au", "Australian Protective Security Policy Framework", "https://www.protectivesecurity.gov.au/", "pspf"),
    ("MAS TRM", "tech-risk-sg", "Singapore MAS Technology Risk Management Guidelines", "https://www.mas.gov.sg/regulation/guidelines/technology-risk-management-guidelines", "mas-trm"),
    ("HKMA", "banking-ai-hk", "Hong Kong Monetary Authority AI guidance", "https://www.hkma.gov.hk/", "hkma"),
    ("METI AI Guidelines", "ai-governance-jp", "Japan METI AI Governance Guidelines v1.0", "https://www.meti.go.jp/english/policy/mono_info_service/ai_governance/", "meti-ai"),
    ("China GenAI Measures", "genai-regulation-cn", "Cyberspace Administration of China Generative AI Measures", "http://www.cac.gov.cn/", "cn-genai"),
    ("NIST AI 600-1", "genai-profile", "NIST AI 600-1 Generative AI Profile", "https://www.nist.gov/itl/ai-risk-management-framework", "nist-ai-600-1"),
    ("ISO/IEC 23894", "ai-risk-iso", "ISO/IEC 23894:2023 AI Risk Management", "https://www.iso.org/standard/77304.html", "iso-23894"),
    ("ETSI EN 303 645", "iot-cyber", "ETSI EN 303 645 Cyber Security for Consumer IoT", "https://www.etsi.org/deliver/etsi_en/303600_303699/303645/", "etsi-303645"),
    ("IEEE 7000", "ethical-design", "IEEE 7000-series Model Process for Addressing Ethical Concerns", "https://standards.ieee.org/ieee/7000/7097/", "ieee-7000"),
    ("ASIS SPC.1", "resilience", "ASIS SPC.1-2009 Organizational Resilience", "https://www.asisonline.org/", "asis-spc1"),
    ("ISO/IEC 27018", "pii-cloud", "ISO/IEC 27018 PII in Public Clouds", "https://www.iso.org/standard/76559.html", "iso-27018"),
    ("CSA CCM", "cloud-controls", "Cloud Security Alliance Cloud Controls Matrix v4", "https://cloudsecurityalliance.org/research/cloud-controls-matrix/", "csa-ccm"),
    ("FedRAMP marketplace", "fedramp", "FedRAMP marketplace — AI listings", "https://marketplace.fedramp.gov/", "fedramp"),
    ("IL5 / DoD CMMC", "defense-contractor", "DoD CMMC 2.0 + IL5 cloud", "https://dodcio.defense.gov/CMMC/", "cmmc"),
]

PUBLIC = HERE.parent.parent / "public" / ".well-known"

DID = "did:web:csoai.org"
ISSUER = "CSOAI Ltd (UK 16939677)"


def slug(s: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s


def discovery_doc(standard: str, kind: str, description: str, url: str, sl: str) -> dict:
    return {
        "schema": f"csoai.door/{sl}/0.1",
        "publisher": ISSUER,
        "trust_anchor": {
            "did": DID,
            "did_document": "https://csoai.org/.well-known/did.json",
            "signing_keys": [
                {"id": "did:web:csoai.org#card-attestation-1", "purpose": "3KB measurement cards"},
                {"id": "did:web:csoai.org#board-attestation-1", "purpose": "22-axis board snapshot"},
            ],
        },
        "standard": {
            "name": standard,
            "kind": kind,
            "description": description[:300],
            "url": url,
        },
        "door": {
            "publisher": "Council of AI (CSOAI Ltd)",
            "endpoints": {
                "discover": f"https://councilof.ai/.well-known/{sl}.json",
                "verify": "https://councilof.ai/gspc-verify",
                "corrections": "https://councilof.ai/api/corrections",
                "root": "https://councilof.ai/root.json",
            },
            "evidence_pack": f"https://councilof.ai/api/evidence-bundle?obligation={sl}",
            "canonical_form": "JCS (RFC 8785)-style canonical JSON — Python json.dumps(sort_keys=True, separators=(',',':'), ensure_ascii=True)",
        },
        "measurement": {
            "schema": "csoai.gspc-axes/0.5",
            "status": "live",
            "axes_covered": 22,
            "lid": "22 axes · 22 measured · 14 model-comparison · 8 deterministic-fact",
        },
        "notes": [
            f"Discovery doc for {standard}",
            f"Description: {description[:200]}",
            "Anyone can re-check the measurement at /gspc-verify.",
            "This doc is the first layer (Layer 0) — the unsealed first layer.",
        ],
    }


def main():
    ap = argparse.ArgumentParser(description="Generate discovery docs for every open door.")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    PUBLIC.mkdir(parents=True, exist_ok=True)
    print("================================================================")
    print(f"  CSOAI — DOOR DISCOVERY DOCS ({len(DOORS)} standards)")
    print("================================================================")
    print()
    n_written = 0
    n_skipped = 0
    for standard, kind, description, url, sl in DOORS:
        doc = discovery_doc(standard, kind, description, url, sl)
        path = PUBLIC / f"{sl}.json"
        # Never template over a hand-authored surface. This loop wrote unconditionally until
        # 2026-09-03, and on 2a8e46c8 it overwrote the RFC 9943 SCITT profile with the generic
        # door doc — destroying statements[], transparency_service, verification and coordination,
        # which is what turned the crawler-view gate red. A file may opt out by declaring
        # "do_not_template": true; the generator now respects that.
        if path.exists():
            try:
                existing = json.loads(path.read_text())
            except (ValueError, OSError):
                existing = {}
            if isinstance(existing, dict) and existing.get("do_not_template") is True:
                n_skipped += 1
                print(f"  · {standard:<28} → SKIPPED (hand-authored, do_not_template)")
                continue
        if not args.dry_run:
            path.write_text(json.dumps(doc, indent=2, sort_keys=True))
        n_written += 1
        print(f"  ✓ {standard:<28} → /public/.well-known/{sl}.json")
    print()
    print(f"  wrote {n_written} discovery docs to public/.well-known/"
          + (f" ({n_skipped} hand-authored skipped)" if n_skipped else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
