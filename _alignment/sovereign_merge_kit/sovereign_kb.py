#!/usr/bin/env python3
"""sovereign_kb.py — the Sovereign's shared, accurate governance knowledge base (RAG grounding source).
Facts come from HERE, not from the small model's weights. Every entry is a real, verifiable regulatory/standards
fact with a source tag. Keep it accurate — this is the honesty backbone of every grounded answer.
Imported by sovereign_pipeline.py and sov33_governed_rag_poc.py.
"""

KB = [
    # ---- EU AI Act ----
    ("EU AI Act Art.50", "Providers of AI that generate synthetic audio, image, video or text must mark outputs as artificially generated in a machine-readable, detectable way, and deployers must disclose when people interact with an AI system or see AI-generated content."),
    ("EU AI Act Art.5", "The EU AI Act prohibits certain practices outright: manipulative or deceptive subliminal techniques, exploiting vulnerabilities, social scoring by public authorities, and (with narrow exceptions) real-time remote biometric identification in public spaces for law enforcement."),
    ("EU AI Act Annex III", "High-risk AI categories include biometrics, critical infrastructure, education, employment and worker management, access to essential private and public services, law enforcement, migration/border control, and administration of justice."),
    ("EU AI Act Art.9", "High-risk AI systems must have a continuous risk-management system across the lifecycle: identify and evaluate foreseeable risks, adopt mitigation measures, and test to ensure consistent performance."),
    ("EU AI Act Art.10", "High-risk AI must use data governance practices: training, validation and test datasets must be relevant, representative, and to the extent possible free of errors and bias, with examination for biases."),
    ("EU AI Act GPAI", "Providers of general-purpose AI models must keep technical documentation, provide information to downstream providers, put a copyright policy in place, and publish a sufficiently detailed summary of training data; GPAI models with systemic risk face extra evaluation, adversarial testing, and incident-reporting duties."),
    ("EU AI Act timeline", "The EU AI Act entered into force on 1 August 2024. Prohibited-practice rules apply from 2 February 2025, general-purpose AI model obligations from 2 August 2025, and most high-risk obligations from 2 August 2026, with certain high-risk cases extending to 2027."),
    # ---- GDPR ----
    ("GDPR Art.9", "Biometric data processed to uniquely identify a natural person is a special category of personal data; processing is prohibited unless a specific lawful exception applies, such as the data subject's explicit consent."),
    ("GDPR Art.22", "A data subject has the right not to be subject to a decision based solely on automated processing, including profiling, that produces legal or similarly significant effects, subject to defined exceptions with safeguards."),
    ("GDPR Art.35", "A Data Protection Impact Assessment (DPIA) is required before processing that is likely to result in a high risk to individuals' rights and freedoms, such as large-scale profiling or systematic monitoring."),
    # ---- Financial / cyber ----
    ("DORA Reg.2022/2554", "The Digital Operational Resilience Act requires EU financial entities to maintain an ICT risk-management framework, report major ICT-related incidents to authorities, carry out digital operational resilience testing (including threat-led penetration testing), and manage ICT third-party risk."),
    ("NIS2 Directive", "NIS2 requires 'essential' and 'important' entities to take cybersecurity risk-management measures and report significant incidents; it expands sector coverage and makes senior management accountable for compliance."),
    # ---- AI management / risk standards ----
    ("ISO/IEC 42001", "ISO/IEC 42001 is the first AI management system standard: it requires an organisation to establish an AI Management System (AIMS) with policy, risk assessment, defined controls, and continual improvement across the AI lifecycle."),
    ("ISO/IEC 23894", "ISO/IEC 23894 gives guidance on AI risk management, mapping AI-specific risks onto the ISO 31000 risk-management process."),
    ("NIST AI RMF", "The NIST AI Risk Management Framework is a voluntary framework organised around four functions — Govern, Map, Measure, Manage — to help organisations manage risks of AI systems throughout their lifecycle."),
    # ---- Signing / assurance ----
    ("OpenSSF OMS v1.0", "OpenSSF Model Signing (launched April 2025 with Google, NVIDIA and HiddenLayer) recommends signing a model when it is trained and verifying it every time it is used, recording signing events in a tamperproof transparency log for a complete audit trail."),
    ("Sigstore", "Sigstore provides keyless signing: a short-lived certificate is bound to an OIDC identity, and the signing event is recorded in the Rekor transparency log, so the signature remains verifiable after the certificate expires."),
    ("Ed25519", "Ed25519 is a fast, high-security elliptic-curve digital signature scheme; a signature proves the holder of the private key produced it, giving authenticity, and any change to the signed content invalidates it, giving tamper-evidence."),
    ("OSCAL", "OSCAL (Open Security Controls Assessment Language) is a NIST machine-readable format for expressing security and privacy controls, control implementations, and assessment results, enabling automated, interoperable compliance documentation."),
    # ---- Defence assurance ----
    ("JSP 936", "Under UK MoD policy (JSP 936, Dependable AI in Defence), externally-acquired AI must attract the same level of assurance confidence as AI developed within or for the MOD; teams may have to stand up additional assurance capabilities to address evidence shortfalls."),
]

def kb():
    return list(KB)

if __name__ == "__main__":
    print(f"Sovereign KB: {len(KB)} grounded governance facts")
    for s, _ in KB: print(" -", s)
