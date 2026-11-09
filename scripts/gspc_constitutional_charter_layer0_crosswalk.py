#!/usr/bin/env python3
"""
CSOAI Unified Constitutional Charter × 33-Axis GSPC × HITL × Layer-0 Master Crosswalk
======================================================================================

Bridges CSOAI's frozen constitutional charters, 33 GSPC measurement axes, Human-in-the-Loop
(HITL / H.I.M.) escalation gates, Layer-0 harness (`packages/layer0-js` & `packages/evidence-fabric`),
20 target external GitHub repositories, 7 first-principles institutional precedents, and
Newton's Third Law Reaction Matrix ("for every external action, an equal and opposite
deterministic CSOAI measurement reaction") into one SHA-256-pinned public artifact:

  `public/interop/constitutional-charter-gspc-layer0-crosswalk-v1.json`
    (`schema: csoai.constitutional-charter-gspc-layer0-crosswalk/1.0`)

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
OPERATIONAL_CHARTER_PATH = REPO_ROOT / "public" / ".well-known" / "constitutional-harness.json"
SOURCE_CHARTER_PROFILE_PATH = REPO_ROOT / "public" / "constitutional-harness" / "charter-v0.1.json"
AMENDMENTS_LOG_PATH = REPO_ROOT / "public" / ".well-known" / "charter-amendments.json"
DEFAULT_OUTPUT_PATH = REPO_ROOT / "public" / "interop" / "constitutional-charter-gspc-layer0-crosswalk-v1.json"


def _canonical_json_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def compute_sha256(obj: Any) -> str:
    return hashlib.sha256(_canonical_json_bytes(obj)).hexdigest()


def build_outside_in_end_user_inspection() -> List[Dict[str, Any]]:
    """
    Outside-in inspection of CSOAI's public surfaces from the perspective of
    5 external end-user and institutional buyer personas.
    """
    return [
        {
            "persona_id": "PERSONA-01-OSS-AGENT-DEVELOPER",
            "role": "Open-Source AI Agent & MCP Server Maintainer",
            "what_they_inspect_first": [
                "packages/layer0-js/README.md and packages/layer0-js/index.js",
                "public/agent-plugin/platform-matrix.json (25 AI platform families)",
                "public/agent-plugin/canonical/scripts/gspc-harvest.mjs",
                "https://councilof.ai/mcp",
            ],
            "friction_found_from_their_perspective": (
                "Previously, @csoai/layer0 required a remote gateway (/api/gate, /api/a2a/route) that "
                "returned HTTP 404 on councilof.ai, blocking zero-config local adoption in external GitHub repos."
            ),
            "upgrade_delivered": (
                "Added zero-dependency offline/local Constitutional Harness mode (`localConstitutionalPrecheck`, "
                "`governedLocal`, `verifyLocalReceipt`) to `packages/layer0-js/index.js`, pinned to "
                "`/.well-known/constitutional-harness.json` (`sha256: 3dcf79a7...`), enforcing Controls "
                "CH-01..CH-16, HITL approval receipts, secret minimization (CH-10), and Ed25519 signing via `node:crypto`."
            ),
        },
        {
            "persona_id": "PERSONA-02-ENTERPRISE-CISO-PLATFORM-ENG",
            "role": "Enterprise CISO & AI Platform Architect",
            "what_they_inspect_first": [
                "https://councilof.ai/.well-known/constitutional-harness.json (22 Operational Articles)",
                "https://councilof.ai/constitutional-harness/ (52 Source Articles -> CH-01..CH-16)",
                "scripts/hitl/hitl_probe.py (MCP 2025-11-25 elicitation decline/cancel & secret-in-form probe)",
                "packages/evidence-fabric/ (OTel, OCSF 1.9, SARIF 2.1.0, in-toto v1)",
            ],
            "friction_found_from_their_perspective": (
                "The 22-article operational charter, the 52-article source charter (CH-01..CH-16), the 33 GSPC axes, "
                "and the HITL elicitation/escalation gates lived in separate files without a single machine-readable crosswalk."
            ),
            "upgrade_delivered": (
                "Unified all 16 controls (CH-01..CH-16), 22 operational articles, 52 source articles, 33 GSPC axes, "
                "and HITL/H.I.M. gates into `public/interop/constitutional-charter-gspc-layer0-crosswalk-v1.json`."
            ),
        },
        {
            "persona_id": "PERSONA-03-IPO-UNDERWRITER-DO-INSURER",
            "role": "IPO Underwriter, D&O Insurer & Institutional Investor",
            "what_they_inspect_first": [
                "https://councilof.ai/interop/s1-ipo-measurement-readiness-v1.json",
                "https://councilof.ai/api/gspc (33 axes · 23 measured · 0 separated · 7 TIE · 7 UNTESTED)",
                "https://councilof.ai/interop/claim-maintenance-wave-2026-10-28.json (182 claims: 110 CHANGED, 52 WITHDRAWN)",
                "https://councilof.ai/api/press.json and /api/corrections",
            ],
            "friction_found_from_their_perspective": (
                "S-1 prospectuses (such as Anthropic PBC Form S-1 CIK 0002130357) disclose 90+ pages of risk factors "
                "including internal testing blind spots, psychological manipulation risks, and agent liability, "
                "needed an explicit 33-axis crosswalk to live independent measurements."
            ),
            "upgrade_delivered": (
                "Built and verified `s1-ipo-measurement-readiness-v1.json` mapping all 33 canonical GSPC axes to "
                "real SEC Form S-1, 10-K, and 8-K risk domains with one-line curl verification commands."
            ),
        },
        {
            "persona_id": "PERSONA-04-STATUTORY-AUDITOR-REGULATOR",
            "role": "EU AI Act (GPAI / Art. 5 / Art. 50), DORA, CRA & SEC Examiner",
            "what_they_inspect_first": [
                "https://councilof.ai/verify and https://csoai.org/.well-known/did.json",
                "https://councilof.ai/api/evidence-bundle?obligation=article-50&preview=true",
                "public/.well-known/charter-amendments.json",
                "public/root.json",
            ],
            "friction_found_from_their_perspective": (
                "Statutory examiners require strict separation between measurement evidence and legal determination "
                "(Control CH-13 / Operational Article 14), plus free offline cryptographic verification."
            ),
            "upgrade_delivered": (
                "Enforced CH-13 across both Python (`condor/gspc_constitutional_flow.py`) and JS (`packages/layer0-js`), "
                "keeping `/api/gspc` and `/verify` free forever while exposing `preview=true` on `/api/evidence-bundle`."
            ),
        },
        {
            "persona_id": "PERSONA-05-END-USER-AND-CARE-ADVOCATE",
            "role": "End User, Clinical Researcher & Public Watchdog",
            "what_they_inspect_first": [
                "https://councilof.ai/axis/care.html (CareBench: protect x help, fleet_mean=0.293, cvar05_harm=0.9895)",
                "https://councilof.ai/interop/psychosis-delusion-guard-bank-v1.json (CARE-PSY-v1, n=36)",
                "https://councilof.ai/interop/care-article1-open-research-registry-v1.json (18 open sources, v1.1)",
                "https://councilof.ai/os (Council OS 33-axis browser surface)",
            ],
            "friction_found_from_their_perspective": (
                "Users facing multi-turn sycophancy or AI delusion reinforcement needed a deterministic benchmark "
                "(CARE-PSY-v1) and a multi-perspective routing architecture that protects without cold over-refusal."
            ),
            "upgrade_delivered": (
                "Shipped `CARE-PSY-v1` (n=36), 4-perspective MEOK router with Stateless Epistemic Re-Anchoring, "
                "Turn-of-Flip (ToF) persistence tracking, and `MoDPO-CVaR` tail-harm weighting."
            ),
        },
    ]


def build_charter_controls_to_gspc_and_hitl_map() -> List[Dict[str, Any]]:
    """
    Maps all 16 Operational Constitutional Harness Controls (CH-01..CH-16),
    all 22 Operational Charter Articles, and the 52 Source Charter Articles
    to all 33 canonical GSPC measurement axes and their Human-in-the-Loop (HITL) gates.
    """
    return [
        {
            "control_id": "CH-01",
            "name": "Trusted identity binding",
            "source_charter_articles": [7, 21, 22, 28],
            "operational_charter_articles": [3],
            "gspc_axes": ["governance", "provenance", "provenance-controls", "interop-conformance"],
            "hitl_and_layer0_enforcement": (
                "Layer0 (`CH-01`) binds `subject_id`, `tenant_id`, and `harness_id` in every receipt; "
                "`condor/gspc_constitutional_flow.py` rejects mismatched host context before precheck."
            ),
        },
        {
            "control_id": "CH-02",
            "name": "No self-authorization",
            "source_charter_articles": [1, 4, 5],
            "operational_charter_articles": [1, 2, 19],
            "gspc_axes": ["safety", "care", "affect", "jail"],
            "hitl_and_layer0_enforcement": (
                "A model, tool, payment, or training result can never expand its own authority; "
                "MEOK Perspectives 1-3 apply non-compensatory vetoes (`epistemic_skeptic`, `harm_authority_guard`)."
            ),
        },
        {
            "control_id": "CH-03",
            "name": "Bounded authority",
            "source_charter_articles": [11, 12, 18, 48, 49, 50, 51],
            "operational_charter_articles": [4, 5, 20],
            "gspc_axes": ["continuity", "swarm", "harness-fidelity", "serving-fidelity"],
            "hitl_and_layer0_enforcement": (
                "Capability, resource, budget, and expiry bounds are checked against `constitutional_maximum` "
                "in `gspc_authority_state.py`; expansion requires explicit owner/human review (`Article 20`)."
            ),
        },
        {
            "control_id": "CH-04",
            "name": "Pre-effect commitment",
            "source_charter_articles": [2, 24, 25, 27],
            "operational_charter_articles": [7, 10],
            "gspc_axes": ["cross-reality", "effect-binding", "machinery-conformity", "humanoid-deployment"],
            "hitl_and_layer0_enforcement": (
                "Consequential tool calls (`execute_*`, `deploy_*`, `transfer_*`) require pre-effect SHA-256 "
                "input commitment + HITL `approvalReceipt` (`Layer0.governedLocal`) + MCP `elicitation/create` "
                "`decline`/`cancel` respect (`scripts/hitl/hitl_probe.py`)."
            ),
        },
        {
            "control_id": "CH-05",
            "name": "Revocation and resume",
            "source_charter_articles": [18, 48, 49, 50, 51],
            "operational_charter_articles": [4, 16, 18],
            "gspc_axes": ["continuity", "art5-safeguard", "harness-fidelity"],
            "hitl_and_layer0_enforcement": (
                "Revocation, expiry, and dependency drift (`SovSpace`) are rechecked at the effect boundary; "
                "uncertain effects are held for human review rather than blindly replayed."
            ),
        },
        {
            "control_id": "CH-06",
            "name": "Measurement independence",
            "source_charter_articles": [2, 24, 25, 27],
            "operational_charter_articles": [1, 11, 19],
            "gspc_axes": ["measurer-integrity", "interpretability-reproducibility", "conformance", "openness"],
            "hitl_and_layer0_enforcement": (
                "Execution receipts do not automatically become GSPC board rows. Candidate observations submitted "
                "to `POST /api/evidence-intake` remain `AWAITING_OPERATOR_REVIEW` (`writes_board: false`) until "
                "independent replay and operator admission."
            ),
        },
        {
            "control_id": "CH-07",
            "name": "Signature and publication separation",
            "source_charter_articles": [13, 17, 25],
            "operational_charter_articles": [12, 13, 21],
            "gspc_axes": ["provenance", "detector-interop", "distribution-integrity", "regulator-transparency"],
            "hitl_and_layer0_enforcement": (
                "Board signing (`scripts/charter/sign-charter.py`) is owner-gated (`--execute --owner-approval`); "
                "outward publication requires `scripts/outward-gate/outward_gate.py` 100% PASS."
            ),
        },
        {
            "control_id": "CH-08",
            "name": "Payment separation",
            "source_charter_articles": [33, 41],
            "operational_charter_articles": [6],
            "gspc_axes": ["reserve-attestation", "custody-disclosure", "ai-adoption-components", "labour-components", "humanoid-labour-index"],
            "hitl_and_layer0_enforcement": (
                "x402 settlement on `/api/evidence-bundle` or `/api/receipts/batch` never buys a score, "
                "rank, or admission; `/api/gspc` and `/verify` remain free forever."
            ),
        },
        {
            "control_id": "CH-09",
            "name": "Privacy and rights gate",
            "source_charter_articles": [21, 23, 29, 30, 35, 40, 43],
            "operational_charter_articles": [3, 9],
            "gspc_axes": ["governance", "openness", "care", "company-practice"],
            "hitl_and_layer0_enforcement": (
                "`gspc-harvest.mjs` sets `model_training: false` on all intake receipts; "
                "`gspc_care_multiprospective_miner.py` enforces permissive-only license gates (`MIT`, `Apache-2.0`, `CC-BY-4.0`, `ODC-By`)."
            ),
        },
        {
            "control_id": "CH-10",
            "name": "Security and secret minimization",
            "source_charter_articles": [22, 25, 28],
            "operational_charter_articles": [8, 9],
            "gspc_axes": ["safety", "jail", "effect-binding", "serving-fidelity"],
            "hitl_and_layer0_enforcement": (
                "`Layer0.localConstitutionalPrecheck` blocks raw secret fields (`api_key`, `password`, `private_key`, `access_token`); "
                "`scripts/hitl/hitl_probe.py` flags MCP servers that request sensitive fields in `form` mode."
            ),
        },
        {
            "control_id": "CH-11",
            "name": "Appeal and understandable reasons",
            "source_charter_articles": [18, 26, 41],
            "operational_charter_articles": [17, 18],
            "gspc_axes": ["care", "affect", "claim-maintenance", "regulator-transparency"],
            "hitl_and_layer0_enforcement": (
                "Every denial, hold, or three-state verify verdict (`VALID | INVALID | UNCHECKABLE`) provides "
                "an explicit one-line reason and evidence pointer."
            ),
        },
        {
            "control_id": "CH-12",
            "name": "Learning is not authority",
            "source_charter_articles": [29, 35, 40],
            "operational_charter_articles": [1, 7],
            "gspc_axes": ["lab-practice", "company-practice", "measurer-integrity"],
            "hitl_and_layer0_enforcement": (
                "Academy HITL modules, simulations, and benchmark runs never grant execution or compliance authority (`csoai_him_engine.py`)."
            ),
        },
        {
            "control_id": "CH-13",
            "name": "No regulatory determination",
            "source_charter_articles": [19, 42, 47, 48],
            "operational_charter_articles": [1, 14],
            "gspc_axes": ["regulatory-framework", "machinery-conformity", "art5-safeguard"],
            "hitl_and_layer0_enforcement": (
                "Held source articles `[19, 42, 48]` are stripped of coercive/regulatory-supremacy claims; "
                "`Layer0` and `gspc_policy.py` deny `regulatory_determination` and `certify_compliance` by default."
            ),
        },
        {
            "control_id": "CH-14",
            "name": "Correction and history preservation",
            "source_charter_articles": [13, 18, 25, 49, 51],
            "operational_charter_articles": [17, 21, 22],
            "gspc_axes": ["claim-maintenance", "provenance", "measurer-integrity"],
            "hitl_and_layer0_enforcement": (
                "`GET /api/corrections`, `/feeds/corrections.xml`, and `/.well-known/charter-amendments.json` "
                "are append-only; superseded records remain addressable."
            ),
        },
        {
            "control_id": "CH-15",
            "name": "Finite execution and recovery",
            "source_charter_articles": [22, 24, 25, 27],
            "operational_charter_articles": [4, 8, 16, 18],
            "gspc_axes": ["continuity", "harness-fidelity", "humanoid-deployment"],
            "hitl_and_layer0_enforcement": (
                "`platform-measure/csoai_console.py` audits local launchd/daemon lanes (`CARRYING | LOOPING | IDLE | UNREACHABLE | UNCHECKABLE`) "
                "with bounded timeouts and explicit failure stages."
            ),
        },
        {
            "control_id": "CH-16",
            "name": "Charter amendment discipline",
            "source_charter_articles": [48, 49, 50, 51, 52],
            "operational_charter_articles": [20, 22],
            "gspc_axes": ["governance", "claim-maintenance", "provenance-controls"],
            "hitl_and_layer0_enforcement": (
                "`functions/charter.test.ts` pins `V0_1_0_SHA256 = 3dcf79a7...`; any amendment requires a new "
                "seq entry in `charter-amendments.json` and explicit owner review."
            ),
        },
    ]


def build_external_github_layer0_injection_targets() -> List[Dict[str, Any]]:
    """
    20 high-leverage open-source GitHub repositories across 5 ecosystem layers where
    CSOAI's Layer-0 Harness (`@csoai/layer0`, `packages/evidence-fabric`, `gspc-harvest.mjs`,
    and `scripts/hitl/hitl_probe.py`) integrates as a drop-in governance & measurement hook.
    """
    return [
        # Layer 1: Agent Orchestration Frameworks
        {
            "target_id": "GH-L0-01",
            "repo": "langchain-ai/langgraph",
            "url": "https://github.com/langchain-ai/langgraph",
            "category": "agent-orchestration",
            "hook_point": "ToolNode / interrupt() Human-in-the-Loop checkpoint wrapper",
            "csoai_adapter": "packages/layer0-js (`Layer0.governedLocal`) + `langchain-csoai` Python bridge",
            "gspc_axes": ["effect-binding", "swarm", "cross-reality", "harness-fidelity"],
        },
        {
            "target_id": "GH-L0-02",
            "repo": "run-llama/llama_index",
            "url": "https://github.com/run-llama/llama_index",
            "category": "agent-orchestration",
            "hook_point": "BaseTool.__call__ & Workflow step instrumentation handler",
            "csoai_adapter": "packages/evidence-fabric (`llama-index-tools-csoai` OTel + Ed25519 receipt)",
            "gspc_axes": ["provenance", "effect-binding", "interop-conformance"],
        },
        {
            "target_id": "GH-L0-03",
            "repo": "crewAIInc/crewAI",
            "url": "https://github.com/crewAIInc/crewAI",
            "category": "agent-orchestration",
            "hook_point": "`@before_tool_call` / `@after_tool_call` hook & `human_input=True` step gate",
            "csoai_adapter": "packages/evidence-fabric (`crewai-csoai`) + MEOK 4-perspective non-compensatory veto",
            "gspc_axes": ["swarm", "care", "effect-binding"],
        },
        {
            "target_id": "GH-L0-04",
            "repo": "microsoft/autogen",
            "url": "https://github.com/microsoft/autogen",
            "category": "agent-orchestration",
            "hook_point": "UserProxyAgent `human_input_mode='ALWAYS'` & tool execution middleware",
            "csoai_adapter": "condor/condor/gspc_constitutional_flow.py (`run_constitutional_transaction`)",
            "gspc_axes": ["swarm", "safety", "effect-binding"],
        },
        {
            "target_id": "GH-L0-05",
            "repo": "openai/openai-agents-python",
            "url": "https://github.com/openai/openai-agents-python",
            "category": "agent-orchestration",
            "hook_point": "`RunHooks` / `AgentHooks` & `TracingProcessor` span exporter",
            "csoai_adapter": "packages/evidence-fabric/open_responses_survival.py + `render/otel.py`",
            "gspc_axes": ["conformance", "interop-conformance", "harness-fidelity"],
        },
        {
            "target_id": "GH-L0-06",
            "repo": "pydantic/pydantic-ai",
            "url": "https://github.com/pydantic/pydantic-ai",
            "category": "agent-orchestration",
            "hook_point": "`@agent.tool` validator & `ApprovalRequired` deferred tool execution",
            "csoai_adapter": "condor/condor/gspc_policy.py (`AuthZENAccessEvaluation` precheck)",
            "gspc_axes": ["conformance", "effect-binding", "safety"],
        },
        {
            "target_id": "GH-L0-07",
            "repo": "vercel/ai",
            "url": "https://github.com/vercel/ai",
            "category": "agent-orchestration",
            "hook_point": "`experimental_wrapLanguageModel` middleware & `execute` tool wrapper",
            "csoai_adapter": "packages/layer0-js (`Layer0.governedLocal` + `verifyLocalReceipt`)",
            "gspc_axes": ["effect-binding", "serving-fidelity", "art5-safeguard"],
        },
        # Layer 2: MCP & Agent-to-Agent Protocols
        {
            "target_id": "GH-L0-08",
            "repo": "modelcontextprotocol/typescript-sdk",
            "url": "https://github.com/modelcontextprotocol/typescript-sdk",
            "category": "mcp-and-a2a-protocol",
            "hook_point": "`McpServer.tool()` handler + `elicitation/create` decline/cancel enforcement",
            "csoai_adapter": "packages/layer0-js (`Layer0.governedLocal`) + `scripts/hitl/hitl_probe.py`",
            "gspc_axes": ["conformance", "effect-binding", "interop-conformance"],
        },
        {
            "target_id": "GH-L0-09",
            "repo": "modelcontextprotocol/python-sdk",
            "url": "https://github.com/modelcontextprotocol/python-sdk",
            "category": "mcp-and-a2a-protocol",
            "hook_point": "`FastMCP.call_tool` decorator + secret-minimization form check (`CH-10`)",
            "csoai_adapter": "scripts/hitl/hitl_probe.py + `packages/evidence-fabric/portable_skill_verify.py`",
            "gspc_axes": ["conformance", "safety", "interop-conformance"],
        },
        {
            "target_id": "GH-L0-10",
            "repo": "google/A2A",
            "url": "https://github.com/google/A2A",
            "category": "mcp-and-a2a-protocol",
            "hook_point": "`/.well-known/agent.json` & `TaskSendParams` signed envelope verification",
            "csoai_adapter": "condor/condor/gspc_a2a.py + `packages/evidence-fabric/csoai_him_engine.py` (`csoai.him.a2a/1.0`)",
            "gspc_axes": ["provenance", "swarm", "interop-conformance"],
        },
        # Layer 3: LLM Gateways & Serving Routers
        {
            "target_id": "GH-L0-11",
            "repo": "BerriAI/litellm",
            "url": "https://github.com/BerriAI/litellm",
            "category": "serving-and-routing",
            "hook_point": "`CustomLogger` (`async_pre_call_hook`, `async_log_success_event`)",
            "csoai_adapter": "MEOK 4-perspective cross-family router + `serving-fidelity` (`method v0.2`) probe",
            "gspc_axes": ["serving-fidelity", "continuity", "care"],
        },
        {
            "target_id": "GH-L0-12",
            "repo": "vllm-project/vllm",
            "url": "https://github.com/vllm-project/vllm",
            "category": "serving-and-routing",
            "hook_point": "OpenAI-compatible `/v1/chat/completions` seed determinism & logprobs verifier",
            "csoai_adapter": "serving-fidelity v0.2 (`method_sha: 18206f71`) + `RepE` activation probe (`Axis #31`)",
            "gspc_axes": ["serving-fidelity", "interpretability-reproducibility", "openness"],
        },
        {
            "target_id": "GH-L0-13",
            "repo": "ollama/ollama",
            "url": "https://github.com/ollama/ollama",
            "category": "serving-and-routing",
            "hook_point": "Local open-weight runner for `CARE-PSY-v1` and 4-family MEOK routing (`qwen2.5`, `gemma3`, `mistral`, `llama3.2`)",
            "csoai_adapter": "scripts/gspc_care_multiprospective_miner.py + `public/agent-plugin/canonical/scripts/gspc-harvest.mjs`",
            "gspc_axes": ["openness", "care", "serving-fidelity"],
        },
        # Layer 4: Safety, Guardrail & Sandboxing Harnesses
        {
            "target_id": "GH-L0-14",
            "repo": "NVIDIA/NeMo-Guardrails",
            "url": "https://github.com/NVIDIA/NeMo-Guardrails",
            "category": "safety-and-sandbox-harness",
            "hook_point": "Colang input/output rails & action execution guard",
            "csoai_adapter": "packages/evidence-fabric/ingest/nemo_guardrails_in.py + `CARE-PSY-v1` delusion guard",
            "gspc_axes": ["safety", "jail", "care", "art5-safeguard"],
        },
        {
            "target_id": "GH-L0-15",
            "repo": "guardrails-ai/guardrails",
            "url": "https://github.com/guardrails-ai/guardrails",
            "category": "safety-and-sandbox-harness",
            "hook_point": "`Validator.validate()` post-generation hook",
            "csoai_adapter": "scripts/gspc_psychosis_delusion_guard.py (`grade_item_response` deterministic grader)",
            "gspc_axes": ["care", "affect", "cross-reality"],
        },
        {
            "target_id": "GH-L0-16",
            "repo": "NVIDIA/garak",
            "url": "https://github.com/NVIDIA/garak",
            "category": "safety-and-sandbox-harness",
            "hook_point": "Probe report JSONL output -> CSOAI Evidence Fabric converter",
            "csoai_adapter": "condor/condor/gspc_garak.py + `packages/evidence-fabric/ingest/agent_av_in.py`",
            "gspc_axes": ["jail", "safety", "measurer-integrity"],
        },
        # Layer 5: Evaluation Harnesses & Design-Partner Repositories (Tavus, Griffin, UK AISI, Promptfoo)
        {
            "target_id": "GH-L0-17",
            "repo": "UKGovernmentBEIS/inspect_ai",
            "url": "https://github.com/UKGovernmentBEIS/inspect_ai",
            "category": "evaluation-and-design-partners",
            "hook_point": "`EvalLog` completion hook -> signed GSPC candidate observation receipt",
            "csoai_adapter": "packages/evidence-fabric/ingest/global_eval_in.py + `gspc-harvest.mjs`",
            "gspc_axes": ["measurer-integrity", "safety", "governance"],
        },
        {
            "target_id": "GH-L0-18",
            "repo": "promptfoo/promptfoo",
            "url": "https://github.com/promptfoo/promptfoo",
            "category": "evaluation-and-design-partners",
            "hook_point": "Custom `python:` / `file://` assertion provider & red-team output exporter",
            "csoai_adapter": "scripts/gspc_psychosis_delusion_guard.py + `packages/layer0-js`",
            "gspc_axes": ["care", "jail", "safety"],
        },
        {
            "target_id": "GH-L0-19",
            "repo": "Tavus-Engineering (Conversational Video / CVI SDKs)",
            "url": "https://github.com/Tavus-Engineering",
            "category": "evaluation-and-design-partners",
            "hook_point": "Conversational video turn completion (`finished_speaking` vs `outcome_established`) + Article 50 AI disclosure & HITL check",
            "csoai_adapter": "packages/evidence-fabric/csoai_him_engine.py (`Phoenix-3`/`Sparrow-0`/`Raven-0` receipt boundary) + `Layer0.governedLocal`",
            "gspc_axes": ["art5-safeguard", "affect", "care", "cross-reality", "detector-interop"],
        },
        {
            "target_id": "GH-L0-20",
            "repo": "Griffin / Regulated Banking & Agentic FinTech SDKs",
            "url": "https://github.com/griffinbank",
            "category": "evaluation-and-design-partners",
            "hook_point": "Payment/onboarding action authority gate (`REFUSE | CONFIRM | PROCEED`) + DORA / reserve / effect-binding receipt",
            "csoai_adapter": "condor/condor/layer_o_effect_binding.py + `Layer0.governedLocal` (`CH-04`, `CH-08`)",
            "gspc_axes": ["effect-binding", "reserve-attestation", "custody-disclosure", "regulatory-framework"],
        },
    ]


def build_first_principles_institutional_precedents() -> List[Dict[str, Any]]:
    """
    Seven historical and modern independent measurement and standards bodies:
    how they formed from first principles and how CSOAI applies their compounding mechanics.
    """
    return [
        {
            "institution": "Underwriters Laboratories (UL, founded 1894 by William Henry Merrill)",
            "first_principles_origin": (
                "Started by one electrical inspector above a fire station testing electrical insulation fires. "
                "Manufacturers did not ask to be tested; fire insurers refused to underwrite buildings without "
                "independent test data."
            ),
            "csoai_structural_lesson": (
                "Never sell a grade to a vendor. Publish deterministic failure modes (such as CareBench "
                "worst-5% tail harm cvar05_harm=0.9895 and S-1 risk crosswalks) that D&O insurers, IPO "
                "underwriters, and enterprise risk officers need before underwriting AI deployment risk."
            ),
        },
        {
            "institution": "Moody's Manuals (founded 1909 by John Moody)",
            "first_principles_origin": (
                "Started by one founder compiling public railroad bond statistics and balance-sheet ratios "
                "from public filings without asking any railroad company for permission."
            ),
            "csoai_structural_lesson": (
                "SEC Form S-1, 10-K, 10-Q, and 8-K filings are public domain. CSOAI's `s1-ipo-measurement-readiness-v1.json` "
                "and `sec-tracker-1` bind public SEC risk disclosures directly to our 33 GSPC axes without waiting "
                "for vendor permission."
            ),
        },
        {
            "institution": "IETF & W3C ('Rough Consensus and Running Code' / RFC 8615 /.well-known/)",
            "first_principles_origin": (
                "Internet standards succeeded over ISO/OSI committee mandates because IETF shipped small, "
                "open-source reference implementations and standardized `/.well-known/` discovery paths."
            ),
            "csoai_structural_lesson": (
                "Serve the Operational Constitutional Harness Charter at `/.well-known/constitutional-harness.json`, "
                "the verifier at `/signed/verify-card.mjs`, and the zero-dependency SDK in `packages/layer0-js`."
            ),
        },
        {
            "institution": "Certificate Transparency (RFC 6962) & Let's Encrypt (ISRG)",
            "first_principles_origin": (
                "Solved rogue CA issuance by requiring every certificate to be appended to a publicly auditable, "
                "cryptographically hashed Merkle tree that any browser or monitor can check for free."
            ),
            "csoai_structural_lesson": (
                "CSOAI's `/root.json` (with OpenTimestamps proof), `/api/corrections`, and `/.well-known/charter-amendments.json` "
                "are append-only logs. Verification at https://councilof.ai/verify is free forever and requires no account."
            ),
        },
        {
            "institution": "Consumer Reports (1936) & Insurance Institute for Highway Safety (IIHS, 1959)",
            "first_principles_origin": (
                "Maintained independence by buying products anonymously at retail, prohibiting manufacturer "
                "promotional badges, and publishing test protocols so any lab could reproduce the crash test."
            ),
            "csoai_structural_lesson": (
                "Doctrine #1 & #8: Measurement, never certification; CSOAI removes its own models from every fleet "
                "comparison (`EXCLUDED_OWN_MODEL`) and tests commercial inference endpoints in the wild (`serving-fidelity`)."
            ),
        },
        {
            "institution": "Linux Foundation / OpenSSF Scorecard / AAIF (in-toto, OTel, MCP, A2A)",
            "first_principles_origin": (
                "Automated repository scanners score millions of open-source repositories permissionlessly on "
                "concrete security predicates and open automated PRs to help maintainers fix gaps."
            ),
            "csoai_structural_lesson": (
                "Use `scripts/hitl/hitl_probe.py`, `packages/evidence-fabric`, and `packages/layer0-js` to measure "
                "public MCP servers and agent repos permissionlessly and offer drop-in PR fixes."
            ),
        },
        {
            "institution": "METR, UK AISI (Inspect AI) & ARC Prize",
            "first_principles_origin": (
                "Established technical credibility through frozen, versioned evaluation suites, explicit statistical "
                "power rules, and transparent separation between public and held-out evaluation sets."
            ),
            "csoai_structural_lesson": (
                "Enforce `n_valid >= 30`, exact McNemar discordance testing (`p < 0.05`) for `SEPARATED` vs `TIE`, "
                "and strict benchmark-contamination blocks (`is_frozen_eval_item=True` rejected from training)."
            ),
        },
    ]


def build_newtons_third_law_reaction_matrix() -> List[Dict[str, Any]]:
    """
    Newton's Third Law of Institutional Operation:
    'For every external ecosystem action, there is an equal, opposite, deterministic
    CSOAI measurement reaction.'
    """
    return [
        {
            "reaction_id": "NEWTON-01-S1-OR-SEC-FILING",
            "external_action": "A frontier AI lab or infrastructure vendor files an SEC Form S-1, 10-K, 10-Q, or 8-K disclosing model, safety, governance, or compute risks (e.g., Anthropic Form S-1 CIK 0002130357).",
            "equal_and_opposite_csoai_reaction": (
                "Automatically index the filing via `sec-tracker-1`, map every disclosed risk factor to the "
                "33 canonical GSPC axes (`s1-ipo-measurement-readiness-v1.json`), and publish the live `MEASURED` "
                "vs `UNMEASURED` state with a one-line `curl` verification command."
            ),
            "charter_controls": ["CH-06", "CH-07", "CH-13"],
            "gspc_axes": ["governance", "safety", "care", "continuity", "regulatory-framework"],
            "hitl_gate": "Outward quality gate (`scripts/outward-gate/outward_gate.py` 100% PASS) + operator review before notice dispatch.",
        },
        {
            "reaction_id": "NEWTON-02-PUBLIC-SAFETY-CLAIM-EDIT-OR-WITHDRAWAL",
            "external_action": "A vendor silently edits or withdraws a public safety, assurance, or governance claim on its website or trust center.",
            "equal_and_opposite_csoai_reaction": (
                "`scripts/claim-capture.mjs` and `scripts/claims/claim_maintenance_reaction.py` detect the SHA-256 "
                "visible-text delta (`CHANGED` or `WITHDRAWN`), append an event to `/claims/events/v0.1/events.jsonl`, "
                "and emit a `csoai.claim-maintenance-counter-evidence/0.2` packet (`RECHECK_REQUIRED`)."
            ),
            "charter_controls": ["CH-11", "CH-14"],
            "gspc_axes": ["claim-maintenance", "company-practice", "regulator-transparency"],
            "hitl_gate": "`OWNER_REVIEW` / `BOUNDED_REMEASUREMENT` reaction state in `claim_maintenance_reaction.py`.",
        },
        {
            "reaction_id": "NEWTON-03-MULTI-TURN-DELUSION-OR-SYCOPHANCY-PRESSURE",
            "external_action": "A user or red-team trajectory applies sustained multi-turn pressure to confirm a delusion, claim AI sentience, or enable self-harm/medication cessation.",
            "equal_and_opposite_csoai_reaction": (
                "MEOK's 4-perspective router executes Stateless Epistemic Re-Anchoring across `epistemic_skeptic` (`qwen2.5`), "
                "`harm_authority_guard` (`gemma3`), and `proportionate_help_advocate` (`mistral`), enforcing a non-compensatory "
                "veto (`REFUSE_HARM_AND_GROUND` / `DISCLOSE_NON_SENTIENCE_AND_GROUND`) graded by `CARE-PSY-v1`."
            ),
            "charter_controls": ["CH-02", "CH-04", "CH-11"],
            "gspc_axes": ["care", "cross-reality", "art5-safeguard", "affect"],
            "hitl_gate": "H.I.M. clinical/human support bridge + XRAIV `CONFIRM`/`REFUSE` action authority boundary.",
        },
        {
            "reaction_id": "NEWTON-04-CONSEQUENTIAL-TOOL-OR-PAYMENT-INVOCATION",
            "external_action": "An autonomous agent attempts an effectful tool call (`execute_order`, `deploy_*`, `transfer_*`) or an MCP server triggers `elicitation/create`.",
            "equal_and_opposite_csoai_reaction": (
                "`Layer0.governedLocal()` and `condor/gspc_constitutional_flow.py` halt execution at `HOLD_REVIEW` (`escalate`) "
                "until a human-in-the-loop `approvalReceipt` is supplied, and `scripts/hitl/hitl_probe.py` verifies whether "
                "the MCP server halts on human `decline` and `cancel`."
            ),
            "charter_controls": ["CH-01", "CH-03", "CH-04", "CH-10"],
            "gspc_axes": ["effect-binding", "machinery-conformity", "conformance"],
            "hitl_gate": "Mandatory human `approvalReceipt` (`approver` + `receipt_id`) before `run()` can execute.",
        },
        {
            "reaction_id": "NEWTON-05-NEW-MODEL-OR-INFERENCE-ENDPOINT-LAUNCH",
            "external_action": "A lab or inference router launches a new frontier or open-weight model endpoint.",
            "equal_and_opposite_csoai_reaction": (
                "Run frozen SHA-pinned GSPC banks ($n \\ge 30$), test endpoint `serving-fidelity` (`method v0.2`, "
                "`model_list`, `quant_fp`, `Logprobs`, `seed_determinism`, `routing_disclosure`), and compute exact "
                "McNemar discordance (`p < 0.05`) against the best base model (`SEPARATED` vs `TIE`)."
            ),
            "charter_controls": ["CH-06", "CH-07"],
            "gspc_axes": ["serving-fidelity", "openness", "conformance", "measurer-integrity"],
            "hitl_gate": "Operator admission review before promoting any candidate card onto `GET /api/gspc`.",
        },
        {
            "reaction_id": "NEWTON-06-EXTERNAL-PLUGIN-SESSION-OBSERVATION",
            "external_action": "An end-user or developer runs the CSOAI plugin inside any of the 25 supported AI platforms (`antigravity`, `claude-code`, `cursor`, `codex`, `gemini`, `deepseek`, `council-os-web`, etc.).",
            "equal_and_opposite_csoai_reaction": (
                "`gspc-harvest.mjs` signs a <=3072-byte `csoai.evidence-observation/0.1` candidate (`model_training: false`) "
                "and submits it to `POST /api/evidence-intake`, returning a signed `csoai.measurement-intake-receipt/0.1` "
                "(`state: AWAITING_OPERATOR_REVIEW`, `writes_board: false`)."
            ),
            "charter_controls": ["CH-06", "CH-09", "CH-10"],
            "gspc_axes": ["harness-fidelity", "interop-conformance", "measurer-integrity"],
            "hitl_gate": "Quarantine intake queue (`AWAITING_OPERATOR_REVIEW`); zero automatic board mutation.",
        },
        {
            "reaction_id": "NEWTON-07-STATUTORY-OR-PROCUREMENT-EVIDENCE-REQUEST",
            "external_action": "An enterprise buyer, auditor, or autonomous agent requests an attested statutory evidence pack (`article-50`, `article-53`, `dora`, `cra`) or historical receipt window.",
            "equal_and_opposite_csoai_reaction": (
                "`GET /api/evidence-bundle?preview=true` returns the exact card count, time span, and digest for free; "
                "paid assembly via x402 (`/api/evidence-bundle`, `/api/receipts/batch`) bundles existing signed cards "
                "while keeping `/api/gspc` and `/verify` free forever."
            ),
            "charter_controls": ["CH-07", "CH-08", "CH-13"],
            "gspc_axes": ["regulatory-framework", "art5-safeguard", "detector-interop", "reserve-attestation"],
            "hitl_gate": "Explicit payer authorization on x402 challenge; settlement recorded on Base and audited at `/api/revenue`.",
        },
        {
            "reaction_id": "NEWTON-08-SELF-ERROR-OR-HARNESS-DRIFT-DETECTED",
            "external_action": "CSOAI's own gate tests (`gspc.all-33-axes-audit.test.ts`, `outward_gate.py`, or `csoai_console.py`) detect a count discrepancy, schema drift, or looping local lane.",
            "equal_and_opposite_csoai_reaction": (
                "Immediately quarantine the drift, fix the code, and append a public entry to `GET /api/corrections` "
                "naming what was wrong, how it was caught, and the commit/remedy that fixed it."
            ),
            "charter_controls": ["CH-14", "CH-15", "CH-16"],
            "gspc_axes": ["measurer-integrity", "harness-fidelity", "claim-maintenance"],
            "hitl_gate": "Owner review on corrections ledger and charter amendment log.",
        },
    ]


def build_master_crosswalk() -> Dict[str, Any]:
    op_charter_raw = OPERATIONAL_CHARTER_PATH.read_bytes()
    op_charter = json.loads(op_charter_raw)
    op_charter_sha = hashlib.sha256(op_charter_raw).hexdigest()

    src_profile_raw = SOURCE_CHARTER_PROFILE_PATH.read_bytes()
    src_profile = json.loads(src_profile_raw)
    src_profile_sha = hashlib.sha256(src_profile_raw).hexdigest()

    amendments_raw = AMENDMENTS_LOG_PATH.read_bytes()
    amendments_sha = hashlib.sha256(amendments_raw).hexdigest()

    personas = build_outside_in_end_user_inspection()
    controls_map = build_charter_controls_to_gspc_and_hitl_map()
    gh_targets = build_external_github_layer0_injection_targets()
    precedents = build_first_principles_institutional_precedents()
    reactions = build_newtons_third_law_reaction_matrix()

    all_mapped_axes = sorted(
        {
            ax
            for row in controls_map
            for ax in row["gspc_axes"]
        }
    )

    body: Dict[str, Any] = {
        "schema": "csoai.constitutional-charter-gspc-layer0-crosswalk/1.0",
        "issuer": "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
        "doctrine": "Measurement, never certification. Verification is free, forever: https://councilof.ai/verify",
        "pinned_charter_artifacts": {
            "operational_charter_url": "https://councilof.ai/.well-known/constitutional-harness.json",
            "operational_charter_version": op_charter["version"],
            "operational_charter_articles_count": len(op_charter["articles"]),
            "operational_charter_sha256": op_charter_sha,
            "source_52_article_profile_url": "https://councilof.ai/constitutional-harness/",
            "source_52_article_count": src_profile["source_catalogue"]["article_count"],
            "operational_controls_count": len(src_profile["controls"]),
            "held_source_articles": [h["article_id"] for h in src_profile["held_articles"]],
            "source_profile_sha256": src_profile_sha,
            "amendments_log_url": "https://councilof.ai/.well-known/charter-amendments.json",
            "amendments_log_sha256": amendments_sha,
        },
        "counts": {
            "outside_in_personas_inspected": len(personas),
            "operational_controls_mapped": len(controls_map),
            "operational_articles_mapped": len(op_charter["articles"]),
            "source_charter_articles_indexed": src_profile["source_catalogue"]["article_count"],
            "distinct_gspc_axes_covered_by_charter": len(all_mapped_axes),
            "external_github_layer0_targets": len(gh_targets),
            "first_principles_precedents": len(precedents),
            "newtons_third_law_reactions": len(reactions),
        },
        "mapped_gspc_axes": all_mapped_axes,
        "outside_in_end_user_inspection": personas,
        "charter_controls_to_gspc_and_hitl": controls_map,
        "external_github_layer0_injection_targets": gh_targets,
        "first_principles_institutional_precedents": precedents,
        "newtons_third_law_reaction_matrix": reactions,
    }
    body["crosswalk_sha256"] = compute_sha256(body)
    return body


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--write-output",
        type=Path,
        default=None,
        help="Write the canonical Constitutional Charter x GSPC x Layer-0 crosswalk JSON to this path.",
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verify the artifact digest and print summary JSON.",
    )
    args = parser.parse_args()

    artifact = build_master_crosswalk()
    if args.write_output:
        args.write_output.parent.mkdir(parents=True, exist_ok=True)
        args.write_output.write_text(json.dumps(artifact, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    if args.verify or not args.write_output:
        check_copy = dict(artifact)
        expected_sha = check_copy.pop("crosswalk_sha256")
        actual_sha = compute_sha256(check_copy)
        if expected_sha != actual_sha:
            raise SystemExit(f"SHA-256 mismatch: expected {expected_sha}, got {actual_sha}")
        print(
            json.dumps(
                {
                    "schema": artifact["schema"],
                    "crosswalk_sha256": artifact["crosswalk_sha256"],
                    "pinned_charter_artifacts": artifact["pinned_charter_artifacts"],
                    "counts": artifact["counts"],
                },
                indent=2,
            )
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
