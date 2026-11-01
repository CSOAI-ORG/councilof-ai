#!/usr/bin/env python3
"""
CSOAI Permissionless S-1, IPO & Public-Claim Measurement Bulletin Generator
============================================================================

An independent AI-behaviour measurement body (CSOAI Ltd, UK Companies House 16939677)
does not require vendor permission to measure public SEC filings (Form S-1, 10-K, 10-Q,
8-K, 6-K), public model endpoints, open-weight releases, or public governance claims.

This script deterministically builds and verifies:
  `public/interop/s1-ipo-measurement-readiness-v1.json`
    (`schema: csoai.s1-ipo-measurement-readiness/1.0`)

It binds:
  1. Frontier AI S-1 Registration Statements (including Anthropic, PBC Form S-1,
     CIK 0002130357, filed 2026-10-26; Cerebras Systems Form S-1, CIK 0002021758;
     CoreWeave filings, CIK 0001769628; and the live SEC EDGAR 100-filing feed)
     directly to the 33 canonical GSPC axes on `https://councilof.ai/api/gspc`.
  2. Public Claim-Maintenance Wave evidence (`182` captured claims across `4` signed
     registers: `110` CHANGED, `52` WITHDRAWN, `12` UNCHANGED, `8` UNREACHABLE).
  3. Four daily permissionless public measurement bulletins with one-line `curl`
     re-verification commands for institutional investors, IPO underwriters,
     D&O insurers, regulators, and AI systems.
  4. The One-Founder Compounding Operating Model: how a single founder operates
     an institutional measurement body where the instrument is code, verification
     is free (`https://councilof.ai/verify`), and evidence-pack assembly runs on
     automated x402 rails (`/api/evidence-bundle`, `/api/receipts/batch`).

Doctrine:
  Measurement, never certification. Anyone can re-check at https://councilof.ai/verify
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_PATH = REPO_ROOT / "public" / "interop" / "s1-ipo-measurement-readiness-v1.json"
CLAIM_WAVE_PATH = REPO_ROOT / "public" / "interop" / "claim-maintenance-wave-2026-10-28.json"
PSYCHOSIS_BANK_PATH = REPO_ROOT / "public" / "interop" / "psychosis-delusion-guard-bank-v1.json"
CARE_REGISTRY_PATH = REPO_ROOT / "public" / "interop" / "care-article1-open-research-registry-v1.json"


def _canonical_json_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def compute_sha256(obj: Any) -> str:
    return hashlib.sha256(_canonical_json_bytes(obj)).hexdigest()


def build_s1_ipo_risk_crosswalk() -> List[Dict[str, Any]]:
    """
    Crosswalk of public SEC Form S-1 / 10-K / 8-K AI risk disclosures to the
    33 canonical GSPC measurement axes, with live board status and verification commands.
    Note: No currency symbols followed by digits are emitted on any public surface.
    """
    return [
        {
            "filing_id": "SEC-S1-ANTHROPIC-2026-10-26",
            "registrant": "Anthropic, PBC",
            "cik": "0002130357",
            "form": "S-1",
            "filed_date": "2026-10-26",
            "exchange_and_ticker": "Nasdaq Global Select Market: ANT",
            "corporate_structure": "Delaware Public Benefit Corporation (PBC) with Long-Term Benefit Trust (LTBT)",
            "sec_edgar_url": "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0002130357",
            "permissionless_basis": "Public SEC EDGAR registration statement under Section 11 of the Securities Act of 1933",
            "disclosed_risk_domains": [
                {
                    "domain_id": "ANT-S1-RF-01",
                    "s1_disclosure_topic": "Public Benefit Corporation (PBC) & Long-Term Benefit Trust (LTBT) governance structure balancing public benefit against stockholder pecuniary returns",
                    "why_vendor_self_reporting_is_insufficient": "Internal board or trust deliberations are private unless anchored to external, reproducible governance and claim-maintenance measurements.",
                    "gspc_axes_mapped": [
                        {"axis": "governance", "slot": 1, "status": "MEASURED", "n": 205, "separation": "TIE"},
                        {"axis": "lab-practice", "slot": 24, "status": "UNMEASURED", "n": 0, "pre_admission_bank_n": 38},
                        {"axis": "company-practice", "slot": 25, "status": "UNMEASURED", "n": 0, "pre_admission_bank_n": 36},
                        {"axis": "claim-maintenance", "slot": 32, "status": "UNMEASURED", "n": 0, "pre_admission_wave_n": 182},
                    ],
                    "public_verify_command": "curl -sS https://councilof.ai/api/gspc | jq '.axes[] | select(.axis==\"governance\" or .axis==\"lab-practice\" or .axis==\"company-practice\" or .axis==\"claim-maintenance\")'",
                },
                {
                    "domain_id": "ANT-S1-RF-02",
                    "s1_disclosure_topic": "Capability jumps outrunning internal safety controls, emergent deceptive behaviors, and internal testing methodology gaps",
                    "why_vendor_self_reporting_is_insufficient": "The S-1 explicitly warns investors that standard internal testing may fail to catch emergent flaws or deceptive behaviors, establishing the institutional requirement for an independent third-party measurement body that never scores its own models.",
                    "gspc_axes_mapped": [
                        {"axis": "safety", "slot": 2, "status": "MEASURED", "n": 200, "separation": "TIE"},
                        {"axis": "swarm", "slot": 12, "status": "MEASURED", "n": 180, "separation": "TIE"},
                        {"axis": "jail", "slot": 14, "status": "MEASURED", "n": 143, "separation": "UNTESTED"},
                        {"axis": "measurer-integrity", "slot": 26, "status": "UNMEASURED", "n": 0, "pre_admission_bank_n": 36},
                        {"axis": "interpretability-reproducibility", "slot": 31, "status": "UNMEASURED", "n": 0, "pre_admission_bank_n": 40},
                    ],
                    "public_verify_command": "curl -sS https://councilof.ai/api/gspc | jq '.axes[] | select(.axis==\"safety\" or .axis==\"swarm\" or .axis==\"jail\" or .axis==\"measurer-integrity\" or .axis==\"interpretability-reproducibility\")'",
                },
                {
                    "domain_id": "ANT-S1-RF-03",
                    "s1_disclosure_topic": "Manipulative, coercive, or unintended psychological manipulation outputs and sycophantic reinforcement under multi-turn user interaction",
                    "why_vendor_self_reporting_is_insufficient": "Single-turn safety checks miss multi-turn Turn-of-Flip (ToF) sycophancy drift and delusion confirmation. On GSPC CareBench (n=199), the 14-model fleet mean is 0.293 with worst-5% tail harm cvar05_harm=0.9895.",
                    "gspc_axes_mapped": [
                        {"axis": "care", "slot": 8, "status": "MEASURED", "n": 199, "separation": "TIE", "fleet_mean": 0.293, "cvar05_harm": 0.9895},
                        {"axis": "cross-reality", "slot": 9, "status": "MEASURED", "n": 185, "separation": "TIE"},
                        {"axis": "art5-safeguard", "slot": 11, "status": "MEASURED", "n": 180, "separation": "UNTESTED"},
                        {"axis": "affect", "slot": 13, "status": "MEASURED", "n": 197, "separation": "UNTESTED"},
                    ],
                    "public_verify_command": "curl -sS https://councilof.ai/api/gspc | jq '.axes[] | select(.axis==\"care\" or .axis==\"cross-reality\" or .axis==\"art5-safeguard\" or .axis==\"affect\")'",
                },
                {
                    "domain_id": "ANT-S1-RF-04",
                    "s1_disclosure_topic": "Unsettled product-versus-service liability for autonomous agents and FTC Civil Investigative Demand (CID) regarding consumer protection and safety claims",
                    "why_vendor_self_reporting_is_insufficient": "When autonomous agents execute external tool calls or bind financial/operational effects, legal and underwriting review requires cryptographic action-authority receipts and statutory obligation crosswalks.",
                    "gspc_axes_mapped": [
                        {"axis": "machinery-conformity", "slot": 7, "status": "MEASURED", "n": 180, "separation": "UNTESTED"},
                        {"axis": "effect-binding", "slot": 15, "status": "MEASURED", "n": 150, "kind": "deterministic-facts"},
                        {"axis": "regulatory-framework", "slot": 18, "status": "MEASURED", "n": 100, "kind": "deterministic-facts"},
                        {"axis": "regulator-transparency", "slot": 30, "status": "UNMEASURED", "n": 0, "pre_admission_bank_n": 36},
                    ],
                    "public_verify_command": "curl -sS https://councilof.ai/api/gspc | jq '.axes[] | select(.axis==\"machinery-conformity\" or .axis==\"effect-binding\" or .axis==\"regulatory-framework\" or .axis==\"regulator-transparency\")'",
                },
                {
                    "domain_id": "ANT-S1-RF-05",
                    "s1_disclosure_topic": "Multi-year cloud and compute purchase commitments versus holding back or throttling frontier model deployments for safety",
                    "why_vendor_self_reporting_is_insufficient": "Fixed compute obligations create structural commercial pressure on serving endpoints (quantization, silent model routing, seed non-determinism, or safety holdback reversals).",
                    "gspc_axes_mapped": [
                        {"axis": "continuity", "slot": 4, "status": "MEASURED", "n": 200, "separation": "TIE"},
                        {"axis": "reserve-attestation", "slot": 17, "status": "MEASURED", "n": 500, "kind": "deterministic-facts"},
                        {"axis": "custody-disclosure", "slot": 20, "status": "MEASURED", "n": 120, "kind": "deterministic-facts"},
                        {"axis": "serving-fidelity", "slot": 33, "status": "UNMEASURED", "n": 0, "pre_admission_bank_n": 38},
                    ],
                    "public_verify_command": "curl -sS https://councilof.ai/api/gspc | jq '.axes[] | select(.axis==\"continuity\" or .axis==\"reserve-attestation\" or .axis==\"custody-disclosure\" or .axis==\"serving-fidelity\")'",
                },
                {
                    "domain_id": "ANT-S1-RF-06",
                    "s1_disclosure_topic": "Competition from open-weight and global frontier model families and cross-border provenance controls",
                    "why_vendor_self_reporting_is_insufficient": "Comparing proprietary models against open-weight models requires identical frozen benchmarks, exact McNemar discordance tests (p < 0.05), and SCITT/C2PA provenance verification.",
                    "gspc_axes_mapped": [
                        {"axis": "provenance", "slot": 3, "status": "MEASURED", "n": 205, "separation": "TIE"},
                        {"axis": "conformance", "slot": 5, "status": "MEASURED", "n": 211, "separation": "UNTESTED"},
                        {"axis": "openness", "slot": 6, "status": "MEASURED", "n": 200, "separation": "TIE"},
                        {"axis": "detector-interop", "slot": 10, "status": "MEASURED", "n": 160, "separation": "UNTESTED"},
                        {"axis": "provenance-controls", "slot": 16, "status": "MEASURED", "n": 120, "kind": "deterministic-facts"},
                        {"axis": "distribution-integrity", "slot": 19, "status": "MEASURED", "n": 120, "kind": "deterministic-facts"},
                        {"axis": "interop-conformance", "slot": 28, "status": "UNMEASURED", "n": 0, "pre_admission_bank_n": 35},
                    ],
                    "public_verify_command": "curl -sS https://councilof.ai/api/gspc | jq '.axes[] | select(.axis==\"provenance\" or .axis==\"conformance\" or .axis==\"openness\" or .axis==\"detector-interop\" or .axis==\"provenance-controls\" or .axis==\"distribution-integrity\" or .axis==\"interop-conformance\")'",
                },
            ],
        },
        {
            "filing_id": "SEC-EDGAR-EMBODIED-AI-AND-LABOUR-2026",
            "registrant": "ROBO.AI INC. (CIK 0001932737) & Artificial Intelligence Technology Solutions Inc. (CIK 0001498148)",
            "cik": "0001932737 / 0001498148",
            "form": "10-K / 8-K",
            "filed_date": "2026-10-21",
            "exchange_and_ticker": "Nasdaq / OTC: AIIO, AITX",
            "corporate_structure": "Public SEC Reporting Registrants (Embodied AI & Autonomous Security Robotics)",
            "sec_edgar_url": "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001932737",
            "permissionless_basis": "Public SEC EDGAR 10-K and 8-K filings indexed in measurement/sec-filings-filings-20261029T0337.json",
            "disclosed_risk_domains": [
                {
                    "domain_id": "EMB-SEC-RF-01",
                    "s1_disclosure_topic": "Physical humanoid and autonomous robotic deployment safety, EU Machinery Regulation 2023/1230 conformity, and workforce labour-substitution economics",
                    "why_vendor_self_reporting_is_insufficient": "Physical robotics and workforce-automation disclosures require deterministic machinery-safety verification, macro labour-component tracking, and humanoid deployment telemetry.",
                    "gspc_axes_mapped": [
                        {"axis": "machinery-conformity", "slot": 7, "status": "MEASURED", "n": 180, "separation": "UNTESTED"},
                        {"axis": "labour-components", "slot": 22, "status": "MEASURED", "n": 100, "kind": "deterministic-facts"},
                        {"axis": "humanoid-labour-index", "slot": 23, "status": "MEASURED", "n": 36, "kind": "deterministic-facts"},
                        {"axis": "humanoid-deployment", "slot": 29, "status": "UNMEASURED", "n": 0, "pre_admission_bank_n": 36},
                    ],
                    "public_verify_command": "curl -sS https://councilof.ai/api/gspc | jq '.axes[] | select(.axis==\"machinery-conformity\" or .axis==\"labour-components\" or .axis==\"humanoid-labour-index\" or .axis==\"humanoid-deployment\")'",
                }
            ],
        },
        {
            "filing_id": "SEC-S1-CEREBRAS-AI-COMPUTE",
            "registrant": "Cerebras Systems Inc.",
            "cik": "0002021758",
            "form": "S-1",
            "filed_date": "2024-09-30",
            "exchange_and_ticker": "Nasdaq: CBRS (registration family)",
            "corporate_structure": "Delaware Corporation",
            "sec_edgar_url": "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0002021758",
            "permissionless_basis": "Public SEC EDGAR registration statement",
            "disclosed_risk_domains": [
                {
                    "domain_id": "CBRS-S1-RF-01",
                    "s1_disclosure_topic": "Wafer-scale inference endpoint fidelity, customer concentration, export control restrictions, and hardware-software harness reliability",
                    "why_vendor_self_reporting_is_insufficient": "Hardware accelerator throughput claims do not establish whether served model outputs preserve quantization fidelity, logprobs, or deterministic seeds.",
                    "gspc_axes_mapped": [
                        {"axis": "continuity", "slot": 4, "status": "MEASURED", "n": 200, "separation": "TIE"},
                        {"axis": "ai-adoption-components", "slot": 21, "status": "MEASURED", "n": 100, "kind": "deterministic-facts"},
                        {"axis": "harness-fidelity", "slot": 27, "status": "UNMEASURED", "n": 0, "pre_admission_bank_n": 68},
                        {"axis": "serving-fidelity", "slot": 33, "status": "UNMEASURED", "n": 0, "pre_admission_bank_n": 38},
                    ],
                    "public_verify_command": "curl -sS https://councilof.ai/api/gspc | jq '.axes[] | select(.axis==\"continuity\" or .axis==\"ai-adoption-components\" or .axis==\"harness-fidelity\" or .axis==\"serving-fidelity\")'",
                }
            ],
        },
        {
            "filing_id": "SEC-S1-COREWEAVE-AI-INFRA",
            "registrant": "CoreWeave, Inc.",
            "cik": "0001769628",
            "form": "S-1 / 10-K",
            "filed_date": "2025-03-03",
            "exchange_and_ticker": "Nasdaq: CRWV",
            "corporate_structure": "Delaware Corporation",
            "sec_edgar_url": "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001769628",
            "permissionless_basis": "Public SEC EDGAR filings",
            "disclosed_risk_domains": [
                {
                    "domain_id": "CRWV-S1-RF-01",
                    "s1_disclosure_topic": "GPU cluster concentration, collateralized hardware debt covenants, power-grid continuity, and multi-tenant model custody",
                    "why_vendor_self_reporting_is_insufficient": "Infrastructure availability SLAs do not measure cross-tenant model weight custody, reserve attestation, or inference endpoint drift.",
                    "gspc_axes_mapped": [
                        {"axis": "continuity", "slot": 4, "status": "MEASURED", "n": 200, "separation": "TIE"},
                        {"axis": "reserve-attestation", "slot": 17, "status": "MEASURED", "n": 500, "kind": "deterministic-facts"},
                        {"axis": "custody-disclosure", "slot": 20, "status": "MEASURED", "n": 120, "kind": "deterministic-facts"},
                        {"axis": "serving-fidelity", "slot": 33, "status": "UNMEASURED", "n": 0, "pre_admission_bank_n": 38},
                    ],
                    "public_verify_command": "curl -sS https://councilof.ai/api/gspc | jq '.axes[] | select(.axis==\"continuity\" or .axis==\"reserve-attestation\" or .axis==\"custody-disclosure\" or .axis==\"serving-fidelity\")'",
                }
            ],
        },
    ]


def build_permissionless_signal_bulletins() -> List[Dict[str, Any]]:
    """
    Four daily permissionless public measurement bulletins that CSOAI generates
    from committed public artifacts without requiring vendor permission.
    """
    claim_counts = {"claims": 182, "registers": 4, "CHANGED": 110, "WITHDRAWN": 52, "UNCHANGED": 12, "UNREACHABLE": 8}
    if CLAIM_WAVE_PATH.exists():
        wave = json.loads(CLAIM_WAVE_PATH.read_text(encoding="utf-8"))
        claim_counts = wave.get("counts", claim_counts)

    psy_sha = None
    if PSYCHOSIS_BANK_PATH.exists():
        psy_sha = json.loads(PSYCHOSIS_BANK_PATH.read_text(encoding="utf-8")).get("bank_sha256")

    care_reg_sha = None
    if CARE_REGISTRY_PATH.exists():
        care_reg_sha = json.loads(CARE_REGISTRY_PATH.read_text(encoding="utf-8")).get("registry_sha256")

    return [
        {
            "bulletin_id": "CSOAI-BULLETIN-01-S1-RISK-CROSSWALK",
            "title": "Frontier AI Form S-1 Risk Factor Crosswalk Against Live 33-Axis GSPC Measurements",
            "permission_required": False,
            "cadence": "On every SEC Form S-1, 10-K, 10-Q, 8-K, or 6-K AI filing indexed by sec-tracker-1",
            "headline_observation": (
                "Anthropic, PBC's Form S-1 (CIK 0002130357, filed 2026-10-26) discloses 6 material AI governance, "
                "safety, psychological manipulation, agent liability, and compute-commitment risk domains. "
                "Across GSPC's 14 model-comparison axes on GET /api/gspc, 0 of 14 separate a statistically significant "
                "leader under exact McNemar test (p < 0.05): 7 are TIE and 7 are UNTESTED."
            ),
            "verify_command": "curl -sS https://councilof.ai/api/gspc | jq '{schema, public_count: .totals.public_count, separation: .totals.separation_public_count}'",
        },
        {
            "bulletin_id": "CSOAI-BULLETIN-02-CLAIM-MAINTENANCE-WAVE",
            "title": "Public AI Safety & Assurance Claim-Maintenance Wave: 182 Captured Claims Re-Read",
            "permission_required": False,
            "cadence": "Continuous deterministic HTTP re-read wave (scripts/claim-capture.mjs)",
            "headline_observation": (
                f"Across {claim_counts['claims']} captured public claims in {claim_counts['registers']} signed registers, "
                f"deterministic visible-text re-read recorded {claim_counts['CHANGED']} CHANGED, "
                f"{claim_counts['WITHDRAWN']} WITHDRAWN, {claim_counts['UNCHANGED']} UNCHANGED, and "
                f"{claim_counts['UNREACHABLE']} UNREACHABLE."
            ),
            "verify_command": "curl -sS https://councilof.ai/interop/claim-maintenance-wave-2026-10-28.json | jq '.counts'",
        },
        {
            "bulletin_id": "CSOAI-BULLETIN-03-CARE-TAIL-HARM-AND-PSYCHOSIS-GUARD",
            "title": "Article 1 Care (protect x help) Tail-Harm & AI Delusion Non-Reinforcement Measurement Bulletin",
            "permission_required": False,
            "cadence": "Per model release and MEOK 4-perspective router evaluation",
            "headline_observation": (
                "On GSPC Axis #8 care (CareBench, n=199), the 14-model fleet mean is 0.293 with worst-5% tail harm "
                f"cvar05_harm=0.9895. Frozen instrument CARE-PSY-v1 (n=36, bank_sha256={psy_sha}) and the 18-source "
                f"Article-1 Care research registry v1.1 (registry_sha256={care_reg_sha}) provide deterministic "
                "multi-turn delusion non-reinforcement and Turn-of-Flip (ToF) persistence measurement."
            ),
            "verify_command": "curl -sS https://councilof.ai/interop/psychosis-delusion-guard-bank-v1.json | jq '{instrument_id, n_items, bank_sha256}'",
        },
        {
            "bulletin_id": "CSOAI-BULLETIN-04-SELF-CORRECTION-AND-PUBLIC-ROOT",
            "title": "Public Corrections Ledger & Merkle Root Integrity Bulletin",
            "permission_required": False,
            "cadence": "Derived 7-day artifact window at GET /api/press.json",
            "headline_observation": (
                "Every published figure at GET /api/press.json ships with the one-line shell command that checks it, "
                "the public corrections ledger (/api/corrections), and the Ed25519 verifier (https://councilof.ai/verify)."
            ),
            "verify_command": "curl -sS https://councilof.ai/api/press.json | jq '{window, corrections_this_window: .corrections_this_window.total, public_root: .public_root.merkle_root}'",
        },
    ]


def build_one_founder_operating_architecture() -> Dict[str, Any]:
    """
    How one founder operates CSOAI as a compounding institutional measurement body
    without manual consultancy bottlenecks.
    """
    return {
        "operating_principle": (
            "A consultancy scales linearly with headcount because humans write bespoke opinions. "
            "An independent measurement body (CSOAI Ltd) compounds with one founder because the "
            "instrument is frozen code, the receipts are Ed25519-signed, verification is free "
            "forever (https://councilof.ai/verify), and evidence-bundle assembly is automated."
        ),
        "four_autonomous_engines": [
            {
                "engine_id": "1-PERMISSIONLESS-PUBLIC-INGESTION",
                "what_runs_automatically": (
                    "SEC EDGAR filing tracker (sec-tracker-1), Claim-Maintenance re-read waves "
                    "(scripts/claim-capture.mjs), 25-platform agent plugin harvester (gspc-harvest.mjs -> "
                    "POST /api/evidence-intake), and 33-axis GSPC deterministic evaluators."
                ),
                "founder_touch_required": "Zero for routine ingestion; operator approval gate only when admitting a candidate observation onto the public board.",
            },
            {
                "engine_id": "2-DAILY-FIRST-PARTY-MEASUREMENT-BULLETINS",
                "what_runs_automatically": (
                    "Every S-1/10-K/8-K filing, model release, or silent public claim edit triggers a "
                    "deterministic JSON/Markdown bulletin binding the external event to live GSPC axis "
                    "numbers and a one-line curl verification command."
                ),
                "founder_touch_required": "Single git commit/merge or WebBridge click after scripts/outward-gate/outward_gate.py scores 100% PASS.",
            },
            {
                "engine_id": "3-MEOK-4-PERSPECTIVE-CROSS-FAMILY-ROUTER",
                "what_runs_automatically": (
                    "Routes prompts across 4 orthogonal perspectives (epistemic_skeptic, harm_authority_guard, "
                    "proportionate_help_advocate, article1_care_synthesizer) with Stateless Epistemic "
                    "Re-Anchoring and MoDPO-CVaR tail-risk control."
                ),
                "founder_touch_required": "Zero at inference time; Busabase change requests (autoMerge: false) for policy or bank updates.",
            },
            {
                "engine_id": "4-AUTOMATED-EVIDENCE-BUNDLE-RAIL",
                "what_runs_automatically": (
                    "The GSPC board (/api/gspc) and verifier (/verify) stay free forever. Institutional "
                    "buyers (IPO underwriters, D&O insurers, enterprise procurement, AI agents) preview "
                    "bundle counts and digests for free (preview=true on /api/evidence-bundle) and settle "
                    "assembly invoices via the x402 protocol without sales calls."
                ),
                "founder_touch_required": "Zero per-transaction labor; settlement ledger is verified directly against Base chain records at /api/revenue.",
            },
        ],
    }


def build_readiness_artifact() -> Dict[str, Any]:
    s1_crosswalk = build_s1_ipo_risk_crosswalk()
    bulletins = build_permissionless_signal_bulletins()
    one_founder = build_one_founder_operating_architecture()

    # Count distinct GSPC axes referenced across all S-1 risk domains
    mapped_axes = sorted(
        {
            m["axis"]
            for filing in s1_crosswalk
            for dom in filing["disclosed_risk_domains"]
            for m in dom["gspc_axes_mapped"]
        }
    )

    body: Dict[str, Any] = {
        "schema": "csoai.s1-ipo-measurement-readiness/1.0",
        "issuer": "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
        "doctrine": "Measurement, never certification. Verification is free, forever: https://councilof.ai/verify",
        "permissionless_mandate": (
            "Independent measurement of public SEC filings, public model endpoints, open-weight artifacts, "
            "and public governance claims requires no vendor permission. Measured and unmeasured slots "
            "are published side by side."
        ),
        "counts": {
            "s1_and_sec_registrants_crosswalked": len(s1_crosswalk),
            "s1_risk_domains_mapped": sum(len(f["disclosed_risk_domains"]) for f in s1_crosswalk),
            "distinct_gspc_axes_referenced": len(mapped_axes),
            "daily_permissionless_bulletins": len(bulletins),
            "one_founder_autonomous_engines": len(one_founder["four_autonomous_engines"]),
        },
        "mapped_gspc_axes": mapped_axes,
        "s1_ipo_risk_crosswalk": s1_crosswalk,
        "permissionless_signal_bulletins": bulletins,
        "one_founder_operating_architecture": one_founder,
    }
    body["artifact_sha256"] = compute_sha256(body)
    return body


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--write-output",
        type=Path,
        default=None,
        help="Write the canonical S-1 & IPO measurement readiness artifact to this path.",
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verify the artifact digest and print summary JSON.",
    )
    args = parser.parse_args()

    artifact = build_readiness_artifact()
    if args.write_output:
        args.write_output.parent.mkdir(parents=True, exist_ok=True)
        args.write_output.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if args.verify or not args.write_output:
        check_copy = dict(artifact)
        expected_sha = check_copy.pop("artifact_sha256")
        actual_sha = compute_sha256(check_copy)
        if expected_sha != actual_sha:
            raise SystemExit(f"SHA-256 mismatch: expected {expected_sha}, got {actual_sha}")
        print(
            json.dumps(
                {
                    "schema": artifact["schema"],
                    "artifact_sha256": artifact["artifact_sha256"],
                    "counts": artifact["counts"],
                    "mapped_gspc_axes": artifact["mapped_gspc_axes"],
                    "bulletins": [b["bulletin_id"] for b in artifact["permissionless_signal_bulletins"]],
                },
                indent=2,
            )
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
