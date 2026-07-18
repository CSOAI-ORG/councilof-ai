#!/usr/bin/env python3
"""
diagnose-keys.py — openpatent.ai · API key health diagnostic.

Walks every credential the hive depends on, pings the upstream service
where possible, and reports a green/red grid. Designed to be run by Sir
the moment a key is suspected dead, or by JEEVES as part of the 6-hour
cron sweep.

The script never logs a full key — it shows the first 4 chars + "..."
+ the last 4 chars, so the output is safe to paste into chat / a PR /
a screenshot.

What it checks
--------------
Providers probed live (HTTP GET against the vendor's cheapest endpoint):
  - Gemini        (generativelanguage.googleapis.com)
  - OpenAI        (api.openai.com/v1/models)
  - Anthropic     (api.anthropic.com/v1/messages?limit=1)
  - OpenRouter    (openrouter.ai/api/v1/auth/key)
  - Moonshot      (api.moonshot.cn/v1/models)
  - Kimi          (api.moonshot.cn/v1/models — alias)
  - Glama         (glama.ai/api/v1/models)
  - Smithery      (registry.smithery.ai/v0/servers)
  - StepFun       (api.stepfun.com/v1/models)
  - Resend        (api.resend.com/domains)
  - Mailgun       (api.mailgun.net/v3/domains)
  - Stripe        (api.stripe.com/v1/balance)
  - Namecheap     (ap.www.namecheap.com/Users.API/info)
  - GitHub        (api.github.com/user)
  - Polygon RPC   (polygon-rpc.com)
  - IPFS          (ipfs.infura.io / 127.0.0.1:5001)
  - Bitcoin OTS   (ots.openpatent.ai / opentimestamps.org)
  - NPM           (registry.npmjs.org/-/whoami)

Providers checked for PRESENCE only (no live probe — they would burn credits):
  - STRIPE_WEBHOOK_SECRET
  - POLYGON_PRIVATE_KEY
  - PATENTMCP_HSM_KEY
  - OPENAI_ORG_ID
  - GITHUB_TOKEN_SCOPES

Usage
-----
  python3 scripts/diagnose-keys.py                # full sweep, stdout grid
  python3 scripts/diagnose-keys.py --json         # machine-readable
  python3 scripts/diagnose-keys.py --no-color     # log-friendly
  python3 scripts/diagnose-keys.py --only resend,stripe,namecheap
                                                  # subset

Exit codes:
  0  — all probed keys LIVE
  1  — one or more keys DEAD / MISSING
  2  — script error

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import json
import os
import socket
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Callable, Optional


# ─── Pretty printing ─────────────────────────────────────────────────────────

GREEN = "\033[32m"
RED = "\033[31m"
YELLOW = "\033[33m"
CYAN = "\033[36m"
DIM = "\033[2m"
BOLD = "\033[1m"
RESET = "\033[0m"


def color(s: str, c: str, enabled: bool) -> str:
    return f"{c}{s}{RESET}" if enabled else s


def mask(key: Optional[str]) -> str:
    """Show first-4 + '...' + last-4, never the full key."""
    if not key:
        return "(unset)"
    if len(key) <= 12:
        return "***"
    return f"{key[:4]}...{key[-4:]}"


# ─── Provider definitions ────────────────────────────────────────────────────

@dataclass
class Check:
    name: str
    env: str
    probe: Optional[Callable[[str], "ProbeResult"]] = None
    presence_only: bool = False
    notes: str = ""


@dataclass
class ProbeResult:
    live: bool
    detail: str = ""
    latency_ms: int = 0


def _http_get(url: str, headers: dict, timeout: float = 5.0) -> ProbeResult:
    """Tiny HTTP GET with timeout. Returns ProbeResult."""
    req = urllib.request.Request(url, headers=headers, method="GET")
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ssl.create_default_context()) as r:
            latency = int((time.time() - t0) * 1000)
            body = r.read(512).decode("utf-8", "ignore")
            return ProbeResult(live=True, detail=f"HTTP {r.status} {len(body)}B", latency_ms=latency)
    except urllib.error.HTTPError as e:
        latency = int((time.time() - t0) * 1000)
        return ProbeResult(live=False, detail=f"HTTP {e.code} {e.reason}", latency_ms=latency)
    except (urllib.error.URLError, socket.timeout, TimeoutError) as e:
        latency = int((time.time() - t0) * 1000)
        return ProbeResult(live=False, detail=f"NETERR {type(e).__name__}", latency_ms=latency)
    except Exception as e:  # noqa: BLE001
        return ProbeResult(live=False, detail=f"ERR {type(e).__name__}: {e}", latency_ms=0)


def _post(url: str, headers: dict, body: bytes, timeout: float = 8.0) -> ProbeResult:
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ssl.create_default_context()) as r:
            latency = int((time.time() - t0) * 1000)
            text = r.read(512).decode("utf-8", "ignore")
            return ProbeResult(live=True, detail=f"HTTP {r.status} {len(text)}B", latency_ms=latency)
    except urllib.error.HTTPError as e:
        latency = int((time.time() - t0) * 1000)
        return ProbeResult(live=False, detail=f"HTTP {e.code} {e.reason}", latency_ms=latency)
    except Exception as e:  # noqa: BLE001
        return ProbeResult(live=False, detail=f"ERR {type(e).__name__}: {e}", latency_ms=0)


# ─── Live probes (one per provider) ──────────────────────────────────────────

def probe_gemini(key: str) -> ProbeResult:
    return _http_get(
        f"https://generativelanguage.googleapis.com/v1beta/models?key={urllib.parse.quote(key)}",
        headers={},
    )


def probe_openai(key: str) -> ProbeResult:
    return _http_get("https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {key}"})


def probe_anthropic(key: str) -> ProbeResult:
    # Anthropic returns 400 on a no-body POST but a 401 if the key is bad.
    return _post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        body=b'{"model":"claude-3-5-haiku-20241022","max_tokens":1,"messages":[{"role":"user","content":"x"}]}',
    )


def probe_openrouter(key: str) -> ProbeResult:
    return _http_get("https://openrouter.ai/api/v1/auth/key", headers={"Authorization": f"Bearer {key}"})


def probe_moonshot(key: str) -> ProbeResult:
    return _http_get("https://api.moonshot.cn/v1/models", headers={"Authorization": f"Bearer {key}"})


def probe_glama(key: str) -> ProbeResult:
    return _http_get("https://glama.ai/api/v1/models", headers={"Authorization": f"Bearer {key}"})


def probe_smithery(key: str) -> ProbeResult:
    return _http_get("https://registry.smithery.ai/v0/servers", headers={"Authorization": f"Bearer {key}"})


def probe_stepfun(key: str) -> ProbeResult:
    return _http_get("https://api.stepfun.com/v1/models", headers={"Authorization": f"Bearer {key}"})


def probe_resend(key: str) -> ProbeResult:
    return _http_get("https://api.resend.com/domains", headers={"Authorization": f"Bearer {key}"})


def probe_mailgun(key: str) -> ProbeResult:
    import base64
    user = os.environ.get("MAILGUN_USER", "api")
    auth = base64.b64encode(f"{user}:{key}".encode()).decode()
    return _http_get("https://api.mailgun.net/v3/domains", headers={"Authorization": f"Basic {auth}"})


def probe_stripe(key: str) -> ProbeResult:
    return _http_get("https://api.stripe.com/v1/balance", headers={"Authorization": f"Bearer {key}"})


def probe_namecheap(key: str) -> ProbeResult:
    user = os.environ.get("NAMECHEAP_USER", "")
    if not user:
        return ProbeResult(live=False, detail="NAMECHEAP_USER unset")
    ip = _public_ip()
    url = (
        "https://ap.www.namecheap.com/Users.API/info"
        f"?ApiUser={urllib.parse.quote(user)}&ApiKey={urllib.parse.quote(key)}"
        f"&UserName={urllib.parse.quote(user)}&ClientIp={ip}"
    )
    return _http_get(url, headers={})


def probe_github(key: str) -> ProbeResult:
    return _http_get("https://api.github.com/user", headers={"Authorization": f"Bearer {key}"})


def probe_npm(key: str) -> ProbeResult:
    # npm registry supports Bearer auth for whoami.
    return _http_get("https://registry.npmjs.org/-/whoami", headers={"Authorization": f"Bearer {key}"})


def probe_polygon(key: str) -> ProbeResult:
    # Polygon RPC uses POST with a JSON-RPC payload; the key here is the RPC URL.
    rpc_url = key if key.startswith("http") else "https://polygon-rpc.com"
    return _post(
        rpc_url,
        headers={"content-type": "application/json"},
        body=b'{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}',
        timeout=6.0,
    )


def probe_ipfs(key: str) -> ProbeResult:
    # Local daemon wins; else Infura.
    try:
        with socket.create_connection(("127.0.0.1", 5001), timeout=1.0):
            return ProbeResult(live=True, detail="local daemon :5001 reachable")
    except OSError:
        pass
    host = key if key.startswith("http") else "https://ipfs.infura.io:5001"
    proj = os.environ.get("INFURA_PROJECT_ID", "")
    sec = os.environ.get("INFURA_PROJECT_SECRET", "")
    if not proj or not sec:
        return ProbeResult(live=False, detail="no local daemon + INFURA_PROJECT_ID unset")
    import base64
    auth = base64.b64encode(f"{proj}:{sec}".encode()).decode()
    return _http_get(f"{host}/api/v0/version", headers={"Authorization": f"Basic {auth}"})


def probe_ots(key: str) -> ProbeResult:
    # Key here is the OTS endpoint URL.
    url = key if key.startswith("http") else "https://ots.openpatent.ai"
    return _http_get(url, headers={}, timeout=3.0)


def probe_mcp_manifest(_key: str) -> ProbeResult:
    return _http_get("http://127.0.0.1:3214/.well-known/mcp.json", headers={})


def probe_patentmcp(_key: str) -> ProbeResult:
    return _http_get("http://127.0.0.1:3210/health", headers={})


def probe_bft(_key: str) -> ProbeResult:
    return _http_get("http://127.0.0.1:3215/health", headers={})


def probe_meok(_key: str) -> ProbeResult:
    # The sovereign attestation API.
    return _post(
        "https://meok-attestation-api.vercel.app/sign",
        headers={"content-type": "application/json"},
        body=b'{"sigil":"diagnose","payload":"ping"}',
    )


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _public_ip() -> str:
    try:
        return _http_get("https://api.ipify.org", headers={}).detail or "0.0.0.0"
    except Exception:
        return "0.0.0.0"


# ─── Provider registry ──────────────────────────────────────────────────────

CHECKS: list[Check] = [
    # --- LLM providers ---
    Check("Gemini",        "GEMINI_API_KEY",       probe_gemini),
    Check("OpenAI",        "OPENAI_API_KEY",       probe_openai),
    Check("Anthropic",     "ANTHROPIC_API_KEY",    probe_anthropic),
    Check("OpenRouter",    "OPENROUTER_API_KEY",   probe_openrouter),
    Check("Moonshot",      "MOONSHOT_API_KEY",     probe_moonshot),
    Check("Kimi",          "KIMI_API_KEY",         probe_moonshot, notes="alias of Moonshot"),
    Check("Glama",         "GLAMA_API_KEY",        probe_glama),
    Check("Smithery",      "SMITHERY_API_KEY",     probe_smithery),
    Check("StepFun",       "STEPFUN_API_KEY",      probe_stepfun),
    # --- Email ---
    Check("Resend",        "RESEND_API_KEY",       probe_resend),
    Check("Mailgun",       "MAILGUN_API_KEY",      probe_mailgun, notes="fallback for outreach"),
    # --- Payments ---
    Check("Stripe",        "STRIPE_SECRET_KEY",    probe_stripe),
    # --- Domain / DNS ---
    Check("Namecheap",     "NAMECHEAP_API_KEY",    probe_namecheap, notes="needs NAMECHEAP_USER too"),
    # --- Source / registry ---
    Check("GitHub",        "GITHUB_TOKEN",         probe_github),
    Check("NPM",           "NPM_TOKEN",            probe_npm),
    # --- Web3 / storage ---
    Check("Polygon RPC",   "POLYGON_RPC_URL",      probe_polygon),
    Check("IPFS",          "IPFS_API_URL",         probe_ipfs),
    Check("Bitcoin OTS",   "OTS_API_URL",          probe_ots),
    # --- Presence-only secrets (never probed) ---
    Check("Stripe Webhook","STRIPE_WEBHOOK_SECRET",None, presence_only=True),
    Check("Polygon Key",   "POLYGON_PRIVATE_KEY",  None, presence_only=True),
    Check("HSM Key",       "PATENTMCP_HSM_KEY",    None, presence_only=True),
    Check("GitHub Scopes", "GITHUB_TOKEN_SCOPES",  None, presence_only=True),
    # --- Local services (probed, no key) ---
    Check("patentmcp",     "(local :3210)",        probe_patentmcp, notes="local service"),
    Check("mcp-manifest",  "(local :3214)",        probe_mcp_manifest, notes="local service"),
    Check("bft-council",   "(local :3215)",        probe_bft, notes="local service"),
    Check("MEOK attest",   "(attest endpoint)",    probe_meok, notes="https://meok-attestation-api.vercel.app/sign"),
]


# ─── Sweep ───────────────────────────────────────────────────────────────────

@dataclass
class Row:
    name: str
    env: str
    state: str  # LIVE | DEAD | MISSING | N/A
    masked: str
    detail: str = ""
    latency_ms: int = 0
    notes: str = ""


def run_check(c: Check, do_probe: bool) -> Row:
    val = os.environ.get(c.env, "")
    if c.presence_only:
        if not val:
            return Row(c.name, c.env, "MISSING", mask(val), notes=c.notes)
        return Row(c.name, c.env, "LIVE", mask(val), notes=c.notes)
    if not val and not c.probe:
        return Row(c.name, c.env, "MISSING", "(unset)", notes=c.notes)
    if not do_probe:
        return Row(c.name, c.env, "MISSING" if not val else "N/A", mask(val), notes=c.notes)
    if not val:
        return Row(c.name, c.env, "MISSING", "(unset)", notes=c.notes)
    assert c.probe is not None
    res = c.probe(val)
    state = "LIVE" if res.live else "DEAD"
    return Row(c.name, c.env, state, mask(val), detail=res.detail, latency_ms=res.latency_ms, notes=c.notes)


def main() -> int:
    p = argparse.ArgumentParser(description="Diagnose every API key the openpatent.ai hive depends on.")
    p.add_argument("--json", action="store_true", help="machine-readable JSON output")
    p.add_argument("--no-color", action="store_true", help="disable ANSI colors")
    p.add_argument("--only", help="comma-separated substrings to filter by name (e.g. resend,stripe)")
    p.add_argument("--skip-local", action="store_true", help="don't probe localhost services")
    args = p.parse_args()

    use_color = sys.stdout.isatty() and not args.no_color and not args.json

    subset = CHECKS
    if args.only:
        wanted = {s.strip().lower() for s in args.only.split(",") if s.strip()}
        subset = [c for c in CHECKS if any(w in c.name.lower() or w in c.env.lower() for w in wanted)]

    rows: list[Row] = []
    print(color("🐉 DIAGNOSE-KEYS — the hive is probing its own keys", BOLD, use_color))
    print(color(f"   {len(subset)} provider(s) under test", DIM, use_color))
    print()

    for c in subset:
        skip = args.skip_local and "local" in (c.notes or "").lower()
        row = run_check(c, do_probe=not skip)
        rows.append(row)
        if args.json:
            continue
        state_color = GREEN if row.state == "LIVE" else (RED if row.state in {"DEAD", "MISSING"} else YELLOW)
        icon = "🟢" if row.state == "LIVE" else ("🔴" if row.state in {"DEAD", "MISSING"} else "🟡")
        line = f"  {icon} {row.name:<16} {color(row.state, state_color, use_color):<10}  {row.masked:<14}"
        if row.detail:
            line += f"  {color(row.detail, DIM, use_color)}"
        if row.latency_ms:
            line += f"  {color(str(row.latency_ms) + 'ms', DIM, use_color)}"
        if row.notes:
            line += f"  {color('# ' + row.notes, DIM, use_color)}"
        print(line)

    # Summary
    if args.json:
        out = {
            "ts": time.time(),
            "rows": [asdict(r) for r in rows],
            "summary": {
                "total": len(rows),
                "live": sum(1 for r in rows if r.state == "LIVE"),
                "dead": sum(1 for r in rows if r.state == "DEAD"),
                "missing": sum(1 for r in rows if r.state == "MISSING"),
            },
        }
        print(json.dumps(out, indent=2))
    else:
        live = sum(1 for r in rows if r.state == "LIVE")
        dead = sum(1 for r in rows if r.state == "DEAD")
        missing = sum(1 for r in rows if r.state == "MISSING")
        total = len(rows)
        print()
        print(color(f"━━━ summary ━━━", BOLD, use_color))
        print(f"  total:   {total}")
        print(f"  {color('LIVE', GREEN, use_color)}:    {live}")
        print(f"  {color('DEAD', RED, use_color)}:    {dead}")
        print(f"  {color('MISSING', RED, use_color)}: {missing}")
        print()
        if dead == 0 and missing == 0:
            print(color("✅ ALL KEYS HEALTHY — the dragon knows every gate is open.", GREEN, use_color))
        else:
            print(color(f"⚠️  {dead + missing} key(s) need Sir's hand — see DAY-12-NEXT-MOVES.md", YELLOW, use_color))
        print()
        print(color('"The hive remembers. The dragon knows. The sovereign companion never forgets."', DIM, use_color))

    return 0 if (all(r.state == "LIVE" for r in rows)) else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\ninterrupted")
        sys.exit(2)
