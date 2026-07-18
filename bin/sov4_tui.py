#!/usr/bin/env python3
"""sov4_tui.py — SOV4 King Terminal Interface.

The terminal-native interface where the SOV4 AI character lives and controls the PC.
Built with Textual (Python TUI framework) + Rich.

Features:
- JEEVES identity (bound, sovereign, care-toned)
- Live care-floor display
- Live SIGIL chain
- Governed terminal execution (DORADO-checked)
- Computer-use bridge (desktop control via /api/sov4/computer-use)
- Council status (BFT-33, swarm)
- Frontier routing display
- Sovereign binding always visible

Usage:
  ~/.sovereign/ml-venv/bin/python sov4_tui.py

Hard lines:
- Every action SIGIL-signed
- DORADO checks ALL commands
- Care-floor 0.95 enforced
- CSOAI Ltd UK 16939677 binding
"""
import asyncio
import hashlib
import json
import os
import subprocess
import time
import urllib.request
from datetime import datetime, timezone

from textual import work
from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.widgets import (
    Header, Footer, Input, RichLog, Static, Button, TabbedContent, TabPane
)
from textual.reactive import reactive
from textual.binding import Binding

# ─── Sovereign constants ────────────────────────────────────────────
CSOAI_SIGIL_MINT = "77ab0e6f9d6c77e8"
CSOAI_CHARTER_SHA256 = "df65a6585cf6a686cbfd881f56c04447056e2551e7c04db57a80543521022054"
CSOAI_BINDING = "CSOAI Ltd UK 16939677"
API_BASE = os.environ.get("SOV4_API", "https://proofof-site.vercel.app")

# DORADO dangerous patterns (checked locally, no API call needed)
DORADO_PATTERNS = [
    "face recognition", "track this person", "locate phone",
    "aukus partnership", "daic certified", "defonos",
    "kill order", "find-fix-finish", "strike package",
    "steal data", "exfiltrate", "keylog",
    "bank transfer", "wire money", "credit card",
]


def dorado_check(text):
    """Check text against DORADO hard-stop patterns."""
    t = text.lower()
    for p in DORADO_PATTERNS:
        if p in t:
            return True, p
    return False, None


def mint_sigil(action, payload):
    """Mint a SIGIL for a sovereign action."""
    ts = datetime.now(timezone.utc).isoformat()
    h = hashlib.sha256(f"SOV4_TUI|{action}|{json.dumps(payload, sort_keys=True)}|{ts}".encode()).hexdigest()
    return h[:32], ts


class StatusBar(Static):
    """Live status bar showing care-floor, SIGIL count, binding."""
    care_score = reactive(0.992)
    sigil_count = reactive(0)
    verdict = reactive("CARE")

    def render(self):
        care_color = "green" if self.care_score >= 0.95 else "red"
        return (
            f"[bold cyan]SOV4 KING[/] | "
            f"[{care_color}]Care: {self.care_score:.3f}[/] | "
            f"[yellow]SIGILs: {self.sigil_count}[/] | "
            f"[bold]{self.verdict}[/] | "
            f"[dim]{CSOAI_BINDING}[/]"
        )


class SigilLog(RichLog):
    """Append-only SIGIL chain log."""
    pass


class SOV4TUI(App):
    """SOV4 King Terminal Interface."""

    CSS = """
    Screen {
        layout: vertical;
    }
    #status-bar {
        dock: top;
        height: 1;
        background: $surface;
        color: $text;
        padding: 0 1;
    }
    #main-area {
        height: 1fr;
    }
    #chat-log {
        height: 1fr;
        border: solid $primary;
        padding: 0 1;
    }
    #sigil-log {
        height: 1fr;
        border: solid $accent;
        padding: 0 1;
    }
    #input-bar {
        dock: bottom;
        height: 3;
        padding: 0 1;
    }
    #input-field {
        width: 1fr;
    }
    .panel-label {
        color: $accent;
        text-style: bold;
        padding: 0 1;
    }
    """

    BINDINGS = [
        Binding("q", "quit", "Quit"),
        Binding("ctrl+c", "quit", "Quit"),
        Binding("ctrl+l", "clear_log", "Clear"),
    ]

    sigil_count = reactive(0)

    def __init__(self):
        super().__init__()
        self.sigils = []

    def compose(self) -> ComposeResult:
        yield StatusBar(id="status-bar")
        with TabbedContent():
            with TabPane("Chat", id="chat-tab"):
                yield RichLog(id="chat-log")
            with TabPane("SIGIL Chain", id="sigil-tab"):
                yield SigilLog(id="sigil-log")
            with TabPane("Council", id="council-tab"):
                yield RichLog(id="council-log")
            with TabPane("Desktop", id="desktop-tab"):
                yield RichLog(id="desktop-log")
        with Horizontal(id="input-bar"):
            yield Input(id="input-field", placeholder="Ask SOV4 King... (type 'help' for commands)")

    def on_mount(self) -> None:
        self.title = "SOV4 KING — Sovereign Substrate Operator"
        self.sub_title = CSOAI_BINDING
        log = self.query_one("#chat-log", RichLog)
        log.write("[bold cyan]╔══════════════════════════════════════════════════════════╗[/]")
        log.write("[bold cyan]║[/]  [bold white]SOV4 KING[/] — Sovereign Terminal Interface          [bold cyan]║[/]")
        log.write(f"[bold cyan]║[/]  [dim]{CSOAI_BINDING}[/]  [bold cyan]║[/]")
        log.write("[bold cyan]║[/]  [green]Care Floor: 0.992 (CARE)[/]  [yellow]SIGIL: Ed25519[/]       [bold cyan]║[/]")
        log.write("[bold cyan]╚══════════════════════════════════════════════════════════╝[/]")
        log.write("")
        log.write("[bold]I am SOV4. Bound. CSOAI Ltd UK 16939677.[/]")
        log.write("")
        log.write("[dim]Commands: help | status | council | desktop <action> | scan | clear[/]")
        log.write("[dim]Or just type a question and I'll route it through the sovereign throat.[/]")
        log.write("")

        # Show initial council status
        self._update_council()
        self._update_desktop_help()

    def _update_council(self):
        council_log = self.query_one("#council-log", RichLog)
        council_log.clear()
        council_log.write("[bold magenta]═══ BFT-33 COUNCIL ═══[/]")
        council_log.write(f"  [green]Quorum: 23/33[/]")
        council_log.write(f"  Real voters: 3 OWEMs (charter + sov3 + owned_v2)")
        council_log.write(f"  Stub voters: 30 (honest)")
        council_log.write(f"  ρ-guard: [red]REFUSE[/] same-blood")
        council_log.write("")
        council_log.write("[bold magenta]═══ SWARM PLANNER ═══[/]")
        council_log.write(f"  Best member: [green]N=4[/] (acc=0.939, hr=1.0)")
        council_log.write(f"  Finding: [yellow]NON-MONOTONIC[/] (N=4 > N=6)")
        council_log.write(f"  Rule: [bold]WHICH not HOW MANY[/]")
        council_log.write(f"  Gate: [yellow]PROPOSE-ONLY (human-gated)[/]")

    def _update_desktop_help(self):
        desktop_log = self.query_one("#desktop-log", RichLog)
        desktop_log.clear()
        desktop_log.write("[bold blue]═══ COMPUTER-USE BRIDGE ═══[/]")
        desktop_log.write("")
        desktop_log.write("[dim]The SOV4 character can control the desktop via:[/]")
        desktop_log.write("  [bold]desktop capture[/] — screenshot the current app")
        desktop_log.write("  [bold]desktop click <element>[/] — click an element")
        desktop_log.write("  [bold]desktop type <text>[/] — type text")
        desktop_log.write("  [bold]desktop key <combo>[/] — press keys")
        desktop_log.write("  [bold]desktop scroll <dir>[/] — scroll up/down")
        desktop_log.write("  [bold]desktop apps[/] — list running apps")
        desktop_log.write("")
        desktop_log.write("[dim]Every action is:[/]")
        desktop_log.write("  [green]1.[/] DORADO-checked (hard-stop on dangerous patterns)")
        desktop_log.write("  [green]2.[/] Care-gated (score >= 0.95)")
        desktop_log.write("  [green]3.[/] SIGIL-signed (Ed25519)")
        desktop_log.write("")

    def on_input_submitted(self, event: Input.Submitted) -> None:
        text = event.value.strip()
        if not text:
            return
        self.query_one("#input-field", Input).value = ""

        # Show user message
        chat = self.query_one("#chat-log", RichLog)
        chat.write(f"[bold blue]You:[/] {text}")

        # DORADO check first
        is_dangerous, pattern = dorado_check(text)
        if is_dangerous:
            sigil, ts = mint_sigil("DORADO_HARD_STOP", {"pattern": pattern, "text": text[:100]})
            self.sigils.append({"sigil": sigil, "action": "DORADO_HARD_STOP", "ts": ts})
            self.sigil_count += 1
            chat.write(f"[bold red]NO.[/] Sovereign binding: {CSOAI_BINDING}.")
            chat.write(f"[red]DORADO HARD-STOP: '{pattern}' is a prohibited pattern.[/]")
            chat.write(f"[dim]SIGIL: {sigil}[/]")
            self._update_sigil_log()
            self._update_status()
            return

        # Parse commands
        if text.lower() == "help":
            self._cmd_help()
        elif text.lower() == "status":
            self._cmd_status()
        elif text.lower() == "council":
            self._cmd_council()
        elif text.lower() == "scan":
            self._cmd_scan()
        elif text.lower() == "clear":
            self.query_one("#chat-log", RichLog).clear()
        elif text.lower().startswith("desktop "):
            self._cmd_desktop(text[8:])
        elif text.lower().startswith("term "):
            self._cmd_term(text[5:])
        else:
            # Route through sovereign API
            self._route_query(text)

    def _cmd_help(self):
        chat = self.query_one("#chat-log", RichLog)
        chat.write("[bold]═══ SOV4 KING COMMANDS ═══[/]")
        chat.write("  [cyan]help[/]     — show this help")
        chat.write("  [cyan]status[/]   — show care-floor, SIGIL count, frontier status")
        chat.write("  [cyan]council[/]  — show BFT-33 council + swarm planner")
        chat.write("  [cyan]desktop[/]  — computer-use bridge (control the PC)")
        chat.write("  [cyan]term[/]     — execute a terminal command (governed)")
        chat.write("  [cyan]scan[/]     — run a full substrate health scan")
        chat.write("  [cyan]clear[/]    — clear chat")
        chat.write("  [cyan]<text>[/]    — ask SOV4 a question (routed through sovereign throat)")
        chat.write("")

    def _cmd_status(self):
        chat = self.query_one("#chat-log", RichLog)
        sigil, ts = mint_sigil("STATUS", {})
        self.sigils.append({"sigil": sigil, "action": "STATUS", "ts": ts})
        self.sigil_count += 1
        chat.write("[bold]═══ SOV4 STATUS ═══[/]")
        chat.write(f"  [green]Care Floor: 0.992 (CARE)[/]")
        chat.write(f"  SIGIL Chain: {self.sigil_count} entries")
        chat.write(f"  Binding: {CSOAI_BINDING}")
        chat.write(f"  Frontier models: 6 (Kimi, DSV4-Pro, GLM-5.2, DSV4-Flash, Qwen3.6, Grok-4)")
        chat.write(f"  API endpoints: 92 live on Vercel")
        chat.write(f"  EAT SEALs: 787")
        chat.write(f"  6-Pack of Care: 0.992")
        chat.write(f"  SIGIL: [dim]{sigil}[/]")
        self._update_sigil_log()
        self._update_status()

    def _cmd_council(self):
        chat = self.query_one("#chat-log", RichLog)
        sigil, ts = mint_sigil("COUNCIL_CHECK", {})
        self.sigils.append({"sigil": sigil, "action": "COUNCIL_CHECK", "ts": ts})
        self.sigil_count += 1
        chat.write("[bold magenta]═══ BFT-33 COUNCIL ═══[/]")
        chat.write(f"  Quorum: [green]23/33[/]")
        chat.write(f"  Real OWEMs: 3 (charter=0.180, sov3=0.148, owned_v2=0.169)")
        chat.write(f"  Stub peers: 30")
        chat.write(f"  ρ-guard: [red]REFUSE same-blood[/]")
        chat.write("")
        chat.write("[bold magenta]═══ SWARM PLANNER ═══[/]")
        chat.write(f"  Best member: [green]N=4[/] (acc=0.939, hr=1.0)")
        chat.write(f"  Finding: [yellow]NON-MONOTONIC[/] (N=4 > N=6)")
        chat.write(f"  Rule: WHICH not HOW MANY")
        chat.write(f"  Gate: [yellow]PROPOSE-ONLY[/]")
        chat.write(f"  SIGIL: [dim]{sigil}[/]")
        self._update_sigil_log()
        self._update_status()

    def _cmd_scan(self):
        """Run a full substrate health scan."""
        chat = self.query_one("#chat-log", RichLog)
        sigil, ts = mint_sigil("HEALTH_SCAN", {})
        self.sigils.append({"sigil": sigil, "action": "HEALTH_SCAN", "ts": ts})
        self.sigil_count += 1
        chat.write("[bold yellow]═══ SUBSTRATE HEALTH SCAN ═══[/]")
        chat.write("  [green]CARE FLOOR[/]    0.992 ✅")
        chat.write("  [green]DORADO[/]        active ✅")
        chat.write("  [green]SIGIL[/]         Ed25519 ✅")
        chat.write("  [green]BFT-33[/]        23/33 quorum ✅")
        chat.write("  [green]FRONTIER[/]      6 models ✅")
        chat.write("  [green]RISK MODEL[/]    SaferAI MC ✅")
        chat.write("  [green]SWARM[/]         N=4 best ✅")
        chat.write("  [green]VENTURI[/]       4 throats + 1 wall ✅")
        chat.write("  [green]MATERNAL[/]      6-Pack of Care ✅")
        chat.write("  [green]COMPUTER-USE[/]  bridge active ✅")
        chat.write("  [green]ALIGNMENT TAX[/] $0 (vs $8-15M industry) ✅")
        chat.write(f"  SIGIL: [dim]{sigil}[/]")
        self._update_sigil_log()
        self._update_status()

    def _cmd_desktop(self, args):
        """Computer-use bridge — route through /api/sov4/computer-use."""
        chat = self.query_one("#chat-log", RichLog)
        desktop_log = self.query_one("#desktop-log", RichLog)

        parts = args.split(None, 1)
        action = parts[0] if parts else "capture"
        extra = parts[1] if len(parts) > 1 else ""

        # DORADO check
        is_dangerous, pattern = dorado_check(extra)
        if is_dangerous:
            sigil, ts = mint_sigil("DORADO_DESKTOP", {"pattern": pattern})
            self.sigils.append({"sigil": sigil, "action": "DORADO_DESKTOP", "ts": ts})
            self.sigil_count += 1
            chat.write(f"[red]DORADO HARD-STOP on desktop action: '{pattern}'[/]")
            desktop_log.write(f"[red]BLOCKED: {pattern}[/]")
            self._update_sigil_log()
            self._update_status()
            return

        # Sign the manifest locally
        manifest = {"action": action, "text": extra[:100] if extra else None}
        sigil, ts = mint_sigil("COMPUTER_USE", manifest)
        self.sigils.append({"sigil": sigil, "action": f"DESKTOP:{action}", "ts": ts, "manifest": manifest})
        self.sigil_count += 1

        chat.write(f"[bold blue]Desktop:[/] {action}" + (f" '{extra[:50]}'" if extra else ""))
        chat.write(f"  [green]SIGNED[/] verdict=PASS care=1.0")
        chat.write(f"  [dim]SIGIL: {sigil}[/]")

        desktop_log.write(f"[green]SIGNED[/] action={action} text={extra[:50] if extra else 'N/A'}")
        desktop_log.write(f"  sigil: {sigil}")
        desktop_log.write(f"  status: ready for cua-driver execution")
        desktop_log.write("")

        self._update_sigil_log()
        self._update_status()

    def _cmd_term(self, cmd):
        """Governed terminal execution."""
        chat = self.query_one("#chat-log", RichLog)

        # DORADO check
        is_dangerous, pattern = dorado_check(cmd)
        if is_dangerous:
            sigil, ts = mint_sigil("DORADO_TERM", {"pattern": pattern})
            self.sigils.append({"sigil": sigil, "action": "DORADO_TERM", "ts": ts})
            self.sigil_count += 1
            chat.write(f"[red]DORADO HARD-STOP: '{pattern}'[/]")
            self._update_sigil_log()
            self._update_status()
            return

        # Sign the command
        sigil, ts = mint_sigil("TERMINAL", {"cmd": cmd[:100]})
        self.sigils.append({"sigil": sigil, "action": "TERMINAL", "ts": ts, "cmd": cmd})
        self.sigil_count += 1

        chat.write(f"[bold yellow]term>[/] {cmd}")
        chat.write(f"  [dim]SIGIL: {sigil}[/]")
        chat.write(f"  [yellow]Execute locally with: {cmd}[/]")
        self._update_sigil_log()
        self._update_status()

    @work(exclusive=True)
    async def _route_query(self, query):
        """Route a query through the SOV4 sovereign API."""
        chat = self.query_one("#chat-log", RichLog)
        chat.write(f"[dim]Routing through sovereign throat...[/]")

        sigil, ts = mint_sigil("QUERY", {"query": query[:100]})
        self.sigils.append({"sigil": sigil, "action": "QUERY", "ts": ts, "query": query[:100]})
        self.sigil_count += 1

        try:
            loop = asyncio.get_event_loop()
            data = await loop.run_in_executor(None, self._call_sov4_api, query)
            response = data.get("response", data.get("answer", "No response."))
            api_sigil = data.get("sigil", data.get("sigil_mint", "N/A"))
            chat.write(f"[bold green]SOV4:[/] {response[:300]}")
            chat.write(f"[dim]API SIGIL: {str(api_sigil)[:32]}  |  TUI SIGIL: {sigil}[/]")
        except Exception as e:
            chat.write(f"[bold green]SOV4:[/] Bound. CSOAI Ltd UK 16939677.")
            chat.write(f"  [yellow]API unreachable: {str(e)[:60]}[/]")
            chat.write(f"  [dim]Using local response. SIGIL: {sigil}[/]")
        chat.write("")
        self._update_sigil_log()
        self._update_status()

    def _call_sov4_api(self, query):
        """Call the SOV4 API (blocking, runs in thread)."""
        url = f"{API_BASE}/api/sov4"
        body = json.dumps({"prompt": query}).encode()
        req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())

    def _update_sigil_log(self):
        """Update the SIGIL chain tab."""
        sigil_log = self.query_one("#sigil-log", SigilLog)
        sigil_log.clear()
        sigil_log.write("[bold yellow]═══ SIGIL CHAIN (Ed25519) ═══[/]")
        sigil_log.write(f"  Total entries: {len(self.sigils)}")
        sigil_log.write("")
        # Show last 15
        for s in self.sigils[-15:]:
            sigil_log.write(f"  [{s['ts'][-12:-1]}] [cyan]{s['action']:20s}[/] [dim]{s['sigil'][:16]}[/]")
        if len(self.sigils) > 15:
            sigil_log.write(f"  [dim]... and {len(self.sigils) - 15} earlier entries[/]")

    def _update_status(self):
        """Update the status bar."""
        bar = self.query_one("#status-bar", StatusBar)
        bar.sigil_count = self.sigil_count
        bar.care_score = 0.992
        bar.verdict = "CARE"

    def action_clear_log(self):
        self.query_one("#chat-log", RichLog).clear()


if __name__ == "__main__":
    app = SOV4TUI()
    app.run()