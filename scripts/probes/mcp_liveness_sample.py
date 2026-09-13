#!/usr/bin/env python3
"""MCP remote-endpoint liveness sampler (TUI-3 agent-economy lane).

Draws a DETERMINISTIC bounded sample of remote-exposing MCP servers from the
canonical agent-interop register (or, failing that, the registry's first pages)
and probes each remote with a single MCP `initialize` JSON-RPC call.

Vocabulary (never collapsed):
  LIVE               valid initialize result with serverInfo
  AUTH_REQUIRED      401/403 — the endpoint answers but wants credentials
  SSE_ONLY           endpoint speaks SSE transport (GET stream), POST rejected
  UNREACHABLE        DNS/connect/timeout
  NON_CONFORMANT     answers HTTP 200 but not a valid MCP initialize result
  UNCHECKABLE        anything else (parse oddities, rate limits)

A sample is a probe, never a grade: PROBED is not MEASURED. Nothing here tests
capability behavior — only that the endpoint answers an initialize handshake.

Output: public/interop/mcp-liveness-2026-09/
  sample.json    the exact sample (selection rule + ids + urls + register pin)
  report.json    per-server states + counts + limitations
  card-*-unsigned.json  staged summary atom
Never raises; per-server failures are data.
"""
from __future__ import annotations

import hashlib
import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PACK = "mcp-liveness-2026-09"
PACK_DIR = ROOT / "public" / "interop" / PACK
REGISTER_REL = PACK_DIR.parent / "agent-interop-canonical-2026-09" / "canonical-register.jsonl"
REGISTRY_API = "https://registry.modelcontextprotocol.io/v0/servers?limit=100"
REGISTRY_SERVER = "https://registry.modelcontextprotocol.io/v0/servers/"
UA = {"User-Agent": "councilof-ai-liveness/0.1 (one initialize per endpoint)"}
SAMPLE_N = 100
TIMEOUT = 12
CARD_CAP = 3072


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _canon(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _get_json(url: str, timeout: int = 25) -> dict | None:
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except Exception:
        return None


def _sample_ids(register_path: Path, n: int) -> list[str]:
    """Deterministic sample: sort by sha256(id) — reproducible across runs."""
    ids = []
    if register_path.is_file():
        for line in register_path.open(encoding="utf-8"):
            ent = json.loads(line)
            if ent.get("source") == "modelcontextprotocol-registry" and ent.get("exposes_remote_endpoint"):
                ids.append((ent["id"], ent.get("latest_observed")))
    ids.sort(key=lambda t: hashlib.sha256(t[0].encode()).hexdigest())
    return ids[:n]


def _remote_for(name: str, version: str | None) -> dict | None:
    """Fetch the registry record and return the first remote {type, url}."""
    enc = urllib.parse.quote(name, safe="")
    if version:
        d = _get_json(f"{REGISTRY_SERVER}{enc}/versions/{urllib.parse.quote(version, safe='')}")
    else:
        d = _get_json(f"{REGISTRY_SERVER}{enc}/versions/latest")
    if not d:
        return None
    srv = d.get("server", d)
    remotes = srv.get("remotes") or []
    return remotes[0] if remotes else None


def _probe(url: str, transport: str) -> dict:
    """One initialize call. Never raises."""
    if transport == "sse":
        # SSE transport: the handshake is a GET stream; send GET and check the media type.
        try:
            req = urllib.request.Request(url, headers={**UA, "Accept": "text/event-stream"})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                ctype = r.headers.get("Content-Type", "")
                return {"state": "SSE_ONLY" if "event-stream" in ctype else "NON_CONFORMANT",
                        "http": r.status, "transport": transport,
                        "note": "GET stream check" if "event-stream" in ctype else f"unexpected content-type {ctype}"}
        except urllib.error.HTTPError as e:
            st = "AUTH_REQUIRED" if e.code in (401, 403) else ("UNREACHABLE" if e.code >= 500 else "NON_CONFORMANT")
            return {"state": st, "http": e.code, "transport": transport}
        except Exception as e:
            return {"state": "UNREACHABLE", "transport": transport, "note": type(e).__name__}
    body = json.dumps({
        "jsonrpc": "2.0", "id": 1, "method": "initialize",
        "params": {"protocolVersion": "2025-06-18",
                   "capabilities": {}, "clientInfo": {"name": "csoai-liveness", "version": "0.1"}},
    }).encode()
    try:
        req = urllib.request.Request(url, data=body, method="POST",
                                     headers={**UA, "Content-Type": "application/json",
                                              "Accept": "application/json, text/event-stream"})
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            raw = r.read()
            # streamable-http may answer SSE-framed
            text = raw.decode("utf-8", errors="replace")
            if "data:" in text[:200]:
                text = text.split("data:", 1)[1].strip()
            d = json.loads(text)
            res = d.get("result") or {}
            if isinstance(res, dict) and res.get("serverInfo"):
                return {"state": "LIVE", "http": r.status, "transport": transport,
                        "server": (res["serverInfo"] or {}).get("name"),
                        "protocolVersion": res.get("protocolVersion")}
            return {"state": "NON_CONFORMANT", "http": r.status, "transport": transport,
                    "note": "200 but no initialize result.serverInfo"}
    except urllib.error.HTTPError as e:
        st = "AUTH_REQUIRED" if e.code in (401, 403) else ("UNREACHABLE" if e.code >= 500 else "NON_CONFORMANT")
        return {"state": st, "http": e.code, "transport": transport}
    except Exception as e:
        return {"state": "UNREACHABLE", "transport": transport, "note": type(e).__name__}


def main() -> int:
    ts = _now()
    PACK_DIR.mkdir(parents=True, exist_ok=True)
    sample_ids = _sample_ids(REGISTER_REL, SAMPLE_N)
    selection = "first N by sha256(id) over remote-exposing registry identities — deterministic, reproducible"

    rows = []
    if not sample_ids:
        # register missing: fall back to the registry's first page, marked as such
        d = _get_json(REGISTRY_API)
        if not d:
            report = {"schema": "csoai.mcp-liveness/0.1", "generated_at": ts,
                      "state": "UNCHECKABLE", "note": "register missing and registry unreachable",
                      "sample": None, "results": []}
            (PACK_DIR / "report.json").write_text(json.dumps(report, indent=1, sort_keys=True) + "\n")
            print("UNCHECKABLE: no register, no registry")
            return 0
        for s in d.get("servers", [])[:SAMPLE_N]:
            srv = s.get("server", {})
            remotes = srv.get("remotes") or []
            if remotes:
                rows.append({"id": srv.get("name"), "version": srv.get("version"),
                             "url": remotes[0].get("url"), "transport": remotes[0].get("type")})
        selection = "FALLBACK: first registry page (canonical register absent)"
    else:
        def resolve(idver):
            name, ver = idver
            rem = _remote_for(name, ver)
            if rem:
                return {"id": name, "version": ver, "url": rem.get("url"), "transport": rem.get("type")}
            return {"id": name, "version": ver, "url": None, "state": "UNCHECKABLE",
                    "note": "no remote in registry record"}
        with ThreadPoolExecutor(max_workers=5) as ex:
            rows = list(ex.map(resolve, sample_ids))

    probed = [r for r in rows if r.get("url")]
    with ThreadPoolExecutor(max_workers=5) as ex:
        states = list(ex.map(lambda r: _probe(r["url"], r.get("transport") or "streamable-http"), probed))
    for r, st in zip(probed, states):
        r.update(st)

    counts: dict[str, int] = {}
    for r in rows:
        counts[r.get("state", "UNCHECKABLE")] = counts.get(r.get("state", "UNCHECKABLE"), 0) + 1

    try:
        register_ref = str(REGISTER_REL.relative_to(ROOT)) if REGISTER_REL.is_file() else None
    except ValueError:
        register_ref = str(REGISTER_REL) if REGISTER_REL.is_file() else None
    sample = {"schema": "csoai.mcp-liveness-sample/0.1", "generated_at": ts,
              "selection_rule": selection, "n": len(rows),
              "register": register_ref,
              "ids": [{"id": r.get("id"), "version": r.get("version"), "url": r.get("url")} for r in rows]}
    (PACK_DIR / "sample.json").write_text(json.dumps(sample, indent=1, sort_keys=True) + "\n")

    report = {"schema": "csoai.mcp-liveness/0.1", "generated_at": ts,
              "sample_n": len(rows), "probed": len(probed), "state_counts": counts,
              "limitations": ["one initialize handshake per endpoint — liveness, never capability grading",
                              "PROBED is not MEASURED; a LIVE endpoint proves reachability and handshake only",
                              "sample is deterministic by id hash — population claims need the full census, not this sample"],
              "results": rows}
    (PACK_DIR / "report.json").write_text(json.dumps(report, indent=1, sort_keys=True) + "\n")

    payload = {
        "kind": "csoai.mcp-liveness/0.1",
        "state": "PROBED",
        "sample_n": len(rows),
        "probed": len(probed),
        "state_counts": counts,
        "selection": "deterministic sha256(id) sample",
        "not_a_grade": True,
        "report": f"https://councilof.ai/interop/{PACK}/report.json",
    }
    card = {
        "schema": "https://councilof.ai/schema/card-v0.json",
        "surface": "public.notice",
        "subject": f"MCP remote-endpoint liveness sample (n={len(probed)})",
        "as_of": ts,
        "source_urls": [REGISTRY_API, f"https://councilof.ai/interop/{PACK}/report.json"],
        "payload": payload,
        "sha256": hashlib.sha256(_canon(payload)).hexdigest(),
        "unmeasured": ["capability behavior", "the unsampled population"],
        "tags": ["mcp", "liveness", "probe", PACK],
    }
    assert len(_canon(card)) <= CARD_CAP
    (PACK_DIR / "card-mcp-liveness-unsigned.json").write_text(json.dumps(card, indent=1, sort_keys=True) + "\n")
    print(json.dumps(counts, sort_keys=True))
    print(f"sampled {len(rows)}, probed {len(probed)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
