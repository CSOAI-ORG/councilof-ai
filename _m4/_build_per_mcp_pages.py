#!/usr/bin/env python3
"""Per-MCP landing pages — 1 per flagship.

32 pages = 23 flagship bridges + 9 crown-jewels. Each page has:
- Tier-1 keywords (the regulatory hook)
- One-line description
- Install command (pip + npm)
- Canonical use case
- GitHub link
- Link to the Catapult + OSCAL Verifier + Layer-0 Scorecard
"""
import re
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd/csoai-os/per-mcp")
ROOT.mkdir(parents=True, exist_ok=True)

MCPS = [
    # === 23 flagship bridges ===
    {"slug": "cobol-bridge-mcp", "name": "cobol-bridge-mcp", "framework": "COBOL + SOX + DORA + PCI-DSS",
     "tagline": "Mainframe → AI governance. Parse your COBOL, govern the AI call, Ed25519-sign the Art. 12 audit.",
     "install": "pip install cobol-bridge-mcp",
     "use_case": "A bank runs AI agents to approve cross-border wires. cobol-bridge parses the COBOL settlement module, governs the wire against EU AI Act Art.12 + DORA + AML, and emits an Ed25519-signed OSCAL audit.",
     "keywords": ["COBOL AI bridge", "mainframe AI governance", "EU AI Act COBOL", "Ed25519 mainframe", "CICS bridge", "PCI-DSS mainFrame"]},
    {"slug": "iso20022-bridge-mcp", "name": "iso20022-bridge-mcp", "framework": "ISO 20022 + PSD2 + DORA + AML",
     "tagline": "ISO 20022 / SWIFT cross-border payments → AI governance. PSD2 SCA · DORA · AML.",
     "install": "pip install iso20022-bridge-mcp",
     "use_case": "A neobank builds AI-assisted cross-border wires. iso20022-bridge governs the wire against PSD2 SCA + MiCA + AML + DORA Art.17, and emits a SIGIL-signed audit.",
     "keywords": ["ISO 20022 MCP", "SWIFT governance", "PSD2 SCA MCP", "AML wire AI", "DORA payments MCP"]},
    {"slug": "hl7-fhir-bridge-mcp", "name": "hl7-fhir-bridge-mcp", "framework": "HL7/FHIR + HIPAA + EU MDR + GDPR",
     "tagline": "HL7 / FHIR care-plan → AI governance. EU MDR Class IIa + GDPR Art.9 + HIPAA.",
     "install": "pip install hl7-fhir-bridge-mcp",
     "use_case": "A hospital uses AI to draft care-plans. hl7-fhir-bridge governs the AI-signed plan against EU MDR Class IIa + GDPR Art.9 special-category data, and emits an Ed25519-signed audit for the regulator.",
     "keywords": ["HL7 FHIR MCP", "healthcare AI bridge", "EU MDR SaMD", "GDPR Art 9 health", "HIPAA AI bridge"]},
    {"slug": "as400-bridge-mcp", "name": "as400-bridge-mcp", "framework": "AS/400 + SOX + DORA",
     "tagline": "IBM AS/400 enterprise → AI governance. SOX 404 + DORA Art.17 incident relay.",
     "install": "pip install as400-bridge-mcp",
     "use_case": "An AS/400 shop wants AI-assisted order entry. as400-bridge governs against SOX 404 + DORA Art.17, signs every action Ed25519, SIGIL-chains the audit.",
     "keywords": ["AS400 MCP", "IBM i AI bridge", "SOX 404 mainFrame", "AS/400 EU AI Act"]},
    {"slug": "sap-bridge-mcp", "name": "sap-bridge-mcp", "framework": "SAP + SOX + GDPR",
     "tagline": "SAP ERP master-data → AI governance. SOX 404 + GDPR Art.30 + EU AI Act Art.12.",
     "install": "pip install sap-bridge-mcp",
     "use_case": "A manufacturer uses AI to mutate SAP master-data. sap-bridge governs against SOX 404 + GDPR Art.30, signs every mutation.",
     "keywords": ["SAP MCP", "ERP AI governance", "SOX 404 SAP", "GDPR Art 30 SAP"]},
    {"slug": "oracle-bridge-mcp", "name": "oracle-bridge-mcp", "framework": "Oracle PL/SQL + SOX + GDPR",
     "tagline": "Oracle PL/SQL → AI governance. SOX 404 + GDPR Art.30 + immutable audit.",
     "install": "pip install oracle-bridge-mcp",
     "use_case": "An Oracle DB shop governs AI-assisted schema changes. oracle-bridge emits Ed25519-signed DDL audit.",
     "keywords": ["Oracle PL SQL MCP", "Oracle DB AI bridge", "SOX 404 Oracle"]},
    {"slug": "scada-bridge-mcp", "name": "scada-bridge-mcp", "framework": "SCADA/OT + IEC 62443 + NIS2",
     "tagline": "SCADA / OT control-room → AI governance. IEC 62443 + NIS2 Art.21 measures.",
     "install": "pip install scada-bridge-mcp",
     "use_case": "A grid uses AI to assist operators. scada-bridge governs against IEC 62443 + NIS2 Art.21, signs every operator-action.",
     "keywords": ["SCADA MCP", "OT AI governance", "IEC 62443 MCP", "NIS2 OT MCP"]},
    {"slug": "edi-bridge-mcp", "name": "edi-bridge-mcp", "framework": "EDI / EDIFACT + SOX",
     "tagline": "EDI / EDIFACT B2B → AI governance. Supply-chain traceability + EU AI Act.",
     "install": "pip install edi-bridge-mcp",
     "use_case": "A retailer uses AI to read EDI/EDIFACT orders. edi-bridge governs the AI-validated flow, signs the audit.",
     "keywords": ["EDI MCP", "EDIFACT bridge", "supply-chain AI", "EU AI Act retail"]},
    {"slug": "fix-bridge-mcp", "name": "fix-bridge-mcp", "framework": "FIX + MiFID II Art.17",
     "tagline": "FIX trading protocol → AI governance. MiFID II Art.17 algorithmic-trading audit.",
     "install": "pip install fix-bridge-mcp",
     "use_case": "A broker uses AI to fire trades. fix-bridge governs the FIX execute vs MiFID II Art.17, signs every order.",
     "keywords": ["FIX MCP", "MiFID II MCP", "algo-trading audit", "FIX AI bridge"]},
    {"slug": "cics-bridge-mcp", "name": "cics-bridge-mcp", "framework": "CICS + SOX + PCI-DSS + DORA",
     "tagline": "CICS mainframe → AI governance. SOX 404 + PCI-DSS + DORA incident relay.",
     "install": "pip install cics-bridge-mcp",
     "use_case": "A CICS region handles AI-assisted card authorisations. cics-bridge governs against PCI-DSS + SOX, signs every transaction.",
     "keywords": ["CICS MCP", "mainframe card auth", "PCI-DSS MCP", "DORA CICS"]},
    {"slug": "mqtt-bridge-mcp", "name": "mqtt-bridge-mcp", "framework": "MQTT/IoT + IEC 62443 + NIS2",
     "tagline": "MQTT / IoT telemetry → AI governance. IEC 62443 + NIS2 Art.21.",
     "install": "pip install mqtt-bridge-mcp",
     "use_case": "An IoT fleet uses AI-assisted decision-making. mqtt-bridge governs against IEC 62443 + NIS2.",
     "keywords": ["MQTT MCP", "IoT AI bridge", "IEC 62443 MQTT", "NIS2 IoT MCP"]},
    {"slug": "acord-bridge-mcp", "name": "acord-bridge-mcp", "framework": "ACORD + Solvency II + GDPR + EU AI Act",
     "tagline": "ACORD insurance messages → AI governance. Solvency II Pillar 1+3 + GDPR Art.9.",
     "install": "pip install acord-bridge-mcp",
     "use_case": "An insurer uses AI for ACORD ML/RATE/CLAIMS. acord-bridge governs against Solvency II + GDPR Art.9 special-category data.",
     "keywords": ["ACORD MCP", "Solvency II MCP", "insurance AI bridge", "GDPR 9 ACORD"]},
    {"slug": "nacha-bridge-mcp", "name": "nacha-bridge-mcp", "framework": "NACHA / ACH + OFAC + AML",
     "tagline": "NACHA / ACH US payments → AI governance. OFAC + AML + SOX 404.",
     "install": "pip install nacha-bridge-mcp",
     "use_case": "A US bank uses AI for ACH screening. nacha-bridge governs against OFAC + AML, signs every decision.",
     "keywords": ["NACHA MCP", "ACH bridge", "OFAC MCP", "AML ACH bridge"]},
    {"slug": "iso8583-bridge-mcp", "name": "iso8583-bridge-mcp", "framework": "ISO 8583 + PCI-DSS + DORA",
     "tagline": "ISO 8583 card-network messages → AI governance. PCI-DSS + DORA Art.17 incident relay.",
     "install": "pip install iso8583-bridge-mcp",
     "use_case": "A card acquirer governs AI-assisted ISO 8583 authorisations. iso8583-bridge governs against PCI-DSS + DORA.",
     "keywords": ["ISO 8583 MCP", "card MCP", "PCI-DSS bridge", "DORA card MCP"]},
    {"slug": "sip-bridge-mcp", "name": "sip-bridge-mcp", "framework": "SIP + STIR/SHAKEN + GDPR",
     "tagline": "SIP telephony → AI governance. STIR/SHAKEN attestation + GDPR Art.5.",
     "install": "pip install sip-bridge-mcp",
     "use_case": "A telco governs AI-assisted SIP call-routing. sip-bridge governs against STIR/SHAKEN + GDPR.",
     "keywords": ["SIP MCP", "STIR/SHAKEN bridge", "telephony AI", "GDPR SIP"]},
    {"slug": "tax-bridge-mcp", "name": "tax-bridge-mcp", "framework": "Tax + SOX + HMRC MTD",
     "tagline": "Tax e-invoicing + MTD → AI governance. SOX 404 + HMRC Making Tax Digital.",
     "install": "pip install tax-bridge-mcp",
     "use_case": "An accountant uses AI-assisted tax filing. tax-bridge governs against HMRC MTD + SOX 404, signs every submission.",
     "keywords": ["tax MCP", "MTD bridge", "e-invoicing AI", "SOX tax bridge"]},
    {"slug": "gs1-bridge-mcp", "name": "gs1-bridge-mcp", "framework": "GS1 / EPCIS + EU AI Act",
     "tagline": "GS1 / EPCIS retail traceability → AI governance. EU AI Act Art.12 + supply-chain.",
     "install": "pip install gs1-bridge-mcp",
     "use_case": "A retailer governs AI-assisted GS1 traceability. gs1-bridge signs every event.",
     "keywords": ["GS1 MCP", "EPCIS bridge", "retail AI traceability", "EU AI Act supply chain"]},
    {"slug": "mismo-bridge-mcp", "name": "mismo-bridge-mcp", "framework": "MISMO + ECOA + EU AI Act",
     "tagline": "MISMO mortgage origination → AI governance. ECOA fair-lending + EU AI Act Art.14.",
     "install": "pip install mismo-bridge-mcp",
     "use_case": "A mortgage lender governs AI-assisted MISMO origination. mismo-bridge governs against ECOA + EU AI Act Art.14 (high-risk credit.",
     "keywords": ["MISMO MCP", "mortgage MCP", "ECOA fair lending MCP", "EU AI Act credit"]},
    {"slug": "dlms-bridge-mcp", "name": "dlms-bridge-mcp", "framework": "DLMS / COSEM + IEC 62056 + NIS2 + GDPR",
     "tagline": "DLMS / COSEM smart-meter → AI governance. IEC 62056 + NIS2 + GDPR.",
     "install": "pip install dlms-bridge-mcp",
     "use_case": "A utility governs AI-assisted smart-meter reads. dlms-bridge governs against IEC 62056 + NIS2 + GDPR Art.9 metering data.)",
     "keywords": ["DLMS MCP", "smart meter MCP", "IEC 62056 bridge", "NIS2 metering MCP"]},
    {"slug": "model-scoreboard-mcp", "name": "model-scoreboard-mcp", "framework": "NIST AI RMF + ISO 42001",
     "tagline": "AI model leaderboard + evidence-based routing. NIST AI RMF + ISO 42001:2023 traceability.",
     "install": "pip install model-scoreboard-mcp",
     "use_case": "An enterprise picks the right AI model for governance tasks via the signed leaderboard. Compliance teams get the audit.",
     "keywords": ["model leaderboard MCP", "NIST AI RMF MCP", "ISO 42001 MCP", "model router"]},
    {"slug": "oscal-generator-mcp", "name": "oscal-generator-mcp", "framework": "NIST OSCAL + FedRAMP RFC-0024 + EU AI Act",
     "tagline": "Machine-readable NIST OSCAL + Ed25519 signer. FedRAMP RFC-0024 wedge. The 554-component proof.",
     "install": "pip install oscal-generator-mcp",
     "use_case": "A compliance team wants signed OSCAL. oscal-generator emits 554-component Ed25519-signed JSON, strict-valid against compliance-trestle.",
     "keywords": ["OSCAL MCP", "FedRAMP RFC-0024 MCP", "OSCAL signer", "Ed25519 OSCAL"]},
    {"slug": "nist-iso42001-crosswalk-mcp", "name": "nist-iso42001-crosswalk-mcp", "framework": "NIST AI RMF ↔ ISO 42001:2023",
     "tagline": "NIST AI RMF ↔ ISO/IEC 42001:2023 crosswalk. The named crosswalk (13 frameworks × 52 articles).",
     "install": "pip install nist-iso42001-crosswalk-mcp",
     "use_case": "Auditors crosswalk frameworks to derive evidence. The MCP is the crosswalk tool.",
     "keywords": ["NIST ISO 42001 crosswalk MCP", "AI governance crosswalk", "compliance crosswalk MCP"]},
    {"slug": "ll144-bias-audit-mcp", "name": "ll144-bias-audit-mcp", "framework": "NYC LL144 + EU AI Act + ECOA",
     "tagline": "NYC LL144 AEDT bias audit + EU AI Act bias-check. Published summary the law requires.",
     "install": "pip install ll144-bias-audit-mcp",
     "use_case": "An employer runs LL144 selection-rate + impact-ratio + publishes the summary.",
     "keywords": ["LL144 MCP", "NYC bias audit MCP", "ECOA bias check MCP", "EU AI Act bias"]},
    # === 9 crown-jewels (new since 2026-06-20) ===
    {"slug": "mica-crypto-mcp", "name": "mica-crypto-mcp", "framework": "EU MiCA Reg 2023/1114",
     "tagline": "EU MiCA (Reg 2023/1114) → AI governance. Crypto-asset issuers, exchanges, CASPs.",
     "install": "pip install mica-crypto-mcp",
     "use_case": "A CASP governs AI-assisted crypto-asset offerings. mica-crypto governs against MiCA Title II + III.",
     "keywords": ["MiCA MCP", "crypto regulation MCP", "EU 2023/1114 bridge", "CASP MCP"]},
    {"slug": "meok-omnibus-tracker-mcp", "name": "meok-omnibus-tracker-mcp", "framework": "EU AI Act + GDPR + DORA Omnibus",
     "tagline": "EU AI Act + GDPR + DORA Digital Omnibus tracker. 8 cliff dates + 14 article changes.",
     "install": "pip install meok-omnibus-tracker-mcp",
     "use_case": "Compliance teams track which Omnibus changes apply to their AI stack.",
     "keywords": ["Omnibus tracker MCP", "EU AI Act omnibus", "DORA tracker", "regulatory tracker MCP"]},
    {"slug": "watermarking-authenticity-mcp", "name": "watermarking-authenticity-mcp", "framework": "EU AI Act Art.50 + C2PA 2.1",
     "tagline": "EU AI Act Art.50 watermarking + C2PA 2.1. 2 Dec 2026 deadline.",
     "install": "pip install watermarking-authenticity-mcp",
     "use_case": "An AI lab adds C2PA 2.1 watermarks to model outputs. Art.50 compliance proven.",
     "keywords": ["Art 50 watermarking MCP", "C2PA MCP", "watermark MCP", "AI watermark compliance"]},
    {"slug": "regulatory-webhook-mcp", "name": "regulatory-webhook-mcp", "framework": "EU AI Act + NIS2 + DORA webhooks",
     "tagline": "Push-notify EU AI Act / NIS2 / DORA updates via webhook. Live regulatory intelligence.",
     "install": "pip install regulatory-webhook-mcp",
     "use_case": "Compliance teams get a webhook when their frameworks change.",
     "keywords": ["regulatory webhook MCP", "EU AI Act webhook", "DORA webhook", "compliance webhooks"]},
    {"slug": "uk-ai-bill-compliance-mcp", "name": "uk-ai-bill-compliance-mcp", "framework": "UK AI Bill 2026",
     "tagline": "UK AI Bill 2026 → AI governance. 5 principles framework + DSIT mapping.",
     "install": "pip install uk-ai-bill-compliance-mcp",
     "use_case": "A UK firm governs AI-assisted decisions against the 5 UK AI Bill principles.",
     "keywords": ["UK AI Bill MCP", "DSIT AI bridge", "UK AI governance", "5 principles MCP"]},
    {"slug": "cra-compliance-mcp", "name": "cra-compliance-mcp", "framework": "EU CRA Reg 2024/2847",
     "tagline": "EU Cyber Resilience Act → AI governance. CE marking + SBOM + horizontal cybersecurity.",
     "install": "pip install cra-compliance-mcp",
     "use_case": "An AI vendor governs their product against CRA + SBOM + CE marking.",
     "keywords": ["CRA MCP", "Cyber Resilience Act MCP", "CE marking MCP", "SBOM MCP"]},
    {"slug": "slsa-supply-chain-mcp", "name": "slsa-supply-chain-mcp", "framework": "SLSA v1.0 + supply-chain provenance",
     "tagline": "SLSA v1.0 supply-chain levels + provenance attestation. SBOM-signed.",
     "install": "pip install slsa-supply-chain-mcp",
     "use_case": "A software supply-chain team attests SLSA levels + signs provenance.",
     "keywords": ["SLSA MCP", "supply chain MCP", "provenance MCP", "SLSA v1 bridge"]},
    {"slug": "sigstore-cosign-mcp", "name": "sigstore-cosign-mcp", "framework": "Sigstore cosign + Rekor transparency log",
     "tagline": "Sigstore cosign + Rekor transparency log verification. Offline-detached sigs.",
     "install": "pip install sigstore-cosign-mcp",
     "use_case": "A compliance team signs builds via cosign + verifies via Rekor.",
     "keywords": ["cosign MCP", "Sigstore MCP", "Rekor MCP", "detached signature MCP"]},
    {"slug": "sbom-cyclonedx-mcp", "name": "sbom-cyclonedx-mcp", "framework": "CycloneDX 1.6 + SPDX 2.3",
     "tagline": "SBOM CycloneDX 1.6 + SPDX 2.3. EO 14028 / NIS2 / CRA.",
     "install": "pip install sbom-cyclonedx-mcp",
     "use_case": "A software vendor ships CycloneDX SBOMs with every release.",
     "keywords": ["SBOM MCP", "CycloneDX MCP", "SPDX MCP", "EO 14028 MCP"]},
    {"slug": "solvency-ii-mcp", "name": "solvency-ii-mcp", "framework": "Solvency II Pillar 1+3",
     "tagline": "First OSS implementation of the EU Solvency II Pillar 1+3 regime. €10T market, ~5,000 firms.",
     "install": "pip install solvency-ii-mcp",
     "use_case": "An EU insurer computes SCR + MCR with the OSS MCP — 5/5 framework coverage (Tier 1 SCR, Tier 2 MCR, Tier 3 technical provisions, Tier 4 ORSA, Tier 5 reporting).",
     "keywords": ["Solvency II MCP", "SCR MCP", "MCP MCP", "ORSA MCP", "actuarial MCP"]},
]

CSS = """
:root{--bg:#0a0e1a;--card:#111827;--border:#1f2937;--text:#e5e7eb;--muted:#94a3b8;--green:#10b981;--gold:#fbbf24;--blue:#3b82f6;--purple:#a855f7}*{box-sizing:border-box}body{font:14px/1.6 Inter,sans-serif;background:var(--bg);color:var(--text);margin:0;padding:24px}.wrap{max-width:900px;margin:0 auto}h1{font-size:32px;margin:0 0 4px}h1 .a{color:var(--gold)}.sub{color:var(--muted);font-size:13px;margin-bottom:20px}.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;margin-right:3px}.badge.a4{background:linear-gradient(90deg,var(--gold),#f97316);color:#000;font-weight:700}.badge.gov{background:var(--green);color:#000;font-weight:700}.install{background:var(--card);border:1px solid var(--border);border-radius:6px;padding:12px;margin:8px 0;font-family:ui-monospace,monospace;font-size:13px;color:var(--gold);border-left:3px solid var(--gold)}.section{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:18px;margin:14px 0}h3{margin:0 0 8px;color:var(--gold);font-size:16px}.kw{display:inline-block;padding:2px 6px;background:var(--border);border-radius:999px;font-size:10px;color:var(--muted);margin:2px 4px 2px 0}.cta{display:inline-block;padding:10px 18px;background:var(--gold);color:#000;border-radius:6px;font-weight:700;text-decoration:none;margin:8px 6px 8px 0;font-size:13px}.footer{text-align:center;color:var(--muted);font-size:10px;margin-top:32px;padding-top:24px;border-top:1px solid var(--border)}a{color:var(--blue)}
"""


def render(mcp):
    keywords_html = " ".join(f'<span class="kw">{kw}</span>' for kw in mcp["keywords"])
    desc = f"{mcp['name']} — {mcp['framework']}. {mcp['tagline']}"
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>{mcp["name"]} — {mcp["framework"]} · CSOAI</title>
<meta name="description" content="{mcp['tagline']} {mcp['use_case']}">
<meta name="keywords" content="{", ".join(mcp["keywords"])}, CSOAI, MEOK AI Labs, EU AI Act, 100/100 A+++++, Ed25519, sovereign, compliance, bridge, MCP">
<style>{CSS}</style></head><body><div class="wrap">

<p style="font-size:11px;color:var(--muted);margin:0 0 8px"><a href="https://csoai.org/csoai-os/">CSOAI</a> · per-MCP / <b>{mcp["name"]}</b></p>
<h1>🐉 <span class="a">{mcp["name"]}</span></h1>
<p class="sub"><span class="badge a4">100/100 A+++++</span><span class="badge gov">Ed25519-signed</span><span class="badge gov">MIT</span> · Frameworks: <b>{mcp["framework"]}</b></p>

<p style="font-size:18px;color:var(--text);margin:0 0 16px">{mcp['tagline']}</p>

<div class="install">$ {mcp['install']}</div>

<div class="section">
<h3>What it does</h3>
<p>{mcp['use_case']}</p>
</div>

<div class="section">
<h3>Keywords</h3>
<p>{keywords_html}</p>
</div>

<div class="section">
<h3>Why CSOAI</h3>
<ul style="margin:8px 0;padding-left:18px">
<li><b>First-of-kind</b> — no other OSS ships {mcp['framework']} as a signed Ed25519 MCP.</li>
<li><b>Signed</b> — every action signed Ed25519 + appended to the SIGIL chain.</li>
<li><b>Offline-verifiable</b> — your auditor verifies the trail offline (no CSOAI dependency).</li>
<li><b>Moat</b> — the only {mcp['name']} whose compliance evidence passes the standard NIST OSCAL 1.1.2 strict-validator.</li>
</ul>
</div>

<div class="section">
<h3>Want to ship this?</h3>
<p><a class="cta" href="https://github.com/CSOAI-ORG/{mcp['name']}" target="_blank">→ Open the GitHub repo</a>
<a class="cta" href="../oscal-verifier.html" style="background:transparent;border:2px solid var(--gold);color:var(--gold)">→ Verify the OSCAL proof</a>
<a class="cta" href="../catapult.html" style="background:#0c1018;border:2px solid var(--gold);color:var(--gold)">→ Book a 30-min pilot call</a></p>
</div>

<p style="margin-top:20px;font-size:11px;color:var(--muted)">MIT © 2026 MEOK AI Labs · CSOAI Ltd (UK 16939677) · <a href="https://github.com/CSOAI-ORG">github.com/CSOAI-ORG</a> · 8 protocols · 100/100 A+++++</p>
</div></body></html>'''


def main():
    written = 0
    for mcp in MCPS:
        path = ROOT / f"{mcp['slug']}.html"
        path.write_text(render(mcp))
        written += 1
    print(f"Wrote: {written} per-MCP pages into {ROOT}")


if __name__ == "__main__":
    main()
