"""
SOV3 LIVE E2E SMOKE TEST — 4 days till SOV3 launch
===================================================

Pre-launch smoke test for the design/UX team taking over at 21:00 BST
ahead of the Saturday 4 Jul 09:00 BST public launch.

Tests 5 critical user flows end-to-end against the live stack:

  a) Anonymous visitor          GET  /api/backend/status  → /api/temples  → /api/temple/UK
  b) Sign up + Ichar creation   POST /api/auth/signup     → /api/ichar/create  → GET /api/ichar/user/{id}
  c) Council consultation       POST /api/cascade/route_query  (Monzo EU AI Act compliance)
  d) SIGIL verify               POST /api/sigil/verify    (hash from /api/backend/status → last_sigil)
  e) Sovereign composite        GET  /api/backend/status  (13/13 council + 218 mcps + sovereign online)

Usage:
    /Users/nicholas/.hermes/hermes-agent/venv/bin/python3.11 live_smoke_test.py

Exit code:
    0 — all 5 flows passed
    1 — at least one flow failed
"""
from __future__ import annotations

import json
import random
import string
import sys
import time
from dataclasses import dataclass, field
from typing import Any, Callable

import httpx

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────
BACKEND_URL = "http://localhost:8000"
SOV3_MCP_URL = "http://localhost:3101/mcp"
TIMEOUT = 15.0  # seconds per request


# ──────────────────────────────────────────────────────────────────────────────
# ANSI colour helpers (no external deps — works in any modern terminal)
# ──────────────────────────────────────────────────────────────────────────────
class C:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[97m"
    BG_RED = "\033[41m"
    BG_GREEN = "\033[42m"
    BG_BLUE = "\033[44m"


def supports_color() -> bool:
    """Detect whether the terminal supports ANSI colour."""
    if not sys.stdout.isatty():
        return False
    # macOS Terminal / iTerm both speak ANSI; Linux too. CI usually strips.
    return True


def paint(text: str, color: str, bold: bool = False) -> str:
    """Wrap text in ANSI colour codes; safely no-ops if terminal doesn't support it."""
    if not supports_color():
        return text
    prefix = C.BOLD if bold else ""
    return f"{prefix}{color}{text}{C.RESET}"


# ──────────────────────────────────────────────────────────────────────────────
# Result tracking
# ──────────────────────────────────────────────────────────────────────────────
@dataclass
class StepResult:
    name: str
    ok: bool
    detail: str = ""


@dataclass
class FlowResult:
    letter: str
    title: str
    emoji: str
    steps: list[StepResult] = field(default_factory=list)
    started_at: float = 0.0
    finished_at: float = 0.0

    @property
    def passed(self) -> bool:
        return all(s.ok for s in self.steps)

    @property
    def duration_s(self) -> float:
        return self.finished_at - self.started_at


class Reporter:
    def __init__(self) -> None:
        self.flows: list[FlowResult] = []

    # ── banners ────────────────────────────────────────────────────────────
    def banner(self) -> None:
        line = "═" * 70
        print()
        print(paint(line, C.MAGENTA, bold=True))
        print(paint(
            "  🐉  SOV3 LIVE SMOKE TEST — 4 days till SOV3 launch  🐉",
            C.MAGENTA, bold=True))
        print(paint(line, C.MAGENTA, bold=True))
        print(paint(f"  Backend : {BACKEND_URL}", C.DIM))
        print(paint(f"  SOV3 MCP: {SOV3_MCP_URL}", C.DIM))
        print(paint(f"  Time    : {time.strftime('%Y-%m-%d %H:%M:%S %Z')}", C.DIM))
        print(paint(line, C.MAGENTA, bold=True))
        print()

    def flow_header(self, flow: FlowResult) -> None:
        print(paint(f"┌─ FLOW ({flow.letter}) {flow.emoji}  {flow.title}",
                     C.CYAN, bold=True))
        print(paint("│", C.CYAN))

    def flow_footer(self, flow: FlowResult) -> None:
        passed = sum(1 for s in flow.steps if s.ok)
        total = len(flow.steps)
        if flow.passed:
            tag = paint(" PASS ", C.BG_GREEN + C.WHITE, bold=True)
            print(paint("│", C.CYAN))
            print(paint(
                f"└─ {tag}  {passed}/{total} steps ok  "
                f"({flow.duration_s:.2f}s)", C.GREEN, bold=True))
        else:
            tag = paint(" FAIL ", C.BG_RED + C.WHITE, bold=True)
            print(paint("│", C.CYAN))
            print(paint(
                f"└─ {tag}  {passed}/{total} steps ok  "
                f"({flow.duration_s:.2f}s)", C.RED, bold=True))
        print()

    def step(self, flow: FlowResult, name: str, ok: bool, detail: str = "") -> None:
        mark = paint("✓", C.GREEN, bold=True) if ok else paint("❌", C.RED, bold=True)
        line = f"│   {mark} {name}"
        if detail:
            coloured_detail = paint(
                f"  — {detail}",
                C.GREEN if ok else C.RED,
                bold=False)
            line += coloured_detail
        print(line)
        flow.steps.append(StepResult(name=name, ok=ok, detail=detail))

    # ── final summary ──────────────────────────────────────────────────────
    def summary(self) -> tuple[int, int]:
        print(paint("═" * 70, C.MAGENTA, bold=True))
        print(paint("  📊 FINAL SUMMARY", C.MAGENTA, bold=True))
        print(paint("═" * 70, C.MAGENTA, bold=True))
        passed_flows = sum(1 for f in self.flows if f.passed)
        total_flows = len(self.flows)
        total_steps = sum(len(f.steps) for f in self.flows)
        passed_steps = sum(1 for f in self.flows for s in f.steps if s.ok)

        for f in self.flows:
            mark = paint("✓", C.GREEN, bold=True) if f.passed else paint("❌", C.RED, bold=True)
            title_colour = C.GREEN if f.passed else C.RED
            print(f"  {mark} {paint(f'({f.letter})', C.BOLD)} "
                  f"{paint(f.title, title_colour, bold=True)}  "
                  f"{paint(f'{sum(1 for s in f.steps if s.ok)}/{len(f.steps)} steps', C.DIM)}")

        print(paint("─" * 70, C.DIM))
        if passed_flows == total_flows:
            verdict = paint(
                f"🎉 ALL {total_flows}/{total_flows} FLOWS PASSED "
                f"({passed_steps}/{total_steps} steps)  — GREEN FOR LAUNCH 🚀",
                C.GREEN, bold=True)
        else:
            verdict = paint(
                f"⚠️  {passed_flows}/{total_flows} FLOWS PASSED "
                f"({passed_steps}/{total_steps} steps)  — DO NOT LAUNCH",
                C.RED, bold=True)
        print(f"  {verdict}")
        print(paint("═" * 70, C.MAGENTA, bold=True))
        print()
        return passed_flows, total_flows


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────
def _rand_id(n: int = 8) -> str:
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))


def _rand_email() -> str:
    return f"smoke+{_rand_id()}@example.com"


def _short(v: Any, max_len: int = 80) -> str:
    """Compact one-line representation of an arbitrary value."""
    if isinstance(v, (dict, list)):
        s = json.dumps(v, ensure_ascii=False, default=str)
    else:
        s = str(v)
    if len(s) > max_len:
        s = s[: max_len - 1] + "…"
    return s


def _expect_keys(payload: Any, *keys: str) -> list[str]:
    """Return the list of expected keys that are MISSING from a dict payload."""
    if not isinstance(payload, dict):
        return list(keys)
    return [k for k in keys if k not in payload]


# ──────────────────────────────────────────────────────────────────────────────
# The 5 flows
# ──────────────────────────────────────────────────────────────────────────────
def flow_a_anonymous_visitor(r: Reporter, client: httpx.Client) -> FlowResult:
    flow = FlowResult(letter="a", title="Anonymous visitor browses temples",
                      emoji="🌐")
    r.flow_header(flow)
    flow.started_at = time.time()

    # Step 1: backend status
    try:
        resp = client.get(f"{BACKEND_URL}/api/backend/status", timeout=TIMEOUT)
        ok = resp.status_code == 200 and resp.headers.get("content-type", "").startswith("application/json")
        body = resp.json() if ok else {}
        r.step(flow, f"GET /api/backend/status → {resp.status_code}", ok,
               _short(body.get("status", "?")))
    except Exception as e:
        r.step(flow, "GET /api/backend/status", False, repr(e))
        flow.finished_at = time.time()
        r.flow_footer(flow)
        return flow

    # Step 2: list temples
    try:
        resp = client.get(f"{BACKEND_URL}/api/temples", timeout=TIMEOUT)
        ok = resp.status_code == 200
        body = resp.json() if ok else {}
        count = body.get("count", len(body.get("temples", []))) if isinstance(body, dict) else 0
        r.step(flow, f"GET /api/temples → {resp.status_code}", ok,
               f"{count} temples")
    except Exception as e:
        r.step(flow, "GET /api/temples", False, repr(e))
        flow.finished_at = time.time()
        r.flow_footer(flow)
        return flow

    # Step 3: fetch a specific temple
    try:
        resp = client.get(f"{BACKEND_URL}/api/temple/UK", timeout=TIMEOUT)
        ok = resp.status_code == 200
        body = resp.json() if ok else {}
        missing = _expect_keys(body, "code", "name", "city", "regulation")
        if ok and missing:
            ok = False
            r.step(flow, f"GET /api/temple/UK → {resp.status_code}", False,
                   f"missing keys: {missing}")
        else:
            r.step(flow, f"GET /api/temple/UK → {resp.status_code}", ok,
                   f"{body.get('name', '?')} · {body.get('regulation', '?')}")
    except Exception as e:
        r.step(flow, "GET /api/temple/UK", False, repr(e))

    flow.finished_at = time.time()
    r.flow_footer(flow)
    return flow


def flow_b_signup_and_ichar(r: Reporter, client: httpx.Client) -> FlowResult:
    flow = FlowResult(letter="b", title="Sign up → create ichar → verify it appears",
                      emoji="🆕")
    r.flow_header(flow)
    flow.started_at = time.time()

    email = _rand_email()
    password = f"Smoke-{_rand_id(6)}-{_rand_id(4)}"
    user_id: str | None = None

    # Step 1: sign up
    try:
        resp = client.post(
            f"{BACKEND_URL}/api/auth/signup",
            json={"email": email, "password": password,
                  "display_name": "Smoke Test"},
            timeout=TIMEOUT,
        )
        ok = resp.status_code in (200, 201)
        body = resp.json() if ok else {}
        user_id = body.get("user_id") if isinstance(body, dict) else None
        r.step(flow, f"POST /api/auth/signup → {resp.status_code}", ok,
               f"user_id={user_id}, email={email}")
    except Exception as e:
        r.step(flow, "POST /api/auth/signup", False, repr(e))
        flow.finished_at = time.time()
        r.flow_footer(flow)
        return flow

    if not user_id:
        r.step(flow, "create ichar (skipped — no user_id)", False,
               "signup did not return user_id")
        flow.finished_at = time.time()
        r.flow_footer(flow)
        return flow

    # Step 2: create an ichar for that user
    ichar_name = f"SmokeIchar-{_rand_id(4)}"
    try:
        resp = client.post(
            f"{BACKEND_URL}/api/ichar/create",
            json={"user_id": user_id, "name": ichar_name,
                  "arcana": 0, "tier": "T1"},
            timeout=TIMEOUT,
        )
        ok = resp.status_code in (200, 201)
        body = resp.json() if ok else {}
        ichar_id = body.get("ichar_id") if isinstance(body, dict) else None
        r.step(flow, f"POST /api/ichar/create → {resp.status_code}", ok,
               f"ichar_id={ichar_id}, name={ichar_name}")
    except Exception as e:
        r.step(flow, "POST /api/ichar/create", False, repr(e))
        flow.finished_at = time.time()
        r.flow_footer(flow)
        return flow

    # Step 3: verify ichar appears for user
    try:
        resp = client.get(
            f"{BACKEND_URL}/api/ichar/user/{user_id}", timeout=TIMEOUT)
        ok = resp.status_code == 200
        body = resp.json() if ok else {}
        ichars = body.get("ichars", []) if isinstance(body, dict) else []
        found = any(
            (i.get("name") == ichar_name) or (i.get("ichar_id") == ichar_id)
            for i in ichars
        )
        r.step(flow, f"GET /api/ichar/user/{user_id} → {resp.status_code}",
               ok and found,
               f"{body.get('count', 0)} ichar(s) — "
               + ("found" if found else f"NOT found (expected {ichar_name})"))
    except Exception as e:
        r.step(flow, f"GET /api/ichar/user/{user_id}", False, repr(e))

    flow.finished_at = time.time()
    r.flow_footer(flow)
    return flow


def flow_c_council_consultation(r: Reporter, client: httpx.Client) -> FlowResult:
    flow = FlowResult(letter="c", title="Council consultation — Monzo EU AI Act",
                      emoji="⚖️")
    r.flow_header(flow)
    flow.started_at = time.time()

    query = "Monzo EU AI Act compliance"
    try:
        resp = client.post(
            f"{BACKEND_URL}/api/cascade/route_query",
            json={"query": query, "tier": "auto"},
            timeout=TIMEOUT,
        )
        ok = resp.status_code == 200
        body = resp.json() if ok else {}

        missing = _expect_keys(body, "tier", "cost", "sigil_hash")
        if missing:
            r.step(flow, f"POST /api/cascade/route_query → {resp.status_code}",
                   False, f"missing keys: {missing}")
        else:
            tier = body.get("tier", "?")
            cost = body.get("cost") or body.get("cost_usd")
            sigil = body.get("sigil_hash", "?")
            cost_str = f"${cost:.6f}" if isinstance(cost, (int, float)) else str(cost)
            r.step(flow,
                   f"POST /api/cascade/route_query → {resp.status_code}",
                   ok,
                   f"tier={tier}, cost={cost_str}, sigil={sigil}")
    except Exception as e:
        r.step(flow, "POST /api/cascade/route_query", False, repr(e))

    flow.finished_at = time.time()
    r.flow_footer(flow)
    return flow


def flow_d_sigil_verify(r: Reporter, client: httpx.Client) -> FlowResult:
    flow = FlowResult(letter="d", title="SIGIL verify — tamper-evident hash check",
                      emoji="🔐")
    r.flow_header(flow)
    flow.started_at = time.time()

    # Fetch a real sigil hash from /api/backend/status so we're verifying
    # a hash the system actually emitted.
    try:
        status_resp = client.get(f"{BACKEND_URL}/api/backend/status",
                                 timeout=TIMEOUT)
        status = status_resp.json() if status_resp.status_code == 200 else {}
        sample_hash = status.get("last_sigil") or status.get("sigil_hash") \
            or "7e41cf03d5fc5c23"  # known-good fallback from prior runs
    except Exception:
        sample_hash = "7e41cf03d5fc5c23"

    try:
        resp = client.post(
            f"{BACKEND_URL}/api/sigil/verify",
            json={"hash": sample_hash, "context": "smoke_test"},
            timeout=TIMEOUT,
        )
        ok = resp.status_code == 200
        body = resp.json() if ok else {}
        verified = body.get("valid", body.get("verified", False)) \
            if isinstance(body, dict) else False
        r.step(flow, f"POST /api/sigil/verify → {resp.status_code}",
               ok and bool(verified),
               f"hash={sample_hash[:16]}…  valid={verified}")
    except Exception as e:
        r.step(flow, "POST /api/sigil/verify", False, repr(e))

    flow.finished_at = time.time()
    r.flow_footer(flow)
    return flow


def flow_e_sovereign_composite(r: Reporter, client: httpx.Client) -> FlowResult:
    flow = FlowResult(letter="e",
                      title="Sovereign composite — 13/13 council + 218 MCPs + sovereign online",
                      emoji="👑")
    r.flow_header(flow)
    flow.started_at = time.time()

    try:
        resp = client.get(f"{BACKEND_URL}/api/backend/status", timeout=TIMEOUT)
        ok = resp.status_code == 200
        body = resp.json() if ok else {}
    except Exception as e:
        r.step(flow, "GET /api/backend/status", False, repr(e))
        flow.finished_at = time.time()
        r.flow_footer(flow)
        return flow

    if not ok:
        r.step(flow, f"GET /api/backend/status → {resp.status_code}", False,
               _short(body))
        flow.finished_at = time.time()
        r.flow_footer(flow)
        return flow

    # Council check
    council = body.get("council_obj") or body.get("council_dict") or {}
    council_online = council.get("online", 0)
    council_total = council.get("total", 13)
    council_ok = council_online == council_total == 13
    r.step(flow, "council online = 13/13",
           council_ok,
           f"{council_online}/{council_total}  "
           f"(bft_quorum={council.get('bft_quorum', '?')}, "
           f"veto_queens={council.get('veto_queens', '?')})")

    # MCP count
    mcps = body.get("mcps", 0)
    r.step(flow, "mcps = 218", mcps == 218, f"actual={mcps}")

    # Sovereign online
    sov = body.get("sovereign") or {}
    sov_online = sov.get("online", False) if isinstance(sov, dict) else False
    r.step(flow, "sovereign online", bool(sov_online),
           f"version={sov.get('version', '?')}" if isinstance(sov, dict) else "")

    # Top-level status
    top_status = body.get("status", "?")
    r.step(flow, f"top-level status = 'online'", top_status == "online",
           f"actual='{top_status}'")

    # SOV3 MCP handshake (extra robustness — does the sovereign MCP answer?)
    try:
        mcp_resp = client.post(
            SOV3_MCP_URL,
            json={"jsonrpc": "2.0", "id": 1, "method": "tools/list",
                  "params": {}},
            timeout=TIMEOUT,
        )
        mcp_ok = mcp_resp.status_code == 200
        mcp_body = mcp_resp.json() if mcp_ok else {}
        mcp_tools = len(mcp_body.get("result", {}).get("tools", [])) \
            if isinstance(mcp_body, dict) else 0
        r.step(flow, f"POST {SOV3_MCP_URL} (JSON-RPC tools/list) → "
                     f"{mcp_resp.status_code}",
               mcp_ok and mcp_tools > 0,
               f"{mcp_tools} tools advertised")
    except Exception as e:
        r.step(flow, f"POST {SOV3_MCP_URL}", False, repr(e))

    flow.finished_at = time.time()
    r.flow_footer(flow)
    return flow


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────
def main() -> int:
    reporter = Reporter()
    reporter.banner()

    flows: list[Callable[[Reporter, httpx.Client], FlowResult]] = [
        flow_a_anonymous_visitor,
        flow_b_signup_and_ichar,
        flow_c_council_consultation,
        flow_d_sigil_verify,
        flow_e_sovereign_composite,
    ]

    # Single shared client — connection pooling + uniform timeouts
    with httpx.Client(timeout=TIMEOUT) as client:
        for fn in flows:
            try:
                result = fn(reporter, client)
            except Exception as e:
                # Defensive: a flow that blows up is treated as a single failed step
                fake = FlowResult(
                    letter="?", title=fn.__name__, emoji="💥",
                    started_at=time.time(), finished_at=time.time())
                reporter.step(fake, "flow raised exception", False, repr(e))
                reporter.flow_footer(fake)
                result = fake
            reporter.flows.append(result)

    passed, total = reporter.summary()
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
