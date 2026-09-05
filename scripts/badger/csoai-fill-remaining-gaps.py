#!/usr/bin/env python3
"""csoai-fill-remaining-gaps.py — fill the remaining gaps.

Fills:
  1. 8 remaining well-known standards (you-api, pi-api, microsoft-copilot, etc.)
  2. Game interop schemas (10 game data contracts)
  3. Pipeline registry (4 pipeline types)
  4. XRPL + Base + ETH chains index
  5. 5 missing engine SKUs (perplexity, cohere, groq, together, fireworks)
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(".")
INTEROP = ROOT / "public" / "interop"
WK = ROOT / "public" / ".well-known"
PIPELINES = ROOT / "public" / "pipelines"


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


# 1. Remaining well-known standards
PLATFORM_STANDARDS = [
    ("you-api.json", "You.com API", "You.com AI search API"),
    ("pi-api.json", "Pi API", "Inflection Pi assistant API"),
    ("microsoft-copilot.json", "Microsoft 365 Copilot Plugin", "M365 Copilot plugin manifest"),
    ("reka-api.json", "Reka Core API", "Reka multimodal AI API"),
    ("mistral-functions.json", "Mistral Functions", "Mistral function calling"),
    ("perplexity-pages.json", "Perplexity Pages", "Perplexity Pages (citation-backed pages)"),
    ("poe-bot.json", "Poe Bot", "Poe bot format (Quora)"),
    ("coze-bot.json", "Coze Bot", "Coze bot format (ByteDance)"),
]


# 2. Game interop schemas
GAME_SCHEMAS = {
    "council-town": {
        "kind": "open-world-deliberation",
        "input_schema": "csoai.game.council-town.input/0.1",
        "output_schema": "csoai.game.council-town.output/0.1",
        "events": ["agent.move", "agent.speak", "agent.vote", "world.tick"],
    },
    "council-minds": {
        "kind": "deliberation",
        "input_schema": "csoai.game.council-minds.input/0.1",
        "output_schema": "csoai.game.council-minds.output/0.1",
        "events": ["agent.propose", "agent.deliberate", "agent.resolve"],
    },
    "hive-model": {
        "kind": "collaboration",
        "input_schema": "csoai.game.hive-model.input/0.1",
        "output_schema": "csoai.game.hive-model.output/0.1",
        "events": ["agent.connect", "agent.share", "agent.solve"],
    },
    "arena": {
        "kind": "comparison",
        "input_schema": "csoai.game.arena.input/0.1",
        "output_schema": "csoai.game.arena.output/0.1",
        "events": ["round.start", "round.score", "round.end"],
    },
    "playbooks": {
        "kind": "scenario",
        "input_schema": "csoai.game.playbooks.input/0.1",
        "output_schema": "csoai.game.playbooks.output/0.1",
        "events": ["scenario.start", "step.complete", "scenario.end"],
    },
    "course-player": {
        "kind": "education",
        "input_schema": "csoai.game.course-player.input/0.1",
        "output_schema": "csoai.game.course-player.output/0.1",
        "events": ["lesson.start", "quiz.submit", "lesson.complete"],
    },
    "pdca-simulator": {
        "kind": "improvement",
        "input_schema": "csoai.game.pdca-simulator.input/0.1",
        "output_schema": "csoai.game.pdca-simulator.output/0.1",
        "events": ["plan.start", "do.execute", "check.measure", "act.adjust"],
    },
    "swarm": {
        "kind": "agent-swarm",
        "input_schema": "csoai.game.swarm.input/0.1",
        "output_schema": "csoai.game.swarm.output/0.1",
        "events": ["agent.spawn", "agent.communicate", "agent.consensus"],
    },
    "civic": {
        "kind": "deliberation",
        "input_schema": "csoai.game.civic.input/0.1",
        "output_schema": "csoai.game.civic.output/0.1",
        "events": ["citizen.speak", "citizen.vote", "decision.execute"],
    },
    "tournament": {
        "kind": "competition",
        "input_schema": "csoai.game.tournament.input/0.1",
        "output_schema": "csoai.game.tournament.output/0.1",
        "events": ["match.start", "match.score", "match.end", "leaderboard.update"],
    },
}


# 3. Pipeline registry
PIPELINES_DATA = [
    ("learn-loop", "Learning loop", "Continuous measurement → training → deployment"),
    ("sign-wave", "Sign wave", "Mine atoms → sign → anchor"),
    ("eat-more", "Eat more", "Discover well-known + interop"),
    ("deep-mining", "Deep mining", "Recursive harvest across all chains"),
    ("relentless", "Relentless", "Master loop: every lane every cycle"),
    ("ship-mode", "Ship mode", "Build + test + commit + push + deploy"),
]


# 4. Chains index
CHAINS = [
    ("xrpl", "XRPL", "Ripple XRP Ledger", "https://xrpl.org", "Ed25519 + secp256k1", "rippled"),
    ("base", "Base", "Coinbase L2", "https://base.org", "secp256k1", "op-geth"),
    ("eth", "Ethereum", "Ethereum mainnet", "https://ethereum.org", "secp256k1", "geth"),
    ("op", "Optimism", "OP Mainnet", "https://optimism.io", "secp256k1", "op-geth"),
    ("arb", "Arbitrum", "Arbitrum One", "https://arbitrum.io", "secp256k1", "nitro"),
    ("polygon", "Polygon", "Polygon PoS", "https://polygon.technology", "secp256k1", "bor"),
    ("sol", "Solana", "Solana mainnet", "https://solana.com", "Ed25519", "solana-validator"),
    ("btc", "Bitcoin", "Bitcoin mainnet", "https://bitcoin.org", "secp256k1 (BIP-340)", "bitcoind"),
]


# 5. Missing engine SKUs
MISSING_ENGINE_SKUS = [
    ("engine-perplexity", "Perplexity sonar measurement", 0.30),
    ("engine-cohere", "Cohere Rerank/Embed measurement", 0.20),
    ("engine-groq", "Groq LPU measurement", 0.20),
    ("engine-together", "Together AI measurement", 0.20),
    ("engine-fireworks", "Fireworks AI measurement", 0.20),
]


def main() -> None:
    print("=" * 60)
    print("  FILL REMAINING GAPS")
    print("=" * 60)
    print()

    # 1. Platform standards
    print("[1] 8 REMAINING PLATFORM STANDARDS...")
    for slug, name, desc in PLATFORM_STANDARDS:
        path = WK / slug
        if not path.exists():
            path.write_text(json.dumps({
                "schema": "csoai.well-known/0.1",
                "slug": slug.replace(".json", ""),
                "name": name,
                "description": desc,
                "as_of": now(),
            }, indent=2))
            print(f"  ✓ {slug}")

    # 2. Game interop schemas
    print()
    print("[2] 10 GAME INTEROP SCHEMAS...")
    games_path = INTEROP / "games-interop-schemas.json"
    games_path.write_text(json.dumps({
        "schema": "csoai.games-interop/0.1",
        "as_of": now(),
        "principle": "Every game has a typed input + output schema. Every event signed.",
        "games": GAME_SCHEMAS,
    }, indent=2))
    print(f"  saved: {games_path}")
    print(f"  schemas: {len(GAME_SCHEMAS)}")

    # 3. Pipeline registry
    print()
    print("[3] PIPELINE REGISTRY...")
    PIPELINES.mkdir(parents=True, exist_ok=True)
    pipelines_path = PIPELINES / "index.json"
    pipelines_path.write_text(json.dumps({
        "schema": "csoai.pipelines/0.1",
        "as_of": now(),
        "principle": "Every pipeline is a typed chain of stages.",
        "pipelines": [
            {
                "id": pid,
                "name": name,
                "description": desc,
                "endpoint": f"/api/pipelines/{pid}",
                "trigger": "manual | cron | webhook",
            }
            for pid, name, desc in PIPELINES_DATA
        ],
    }, indent=2))
    print(f"  saved: {pipelines_path}")
    print(f"  pipelines: {len(PIPELINES_DATA)}")

    # 4. Chains index
    print()
    print("[4] CHAINS INDEX (XRPL + Base + ETH + OP + ARB + Polygon + SOL + BTC)...")
    chains_path = INTEROP / "chains-index.json"
    chains_path.write_text(json.dumps({
        "schema": "csoai.chains/0.1",
        "as_of": now(),
        "principle": "Every chain we measure on. Every chain we anchor to.",
        "chains": [
            {
                "id": cid,
                "name": name,
                "description": desc,
                "url": url,
                "signature": sig,
                "node": node,
                "endpoint": f"/api/chains/{cid}",
            }
            for cid, name, desc, url, sig, node in CHAINS
        ],
    }, indent=2))
    print(f"  saved: {chains_path}")
    print(f"  chains: {len(CHAINS)}")

    # 5. Missing engine SKUs
    print()
    print("[5] 5 MISSING ENGINE SKUs...")
    skus_path = INTEROP / "x402-engine-skus-round2.json"
    skus_path.write_text(json.dumps({
        "schema": "csoai.x402-engine-skus-round2/0.1",
        "as_of": now(),
        "principle": "Every engine that can be measured gets its own x402 SKU.",
        "skus": [
            {
                "id": sid,
                "name": name,
                "price_usdc": price,
                "endpoint": f"/api/x402?sku={sid}",
            }
            for sid, name, price in MISSING_ENGINE_SKUS
        ],
    }, indent=2))
    print(f"  saved: {skus_path}")
    print(f"  SKUs: {len(MISSING_ENGINE_SKUS)}")

    print()
    print("=" * 60)
    print(f"  TOTAL: 8 standards + 10 schemas + 6 pipelines + 8 chains + 5 SKUs")
    print("=" * 60)


if __name__ == "__main__":
    main()
