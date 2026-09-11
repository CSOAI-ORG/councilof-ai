#!/usr/bin/env python3
"""One ROUND of the MCP Trust Board census, as a committed artefact (counts only).

Implements docs/product/MCP-TRUST-BOARD-SPEC.md v0.1:
enumerate internet-facing MCP servers from the official registry, run ONE dry
protocol handshake per host (initialize; tools/list only if initialize answered;
tools counted, never called, never named), bucket the outcome, and publish a
counts-only snapshot. Doctrine (binding, inherited from the spec):

- Measurement, never certification. A bucket is never a grade.
- A 401/403 challenge is a term sheet — an invoice, not delivery.
- A 402 is an invoice, not delivery.
- A 404 is a registry row that does not exist.
- UNREACHABLE is never FAIL — DNS/TLS/timeout says only that we could not
  observe the server from here, at that moment.
- Host details are withheld by design. Counts are derived, never typed.

Caps held by construction: exactly one initialize + at most one tools/list per
host per round; no tool invocation ever; no authentication attempted (the board
holds no credentials and never will); nothing signed, nothing paid.

Usage:
  python3 scripts/mcp-trust-round.py [--cap 500] [--out-dir public/interop/mcp-trust]
  python3 scripts/mcp-trust-round.py --selftest     # no network; bucketing proofs

Lives in the repo so the pipeline can run it on the cadence
(mcp-trust-board-round.yml). Per-host rows are NOT written by default
(--rows-out opts in, operator-side only, never committed): the public artefact
is counts-only by doctrine.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import re
import statistics
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

REGISTRY_BASE = "https://registry.modelcontextprotocol.io/v0/servers"
UA = "csoai-mcp-trust/0.1 (+https://councilof.ai/trust)"
KIND = "csoai.mcp-trust-snapshot/0.1"
ORIGIN = "https://councilof.ai"
PROTOCOL_VERSION = "2025-06-18"
TIMEOUT = 14
WORKERS = 12

BUCKETS = (
    "initialize_ok_open",
    "initialize_ok_tools_listed",
    "auth_challenged_401_403",
    "x402_challenged_402",
    "alive_not_mcp",
    "listed_no_reply",
    "dead_404_or_unreachable",
    "other_error",
)

DOCTRINE = (
    "Measurement, never certification. A bucket is never a grade, rank or certificate. "
    "A 401/402 challenge is a term sheet — an invoice, not delivery. "
    "UNREACHABLE is never FAIL. Host details withheld by design; methodology published. "
    "Counts derived, never typed."
)

NOT_FIELD = (
    "This snapshot does not measure server quality, the safety of any tool, whether a "
    "listed tool does what its name claims, compliance with the MCP authorization "
    "specification, or any property of servers not listed in the enumeration source. "
    "The true internet-facing population is larger than the enumerable one and stays "
    "an open, unmeasured cell."
)

PAID_STEP = {
    "href": f"{ORIGIN}/api/x402",
    "commission": f"{ORIGIN}/api/request-attestation",
    "mcp": "commission_card",
    "note": "A named party may commission a signed card for THEIR OWN server "
            "(handshake result, auth posture observed, timestamp). A signed "
            "measurement, never a certificate. Host-level data about other "
            "parties' servers is not for sale at any price.",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# Enumeration
# ---------------------------------------------------------------------------

def fetch_json(url: str, timeout: int = 25, retries: int = 3):
    for i in range(retries):
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.load(r)
        except Exception:
            time.sleep(1.5 * (i + 1))
    return None


def enumerate_hosts(cap: int) -> dict:
    """Page the official registry; one row per distinct host, first remote wins.

    Returns hosts=[(host, url)], plus enumeration honesty metadata: if the
    registry paginates short of its stated total, that is recorded
    (complete: false), never passed off as complete.
    """
    hosts: dict[str, str] = {}
    cursor = None
    pages = rows_seen = with_remote = 0
    complete = False
    stop_reason = "cap reached"
    while len(hosts) < cap:
        url = f"{REGISTRY_BASE}?limit=100" + (f"&cursor={cursor}" if cursor else "")
        d = fetch_json(url)
        if d is None:
            stop_reason = "registry fetch failed after retries"
            break
        pages += 1
        servers = d.get("servers") or []
        if not servers:
            stop_reason = f"page {pages} returned 0 rows"
            break
        for s in servers:
            rows_seen += 1
            srv = s.get("server") or {}
            remotes = srv.get("remotes") or []
            if not remotes:
                continue
            with_remote += 1
            remote = next(
                (r for r in remotes if r.get("type") == "streamable-http"),
                remotes[0],
            )
            rurl = remote.get("url") or ""
            if not rurl.startswith("http"):
                continue
            host = (urlparse(rurl).netloc or "").lower()
            if not host or host in hosts:
                continue
            hosts[host] = rurl
            if len(hosts) >= cap:
                break
        nxt = (d.get("metadata") or {}).get("nextCursor")
        if not nxt:
            stop_reason = "cursor exhausted — clean end of registry"
            complete = True
            break
        if nxt == cursor:
            stop_reason = f"cursor repeated at page {pages} — server-side pagination defect"
            break
        cursor = nxt
    return {
        "hosts": sorted(hosts.items()),
        "enumeration": {
            "source": REGISTRY_BASE,
            "pages_fetched": pages,
            "registry_rows_seen": rows_seen,
            "rows_with_remote": with_remote,
            "unique_hosts": len(hosts),
            "cap": cap,
            "complete": complete,
            "stop_reason": stop_reason,
        },
    }


# ---------------------------------------------------------------------------
# Probe (dry, zero side effect)
# ---------------------------------------------------------------------------

def _rpc_body(method: str, params: dict | None = None) -> bytes:
    return json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params or {},
    }).encode()


def _post(url: str, body: bytes, session_id: str | None = None):
    """One POST. Returns (status, headers, parsed_jsonrpc_or_None, error_type_or_None).

    Never raises. error_type is the exception CLASS NAME only (DNS/TLS/timeout
    detail is not a property of the server and is never published).
    """
    headers = {
        "User-Agent": UA,
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    if session_id:
        headers["mcp-session-id"] = session_id
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            raw = r.read(65536).decode("utf-8", "replace")
            return r.status, dict(r.headers), _parse_jsonrpc(raw), None
    except urllib.error.HTTPError as e:
        try:
            raw = e.read(4096).decode("utf-8", "replace")
        except Exception:
            raw = ""
        return e.code, dict(e.headers or {}), _parse_jsonrpc(raw) if raw else None, None
    except Exception as e:
        return -1, {}, None, type(e).__name__


def _parse_jsonrpc(raw: str):
    """Accept a plain JSON body or an SSE stream (data: lines). Result or None."""
    raw = raw.strip()
    if not raw:
        return None
    candidates = []
    if raw.startswith("{") or raw.startswith("["):
        candidates.append(raw)
    for line in raw.splitlines():
        line = line.strip()
        if line.startswith("data:"):
            candidates.append(line[5:].strip())
    for c in candidates:
        try:
            d = json.loads(c)
        except Exception:
            continue
        if isinstance(d, dict) and (d.get("jsonrpc") == "2.0" or "result" in d or "error" in d):
            return d
    return None


def _auth_scheme_family(headers: dict) -> str:
    www = ""
    for k, v in headers.items():
        if k.lower() == "www-authenticate":
            www = v
            break
    low = www.lower()
    if "bearer" in low or "oauth" in low:
        return "bearer_or_oauth"
    if www:
        return "other_auth_scheme"
    return "challenge_no_scheme_header"


def classify(status: int, headers: dict, reply, error_type: str | None) -> tuple[str, dict]:
    """Map one initialize response to exactly one bucket. Pure — selftestable."""
    detail: dict = {}
    if error_type is not None or status == -1:
        detail["error_type"] = error_type or "unknown"
        return "dead_404_or_unreachable", detail
    if status in (401, 403):
        detail["auth_scheme_family"] = _auth_scheme_family(headers)
        return "auth_challenged_401_403", detail
    if status == 402:
        return "x402_challenged_402", detail
    if status == 404 or status == 410:
        return "dead_404_or_unreachable", detail
    if status == 429:
        detail["rate_limited"] = True
        return "other_error", detail
    if isinstance(reply, dict) and isinstance(reply.get("result"), dict) and "serverInfo" in (reply.get("result") or {}):
        return "initialize_ok", detail
    if 200 <= status < 300 or status in (400, 405, 406, 415):
        return "alive_not_mcp", detail
    if status >= 500:
        return "other_error", detail
    return "other_error", detail


def probe_host(item: tuple[str, str]) -> dict:
    host, url = item
    status, headers, reply, err = _post(url, _rpc_body("initialize", {
        "protocolVersion": PROTOCOL_VERSION,
        "capabilities": {},
        "clientInfo": {"name": "csoai-mcp-trust-board", "version": "0.1"},
    }))
    bucket, detail = classify(status, headers, reply, err)
    row = {"host": host, "bucket": bucket, **detail}
    if bucket != "initialize_ok":
        return row
    # initialize answered — exactly one tools/list, tools COUNTED, never named.
    sid = None
    for k, v in headers.items():
        if k.lower() == "mcp-session-id":
            sid = v
            break
    st2, _h2, rep2, err2 = _post(url, _rpc_body("tools/list"), session_id=sid)
    if err2 is None and isinstance(rep2, dict) and isinstance((rep2.get("result") or {}).get("tools"), list):
        row["bucket"] = "initialize_ok_tools_listed"
        row["tool_count"] = len(rep2["result"]["tools"])
    else:
        row["bucket"] = "initialize_ok_open"
    return row


# ---------------------------------------------------------------------------
# Guards
# ---------------------------------------------------------------------------

def counts_have_no_hosts(counts: dict) -> bool:
    blob = json.dumps(counts)
    if "://" in blob or "http" in blob.lower():
        return False
    for k, v in counts.items():
        if not re.match(r"^[a-z][a-z0-9_]*$", str(k)):
            return False
        if isinstance(v, str) or (v is not None and not isinstance(v, (int, float, bool))):
            return False
    return True


def derive_counts(rows: list[dict], enum: dict) -> dict:
    b = Counter(r["bucket"] for r in rows)
    auth = Counter(r.get("auth_scheme_family") for r in rows if r.get("auth_scheme_family"))
    tool_counts = [r["tool_count"] for r in rows if isinstance(r.get("tool_count"), int)]
    counts = {
        "total": len(rows),
        "unique_hosts_enumerated": enum["unique_hosts"],
        "registry_rows_seen": enum["registry_rows_seen"],
        "initialize_ok_open": b.get("initialize_ok_open", 0),
        "initialize_ok_tools_listed": b.get("initialize_ok_tools_listed", 0),
        "auth_challenged_401_403": b.get("auth_challenged_401_403", 0),
        "x402_challenged_402": b.get("x402_challenged_402", 0),
        "alive_not_mcp": b.get("alive_not_mcp", 0),
        "listed_no_reply": b.get("listed_no_reply", 0),
        "dead_404_or_unreachable": b.get("dead_404_or_unreachable", 0),
        "other_error": b.get("other_error", 0),
        "auth_scheme_bearer_or_oauth": auth.get("bearer_or_oauth", 0),
        "auth_scheme_other": auth.get("other_auth_scheme", 0),
        "auth_scheme_unspecified": auth.get("challenge_no_scheme_header", 0),
        "rate_limited": sum(1 for r in rows if r.get("rate_limited")),
        "tools_listed_total": sum(tool_counts),
        "tools_median_per_answering_server": (statistics.median(tool_counts) if tool_counts else 0),
        "servers_reporting_tools": len(tool_counts),
    }
    if not counts_have_no_hosts(counts):
        raise RuntimeError("counts leaked a host name or a typed string — refusing to publish")
    if counts["total"] > enum["unique_hosts"]:
        raise RuntimeError("probe count exceeded enumerated host count")
    return counts


# ---------------------------------------------------------------------------
# Round
# ---------------------------------------------------------------------------

def run(cap: int, out_dir: str, rows_out: str | None) -> int:
    t0 = time.time()
    enum = enumerate_hosts(cap)
    hosts = enum["hosts"]
    if not hosts:
        print("enumeration returned zero hosts — refusing to publish an empty round",
              file=sys.stderr)
        return 2

    rows: list[dict] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as ex:
        for row in ex.map(probe_host, hosts):
            rows.append(row)

    counts = derive_counts(rows, enum["enumeration"])
    as_of = now_iso()
    partial = not enum["enumeration"]["complete"] and len(hosts) < cap
    snapshot = {
        "kind": KIND,
        "population": "mcp-internet-facing",
        "as_of": as_of,
        "enumeration": enum["enumeration"],
        "partial": partial,
        "counts": counts,
        "headline": (
            f"{counts['initialize_ok_open'] + counts['initialize_ok_tools_listed']} of "
            f"{counts['total']} enumerated hosts answered a correct MCP initialize; "
            f"{counts['auth_challenged_401_403']} answered with an auth challenge (a term "
            f"sheet, not delivery); {counts['dead_404_or_unreachable']} were unreachable "
            f"or gone (never FAIL). Counts only by doctrine."
        ),
        "method": (
            f"One POST initialize (protocol {PROTOCOL_VERSION}) per host, identifiable UA "
            f"'{UA}', {TIMEOUT}s timeout, {WORKERS} workers; exactly one tools/list if and "
            f"only if initialize answered — tools counted, never called, never named. "
            "Zero authentication attempted, zero payment, zero signing, zero side effect."
        ),
        "doctrine": DOCTRINE,
        "not": NOT_FIELD,
        "third_party_context": (
            "A third-party study ('Exposed by Design') reportedly found ~21,000 "
            "internet-facing MCP servers, 91.8% without OAuth. That figure is cited as "
            "context only — it is NOT a CSOAI measurement and is not reproduced here."
        ),
        "paid_step": PAID_STEP,
    }
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    stamp = as_of.split("T")[0]
    text = json.dumps(snapshot, indent=2) + "\n"
    (out / f"{stamp}.json").write_text(text)
    (out / "latest.json").write_text(text)

    diff = write_diff(snapshot, out, stamp)
    card = write_unsigned_card(snapshot, out)
    if rows_out:
        Path(rows_out).parent.mkdir(parents=True, exist_ok=True)
        with open(rows_out, "w") as f:
            for r in rows:
                f.write(json.dumps(r) + "\n")

    print(json.dumps(counts, indent=1))
    print(f"enumeration: {json.dumps(enum['enumeration'])}")
    print(f"elapsed {time.time() - t0:.0f}s; wrote {out / stamp}.json, latest.json, {card}")
    if diff:
        print(f"diff: {diff}")
    return 0


def write_diff(snapshot: dict, out: Path, stamp: str) -> str | None:
    """Counts-level round-to-round diff (spec §5.2), written when a previous
    dated snapshot exists. A single observation is a snapshot; the delta is
    the board.

    Host-level movements (hosts added/dropped, bucket migrations) need the
    per-host rows, which are retained operator-side and NEVER committed — so
    those fields are UNCHECKABLE here, never invented. A previous snapshot
    that cannot be parsed makes the whole diff UNCHECKABLE with the reason;
    a partial previous round suppresses drop claims by construction (a
    partial probe cannot say a host left). Bucket deltas are arithmetic on
    two published count sets — derived, never typed.
    """
    prev_paths = sorted(p for p in out.glob("2*.json") if p.name != f"{stamp}.json")
    if not prev_paths:
        return None  # first round: no diff can exist yet
    prev_path = prev_paths[-1]
    try:
        prev = json.loads(prev_path.read_text())
        prev_counts = prev["counts"]
        assert isinstance(prev_counts, dict)
    except Exception as e:
        diff = {
            "kind": "csoai.mcp-trust-diff/0.1",
            "state": "UNCHECKABLE",
            "reason": f"previous snapshot unreadable ({type(e).__name__}) — never silently rebased",
            "as_of": snapshot["as_of"],
            "previous": prev_path.name,
        }
        (out / f"diff-{stamp}.json").write_text(json.dumps(diff, indent=2) + "\n")
        return f"diff-{stamp}.json"

    cur_counts = snapshot["counts"]
    keys = sorted(set(cur_counts) | set(prev_counts))
    deltas = {}
    for k in keys:
        a, b = cur_counts.get(k), prev_counts.get(k)
        if isinstance(a, (int, float)) and not isinstance(a, bool) and \
           isinstance(b, (int, float)) and not isinstance(b, bool):
            deltas[k] = round(a - b, 4)
    diff = {
        "kind": "csoai.mcp-trust-diff/0.1",
        "state": "MEASURED",
        "as_of": snapshot["as_of"],
        "previous": prev_path.name,
        "previous_as_of": prev.get("as_of"),
        "bucket_deltas": deltas,
        "hosts_added": "UNCHECKABLE — per-host rows are retained operator-side, never published",
        "hosts_dropped": "UNCHECKABLE — same; and a partial previous round could never say a host left",
        "bucket_migrations": "UNCHECKABLE — row-level by definition",
        "doctrine": DOCTRINE,
    }
    notes = []
    if prev.get("partial") or snapshot.get("partial"):
        notes.append("a PARTIAL round is in the pair: read deltas as slice-vs-slice, never as population change")
    prev_cap = (prev.get("enumeration") or {}).get("cap")
    cur_cap = (snapshot.get("enumeration") or {}).get("cap")
    if prev_cap is not None and cur_cap is not None and prev_cap != cur_cap:
        notes.append(f"cap changed ({prev_cap} -> {cur_cap}): deltas compare different slices of the population, never the whole of it")
    if notes:
        diff["note"] = "; ".join(notes)
    name = f"diff-{stamp}.json"
    (out / name).write_text(json.dumps(diff, indent=2) + "\n")
    return name


def write_unsigned_card(snapshot: dict, out: Path) -> Path:
    """One unsigned card-v0-family wrapper per round — the publisher-queue form.

    The TUI never signs. signature stays null; the GHA publisher is the only
    signer. Body carries counts only (already guarded host-free).
    """
    body = {
        "kind": "csoai.mcp-trust-snapshot-card/0.1",
        "issuer": "CSOAI Ltd",
        "surface": "mcp-trust-board",
        "as_of": snapshot["as_of"],
        "population": snapshot["population"],
        "status": "UNMEASURED",
        "unmeasured": ["signed-pending-publisher", "non-enumerable-population"],
        "counts": snapshot["counts"],
        "doctrine": DOCTRINE,
        "not_a_grade": True,
        "not_certification": True,
        "writes_board": False,
        "verify": f"{ORIGIN}/gspc-verify",
        "source_artifact": f"{ORIGIN}/interop/mcp-trust/{snapshot['as_of'].split('T')[0]}.json",
    }
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    digest = hashlib.sha256(canonical).hexdigest()
    card = {
        "alg": "Ed25519",
        "body": body,
        "id": digest,
        "preimage_rule": "sha256(canonical body)",
        "signature": None,
        "did_intended": "did:web:csoai.org#card-attestation-1",
        "note": "UNSIGNED card-v0-family. SIGNED needs the GHA publisher. Never MEASURED.",
    }
    udir = out / "unsigned"
    udir.mkdir(parents=True, exist_ok=True)
    path = udir / f"unsigned-mcp-trust-{digest[:12]}.json"
    path.write_text(json.dumps(card, indent=2) + "\n")
    return path


# ---------------------------------------------------------------------------
# Selftest (no network)
# ---------------------------------------------------------------------------

def selftest() -> int:
    cases = [
        # (status, headers, reply, err) -> bucket
        ((-1, {}, None, "TimeoutError"), "dead_404_or_unreachable"),
        ((404, {}, None, None), "dead_404_or_unreachable"),
        ((401, {"WWW-Authenticate": "Bearer realm=\"mcp\""}, None, None), "auth_challenged_401_403"),
        ((403, {"WWW-Authenticate": "Basic"}, None, None), "auth_challenged_401_403"),
        ((402, {}, None, None), "x402_challenged_402"),
        ((200, {}, {"html": "..."}, None), "alive_not_mcp"),
        ((400, {}, None, None), "alive_not_mcp"),
        ((500, {}, None, None), "other_error"),
        ((429, {}, None, None), "other_error"),
        ((200, {}, {"jsonrpc": "2.0", "id": 1, "result": {"protocolVersion": PROTOCOL_VERSION, "serverInfo": {"name": "x"}, "capabilities": {}}}, None), "initialize_ok"),
    ]
    for got_args, want in cases:
        bucket, _ = classify(*got_args)
        assert bucket == want, f"classify{got_args} -> {bucket}, want {want}"

    # SSE parsing
    sse = "event: message\ndata: {\"jsonrpc\":\"2.0\",\"id\":1,\"result\":{\"serverInfo\":{}}}\n\n"
    assert _parse_jsonrpc(sse)["result"]["serverInfo"] == {}
    assert _parse_jsonrpc("<html>nope</html>") is None

    # counts guard: hosts must be impossible to leak
    rows = [
        {"host": "a.example", "bucket": "initialize_ok_tools_listed", "tool_count": 7},
        {"host": "b.example", "bucket": "initialize_ok_tools_listed", "tool_count": 3},
        {"host": "c.example", "bucket": "auth_challenged_401_403", "auth_scheme_family": "bearer_or_oauth"},
        {"host": "d.example", "bucket": "dead_404_or_unreachable", "error_type": "URLError"},
    ]
    enum = {"unique_hosts": 4, "registry_rows_seen": 10}
    counts = derive_counts(rows, enum)
    assert counts["total"] == 4
    assert counts["initialize_ok_tools_listed"] == 2
    assert counts["tools_listed_total"] == 10
    assert counts["tools_median_per_answering_server"] == 5
    assert counts["auth_scheme_bearer_or_oauth"] == 1
    assert "a.example" not in json.dumps(counts)

    bad = dict(counts)
    bad["leak"] = "https://a.example"
    assert not counts_have_no_hosts(bad)

    print("selftest OK — classify(10), SSE parse, counts derivation, host-leak guard")
    return 0


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--cap", type=int, default=500,
                   help="max unique hosts per round (census #1 = 500)")
    p.add_argument("--out-dir", default="public/interop/mcp-trust")
    p.add_argument("--rows-out", default=None,
                   help="operator-side per-host jsonl (NEVER committed — counts-only is doctrine)")
    p.add_argument("--selftest", action="store_true")
    a = p.parse_args()
    if a.selftest:
        return selftest()
    if a.cap < 1 or a.cap > 5000:
        print("cap out of bounds (1..5000)", file=sys.stderr)
        return 2
    try:
        return run(a.cap, a.out_dir, a.rows_out)
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
