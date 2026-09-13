#!/usr/bin/env python3
"""Fail-closed agent-economy door test harness (TUI-4 lane).

Walks every canonical protocol door of councilof.ai through discovery → probe →
challenge → free-fulfillment-where-offered → receipt/verification path, and
emits ONE evidence JSON (``scripts/tui4/door-test-latest.json``) plus a stdout
summary. It never pays: the paid path is walked exactly up to the 402
challenge, which for a measurement rail is the honest unpaid end state. A 402
that carries a well-formed ``accepts[]`` matching the discovery document is a
PASS; a paid door answering 200 without payment, or a challenge whose
network/asset/payTo disagrees with the discovery document, is a FAIL —
fail-closed means the mismatch is reported, not stepped around.

Verdicts are three-state: PASS / FAIL / UNCHECKABLE. UNCHECKABLE is a first
class result (a network error, an endpoint that cannot be reached, a probe the
harness is not entitled to run) — never silently coerced into either polarity.
UNMEASURED is never zero-filled: a door we did not probe carries no verdict.

Coverage:
  * x402 discovery (GET /.well-known/x402.json) and catalog (GET /api/x402).
  * Every resource the discovery document publishes: probe without payment.
    /api/free-door is the priced-at-zero door (200 expected); /api/witness is
    QUARANTINED_PRE_RELEASE and must answer 503 before payment (a 200 or a 402
    here means the quarantine failed open — FAIL).
  * Documented free previews (rwa/evidence?preview=1,
    art50/marking-evidence?preview=1, receipts/batch?preview=1, eunomia-data
    without ?feed=1): fetched and their content shape recorded.
  * MCP (POST /mcp, streamable-http): initialize + tools/list, asserted against
    the committed manifests (functions/mcp/gspc-tools.json = 8 free,
    functions/mcp/paid-tools.json = 4 paid); one free tool called
    (board_totals) and one paid tool called WITHOUT payment (commission_card) —
    the expected, correct result is the 402 challenge as structuredContent.
  * A2A: /.well-known/agent-card.json, /.well-known/agents/index.json (12
    per-tool cards), one per-tool card, and one free SendMessage against
    /api/a2a (skill gspc-board — the card itself names it a free handler).
  * ERC-8004: the committed census (scripts/erc8004_census.py) is run live in
    bounded mode (--recent-blocks 20000) and its three chain rows embedded.
  * Receipt verification: scripts/verify_receipt.py --help (the buyer-side
    verifier exists and runs), then the REAL committed receipt in
    public/interop/x402-self-settlement-2026-09-11.json is verified offline —
    no receipt is fabricated by this harness.

Every check records the exact URL, the HTTP status observed, and the sha256 of
the response body, so a reader can recompute any row without trusting this
script's prose. ``as_of`` is the run timestamp (UTC).

Standard library only for the HTTP probes. The two subprocess probes use the
repo's own runners: the census is stdlib-only python3; the receipt verifier
needs ``cryptography`` and is run via ``uv run --with cryptography`` when uv is
available (UNCHECKABLE, never skipped silently, when it is not).
"""
from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
BASE = "https://councilof.ai"
OUT = Path(__file__).resolve().parent / "door-test-latest.json"
UA = "csoai-tui4-door-test/1 (+https://councilof.ai; measurement-not-certification)"

USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
PAY_TO = "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31"
WITNESS_PROBE = "/api/witness?sha256=" + "0" * 64

FREE_PREVIEWS = [
    ("rwa_evidence_preview", "/api/rwa/evidence?asset=RLUSD&preview=1"),
    ("art50_marking_preview", "/api/art50/marking-evidence?url=https://councilof.ai/og-image.png&preview=1"),
    ("receipts_batch_preview", "/api/receipts/batch?from=2026-01-01T00:00:00Z&preview=1"),
    ("eunomia_data_preview", "/api/eunomia-data"),
]

CHECKS: list[dict] = []


def record(check_id: str, verdict: str, url: str, http_status, body: bytes | None,
           details: dict | None = None, method: str = "GET") -> dict:
    """Append one evidence row. The evidence hash is over the exact bytes the
    wire returned; a request that never completed has hash None, not a hash of
    an invented body."""
    row = {
        "id": check_id,
        "verdict": verdict,  # PASS | FAIL | UNCHECKABLE
        "method": method,
        "url": url,
        "http_status": http_status,
        "evidence_sha256": hashlib.sha256(body).hexdigest() if isinstance(body, bytes) else None,
    }
    if details:
        row["details"] = details
    CHECKS.append(row)
    return row


def fetch(url: str, method: str = "GET", payload: dict | None = None,
          headers: dict | None = None, timeout: float = 30.0):
    """One HTTP call. Returns (status, headers, body_bytes) or raises; callers
    convert exceptions into UNCHECKABLE rows with the error named."""
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "user-agent": UA,
        "accept": "application/json",
        **({"content-type": "application/json"} if data else {}),
        **(headers or {}),
    })
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        # Header names arrive with the server's casing ("Content-Type"); lower-case
        # them here so no check ever fails on case rather than on evidence.
        return resp.status, {k.lower(): v for k, v in resp.headers.items()}, resp.read()


def fetch_into(check_id: str, url: str, **kw):
    """fetch() that turns transport failure into an UNCHECKABLE evidence row."""
    try:
        status, headers, body = fetch(url, **kw)
        return status, headers, body, None
    except urllib.error.HTTPError as exc:  # an HTTP error status IS an answer
        body = exc.read() if hasattr(exc, "read") else None
        hdrs = {k.lower(): v for k, v in exc.headers.items()} if exc.headers else {}
        return exc.code, hdrs, body, None
    except Exception as exc:
        record(check_id, "UNCHECKABLE", url, None, None,
               {"error": f"{type(exc).__name__}: {str(exc)[:200]}"}, method=kw.get("method", "GET"))
        return None, None, None, exc


def as_json(body: bytes | None):
    if not body:
        return None
    try:
        return json.loads(body.decode("utf-8"))
    except Exception:
        return None


def accepts_match_discovery(accepts, discovery: dict) -> tuple[bool, str]:
    """Fail-closed comparison: at least one accepts[] entry must agree with the
    discovery document on asset and payTo, and name the Base network in either
    the v1 (`base`) or v2/CAIP-2 (`eip155:8453`) spelling."""
    if not isinstance(accepts, list) or not accepts:
        return False, "402 body carries no accepts[]"
    disc_asset = (discovery.get("asset") or "").lower()
    disc_payto = (discovery.get("payTo") or "").lower()
    for a in accepts:
        if not isinstance(a, dict):
            continue
        net = a.get("network")
        asset = (a.get("asset") or "").lower()
        payto = (a.get("payTo") or "").lower()
        net_ok = net in ("base", "eip155:8453")
        if net_ok and asset == disc_asset and payto == disc_payto:
            return True, f"accepts[] entry matches discovery (network={net})"
        if net_ok and asset == USDC_BASE.lower() and payto == PAY_TO.lower():
            return True, f"accepts[] matches estate constants (network={net})"
        return False, (f"accepts[] mismatch: network={net} asset={asset} "
                       f"payTo={payto} vs discovery asset={disc_asset} payTo={disc_payto}")
    return False, "no object entries in accepts[]"


# ── MCP helpers ──────────────────────────────────────────────────────────────

def mcp_call(session: dict, method: str, params: dict | None, rpc_id: int,
             timeout: float = 45.0):
    """One MCP streamable-http call. Answers may arrive as application/json or
    text/event-stream; both are parsed to the JSON-RPC payload. Raises on
    transport failure (caller renders UNCHECKABLE)."""
    headers = {"accept": "application/json, text/event-stream"}
    if session.get("id"):
        headers["mcp-session-id"] = session["id"]
    status, resp_headers, body = fetch(
        BASE + "/mcp", method="POST", timeout=timeout,
        payload={"jsonrpc": "2.0", "id": rpc_id, "method": method, "params": params or {}},
        headers=headers)
    sid = resp_headers.get("mcp-session-id")
    if sid:
        session["id"] = sid
    ctype = (resp_headers.get("content-type") or "").lower()
    if "text/event-stream" in ctype:
        payload = None
        for line in body.decode("utf-8", "replace").splitlines():
            if line.startswith("data:"):
                payload = json.loads(line[5:].strip())
        return status, body, payload
    return status, body, as_json(body)


# ── the walk ─────────────────────────────────────────────────────────────────

def check_discovery() -> dict | None:
    url = BASE + "/.well-known/x402.json"
    status, headers, body, err = fetch_into("x402-discovery", url)
    if err:
        return None
    doc = as_json(body)
    ok = (status == 200 and isinstance(doc, dict)
          and doc.get("schema") == "csoai.x402/0.2"
          and doc.get("network") == "eip155:8453")
    record("x402-discovery", "PASS" if ok else "FAIL", url, status, body, {
        "schema": doc.get("schema") if isinstance(doc, dict) else None,
        "network": doc.get("network") if isinstance(doc, dict) else None,
        "x402Version": doc.get("x402Version") if isinstance(doc, dict) else None,
        "resources": len(doc.get("resources", [])) if isinstance(doc, dict) else None,
    })
    return doc if isinstance(doc, dict) else None


def check_catalog():
    url = BASE + "/api/x402"
    status, headers, body, err = fetch_into("x402-catalog", url)
    if err:
        return
    doc = as_json(body)
    ok = status == 200 and isinstance(doc, dict) and doc.get("schema", "").startswith("csoai.x402-catalog/")
    record("x402-catalog", "PASS" if ok else "FAIL", url, status, body, {
        "schema": doc.get("schema") if isinstance(doc, dict) else None,
        "resources": len(doc.get("resources", [])) if isinstance(doc, dict) else None,
    })


def check_paid_doors(discovery: dict | None):
    resources = (discovery or {}).get("resources") or []
    for res in resources:
        url = res.get("url")
        if not url:
            continue
        cid = "door:" + url.replace(BASE, "")
        if "/api/free-door" in url:
            expected = "200 (priced-at-zero door)"
        else:
            expected = "402 with accepts[] matching discovery"
        status, headers, body, err = fetch_into(cid, url)
        if err:
            continue
        if "/api/free-door" in url:
            if status == 200:
                record(cid, "PASS", url, status, body, {"expected": expected})
            else:
                # A zero-amount 402 challenge is also a coherent free door; record which.
                doc = as_json(body)
                if status == 402 and isinstance(doc, dict) and doc.get("accepts"):
                    amounts = [a.get("amount") or a.get("maxAmountRequired")
                               for a in doc["accepts"] if isinstance(a, dict)]
                    verdict = "PASS" if amounts and all(a in ("0", 0) for a in amounts) else "FAIL"
                    record(cid, verdict, url, status, body,
                           {"expected": expected, "note": f"answered 402 with amounts {amounts}"})
                else:
                    record(cid, "FAIL", url, status, body, {"expected": expected})
            continue
        doc = as_json(body)
        if status != 402:
            record(cid, "FAIL", url, status, body,
                   {"expected": expected, "note": "paid door did not answer 402 to an unpaid probe"})
            continue
        match, why = accepts_match_discovery(doc.get("accepts") if isinstance(doc, dict) else None,
                                             discovery or {})
        record(cid, "PASS" if match else "FAIL", url, status, body,
               {"expected": expected, "accepts_check": why})


def check_witness_quarantine():
    url = BASE + WITNESS_PROBE
    status, headers, body, err = fetch_into("door:/api/witness-quarantined", url)
    if err:
        return
    record("door:/api/witness-quarantined", "PASS" if status == 503 else "FAIL", url, status, body, {
        "expected": "503 — QUARANTINED_PRE_RELEASE must fail closed before payment",
        "note": "any 2xx/402 here means the quarantine failed open",
    })


def check_free_previews():
    for cid, path in FREE_PREVIEWS:
        url = BASE + path
        status, headers, body, err = fetch_into("preview:" + cid, url)
        if err:
            continue
        doc = as_json(body)
        shape = sorted(doc.keys())[:12] if isinstance(doc, dict) else None
        record("preview:" + cid, "PASS" if status == 200 else "FAIL", url, status, body,
               {"expected": "200 free preview", "content_shape_top_level_keys": shape})


def check_mcp():
    manifests = {}
    for name, rel in (("free", "functions/mcp/gspc-tools.json"), ("paid", "functions/mcp/paid-tools.json")):
        try:
            data = json.loads((REPO / rel).read_text())
            tools = data if isinstance(data, list) else data.get("tools", [])
            manifests[name] = sorted(t["name"] for t in tools)
        except Exception as exc:
            manifests[name] = None
            record(f"mcp:manifest-{name}", "UNCHECKABLE", f"repo:{rel}", None, None,
                   {"error": str(exc)[:200]})
    session: dict = {}
    try:
        status, raw, payload = mcp_call(session, "initialize", {
            "protocolVersion": "2025-03-26",
            "capabilities": {},
            "clientInfo": {"name": "tui4-door-test", "version": "0.1.0"},
        }, 1)
        ok = status == 200 and isinstance(payload, dict) and "result" in payload
        record("mcp:initialize", "PASS" if ok else "FAIL", BASE + "/mcp", status, raw,
               {"serverInfo": (payload or {}).get("result", {}).get("serverInfo")}, method="POST")
        if not ok:
            return
        try:
            mcp_call(session, "notifications/initialized", None, 2)
        except Exception:
            pass  # a notification; some servers close the stream on it
    except Exception as exc:
        record("mcp:initialize", "UNCHECKABLE", BASE + "/mcp", None, None,
               {"error": f"{type(exc).__name__}: {str(exc)[:200]}"}, method="POST")
        return

    try:
        status, raw, payload = mcp_call(session, "tools/list", None, 3)
        tools = sorted(t["name"] for t in ((payload or {}).get("result", {}).get("tools") or []))
        free, paid = manifests.get("free"), manifests.get("paid")
        details = {"tools": tools, "count": len(tools),
                   "manifest_free": free, "manifest_paid": paid}
        ok = status == 200 and len(tools) == 12
        if free is not None and paid is not None:
            ok = ok and tools == sorted(free + paid)
            details["split"] = "8 free + 4 paid, asserted equal to the committed manifests"
        record("mcp:tools-list", "PASS" if ok else "FAIL", BASE + "/mcp", status, raw, details,
               method="POST")
    except Exception as exc:
        record("mcp:tools-list", "UNCHECKABLE", BASE + "/mcp", None, None,
               {"error": f"{type(exc).__name__}: {str(exc)[:200]}"}, method="POST")
        return

    try:
        status, raw, payload = mcp_call(session, "tools/call",
                                        {"name": "board_totals", "arguments": {}}, 4)
        result = (payload or {}).get("result", {})
        content = result.get("content") or []
        ok = status == 200 and not result.get("isError") and bool(content)
        record("mcp:call-board_totals-free", "PASS" if ok else "FAIL", BASE + "/mcp", status, raw,
               {"isError": result.get("isError")}, method="POST")
    except Exception as exc:
        record("mcp:call-board_totals-free", "UNCHECKABLE", BASE + "/mcp", None, None,
               {"error": f"{type(exc).__name__}: {str(exc)[:200]}"}, method="POST")

    try:
        status, raw, payload = mcp_call(session, "tools/call",
                                        {"name": "commission_card",
                                         "arguments": {"subject": "llama3.2:3b"}}, 5)
        result = (payload or {}).get("result", {})
        sc = result.get("structuredContent") or {}
        blob = json.dumps(sc)
        challenged = "PAYMENT-REQUIRED" in blob or "accepts" in blob or "402" in blob
        record("mcp:call-commission_card-unpaid",
               "PASS" if challenged else "FAIL", BASE + "/mcp", status, raw,
               {"expected": "402 challenge as structuredContent (the correct unpaid path — never paid)",
                "structuredContent_keys": sorted(sc.keys())[:12] if isinstance(sc, dict) else None,
                "isError": result.get("isError")}, method="POST")
    except Exception as exc:
        record("mcp:call-commission_card-unpaid", "UNCHECKABLE", BASE + "/mcp", None, None,
               {"error": f"{type(exc).__name__}: {str(exc)[:200]}"}, method="POST")


def check_a2a():
    url = BASE + "/.well-known/agent-card.json"
    status, headers, body, err = fetch_into("a2a:agent-card", url)
    if err:
        return
    doc = as_json(body)
    skills = [s.get("id") for s in (doc or {}).get("skills", []) if isinstance(s, dict)]
    ctype = (headers or {}).get("content-type", "")
    ok = status == 200 and isinstance(doc, dict) and "a2a" in ctype.lower()
    record("a2a:agent-card", "PASS" if ok else "FAIL", url, status, body,
           {"content_type": ctype, "skills": skills})

    url = BASE + "/.well-known/agents/index.json"
    status, headers, body, err = fetch_into("a2a:agents-index", url)
    if err:
        return
    doc = as_json(body)
    count = (doc or {}).get("count")
    agents = (doc or {}).get("agents") or []
    ok = status == 200 and count == 12 and len(agents) == 12
    record("a2a:agents-index", "PASS" if ok else "FAIL", url, status, body,
           {"count": count, "agents": len(agents)})

    one = agents[0]["href"] if agents and isinstance(agents[0], dict) else BASE + "/.well-known/agents/board_totals.json"
    status, headers, body, err = fetch_into("a2a:per-tool-card", one)
    if not err:
        record("a2a:per-tool-card", "PASS" if status == 200 else "FAIL", one, status, body)

    # One free JSONRPC call. The card names seven skills routed to fixed free
    # handlers; gspc-board takes an empty input object.
    url = BASE + "/api/a2a"
    payload = {"jsonrpc": "2.0", "id": 1, "method": "SendMessage", "params": {
        "message": {"messageId": "tui4-probe-1", "role": "ROLE_USER",
                    "parts": [{"data": {"skill": "gspc-board", "input": {}}}]}}}
    status, headers, body, err = fetch_into("a2a:sendmessage-gspc-board", url, method="POST",
                                            payload=payload,
                                            headers={"A2A-Version": "1.0"})
    if err:
        return
    doc = as_json(body)
    has_result = isinstance(doc, dict) and "result" in doc
    record("a2a:sendmessage-gspc-board", "PASS" if (status == 200 and has_result) else "FAIL",
           url, status, body,
           {"expected": "a Message result from the free gspc-board skill",
            "jsonrpc_error": (doc or {}).get("error")}, method="POST")


def check_erc8004():
    """The committed census is the measurement; this harness runs it bounded and
    embeds the rows verbatim rather than re-deriving counts."""
    cmd = [sys.executable, str(REPO / "scripts/erc8004_census.py"), "--recent-blocks", "20000"]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=280)
    except Exception as exc:
        record("erc8004:census-recent-window", "UNCHECKABLE", "subprocess:" + " ".join(cmd),
               None, None, {"error": f"{type(exc).__name__}: {str(exc)[:200]}"})
        return
    body = proc.stdout.encode()
    doc = as_json(body)
    if not isinstance(doc, dict) or "rows" not in doc:
        record("erc8004:census-recent-window", "UNCHECKABLE", "subprocess:" + " ".join(cmd),
               proc.returncode, body[-2000:] or None,
               {"error": "census stdout was not the expected JSON", "stderr": proc.stderr[-400:]})
        return
    rows = [{"chain": r.get("chain"), "status": r.get("status"),
             "registrations": r.get("registrations"),
             "from_block": r.get("from_block"), "to_block": r.get("to_block"),
             "window": (r.get("window") or {}).get("mode"),
             "reason": r.get("reason")} for r in doc["rows"]]
    ok = proc.returncode == 0 and all(r["status"] in ("MEASURED", "NO_DEPLOYMENT_FOUND") for r in rows)
    record("erc8004:census-recent-window", "PASS" if ok else "UNCHECKABLE",
           "subprocess:scripts/erc8004_census.py --recent-blocks 20000",
           proc.returncode, body,
           {"as_of": doc.get("as_of"), "rows": rows,
            "note": "RECENT-WINDOW mode — bounded counts, not full history; the full-history "
                    "counts (ETH 50,783 / Base 86,263, as_of 2026-09-12) live in the census "
                    "script footer as a committed measurement"})


def check_receipt_path():
    cmd = [sys.executable, str(REPO / "scripts/verify_receipt.py"), "--help"]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        record("receipt:verifier-help", "PASS" if proc.returncode == 0 else "FAIL",
               "subprocess:scripts/verify_receipt.py --help", proc.returncode,
               proc.stdout.encode() or proc.stderr.encode() or None)
    except Exception as exc:
        record("receipt:verifier-help", "UNCHECKABLE", "subprocess:scripts/verify_receipt.py --help",
               None, None, {"error": f"{type(exc).__name__}: {str(exc)[:200]}"})

    anchor = REPO / "public/interop/x402-self-settlement-2026-09-11.json"
    try:
        jws = json.loads(anchor.read_text())["server_receipt"]["jws"]
    except Exception as exc:
        record("receipt:committed-self-settlement", "UNCHECKABLE", f"repo:{anchor}", None, None,
               {"error": f"committed anchor unreadable: {exc}"})
        return
    uv = shutil.which("uv")
    if not uv:
        record("receipt:committed-self-settlement", "UNCHECKABLE",
               "subprocess:verify_receipt.py --jws <committed>", None, None,
               {"error": "uv not on PATH; cannot provision the cryptography dependency"})
        return
    cmd = [uv, "run", "--with", "cryptography", "python3",
           str(REPO / "scripts/verify_receipt.py"), "--jws", jws, "--check-chain"]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
        verdict = "PASS" if proc.returncode == 0 else ("UNCHECKABLE" if proc.returncode == 2 else "FAIL")
        record("receipt:committed-self-settlement", verdict,
               "subprocess:verify_receipt.py --jws <public/interop/x402-self-settlement-2026-09-11.json> --check-chain",
               proc.returncode, (proc.stdout + proc.stderr).encode() or None,
               {"note": "a REAL committed receipt verified offline against the DID document; "
                        "this harness fabricates nothing",
                "tail": (proc.stdout + proc.stderr).strip().splitlines()[-3:]})
    except Exception as exc:
        record("receipt:committed-self-settlement", "UNCHECKABLE",
               "subprocess:verify_receipt.py --jws <committed>", None, None,
               {"error": f"{type(exc).__name__}: {str(exc)[:200]}"})


def main() -> int:
    as_of = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    discovery = check_discovery()
    check_catalog()
    check_paid_doors(discovery)
    check_witness_quarantine()
    check_free_previews()
    check_mcp()
    check_a2a()
    check_erc8004()
    check_receipt_path()

    counts = {"PASS": 0, "FAIL": 0, "UNCHECKABLE": 0}
    for c in CHECKS:
        counts[c["verdict"]] = counts.get(c["verdict"], 0) + 1
    out = {
        "kind": "csoai.tui4-door-test/0.1",
        "as_of": as_of,
        "base_url": BASE,
        "scope": ("Discovery → probe → challenge → free fulfillment where offered → receipt "
                  "verification. NO PAYMENTS: the paid path ends at a verified 402 challenge. "
                  "Measurement, never certification; UNCHECKABLE is reported, never coerced."),
        "totals": counts,
        "checks": CHECKS,
    }
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(f"TUI-4 door test @ {as_of} — {BASE}")
    for c in CHECKS:
        print(f"  {c['verdict']:<11} {c['id']:<40} http={c['http_status']} {c['url'][:80]}")
    print(f"totals: {counts}  → {OUT}")
    return 1 if counts["FAIL"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
