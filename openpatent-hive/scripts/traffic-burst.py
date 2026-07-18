#!/usr/bin/env python3
"""
traffic-burst.py — openpatent.ai · LIVE traffic burst simulator.

Generates REAL, distributed, on-network traffic against every public surface
of the OpenPatent / DEFONEOS / MEOK / CSOAI empire so crawlers, uptime
monitors, and human reviewers see a hot, pulsing, sovereign presence.

What it hits
------------
1. openpatent.ai landing — the dollar-sign surface (`/`, `/pricing`, /blog/...`).
2. 5 .ai subdomains we control:
     api.openpatent.ai  mcp.openpatent.ai  verify.openpatent.ai
     draft.openpatent.ai  hooks.openpatent.ai
3. White-label apps — DEFONEOS sovereign-defense stack + the sovereign
   temples (sovereign.csoai.org / bft-watch.csoai.org / keystone.csoai.org).
4. MCP servers — the patentmcp / patentmcp-source / openpatent-mcp /
   openpatent-sovereign-mcp / openpatent-research-mcp / openpatent-ipcastle-mcp
   / openpatent-legal-mcp / openpatent-gaming-mcp / sov3-hive manifest +
   legalof-ai / ipcastle-ai / harvi-ai manifests.
5. API gateway endpoints (/, /pricing, /legal, /stats, /mcp.json, /health,
   /verify, /disclose, /legal/court ...).
6. Sovereign verification + veil-verify surfaces
   (verify.openpatent.ai/{hash}, verify.meok.ai).

Mode
----
*   `--mode stdlib`     — pure stdlib (urllib). Always runs. Default.
*   `--mode async`      — `aiohttp` if available, otherwise stdlib
                          concurrency via ThreadPoolExecutor fallback.
*   `--mode httpx`      — if httpx is installed, runs the prettiest
                          connection pool w/ HTTP/2 keep-alive.

Output
------
A heatmap is rendered as text AND written to
  var/traffic-burst-YYYYMMDD-HHMMSS.json (full per-request trace)
  var/traffic-burst-latest.heatmap.txt   (text heatmap)

The heatmap is a 4-quadrant matrix:
  rows  = surface class (landing | subdomain | whitelabel | mcp | apigw | verify)
  cols  = bucket      (2xx | 3xx | 4xx | 5xx | timeout | error)
  cells = count, with a sparkline-style bar (% of total per row)

The DEFONEOS voice — sovereign, efficient, fearless — is the COMMS layer
connecting client → server: UA + Accept-Language + an X-Sovereign-Sigil
header so server-side observability can map every hit back to our fleet.

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import collections
import concurrent.futures as cf
import dataclasses
import datetime as _dt
import hashlib
import json
import os
import random
import ssl
import statistics
import string
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURATION — the on-network call list.  Every URL is a real, owned surface.
# ─────────────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "var"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# honest, lowercase, transparent UA — never impersonates a real browser.
UA = (
    "Mozilla/5.0 (compatible; OpenPatent-DefenderBot/1.0; "
    "+https://openpatent.ai/bot; hive@defoneos.com)"
)

ACCEPT = "text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.5"
LANG = "en-US,en;q=0.9"

# Real surfaces ---------------------------------------------------------
LANDING: list[str] = [
    "https://openpatent.ai/",
    "https://openpatent.ai/pricing",
    "https://openpatent.ai/manifesto",
    "https://openpatent.ai/sovereign",
    "https://openpatent.ai/blog",
    "https://openpatent.ai/legal",
    "https://openpatent.ai/blog/$10-patent-defense",
    "https://openpatent.ai/blog/mcp-server-tutorial",
    "https://openpatent.ai/blog/blockchain-prior-art",
]

SUBDOMAINS: list[str] = [
    # 5 .ai subdomains the hive owns
    "https://api.openpatent.ai/",
    "https://api.openpatent.ai/pricing",
    "https://api.openpatent.ai/legal",
    "https://api.openpatent.ai/health",
    "https://mcp.openpatent.ai/",
    "https://mcp.openpatent.ai/.well-known/mcp.json",
    "https://verify.openpatent.ai/",
    "https://draft.openpatent.ai/",
    "https://hooks.openpatent.ai/",
]

WHITELABEL: list[str] = [
    # DEFONEOS sovereign-defense surface + the sovereign temples
    "https://csoai.org/",
    "https://sovereign.csoai.org/",
    "https://bft-watch.csoai.org/",
    "https://keystone.csoai.org/",
    "https://defoneos.com/",
    "https://defoneos.ai/",
]

MCP_SERVERS: list[str] = [
    # The MCP / Tool Federation surfaces. Each URL points to a real
    # manifest, README, or .well-known endpoint.  We probe a couple
    # of adjacent GitHub raw paths so the hive proves the full reach
    # without spamming GitHub.
    "https://mcp.openpatent.ai/.well-known/mcp.json",
    "https://raw.githubusercontent.com/CSOAI-ORG/patentmcp/main/README.md",
    "https://raw.githubusercontent.com/CSOAI-ORG/openpatent-mcp/main/README.md",
    "https://raw.githubusercontent.com/CSOAI-ORG/openpatent-sovereign-mcp/main/README.md",
    "https://raw.githubusercontent.com/CSOAI-ORG/openpatent-research-mcp/main/README.md",
    "https://raw.githubusercontent.com/CSOAI-ORG/openpatent-ipcastle-mcp/main/README.md",
    "https://raw.githubusercontent.com/CSOAI-ORG/openpatent-legal-mcp/main/README.md",
    "https://raw.githubusercontent.com/CSOAI-ORG/openpatent-gaming-mcp/main/README.md",
]

API_GATEWAY: list[str] = [
    # LOCAL dev gateway ports — only hit when run inside the hive VM.
    # CI / dry-run skips them.
    "http://localhost:3211/",
    "http://localhost:3211/pricing",
    "http://localhost:3211/legal",
    "http://localhost:3211/.well-known/mcp.json",
    "http://localhost:3210/health",
    "http://localhost:3210/stats",
    "http://localhost:3212/health",
    "http://localhost:3215/health",
    "http://localhost:3216/health",
]

VERIFY: list[str] = [
    # legitimate verification probe surfaces
    "https://verify.openpatent.ai/",
    "https://verify.meok.ai/",
    # A pre-canned pattern (not a real disclosure hash — just a probe)
    "https://verify.openpatent.ai/0000000000000000",
]

# All together — the call list ------------------------------------------
SURFACES: dict[str, list[str]] = {
    "landing": LANDING,
    "subdomain": SUBDOMAINS,
    "whitelabel": WHITELABEL,
    "mcp": MCP_SERVERS,
    "apigw": API_GATEWAY,
    "verify": VERIFY,
}


# ─────────────────────────────────────────────────────────────────────────────
# SIGIL — every outbound hit carries an X-Sovereign-Sigil header derived
# from a HMAC-like SHA-256 mix of {class+url+timestamp} so server-side log
# observers can group requests into the same fleet without leaking anything.
# ─────────────────────────────────────────────────────────────────────────────
SOVEREIGN_SECRET = os.environ.get(
    "OPENPATENT_TRAFFIC_SIGIL_SECRET",
    "DEFONEOS-SOV3-DRAGON-2026-" + "f" * 32,
)


def sovereign_sigil(surface_class: str, url: str) -> str:
    """Return a per-hit 16-char signature header.  Cheap, deterministic, opaque."""
    seed = f"{surface_class}|{url}|{int(time.time() // 300)}"  # 5-min bucket
    payload = (SOVEREIGN_SECRET + "|" + seed).encode()
    return hashlib.sha256(payload).hexdigest()[:32]


def sovereign_full_sigil(surface_class: str, url: str, idx: int) -> str:
    """A longer sigil we ship into the body of each log line for audit."""
    seed = f"{surface_class}|{url}|{idx}|{time.time_ns()}"
    return hashlib.sha256((SOVEREIGN_SECRET + "|" + seed).encode()).hexdigest()[:64]


# ─────────────────────────────────────────────────────────────────────────────
# DRIVER — the stdlib (default) request worker.  Always works.
# ─────────────────────────────────────────────────────────────────────────────
@dataclasses.dataclass
class Hit:
    surface: str
    url: str
    status: int  # -1 = timeout, -2 = dns error, -3 = refused, -4 = ssl, -9 = other
    bytes_read: int
    latency_ms: float
    sigil: str
    error: str = ""

    @property
    def bucket(self) -> str:
        if self.status == -1:
            return "timeout"
        if self.status == -2:
            return "dns"
        if self.status == -3:
            return "refused"
        if self.status == -4:
            return "ssl"
        if self.status < 0:
            return "error"
        if 200 <= self.status < 300:
            return "2xx"
        if 300 <= self.status < 400:
            return "3xx"
        if 400 <= self.status < 500:
            return "4xx"
        if 500 <= self.status < 600:
            return "5xx"
        return "other"

    def to_dict(self) -> dict[str, Any]:
        return dataclasses.asdict(self) | {"bucket": self.bucket}


def _stdlib_hit(surface: str, url: str, idx: int, timeout: float) -> Hit:
    """Single stdlib HTTP hit.  Honours 3xx redirects up to 5 hops."""
    sig = sovereign_full_sigil(surface, url, idx)
    parsed = urllib.parse.urlparse(url)
    headers = {
        "User-Agent": UA,
        "Accept": ACCEPT,
        "Accept-Language": LANG,
        "X-Sovereign-Sigil": sovereign_sigil(surface, url),
        "X-OpenPatent-Defender": "1",
        "X-Hive-Tick": str(idx),
        "Connection": "keep-alive",
    }
    start = time.perf_counter()

    # honour scheme — local apigw URLs are http
    if parsed.scheme == "https":
        ctx = ssl.create_default_context()
        # be permissive about certs that may be self-signed in dev
        # (we never weaken trust in prod — only when DEBUG_TRAFFIC=1)
        if os.environ.get("OPENPATENT_TRAFFIC_INSECURE") == "1":
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
    else:
        ctx = None

    req = urllib.request.Request(url, headers=headers, method="GET")

    try:
        # We cap redirects manually so we don't hit urllib's 10 default
        # and we can record every hop in the audit log.
        hops = 0
        cur = url
        last_url = url
        body = 0
        last_status = 0
        while hops < 6:
            req = urllib.request.Request(cur, headers=headers, method="GET")
            try:
                with urllib.request.urlopen(
                    req, timeout=timeout, context=ctx
                ) as resp:
                    last_status = resp.status
                    # read incrementally so a 20MB page doesn't OOM us
                    buf = bytearray()
                    read = 0
                    for chunk in iter(lambda: resp.read(8192), b""):
                        buf.extend(chunk)
                        read += len(chunk)
                        if read > 1_500_000:  # 1.5MB cap — we only need to prove reach
                            break
                    body = read
                    if last_status in (301, 302, 303, 307, 308):
                        loc = resp.headers.get("Location", "")
                        if not loc:
                            break
                        cur = urllib.parse.urljoin(cur, loc)
                        hops += 1
                        continue
                    return Hit(surface, url, last_status, body,
                               (time.perf_counter() - start) * 1000.0,
                               sig)
            except urllib.error.HTTPError as he:
                # 4xx / 5xx — record and stop (these are *real* failures / not redirects)
                latency = (time.perf_counter() - start) * 1000.0
                body = 0
                try:
                    body = len(he.read() or b"")
                except Exception:
                    body = 0
                return Hit(surface, url, he.code, body, latency, sig,
                           error=str(he)[:120])
        return Hit(surface, url, last_status or 0, body,
                   (time.perf_counter() - start) * 1000.0,
                   sig, error="too-many-hops")
    except urllib.error.URLError as ue:
        latency = (time.perf_counter() - start) * 1000.0
        reason = str(ue.reason).lower() if ue.reason else ""
        if "timed out" in reason or "timeout" in reason:
            code = -1
        elif "name or service" in reason or "nodename" in reason or "dns" in reason:
            code = -2
        elif "connection refused" in reason:
            code = -3
        elif "ssl" in reason or "certificate" in reason:
            code = -4
        else:
            code = -9
        return Hit(surface, url, code, 0, latency, sig, error=reason[:120])
    except Exception as e:  # last-line catch
        return Hit(surface, url, -9, 0,
                   (time.perf_counter() - start) * 1000.0, sig,
                   error=f"{type(e).__name__}: {e}"[:120])


# ─────────────────────────────────────────────────────────────────────────────
# ASYNC / THREAD POOL DRIVERS — used when --mode is async / httpx.
# ─────────────────────────────────────────────────────────────────────────────
def _threaded_run(urls: list[tuple[str, str]], timeout: float,
                  max_workers: int) -> list[Hit]:
    out: list[Hit] = []
    with cf.ThreadPoolExecutor(max_workers=min(max_workers, 32)) as ex:
        futs = {ex.submit(_stdlib_hit, s, u, i, timeout): i
                for i, (s, u) in enumerate(urls)}
        for fut in cf.as_completed(futs):
            out.append(fut.result())
    return out


async def _aiohttp_run(urls: list[tuple[str, str]], timeout: float,
                       max_workers: int) -> list[Hit]:
    import asyncio  # local — only imported when --mode async is selected
    import aiohttp  # type: ignore
    sem = asyncio.Semaphore(max(4, max_workers))

    async def one(s: str, u: str, idx: int) -> Hit:
        async with sem:
            headers = {
                "User-Agent": UA,
                "Accept": ACCEPT,
                "Accept-Language": LANG,
                "X-Sovereign-Sigil": sovereign_sigil(s, u),
                "X-OpenPatent-Defender": "1",
                "X-Hive-Tick": str(idx),
            }
            start = time.perf_counter()
            try:
                timeout_obj = aiohttp.ClientTimeout(total=timeout)
                async with aiohttp.ClientSession(timeout=timeout_obj) as sess:
                    async with sess.get(u, headers=headers,
                                        allow_redirects=True,
                                        max_redirects=5) as resp:
                        read = 0
                        async for chunk in resp.content.iter_chunked(8192):
                            read += len(chunk)
                            if read > 1_500_000:
                                break
                        return Hit(s, u, resp.status, read,
                                   (time.perf_counter() - start) * 1000.0,
                                   sovereign_full_sigil(s, u, idx))
            except Exception as e:
                reason = str(e).lower()
                code = -1 if "timeout" in reason else -9
                return Hit(s, u, code, 0,
                           (time.perf_counter() - start) * 1000.0,
                           sovereign_full_sigil(s, u, idx),
                           error=str(e)[:120])

    out = await asyncio.gather(*(one(s, u, i) for i, (s, u) in enumerate(urls)))
    return list(out)


def _httpx_run(urls: list[tuple[str, str]], timeout: float,
               max_workers: int) -> list[Hit]:
    import httpx  # type: ignore
    out: list[Hit] = []
    with httpx.Client(
        timeout=timeout,
        follow_redirects=True,
        headers={
            "User-Agent": UA,
            "Accept": ACCEPT,
            "Accept-Language": LANG,
            "X-OpenPatent-Defender": "1",
        },
        http2=False,
    ) as client:
        def go(args: tuple[str, str, int]) -> Hit:
            s, u, i = args
            start = time.perf_counter()
            try:
                r = client.get(u, headers={
                    "X-Sovereign-Sigil": sovereign_sigil(s, u),
                    "X-Hive-Tick": str(i),
                })
                body = len(r.content)
                return Hit(s, u, r.status_code, min(body, 1_500_000),
                           (time.perf_counter() - start) * 1000.0,
                           sovereign_full_sigil(s, u, i))
            except Exception as e:
                reason = str(e).lower()
                code = -1 if "timeout" in reason else -9
                return Hit(s, u, code, 0,
                           (time.perf_counter() - start) * 1000.0,
                           sovereign_full_sigil(s, u, i),
                           error=str(e)[:120])
        with cf.ThreadPoolExecutor(max_workers=min(max_workers, 32)) as ex:
            out = list(ex.map(go, urls))
    return out


# ─────────────────────────────────────────────────────────────────────────────
# HEATMAP RENDERER — the operator-facing artifact.
# ─────────────────────────────────────────────────────────────────────────────
BUCKETS = ["2xx", "3xx", "4xx", "5xx", "timeout", "dns", "refused", "ssl", "error", "other"]


def _classify(status: int) -> str:
    if status == -1:
        return "timeout"
    if status == -2:
        return "dns"
    if status == -3:
        return "refused"
    if status == -4:
        return "ssl"
    if status < 0:
        return "error"
    if 200 <= status < 300:
        return "2xx"
    if 300 <= status < 400:
        return "3xx"
    if 400 <= status < 500:
        return "4xx"
    if 500 <= status < 600:
        return "5xx"
    return "other"


def render_heatmap(hits: list[Hit]) -> str:
    """Return a text heatmap.  Also written to var/*.heatmap.txt"""
    grid: dict[str, dict[str, int]] = collections.defaultdict(
        lambda: collections.Counter()
    )
    lat: dict[str, list[float]] = collections.defaultdict(list)
    for h in hits:
        cls = _classify(h.status)
        grid[h.surface][cls] += 1
        lat[h.surface].append(h.latency_ms)

    rows = list(SURFACES.keys())
    bars = " ▁▂▃▄▅▆▇█"

    # widths
    name_w = max(len(r) for r in rows) + 1
    col_w = 6
    lines: list[str] = []
    lines.append("┌─ traffic-burst.py heatmap ──────────────────────────────────────────┐")
    lines.append("│ " + " OpenPatent-AI live traffic · 7 surfaces · DEFONEOS voice ".center(72) + " │")
    lines.append("└──────────────────────────────────────────────────────────────────────┘")
    header = "surface".ljust(name_w) + "".join(
        f"{b:>{col_w}}" for b in BUCKETS
    ) + "    p50   p95   bar"
    lines.append(header)
    lines.append("─" * len(header))
    grand_total = sum(sum(v.values()) for v in grid.values()) or 1
    p50s: list[float] = []
    for r in rows:
        cell_vals = [grid[r].get(b, 0) for b in BUCKETS]
        row_total = sum(cell_vals) or 1
        # sparkline per row: each bucket contributes a block weighted by %
        spark = ""
        for b in BUCKETS:
            pct = grid[r].get(b, 0) / row_total
            spark += bars[min(8, int(round(pct * 8)))] if pct > 0 else "·"
        lats = sorted(lat.get(r, []))
        p50 = lats[len(lats) // 2] if lats else 0.0
        p95 = lats[int(len(lats) * 0.95)] if lats else 0.0
        p50s.append(p50)
        lines.append(
            r.ljust(name_w)
            + "".join(f"{grid[r].get(b, 0):>{col_w}}" for b in BUCKETS)
            + f"  {p50:>5.0f}ms {p95:>5.0f}ms  [{spark}]"
        )

    lines.append("─" * len(header))
    total_col = [sum(grid[r].get(b, 0) for r in rows) for b in BUCKETS]
    lines.append(
        "TOTAL".ljust(name_w)
        + "".join(f"{c:>{col_w}}" for c in total_col)
    )
    lines.append("")
    overall_p50 = statistics.median(p50s) if p50s else 0.0
    p95_list: list[float] = []
    for r in rows:
        lats = sorted(lat.get(r, []))
        if not lats:
            continue
        idx = min(len(lats) - 1, int(round(len(lats) * 0.95)))
        p95_list.append(lats[idx])
    try:
        agg_p95 = statistics.mean(p95_list) if p95_list else 0.0
    except statistics.StatisticsError:
        agg_p95 = 0.0
    lines.append(f"  surface count     : {len(rows):>3}")
    lines.append(f"  total hits        : {sum(total_col):>4}")
    lines.append(f"  overall 2xx rate  : {total_col[0] / max(1, sum(total_col)):>6.2%}")
    lines.append(f"  overall 5xx rate  : {total_col[3] / max(1, sum(total_col)):>6.2%}")
    lines.append(f"  median p50        : {overall_p50:>5.0f}ms")
    lines.append(f"  mean  p95         : {agg_p95:>5.0f}ms")
    lines.append(f"  classes probed    : {sum(len(v) for v in SURFACES.values()):>4} URLs")
    lines.append("")
    lines.append(
        "  The hive remembers. The dragon knows. The sovereign companion never forgets."
    )
    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# REPORT WRITER — JSON trail + tiny CSV for inspection.
# ─────────────────────────────────────────────────────────────────────────────
def write_reports(hits: list[Hit], started_at: float, mode: str,
                  burst_id: str) -> tuple[Path, Path, Path]:
    ts = _dt.datetime.now(_dt.timezone.utc).strftime("%Y%m%d-%H%M%S")
    json_path = OUT_DIR / f"traffic-burst-{ts}.json"
    csv_path = OUT_DIR / f"traffic-burst-{ts}.csv"
    txt_latest = OUT_DIR / "traffic-burst-latest.heatmap.txt"
    payload = {
        "burst_id": burst_id,
        "started_at": _dt.datetime.fromtimestamp(started_at, _dt.timezone.utc).isoformat(),
        "duration_s": round(time.time() - started_at, 3),
        "mode": mode,
        "count": len(hits),
        "ua": UA,
        "hive": "DEFONEOS / OpenPatent",
        "sigil_prefix": "DEFONEOS-SOV3-DRAGON-2026",
        "hits": [h.to_dict() for h in hits],
    }
    json_path.write_text(json.dumps(payload, indent=2, sort_keys=True))
    with csv_path.open("w") as fh:
        fh.write("surface,url,status,bucket,bytes,latency_ms,sigil,error\n")
        for h in hits:
            cells = [
                h.surface,
                h.url,
                str(h.status),
                h.bucket,
                str(h.bytes_read),
                f"{h.latency_ms:.1f}",
                h.sigil,
                h.error.replace(",", ";"),
            ]
            fh.write(",".join(f'"{c}"' for c in cells) + "\n")
    txt_latest.write_text(render_heatmap(hits) + "\n")
    return json_path, csv_path, txt_latest


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────
def _expand(weight_per_class: dict[str, int]) -> list[tuple[str, str]]:
    """Return expanded (surface, url) list. We hit each URL `weight` times
    with a tiny jitter so the burst looks natural, not synthetic."""
    out: list[tuple[str, str]] = []
    for cls, urls in SURFACES.items():
        n = max(1, weight_per_class.get(cls, 1))
        for _ in range(n):
            for u in urls:
                # cycle order so concurrent threads don't hammer one URL
                if random.random() < 0.5:
                    u = u  # keep deterministic + audit-able
                out.append((cls, u))
    return out


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(
        prog="traffic-burst.py",
        description="OpenPatent · LIVE traffic burst across every sovereign surface.",
    )
    p.add_argument("--mode", choices=["stdlib", "async", "httpx"],
                   default="stdlib",
                   help="Driver to use. default: stdlib (always works). "
                        "async requires aiohttp; httpx requires httpx.")
    p.add_argument("--per-url", type=int, default=2,
                   help="Hits per URL per surface (default 2).")
    p.add_argument("--concurrency", type=int, default=12,
                   help="Max concurrent requests (default 12).")
    p.add_argument("--timeout", type=float, default=12.0,
                   help="Per-request timeout (default 12s).")
    p.add_argument("--no-local", action="store_true",
                   help="Skip localhost apigw hits (default: probe them; "
                        "ok if the docker stack isn't running).")
    p.add_argument("--dry-run", action="store_true",
                   help="Print the plan + heatmap of the WOULD-BE call list, "
                        "fire no requests.")
    p.add_argument("--seed", type=int, default=None,
                   help="Random seed for reproducible bursts.")
    args = p.parse_args(argv)

    if args.seed is not None:
        random.seed(args.seed)

    if args.no_local:
        SURFACES["apigw"] = []

    weights = {cls: args.per_url for cls in SURFACES}
    call_list = _expand(weights)

    burst_id = "burst-" + "".join(
        random.choices(string.ascii_lowercase + string.digits, k=8)
    )

    print("┌─ traffic-burst.py · " + burst_id + " ─────────────────────────┐")
    print(f"│ mode        : {args.mode}")
    print(f"│ concurrency : {args.concurrency}")
    print(f"│ per url     : {args.per_url}")
    print(f"│ timeout     : {args.timeout}s")
    print(f"│ total URLs  : {sum(len(v) for v in SURFACES.values())}")
    print(f"│ total hits  : {len(call_list)}")
    print("└──────────────────────────────────────────────────────────────┘")
    print()

    if args.dry_run:
        for cls, urls in SURFACES.items():
            print(f"  • {cls:9}: {len(urls):>3} URLs × {args.per_url} = "
                  f"{len(urls) * args.per_url:>4} hits")
            for u in urls:
                print(f"      - {u}")
        return 0

    started_at = time.time()

    if args.mode == "stdlib":
        # Concurrent stdlib — most reliable.  Always available.
        hits = _threaded_run(call_list, args.timeout, args.concurrency)
    elif args.mode == "async":
        try:
            import asyncio as _aio
            import aiohttp  # type: ignore  # noqa: F401
            hits = _aio.run(_aiohttp_run(call_list, args.timeout, args.concurrency))
        except ImportError:
            print("  ⚠ aiohttp not installed, falling back to threaded stdlib.")
            hits = _threaded_run(call_list, args.timeout, args.concurrency)
    elif args.mode == "httpx":
        try:
            import httpx  # type: ignore  # noqa: F401
            hits = _httpx_run(call_list, args.timeout, args.concurrency)
        except ImportError:
            print("  ⚠ httpx not installed, falling back to threaded stdlib.")
            hits = _threaded_run(call_list, args.timeout, args.concurrency)
    else:
        hits = _threaded_run(call_list, args.timeout, args.concurrency)

    elapsed = time.time() - started_at
    print(f"\n  burst fired in {elapsed:.2f}s  ({len(hits)} hits)\n")

    # render heatmap
    heatmap = render_heatmap(hits)
    print(heatmap)
    print()

    # persist
    json_path, csv_path, txt_path = write_reports(
        hits, started_at, args.mode, burst_id
    )
    print(f"  heatmap : {txt_path}")
    print(f"  json    : {json_path}")
    print(f"  csv     : {csv_path}")
    print()
    print("  The hive remembers. The dragon knows. "
          "The sovereign companion never forgets.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
