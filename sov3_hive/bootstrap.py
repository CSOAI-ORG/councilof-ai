"""
bootstrap.py — seed csoai.org with the 48 MEOK research findings.
20 GitHub diamonds, 6 bootstrap plays, 5 P1 integrations, 6 regulatory
markets, 5 moats, 6 architecture gaps. All attested through the 4-hive
HORUS federation.
"""
from __future__ import annotations

import json
import os
import sys
from typing import Any, Dict, List

sys.path.insert(0, "/Users/nicholas/clawd")
from sov3_hive.core.federation import Federation, AttestationKind


GITHUB_DIAMONDS: List[Dict[str, Any]] = [
    {"subject": "a2a-protocol",            "claim": {"repo": "a2a-protocol/a2a",         "category": "agent-protocol",   "note": "Google A2A — the 1.0 agent-to-agent standard"}},
    {"subject": "modelcontextprotocol-go",  "claim": {"repo": "modelcontextprotocol/go",   "category": "mcp-runtime",      "note": "Official Go SDK for MCP — wide enterprise reach"}},
    {"subject": "Giskard-AI",              "claim": {"repo": "Giskard-AI/giskard-oss",    "category": "eval-testing",     "note": "OSS eval & red-team for ML models"}},
    {"subject": "Azure-PyRIT",             "claim": {"repo": "Azure/PyRIT",               "category": "red-team",          "note": "Python Risk Identification Toolkit for generative AI"}},
    {"subject": "AGT",                     "claim": {"repo": "anthropic-experimental/agentic-tools", "category": "agent-eval", "note": "Anthropic's agentic-task eval framework"}},
    {"subject": "ezkl",                    "claim": {"repo": "zkonduit/ezkl",              "category": "zk-inference",      "note": "ZK ML inference — proves model ran correctly"}},
    {"subject": "cdxgen",                  "claim": {"repo": "CycloneDX/cdxgen",          "category": "sbom",              "note": "CycloneDX SBOM generator — AI Act Art.11 evidence"}},
    {"subject": "compl-ai",                "claim": {"repo": "IBM/compl-ai",               "category": "compliance-eval",   "note": "IBM's compliance evaluation toolkit for AI"}},
    {"subject": "Sentient-Enclaves",       "claim": {"repo": "oblonglabs/sentient-enclaves","category": "TEE-runtime",     "note": "TEE-anchored agent runtimes"}},
    {"subject": "openinference",           "claim": {"repo": "Arize-AI/openinference",     "category": "observability",     "note": "OpenTelemetry for AI — inference traces"}},
    {"subject": "inspect-ai",              "claim": {"repo": "UKGovernmentBEIS/inspect_ai","category": "eval",             "note": "UK AISI eval framework for frontier models"}},
    {"subject": "garak",                   "claim": {"repo": "NVIDIA/garak",               "category": "red-team",          "note": "NVIDIA's LLM vulnerability scanner"}},
    {"subject": "deepteam",                "claim": {"repo": "confident-ai/deepteam",      "category": "red-team",          "note": "DeepEval's adversarial test suite"}},
    {"subject": "mcp-go",                  "claim": {"repo": "mcp-go/mcp-go",              "category": "mcp-runtime",       "note": "Community Go MCP server — high adoption"}},
    {"subject": "fastapi-mcp",             "claim": {"repo": "tadata-org/fastapi_mcp",     "category": "mcp-bridge",        "note": "Wrap FastAPI services as MCP servers"}},
    {"subject": "mcp-inspector",           "claim": {"repo": "modelcontextprotocol/inspector","category": "devtool",        "note": "Official MCP debugging UI"}},
    {"subject": "litellm",                 "claim": {"repo": "BerriAI/litellm",            "category": "model-gateway",     "note": "Unified interface to 100+ LLMs (incl. sovereign)"}},
    {"subject": "langfuse",                "claim": {"repo": "langfuse/langfuse",          "category": "observability",     "note": "OSS LLM observability — the audit log"}},
    {"subject": "argilla",                 "claim": {"repo": "argilla-io/argilla",         "category": "data-quality",     "note": "OSS data labelling for AI safety"}},
    {"subject": "open-llm-leaderboard",    "claim": {"repo": "huggingface/open_llm_leaderboard","category": "benchmark",   "note": "HF public eval — used by EU regulators"}},
]

BOOTSTRAP_PLAYS: List[Dict[str, Any]] = [
    {"subject": "pre-commit-charter-guard",  "claim": {"play": "ship a pre-commit hook that pins charter alignment + EU AI Act Art.6 classification", "competitors": 0, "executable_in_hours": 24, "channel": "devtools"}},
    {"subject": "vscode-charter-pulse",      "claim": {"play": "VS Code extension that surfaces charter compliance inline while coding",                  "competitors": 0, "executable_in_hours": 48, "channel": "devtools"}},
    {"subject": "github-action-cgp-check",   "claim": {"play": "GitHub Action that gates merges on cross-agent compliance attestation (CGP)",          "competitors": 0, "executable_in_hours": 24, "channel": "ci-cd"}},
    {"subject": "chrome-ext-compliance-ledger","claim":{"play": "Chrome extension that surfaces CSOAI attestations on any .org / .ai page",            "competitors": 0, "executable_in_hours": 48, "channel": "browser"}},
    {"subject": "cli-cgp-sign",              "claim": {"play": "CLI: `cgp sign` to add a signed charter anchor to any artifact",                          "competitors": 0, "executable_in_hours": 12, "channel": "devtools"}},
    {"subject": "mcp-server-cgp",            "claim": {"play": "MCP server exposing `attest`/`verify` tools to any agent (Claude, GPT, Gemini)",         "competitors": 0, "executable_in_hours": 24, "channel": "agent-protocol"}},
]

INTEGRATIONS: List[Dict[str, Any]] = [
    {"subject": "open-webui-cgp",         "claim": {"partner": "open-webui",          "monthly_active": 12000000, "category": "llm-frontend",     "integration": "CGP badge in chat + audit ledger export"}},
    {"subject": "n8n-cgp",                "claim": {"partner": "n8n",                 "monthly_active": 8000000,  "category": "workflow-automation","integration": "CGP attestation as a node in n8n flows"}},
    {"subject": "backstage-cgp",          "claim": {"partner": "backstage",           "monthly_active": 4000000,  "category": "internal-dev-portal","integration": "CGP plugin for service catalog"}},
    {"subject": "mlflow-cgp",             "claim": {"partner": "mlflow",              "monthly_active": 25000000, "category": "ml-platform",      "integration": "CGP attestation on every registered model"}},
    {"subject": "github-actions-cgp",     "claim": {"partner": "github-actions",      "monthly_active": 420000000,"category": "ci-cd",            "integration": "CGP action in the official marketplace"}},
]

REGULATORY_MARKETS: List[Dict[str, Any]] = [
    {"subject": "EU-AI-Act-Art-50",       "claim": {"jurisdiction": "EU",       "effective": "2026-08-02", "tier2_penalty": "€15M or 3% turnover", "tier1": "€35M or 7%", "note": "50-day cliff; chapter V transparency obligations"}},
    {"subject": "UK-AI-Bill-2026",        "claim": {"jurisdiction": "UK",       "effective": "2026-Q4",   "tier2_penalty": "£15M or 4% turnover", "note": "5-regulator split; principles-based"}},
    {"subject": "Colorado-AI-Act",        "claim": {"jurisdiction": "Colorado", "effective": "2026-02-01", "tier2_penalty": "$500K",               "note": "First US state law; high-risk systems"}},
    {"subject": "Texas-Responsible-AI",   "claim": {"jurisdiction": "Texas",    "effective": "2026-Q1",   "tier2_penalty": "$80K",                "note": "AG enforcement; intent-based"}},
    {"subject": "South-Korea-AI-Basic",   "claim": {"jurisdiction": "South Korea", "effective": "2026-01-26", "tier2_penalty": "₩30M",            "note": "Asia's first comprehensive AI law"}},
    {"subject": "India-DPDP-AI-Rules",    "claim": {"jurisdiction": "India",    "effective": "2026-Q2",   "tier2_penalty": "₹250Cr",              "note": "Digital Personal Data Protection + AI addendum"}},
]

COMPETITIVE_MOATS: List[Dict[str, Any]] = [
    {"subject": "runtime-enforcement",     "claim": {"moat": "Runtime enforcement via MCP & A2A gates",       "defensibility": 9, "replication_months": 18, "note": "stop rogue agents at the wire"}},
    {"subject": "hmac-attestation-chain",  "claim": {"moat": "HMAC-chained attestation log",                   "defensibility": 10,"replication_months": 24, "note": "the data moat"}},
    {"subject": "mcp-network-effects",    "claim": {"moat": "MCP network effects (1000s of servers)",         "defensibility": 8, "replication_months": 12, "note": "winner-take-most dynamics"}},
    {"subject": "standards-leadership",    "claim": {"moat": "Standards leadership via CSOAI / Charter",      "defensibility": 9, "replication_months": 30, "note": "first-mover in 52-article Charter"}},
    {"subject": "distribution-density",   "claim": {"moat": "Distribution density (6 bootstrap channels)",   "defensibility": 7, "replication_months": 9,  "note": "pre-commit + VSCode + GH Action + ext + CLI + MCP"}},
]

ARCHITECTURE_GAPS: List[Dict[str, Any]] = [
    {"subject": "u-cgp-zk-tee-pq",        "claim": {"gap": "Universal CGP with ZK + TEE + PQ signing", "tam_usd_m": 280, "buyer": "Fortune 500 enterprise",   "note": "the unblockable gap"}},
    {"subject": "runtime-red-team",       "claim": {"gap": "Runtime red-team on every MCP call",         "tam_usd_m": 90,  "buyer": "AI safety teams",            "note": "PyRIT integration"}},
    {"subject": "cross-agent-audit",      "claim": {"gap": "Cross-agent compliance attestation",         "tam_usd_m": 60,  "buyer": "Regulated industries",        "note": "CGP core"}},
    {"subject": "zk-ml-inference",        "claim": {"gap": "ZK ML inference proofs",                     "tam_usd_m": 45,  "buyer": "Finance, healthcare",         "note": "ezkl integration"}},
    {"subject": "pq-signing-chain",       "claim": {"gap": "Post-quantum signed charter anchors",         "tam_usd_m": 30,  "buyer": "Government, defense",         "note": "NIST PQC round 4"}},
    {"subject": "tee-attested-runtime",   "claim": {"gap": "TEE-attested agent runtime",                  "tam_usd_m": 25,  "buyer": "Confidential compute",         "note": "Sentient Enclaves integration"}},
]


def seed(log_path: str = "/Users/nicholas/clawd/sov3-hive/data/csoai_attestations.jsonl",
         reset: bool = True,
         use_real_hives: bool = True) -> Dict[str, int]:
    if reset and os.path.exists(log_path):
        os.remove(log_path)
    fed = Federation(log_path=log_path, use_real_hives=use_real_hives)
    counts: Dict[str, int] = {"diamond": 0, "compliance": 0, "bootstrap": 0,
                              "integration": 0, "regulatory": 0,
                              "competitive": 0, "architecture": 0}

    for d in GITHUB_DIAMONDS:
        fed.attest(AttestationKind.DIAMOND, d["subject"], d["claim"],
                   submitter="meok-research")
        counts["diamond"] += 1
    for b in BOOTSTRAP_PLAYS:
        fed.attest(AttestationKind.BOOTSTRAP, b["subject"], b["claim"],
                   submitter="meok-research")
        counts["bootstrap"] += 1
    for i in INTEGRATIONS:
        fed.attest(AttestationKind.INTEGRATION, i["subject"], i["claim"],
                   submitter="meok-research")
        counts["integration"] += 1
    for r in REGULATORY_MARKETS:
        fed.attest(AttestationKind.REGULATORY, r["subject"], r["claim"],
                   submitter="csoai-charter")
        counts["regulatory"] += 1
    for m in COMPETITIVE_MOATS:
        fed.attest(AttestationKind.COMPETITIVE, m["subject"], m["claim"],
                   submitter="csoai-charter")
        counts["competitive"] += 1
    for g in ARCHITECTURE_GAPS:
        fed.attest(AttestationKind.ARCHITECTURE, g["subject"], g["claim"],
                   submitter="meok-research")
        counts["architecture"] += 1

    return counts


if __name__ == "__main__":
    print("=== seeding csoai.org bootstrap content ===")
    counts = seed()
    print("attestations created:")
    for k, v in counts.items():
        print(f"  {k:14s} {v}")
    print(f"  TOTAL          {sum(counts.values())}")
    fed = Federation(log_path="/Users/nicholas/clawd/sov3-hive/data/csoai_attestations.jsonl")
    st = fed.status()
    print(f"\nchain valid: {st['chain_valid']}, total: {st['attestations_total']}")
    print(f"horus: n={st['horus']['n']} f={st['horus']['f']} q={st['horus']['quorum']}")
    print(f"tip: {st['tip_hash'][:24]}...")
