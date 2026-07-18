#!/usr/bin/env python3
"""Bulk-update GitHub repo topics + description for all flagship bridges.

Drives the GEO/discoverability layer for free (no owner-key needed).
Uses `gh repo edit` (authenticated via the existing `gh` keyring).

Re-runnable. Skips repos where the user lacks admin (the per-MCP repos
are org-owned so this should work for all).
"""
import json
import subprocess
import sys
import time
from pathlib import Path

CLAWD = Path.home() / "clawd"
MANIFEST = CLAWD / "MCP_DEPLOYMENT_MANIFEST.json"
OUT = CLAWD / "GITHUB_REPO_UPDATE_REPORT_2026-06-27.json"
ORG = "CSOAI-ORG"

# Flagship subset (the 19 bridges + 4 extras from the v1 distribution list)
FLAGSHIP = [
    "cobol-bridge-mcp", "iso20022-bridge-mcp", "hl7-fhir-bridge-mcp",
    "as400-bridge-mcp", "sap-bridge-mcp", "oracle-bridge-mcp", "scada-bridge-mcp",
    "edi-bridge-mcp", "fix-bridge-mcp", "cics-bridge-mcp", "mqtt-bridge-mcp",
    "acord-bridge-mcp", "nacha-bridge-mcp", "iso8583-bridge-mcp", "sip-bridge-mcp",
    "tax-bridge-mcp", "gs1-bridge-mcp", "mismo-bridge-mcp", "dlms-bridge-mcp",
    "model-scoreboard-mcp", "oscal-generator-mcp", "nist-iso42001-crosswalk-mcp",
    "ll144-bias-audit-mcp",
]

# Per-MCP topic + description overrides
TOPICS_BASE = ["mcp", "mcp-server", "claude", "model-context-protocol", "csoai", "meok-ai-labs"]
OVERRIDES = {
    "cobol-bridge-mcp": ("Mainframe → AI governance. EU AI Act Art. 12 audit + Ed25519-signed.", ["cobol", "mainframe", "sox", "dora", "banking"]),
    "iso20022-bridge-mcp": ("ISO 20022 / SWIFT payments → AI governance. PSD2 + DORA + AML.", ["iso20022", "swift", "payments", "psd2", "dora"]),
    "hl7-fhir-bridge-mcp": ("HL7/FHIR healthcare → AI governance. HIPAA + EU MDR + GDPR.", ["hl7", "fhir", "healthcare", "hipaa", "eu-mdr"]),
    "as400-bridge-mcp": ("IBM AS/400 enterprise → AI governance. SOX + DORA.", ["as400", "ibm-i", "sox", "enterprise"]),
    "sap-bridge-mcp": ("SAP ERP → AI governance. SOX + GDPR.", ["sap", "erp", "sox", "gdpr"]),
    "oracle-bridge-mcp": ("Oracle PL/SQL → AI governance. SOX + GDPR.", ["oracle", "plsql", "database", "sox"]),
    "scada-bridge-mcp": ("SCADA/OT industrial → AI governance. IEC 62443 + NIS2.", ["scada", "ot", "industrial", "iec-62443", "nis2"]),
    "edi-bridge-mcp": ("EDI/EDIFACT B2B → AI governance. SOX.", ["edi", "edifact", "b2b", "supply-chain"]),
    "fix-bridge-mcp": ("FIX trading protocol → AI governance. MiFID II Art. 17.", ["fix", "trading", "mifid-ii", "algorithmic"]),
    "cics-bridge-mcp": ("CICS mainframe transactions → AI governance. SOX + PCI-DSS + DORA.", ["cics", "mainframe", "transactions", "pci-dss"]),
    "mqtt-bridge-mcp": ("MQTT/IoT → AI governance. IEC 62443 + NIS2.", ["mqtt", "iot", "iec-62443", "nis2"]),
    "acord-bridge-mcp": ("ACORD insurance → AI governance. Solvency II + GDPR + EU AI Act.", ["acord", "insurance", "solvency-ii"]),
    "nacha-bridge-mcp": ("NACHA/ACH US payments → AI governance. OFAC + AML.", ["nacha", "ach", "us-payments", "ofac", "aml"]),
    "iso8583-bridge-mcp": ("ISO 8583 card networks → AI governance. PCI-DSS + DORA.", ["iso8583", "cards", "pci-dss"]),
    "sip-bridge-mcp": ("SIP telephony → AI governance. STIR/SHAKEN + GDPR.", ["sip", "telephony", "stir-shaken"]),
    "tax-bridge-mcp": ("Tax / e-invoicing → AI governance. SOX + HMRC MTD.", ["tax", "einvoicing", "hmrc"]),
    "gs1-bridge-mcp": ("GS1/EPCIS retail traceability → AI governance. EU AI Act.", ["gs1", "epcis", "retail", "traceability"]),
    "mismo-bridge-mcp": ("MISMO mortgage → AI governance. ECOA + EU AI Act.", ["mismo", "mortgage", "ecoa"]),
    "dlms-bridge-mcp": ("DLMS/COSEM energy/smart-meter → AI governance. IEC 62056 + NIS2 + GDPR.", ["dlms", "cosem", "energy", "iec-62056"]),
    "model-scoreboard-mcp": ("AI model leaderboard + evidence-based routing. NIST + ISO 42001.", ["leaderboard", "routing", "nist", "iso-42001"]),
    "oscal-generator-mcp": ("Machine-readable NIST OSCAL generator + Ed25519 signer. FedRAMP RFC-0024.", ["oscal", "fedramp", "rfc-0024", "ed25519"]),
    "nist-iso42001-crosswalk-mcp": ("NIST AI RMF ↔ ISO/IEC 42001:2023 crosswalk. The named crosswalk.", ["nist-rmf", "iso-42001", "crosswalk"]),
    "ll144-bias-audit-mcp": ("NYC Local Law 144 bias audit + EU AI Act bias-check.", ["ll144", "bias-audit", "nyc", "ecoa"]),
}


def update_repo(slug: str) -> dict:
    if slug not in OVERRIDES:
        return {"slug": slug, "status": "skipped", "reason": "no override"}
    desc, extra_topics = OVERRIDES[slug]
    topics = TOPICS_BASE + extra_topics
    topics_csv = ",".join(topics)
    try:
        result = subprocess.run(
            ["gh", "repo", f"edit", f"{ORG}/{slug}",
             "--add-topic", topics_csv,
             "--description", desc],
            capture_output=True, text=True, timeout=15,
        )
        if result.returncode == 0:
            return {"slug": slug, "status": "updated", "topics_count": len(topics)}
        return {"slug": slug, "status": "error", "stderr": result.stderr[-200:]}
    except subprocess.TimeoutExpired:
        return {"slug": slug, "status": "timeout"}
    except Exception as e:
        return {"slug": slug, "status": f"error:{type(e).__name__}"}


def main():
    print(f"Bulk-update GitHub topics for {len(FLAGSHIP)} flagship MCPs", flush=True)
    results = []
    for i, slug in enumerate(FLAGSHIP, 1):
        r = update_repo(slug)
        results.append(r)
        flag = {"updated": "✓", "error": "✗", "skipped": "·", "timeout": "⏱"}.get(r["status"], "?")
        print(f"  {flag} {slug:35s} {r['status']:10s} {r.get('topics_count', '')}", flush=True)
        if i % 10 == 0:
            time.sleep(1)  # rate limit courtesy
    by_status = {}
    for r in results:
        by_status.setdefault(r["status"], 0)
        by_status[r["status"]] += 1
    OUT.write_text(json.dumps({"aggregate": by_status, "results": results}, indent=2))
    print()
    print("=== AGGREGATE ===")
    for k, v in by_status.items():
        print(f"  {k}: {v}")
    print(f"\nWrote: {OUT}")


if __name__ == "__main__":
    main()
