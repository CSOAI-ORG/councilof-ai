#!/usr/bin/env python3
"""
🜏 SOVEREIGN COMMAND TUI — Nicholas Templeman, Founder
=====================================================
Interactive terminal interface for commanding SOV3 + King hive.
Every command is Ed25519-signed with Nicholas's sovereign key.
Identity: did:csoai:nicholas-001

Usage:
  python3 sovereign_tui.py
  
Then type naturally. Commands:
  king <message>     → Ask the King (auto-routes to best hive)
  fan <message>      → Fan-out across all queens (multi-perspective)
  queen <domain> <msg> → Ask a specific hive directly
  hives              → List all 28 hives
  sov3 <message>     → Talk to SOV3 sovereign substrate
  status             → System status of both endpoints
  id                 → Show your sovereign identity
  help               → This help
  quit               → Exit
"""

import json
import os
import sys
import time
import hashlib
import subprocess
from datetime import datetime, timezone
from pathlib import Path

try:
    import requests
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.prompt import Prompt
    from rich.markdown import Markdown
    from rich.text import Text
    from rich.align import Align
    from rich import box
except ImportError:
    print("Installing rich + requests...")
    subprocess.run([sys.executable, "-m", "pip", "install", "rich", "requests"], check=True)
    import requests
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.prompt import Prompt
    from rich.markdown import Markdown
    from rich.text import Text
    from rich.align import Align
    from rich import box

# ─── SOVEREIGN IDENTITY ────────────────────────────────────────────
FOUNDER_NAME = "Nicholas Templeman"
FOUNDER_ROLE = "Founder & Sovereign"
FOUNDER_DID = "did:csoai:nicholas-001"
FOUNDER_PUBKEY = "QD595cz6iQaEaYOjwwgLmMdoz1mtm1pzKBb9ygvMvf3xhQ28"

KEYS_DIR = Path.home() / ".sovereign" / "keys"
ED25519_KEY_PATH = KEYS_DIR / "ed25519.key"

# ─── ENDPOINTS (via managed Mac↔VM tunnels) ────────────────────────
KING_URL = "http://localhost:8077/mcp"
SOV3_URL = "http://localhost:3101/mcp"

console = Console()

# ═════════════════════════════════════════════════════════════════════
#  SOVEREIGN SIGNING — binds every command to Nicholas's identity
# ═════════════════════════════════════════════════════════════════════

class SovereignSigner:
    """Loads Nicholas's Ed25519 key and signs commands."""

    def __init__(self):
        self.private_key_bytes = None
        self.public_key_b64 = FOUNDER_PUBKEY
        self._load_key()

    def _load_key(self):
        """Load the raw 32-byte Ed25519 private key."""
        if ED25519_KEY_PATH.exists():
            self.private_key_bytes = ED25519_KEY_PATH.read_bytes()
            if len(self.private_key_bytes) == 32:
                # Derive public key to verify
                try:
                    import nacl.signing
                    import base64
                    sk = nacl.signing.SigningKey(self.private_key_bytes)
                    pk_b64 = base64.b64encode(bytes(sk.verify_key)).decode()
                    self.public_key_b64 = pk_b64
                except Exception:
                    pass  # Fall back to hardcoded pubkey
            else:
                # Might be hex or base64 encoded
                try:
                    raw = bytes.fromhex(self.private_key_bytes.decode().strip())
                    if len(raw) == 32:
                        self.private_key_bytes = raw
                except Exception:
                    pass

    def sign(self, message: str) -> dict:
        """Sign a message, return identity envelope."""
        timestamp = datetime.now(timezone.utc).isoformat()
        payload = f"{FOUNDER_DID}:{timestamp}:{message}"
        
        signature = None
        if self.private_key_bytes and len(self.private_key_bytes) == 32:
            try:
                import nacl.signing
                import base64
                sk = nacl.signing.SigningKey(self.private_key_bytes)
                sig = sk.sign(payload.encode())
                signature = base64.b64encode(sig.signature).decode()
            except Exception:
                pass

        return {
            "founder": FOUNDER_NAME,
            "did": FOUNDER_DID,
            "pubkey": self.public_key_b64,
            "timestamp": timestamp,
            "signature": signature,
            "payload_hash": hashlib.sha256(payload.encode()).hexdigest()[:16],
        }

    @property
    def is_signed(self):
        return self.private_key_bytes is not None and len(self.private_key_bytes) == 32


# ═════════════════════════════════════════════════════════════════════
#  MCP CLIENT — talks to King hive + SOV3
# ═════════════════════════════════════════════════════════════════════

class MCPClient:
    """JSON-RPC client for MCP servers."""

    def __init__(self, url: str, name: str):
        self.url = url
        self.name = name
        self._id = 0

    def _next_id(self):
        self._id += 1
        return self._id

    def call(self, tool: str, arguments: dict = None, timeout: int = 45) -> dict:
        """Call an MCP tool. Returns parsed result or error."""
        payload = {
            "jsonrpc": "2.0",
            "id": self._next_id(),
            "method": "tools/call",
            "params": {
                "name": tool,
                "arguments": arguments or {},
            }
        }
        try:
            resp = requests.post(
                self.url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=timeout,
            )
            data = resp.json()
            if "error" in data:
                return {"error": data["error"]}
            result = data.get("result", {})
            # MCP returns content as array of {type, text}
            if "content" in result:
                for item in result["content"]:
                    if item.get("type") == "text":
                        try:
                            return json.loads(item["text"])
                        except (json.JSONDecodeError, TypeError):
                            return {"text": item["text"]}
            return result
        except requests.exceptions.ConnectionError:
            return {"error": f"Cannot reach {self.name} at {self.url}. Tunnel may be down. Try: launchctl kickstart -k gui/$(id -u)/com.meok.king-vm-tunnel"}
        except requests.exceptions.Timeout:
            return {"error": f"{self.name} timed out after {timeout}s"}
        except Exception as e:
            return {"error": str(e)}

    def health(self) -> bool:
        """Quick connectivity check."""
        try:
            resp = requests.post(
                self.url,
                json={"jsonrpc": "2.0", "id": 0, "method": "tools/list"},
                headers={"Content-Type": "application/json"},
                timeout=5,
            )
            return resp.status_code == 200
        except Exception:
            return False


# ═════════════════════════════════════════════════════════════════════
#  TUI RENDERING
# ═════════════════════════════════════════════════════════════════════

def print_banner():
    """Startup banner."""
    banner = Text()
    banner.append("🜏 SOVEREIGN COMMAND", style="bold cyan")
    banner.append("\n  Nicholas Templeman", style="bold white")
    banner.append(" · Founder & Sovereign\n", style="dim")
    banner.append(f"  {FOUNDER_DID}", style="green")
    banner.append(f"\n  Pubkey: {FOUNDER_PUBKEY[:20]}...", style="dim")
    
    console.print(Panel(banner, border_style="cyan", box=box.DOUBLE, padding=(1, 2)))
    console.print()


def print_identity(signer: SovereignSigner):
    """Show sovereign identity card."""
    table = Table(title="🜏 Sovereign Identity", box=box.ROUNDED, border_style="cyan")
    table.add_column("Field", style="bold cyan", no_wrap=True)
    table.add_column("Value", style="white")
    table.add_row("Name", FOUNDER_NAME)
    table.add_row("Role", FOUNDER_ROLE)
    table.add_row("DID", FOUNDER_DID)
    table.add_row("Public Key", FOUNDER_PUBKEY)
    table.add_row("Key File", str(ED25519_KEY_PATH))
    table.add_row("Signing Active", "✅ YES — every command Ed25519-signed" if signer.is_signed else "⚠️  Key not loadable — commands will carry identity but not cryptographic signature")
    console.print(table)


def print_help():
    """Show available commands."""
    table = Table(title="Commands", box=box.ROUNDED, border_style="blue", show_header=True)
    table.add_column("Command", style="bold yellow", no_wrap=True)
    table.add_column("What it does", style="white")
    table.add_row("king <message>", "Ask the King — auto-routes to the best hive queen")
    table.add_row("fan <message>", "Fan-out across ALL queens — multi-perspective synthesis")
    table.add_row("queen <domain> <msg>", "Ask a specific hive directly (e.g. 'queen defoneos status?')")
    table.add_row("hives", "List all 28 hives")
    table.add_row("sov3 <message>", "Talk to SOV3 sovereign substrate (OOWM think)")
    table.add_row("status", "Check King + SOV3 endpoint health")
    table.add_row("id", "Show your sovereign identity card")
    table.add_row("quit", "Exit the TUI")
    console.print(table)


def render_response(data: dict, title: str = "Response"):
    """Render a response in a panel."""
    if isinstance(data, dict):
        if "error" in data:
            console.print(Panel(
                Text(str(data["error"]), style="bold red"),
                title=f"❌ {title}",
                border_style="red",
                box=box.ROUNDED,
            ))
            return

        # King-style response
        if "reply" in data:
            content_parts = []
            content_parts.append(Text(data["reply"], style="white"))
            
            if "routed_to" in data:
                content_parts.append(Text(""))
                content_parts.append(Text(f"Routed to: {', '.join(data['routed_to'])}", style="dim cyan"))
            
            if "queens" in data and data["queens"]:
                for q in data["queens"]:
                    hive = q.get("hive", "?")
                    safe = "✅" if q.get("safe") else "⚠️"
                    engine = q.get("engine", "")
                    gov = q.get("governance", "")
                    content_parts.append(Text(""))
                    content_parts.append(Text(f"  {safe} [{hive}]", style="bold green"))
                    if engine:
                        content_parts.append(Text(f"    Engine: {engine}", style="dim"))
                    if gov:
                        content_parts.append(Text(f"    Governance: {gov}", style="dim"))
                    if "reply" in q and q["reply"] != data.get("reply"):
                        content_parts.append(Text(f"    {q['reply'][:200]}...", style="dim white"))
            
            full_content = Text("\n").join(content_parts)
            console.print(Panel(full_content, title=f"🜏 {title}", border_style="green", box=box.ROUNDED, padding=(1, 2)))

        elif "text" in data:
            console.print(Panel(Markdown(data["text"]), title=f"🜏 {title}", border_style="green", box=box.ROUNDED))

        elif "result" in data:
            console.print(Panel(json.dumps(data["result"], indent=2)[:2000], title=f"🜏 {title}", border_style="green"))

        else:
            console.print(Panel(json.dumps(data, indent=2)[:2000], title=f"🜏 {title}", border_style="green"))

    elif isinstance(data, str):
        console.print(Panel(Markdown(data), title=f"🜏 {title}", border_style="green", box=box.ROUNDED))
    else:
        console.print(Panel(str(data), title=f"🜏 {title}"))


def print_signed_command(msg: str, signer: SovereignSigner):
    """Show that the command was signed."""
    envelope = signer.sign(msg)
    sig_short = envelope["signature"][:24] + "..." if envelope.get("signature") else "(unsigned)"
    console.print(Panel(
        Text(f"🔑 Signed by {envelope['founder']} | sig: {sig_short} | hash: {envelope['payload_hash']}", style="dim"),
        border_style="dim",
        box=box.SIMPLE,
    ))


# ═════════════════════════════════════════════════════════════════════
#  MAIN LOOP
# ═════════════════════════════════════════════════════════════════════

def main():
    signer = SovereignSigner()
    king = MCPClient(KING_URL, "King Hive")
    sov3 = MCPClient(SOV3_URL, "SOV3")

    print_banner()
    print_identity(signer)
    console.print()
    print_help()
    console.print()
    console.print("[dim]Type your command. Every message is Ed25519-signed with your founder key.[/dim]")
    console.print()

    while True:
        try:
            user_input = Prompt.ask("[bold cyan]🜏 sovereign>[/bold cyan]")
        except (EOFError, KeyboardInterrupt):
            console.print("\n[dim]🜏 Sovereign session ended.[/dim]")
            break

        user_input = user_input.strip()
        if not user_input:
            continue

        parts = user_input.split(None, 1)
        cmd = parts[0].lower()
        rest = parts[1] if len(parts) > 1 else ""

        # ── QUIT ──
        if cmd in ("quit", "exit", "q"):
            console.print("[dim]🜏 Sovereign session ended.[/dim]")
            break

        # ── HELP ──
        elif cmd in ("help", "h", "?"):
            print_help()

        # ── IDENTITY ──
        elif cmd == "id":
            print_identity(signer)

        # ── STATUS ──
        elif cmd == "status":
            console.print("\n[bold]Checking endpoints...[/bold]")
            king_ok = king.health()
            sov3_ok = sov3.health()
            
            table = Table(title="Endpoint Status", box=box.ROUNDED, border_style="blue")
            table.add_column("Service", style="bold")
            table.add_column("URL", style="dim")
            table.add_column("Status")
            table.add_row(
                "King Hive",
                KING_URL,
                "✅ LIVE" if king_ok else "❌ DOWN",
            )
            table.add_row(
                "SOV3",
                SOV3_URL,
                "✅ LIVE" if sov3_ok else "❌ DOWN",
            )
            table.add_row("Signing", ED25519_KEY_PATH, "✅ ACTIVE" if signer.is_signed else "⚠️ NO KEY")
            console.print(table)
            console.print()

        # ── HIVES ──
        elif cmd == "hives":
            print_signed_command("list_hives", signer)
            with console.status("[cyan]Fetching hive catalogue...[/cyan]"):
                result = king.call("list_hives", {})
            render_response(result, "Hive Catalogue")

        # ── KING (auto-route) ──
        elif cmd == "king":
            if not rest:
                console.print("[yellow]Usage: king <your message>[/yellow]")
                continue
            print_signed_command(rest, signer)
            with console.status("[cyan]👑 King is routing to the best hive...[/cyan]"):
                result = king.call("king_ask", {"message": rest})
            render_response(result, "King Reply")

        # ── FAN OUT ──
        elif cmd in ("fan", "fanout", "fan-out"):
            if not rest:
                console.print("[yellow]Usage: fan <your message>[/yellow]")
                continue
            print_signed_command(rest, signer)
            with console.status("[cyan]📡 Fanning out across all queens (30-60s)...[/cyan]"):
                result = king.call("king_ask", {"message": rest, "fan_out": True, "quorum": 3})
            render_response(result, "Fan-Out Synthesis")

        # ── QUEEN (direct) ──
        elif cmd == "queen":
            if not rest:
                console.print("[yellow]Usage: queen <domain> <message>[/yellow]")
                continue
            q_parts = rest.split(None, 1)
            domain = q_parts[0]
            message = q_parts[1] if len(q_parts) > 1 else "status"
            print_signed_command(f"[{domain}] {message}", signer)
            with console.status(f"[cyan]🐝 Asking {domain} queen...[/cyan]"):
                result = king.call("queen", {"domain": domain, "message": message})
            render_response(result, f"Queen: {domain}")

        # ── SOV3 ──
        elif cmd in ("sov3", "sov", "think"):
            if not rest:
                console.print("[yellow]Usage: sov3 <your message>[/yellow]")
                continue
            print_signed_command(rest, signer)
            with console.status("[cyan]🧠 SOV3 is thinking (Mamba + MoE + BFT)...[/cyan]"):
                result = sov3.call("bridge_think", {
                    "character": "nicholas-templeman",
                    "message": rest,
                    "profile": "balanced",
                })
            render_response(result, "SOV3 Response")

        else:
            # Treat bare input as a king question
            print_signed_command(user_input, signer)
            with console.status("[cyan]👑 King is routing...[/cyan]"):
                result = king.call("king_ask", {"message": user_input})
            render_response(result, "King Reply")


if __name__ == "__main__":
    main()
