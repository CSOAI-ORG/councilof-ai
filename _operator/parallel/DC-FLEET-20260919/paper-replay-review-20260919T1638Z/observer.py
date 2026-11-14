"""Read-only CSOAI fleet and public-market evidence adapter. No order API."""
from __future__ import annotations
import datetime as dt
import hashlib
import http.client
import itertools
import json
import math
from pathlib import Path
import subprocess
import sys

VERSION = "0.1.0"
HERE = Path(__file__).resolve().parent
M2_DIR = "/Users/iokfarm/workspace_for_ai/csoai-fleet-observer-20260919"
M4_DIR = "/Users/nicholas/clawd/councilof-ai-work/_operator/parallel/DC-FLEET-20260919"
M2_PY = "/Users/iokfarm/gspc-shadow-lab/.venv/bin/python"
M4_PY = "/opt/homebrew/bin/python3"
DB = Path("/Users/iokfarm/gspc-shadow-lab/data/shadow_market.duckdb")
SYMBOLS = ("BTC/USDC", "ETH/USDC", "LINK/USDC", "ONDO/USDC")
VENUES = ("coinbase", "kraken", "okx")
UTC = dt.timezone.utc

def now_utc():
    return dt.datetime.now(UTC)

def digest(value):
    raw = json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False)
    return hashlib.sha256(raw.encode()).hexdigest()

def parse_time(value):
    result = dt.datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    if result.tzinfo is None:
        raise ValueError("timezone missing")
    return result.astimezone(UTC)

def finite(value, minimum=0):
    return (isinstance(value, (int, float)) and not isinstance(value, bool)
            and math.isfinite(value) and value >= minimum)

def assess(rows, at=None, max_age_seconds=120):
    """Collector freshness is NOT proof of simultaneous exchange quotes."""
    at = at or now_utc()
    expected = set(itertools.product(SYMBOLS, VENUES))
    accepted, issues, duplicates = {}, [], set()
    for index, row in enumerate(rows):
        try:
            key = (row["symbol"], row["exchange"])
            if key not in expected:
                raise ValueError("outside declared scope")
            if key in accepted or key in duplicates:
                accepted.pop(key, None)
                duplicates.add(key)
                raise ValueError("duplicate market/venue observation")
            age = (at - parse_time(row["observed_at"])).total_seconds()
            if age < -5 or age > max_age_seconds:
                raise ValueError("stale or future collector timestamp")
            if not finite(row["bid"], 1e-15) or not finite(row["ask"], 1e-15):
                raise ValueError("invalid price")
            if row["ask"] < row["bid"]:
                raise ValueError("crossed order book")
            for field in ("bid_depth_quote", "ask_depth_quote"):
                if not finite(row.get(field), 1e-15):
                    raise ValueError("missing or invalid depth")
            accepted[key] = row
        except (KeyError, ValueError, TypeError, OverflowError) as exc:
            issues.append({"row": index, "reason": str(exc)})
    comparisons = []
    for symbol in SYMBOLS:
        observations = [v for (s, _), v in accepted.items() if s == symbol]
        for left, right in itertools.combinations(observations, 2):
            comparisons.append({"symbol": symbol,
                "venues": [left["exchange"], right["exchange"]],
                "collector_time_skew_seconds": abs((parse_time(left["observed_at"])
                    - parse_time(right["observed_at"])).total_seconds()),
                "gross_quote_difference_bps": round(10000 *
                    (right["bid"] / left["ask"] - 1), 6),
                "reverse_gross_quote_difference_bps": round(10000 *
                    (left["bid"] / right["ask"] - 1), 6),
                "net_return": None, "execution_eligible": False})
    return {"status": "OBSERVED" if accepted else "UNCHECKABLE",
        "expected_combinations": len(expected), "usable_combinations": len(accepted),
        "unobserved_or_invalid": [list(x) for x in sorted(expected - accepted.keys())],
        "issues": issues, "quote_comparisons": comparisons,
        "freshness_threshold_seconds": max_age_seconds,
        "time_basis": "collector batch start; exchange event times not retained",
        "fee_slippage_latency_model": "UNMEASURED", "live_execution_allowed": False}

def snapshot():
    import duckdb
    con = duckdb.connect(str(DB), read_only=True)
    try:
        con.execute("BEGIN TRANSACTION")
        total = con.execute("SELECT count(*) FROM shadow_snapshots").fetchone()[0]
        cursor = con.execute("""SELECT observed_at, symbol, exchange, bid, ask,
            bid_depth_quote, ask_depth_quote FROM shadow_snapshots
            QUALIFY row_number() OVER (PARTITION BY symbol, exchange
            ORDER BY observed_at DESC) = 1 ORDER BY symbol, exchange LIMIT 100""")
        names = [item[0] for item in cursor.description]
        rows = [dict(zip(names, row)) for row in cursor.fetchall()]
        for row in rows:
            row["observed_at"] = row["observed_at"].astimezone(UTC).isoformat()
    finally:
        con.close()
    at = now_utc()
    payload = {"schema": "csoai.shadow-observation/0.1", "created_at": at.isoformat(),
        "source": "M2 public-market recorder; read-only DuckDB transaction",
        "historical_rows": total, "retained_inputs": rows,
        "input_sha256": digest(rows), "assessment": assess(rows, at),
        "adapter_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "signature_verified": False, "profitability_tested": False,
        "limits": ["No fees, fills, slippage or exchange event times retained",
            "Fresh collector timestamps do not establish executable arbitrage",
            "Local observation, not a GSPC board admission or certification"]}
    return {"payload": payload, "payload_sha256": digest(payload)}

def verify(receipt, at=None):
    try:
        payload = receipt["payload"]
        valid = (digest(payload) == receipt["payload_sha256"] and
                 digest(payload["retained_inputs"]) == payload["input_sha256"])
        if not valid:
            raise ValueError("retained-byte digest mismatch")
        return {"integrity": "MATCH", "signature_verified": False,
            "as_of": (at or now_utc()).isoformat(),
            "current_assessment": assess(payload["retained_inputs"], at),
            "payload_sha256": receipt["payload_sha256"]}
    except (KeyError, TypeError, ValueError) as exc:
        return {"integrity": "UNCHECKABLE", "reason": str(exc),
                "live_execution_allowed": False}

def services():
    result = {"host": "M2" if str(Path.home()) == "/Users/iokfarm" else "M4",
              "as_of": now_utc().isoformat(), "scope": "unauthenticated HTTP reachability only"}
    for name, port in (("condor", 8088), ("hummingbot", 8000)):
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
        try:
            conn.request("GET", "/")
            result[name] = {"port": port, "http_status": conn.getresponse().status}
        except OSError as exc:
            result[name] = {"port": port, "status": "UNREACHABLE", "error_type": type(exc).__name__}
        finally:
            conn.close()
    return result

def run_json(command):
    try:
        output = subprocess.run(command, capture_output=True, text=True, timeout=12)
        if output.returncode or len(output.stdout) > 200000:
            return {"status": "UNCHECKABLE", "reason": "bounded read command failed",
                    "exit_code": output.returncode}
        return json.loads(output.stdout)
    except (OSError, ValueError, subprocess.TimeoutExpired) as exc:
        return {"status": "UNCHECKABLE", "error_type": type(exc).__name__}

def fixed_read(host, operation):
    """No caller-supplied executable, host, path or operation is accepted."""
    if (host, operation) not in (("M2", "snapshot"), ("M2", "services"), ("M4", "services")):
        raise ValueError("read is not allowlisted")
    py, directory = (M2_PY, M2_DIR) if host == "M2" else (M4_PY, M4_DIR)
    command = [py, "-B", directory + "/observer.py", operation]
    local = "M2" if str(Path.home()) == "/Users/iokfarm" else "M4"
    if host != local:
        peer = "iokfarm@IOKs-MacBook-Air.local" if host == "M2" else "nicholas@NICHOLASs-MacBook-Air-2.local"
        command = ["/usr/bin/ssh", "-o", "BatchMode=yes", "-o", "StrictHostKeyChecking=yes",
                   "-o", "ConnectTimeout=4", peer, " ".join(command)]
    return run_json(command)

def market_evidence():
    receipt = fixed_read("M2", "snapshot")
    if "payload" not in receipt:
        return receipt
    return {"receipt": receipt, "readback": verify(receipt)}

def serve_mcp():
    from mcp.server.fastmcp import FastMCP
    from mcp.types import ToolAnnotations
    server = FastMCP("csoai-readonly-observer", instructions=
        "Read-only fleet reachability and public-market observation evidence. "
        "No trading, signing, publishing, credentials or arbitrary commands. "
        "A hash match is not signature verification; quotes are not profit.")
    annotation = ToolAnnotations(readOnlyHint=True, destructiveHint=False,
                                 idempotentHint=True, openWorldHint=False)
    @server.tool(annotations=annotation)
    def fleet_status() -> dict:
        """Check both Macs' fixed localhost APIs over existing host-verified SSH."""
        return {host: fixed_read(host, "services") for host in ("M2", "M4")}
    @server.tool(annotations=annotation)
    def shadow_evidence() -> dict:
        """Read fresh M2 public quotes and replay integrity/freshness checks; no orders."""
        return market_evidence()
    @server.tool(annotations=annotation)
    def coordination_handoff() -> dict:
        """Read this observer's scope, caveats and coordination notes, not credentials."""
        path = HERE / "HANDOVER.md"
        return {"text": path.read_text()[:14000], "path": str(path)}
    server.run(transport="stdio")

if __name__ == "__main__":
    operation = sys.argv[1] if len(sys.argv) == 2 else "help"
    if operation == "mcp":
        serve_mcp()
    elif operation in ("snapshot", "services", "evidence"):
        try:
            value = {"snapshot": snapshot, "services": services,
                     "evidence": market_evidence}[operation]()
            print(json.dumps(value, sort_keys=True, allow_nan=False))
        except Exception as exc:
            print(json.dumps({"status": "UNCHECKABLE", "error_type": type(exc).__name__,
                              "live_execution_allowed": False}))
            sys.exit(2)
    else:
        print("Usage: observer.py {snapshot|services|evidence|mcp}")
        sys.exit(2)
