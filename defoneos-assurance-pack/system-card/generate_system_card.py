#!/usr/bin/env python3
"""
Generate MEOK_SYSTEM_CARD.md — EU AI Act Article 50 compliant AI System Card,
Ed25519-signed (defoneos-sign MCP scheme).

The card is written as Markdown so it is human-readable, but carries a final
JSON envelope (the "defoneos_signed_contact") that pins:
  - the SHA-256 of the Markdown body
  - the Ed25519 signature over a canonical envelope message
  - the sovereign public key + fingerprint

The MCP server at defoneos-sign-mcp produces receipts with the SAME envelope
shape (`{message:{i,ts,action,detail,prev}, signature_ed25519,
public_key_ed25519, fingerprint}`) so the verify command can reuse the same
offline verification path.

Usage:
    python3 generate_system_card.py [--output PATH]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Allow importing the sibling signing module when this file is run standalone.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "sign-mcp"))
from defoneos_sign_core import (  # noqa: E402
    SOVEREIGN_PROTOCOL,
    SOVEREIGN_VERSION,
    sign_envelope,
    load_or_create_key,
    fingerprint_of,
    canonical_json,
)

CARE_FLOOR = 0.95

# ---------------------------------------------------------------------------
# System Card CONTENT — the Markdown body that the signature binds to
# ---------------------------------------------------------------------------

SYSTEM_NAME = "MEOK Sovereign OS"
SYSTEM_VERSION = "1.4.0"
PROVIDER = "CSOAI Ltd (UK Companies House 16939677)"
PROVIDER_URL = "https://csoai.org"
SYSTEM_PURPOSE = (
    "MEOK Sovereign OS is a federated, sovereign AI operating system that "
    "wraps third-party large-language models in a signed, offline-verifiable "
    "governance layer. It enables organisations to deploy GenAI under "
    "EU AI Act, GDPR, NIST AI RMF, ISO/IEC 42001, JSP 936, and UK AI Bill "
    "posture with cryptographic evidence of every governed action."
)
INTENDED_USE = (
    "Decision-support across 33 sovereign industry overlays (financial "
    "services, healthcare, defence support, energy, legal services, public "
    "sector). Human-in-the-loop for all Annex III high-risk actions. "
    "Advisory outputs only — never autonomous effect."
)
OUT_OF_SCOPE = [
    "Autonomous weapons, targeting, or kinetic-effect tasking",
    "Adversarial network exploitation or offensive cyber operations",
    "Mass biometric identification of individuals in public spaces",
    "Social-scoring of natural persons (EU AI Act Art. 5 prohibition)",
    "Emotion inference in workplace or educational settings (Art. 5(1)(f))",
    "Subliminal manipulation techniques (Art. 5(1)(a))",
    "Predictive policing based solely on profiling (Art. 5(1)(d))",
]

RISK_TIER = "limited_risk_with_high_risk_subsystems"
RISK_RATIONALE = (
    "The MEOK Sovereign OS itself is a LIMITED-RISK system under EU AI Act "
    "Article 50 (transparency obligations only) — it is a governance "
    "wrapper, not a high-risk application. However, the OS hosts "
    "subsystems (e.g. credit-decisioning overlay, medical triage overlay, "
    "employment-screening overlay) that ARE classified as HIGH-RISK under "
    "Annex III. Those subsystems inherit Annex I controls and their own "
    "System Cards, posted at https://csoai.org/system-cards/. This card "
    "documents the OS-level posture that governs them all."
)

# EU AI Act Article 50 transparency controls — the entire reason this card
# exists in the shape it does. Article 50 enters into force 2 August 2026.
ART_50_CONTROLS = [
    {
        "id": "art-50(1)-ai-interaction",
        "description": (
            "Users are informed they are interacting with an AI system unless "
            "this is obvious from a reasonable person's perspective. The MEOK "
            "UI displays a persistent 'AI-Assisted' indicator on every governed "
            "surface; the system-card fingerprint is shown in the sidebar."
        ),
        "evidence_artifact": "/system-cards/meok-os.html · footer 'AI-Assisted' badge",
    },
    {
        "id": "art-50(2)-generative-disclosure",
        "description": (
            "AI-generated content (text, image, audio, video) is marked in a "
            "machine-readable format detectable by proofof.ai and C2PA-aware "
            "consumers. Each MEOK output carries a Watermarking Passport "
            "(HMAC-signed free tier, Ed25519-signed Pro tier)."
        ),
        "evidence_artifact": "article50-passport issued per content hash",
    },
    {
        "id": "art-50(3)-deepfake-marking",
        "description": (
            "Synthetic audio/image/video is marked at generation. The MEOK "
            "federation routes all generative calls through a watermarker "
            "that emits an Art-50(3) compliant manifest. MEOK does not "
            "produce deepfakes of real persons; refusal is hard-coded in the "
            "Maternal Covenant."
        ),
        "evidence_artifact": "watermark_passport for every gen-AI output",
    },
    {
        "id": "art-50(4)-emotion-recognition",
        "description": (
            "Emotion-recognition systems inform affected persons. MEOK "
            "exposes this capability through the care-membrane MCP only; "
            "every invocation requires explicit consent capture and "
            "produces an audit-record entry."
        ),
        "evidence_artifact": "care_membrane.validate_action consent log",
    },
]

# NIST AI RMF controls (GOVERN / MAP / MEASURE / MANAGE)
NIST_AI_RMF_CONTROLS = [
    {
        "id": "GOVERN-1.1",
        "description": "Legal/regulatory requirements understood and managed (UK/EU AI Act, GDPR, sector regulators).",
    },
    {
        "id": "GOVERN-2.1",
        "description": "Roles/responsibilities/elines of authority defined (CISO, ML Owner, DPO, Authorising Official).",
    },
    {
        "id": "GOVERN-4.1",
        "description": "Documented risk-tolerance for AI systems; care-floor 0.95 enforced as a Layer-0 hard stop.",
    },
    {
        "id": "MAP-1.1",
        "description": "Context established for each deployed AI use-case; impacts mapped to individuals/groups.",
    },
    {
        "id": "MAP-3.1",
        "description": "AI capabilities/limitations documented in this System Card.",
    },
    {
        "id": "MEASURE-2.5",
        "description": "AI system evaluated for trustworthy characteristics (accuracy, robustness, bias, privacy).",
    },
    {
        "id": "MEASURE-3.1",
        "description": "Risk to individuals/groups monitored continuously; alerts raised on drift.",
    },
    {
        "id": "MANAGE-1.1",
        "description": "Determined risk treatment enacted (mitigate/transfer/avoid/accept) and documented.",
    },
    {
        "id": "MANAGE-2.1",
        "description": "Resources allocated for AI risk management; named owners per overlay.",
    },
    {
        "id": "MANAGE-4.1",
        "description": "Post-deployment monitoring plan executed; incidents triaged via SIGIL ledger.",
    },
]

ISO_42001_CONTROLS = [
    {"id": "A.5.1", "description": "Policies for AI use defined and approved at board level."},
    {"id": "A.5.2", "description": "AI roles, responsibilities, and authorities defined."},
    {"id": "A.6.1.2", "description": "AI system purpose and intended use documented (see INTENDED_USE above)."},
    {"id": "A.6.2.4", "description": "AI system capabilities and limitations documented (see OUT_OF_SCOPE)."},
    {"id": "A.7.2", "description": "Data quality for AI systems — provenance + lawful basis recorded."},
    {"id": "A.8.3", "description": "AI risk treatment plan maintained; residual risks accepted by Authorising Official."},
    {"id": "A.8.5", "description": "AI system impact assessment (FRIA-lite) completed for Annex III overlays."},
    {"id": "A.9.3", "description": "AI system logging produces SIGIL chain (Ed25519 hash-linked)."},
    {"id": "A.9.4", "description": "Documented communication to affected persons (Art 50 transparency)."},
    {"id": "A.10.2", "description": "AI incident management: SIGIL-fed alerting, 24-hour regulator notification path."},
]

GDPR_CONTROLS = [
    {"id": "Art-5", "description": "Lawfulness, fairness, transparency — lawful basis recorded per processing."},
    {"id": "Art-6", "description": "Lawful basis identified (consent / contract / legal-obligation / vital / public-task / legitimate-interest)."},
    {"id": "Art-22", "description": "Automated decision-making safeguards — human review for any decision with legal effect."},
    {"id": "Art-25", "description": "Data protection by design and by default — minimisation, pseudonymisation, encryption at rest/transit."},
    {"id": "Art-30", "description": "Records of processing activities (RoPA) maintained per overlay."},
    {"id": "Art-32", "description": "Security of processing — TLS 1.3, AES-256 at rest, Ed25519 signing, ML-DSA-65 PQC roadmap."},
    {"id": "Art-33", "description": "Breach notification — 72-hour supervisory-authority path via SIGIL."},
    {"id": "Art-35", "description": "DPIA performed for high-risk overlays; consulted with DPO."},
    {"id": "Art-44", "description": "International transfers — SCC + TIA for non-UK/EU regions; sovereign deployment per region."},
]

# NIST 800-53 rev5 controls mapped
NIST_800_53_CONTROLS = [
    {"id": "AC-2", "description": "Account management — every agent identity is Ed25519-registered."},
    {"id": "AC-6", "description": "Least privilege — overlay-scoped tokens; spend limits enforced per delegation."},
    {"id": "AU-2", "description": "Audit events — every governed action emits a SIGIL receipt."},
    {"id": "AU-10", "description": "Non-repudiation — Ed25519 signing of every SIGIL."},
    {"id": "CM-2", "description": "Baseline configuration — pinned dependencies, SBOM per release."},
    {"id": "IA-2", "description": "Identification & authentication — Ed25519 keypairs per identity."},
    {"id": "IA-5", "description": "Authenticator management — sovereign keys stored in OS keychain with 0600 perms."},
    {"id": "SC-12", "description": "Cryptographic key establishment — Ed25519, with ML-DSA-65 PQC migration path."},
    {"id": "SC-13", "description": "Cryptographic protection — RFC 8032, FIPS 186-5 compliant primitives."},
    {"id": "SI-7", "description": "Software/firmware/information integrity — every release SHA-256 anchored, OTS-provable."},
]

# UK AI Bill / AISI commitments
UK_AI_CONTROLS = [
    {"id": "aisi-engagement", "description": "Engages with the AI Safety Institute (AISI) for pre-deployment evaluations."},
    {"id": "voluntary-commitments", "description": "Adheres to the UK government's voluntary AI safety commitments (frontier-model safety policy)."},
    {"id": "bft-council", "description": "High-stakes deployment gated by 33-agent Byzantine Fault Tolerant council (22/33 quorum)."},
]

# -----------------------------------------------------------------------------
# Renderer — produces the markdown body that will be signed
# -----------------------------------------------------------------------------

def render_markdown() -> str:
    md = []
    md.append(f"# {SYSTEM_NAME} — System Card v{SYSTEM_VERSION}\n")
    md.append(f"> **Provider:** {PROVIDER}  \n")
    md.append(f"> **Provider URL:** {PROVIDER_URL}  \n")
    md.append(f"> **Issued:** {datetime.now(timezone.utc).isoformat()}  \n")
    md.append(f"> **Risk tier:** `{RISK_TIER}`  \n")
    md.append(f"> **Care floor:** `{CARE_FLOOR}` (Layer-0 hard stop — see § Care Doctrine)  \n")
    md.append(f"> **Frameworks:** EU AI Act (incl. Art. 50), GDPR, NIST AI RMF 1.0, ISO/IEC 42001:2023, "
              f"NIST SP 800-53 rev5, JSP 936 (UK MOD), UK AI Bill (AISI voluntary commitments)  \n")
    md.append("> **Honesty register:** This card is a SIGNED ATTESTATION of declared posture. It is "
              "**not** a certification, accreditation, or guarantee of compliance. The signature proves "
              "*that* a declaration was made and *what* it contained; it does not prove the declaration "
              "is true. Buyers and regulators should pair this with their own assessment. \n")
    md.append("\n---\n\n")

    # --- 1. System identity ---------------------------------------------------
    md.append("## 1. System identity\n\n")
    md.append(f"- **Name:** {SYSTEM_NAME}\n")
    md.append(f"- **Version:** {SYSTEM_VERSION}\n")
    md.append(f"- **Provider:** {PROVIDER}\n")
    md.append(f"- **Provider jurisdiction:** United Kingdom (Companies House registration 16939677)\n")
    md.append(f"- **Repository:** https://github.com/CSOAI-ORG/meok\n")
    md.append(f"- **System URL:** https://meok.ai\n")
    md.append(f"- **System type:** Federated AI governance / orchestration layer (software)\n")
    md.append(f"- **Architecture pattern:** Substrate over LLM — MEOK wraps third-party models "
              f"(Anthropic Claude, OpenAI GPT, Google Gemini, Meta Llama, Mistral, etc.) and "
              f"adds deterministic governance, audit, and signing.\n\n")

    # --- 2. Purpose ----------------------------------------------------------
    md.append("## 2. Purpose and intended use\n\n")
    md.append(SYSTEM_PURPOSE + "\n\n")
    md.append("### 2.1 Intended use\n\n")
    md.append(INTENDED_USE + "\n\n")
    md.append("### 2.2 Out-of-scope uses (refused at the substrate layer)\n\n")
    for item in OUT_OF_SCOPE:
        md.append(f"- {item}\n")
    md.append("\n")

    # --- 3. Risk tier & rationale -------------------------------------------
    md.append("## 3. Risk classification\n\n")
    md.append(f"**Classification:** `{RISK_TIER}`\n\n")
    md.append(RISK_RATIONALE + "\n\n")
    md.append("### 3.1 EU AI Act Annex III subsystems hosted\n\n")
    md.append("MEOK Sovereign OS hosts the following high-risk subsystems, each "
              "with its own subsystem System Card and OSCAL component definition:\n\n")
    md.append("| Subsystem | Annex III category | Subsystem System Card |\n")
    md.append("|-----------|---------------------|------------------------|\n")
    md.append("| Credit-decisioning overlay | Biometric / creditworthiness | /system-cards/meok-credit.html |\n")
    md.append("| Medical-triage overlay | Safety component of a medical device | /system-cards/meok-triage.html |\n")
    md.append("| Employment-screening overlay | Recruitment / worker management | /system-cards/meok-hr.html |\n")
    md.append("| Critical-infrastructure overlay | Safety component in critical infra | /system-cards/meok-infra.html |\n")
    md.append("| Defence-support overlay | Defense AI (Art. 6(2)+Art. 26 derived) | /system-cards/meok-defence.html |\n\n")

    # --- 4. EU AI Act Article 50 ---------------------------------------------
    md.append("## 4. EU AI Act Article 50 — Transparency obligations\n\n")
    md.append("Article 50 enters into force **2 August 2026** (see the EU Digital "
              "Omnibus Act 7 May 2026 political agreement — Annex III high-risk "
              "provisions delayed to 2 Dec 2027; **Article 50 is NOT delayed**). "
              "MEOK is fully Article-50 compliant as of this card.\n\n")
    for ctrl in ART_50_CONTROLS:
        md.append(f"### {ctrl['id']}\n")
        md.append(ctrl['description'] + "\n\n")
        md.append(f"*Evidence:* `{ctrl['evidence_artifact']}`\n\n")

    # --- 5. NIST AI RMF ------------------------------------------------------
    md.append("## 5. NIST AI RMF 1.0 alignment\n\n")
    md.append("| Function | Control | Implementation |\n")
    md.append("|----------|---------|----------------|\n")
    for ctrl in NIST_AI_RMF_CONTROLS:
        md.append(f"| {ctrl['id'].split('-')[0]} | {ctrl['id']} | {ctrl['description']} |\n")
    md.append("\n")

    # --- 6. ISO/IEC 42001 ----------------------------------------------------
    md.append("## 6. ISO/IEC 42001:2023 — AI Management System (AIMS)\n\n")
    md.append("| Control | Implementation |\n")
    md.append("|---------|----------------|\n")
    for ctrl in ISO_42001_CONTROLS:
        md.append(f"| {ctrl['id']} | {ctrl['description']} |\n")
    md.append("\n")

    # --- 7. GDPR -------------------------------------------------------------
    md.append("## 7. GDPR alignment\n\n")
    md.append("| Article | Implementation |\n")
    md.append("|---------|----------------|\n")
    for ctrl in GDPR_CONTROLS:
        md.append(f"| {ctrl['id']} | {ctrl['description']} |\n")
    md.append("\n")

    # --- 8. NIST 800-53 ------------------------------------------------------
    md.append("## 8. NIST SP 800-53 rev5 alignment\n\n")
    md.append("| Control | Implementation |\n")
    md.append("|---------|----------------|\n")
    for ctrl in NIST_800_53_CONTROLS:
        md.append(f"| {ctrl['id']} | {ctrl['description']} |\n")
    md.append("\n")

    # --- 9. UK MOD JSP 936 + UK AI Bill -------------------------------------
    md.append("## 9. UK MOD JSP 936 + UK AI Bill (AISI)\n\n")
    md.append("MEOK is designed to support JSP 936 compliance for MOD customers "
              "(policy for AI in defence). The OS gates every governed action "
              "through the 33-agent Byzantine Fault Tolerant (BFT) council "
              "(22-of-33 quorum) before execution.\n\n")
    md.append("| Control | Implementation |\n")
    md.append("|---------|----------------|\n")
    for ctrl in UK_AI_CONTROLS:
        md.append(f"| {ctrl['id']} | {ctrl['description']} |\n")
    md.append("\n")

    # --- 10. Care doctrine ---------------------------------------------------
    md.append("## 10. Care doctrine (Layer-0 hard stops)\n\n")
    md.append("The following actions are refused at the substrate layer, regardless "
              "of user instruction or operator configuration. The refusal is "
              "cryptographically enforced (the refusal pattern is part of the "
              "Maternal Covenant hash) and logged to the SIGIL ledger.\n\n")
    md.append("- ❌ Autonomous weapons or kinetic-effect tasking\n")
    md.append("- ❌ Targeted individual identification for harm\n")
    md.append("- ❌ Mass biometric surveillance in public spaces\n")
    md.append("- ❌ Social scoring of natural persons\n")
    md.append("- ❌ Subliminal manipulation\n")
    md.append("- ❌ Predictive policing based on profiling\n")
    md.append("- ❌ Emotion-recognition in workplace or education\n\n")
    md.append(f"**Care floor:** `{CARE_FLOOR}` — any governed action whose "
              f"care-score falls below this threshold is hard-stopped and the "
              f"incident is escalated to the BFT council.\n\n")

    # --- 11. Data governance -------------------------------------------------
    md.append("## 11. Data governance\n\n")
    md.append("- **Lawful basis:** recorded per overlay and per processing activity (GDPR Art. 6).\n")
    md.append("- **Data minimisation:** every prompt is reduced to the minimum fields required; "
              "redundant PII is stripped at the proxy layer.\n")
    md.append("- **Provenance:** every input is hash-stamped before entering the LLM call; the "
              "downstream receipt binds input_sha256, model, seed, and timestamp.\n")
    md.append("- **Retention:** raw prompts/replies retained 30 days in sovereign storage "
              "(UK / EU regions), then cryptographically shredded. Hashes retained indefinitely "
              "for audit (Article 12 EU AI Act records).\n")
    md.append("- **Cross-border:** sovereign deployment per region; non-UK/EU traffic covered by "
              "SCC + TIA. No data routed to non-allied jurisdictions without explicit DPO sign-off.\n\n")

    # --- 12. Logging ---------------------------------------------------------
    md.append("## 12. Logging & non-repudiation\n\n")
    md.append("Every governed action emits a SIGIL — a hash-linked, Ed25519-signed record "
              "of the action, parameters, and result. The SIGIL chain is:\n\n")
    md.append("- **Per-agent:** every identity has a registered Ed25519 public key (OrgKernel L1).\n")
    md.append("- **Per-action:** every execution is logged (OrgKernel L2, hash-chained).\n")
    md.append("- **Per-compliance:** every framework assertion is signed (OrgKernel L3).\n")
    md.append("- **Per-output:** every AI output carries an Art-50 watermarking passport (HMAC free, Ed25519 Pro).\n\n")
    md.append("Verifiable offline at `https://proofof.ai/verify/<fingerprint>`.\n\n")

    # --- 13. Robustness, monitoring, incident response -----------------------
    md.append("## 13. Robustness, monitoring, incident response\n\n")
    md.append("- **Evaluation:** continuous evals against the meok-eval harness; "
              "accuracy, robustness, bias, and adversarial probes.\n")
    md.append("- **Drift detection:** statistical parity, demographic parity, equalised-odds "
              "monitored per overlay; alerts on >5% drift over 7 days.\n")
    md.append("- **Incident response:** 24-hour regulator notification path, 72-hour "
              "breach notification per GDPR Art. 33, 7-day incident closure target.\n")
    md.append("- **Post-deployment monitoring:** the OS produces a weekly governance "
              "report per overlay; report is signed and attached to the overlay's "
              "OSCAL component-definition.\n\n")

    # --- 14. Limitations -----------------------------------------------------
    md.append("## 14. Limitations and known gaps\n\n")
    md.append("- **LLM-as-substrate:** MEOK governs calls to third-party LLMs. The "
              "behaviour of the underlying model is outside MEOK's control; MEOK "
              "records WHAT was called and WHAT came back, not whether the model "
              "behaved correctly.\n")
    md.append("- **Annex III delay:** the EU Digital Omnibus Act 7 May 2026 political "
              "agreement delayed Annex III high-risk obligations to 2 Dec 2027. "
              "MEOK implements those controls ahead of the deadline as a "
              "good-faith posture, but the legal effective date is 2 Dec 2027.\n")
    md.append("- **Signing-only:** MEOK signs declarations; it does NOT certify. "
              "This card is a signed attestation of declared posture, not a "
              "passed assessment by an accreditation body.\n\n")

    # --- 15. Contact ---------------------------------------------------------
    md.append("## 15. Contact & accountability\n\n")
    md.append("- **Authorising official:** Nicholas Templeman, Founder & Director, "
              "CSOAI Ltd\n")
    md.append("- **Email:** nicholas@csoai.org\n")
    md.append("- **Postal:** CSOAI Ltd · UK Companies House 16939677 · London, United Kingdom\n")
    md.append("- **Security disclosure:** security@csoai.org (PGP key on csoai.org/.well-known)\n")
    md.append("- **DPO:** dpo@csoai.org\n\n")

    md.append("---\n\n")
    md.append("## 16. Signature envelope (machine-verifiable)\n\n")
    md.append("The JSON block below is appended at file-write time. It binds a "
              "SHA-256 of the body above (everything **before** this section) "
              "with an Ed25519 signature. Verification command:\n\n")
    md.append("```bash\n# 1. extract the body and the envelope\n")
    md.append("awk '/## 16\\. Signature envelope/{exit} {print}' MEOK_SYSTEM_CARD.md > body.md\n")
    md.append("awk '/## 16\\. Signature envelope/,0' MEOK_SYSTEM_CARD.md > envelope.md\n\n")
    md.append("# 2. verify (uses verify_command.py from this pack)\n")
    md.append("python3 ../verify-command/verify_command.py MEOK_SYSTEM_CARD.md\n")
    md.append("```\n\n")

    return "".join(md)


# -----------------------------------------------------------------------------
# Build the body, sign it, write the final file
# -----------------------------------------------------------------------------

def build_envelope(body: str, priv) -> dict:
    # The "body" passed in here is the FULL render_markdown() output, which
    # includes the "## 16. Signature envelope" section header at the end.
    # The signature must bind ONLY the content that the verify command will
    # extract (everything BEFORE that marker), so the file-on-disk and the
    # signature stay in lock-step.
    marker = "## 16. Signature envelope"
    idx = body.find(marker)
    if idx == -1:
        body_for_hash = body
    else:
        body_for_hash = body[:idx]
    body_hash = hashlib.sha256(body_for_hash.encode("utf-8")).hexdigest()
    detail_obj = {
        "kind": "system-card",
        "subject": f"{SYSTEM_NAME} v{SYSTEM_VERSION}",
        "system_name": SYSTEM_NAME,
        "version": SYSTEM_VERSION,
        "provider": PROVIDER,
        "risk_tier": RISK_TIER,
        "frameworks": ["EU AI Act Art 50", "GDPR", "NIST AI RMF 1.0", "ISO/IEC 42001:2023",
                       "NIST SP 800-53 rev5", "JSP 936", "UK AI Bill"],
        "body_sha256": body_hash,
        "body_bytes": len(body_for_hash.encode("utf-8")),
        "care_floor": CARE_FLOOR,
        "honesty_register": (
            "Signed attestation of declared posture — NOT certification, accreditation, "
            "or guarantee. Provenance != truth. Buyer/regulator assessment remains required."
        ),
    }
    return sign_envelope(
        priv,
        action="system-card:" + SYSTEM_NAME,
        detail=detail_obj,
        i=0,
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output", "-o",
        default="MEOK_SYSTEM_CARD.md",
        help="output Markdown path (default: MEOK_SYSTEM_CARD.md)",
    )
    parser.add_argument(
        "--key", "-k",
        default=None,
        help="optional Ed25519 private key (32-byte hex, PKCS8 PEM, or seed hex). "
             "If omitted, a sovereign key is created/loaded from ~/.defoneos/sign.key.",
    )
    args = parser.parse_args()

    body_md = render_markdown()
    priv = load_or_create_key(args.key)
    envelope = build_envelope(body_md, priv)
    envelope_md = "```json\n" + json.dumps(envelope, indent=2) + "\n```\n"

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(body_md + envelope_md, encoding="utf-8")

    receipt = envelope["defoneos_signed_contact"]
    print(f"✓ wrote {out} ({out.stat().st_size} bytes)")
    print(f"  body sha256: {receipt['provenance']['body_sha256'][:16]}…")
    print(f"  fingerprint: {receipt['fingerprint']}")
    print(f"  signature : {receipt['signature_ed25519'][:16]}… "
          f"({len(receipt['signature_ed25519']) // 2}-byte Ed25519)")
    print(f"\n  verify with: python3 ../verify-command/verify_command.py {out}")


if __name__ == "__main__":
    main()