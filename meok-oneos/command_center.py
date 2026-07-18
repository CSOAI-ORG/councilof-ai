"""
MEOK ONE Command Center
CLI dashboard for monitoring and controlling the entire MEOK ecosystem.

Usage:
    python3 command_center.py status      # Show all service health
    python3 command_center.py sov3        # Show SOV3 stats
    python3 command_center.py agents      # List active agents
    python3 command_center.py councils    # Show council status
    python3 command_center.py sbt list    # List all SBTs
    python3 command_center.py sbt mint    # Interactive SBT mint
    python3 command_center.py a2a list    # List bridged A2A cards
    python3 command_center.py payments    # Show payment sessions
"""

import argparse
import json
import sys
import time
from datetime import datetime
from typing import Optional

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    HTTPX_AVAILABLE = False
    print("⚠️  httpx not installed. Install with: pip install httpx")
    sys.exit(1)

# ── Config ───────────────────────────────────────────────────────────────────

GATEWAY_URL = "http://localhost:3400"
SOV3_URL = "http://localhost:3101"
MEOK_API_URL = "http://localhost:3200"

# ── Display Helpers ──────────────────────────────────────────────────────────

def _color(text: str, color: str) -> str:
    colors = {
        "green": "\033[92m",
        "red": "\033[91m",
        "yellow": "\033[93m",
        "blue": "\033[94m",
        "cyan": "\033[96m",
        "bold": "\033[1m",
        "reset": "\033[0m",
    }
    return f"{colors.get(color, '')}{text}{colors['reset']}"


def _print_header(title: str):
    print(f"\n{_color('═' * 60, 'bold')}")
    print(f"{_color(f'  {title}', 'bold')}")
    print(f"{_color('═' * 60, 'bold')}\n")


def _print_service(name: str, healthy: bool, response_ms: float, extra: str = ""):
    status = _color("✅ HEALTHY", "green") if healthy else _color("❌ DOWN", "red")
    print(f"  {status}  {name:30s}  {response_ms:6.1f}ms  {extra}")


# ── Commands ─────────────────────────────────────────────────────────────────

def cmd_status():
    """Show unified health status."""
    _print_header("MEOK ONE — System Status")
    
    try:
        r = httpx.get(f"{GATEWAY_URL}/health", timeout=5.0)
        data = r.json()
    except Exception as e:
        # Fallback: poll services directly
        print(f"  Gateway unavailable ({e}), polling directly...\n")
        services = {
            "SOV3": f"{SOV3_URL}/health",
            "MEOK API": f"{MEOK_API_URL}/health",
            "MEOK MCP": "http://localhost:3102/health",
            "Sovereign API": "http://localhost:8888/health",
        }
        for name, url in services.items():
            try:
                start = time.time()
                r = httpx.get(url, timeout=3.0)
                ms = (time.time() - start) * 1000
                _print_service(name, r.status_code < 400, ms)
            except Exception as e2:
                _print_service(name, False, 0, str(e2))
        return
    
    overall = data.get("overall_healthy", False)
    overall_str = _color("ALL SYSTEMS OPERATIONAL", "green") if overall else _color("SOME SERVICES DOWN", "red")
    print(f"  {overall_str}")
    print(f"  Timestamp: {data.get('timestamp', 'N/A')}\n")
    
    for key, svc in data.get("services", {}).items():
        healthy = svc.get("healthy", False)
        ms = svc.get("response_time_ms", 0)
        name = svc.get("name", key)
        _print_service(name, healthy, ms)
    
    print()


def cmd_sov3():
    """Show SOV3 orchestrator stats."""
    _print_header("SOV3 — Sovereign Temple Stats")
    
    try:
        r = httpx.get(f"{SOV3_URL}/stats", timeout=5.0)
        data = r.json()
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"  {_color('Error:', 'red')} {e}")
    
    print()


def cmd_agents():
    """List active agents."""
    _print_header("Active Agents")
    
    try:
        r = httpx.get(f"{SOV3_URL}/agents/trust", timeout=5.0)
        data = r.json()
        agents = data.get("agents", [])
        print(f"  Total agents: {len(agents)}\n")
        for agent in agents[:20]:
            name = agent.get("name", "Unknown")
            trust = agent.get("trust_score", 0)
            status = agent.get("status", "unknown")
            status_color = "green" if status == "active" else "yellow"
            print(f"  {_color('●', status_color)}  {name:30s}  trust={trust:.2f}  status={status}")
        if len(agents) > 20:
            print(f"  ... and {len(agents) - 20} more")
    except Exception as e:
        print(f"  {_color('Error:', 'red')} {e}")
    
    print()


def cmd_councils():
    """Show council status."""
    _print_header("Council Status")
    
    try:
        r = httpx.get(f"{MEOK_API_URL}/api/council/status", timeout=5.0)
        data = r.json()
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"  {_color('Error:', 'red')} {e}")
    
    print()


def cmd_sbt_list():
    """List all SBTs."""
    _print_header("POAI Soulbound Tokens")
    
    try:
        r = httpx.get(f"{SOV3_URL}/sbt/list", timeout=5.0)
        data = r.json()
        sbts = data.get("sbts", [])
        print(f"  Total SBTs: {len(sbts)}\n")
        
        for sbt in sbts:
            type_name = ["AgentIdentity", "SafetyCertification", "VerifierReputation", "CharacterGenesis", "EnterpriseTrust"][sbt.get("sbt_type", 0)]
            revoked = _color("REVOKED", "red") if sbt.get("revoked") else _color("ACTIVE", "green")
            print(f"  #{sbt.get('token_id'):4s}  {type_name:22s}  {revoked}  owner={sbt.get('owner', 'N/A')[:16]}...  risk={sbt.get('risk_tier', 'N/A')}")
    except Exception as e:
        print(f"  {_color('Error:', 'red')} {e}")
    
    print()


def cmd_sbt_mint_interactive():
    """Interactive SBT mint."""
    _print_header("Mint New POAI SBT")
    
    print("  SBT Types:")
    print("    0 = AgentIdentity")
    print("    1 = SafetyCertification")
    print("    2 = VerifierReputation")
    print("    3 = CharacterGenesis")
    print("    4 = EnterpriseTrust")
    
    sbt_type = int(input(f"\n  {_color('SBT Type:', 'cyan')} ") or "1")
    owner = input(f"  {_color('Owner Wallet:', 'cyan')} ") or "D3wRLAsaVEWUAm3Y7ZXo21sfEd3SGYb8X4nLbLA8RE5w"
    metadata = input(f"  {_color('Metadata URI:', 'cyan')} ") or ""
    charter = input(f"  {_color('Charter Reference:', 'cyan')} ") or "Article 10.2"
    risk = int(input(f"  {_color('Risk Tier (1-5):', 'cyan')} ") or "2")
    
    payload = {
        "owner_wallet": owner,
        "sbt_type": sbt_type,
        "metadata_uri": metadata,
        "charter_reference": charter,
        "risk_tier": risk,
    }
    
    try:
        r = httpx.post(f"{SOV3_URL}/sbt/mint", json=payload, timeout=10.0)
        data = r.json()
        print(f"\n  {_color('✅ SBT Minted!', 'green')}")
        print(f"     Token ID: {data.get('token_id')}")
        print(f"     Type: {data.get('sbt_type_name')}")
        print(f"     Owner: {data.get('owner')}")
        print(f"     Mock Mode: {data.get('mock')}")
    except Exception as e:
        print(f"  {_color('Error:', 'red')} {e}")
    
    print()


def cmd_a2a_list():
    """List bridged A2A cards."""
    _print_header("A2A v1.0 Bridged Cards")
    
    try:
        r = httpx.get(f"{SOV3_URL}/a2a/list", timeout=5.0)
        data = r.json()
        cards = data.get("cards", [])
        print(f"  Total cards: {len(cards)}\n")
        
        for card in cards:
            c = card.get("card", {})
            name = c.get("name", "Unknown")
            org = c.get("provider", {}).get("organization", "Unknown")
            skills = len(c.get("skills", []))
            print(f"  ◆  {name:30s}  {org:25s}  {skills} skills")
    except Exception as e:
        print(f"  {_color('Error:', 'red')} {e}")
    
    print()


def cmd_payments():
    """Show payment sessions."""
    _print_header("Payment Sessions")
    
    try:
        r = httpx.get(f"{SOV3_URL}/payments/list", timeout=5.0)
        data = r.json()
        sessions = data.get("sessions", [])
        print(f"  Total sessions: {len(sessions)}\n")
        
        for sess in sessions:
            status_color = "green" if sess.get("status") == "completed" else "yellow" if sess.get("status") == "pending" else "red"
            print(f"  {_color('●', status_color)}  {sess.get('session_id', 'N/A')[:8]}...  {sess.get('rail', 'N/A'):10s}  {sess.get('status', 'N/A'):10s}  £{sess.get('amount', 0):.2f}")
    except Exception as e:
        print(f"  {_color('Error:', 'red')} {e}")
    
    print()


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="MEOK ONE Command Center",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 command_center.py status
  python3 command_center.py sov3
  python3 command_center.py sbt list
  python3 command_center.py sbt mint
        """,
    )
    
    parser.add_argument("command", nargs="?", default="status", help="Command to run")
    parser.add_argument("subcommand", nargs="?", default=None, help="Subcommand")
    
    args = parser.parse_args()
    
    if args.command == "status":
        cmd_status()
    elif args.command == "sov3":
        cmd_sov3()
    elif args.command == "agents":
        cmd_agents()
    elif args.command == "councils":
        cmd_councils()
    elif args.command == "sbt":
        if args.subcommand == "list":
            cmd_sbt_list()
        elif args.subcommand == "mint":
            cmd_sbt_mint_interactive()
        else:
            print("Usage: command_center.py sbt [list|mint]")
    elif args.command == "a2a":
        if args.subcommand == "list":
            cmd_a2a_list()
        else:
            print("Usage: command_center.py a2a [list]")
    elif args.command == "payments":
        cmd_payments()
    else:
        print(f"Unknown command: {args.command}")
        parser.print_help()


if __name__ == "__main__":
    main()
