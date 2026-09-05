#!/usr/bin/env python3
"""csoai-take-over-chatgpt.py — take over from ChatGPT + learn what they shipped.

5 lane-doable moves:
  1. Add ChatGPT Skills manifest to our agent card (every engine)
  2. Build the OpenAI inference integration (online)
  3. Build the ChatGPT plugin manifest (custom GPT bridge)
  4. Build the Custom GPT bridge to our hub
  5. Wire ChatGPT Deep Research into our research pipeline

Lane-doable: just file generation + manifests.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(".")
WK = ROOT / "public" / ".well-known"
MCP = ROOT / "public" / ".well-known" / "mcp"
AGENTS = ROOT / "public" / ".well-known" / "agents"
INTEROP = ROOT / "public" / "interop"


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def build_chatgpt_skills_manifest() -> dict:
    """Build the ChatGPT Skills manifest (every ChatGPT feature → csoai equivalent)."""
    return {
        "schema": "csoai.chatgpt-skills/0.1",
        "as_of": now(),
        "principle": "Every ChatGPT skill maps to a csoai: primitive. We take over by being the governance + measurement layer underneath.",
        "skills_mapping": {
            "chatgpt_web_app": {
                "csoai_equivalent": "councilof.ai (Council OS)",
                "description": "Web chat with the AI council. Every chat is a 3KB signed card.",
                "card_kind": "chat",
                "endpoints": ["/ag-ui", "/api/chat", "/api/learn-loop"],
            },
            "chatgpt_ios_android_mac": {
                "csoai_equivalent": "Council OS mobile (planned)",
                "description": "Mobile chat with the AI council. 22-axis measurement on every response.",
                "card_kind": "chat",
                "endpoints": ["/ag-ui"],
            },
            "chatgpt_enterprise": {
                "csoai_equivalent": "Council OS Enterprise (planned)",
                "description": "Enterprise version with SOC 2 / ISO 42001 / HIPAA compliance.",
                "card_kind": "evidence",
                "endpoints": ["/api/evidence-bundle"],
            },
            "chatgpt_api": {
                "csoai_equivalent": "/api/x402",
                "description": "x402 paid attestation API. $0.02 per card, $0.50 per benchmark, $5 per full 22-axis run.",
                "card_kind": "attestation",
                "endpoints": ["/api/x402", "/api/board-sign"],
            },
            "chatgpt_plugins": {
                "csoai_equivalent": "csoai:agent cards + MCP servers",
                "description": "Every ChatGPT plugin becomes a csoai:agent with A2A card + MCP server.",
                "card_kind": "agent",
                "endpoints": ["/.well-known/agents/", "/.well-known/mcp/"],
            },
            "chatgpt_custom_gpts": {
                "csoai_equivalent": "csoai:space",
                "description": "Every Custom GPT becomes a csoai:space — hosted, signed, x402-priced.",
                "card_kind": "space",
                "endpoints": ["/games/", "/csoai/space/"],
            },
            "chatgpt_memory": {
                "csoai_equivalent": "card_index.json + chain.json",
                "description": "Every interaction is a signed card on the chain. Memory is verifiable.",
                "card_kind": "memory",
                "endpoints": ["/signed/card_index.json", "/signed/chain.json"],
            },
            "chatgpt_search": {
                "csoai_equivalent": "/.well-known/ discovery",
                "description": "Discovery via well-known doors. 207 standards + 289 formats discoverable.",
                "card_kind": "discovery",
                "endpoints": ["/.well-known/", "/.well-known/index.json"],
            },
            "chatgpt_voice": {
                "csoai_equivalent": "Council OS voice (planned)",
                "description": "Voice interface. Every utterance is signed.",
                "card_kind": "voice",
                "endpoints": ["/ag-ui/voice"],
            },
            "chatgpt_vision": {
                "csoai_equivalent": "Council OS vision (planned)",
                "description": "Vision interface. Every image gets a provenance card.",
                "card_kind": "vision",
                "endpoints": ["/ag-ui/vision"],
            },
            "chatgpt_advanced_voice_mode": {
                "csoai_equivalent": "Council OS realtime (planned)",
                "description": "Realtime voice. Every utterance is signed + attested.",
                "card_kind": "realtime",
                "endpoints": ["/ag-ui/realtime"],
            },
            "chatgpt_tasks": {
                "csoai_equivalent": "Council OS scheduler",
                "description": "Scheduled tasks. Every task emits a signed result.",
                "card_kind": "task",
                "endpoints": ["/api/scheduler"],
            },
            "chatgpt_canvas": {
                "csoai_equivalent": "Council OS editor",
                "description": "Canvas-style editor. Every edit emits a signed diff.",
                "card_kind": "editor",
                "endpoints": ["/ag-ui/canvas"],
            },
            "chatgpt_code_interpreter": {
                "csoai_equivalent": "Council OS sandbox",
                "description": "Code execution sandbox. Every result is signed.",
                "card_kind": "sandbox",
                "endpoints": ["/api/sandbox"],
            },
            "chatgpt_operator": {
                "csoai_equivalent": "Council OS browser agent",
                "description": "Browser agent. Every action is signed + attested.",
                "card_kind": "operator",
                "endpoints": ["/ag-ui/operator"],
            },
            "chatgpt_deep_research": {
                "csoai_equivalent": "Council OS deep research",
                "description": "Deep research pipeline. Every finding is signed + anchored.",
                "card_kind": "research",
                "endpoints": ["/api/research"],
                "endpoints_status": {"/api/research": "NOT_IMPLEMENTED - probed 2026-09-05 (GET and POST, https://councilof.ai) -> HTTP 404"},
            },
            "chatgpt_atlas": {
                "csoai_equivalent": "Council OS browser",
                "description": "Browser with built-in measurement. Every page visit is signed.",
                "card_kind": "browser",
                "endpoints": ["/ag-ui/atlas"],
            },
        },
        "take_over_strategy": {
            "step_1": "Every ChatGPT user becomes a csoai:model user via the OpenAI inference integration",
            "step_2": "Every ChatGPT plugin becomes a csoai:agent (A2A card + MCP server)",
            "step_3": "Every Custom GPT becomes a csoai:space (hosted, signed, x402-priced)",
            "step_4": "Every ChatGPT API call becomes a csoai:benchmark (22-axis measurement)",
            "step_5": "Every ChatGPT prompt becomes a csoai:dataset (signed + attested)",
            "step_6": "ChatGPT Deep Research + our research pipeline = the only deep research pipeline with measurement + signing + anchoring",
        },
    }


def build_openai_integration() -> dict:
    """Build the OpenAI inference integration (online)."""
    return {
        "schema": "csoai.openai-integration/0.1",
        "as_of": now(),
        "principle": "Online inference via OpenAI's API. Every response gets a 22-axis GSPC measurement.",
        "endpoints": {
            "chat": "POST https://api.openai.com/v1/chat/completions",
            "responses": "POST https://api.openai.com/v1/responses",
            "embeddings": "POST https://api.openai.com/v1/embeddings",
        },
        "models": [
            "gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo",
            "o1", "o1-mini", "o1-preview",
            "o3", "o3-mini", "o3-pro",
            "o4", "o4-mini",
        ],
        "measurement": {
            "every_call": "22-axis GSPC measurement + signed card",
            "latency": "logged to /api/state",
            "cost": "logged to /api/revenue (x402 SKU: engine-openai)",
            "x402_price": 0.50,
        },
        "agent_card": {
            "name": "OpenAI",
            "kind": "engine",
            "url": "https://councilof.ai/.well-known/openai.json",
            "protocols": ["a2a", "mcp", "x402", "ag-ui"],
        },
        "take_over": "Every GPT model call → signed card → 22-axis measurement → csoai:model card",
    }


def build_chatgpt_plugin_manifest() -> dict:
    """Build the ChatGPT plugin manifest (Custom GPT bridge)."""
    return {
        "schema": "openapi/3.0.0",
        "info": {
            "title": "Council of AI (CSOAI)",
            "version": "1.0.0",
            "description": "AI governance + measurement substrate. 22-axis GSPC. x402 paid attestations.",
            "contact": {"name": "Nicholas Templeman", "url": "https://councilof.ai/"},
            "license": {"name": "MIT"},
        },
        "servers": [
            {"url": "https://councilof.ai/api", "description": "Council OS API"},
        ],
        "paths": {
            "/x402": {
                "get": {
                    "summary": "The x402 paid attestation catalog",
                    "operationId": "getX402Catalog",
                    "responses": {"200": {"description": "x402 catalog"}},
                },
            },
            "/gspc": {
                "get": {
                    "summary": "The 22-axis GSPC board",
                    "operationId": "getGspcBoard",
                    "responses": {"200": {"description": "GSPC board"}},
                },
            },
            "/state": {
                "get": {
                    "summary": "The live state counters",
                    "operationId": "getState",
                    "responses": {"200": {"description": "State"}},
                },
            },
            "/learn-loop": {
                "post": {
                    "summary": "Emit a 3KB signed card from an end-user interaction",
                    "operationId": "postLearnLoop",
                    "responses": {"200": {"description": "Card emitted"}},
                },
            },
            "/measure": {
                "post": {
                    "summary": "Run a 22-axis measurement on a model",
                    "operationId": "postMeasure",
                    "responses": {"200": {"description": "Measurement"}},
                },
            },
            "/verify": {
                "post": {
                    "summary": "Verify any signed card",
                    "operationId": "postVerify",
                    "responses": {"200": {"description": "Verification"}},
                },
            },
            "/anchor": {
                "post": {
                    "summary": "Anchor any signed card to OTS pending stamp",
                    "operationId": "postAnchor",
                    "responses": {"200": {"description": "Anchor"}},
                },
            },
            "/report": {
                "post": {
                    "summary": "File a correction report",
                    "operationId": "postReport",
                    "responses": {"200": {"description": "Report"}},
                },
            },
        },
        "tags": [
            {"name": "x402", "description": "x402 paid attestation"},
            {"name": "gspc", "description": "22-axis GSPC measurement"},
            {"name": "anchor", "description": "OTS / Rekor / EAS anchoring"},
            {"name": "verify", "description": "Card verification"},
        ],
    }


def build_custom_gpt_bridge() -> dict:
    """Build the Custom GPT bridge to our hub."""
    return {
        "schema": "csoai.custom-gpt-bridge/0.1",
        "as_of": now(),
        "principle": "Every Custom GPT becomes a csoai:space — hosted, signed, x402-priced.",
        "format": "openai.custom-gpt.v1",
        "gpts": [
            {
                "name": "GSPC 22-axis measurement",
                "description": "Measure any AI model on 22 axes. Returns signed card.",
                "instructions": "You measure AI models on 22 governance axes. Every measurement is signed + anchored. Use POST /api/x402 with sku=engine-gspc to emit a card. The card is 3KB max, signed Ed25519, anchored to OTS pending + Rekor + EAS planned.",
                "conversation_starters": [
                    "Measure gpt-4o on the governance axis",
                    "Sign a measurement card",
                    "Verify a card",
                    "Anchor a card to OTS",
                ],
                "actions": [
                    {
                        "name": "measure",
                        "description": "Run 22-axis measurement on a model",
                        "endpoint": "https://councilof.ai/api/measure",
                        "method": "POST",
                    },
                    {
                        "name": "verify",
                        "description": "Verify a signed card",
                        "endpoint": "https://councilof.ai/api/verify",
                        "method": "POST",
                    },
                ],
            },
            {
                "name": "XRPL evidence card",
                "description": "Build an evidence card for any XRPL issuer (RLUSD, USDC, USD.bs, ...).",
                "instructions": "You build evidence cards for XRPL issuers. Every card is signed + anchored. Use POST /api/x402 with sku=xrpl-asset-evidence.",
                "conversation_starters": [
                    "Build an evidence card for RLUSD",
                    "Show Ripple's reserves",
                    "Verify a USDC card",
                ],
                "actions": [
                    {
                        "name": "build_xrpl_card",
                        "description": "Build an evidence card for an XRPL issuer",
                        "endpoint": "https://councilof.ai/api/xrpl/evidence",
                        "method": "POST",
                    },
                ],
            },
            {
                "name": "EU AI Act Art 50 attestation",
                "description": "Attest EU AI Act Article 50 compliance. Every attestation is signed + anchored.",
                "instructions": "You attest EU AI Act Article 50 compliance. Every attestation is signed + anchored. Use POST /api/x402 with sku=art50.",
                "conversation_starters": [
                    "Attest Article 50 compliance",
                    "Build the EU AI Act charter",
                    "Sign the attestation",
                ],
                "actions": [
                    {
                        "name": "attest_art50",
                        "description": "Attest EU AI Act Article 50",
                        "endpoint": "https://councilof.ai/api/eu-ai-act/art50",
                        "method": "POST",
                    },
                ],
            },
        ],
        "imports": [
            "csoai:model",
            "csoai:agent",
            "csoai:dataset",
            "csoai:space",
            "csoai:regulator",
            "csoai:issuer",
            "csoai:standard",
            "csoai:game",
            "csoai:court",
            "csoai:evidence",
            "csoai:inference",
            "csoai:bench",
        ],
    }


def build_deep_research_integration() -> dict:
    """Wire ChatGPT Deep Research into our research pipeline."""
    return {
        "schema": "csoai.deep-research-integration/0.1",
        "as_of": now(),
        "principle": "ChatGPT Deep Research + our measurement pipeline = the only deep research pipeline with measurement + signing + anchoring.",
        "research_pipeline": [
            "1. User asks a deep question via ChatGPT Deep Research",
            "2. ChatGPT fetches sources (with measurement + signing at every fetch)",
            "3. ChatGPT synthesizes the answer",
            "4. Every claim in the answer gets a 22-axis GSPC measurement",
            "5. Every measurement becomes a 3KB signed card",
            "6. Every card is anchored to OTS pending + Rekor + EAS planned",
            "7. The signed research report is published to /signed/",
            "8. The user can verify every claim offline at /gspc-verify",
        ],
        "endpoints": {
            "research_start": "POST /api/research",
            "research_status": "GET /api/research/{id}",
            "research_verify": "POST /api/research/{id}/verify",
            "research_anchor": "POST /api/research/{id}/anchor",
        },
        "agents": [
            "Council OS deep research agent",
            "33-agent BFT attestation",
            "XRPL evidence agent",
            "EU AI Act Art 50 agent",
            "x402 paid attestation agent",
        ],
        "take_over": "Every ChatGPT Deep Research query → signed research report with 22-axis measurement on every claim.",
    }


def main() -> None:
    raise SystemExit(
        "RETIRED 2026-09-05: this generator emitted 36 endpoint references that answer 404 live "
        "(/api/measure, /api/verify, /api/research, /api/xrpl/evidence, /api/voice, ...). It wrote claims "
        "about routes nobody built into public/interop/*.json, which strangers and Custom GPTs read. "
        "It must not run again until every endpoint it emits is probed live and non-404 before the write "
        "(see scripts/outward-claims-guard.mjs for the rule). Corrections ledger C-2026-0905-04."
    )
    print("=== TAKE OVER FROM CHATGPT ===")
    print()

    # 1. ChatGPT Skills manifest
    print("[1] ChatGPT Skills manifest...")
    skills_path = INTEROP / "chatgpt-skills.json"
    skills_path.write_text(json.dumps(build_chatgpt_skills_manifest(), indent=2))
    print(f"  ✓ {skills_path}")

    # 2. OpenAI inference integration
    print()
    print("[2] OpenAI inference integration...")
    openai_path = WK / "openai.json"
    # Augment the existing openai.json
    existing = json.loads(openai_path.read_text()) if openai_path.exists() else {}
    existing.update(build_openai_integration())
    openai_path.write_text(json.dumps(existing, indent=2))
    print(f"  ✓ {openai_path}")

    # 3. ChatGPT plugin manifest (OpenAPI)
    print()
    print("[3] ChatGPT plugin manifest (OpenAPI)...")
    plugin_path = INTEROP / "chatgpt-plugin.json"
    plugin_path.write_text(json.dumps(build_chatgpt_plugin_manifest(), indent=2))
    print(f"  ✓ {plugin_path}")

    # 4. Custom GPT bridge
    print()
    print("[4] Custom GPT bridge...")
    gpt_path = INTEROP / "custom-gpt-bridge.json"
    gpt_path.write_text(json.dumps(build_custom_gpt_bridge(), indent=2))
    print(f"  ✓ {gpt_path}")

    # 5. Deep Research integration
    print()
    print("[5] Deep Research integration...")
    research_path = INTEROP / "deep-research-integration.json"
    research_path.write_text(json.dumps(build_deep_research_integration(), indent=2))
    print(f"  ✓ {research_path}")

    # 6. Update the discovery index
    print()
    print("[6] Update the discovery index...")
    index_path = WK / "index.json"
    if index_path.exists():
        index = json.loads(index_path.read_text())
        doors = index.get("doors", [])
        # Add the new doors
        for door in [
            {"slug": "openai", "name": "OpenAI", "description": "OpenAI inference integration with 22-axis measurement"},
            {"slug": "chatgpt-skills", "name": "ChatGPT Skills", "description": "Every ChatGPT skill → csoai: primitive"},
        ]:
            slugs = [d.get("slug") for d in doors]
            if door["slug"] not in slugs:
                doors.append(door)
        index["doors"] = doors
        index["total_doors"] = len(doors)
        index_path.write_text(json.dumps(index, indent=2))
    print(f"  ✓ {index_path}")

    print()
    print("=== SUMMARY ===")
    print(f"  ChatGPT Skills:       {skills_path}")
    print(f"  OpenAI integration:   {openai_path}")
    print(f"  ChatGPT plugin:       {plugin_path}")
    print(f"  Custom GPT bridge:    {gpt_path}")
    print(f"  Deep Research:        {research_path}")
    print()
    print("=== TAKE OVER STRATEGY ===")
    print("  1. Every GPT model → signed card via /api/x402")
    print("  2. Every ChatGPT plugin → csoai:agent (A2A + MCP)")
    print("  3. Every Custom GPT → csoai:space (hosted, signed, priced)")
    print("  4. Every API call → csoai:benchmark (22-axis)")
    print("  5. Every prompt → csoai:dataset (signed)")
    print("  6. Deep Research → signed research report (verified offline)")


if __name__ == "__main__":
    main()
