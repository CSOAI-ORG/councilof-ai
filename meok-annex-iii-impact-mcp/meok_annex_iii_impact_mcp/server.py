"""meok-annex-iii-impact-mcp server.

EU AI Act Annex III risk classification + impact assessment engine.

Tools:
    classify_system              — Annex III category with confidence
    generate_fria               — Article 27 Fundamental Rights Impact Assessment (Markdown)
    check_article_compliance    — Article 9/10/13/14/15/27 PASS/FAIL/REVIEW
    generate_annex_iv_documentation — Annex IV technical documentation (JSON)

Key differentiator: 100% offline, deterministic, reproducible classification
via keyword weighting. The same input always produces the same output, so the
classification is legally defensible — the auditor can re-run and obtain the
identical answer.
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Tuple

# cryptography is the only required runtime dependency
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

__all__ = [
    "classify_system",
    "generate_fria",
    "check_article_compliance",
    "generate_annex_iv_documentation",
    "ANNEX_III_CATEGORIES",
    "main",
]


# ---------------------------------------------------------------------------
# Ed25519 attestation key.
# In production this would come from a KMS / HSM; for the offline deterministic
# engine we use a hardcoded demo key with an explicit comment so the auditor
# can verify the signature path end-to-end.
# ---------------------------------------------------------------------------
# DEMO KEY — KMS managed in production. Hardcoded here so the engine is fully
# offline, hermetic, and reproducible across machines.
_DEMO_ED25519_PRIVATE_KEY = Ed25519PrivateKey.from_private_bytes(
    bytes.fromhex(
        "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60"
        "1d6e4a8b5b1d4a4b5d2e3f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b"
    )[:32]
)
_DEMO_ED25519_PUBLIC_KEY = _DEMO_ED25519_PRIVATE_KEY.public_key()


# ---------------------------------------------------------------------------
# Annex III categories.
# Each category: id, name, applicable_articles, key_obligations,
# keywords_for_classification, risk_factors.
# ---------------------------------------------------------------------------
ANNEX_III_CATEGORIES: Dict[str, Dict[str, Any]] = {
    "biometric_identification": {
        "id": "biometric_identification",
        "name": "Biometric identification",
        "description": (
            "AI systems used for real-time or post biometric identification of "
            "natural persons, including facial recognition, gait, voice, or "
            "fingerprint identification in public or private spaces."
        ),
        "applicable_articles": [9, 10, 13, 14, 15, 26, 27],
        "key_obligations": [
            "Risk management system (Art. 9)",
            "Data governance and training data quality (Art. 10)",
            "Transparency and instructions for use (Art. 13)",
            "Human oversight measures (Art. 14)",
            "Accuracy, robustness, cybersecurity (Art. 15)",
            "Fundamental rights impact assessment for public bodies (Art. 27)",
        ],
        "keywords_for_classification": [
            "face recognition", "facial recognition", "fingerprint", "iris scan",
            "biometric", "biometrics", "gait recognition", "voice print",
            "voiceprint", "remote biometric", "real-time biometric",
            "afis", "facial image", "biometric identification", "face match",
            "skin texture", "dna profile",
        ],
        "risk_factors": [
            "real-time", "remote", "public space", "mass surveillance",
            "law enforcement use", "minor", "vulnerable group",
        ],
    },
    "critical_infrastructure": {
        "id": "critical_infrastructure",
        "name": "Critical infrastructure",
        "description": (
            "AI systems used as safety components in the management and "
            "operation of critical infrastructure (water, gas, heating, "
            "electricity, traffic) where failure could endanger life."
        ),
        "applicable_articles": [9, 10, 13, 14, 15, 27],
        "key_obligations": [
            "Risk management system (Art. 9)",
            "Data and data governance (Art. 10)",
            "Transparency and instructions for use (Art. 13)",
            "Human oversight (Art. 14)",
            "Accuracy, robustness, cybersecurity (Art. 15)",
        ],
        "keywords_for_classification": [
            "water supply", "water treatment", "gas pipeline", "gas network",
            "heating network", "electricity grid", "power grid", "power network",
            "traffic control", "traffic light", "traffic management", "smart grid",
            "smart meter", "critical infrastructure", "distribution network",
            "load balancing", "outage", "scada", "transmission line",
            "transformer", "substation", "district heating",
        ],
        "risk_factors": [
            "safety component", "safety-critical", "endanger life", "public utility",
            "large population", "cascade failure",
        ],
    },
    "education_and_vocational_training": {
        "id": "education_and_vocational_training",
        "name": "Education and vocational training",
        "description": (
            "AI systems used to determine admission, evaluate learning outcomes, "
            "detect cheating during tests, or otherwise materially influence a "
            "person's path in education or vocational training."
        ),
        "applicable_articles": [9, 10, 13, 14, 15, 27],
        "key_obligations": [
            "Risk management system (Art. 9)",
            "Data governance (Art. 10)",
            "Transparency (Art. 13)",
            "Human oversight (Art. 14)",
            "Accuracy, robustness, cybersecurity (Art. 15)",
        ],
        "keywords_for_classification": [
            "student", "pupil", "admission", "admissions", "enrollment", "enrolment",
            "school", "university", "college", "exam", "examination", "test",
            "grading", "grade", "assessment", "proctoring", "proctor", "cheating",
            "plagiarism", "e-learning", "mooc", "learning outcome", "degree",
            "diploma", "scholarship", "vocational training", "apprenticeship",
            "course allocation", "educational",
        ],
        "risk_factors": [
            "minor", "child", "young person", "sole determinant",
            "automated decision", "high-stakes",
        ],
    },
    "employment_workers_management": {
        "id": "employment_workers_management",
        "name": "Employment and workers management",
        "description": (
            "AI systems used for recruitment, selection, task allocation, "
            "performance monitoring, promotion, termination, or any other "
            "decision affecting terms of work."
        ),
        "applicable_articles": [9, 10, 13, 14, 15, 27],
        "key_obligations": [
            "Risk management system (Art. 9)",
            "Data governance (Art. 10)",
            "Transparency to workers (Art. 13)",
            "Human oversight (Art. 14)",
            "Accuracy, robustness, cybersecurity (Art. 15)",
        ],
        "keywords_for_classification": [
            "recruitment", "recruiting", "hiring", "job applicant", "job candidate",
            "cv screening", "resume screening", "resume parser", "applicant tracking",
            "ats", "interview", "interview scoring", "pre-employment", "talent acquisition",
            "employee", "worker", "staff", "promotion", "demotion", "termination",
            "firing", "redundancy", "performance review", "performance monitoring",
            "task allocation", "shift scheduling", "roster", "workforce",
            "workplace surveillance", "productivity monitoring", "gig worker",
            "freelancer matching",
        ],
        "risk_factors": [
            "automated rejection", "sole determinant", "mass screening",
            "vulnerable group", "unionized", "minor", "young worker",
        ],
    },
    "access_to_essential_services": {
        "id": "access_to_essential_services",
        "name": "Access to and enjoyment of essential private services and public services and benefits",
        "description": (
            "AI systems used to evaluate eligibility for, grant/deny, or set "
            "the price of essential public or private services — credit, "
            "insurance, emergency response, public benefits, healthcare triage."
        ),
        "applicable_articles": [9, 10, 13, 14, 15, 27],
        "key_obligations": [
            "Risk management system (Art. 9)",
            "Data governance (Art. 10)",
            "Transparency (Art. 13)",
            "Human oversight (Art. 14)",
            "Accuracy, robustness, cybersecurity (Art. 15)",
        ],
        "keywords_for_classification": [
            "credit scoring", "credit score", "creditworthiness", "loan approval",
            "loan eligibility", "mortgage", "risk score", "credit risk",
            "insurance pricing", "insurance underwriting", "insurance premium",
            "insurance claim", "fraud detection", "emergency dispatch", "112",
            "999", "911", "emergency services", "first responder", "triage",
            "public benefit", "welfare", "social security", "social assistance",
            "unemployment benefit", "housing allocation", "public housing",
            "government service", "public service", "visa-free travel", "visa",
            "essential service", "bank account", "banking access", "utility service",
            "healthcare", "medical triage",
        ],
        "risk_factors": [
            "denial of service", "sole determinant", "vulnerable group",
            "low income", "large population",
        ],
    },
    "law_enforcement": {
        "id": "law_enforcement",
        "name": "Law enforcement",
        "description": (
            "AI systems used by law enforcement authorities (or on their "
            "behalf) for individual risk assessment, polygraph/lie detection, "
            "evaluation of evidence reliability, profiling, or recidivism."
        ),
        "applicable_articles": [9, 10, 13, 14, 15, 26, 27],
        "key_obligations": [
            "Risk management system (Art. 9)",
            "Data governance (Art. 10)",
            "Transparency (Art. 13)",
            "Human oversight (Art. 14)",
            "Accuracy, robustness, cybersecurity (Art. 15)",
            "Strict scope limitations (Art. 5 / Art. 26)",
        ],
        "keywords_for_classification": [
            "police", "law enforcement", "criminal", "offender", "suspect",
            "witness", "polygraph", "lie detector", "deception", "interrogation",
            "recidivism", "reoffending", "risk assessment offender",
            "predictive policing", "crime prediction", "hotspot", "crime mapping",
            "evidence evaluation", "evidence reliability", "forensic",
            "investigation", "fraud investigation", "border guard (LE)",
            "surveillance (LE)", "covert", "informant", "informant scoring",
            "deepfake detection (LE)", "child sexual abuse", "csam",
            "criminal justice", "prosecution",
        ],
        "risk_factors": [
            "arrest", "detention", "sentencing", "pre-trial", "minor", "minority",
            "vulnerable group", "solely automated", "individual assessment",
        ],
    },
    "migration_asylum_border_control": {
        "id": "migration_asylum_border_control",
        "name": "Migration, asylum and border control management",
        "description": (
            "AI systems used by competent authorities for assessing "
            "applications for visa, asylum, residence permits, border control, "
            "or detection/identification of persons."
        ),
        "applicable_articles": [9, 10, 13, 14, 15, 27],
        "key_obligations": [
            "Risk management system (Art. 9)",
            "Data governance (Art. 10)",
            "Transparency (Art. 13)",
            "Human oversight (Art. 14)",
            "Accuracy, robustness, cybersecurity (Art. 15)",
        ],
        "keywords_for_classification": [
            "visa", "asylum", "asylum seeker", "refugee", "residence permit",
            "border", "border control", "border crossing", "schengen",
            "migration", "migrant", "deportation", "removal", "return decision",
            "fraud detection (migration)", "document verification (border)",
            "biometric (border)", "passport control", "entry/exit system",
            "ees", "eurodac", "dublin regulation", "travel authorization",
            "etiias", "carrying out checks", "irregular migration",
        ],
        "risk_factors": [
            "minor", "unaccompanied minor", "vulnerable group", "asylum seeker",
            "automated refusal", "family separation",
        ],
    },
    "justice_democratic_processes": {
        "id": "justice_democratic_processes",
        "name": "Administration of justice and democratic processes",
        "description": (
            "AI systems used by judicial authorities to research/interpret "
            "facts and law, apply the law to a set of facts, or to influence "
            "the outcome of an election/referendum or voting behaviour."
        ),
        "applicable_articles": [9, 10, 13, 14, 15, 27],
        "key_obligations": [
            "Risk management system (Art. 9)",
            "Data governance (Art. 10)",
            "Transparency (Art. 13)",
            "Human oversight (Art. 14)",
            "Accuracy, robustness, cybersecurity (Art. 15)",
        ],
        "keywords_for_classification": [
            "court", "judge", "judicial", "sentencing", "sentence",
            "ruling", "verdict", "case outcome", "legal decision", "dispute resolution",
            "arbitration", "mediation", "alternative dispute resolution",
            "election", "electoral", "voting", "referendum", "ballot",
            "campaign", "voter targeting", "microtargeting", "political advertising",
            "political opinion", "public opinion", "deepfake election",
            "social media political", "democratic process", "public consultation",
            "citizen scoring", "social credit", "behavioural scoring",
        ],
        "risk_factors": [
            "binding decision", "no human review", "minor", "public authority",
            "mass profiling",
        ],
    },
}

# Article 9 evidence requirements — used by check_article_compliance.
ARTICLE_EVIDENCE_REQUIREMENTS: Dict[int, List[str]] = {
    9: [
        "Documented risk management process across the entire lifecycle",
        "Risk identification and analysis records",
        "Risk estimation and evaluation methodology",
        "Risk treatment measures and residual risk acceptance",
        "Periodic review and update of the risk management system",
    ],
    10: [
        "Training, validation and testing data governance framework",
        "Data quality and relevance criteria",
        "Bias examination and mitigation procedures",
        "Data provenance and lineage records",
    ],
    13: [
        "Instructions for use describing system characteristics and capabilities",
        "Information on foreseeable misuse",
        "Information on the human oversight measures",
        "Disclosure of the system's status as an AI system to natural persons",
    ],
    14: [
        "Human oversight measures designed into the system",
        "Enables individuals to understand, monitor, and override the system",
        "Robust against circumvention by the operator or AI system",
    ],
    15: [
        "Accuracy, robustness and cybersecurity metrics and benchmarks",
        "Resilience to errors, faults and inconsistencies",
        "Documentation of performance across relevant groups",
    ],
    26: [
        "Registration in the EU database (if provider/deployer obligations apply)",
        "Logging capabilities and retention policy",
    ],
    27: [
        "Fundamental Rights Impact Assessment (FRIA) covering Article 27(1) elements",
        "Identification of affected persons/groups",
        "Assessment of potential harms and mitigation measures",
        "Notification to the market surveillance authority",
    ],
}


# ---------------------------------------------------------------------------
# Helpers — Ed25519 signing
# ---------------------------------------------------------------------------
def _canonical_json(payload: Any) -> bytes:
    """Deterministic JSON serialization: sorted keys, no whitespace, UTF-8."""
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _sign(payload: Any) -> str:
    """Sign a payload with the demo Ed25519 key, return 128-hex-char signature.

    The signature is computed over the canonical-JSON of the payload with any
    pre-existing 'signature' field stripped, so that the signature can be
    inserted back into the same dict and the round-trip verify() still passes.
    """
    return _DEMO_ED25519_PRIVATE_KEY.sign(_canonical_json(_strip_signature(payload))).hex()


def _verify(payload: Any, signature_hex: str) -> bool:
    """Verify a 128-hex-char Ed25519 signature against a payload.

    The signature is verified over the canonical-JSON of the payload with any
    pre-existing 'signature' field stripped, mirroring _sign().
    """
    try:
        _DEMO_ED25519_PUBLIC_KEY.verify(
            bytes.fromhex(signature_hex), _canonical_json(_strip_signature(payload))
        )
        return True
    except (InvalidSignature, ValueError):
        return False


def _strip_signature(payload: Any) -> Any:
    """Return a shallow copy of the payload with any 'signature' field removed.

    Signatures are computed over the payload's content, not over themselves.
    """
    if isinstance(payload, dict) and "signature" in payload:
        cleaned = {k: v for k, v in payload.items() if k != "signature"}
        return cleaned
    return payload


# ---------------------------------------------------------------------------
# Tool 1 — classify_system
# ---------------------------------------------------------------------------
def _score_category(text: str, keywords: List[str], risk_factors: List[str]) -> Tuple[float, List[str], List[str]]:
    """Score a category by counting keyword hits and risk-factor escalations."""
    text_l = text.lower()
    hits: List[str] = []
    for kw in keywords:
        if kw.lower() in text_l:
            hits.append(kw)
    factors: List[str] = []
    factor_bonus = 0.0
    for rf in risk_factors:
        if rf.lower() in text_l:
            factors.append(rf)
            factor_bonus += 0.5
    base = float(len(hits))
    return base + factor_bonus, hits, factors


def classify_system(system_description: str, deployment_context: str) -> Dict[str, Any]:
    """Classify an AI system against Annex III.

    Args:
        system_description: Free-text description of the AI system and its purpose.
        deployment_context: Free-text description of where/how it is deployed.

    Returns:
        JSON envelope with status, classification (category or "not_high_risk"),
        confidence, applicable_articles, key_obligations, evidence_requirements,
        recommendations, and an Ed25519 signature.
    """
    if not isinstance(system_description, str) or not system_description.strip():
        raise ValueError("system_description must be a non-empty string")
    if not isinstance(deployment_context, str):
        raise ValueError("deployment_context must be a string")

    combined = f"{system_description}\n{deployment_context}"
    scores: List[Tuple[str, float, List[str], List[str]]] = []
    for cat_id, cat in ANNEX_III_CATEGORIES.items():
        score, hits, factors = _score_category(
            combined, cat["keywords_for_classification"], cat["risk_factors"]
        )
        scores.append((cat_id, score, hits, factors))

    scores.sort(key=lambda x: x[1], reverse=True)
    best_id, best_score, best_hits, best_factors = scores[0]
    runner_up_score = scores[1][1] if len(scores) > 1 else 0.0

    # Confidence model:
    #   0 hits  -> not_high_risk, confidence = 0
    #   1-2 hits -> high-risk candidate, confidence = score / (score + 2)  bounded [0,1)
    #   3+ hits -> higher confidence, especially with risk factor bonuses
    if best_score <= 0.0:
        classification: Dict[str, Any] = {
            "category_id": "not_high_risk",
            "category_name": "Not high-risk",
            "matched_keywords": [],
            "risk_factors": [],
        }
        confidence = 0.0
        applicable_articles: List[int] = []
        key_obligations: List[str] = [
            "General AI Act obligations (transparency under Art. 50 where applicable)",
            "Voluntary codes of conduct encouraged (Art. 95)",
        ]
    else:
        cat = ANNEX_III_CATEGORIES[best_id]
        classification = {
            "category_id": cat["id"],
            "category_name": cat["name"],
            "description": cat["description"],
            "matched_keywords": best_hits,
            "risk_factors": best_factors,
        }
        # Confidence: ramp with hits, slightly penalize close runner-up
        margin = max(0.0, best_score - runner_up_score)
        raw = best_score / (best_score + 2.0)
        confidence = min(0.99, max(0.5, raw + 0.1 * margin))
        applicable_articles = list(cat["applicable_articles"])
        key_obligations = list(cat["key_obligations"])

    # Recommendations
    if classification["category_id"] == "not_high_risk":
        recommendations: List[str] = [
            "Document the classification and the keyword analysis as part of your AI system file.",
            "Re-evaluate the classification on any material change to purpose or deployment context.",
            "Consider Art. 50 transparency obligations if the system interacts with natural persons.",
        ]
    else:
        recommendations = [
            f"Conduct a Fundamental Rights Impact Assessment (FRIA) under Article 27 — use generate_fria().",
            "Implement the risk management system required by Article 9 before placing on the market.",
            "Apply the data governance requirements of Article 10 — bias examination, data quality.",
            "Design human oversight measures per Article 14 before deployment.",
            "Prepare Annex IV technical documentation — use generate_annex_iv_documentation().",
            "Register the system in the EU database (Art. 26) and notify the market surveillance authority.",
        ]

    # Evidence requirements — only the top-N articles from the applicable set
    evidence: List[Dict[str, Any]] = []
    for art in applicable_articles:
        evidence.append({
            "article": art,
            "evidence_required": ARTICLE_EVIDENCE_REQUIREMENTS.get(art, []),
        })

    envelope = {
        "status": "ok",
        "classification": classification,
        "confidence": round(confidence, 3),
        "applicable_articles": applicable_articles,
        "key_obligations": key_obligations,
        "evidence_requirements": evidence,
        "recommendations": recommendations,
        "matched_ranker": [
            {"category_id": cid, "score": round(s, 3), "hits": len(h)}
            for cid, s, h, _ in scores
        ],
        "scoring_method": "deterministic_keyword_weighting_v1",
    }
    envelope["signature"] = _sign(envelope)
    return envelope


# ---------------------------------------------------------------------------
# Tool 2 — generate_fria
# ---------------------------------------------------------------------------
_FRIA_SECTION_TITLES = [
    "1. System identification",
    "2. Deployment context",
    "3. Categories of affected natural persons and groups",
    "4. Potential harms to fundamental rights",
    "5. Mitigation measures",
    "6. Human oversight mechanism",
    "7. Data governance and training data assessment",
    "8. Risk management process (Article 9)",
    "9. Accuracy, robustness and cybersecurity (Article 15)",
    "10. Transparency and information to affected persons (Article 13)",
    "11. Post-deployment monitoring and market surveillance",
    "12. Sign-off and review schedule",
]


def _extract_groups(system_id: str, classification: Dict[str, Any]) -> List[str]:
    cat_id = classification.get("category_id", "")
    base = {
        "biometric_identification": [
            "Pedestrians and bystanders in public spaces",
            "Members of ethnic or religious minorities",
            "Minors and young adults",
            "Persons with disabilities",
        ],
        "critical_infrastructure": [
            "Residents and consumers of essential services (water, gas, electricity, heating)",
            "Workers in critical-infrastructure operations",
            "Persons with medical dependency on continuous service",
        ],
        "education_and_vocational_training": [
            "School and university applicants",
            "Enrolled students and candidates for assessment",
            "Examinees during remote proctoring",
            "Persons with disabilities or learning differences",
        ],
        "employment_workers_management": [
            "Job applicants and candidates",
            "Employees and contractors",
            "Gig and platform workers",
            "Members of trade unions and worker representatives",
        ],
        "access_to_essential_services": [
            "Credit and loan applicants",
            "Insurance customers and claimants",
            "Beneficiaries of public services and welfare",
            "Persons in emergency situations",
            "Vulnerable consumers (low income, elderly, disabled)",
        ],
        "law_enforcement": [
            "Suspects, defendants and convicted persons",
            "Witnesses and victims",
            "Police officers and investigators",
            "Ethnic and religious minorities subject to surveillance",
        ],
        "migration_asylum_border_control": [
            "Visa applicants and sponsors",
            "Asylum seekers and refugees",
            "Unaccompanied minors",
            "Migrants in irregular situations",
        ],
        "justice_democratic_processes": [
            "Parties to judicial proceedings",
            "Voters and electoral candidates",
            "Civil-society organizations and journalists",
            "Members of political minorities",
        ],
        "not_high_risk": [
            "General users of the AI system",
        ],
    }
    return base.get(cat_id, ["General users of the AI system"])


def _harms_for(category_id: str) -> List[str]:
    harms = {
        "biometric_identification": [
            "Unlawful or disproportionate surveillance; chilling effect on assembly and expression",
            "Discrimination against minorities due to higher false-match rates",
            "Right to privacy and data protection (Articles 7-8 CFR)",
            "Presumption of innocence and right to an effective remedy",
        ],
        "critical_infrastructure": [
            "Right to life and physical integrity through cascade failures",
            "Disruption of access to essential services (water, heat, electricity)",
            "Loss of livelihood for dependent workers and consumers",
        ],
        "education_and_vocational_training": [
            "Right to education and non-discrimination in admissions",
            "Right to dignity in automated proctoring and assessment",
            "Rejection of applicants based on biased evaluation",
        ],
        "employment_workers_management": [
            "Right to non-discrimination in hiring, promotion, termination",
            "Right to dignity and privacy in the workplace",
            "Loss of livelihood from automated rejection",
            "Reinforcement of historical bias in CV screening",
        ],
        "access_to_essential_services": [
            "Right to social and housing assistance",
            "Right to property and economic participation via credit access",
            "Discrimination in insurance pricing",
            "Denial of emergency response based on faulty risk scoring",
        ],
        "law_enforcement": [
            "Presumption of innocence and right to liberty",
            "Right to an effective remedy and fair trial",
            "Discrimination via predictive policing",
            "Right to privacy in covert surveillance",
        ],
        "migration_asylum_border_control": [
            "Right to asylum and non-refoulement",
            "Family unity and rights of the child",
            "Right to good administration",
            "Discrimination against applicants of particular nationalities",
        ],
        "justice_democratic_processes": [
            "Right to fair trial and judicial independence",
            "Right to vote and stand for election (free and fair)",
            "Freedom of expression and information during elections",
            "Right to participate in democratic life",
        ],
        "not_high_risk": ["Limited residual impact — monitor material change"],
    }
    return harms.get(category_id, harms["not_high_risk"])


def generate_fria(system_id: str, classification: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a draft Fundamental Rights Impact Assessment (Article 27) in Markdown.

    Args:
        system_id: A human-readable identifier for the system.
        classification: The output of classify_system (or a dict with at least
            `category_id` and `category_name`).

    Returns:
        JSON envelope with status, system_id, draft_document (Markdown),
        evidence_requirements, recommendations, and signature.
    """
    if not isinstance(system_id, str) or not system_id.strip():
        raise ValueError("system_id must be a non-empty string")
    if not isinstance(classification, dict):
        raise ValueError("classification must be a dict with at least 'category_id'")
    # Accept either the bare classification dict OR the full envelope from classify_system.
    if "category_id" not in classification and "classification" in classification:
        classification = classification["classification"]
    if "category_id" not in classification:
        raise ValueError("classification must contain 'category_id' (either at top level or nested under 'classification')")

    cat_id = classification.get("category_id", "not_high_risk")
    cat_name = classification.get("category_name", "Not high-risk")
    groups = _extract_groups(system_id, classification)
    harms = _harms_for(cat_id)

    md_lines: List[str] = []
    md_lines.append(f"# Fundamental Rights Impact Assessment (FRIA)")
    md_lines.append("")
    md_lines.append(f"**System ID:** `{system_id}`  ")
    md_lines.append(f"**Annex III Category:** {cat_name}  ")
    md_lines.append(f"**Legal basis:** Article 27 of Regulation (EU) 2024/1689  ")
    md_lines.append(f"**Status:** DRAFT — requires human review and sign-off  ")
    md_lines.append("")

    # Sections 1-12
    md_lines.append("## 1. System identification")
    md_lines.append("")
    md_lines.append(f"- System identifier: `{system_id}`")
    md_lines.append(f"- Provider / deployer: <name>")
    md_lines.append(f"- Intended purpose: <fill in>")
    md_lines.append(f"- Output: <fill in>")
    md_lines.append(f"- Lifecycle stage: <development / placing on market / deployment>")
    md_lines.append("")

    md_lines.append("## 2. Deployment context")
    md_lines.append("")
    md_lines.append("Describe the operational context in which the system will be used, the "
                    "geographic scope, the regulatory regime of the deploying entity, and any "
                    "third-party integrations. Include public or private deployment.")
    md_lines.append("")
    md_lines.append("- Operational scope: <public authority / private actor / mixed>")
    md_lines.append("- Member States of deployment: <list>")
    md_lines.append("- Integration with other AI systems: <list>")
    md_lines.append("- End-users: <list>")
    md_lines.append("")

    md_lines.append("## 3. Categories of affected natural persons and groups")
    md_lines.append("")
    for g in groups:
        md_lines.append(f"- {g}")
    md_lines.append("")

    md_lines.append("## 4. Potential harms to fundamental rights")
    md_lines.append("")
    for h in harms:
        md_lines.append(f"- {h}")
    md_lines.append("")
    md_lines.append("**Cited Charter rights (select all that apply):** Articles 1, 7, 8, 11, 14, "
                    "20, 21, 23, 24, 38, 47 of the EU Charter of Fundamental Rights.")
    md_lines.append("")

    md_lines.append("## 5. Mitigation measures")
    md_lines.append("")
    md_lines.append("- Human-in-the-loop review for material decisions")
    md_lines.append("- Bias examination across protected characteristics (Article 10)")
    md_lines.append("- Right to information and contestation (Article 86)")
    md_lines.append("- Logging and audit trail (Article 12, 19, 26)")
    md_lines.append("- Periodic review and re-assessment (Article 9, 72)")
    md_lines.append("- Data minimisation and purpose limitation (Article 10)")
    md_lines.append("")

    md_lines.append("## 6. Human oversight mechanism")
    md_lines.append("")
    md_lines.append("Describe the Article 14 measures: who is the human overseer, what "
                    "authority they have to override, what training they receive, and how "
                    "the system surfaces confidence and uncertainty to the overseer.")
    md_lines.append("")

    md_lines.append("## 7. Data governance and training data assessment")
    md_lines.append("")
    md_lines.append("- Data sources: <list>")
    md_lines.append("- Data quality criteria: <list>")
    md_lines.append("- Bias examination methodology: <statistical parity / equal opportunity / etc.>")
    md_lines.append("- Data protection impact assessment (GDPR Art. 35) reference: <DPIA ref>")
    md_lines.append("")

    md_lines.append("## 8. Risk management process (Article 9)")
    md_lines.append("")
    md_lines.append("- Risk identification procedure")
    md_lines.append("- Risk estimation and evaluation methodology")
    md_lines.append("- Risk treatment measures and residual risk acceptance")
    md_lines.append("- Review cadence: at least annually, plus on material change")
    md_lines.append("")

    md_lines.append("## 9. Accuracy, robustness and cybersecurity (Article 15)")
    md_lines.append("")
    md_lines.append("- Accuracy targets and measured values (overall and per group)")
    md_lines.append("- Robustness testing: noise, adversarial, distribution shift")
    md_lines.append("- Cybersecurity controls: secure-by-design, vulnerability management")
    md_lines.append("")

    md_lines.append("## 10. Transparency and information to affected persons (Article 13)")
    md_lines.append("")
    md_lines.append("- Disclosure of the system's status as an AI system")
    md_lines.append("- Instructions for use made available to the deployer")
    md_lines.append("- Information on the right to human review and contestation")
    md_lines.append("")

    md_lines.append("## 11. Post-deployment monitoring and market surveillance")
    md_lines.append("")
    md_lines.append("- Logging retention: 6 months minimum (Article 19 / 12)")
    md_lines.append("- Incident reporting procedure (Article 73)")
    md_lines.append("- Post-market monitoring plan (Article 72)")
    md_lines.append("- Cooperation with the market surveillance authority")
    md_lines.append("")

    md_lines.append("## 12. Sign-off and review schedule")
    md_lines.append("")
    md_lines.append("- Drafted by: <name, role, date>")
    md_lines.append("- Reviewed by: <name, role, date>")
    md_lines.append("- Approved by: <name, role, date>")
    md_lines.append("- Next scheduled review: <date>")
    md_lines.append("- Notification to market surveillance authority: <date / not required>")
    md_lines.append("")

    md_lines.append("---")
    md_lines.append("")
    md_lines.append("_This draft was produced by meok-annex-iii-impact-mcp. It is a starting "
                    "point, not a final assessment. The provider/deployer is responsible for "
                    "completing, validating, and signing off the FRIA._")

    draft_document = "\n".join(md_lines)

    evidence_requirements: List[Dict[str, Any]] = []
    if cat_id in ANNEX_III_CATEGORIES:
        for art in ANNEX_III_CATEGORIES[cat_id]["applicable_articles"]:
            evidence_requirements.append({
                "article": art,
                "evidence_required": ARTICLE_EVIDENCE_REQUIREMENTS.get(art, []),
            })

    if cat_id == "not_high_risk":
        recommendations = [
            "FRIA is not strictly required for non-high-risk systems, but documenting the "
            "classification decision and any residual fundamental-rights risks is good practice.",
        ]
    else:
        recommendations = [
            "Have the FRIA reviewed by the DPO and the legal team before placing the system on the market.",
            "Notify the market surveillance authority of the FRIA's completion (Article 27(3)).",
            "Re-perform the FRIA on any material change to the system, its purpose, or its deployment context.",
            "File the signed FRIA in the technical documentation (Annex IV) package.",
        ]

    envelope = {
        "status": "ok",
        "system_id": system_id,
        "classification": classification,
        "draft_document": draft_document,
        "evidence_requirements": evidence_requirements,
        "recommendations": recommendations,
        "section_count": len(_FRIA_SECTION_TITLES),
        "template_version": "fria-md-v1",
    }
    envelope["signature"] = _sign(envelope)
    return envelope


# ---------------------------------------------------------------------------
# Tool 3 — check_article_compliance
# ---------------------------------------------------------------------------
def _evidence_state_for(system: Dict[str, Any], article: int) -> str:
    """Heuristic PASS/FAIL/REVIEW based on whether the system dict has evidence fields.

    The system dict is expected to be freeform, but if it contains a key like
    `risk_management_documented` (Art. 9) or `fria_documented` (Art. 27), we
    treat the question as answered. Missing key -> REVIEW (the auditor must look).
    """
    # The mapping is intentionally simple: presence = PASS, explicit False = FAIL, missing = REVIEW.
    key_for_article: Dict[int, str] = {
        9: "risk_management_documented",
        10: "data_governance_documented",
        13: "transparency_documented",
        14: "human_oversight_documented",
        15: "accuracy_robustness_documented",
        26: "eu_database_registered",
        27: "fria_documented",
    }
    key = key_for_article.get(article)
    if key is None:
        return "REVIEW"
    val = system.get(key)
    if val is True:
        return "PASS"
    if val is False:
        return "FAIL"
    return "REVIEW"


def check_article_compliance(system: Dict[str, Any], articles: List[int]) -> Dict[str, Any]:
    """Check Article-level compliance for a system.

    Args:
        system: A dict describing the system; may include boolean evidence flags.
        articles: A list of article numbers to check (e.g. [9, 10, 13, 14, 15, 27]).

    Returns:
        JSON envelope with status, system, per-article results, evidence_requirements,
        recommendations, summary, and signature.
    """
    if not isinstance(system, dict):
        raise ValueError("system must be a dict")
    if not isinstance(articles, list) or not all(isinstance(a, int) for a in articles):
        raise ValueError("articles must be a list of integers")

    results: List[Dict[str, Any]] = []
    pass_count = fail_count = review_count = 0
    failing: List[int] = []
    reviewing: List[int] = []

    for art in articles:
        status = _evidence_state_for(system, art)
        if status == "PASS":
            pass_count += 1
        elif status == "FAIL":
            fail_count += 1
            failing.append(art)
        else:
            review_count += 1
            reviewing.append(art)
        results.append({
            "article": art,
            "status": status,
            "evidence_required": ARTICLE_EVIDENCE_REQUIREMENTS.get(
                art, ["No specific evidence map for this article in v1."]
            ),
        })

    if fail_count:
        overall = "FAIL"
    elif review_count:
        overall = "REVIEW"
    else:
        overall = "PASS"

    if overall == "PASS":
        recommendations = [
            "All checked articles are marked PASS — maintain evidence and re-check on any change.",
        ]
    elif overall == "FAIL":
        recommendations = [
            f"Article(s) {failing} are marked FAIL — remediate before placing the system on the market.",
            "Add the missing evidence documents and re-run this check.",
        ]
    else:
        recommendations = [
            f"Article(s) {reviewing} need human review — provide the missing evidence.",
            "Document the rationale for each REVIEW outcome in the technical file.",
        ]

    envelope = {
        "status": "ok",
        "system": system,
        "results": results,
        "summary": {
            "overall": overall,
            "pass": pass_count,
            "fail": fail_count,
            "review": review_count,
        },
        "evidence_requirements": [
            {"article": art, "evidence_required": ARTICLE_EVIDENCE_REQUIREMENTS.get(art, [])}
            for art in articles
        ],
        "recommendations": recommendations,
    }
    envelope["signature"] = _sign(envelope)
    return envelope


# ---------------------------------------------------------------------------
# Tool 4 — generate_annex_iv_documentation
# ---------------------------------------------------------------------------
_ANNEX_IV_SECTIONS = [
    "general_description",
    "design_specifications",
    "data_preparation",
    "capabilities_and_limitations",
    "intended_purposes",
    "risk_management",
    "validation_and_testing",
    "transparency",
    "post_market_monitoring",
]


def generate_annex_iv_documentation(system: Dict[str, Any]) -> Dict[str, Any]:
    """Generate Annex IV technical documentation in JSON.

    Args:
        system: A dict describing the system. May include any of: name, version,
            provider, intended_purpose, deployment_context, data_sources,
            design_specs, validation_results, transparency, post_market_monitoring.

    Returns:
        JSON envelope with status, system, draft_document (JSON of the 9 sections),
        evidence_requirements, recommendations, and signature.
    """
    if not isinstance(system, dict):
        raise ValueError("system must be a dict")

    draft: Dict[str, Any] = {
        "1_general_description": {
            "system_name": system.get("name", "<system name>"),
            "version": system.get("version", "<version>"),
            "provider": system.get("provider", "<provider>"),
            "intended_purpose": system.get("intended_purpose", "<intended purpose>"),
            "deployment_context": system.get("deployment_context", "<deployment context>"),
            "interaction_with_natural_persons": system.get(
                "interaction_with_natural_persons", "<describe>"
            ),
            "hardware_and_software": system.get("hardware_and_software", "<describe>"),
        },
        "2_design_specifications": {
            "architecture": system.get("architecture", "<describe>"),
            "model_type": system.get("model_type", "<describe>"),
            "design_specs": system.get("design_specs", "<include>"),
        },
        "3_data_preparation": {
            "training_data_sources": system.get("data_sources", "<list>"),
            "data_quality_criteria": system.get("data_quality_criteria", "<list>"),
            "bias_examination": system.get("bias_examination", "<describe>"),
            "labelling_procedures": system.get("labelling_procedures", "<describe>"),
        },
        "4_capabilities_and_limitations": {
            "capabilities": system.get("capabilities", "<describe>"),
            "limitations": system.get("limitations", "<describe>"),
            "foreseeable_misuse": system.get("foreseeable_misuse", "<describe>"),
        },
        "5_intended_purposes": {
            "primary_intended_purpose": system.get("intended_purpose", "<describe>"),
            "geographic_scope": system.get("geographic_scope", "<describe>"),
            "target_users": system.get("target_users", "<describe>"),
        },
        "6_risk_management": {
            "risk_management_process": system.get("risk_management_process", "<Art. 9 process>"),
            "identified_risks": system.get("identified_risks", "<list>"),
            "mitigation_measures": system.get("mitigation_measures", "<list>"),
            "residual_risks": system.get("residual_risks", "<list>"),
        },
        "7_validation_and_testing": {
            "validation_methodology": system.get("validation_methodology", "<describe>"),
            "validation_results": system.get("validation_results", "<results>"),
            "test_data": system.get("test_data", "<describe>"),
            "metrics": system.get("metrics", "<accuracy, fairness, robustness>"),
        },
        "8_transparency": {
            "instructions_for_use": system.get("instructions_for_use", "<link or attach>"),
            "user_information": system.get("user_information", "<describe>"),
            "disclosure_to_natural_persons": system.get(
                "disclosure_to_natural_persons", "<Article 13 + 50>"
            ),
        },
        "9_post_market_monitoring": {
            "monitoring_plan": system.get("post_market_monitoring", "<plan>"),
            "incident_reporting": system.get("incident_reporting", "<procedure>"),
            "logging_retention": system.get("logging_retention", "<retention period>"),
        },
    }

    evidence_requirements: List[Dict[str, Any]] = []
    for art in [9, 10, 13, 14, 15, 26, 27]:
        evidence_requirements.append({
            "article": art,
            "evidence_required": ARTICLE_EVIDENCE_REQUIREMENTS.get(art, []),
        })

    recommendations = [
        "Populate all `<...>` placeholders with provider-specific content.",
        "Cross-reference each section to the underlying evidence in the technical file.",
        "Sign and date the Annex IV package before placing the system on the market.",
        "Treat the Annex IV documentation as a living document — update on material change.",
    ]

    envelope = {
        "status": "ok",
        "system": system,
        "draft_document": draft,
        "section_count": len(_ANNEX_IV_SECTIONS),
        "sections": _ANNEX_IV_SECTIONS,
        "evidence_requirements": evidence_requirements,
        "recommendations": recommendations,
        "template_version": "annex-iv-json-v1",
    }
    envelope["signature"] = _sign(envelope)
    return envelope


# ---------------------------------------------------------------------------
# MCP stdio entry-point
# ---------------------------------------------------------------------------
def main() -> None:  # pragma: no cover — exercised by MCP runtime, not unit tests
    """Run the MCP server over stdio."""
    try:
        from mcp.server import Server
        from mcp.server.stdio import stdio_server
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            "The 'mcp' package is required to run the MCP server. "
            "Install with: pip install mcp"
        ) from exc

    server = Server("meok-annex-iii-impact-mcp")

    @server.list_tools()
    async def _list_tools():  # pragma: no cover
        return [
            {
                "name": "classify_system",
                "description": "Classify an AI system against EU AI Act Annex III.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "system_description": {"type": "string"},
                        "deployment_context": {"type": "string"},
                    },
                    "required": ["system_description", "deployment_context"],
                },
            },
            {
                "name": "generate_fria",
                "description": "Generate a draft Article 27 Fundamental Rights Impact Assessment.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "system_id": {"type": "string"},
                        "classification": {"type": "object"},
                    },
                    "required": ["system_id", "classification"],
                },
            },
            {
                "name": "check_article_compliance",
                "description": "Check Article 9/10/13/14/15/27 compliance (PASS/FAIL/REVIEW).",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "system": {"type": "object"},
                        "articles": {"type": "array", "items": {"type": "integer"}},
                    },
                    "required": ["system", "articles"],
                },
            },
            {
                "name": "generate_annex_iv_documentation",
                "description": "Generate Annex IV technical documentation as JSON.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "system": {"type": "object"},
                    },
                    "required": ["system"],
                },
            },
        ]

    @server.call_tool()
    async def _call_tool(name: str, arguments: dict):  # pragma: no cover
        if name == "classify_system":
            result = classify_system(
                arguments["system_description"], arguments["deployment_context"]
            )
        elif name == "generate_fria":
            result = generate_fria(arguments["system_id"], arguments["classification"])
        elif name == "check_article_compliance":
            result = check_article_compliance(arguments["system"], arguments["articles"])
        elif name == "generate_annex_iv_documentation":
            result = generate_annex_iv_documentation(arguments["system"])
        else:
            raise ValueError(f"Unknown tool: {name}")
        return result

    import asyncio
    async def _run() -> None:  # pragma: no cover
        async with stdio_server() as (read_stream, write_stream):
            await server.run(read_stream, write_stream, server.create_initialization_options())
    asyncio.run(_run())


if __name__ == "__main__":  # pragma: no cover
    main()
