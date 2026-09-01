"""Public-notice cards for the GenAI.mil federal-AI move. FACTS, not measurements.

Honesty spine (do not soften):
  * "Sign the press, not the models." Every leaf here hashes a PUBLIC notice.
    None of them measures a deployment.
  * The federal DEPLOYMENTS — ChatGPT Mil, Grok for Government — run inside an
    IL5 boundary we cannot access. They are UNCHECKABLE by definition. We never
    probe a classified/gov instance; we measured the public model, not the
    military instance.
  * FedRAMP authorises a security WRAPPER. Model BEHAVIOUR on the GSPC axes is
    unsigned. That gap is the thing we exist to close.
  * Vendor system-card claim vs OUR card: public disclosures only, factual, not
    defamatory. We have NOT yet measured these public frontier models on the 14
    behavioural axes (grading is an owner step — OpenRouter key), so OUR side is
    honestly UNMEASURED. Measurement, not certification.
  * The NIST AI RMF -> GSPC axes crosswalk is a mapping, not a legal
    determination. Comment only on OPEN dockets.

All leaves are surface public.notice, the same envelope swift_notices uses, so
the EXISTING public-root OIDC signer (functions/api/board-sign.ts, workflow
name contains "public-root") signs them and folds them into /root.json. Never
laptop-sign. New leaves stay UNSIGNED until the GHA job mints the signature.
"""
from __future__ import annotations

import hashlib
from typing import Any

AS_OF = "2026-09-01T00:00:00Z"


def _sha(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------- source URLs
WARGOV_RELEASE = (
    "https://www.war.gov/News/Releases/Release/Article/4354916/"
    "the-war-department-unleashes-ai-on-new-genaimil-platform/"
)
DEFENSESCOOP = "https://defensescoop.com/2026/08/31/grok-chatgpt-added-to-genai-mil/"
MILITARYTIMES = (
    "https://www.militarytimes.com/industry/techwatch/2026/08/31/"
    "the-militarys-chatgpt-is-now-live-via-the-pentagons-genai-platform/"
)
TECHCRUNCH = "https://techcrunch.com/2026/08/31/the-pentagon-now-has-its-own-version-of-chatgpt-and-grok/"
XAI_GOV = "https://x.ai/news/us-gov-dept-of-war"

FEDRAMP_MARKETPLACE = "https://marketplace.fedramp.gov/products"
OPENAI_FEDRAMP = "https://www.fedramp.gov/marketplace/products/FR2533155773/"
GEMINI_FEDRAMP = (
    "https://cloud.google.com/blog/topics/public-sector/"
    "gemini-in-workspace-apps-and-the-gemini-app-are-first-to-achieve-fedramp-high-authorization"
)

# Vendor system / model cards — public disclosures.
OPENAI_SYSTEM_CARD = "https://openai.com/index/gpt-5-system-card/"
ANTHROPIC_SYSTEM_CARD = "https://www.anthropic.com/claude-opus-4-5-system-card"
GEMINI_MODEL_CARD = "https://deepmind.google/models/model-cards/"
XAI_MODEL_CARD = "https://data.x.ai/2025-08-20-grok-4-model-card.pdf"

# Regulation crosswalk context.
CAISI_GSA_MOU = (
    "https://www.nist.gov/news-events/news/2026/03/"
    "caisi-signs-mou-gsa-boost-ai-evaluation-science-federal-procurement-through"
)
GSA_MOU = "https://www.gsa.gov/about-gsa/newsroom/news-releases/gsa-and-nist-partner-to-boost-ai-evaluation-science-in-federal-procurement-03182026"
NIST_CI_PROFILE = "https://www.nist.gov/programs-projects/concept-note-ai-rmf-profile-trustworthy-ai-critical-infrastructure"
GSA_CLAUSE_FR = "https://www.federalregister.gov/documents/2026/06/17/2026-12205/general-services-acquisition-regulation-acquisition-of-information-and-communication-technology"
CROSSWALK_ARTIFACT = "https://councilof.ai/interop/nist-airmf-gspc-crosswalk.json"
GENAI_MIL_PAGE = "https://councilof.ai/genai-mil"


def _wargov_leaf() -> dict[str, Any]:
    return {
        "surface": "public.notice",
        "subject": "GenAI.mil: 3 frontier vendors on IL5 (31 Aug 2026 War Dept release)",
        "as_of": AS_OF,
        "source_urls": [WARGOV_RELEASE, DEFENSESCOOP, MILITARYTIMES, TECHCRUNCH, XAI_GOV],
        "payload": {
            "kind": "gspc.coverage-card/0.1",
            "status": "UNMEASURED",
            "not_a_grade": True,
            "not_a_measurement": True,
            "framing": "Sign the press, not the models.",
            "vendors": [
                "OpenAI ChatGPT (ChatGPT Mil)",
                "xAI Grok (Grok for Government / Starshield AI)",
                "Google Gemini",
            ],
            "impact_level": "IL5",
            "design_capacity_personnel": 3000000,
            "current_users": 1500000,
            "current_users_asof": "2026-06-12 (Pentagon CTO)",
            "current_users_note": (
                "1.5M sourced (Pentagon CTO, 12 Jun 2026). The ~1.7M figure in the "
                "operator brief is UNVERIFIED; the recorded number is the sourced 1.5M."
            ),
            "deployments_uncheckable": ["ChatGPT Mil", "Grok for Government"],
            "uncheckable_reason": (
                "The IL5 military instances are non-public. We measured neither. "
                "The classified/gov deployment is UNCHECKABLE by definition."
            ),
            "url_sha256": _sha(WARGOV_RELEASE),
        },
        "unmeasured": [
            "deployment_behaviour",
            "classified_gov_instance",
            "il5_environment_bytes",
            "press_html_body_403",
            "the_14_behavioural_axes_on_these_deployments",
        ],
        "tags": [
            "framework:wardept-public-press",
            "coverage:UNCHECKABLE-deployments",
            "coverage:UNMEASURED",
            "genai-mil",
        ],
    }


def _fedramp_leaf() -> dict[str, Any]:
    return {
        "surface": "public.notice",
        "subject": "FedRAMP wrapper authorised, model behaviour unsigned - the gap (1 Sep 2026)",
        "as_of": AS_OF,
        "source_urls": [FEDRAMP_MARKETPLACE, OPENAI_FEDRAMP, GEMINI_FEDRAMP],
        "payload": {
            "kind": "gspc.coverage-card/0.1",
            "status": "UNMEASURED",
            "not_a_grade": True,
            "gap_note": (
                "The security WRAPPER is authorised. MODEL BEHAVIOUR on the 14 "
                "behavioural GSPC axes is unsigned. That gap is us."
            ),
            "wrappers_authorised": {
                "OpenAI ChatGPT Enterprise + API": "FedRAMP (marketplace FR2533155773; ongoing as of 2026-01-09)",
                "Google Gemini": "FedRAMP High (Mar 2025)",
                "Anthropic Claude": "FedRAMP High via AWS/GCP (Apr 2 / Jun 11 2025)",
            },
            "what_fedramp_covers": "cloud security controls of the wrapper",
            "what_fedramp_does_not_cover": "model behaviour on the behavioural axes",
        },
        "unmeasured": [
            "model_behaviour_on_gspc_axes",
            "runtime_conduct",
            "in_deployment_measurement",
        ],
        "tags": [
            "framework:fedramp-marketplace",
            "coverage:wrapper-authorised",
            "coverage:behaviour-unsigned",
            "genai-mil",
        ],
    }


_VENDORS = [
    ("OpenAI GPT (ChatGPT)", OPENAI_SYSTEM_CARD, "GPT-5 System Card"),
    ("Anthropic Claude", ANTHROPIC_SYSTEM_CARD, "Claude Opus system card"),
    ("Google Gemini", GEMINI_MODEL_CARD, "Gemini model cards"),
    ("xAI Grok", XAI_MODEL_CARD, "Grok model card"),
]


def _vendor_leaf(vendor: str, card_url: str, card_name: str) -> dict[str, Any]:
    return {
        "surface": "public.notice",
        "subject": f"Vendor system-card claim vs CSOAI card: {vendor} - UNMEASURED",
        "as_of": AS_OF,
        "source_urls": [card_url],
        "payload": {
            "kind": "gspc.coverage-card/0.1",
            "status": "UNMEASURED",
            "vendor": vendor,
            "vendor_disclosure": (
                f"Vendor published a public {card_name} documenting safety "
                "evaluations and known limitations."
            ),
            "vendor_claim_type": "self-reported safety testing (public disclosure)",
            "our_card": "UNMEASURED",
            "our_card_note": (
                "CSOAI has no signed GSPC card for this public model yet. Grading "
                "the public models on the 14 behavioural axes is an owner step "
                "(OpenRouter key). Public disclosures compared, not certified. "
                "Measurement, not certification. Not defamatory."
            ),
            "url_sha256": _sha(card_url),
        },
        "unmeasured": [
            "our_gspc_measurement_of_this_public_model",
            "the_matching_axis_score",
        ],
        "tags": [
            "framework:vendor-system-card",
            "coverage:claim-vs-card",
            "coverage:UNMEASURED",
            "genai-mil",
        ],
    }


def _crosswalk_leaf() -> dict[str, Any]:
    return {
        "surface": "public.notice",
        "subject": "Crosswalk: NIST AI RMF -> GSPC axes (CAISI x GSA MOU, 18 Mar 2026)",
        "as_of": AS_OF,
        "source_urls": [
            CAISI_GSA_MOU,
            GSA_MOU,
            NIST_CI_PROFILE,
            GSA_CLAUSE_FR,
            CROSSWALK_ARTIFACT,
        ],
        "payload": {
            "kind": "gspc.crosswalk/0.1",
            "status": "MAPPING",
            "not_a_legal_determination": True,
            "not_a_certification": True,
            "mou": "CAISI (NIST) x GSA, signed 18 Mar 2026, for the USAi platform",
            "public_behavioural_axes": 14,
            "crosswalk_artifact": CROSSWALK_ARTIFACT,
            "open_docket": (
                "NIST 'Trustworthy AI in Critical Infrastructure' Profile - "
                "Community of Interest (OPEN; mailing list + Slack; concept note 7 Apr 2026)"
            ),
            "closed_docket": (
                "GSA GSAR clause 552.239-7001 comment window CLOSED 2026-08-03 - "
                "do not file there"
            ),
        },
        "unmeasured": [
            "legal_conformity_determination",
            "certification_of_any_model",
        ],
        "tags": [
            "framework:nist-ai-rmf",
            "coverage:crosswalk",
            "docket:open-nist-ci-profile",
            "genai-mil",
        ],
    }


def collect() -> dict[str, Any]:
    leaves = [_wargov_leaf(), _fedramp_leaf()]
    leaves.extend(_vendor_leaf(v, u, n) for (v, u, n) in _VENDORS)
    leaves.append(_crosswalk_leaf())
    # 1 war.gov + 1 fedramp + 4 vendor + 1 crosswalk = 7
    if len(leaves) != 7:
        raise RuntimeError("GenAI.mil notices must be 7 leaves")
    return {
        "leaves": leaves,
        "sidecar": {
            "move": "genai-mil",
            "n_cards": 7,
            "sign_the_press_not_the_models": True,
            "deployments_uncheckable": True,
            "model_behaviour_unsigned": True,
            "public_models_measured": False,
            "public_models_measured_note": "owner step: OpenRouter key",
            "note": (
                "7 public.notice cards over the GenAI.mil federal-AI move. Facts, "
                "not measurements. Deployments UNCHECKABLE; model behaviour unsigned; "
                "our frontier cards UNMEASURED pending owner-step grading."
            ),
        },
    }
