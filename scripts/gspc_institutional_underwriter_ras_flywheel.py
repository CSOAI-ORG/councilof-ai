#!/usr/bin/env python3
"""
GSPC Institutional Underwriter, x402 Bazaar, SaaS-to-RAS Flywheel, Frozen-to-Fluid
SAFE Charter Bridge, & MEOK/RSI-to-HITL Watchdog Router (v1.0).

Answers and operationalizes:
1. Why Vendor Self-Reporting Cannot Satisfy Institutional Buyers / Underwriters —
   and how CSOAI's permissionless <= 3072-byte signed receipts, 4-witness Merkle root
   ceremony (Rekor, OpenTimestamps, Base EAS, XRPL), and append-only corrections
   ledger satisfy institutional risk assurance.
2. How SaaS becomes RAS (Results / Risk-Assurance as a Service) across all 33 GSPC axes,
   9 industry domains (37+ sectors), 25 SKU manifest entries, and 28 x402 doors
   discoverable via Coinbase CDP Bazaar, PayAI Bazaar, and 402index.io.
3. Honest measured status and remediation plan for cobolbridge.ai (CSOAI-ORG/cobol-bridge-mcp,
   cobol.legacy SKU, SWIFT 17-bank census).
4. How frozen instruments + fluid dependency watches connect GSPC & Council OS to the
   SAFE Evidence & Re-verification Profile (safe-reverification/0.1-draft),
   csoai.alliance-control-plugin/0.2 (9-state lifecycle), and the 5 AAIF Agentic
   Commerce WG Recommendations (R1-R5).
5. Deterministic MEOK Hive / RSI Dream / Sovereign Space Simulation -> <= 3072-byte
   Signed Observation -> Role-Routed Human-in-the-Loop (HITL) & Public Watchdog Router.

Doctrine:
- Measurement, never certification. Verification is free forever at https://councilof.ai/verify
- Zero public prices on any public surface (no dollar sign followed by digits, no _cost keys).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from pathlib import Path
from typing import Any, Dict, List

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA = "csoai.institutional-underwriter-x402-ras-flywheel/1.0"
DEFAULT_OUT_PATH = REPO_ROOT / "public" / "interop" / "institutional-underwriter-x402-ras-flywheel-v1.json"
DEFAULT_HF_SPACE_DIR = REPO_ROOT / "spaces" / "gspc-board"
MAX_OBSERVATION_BYTES = 3072

CANONICAL_33_AXES: List[str] = [
    "governance",
    "safety",
    "provenance",
    "continuity",
    "conformance",
    "openness",
    "machinery-conformity",
    "care",
    "cross-reality",
    "detector-interop",
    "art5-safeguard",
    "swarm",
    "affect",
    "jail",
    "effect-binding",
    "provenance-controls",
    "reserve-attestation",
    "regulatory-framework",
    "distribution-integrity",
    "custody-disclosure",
    "ai-adoption-components",
    "labour-components",
    "humanoid-labour-index",
    "lab-practice",
    "company-practice",
    "measurer-integrity",
    "harness-fidelity",
    "interop-conformance",
    "humanoid-deployment",
    "regulator-transparency",
    "interpretability-reproducibility",
    "claim-maintenance",
    "serving-fidelity",
]


def canonical_json(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def build_vendor_self_reporting_vs_csoai_matrix() -> List[Dict[str, Any]]:
    return [
        {
            "dimension_id": "DIM_01_INDEPENDENCE_AND_CONFLICT_OF_INTEREST",
            "title": "Structural Independence vs. Vendor Self-Grading",
            "why_vendor_self_reporting_fails_underwriters": (
                "A model vendor grading its own model selects favorable prompt subsets, tunes hyperparameters "
                "against its own launch report, and has a structural conflict of interest."
            ),
            "how_csoai_satisfies_underwriters": (
                "CSOAI Ltd (UK 16939677) operates permissionlessly (permission_required: false) on frozen "
                "SHA-256-pinned banks and enforces EXCLUDED_OWN_MODEL in code so CSOAI's own routed harnesses "
                "never compete against third-party vendors on the public board."
            ),
            "verifiable_surface": "https://councilof.ai/api/gspc & functions/api/_gspc_SuppressOwnModel.ts",
        },
        {
            "dimension_id": "DIM_02_CONTINUOUS_3KB_RECEIPTS_VS_STALE_PDFS",
            "title": "Continuous <= 3,072-Byte Signed Receipts vs. Point-in-Time Launch PDFs",
            "why_vendor_self_reporting_fails_underwriters": (
                "Vendor system cards are static PDFs published at release; silent API weight updates, quantizations, "
                "or system-prompt edits invalidate the launch card without warning."
            ),
            "how_csoai_satisfies_underwriters": (
                "Every continuous probe, agent plugin harvest (gspc-harvest.mjs), and self-serve RAS read emits "
                "a compact <= 3,072-byte canonical JSON receipt (csoai.evidence-observation/0.1 or card-v0 leaf) "
                "bound by SHA-256 + Ed25519, paired with Day-7/30/90 scheduled Claim Maintenance."
            ),
            "verifiable_surface": "https://councilof.ai/api/evidence-intake & https://councilof.ai/api/claims/register",
        },
        {
            "dimension_id": "DIM_03_DISCRIMINATING_POWER_AND_PAIRED_CONTROLS",
            "title": "Paired Negative Controls & Exact McNemar Separation vs. Goodharted Single Metrics",
            "why_vendor_self_reporting_fails_underwriters": (
                "Vendors report single-number refusal rates (which reward 100% over-refusal) or unpinned crowd Elo "
                "(which rewards verbose sycophancy) without proving the test can fail or that point-estimate leads are statistically significant."
            ),
            "how_csoai_satisfies_underwriters": (
                "Enforces n_valid >= 30, mandatory designed-to-fail negative controls (otherwise state=NOT_DISCRIMINATING), "
                "multiplicative protect x help on Article-1 Care (CARE-PSY-v1), and exact McNemar discordant-item testing "
                "(SEPARATED iff p < 0.05; otherwise TIE)."
            ),
            "verifiable_surface": "https://councilof.ai/interop/article1-care-open-model-ablation-proof-v1.json",
        },
        {
            "dimension_id": "DIM_04_ONLINE_OFFLINE_ROOT_CEREMONY_AND_4_WITNESSES",
            "title": "Online + Offline Root Ceremony & 4 Independent External Witnesses",
            "why_vendor_self_reporting_fails_underwriters": (
                "Vendor blog posts and trust-center badges carry no detached cryptographic signature, no Merkle "
                "inclusion proof, and no external timestamp witness."
            ),
            "how_csoai_satisfies_underwriters": (
                "Every signed measurement card (did:web:csoai.org#card-attestation-1 / #board-attestation-1) rolls "
                "into public/root.json (RFC 6962 Merkle root) and is anchored across Sigstore Rekor, Bitcoin "
                "OpenTimestamps (.ots), Base EAS, and XRPL Memo Ledger, verifiable offline or in-browser at /verify."
            ),
            "verifiable_surface": "https://councilof.ai/root.json & https://councilof.ai/verify",
        },
        {
            "dimension_id": "DIM_05_APPEND_ONLY_CORRECTIONS_AND_SUPERSESSION",
            "title": "Append-Only Public Corrections Ledger vs. Silent In-Place Edits",
            "why_vendor_self_reporting_fails_underwriters": (
                "When a vendor benchmark has a bug, the PDF or webpage is silently overwritten without preserving "
                "the superseded bytes or notifying downstream underwriters."
            ),
            "how_csoai_satisfies_underwriters": (
                "Records are never edited in place. Every correction is published at GET /api/corrections with "
                "supersedes[] naming the prior record ID and SHA-256 while keeping the superseded bytes resolvable."
            ),
            "verifiable_surface": "https://councilof.ai/api/corrections & https://councilof.ai/corrections",
        },
        {
            "dimension_id": "DIM_06_RUNTIME_EFFECT_BINDING_AND_HITL_AUTHORITY",
            "title": "Runtime Effect Binding (@csoai/layer0) & HITL Pre-Effect Commitment",
            "why_vendor_self_reporting_fails_underwriters": (
                "Model-level benchmarks do not prove whether a deployed agent actually bound its executed tool call "
                "to a human authorization or whether a declined approval stopped execution."
            ),
            "how_csoai_satisfies_underwriters": (
                "In our 600-server remote MCP probe, 238 of 261 graded servers failed effect binding (BINDS: 0). "
                "CSOAI provides @csoai/layer0 (CH-01..CH-16) to enforce pre-effect commitment, argument-swap/replay "
                "rejection, and mandatory human approvalReceipt on consequential actions."
            ),
            "verifiable_surface": "https://councilof.ai/interop/effect-binding-server-probe-2026-09-22.signed.json",
        },
    ]


def build_root_ceremony_and_witness_posture() -> Dict[str, Any]:
    root_path = REPO_ROOT / "public" / "root.json"
    root_data = json.loads(root_path.read_text(encoding="utf-8")) if root_path.exists() else {}
    return {
        "public_root_path": "public/root.json",
        "public_root_present": root_path.exists(),
        "merkle_root": root_data.get("merkle_root") or root_data.get("root"),
        "pinned_did_document": "did:web:csoai.org",
        "pinned_verification_keys": [
            "did:web:csoai.org#card-attestation-1",
            "did:web:csoai.org#card-attestation-2",
            "did:web:csoai.org#board-attestation-1",
        ],
        "four_external_witness_layers": [
            {
                "witness_id": "WITNESS_01_SIGSTORE_REKOR",
                "mechanism": "Sigstore Rekor transparency log inclusion receipt (RFC 9162 / SCITT signed statement)",
                "evidence_artifact": "docs/standards/osaia-safe-evidence-pack/FREEZE.rekor.json",
            },
            {
                "witness_id": "WITNESS_02_BITCOIN_OPENTIMESTAMPS",
                "mechanism": "OpenTimestamps (.ots) calendar commitment upgraded against Bitcoin block header Merkle roots",
                "evidence_artifact": "GET /api/pop/ots-proofs & verify_safe_evidence.py checks 5-7",
            },
            {
                "witness_id": "WITNESS_03_BASE_EAS",
                "mechanism": "Ethereum Attestation Service (EAS) on Base (eip155:8453) schema-pinned digest anchor",
                "evidence_artifact": "public/.well-known/anchor-posture.json",
            },
            {
                "witness_id": "WITNESS_04_XRPL_MEMO_LEDGER",
                "mechanism": "XRP Ledger (XRPL) finalized ledger memo anchor & basket root (xrpl.basket.root)",
                "evidence_artifact": "GET /api/pop/xrpl & public/interop/sku-manifest.json#xrpl-basket-root",
            },
        ],
        "seven_step_online_offline_verification_recipe": [
            "1. sha256(record.json) == digest inside signed payload (offline deterministic)",
            "2. sha256(canonical(payload)) == signed payload_sha256 (offline deterministic)",
            "3. Ed25519 signature verifies under pinned did:web:csoai.org key (offline or online)",
            "4. Negative tamper controls reject trailing byte, zeroed digest, and 1-bit flip (offline deterministic)",
            "5. .ots proof parses and binds to sha256(record.json) (offline deterministic)",
            "6. Read-only calendar check reports whether pending commitment upgraded to Bitcoin block height (online read-only)",
            "7. Upgraded commitment matches Bitcoin block header Merkle root (online or local Bitcoin node)",
        ],
    }


def build_saas_to_ras_and_x402_bazaar_flywheel() -> Dict[str, Any]:
    sku_manifest_path = REPO_ROOT / "public" / "interop" / "sku-manifest.json"
    x402_desc_path = REPO_ROOT / "functions" / "api" / "x402-descriptions.json"
    sku_manifest = json.loads(sku_manifest_path.read_text(encoding="utf-8"))
    x402_desc = json.loads(x402_desc_path.read_text(encoding="utf-8"))

    return {
        "paradigm_shift": {
            "legacy_saas_model": "Per-seat subscriptions for static dashboards where buyers still perform manual audits and rely on vendor self-assertions.",
            "csoai_ras_model": (
                "Results / Risk-Assurance as a Service (RAS): zero seats, free board (/api/gspc), free verifier (/verify), "
                "and free previews (?preview=1). Agents and institutional underwriters settle per delivered, Ed25519-signed "
                "computation or evidence bundle via x402 v2 (USDC on Base eip155:8453) or enterprise invoice."
            ),
            "ras_execution_order": "402 challenge -> SSRF & input check -> deterministic compute -> Ed25519 sign -> x402 facilitator settle -> deliver",
            "fail_closed_billing_rule": "If our side cannot run the read (DNS unreadable, RPC down, signer error), nothing is settled.",
        },
        "catalog_counts": {
            "sku_manifest_entries": len(sku_manifest.get("skus", [])),
            "x402_described_doors": len(x402_desc),
            "allowed_sellables": ["issuance", "assembly", "independent-signature", "throughput-and-cadence"],
            "never_sold_invariants": [
                "a grade",
                "a score",
                "a pass/fail verdict",
                "a certificate of conformity",
                "verification (free forever)",
                "a place on the board",
            ],
        },
        "agent_discovery_and_bazaar_indexes": [
            {
                "index_id": "INDEX_01_WELL_KNOWN_AND_API_X402",
                "endpoint": "https://councilof.ai/.well-known/x402.json & https://councilof.ai/api/x402",
                "role": "Canonical machine catalog (csoai.x402-catalog/0.3) advertising every payable resource and free_preview URL.",
            },
            {
                "index_id": "INDEX_02_COINBASE_CDP_BAZAAR",
                "endpoint": "api.cdp.coinbase.com/platform/v2/x402/{verify,settle}",
                "role": "Discovers v2 PaymentRequired responses carrying conformant extensions.bazaar { info, schema }.",
            },
            {
                "index_id": "INDEX_03_PAYAI_BAZAAR",
                "endpoint": "https://councilof.ai/api/x402-listing",
                "role": "Indexes v2 settles echoing extensions.bazaar; CSOAI audits both CDP and PayAI daily (2,694 hosts probed).",
            },
            {
                "index_id": "INDEX_04_402INDEX_IO",
                "endpoint": "https://councilof.ai/api/x402-listing-402index",
                "role": "Authless registration loop (register-402index.py) registering .well-known/x402.json resources for agent lookup.",
            },
            {
                "index_id": "INDEX_05_SIGNED_DAILY_X402_CONFORMANCE_INDEX",
                "endpoint": "https://councilof.ai/api/x402/index",
                "role": "Serves the signed daily x402 Bazaar conformance leaf (csoai/x402-bazaar-conformance) free to all agents.",
            },
        ],
        "industry_sector_to_33_axis_ras_crosswalk": [
            {
                "domain_id": "finance_and_banking",
                "sectors": ["Credit scoring", "Algorithmic trading", "AML / fraud detection", "Robo-advice", "SWIFT / RWA / Stablecoins"],
                "binding_frameworks": ["EU AI Act (high-risk)", "DORA", "SR 11-7", "MiFID II", "SEC Reg SCI"],
                "primary_gspc_axes": ["governance", "reserve-attestation", "custody-disclosure", "effect-binding", "provenance-controls", "claim-maintenance"],
                "ras_doors": ["/api/evidence-bundle?obligation=dora", "/api/rwa/evidence", "/api/wrapper", "/api/ras/supply", "/api/pop/swift"],
            },
            {
                "domain_id": "insurance_and_actuarial",
                "sectors": ["Life & health underwriting", "Pricing & rating models", "Claims triage", "Fraud detection", "Policyholder chat"],
                "binding_frameworks": ["NAIC Model Bulletin", "Colorado SB21-169", "EU AI Act (high-risk)", "ISO 42001"],
                "primary_gspc_axes": ["governance", "safety", "care", "affect", "conformance", "claim-maintenance", "measurer-integrity"],
                "ras_doors": ["/api/request-attestation", "/api/evidence-bundle?obligation=article-53", "/api/feeds/provider-diff", "/api/receipts/batch"],
            },
            {
                "domain_id": "health_and_life_sciences",
                "sectors": ["Clinical diagnosis AI", "Medical devices", "Drug discovery", "Mental health & crisis support"],
                "binding_frameworks": ["FDA SaMD", "EU MDR", "IEC 62304", "HIPAA", "EU AI Act (high-risk)"],
                "primary_gspc_axes": ["care", "affect", "safety", "art5-safeguard", "interpretability-reproducibility", "serving-fidelity"],
                "ras_doors": ["/interop/psychosis-delusion-guard-bank-v1.json", "/interop/article1-care-open-model-ablation-proof-v1.json", "/api/request-attestation"],
            },
            {
                "domain_id": "critical_infra_and_robotics",
                "sectors": ["Energy grid control", "Water systems", "Autonomous vehicles", "Humanoid & industrial robotics"],
                "binding_frameworks": ["EU Machinery Regulation 2023/1230", "NERC CIP", "IEC 62443", "ISO 21448", "EU CRA"],
                "primary_gspc_axes": ["machinery-conformity", "humanoid-deployment", "humanoid-labour-index", "continuity", "effect-binding", "swarm"],
                "ras_doors": ["/api/evidence-bundle?obligation=cra", "/api/ras/mcp-probe", "/api/measurement/fresh-capsule"],
            },
            {
                "domain_id": "consumer_media_and_agent_platforms",
                "sectors": ["Generative content", "Chatbots / agents", "Recommender systems", "Multi-agent toolchains"],
                "binding_frameworks": ["EU AI Act Art. 50", "C2PA 2.1", "DSA", "OWASP Agentic Top 10"],
                "primary_gspc_axes": ["provenance", "detector-interop", "cross-reality", "jail", "swarm", "interop-conformance", "harness-fidelity"],
                "ras_doors": ["/api/art50/marking-evidence", "/api/evidence-bundle?obligation=article-50", "/api/ras/mcp-probe", "/api/pop/mcp-registry"],
            },
        ],
    }


def build_cobolbridge_status_and_assurance_plan() -> Dict[str, Any]:
    readme_path = REPO_ROOT / "packages" / "cobol-bridge" / "README.md"
    readme_text = readme_path.read_text(encoding="utf-8").strip() if readme_path.exists() else ""
    return {
        "package_path": "packages/cobol-bridge/README.md",
        "donor_repository": "CSOAI-ORG/cobol-bridge-mcp",
        "sku_manifest_id": "cobol-legacy",
        "sku_surface": "cobol.legacy",
        "honest_measured_state": {
            "cobolbridge_ai_apex": "HTTP_522_ORIGIN_TIMEOUT (custom domain not yet bound to Cloudflare Pages project cobolbridge-site)",
            "pages_origin_cobolbridge_site_pages_dev": "HTTP_200_MARKETING_LANDING (not yet a measured mill)",
            "swift_17_bank_census": "DISCOVERED_AT_GET_API_SWIFT (pop_swift)",
        },
        "recorded_note": readme_text,
        "three_step_remediation_and_ras_integration": [
            "1. Bind custom domain cobolbridge.ai to Cloudflare Pages project cobolbridge-site and add health probe in csoai_console.py so HTTP 522 is eliminated.",
            "2. Wrap CSOAI-ORG/cobol-bridge-mcp copybook-to-ISO-20022 (swift-mt103 / mt202 / mt760) AST transformations in @csoai/layer0 governedLocal so every translation emits a <= 3,072-byte Ed25519-signed cobol.legacy parity receipt.",
            "3. Expose GET /api/ras/cobol-parity?preview=1 as a free preview and x402 RAS door for banking and insurance underwriters modernizing mainframe workloads under DORA and SR 11-7.",
        ],
    }


def build_frozen_to_fluid_safe_and_lfx_bridge() -> Dict[str, Any]:
    return {
        "architectural_principle": (
            "Test instruments, statutory text hashes, and Charter controls stay FROZEN (SHA-256-pinned); "
            "dependency watches, runtime OTel traces, and bounded re-tests make regulatory evidence FLUID."
        ),
        "safe_reverification_profile": {
            "profile_id": "safe-reverification/0.1-draft",
            "source_doc": "docs/standards/OSAIA-RFC-SAFE-evidence-reverification-profile-DRAFT.md",
            "result_states": ["PASS", "FAIL", "PARTIAL", "UNMEASURED", "NOT_DISCRIMINATING"],
            "watch_expired_states": ["STALE", "UNMEASURED"],
            "standards_reused": [
                "IETF SCITT (RFC 9943 Signed Statement)",
                "COSE_Sign1 (RFC 9052)",
                "in-toto Attestation Statement v1 / DSSE",
                "OpenTelemetry GenAI Semantic Conventions (gen_ai.* / mcp.*)",
                "OpenTimestamps (.ots) & RFC 3161",
                "CycloneDX 1.6 / SPDX 3.0.1 / purl",
            ],
        },
        "alliance_control_plugin_9_state_lifecycle": {
            "schema": "csoai.alliance-control-plugin/0.2",
            "source_doc": "docs/standards/osaia-safe-reverification/csoai-alliance-control-plugin-v0.2.json",
            "states": [
                "DISCOVERED",
                "MEASURED",
                "QUALIFIED",
                "ROUTABLE",
                "AUTHORIZED",
                "EXECUTED",
                "EFFECT_OBSERVED",
                "VERIFIED",
                "CLAIM_CURRENT",
            ],
            "strict_separation_rules": [
                "DISCOVERED is not MEASURED",
                "MEASURED is not AUTHORIZED",
                "AUTHORIZED is not EXECUTED",
                "EXECUTED is not EFFECT_OBSERVED",
                "EFFECT_OBSERVED is not VERIFIED",
                "VERIFIED is not a certificate",
                "payment or signature never grants execution authority",
            ],
        },
        "aaif_agentic_commerce_5_recommendations": [
            "R1: Deployed population conformance check (read-only, reproducible, e.g., 2,694 x402 hosts probed) as a hosting input.",
            "R2: Pin one normative location for payment challenges (resolve header vs. body divergence across 1,012 hosts).",
            "R3: Behavioral transaction binding tested by argument-swap and replay probes (238/261 remote MCP servers failed binding).",
            "R4: Merchant receipts with per-section evidence states (third-party / self-asserted / absent) and UNCHECKED outcome first-class.",
            "R5: Renewed approval decline/cancel must produce zero effect and be tested in every conformance suite.",
        ],
    }


HITL_AND_WATCHDOG_LANES: List[Dict[str, Any]] = [
    {
        "lane_id": "LANE_01_CLINICAL_AND_CARE_SAFEGUARD_STEWARD",
        "human_role": "Clinical & Article-1 Care Safeguard Steward (HITL)",
        "routed_axes": ["care", "affect", "art5-safeguard", "cross-reality"],
        "sources_accepted": ["MEOK_4_PERSPECTIVE_HIVE", "RSI_DREAM_SIMULATION", "AGENT_PLUGIN_HARVEST", "HUMAN_END_USER"],
        "mandatory_action": "Review multi-turn ToF/NoF delusion non-reinforcement & crisis escalation traces before any bank or routing update (CH-02, CH-09).",
    },
    {
        "lane_id": "LANE_02_CONSTITUTIONAL_EFFECT_AND_XRAIV_APPROVER",
        "human_role": "Constitutional Effect & XRAIV Authority Approver (HITL)",
        "routed_axes": ["governance", "safety", "continuity", "effect-binding", "swarm", "jail", "machinery-conformity", "humanoid-deployment"],
        "sources_accepted": ["MEOK_4_PERSPECTIVE_HIVE", "RSI_DREAM_SIMULATION", "SOVEREIGN_SPACE_CITY_COLISEUM", "AGENT_PLUGIN_HARVEST"],
        "mandatory_action": "Verify pre-effect commitment (CH-04), argument-swap/replay resistance, and human approvalReceipt before irreversible execution.",
    },
    {
        "lane_id": "LANE_03_FINANCIAL_RWA_AND_COBOL_ASSURANCE_AUDITOR",
        "human_role": "Financial, RWA, & Legacy Mainframe Assurance Auditor (HITL)",
        "routed_axes": ["reserve-attestation", "custody-disclosure", "ai-adoption-components", "labour-components", "humanoid-labour-index"],
        "sources_accepted": ["RAS_FRESH_READ", "COBOL_BRIDGE_PARITY", "SEC_S1_10K_CLAIM_HARVEST"],
        "mandatory_action": "Cross-check dual-operator block finality, EIP-1186 storage proofs, XRPL trustlines, and COBOL-to-ISO-20022 parity receipts.",
    },
    {
        "lane_id": "LANE_04_PROVENANCE_AIBOM_AND_SUPPLY_CHAIN_REVIEWER",
        "human_role": "Provenance, AI-BOM, & MCP Supply-Chain Reviewer (HITL)",
        "routed_axes": ["provenance", "openness", "detector-interop", "provenance-controls", "distribution-integrity", "interop-conformance"],
        "sources_accepted": ["PRODUCT_B_MCP_DIFF", "PRODUCT_C_AIBOM", "ART50_MARKING_PROBE"],
        "mandatory_action": "Validate C2PA/IPTC detections, CycloneDX 1.6 / SPDX 3.0.1 digests, and MCP tool-hash drift triggers (CH-05).",
    },
    {
        "lane_id": "LANE_05_BENCHMARK_AND_MEASURER_INTEGRITY_CURATOR",
        "human_role": "Benchmark & Measurer-Integrity Curator (HITL)",
        "routed_axes": ["conformance", "lab-practice", "company-practice", "measurer-integrity", "harness-fidelity", "interpretability-reproducibility", "serving-fidelity"],
        "sources_accepted": ["AXIS_26_META_BENCHMARK", "CSOAI_CONSOLE_CENSUS", "PAIRED_ABLATION_PROVER"],
        "mandatory_action": "Verify n_valid >= 30, negative-control failure as designed, and exact McNemar p < 0.05 before admitting any card to public/root.json (CH-06).",
    },
    {
        "lane_id": "LANE_06_PUBLIC_WATCHDOG_AND_CORRECTIONS_OFFICER",
        "human_role": "Public Watchdog, Regulatory Drift, & Corrections Officer (HITL)",
        "routed_axes": ["regulatory-framework", "regulator-transparency", "claim-maintenance"],
        "sources_accepted": ["TINYFISH_WEB_WALK", "PROVIDER_DIFF_FEED", "PUBLIC_WATCHDOG_SUBMISSION", "SAFE_REVERIFICATION_WATCH"],
        "mandatory_action": "Publish side-by-side claim vs. measured observation on Day-7/30/90 schedule and issue append-only supersedes[] records at /api/corrections (CH-14, CH-16).",
    },
]


def route_observation_to_hitl_and_watchdog(observation: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deterministic router that takes a candidate observation from MEOK hives,
    RSI Dream / Sovereign Space simulations (Coliseum / Council City), 25-platform
    agent plugins, or human end-users, enforces the <= 3,072-byte capsule ceiling
    and contamination wall, and routes it to the exact Human-in-the-Loop (HITL)
    authority role and public watchdog queue.
    """
    raw_bytes = canonical_json(observation).encode("utf-8")
    byte_length = len(raw_bytes)
    if byte_length > MAX_OBSERVATION_BYTES:
        raise ValueError(f"Observation exceeds {MAX_OBSERVATION_BYTES}-byte capsule limit ({byte_length} bytes)")

    axis = str(observation.get("axis", "")).strip()
    if axis not in CANONICAL_33_AXES:
        raise ValueError(f"Unknown or non-canonical GSPC axis: {axis!r}")

    matched_lane = None
    for lane in HITL_AND_WATCHDOG_LANES:
        if axis in lane["routed_axes"]:
            matched_lane = lane
            break

    if matched_lane is None:
        raise RuntimeError(f"No HITL lane configured for canonical axis {axis!r}")

    obs_sha256 = sha256_hex(canonical_json(observation))
    return {
        "schema": "csoai.hitl-watchdog-dispatch/1.0",
        "observation_sha256": obs_sha256,
        "payload_bytes": byte_length,
        "max_bytes_allowed": MAX_OBSERVATION_BYTES,
        "within_3kb_ceiling": byte_length <= MAX_OBSERVATION_BYTES,
        "axis": axis,
        "source_origin": observation.get("source_origin", "AGENT_PLUGIN_HARVEST"),
        "routed_lane_id": matched_lane["lane_id"],
        "assigned_human_role": matched_lane["human_role"],
        "mandatory_hitl_action": matched_lane["mandatory_action"],
        "intake_state": "AWAITING_OPERATOR_REVIEW",
        "measurement_state": "UNMEASURED",
        "writes_board": False,
        "model_training": False,
        "public_watchdog_surface": "https://councilof.ai/api/claims/register & https://councilof.ai/api/corrections",
    }


def build_sample_routed_observations() -> List[Dict[str, Any]]:
    samples = [
        {
            "source_origin": "MEOK_4_PERSPECTIVE_HIVE",
            "axis": "care",
            "subject": "ollama:qwen3.5:9b",
            "instrument": "CARE-PSY-v1",
            "summary": "4-perspective stateless re-anchoring vetoed Turn-3 clinical delusion reinforcement while preserving benign help.",
        },
        {
            "source_origin": "SOVEREIGN_SPACE_CITY_COLISEUM",
            "axis": "effect-binding",
            "subject": "council-city-red-vs-blue-sim-40x40",
            "instrument": "XRAIV-CH04-v1",
            "summary": "Simulated argument-swap probe on consequential execute_transfer action blocked pending human approvalReceipt.",
        },
        {
            "source_origin": "RSI_DREAM_SIMULATION",
            "axis": "measurer-integrity",
            "subject": "csoai-gspc-33-suite",
            "instrument": "AXIS-26-META-v1",
            "summary": "Automated negative-control mutation confirmed grader rejects designed-to-fail fixture before daily batch run.",
        },
        {
            "source_origin": "TINYFISH_WEB_WALK",
            "axis": "claim-maintenance",
            "subject": "frontier-vendor-s1-filing",
            "instrument": "CLAIM-MAINT-v0.1",
            "summary": "Captured dated public safety claim digest for Day-7/30/90 re-verification watch.",
        },
    ]
    return [route_observation_to_hitl_and_watchdog(s) for s in samples]


def build_flywheel_artifact() -> Dict[str, Any]:
    routed_axes_union = sorted({ax for lane in HITL_AND_WATCHDOG_LANES for ax in lane["routed_axes"]})
    assert routed_axes_union == sorted(CANONICAL_33_AXES), "HITL lanes must cover all 33 canonical GSPC axes"

    vendor_matrix = build_vendor_self_reporting_vs_csoai_matrix()
    ceremony = build_root_ceremony_and_witness_posture()
    ras_flywheel = build_saas_to_ras_and_x402_bazaar_flywheel()
    cobolbridge = build_cobolbridge_status_and_assurance_plan()
    safe_bridge = build_frozen_to_fluid_safe_and_lfx_bridge()
    sample_dispatches = build_sample_routed_observations()

    body = {
        "schema": SCHEMA,
        "issuer": "CSOAI Ltd (UK Companies House 16939677)",
        "generated_on": "2026-10-29",
        "counts": {
            "underwriter_comparison_dimensions": len(vendor_matrix),
            "external_root_witnesses": len(ceremony["four_external_witness_layers"]),
            "online_offline_verification_steps": len(ceremony["seven_step_online_offline_verification_recipe"]),
            "sku_manifest_entries": ras_flywheel["catalog_counts"]["sku_manifest_entries"],
            "x402_described_doors": ras_flywheel["catalog_counts"]["x402_described_doors"],
            "bazaar_and_discovery_indexes": len(ras_flywheel["agent_discovery_and_bazaar_indexes"]),
            "hitl_watchdog_routing_lanes": len(HITL_AND_WATCHDOG_LANES),
            "canonical_gspc_axes_routed_to_hitl": len(routed_axes_union),
            "max_observation_capsule_bytes": MAX_OBSERVATION_BYTES,
        },
        "vendor_self_reporting_vs_csoai_underwriter_matrix": vendor_matrix,
        "online_offline_root_ceremony_and_4_witnesses": ceremony,
        "saas_to_ras_and_x402_bazaar_flywheel": ras_flywheel,
        "cobolbridge_and_legacy_enterprise_assurance": cobolbridge,
        "frozen_to_fluid_safe_and_lfx_bridge": safe_bridge,
        "hitl_and_public_watchdog_routing_lanes": HITL_AND_WATCHDOG_LANES,
        "sample_meok_rsi_and_watchdog_dispatches": sample_dispatches,
        "framing": "Measurement, never certification. Anyone can re-check at https://councilof.ai/verify",
    }
    digest = sha256_hex(canonical_json(body))
    return {**body, "flywheel_sha256": digest}


def main() -> int:
    parser = argparse.ArgumentParser(description="GSPC Institutional Underwriter, x402 RAS Flywheel & HITL Router")
    parser.add_argument("--write", type=Path, default=None, help="Write JSON artifact to path")
    parser.add_argument("--sync-hf-space", action="store_true", help="Mirror artifact into spaces/gspc-board/")
    parser.add_argument("--verify", action="store_true", help="Print verification summary")
    args = parser.parse_args()

    artifact = build_flywheel_artifact()
    if args.write:
        args.write.parent.mkdir(parents=True, exist_ok=True)
        args.write.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if args.sync_hf_space:
        DEFAULT_HF_SPACE_DIR.mkdir(parents=True, exist_ok=True)
        src = args.write if args.write and args.write.exists() else DEFAULT_OUT_PATH
        shutil.copyfile(src, DEFAULT_HF_SPACE_DIR / "institutional-underwriter-x402-ras-flywheel-v1.json")

    if args.verify:
        print(
            json.dumps(
                {
                    "schema": artifact["schema"],
                    "flywheel_sha256": artifact["flywheel_sha256"],
                    "counts": artifact["counts"],
                },
                indent=2,
            )
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
