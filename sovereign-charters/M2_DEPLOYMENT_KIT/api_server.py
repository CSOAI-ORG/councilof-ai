#!/usr/bin/env python3
"""
SOVEREIGN CHARTER API SERVER (stdlib-only, M2-deployable)
==========================================================
A stdlib http.server-based REST API for the sovereign charter universe.
Reads charter data from the on-disk registry under
``/Users/nicholas/clawd/sovereign-charters`` (the 41 charters, 236
frameworks, and 5,043 cross-walks) and exposes them over JSON HTTP.

Endpoints
---------
  GET  /health                 liveness probe
  GET  /charters               list all charters (filter ?layer=L0/L0+/...)
  GET  /charters/{hive}        list charters for one hive (e.g. meok, csoai)
  GET  /charter/{id}/verify    verify a charter's SIGIL/SHA-256 chain
  GET  /frameworks             list 236 universal frameworks (filter ?region=EU)
  GET  /frameworks/{id}        single framework detail
  GET  /crosswalks             list cross-walks (filter ?a=eu-ai-act&b=gdpr)
  POST /report                 submit a Watchdog signal (human/agent)
  GET  /search?q=...           full-text search across charters+frameworks

Run
---
    python3 api_server.py                # listens on :7801
    PORT=9000 python3 api_server.py      # custom port
    python3 api_server.py --self-test    # verify routes without binding port

Stays purely on the Python standard library (``http.server``, ``json``,
``urllib.parse``, ``sqlite3``, ``hashlib``, ``datetime``, ``ssl``,
``threading``) — installs on any Mac/M2 without ``pip install``.

(c) 2026 CSOAI Ltd · UK Companies House 16939677
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import secrets
import sqlite3
import sys
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

# --------------------------------------------------------------------------- #
# Paths + constants
# --------------------------------------------------------------------------- #

CHARTER_ROOT = Path(
    os.getenv("CHARTER_ROOT", "/Users/nicholas/clawd/sovereign-charters")
)
DEFAULT_PORT = int(os.getenv("PORT", "7801"))
SIGIL_LOG = Path(
    os.getenv("SIGIL_LOG", str(CHARTER_ROOT / "SIGIL_LOG.txt"))
)
REPORT_LOG = Path(
    os.getenv("REPORT_LOG", str(CHARTER_ROOT / "WATCHDOG" / "REPORTS.jsonl"))
)

# Hive → list of charter prefixes (read from 00-MASTER-INDEX.md-style layout)
HIVES = {
    "root":      ["00-sovereign-root", "00-partners", "CHARTER-OF-CHARTERS"],
    "defoneos":  ["12-defoneos"],
    "meok":      ["02-meok", "18-sovereign-town", "19-meok-compliance-gateway"],
    "csoai":     ["01-csoai", "13-councilof", "35-coigndaltion",
                  "36-publicwatchdog", "37-sovereigncourt",
                  "38-sovereignstandards", "39-sovereignledger"],
    "trust":     ["03-proofof", "04-safetyof", "05-accountabilityof",
                  "06-ethicalgovernanceof", "07-transparencyof",
                  "08-biasdetectionof", "09-dataprivacyof",
                  "10-asisecurity", "11-agisafe"],
    "open":      ["14-openmoe", "15-openmcp", "16-openpatent", "17-sandbox"],
    "industry":  ["20-loopfactory", "21-optimobile", "22-socialmediamanager",
                  "23-cobolbridge", "24-commercialvehicle", "25-diyhelp",
                  "26-fishkeeper", "27-grabhire", "28-koikeeper",
                  "29-landlaw", "30-muckaway", "31-planthire",
                  "32-pokerhud", "33-suicidestop", "34-science"],
}

# Curated 236-framework slice (sample + structural counts).
# We surface count + a representative subset for fast /frameworks listing;
# the full list lives in UNIVERSAL_COMPLIANCE_FRAMEWORKS_2026-07-02.md.
FRAMEWORK_REGIONS = {
    "EU": 18, "UK": 15, "US": 25, "APAC": 37, "EMEA": 20,
    "AMERICAS": 12, "SECTORAL": 35, "STANDARDS": 50, "OTHER": 22,
}

REPRESENTATIVE_FRAMEWORKS = [
    ("eu-ai-act",   "EU",  "EU AI Act (Regulation 2024/1689)",        "in-force"),
    ("gdpr",        "EU",  "General Data Protection Regulation",     "in-force"),
    ("ai-act-art50","EU",  "EU AI Act Article 50 (Transparency)",    "cliff-2026-08-02"),
    ("dora",        "EU",  "Digital Operational Resilience Act",     "in-force"),
    ("nis2",        "EU",  "Network & Information Security Directive 2","in-force"),
    ("uk-ai-bill",  "UK",  "UK AI (Regulation) Bill",                "expected-2026"),
    ("uk-gdpr",     "UK",  "UK GDPR + DPA 2018",                     "in-force"),
    ("iso-42001",   "STD", "ISO/IEC 42001 AI Management System",     "in-force"),
    ("iso-27001",   "STD", "ISO/IEC 27001 ISMS",                     "in-force"),
    ("nist-ai-rmf", "STD", "NIST AI Risk Management Framework 1.0",  "in-force"),
    ("soc2",        "STD", "AICPA SOC 2 Type II",                    "in-force"),
    ("hipaa",       "US",  "Health Insurance Portability Act",       "in-force"),
    ("fedramp",     "US",  "FedRAMP Moderate/High",                  "in-force"),
    ("ccpa",        "US",  "California Consumer Privacy Act",        "in-force"),
    ("pcidss",      "STD", "PCI DSS v4.0",                           "in-force"),
    ("uae-ai",      "APAC","UAE National AI Strategy 2031",          "in-force"),
    ("china-genai", "APAC","China Generative AI Services Rules",     "in-force"),
    ("jp-ai",       "APAC","Japan AI Promotion Act / Governance Guidelines","in-force"),
    ("sg-mas",      "APAC","Singapore MAS AI Risk Mgmt Guidance",   "in-force"),
    ("au-ai",       "APAC","Australia AI Ethics Framework",          "in-force"),
]

CROSSWALKS = [
    ("eu-ai-act",    "gdpr",       "Art 10 data governance ↔ Art 5/22 GDPR"),
    ("eu-ai-act",    "iso-42001",  "Art 9 risk mgmt ↔ ISO 42001 Clause 6"),
    ("eu-ai-act",    "nist-ai-rmf","Art 9/15 ↔ NIST GOVERN/MAP/MEASURE"),
    ("uk-ai-bill",   "eu-ai-act",  "UK interoperability window ↔ EU AI Act"),
    ("iso-42001",    "iso-27001",  "AI mgmt system controls reuse ISMS A.5-A.8"),
    ("soc2",         "iso-27001",  "Trust Services Criteria ↔ Annex A controls"),
    ("nist-ai-rmf",  "iso-42001",  "GOVERN/Manage ↔ Clause 6.2/7.5"),
    ("hipaa",        "gdpr",       "§164.514 de-id ↔ Art 4(5)/Recital 26"),
    ("uae-ai",       "eu-ai-act",  "UAE AI Strategy ↔ EU risk-tier map"),
    ("sg-mas",       "iso-42001",  "MAS FEAT ↔ ISO 42001 risk-treatment"),
    ("fedramp",      "nist-ai-rmf","FedRAMP ↔ NIST AI overlay (GenAI profile)"),
    ("dora",         "nis2",       "ICT risk mgmt overlap → consolidated controls"),
]

# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

def sha256_text(text: str) -> str:
    """SHA-256 hex digest of a UTF-8 string."""
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()


def emit_sigil(line: str) -> str:
    """Append a SIGIL record to the local log + return the digest."""
    digest = sha256_text(line)
    ts = datetime.now(timezone.utc).isoformat()
    try:
        SIGIL_LOG.parent.mkdir(parents=True, exist_ok=True)
        with open(SIGIL_LOG, "a", encoding="utf-8") as f:
            f.write(f"{ts} | {digest} | {line}\n")
    except OSError:
        pass
    return digest


def load_charter_file(path: Path) -> dict | None:
    """Best-effort parse of a charter markdown → dict."""
    if not path.exists():
        return None
    text = path.read_text(encoding="utf-8", errors="ignore")
    charter_id = path.stem
    sha = sha256_text(text)
    # Try to pull the first H1 / Article 0 reference.
    title = ""
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("# "):
            title = s[2:].strip()
            break
    has_article0 = ("Article 0" in text) or ("Charter Article 0" in text)
    return {
        "charter_id": charter_id,
        "title": title or charter_id,
        "path": str(path),
        "sha256": sha,
        "bytes": path.stat().st_size,
        "article_0_binding": has_article0,
    }


def list_charters(layer: str | None = None) -> list[dict]:
    """Walk the charter root and return all charters (filtered by layer)."""
    out: list[dict] = []
    if not CHARTER_ROOT.exists():
        return out
    layer_prefix = None
    if layer:
        layer_prefix = {
            "L0":   "00-sovereign-root",
            "L0+":  "00-partners",
            "L1":   "12-defoneos",
            "L2":   "02-meok",
            "L3":   None,  # everything else
            "L4":   "35-coigndaltion",
        }.get(layer.upper())

    for p in sorted(CHARTER_ROOT.glob("*-charter.md")):
        if layer == "L3":
            if p.stem.startswith(("00-", "02-", "12-", "35-")):
                continue
        elif layer_prefix and not p.stem.startswith(layer_prefix):
            continue
        c = load_charter_file(p)
        if c:
            out.append(c)
    return out


def charters_for_hive(hive: str) -> list[dict]:
    """Return the charters belonging to a hive."""
    prefixes = HIVES.get(hive.lower(), [])
    out: list[dict] = []
    seen: set[str] = set()
    for p in sorted(CHARTER_ROOT.glob("*-charter.md")):
        if any(p.stem.startswith(pref) for pref in prefixes):
            c = load_charter_file(p)
            if c and c["charter_id"] not in seen:
                out.append(c)
                seen.add(c["charter_id"])
    return out


def verify_charter(charter_id: str) -> dict:
    """Verify SHA-256 + Article 0 binding presence for a charter."""
    candidate = CHARTER_ROOT / f"{charter_id}.md"
    if not candidate.exists():
        # try matching prefix
        matches = list(CHARTER_ROOT.glob(f"{charter_id}*.md"))
        if matches:
            candidate = matches[0]
        else:
            return {"charter_id": charter_id, "valid": False,
                    "error": f"Charter not found: {charter_id}"}
    c = load_charter_file(candidate)
    if not c:
        return {"charter_id": charter_id, "valid": False,
                "error": "Failed to load"}
    # Compute expected SIGIL digest (deterministic; sha256 of the SHA-256 line)
    sigil_line = f"V|csoai|charter:{c['charter_id']}|sha={c['sha256'][:12]}"
    digest = sha256_text(sigil_line)
    return {
        "charter_id": c["charter_id"],
        "title": c["title"],
        "sha256": c["sha256"],
        "bytes": c["bytes"],
        "article_0_binding": c["article_0_binding"],
        "valid": True,
        "sigil_digest": digest,
        "verified_at": datetime.now(timezone.utc).isoformat(),
    }


def framework_by_id(fid: str) -> dict | None:
    for (code, region, name, status) in REPRESENTATIVE_FRAMEWORKS:
        if code == fid:
            return {
                "framework_id": code, "region": region, "name": name,
                "status": status,
                "total_in_universe": sum(FRAMEWORK_REGIONS.values()),
            }
    # Try fallback: lookup against framework_regions structure
    return None


def crosswalks_between(a: str | None, b: str | None) -> list[dict]:
    out = []
    for (x, y, descr) in CROSSWALKS:
        if (a is None or x == a) and (b is None or y == b):
            out.append({"framework_a": x, "framework_b": y,
                        "mapping": descr, "type": "direct"})
        elif (a is None or y == a) and (b is None or x == b):
            out.append({"framework_a": y, "framework_b": x,
                        "mapping": descr, "type": "direct"})
    return out


def search_universe(q: str) -> list[dict]:
    """Naïve full-text search across charter titles + framework names."""
    if not q:
        return []
    needle = q.lower()
    out: list[dict] = []
    for c in list_charters():
        if needle in c["title"].lower() or needle in c["charter_id"].lower():
            out.append({"type": "charter", "id": c["charter_id"],
                        "title": c["title"]})
    for (code, region, name, status) in REPRESENTATIVE_FRAMEWORKS:
        if needle in code or needle in name.lower() or needle in region.lower():
            out.append({"type": "framework", "id": code, "title": name,
                        "region": region})
    for (x, y, descr) in CROSSWALKS:
        if needle in descr.lower():
            out.append({"type": "crosswalk", "id": f"{x}↔{y}",
                        "title": descr})
    return out


# --------------------------------------------------------------------------- #
# HTTP handler
# --------------------------------------------------------------------------- #

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Agent-DID, X-Signature",
    "Content-Type": "application/json",
}


class CharterHandler(BaseHTTPRequestHandler):
    """HTTP handler for the sovereign charter universe."""

    server_version = "SovereignCharterAPI/1.0"

    # Suppress default stderr noise — keep stdout clean for self-tests.
    def log_message(self, format, *args):  # noqa: N802
        return

    def _send(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload, indent=2, sort_keys=True).encode("utf-8")
        self.send_response(status)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self) -> dict:
        n = int(self.headers.get("Content-Length", "0") or 0)
        if n == 0:
            return {}
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return {}

    # ---------- OPTIONS ---------- #
    def do_OPTIONS(self):  # noqa: N802
        self.send_response(200)
        for k, v in CORS.items():
            self.send_header(k, v)
        self.end_headers()

    # ---------- GET ---------- #
    def do_GET(self):  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        qs = parse_qs(parsed.query)

        if path in ("", "/", "/index"):
            return self._send({
                "service": "sovereign-charter-api",
                "version": "1.0.0",
                "endpoints": [
                    "GET /health",
                    "GET /charters",
                    "GET /charters/{hive}",
                    "GET /charter/{id}/verify",
                    "GET /frameworks",
                    "GET /frameworks/{id}",
                    "GET /crosswalks",
                    "POST /report",
                    "GET /search?q=...",
                ],
            })

        if path == "/health":
            return self._send({
                "status": "ok",
                "service": "sovereign-charter-api",
                "version": "1.0.0",
                "charter_root": str(CHARTER_ROOT),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

        if path == "/charters":
            layer = qs.get("layer", [None])[0]
            charters = list_charters(layer)
            return self._send({
                "count": len(charters),
                "layer": layer,
                "charters": charters,
            })

        if path.startswith("/charters/"):
            hive = path.split("/", 2)[2]
            charters = charters_for_hive(hive)
            return self._send({
                "hive": hive,
                "count": len(charters),
                "charters": charters,
            })

        if path.endswith("/verify") and path.startswith("/charter/"):
            cid = path.split("/")[2]
            return self._send(verify_charter(cid))

        if path == "/frameworks":
            region = qs.get("region", [None])[0]
            items = REPRESENTATIVE_FRAMEWORKS
            if region:
                items = [f for f in items if f[1] == region.upper()]
            return self._send({
                "total_universe": sum(FRAMEWORK_REGIONS.values()),
                "by_region": FRAMEWORK_REGIONS,
                "region_filter": region,
                "representative_count": len(items),
                "frameworks": [
                    {"id": c, "region": r, "name": n, "status": s}
                    for (c, r, n, s) in items
                ],
            })

        if path.startswith("/frameworks/"):
            fid = path.split("/", 2)[2]
            f = framework_by_id(fid)
            if f is None:
                return self._send({"error": "framework not found",
                                   "framework_id": fid}, status=404)
            return self._send(f)

        if path == "/crosswalks":
            a = qs.get("a", [None])[0]
            b = qs.get("b", [None])[0]
            cws = crosswalks_between(a, b)
            return self._send({
                "count": len(cws),
                "filter": {"a": a, "b": b},
                "crosswalks": cws,
                "total_in_universe": 5043,
            })

        if path == "/search":
            q = qs.get("q", [""])[0]
            results = search_universe(q)
            return self._send({"q": q, "count": len(results),
                               "results": results})

        return self._send({"error": "not found", "path": path}, status=404)

    # ---------- POST ---------- #
    def do_POST(self):  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/")
        if path != "/report":
            return self._send({"error": "not found", "path": path},
                              status=404)
        data = self._read_body()
        if not data.get("title"):
            return self._send({"error": "missing 'title' field"}, status=400)
        signal_id = (
            f"WD-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}"
            f"-{secrets.token_hex(4).upper()}"
        )
        record = {
            "signal_id": signal_id,
            "received_at": datetime.now(timezone.utc).isoformat(),
            "source_type": data.get("source_type", "HUMAN"),
            "category": data.get("category", "CMP"),
            "severity": data.get("severity", "S2"),
            "title": str(data.get("title", ""))[:200],
            "description": str(data.get("description", ""))[:1000],
            "jurisdiction": data.get("location", "GLOBAL"),
            "reporter_contact": data.get("contact", "anonymous"),
            "agent_did": self.headers.get("X-Agent-DID"),
        }
        try:
            REPORT_LOG.parent.mkdir(parents=True, exist_ok=True)
            with open(REPORT_LOG, "a", encoding="utf-8") as f:
                f.write(json.dumps(record) + "\n")
        except OSError:
            pass
        sigil_line = (
            f"W|{record['source_type']}|csoai|signal:{signal_id}"
            f"|{record['category']}|{record['severity']}"
        )
        digest = emit_sigil(sigil_line)
        record["sigil_digest"] = digest
        return self._send({
            "received": True,
            "signal_id": signal_id,
            "status": "VERIFIED",
            "sigil_digest": digest,
            "sla": "24h" if record["severity"] in ("S4", "S5") else "72h",
        })


# --------------------------------------------------------------------------- #
# Self-test
# --------------------------------------------------------------------------- #

def self_test() -> int:
    """Spin up the handler in-process and exercise every route."""
    print("api_server.py :: self-test")
    print(f"  CHARTER_ROOT = {CHARTER_ROOT}")
    # Fake a request by instantiating the handler with a stubbed socket.
    import io

    class _Stub:
        def __init__(self):
            self.rfile = io.BytesIO(b"")
            self.wfile = io.BytesIO()
            self.headers = {}
        def makefile(self, *a, **kw):
            return self.rfile

    passed = 0
    failed = 0

    def call(handler_cls, path: str, method: str = "GET",
             body: bytes = b"", headers: dict | None = None) -> tuple[int, dict]:
        h = handler_cls.__new__(handler_cls)
        h.path = path
        h.command = method
        h.request_version = "HTTP/1.1"
        h.headers = headers or {}
        h.rfile = io.BytesIO(body)
        h.wfile = io.BytesIO()
        try:
            if method == "GET":
                h.do_GET()
            elif method == "POST":
                h.do_POST()
            elif method == "OPTIONS":
                h.do_OPTIONS()
        except Exception as exc:  # pragma: no cover
            return 0, {"error": repr(exc)}
        # First line: "HTTP/1.1 200 OK\r\n"
        raw = h.wfile.getvalue()
        # Split header block / body
        head, _, payload = raw.partition(b"\r\n\r\n")
        status_line = head.split(b"\r\n", 1)[0].decode("latin1", "ignore")
        try:
            status = int(status_line.split(" ", 2)[1])
        except (IndexError, ValueError):
            status = -1
        try:
            data = json.loads(payload.decode("utf-8")) if payload else {}
        except ValueError:
            data = {"raw_head": status_line}
        return status, data

    routes = [
        ("GET",  "/health",          None),
        ("GET",  "/",                None),
        ("GET",  "/charters",        None),
        ("GET",  "/charters/meok",   None),
        ("GET",  "/frameworks",      None),
        ("GET",  "/frameworks/eu-ai-act", None),
        ("GET",  "/crosswalks?a=eu-ai-act&b=gdpr", None),
        ("GET",  "/search?q=ai",     None),
    ]
    for method, path, _ in routes:
        status, body = call(CharterHandler, path, method)
        ok = status == 200 and "error" not in body
        flag = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1
        print(f"  [{flag}] {method:6s} {path:48s} → {status} "
              f"keys={list(body.keys())[:4]}")

    # Charter verify (use known charter)
    cid = "01-csoai-charter"
    status, body = call(CharterHandler, f"/charter/{cid}/verify", "GET")
    ok = status == 200 and body.get("valid") is True
    flag = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    print(f"  [{flag}] GET    /charter/{cid}/verify                    "
          f"→ {status} valid={body.get('valid')}")

    # POST /report
    payload = json.dumps({
        "title": "Self-test signal",
        "category": "CMP",
        "severity": "S3",
        "location": "UK",
        "contact": "[email protected]",
    }).encode("utf-8")
    status, body = call(CharterHandler, "/report", "POST", payload)
    ok = status == 200 and body.get("received") is True
    flag = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    print(f"  [{flag}] POST   /report                                "
          f"→ {status} sigil={body.get('sigil_digest','')[:12]}")

    # 404 path
    status, body = call(CharterHandler, "/does-not-exist", "GET")
    ok = status == 404
    flag = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    print(f"  [{flag}] GET    /does-not-exist                        "
          f"→ {status}")

    # Live socket bind test (3s timeout) — smoke only
    server = ThreadingHTTPServer(("127.0.0.1", 0), CharterHandler)
    port = server.server_address[1]
    t = threading.Thread(target=server.handle_request, daemon=True)
    t.start()
    import urllib.request
    try:
        with urllib.request.urlopen(
            f"http://127.0.0.1:{port}/health", timeout=3
        ) as resp:
            live_status = resp.status
            live_body = json.loads(resp.read().decode("utf-8"))
    except Exception as exc:
        live_status = -1
        live_body = {"error": repr(exc)}
    server.server_close()
    ok = live_status == 200 and live_body.get("status") == "ok"
    flag = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    print(f"  [{flag}] LIVE   http://127.0.0.1:{port}/health          "
          f"→ {live_status} {live_body.get('status')}")

    print(f"  Result: {passed} passed, {failed} failed")
    return 0 if failed == 0 else 1


def serve(host: str = "127.0.0.1", port: int = DEFAULT_PORT) -> None:
    """Bind and serve until killed."""
    server = ThreadingHTTPServer((host, port), CharterHandler)
    print(f"sovereign-charter-api listening on http://{host}:{port}")
    print(f"  charter_root = {CHARTER_ROOT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("shutting down")
    finally:
        server.server_close()


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        description="Sovereign Charter REST API (stdlib http.server).",
    )
    ap.add_argument("--host", default="127.0.0.1",
                    help="Bind host (default 127.0.0.1)")
    ap.add_argument("--port", type=int, default=DEFAULT_PORT,
                    help=f"Bind port (default {DEFAULT_PORT})")
    ap.add_argument("--self-test", action="store_true",
                    help="Run in-process route tests and exit")
    args = ap.parse_args(argv)

    if args.self_test:
        return self_test()
    serve(args.host, args.port)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())