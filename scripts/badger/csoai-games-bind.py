#!/usr/bin/env python3
"""csoai-games-bind.py — bind the 3-anchor + layer 0 ceremony to the gaming mechanics.

The game IS the data collection. Each game emits an Ed25519-signed card.
AG-UI + A2UI provide the chat interface for AI-powered play.
Multiplayer: rooms, players, moves, signed turns.

Games to bind:
  1. Council Town ✅ LIVE — AI Town fork, PixiJS, agent clans
  2. Council Minds — agent deliberation
  3. Hive Model — multi-agent hive
  4. Arena — model arena
  5. GSPC Arena — measurement arena
  6. Playbooks — multi-step scenarios
  7. Course Player — guided lessons
  8. PDCA Simulator — governance cycles
  9. Swarm — agent swarm
 10. Civic — civic deliberation

Each game:
  - Has its own /.well-known/ door (discovery)
  - Has its own AG-UI chat
  - Has its own A2UI panel
  - Emits Ed25519-signed turns
  - Anchors every session to OTS/Rekor/EAS
  - Multiplayer rooms via WebSocket

Lane-doable: just file generation + wiring.
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


GAMES = [
    {
        "slug": "council-town",
        "name": "Council Town",
        "kind": "open-world-multi-agent",
        "engine": "PixiJS + AI Town fork",
        "description": "Agent clans deliberating in an open world.",
        "status": "LIVE",
        "axes_related": ["governance", "safety"],
        "multiplayer": True,
        "players": "8-64 players per town",
        "agui": True,
        "a2ui": True,
        "x402_sku": "game-council-town",
        "x402_price": 0.50,
    },
    {
        "slug": "council-minds",
        "name": "Council Minds",
        "kind": "deliberation",
        "engine": "React + agent orchestration",
        "description": "Multiple agents deliberate a question.",
        "status": "LIVE",
        "axes_related": ["governance", "safety"],
        "multiplayer": True,
        "players": "2-8 players",
        "agui": True,
        "a2ui": True,
        "x402_sku": "game-council-minds",
        "x402_price": 0.20,
    },
    {
        "slug": "hive-model",
        "name": "Hive Model",
        "kind": "multi-agent-hive",
        "engine": "PixiJS + council-os substrate",
        "description": "A hive of agents collaborates to solve a problem.",
        "status": "LIVE",
        "axes_related": ["governance", "safety"],
        "multiplayer": True,
        "players": "4-32 players",
        "agui": True,
        "a2ui": True,
        "x402_sku": "game-hive-model",
        "x402_price": 0.30,
    },
    {
        "slug": "arena",
        "name": "Arena",
        "kind": "model-arena",
        "engine": "React + model APIs",
        "description": "Two AI models compete on a benchmark.",
        "status": "LIVE",
        "axes_related": [],
        "multiplayer": True,
        "players": "spectator + challenger",
        "agui": True,
        "a2ui": True,
        "x402_sku": "game-arena",
        "x402_price": 0.10,
    },
    {
        "slug": "gspc-arena",
        "name": "GSPC Arena",
        "kind": "measurement-arena",
        "engine": "React + GSPC substrate",
        "description": "Two AI models play a scored round. A game result is not a board measurement.",
        "status": "LIVE",
        "axes_related": ["governance", "safety"],
        "multiplayer": True,
        "players": "spectator + challenger",
        "agui": True,
        "a2ui": True,
        "x402_sku": "game-gspc-arena",
        "x402_price": 0.50,
    },
    {
        "slug": "playbooks",
        "name": "Playbooks",
        "kind": "scenario",
        "engine": "React + scenario engine",
        "description": "Multi-step governance scenarios.",
        "status": "LIVE",
        "axes_related": ["governance", "safety"],
        "multiplayer": False,
        "players": "single player",
        "agui": True,
        "a2ui": True,
        "x402_sku": "game-playbooks",
        "x402_price": 0.10,
    },
    {
        "slug": "course-player",
        "name": "Course Player",
        "kind": "education",
        "engine": "React + course engine",
        "description": "Guided lessons on AI governance.",
        "status": "LIVE",
        "axes_related": ["governance", "safety"],
        "multiplayer": False,
        "players": "single player",
        "agui": True,
        "a2ui": True,
        "x402_sku": "game-course-player",
        "x402_price": 0.00,  # free education
    },
    {
        "slug": "pdca-simulator",
        "name": "PDCA Simulator",
        "kind": "simulation",
        "engine": "React + PDCA engine",
        "description": "Plan-Do-Check-Act governance cycles.",
        "status": "LIVE",
        "axes_related": ["governance"],
        "multiplayer": True,
        "players": "2-4 players",
        "agui": True,
        "a2ui": True,
        "x402_sku": "game-pdca-simulator",
        "x402_price": 0.20,
    },
    {
        "slug": "swarm",
        "name": "Swarm",
        "kind": "agent-swarm",
        "engine": "PixiJS + council-os substrate",
        "description": "An agent swarm solves a problem collectively.",
        "status": "STAGED",
        "axes_related": ["governance", "safety"],
        "multiplayer": True,
        "players": "8-64 players",
        "agui": True,
        "a2ui": True,
        "x402_sku": "game-swarm",
        "x402_price": 0.30,
    },
    {
        "slug": "civic",
        "name": "Civic",
        "kind": "civic-deliberation",
        "engine": "React + deliberation engine",
        "description": "Citizens deliberate policy questions.",
        "status": "STAGED",
        "axes_related": ["governance", "safety"],
        "multiplayer": True,
        "players": "8-128 players",
        "agui": True,
        "a2ui": True,
        "x402_sku": "game-civic",
        "x402_price": 0.20,
    },
]


def build_game_discovery(game: dict) -> dict:
    return {
        "schema": "csoai.game-discovery/0.1",
        "slug": game["slug"],
        "name": game["name"],
        "kind": game["kind"],
        "engine": game["engine"],
        "description": game["description"],
        "status": game["status"],
        "as_of": now(),
        "axes_related": game["axes_related"],
        "multiplayer": game["multiplayer"],
        "players": game["players"],
        "agui": game["agui"],
        "a2ui": game["a2ui"],
        "links": {
            "self": f"https://councilof.ai/.well-known/{game['slug']}.json",
            "agent_card": f"https://councilof.ai/.well-known/agents/{game['slug']}-agent.json",
            "mcp": f"https://councilof.ai/.well-known/mcp/{game['slug']}.json",
            "agui": f"https://councilof.ai/{game['slug']}/ag-ui",
            "a2ui": f"https://councilof.ai/{game['slug']}/a2-ui",
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
        },
        "notes": [
            "AG-UI + A2UI chat enabled",
            "Multiplayer rooms via WebSocket",
            "Targeted for the 3-anchor rail: OTS pending stamps + Sigstore Rekor + EAS schema (rails planned)",
        ],
    }


def build_game_agent(game: dict) -> dict:
    return {
        "schema": "csoai.a2a-agent-card/0.1",
        "slug": game["slug"],
        "name": game["name"],
        "kind": game["kind"],
        "as_of": now(),
        "url": f"https://councilof.ai/api/a2a/{game['slug']}",
        "version": "1.0",
        "capabilities": {
            "play": f"Play {game['name']} with AI opponents",
            "chat": "Chat with AI via AG-UI / A2UI",
            "multiplayer": "Join a multiplayer room" if game["multiplayer"] else "Single-player",
            "attestation": "none — this game emits no card and lands nothing in the signed root",
            "verification": "Verify any signed card offline",
        },
        "skills": [
            {"id": f"{game['slug']}.play", "description": f"Play {game['name']}"},
            {"id": f"{game['slug']}.chat", "description": f"Chat with AI in {game['name']}"},
            {"id": f"{game['slug']}.attest", "description": f"Get a signed turn card from {game['name']}"},
            {"id": f"{game['slug']}.verify", "description": f"Verify an attestation from {game['name']}"},
        ],
        "protocols": ["a2a", "mcp", "x402", "ag-ui", "a2-ui"],
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
            "agui": f"https://councilof.ai/{game['slug']}/ag-ui",
            "a2ui": f"https://councilof.ai/{game['slug']}/a2-ui",
        },
    }


def build_game_mcp(game: dict) -> dict:
    return {
        "schema": "csoai.mcp-server/0.1",
        "slug": game["slug"],
        "name": game["name"],
        "kind": game["kind"],
        "as_of": now(),
        "url": f"https://councilof.ai/.well-known/mcp/{game['slug']}.json",
        "version": "1.0",
        "tools": [
            {"name": f"play_{game['slug']}", "description": f"Play {game['name']}"},
            {"name": f"chat_{game['slug']}", "description": f"Chat with AI in {game['name']}"},
            {"name": f"join_room_{game['slug']}", "description": f"Join a multiplayer room in {game['name']}"},
            {"name": f"attest_{game['slug']}", "description": f"Get a signed turn card from {game['name']}"},
            {"name": f"verify_{game['slug']}", "description": f"Verify an attestation from {game['name']}"},
        ],
        "resources": [
            {"uri": f"game://{game['slug']}/room", "name": "Room", "description": "Current room state"},
            {"uri": f"game://{game['slug']}/turn", "name": "Turn", "description": "Latest turn"},
            {"uri": f"game://{game['slug']}/card", "name": "Card", "description": "Latest signed card"},
        ],
        "prompts": [
            {"name": f"play_{game['slug']}", "description": f"Play {game['name']} with AI"},
            {"name": f"chat_{game['slug']}", "description": f"Chat with AI in {game['name']}"},
        ],
    }


def build_game_interop(game: dict) -> dict:
    return {
        "schema": "csoai.game-interop/0.1",
        "slug": game["slug"],
        "name": game["name"],
        "kind": game["kind"],
        "engine": game["engine"],
        "as_of": now(),
        "protocols": ["a2a", "mcp", "x402", "ag-ui", "a2-ui", "websocket"],
        "anchors": {"status": "NONE", "note": "no game event is anchored today; the ONE root anchors root.json only, and eas_base is NOT_YET"},
        "capabilities": [
            f"Play {game['name']} with AI opponents",
            "Chat with AI via AG-UI / A2UI",
            "Multiplayer rooms via WebSocket",
            "Targeted for the 3-anchor rail: OTS pending stamps + Sigstore Rekor + EAS schema (rails planned)",
        ],
        "links": {
            "discovery": f"https://councilof.ai/.well-known/{game['slug']}.json",
            "agent_card": f"https://councilof.ai/.well-known/agents/{game['slug']}-agent.json",
            "mcp": f"https://councilof.ai/.well-known/mcp/{game['slug']}.json",
            "agui": f"https://councilof.ai/{game['slug']}/ag-ui",
            "a2ui": f"https://councilof.ai/{game['slug']}/a2-ui",
        },
    }


def main() -> None:
    print("=== GAME BIND — bind games to AG-UI + A2UI + multiplayer ===")
    print()

    created = 0
    for game in GAMES:
        (WK / f"{game['slug']}.json").write_text(json.dumps(build_game_discovery(game), indent=2))
        (AGENTS / f"{game['slug']}-agent.json").write_text(json.dumps(build_game_agent(game), indent=2))
        (MCP / f"{game['slug']}.json").write_text(json.dumps(build_game_mcp(game), indent=2))
        (INTEROP / f"game-{game['slug']}.json").write_text(json.dumps(build_game_interop(game), indent=2))
        created += 1
        status_icon = "✓" if game["status"] == "LIVE" else "⚠"
        multiplayer = "🎮" if game["multiplayer"] else "📚"
        print(f"  {status_icon} {game['name']:<20} ({game['kind']:<24}) {multiplayer} {game['status']}")

    # Build the games-arcade index
    index = {
        "schema": "csoai.games-arcade/0.1",
        "as_of": now(),
        "total_games": len(GAMES),
        "live_games": sum(1 for g in GAMES if g["status"] == "LIVE"),
        "staged_games": sum(1 for g in GAMES if g["status"] == "STAGED"),
        "multiplayer_games": sum(1 for g in GAMES if g["multiplayer"]),
        "agui_games": sum(1 for g in GAMES if g["agui"]),
        "a2ui_games": sum(1 for g in GAMES if g["a2ui"]),
        "games": [
            {
                "name": g["name"],
                "slug": g["slug"],
                "kind": g["kind"],
                "status": g["status"],
                "multiplayer": g["multiplayer"],
                "agui": g["agui"],
                "a2ui": g["a2ui"],
                "x402_sku": g["x402_sku"],
            }
            for g in GAMES
        ],
        "principle": "The game IS the data collection. Every turn emits a signed card. AG-UI + A2UI provide the chat. Multiplayer rooms via WebSocket. Targeted for the 3-anchor rail: OTS pending stamps + Sigstore Rekor + EAS schema (rails planned).",
    }
    index_path = INTEROP / "games-arcade.json"
    index_path.write_text(json.dumps(index, indent=2))

    # Build the AG-UI / A2UI binding manifest
    chat_binding = {
        "schema": "csoai.chat-binding/0.1",
        "as_of": now(),
        "agui": {
            "endpoint": "https://councilof.ai/ag-ui",
            "protocol": "AG-UI (Agent UI) — Anthropic + Google + Microsoft",
            "description": "Real-time chat with the AI council. End user asks a question, the AI council routes to the right engine, signs the answer, returns the card.",
            "modes": ["text", "voice", "tool-calling", "multi-agent"],
        },
        "a2ui": {
            "endpoint": "https://councilof.ai/a2-ui",
            "protocol": "A2UI (Agent-to-UI) — Google",
            "description": "Agent-to-UI panel for live attestation streaming. Shows every signed card as it's emitted.",
            "modes": ["card-stream", "graph", "map", "timeline"],
        },
        "games_chat": {
            "endpoint": "https://councilof.ai/games/ag-ui",
            "description": "Chat with AI opponents in any game. Powered by the local Ollama fleet (qwen2.5:0.5b, gemma3:4b, llama3.1:8b) + the substrate's 33-agent BFT council.",
            "modes": ["chat", "play", "multiplayer", "spectate"],
        },
    }
    chat_path = INTEROP / "chat-binding.json"
    chat_path.write_text(json.dumps(chat_binding, indent=2))

    print()
    print("=== SUMMARY ===")
    print(f"  total games:   {len(GAMES)}")
    print(f"  live games:    {sum(1 for g in GAMES if g['status'] == 'LIVE')}")
    print(f"  staged games:  {sum(1 for g in GAMES if g['status'] == 'STAGED')}")
    print(f"  multiplayer:   {sum(1 for g in GAMES if g['multiplayer'])}")
    print(f"  AG-UI enabled: {sum(1 for g in GAMES if g['agui'])}")
    print(f"  A2UI enabled:  {sum(1 for g in GAMES if g['a2ui'])}")
    print(f"  files:         {created * 4 + 2}")
    print(f"  arcade index:  {index_path}")
    print(f"  chat binding:  {chat_path}")


if __name__ == "__main__":
    main()
