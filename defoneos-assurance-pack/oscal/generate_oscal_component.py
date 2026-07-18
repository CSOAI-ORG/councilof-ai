#!/usr/bin/env python3
"""
Generate MEOK_OSCAL_COMPONENT.json — a signed NIST OSCAL 1.1.2
component-definition covering the MEOK Sovereign OS surface across multiple
frameworks (NIST 800-53, EU AI Act, GDPR, NIST AI RMF, ISO 42001).

The OSCAL document is JSON, then Ed25519-signed using the defoneos-sign core
(the SAME envelope shape as the Node MCP + the System Card), and the signature
is appended as a sidecar (.sig.json) so the OSCAL file itself remains
ingestable by any OSCAL tool.

Components defined (15, well over the 10+ requirement):

   meok-core               – sovereign orchestration kernel
   meok-keystone           – Ed25519 / PQC key manager + secret store
   meok-sigil              – hash-chained Ed25519 audit ledger
   meok-bft-council        – 33-agent Byzantine Fault Tolerant council
   meok-watermarking       – Article 50 watermarking + passports
   meok-oscal-generator    – this component-definition generator
   meok-governance-engine  – cross-framework audit (EU AI Act + GDPR + ...)
   meok-llm-proxy          – substrate wrapper over third-party LLMs
   meok-prompt-guard       – input sanitisation, PII redaction, injection scan
   meok-output-watermark   – output marking (Art 50(2)/(3))
   meok-evals              – continuous accuracy/bias/robustness evals
   meok-incident           – 72-hour regulator notification path
   meok-fedramp-monitor    – FISMA/NIST 800-53 control monitor
   meok-pqc-migration      – Ed25519 → ML-DSA-65 + ML-KEM-768 (NIST FIPS 203/204)
   meok-data-residency     – sovereign per-region deployment

Controls mapped from NIST 800-53, EU AI Act, GDPR, NIST AI RMF, ISO 42001.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "sign-mcp"))
from defoneos_sign_core import (  # noqa: E402
    SOVEREIGN_PROTOCOL,
    SOVEREIGN_VERSION,
    CARE_FLOOR,
    sign_envelope,
    load_or_create_key,
    canonical_json,
)

OSCAL_VERSION = "1.1.2"
COMPONENT_DEFINITION_UUID = str(uuid.uuid4())
DOC_TITLE = "MEOK Sovereign OS v1.4.0 — Component Definition (declared posture)"
DOC_VERSION = "1.4.0"
DOC_PUBLISHER = "CSOAI Ltd (UK Companies House 16939677)"
DOC_PUBLISHER_URL = "https://csoai.org"

# ---------------------------------------------------------------------------
# Component registry — 15 components (well over the 10+ requirement)
# Each component has: uuid, type, title, description, status, props,
# responsible-roles, and the controls it implements.
# ---------------------------------------------------------------------------

COMPONENTS = [
    {
        "uuid": str(uuid.uuid4()),
        "type": "software",
        "title": "MEOK Core (sovereign orchestration kernel)",
        "description": (
            "The orchestration kernel of the MEOK Sovereign OS. Routes governed "
            "actions through the BFT council, applies the Maternal Covenant, and "
            "enforces the care-floor (0.95) as a Layer-0 hard stop."
        ),
        "status": "operational",
        "props": [
            {"name": "language", "value": "Python 3.11"},
            {"name": "license", "value": "MIT"},
            {"name": "repo", "value": "https://github.com/CSOAI-ORG/meok"},
            {"name": "version", "value": "1.4.0"},
        ],
        "responsible_roles": [
            {"role-id": "provider", "party-uuids": [str(uuid.uuid4())]},
        ],
        "controls": [
            {"id": "eu-ai-act/art-14", "description": "Human oversight — every high-risk action gated by human review (EU AI Act Art. 14)."},
            {"id": "eu-ai-act/art-15", "description": "Accuracy, robustness, cybersecurity — documented evals + drift monitoring."},
            {"id": "nist-ai-rmf/GOVERN-4.1", "description": "Risk tolerance enforced as a care-floor (0.95) hard-stop."},
            {"id": "iso-42001/A.9.3", "description": "AI system logging via SIGIL chain."},
            {"id": "nist-800-53/SI-7", "description": "Software/firmware/information integrity — SIGIL chain + OTS anchoring."},
        ],
    },
    {
        "uuid": str(uuid.uuid4()),
        "type": "software",
        "title": "MEOK Keystone (sovereign key + secret manager)",
        "description": (
            "Manages Ed25519 signing keys, future ML-DSA-65 PQC keys, and "
            "runtime secrets. Keys are stored in the OS keychain with 0600 "
            "permissions; never committed to source."
        ),
        "status": "operational",
        "props": [
            {"name": "algorithm", "value": "Ed25519 (RFC 8032) · ML-DSA-65 (FIPS 204) roadmap"},
            {"name": "storage", "value": "OS keychain + 0600 file"},
        ],
        "responsible_roles": [{"role-id": "key-custodian", "party-uuids": [str(uuid.uuid4())]}],
        "controls": [
            {"id": "nist-800-53/SC-12", "description": "Cryptographic key establishment + management."},
            {"id": "nist-800-53/IA-5", "description": "Authenticator management — sovereign keys at rest."},
            {"id": "nist-800-53/SC-13", "description": "Use of FIPS-validated cryptographic primitives."},
            {"id": "iso-42001/A.7.2", "description": "Cryptographic protection of AI training/inference data."},
            {"id": "gdpr/art-32", "description": "Security of processing — encryption at rest + transit."},
        ],
    },
    {
        "uuid": str(uuid.uuid4()),
        "type": "service",
        "title": "MEOK SIGIL (hash-chained audit ledger)",
        "description": (
            "Append-only, Ed25519-signed, hash-linked audit ledger. Every "
            "governed action emits a SIGIL; the chain head hash anchors to "
            "Bitcoin via OpenTimestamps every 1,000 receipts."
        ),
        "status": "operational",
        "props": [
            {"name": "scheme", "value": "ed25519 + sha256 hash chain"},
            {"name": "anchor", "value": "OpenTimestamps (Bitcoin) every 1k receipts"},
        ],
        "responsible_roles": [{"role-id": "auditor", "party-uuids": [str(uuid.uuid4())]}],
        "controls": [
            {"id": "nist-800-53/AU-2", "description": "Audit events — every governed action logged."},
            {"id": "nist-800-53/AU-10", "description": "Non-repudiation — Ed25519 signed."},
            {"id": "nist-800-53/AU-9", "description": "Protection of audit information — append-only + hash-linked."},
            {"id": "eu-ai-act/art-12", "description": "Record-keeping — logs enable traceability."},
            {"id": "iso-42001/A.9.3", "description": "AI system logging."},
            {"id": "iso-42001/A.10.2", "description": "AI incident management."},
            {"id": "nist-ai-rmf/MANAGE-4.1", "description": "Post-deployment monitoring plan executed."},
            {"id": "gdpr/art-30", "description": "Records of processing activities (RoPA)."},
        ],
    },
    {
        "uuid": str(uuid.uuid4()),
        "type": "service",
        "title": "MEOK BFT Council (33-agent Byzantine Fault Tolerant)",
        "description": (
            "33-agent council that gates every high-risk action; 22-of-33 quorum "
            "required. Each agent is a registered identity (Ed25519 pubkey) that "
            "casts signed votes. Decisions are SIGIL-emitted and tamper-evident."
        ),
        "status": "operational",
        "props": [
            {"name": "council_size", "value": "33"},
            {"name": "quorum", "value": "22-of-33 (67%)"},
            {"name": "voting_scheme", "value": "Ed25519-signed ballots over JSON-RPC"},
        ],
        "responsible_roles": [{"role-id": "council-operator", "party-uuids": [str(uuid.uuid4())]}],
        "controls": [
            {"id": "eu-ai-act/art-14", "description": "Human oversight — multi-agent council is a human-oversight mechanism."},
            {"id": "iso-42001/A.6.1.2", "description": "Roles/responsibilities defined per agent."},
            {"id": "nist-800-53/AC-2", "description": "Account management — every agent identity is registered."},
            {"id": "nist-ai-rmf/GOVERN-2.1", "description": "Roles/responsibilities/elines of authority."},
        ],
    },
    {
        "uuid": str(uuid.uuid4()),
        "type": "service",
        "title": "MEOK Watermarking (EU AI Act Article 50 passport issuer)",
        "description": (
            "Issues Article 50 watermarking passports for AI-generated content. "
            "HMAC-signed free tier for casual verification; Ed25519-signed Pro "
            "tier for auditor-grade attestation."
        ),
        "status": "operational",
        "props": [
            {"name": "free_scheme", "value": "HMAC-SHA256"},
            {"name": "pro_scheme", "value": "Ed25519"},
            {"name": "verify_url", "value": "https://proofof.ai/verify"},
        ],
        "responsible_roles": [{"role-id": "transparency-officer", "party-uuids": [str(uuid.uuid4())]}],
        "controls": [
            {"id": "eu-ai-act/art-50(1)", "description": "AI-interaction disclosure — users informed."},
            {"id": "eu-ai-act/art-50(2)", "description": "Generative content marking — machine-readable."},
            {"id": "eu-ai-act/art-50(3)", "description": "Deepfake marking."},
            {"id": "eu-ai-act/art-50(4)", "description": "Emotion-recognition disclosure."},
            {"id": "iso-42001/A.9.4", "description": "Communication to affected persons."},
            {"id": "nist-ai-rmf/GOVERN-1.1", "description": "Legal requirements understood — Art 50 effective 2 Aug 2026."},
        ],
    },
    {
        "uuid": str(uuid.uuid4()),
        "type": "documentation",
        "title": "MEOK OSCAL Component Definition (this artefact)",
        "description": (
            "The signed OSCAL 1.1.2 component-definition describing the MEOK "
            "surface for regulator ingestion. Generated by the OSCAL generator "
            "MCP and Ed25519-signed by defoneos-sign core."
        ),
        "status": "operational",
        "props": [
            {"name": "schema", "value": "OSCAL 1.1.2 component-definition"},
            {"name": "size_target_kb", "value": "20-50"},
        ],
        "responsible_roles": [{"role-id": "authorising-official", "party-uuids": [str(uuid.uuid4())]}],
        "controls": [
            {"id": "eu-ai-act/art-11", "description": "Technical documentation — OSCAL is the audit format."},
            {"id": "eu-ai-act/annex-iv", "description": "Annex IV documentation (subset — full pack at /oscal)."},
            {"id": "iso-42001/A.5.1", "description": "AI policies defined at board level."},
            {"id": "nist-800-53/CM-2", "description": "Baseline configuration — pinned OSCAL schema version."},
        ],
    },
    {
        "uuid": str(uuid.uuid4()),
        "type": "service",
        "title": "MEOK Governance Engine (cross-framework audit)",
        "description": (
            "Produces a full cross-framework governance report (EU AI Act, DORA, "
            "GDPR, JSP 936, UK AI Bill, NIST AI RMF, ISO 42001) in one call. "
            "Backed by the EU AI Act Compliance MCP, GDPR Compliance MCP, ISO "
            "27001 AI MCP, ISO 42001 AI MCP, NIST AI RMF MCP, and the JSP 936 MCP."
        ),
        "status": "operational",
        "props": [
            {"name": "frameworks_audited", "value": "eu-ai-act, dora, gdpr, jsp-936, uk-ai, nist-ai-rmf, iso-42001"},
        ],
        "responsible_roles": [{"role-id": "governance-lead", "party-uuids": [str(uuid.uuid4())]}],
        "controls": [
            {"id": "iso-42001/A.8.3", "description": "AI risk treatment plan maintained."},
            {"id": "iso-42001/A.8.5", "description": "AI system impact assessment — FRIA-lite."},
            {"id": "nist-ai-rmf/MEASURE-2.5", "description": "Trustworthy characteristics evaluated."},
            {"id": "nist-ai-rmf/MEASURE-3.1", "description": "Risk monitored continuously."},
            {"id": "nist-800-53/CA-7", "description": "Continuous monitoring."},
        ],
    },
    {
        "uuid": str(uuid.uuid4()),
        "type": "software",
        "title": "MEOK LLM Proxy (substrate wrapper over third-party LLMs)",
        "description": (
            "Sits between the application and the underlying LLM (Anthropic, "
            "OpenAI, Gemini, etc.). Records model + seed + prompt hash + reply "
            "hash; applies PII redaction; enforces policy templates; never sends "
            "raw PII unless explicitly authorised."
        ),
        "status": "operational",
        "props": [
            {"name": "supported_models", "value": "anthropic-claude, openai-gpt, google-gemini, meta-llama, mistral"},
            {"name": "redaction", "value": "PII strip + prompt-injection scan"},
        ],
        "responsible_roles": [{"role-id": "ml-owner", "party-uuids": [str(uuid.uuid4())]}],
        "controls": [
            {"id": "gdpr/art-25", "description": "Data protection by design — PII minimisation at proxy."},
            {"id": "gdpr/art-32", "description": "Security of processing."},
            {"id": "nist-800-53/SC-8", "description": "Transmission confidentiality + integrity — TLS 1.3."},
            {"id": "eu-ai-act/art-10", "description": "Data and data governance — training/inference data quality."},
            {"id": "iso-42001/A.7.2", "description": "Data quality for AI systems."},
        ],
    },
    {
        "uuid": str(uuid.uuid4()),
        "type": "service",
        "title": "MEOK Prompt Guard (input sanitisation + injection scan)",
        "description": (
            "Sanitises inbound prompts: strips PII per gdpr proxy, scans for "
            "known prompt-injection patterns (Morris-II worm signatures, OWASP "
            "Agentic Top 10), and routes high-risk prompts to the BFT council."
        ),
        "status": "operational",
        "props": [
            {"name": "scan_coverage", "value": "OWASP Agentic Top 10 + Morris-II defensive"},
            {"name": "redaction_coverage", "value": "PII + secrets + injection patterns"},
        ],
        "responsible_roles": [{"role-id": "security-engineer", "party-uuids": [str(uuid.uuid4())]}],
        "controls": [
            {"id": "nist-800-53/SI-10", "description": "Information input validation — prompt sanitisation."},
            {"id": "owasp-agentic/llm01", "description": "Prompt injection defence (OWASP Agentic Top 10)."},
            {"id": "owasp-agentic/llm06", "description": "Excessive agency — rate-limited tool calls."},
            {"id": "iso-42001/A.8.5", "description": "AI impact assessment covers adversarial inputs."},
        ],
    },
    {
        "uuid": str(uuid.uuid4()),
        "type": "service",
        "title": "MEOK Output Watermark (machine-readable content marking)",
        "description": (
            "Marks every MEOK-produced output with an Article-50 compliant "
            "watermark + a verification URL. The watermark survives copy-paste, "
            "format conversion, and most transformations (proof-of-ai C2PA flow)."
        ),
        "status": "operational",
        "props": [
            {"name": "watermark_scheme", "value": "C2PA-compatible + Ed25519 signed manifest"},
        ],
        "responsible_roles": [{"role-id": "transparency-officer", "party-uuids": [str(uuid.uuid4())]}],
        "controls": [
            {"id": "eu-ai-act/art-50(2)", "description": "Generative content marking — machine-readable."},
            {"id": "eu-ai-act/art-50(3)", "description": "Deepfake marking — synthetic audio/image/video."},
            {"id": "nist-ai-rmf/GOVERN-1.1", "description": "Legal requirement understood."},
        ],
    },
    {
        "uuid": str(uuid.uuid4()),
        "type": "service",
        "title": "MEOK Evals (continuous accuracy/bias/robustness monitoring)",
        "description": (
            "Continuous evaluation harness for all MEOK subsystems. Tracks "
            "accuracy on golden sets, demographic parity, equalised-odds, and "
            "adversarial robustness probes. Alerts on >5% drift over 7 days."
        ),
        "status": "operational",
        "props": [
            {"name": "metrics", "value": "accuracy, demographic_parity, equalised_odds, adv_robustness"},
            {"name": "alert_threshold", "value": "5% drift over 7 days"},
        ],
        "responsible_roles": [{"role-id": "ml-evaluator", "party-uuids": [str(uuid.uuid4())]}],
        "controls": [
            {"id": "eu-ai-act/art-15", "description": "Accuracy, robustness, cybersecurity — documented evals."},
            {"id": "nist-ai-rmf/MEASURE-2.5", "description": "Trustworthy characteristics evaluated."},
            {"id": "nist-ai-rmf/MEASURE-3.1", "description": "Risk monitored continuously."},
            {"id": "nist-800-53/CA-7", "description": "Continuous monitoring."},
        ],
    },
    {
        "uuid": str(uuid.uuid4()),
        "type": "service",
        "title": "MEOK Incident Response (72-hour regulator notification)",
        "description": (
            "Incident response pipeline: SIGIL-fed alerting, automatic BFT "
            "deliberation on critical incidents, GDPR Art 33 72-hour notification "
            "path, EU AI Act post-market monitoring integration."
        ),
        "status": "operational",
        "props": [
            {"name": "notification_deadline_hours", "value": "72 (GDPR Art 33)"},
            {"name": "post_market_monitoring", "value": "EU AI Act Art 72"},
        ],
        "responsible_roles": [{"role-id": "ciso", "party-uuids": [str(uuid.uuid4())]}],
        "controls": [
            {"id": "gdpr/art-33", "description": "Breach notification to supervisory authority."},
            {"id": "gdpr/art-34", "description": "Communication of personal data breach to data subject."},
            {"id": "eu-ai-act/art-72", "description": "Post-market monitoring by providers."},
            {"id": "iso-42001/A.10.2", "description": "AI incident management."},
            {"id": "nist-800-53/IR-4", "description": "Incident handling."},
            {"id": "nist-800-53/IR-6", "description": "Incident reporting."},
        ],
    },
    {
        "uuid": str(uuid.uuid4()),
        "type": "service",
        "title": "MEOK FedRAMP-style Control Monitor (NIST 800-53)",
        "description": (
            "Continuous-monitor for the NIST 800-53 controls in this OSCAL doc. "
            "Produces weekly evidence packages; flags deviations for remediation."
        ),
        "status": "operational",
        "props": [
            {"name": "framework", "value": "NIST SP 800-53 rev5"},
            {"name": "cadence", "value": "weekly evidence + monthly report"},
        ],
        "responsible_roles": [{"role-id": "compliance-monitor", "party-uuids": [str(uuid.uuid4())]}],
        "controls": [
            {"id": "nist-800-53/CA-2", "description": "Control assessments."},
            {"id": "nist-800-53/CA-7", "description": "Continuous monitoring."},
            {"id": "nist-800-53/PM-6", "description": "Measures of performance."},
            {"id": "nist-800-53/PM-9", "description": "Risk management strategy."},
        ],
    },
    {
        "uuid": str(uuid.uuid4()),
        "type": "software",
        "title": "MEOK PQC Migration (Ed25519 → ML-DSA-65 + ML-KEM-768)",
        "description": (
            "Post-quantum migration path: NIST FIPS 203 (ML-KEM-768) for key "
            "encapsulation and FIPS 204 (ML-DSA-65) for signatures. Hybrid mode "
            "(Ed25519 + ML-DSA-65) is supported during the transition; the "
            "sovereign ledger will switch once the PQC suite is fully validated."
        ),
        "status": "in_development",
        "props": [
            {"name": "kem_algorithm", "value": "ML-KEM-768 (FIPS 203)"},
            {"name": "sig_algorithm", "value": "ML-DSA-65 (FIPS 204)"},
            {"name": "mode", "value": "hybrid (Ed25519 + ML-DSA-65) during transition"},
        ],
        "responsible_roles": [{"role-id": "cryptographer", "party-uuids": [str(uuid.uuid4())]}],
        "controls": [
            {"id": "nist-800-53/SC-13", "description": "Use of FIPS-validated crypto — PQC roadmap."},
            {"id": "eu-ai-act/art-15", "description": "Cybersecurity — PQC for long-lived signatures."},
        ],
    },
    {
        "uuid": str(uuid.uuid4()),
        "type": "service",
        "title": "MEOK Data Residency (per-region sovereign deployment)",
        "description": (
            "Sovereign deployment per region. UK / EU / US / AU / AS / SA "
            "regions each run their own instance on their own soil. No cross-"
            "border data movement without explicit DPO sign-off and SCC + TIA."
        ),
        "status": "operational",
        "props": [
            {"name": "regions", "value": "UK, EU, US, AU, AS, SA"},
            {"name": "transfer_basis", "value": "SCC + TIA per Art 44-49 GDPR"},
        ],
        "responsible_roles": [{"role-id": "dpo", "party-uuids": [str(uuid.uuid4())]}],
        "controls": [
            {"id": "gdpr/art-44", "description": "International transfers — lawful basis per region."},
            {"id": "gdpr/art-45", "description": "Adequacy decision."},
            {"id": "gdpr/art-46", "description": "SCC + TIA for non-adequate jurisdictions."},
            {"id": "gdpr/art-47", "description": "Binding corporate rules where applicable."},
            {"id": "iso-42001/A.7.4", "description": "Data management — regional isolation."},
        ],
    },
]

PARTIES = [
    {
        "uuid": str(uuid.uuid4()),
        "type": "organization",
        "name": "CSOAI Ltd (UK Companies House 16939677)",
        "short-name": "CSOAI",
        "email-addresses": ["nicholas@csoai.org", "security@csoai.org", "dpo@csoai.org"],
    }
]

ROLES = [
    {"id": "provider", "title": "Provider / Authorising Official"},
    {"id": "key-custodian", "title": "Key Custodian"},
    {"id": "auditor", "title": "Internal Auditor"},
    {"id": "council-operator", "title": "Council Operator"},
    {"id": "transparency-officer", "title": "Transparency Officer (Art 50)"},
    {"id": "authorising-official", "title": "Authorising Official"},
    {"id": "governance-lead", "title": "Governance Lead"},
    {"id": "ml-owner", "title": "ML Owner"},
    {"id": "ml-evaluator", "title": "ML Evaluator"},
    {"id": "security-engineer", "title": "Security Engineer"},
    {"id": "ciso", "title": "CISO"},
    {"id": "compliance-monitor", "title": "Compliance Monitor"},
    {"id": "cryptographer", "title": "Cryptographer"},
    {"id": "dpo", "title": "Data Protection Officer"},
]


# ---------------------------------------------------------------------------
# Build the OSCAL component-definition
# ---------------------------------------------------------------------------

def build_component_definition() -> dict:
    last_modified = datetime.now(timezone.utc).isoformat()
    components = []
    for c in COMPONENTS:
        components.append({
            "uuid": c["uuid"],
            "type": c["type"],
            "title": c["title"],
            "description": c["description"],
            "purpose": "Implements one or more AI governance controls per the OSCAL control-implementations block below.",
            "props": c.get("props", []),
            "status": {"state": c["status"]},
            "responsible-roles": c.get("responsible_roles", []),
            "control-implementations": [
                {
                    "uuid": str(uuid.uuid4()),
                    "source": DOC_PUBLISHER_URL + "/oscal#frameworks",
                    "description": (
                        "Implementation of the listed framework controls in the "
                        f"{c['title']} component. Each control-implementation is "
                        "verified by an OSCAL assessment + a weekly evidence "
                        "package produced by the MEOK FedRAMP-style Control "
                        "Monitor."
                    ),
                    "implemented-requirements": [
                        {
                            "uuid": str(uuid.uuid4()),
                            "control-id": ctrl["id"],
                            "description": ctrl["description"],
                        }
                        for ctrl in c["controls"]
                    ],
                }
            ],
        })

    return {
        "component-definition": {
            "uuid": COMPONENT_DEFINITION_UUID,
            "metadata": {
                "title": DOC_TITLE,
                "published": last_modified,
                "last-modified": last_modified,
                "version": DOC_VERSION,
                "oscal-version": OSCAL_VERSION,
                "csOAI_protocol_version": SOVEREIGN_PROTOCOL,
                "remarks": (
                    "Declared posture — SIGNED attestation, NOT certification. "
                    "The Ed25519 signature proves a declaration was made and binds "
                    "its exact content; it does NOT prove the declaration is true. "
                    "Buyer / regulator assessment remains required."
                ),
                "roles": ROLES,
                "parties": PARTIES,
                "responsible-parties": [
                    {"role-id": "provider", "party-uuids": [PARTIES[0]["uuid"]]},
                ],
                "props": [
                    {"name": "care_floor", "value": str(CARE_FLOOR)},
                    {"name": "honesty_register", "value": "attestation_not_certification"},
                    {"name": "issued_by", "value": DOC_PUBLISHER},
                    {"name": "verify_command", "value": "verify_command.py"},
                    {"name": "signing_library", "value": "cryptography (Python) · RFC 8032 · FIPS 186-5"},
                ],
            },
            "components": components,
            "back-matter": {
                "resources": [
                    {
                        "uuid": str(uuid.uuid4()),
                        "title": "MEOK System Card v1.4.0",
                        "rlinks": [{"href": DOC_PUBLISHER_URL + "/system-cards/meok.html"}],
                        "remarks": "Human-readable System Card (Markdown, Ed25519-signed).",
                    },
                    {
                        "uuid": str(uuid.uuid4()),
                        "title": "EU AI Act Compliance MCP",
                        "rlinks": [{"href": "https://github.com/CSOAI-ORG/eu-ai-act-compliance-mcp"}],
                    },
                    {
                        "uuid": str(uuid.uuid4()),
                        "title": "GDPR Compliance AI MCP",
                        "rlinks": [{"href": "https://github.com/CSOAI-ORG/gdpr-compliance-ai-mcp"}],
                    },
                    {
                        "uuid": str(uuid.uuid4()),
                        "title": "ISO 42001 AI MCP",
                        "rlinks": [{"href": "https://github.com/CSOAI-ORG/iso-42001-ai-mcp"}],
                    },
                    {
                        "uuid": str(uuid.uuid4()),
                        "title": "NIST AI RMF MCP",
                        "rlinks": [{"href": "https://github.com/CSOAI-ORG/nist-rmf-ai-mcp"}],
                    },
                    {
                        "uuid": str(uuid.uuid4()),
                        "title": "OSCAL Generator MCP",
                        "rlinks": [{"href": "https://github.com/CSOAI-ORG/oscal-generator-mcp"}],
                    },
                    {
                        "uuid": str(uuid.uuid4()),
                        "title": "defoneos-sign MCP (signed assurance)",
                        "rlinks": [{"href": "https://github.com/CSOAI-ORG/defoneos-sign-mcp"}],
                    },
                ],
            },
        }
    }


# ---------------------------------------------------------------------------
# Sign and emit the .json + .sig.json sidecar
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", "-o", default="MEOK_OSCAL_COMPONENT.json",
                        help="output OSCAL JSON path")
    parser.add_argument("--key", "-k", default=None,
                        help="optional Ed25519 private key (32-byte seed hex, PKCS8 PEM, or path)")
    args = parser.parse_args()

    oscal = build_component_definition()
    doc_canonical = canonical_json(oscal)
    doc_hash = __import__("hashlib").sha256(doc_canonical.encode("utf-8")).hexdigest()

    priv = load_or_create_key(args.key)
    envelope = sign_envelope(
        priv,
        action="oscal:component-definition:" + DOC_TITLE,
        detail={
            "kind": "oscal-component-definition",
            "subject": DOC_TITLE,
            "oscal_version": OSCAL_VERSION,
            "doc_version": DOC_VERSION,
            "component_count": len(oscal["component-definition"]["components"]),
            "doc_sha256": doc_hash,
            "doc_bytes": len(doc_canonical),
            "care_floor": CARE_FLOOR,
            "honesty_register": "signed attestation of declared posture — NOT certification",
        },
    )

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(oscal, indent=2), encoding="utf-8")

    sig_out = Path(str(out) + ".sig.json")
    sig_out.write_text(json.dumps(envelope, indent=2), encoding="utf-8")

    receipt = envelope["defoneos_signed_contact"]
    print(f"✓ wrote {out} ({out.stat().st_size} bytes) — {len(oscal['component-definition']['components'])} components")
    print(f"✓ wrote {sig_out} ({sig_out.stat().st_size} bytes)")
    print(f"  doc sha256 : {doc_hash[:16]}…")
    print(f"  fingerprint: {receipt['fingerprint']}")
    print(f"  signature  : {receipt['signature_ed25519'][:16]}… ({len(receipt['signature_ed25519']) // 2}-byte Ed25519)")
    print(f"\n  verify with: python3 ../verify-command/verify_command.py {sig_out}")


if __name__ == "__main__":
    main()