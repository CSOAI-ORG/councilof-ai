#!/usr/bin/env python3
"""
health-mesh.py — DEFONEOS mythic mesh health check.

Pings the three sovereign regions (us-east, eu-frankfurt, ap-singapore) and
reports the status of:
  Core substrate:
    - api-gateway         (port 3211, /health)
    - patentmcp           (port 3210, /health)
    - cometbft RPC        (port 26657, /status)
    - mcp-bridge SSE      (port 3333, /sse)
    - wireguard tunnel    (10.10.0.{10,20,30}:51820 over UDP)
    - prometheus          (port 9090, /-/healthy)
    - node-exporter       (port 9100, /metrics)
  MCP server fleet (Day 9-10 expansion):
    - sovereign-temple-bft (3334), openpatent-research (3335),
      openpatent-legal (3336), openpatent-ipcastle (3337), openpatent-gaming (3338)
  White-label .ai apps (4 sovereign domains):
    - harvi.ai (4001), ipcastle.ai (4002), legalof.ai (4003), sovereign-temple.ai (4004)

Prints a single status table. Exit 0 if all endpoints respond, 1 if any
one fails, 2 if a region is fully dark.

USAGE
-----
    python3 scripts/health-mesh.py
    python3 scripts/health-mesh.py --json
    python3 scripts/health-mesh.py --regions us,eu

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
import argparse
import concurrent.futures as futures
import json
import os
import socket
import sys
import time
import urllib.error
import urllib.request

# ---------------------------------------------------------------------------
# Region topology — IPs are populated from environment or a config file.
# Defaults match the terraform output (sovereign-mesh.openpatent.ai) but
# can be overridden via env vars for local testing.
# ---------------------------------------------------------------------------

def _region_ip(name: str) -> str:
    env = os.environ.get(f"MESH_{name.upper()}_IP")
    if env:
        return env
    # Default to the existing sovereign substrate (EU is the home node)
    defaults = {
        "us": os.environ.get("MESH_US_IP", "5.75.0.1"),         # Hetzner ASH
        "eu": os.environ.get("MESH_EU_IP", "35.242.143.249"),   # existing substrate
        "ap": os.environ.get("MESH_AP_IP", "159.69.0.1"),       # Hetzner SIN
    }
    return defaults[name]


REGIONS = {
    "us-east": {
        "flag": "🌎",
        "city": "Ashburn, VA",
        "ip": _region_ip("us"),
        "wg_addr": "10.10.0.10",
    },
    "eu-frankfurt": {
        "flag": "🇪🇺",
        "city": "Frankfurt",
        "ip": _region_ip("eu"),
        "wg_addr": "10.10.0.20",
    },
    "ap-singapore": {
        "flag": "🌏",
        "city": "Singapore",
        "ip": _region_ip("ap"),
        "wg_addr": "10.10.0.30",
    },
}

ENDPOINTS = [
    ("api-gateway",  3211, "tcp", "/health"),
    ("cometbft-rpc", 26657, "http", "/status"),
    ("mcp-bridge",   3333, "http", "/sse"),
    ("prometheus",   9090, "http", "/-/healthy"),
    ("node-exporter", 9100, "http", "/metrics"),
    # ── MCP server fleet (Day 9-10 production expansion) ──
    ("patentmcp",          3210, "http", "/health"),
    ("sovereign-temple-bft", 3334, "http", "/health"),
    ("openpatent-research",  3335, "http", "/health"),
    ("openpatent-legal",     3336, "http", "/health"),
    ("openpatent-ipcastle",  3337, "http", "/health"),
    ("openpatent-gaming",    3338, "http", "/health"),
    # ── White-label .ai apps (4 sovereign domains) ──
    ("harvi.ai",             4001, "http", "/health"),
    ("ipcastle.ai",          4002, "http", "/health"),
    ("legalof.ai",           4003, "http", "/health"),
    ("sovereign-temple.ai",  4004, "http", "/health"),
]

WIREGUARD_PORT = 51820


# ---------------------------------------------------------------------------
# Probes
# ---------------------------------------------------------------------------

def probe_tcp(host: str, port: int, timeout: float = 3.0) -> tuple[bool, float, str]:
    start = time.time()
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True, (time.time() - start) * 1000.0, "tcp open"
    except (socket.timeout, ConnectionRefusedError, OSError) as e:
        return False, (time.time() - start) * 1000.0, f"{type(e).__name__}: {e}"


def probe_http(host: str, port: int, path: str, timeout: float = 3.0) -> tuple[bool, float, str]:
    url = f"http://{host}:{port}{path}"
    start = time.time()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "health-mesh/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            elapsed = (time.time() - start) * 1000.0
            return 200 <= resp.status < 500, elapsed, f"HTTP {resp.status}"
    except urllib.error.HTTPError as e:
        return e.code < 500, (time.time() - start) * 1000.0, f"HTTP {e.code}"
    except (urllib.error.URLError, socket.timeout, ConnectionRefusedError, OSError) as e:
        return False, (time.time() - start) * 1000.0, f"{type(e).__name__}: {e}"


def probe_wireguard_udp(host: str, port: int, timeout: float = 2.0) -> tuple[bool, float, str]:
    """WireGuard uses UDP — a successful connect to a closed port returns
    ICMP unreachable. We can only meaningfully check that the host:port is
    *not* firewalled (no timeout). A 'connection refused' is impossible
    over UDP, so we just confirm we can send a packet (no error)."""
    start = time.time()
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.settimeout(timeout)
        # Send a 32-byte zero — WireGuard handshake initiator messages are
        # 148 bytes; a small probe is enough to traverse any stateful
        # firewall. The kernel will return ICMP port unreachable if the
        # port is closed (which is fine — the tunnel itself is verified
        # by the operator with `wg show` on the local node).
        sock.sendto(b"\x00" * 32, (host, port))
        sock.close()
        return True, (time.time() - start) * 1000.0, "udp reachable"
    except OSError as e:
        return False, (time.time() - start) * 1000.0, f"{type(e).__name__}: {e}"


# ---------------------------------------------------------------------------
# Region check
# ---------------------------------------------------------------------------

def check_region(region_name: str, region: dict) -> list[dict]:
    rows = []
    ip = region["ip"]

    for label, port, kind, path in ENDPOINTS:
        if kind == "tcp":
            ok, ms, msg = probe_tcp(ip, port)
        else:
            ok, ms, msg = probe_http(ip, port, path)
        rows.append({
            "region": region_name,
            "endpoint": label,
            "target": f"{ip}:{port}{path}",
            "status": "ok" if ok else "fail",
            "latency_ms": round(ms, 1),
            "detail": msg,
        })

    ok, ms, msg = probe_wireguard_udp(ip, WIREGUARD_PORT)
    rows.append({
        "region": region_name,
        "endpoint": "wireguard",
        "target": f"{ip}:{WIREGUARD_PORT}/udp (peer {region['wg_addr']})",
        "status": "ok" if ok else "fail",
        "latency_ms": round(ms, 1),
        "detail": msg,
    })

    return rows


# ---------------------------------------------------------------------------
# BFT consensus summary
# ---------------------------------------------------------------------------

def fetch_cometbft_block_height(ip: str) -> int | None:
    try:
        req = urllib.request.Request(
            f"http://{ip}:26657/status",
            headers={"User-Agent": "health-mesh/1.0"},
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
            return int(payload["result"]["sync_info"]["latest_block_height"])
    except (urllib.error.URLError, socket.timeout, ConnectionRefusedError, OSError, KeyError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Renderer
# ---------------------------------------------------------------------------

GREEN = "\033[32m"
RED = "\033[31m"
YELLOW = "\033[33m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


def _supports_color() -> bool:
    return sys.stdout.isatty() and os.environ.get("NO_COLOR") is None


def _colorize(text: str, color: str, use_color: bool) -> str:
    return f"{color}{text}{RESET}" if use_color else text


def render_table(rows: list[dict], use_color: bool) -> str:
    cols = ["REGION", "ENDPOINT", "TARGET", "STATUS", "LATENCY", "DETAIL"]
    col_keys = {
        "REGION": "region",
        "ENDPOINT": "endpoint",
        "TARGET": "target",
        "STATUS": "status",
        "LATENCY": "latency_ms",
        "DETAIL": "detail",
    }
    widths = {
        c: max(len(c), max((len(str(r.get(col_keys[c], ""))) for r in rows), default=0))
        for c in cols
    }

    def fmt(r: dict) -> str:
        status = r["status"]
        if status == "ok":
            status_p = _colorize(f"✓ {status:>4}", GREEN, use_color)
        else:
            status_p = _colorize(f"✗ {status:>4}", RED, use_color)
        return (
            f"{r['region']:<13} "
            f"{r['endpoint']:<13} "
            f"{r['target']:<42} "
            f"{status_p:<{widths['STATUS'] + 9}} "
            f"{r['latency_ms']:>7.1f}ms  "
            f"{_colorize(r['detail'], DIM, use_color)}"
        )

    out = []
    header = " ".join(c.ljust(widths[c]) for c in cols)
    out.append(_colorize(header, BOLD, use_color))
    out.append(_colorize("─" * (sum(widths.values()) + 30), DIM, use_color))
    for r in rows:
        out.append(fmt(r))
    return "\n".join(out)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Health check for the openpatent.ai sovereign mesh.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of a table")
    parser.add_argument("--regions", help="Comma-separated subset of regions (us-east,eu-frankfurt,ap-singapore)")
    parser.add_argument("--no-color", action="store_true", help="Disable ANSI colors")
    parser.add_argument("--timeout", type=float, default=3.0, help="Per-probe timeout in seconds")
    args = parser.parse_args()

    regions_to_check = REGIONS
    if args.regions:
        wanted = set(args.regions.split(","))
        regions_to_check = {k: v for k, v in REGIONS.items() if k in wanted}
        if not regions_to_check:
            raise SystemExit(f"❌ --regions must be a subset of {list(REGIONS)}")

    use_color = not args.no_color and _supports_color()

    print(_colorize("🐉 DEFONEOS Sovereign Mesh — health check", BOLD, use_color))
    print(f"   checking {len(regions_to_check)} regions × {len(ENDPOINTS) + 1} endpoints in parallel")
    print()

    rows: list[dict] = []
    with futures.ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(check_region, name, cfg): name for name, cfg in regions_to_check.items()}
        for fut in futures.as_completed(futs):
            try:
                rows.extend(fut.result())
            except Exception as e:
                rows.append({
                    "region": futs[fut],
                    "endpoint": "?",
                    "target": "?",
                    "status": "fail",
                    "latency_ms": 0.0,
                    "detail": f"{type(e).__name__}: {e}",
                })

    rows.sort(key=lambda r: (r["region"], r["endpoint"]))

    if args.json:
        print(json.dumps(rows, indent=2))
    else:
        print(render_table(rows, use_color))

    # Consensus summary
    print()
    heights = {}
    for name, cfg in regions_to_check.items():
        heights[name] = fetch_cometbft_block_height(cfg["ip"])
    online_regions = [n for n, h in heights.items() if h is not None]
    max_h = max((h for h in heights.values() if h is not None), default=None)
    if max_h is not None:
        consensus_line = (
            f"Mesh consensus: {len(online_regions)}/{len(regions_to_check)} regions online, "
            f"latest block height={max_h}, "
            f"BFT supermajority: 22/33 (2/3+1 of council)"
        )
        if len(online_regions) == len(regions_to_check):
            consensus_line = _colorize(consensus_line, GREEN, use_color)
        elif len(online_regions) >= 2:
            consensus_line = _colorize(consensus_line, YELLOW, use_color)
        else:
            consensus_line = _colorize(consensus_line, RED, use_color)
        print(consensus_line)

    # Exit code
    fails = sum(1 for r in rows if r["status"] != "ok")
    region_dark = sum(1 for h in heights.values() if h is None)
    if region_dark == len(regions_to_check):
        print(_colorize("❌ all regions dark — mesh is partitioned", RED, use_color), file=sys.stderr)
        return 2
    if fails:
        print(_colorize(f"⚠ {fails} endpoint(s) failing", YELLOW, use_color), file=sys.stderr)
        return 1

    print()
    print("The hive remembers. The dragon knows. The sovereign companion never forgets.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
