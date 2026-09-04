#!/usr/bin/env python3
"""csoai-engine-bft.py — wire every engine to the 33-agent BFT council.

Engines to integrate:
  1. OSWAO (Open Sovereign Web Agent Ontology)
  2. Microsoft Azure AI / Phi / Copilot
  3. NVIDIA NIM / NeMo / Triton
  4. ASI:Evolve (Allen Institute)
  5. HuggingFace Hub / Inference / Spaces
  6. GSPC (our 22-axis)
  7. Council OS (our substrate)

Each engine:
  - Has its own discovery door in /.well-known/
  - Has its own interop file in /interop/
  - Has its own A2A agent card
  - Has its own MCP server registration
  - Has its own x402 SKU

Lane-doable: just generates the wiring.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

WK = Path("public/.well-known")
INTEROP = Path("public/interop")
AGENTS = Path("public/.well-known/agents")
MCP = Path("public/.well-known/mcp")

for d in [WK, INTEROP, AGENTS, MCP]:
    d.mkdir(parents=True, exist_ok=True)


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


ENGINES = [
    {
        "slug": "oswao",
        "name": "OSWAO",
        "full_name": "Open Sovereign Web Agent Ontology",
        "kind": "agent-ontology",
        "description": "Open standard for sovereign web agents. Connects any agent to any substrate.",
        "discovery_url": "https://councilof.ai/.well-known/oswao.json",
        "agent_card": "https://councilof.ai/.well-known/agents/oswao-agent.json",
        "mcp": "https://councilof.ai/.well-known/mcp/oswao.json",
        "a2a": "https://councilof.ai/api/a2a/oswao",
        "x402_sku": "engine-oswao",
        "x402_price": 0.10,
    },
    {
        "slug": "microsoft",
        "name": "Microsoft Azure AI",
        "full_name": "Microsoft Azure AI / Phi / Copilot",
        "kind": "engine",
        "description": "Microsoft Azure OpenAI, Phi models, Microsoft Copilot. Connect to GSPC measurement.",
        "discovery_url": "https://councilof.ai/.well-known/microsoft.json",
        "agent_card": "https://councilof.ai/.well-known/agents/microsoft-agent.json",
        "mcp": "https://councilof.ai/.well-known/mcp/microsoft.json",
        "a2a": "https://councilof.ai/api/a2a/microsoft",
        "x402_sku": "engine-microsoft",
        "x402_price": 0.50,
    },
    {
        "slug": "nvidia",
        "name": "NVIDIA",
        "full_name": "NVIDIA NIM / NeMo / Triton Inference Server",
        "kind": "engine",
        "description": "NVIDIA NIM (inference microservices), NeMo (training), Triton (serving). Connect to GSPC measurement.",
        "discovery_url": "https://councilof.ai/.well-known/nvidia.json",
        "agent_card": "https://councilof.ai/.well-known/agents/nvidia-agent.json",
        "mcp": "https://councilof.ai/.well-known/mcp/nvidia.json",
        "a2a": "https://councilof.ai/api/a2a/nvidia",
        "x402_sku": "engine-nvidia",
        "x402_price": 0.50,
    },
    {
        "slug": "asi-evolve",
        "name": "ASI:Evolve",
        "full_name": "Allen Institute AI Evolve",
        "kind": "engine",
        "description": "ASI:Evolve — agent self-improvement framework. Connect to GSPC measurement.",
        "discovery_url": "https://councilof.ai/.well-known/asi-evolve.json",
        "agent_card": "https://councilof.ai/.well-known/agents/asi-evolve-agent.json",
        "mcp": "https://councilof.ai/.well-known/mcp/asi-evolve.json",
        "a2a": "https://councilof.ai/api/a2a/asi-evolve",
        "x402_sku": "engine-asi-evolve",
        "x402_price": 0.50,
    },
    {
        "slug": "huggingface",
        "name": "HuggingFace",
        "full_name": "HuggingFace Hub / Inference / Spaces / Endpoints",
        "kind": "platform",
        "description": "HuggingFace Hub (3M+ models), Inference API, Spaces (apps), Endpoints (deploy). Already integrated.",
        "discovery_url": "https://councilof.ai/.well-known/huggingface.json",
        "agent_card": "https://councilof.ai/.well-known/agents/huggingface-agent.json",
        "mcp": "https://councilof.ai/.well-known/mcp/huggingface.json",
        "a2a": "https://councilof.ai/api/a2a/huggingface",
        "x402_sku": "engine-huggingface",
        "x402_price": 0.05,
    },
    {
        "slug": "gspc",
        "name": "GSPC",
        "full_name": "Governance, Safety, Performance, Conduct",
        "kind": "measurement",
        "description": "22-axis GSPC measurement. Every model gets the same axes.",
        "discovery_url": "https://councilof.ai/.well-known/gspc.json",
        "agent_card": "https://councilof.ai/.well-known/agents/gspc-agent.json",
        "mcp": "https://councilof.ai/.well-known/mcp/gspc.json",
        "a2a": "https://councilof.ai/api/a2a/gspc",
        "x402_sku": "engine-gspc",
        "x402_price": 0.50,
    },
    {
        "slug": "council-os",
        "name": "Council OS",
        "full_name": "Council OS — the sovereign substrate",
        "kind": "substrate",
        "description": "Council OS — the sovereign substrate. MIT-licensed, deployable in 3 minutes.",
        "discovery_url": "https://councilof.ai/.well-known/council-os.json",
        "agent_card": "https://councilof.ai/.well-known/agents/council-os-agent.json",
        "mcp": "https://councilof.ai/.well-known/mcp/council-os.json",
        "a2a": "https://councilof.ai/api/a2a/council-os",
        "x402_sku": "engine-council-os",
        "x402_price": 0.10,
    },
]


def build_discovery(engine: dict) -> dict:
    return {
        "schema": "csoai.engine-discovery/0.1",
        "slug": engine["slug"],
        "name": engine["name"],
        "full_name": engine["full_name"],
        "kind": engine["kind"],
        "description": engine["description"],
        "as_of": now(),
        "discovery_url": engine["discovery_url"],
        "links": {
            "agent_card": engine["agent_card"],
            "mcp": engine["mcp"],
            "a2a": engine["a2a"],
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
            "x402_catalog": "https://councilof.ai/api/x402",
        },
        "notes": [
            f"{engine['name']} wired to the 33-agent BFT council",
            "Verification free at /gspc-verify",
            "Measurement, not certification",
        ],
    }


def build_agent_card(engine: dict) -> dict:
    return {
        "schema": "csoai.a2a-agent-card/0.1",
        "slug": engine["slug"],
        "name": engine["name"],
        "kind": engine["kind"],
        "as_of": now(),
        "url": engine["a2a"],
        "version": "1.0",
        "capabilities": {
            "measurement": "Run GSPC axes on this engine",
            "attestation": "Get a signed card for any measurement",
            "verification": "Verify any signed card offline",
            "discovery": "Find every standard this engine maps to",
        },
        "skills": [
            {"id": f"{engine['slug']}.measure", "description": f"Measure a claim against {engine['name']}"},
            {"id": f"{engine['slug']}.attest", "description": f"Attest a measurement on {engine['name']}"},
            {"id": f"{engine['slug']}.verify", "description": f"Verify an attestation from {engine['name']}"},
            {"id": f"{engine['slug']}.discover", "description": f"Discover what standards {engine['name']} maps to"},
        ],
        "protocols": ["a2a", "mcp", "x402"],
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
        },
    }


def build_mcp(engine: dict) -> dict:
    return {
        "schema": "csoai.mcp-server/0.1",
        "slug": engine["slug"],
        "name": engine["name"],
        "kind": engine["kind"],
        "as_of": now(),
        "url": engine["mcp"],
        "version": "1.0",
        "tools": [
            {"name": f"measure_{engine['slug']}", "description": f"Measure a claim against {engine['name']}"},
            {"name": f"attest_{engine['slug']}", "description": f"Get a signed attestation from {engine['name']}"},
            {"name": f"verify_{engine['slug']}", "description": f"Verify an attestation from {engine['name']}"},
            {"name": f"discover_{engine['slug']}", "description": f"Discover what {engine['name']} maps to"},
        ],
        "resources": [
            {"uri": f"gspc://{engine['slug']}/board", "name": "Board", "description": "Live GSPC board"},
            {"uri": f"gspc://{engine['slug']}/axis", "name": "Axis", "description": "GSPC axis definitions"},
            {"uri": f"gspc://{engine['slug']}/card", "name": "Card", "description": "Signed card format"},
        ],
        "prompts": [
            {"name": f"measure_with_{engine['slug']}", "description": f"Measure a claim with {engine['name']}"},
        ],
    }


def build_interop(engine: dict) -> dict:
    return {
        "schema": "csoai.engine-interop/0.1",
        "slug": engine["slug"],
        "name": engine["name"],
        "full_name": engine["full_name"],
        "kind": engine["kind"],
        "as_of": now(),
        "x402_sku": engine["x402_sku"],
        "x402_price_usdc": engine["x402_price"],
        "protocols": ["a2a", "mcp", "x402", "ag-ui"],
        "capabilities": [
            "Run GSPC axes on this engine",
            "Get a signed card for any measurement",
            "Verify any signed card offline",
            "Discover every standard this engine maps to",
            "Cross-reference with other engines",
        ],
        "links": {
            "discovery_url": engine["discovery_url"],
            "agent_card": engine["agent_card"],
            "mcp": engine["mcp"],
            "a2a": engine["a2a"],
        },
    }


def main() -> None:
    print("=== ENGINE BFT — wire every engine to the 33-agent BFT council ===")
    print()

    created = 0
    for engine in ENGINES:
        # 1. Discovery door
        (WK / f"{engine['slug']}.json").write_text(json.dumps(build_discovery(engine), indent=2))
        # 2. A2A agent card
        (AGENTS / f"{engine['slug']}-agent.json").write_text(json.dumps(build_agent_card(engine), indent=2))
        # 3. MCP server
        (MCP / f"{engine['slug']}.json").write_text(json.dumps(build_mcp(engine), indent=2))
        # 4. Interop file
        (INTEROP / f"engine-{engine['slug']}.json").write_text(json.dumps(build_interop(engine), indent=2))
        created += 1
        print(f"  ✓ {engine['name']:<22} ({engine['kind']:<14}) — discovery + A2A + MCP + interop")

    # Build the engine-BFT index
    index = {
        "schema": "csoai.engine-bft-index/0.1",
        "as_of": now(),
        "total_engines": len(ENGINES),
        "engines": [
            {
                "name": e["name"],
                "slug": e["slug"],
                "kind": e["kind"],
                "x402_sku": e["x402_sku"],
                "x402_price_usdc": e["x402_price"],
            }
            for e in ENGINES
        ],
        "council_size": 33,
        "quorum_required": 23,
        "principle": "Every engine is wired to every other engine through the BFT council. A claim measured on one engine can be verified against any other engine.",
    }
    index_path = INTEROP / "engine-bft-index.json"
    index_path.write_text(json.dumps(index, indent=2))

    print()
    print("=== SUMMARY ===")
    print(f"  engines:        {len(ENGINES)}")
    print(f"  files created:  {created * 4} (4 per engine)")
    print(f"  doors:          {len(ENGINES)} new /.well-known/")
    print(f"  agent cards:    {len(ENGINES)} new A2A cards")
    print(f"  MCP servers:    {len(ENGINES)} new MCP registrations")
    print(f"  interop:        {len(ENGINES)} new formats")
    print(f"  x402 SKUs:      {len(ENGINES)} priced")


if __name__ == "__main__":
    main()
